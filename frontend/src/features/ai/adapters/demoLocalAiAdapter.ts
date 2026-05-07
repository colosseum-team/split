import { scenarioPresets } from '../demoScenarios'
import type { ContractDraft, DisputeInput, LocalAiAdapter } from '../types'

export const demoLocalAiAdapter: LocalAiAdapter = {
  async improveContract(contractId: string, input: ContractDraft, scenario: 'design' | 'logo') {
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
