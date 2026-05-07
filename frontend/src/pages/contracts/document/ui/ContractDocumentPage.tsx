import type { FC } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { useContractsStore } from '@/entities/contract'
import { ContractDocument } from '@/widgets/contract'
import { AuroraBackdrop } from '@/shared/ui'

export const ContractDocumentPage: FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const contract = useContractsStore((s) => (id ? s.contracts.find((c) => c.id === id) : undefined))

  const handleBack = () => {
    if (id) {
      navigate(`/contracts/${id}`)
    } else {
      navigate('/home')
    }
  }

  if (!contract) {
    return (
      <div className="relative min-h-screen w-full bg-(--color-surface-base) flex flex-col items-center justify-center gap-3 px-4 py-10 overflow-x-hidden">
        <AuroraBackdrop fixed />
        <h2 className="relative z-10 text-h2 text-(--color-text-primary)">Contract not found</h2>
        <p className="relative z-10 text-body text-(--color-text-secondary) text-center max-w-[420px]">
          It might have been removed or the link is invalid.
        </p>
        <button
          type="button"
          onClick={() => navigate('/home')}
          className="relative z-10 flex items-center gap-1 text-[14px] font-bold text-(--color-text-secondary) cursor-pointer hover:opacity-80"
        >
          <ChevronLeftIcon className="w-5 h-5" />
          Back to home
        </button>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen w-full bg-(--color-surface-base) overflow-x-hidden">
      <AuroraBackdrop fixed />
      <div className="sticky top-0 z-20 bg-(--color-surface-overlay) backdrop-blur-md border-b border-(--color-border-subtle)">
        <div className="w-full max-w-[820px] mx-auto px-4 md:px-0 py-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1 text-[14px] font-bold text-(--color-text-secondary) cursor-pointer hover:opacity-80"
            aria-label="Back to summary"
          >
            <ChevronLeftIcon className="w-5 h-5" />
            <span>Back</span>
          </button>
          <span className="text-[12px] font-mono text-(--color-text-muted) truncate">
            {contract.number}
          </span>
        </div>
      </div>

      <main className="relative z-10 w-full px-4 md:px-6 py-6 md:py-10">
        <ContractDocument contract={contract} />
      </main>
    </div>
  )
}
