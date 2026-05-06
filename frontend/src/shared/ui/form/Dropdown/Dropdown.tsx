import type { FC } from 'react'
import { useId, useMemo, useState, useRef, useEffect } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

interface DropdownOption {
  value: string | number
  label: string
  disabled?: boolean
}

interface DropdownProps {
  label?: string
  placeholder?: string
  options: DropdownOption[]
  value?: string | number
  onChange?: (value: string | number) => void
  error?: string
  helperText?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export const Dropdown: FC<DropdownProps> = ({
  label,
  placeholder = 'Select an option',
  options,
  value,
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const reactId = useId()

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value) ?? null,
    [options, value],
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setIsFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
      setHasInteracted(true)
      setIsFocused(!isOpen)
    }
  }

  const handleOptionClick = (option: DropdownOption) => {
    if (!option.disabled) {
      onChange?.(option.value)
      setIsOpen(false)
      setHasInteracted(true)
    }
  }

  const shouldShowError = error && hasInteracted

  let baseClasses = `w-full h-[53px] px-5 py-4 rounded-[16px] bg-[var(--color-input-bg)] border transition-colors cursor-pointer flex items-center justify-between ${
    disabled ? 'opacity-50 cursor-not-allowed' : ''
  } ${className}`

  if (shouldShowError) {
    baseClasses += ' border-[var(--color-input-warning)]'
  } else if (isFocused) {
    baseClasses += ' border-[var(--color-input-active)]'
  } else {
    baseClasses += ' border-[var(--color-input-border)]'
  }

  const labelClasses =
    'block md:text-[16px] text-[14px] font-bold text-[var(--color-form-label-text)] mb-2'
  const dropdownClasses =
    'absolute top-full left-0 right-0 mt-4 z-50 bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-[16px] px-4 max-h-60 overflow-y-auto'

  const dropdownId = label
    ? `dropdown-${label.toLowerCase().replace(/\s+/g, '-')}`
    : `dropdown-${reactId}`

  return (
    <div className="w-full" ref={dropdownRef}>
      {label && (
        <label htmlFor={dropdownId} className={labelClasses}>
          {label}
          {required && <span className="text-[var(--color-text-warning)] ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <div
          id={dropdownId}
          aria-label={label || placeholder || 'Dropdown'}
          className={baseClasses}
          onClick={handleToggle}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleToggle()
            }
          }}
        >
          <span
            className={`md:text-[16px] text-[14px] ${
              selectedOption
                ? 'text-[var(--color-text-dark-blue)] font-medium'
                : 'text-[var(--color-input-text-placeholder)] font-normal'
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDownIcon
            className={`w-[16px] h-[16px] transition-transform duration-200 ${
              isOpen ? 'rotate-180' : 'rotate-0'
            }`}
          />
        </div>

        {isOpen && (
          <div className={dropdownClasses}>
            {options.map((option, index) => (
              <div key={option.value}>
                <div
                  className={`md:text-[16px] text-[15px] font-medium text-[var(--color-text-dark-blue)] cursor-pointer transition-colors py-3 ${
                    option.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
                  } ${selectedOption?.value === option.value ? 'opacity-100 font-bold' : ''}`}
                  onClick={() => handleOptionClick(option)}
                >
                  {option.label}
                </div>
                {index < options.length - 1 && (
                  <div className="border-b border-[var(--color-input-border)] -mx-4" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {shouldShowError && (
        <p className="mt-[12px] text-start font-normal md:text-[16px] text-[14px] text-[var(--color-input-warning)]">
          {error}
        </p>
      )}

      {helperText && !error && (
        <p className="mt-[12px] text-start font-normal md:text-[16px] text-[14px] text-[var(--color-text-primary)]">
          {helperText}
        </p>
      )}
    </div>
  )
}
