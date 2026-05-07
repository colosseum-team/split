import { type FC, type ReactNode, useState } from 'react'
import type { Contract } from '@/entities/contract'
import { ConditionDetailsModal } from './ConditionDetailsModal'
import { ContractConditions } from './ContractConditions'
import { ContractDocumentLink } from './ContractDocumentLink'
import { ContractParties, type ContractSummaryDetailPayload } from './ContractParties'
import { ContractSummaryHeader } from './ContractSummaryHeader'

interface ContractSummaryProps {
  contract: Contract
  /** Optional slot in the action area (sign / decline / confirm completion). */
  actions?: ReactNode
}

export const ContractSummary: FC<ContractSummaryProps> = ({ contract, actions }) => {
  const [detail, setDetail] = useState<ContractSummaryDetailPayload | null>(null)

  return (
    <>
      <div className="mx-auto flex w-full max-w-[820px] flex-col gap-4">
        <ContractSummaryHeader contract={contract} />
        <ContractParties contract={contract} onSelectDetail={setDetail} />
        <ContractConditions contract={contract} onSelectDetail={setDetail} />
        <ContractDocumentLink contract={contract} />
        {actions ? (
          <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-stretch">{actions}</div>
        ) : null}
      </div>

      <ConditionDetailsModal
        isOpen={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.title ?? ''}
        icon={detail?.icon}
        value={detail?.value}
        description={detail?.description}
      />
    </>
  )
}
