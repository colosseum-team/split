import type { FC } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { Textarea } from '@/shared/ui'
import type { ContractFormValues } from '../../model/types'

interface Step2TechnicalAssignmentProps {
  form: UseFormReturn<ContractFormValues>
}

export const Step2TechnicalAssignment: FC<Step2TechnicalAssignmentProps> = ({ form }) => {
  const { control } = form

  return (
    <div className="flex flex-col gap-2 h-full min-h-[60vh]">
      <p className="text-[13px] font-medium text-[var(--color-text-light-gray)]">
        The assignment is pre-filled from the selected template. Edit it freely — this exact text
        will be embedded into the contract.
      </p>
      <Controller
        name="technicalAssignment"
        control={control}
        rules={{ required: true, minLength: 20 }}
        render={({ field, fieldState }) => (
          <Textarea
            {...field}
            label="Technical assignment"
            required
            fillHeight
            minHeight="50vh"
            error={fieldState.error ? 'Add the technical assignment' : undefined}
          />
        )}
      />
    </div>
  )
}
