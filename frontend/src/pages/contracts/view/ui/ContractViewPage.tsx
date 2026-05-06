import { type FC, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeftIcon, PencilSquareIcon, CheckBadgeIcon } from '@heroicons/react/24/outline'
import { useContractsStore } from '@/entities/contract'
import { useUserStore } from '@/entities/user'
import { Header, Layout } from '@/widgets/layout'
import { ContractSummary } from '@/widgets/contract'
import { SignContractModal } from '@/features/contract/sign'
import { ConfirmCompletionModal } from '@/features/contract/complete'
import { ResultModal } from '@/shared/ui'

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
      <Layout>
        <Header className="items-center mb-4">
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="flex items-center gap-1 text-[14px] font-bold text-(--color-text-start-page) cursor-pointer hover:opacity-80"
          >
            <ChevronLeftIcon className="w-5 h-5" />
            Back
          </button>
        </Header>
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
          <h2 className="text-[20px] font-bold text-(--color-text-dark-blue)">
            Contract not found
          </h2>
          <p className="text-[14px] font-medium text-(--color-text-start-page)">
            It might have been removed or the link is invalid.
          </p>
        </div>
      </Layout>
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
    <Layout>
      <Header className="items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => navigate('/home')}
          className="flex items-center gap-1 text-[14px] font-bold text-(--color-text-start-page) cursor-pointer hover:opacity-80"
          aria-label="Back"
        >
          <ChevronLeftIcon className="w-5 h-5" />
          <span>Back</span>
        </button>
      </Header>

      <ContractSummary
        contract={contract}
        actions={
          <div className="flex flex-col md:flex-row gap-3 flex-1">
            {canSign && (
              <button
                type="button"
                onClick={() => setIsSignOpen(true)}
                className="flex-1 h-[48px] rounded-[10px] bg-(--color-button) border border-(--color-button-border) text-[14px] font-bold text-(--color-text-purple) flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
              >
                <PencilSquareIcon className="w-5 h-5" />
                Sign contract
              </button>
            )}
            {canConfirmCompletion && (
              <button
                type="button"
                onClick={() => setIsConfirmOpen(true)}
                className="flex-1 h-[48px] rounded-[10px] bg-(--color-modal-success-icon-bg) border border-(--color-modal-success-icon) text-[14px] font-bold text-(--color-modal-success-icon) flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
              >
                <CheckBadgeIcon className="w-5 h-5" />
                Confirm work completion
              </button>
            )}
          </div>
        }
      />

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
    </Layout>
  )
}
