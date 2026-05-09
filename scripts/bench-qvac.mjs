// Multi-model QVAC benchmark on prod ARM host.
// Run: docker exec -w /app -e MODELS="A,B,C" split-backend node scripts/bench-qvac.mjs
// Each model: download (if needed) + loadModel + 1 contract copilot + 1 dispute brief.
// Outputs timings + first 400 chars of output for quality eyeball + unloads/cleans cache between models.

const labelPad = 30
const fmtMs = (ms) =>
  ms < 1000 ? `${ms.toFixed(0).padStart(7)}ms` : `${(ms / 1000).toFixed(2).padStart(6)}s `

const timed = async (label, fn) => {
  process.stdout.write(`  [start ] ${label}\n`)
  const t0 = performance.now()
  try {
    const result = await fn()
    const dt = performance.now() - t0
    process.stdout.write(`  [ ${fmtMs(dt)} ] ${label}\n`)
    return { dt, result }
  } catch (err) {
    const dt = performance.now() - t0
    process.stdout.write(`  [FAIL ${fmtMs(dt)}] ${label} — ${err?.message ?? err}\n`)
    throw err
  }
}

// Production prompts copied verbatim from backend/src/services/qvac.ts so the
// bench measures realistic load (~600 prompt tokens + ~800 output tokens).

const contractDraftForPrompt = (input) => {
  const { scope, deliverables, timeline, paymentTerms } = input
  const mirrored =
    scope === deliverables &&
    deliverables === timeline &&
    timeline === paymentTerms &&
    scope.trim().length > 0
  if (mirrored) {
    return `The customer provided one technical-assignment draft (the same body is repeated across scope/deliverables/timeline/paymentTerms only to satisfy API shape — treat it as one source). Infer reasonable timeline and payment terms where absent; list true gaps as ambiguities.

Technical assignment:
${scope}`
  }
  return `Contract draft:
Scope: ${scope}
Deliverables: ${deliverables}
Timeline: ${timeline}
Payment terms: ${paymentTerms}`
}

const buildContractPrompt = (input) => `
You are a senior legal contract copilot for freelance services.
Return strict JSON only. No markdown fences, no prose outside JSON.
Fields:
- ambiguities: string[]
- rewriteSuggestions: string[]
- acceptanceCriteria: string[]
- riskScore: number (0-100)
- riskFactors: string[]

Strict drafting rules for rewriteSuggestions:
- Use the user's current Technical assignment (Scope) as the source material to rewrite.
- Return exactly 1 rewriteSuggestions item (a single full strict version).
- The rewrite must be formal legal/business style with this exact structure:
  1. Project goal
  2. Scope of work
  2.1. Discovery and analysis
  2.2. UI/UX design
  2.3. Front-end implementation
  2.4. Content
  2.5. Out of scope (unless agreed separately)
  3. Deliverables
  4. Acceptance criteria
  5. Timeline (indicative, can be adjusted in writing)
  6. Customer obligations
  7. Performer obligations
  8. Acceptance and warranty
- Keep numbering exactly as above.
- Use concise, testable statements and measurable thresholds.
- Do not output placeholders like TBD or "...".
- If data is missing, make explicit realistic assumptions and include those assumptions in ambiguities.

${contractDraftForPrompt(input)}
`

const buildDisputePrompt = (input) => `
You are an arbitration assistant. Return strict JSON only.
Fields:
- caseSummary: string
- timeline: string[]
- agreedRequirements: string[]
- submittedEvidence: string[]
- matchesAndGaps: string[]
- similarityScore: number (0-100)
- riskAssessment: string
- recommendedResolution: string

Requirement snapshot:
${input.requirementSnapshot.join('\n')}

Submission summary:
${input.submissionSummary}

Conversation:
${input.conversation.join('\n')}
`

const SAMPLE_CONTRACT = {
  scope: 'Need a clean wordmark logo for a freelance escrow platform. Pastel palette. Two color variants (light/dark). Deliver SVG and PNG.',
  deliverables: 'SVG and PNG, two color variants.',
  timeline: 'Two weeks.',
  paymentTerms: '50% upfront, 50% on delivery.',
}

const SAMPLE_DISPUTE = {
  requirementSnapshot: [
    'Logo wordmark with pastel palette',
    'Two color variants (light + dark)',
    'Deliverables: SVG + PNG',
    'Two rounds of revisions included',
  ],
  submissionSummary:
    'Performer delivered one PNG file in a single bright red palette. No SVG, no light/dark variants. Two revision rounds were not used.',
  conversation: [
    'customer: Where is the SVG file?',
    'performer: I sent the PNG, that should be enough.',
    'customer: The brief explicitly required SVG and two palette variants.',
    'performer: I think one palette is fine, can we close?',
  ],
}

const parseJsonObject = (text) => {
  try {
    return JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Unable to parse JSON from response')
    return JSON.parse(match[0])
  }
}

