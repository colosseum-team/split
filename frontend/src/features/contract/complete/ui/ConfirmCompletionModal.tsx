import type { FC } from 'react'
import { CheckBadgeIcon } from '@heroicons/react/24/outline'
import { BottomModal } from '@/shared/ui'
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
        <div className="w-[64px] h-[64px] rounded-full bg-[var(--color-modal-success-icon-bg)] flex items-center justify-center">
          <CheckBadgeIcon className="w-7 h-7 text-[var(--color-modal-success-icon)]" />
        </div>
        <div className="flex flex-col gap-1 text-center">
          <h2 className="md:text-[22px] text-[18px] font-bold text-[var(--color-text-dark-blue)]">
            Confirm work completion?
          </h2>
          <p className="md:text-[15px] text-[13px] font-medium text-[var(--color-modal-text)] leading-snug">
            By confirming, you mark the contract as completed and approve the release of {amount}{' '}
            {symbol} to <strong>{performerName}</strong>. The on-chain payout step is intentionally
            out of scope for this MVP.
          </p>
        </div>

        <div className="flex flex-col gap-2 w-full">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="w-full h-[44px] bg-[var(--color-button)] border border-[var(--color-button-border)] rounded-[8px] text-[14px] font-bold text-[var(--color-text-purple)] cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {isSubmitting ? 'Confirming…' : 'Confirm completion'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full h-[44px] rounded-[8px] text-[14px] font-bold text-[var(--color-text-start-page)] cursor-pointer hover:opacity-80"
          >
            Cancel
          </button>
        </div>
      </div>
    </BottomModal>
  )
}
