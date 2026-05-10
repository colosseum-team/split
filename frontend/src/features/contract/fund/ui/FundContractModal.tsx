import type { FC } from 'react'
import { BanknotesIcon } from '@heroicons/react/24/outline'
import { BottomModal, Button } from '@/shared/ui'
import { findCurrencyByCode } from '@/shared/constants/currencies'
import type { Contract } from '@/entities/contract'

interface FundContractModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  contract: Contract
  isSubmitting?: boolean
  error?: string | null
}

const truncatePubkey = (s: string | undefined) =>
  !s ? '' : s.length <= 12 ? s : `${s.slice(0, 6)}…${s.slice(-6)}`

export const FundContractModal: FC<FundContractModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  contract,
  isSubmitting = false,
  error,
}) => {
  const c = findCurrencyByCode(contract.currency)
  const symbol = c?.symbol || c?.code || contract.currency

  return (
    <BottomModal isOpen={isOpen} onClose={onClose} maxWidth="480">
      <div className="flex flex-col items-center gap-5">
        <div className="w-[64px] h-[64px] rounded-full bg-(--color-brand-accent) flex items-center justify-center">
          <BanknotesIcon className="w-7 h-7 text-(--color-brand)" />
        </div>
        <div className="flex flex-col gap-1 text-center">
          <h2 className="text-h2 text-(--color-text-primary)">Fund the escrow</h2>
          <p className="text-body text-(--color-text-secondary)">
            You will transfer{' '}
            <strong>
              {contract.amount} {symbol}
            </strong>{' '}
            from{' '}
            <span className="font-mono">{truncatePubkey(contract.customer.walletAddress)}</span>{' '}
            into escrow PDA{' '}
            <span className="font-mono">{truncatePubkey(contract.onchainAddress)}</span>. Phantom
            will ask you to sign one transaction; this is broadcast to Solana devnet.
          </p>
          <p className="text-[13px] leading-relaxed text-(--color-text-muted)">
            The performer cannot start work until the escrow is funded. Funds stay locked until you
            approve completion or a dispute resolves.
          </p>
        </div>

        {error && (
          <div className="w-full text-center text-[13px] font-medium text-(--color-state-danger)">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2 w-full">
          <Button onClick={onConfirm} disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Waiting for wallet…' : 'Sign and fund'}
          </Button>
          <Button onClick={onClose} variant="ghost" disabled={isSubmitting} className="w-full">
            Cancel
          </Button>
        </div>
      </div>
    </BottomModal>
  )
}
