import { useMemo, useState } from 'react'
import type { ContractCopilotResult, ContractDraft, DemoScenario } from '../../ai/types'
import { scenarioPresets } from '../../ai/demoScenarios'

type ContractCopilotPanelProps = {
  scenario: DemoScenario
  onImprove: (input: ContractDraft) => Promise<ContractCopilotResult>
  sourceText?: string
  onApplyScope?: (value: string) => void
}

type RequestState = 'idle' | 'loading' | 'success' | 'error'

const emptyDraft: ContractDraft = {
  scope: '',
  deliverables: '',
  timeline: '',
  paymentTerms: '',
}

const getInitialDraft = (scenario: DemoScenario): ContractDraft =>
  scenario === 'off' ? emptyDraft : scenarioPresets[scenario].contractDraft

export function ContractCopilotPanel({
  scenario,
  onImprove,
  sourceText,
  onApplyScope,
}: ContractCopilotPanelProps) {
  const [draft, setDraft] = useState<ContractDraft>(() => getInitialDraft(scenario))
  const [requestState, setRequestState] = useState<RequestState>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [result, setResult] = useState<ContractCopilotResult | null>(null)
  const [selectedRewrites, setSelectedRewrites] = useState<number[]>([])

  const isDisabled = scenario === 'off' || requestState === 'loading'
  const scenarioLabel = useMemo(
    () => (scenario === 'off' ? 'off' : scenarioPresets[scenario].label),
    [scenario],
  )

  const toggleRewrite = (index: number) => {
    setSelectedRewrites((prev) =>
      prev.includes(index) ? prev.filter((item) => item !== index) : [...prev, index],
    )
  }

  const handleImprove = async () => {
    try {
      setRequestState('loading')
      setErrorMessage('')
      const response = await onImprove({
        ...draft,
        scope: sourceText ?? draft.scope,
      })
      setResult(response)
      setSelectedRewrites(response.rewriteSuggestions.map((_, index) => index))
      setRequestState('success')
    } catch (error) {
      setRequestState('error')
      setErrorMessage(error instanceof Error ? error.message : 'Failed to run local AI analysis.')
    }
  }

  const applySelected = () => {
    if (!result) return
    const selected = result.rewriteSuggestions.filter((_, index) =>
      selectedRewrites.includes(index),
    )
    if (selected.length === 0) return
    const nextScope = sourceText
      ? selected.join('\n\n')
      : `${draft.scope}\n\n- ${selected.join('\n- ')}`
    if (onApplyScope) {
      onApplyScope(nextScope)
      return
    }
    setDraft((prev) => ({ ...prev, scope: nextScope }))
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-100">Contract Copilot</h2>
        <p className="text-sm text-slate-400">
          Improve with local AI for clearer scope, acceptance criteria, and risk checks.
        </p>
      </header>

      {scenario !== 'off' && (
        <p className="rounded-md border border-sky-700/70 bg-sky-950/40 px-3 py-2 text-xs text-sky-300">
          Using local demo scenario data: {scenarioLabel}
        </p>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm text-slate-300">
          Scope
          <textarea
            value={sourceText ?? draft.scope}
            onChange={(event) => setDraft((prev) => ({ ...prev, scope: event.target.value }))}
            readOnly={!!sourceText}
            className="mt-1 h-24 w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100"
          />
        </label>
        <label className="text-sm text-slate-300">
          Deliverables
          <textarea
            value={draft.deliverables}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, deliverables: event.target.value }))
            }
            className="mt-1 h-24 w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100"
          />
        </label>
        <label className="text-sm text-slate-300">
          Timeline
          <input
            value={draft.timeline}
            onChange={(event) => setDraft((prev) => ({ ...prev, timeline: event.target.value }))}
            className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100"
          />
        </label>
        <label className="text-sm text-slate-300">
          Payment terms
          <input
            value={draft.paymentTerms}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, paymentTerms: event.target.value }))
            }
            className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={isDisabled}
          onClick={handleImprove}
          className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          Improve with local AI
        </button>
        <button
          type="button"
          disabled={!result || requestState === 'loading'}
          onClick={applySelected}
          className="rounded-md border border-slate-500 px-4 py-2 text-sm font-medium text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Apply selected suggestions
        </button>
      </div>

      {requestState === 'loading' && <p className="text-sm text-slate-400">Local processing...</p>}
      {requestState === 'error' && <p className="text-sm text-rose-400">{errorMessage}</p>}

      {requestState === 'success' && result && (
        <div className="space-y-3 rounded-xl border border-slate-700 bg-slate-950/60 p-4">
          <p className="text-sm text-slate-300">
            Risk score: <span className="font-semibold text-amber-300">{result.riskScore}/100</span>
          </p>
          <ul className="space-y-1 text-sm text-slate-300">
            {result.riskFactors.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-200">Ambiguities</p>
            <ul className="text-sm text-slate-300">
              {result.ambiguities.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-200">Rewrite suggestions</p>
            {result.rewriteSuggestions.map((item, index) => (
              <label key={item} className="flex items-start gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={selectedRewrites.includes(index)}
                  onChange={() => toggleRewrite(index)}
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-200">Acceptance criteria</p>
            <ul className="text-sm text-slate-300">
              {result.acceptanceCriteria.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-slate-500">
            source: {result.metadata.source} | scenario: {result.metadata.scenario} | model:{' '}
            {result.metadata.model}
          </p>
        </div>
      )}
    </section>
  )
}
