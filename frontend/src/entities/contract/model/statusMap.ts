import { nanoid } from 'nanoid'
import type { BackendContractDto, BackendContractStatus } from '@/shared/api/client'
import { findTemplate, renderContractText, type ContractTemplateKey } from './templates'
import type { Contract, ContractParty, ContractStatus } from './types'

export function mapBackendStatus(
  beStatus: BackendContractStatus,
  contract: Contract,
): ContractStatus {
  switch (beStatus) {
    case 'review':
      return 'REVIEW'
    case 'completed':
      return 'COMPLETED'
    case 'disputed':
      return 'DISPUTED'
    case 'cancelled':
      return 'DECLINED'
    case 'draft':
    case 'open':
    case 'funded':
    case 'in_progress':
    default:
      return contract.status
  }
}

export function patchFromBackendDto(
  dto: BackendContractDto,
  contract: Contract,
): Partial<Contract> {
  const patch: Partial<Contract> = {
    backendId: dto.id,
    backendStatus: dto.status,
    status: mapBackendStatus(dto.status, contract),
  }
  if (dto.onchainAddress) patch.onchainAddress = dto.onchainAddress
  if (dto.contractHash) patch.textHash = dto.contractHash
  if (dto.fundTxSignature) patch.fundTxSignature = dto.fundTxSignature
  if (dto.approveTxSignature) patch.releaseTxSignature = dto.approveTxSignature
  if (dto.submissionPayload) patch.submissionPayload = dto.submissionPayload
  if (dto.disputeOpenedAt) patch.disputeOpenedAt = dto.disputeOpenedAt
  if (dto.disputeDueAt) patch.disputeDueAt = dto.disputeDueAt
  return patch
}

function initialStatusFromBackend(beStatus: BackendContractStatus): ContractStatus {
  switch (beStatus) {
    case 'review':
      return 'REVIEW'
    case 'completed':
      return 'COMPLETED'
    case 'disputed':
      return 'DISPUTED'
    case 'cancelled':
      return 'DECLINED'
    default:
      return 'PENDING_SIGNING'
  }
}

function inferChainMode(onchainAddress: string | null): Contract['chainMode'] {
  if (!onchainAddress) return undefined
  return onchainAddress.startsWith('mockPda_') ? 'mock' : 'solana'
}

export function stubContractFromBackendDto(dto: BackendContractDto): Contract {
  const templateKey: ContractTemplateKey = 'custom'
  const template = findTemplate(templateKey)

  const customer: ContractParty = {
    fullName: '',
    email: '',
    walletAddress: dto.customerAddress,
  }
  const performer: ContractParty = {
    fullName: '',
    email: '',
    walletAddress: dto.assigneeAddress ?? undefined,
  }

  const amount = Number(dto.amount)
  const subject = dto.title
  const technicalAssignment = dto.description
  const number = `№ ${dto.id.slice(0, 8).toUpperCase()}`
  const jurisdictionCode = 'US'
  const text = template
    ? renderContractText({
        template,
        customer,
        performer,
        subject,
        technicalAssignment,
        amount,
        currency: dto.currency,
        jurisdictionCode,
        startDate: null,
        endDate: dto.deadline,
        contractNumber: number,
        disputeResolutionDays: dto.disputeResolutionDays,
      })
    : technicalAssignment

  return {
    id: nanoid(),
    templateKey,
    number,
    title: dto.title,
    customer,
    performer,
    subject,
    technicalAssignment,
    jurisdictionCode,
    currency: dto.currency,
    amount: Number.isFinite(amount) ? amount : 0,
    startDate: null,
    endDate: dto.deadline,
    text,
    textHash: dto.contractHash ?? undefined,
    signatures: {},
    status: initialStatusFromBackend(dto.status),
    disputeResolutionDays: dto.disputeResolutionDays,
    disputeOpenedAt: dto.disputeOpenedAt ?? undefined,
    disputeDueAt: dto.disputeDueAt ?? undefined,
    createdBy: dto.customerAddress,
    backendId: dto.id,
    backendStatus: dto.status,
    onchainAddress: dto.onchainAddress ?? undefined,
    fundTxSignature: dto.fundTxSignature ?? undefined,
    releaseTxSignature: dto.approveTxSignature ?? undefined,
    submissionPayload: dto.submissionPayload ?? undefined,
    chainMode: inferChainMode(dto.onchainAddress),
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  }
}
