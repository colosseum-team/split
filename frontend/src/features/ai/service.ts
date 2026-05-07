import type {
  AiSource,
  ContractCopilotResult,
  ContractDraft,
  DemoScenario,
  DisputeBriefResult,
  DisputeInput,
  LocalAiAdapter,
} from './types'

const simulateLocalDelay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

type LocalAiServiceOptions = {
  source: AiSource
  adapters: {
    demo: LocalAiAdapter
    qvac: LocalAiAdapter
  }
  fallbackToDemo?: boolean
}

export function createLocalAiService(options: LocalAiServiceOptions) {
  const { source, adapters, fallbackToDemo = true } = options

  const runWithSource = async <T>(runner: (adapter: LocalAiAdapter) => Promise<T>): Promise<T> => {
    const preferredAdapter = source === 'qvac' ? adapters.qvac : adapters.demo
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
      input: ContractDraft,
      scenario: DemoScenario,
    ): Promise<ContractCopilotResult> {
      if (scenario === 'off') {
        throw new Error('Enable a demo scenario to run local AI.')
      }
      await simulateLocalDelay(1200)
      return runWithSource((adapter) => adapter.improveContract(input, scenario))
    },
    async generateDisputeSummary(
      input: DisputeInput,
      scenario: DemoScenario,
    ): Promise<DisputeBriefResult> {
      if (scenario === 'off') {
        throw new Error('Enable a demo scenario to run local AI.')
      }
      await simulateLocalDelay(1400)
      return runWithSource((adapter) => adapter.generateDisputeSummary(input, scenario))
    },
  }
}
