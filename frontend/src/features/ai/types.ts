export type DemoScenario = 'off' | 'design' | 'logo'
export type AiSource = 'demo' | 'qvac'

export type ContractDraft = {
  scope: string
  deliverables: string
  timeline: string
  paymentTerms: string
}

/** One textarea — sent as-is without mirroring duplicate strings in JSON */
export type ContractCopilotTechnicalAssignmentInput = {
  technicalAssignment: string
}

/** Body `input` for copilot-preview / copilot-run */
export type ContractCopilotRequestInput = ContractDraft | ContractCopilotTechnicalAssignmentInput

export function normalizeContractDraftForInference(
  input: ContractCopilotRequestInput,
): ContractDraft {
  if ('technicalAssignment' in input) {
    const t = input.technicalAssignment
    return { scope: t, deliverables: t, timeline: t, paymentTerms: t }
  }
  return input
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
    contractId: string,
    input: ContractCopilotRequestInput,
    scenario: Exclude<DemoScenario, 'off'>,
  ): Promise<ContractCopilotResult>
  generateDisputeSummary(
    contractId: string,
    input: DisputeInput,
    scenario: Exclude<DemoScenario, 'off'>,
  ): Promise<DisputeBriefResult>
}
