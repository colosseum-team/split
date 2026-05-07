import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { findCurrencyByCode } from '@/shared/constants/currencies'
import { findCountryByCode } from '@/shared/constants/countries'
import type { Contract } from '@/entities/contract'
import { Card, StatusBadge } from '@/shared/ui'

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
    <Card
      as="button"
      type="button"
      onClick={() => navigate(`/contracts/${contract.id}`)}
      padding="sm"
      interactive
      className="w-full min-w-0 text-left"
    >
      <div className="flex flex-row items-start justify-between gap-4 min-w-0 mb-2">
        <div className="flex-1 min-w-0">
          <div className="text-h3 text-(--color-text-primary) wrap-break-word">
            {contract.title}
          </div>
          <div className="text-caption text-(--color-text-muted) mt-0.5">{contract.number}</div>
        </div>
        <div className="shrink-0">
          <StatusBadge status={contract.status} />
        </div>
      </div>

      <div className="flex flex-col gap-1 text-[13px] text-(--color-text-secondary)">
        <div className="flex justify-between gap-2">
          <span className="font-medium">{counterpartyLabel}</span>
          <span className="font-bold text-(--color-text-primary) truncate max-w-[60%]">
            {counterparty.companyName || counterparty.fullName}
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="font-medium">Amount</span>
          <span className="font-bold text-(--color-text-primary)">
            {formatAmount(contract.amount, contract.currency)}
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="font-medium">Jurisdiction</span>
          <span className="font-bold text-(--color-text-primary)">
            {country ? `${country.emoji} ${country.code}` : contract.jurisdictionCode}
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="font-medium">Created</span>
          <span className="font-bold text-(--color-text-primary)">
            {formatDate(contract.createdAt)}
          </span>
        </div>
      </div>
    </Card>
  )
}