const summarizeOutput = (raw) => {
  const len = raw.length
  let parsed = null
  let parseErr = null
  try {
    parsed = parseJsonObject(raw)
  } catch (e) {
    parseErr = e.message
  }
  return { len, parsed, parseErr, head: raw.slice(0, 400).replace(/\s+/g, ' ') }
}

async function benchModel(sdk, modelName) {
  console.log('')
  console.log('=========================================')
  console.log(`MODEL: ${modelName}`)
  console.log('=========================================')

  const descriptor = sdk[modelName]
  if (!descriptor) {
    console.log(`  ERROR: ${modelName} not exported by @qvac/sdk`)
    return null
  }

  const result = { model: modelName }
  let modelId

  try {
    const { dt: loadMs, result: id } = await timed('loadModel', () =>
      sdk.loadModel({ modelSrc: descriptor, modelConfig: { ctx_size: 4096 } }),
    )
    modelId = id
    result.loadMs = loadMs

    // Contract copilot — production prompt size + structure.
    const { dt: copilotMs, result: copilotText } = await timed('copilot inference', async () => {
      const run = sdk.completion({
        modelId,
        stream: true,
        history: [{ role: 'user', content: buildContractPrompt(SAMPLE_CONTRACT) }],
        responseFormat: { type: 'json_object' },
      })
      return run.text
    })
    result.copilotMs = copilotMs
    result.copilot = summarizeOutput(copilotText)
    console.log(
      `    output(${result.copilot.len}b, parse=${result.copilot.parseErr ? 'FAIL' : 'ok'}): ${result.copilot.head}...`,
    )

    // Dispute brief.
    const { dt: disputeMs, result: disputeText } = await timed('dispute inference', async () => {
      const run = sdk.completion({
        modelId,
        stream: true,
        history: [{ role: 'user', content: buildDisputePrompt(SAMPLE_DISPUTE) }],
        responseFormat: { type: 'json_object' },
      })
      return run.text
    })
    result.disputeMs = disputeMs
    result.dispute = summarizeOutput(disputeText)
    console.log(
      `    output(${result.dispute.len}b, parse=${result.dispute.parseErr ? 'FAIL' : 'ok'}): ${result.dispute.head}...`,
    )
  } catch (err) {
    console.log(`  bench failed: ${err?.message ?? err}`)
    result.error = err?.message ?? String(err)
  } finally {
    if (modelId) {
      try {
        await sdk.unloadModel({ modelId })
        console.log('  unloaded model')
      } catch (e) {
        console.log('  unload failed:', e.message)
      }
    }
    // Free disk so the next model has room to download. deleteCache by model
    // descriptor removes the GGUF from /root/.qvac/models/.
    try {
      await sdk.deleteCache({ assetSrc: descriptor })
      console.log('  cache deleted')
    } catch (e) {
      console.log('  deleteCache failed (non-fatal):', e.message)
    }
  }

  return result
}

async function main() {
  console.log('node:', process.version, '| arch:', process.arch, process.platform)
  console.log('QVAC_RPC_INIT_TIMEOUT_MS:', process.env.QVAC_RPC_INIT_TIMEOUT_MS ?? '(unset)')

  const modelsArg =
    process.env.MODELS ??
    'LLAMA_3_2_1B_INST_Q4_0,QWEN3_600M_INST_Q4,BITNET_0_7B_INST_TQ2_0,BITNET_1B_INST_TQ2_0,LLAMA_TOOL_CALLING_1B_INST_Q4_K,QWEN3_1_7B_INST_Q4'
  const candidates = modelsArg
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  console.log('candidates:', candidates.join(', '))
  console.log('')

  const sdk = await import('@qvac/sdk')

  const results = []
  for (const name of candidates) {
    const r = await benchModel(sdk, name)
    if (r) results.push(r)
  }

  console.log('')
  console.log('=========================================')
  console.log('SUMMARY')
  console.log('=========================================')
  console.log(
    `${'model'.padEnd(labelPad)} ${'load'.padStart(8)} ${'copilot'.padStart(9)} ${'dispute'.padStart(9)} ${'cp.size'.padStart(8)} ${'cp.parse'.padStart(9)} ${'dp.size'.padStart(8)} ${'dp.parse'.padStart(9)}`,
  )
  for (const r of results) {
    if (r.error) {
      console.log(`${r.model.padEnd(labelPad)} ERROR: ${r.error}`)
      continue
    }
    console.log(
      `${r.model.padEnd(labelPad)} ${fmtMs(r.loadMs).padStart(8)} ${fmtMs(r.copilotMs).padStart(9)} ${fmtMs(r.disputeMs).padStart(9)} ${String(r.copilot.len).padStart(8)} ${(r.copilot.parseErr ? 'FAIL' : 'ok').padStart(9)} ${String(r.dispute.len).padStart(8)} ${(r.dispute.parseErr ? 'FAIL' : 'ok').padStart(9)}`,
    )
  }

  process.exit(0)
}

main().catch((err) => {
  console.error('BENCH FAILED:', err)
  process.exit(1)
})
