import { type FC, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { nanoid } from 'nanoid'
import { ShieldCheckIcon } from '@heroicons/react/24/outline'
import { BottomModal, Button } from '@/shared/ui'
import type { Contract } from '@/entities/contract'
import { signContractText } from '../lib/signContract'

interface SignContractModalProps {
  isOpen: boolean
  onClose: () => void
  contract: Contract
  /** Which party is signing; demo bypass is only offered for the performer. */
  signingSide: 'customer' | 'performer' | null
  onSigned: (signature: string) => void
}

export const SignContractModal: FC<SignContractModalProps> = ({
  isOpen,
  onClose,
  contract,
  signingSide,
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

  const handleDemoPerformerSign = () => {
    onSigned(`demo-performer:${nanoid()}`)
  }

  return (
    <BottomModal isOpen={isOpen} onClose={onClose} maxWidth="480">
      <div className="flex flex-col items-center gap-5">
        <div className="w-[64px] h-[64px] rounded-full bg-(--color-brand-accent) flex items-center justify-center">
          <ShieldCheckIcon className="w-7 h-7 text-(--color-brand)" />
        </div>
        <div className="flex flex-col gap-1 text-center">
          <h2 className="text-h2 text-(--color-text-primary)">Sign with your wallet</h2>
          <p className="text-body text-(--color-text-secondary)">
            Your wallet will be asked to sign a short text message that includes the SHA-256 hash of
            the contract. No transaction is broadcast.
          </p>
        </div>

        {error && (
          <div className="w-full text-center text-[13px] font-medium text-(--color-state-danger)">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2 w-full">
          <Button onClick={handleSign} disabled={isSigning || !signMessage} className="w-full">
            {isSigning ? 'Waiting for wallet…' : 'Sign with wallet'}
          </Button>
          {signingSide === 'performer' ? (
            <Button
              type="button"
              variant="secondary"
              onClick={handleDemoPerformerSign}
              disabled={isSigning}
              className="w-full"
            >
              Sign with demo signature
            </Button>
          ) : null}
          <Button onClick={onClose} variant="ghost" className="w-full">
            Cancel
          </Button>
        </div>
      </div>
    </BottomModal>
  )
}
