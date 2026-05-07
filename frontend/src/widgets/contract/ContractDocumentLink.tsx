import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowTopRightOnSquareIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import type { Contract } from '@/entities/contract'

interface ContractDocumentLinkProps {
  contract: Contract
}

export const ContractDocumentLink: FC<ContractDocumentLinkProps> = ({ contract }) => {
  const navigate = useNavigate()

  return (
    <div
      className="
        relative overflow-hidden flex min-w-0 flex-col gap-4
        rounded-[var(--radius-xl)] border border-white/60 bg-white/70 backdrop-blur-md
        p-5 md:p-6 shadow-[var(--shadow-sm)]
        md:flex-row md:items-center md:justify-between md:gap-4
      "
    >
      <div className="pointer-events-none absolute -top-16 -right-12 h-40 w-40 rounded-full bg-(--color-decor-lavender) opacity-60 blur-3xl" />

      <div className="relative z-10 flex min-w-0 items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[linear-gradient(135deg,var(--color-brand-soft)_0%,var(--color-brand-accent)_100%)] text-(--color-brand) shadow-[var(--shadow-sm)]">
          <DocumentTextIcon className="h-6 w-6" aria-hidden />
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="text-[10px] uppercase tracking-[0.12em] font-bold text-(--color-text-muted)">
            Contract document
          </span>
          <span className="text-body font-bold text-(--color-text-primary) wrap-break-word leading-tight">
            {contract.title}
          </span>
          <span className="text-mono text-(--color-text-muted)">{contract.number}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate(`/contracts/${contract.id}/document`)}
        className="
          relative z-10 inline-flex w-full cursor-pointer items-center justify-center gap-2
          rounded-[var(--radius-md)] border border-(--color-brand-accent-border)
          bg-[linear-gradient(135deg,var(--color-brand-soft)_0%,var(--color-brand-accent)_55%,var(--color-surface-raised)_100%)]
          px-5 py-3 text-[14px] font-bold text-(--color-brand)
          shadow-[var(--shadow-sm)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]
          md:w-auto md:min-w-[200px]
        "
      >
        <span>View full document</span>
        <ArrowTopRightOnSquareIcon className="h-5 w-5 shrink-0" aria-hidden />
      </button>
    </div>
  )
}
