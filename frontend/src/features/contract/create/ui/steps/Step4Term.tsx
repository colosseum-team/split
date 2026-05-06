import type { FC } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { DateInput } from '@/shared/ui'
import type { ContractFormValues } from '../../model/types'

interface Step4TermProps {
  form: UseFormReturn<ContractFormValues>
}

const toIsoOrNull = (raw: unknown): string | null => {
  if (!raw) return null
  if (raw instanceof Date) return raw.toISOString()
  if (typeof raw === 'string') return raw
  if (typeof raw === 'object' && raw !== null && 'start' in raw) {
    const start = (raw as { start?: Date }).start
    return start instanceof Date ? start.toISOString() : null
  }
  return null
}

const fromIso = (iso: string | null): Date | null => {
  if (!iso) return null
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? null : date
}

export const Step4Term: FC<Step4TermProps> = ({ form }) => {
  const { control } = form

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] font-medium text-[var(--color-text-light-gray)]">
        When does the work start and when must it be completed?
      </p>

      <Controller
        name="startDate"
        control={control}
        rules={{ required: true }}
        render={({ field, fieldState }) => (
          <div>
            <DateInput
              label="Start date"
              required
              disablePast
              clearable
              value={fromIso(field.value)}
              onChange={(v) => field.onChange(toIsoOrNull(v))}
            />
            {fieldState.error && (
              <p className="mt-2 text-[14px] text-[var(--color-text-warning)]">Pick a start date</p>
            )}
          </div>
        )}
      />

      <Controller
        name="endDate"
        control={control}
        rules={{ required: true }}
        render={({ field, fieldState }) => (
          <div>
            <DateInput
              label="End date"
              required
              disablePast
              clearable
              value={fromIso(field.value)}
              onChange={(v) => field.onChange(toIsoOrNull(v))}
            />
            {fieldState.error && (
              <p className="mt-2 text-[14px] text-[var(--color-text-warning)]">Pick an end date</p>
            )}
          </div>
        )}
      />
    </div>
  )
}
