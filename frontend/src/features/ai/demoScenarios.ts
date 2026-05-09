import type {
  ContractCopilotResult,
  ContractDraft,
  DisputeBriefResult,
  DisputeInput,
} from './types'

export type ScenarioPreset = {
  label: string
  contractDraft: ContractDraft
  disputeInput: DisputeInput
  copilotResult: ContractCopilotResult
  disputeResult: DisputeBriefResult
}

export const scenarioPresets: Record<'design' | 'logo', ScenarioPreset> = {
  design: {
    label: 'Design Landing Page',
    contractDraft: {
      scope: 'Design a modern landing page for our startup.',
      deliverables: 'Figma file and assets.',
      timeline: '5 days',
      paymentTerms: 'Fixed payment after approval.',
    },
    disputeInput: {
      requirementSnapshot: [
        'Desktop and mobile layouts are required.',
        'Design system tokens must be documented.',
        'Reusable Figma components should be named and grouped.',
      ],
      submissionSummary: 'Freelancer delivered desktop layout and style guide draft.',
      conversation: [
        'Customer: I cannot find mobile screens in the file.',
        'Freelancer: Mobile was not clearly listed in initial scope.',
        'Customer: We expected responsive design by default.',
      ],
    },
    copilotResult: {
      ambiguities: [
        'Scope does not specify number of sections and breakpoints.',
        'Deliverables do not define component naming and states.',
      ],
      rewriteSuggestions: [
        'Specify required breakpoints: desktop 1440px and mobile 390px.',
        'Add requirement for hover, loading, and form error states.',
      ],
      acceptanceCriteria: [
        'Figma includes desktop and mobile layouts.',
        'Design tokens are documented for color, typography, and spacing.',
        'Components are editable, grouped, and clearly named.',
      ],
      riskScore: 58,
      riskFactors: [
        'No explicit responsive requirement.',
        'No brand guideline reference in contract.',
      ],
      metadata: { source: 'local-qvac-demo', scenario: 'design', model: 'demo-stub' },
    },
    disputeResult: {
      caseSummary:
        'The dispute centers on missing mobile layouts and inconsistent expectations around responsive scope.',
      timeline: [
        'Contract signed with high-level design wording.',
        'Freelancer submitted desktop-first draft.',
        'Customer requested revisions and opened dispute.',
      ],
      agreedRequirements: [
        'Landing page design with defined deliverables.',
        'Figma source file as final handoff asset.',
      ],
      submittedEvidence: [
        'Desktop mockups present in Figma.',
        'No complete mobile frame set attached.',
      ],
      matchesAndGaps: [
        'Match: desktop layout delivered.',
        'Gap: mobile breakpoint deliverable not clearly met.',
        'Gap: component state coverage incomplete.',
      ],
      similarityScore: 72,
      riskAssessment: 'Medium dispute risk due to ambiguous contract language.',
      recommendedResolution:
        'Approve partial work and request one revision cycle for mobile and component states.',
      metadata: { source: 'local-qvac-demo', scenario: 'design', model: 'demo-stub' },
    },
  },
  logo: {
    label: 'Logo Package',
    contractDraft: {
      scope: 'Create a logo for our product.',
      deliverables: 'Logo files.',
      timeline: '3 days',
      paymentTerms: 'Fixed payment in escrow.',
    },
    disputeInput: {
      requirementSnapshot: [
        'At least 3 initial concepts.',
        'Final package should include SVG, PNG, and monochrome variant.',
        'Ownership transfer terms must be explicit.',
      ],
      submissionSummary: 'Freelancer delivered two concepts and final colored PNG logo.',
      conversation: [
        'Customer: We asked for vector source and black-and-white version.',
        'Freelancer: Not listed in final approved message.',
        'Customer: Also need full exclusive rights transfer.',
      ],
    },
    copilotResult: {
      ambiguities: [
        'Contract does not define number of concepts or revision rounds.',
        'Deliverables list misses formats and IP transfer details.',
      ],
      rewriteSuggestions: [
        'Add 3 initial concepts and up to 2 revision rounds.',
        'Define mandatory outputs: SVG, PNG, PDF, monochrome variant, and source file.',
      ],
      acceptanceCriteria: [
        'Freelancer submits at least 3 logo concepts.',
        'Final package includes SVG, PNG, PDF, and monochrome version.',
        'Contract includes explicit ownership transfer clause.',
      ],
      riskScore: 77,
      riskFactors: ['Missing IP transfer clause.', 'No revision cap defined.'],
      metadata: { source: 'local-qvac-demo', scenario: 'logo', model: 'demo-stub' },
    },
    disputeResult: {
      caseSummary:
        'Disagreement covers missing file formats and ownership scope after final logo delivery.',
      timeline: [
        'Contract created with broad wording.',
        'Freelancer delivered partial logo package.',
        'Customer requested additional formats and rights clarification.',
      ],
      agreedRequirements: ['Logo design package.', 'Delivery deadline in 3 days.'],
      submittedEvidence: ['Two visual concepts delivered.', 'No vector source in final package.'],
      matchesAndGaps: [
        'Match: logo concept delivered.',
        'Gap: required export formats are incomplete.',
        'Gap: ownership transfer is under-specified.',
      ],
      similarityScore: 64,
      riskAssessment: 'High risk due to scope creep and unclear legal language.',
      recommendedResolution:
        'Execute addendum for rights transfer and request missing vector/monochrome assets before full release.',
      metadata: { source: 'local-qvac-demo', scenario: 'logo', model: 'demo-stub' },
    },
  },
}
