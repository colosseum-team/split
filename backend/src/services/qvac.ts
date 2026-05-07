import { config } from '../config.js'

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

type CopilotWorkerResponse = {
  result: ContractCopilotResult
}

type DisputeWorkerResponse = {
  result: DisputeBriefResult
}

const postJson = async <T>(path: string, payload: unknown): Promise<T> => {
  const baseUrl = config.QVAC_WORKER_URL.replace(/\/$/, '')
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`QVAC worker request failed (${response.status}): ${text}`)
  }

  return (await response.json()) as T
}

export async function runContractCopilotQvac(input: ContractDraftInput): Promise<ContractCopilotResult> {
  if (!config.QVAC_ENABLED) {
    throw new Error('QVAC is disabled on backend. Set QVAC_ENABLED=true to run inference.')
  }
  const payload = await postJson<CopilotWorkerResponse>('/v1/copilot-run', { input })
  return payload.result
}

export async function runDisputeBriefQvac(input: DisputeInput): Promise<DisputeBriefResult> {
  if (!config.QVAC_ENABLED) {
    throw new Error('QVAC is disabled on backend. Set QVAC_ENABLED=true to run inference.')
  }
  const payload = await postJson<DisputeWorkerResponse>('/v1/dispute-run', { input })
  return payload.result
}
