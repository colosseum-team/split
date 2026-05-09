import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '../services/prisma.js'
import { chain } from '../services/chain.js'
import { assertWallet } from '../services/wallet.js'
import { normalizeContract, sha256Hex } from '../services/hash.js'
import { executeOnChainResolve } from '../services/arbiter.js'
import { readDisputeFileStream, saveDisputeUpload } from '../services/dispute-files.js'

const CONTRACT_STATUSES = [
  'draft',
  'open',
  'funded',
  'in_progress',
  'review',
  'completed',
  'disputed',
  'cancelled',
] as const

const CreateContractInput = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(20_000),
  amount: z
    .union([z.number().int().nonnegative(), z.string().regex(/^\d+$/)])
    .transform((v) => BigInt(v)),
  currency: z.string().min(2).max(10).default('USDC'),
  deadline: z.string().datetime().optional(),
  assigneeAddress: z.string().min(32).max(64).optional(),
  disputeResolutionDays: z.number().int().min(1).max(30).optional(),
})

const PatchContractInput = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(20_000).optional(),
  amount: z
    .union([z.number().int().nonnegative(), z.string().regex(/^\d+$/)])
    .transform((v) => BigInt(v))
    .optional(),
  currency: z.string().min(2).max(10).optional(),
  deadline: z.string().datetime().optional(),
  assigneeAddress: z.string().min(32).max(64).optional(),
  disputeResolutionDays: z.number().int().min(1).max(30).optional(),
})

const ListQuery = z.object({
  role: z.enum(['customer', 'user']).optional(),
  status: z.enum([...CONTRACT_STATUSES, 'available', 'mine']).optional(),
})

const TxRequest = z.object({ txSignature: z.string().min(1) })
const SubmitRequest = z.object({ payload: z.string().min(1).max(20_000) })
const OpenDisputeRequest = z.object({
  reason: z.string().max(2_000).optional(),
})
const ResolveDisputeRequest = z.object({
  outcome: z.enum(['PERFORMER_WON', 'CLIENT_WON', 'INCONCLUSIVE']),
})

const DisputeMessageCreate = z.object({
  body: z.string().min(1).max(10_000),
  attachmentIds: z.array(z.string().uuid()).max(10).optional(),
})

const DisputeAttachmentUpload = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(128),
  dataBase64: z.string().min(1),
})

const ALLOWED_DISPUTE_MIMES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'text/plain',
])

const MAX_DISPUTE_FILE_BYTES = 5 * 1024 * 1024

function addDisputeCalendarDays(start: Date, days: number): Date {
  const d = new Date(start.getTime())
  d.setUTCDate(d.getUTCDate() + days)
  return d
}

function serialize<
  T extends {
    amount: bigint
    deadline: Date | null
    createdAt: Date
    updatedAt: Date
    submissionAt: Date | null
    disputeOpenedAt: Date | null
    disputeResolvedAt: Date | null
    disputeDueAt: Date | null
    disputeResolutionDays: number
  },
>(c: T) {
  return {
    ...c,
    amount: c.amount.toString(),
    deadline: c.deadline ? c.deadline.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    submissionAt: c.submissionAt ? c.submissionAt.toISOString() : null,
    disputeOpenedAt: c.disputeOpenedAt ? c.disputeOpenedAt.toISOString() : null,
    disputeResolvedAt: c.disputeResolvedAt ? c.disputeResolvedAt.toISOString() : null,
    disputeDueAt: c.disputeDueAt ? c.disputeDueAt.toISOString() : null,
  }
}

