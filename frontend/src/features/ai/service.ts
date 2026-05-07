import type {
  AiSource,
  ContractCopilotResult,
  ContractCopilotRequestInput,
  DemoScenario,
  DisputeBriefResult,
  DisputeInput,
  LocalAiAdapter,
} from './types'
import { createBackendQvacAiAdapter } from './adapters/backendQvacAiAdapter'

const simulateLocalDelay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

type LocalAiServiceOptions = {
  source: AiSource
  adapters: {
    demo: LocalAiAdapter
    qvac?: LocalAiAdapter
  }
  qvacApi?: {
    baseUrl: string
    getAuthToken?: () => string | null
  }
  fallbackToDemo?: boolean
}

export function createLocalAiService(options: LocalAiServiceOptions) {
  const { source, adapters, qvacApi, fallbackToDemo = true } = options
  const backendQvacAdapter = qvacApi ? createBackendQvacAiAdapter(qvacApi) : null
  const qvacAdapter = backendQvacAdapter ?? adapters.qvac ?? adapters.demo

  const runWithSource = async <T>(runner: (adapter: LocalAiAdapter) => Promise<T>): Promise<T> => {
    const preferredAdapter = source === 'qvac' ? qvacAdapter : adapters.demo
    try {
      return await runner(preferredAdapter)
    } catch (error) {
      if (source === 'qvac' && fallbackToDemo) {
        return runner(adapters.demo)
      }
      throw error
    }
  }

  return {
    async improveContract(
      contractId: string,
      input: ContractCopilotRequestInput,
      scenario: DemoScenario,
    ): Promise<ContractCopilotResult> {
      if (scenario === 'off') {
        throw new Error('Enable a demo scenario to run local AI.')
      }
      await simulateLocalDelay(1200)
      return runWithSource((adapter) => adapter.improveContract(contractId, input, scenario))
    },
    async generateDisputeSummary(
      contractId: string,
      input: DisputeInput,
      scenario: DemoScenario,
    ): Promise<DisputeBriefResult> {
      if (scenario === 'off') {
        throw new Error('Enable a demo scenario to run local AI.')
      }
      await simulateLocalDelay(1400)
      return runWithSource((adapter) => adapter.generateDisputeSummary(contractId, input, scenario))
    },
  }
}
