import type { FC, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'

interface FormWrapperProps {
  title: string
  currentStep: number
  totalSteps: number
  onBack?: () => void
  onNext?: () => void
  onSubmit?: () => void
  isNextDisabled?: boolean
  isLastStep?: boolean
  nextButtonText?: string
  children: ReactNode
}

export const FormWrapper: FC<FormWrapperProps> = ({
  title,
  currentStep,
  totalSteps,
  onBack,
  onNext,
  onSubmit,
  isNextDisabled = false,
  isLastStep = false,
  nextButtonText,
  children,
}) => {
  const navigate = useNavigate()

  const handleBack = () => {
    if (currentStep === 1) {
      if (onBack) {
        onBack()
        return
      }
      navigate('/home')
      return
    }
    if (onBack) {
      onBack()
    } else {
      navigate(-1)
    }
  }

  const handleNext = () => {
    if (isLastStep && onSubmit) {
      onSubmit()
    } else if (onNext) {
      onNext()
    }
  }

  const passedStepsAmount = currentStep
  const buttonText = nextButtonText ?? (isLastStep ? 'Create contract' : 'Next step')

  const stepsArray = Array.from({ length: totalSteps }, (_, index) => {
    const stepNumber = index + 1
    if (stepNumber < currentStep) return 'passed'
    if (stepNumber === currentStep) return 'current'
    return 'inactive'
  })

  return (
    <div className="w-full rounded-[20px] max-w-[400px] md:max-w-[620px] mx-auto md:p-8 bg-[var(--color-bg)] md:bg-[var(--color-wrapper-container-bg)] md:border border-[var(--color-border-contract-card)] flex flex-col">
      <div className="w-full max-w-[400px] md:max-w-full">
        <div className="flex items-center mb-6">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
            aria-label="Back"
          >
            <ChevronLeftIcon className="h-[20px] w-auto text-[var(--color-text-start-page)]" />
          </button>
        </div>

        <div className="text-center mb-6">
          <h1 className="md:text-[22px] text-[20px] font-bold text-[var(--color-text-dark-blue)]">
            {title}
          </h1>
        </div>

        <div className="md:mb-6 mb-4">
          <p className="text-[14px] font-medium text-[var(--color-form-steps-text)] mb-1">
            {passedStepsAmount} of {totalSteps} steps completed
          </p>
          <div className="flex gap-1 mt-1">
            {stepsArray.map((status, index) => (
              <div
                key={index}
                className={`h-[6px] rounded-[50px] flex-1 ${
                  status === 'passed' || status === 'current'
                    ? 'bg-[var(--color-step-passed)]'
                    : 'bg-[var(--color-step-inactive)]'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="mb-6">{children}</div>

        <div className="w-full">
          <button
            type="button"
            onClick={handleNext}
            disabled={isNextDisabled}
            className={`w-full rounded-[6px] h-[42px] text-[14px] font-bold transition-opacity ${
              isNextDisabled
                ? 'bg-[var(--color-form-btn-disabled)] text-[var(--color-form-btn-disabled-text)] cursor-not-allowed opacity-50'
                : 'bg-[var(--color-button)] text-[var(--color-continue-button-text)] border border-[var(--color-button-border)] hover:opacity-80 cursor-pointer'
            }`}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  )
}
