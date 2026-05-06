import { type FC, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { ShieldCheckIcon } from '@heroicons/react/24/outline'
import { BottomModal } from '@/shared/ui'
import type { Contract } from '@/entities/contract'
import { signContractText } from '../lib/signContract'

interface SignContractModalProps {
  isOpen: boolean
  onClose: () => void
  contract: Contract
  onSigned: (signature: string) => void
}

export const SignContractModal: FC<SignContractModalProps> = ({
  isOpen,
  onClose,
  contract,
  onSigned,
}) => {
  const { signMessage, publicKey } = useWallet()
  const [isSigning, setIsSigning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSign = async () => {
    if (!signMessage || !publicKey) {
      setError('Connect a wallet that supports signMessage to continue.')
      return
    }
    setError(null)
    setIsSigning(true)
    try {
      const { signature } = await signContractText({ text: contract.text, signMessage })
      onSigned(signature)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to sign the contract')
    } finally {
      setIsSigning(false)
    }
  }

  return (
    <BottomModal isOpen={isOpen} onClose={onClose} maxWidth="480">
      <div className="flex flex-col items-center gap-5">
        <div className="w-[64px] h-[64px] rounded-full bg-[var(--color-button)] flex items-center justify-center">
          <ShieldCheckIcon className="w-7 h-7 text-[var(--color-text-purple)]" />
        </div>
        <div className="flex flex-col gap-1 text-center">
          <h2 className="md:text-[22px] text-[18px] font-bold text-[var(--color-text-dark-blue)]">
            Sign with your wallet
          </h2>
          <p className="md:text-[15px] text-[13px] font-medium text-[var(--color-modal-text)] leading-snug">
            Your wallet will be asked to sign the SHA-256 hash of the contract text. No transaction
            is broadcast.
          </p>
        </div>

        {error && (
          <div className="w-full text-center text-[13px] font-medium text-[var(--color-text-warning)]">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2 w-full">
          <button
            type="button"
            onClick={handleSign}
            disabled={isSigning || !signMessage}
            className="w-full h-[44px] bg-[var(--color-button)] border border-[var(--color-button-border)] rounded-[8px] text-[14px] font-bold text-[var(--color-text-purple)] cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSigning ? 'Waiting for wallet…' : 'Sign with wallet'}
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
