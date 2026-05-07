import type { FC, ReactNode } from 'react'
import {
  ArrowUpCircleIcon,
  BanknotesIcon,
  CalendarDateRangeIcon,
  CalendarDaysIcon,
  DocumentArrowUpIcon,
  DocumentCheckIcon,
  DocumentIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  ScaleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import type { Contract, ContractStatus } from '@/entities/contract'
import { findCountryByCode } from '@/shared/constants/countries'
import { findCurrencyByCode } from '@/shared/constants/currencies'
import { ConditionTile, type ConditionTileTone } from './ConditionTile'
import type { ContractSummaryDetailPayload } from './ContractParties'

interface ContractConditionsProps {
  contract: Contract
  onSelectDetail: (payload: ContractSummaryDetailPayload) => void
}

const STATUS_LABEL: Record<ContractStatus, string> = {
  DRAFT: 'Draft',
  PENDING_SIGNING: 'Pending signing',
  PARTIALLY_SIGNED: 'Partially signed',
  SIGNED: 'Signed',
  COMPLETED: 'Completed',
  DECLINED: 'Declined',
}

const STATUS_HELP: Record<ContractStatus, ReactNode> = {
  DRAFT: 'The contract is still a draft and has not been sent for signing yet.',
  PENDING_SIGNING:
    'Neither party has signed yet. Both Customer and Performer must sign with their wallets before work can begin under this agreement.',
  PARTIALLY_SIGNED:
    'One party has already signed. The other party still needs to sign with their wallet to continue.',
  SIGNED:
    'Both parties have signed. The Customer may confirm work completion when the deliverables are ready.',
  COMPLETED:
    'The Customer has confirmed completion. This agreement is fulfilled from a workflow perspective (payment release is out of scope for this MVP).',
  DECLINED: 'This contract was declined and is no longer active.',
}

const STATUS_TONE: Record<ContractStatus, ConditionTileTone> = {
  DRAFT: 'neutral',
  PENDING_SIGNING: 'info',
  PARTIALLY_SIGNED: 'warning',
  SIGNED: 'brand',
  COMPLETED: 'success',
  DECLINED: 'danger',
}

const statusIcon = (status: ContractStatus): ReactNode => {
  const className = 'h-6 w-6'
  switch (status) {
    case 'PENDING_SIGNING':
      return <ArrowUpCircleIcon className={className} />
    case 'PARTIALLY_SIGNED':
      return <DocumentArrowUpIcon className={className} />
    case 'SIGNED':
      return <DocumentTextIcon className={className} />
    case 'COMPLETED':
      return <DocumentCheckIcon className={className} />
    case 'DRAFT':
      return <DocumentIcon className={className} />
    case 'DECLINED':
      return <XCircleIcon className={className} />
  }
}

const formatDateDdMmYyyy = (iso: string | null): string => {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}.${month}.${year}`
}

const termDays = (start: string | null, end: string | null): number | null => {
  if (!start || !end) return null
  const a = new Date(start)
  const b = new Date(end)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null
  const ms = b.getTime() - a.getTime()
  const days = Math.round(ms / (24 * 60 * 60 * 1000))
  return Number.isFinite(days) ? Math.max(0, days) : null
}

const formatAmount = (amount: number, currency: string) => {
  const c = findCurrencyByCode(currency)
  const symbol = c?.symbol || c?.code || currency
  return `${amount} ${symbol}`
}

const additionalTermsPreview = (text: string): string => {
  const line = text.split('\n')[0]?.trim() || text
  if (line.length > 72) return `${line.slice(0, 72)}…`
  return line
}

export const ContractConditions: FC<ContractConditionsProps> = ({ contract, onSelectDetail }) => {
  const extraTerms = contract.additionalTerms
  const country = findCountryByCode(contract.jurisdictionCode)
  const jurisdictionValue = country ? `${country.emoji} ${country.name}` : contract.jurisdictionCode

  const days = termDays(contract.startDate, contract.endDate)
  const startFormatted = formatDateDdMmYyyy(contract.startDate)
  const endFormatted = formatDateDdMmYyyy(contract.endDate)

  const statusIconNode = statusIcon(contract.status)
  const statusTone = STATUS_TONE[contract.status]

  return (
    <section className="relative overflow-hidden flex flex-col gap-4 rounded-[var(--radius-xl)] border border-white/60 bg-white/65 backdrop-blur-md p-5 md:p-6 shadow-[var(--shadow-sm)]">
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-(--color-decor-mint) opacity-50 blur-3xl" />
      <h2 className="relative z-10 text-h3 text-(--color-text-primary)">Key terms</h2>

      <div className="relative z-10 flex flex-wrap gap-3">
        <ConditionTile
          icon={<BanknotesIcon />}
          title="Cost"
          value={formatAmount(contract.amount, contract.currency)}
          tone="success"
          onClick={() =>
            onSelectDetail({
              title: 'Cost',
              icon: <BanknotesIcon className="h-7 w-7" />,
              value: formatAmount(contract.amount, contract.currency),
              description:
                'Payment is released to the Performer only after the Customer confirms that the work has been completed.',
            })
          }
        />

        <ConditionTile
          icon={<CalendarDaysIcon />}
          title="Start date"
          value={startFormatted}
          tone="mint"
          onClick={() =>
            onSelectDetail({
              title: 'Start date',
              icon: <CalendarDaysIcon className="h-7 w-7" />,
              value: startFormatted,
              description:
                days !== null ? (
                  <p>
                    Planned duration: <strong>{days} days</strong> until the end date (
                    {endFormatted}).
                  </p>
                ) : (
                  <p>End date: {endFormatted}</p>
                ),
            })
          }
        />

        <ConditionTile
          icon={<CalendarDateRangeIcon />}
          title="End date"
          value={endFormatted}
          tone="peach"
          onClick={() =>
            onSelectDetail({
              title: 'End date',
              icon: <CalendarDateRangeIcon className="h-7 w-7" />,
              value: endFormatted,
              description:
                days !== null ? (
                  <p>
                    Work has to be completed in <strong>{days} days</strong>.
                  </p>
                ) : (
                  <p>
                    The end date defines when the engagement should be completed under this
                    agreement.
                  </p>
                ),
            })
          }
        />

        <ConditionTile
          icon={<ScaleIcon />}
          title="Jurisdiction"
          value={jurisdictionValue}
          tone="lavender"
          onClick={() =>
            onSelectDetail({
              title: 'Jurisdiction',
              icon: <ScaleIcon className="h-7 w-7" />,
              value: jurisdictionValue,
              description: (
                <p>
                  This agreement is governed by the laws of{' '}
                  <strong>{country?.name ?? contract.jurisdictionCode}</strong>.
                </p>
              ),
            })
          }
        />

        <ConditionTile
          icon={statusIconNode}
          title="Status"
          value={STATUS_LABEL[contract.status]}
          tone={statusTone}
          onClick={() =>
            onSelectDetail({
              title: 'Status',
              icon: statusIconNode,
              value: STATUS_LABEL[contract.status],
              description: STATUS_HELP[contract.status],
            })
          }
        />

        {extraTerms ? (
          <ConditionTile
            icon={<PencilSquareIcon />}
            title="Additional terms"
            value={additionalTermsPreview(extraTerms)}
            tone="info"
            onClick={() =>
              onSelectDetail({
                title: 'Additional terms',
                icon: <PencilSquareIcon className="h-7 w-7" />,
                value: additionalTermsPreview(extraTerms),
                description: <p className="whitespace-pre-wrap wrap-break-word">{extraTerms}</p>,
              })
            }
          />
        ) : null}
      </div>
    </section>
  )
}
