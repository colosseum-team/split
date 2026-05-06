import type { FC } from 'react'
import type { ContractStatus } from '@/entities/contract'

interface StatusBadgeProps {
  status: ContractStatus
  className?: string
}

const STATUS_TEXT: Record<ContractStatus, string> = {
  DRAFT: 'Draft',
  PENDING_SIGNING: 'Pending signing',
  PARTIALLY_SIGNED: 'Partially signed',
  SIGNED: 'Signed',
  COMPLETED: 'Completed',
  DECLINED: 'Declined',
}

const STATUS_BG: Record<ContractStatus, string> = {
  DRAFT: 'bg-(--color-bg-contract-draft)',
  PENDING_SIGNING: 'bg-(--color-bg-contract-pending)',
  PARTIALLY_SIGNED: 'bg-(--color-bg-contract-partially-signed)',
  SIGNED: 'bg-(--color-bg-contract-signed)',
  COMPLETED: 'bg-(--color-bg-contract-completed)',
  DECLINED: 'bg-(--color-bg-contract-declined)',
}

const STATUS_TEXT_COLOR: Record<ContractStatus, string> = {
  DRAFT: 'text-(--color-text-contract-draft)',
  PENDING_SIGNING: 'text-(--color-text-contract-pending)',
  PARTIALLY_SIGNED: 'text-(--color-text-contract-partially-signed)',
  SIGNED: 'text-(--color-text-contract-signed)',
  COMPLETED: 'text-(--color-text-contract-completed)',
  DECLINED: 'text-(--color-text-contract-declined)',
}

export const StatusBadge: FC<StatusBadgeProps> = ({ status, className = '' }) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-[8px] text-[12px] font-bold whitespace-nowrap ${STATUS_BG[status]} ${STATUS_TEXT_COLOR[status]} ${className}`}
    >
      {STATUS_TEXT[status]}
    </span>
  )
}
