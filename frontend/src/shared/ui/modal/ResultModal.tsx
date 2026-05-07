import type { FC } from 'react'
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Button } from '../Button'
import { BottomModal } from './BottomModal'

interface ResultModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'success' | 'error'
  header?: string
  text?: string
  buttonText?: string
}

export const ResultModal: FC<ResultModalProps> = ({
  isOpen,
  onClose,
  type,
  header,
  text,
  buttonText = 'Continue',
}) => {
  const defaultHeader = type === 'success' ? 'Success' : 'Error'
  const defaultText =
    type === 'success'
      ? 'Request has been sent successfully'
      : 'Something went wrong. Please try your request later'

  const displayHeader = header || defaultHeader
  const displayText = text || defaultText

  const iconBgColor =
    type === 'success' ? 'bg-(--color-state-success-soft)' : 'bg-(--color-state-danger-soft)'

  const iconColor =
    type === 'success' ? 'text-(--color-state-success)' : 'text-(--color-state-danger)'

  return (
    <BottomModal isOpen={isOpen} onClose={onClose} height="adaptive" maxWidth="420">
      <div className="flex flex-col items-center justify-center gap-6">
        <div
          className={`w-[70px] h-[70px] rounded-full ${iconBgColor} flex items-center justify-center`}
        >
          {type === 'success' ? (
            <CheckIcon className={`w-6 h-6 ${iconColor}`} />
          ) : (
            <XMarkIcon className={`w-6 h-6 ${iconColor}`} />
          )}
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="text-h1 text-(--color-text-primary) text-center">{displayHeader}</h2>
          <p className="text-body md:text-[16px] text-(--color-text-secondary) text-center">
            {displayText}
          </p>
        </div>

        <Button onClick={onClose} className="w-full">
          {buttonText}
        </Button>
      </div>
    </BottomModal>
  )
}
