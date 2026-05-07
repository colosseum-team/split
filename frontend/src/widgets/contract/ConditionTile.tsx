import type { FC, ReactNode } from 'react'
import { ArrowUpRightIcon } from '@heroicons/react/24/outline'

export type ConditionTileTone =
  | 'brand'
  | 'peach'
  | 'mint'
  | 'lavender'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral'

const TONE_ICON: Record<ConditionTileTone, string> = {
  brand:
    'bg-[linear-gradient(135deg,var(--color-brand-soft)_0%,var(--color-brand-accent)_100%)] text-(--color-brand)',
  peach: 'bg-(--color-role-customer-soft) text-(--color-role-customer-text)',
  mint: 'bg-(--color-role-performer-soft) text-(--color-role-performer-text)',
  lavender: 'bg-[var(--color-decor-lavender)] text-(--color-brand)',
  info: 'bg-(--color-state-info-soft) text-(--color-state-info)',
  success: 'bg-(--color-state-success-soft) text-(--color-state-success)',
  warning: 'bg-(--color-state-warning-soft) text-(--color-state-warning)',
  danger: 'bg-(--color-state-danger-soft) text-(--color-state-danger)',
  neutral: 'bg-(--color-state-neutral-soft) text-(--color-state-neutral)',
}

export interface ConditionTileProps {
  icon: ReactNode
  title: string
  value: string
  tone?: ConditionTileTone
  onClick?: () => void
  className?: string
}

export const ConditionTile: FC<ConditionTileProps> = ({
  icon,
  title,
  value,
  tone = 'brand',
  onClick,
  className = '',
}) => {
  const interactive = !!onClick

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      className={`
        group relative min-w-[150px] w-[calc(50%-6px)] lg:w-[calc(33.333%-8px)] min-h-[120px] md:min-h-[110px]
        rounded-[var(--radius-lg)] border border-white/70
        bg-white/75 backdrop-blur-md shadow-[var(--shadow-sm)]
        flex flex-col items-start
        p-4 md:p-5 gap-3 flex-shrink-0 text-left overflow-hidden
        ${
          interactive
            ? 'cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] hover:bg-white/90'
            : 'cursor-default opacity-95'
        }
        ${className}
      `}
    >
      <span className="absolute top-3 right-3 text-(--color-text-muted) opacity-60 transition-opacity group-hover:opacity-100 pointer-events-none">
        <ArrowUpRightIcon className="h-4 w-4" aria-hidden />
      </span>

      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] ${TONE_ICON[tone]}`}
        aria-hidden
      >
        <span className="flex h-6 w-6 items-center justify-center [&>svg]:h-6 [&>svg]:w-6">
          {icon}
        </span>
      </div>

      <div className="flex min-w-0 flex-col gap-1 w-full">
        {title ? (
          <h4 className="text-[11px] font-bold uppercase tracking-[0.08em] text-(--color-text-muted)">
            {title}
          </h4>
        ) : null}
        {value ? (
          <p className="line-clamp-3 text-[14px] font-bold leading-snug text-(--color-text-primary) wrap-break-word md:text-[15px]">
            {value}
          </p>
        ) : null}
      </div>
    </button>
  )
}
