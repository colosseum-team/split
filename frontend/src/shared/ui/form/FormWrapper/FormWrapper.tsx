import type { FC, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { Button } from '../../Button'
import { Card } from '../../Card'

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
    <Card padding="lg" className="w-full max-w-[400px] md:max-w-[620px] mx-auto flex flex-col">
      <div className="w-full max-w-[400px] md:max-w-full">
        <div className="flex items-center mb-6">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
            aria-label="Back"
          >
            <ChevronLeftIcon className="h-[20px] w-auto text-(--color-text-secondary)" />
          </button>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-h2 text-(--color-text-primary)">{title}</h1>
        </div>

        <div className="md:mb-6 mb-4">
          <p className="text-[14px] font-medium text-(--color-text-muted) mb-1">
            {passedStepsAmount} of {totalSteps} steps completed
          </p>
          <div className="flex gap-1 mt-1">
            {stepsArray.map((status, index) => (
              <div
                key={index}
                className={`h-[6px] rounded-[50px] flex-1 ${
                  status === 'passed' || status === 'current'
                    ? 'bg-(--color-brand-accent)'
                    : 'bg-(--color-border-default)'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="mb-6">{children}</div>

        <div className="w-full">
          <Button onClick={handleNext} disabled={isNextDisabled} className="w-full">
            {buttonText}
          </Button>
        </div>
      </div>
    </Card>
  )
}
