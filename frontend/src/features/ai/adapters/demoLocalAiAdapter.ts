import { scenarioPresets } from '../demoScenarios'
import type { ContractDraft, DisputeInput, LocalAiAdapter } from '../types'

export const demoLocalAiAdapter: LocalAiAdapter = {
  async improveContract(input: ContractDraft, scenario: 'design' | 'logo') {
    void input
    return scenarioPresets[scenario].copilotResult
  },
  async generateDisputeSummary(input: DisputeInput, scenario: 'design' | 'logo') {
    void input
    return scenarioPresets[scenario].disputeResult
  },
}
