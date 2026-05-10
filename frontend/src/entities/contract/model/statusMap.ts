import type { BackendContractDto, BackendContractStatus } from '@/shared/api/client'
import type { Contract, ContractStatus } from './types'

// Maps a backend status onto the SPA's status enum. Frontend distinguishes
// PENDING_SIGNING / PARTIALLY_SIGNED / SIGNED based on local text-hash
// signatures (the backend doesn't track those) — for backend statuses that
// happen *while we're still collecting signatures* (`open`, `draft`,
// `funded`, `in_progress`) we keep the locally computed value. Only when
// the backend reaches a state that has no local equivalent (`review`,
// `completed`, `disputed`, `cancelled`) do we let it overwrite the SPA's
// status.
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
      // Don't downgrade: if signatures already place us in SIGNED, keep it.
      return contract.status
  }
}

// Produces a partial contract patch suitable for `applyBackendContract`. The
// caller passes the local contract (for the status mapping) and the dto from
// the backend. Returned object is a plain mutate-not-replace patch.
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
  // Backend stores the release tx under `approveTxSignature`; the SPA
  // calls it `releaseTxSignature` (it's the chain `release` instruction).
  if (dto.approveTxSignature) patch.releaseTxSignature = dto.approveTxSignature
  if (dto.submissionPayload) patch.submissionPayload = dto.submissionPayload
  if (dto.disputeOpenedAt) patch.disputeOpenedAt = dto.disputeOpenedAt
  if (dto.disputeDueAt) patch.disputeDueAt = dto.disputeDueAt
  return patch
}