export const contractsRoutes: FastifyPluginAsync = async (app) => {
  // POST /contracts — only customer creates.
  app.post('/contracts', async (req, reply) => {
    const claims = app.requireAuth(req)
    if (claims.role !== 'customer') {
      return reply.status(403).send({ code: 'FORBIDDEN', message: 'customer role required' })
    }
    const input = CreateContractInput.parse(req.body)
    if (input.assigneeAddress) assertWallet(input.assigneeAddress)
    const deadline = input.deadline ? new Date(input.deadline) : null

    // Auto-create the assignee User row if it doesn't exist yet — the
    // performer may not have signed in to the SPA before the customer
    // names them on a contract. Without this the FK on Contract.assignee
    // throws Prisma P2003. The user keeps role=null until they SIWS-auth
    // and pick a role themselves.
    if (input.assigneeAddress && input.assigneeAddress !== claims.sub) {
      await prisma.user.upsert({
        where: { walletAddress: input.assigneeAddress },
        update: {},
        create: { walletAddress: input.assigneeAddress },
      })
    }

    const created = await prisma.contract.create({
      data: {
        title: input.title,
        description: input.description,
        amount: input.amount,
        currency: input.currency,
        deadline,
        customerAddress: claims.sub,
        assigneeAddress: input.assigneeAddress ?? null,
        status: input.assigneeAddress ? 'draft' : 'open',
        disputeResolutionDays: input.disputeResolutionDays ?? 7,
      },
    })

    const contractHash = sha256Hex(
      normalizeContract({
        title: created.title,
        description: created.description,
        amount: created.amount,
        currency: created.currency,
        deadline: created.deadline,
        customerAddress: created.customerAddress,
        assigneeAddress: created.assigneeAddress,
      }),
    )

    const { tx, escrowAddress } = await chain.buildCreateEscrowTx({
      contractId: created.id,
      customer: created.customerAddress,
      assignee: created.assigneeAddress,
      amount: created.amount,
      currency: created.currency,
      contractHash,
    })

    const updated = await prisma.contract.update({
      where: { id: created.id },
      data: { contractHash, onchainAddress: escrowAddress },
    })

    return { ...serialize(updated), unsignedTx: tx }
  })

  // GET /contracts — role-aware list.
  app.get('/contracts', async (req) => {
    const claims = app.requireAuth(req)
    const { role, status } = ListQuery.parse(req.query)
    const effectiveRole = role ?? claims.role

    const where: Prisma.ContractWhereInput = {}
    if (effectiveRole === 'customer') {
      where.customerAddress = claims.sub
      if (status && status !== 'available' && status !== 'mine') where.status = status
    } else if (effectiveRole === 'user') {
      if (status === 'available') {
        where.status = 'open'
        where.assigneeAddress = null
      } else if (status === 'mine') {
        where.assigneeAddress = claims.sub
      } else {
        where.assigneeAddress = claims.sub
        if (status) where.status = status
      }
    } else {
      where.OR = [{ customerAddress: claims.sub }, { assigneeAddress: claims.sub }]
      if (status && status !== 'available' && status !== 'mine') where.status = status
    }

    const rows = await prisma.contract.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return rows.map(serialize)
  })

  // GET /contracts/:id — only counterparty can read.
  app.get<{ Params: { id: string } }>('/contracts/:id', async (req, reply) => {
    const claims = app.requireAuth(req)
    const c = await prisma.contract.findUnique({ where: { id: req.params.id } })
    if (!c) return reply.status(404).send({ code: 'NOT_FOUND', message: 'contract not found' })
    const isParty = c.customerAddress === claims.sub || c.assigneeAddress === claims.sub
    const isOpenForBrowsing = c.status === 'open' && c.assigneeAddress === null
    if (!isParty && !isOpenForBrowsing) {
      return reply.status(403).send({ code: 'FORBIDDEN', message: 'not a party to this contract' })
    }
    return serialize(c)
  })

  // PATCH /contracts/:id — customer can edit while in draft.
  app.patch<{ Params: { id: string } }>('/contracts/:id', async (req, reply) => {
    const claims = app.requireAuth(req)
    const c = await prisma.contract.findUnique({ where: { id: req.params.id } })
    if (!c) return reply.status(404).send({ code: 'NOT_FOUND', message: 'contract not found' })
    if (c.customerAddress !== claims.sub) {
      return reply.status(403).send({ code: 'FORBIDDEN', message: 'only customer can edit' })
    }
    if (c.status !== 'draft') {
      return reply.status(409).send({
        code: 'INVALID_STATE',
        message: `editing not allowed in status '${c.status}'`,
      })
    }
    const patch = PatchContractInput.parse(req.body)
    if (patch.assigneeAddress) assertWallet(patch.assigneeAddress)

    const { deadline, disputeResolutionDays, ...restPatch } = patch
    const updated = await prisma.contract.update({
      where: { id: c.id },
      data: {
        ...restPatch,
        deadline: deadline !== undefined ? new Date(deadline) : undefined,
        disputeResolutionDays,
      },
    })

    // Re-hash because terms changed.
    const contractHash = sha256Hex(
      normalizeContract({
        title: updated.title,
        description: updated.description,
        amount: updated.amount,
        currency: updated.currency,
        deadline: updated.deadline,
        customerAddress: updated.customerAddress,
        assigneeAddress: updated.assigneeAddress,
      }),
    )
    const rehashed = await prisma.contract.update({
      where: { id: c.id },
      data: { contractHash },
    })
    return serialize(rehashed)
  })

  // POST /contracts/:id/fund-tx — build the unsigned `fund` instruction.
  // The customer's wallet adapter signs and submits; the resulting
  // signature comes back via /contracts/:id/fund (below).
  app.post<{ Params: { id: string } }>('/contracts/:id/fund-tx', async (req, reply) => {
    const claims = app.requireAuth(req)
    const c = await prisma.contract.findUnique({ where: { id: req.params.id } })
    if (!c) return reply.status(404).send({ code: 'NOT_FOUND', message: 'contract not found' })
    if (c.customerAddress !== claims.sub) {
      return reply.status(403).send({ code: 'FORBIDDEN', message: 'only customer can fund' })
    }
    if (!c.onchainAddress) {
      return reply.status(409).send({
        code: 'NO_ESCROW_PDA',
        message: 'contract has no on-chain escrow — was MOCK_CHAIN=true at creation?',
      })
    }
    const { tx } = await chain.buildFundTx(c.onchainAddress, claims.sub)
    return { tx, escrowAddress: c.onchainAddress }
  })

  // POST /contracts/:id/release-tx — build the unsigned `release` instruction
  // for the customer to sign during approve.
  app.post<{ Params: { id: string } }>('/contracts/:id/release-tx', async (req, reply) => {
    const claims = app.requireAuth(req)
    const c = await prisma.contract.findUnique({ where: { id: req.params.id } })
    if (!c) return reply.status(404).send({ code: 'NOT_FOUND', message: 'contract not found' })
    if (c.customerAddress !== claims.sub) {
      return reply.status(403).send({ code: 'FORBIDDEN', message: 'only customer can release' })
    }
    if (!c.onchainAddress) {
      return reply.status(409).send({
        code: 'NO_ESCROW_PDA',
        message: 'contract has no on-chain escrow — was MOCK_CHAIN=true at creation?',
      })
    }
    const { tx } = await chain.buildApproveTx(c.onchainAddress, claims.sub)
    return { tx, escrowAddress: c.onchainAddress }
  })

  // POST /contracts/:id/fund — customer records funding tx.
  app.post<{ Params: { id: string } }>('/contracts/:id/fund', async (req, reply) => {
    const claims = app.requireAuth(req)
    const { txSignature } = TxRequest.parse(req.body)
    const c = await prisma.contract.findUnique({ where: { id: req.params.id } })
    if (!c) return reply.status(404).send({ code: 'NOT_FOUND', message: 'contract not found' })
    if (c.customerAddress !== claims.sub) {
      return reply.status(403).send({ code: 'FORBIDDEN', message: 'only customer can fund' })
    }
    if (c.status !== 'open' && c.status !== 'draft') {
      return reply.status(409).send({
        code: 'INVALID_STATE',
        message: `cannot fund in status '${c.status}'`,
      })
    }
    if (c.fundTxSignature === txSignature) return serialize(c)
    const ok = await chain.verifyTxSignature(txSignature)
    if (!ok) {
      return reply
        .status(400)
        .send({ code: 'TX_INVALID', message: 'tx signature could not be verified' })
    }
    const updated = await prisma.contract.update({
      where: { id: c.id },
      data: { status: 'funded', fundTxSignature: txSignature },
    })
    return serialize(updated)
  })

  // POST /contracts/:id/accept — user accepts open contract.
  app.post<{ Params: { id: string } }>('/contracts/:id/accept', async (req, reply) => {
    const claims = app.requireAuth(req)
    const c = await prisma.contract.findUnique({ where: { id: req.params.id } })
    if (!c) return reply.status(404).send({ code: 'NOT_FOUND', message: 'contract not found' })
    if (claims.role !== 'user') {
      return reply.status(403).send({ code: 'FORBIDDEN', message: 'user role required' })
    }
    if (c.status !== 'open' && c.status !== 'funded') {
      return reply.status(409).send({
        code: 'INVALID_STATE',
        message: `cannot accept in status '${c.status}'`,
      })
    }
    if (c.assigneeAddress && c.assigneeAddress !== claims.sub) {
      return reply.status(403).send({
        code: 'FORBIDDEN',
        message: 'contract is targeted at a different assignee',
      })
    }
    const updated = await prisma.contract.update({
      where: { id: c.id },
      data: {
        assigneeAddress: claims.sub,
        status: 'in_progress',
      },
    })
    return serialize(updated)
  })

  // POST /contracts/:id/submit — assignee submits work for review.
  app.post<{ Params: { id: string } }>('/contracts/:id/submit', async (req, reply) => {
    const claims = app.requireAuth(req)
    const { payload } = SubmitRequest.parse(req.body)
    const c = await prisma.contract.findUnique({ where: { id: req.params.id } })
    if (!c) return reply.status(404).send({ code: 'NOT_FOUND', message: 'contract not found' })
    if (c.assigneeAddress !== claims.sub) {
      return reply.status(403).send({ code: 'FORBIDDEN', message: 'only assignee can submit' })
    }
    if (c.status !== 'in_progress' && c.status !== 'review') {
      return reply.status(409).send({
        code: 'INVALID_STATE',
        message: `cannot submit in status '${c.status}'`,
      })
    }
    const updated = await prisma.contract.update({
      where: { id: c.id },
      data: {
        submissionPayload: payload,
        submissionAt: new Date(),
        status: 'review',
      },
    })
    return serialize(updated)
  })

  // POST /contracts/:id/approve — customer approves and records release tx.
  app.post<{ Params: { id: string } }>('/contracts/:id/approve', async (req, reply) => {
    const claims = app.requireAuth(req)
    const { txSignature } = TxRequest.parse(req.body)
    const c = await prisma.contract.findUnique({ where: { id: req.params.id } })
    if (!c) return reply.status(404).send({ code: 'NOT_FOUND', message: 'contract not found' })
    if (c.customerAddress !== claims.sub) {
      return reply.status(403).send({ code: 'FORBIDDEN', message: 'only customer can approve' })
    }
    if (c.status !== 'review') {
      return reply.status(409).send({
        code: 'INVALID_STATE',
        message: `cannot approve in status '${c.status}'`,
      })
    }
    if (c.approveTxSignature === txSignature) return serialize(c)
    const ok = await chain.verifyTxSignature(txSignature)
    if (!ok) {
      return reply
        .status(400)
        .send({ code: 'TX_INVALID', message: 'tx signature could not be verified' })
    }
    const updated = await prisma.contract.update({
      where: { id: c.id },
      data: { status: 'completed', approveTxSignature: txSignature },
    })
    return serialize(updated)
  })

  // POST /contracts/:id/dispute — either party opens a dispute.
  app.post<{ Params: { id: string } }>('/contracts/:id/dispute', async (req, reply) => {
    const claims = app.requireAuth(req)
    OpenDisputeRequest.parse(req.body ?? {})
    const c = await prisma.contract.findUnique({ where: { id: req.params.id } })
    if (!c) return reply.status(404).send({ code: 'NOT_FOUND', message: 'contract not found' })
    const isCustomer = c.customerAddress === claims.sub
    const isAssignee = c.assigneeAddress === claims.sub
    if (!isCustomer && !isAssignee) {
      return reply.status(403).send({ code: 'FORBIDDEN', message: 'not a party to this contract' })
    }
    if (c.status !== 'in_progress' && c.status !== 'review' && c.status !== 'funded') {
      return reply.status(409).send({
        code: 'INVALID_STATE',
        message: `cannot dispute in status '${c.status}'`,
      })
    }
    const openedBy = isCustomer ? 'customer' : 'user'
    const openedAt = c.disputeOpenedAt ?? new Date()
    const dueAt =
      c.disputeDueAt ?? addDisputeCalendarDays(openedAt, c.disputeResolutionDays)
    const updated = await prisma.contract.update({
      where: { id: c.id },
      data: {
        status: 'disputed',
        disputeOpenedBy: openedBy,
        disputeOpenedAt: openedAt,
        disputeDueAt: dueAt,
      },
    })
    return serialize(updated)
  })

  // POST /contracts/:id/resolve-dispute — either party records the agreed outcome.
  // The verdict comes from off-chain consensus (e.g. QVAC dispute brief or human).
  // If ARBITER_AUTOEXECUTE=true and ARBITER_PRIVATE_KEY is set, backend sends the
  // on-chain ResolveDispute tx itself; otherwise the response is advisory and the
  // parties resolve via wallet signatures.
  app.post<{ Params: { id: string } }>('/contracts/:id/resolve-dispute', async (req, reply) => {
    const claims = app.requireAuth(req)
    const { outcome } = ResolveDisputeRequest.parse(req.body)
    const c = await prisma.contract.findUnique({ where: { id: req.params.id } })
    if (!c) return reply.status(404).send({ code: 'NOT_FOUND', message: 'contract not found' })
    const isParty = c.customerAddress === claims.sub || c.assigneeAddress === claims.sub
    if (!isParty) {
      return reply.status(403).send({ code: 'FORBIDDEN', message: 'not a party to this contract' })
    }
    if (c.status !== 'disputed') {
      return reply.status(409).send({
        code: 'INVALID_STATE',
        message: `not a disputed contract (status='${c.status}')`,
      })
    }

    const onchain = await executeOnChainResolve(c, outcome)

    const updated = await prisma.contract.update({
      where: { id: c.id },
      data: {
        disputeOutcome: outcome,
        disputeResolvedAt: new Date(),
        resolveTxSignature: onchain.txSignature,
        status: onchain.executed ? 'completed' : 'disputed',
      },
    })
    return { ...serialize(updated), onchain }
  })

  const serializeDisputeAttachment = (a: {
    id: string
    fileName: string
    mimeType: string
    size: number
    createdAt: Date
  }) => ({
    id: a.id,
    fileName: a.fileName,
    mimeType: a.mimeType,
    size: a.size,
    createdAt: a.createdAt.toISOString(),
  })

  const serializeDisputeMessage = (m: {
    id: string
    authorWallet: string
    body: string
    createdAt: Date
    attachments: Array<{
      id: string
      fileName: string
      mimeType: string
      size: number
      createdAt: Date
    }>
  }) => ({
    id: m.id,
    authorWallet: m.authorWallet,
    body: m.body,
    createdAt: m.createdAt.toISOString(),
    attachments: m.attachments.map(serializeDisputeAttachment),
  })

  // GET /contracts/:id/dispute — parties only; aggregate for dispute UI.
  app.get<{ Params: { id: string } }>('/contracts/:id/dispute', async (req, reply) => {
    const claims = app.requireAuth(req)
    const c = await prisma.contract.findUnique({
      where: { id: req.params.id },
      include: {
        disputeMessages: {
          orderBy: { createdAt: 'asc' },
          include: { attachments: { orderBy: { createdAt: 'asc' } } },
        },
      },
    })
    if (!c) return reply.status(404).send({ code: 'NOT_FOUND', message: 'contract not found' })
    const isParty = c.customerAddress === claims.sub || c.assigneeAddress === claims.sub
    if (!isParty) {
      return reply.status(403).send({ code: 'FORBIDDEN', message: 'not a party to this contract' })
    }
    if (c.status !== 'disputed') {
      return reply.status(409).send({
        code: 'INVALID_STATE',
        message: `contract is not disputed (status='${c.status}')`,
      })
    }
    const { disputeMessages, ...contractRow } = c
    return {
      contract: serialize(contractRow),
      messages: disputeMessages.map(serializeDisputeMessage),
    }
  })

  // POST /contracts/:id/dispute/attachments — base64 JSON upload (dev-friendly).
  app.post<{ Params: { id: string } }>(
    '/contracts/:id/dispute/attachments',
    { bodyLimit: 6 * 1024 * 1024 },
    async (req, reply) => {
      const claims = app.requireAuth(req)
      const c = await prisma.contract.findUnique({ where: { id: req.params.id } })
      if (!c) return reply.status(404).send({ code: 'NOT_FOUND', message: 'contract not found' })
      const isParty = c.customerAddress === claims.sub || c.assigneeAddress === claims.sub
      if (!isParty) {
        return reply.status(403).send({ code: 'FORBIDDEN', message: 'not a party to this contract' })
      }
      if (c.status !== 'disputed') {
        return reply.status(409).send({
          code: 'INVALID_STATE',
          message: `attachments only while disputed (status='${c.status}')`,
        })
      }
      const input = DisputeAttachmentUpload.parse(req.body)
      if (!ALLOWED_DISPUTE_MIMES.has(input.mimeType)) {
        return reply.status(400).send({
          code: 'VALIDATION_ERROR',
          message: `mime type not allowed: ${input.mimeType}`,
        })
      }
      let buffer: Buffer
      try {
        buffer = Buffer.from(input.dataBase64, 'base64')
      } catch {
        return reply.status(400).send({ code: 'VALIDATION_ERROR', message: 'invalid base64' })
      }
      if (buffer.length === 0 || buffer.length > MAX_DISPUTE_FILE_BYTES) {
        return reply.status(400).send({
          code: 'VALIDATION_ERROR',
          message: `file must be 1–${MAX_DISPUTE_FILE_BYTES} bytes`,
        })
      }

      const { storageKey, size } = await saveDisputeUpload(
        c.id,
        input.fileName,
        input.mimeType,
        buffer,
      )

      const row = await prisma.disputeAttachment.create({
        data: {
          contractId: c.id,
          uploadedBy: claims.sub,
          storageKey,
          fileName: input.fileName,
          mimeType: input.mimeType,
          size,
        },
      })

      return serializeDisputeAttachment(row)
    },
  )

  // POST /contracts/:id/dispute/messages
  app.post<{ Params: { id: string } }>('/contracts/:id/dispute/messages', async (req, reply) => {
    const claims = app.requireAuth(req)
    const c = await prisma.contract.findUnique({ where: { id: req.params.id } })
    if (!c) return reply.status(404).send({ code: 'NOT_FOUND', message: 'contract not found' })
    const isParty = c.customerAddress === claims.sub || c.assigneeAddress === claims.sub
    if (!isParty) {
      return reply.status(403).send({ code: 'FORBIDDEN', message: 'not a party to this contract' })
    }
    if (c.status !== 'disputed') {
      return reply.status(409).send({
        code: 'INVALID_STATE',
        message: `messages only while disputed (status='${c.status}')`,
      })
    }
    const input = DisputeMessageCreate.parse(req.body)
    const attachmentIds = input.attachmentIds ?? []

    try {
      const message = await prisma.$transaction(async (tx) => {
        const msg = await tx.disputeMessage.create({
          data: {
            contractId: c.id,
            authorWallet: claims.sub,
            body: input.body,
          },
        })
        if (attachmentIds.length > 0) {
          const res = await tx.disputeAttachment.updateMany({
            where: {
              id: { in: attachmentIds },
              contractId: c.id,
              uploadedBy: claims.sub,
              messageId: null,
            },
            data: { messageId: msg.id },
          })
          if (res.count !== attachmentIds.length) {
            throw new Error('ATTACHMENT_MISMATCH')
          }
        }
        return tx.disputeMessage.findUniqueOrThrow({
          where: { id: msg.id },
          include: { attachments: { orderBy: { createdAt: 'asc' } } },
        })
      })
      return serializeDisputeMessage(message)
    } catch (e) {
      if ((e as Error).message === 'ATTACHMENT_MISMATCH') {
        return reply.status(400).send({
          code: 'VALIDATION_ERROR',
          message: 'one or more attachment ids are invalid or already linked',
        })
      }
      throw e
    }
  })

  // GET /contracts/:id/dispute/attachments/:attachmentId/file
  app.get<{ Params: { id: string; attachmentId: string } }>(
    '/contracts/:id/dispute/attachments/:attachmentId/file',
    async (req, reply) => {
      const claims = app.requireAuth(req)
      const c = await prisma.contract.findUnique({ where: { id: req.params.id } })
      if (!c) return reply.status(404).send({ code: 'NOT_FOUND', message: 'contract not found' })
      const isParty = c.customerAddress === claims.sub || c.assigneeAddress === claims.sub
      if (!isParty) {
        return reply.status(403).send({ code: 'FORBIDDEN', message: 'not a party to this contract' })
      }
      const att = await prisma.disputeAttachment.findFirst({
        where: { id: req.params.attachmentId, contractId: c.id },
      })
      if (!att) {
        return reply.status(404).send({ code: 'NOT_FOUND', message: 'attachment not found' })
      }
      reply.header('Content-Disposition', `inline; filename="${encodeURIComponent(att.fileName)}"`)
      return reply.type(att.mimeType).send(readDisputeFileStream(att.storageKey))
    },
  )
}
