import type { DemoScenario } from '../ai/types'

type DemoScenarioSwitcherProps = {
  scenario: DemoScenario
  onChange: (scenario: DemoScenario) => void
}

export function DemoScenarioSwitcher({ scenario, onChange }: DemoScenarioSwitcherProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/80 p-4">
      <span className="text-sm font-medium text-slate-300">Demo scenario mode</span>
      <select
        value={scenario}
        onChange={(event) => onChange(event.target.value as DemoScenario)}
        className="rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100"
      >
        <option value="off">Off</option>
        <option value="design">Design Landing Page</option>
        <option value="logo">Logo Package</option>
      </select>
      <span className="rounded bg-emerald-600/20 px-2 py-1 text-xs text-emerald-300">
        {scenario === 'off' ? 'Normal flow' : 'Local AI only'}
      </span>
    </div>
  )
}
