import { useState } from 'react'
import { scenarioPresets } from '../../ai/demoScenarios'
import type { DemoScenario, DisputeBriefResult, DisputeInput } from '../../ai/types'

type DisputeSummaryPanelProps = {
  scenario: DemoScenario
  onGenerate: (input: DisputeInput) => Promise<DisputeBriefResult>
}

type RequestState = 'idle' | 'loading' | 'success' | 'error'

const emptyInput: DisputeInput = {
  requirementSnapshot: [],
  submissionSummary: '',
  conversation: [],
}

const getInitialInput = (scenario: DemoScenario): DisputeInput =>
  scenario === 'off' ? emptyInput : scenarioPresets[scenario].disputeInput

export function DisputeSummaryPanel({ scenario, onGenerate }: DisputeSummaryPanelProps) {
  const [input, setInput] = useState<DisputeInput>(() => getInitialInput(scenario))
  const [requestState, setRequestState] = useState<RequestState>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [result, setResult] = useState<DisputeBriefResult | null>(null)

  const handleGenerate = async () => {
    try {
      setRequestState('loading')
      setErrorMessage('')
      const response = await onGenerate(input)
      setResult(response)
      setRequestState('success')
    } catch (error) {
      setRequestState('error')
      setErrorMessage(error instanceof Error ? error.message : 'Failed to run dispute summary.')
    }
  }

  const copyJson = async () => {
    if (!result) return
    await navigator.clipboard.writeText(JSON.stringify(result, null, 2))
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-100">Dispute Summary</h2>
        <p className="text-sm text-slate-400">
          Generate dispute summary (local) from requirements, submission, and conversation.
        </p>
      </header>

      <div className="grid gap-3">
        <label className="text-sm text-slate-300">
          Requirement snapshot
          <textarea
            value={input.requirementSnapshot.join('\n')}
            onChange={(event) =>
              setInput((prev) => ({
                ...prev,
                requirementSnapshot: event.target.value
                  .split('\n')
                  .map((line) => line.trim())
                  .filter(Boolean),
              }))
            }
            className="mt-1 h-24 w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100"
          />
        </label>
        <label className="text-sm text-slate-300">
          Submission summary
          <textarea
            value={input.submissionSummary}
            onChange={(event) =>
              setInput((prev) => ({ ...prev, submissionSummary: event.target.value }))
            }
            className="mt-1 h-20 w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100"
          />
        </label>
        <label className="text-sm text-slate-300">
          Conversation
          <textarea
            value={input.conversation.join('\n')}
            onChange={(event) =>
              setInput((prev) => ({
                ...prev,
                conversation: event.target.value
                  .split('\n')
                  .map((line) => line.trim())
                  .filter(Boolean),
              }))
            }
            className="mt-1 h-24 w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={scenario === 'off' || requestState === 'loading'}
          onClick={handleGenerate}
          className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          Generate dispute summary (local)
        </button>
        <button
          type="button"
          disabled={!result}
          onClick={copyJson}
          className="rounded-md border border-slate-500 px-4 py-2 text-sm font-medium text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Copy JSON
        </button>
      </div>

      {requestState === 'loading' && <p className="text-sm text-slate-400">Local processing...</p>}
      {requestState === 'error' && <p className="text-sm text-rose-400">{errorMessage}</p>}

      {requestState === 'success' && result && (
        <div className="space-y-3 rounded-xl border border-slate-700 bg-slate-950/60 p-4 text-sm text-slate-300">
          <p>
            Similarity score:{' '}
            <span className="font-semibold text-emerald-300">{result.similarityScore}/100</span>
          </p>
          <p>{result.caseSummary}</p>
          <div>
            <p className="font-medium text-slate-200">Matches and gaps</p>
            <ul>
              {result.matchesAndGaps.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-medium text-slate-200">Recommended resolution</p>
            <p>{result.recommendedResolution}</p>
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
