import type { HTMLAttributes, ReactNode } from 'react'

export type BadgeTone =
  | 'success'
  | 'info'
  | 'warning'
  | 'danger'
  | 'neutral'
  | 'brand'
  | 'role-customer'
  | 'role-performer'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
  tone?: BadgeTone
}

const TONE: Record<BadgeTone, string> = {
  success: 'bg-(--color-state-success-soft) text-(--color-state-success)',
  info: 'bg-(--color-state-info-soft) text-(--color-state-info)',
  warning: 'bg-(--color-state-warning-soft) text-(--color-state-warning)',
  danger: 'bg-(--color-state-danger-soft) text-(--color-state-danger)',
  neutral: 'bg-(--color-state-neutral-soft) text-(--color-state-neutral)',
  brand: 'bg-(--color-brand-soft) text-(--color-brand)',
  'role-customer': 'bg-(--color-role-customer-soft) text-(--color-role-customer-text)',
  'role-performer': 'bg-(--color-role-performer-soft) text-(--color-role-performer-text)',
}

export function Badge({ children, tone = 'neutral', className = '', ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-[var(--radius-sm)] px-2.5 py-1 text-[12px] font-bold leading-none whitespace-nowrap ${TONE[tone]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
