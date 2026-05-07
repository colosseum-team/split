export type CalendarValue = Date | [Date, Date] | null

export type DateInputValue =
  | string
  | Date
  | [Date, Date]
  | { start?: Date; end?: Date }
  | null
  | undefined

export const formatDate = (date: Date): string => {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return ''
  }
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

const isValidDate = (date: Date): boolean => {
  return date instanceof Date && !isNaN(date.getTime())
}

export const getCalendarValue = (
  value: DateInputValue,
  mode: 'single' | 'range',
): CalendarValue => {
  if (!value) return null

  if (mode === 'range') {
    if (Array.isArray(value) && value.length === 2) {
      const [start, end] = value
      if (isValidDate(start) && isValidDate(end)) {
        return [start, end]
      }
      return null
    }
    if (typeof value === 'object' && 'start' in value && 'end' in value) {
      const range = value as { start?: Date; end?: Date }
      if (range.start && range.end && isValidDate(range.start) && isValidDate(range.end)) {
        return [range.start, range.end]
      }
      if (range.start && isValidDate(range.start)) {
        return range.start
      }
    }
    return null
  } else {
    if (value instanceof Date) {
      return isValidDate(value) ? value : null
    }
    if (typeof value === 'string') {
      const date = new Date(value)
      return isValidDate(date) ? date : null
    }
  }
  return null
}

export const getDisplayValue = (value: DateInputValue, mode: 'single' | 'range'): string => {
  if (!value) return ''

  if (mode === 'range') {
    if (Array.isArray(value) && value.length === 2) {
      const start = value[0]
      const end = value[1]
      if (
        start instanceof Date &&
        end instanceof Date &&
        !isNaN(start.getTime()) &&
        !isNaN(end.getTime())
      ) {
        return `${formatDate(start)} - ${formatDate(end)}`
      }
      return ''
    }
    if (typeof value === 'object' && 'start' in value && 'end' in value) {
      const range = value as { start?: Date; end?: Date }
      if (range.start && range.end && isValidDate(range.start) && isValidDate(range.end)) {
        return `${formatDate(range.start)} - ${formatDate(range.end)}`
      }
      if (range.start && isValidDate(range.start)) {
        return formatDate(range.start)
      }
    }
    return ''
  } else {
    if (value instanceof Date) {
      return isValidDate(value) ? formatDate(value) : ''
    }
    if (typeof value === 'string') {
      const date = new Date(value)
      return isValidDate(date) ? formatDate(date) : ''
    }
  }
  return ''
}
