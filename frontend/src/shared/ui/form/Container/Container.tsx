import type { FC, HTMLAttributes, ReactNode } from 'react'

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  title?: string
  steps?: string
  currentStep?: number
  totalSteps?: number
  onBack?: () => void
  onNext?: () => void
  showBackButton?: boolean
  showNextButton?: boolean
  backButtonText?: string
  nextButtonText?: string
  isNextDisabled?: boolean
  className?: string
}

export const Container: FC<ContainerProps> = ({
  children,
  title,
  steps,
  currentStep = 0,
  totalSteps = 0,
  onBack,
  onNext,
  showBackButton = true,
  showNextButton = true,
  backButtonText = '< Back',
  nextButtonText = 'Next step',
  isNextDisabled = false,
  className = '',
  ...props
}) => {
  const containerClasses = `w-full border border-[var(--color-border)] rounded-[6px] p-6 flex flex-col bg-[var(--color-bg-block)] ${className}`

  const stepsArray = Array.from({ length: totalSteps }, (_, index) => {
    if (index < currentStep) return 'passed'
    if (index === currentStep) return 'active'
    return 'inactive'
  })

  return (
    <div className={containerClasses} {...props}>
      {(title || steps) && (
        <div className="flex justify-between items-start mb-6">
          {title && (
            <h2 className="text-[18px] font-medium text-[var(--color-text-black)]">{title}</h2>
          )}
          {steps && (
            <span className="text-[14px] font-medium text-[var(--color-text-secondary)]">
              {steps}
            </span>
          )}
        </div>
      )}

      {totalSteps > 0 && (
        <div className="flex gap-1 mb-6">
          {stepsArray.map((status, index) => (
            <div
              key={index}
              className={`h-[3px] rounded flex-1 ${
                status === 'passed'
                  ? 'bg-[var(--color-step-passed)]'
                  : status === 'active'
                    ? 'bg-[var(--color-step-active)]'
                    : 'bg-[var(--color-step-inactive)]'
              }`}
            />
          ))}
        </div>
      )}

      <div className="flex-1">{children}</div>

      {(showBackButton || showNextButton) && (
        <div className="flex gap-2 mt-6 pt-4">
          {showBackButton && (
            <button
              type="button"
              onClick={onBack}
              className="flex-1 h-[42px] text-[16px] font-bold text-[var(--color-text-purple)] border-none bg-transparent hover:opacity-80 transition-opacity cursor-pointer"
            >
              {backButtonText}
            </button>
          )}
          {showNextButton && (
            <button
              type="button"
              onClick={onNext}
              disabled={isNextDisabled}
              className="flex-1 h-[42px] text-[16px] font-bold text-[var(--color-text-purple)] bg-[var(--color-button)] border border-[var(--color-button-border)] rounded-[2px] hover:opacity-80 transition-opacity disabled:opacity-50 cursor-pointer"
            >
              {nextButtonText}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
