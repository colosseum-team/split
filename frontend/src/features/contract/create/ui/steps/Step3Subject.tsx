import type { FC } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { Textarea } from '@/shared/ui'
import type { ContractFormValues } from '../../model/types'

interface Step3SubjectProps {
  form: UseFormReturn<ContractFormValues>
}

export const Step3Subject: FC<Step3SubjectProps> = ({ form }) => {
  const { control } = form

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[13px] font-medium text-[var(--color-text-light-gray)]">
        Short legal description of the deliverable. Pre-filled from the selected template — adjust
        if needed.
      </p>
      <Controller
        name="subject"
        control={control}
        rules={{ required: true, minLength: 10 }}
        render={({ field, fieldState }) => (
          <Textarea
            {...field}
            label="Subject of the contract"
            required
            minHeight="180px"
            error={fieldState.error ? 'Describe the subject of the contract' : undefined}
          />
        )}
      />
    </div>
  )
}
