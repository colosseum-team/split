import type { FC } from 'react'
import { BriefcaseIcon, RocketLaunchIcon } from '@heroicons/react/24/outline'
import type { UserRole } from '@/entities/user'

interface RoleSelectorProps {
  value: UserRole | null
  onChange: (role: UserRole) => void
  className?: string
}

interface RoleOption {
  value: UserRole
  title: string
  description: string
  Icon: typeof BriefcaseIcon
}

const ROLES: RoleOption[] = [
  {
    value: 'customer',
    title: 'Customer',
    description: 'I will create contracts and pay performers for delivered work.',
    Icon: BriefcaseIcon,
  },
  {
    value: 'performer',
    title: 'Performer',
    description: 'I will execute the work and receive payments after the customer confirms.',
    Icon: RocketLaunchIcon,
  },
]

const ROLE_TONE: Record<UserRole, { border: string; bg: string; icon: string; text: string }> = {
  customer: {
    border: 'border-(--color-role-customer-border)',
    bg: 'bg-(--color-role-customer-soft)',
    icon: 'bg-(--color-role-customer)',
    text: 'text-(--color-role-customer-text)',
  },
  performer: {
    border: 'border-(--color-role-performer-border)',
    bg: 'bg-(--color-role-performer-soft)',
    icon: 'bg-(--color-role-performer)',
    text: 'text-(--color-role-performer-text)',
  },
}

export const RoleSelector: FC<RoleSelectorProps> = ({ value, onChange, className = '' }) => {
  return (
    <div className={`flex flex-col gap-3 w-full ${className}`}>
      {ROLES.map(({ value: optionValue, title, description, Icon }) => {
        const isActive = value === optionValue
        const tone = ROLE_TONE[optionValue]
        return (
          <button
            key={optionValue}
            type="button"
            onClick={() => onChange(optionValue)}
            className={`p-5 w-full rounded-[var(--radius-lg)] cursor-pointer flex flex-row gap-4 items-start text-left transition-all border shadow-[var(--shadow-sm)] ${
              isActive
                ? `${tone.border} ${tone.bg}`
                : 'border-(--color-border-subtle) bg-(--color-surface-raised) hover:border-(--color-border-default) hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]'
            }`}
            aria-pressed={isActive}
          >
            <div
              className={`w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center shrink-0 ${
                isActive ? tone.icon : 'bg-(--color-surface-muted)'
              }`}
            >
              <Icon
                className={`w-5 h-5 ${isActive ? tone.text : 'text-(--color-text-secondary)'}`}
              />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <span className="text-h3 text-(--color-text-primary)">{title}</span>
              <span className="text-body text-(--color-text-secondary)">{description}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
