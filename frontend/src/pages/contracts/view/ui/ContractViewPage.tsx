import { type FC, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BoltIcon, ChevronLeftIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { useContractsStore } from '@/entities/contract'
import { useUserStore } from '@/entities/user'
import { ContractSummary } from '@/widgets/contract'
import { SignContractModal } from '@/features/contract/sign'
import { ConfirmCompletionModal } from '@/features/contract/complete'
import { OpenDisputeModal } from '@/features/contract/dispute'
import { DisputeWorkspace } from '@/features/disputes'
import { AuroraBackdrop, Button, ResultModal } from '@/shared/ui'

export const ContractViewPage: FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const contract = useContractsStore((s) => (id ? s.contracts.find((c) => c.id === id) : undefined))
  const signByWallet = useContractsStore((s) => s.signByWallet)
  const markCompleted = useContractsStore((s) => s.markCompleted)
  const openDisputeStore = useContractsStore((s) => s.openDispute)
  const appendDisputeMessage = useContractsStore((s) => s.appendDisputeMessage)
  const appendDisputeAttachment = useContractsStore((s) => s.appendDisputeAttachment)
  const claimPerformerWallet = useContractsStore((s) => s.claimPerformerWallet)

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
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false)
  const [isDisputeSubmitting, setIsDisputeSubmitting] = useState(false)

  const side = useMemo<'customer' | 'performer' | null>(() => {
    if (!contract || !walletAddress) return null
    if (contract.customer.walletAddress === walletAddress) return 'customer'
    if (contract.performer.walletAddress === walletAddress) return 'performer'
    return null
  }, [contract, walletAddress])

  useEffect(() => {
    if (!contract || !id) return
    if (role !== 'performer') return
    if (!walletAddress) return
    if (contract.performer.walletAddress) return
    claimPerformerWallet(id, walletAddress)
  }, [claimPerformerWallet, contract, id, role, walletAddress])

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
    !!side &&
    !alreadySigned &&
    contract.status !== 'COMPLETED' &&
    contract.status !== 'DECLINED' &&
    contract.status !== 'DISPUTED'
  const canConfirmCompletion =
    role === 'customer' &&
    side === 'customer' &&
    (contract.status === 'SIGNED' || contract.status === 'REVIEW')

  const canOpenDispute =
    role === 'customer' &&
    side === 'customer' &&
    (contract.status === 'SIGNED' || contract.status === 'REVIEW')

  const signedBothParties = contract.status === 'SIGNED' || contract.status === 'REVIEW'
  const customerWalletMatches = contract.customer.walletAddress === walletAddress
  const showRoleMismatchForCompletion =
    signedBothParties && customerWalletMatches && role !== 'customer'
  const showPerformerWaitingForCustomerConfirm = signedBothParties && side === 'performer'
  const showDisputeActiveNotice = contract.status === 'DISPUTED' && !!side

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
        text: 'The contract is marked as completed. On-chain payout is out of scope for this MVP.',
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

  const handleOpenDisputeConfirmed = () => {
    setIsDisputeSubmitting(true)
    try {
      openDisputeStore(contract.id)
      setIsDisputeModalOpen(false)
      setResultOpen({
        type: 'success',
        header: 'Dispute opened',
        text: 'This contract is now disputed (local demo). Use the dispute section below to add comments and files.',
      })
    } catch {
      setResultOpen({
        type: 'error',
        header: 'Something went wrong',
        text: 'Could not open dispute. Please try again.',
      })
    } finally {
      setIsDisputeSubmitting(false)
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

      <main className="relative z-10 w-full max-w-[820px] mx-auto p-4 sm:p-6 space-y-8">
        {showRoleMismatchForCompletion && (
          <aside
            className="rounded-[var(--radius-xl)] border border-amber-300/80 bg-amber-50/95 px-4 py-3 text-[14px] text-amber-950 shadow-[var(--shadow-sm)] backdrop-blur-sm"
            role="status"
          >
            <p className="font-bold text-[13px] uppercase tracking-wide text-amber-900/90">
              Role mismatch
            </p>
            <p className="mt-1 text-body leading-relaxed text-amber-950/95">
              Your wallet matches the customer on this contract, but the app role is not Customer.
              On the start screen, choose <strong>Customer</strong> — then “Confirm work completion”
              and “Open dispute” will appear below the contract summary.
            </p>
          </aside>
        )}

        {showPerformerWaitingForCustomerConfirm && (
          <aside
            className="rounded-[var(--radius-xl)] border border-(--color-border-subtle) bg-(--color-surface-raised)/95 px-4 py-3 text-[14px] text-(--color-text-primary) shadow-[var(--shadow-sm)] backdrop-blur-sm"
            role="status"
          >
            <p className="font-bold text-[13px] uppercase tracking-wide text-(--color-text-secondary)">
              Waiting for customer
            </p>
            <p className="mt-1 text-body leading-relaxed text-(--color-text-secondary)">
              Both signatures are collected. Only the <strong>customer</strong> can confirm that
              work is accepted — you will see status change to Completed after they confirm. There
              is no separate “confirm” action for the performer here.
            </p>
          </aside>
        )}

        {canConfirmCompletion && (
          <aside
            className="rounded-[var(--radius-xl)] border border-emerald-400/50 bg-emerald-50/90 px-4 py-3 text-[14px] text-emerald-950 shadow-[var(--shadow-sm)] backdrop-blur-sm"
            role="status"
          >
            <p className="font-bold text-[13px] uppercase tracking-wide text-emerald-900/90">
              Next step
            </p>
            <p className="mt-1 text-body leading-relaxed text-emerald-950/95">
              If deliverables match the agreement, use <strong>Confirm work completion</strong>{' '}
              below. If you do not accept them, use <strong>Open dispute</strong> — it only marks
              the contract disputed here (demo); it is not inside the acceptance modal.
            </p>
          </aside>
        )}

        {showDisputeActiveNotice && (
          <aside
            className="rounded-[var(--radius-xl)] border border-rose-300/70 bg-rose-50/95 px-4 py-3 text-[14px] text-rose-950 shadow-[var(--shadow-sm)] backdrop-blur-sm"
            role="status"
          >
            <p className="font-bold text-[13px] uppercase tracking-wide text-rose-900/90">
              Dispute open
            </p>
            <p className="mt-1 text-body leading-relaxed text-rose-950/95">
              This contract is <strong>Disputed</strong>. Use the workspace below within the
              calendar window. On-chain steps are out of scope for this MVP.
            </p>
          </aside>
        )}

        <ContractSummary
          contract={contract}
          actions={
            <div className="flex flex-col md:flex-row gap-3 flex-1">
              {canSign && (
                <Button onClick={() => setIsSignOpen(true)} size="lg" className="flex-1">
                  <DocumentTextIcon className="w-5 h-5" />
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
              {canOpenDispute && (
                <Button
                  type="button"
                  onClick={() => setIsDisputeModalOpen(true)}
                  variant="danger"
                  size="lg"
                  className="flex-1"
                >
                  Open dispute
                </Button>
              )}
            </div>
          }
        />

        {contract.status === 'DISPUTED' && (
          <DisputeWorkspace
            contract={contract}
            viewerSide={side}
            onSaveComment={(body) => {
              if (!side) return
              appendDisputeMessage(contract.id, side, body)
            }}
            onAddAttachments={(files) => {
              files.forEach((f) => appendDisputeAttachment(contract.id, f))
            }}
          />
        )}
      </main>

      <SignContractModal
        isOpen={isSignOpen}
        onClose={() => setIsSignOpen(false)}
        contract={contract}
        signingSide={side}
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

      <OpenDisputeModal
        isOpen={isDisputeModalOpen}
        onClose={() => setIsDisputeModalOpen(false)}
        onConfirm={handleOpenDisputeConfirmed}
        contractTitle={contract.title}
        isSubmitting={isDisputeSubmitting}
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
