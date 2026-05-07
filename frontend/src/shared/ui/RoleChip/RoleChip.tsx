import type { UserRole } from '@/entities/user'

interface RoleChipProps {
  role: UserRole | null
  className?: string
}

const ROLE_LABEL: Record<UserRole, string> = {
  customer: 'Customer',
  performer: 'Performer',
}

const ROLE_DOT: Record<UserRole, string> = {
  customer: 'bg-(--color-role-customer)',
  performer: 'bg-(--color-role-performer)',
}

export function RoleChip({ role, className = '' }: RoleChipProps) {
  if (!role) return null

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-(--color-surface-muted) px-2.5 py-1 text-[12px] font-bold text-(--color-text-secondary) ${className}`}
    >
      <span className={`h-2 w-2 rounded-full ${ROLE_DOT[role]}`} />
      {ROLE_LABEL[role]}
    </span>
  )
}
