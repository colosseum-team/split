import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '../services/prisma.js'
import { chain } from '../services/chain.js'
import { assertWallet } from '../services/wallet.js'
import { normalizeContract, sha256Hex } from '../services/hash.js'
import { executeOnChainResolve } from '../services/arbiter.js'

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

function serialize<
  T extends {
    amount: bigint
    deadline: Date | null
    createdAt: Date
    updatedAt: Date
    submissionAt: Date | null
    disputeOpenedAt: Date | null
    disputeResolvedAt: Date | null
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

    const updated = await prisma.contract.update({
      where: { id: c.id },
      data: {
        ...patch,
        deadline: patch.deadline ? new Date(patch.deadline) : undefined,
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
    const updated = await prisma.contract.update({
      where: { id: c.id },
      data: {
        status: 'disputed',
        disputeOpenedBy: openedBy,
        disputeOpenedAt: c.disputeOpenedAt ?? new Date(),
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
}
