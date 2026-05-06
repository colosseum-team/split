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

export const RoleSelector: FC<RoleSelectorProps> = ({ value, onChange, className = '' }) => {
  return (
    <div className={`flex flex-col gap-3 w-full ${className}`}>
      {ROLES.map(({ value: optionValue, title, description, Icon }) => {
        const isActive = value === optionValue
        return (
          <button
            key={optionValue}
            type="button"
            onClick={() => onChange(optionValue)}
            className={`p-5 w-full rounded-[14px] cursor-pointer flex flex-row gap-4 items-start text-left transition-all border-2 ${
              isActive
                ? 'border-(--color-input-active) bg-(--color-bg-secondary)'
                : 'border-(--color-button-border-start-page) bg-(--color-button-start-page) md:bg-(--color-bg-secondary) hover:opacity-90'
            }`}
            aria-pressed={isActive}
          >
            <div
              className={`w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 ${
                isActive ? 'bg-(--color-button)' : 'bg-(--color-form-icon-bg)'
              }`}
            >
              <Icon
                className={`w-5 h-5 ${
                  isActive ? 'text-(--color-text-purple)' : 'text-(--color-text-start-page)'
                }`}
              />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <span className="md:text-[16px] text-[15px] font-bold text-(--color-text-dark-blue)">
                {title}
              </span>
              <span className="md:text-[14px] text-[13px] font-medium text-(--color-text-start-page) leading-snug">
                {description}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
