import type { CSSProperties, FC } from 'react'
import { useState, useMemo } from 'react'
import { MONTH_NAMES, WEEKDAYS } from './constants'
import type { CalendarDay } from './types'

interface CalendarProps {
  value: Date | [Date, Date] | null
  onChange: (value: Date | [Date, Date] | null) => void
  selectRange?: boolean
  minDate?: Date
  selectedDateColor?: string
  rangeColor?: string
  onClose?: () => void
}

export const Calendar: FC<CalendarProps> = ({
  value,
  onChange,
  selectRange = false,
  minDate,
  selectedDateColor,
  rangeColor,
  onClose,
}) => {
  const isValidDate = (date: Date): boolean => {
    return date instanceof Date && !isNaN(date.getTime())
  }

  const getInitialDate = (): Date => {
    if (value) {
      if (Array.isArray(value)) {
        const firstDate = value[0]
        if (firstDate && isValidDate(firstDate)) {
          return firstDate
        }
      } else if (isValidDate(value)) {
        return value
      }
    }
    return new Date()
  }

  const [currentDate, setCurrentDate] = useState<Date>(getInitialDate())

  const normalizeDate = (date: Date): Date => {
    const normalized = new Date(date)
    normalized.setHours(0, 0, 0, 0)
    return normalized
  }

  const isDisabled = (date: Date): boolean => {
    if (minDate) {
      const min = normalizeDate(minDate)
      const check = normalizeDate(date)
      return check < min
    }
    return false
  }

  const calendarDays = useMemo((): CalendarDay[] => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    let firstDayOfWeek = firstDay.getDay()
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

    const daysInMonth = lastDay.getDate()
    const prevMonth = new Date(year, month, 0)
    const daysInPrevMonth = prevMonth.getDate()

    const days: CalendarDay[] = []

    if (firstDayOfWeek > 0) {
      for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const date = new Date(year, month - 1, daysInPrevMonth - i)
        days.push({
          date,
          isCurrentMonth: false,
          isSelected: false,
          isRangeStart: false,
          isRangeEnd: false,
          isInRange: false,
          isDisabled: isDisabled(date),
        })
      }
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const normalized = normalizeDate(date)

      let isSelected = false
      let isRangeStart = false
      let isRangeEnd = false
      let isInRange = false

      if (selectRange && Array.isArray(value) && value.length === 2) {
        const [start, end] = value
        const normalizedStart = normalizeDate(start)
        const normalizedEnd = normalizeDate(end)
        isRangeStart = normalized.getTime() === normalizedStart.getTime()
        isRangeEnd = normalized.getTime() === normalizedEnd.getTime()
        isInRange = normalized > normalizedStart && normalized < normalizedEnd
      } else if (!selectRange && value instanceof Date) {
        const normalizedValue = normalizeDate(value)
        isSelected = normalized.getTime() === normalizedValue.getTime()
      }

      days.push({
        date,
        isCurrentMonth: true,
        isSelected,
        isRangeStart,
        isRangeEnd,
        isInRange,
        isDisabled: isDisabled(date),
      })
    }

    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day)
      days.push({
        date,
        isCurrentMonth: false,
        isSelected: false,
        isRangeStart: false,
        isRangeEnd: false,
        isInRange: false,
        isDisabled: isDisabled(date),
      })
    }

    return days
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, value, selectRange, minDate])

  const handleDateClick = (day: CalendarDay) => {
    if (day.isDisabled) return

    if (selectRange) {
      if (!value || !Array.isArray(value) || value.length !== 2) {
        onChange([day.date, day.date])
      } else {
        const [start, end] = value
        const clickedDate = normalizeDate(day.date)
        const startDate = normalizeDate(start)
        const endDate = normalizeDate(end)

        if (startDate.getTime() === endDate.getTime()) {
          if (clickedDate.getTime() === startDate.getTime()) {
            onChange(null)
            onClose?.()
          } else {
            if (clickedDate < startDate) {
              onChange([day.date, start])
            } else {
              onChange([start, day.date])
            }
            onClose?.()
          }
        } else {
          onChange([day.date, day.date])
        }
      }
    } else {
      const clickedDate = normalizeDate(day.date)
      if (value instanceof Date) {
        const selectedDate = normalizeDate(value)
        if (clickedDate.getTime() === selectedDate.getTime()) {
          onChange(null)
          onClose?.()
        } else {
          onChange(day.date)
          onClose?.()
        }
      } else {
        onChange(day.date)
        onClose?.()
      }
    }
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const monthName = MONTH_NAMES[currentDate.getMonth()]
  const year = currentDate.getFullYear()

  return (
    <div className="rounded-[16px] bg-[var(--color-input-bg)] border border-[var(--color-input-border)] p-4">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={goToPreviousMonth}
          className="text-[var(--color-text-calendar-grey)] text-[18px] hover:opacity-70 transition-opacity cursor-pointer"
        >
          ‹
        </button>
        <div
          className="text-[18px] font-bold text-[var(--color-text-calendar-grey)]"
          style={{ fontFamily: 'Gilroy' }}
        >
          {monthName} {year}
        </div>
        <button
          type="button"
          onClick={goToNextMonth}
          className="text-[var(--color-text-calendar-grey)] text-[18px] hover:opacity-70 transition-opacity cursor-pointer"
        >
          ›
        </button>
      </div>

      <div className="border-t border-[var(--color-calendar-border)] my-3"></div>

      <div className="grid grid-cols-7 gap-3 mb-3">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="w-[30px] h-[30px] flex items-center justify-center text-[var(--color-calendar-weekday-text)] text-[18px] font-medium"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-3">
        {calendarDays.map((day, index) => {
          let dayClasses =
            'w-[30px] h-[30px] flex items-center justify-center text-[18px] font-medium cursor-pointer transition-all '
          const dayStyle: CSSProperties = {}

          if (day.isDisabled) {
            dayClasses += 'opacity-30 cursor-not-allowed '
          }

          if (!day.isCurrentMonth) {
            dayClasses += 'text-[var(--color-calendar-weekday-text)] '
          } else {
            dayClasses += 'text-[var(--color-calendar-day-text)] '
          }

          if (day.isSelected) {
            dayClasses += 'rounded-full font-semibold '
            dayStyle.backgroundColor = selectedDateColor || 'var(--color-button)'
            dayStyle.color = 'var(--color-text-dark-blue)'
          }

          if (selectRange) {
            if (day.isRangeStart || day.isRangeEnd) {
              dayClasses += 'rounded-full font-semibold '
              dayStyle.backgroundColor = selectedDateColor || 'var(--color-button)'
              dayStyle.color = 'var(--color-text-dark-blue)'
            } else if (day.isInRange) {
              dayClasses += 'rounded-none '
              dayStyle.backgroundColor = rangeColor || 'var(--color-date-range-bg)'
              dayStyle.marginLeft = '-6px'
              dayStyle.marginRight = '-6px'
              dayStyle.width = 'calc(30px + 12px)'
            }
          }

          return (
            <button
              key={`${day.date.getTime()}-${index}`}
              type="button"
              onClick={() => handleDateClick(day)}
              disabled={day.isDisabled}
              className={dayClasses}
              style={dayStyle}
            >
              {day.date.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
