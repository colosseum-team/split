import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { UserRole } from '@/entities/user'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'role'> {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  role?: UserRole
}

const ROLE_VARIANT: Record<UserRole, string> = {
  customer:
    'bg-[linear-gradient(135deg,var(--color-role-customer-soft)_0%,var(--color-brand-accent)_55%,var(--color-surface-raised)_100%)] border-(--color-role-customer-border) text-(--color-role-customer-text)',
  performer:
    'bg-[linear-gradient(135deg,var(--color-role-performer-soft)_0%,var(--color-brand-accent)_55%,var(--color-surface-raised)_100%)] border-(--color-role-performer-border) text-(--color-role-performer-text)',
}

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    'bg-[linear-gradient(135deg,var(--color-brand-soft)_0%,var(--color-brand-accent)_55%,var(--color-surface-raised)_100%)] border-(--color-brand-accent-border) text-(--color-brand)',
  secondary:
    'bg-(--color-surface-raised) border-(--color-border-subtle) text-(--color-text-primary)',
  ghost: 'bg-transparent border-transparent text-(--color-brand)',
  danger:
    'bg-(--color-state-danger-soft) border-(--color-state-danger) text-(--color-state-danger)',
  success:
    'bg-(--color-state-success-soft) border-(--color-state-success) text-(--color-state-success)',
}

const SIZE: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-[13px] rounded-[var(--radius-md)]',
  md: 'h-[42px] px-5 text-[14px] rounded-[var(--radius-md)]',
  lg: 'h-12 px-6 text-[14px] rounded-[var(--radius-lg)]',
  icon: 'w-12 h-12 p-0 rounded-[var(--radius-pill)]',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  role,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  const toneClasses = role ? ROLE_VARIANT[role] : VARIANT[variant]

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 border font-bold transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${SIZE[size]} ${toneClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
