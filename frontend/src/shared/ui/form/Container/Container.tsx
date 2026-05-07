import type { FC, HTMLAttributes, ReactNode } from 'react'
import { Button } from '../../Button'

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
  const containerClasses = `w-full border border-(--color-border-subtle) rounded-[var(--radius-lg)] p-6 flex flex-col bg-(--color-surface-raised) shadow-[var(--shadow-sm)] ${className}`

  const stepsArray = Array.from({ length: totalSteps }, (_, index) => {
    if (index < currentStep) return 'passed'
    if (index === currentStep) return 'active'
    return 'inactive'
  })

  return (
    <div className={containerClasses} {...props}>
      {(title || steps) && (
        <div className="flex justify-between items-start mb-6">
          {title && <h2 className="text-h3 text-(--color-text-primary)">{title}</h2>}
          {steps && (
            <span className="text-[14px] font-medium text-(--color-text-muted)">{steps}</span>
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
                  ? 'bg-(--color-brand-accent)'
                  : status === 'active'
                    ? 'bg-(--color-brand)'
                    : 'bg-(--color-border-default)'
              }`}
            />
          ))}
        </div>
      )}

      <div className="flex-1">{children}</div>

      {(showBackButton || showNextButton) && (
        <div className="flex gap-2 mt-6 pt-4">
          {showBackButton && (
            <Button onClick={onBack} variant="ghost" className="flex-1">
              {backButtonText}
            </Button>
          )}
          {showNextButton && (
            <Button onClick={onNext} disabled={isNextDisabled} className="flex-1">
              {nextButtonText}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
