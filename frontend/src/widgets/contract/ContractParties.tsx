import type { FC, ReactNode } from 'react'
import {
  CheckBadgeIcon,
  ClockIcon,
  UserCircleIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline'
import type { Contract, ContractParty, ContractSignature } from '@/entities/contract'

export interface ContractSummaryDetailPayload {
  title: string
  icon?: ReactNode
  value?: string
  description?: ReactNode
}

interface ContractPartiesProps {
  contract: Contract
  onSelectDetail: (payload: ContractSummaryDetailPayload) => void
}

const formatSignedAt = (iso: string): string => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${day}.${month}.${year} • ${hh}:${mm}`
}

const PartyCard: FC<{
  role: 'Customer' | 'Performer'
  party: ContractParty
  signature?: ContractSignature
  onSelect: () => void
}> = ({ role, party, signature, onSelect }) => {
  const RoleIcon = role === 'Customer' ? UserCircleIcon : WrenchScrewdriverIcon
  const isCustomer = role === 'Customer'
  const signed = !!signature

  const cardTone = isCustomer
    ? 'border-(--color-role-customer-border) bg-[linear-gradient(135deg,var(--color-role-customer-soft)_0%,rgba(255,255,255,0.85)_55%,rgba(255,255,255,0.95)_100%)]'
    : 'border-(--color-role-performer-border) bg-[linear-gradient(135deg,var(--color-role-performer-soft)_0%,rgba(255,255,255,0.85)_55%,rgba(255,255,255,0.95)_100%)]'

  const roleLabelColor = isCustomer
    ? 'text-(--color-role-customer-text)'
    : 'text-(--color-role-performer-text)'

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`
        group flex w-full min-w-0 min-h-[180px] flex-col gap-4
        rounded-[var(--radius-xl)] border p-4 md:p-5 text-left cursor-pointer
        backdrop-blur-md shadow-[var(--shadow-sm)]
        transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]
        ${cardTone}
      `}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[11px] font-bold uppercase tracking-[0.12em] ${roleLabelColor}`}>
          {role}
        </span>
        {signed ? (
          <span className="inline-flex items-center gap-1 rounded-(--radius-pill) bg-(--color-state-success-soft) px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-(--color-state-success)">
            <CheckBadgeIcon className="h-3.5 w-3.5" />
            Signed
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-(--radius-pill) bg-(--color-state-warning-soft) px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-(--color-state-warning)">
            <ClockIcon className="h-3.5 w-3.5" />
            Awaiting
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-(--color-surface-raised) shadow-[var(--shadow-sm)] ${roleLabelColor}`}
        >
          <RoleIcon className="h-7 w-7" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 flex flex-col gap-0.5">
          <div className="text-body font-bold text-(--color-text-primary) wrap-break-word leading-tight">
            {party.fullName || '—'}
          </div>
          {party.companyName ? (
            <div className="text-[12.5px] font-medium text-(--color-text-secondary) wrap-break-word">
              {party.companyName}
            </div>
          ) : null}
        </div>
      </div>

      <div
        className={`mt-auto flex items-center gap-2 rounded-(--radius-md) px-3 py-2.5 text-[12px] ${
          signed
            ? 'bg-(--color-state-success-soft)/70 text-(--color-state-success)'
            : 'bg-(--color-surface-muted)/80 text-(--color-text-muted)'
        }`}
      >
        {signed ? (
          <>
            <CheckBadgeIcon className="h-4 w-4 shrink-0" />
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="text-[10px] uppercase tracking-wide opacity-80">Signed at</span>
              <span className="font-bold font-mono">{formatSignedAt(signature.signedAt)}</span>
            </div>
          </>
        ) : (
          <>
            <ClockIcon className="h-4 w-4 shrink-0" />
            <span className="font-medium">Awaiting wallet signature</span>
          </>
        )}
      </div>
    </button>
  )
}

export const ContractParties: FC<ContractPartiesProps> = ({ contract, onSelectDetail }) => {
  const openParty = (
    role: 'Customer' | 'Performer',
    party: ContractParty,
    signature?: ContractSignature,
  ) => {
    const RoleIcon = role === 'Customer' ? UserCircleIcon : WrenchScrewdriverIcon
    const signed = !!signature
    onSelectDetail({
      title: role,
      icon: <RoleIcon className="h-7 w-7" />,
      value: party.fullName,
      description: (
        <div className="flex flex-col gap-3">
          {party.companyName ? (
            <div>
              <span className="font-bold text-(--color-text-primary)">Company: </span>
              {party.companyName}
            </div>
          ) : null}
          <div>
            <span className="font-bold text-(--color-text-primary)">Email: </span>
            {party.email || '—'}
          </div>
          <div className="wrap-break-word font-mono text-[13px]">
            <span className="font-bold text-(--color-text-primary) font-sans">Wallet: </span>
            {party.walletAddress || '—'}
          </div>
          {signed && signature ? (
            <div className="rounded-(--radius-md) bg-(--color-state-success-soft) px-3 py-2 text-[12.5px] text-(--color-state-success)">
              <div className="text-[10px] uppercase tracking-wide opacity-80">Signed at</div>
              <div className="font-bold font-mono">{formatSignedAt(signature.signedAt)}</div>
            </div>
          ) : (
            <div className="text-caption text-(--color-text-muted)">
              This party has not signed yet. They will need to connect the same wallet and sign.
            </div>
          )}
        </div>
      ),
    })
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-h3 text-(--color-text-primary) px-1">Parties</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <PartyCard
          role="Customer"
          party={contract.customer}
          signature={contract.signatures.customer}
          onSelect={() => openParty('Customer', contract.customer, contract.signatures.customer)}
        />
        <PartyCard
          role="Performer"
          party={contract.performer}
          signature={contract.signatures.performer}
          onSelect={() => openParty('Performer', contract.performer, contract.signatures.performer)}
        />
      </div>
    </section>
  )
}
