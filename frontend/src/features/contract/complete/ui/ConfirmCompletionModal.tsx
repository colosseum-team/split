import type { FC } from 'react'
import { CheckBadgeIcon } from '@heroicons/react/24/outline'
import { BottomModal, Button } from '@/shared/ui'
import { findCurrencyByCode } from '@/shared/constants/currencies'

interface ConfirmCompletionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  amount: number
  currency: string
  performerName: string
  isSubmitting?: boolean
}

export const ConfirmCompletionModal: FC<ConfirmCompletionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  amount,
  currency,
  performerName,
  isSubmitting = false,
}) => {
  const c = findCurrencyByCode(currency)
  const symbol = c?.symbol || c?.code || currency

  return (
    <BottomModal isOpen={isOpen} onClose={onClose} maxWidth="480">
      <div className="flex flex-col items-center gap-5">
        <div className="w-[64px] h-[64px] rounded-full bg-(--color-state-success-soft) flex items-center justify-center">
          <CheckBadgeIcon className="w-7 h-7 text-(--color-state-success)" />
        </div>
        <div className="flex flex-col gap-1 text-center">
          <h2 className="text-h2 text-(--color-text-primary)">Confirm work completion?</h2>
          <p className="text-body text-(--color-text-secondary)">
            By confirming, you mark the contract as completed and approve the release of {amount}{' '}
            {symbol} to <strong>{performerName}</strong>. The on-chain payout step is intentionally
            out of scope for this MVP.
          </p>
        </div>

        <div className="flex flex-col gap-2 w-full">
          <Button onClick={onConfirm} disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Confirming…' : 'Confirm completion'}
          </Button>
          <Button onClick={onClose} variant="ghost" className="w-full">
            Cancel
          </Button>
        </div>
      </div>
    </BottomModal>
  )
}
