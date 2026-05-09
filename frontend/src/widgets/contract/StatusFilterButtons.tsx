import type { FC } from 'react'

export type StatusFilter =
  | 'all'
  | 'pending'
  | 'signed'
  | 'review'
  | 'disputed'
  | 'completed'
  | 'declined'

interface StatusFilterButtonsProps {
  selected: StatusFilter
  onChange: (filter: StatusFilter) => void
  className?: string
}

const FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'signed', label: 'Signed' },
  { value: 'review', label: 'Review' },
  { value: 'disputed', label: 'Disputed' },
  { value: 'completed', label: 'Completed' },
  { value: 'declined', label: 'Declined' },
]

export const StatusFilterButtons: FC<StatusFilterButtonsProps> = ({
  selected,
  onChange,
  className = '',
}) => {
  return (
    <div className={`flex flex-row gap-2 overflow-x-auto custom-scrollbar pb-1 ${className}`}>
      {FILTERS.map(({ value, label }) => {
        const isActive = selected === value
        return (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            className={`shrink-0 h-[36px] px-4 rounded-[var(--radius-pill)] text-[13px] font-bold transition-all cursor-pointer border ${
              isActive
                ? 'bg-(--color-brand-accent) border-(--color-brand-accent-border) text-(--color-brand-accent-text)'
                : 'bg-(--color-surface-raised) border-(--color-border-subtle) text-(--color-text-secondary) hover:opacity-80'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
