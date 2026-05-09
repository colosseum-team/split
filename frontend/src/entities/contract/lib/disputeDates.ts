/** Calendar-day window end (UTC date arithmetic), aligned with backend dispute due calculation. */
export function addDisputeCalendarDays(from: Date, days: number): Date {
  const d = new Date(from.getTime())
  d.setUTCDate(d.getUTCDate() + days)
  return d
}

export function formatDueLabel(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function calendarDaysRemaining(dueAtIso: string, now = new Date()): number {
  const due = new Date(dueAtIso).setHours(0, 0, 0, 0)
  const start = new Date(now).setHours(0, 0, 0, 0)
  return Math.ceil((due - start) / (24 * 60 * 60 * 1000))
}
