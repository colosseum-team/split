/** Max length for Subject of contract (single legal-style sentence / short paragraph). */
const MAX_SUBJECT_LENGTH = 480

/** Min TA length before we synthesize subject (below this the template text is unreliable). */
const MIN_TA_CHARS_FOR_SYNTHESIS = 40

function collapseToSingleParagraph(text: string): string {
  return text
    .replace(/\r/g, '')
    .replace(/\s*\n+\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function smartClip(s: string, max: number): string {
  if (s.length <= max) return s
  const slice = s.slice(0, max + 1)
  const period = slice.lastIndexOf('.', max)
  if (period >= max * 0.55) return slice.slice(0, period + 1).trim()
  const semi = slice.lastIndexOf(';', max)
  if (semi >= max * 0.48) return slice.slice(0, semi + 1).trim()
  const space = slice.lastIndexOf(' ', Math.min(max - 2, slice.length))
  return `${space > max * 0.35 ? slice.slice(0, space) : slice.slice(0, max).trim()}…`
}

const FALLBACK_TAIL =
  ' Provision of freelance services pursuant to the Technical Assignment attached herein.'

/**
 * Derives Subject of the contract from Technical assignment section 1 (Project goal),
 * collapsed to one paragraph; falls back to the first substantive paragraph if headings are absent.
 */
export function deriveSubjectFromTechnicalAssignment(technicalAssignment: string): string {
  const raw = technicalAssignment.trim().replace(/\r\n/g, '\n')
  if (!raw) return ''

  let body: string
  const scoped =
    /^\s*1\.\s*Project goal[^\r\n]*(?:\r?\n\s*)+([\s\S]*?)(?=^\s*2\.\s*Scope\b)/im.exec(raw)

  if (scoped?.[1]?.trim()) {
    body = scoped[1].trim()
  } else {
    const afterGoalHeading = raw.replace(/^\s*1\.\s*Project goal[^\r\n]*(?:\r?\n\s*)+/im, '')
    body = afterGoalHeading.split(/^\s*2\.\s*Scope\b/im)[0]?.trim() ?? ''

    if (!body || body.length < 30) {
      const blocks = raw.split(/\n\s*\n+/).filter(Boolean)
      const substantive = blocks
        .map((b) => b.trim())
        .filter((b) => b.length >= MIN_TA_CHARS_FOR_SYNTHESIS && !/^1\.\s*Project\s*$/i.test(b))

      body =
        substantive
          .find((b) => !/^[-•]/m.test(b) && !/^\d+\.\d+\./m.test(b))
          ?.replace(/^\s*1\.\s*Project goal[^\r\n]*(?:\r?\n\s*)+/im, '')
          ?.trim() ?? ''

      if (!body && substantive.length) {
        body = substantive[0].replace(/^\s*1\.\s*Project goal[^\r\n]*(?:\r?\n\s*)+/im, '').trim()
      }
    }
  }

  body = collapseToSingleParagraph(body)
  const clipped = smartClip(body, MAX_SUBJECT_LENGTH)

  let out = clipped
  if (out.length < 10 && raw.trim().length >= MIN_TA_CHARS_FOR_SYNTHESIS) {
    out = collapseToSingleParagraph(
      `${smartClip(raw, MAX_SUBJECT_LENGTH - FALLBACK_TAIL.length)}${FALLBACK_TAIL}`,
    )
  }

  return out.trim()
}

export { MIN_TA_CHARS_FOR_SYNTHESIS }
