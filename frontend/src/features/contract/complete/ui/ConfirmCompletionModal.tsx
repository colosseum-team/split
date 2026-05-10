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
  /**
   * `chain`: customer confirms via Phantom-signed release tx (real on-chain
   * payout). `mock`: legacy local-only completion (no chain wiring).
   */
  mode?: 'chain' | 'mock'
  /** Inline error from the approve hook (if any). */
  error?: string | null
}

export const ConfirmCompletionModal: FC<ConfirmCompletionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  amount,
  currency,
  performerName,
  isSubmitting = false,
  mode = 'mock',
  error,
}) => {
  const c = findCurrencyByCode(currency)
  const symbol = c?.symbol || c?.code || currency
  const isChain = mode === 'chain'

  return (
    <BottomModal isOpen={isOpen} onClose={onClose} maxWidth="480">
      <div className="flex flex-col items-center gap-5">
        <div className="w-[64px] h-[64px] rounded-full bg-(--color-state-success-soft) flex items-center justify-center">
          <CheckBadgeIcon className="w-7 h-7 text-(--color-state-success)" />
        </div>
        <div className="flex flex-col gap-1 text-center">
          <h2 className="text-h2 text-(--color-text-primary)">Confirm work is accepted?</h2>
          {isChain ? (
            <p className="text-body text-(--color-text-secondary)">
              Confirming will ask Phantom to sign a <strong>release</strong> transaction. Once it
              lands on Solana devnet, escrow PDA funds ({amount} {symbol}) are paid out to{' '}
              <strong>{performerName}</strong>.
            </p>
          ) : (
            <p className="text-body text-(--color-text-secondary)">
              You confirm that the deliverables match this contract. We then mark it{' '}
              <strong>completed</strong> and (in a full product) would release {amount} {symbol} to{' '}
              <strong>{performerName}</strong>. This contract has no on-chain escrow wired.
            </p>
          )}
          <p className="text-[13px] leading-relaxed text-(--color-text-muted)">
            Not satisfied yet? Tap <strong>Cancel</strong>, discuss changes with the performer, then
            confirm when ready.
          </p>
        </div>

        {error && (
          <div className="w-full text-center text-[13px] font-medium text-(--color-state-danger)">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2 w-full">
          <Button onClick={onConfirm} disabled={isSubmitting} className="w-full">
            {isSubmitting
              ? isChain
                ? 'Waiting for wallet…'
                : 'Confirming…'
              : isChain
                ? 'Sign and release'
                : 'Yes, work is complete'}
          </Button>
          <Button onClick={onClose} variant="ghost" disabled={isSubmitting} className="w-full">
            Cancel
          </Button>
        </div>
      </div>
    </BottomModal>
  )
}
