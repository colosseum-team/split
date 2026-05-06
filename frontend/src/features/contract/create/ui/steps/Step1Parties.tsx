import type { FC } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { Input } from '@/shared/ui'
import type { ContractFormValues } from '../../model/types'

interface Step1PartiesProps {
  form: UseFormReturn<ContractFormValues>
}

export const Step1Parties: FC<Step1PartiesProps> = ({ form }) => {
  const { control } = form

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h3 className="text-[15px] font-bold text-[var(--color-text-dark-blue)]">Customer (you)</h3>

        <Controller
          name="customerFullName"
          control={control}
          rules={{ required: true, minLength: 2 }}
          render={({ field, fieldState }) => (
            <Input
              {...field}
              label="Full name"
              placeholder="John Doe"
              required
              error={fieldState.error ? 'Enter customer full name' : undefined}
            />
          )}
        />

        <Controller
          name="customerEmail"
          control={control}
          rules={{
            required: true,
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          }}
          render={({ field, fieldState }) => (
            <Input
              {...field}
              type="email"
              label="Email"
              placeholder="email@example.com"
              required
              error={fieldState.error ? 'Enter a valid email' : undefined}
            />
          )}
        />

        <Controller
          name="customerCompanyName"
          control={control}
          render={({ field }) => <Input {...field} label="Company name" placeholder="Optional" />}
        />
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h3 className="text-[15px] font-bold text-[var(--color-text-dark-blue)]">Performer</h3>
          <p className="text-[13px] font-medium text-[var(--color-text-light-gray)] mt-1">
            Pre-filled performer details. For the MVP these fields are read-only.
          </p>
        </div>

        <Controller
          name="performerFullName"
          control={control}
          render={({ field }) => <Input {...field} label="Full name" readOnly />}
        />

        <Controller
          name="performerEmail"
          control={control}
          render={({ field }) => <Input {...field} type="email" label="Email" readOnly />}
        />

        <Controller
          name="performerCompanyName"
          control={control}
          render={({ field }) => <Input {...field} label="Company name" readOnly />}
        />

        <Controller
          name="performerWalletAddress"
          control={control}
          render={({ field }) => <Input {...field} label="Performer wallet" readOnly />}
        />
      </section>
    </div>
  )
}
