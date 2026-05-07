import type { FC } from 'react'
import { BriefcaseIcon } from '@heroicons/react/24/outline'
import type { Contract } from '@/entities/contract'
import { findTemplate } from '@/entities/contract'
import { StatusBadge } from '@/shared/ui'

interface ContractSummaryHeaderProps {
  contract: Contract
}

export const ContractSummaryHeader: FC<ContractSummaryHeaderProps> = ({ contract }) => {
  const template = findTemplate(contract.templateKey)
  const typeLabel = template?.shortTitle ?? contract.templateKey

  return (
    <header className="relative overflow-hidden rounded-[var(--radius-xl)] border border-white/60 bg-white/70 backdrop-blur-md shadow-[var(--shadow-md)] p-5 md:p-7 flex flex-col gap-4">
      <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-(--color-decor-peach) opacity-70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-12 h-48 w-48 rounded-full bg-(--color-decor-lavender) opacity-60 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div
            className="
              inline-flex w-fit items-center gap-2 rounded-(--radius-pill)
              border border-(--color-brand-accent-border)
              bg-[linear-gradient(135deg,var(--color-brand-soft)_0%,var(--color-brand-accent)_55%,var(--color-surface-raised)_100%)]
              px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-(--color-brand)
              shadow-[var(--shadow-sm)]
            "
          >
            <BriefcaseIcon className="h-4 w-4 shrink-0" aria-hidden />
            <span>{typeLabel}</span>
          </div>
          <StatusBadge status={contract.status} className="shrink-0" />
        </div>

        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-h1 text-(--color-text-primary) wrap-break-word leading-tight">
            {contract.title}
          </h1>
          <span className="text-mono text-(--color-text-muted)">{contract.number}</span>
        </div>

        {contract.subject ? (
          <p className="line-clamp-3 text-body text-(--color-text-secondary) leading-relaxed">
            {contract.subject}
          </p>
        ) : null}
      </div>
    </header>
  )
}
