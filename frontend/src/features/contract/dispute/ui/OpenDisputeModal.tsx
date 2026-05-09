import type { FC } from 'react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { BottomModal, Button } from '@/shared/ui'

interface OpenDisputeModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  contractTitle: string
  isSubmitting?: boolean
}

export const OpenDisputeModal: FC<OpenDisputeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  contractTitle,
  isSubmitting = false,
}) => {
  return (
    <BottomModal isOpen={isOpen} onClose={onClose} maxWidth="480">
      <div className="flex flex-col items-center gap-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-(--color-state-danger-soft)">
          <ExclamationTriangleIcon className="h-8 w-8 text-(--color-state-danger)" aria-hidden />
        </div>
        <div className="flex flex-col gap-1 text-center">
          <h2 className="text-h2 text-(--color-text-primary)">Open a dispute?</h2>
          <p className="text-body text-(--color-text-secondary)">
            This marks <strong>{contractTitle}</strong> as disputed (local demo). It is separate
            from accepting work — use this if you do not accept the deliverables. On-chain actions
            are out of scope for this MVP.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2">
          <Button
            type="button"
            variant="danger"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Opening…' : 'Open dispute'}
          </Button>
          <Button type="button" onClick={onClose} variant="ghost" className="w-full">
            Cancel
          </Button>
        </div>
      </div>
    </BottomModal>
  )
}
