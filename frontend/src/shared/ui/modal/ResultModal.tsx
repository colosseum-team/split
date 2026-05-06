import type { FC } from 'react'
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
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
    type === 'success' ? 'bg-(--color-modal-success-icon-bg)' : 'bg-(--color-modal-error-icon-bg)'

  const iconColor =
    type === 'success' ? 'text-(--color-modal-success-icon)' : 'text-(--color-modal-error-icon)'

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
          <h2 className="text-(--color-text-dark-blue) md:text-[28px] text-[20px] font-bold text-center">
            {displayHeader}
          </h2>
          <p className="text-(--color-modal-text) md:text-[18px] text-[14px] font-medium text-center">
            {displayText}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full h-[42px] bg-(--color-button) border border-(--color-button-border) text-[14px] font-bold text-center text-(--color-text-purple) hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed rounded-[6px] cursor-pointer"
        >
          {buttonText}
        </button>
      </div>
    </BottomModal>
  )
}
