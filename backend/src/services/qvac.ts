import type { FastifyBaseLogger } from 'fastify'
import { config } from '../config.js'

type QvacSdk = typeof import('@qvac/sdk')

export type QvacBackendStatus =
  | { state: 'disabled' }
  | { state: 'idle' }
  | { state: 'warming'; detail?: string }
  | { state: 'ready' }
  | { state: 'error'; detail: string }

/** Updated during optional warm-up; exposed on GET /health when QVAC is enabled */
export let qvacBackendStatus: QvacBackendStatus = config.QVAC_ENABLED
  ? { state: 'idle' }
  : { state: 'disabled' }

let sdkPromise: Promise<QvacSdk> | null = null
const ensureSdk = () => {
  if (!sdkPromise) sdkPromise = import('@qvac/sdk')
  return sdkPromise
}

export type ContractDraftInput = {
  scope: string
  deliverables: string
  timeline: string
  paymentTerms: string
}

export type DisputeInput = {
  requirementSnapshot: string[]
  submissionSummary: string
  conversation: string[]
}

export type ContractCopilotResult = {
  ambiguities: string[]
  rewriteSuggestions: string[]
  acceptanceCriteria: string[]
  riskScore: number
  riskFactors: string[]
}

export type DisputeBriefResult = {
  caseSummary: string
  timeline: string[]
  agreedRequirements: string[]
  submittedEvidence: string[]
  matchesAndGaps: string[]
  similarityScore: number
  riskAssessment: string
  recommendedResolution: string
}

const parseJsonObject = (text: string): Record<string, unknown> => {
  try {
    return JSON.parse(text) as Record<string, unknown>
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Unable to parse JSON from QVAC response.')
    return JSON.parse(match[0]) as Record<string, unknown>
  }
}

const asStringArray = (value: unknown) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
const asString = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback)
const asNumber = (value: unknown, fallback = 0) => (typeof value === 'number' ? value : fallback)

/** When the UI only has one textarea, callers mirror the text into every field — avoid confusing the LLM with four identical headings. */
const contractDraftForPrompt = (input: ContractDraftInput) => {
  const { scope, deliverables, timeline, paymentTerms } = input
  const mirrored =
    scope === deliverables &&
    deliverables === timeline &&
    timeline === paymentTerms &&
    scope.trim().length > 0
  if (mirrored) {
    return `The customer provided one technical-assignment draft (the same body is repeated across scope/deliverables/timeline/paymentTerms only to satisfy API shape — treat it as one source). Infer reasonable timeline and payment terms where absent; list true gaps as ambiguities.

Technical assignment:
${scope}`
  }
  return `Contract draft:
Scope: ${scope}
Deliverables: ${deliverables}
Timeline: ${timeline}
Payment terms: ${paymentTerms}`
}

const buildContractPrompt = (input: ContractDraftInput) => `
You are a senior legal contract copilot for freelance services.
Return strict JSON only. No markdown fences, no prose outside JSON.
Fields:
- ambiguities: string[]
- rewriteSuggestions: string[]
- acceptanceCriteria: string[]
- riskScore: number (0-100)
- riskFactors: string[]

Strict drafting rules for rewriteSuggestions:
- Use the user's current Technical assignment (Scope) as the source material to rewrite.
- Return exactly 1 rewriteSuggestions item (a single full strict version).
- The rewrite must be formal legal/business style with this exact structure:
  1. Project goal
  2. Scope of work
  2.1. Discovery and analysis
  2.2. UI/UX design
  2.3. Front-end implementation
  2.4. Content
  2.5. Out of scope (unless agreed separately)
  3. Deliverables
  4. Acceptance criteria
  5. Timeline (indicative, can be adjusted in writing)
  6. Customer obligations
  7. Performer obligations
  8. Acceptance and warranty
- Keep numbering exactly as above.
- Use concise, testable statements and measurable thresholds.
- Do not output placeholders like TBD or "...".
- If data is missing, make explicit realistic assumptions and include those assumptions in ambiguities.
- rewriteSuggestions must contain a standalone full text, not fragments.

${contractDraftForPrompt(input)}
`

