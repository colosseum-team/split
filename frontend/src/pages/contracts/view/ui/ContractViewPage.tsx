import { type FC, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeftIcon, PencilSquareIcon, CheckBadgeIcon } from '@heroicons/react/24/outline'
import { useContractsStore } from '@/entities/contract'
import { useUserStore } from '@/entities/user'
import { Header, Layout } from '@/widgets/layout'
import { ContractSummary } from '@/widgets/contract'
import { SignContractModal } from '@/features/contract/sign'
import { ConfirmCompletionModal } from '@/features/contract/complete'
import { Button, ResultModal } from '@/shared/ui'

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
            className="flex items-center gap-1 text-[14px] font-bold text-(--color-text-secondary) cursor-pointer hover:opacity-80"
          >
            <ChevronLeftIcon className="w-5 h-5" />
            Back
          </button>
        </Header>
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
          <h2 className="text-h2 text-(--color-text-primary)">Contract not found</h2>
          <p className="text-body text-(--color-text-secondary)">
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
          className="flex items-center gap-1 text-[14px] font-bold text-(--color-text-secondary) cursor-pointer hover:opacity-80"
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
              <Button onClick={() => setIsSignOpen(true)} size="lg" className="flex-1">
                <PencilSquareIcon className="w-5 h-5" />
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
                <CheckBadgeIcon className="w-5 h-5" />
                Confirm work completion
              </Button>
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
