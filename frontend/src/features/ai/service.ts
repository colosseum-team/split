import type {
  ContractCopilotResult,
  ContractDraft,
  DemoScenario,
  DisputeBriefResult,
  DisputeInput,
  LocalAiAdapter,
} from './types'

const simulateLocalDelay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function createLocalAiService(adapter: LocalAiAdapter) {
  return {
    async improveContract(
      input: ContractDraft,
      scenario: DemoScenario,
    ): Promise<ContractCopilotResult> {
      if (scenario === 'off') {
        throw new Error('Enable a demo scenario to run local AI.')
      }
      await simulateLocalDelay(1200)
      return adapter.improveContract(input, scenario)
    },
    async generateDisputeSummary(
      input: DisputeInput,
      scenario: DemoScenario,
    ): Promise<DisputeBriefResult> {
      if (scenario === 'off') {
        throw new Error('Enable a demo scenario to run local AI.')
      }
      await simulateLocalDelay(1400)
      return adapter.generateDisputeSummary(input, scenario)
    },
  }
}
