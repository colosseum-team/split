import { useMemo, useState } from 'react'
import { demoLocalAiAdapter } from '../../../features/ai/adapters/demoLocalAiAdapter'
import { qvacLocalAiAdapter } from '../../../features/ai/adapters/qvacLocalAiAdapter'
import { createLocalAiService } from '../../../features/ai/service'
import type {
  AiSource,
  ContractDraft,
  DemoScenario,
  DisputeInput,
} from '../../../features/ai/types'
import { ContractCopilotPanel } from '../../../features/contracts/components/ContractCopilotPanel'
import { DemoScenarioSwitcher } from '../../../features/demo/DemoScenarioSwitcher'
import { DisputeSummaryPanel } from '../../../features/disputes/components/DisputeSummaryPanel'

export function HomePage() {
  const [scenario, setScenario] = useState<DemoScenario>('design')
  const aiSource: AiSource = import.meta.env.VITE_AI_SOURCE === 'qvac' ? 'qvac' : 'demo'
  const aiService = useMemo(
    () =>
      createLocalAiService({
        source: aiSource,
        adapters: {
          demo: demoLocalAiAdapter,
          qvac: qvacLocalAiAdapter,
        },
        fallbackToDemo: false,
      }),
    [aiSource],
  )

  const handleImprove = (input: ContractDraft) => aiService.improveContract(input, scenario)
  const handleGenerate = (input: DisputeInput) => aiService.generateDisputeSummary(input, scenario)

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 bg-slate-950 p-6 text-slate-100 md:p-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">split - QVAC local AI MVP</h1>
        <p className="text-sm text-slate-400">
          Core flow: create contract {'->'} improve with local AI {'->'} dispute {'->'} AI summary.
        </p>
        <p className="text-xs text-slate-500">
          AI source: <span className="font-medium text-slate-300">{aiSource}</span> (fallback: off)
        </p>
      </header>

      <DemoScenarioSwitcher scenario={scenario} onChange={setScenario} />

      <section className="grid gap-6 md:grid-cols-2">
        <ContractCopilotPanel
          key={`contract-${scenario}`}
          scenario={scenario}
          onImprove={handleImprove}
        />
        <DisputeSummaryPanel
          key={`dispute-${scenario}`}
          scenario={scenario}
          onGenerate={handleGenerate}
        />
      </section>
    </main>
  )
}
