import type { ContractCopilotResult } from './types'

/** Min length heuristic: terse models often return ~1 line starting with “1. Project goal:”. */
const MIN_CHARS_FORLIKELY_FULL_DOC = 700

/**
 * Builds one technical-assignment blob from copilot rewriteSuggestions (single string or
 * model-split fragments).
 */
export function technicalAssignmentFromCopilot(
  result: Pick<ContractCopilotResult, 'rewriteSuggestions'>,
): string {
  const parts = result.rewriteSuggestions.map((s) => s.trim()).filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0]
  return parts.join('\n\n')
}

export function normalizeAssignmentNewlines(text: string): string {
  return text.trim().replace(/\r\n/g, '\n').replace(/\\n/g, '\n')
}

/**
 * Full TA string for textarea: if the model already returned §2–§8 inline, paste verbatim.
 * Otherwise build the canonical scaffold and weave in goal body, Acceptance criteria,
 * ambiguities, and risk bullets (appendix).
 */
export function structuredTechnicalAssignmentFromCopilot(result: ContractCopilotResult): string {
  const merged = normalizeAssignmentNewlines(technicalAssignmentFromCopilot(result))

  const hasScopeHeader = /\b2\.\s*Scope of work\b/im.test(merged)
  const hasClosingHeader = /\b8\.\s*Acceptance and warranty\b/im.test(merged)

  if (merged.length >= MIN_CHARS_FORLIKELY_FULL_DOC && hasScopeHeader && hasClosingHeader) {
    return merged
  }

  return assembleStructuredTechnicalAssignment(merged, result)
}

/**
 * If the LLM returned only a short “1. Project goal…” line but filled other arrays, synthesize the
 * full template (sections 1–8) using those fields plus safe defaults.
 */
function assembleStructuredTechnicalAssignment(
  mergedRewrite: string,
  result: ContractCopilotResult,
): string {
  let goalBody = normalizeAssignmentNewlines(mergedRewrite)
    .replace(/^1\.\s*Project goal\s*[:.]?\s*/i, '')
    .trim()

  const acBullets =
    result.acceptanceCriteria
      ?.map((c) => {
        const t = c.trim().replace(/^[-•]\s*/, '')
        return t.length ? `- ${t}` : ''
      })
      .filter((l) => l.length > 2) ?? []
  const ambiguityBullets =
    result.ambiguities
      ?.map((c) => {
        const t = c.trim().replace(/^[-•]\s*/, '')
        return t.length ? `- ${t}` : ''
      })
      .filter((l) => l.length > 2) ?? []
  const riskBullets =
    result.riskFactors
      ?.map((c) => {
        const t = c.trim().replace(/^[-•]\s*/, '')
        return t.length ? `- ${t}` : ''
      })
      .filter((l) => l.length > 2) ?? []

  if (!goalBody) {
    goalBody =
      result.rewriteSuggestions
        ?.map((s) => s.trim())
        .filter(Boolean)[0]
        ?.replace(/^1\.\s*Project goal\s*[:.]?\s*/i, '')
        ?.trim() ?? ''
  }
  if (!goalBody) {
    goalBody =
      'The parties align on measurable conversion and delivery targets; particulars follow from Acceptance criteria and Customer inputs.'
  }

  const discoveryBlock =
    ambiguityBullets.length > 0
      ? ambiguityBullets.join('\n')
      : `- Hold a structured discovery checkpoint covering offer, audiences, funnel steps, branding, accessibility, analytics, consent, hosting, launch window, and handover format.`

  const acceptanceBlock =
    acBullets.length > 0
      ? acBullets.join('\n')
      : `- Outputs match the articulated scope once parties confirm requirements in writing.`

  const genericOutScope = `- Hosted services or languages beyond Primary unless written change; indefinite maintenance, SLA on third-party providers, unpaid media/SEO retainers absent from Acceptance criteria unless added separately.`

  const paragraphs = [
    `1. Project goal`,
    `${goalBody}`,
    ``,
    `2. Scope of work`,
    `2.1. Discovery and analysis`,
    `${discoveryBlock}`,
    ``,
    `2.2. UI/UX design`,
    `- Translate agreed positioning into responsive layouts, hierarchy, typography, color, spacing, interactions, states, tokens, breakpoints, WCAG-aligned affordances tuned for conversions.`,
    ``,
    `2.3. Front-end implementation`,
    `- Responsive semantic markup/scripting aligning with Acceptance criteria.`,
    `- Client validations and HTTPS POST/handlers per Customer-supplied endpoints.`,
    `- Lighthouse/SEO/metadata/analytics tagging per Acceptance criteria.`,
    ``,
    `2.4. Content`,
    `- Final copy/visuals originate from Customer unless copywriting contracted; placeholders removed ahead of acceptance.`,
    ``,
    `2.5. Out of scope (unless agreed separately)`,
    genericOutScope,
    ``,
    `3. Deliverables`,
    `- Source/repo or equivalent bundle + deployment artefacts + exported design artefacts + succinct handover aligning with Acceptance criteria.`,
    ``,
    `4. Acceptance criteria`,
    `${acceptanceBlock}`,
    ``,
    `5. Timeline (indicative, can be adjusted in writing)`,
    `- Discovery/brief stabilization, design revisions, engineering, QA hardened against Customer hosting/endpoints.`,
    ``,
    `6. Customer obligations`,
    `- Approvals, assets, endpoints, domains/DNS/analytics/access, POC with decision rights.`,
    ``,
    `7. Performer obligations`,
    `- Professional workmanship, blocker escalation, corrective work attributable to deviations from this TA.`,
    ``,
    `8. Acceptance and warranty`,
    `- Acceptance window after deployment notification; tacit acceptance if no substantive written defects in window; corrective work confined to deviations from agreed Acceptance criteria.`,
  ]

  if (riskBullets.length > 0) {
    paragraphs.push(``, `Risk discussion`, riskBullets.join('\n'))
  }

  const joined = paragraphs.join('\n')
  return joined.replace(/\n{4,}/g, '\n\n\n')
}
