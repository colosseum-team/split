// Standalone QVAC benchmark — meant to be executed inside the split-backend
// container via `docker exec` so it doesn't touch the live HTTP stack.
// Spawns its OWN Bare worker subprocess (one per node process), so the
// running Fastify server's worker is unaffected.
//
// Run: docker exec -w /app split-backend node scripts/bench-qvac.mjs

const labelPad = 38

const fmtMs = (ms) => {
  if (ms < 1000) return `${ms.toFixed(0).padStart(7)}ms`
  return `${(ms / 1000).toFixed(2).padStart(6)}s `
}

const timed = async (label, fn) => {
  process.stdout.write(`[start ] ${label}\n`)
  const t0 = performance.now()
  try {
    const result = await fn()
    const dt = performance.now() - t0
    process.stdout.write(`[ ${fmtMs(dt)} ] ${label}\n`)
    return { dt, result }
  } catch (err) {
    const dt = performance.now() - t0
    process.stdout.write(`[FAIL ${fmtMs(dt)}] ${label} — ${err?.message ?? err}\n`)
    throw err
  }
}

const tinyPrompt = 'Reply with strict JSON: {"hello":"world"}.'

const copilotPrompt = `
You are a senior legal contract copilot for freelance services.
Return strict JSON only. Fields:
- ambiguities: string[]
- rewriteSuggestions: string[1]
- acceptanceCriteria: string[]
- riskScore: number (0-100)
- riskFactors: string[]

Contract draft:
Scope: Need a clean wordmark logo for a freelance escrow platform.
Deliverables: SVG and PNG, two color variants.
Timeline: Two weeks.
Payment terms: 50% upfront, 50% on delivery.
`

const runInference = async (sdk, modelId, prompt) => {
  const run = sdk.completion({
    modelId,
    stream: true,
    history: [{ role: 'user', content: prompt }],
    responseFormat: { type: 'json_object' },
  })
  return run.text
}

async function main() {
  console.log('node:', process.version)
  console.log('arch:', process.arch, process.platform)
  console.log('QVAC_RPC_INIT_TIMEOUT_MS:', process.env.QVAC_RPC_INIT_TIMEOUT_MS ?? '(unset)')
  console.log('---')

  const { result: sdk } = await timed('import @qvac/sdk', () => import('@qvac/sdk'))
  const { LLAMA_3_2_1B_INST_Q4_0, loadModel, completion } = sdk

  const { result: modelId } = await timed(
    'loadModel (Llama-3.2-1B-Instruct Q4_0, ctx_size=4096)',
    () => loadModel({ modelSrc: LLAMA_3_2_1B_INST_Q4_0, modelConfig: { ctx_size: 4096 } }),
  )

  console.log(`modelId: ${modelId}`)
  console.log('---')

  // Three tiny inferences — first is warm-start, rest are steady-state.
  for (let i = 1; i <= 3; i++) {
    const { result: text } = await timed(`tiny inference #${i}`, () =>
      runInference({ completion }, modelId, tinyPrompt),
    )
    console.log(`  output(${text.length}b): ${text.slice(0, 120).replace(/\n/g, ' ')}...`)
  }
  console.log('---')

  // One full-sized copilot prompt (this is what /ai/copilot-preview actually runs).
  for (let i = 1; i <= 2; i++) {
    const { result: text } = await timed(`copilot-sized inference #${i}`, () =>
      runInference({ completion }, modelId, copilotPrompt),
    )
    console.log(`  output(${text.length}b): ${text.slice(0, 200).replace(/\n/g, ' ')}...`)
  }

  process.exit(0)
}

main().catch((err) => {
  console.error('BENCH FAILED:', err)
  process.exit(1)
})
