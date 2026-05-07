import type { FC, MouseEvent, ReactNode } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  className?: string
  showCloseButton?: boolean
}

export const Modal: FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className = '',
  showCloseButton = true,
}) => {
  if (!isOpen) return null

  const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
      style={{ backgroundColor: 'var(--color-surface-overlay)' }}
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-(--color-surface-raised) rounded-[var(--radius-xl)] p-[30px] w-full mx-4 relative border border-(--color-border-subtle) shadow-[var(--shadow-md)] ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-(--color-text-secondary) hover:text-(--color-text-primary) transition-colors cursor-pointer"
            aria-label="Close"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}

        {children}
      </div>
    </div>
  )
}
