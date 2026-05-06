import { useMemo, useState } from 'react'
import { demoLocalAiAdapter } from '../../../features/ai/adapters/demoLocalAiAdapter'
import { createLocalAiService } from '../../../features/ai/service'
import type { ContractDraft, DemoScenario, DisputeInput } from '../../../features/ai/types'
import { ContractCopilotPanel } from '../../../features/contracts/components/ContractCopilotPanel'
import { DemoScenarioSwitcher } from '../../../features/demo/DemoScenarioSwitcher'
import { DisputeSummaryPanel } from '../../../features/disputes/components/DisputeSummaryPanel'

export function HomePage() {
  const [scenario, setScenario] = useState<DemoScenario>('design')
  const aiService = useMemo(() => createLocalAiService(demoLocalAiAdapter), [])

  const handleImprove = (input: ContractDraft) => aiService.improveContract(input, scenario)
  const handleGenerate = (input: DisputeInput) => aiService.generateDisputeSummary(input, scenario)

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 bg-slate-950 p-6 text-slate-100 md:p-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">split - QVAC local AI MVP</h1>
        <p className="text-sm text-slate-400">
          Core flow: create contract {'->'} improve with local AI {'->'} dispute {'->'} AI summary.
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
