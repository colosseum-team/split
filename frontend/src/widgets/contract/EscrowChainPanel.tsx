import type { FC } from 'react'
import type { Contract } from '@/entities/contract'

interface EscrowChainPanelProps {
  contract: Contract
}

const EXPLORER_BASE = 'https://explorer.solana.com'
const EXPLORER_CLUSTER = '?cluster=devnet'

const truncate = (s: string, head = 8, tail = 8) =>
  s.length <= head + tail ? s : `${s.slice(0, head)}…${s.slice(-tail)}`

const Pill: FC<{
  children: React.ReactNode
  tone: 'pending' | 'mock' | 'live' | 'completed' | 'error'
}> = ({ children, tone }) => {
  const palette = {
    pending: 'bg-amber-100 text-amber-900 border-amber-300',
    mock: 'bg-slate-100 text-slate-700 border-slate-300',
    live: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    completed: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    error: 'bg-rose-100 text-rose-900 border-rose-300',
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${palette[tone]}`}
    >
      {children}
    </span>
  )
}

const Row: FC<{ label: string; value: React.ReactNode; mono?: boolean }> = ({
  label,
  value,
  mono = true,
}) => (
  <div className="flex items-start justify-between gap-3 py-1.5 border-b border-(--color-border-subtle) last:border-b-0">
    <span className="text-[12px] font-semibold uppercase tracking-wide text-(--color-text-muted) shrink-0 pt-0.5">
      {label}
    </span>
    <span
      className={`text-[13px] text-(--color-text-primary) text-right break-all ${mono ? 'font-mono' : ''}`}
    >
      {value}
    </span>
  </div>
)

export const EscrowChainPanel: FC<EscrowChainPanelProps> = ({ contract }) => {
  // Don't render anything for contracts that pre-date chain wiring (no
  // backend POST was attempted) and aren't currently being attempted.
  const hasAttempt =
    contract.chainMode || contract.chainError || contract.onchainAddress || contract.backendId
  if (!hasAttempt) return null

  const isLive = contract.chainMode === 'solana'
  const isMock = contract.chainMode === 'mock'
  const isError = !!contract.chainError && !contract.chainMode
  const isPending = !contract.chainMode && !contract.chainError
  const isCompleted = isLive && !!contract.releaseTxSignature

  const explorerAccount = (addr: string) =>
    isLive ? `${EXPLORER_BASE}/address/${addr}${EXPLORER_CLUSTER}` : null
  const explorerTx = (sig: string) =>
    isLive ? `${EXPLORER_BASE}/tx/${sig}${EXPLORER_CLUSTER}` : null

  return (
    <section
      className="rounded-[var(--radius-xl)] border border-(--color-border-subtle) bg-(--color-surface-raised)/95 p-4 sm:p-5 shadow-[var(--shadow-sm)] backdrop-blur-sm space-y-3"
      aria-label="On-chain escrow"
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-[15px] font-bold text-(--color-text-primary)">On-chain escrow</h3>
        {isPending && <Pill tone="pending">Linking…</Pill>}
        {isMock && <Pill tone="mock">Mock chain</Pill>}
        {isLive && !isCompleted && <Pill tone="live">Solana devnet</Pill>}
        {isCompleted && <Pill tone="completed">Completed</Pill>}
        {isError && <Pill tone="error">Error</Pill>}
      </div>

      {isPending && (
        <p className="text-[13px] text-(--color-text-secondary)">
          The SPA is asking the backend to record this contract and (in solana mode) the wallet to
          sign the escrow initialize tx. This usually completes in a few seconds.
        </p>
      )}

      {isError && (
        <p className="text-[13px] text-rose-900">
          {contract.chainError}
          <br />
          <span className="text-(--color-text-muted)">
            The contract is still saved locally — chain link can be retried later.
          </span>
        </p>
      )}

      {(isMock || isLive) && (
        <div className="flex flex-col">
          {contract.backendId && <Row label="Backend id" value={truncate(contract.backendId)} />}
          {contract.onchainAddress && (
            <Row
              label="Escrow PDA"
              value={
                explorerAccount(contract.onchainAddress) ? (
                  <a
                    href={explorerAccount(contract.onchainAddress)!}
                    target="_blank"
                    rel="noreferrer"
                    className="text-(--color-brand) hover:underline"
                  >
                    {truncate(contract.onchainAddress, 12, 12)}
                  </a>
                ) : (
                  truncate(contract.onchainAddress, 12, 12)
                )
              }
            />
          )}
          {contract.initTxSignature && (
            <Row
              label="Init tx"
              value={
                explorerTx(contract.initTxSignature) ? (
                  <a
                    href={explorerTx(contract.initTxSignature)!}
                    target="_blank"
                    rel="noreferrer"
                    className="text-(--color-brand) hover:underline"
                  >
                    {truncate(contract.initTxSignature, 12, 12)}
                  </a>
                ) : (
                  truncate(contract.initTxSignature, 12, 12)
                )
              }
            />
          )}
          {contract.fundTxSignature && (
            <Row
              label="Fund tx"
              value={
                explorerTx(contract.fundTxSignature) ? (
                  <a
                    href={explorerTx(contract.fundTxSignature)!}
                    target="_blank"
                    rel="noreferrer"
                    className="text-(--color-brand) hover:underline"
                  >
                    {truncate(contract.fundTxSignature, 12, 12)}
                  </a>
                ) : (
                  truncate(contract.fundTxSignature, 12, 12)
                )
              }
            />
          )}
          {contract.releaseTxSignature && (
            <Row
              label="Release tx"
              value={
                explorerTx(contract.releaseTxSignature) ? (
                  <a
                    href={explorerTx(contract.releaseTxSignature)!}
                    target="_blank"
                    rel="noreferrer"
                    className="text-(--color-brand) hover:underline"
                  >
                    {truncate(contract.releaseTxSignature, 12, 12)}
                  </a>
                ) : (
                  truncate(contract.releaseTxSignature, 12, 12)
                )
              }
            />
          )}
          {contract.submissionPayload && (
            <Row
              label="Submitted work"
              mono={false}
              value={
                <span className="text-(--color-text-primary) break-words">
                  {contract.submissionPayload.length > 160
                    ? `${contract.submissionPayload.slice(0, 160)}…`
                    : contract.submissionPayload}
                </span>
              }
            />
          )}
          {contract.textHash && (
            <Row label="Text hash (sha256)" value={truncate(contract.textHash, 10, 10)} />
          )}
        </div>
      )}

      {isMock && (
        <p className="text-[12px] text-(--color-text-muted)">
          Backend is running with <code className="font-mono text-[11px]">MOCK_CHAIN=true</code> —
          the addresses above are deterministic stubs, not real Solana accounts. Switch the backend
          to <code className="font-mono text-[11px]">MOCK_CHAIN=false</code> after the Anchor
          program is deployed to devnet for live txs.
        </p>
      )}
    </section>
  )
}
