import { config } from '../config.js'

type LooseRecord = Record<string, unknown>

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

const asStringArray = (value: unknown, fallback: string[] = []) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : fallback

const asNumber = (value: unknown, fallback = 0) => (typeof value === 'number' ? value : fallback)
const asString = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback)

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

const buildContractPrompt = (input: ContractDraftInput) => `
You are a contract copilot. Return strict JSON only.
Fields:
- ambiguities: string[]
- rewriteSuggestions: string[]
- acceptanceCriteria: string[]
- riskScore: number (0-100)
- riskFactors: string[]

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

const llmModuleName = '@qvac/llm-llamacpp'
const embedModuleName = '@qvac/embed-llamacpp'

const loadModule = async (moduleName: string) => {
  return (await import(moduleName)) as LooseRecord
}

const callModuleFn = async (
  moduleName: string,
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

export async function runContractCopilotQvac(input: ContractDraftInput): Promise<ContractCopilotResult> {
  if (!config.QVAC_ENABLED) {
    throw new Error('QVAC is disabled on backend. Set QVAC_ENABLED=true to run inference.')
  }

  const llmResponse = await callModuleFn(llmModuleName, ['generate', 'infer', 'run', 'chat'], [
    buildContractPrompt(input),
  ])
  const payload = parseJsonFromText(llmResponse)

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

  await callModuleFn(embedModuleName, ['embed', 'createEmbedding', 'embeddings', 'encode'], [
    input.requirementSnapshot.concat(input.conversation, input.submissionSummary).join('\n'),
  ])

  const llmResponse = await callModuleFn(llmModuleName, ['generate', 'infer', 'run', 'chat'], [
    buildDisputePrompt(input),
  ])
  const payload = parseJsonFromText(llmResponse)

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
