import Fastify from 'fastify'
import { z } from 'zod'

type LooseRecord = Record<string, unknown>

type ContractDraftInput = {
  scope: string
  deliverables: string
  timeline: string
  paymentTerms: string
}

type DisputeInput = {
  requirementSnapshot: string[]
  submissionSummary: string
  conversation: string[]
}

const CopilotInput = z.object({
  input: z.object({
    scope: z.string().min(1).max(10000),
    deliverables: z.string().min(1).max(10000),
    timeline: z.string().min(1).max(10000),
    paymentTerms: z.string().min(1).max(10000),
  }),
})

const DisputeRunInput = z.object({
  input: z.object({
    requirementSnapshot: z.array(z.string()).min(1).max(200),
    submissionSummary: z.string().min(1).max(20000),
    conversation: z.array(z.string()).max(500),
  }),
})

const assertBareRuntime = () => {
  if (!('Bare' in globalThis)) {
    throw new Error('QVAC worker requires Bare runtime. globalThis.Bare is not available.')
  }
}

const loadModule = async (moduleName: '@qvac/llm-llamacpp' | '@qvac/embed-llamacpp') => {
  assertBareRuntime()
  return (await import(moduleName)) as LooseRecord
}

const callModuleFn = async (
  moduleName: '@qvac/llm-llamacpp' | '@qvac/embed-llamacpp',
  candidateNames: string[],
  args: unknown[],
): Promise<unknown> => {
  const mod = await loadModule(moduleName)
  const fn = candidateNames
    .map((name) => mod[name])
    .find((value): value is (...input: unknown[]) => unknown => typeof value === 'function')

  if (!fn) {
    throw new Error(`No compatible function found in ${moduleName}: ${candidateNames.join(', ')}`)
  }
  return fn(...args)
}

const parseJsonFromText = (value: unknown): LooseRecord => {
  if (typeof value === 'object' && value !== null) return value as LooseRecord
  if (typeof value !== 'string') {
    throw new Error('QVAC returned unsupported response format.')
  }
  try {
    return JSON.parse(value) as LooseRecord
  } catch {
    const match = value.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Unable to parse JSON from QVAC response.')
    return JSON.parse(match[0]) as LooseRecord
  }
}

const asStringArray = (value: unknown, fallback: string[] = []) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : fallback

const asNumber = (value: unknown, fallback = 0) => (typeof value === 'number' ? value : fallback)
const asString = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback)

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

Contract draft:
Scope: ${input.scope}
Deliverables: ${input.deliverables}
Timeline: ${input.timeline}
Payment terms: ${input.paymentTerms}
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

const app = Fastify({ logger: true })

app.get('/health', async () => ({
  status: 'ok',
  bareAvailable: 'Bare' in globalThis,
}))

app.post('/v1/copilot-run', async (req, reply) => {
  const { input } = CopilotInput.parse(req.body)
  try {
    const raw = await callModuleFn('@qvac/llm-llamacpp', ['generate', 'infer', 'run', 'chat'], [
      buildContractPrompt(input),
    ])
    const payload = parseJsonFromText(raw)
    return {
      result: {
        ambiguities: asStringArray(payload.ambiguities),
        rewriteSuggestions: asStringArray(payload.rewriteSuggestions),
        acceptanceCriteria: asStringArray(payload.acceptanceCriteria),
        riskScore: asNumber(payload.riskScore),
        riskFactors: asStringArray(payload.riskFactors),
      },
    }
  } catch (error) {
    return reply
      .status(503)
      .send({ code: 'QVAC_WORKER_UNAVAILABLE', message: error instanceof Error ? error.message : 'Worker failed' })
  }
})

app.post('/v1/dispute-run', async (req, reply) => {
  const { input } = DisputeRunInput.parse(req.body)
  try {
    await callModuleFn('@qvac/embed-llamacpp', ['embed', 'createEmbedding', 'embeddings', 'encode'], [
      input.requirementSnapshot.concat(input.conversation, input.submissionSummary).join('\n'),
    ])
    const raw = await callModuleFn('@qvac/llm-llamacpp', ['generate', 'infer', 'run', 'chat'], [
      buildDisputePrompt(input),
    ])
    const payload = parseJsonFromText(raw)
    return {
      result: {
        caseSummary: asString(payload.caseSummary),
        timeline: asStringArray(payload.timeline),
        agreedRequirements: asStringArray(payload.agreedRequirements),
        submittedEvidence: asStringArray(payload.submittedEvidence),
        matchesAndGaps: asStringArray(payload.matchesAndGaps),
        similarityScore: asNumber(payload.similarityScore),
        riskAssessment: asString(payload.riskAssessment),
        recommendedResolution: asString(payload.recommendedResolution),
      },
    }
  } catch (error) {
    return reply
      .status(503)
      .send({ code: 'QVAC_WORKER_UNAVAILABLE', message: error instanceof Error ? error.message : 'Worker failed' })
  }
})

const port = Number(process.env.PORT ?? 4100)
app.listen({ port, host: '0.0.0.0' }).catch((error) => {
  app.log.error(error)
  process.exit(1)
})
