import { type FC, useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import type { Contract } from '@/entities/contract'
import { findCountryByCode } from '@/shared/constants/countries'
import { findCurrencyByCode } from '@/shared/constants/currencies'
import { Modal } from '@/shared/ui'
import { StatusBadge } from './StatusBadge'

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
      <header className="flex flex-col gap-2 bg-(--color-bg-secondary) rounded-[16px] border border-(--color-border-contract-card) p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col">
            <h1 className="md:text-[22px] text-[20px] font-bold text-(--color-text-dark-blue)">
              {contract.title}
            </h1>
            <span className="text-[13px] font-medium text-(--color-text-light-gray)">
              {contract.number}
            </span>
          </div>
          <StatusBadge status={contract.status} />
        </div>
        <p className="text-[14px] font-medium text-(--color-text-start-page) leading-snug">
          {contract.subject}
        </p>
      </header>

      <section className="bg-(--color-bg-secondary) rounded-[16px] border border-(--color-border-contract-card) p-5 flex flex-col gap-4">
        <h2 className="text-[15px] font-bold text-(--color-text-dark-blue)">Parties</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[contract.customer, contract.performer].map((party, idx) => {
            const role = idx === 0 ? 'Customer' : 'Performer'
            const signed =
              role === 'Customer' ? contract.signatures.customer : contract.signatures.performer
            return (
              <div
                key={role}
                className="rounded-[12px] bg-(--color-wrapper-container-bg) p-4 flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold uppercase tracking-wide text-(--color-role-text)">
                    {role}
                  </span>
                  {signed ? (
                    <span className="text-[11px] font-bold text-(--color-text-contract-signed)">
                      Signed
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-(--color-text-light-gray)">
                      Awaiting
                    </span>
                  )}
                </div>
                <div className="text-[14px] font-bold text-(--color-text-dark-blue)">
                  {party.fullName}
                </div>
                {party.companyName && (
                  <div className="text-[13px] font-medium text-(--color-text-start-page)">
                    {party.companyName}
                  </div>
                )}
                <div className="text-[13px] font-medium text-(--color-text-start-page)">
                  {party.email}
                </div>
                <div className="text-[12px] font-medium text-(--color-text-light-gray)">
                  Wallet: {truncateAddress(party.walletAddress)}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="bg-(--color-bg-secondary) rounded-[16px] border border-(--color-border-contract-card) p-5 flex flex-col gap-4">
        <h2 className="text-[15px] font-bold text-(--color-text-dark-blue)">Conditions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[13px]">
          <div className="flex justify-between gap-2">
            <span className="font-medium text-(--color-text-start-page)">Cost</span>
            <span className="font-bold text-(--color-text-dark-blue)">
              {formatAmount(contract.amount, contract.currency)}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="font-medium text-(--color-text-start-page)">Jurisdiction</span>
            <span className="font-bold text-(--color-text-dark-blue)">
              {country ? `${country.emoji} ${country.name}` : contract.jurisdictionCode}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="font-medium text-(--color-text-start-page)">Start date</span>
            <span className="font-bold text-(--color-text-dark-blue)">
              {formatDate(contract.startDate)}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="font-medium text-(--color-text-start-page)">End date</span>
            <span className="font-bold text-(--color-text-dark-blue)">
              {formatDate(contract.endDate)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-bold text-(--color-text-dark-blue)">
            Technical assignment
          </span>
          <pre
            className={`text-[13px] font-medium text-(--color-text-start-page) whitespace-pre-wrap wrap-break-word leading-snug bg-(--color-wrapper-container-bg) rounded-[12px] p-4 ${
              isAssignmentExpanded ? '' : 'max-h-[180px] overflow-hidden'
            }`}
            style={{ fontFamily: 'inherit' }}
          >
            {contract.technicalAssignment}
          </pre>
          <button
            type="button"
            onClick={() => setIsAssignmentExpanded((v) => !v)}
            className="self-start text-[13px] font-bold text-(--color-text-purple) cursor-pointer hover:opacity-80 flex items-center gap-1"
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
            <span className="text-[13px] font-bold text-(--color-text-dark-blue)">
              Additional terms
            </span>
            <p className="text-[13px] font-medium text-(--color-text-start-page) whitespace-pre-wrap leading-snug">
              {contract.additionalTerms}
            </p>
          </div>
        )}
      </section>

      <div className="flex flex-col md:flex-row gap-3">
        <button
          type="button"
          onClick={() => setIsContractOpen(true)}
          className="flex-1 h-[48px] rounded-[10px] border border-(--color-border-tertiary) bg-(--color-bg-secondary) text-[14px] font-bold text-(--color-text-dark-blue) flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
        >
          <DocumentTextIcon className="w-5 h-5" />
          View contract
        </button>
        {actions}
      </div>

      <Modal
        isOpen={isContractOpen}
        onClose={() => setIsContractOpen(false)}
        className="max-w-[720px] md:my-10"
      >
        <div className="flex flex-col gap-4 max-h-[80vh]">
          <h2 className="text-[20px] font-bold text-(--color-text-dark-blue)">Contract text</h2>
          <pre
            className="flex-1 overflow-y-auto whitespace-pre-wrap wrap-break-word text-[14px] font-medium text-(--color-text-black) leading-relaxed bg-(--color-wrapper-container-bg) rounded-[12px] p-4 custom-scrollbar"
            style={{ fontFamily: 'inherit' }}
          >
            {contract.text}
          </pre>
        </div>
      </Modal>
    </div>
  )
}
