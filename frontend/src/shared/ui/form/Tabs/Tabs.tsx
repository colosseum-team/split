import type { FC, ReactNode } from 'react'

export interface TabOption {
  value: string
  label: string
  icon?: ReactNode
}

export interface TabsProps {
  name?: string
  label?: string
  options: TabOption[]
  value: string
  onChange: (value: string) => void
  type?: 'radio' | 'toggle'
  className?: string
  isRadioActive?: boolean
  activeColor?: string
}

export const Tabs: FC<TabsProps> = ({
  label,
  options,
  value,
  onChange,
  type = 'radio',
  className = '',
  isRadioActive = false,
  activeColor = 'var(--color-tab-border)',
}) => {
  const handleClick = (optionValue: string) => {
    if (type === 'toggle' && value === optionValue) {
      return
    }
    onChange(optionValue)
  }

  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <label className="text-[14px] font-bold text-[var(--color-form-label-text)] mb-2">
          {label}
        </label>
      )}
      <div className="flex gap-2">
        {options.map((option) => {
          const isActive = value === option.value
          const borderColor = isActive ? activeColor : 'var(--color-border-tertiary)'
          const borderWidth = '2px'

          const textColor = isActive
            ? 'var(--color-text-dark-blue)'
            : 'var(--color-text-start-page)'

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleClick(option.value)}
              className="w-full min-h-[48px] rounded-[12px] border text-[14px] font-bold p-[14px] transition-all flex flex-row items-center justify-center cursor-pointer"
              style={{
                borderColor,
                borderWidth,
                color: textColor,
              }}
            >
              {isRadioActive && (
                <div
                  className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 mr-2"
                  style={{
                    borderColor: isActive ? activeColor : 'var(--color-border-secondary)',
                  }}
                >
                  {isActive && (
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: activeColor }}
                    />
                  )}
                </div>
              )}
              {option.icon && (
                <div className="flex-shrink-0 w-5 h-5 mr-[2px]" style={{ color: textColor }}>
                  {option.icon}
                </div>
              )}
              <span>{option.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
