export type DemoScenario = 'off' | 'design' | 'logo'
export type AiSource = 'demo' | 'qvac'

export type ContractDraft = {
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
  metadata: {
    source: string
    scenario: Exclude<DemoScenario, 'off'>
    model: string
  }
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
  metadata: {
    source: string
    scenario: Exclude<DemoScenario, 'off'>
    model: string
  }
}

export interface LocalAiAdapter {
  improveContract(
    input: ContractDraft,
    scenario: Exclude<DemoScenario, 'off'>,
  ): Promise<ContractCopilotResult>
  generateDisputeSummary(
    input: DisputeInput,
    scenario: Exclude<DemoScenario, 'off'>,
  ): Promise<DisputeBriefResult>
}
