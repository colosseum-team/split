import type {
  ContractCopilotRequestInput,
  ContractCopilotResult,
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

// Cap how long the SPA waits for backend QVAC inference. The Bare worker
// can be CPU-bound on hosts without GPU acceleration; without this cap a
// hung first call freezes the UI for the full edge timeout (5 min). On
// timeout we throw — the AI service layer already catches this and falls
// back to demo scenarios.
const QVAC_BACKEND_TIMEOUT_MS = 30_000

const postJson = async <T>(url: string, body: unknown, token: string | null): Promise<T> => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), QVAC_BACKEND_TIMEOUT_MS)
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`QVAC backend request failed (${response.status}): ${text}`)
    }

    return (await response.json()) as T
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(`QVAC backend timed out after ${QVAC_BACKEND_TIMEOUT_MS}ms`)
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

export function createBackendQvacAiAdapter(options: BackendQvacAiAdapterOptions) {
  const baseUrl = options.baseUrl.replace(/\/$/, '')
  const getToken = options.getAuthToken ?? (() => null)

  return {
    async improveContract(
      contractId: string,
      input: ContractCopilotRequestInput,
      scenario: 'design' | 'logo',
    ): Promise<ContractCopilotResult> {
      const route =
        contractId === 'preview'
          ? `${baseUrl}/ai/copilot-preview`
          : `${baseUrl}/contracts/${contractId}/copilot-run`
      const payload = await postJson<CopilotRunResponse>(route, { scenario, input }, getToken())

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
