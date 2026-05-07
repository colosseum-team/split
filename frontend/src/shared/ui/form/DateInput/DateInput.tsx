import type { FC, InputHTMLAttributes } from 'react'
import { useId, useState, useRef, useEffect } from 'react'
import { CalendarIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Calendar } from './Calendar'
import { getCalendarValue, getDisplayValue } from './utils'

interface DateInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange'
> {
  label?: string
  format?: 'date' | 'datetime-local' | 'time'
  value?: string | Date | [Date, Date] | { start?: Date; end?: Date } | null
  onChange?: (value: string | Date | [Date, Date] | { start?: Date; end?: Date } | null) => void
  disablePast?: boolean
  mode?: 'single' | 'range'
  clearable?: boolean
  inline?: boolean
}

export const DateInput: FC<DateInputProps> = ({
  label,
  value,
  onChange,
  disablePast = false,
  mode = 'single',
  clearable = false,
  inline = false,
  className = '',
  ...props
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const calendarRef = useRef<HTMLDivElement>(null)
  const reactId = useId()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setIsCalendarOpen(false)
        setIsFocused(false)
      }
    }

    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isCalendarOpen])

  const handleInputClick = () => {
    setIsCalendarOpen(true)
    setIsFocused(true)
  }

  const handleCalendarChange = (newValue: Date | [Date | null, Date | null] | null) => {
    if (mode === 'range') {
      if (Array.isArray(newValue) && newValue.length === 2) {
        const [start, end] = newValue
        if (start && end) {
          onChange?.({ start, end })
        } else if (start) {
          onChange?.({ start })
        }
      } else if (newValue instanceof Date) {
        onChange?.({ start: newValue })
      }
    } else {
      if (newValue instanceof Date) {
        onChange?.(newValue)
      } else if (Array.isArray(newValue) && newValue.length > 0 && newValue[0]) {
        onChange?.(newValue[0])
      }
    }
  }

  const handleCalendarClose = () => {
    setIsCalendarOpen(false)
    setIsFocused(false)
  }

  const inputClasses = `w-full h-[53px] px-5 py-4 rounded-[var(--radius-lg)] bg-(--color-surface-muted) border border-(--color-border-subtle) md:text-[16px] text-[14px] font-normal text-(--color-text-primary) placeholder:text-(--color-text-muted) focus:outline-none transition-colors cursor-pointer flex items-center justify-between ${
    isFocused ? 'border-(--color-brand-accent-border)' : ''
  } ${className}`
  const labelClasses = `block md:text-[16px] text-[14px] font-bold text-(--color-text-primary) mb-2`
  const displayValue = getDisplayValue(value, mode)
  const calendarValue = getCalendarValue(value, mode)
  const hasValue = Boolean(displayValue)

  const dateInputId =
    props.id ||
    props.name ||
    (label ? `date-input-${label.toLowerCase().replace(/\s+/g, '-')}` : `date-input-${reactId}`)

  return (
    <div className="w-full relative" ref={containerRef}>
      {label && (
        <label htmlFor={dateInputId} className={labelClasses}>
          {label}
          {props.required && <span className="text-(--color-state-danger) ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <div
          id={dateInputId}
          aria-label={label || props['aria-label'] || 'Date input'}
          className={inputClasses}
          onClick={handleInputClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleInputClick()
            }
          }}
        >
          <span
            className={
              displayValue
                ? 'text-(--color-text-primary) font-medium'
                : 'text-(--color-text-muted) font-normal'
            }
          >
            {displayValue || 'Select date'}
          </span>
          <div className="flex items-center gap-2">
            {clearable && hasValue && (
              <button
                type="button"
                aria-label="Clear date"
                className="flex items-center justify-center w-6 h-6 rounded-full hover:opacity-80 transition-opacity text-(--color-text-primary) cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  onChange?.(null)
                  setIsCalendarOpen(false)
                  setIsFocused(false)
                }}
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            )}
            <CalendarIcon className="w-[19px] h-[18px] text-(--color-text-primary)" />
          </div>
        </div>

        {isCalendarOpen && (
          <div
            ref={calendarRef}
            className={inline ? 'mt-4' : 'absolute top-full left-0 right-0 mt-4 z-50'}
            style={inline ? undefined : { position: 'absolute' }}
          >
            <Calendar
              onChange={handleCalendarChange}
              value={calendarValue}
              selectRange={mode === 'range'}
              minDate={disablePast ? new Date() : undefined}
              onClose={handleCalendarClose}
            />
          </div>
        )}
      </div>
    </div>
  )
}

DateInput.displayName = 'DateInput'
