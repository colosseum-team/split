import { type FC, useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import type { Contract } from '@/entities/contract'
import { findCountryByCode } from '@/shared/constants/countries'
import { findCurrencyByCode } from '@/shared/constants/currencies'
import { Button, Card, Modal, StatusBadge } from '@/shared/ui'

interface ContractSummaryProps {
  contract: Contract
  /** Optional slot in the action area (sign / decline / confirm completion). */
  actions?: React.ReactNode
}

const formatDate = (iso: string | null) => {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB')
}

const formatAmount = (amount: number, currency: string) => {
  const c = findCurrencyByCode(currency)
  const symbol = c?.symbol || c?.code || currency
  return `${amount} ${symbol}`
}

const truncateAddress = (address: string | undefined) =>
  !address ? '—' : `${address.slice(0, 4)}…${address.slice(-4)}`

export const ContractSummary: FC<ContractSummaryProps> = ({ contract, actions }) => {
  const [isContractOpen, setIsContractOpen] = useState(false)
  const [isAssignmentExpanded, setIsAssignmentExpanded] = useState(false)

  const country = findCountryByCode(contract.jurisdictionCode)

  return (
    <div className="flex flex-col gap-5 w-full max-w-[680px] mx-auto">
      <Card as="header" className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col">
            <h1 className="text-h2 text-(--color-text-primary)">{contract.title}</h1>
            <span className="text-caption text-(--color-text-muted)">{contract.number}</span>
          </div>
          <StatusBadge status={contract.status} />
        </div>
        <p className="text-body text-(--color-text-secondary)">{contract.subject}</p>
      </Card>

      <Card as="section" className="flex flex-col gap-4">
        <h2 className="text-h3 text-(--color-text-primary)">Parties</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[contract.customer, contract.performer].map((party, idx) => {
            const role = idx === 0 ? 'Customer' : 'Performer'
            const signed =
              role === 'Customer' ? contract.signatures.customer : contract.signatures.performer
            return (
              <div
                key={role}
                className="rounded-[var(--radius-md)] bg-(--color-surface-muted) p-4 flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-caption font-bold uppercase tracking-wide text-(--color-text-muted)">
                    {role}
                  </span>
                  {signed ? (
                    <span className="text-[11px] font-bold text-(--color-state-success)">
                      Signed
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-(--color-text-muted)">
                      Awaiting
                    </span>
                  )}
                </div>
                <div className="text-body font-bold text-(--color-text-primary)">
                  {party.fullName}
                </div>
                {party.companyName && (
                  <div className="text-[13px] font-medium text-(--color-text-secondary)">
                    {party.companyName}
                  </div>
                )}
                <div className="text-[13px] font-medium text-(--color-text-secondary)">
                  {party.email}
                </div>
                <div className="text-mono text-(--color-text-muted)">
                  Wallet: {truncateAddress(party.walletAddress)}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <Card as="section" className="flex flex-col gap-4">
        <h2 className="text-h3 text-(--color-text-primary)">Conditions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[13px]">
          <div className="flex justify-between gap-2">
            <span className="font-medium text-(--color-text-secondary)">Cost</span>
            <span className="font-bold text-(--color-text-primary)">
              {formatAmount(contract.amount, contract.currency)}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="font-medium text-(--color-text-secondary)">Jurisdiction</span>
            <span className="font-bold text-(--color-text-primary)">
              {country ? `${country.emoji} ${country.name}` : contract.jurisdictionCode}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="font-medium text-(--color-text-secondary)">Start date</span>
            <span className="font-bold text-(--color-text-primary)">
              {formatDate(contract.startDate)}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="font-medium text-(--color-text-secondary)">End date</span>
            <span className="font-bold text-(--color-text-primary)">
              {formatDate(contract.endDate)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-bold text-(--color-text-primary)">
            Technical assignment
          </span>
          <pre
            className={`text-[13px] font-medium text-(--color-text-secondary) whitespace-pre-wrap wrap-break-word leading-snug bg-(--color-surface-muted) rounded-[var(--radius-md)] p-4 ${
              isAssignmentExpanded ? '' : 'max-h-[180px] overflow-hidden'
            }`}
            style={{ fontFamily: 'inherit' }}
          >
            {contract.technicalAssignment}
          </pre>
          <button
            type="button"
            onClick={() => setIsAssignmentExpanded((v) => !v)}
            className="self-start text-[13px] font-bold text-(--color-brand) cursor-pointer hover:opacity-80 flex items-center gap-1"
          >
            {isAssignmentExpanded ? (
              <>
                Hide <ChevronUpIcon className="w-4 h-4" />
              </>
            ) : (
              <>
                Read more <ChevronDownIcon className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {contract.additionalTerms && (
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-bold text-(--color-text-primary)">
              Additional terms
            </span>
            <p className="text-[13px] font-medium text-(--color-text-secondary) whitespace-pre-wrap leading-snug">
              {contract.additionalTerms}
            </p>
          </div>
        )}
      </Card>

      <div className="flex flex-col md:flex-row gap-3">
        <Button
          onClick={() => setIsContractOpen(true)}
          variant="secondary"
          size="lg"
          className="flex-1"
        >
          <DocumentTextIcon className="w-5 h-5" />
          View contract
        </Button>
        {actions}
      </div>

      <Modal
        isOpen={isContractOpen}
        onClose={() => setIsContractOpen(false)}
        className="max-w-[720px] md:my-10"
      >
        <div className="flex flex-col gap-4 max-h-[80vh]">
          <h2 className="text-h2 text-(--color-text-primary)">Contract text</h2>
          <pre
            className="flex-1 overflow-y-auto whitespace-pre-wrap wrap-break-word text-body text-(--color-text-primary) bg-(--color-surface-muted) rounded-[var(--radius-md)] p-4 custom-scrollbar"
            style={{ fontFamily: 'inherit' }}
          >
            {contract.text}
          </pre>
        </div>
      </Modal>
    </div>
  )
}
