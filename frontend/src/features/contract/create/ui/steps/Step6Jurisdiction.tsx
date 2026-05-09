import type { FC } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { Dropdown, Textarea } from '@/shared/ui'

const DISPUTE_DAY_OPTIONS = [3, 7, 14, 21, 30].map((n) => ({
  value: String(n),
  label: `${n} days`,
}))
import { COUNTRIES } from '@/shared/constants/countries'
import type { ContractFormValues } from '../../model/types'

interface Step6JurisdictionProps {
  form: UseFormReturn<ContractFormValues>
}

export const Step6Jurisdiction: FC<Step6JurisdictionProps> = ({ form }) => {
  const { control } = form

  const countryOptions = COUNTRIES.map((c) => ({
    value: c.code,
    label: `${c.emoji} ${c.name}`,
  }))

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] font-medium text-(--color-text-muted)">
        Choose the law that governs the contract. Optionally extend it with custom additional terms.
      </p>

      <Controller
        name="jurisdictionCode"
        control={control}
        rules={{ required: true }}
        render={({ field, fieldState }) => (
          <Dropdown
            label="Jurisdiction"
            required
            options={countryOptions}
            value={field.value}
            onChange={(v) => field.onChange(String(v))}
            error={fieldState.error ? 'Choose a jurisdiction' : undefined}
          />
        )}
      />

      <Controller
        name="disputeResolutionDays"
        control={control}
        rules={{
          required: true,
          min: { value: 1, message: 'At least 1 day' },
          max: { value: 30, message: 'At most 30 days' },
        }}
        render={({ field, fieldState }) => (
          <Dropdown
            label="Dispute resolution window"
            required
            options={DISPUTE_DAY_OPTIONS}
            value={String(field.value)}
            onChange={(v) => field.onChange(Number(v))}
            error={fieldState.error?.message}
          />
        )}
      />
      <p className="text-[13px] font-medium text-(--color-text-muted) -mt-2">
        If a dispute is opened, this is how long both sides can post updates and files before the
        next resolution step (per platform rules).
      </p>

      <Controller
        name="additionalTerms"
        control={control}
        render={({ field }) => (
          <Textarea
            {...field}
            label="Additional terms (optional)"
            placeholder="Any additional conditions you want to add to the contract."
            minHeight="160px"
          />
        )}
      />
    </div>
  )
}
