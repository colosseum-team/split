import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { prisma } from '../services/prisma.js'
import { sha256Hex } from '../services/hash.js'
import { config } from '../config.js'
import {
  runContractCopilotQvac,
  runDisputeBriefQvac,
  type ContractDraftInput,
} from '../services/qvac.js'

const RPC_TIMEOUT_HINT =
  'Bare worker IPC timed out — see backend logs; GET /health shows qvac warm-up status. Docker: prefer linux/arm64 on Apple Silicon; first model download/load can exceed timeouts on slow or emulated CPUs.'

function qvac503Body(error: unknown) {
  const message = error instanceof Error ? error.message : 'QVAC inference failed'
  const body: { code: string; message: string; hint?: string } = {
    code: 'QVAC_UNAVAILABLE',
    message,
  }
  if (message.includes('RPC initialization timed out')) {
    body.hint = RPC_TIMEOUT_HINT
  }
  return body
}

// QVAC contract copilot output schema.
// Mirrors the JSON shape the frontend produces locally
// (docs/qvac-ai-arbitration-plan.md, "Output schema").
const ContractCopilotResultJson = z.object({
  ambiguities: z.array(z.string()),
  rewrite_suggestions: z.array(
    z.object({
      target: z.string(),
      replacement: z.string(),
    }),
  ),
  acceptance_criteria: z.array(z.string()),
  risk_score: z.number().int().min(0).max(100),
  risk_factors: z.array(z.string()),
})

const DisputeBriefResultJson = z.object({
  case_summary: z.string(),
  timeline: z.array(z.string()),
  agreed_requirements: z.array(z.string()),
  submitted_evidence: z.array(z.string()),
  matches_and_gaps: z.array(
    z.object({
      requirement: z.string(),
      evidence: z.string().nullable(),
      match: z.enum(['match', 'partial', 'miss']),
    }),
  ),
  similarity_score: z.number().min(0).max(1),
  risk_assessment: z.string(),
  recommended_resolution: z.string(),
})

const PostOutputBase = z.object({
  modelId: z.string().min(1).max(200),
  modelVersion: z.string().min(1).max(100),
  inputHash: z
    .string()
    .regex(/^[0-9a-f]{64}$/)
    .optional(),
  outputHash: z
    .string()
    .regex(/^[0-9a-f]{64}$/)
    .optional(),
})

const PostCopilot = PostOutputBase.extend({
  result: ContractCopilotResultJson,
})

const PostDispute = PostOutputBase.extend({
  result: DisputeBriefResultJson,
})

const Scenario = z.enum(['design', 'logo'])

/** Single textarea from wizard (`technicalAssignment`). */
const CopilotInputSingle = z
  .object({
    technicalAssignment: z.string().min(1).max(10_000),
  })
  .strict()

/** Four filled sections (demo / advanced UI). */
const CopilotInputSectioned = z
  .object({
    scope: z.string().min(1).max(10_000),
    deliverables: z.string().min(1).max(10_000),
    timeline: z.string().min(1).max(10_000),
    paymentTerms: z.string().min(1).max(10_000),
  })
  .strict()

const CopilotInput = z.union([CopilotInputSingle, CopilotInputSectioned])

function toContractDraftInput(parsed: z.infer<typeof CopilotInput>): ContractDraftInput {
  if ('technicalAssignment' in parsed) {
    const t = parsed.technicalAssignment
    return { scope: t, deliverables: t, timeline: t, paymentTerms: t }
  }
  return parsed
}

const RunCopilotRequest = z.object({
  scenario: Scenario,
  input: CopilotInput,
})

const RunDisputeRequest = z.object({
  scenario: Scenario,
  input: z.object({
    requirementSnapshot: z.array(z.string()).min(1).max(200),
    submissionSummary: z.string().min(1).max(20_000),
    conversation: z.array(z.string()).max(500),
  }),
})

const PreviewCopilotRequest = z.object({
  scenario: Scenario,
  input: CopilotInput,
})