const buildDisputePrompt = (input: DisputeInput) => `
You are an arbitration assistant. Return strict JSON only.
Fields:
- caseSummary: string
- timeline: string[]
- agreedRequirements: string[]
- submittedEvidence: string[]
- matchesAndGaps: string[]
- similarityScore: number (0-100)
- riskAssessment: string
- recommendedResolution: string

Requirement snapshot:
${input.requirementSnapshot.join('\n')}

Submission summary:
${input.submissionSummary}

Conversation:
${input.conversation.join('\n')}
`

let modelIdPromise: Promise<string> | null = null

const getModelId = async () => {
  if (!modelIdPromise) {
    modelIdPromise = (async () => {
      const { LLAMA_3_2_1B_INST_Q4_0, loadModel } = await ensureSdk()
      return loadModel({
        modelSrc: LLAMA_3_2_1B_INST_Q4_0,
        modelConfig: { ctx_size: 4096 },
      })
    })()
  }
  try {
    return await modelIdPromise
  } catch (err) {
    modelIdPromise = null
    throw err
  }
}

/**
 * Loads the Bare worker + model shortly after HTTP listen.
 * Critical for Docker/emulation where the first RPC handshake can take many minutes.
 */
export function startQvacBackendWarmup(log: Pick<FastifyBaseLogger, 'info' | 'warn'>): void {
  if (!config.QVAC_ENABLED) {
    qvacBackendStatus = { state: 'disabled' }
    return
  }

  qvacBackendStatus = { state: 'warming', detail: 'Bare IPC + GGUF download/load if needed' }
  log.info(
    'QVAC warm-up started — first Bare worker IPC can take several minutes in Docker (especially on emulated amd64)',
  )

  void (async () => {
    try {
      await getModelId()
      qvacBackendStatus = { state: 'ready' }
      log.info('QVAC warm-up finished; inference should respond without blocking on IPC')
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err)
      qvacBackendStatus = { state: 'error', detail }
      log.warn({ err }, 'QVAC warm-up failed (see Bare / native addon logs above)')
    }
  })()
}

export async function runContractCopilotQvac(input: ContractDraftInput): Promise<ContractCopilotResult> {
  if (!config.QVAC_ENABLED) {
    throw new Error('QVAC is disabled on backend. Set QVAC_ENABLED=true to run inference.')
  }

  const { completion } = await ensureSdk()
  const modelId = await getModelId()
  const run = completion({
    modelId,
    stream: true,
    history: [{ role: 'user', content: buildContractPrompt(input) }],
    responseFormat: { type: 'json_object' },
  })
  const payload = parseJsonObject(await run.text)

  return {
    ambiguities: asStringArray(payload.ambiguities),
    rewriteSuggestions: asStringArray(payload.rewriteSuggestions),
    acceptanceCriteria: asStringArray(payload.acceptanceCriteria),
    riskScore: asNumber(payload.riskScore),
    riskFactors: asStringArray(payload.riskFactors),
  }
}

export async function runDisputeBriefQvac(input: DisputeInput): Promise<DisputeBriefResult> {
  if (!config.QVAC_ENABLED) {
    throw new Error('QVAC is disabled on backend. Set QVAC_ENABLED=true to run inference.')
  }

  const { completion } = await ensureSdk()
  const modelId = await getModelId()
  const run = completion({
    modelId,
    stream: true,
    history: [{ role: 'user', content: buildDisputePrompt(input) }],
    responseFormat: { type: 'json_object' },
  })
  const payload = parseJsonObject(await run.text)

  return {
    caseSummary: asString(payload.caseSummary),
    timeline: asStringArray(payload.timeline),
    agreedRequirements: asStringArray(payload.agreedRequirements),
    submittedEvidence: asStringArray(payload.submittedEvidence),
    matchesAndGaps: asStringArray(payload.matchesAndGaps),
    similarityScore: asNumber(payload.similarityScore),
    riskAssessment: asString(payload.riskAssessment),
    recommendedResolution: asString(payload.recommendedResolution),
  }
}
