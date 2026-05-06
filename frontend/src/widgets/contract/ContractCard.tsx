import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { findCurrencyByCode } from '@/shared/constants/currencies'
import { findCountryByCode } from '@/shared/constants/countries'
import type { Contract } from '@/entities/contract'
import { StatusBadge } from './StatusBadge'

interface ContractCardProps {
  contract: Contract
  /** wallet of the current user — to render correct counterparty name */
  currentWallet?: string | null
}

const formatDate = (iso: string) => {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-GB')
}

const formatAmount = (amount: number, currency: string) => {
  const c = findCurrencyByCode(currency)
  const symbol = c?.symbol || c?.code || currency
  return `${amount} ${symbol}`
}

export const ContractCard: FC<ContractCardProps> = ({ contract, currentWallet }) => {
  const navigate = useNavigate()

  const isCurrentCustomer = currentWallet && contract.customer.walletAddress === currentWallet
  const counterparty = isCurrentCustomer ? contract.performer : contract.customer
  const counterpartyLabel = isCurrentCustomer ? 'Performer' : 'Customer'
  const country = findCountryByCode(contract.jurisdictionCode)

  return (
    <button
      type="button"
      onClick={() => navigate(`/contracts/${contract.id}`)}
      className="rounded-[16px] w-full bg-(--color-bg-secondary) border border-(--color-border-contract-card) p-4 cursor-pointer hover:opacity-90 transition-opacity min-w-0 text-left"
    >
      <div className="flex flex-row items-start justify-between gap-4 min-w-0 mb-2">
        <div className="flex-1 min-w-0">
          <div className="text-[16px] font-bold text-(--color-text-black) wrap-break-word">
            {contract.title}
          </div>
          <div className="text-[13px] font-medium text-(--color-text-light-gray) mt-0.5">
            {contract.number}
          </div>
        </div>
        <div className="shrink-0">
          <StatusBadge status={contract.status} />
        </div>
      </div>

      <div className="flex flex-col gap-1 text-[13px] text-(--color-text-start-page)">
        <div className="flex justify-between gap-2">
          <span className="font-medium">{counterpartyLabel}</span>
          <span className="font-bold text-(--color-text-dark-blue) truncate max-w-[60%]">
            {counterparty.companyName || counterparty.fullName}
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="font-medium">Amount</span>
          <span className="font-bold text-(--color-text-dark-blue)">
            {formatAmount(contract.amount, contract.currency)}
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="font-medium">Jurisdiction</span>
          <span className="font-bold text-(--color-text-dark-blue)">
            {country ? `${country.emoji} ${country.code}` : contract.jurisdictionCode}
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="font-medium">Created</span>
          <span className="font-bold text-(--color-text-dark-blue)">
            {formatDate(contract.createdAt)}
          </span>
        </div>
      </div>
    </button>
  )
}
