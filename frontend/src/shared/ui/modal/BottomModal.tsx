import type { CSSProperties, MouseEvent, ReactNode } from 'react'
import { useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

export type BottomModalHeight = 'full' | 'adaptive'

export interface BottomModalHandle {
  close: () => void
}

interface BottomModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  height?: BottomModalHeight
  headerTitle?: string
  headerIcon?: ReactNode
  className?: string
  maxWidth?: string
}

export const BottomModal = forwardRef<BottomModalHandle, BottomModalProps>(
  (
    {
      isOpen,
      onClose,
      children,
      height = 'adaptive',
      headerTitle,
      headerIcon,
      className = '',
      maxWidth,
    },
    ref,
  ) => {
    const [isClosing, setIsClosing] = useState(false)
    const [shouldRender, setShouldRender] = useState(isOpen)

    useEffect(() => {
      if (isOpen) {
        setShouldRender(true)
        setIsClosing(false)
      } else if (shouldRender) {
        setIsClosing(true)
        const timer = setTimeout(() => {
          setShouldRender(false)
          setIsClosing(false)
        }, 300)
        return () => clearTimeout(timer)
      }
    }, [isOpen, shouldRender])

    const handleClose = useCallback(() => {
      if (isClosing) return
      setIsClosing(true)
      setTimeout(() => {
        onClose()
      }, 300)
    }, [isClosing, onClose])

    useEffect(() => {
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && isOpen && !isClosing) {
          handleClose()
        }
      }

      if (isOpen && !isClosing) {
        document.addEventListener('keydown', handleEscape)
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
      }

      return () => {
        document.removeEventListener('keydown', handleEscape)
        document.body.style.overflow = ''
      }
    }, [isOpen, isClosing, handleClose])

    useEffect(() => {
      if (!shouldRender && !isOpen) {
        document.body.style.overflow = ''
      }
    }, [shouldRender, isOpen])

    useImperativeHandle(ref, () => ({
      close: handleClose,
    }))

    if (!shouldRender) return null

    const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget && !isClosing) {
        handleClose()
      }
    }

    const handleHandleClick = () => {
      if (!isClosing) {
        handleClose()
      }
    }

    const heightClass = height === 'full' ? 'h-full' : 'max-h-[90vh]'
    const desktopHeightClass = 'min-[500px]:h-auto min-[500px]:max-h-[90vh]'
    const desktopMaxWidthClass = !maxWidth ? 'min-[500px]:max-w-[480px]' : ''
    const maxWidthValue = maxWidth ? maxWidth.replace(/px$/, '') + 'px' : undefined
    const panelStyle: CSSProperties | undefined = maxWidthValue
      ? ({ ['--bottom-modal-max-width' as string]: maxWidthValue } as CSSProperties)
      : undefined

    return (
      <div
        className={`modal-bg bottom-modal-backdrop fixed inset-0 z-50 flex items-end min-[500px]:items-center ${
          isClosing ? 'closing' : ''
        }`}
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
      >
        <div
          className={`bottom-modal-panel w-full ${desktopMaxWidthClass} min-[500px]:w-full min-[500px]:mx-auto bg-(--color-surface-raised) rounded-t-[var(--radius-xl)] min-[500px]:rounded-[var(--radius-xl)] border-t border-l border-r min-[500px]:border border-(--color-border-subtle) shadow-[var(--shadow-md)] flex flex-col ${heightClass} ${desktopHeightClass} ${
            isClosing ? 'closing' : ''
          } ${className}`}
          style={panelStyle}
          {...(maxWidthValue ? { 'data-max-width': '' } : {})}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            onClick={handleHandleClick}
            className="flex justify-center p-3 cursor-pointer min-[500px]:hidden"
          >
            <div className="w-12 h-1 bg-(--color-border-default) rounded-full" />
          </div>

          {headerTitle && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-(--color-border-subtle)">
              <div className="flex items-center gap-3">
                {headerIcon && (
                  <div className="shrink-0 bg-(--color-brand-accent) rounded-[var(--radius-md)] p-2">
                    <div className="text-(--color-brand)">{headerIcon}</div>
                  </div>
                )}
                <h3 className="text-h3 text-(--color-text-primary)">{headerTitle}</h3>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="ml-auto text-(--color-text-secondary) hover:text-(--color-text-primary) transition-colors cursor-pointer"
                aria-label="Close"
              >
                <XMarkIcon className="h-[20px] w-auto" />
              </button>
            </div>
          )}

          <div className="flex-1 min-h-0 min-w-0 w-full overflow-y-auto overflow-x-hidden p-6 min-[500px]:p-8">
            {children}
          </div>
        </div>
      </div>
    )
  },
)

BottomModal.displayName = 'BottomModal'
