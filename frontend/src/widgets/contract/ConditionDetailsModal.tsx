import type { FC, ReactNode } from 'react'
import { Modal } from '@/shared/ui'

export interface ConditionDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  icon?: ReactNode
  value?: string
  description?: ReactNode
}

export const ConditionDetailsModal: FC<ConditionDetailsModalProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  value,
  description,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[520px]">
      <div className="flex flex-col gap-4 pr-6">
        <div className="flex items-start gap-3">
          {icon ? (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-(--color-brand-soft) text-(--color-brand) [&>svg]:h-7 [&>svg]:w-7">
              {icon}
            </div>
          ) : null}
          <h2 className="text-h2 text-(--color-text-primary) pt-0.5">{title}</h2>
        </div>
        {value ? (
          <p className="text-body font-bold text-(--color-text-primary) whitespace-pre-wrap wrap-break-word">
            {value}
          </p>
        ) : null}
        {description ? (
          <div className="text-body text-(--color-text-secondary) leading-relaxed">
            {description}
          </div>
        ) : null}
      </div>
    </Modal>
  )
}
