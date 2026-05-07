import type {
  ContractCopilotResult,
  ContractDraft,
  DisputeBriefResult,
  DisputeInput,
} from '../types'

type BackendQvacAiAdapterOptions = {
  baseUrl: string
  getAuthToken?: () => string | null
}

type CopilotRunResponse = {
  result: {
    ambiguities: string[]
    rewriteSuggestions: string[]
    acceptanceCriteria: string[]
    riskScore: number
    riskFactors: string[]
  }
}

type DisputeRunResponse = {
  result: {
    caseSummary: string
    timeline: string[]
    agreedRequirements: string[]
    submittedEvidence: string[]
    matchesAndGaps: string[]
    similarityScore: number
    riskAssessment: string
    recommendedResolution: string
  }
}

const postJson = async <T>(url: string, body: unknown, token: string | null): Promise<T> => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`QVAC backend request failed (${response.status}): ${text}`)
  }

  return (await response.json()) as T
}

export function createBackendQvacAiAdapter(options: BackendQvacAiAdapterOptions) {
  const baseUrl = options.baseUrl.replace(/\/$/, '')
  const getToken = options.getAuthToken ?? (() => null)

  return {
    async improveContract(
      contractId: string,
      input: ContractDraft,
      scenario: 'design' | 'logo',
    ): Promise<ContractCopilotResult> {
      const payload = await postJson<CopilotRunResponse>(
        `${baseUrl}/contracts/${contractId}/copilot-run`,
        { scenario, input },
        getToken(),
      )

      return {
        ...payload.result,
        metadata: { source: 'backend-qvac', scenario, model: 'qvac-llamacpp' },
      }
    },

    async generateDisputeSummary(
      contractId: string,
      input: DisputeInput,
      scenario: 'design' | 'logo',
    ): Promise<DisputeBriefResult> {
      const payload = await postJson<DisputeRunResponse>(
        `${baseUrl}/contracts/${contractId}/dispute-run`,
        { scenario, input },
        getToken(),
      )

      return {
        ...payload.result,
        metadata: { source: 'backend-qvac', scenario, model: 'qvac-llamacpp+embed' },
      }
    },
  }
}
