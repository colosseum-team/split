import { type FC, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  BoltIcon,
  ChevronLeftIcon,
  DocumentTextIcon,
  PencilIcon,
} from '@heroicons/react/24/outline'
import { useContractsStore } from '@/entities/contract'
import { useUserStore } from '@/entities/user'
import { ContractSummary } from '@/widgets/contract'
import { SignContractModal } from '@/features/contract/sign'
import { ConfirmCompletionModal } from '@/features/contract/complete'
import { AuroraBackdrop, Button, ResultModal } from '@/shared/ui'

export const ContractViewPage: FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const contract = useContractsStore((s) => (id ? s.contracts.find((c) => c.id === id) : undefined))
  const signByWallet = useContractsStore((s) => s.signByWallet)
  const markCompleted = useContractsStore((s) => s.markCompleted)

  const role = useUserStore((s) => s.role)
  const walletAddress = useUserStore((s) => s.walletAddress)

  const [isSignOpen, setIsSignOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [resultOpen, setResultOpen] = useState<null | {
    type: 'success' | 'error'
    header: string
    text: string
  }>(null)
  const [isCompleting, setIsCompleting] = useState(false)

  const side = useMemo<'customer' | 'performer' | null>(() => {
    if (!contract || !walletAddress) return null
    if (contract.customer.walletAddress === walletAddress) return 'customer'
    if (contract.performer.walletAddress === walletAddress) return 'performer'
    return null
  }, [contract, walletAddress])

  if (!contract) {
    return (
      <div className="relative min-h-screen w-full bg-(--color-surface-base) overflow-x-hidden">
        <AuroraBackdrop fixed />
        <div className="sticky top-0 z-20 bg-(--color-surface-overlay) backdrop-blur-md border-b border-(--color-border-subtle)">
          <div className="w-full max-w-[820px] mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate('/home')}
              className="flex items-center gap-1 text-[14px] font-bold text-(--color-text-secondary) cursor-pointer hover:opacity-80"
              aria-label="Back"
            >
              <ChevronLeftIcon className="w-5 h-5" />
              <span>Back</span>
            </button>
          </div>
        </div>
        <main className="relative z-10 w-full max-w-[820px] mx-auto px-4 md:px-6 py-10 flex flex-col items-center justify-center gap-2 text-center">
          <h2 className="text-h2 text-(--color-text-primary)">Contract not found</h2>
          <p className="text-body text-(--color-text-secondary)">
            It might have been removed or the link is invalid.
          </p>
        </main>
      </div>
    )
  }

  const alreadySigned = !!(side && contract.signatures[side])

  const canSign =
    !!side && !alreadySigned && contract.status !== 'COMPLETED' && contract.status !== 'DECLINED'
  const canConfirmCompletion =
    role === 'customer' && side === 'customer' && contract.status === 'SIGNED'

  const handleSigned = (signature: string) => {
    if (!side || !walletAddress) return
    signByWallet(
      contract.id,
      {
        walletAddress,
        signature,
        signedAt: new Date().toISOString(),
      },
      side,
    )
    setIsSignOpen(false)
    setResultOpen({
      type: 'success',
      header: 'Contract signed',
      text: 'Your signature has been added to the contract.',
    })
  }

  const handleConfirmCompletion = () => {
    setIsCompleting(true)
    try {
      markCompleted(contract.id)
      setIsConfirmOpen(false)
      setResultOpen({
        type: 'success',
        header: 'Work confirmed',
        text: 'The contract is marked as completed. The performer will be paid (out of scope for this MVP).',
      })
    } catch {
      setResultOpen({
        type: 'error',
        header: 'Something went wrong',
        text: 'Could not confirm completion. Please try again.',
      })
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full bg-(--color-surface-base) overflow-x-hidden">
      <AuroraBackdrop fixed />

      <div className="sticky top-0 z-20 bg-(--color-surface-overlay) backdrop-blur-md border-b border-(--color-border-subtle)">
        <div className="w-full max-w-[820px] mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="flex items-center gap-1 text-[14px] font-bold text-(--color-text-secondary) cursor-pointer hover:opacity-80"
            aria-label="Back"
          >
            <ChevronLeftIcon className="w-5 h-5" />
            <span>Back</span>
          </button>
        </div>
      </div>

      <main className="relative z-10 w-full max-w-[820px] mx-auto p-4 sm:p-6">
        <ContractSummary
          contract={contract}
          actions={
            <div className="flex flex-col md:flex-row gap-3 flex-1">
              {canSign && (
                <Button onClick={() => setIsSignOpen(true)} size="lg" className="flex-1">
                  <DocumentTextIcon className="w-5 h-5" />
                  <PencilIcon className="w-5 h-5" />
                  Sign contract
                </Button>
              )}
              {canConfirmCompletion && (
                <Button
                  onClick={() => setIsConfirmOpen(true)}
                  variant="success"
                  size="lg"
                  className="flex-1"
                >
                  <BoltIcon className="w-5 h-5" />
                  Confirm work completion
                </Button>
              )}
            </div>
          }
        />
      </main>

      <SignContractModal
        isOpen={isSignOpen}
        onClose={() => setIsSignOpen(false)}
        contract={contract}
        onSigned={handleSigned}
      />

      <ConfirmCompletionModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmCompletion}
        amount={contract.amount}
        currency={contract.currency}
        performerName={contract.performer.fullName}
        isSubmitting={isCompleting}
      />

      <ResultModal
        isOpen={!!resultOpen}
        onClose={() => setResultOpen(null)}
        type={resultOpen?.type ?? 'success'}
        header={resultOpen?.header}
        text={resultOpen?.text}
      />
    </div>
  )
}
