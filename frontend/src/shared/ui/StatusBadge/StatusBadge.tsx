import type { FC } from 'react'
import type { ContractStatus } from '@/entities/contract'
import { Badge, type BadgeTone } from '../Badge'

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

const STATUS_TONE: Record<ContractStatus, BadgeTone> = {
  DRAFT: 'neutral',
  PENDING_SIGNING: 'info',
  PARTIALLY_SIGNED: 'brand',
  SIGNED: 'success',
  COMPLETED: 'success',
  DECLINED: 'neutral',
}

export const StatusBadge: FC<StatusBadgeProps> = ({ status, className = '' }) => {
  return (
    <Badge tone={STATUS_TONE[status]} className={className}>
      {STATUS_TEXT[status]}
    </Badge>
  )
}
