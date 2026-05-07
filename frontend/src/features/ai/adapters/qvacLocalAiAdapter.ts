import { scenarioPresets } from '../demoScenarios'
import type {
  ContractCopilotResult,
  ContractDraft,
  DisputeBriefResult,
  DisputeInput,
  LocalAiAdapter,
} from '../types'

type LooseRecord = Record<string, unknown>
type QvacModuleName = '@qvac/llm-llamacpp' | '@qvac/embed-llamacpp'

const assertQvacRuntime = () => {
  if (!('Bare' in globalThis)) {
    throw new Error(
      'QVAC llama.cpp adapters require Bare runtime and cannot run in a browser-only Vite client. Use demo mode in web, or run QVAC inference in a Bare/Node-capable host.',
    )
  }
}

const loadModule = async (moduleName: QvacModuleName) => {
  assertQvacRuntime()
  if (moduleName === '@qvac/llm-llamacpp') {
    return (await import('@qvac/llm-llamacpp')) as LooseRecord
  }
  return (await import('@qvac/embed-llamacpp')) as LooseRecord
}

const callModuleFn = async (
  moduleName: QvacModuleName,
  candidateNames: string[],
  args: unknown[],
): Promise<unknown> => {
  const mod = await loadModule(moduleName)
  const fn = candidateNames
    .map((name) => mod[name])
    .find((value): value is (...input: unknown[]) => unknown => typeof value === 'function')

  if (!fn) {
    throw new Error(
      `No compatible function found in ${moduleName}. Tried: ${candidateNames.join(', ')}`,
    )
  }

  return fn(...args)
}

const parseJsonFromText = (value: unknown): LooseRecord => {
  if (typeof value === 'object' && value !== null) {
    return value as LooseRecord
  }
  if (typeof value !== 'string') {
    throw new Error('QVAC adapter returned unsupported response format.')
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

const buildContractPrompt = (input: ContractDraft) => `
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

const buildCopilotResult = (
  payload: LooseRecord,
  scenario: 'design' | 'logo',
): ContractCopilotResult => ({
  ambiguities: asStringArray(payload.ambiguities),
  rewriteSuggestions: asStringArray(payload.rewriteSuggestions),
  acceptanceCriteria: asStringArray(payload.acceptanceCriteria),
  riskScore: asNumber(payload.riskScore),
  riskFactors: asStringArray(payload.riskFactors),
  metadata: { source: 'local-qvac', scenario, model: 'qvac-llamacpp' },
})

const buildDisputeResult = (
  payload: LooseRecord,
  scenario: 'design' | 'logo',
): DisputeBriefResult => ({
  caseSummary: asString(payload.caseSummary),
  timeline: asStringArray(payload.timeline),
  agreedRequirements: asStringArray(payload.agreedRequirements),
  submittedEvidence: asStringArray(payload.submittedEvidence),
  matchesAndGaps: asStringArray(payload.matchesAndGaps),
  similarityScore: asNumber(payload.similarityScore),
  riskAssessment: asString(payload.riskAssessment),
  recommendedResolution: asString(payload.recommendedResolution),
  metadata: { source: 'local-qvac', scenario, model: 'qvac-llamacpp+embed' },
})

export const qvacLocalAiAdapter: LocalAiAdapter = {
  async improveContract(contractId: string, input: ContractDraft, scenario: 'design' | 'logo') {
    void contractId
    const llmResponse = await callModuleFn(
      '@qvac/llm-llamacpp',
      ['generate', 'infer', 'run', 'chat'],
      [buildContractPrompt(input)],
    )
    const payload = parseJsonFromText(llmResponse)
    const result = buildCopilotResult(payload, scenario)

    // Fallback guarantees stable demo output if model returns empty structure.
    if (result.acceptanceCriteria.length === 0) {
      return scenarioPresets[scenario].copilotResult
    }
    return result
  },

  async generateDisputeSummary(
    contractId: string,
    input: DisputeInput,
    scenario: 'design' | 'logo',
  ) {
    void contractId
    await callModuleFn(
      '@qvac/embed-llamacpp',
      ['embed', 'createEmbedding', 'embeddings', 'encode'],
      [input.requirementSnapshot.concat(input.conversation, input.submissionSummary).join('\n')],
    )

    const llmResponse = await callModuleFn(
      '@qvac/llm-llamacpp',
      ['generate', 'infer', 'run', 'chat'],
      [buildDisputePrompt(input)],
    )
    const payload = parseJsonFromText(llmResponse)
    const result = buildDisputeResult(payload, scenario)

    if (result.matchesAndGaps.length === 0) {
      return scenarioPresets[scenario].disputeResult
    }
    return result
  },
}
