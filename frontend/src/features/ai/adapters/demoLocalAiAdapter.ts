import { scenarioPresets } from '../demoScenarios'
import type { ContractCopilotRequestInput, DisputeInput, LocalAiAdapter } from '../types'

export const demoLocalAiAdapter: LocalAiAdapter = {
  async improveContract(
    contractId: string,
    input: ContractCopilotRequestInput,
    scenario: 'design' | 'logo',
  ) {
    void contractId
    void input
    return scenarioPresets[scenario].copilotResult
  },
  async generateDisputeSummary(
    contractId: string,
    input: DisputeInput,
    scenario: 'design' | 'logo',
  ) {
    void contractId
    void input
    return scenarioPresets[scenario].disputeResult
  },
}
