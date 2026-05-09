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
        <h3 className="text-h3 text-(--color-text-primary)">Customer (you)</h3>

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
          <h3 className="text-h3 text-(--color-text-primary)">Performer</h3>
          <p className="text-[13px] font-medium text-(--color-text-muted) mt-1">
            Enter performer contact details. Wallet will be attached when the performer connects.
          </p>
        </div>

        <Controller
          name="performerFullName"
          control={control}
          rules={{ required: true, minLength: 2 }}
          render={({ field, fieldState }) => (
            <Input
              {...field}
              label="Full name"
              placeholder="Maya Reyes"
              required
              error={fieldState.error ? 'Enter performer full name' : undefined}
            />
          )}
        />

        <Controller
          name="performerEmail"
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
              placeholder="performer@example.com"
              required
              error={fieldState.error ? 'Enter a valid performer email' : undefined}
            />
          )}
        />

        <Controller
          name="performerCompanyName"
          control={control}
          render={({ field }) => <Input {...field} label="Company name" placeholder="Optional" />}
        />
      </section>
    </div>
  )
}
