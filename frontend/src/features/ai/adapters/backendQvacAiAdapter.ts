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
// is CPU-bound on hosts without GPU; on prod (4-core ARM, no GPU) a real
// /ai/copilot-preview takes ~40s for the full production prompt
// (`buildContractPrompt`, ~600 tokens in + ~800 tokens out at ~30 tok/s
// after a properly primed warmup). 90s gives ~2x headroom so an
// occasional slow run still yields real QVAC output instead of falling
// back. On timeout we throw — service.ts catches this and falls back to
// demo scenarios.
const QVAC_BACKEND_TIMEOUT_MS = 90_000

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
      throw new Error(`QVAC backend timed out after ${QVAC_BACKEND_TIMEOUT_MS}ms`, { cause: err })
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
