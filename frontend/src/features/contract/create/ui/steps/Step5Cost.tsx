import type { FC } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { Dropdown, Input } from '@/shared/ui'
import { CURRENCIES } from '@/shared/constants/currencies'
import type { ContractFormValues } from '../../model/types'

interface Step5CostProps {
  form: UseFormReturn<ContractFormValues>
}

export const Step5Cost: FC<Step5CostProps> = ({ form }) => {
  const { control } = form

  const currencyOptions = CURRENCIES.map((c) => ({
    value: c.code,
    label: c.symbol ? `${c.code} (${c.symbol}) — ${c.name}` : `${c.code} — ${c.name}`,
  }))

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] font-medium text-(--color-text-muted)">
        Total amount that will be released to the performer once the customer confirms the work is
        done.
      </p>

      <Controller
        name="amount"
        control={control}
        rules={{ required: true, min: 0.0001 }}
        render={({ field, fieldState }) => (
          <Input
            label="Total cost"
            required
            type="number"
            inputMode="decimal"
            min={0}
            step={0.01}
            placeholder="1000"
            value={Number.isFinite(field.value) ? String(field.value) : ''}
            onChange={(e) => {
              const next = e.target.value
              field.onChange(next === '' ? 0 : Number(next))
            }}
            onBlur={field.onBlur}
            error={fieldState.error ? 'Enter the contract amount' : undefined}
          />
        )}
      />

      <Controller
        name="currency"
        control={control}
        rules={{ required: true }}
        render={({ field, fieldState }) => (
          <Dropdown
            label="Currency"
            required
            options={currencyOptions}
            value={field.value}
            onChange={(v) => field.onChange(String(v))}
            error={fieldState.error ? 'Choose a currency' : undefined}
          />
        )}
      />
    </div>
  )
}