function serializeOutput(o: {
  id: string
  contractId: string
  kind: string
  modelId: string
  modelVersion: string
  inputHash: string
  outputHash: string
  resultJson: unknown
  similarityScore: number | null
  riskScore: number | null
  createdAt: Date
}) {
  return {
    ...o,
    createdAt: o.createdAt.toISOString(),
  }
}

export const aiOutputsRoutes: FastifyPluginAsync = async (app) => {
  // POST /ai/copilot-preview — backend runs QVAC without contract persistence.
  app.post('/ai/copilot-preview', async (req, reply) => {
    app.requireAuth(req)
    const input = PreviewCopilotRequest.parse(req.body)

    let result
    try {
      result = await runContractCopilotQvac(toContractDraftInput(input.input))
    } catch (error) {
      return reply.status(503).send(qvac503Body(error))
    }

    return {
      result,
      scenario: input.scenario,
      modelId: config.QVAC_MODEL_ID,
      modelVersion: config.QVAC_MODEL_VERSION,
    }
  })

  // POST /contracts/:id/copilot-run — backend runs QVAC and persists output.
  app.post<{ Params: { id: string } }>('/contracts/:id/copilot-run', async (req, reply) => {
    const claims = app.requireAuth(req)
    const input = RunCopilotRequest.parse(req.body)
    const c = await prisma.contract.findUnique({ where: { id: req.params.id } })
    if (!c) return reply.status(404).send({ code: 'NOT_FOUND', message: 'contract not found' })
    if (c.customerAddress !== claims.sub) {
      return reply.status(403).send({
        code: 'FORBIDDEN',
        message: 'only customer can run contract copilot',
      })
    }

    let result
    try {
      result = await runContractCopilotQvac(toContractDraftInput(input.input))
    } catch (error) {
      return reply.status(503).send(qvac503Body(error))
    }
    const inputHash = sha256Hex({ contractId: c.id, scenario: input.scenario, input: input.input })
    const outputHash = sha256Hex(result)

    const row = await prisma.aiOutput.create({
      data: {
        contractId: c.id,
        kind: 'contract_copilot',
        modelId: config.QVAC_MODEL_ID,
        modelVersion: config.QVAC_MODEL_VERSION,
        inputHash,
        outputHash,
        resultJson: result,
        riskScore: result.riskScore,
      },
    })

    return {
      ...serializeOutput(row),
      result,
      scenario: input.scenario,
      modelId: config.QVAC_MODEL_ID,
      modelVersion: config.QVAC_MODEL_VERSION,
    }
  })

  // POST /contracts/:id/dispute-run — backend runs QVAC and persists output.
  app.post<{ Params: { id: string } }>('/contracts/:id/dispute-run', async (req, reply) => {
    const claims = app.requireAuth(req)
    const input = RunDisputeRequest.parse(req.body)
    const c = await prisma.contract.findUnique({ where: { id: req.params.id } })
    if (!c) return reply.status(404).send({ code: 'NOT_FOUND', message: 'contract not found' })
    const isParty = c.customerAddress === claims.sub || c.assigneeAddress === claims.sub
    if (!isParty) {
      return reply.status(403).send({ code: 'FORBIDDEN', message: 'not a party to this contract' })
    }
    if (c.status !== 'disputed') {
      return reply.status(409).send({
        code: 'INVALID_STATE',
        message: `dispute brief only accepted for disputed contracts (status='${c.status}')`,
      })
    }

    let result
    try {
      result = await runDisputeBriefQvac(input.input)
    } catch (error) {
      return reply.status(503).send(qvac503Body(error))
    }
    const inputHash = sha256Hex({ contractId: c.id, scenario: input.scenario, input: input.input })
    const outputHash = sha256Hex(result)

    const row = await prisma.aiOutput.create({
      data: {
        contractId: c.id,
        kind: 'dispute_brief',
        modelId: config.QVAC_MODEL_ID,
        modelVersion: config.QVAC_MODEL_VERSION,
        inputHash,
        outputHash,
        resultJson: result,
        similarityScore: result.similarityScore / 100,
      },
    })

    return {
      ...serializeOutput(row),
      result,
      scenario: input.scenario,
      modelId: config.QVAC_MODEL_ID,
      modelVersion: config.QVAC_MODEL_VERSION,
    }
  })

  // POST /contracts/:id/copilot-output — frontend posts QVAC contract copilot result.
  app.post<{ Params: { id: string } }>('/contracts/:id/copilot-output', async (req, reply) => {
    const claims = app.requireAuth(req)
    const input = PostCopilot.parse(req.body)
    const c = await prisma.contract.findUnique({ where: { id: req.params.id } })
    if (!c) return reply.status(404).send({ code: 'NOT_FOUND', message: 'contract not found' })
    if (c.customerAddress !== claims.sub) {
      return reply.status(403).send({
        code: 'FORBIDDEN',
        message: 'only customer can post copilot results for their contract',
      })
    }

    const outputHash = input.outputHash ?? sha256Hex(input.result)
    const inputHash =
      input.inputHash ??
      sha256Hex({
        contractId: c.id,
        title: c.title,
        description: c.description,
        modelId: input.modelId,
      })

    const row = await prisma.aiOutput.create({
      data: {
        contractId: c.id,
        kind: 'contract_copilot',
        modelId: input.modelId,
        modelVersion: input.modelVersion,
        inputHash,
        outputHash,
        resultJson: input.result,
        riskScore: input.result.risk_score,
      },
    })
    return serializeOutput(row)
  })

  // POST /contracts/:id/dispute-output — frontend posts QVAC dispute brief.
  app.post<{ Params: { id: string } }>('/contracts/:id/dispute-output', async (req, reply) => {
    const claims = app.requireAuth(req)
    const input = PostDispute.parse(req.body)
    const c = await prisma.contract.findUnique({ where: { id: req.params.id } })
    if (!c) return reply.status(404).send({ code: 'NOT_FOUND', message: 'contract not found' })
    const isParty = c.customerAddress === claims.sub || c.assigneeAddress === claims.sub
    if (!isParty) {
      return reply.status(403).send({ code: 'FORBIDDEN', message: 'not a party to this contract' })
    }
    if (c.status !== 'disputed') {
      return reply.status(409).send({
        code: 'INVALID_STATE',
        message: `dispute brief only accepted for disputed contracts (status='${c.status}')`,
      })
    }

    const outputHash = input.outputHash ?? sha256Hex(input.result)
    const inputHash =
      input.inputHash ??
      sha256Hex({
        contractId: c.id,
        submission: c.submissionPayload,
        modelId: input.modelId,
      })

    const row = await prisma.aiOutput.create({
      data: {
        contractId: c.id,
        kind: 'dispute_brief',
        modelId: input.modelId,
        modelVersion: input.modelVersion,
        inputHash,
        outputHash,
        resultJson: input.result,
        similarityScore: input.result.similarity_score,
      },
    })
    return serializeOutput(row)
  })

  // GET /contracts/:id/ai-outputs?kind=contract_copilot|dispute_brief
  app.get<{ Params: { id: string }; Querystring: { kind?: string } }>(
    '/contracts/:id/ai-outputs',
    async (req, reply) => {
      const claims = app.requireAuth(req)
      const c = await prisma.contract.findUnique({ where: { id: req.params.id } })
      if (!c) return reply.status(404).send({ code: 'NOT_FOUND', message: 'contract not found' })
      const isParty = c.customerAddress === claims.sub || c.assigneeAddress === claims.sub
      if (!isParty) {
        return reply
          .status(403)
          .send({ code: 'FORBIDDEN', message: 'not a party to this contract' })
      }
      const kindFilter = req.query.kind
      const kind =
        kindFilter === 'contract_copilot' || kindFilter === 'dispute_brief' ? kindFilter : undefined
      const rows = await prisma.aiOutput.findMany({
        where: { contractId: c.id, ...(kind ? { kind } : {}) },
        orderBy: { createdAt: 'desc' },
      })
      return rows.map(serializeOutput)
    },
  )
}
