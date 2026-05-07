import type { ElementType, HTMLAttributes, ReactNode } from 'react'

type CardTone = 'base' | 'muted' | 'role-customer' | 'role-performer'
type CardPadding = 'none' | 'sm' | 'md' | 'lg'

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType
  children: ReactNode
  tone?: CardTone
  padding?: CardPadding
  interactive?: boolean
  type?: 'button' | 'submit' | 'reset'
}

const TONE: Record<CardTone, string> = {
  base: 'bg-(--color-surface-raised) border-(--color-border-subtle)',
  muted: 'bg-(--color-surface-muted) border-(--color-border-subtle)',
  'role-customer': 'bg-(--color-role-customer-soft) border-(--color-role-customer-border)',
  'role-performer': 'bg-(--color-role-performer-soft) border-(--color-role-performer-border)',
}

const PADDING: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-8',
}

export function Card({
  as: Component = 'div',
  children,
  tone = 'base',
  padding = 'md',
  interactive = false,
  className = '',
  ...props
}: CardProps) {
  return (
    <Component
      className={`rounded-[var(--radius-lg)] border shadow-[var(--shadow-sm)] ${TONE[tone]} ${PADDING[padding]} ${
        interactive
          ? 'transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] cursor-pointer'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </Component>
  )
}
