import type { ContractTemplateKey } from './templates'

export type ContractStatus =
  | 'DRAFT'
  | 'PENDING_SIGNING'
  | 'PARTIALLY_SIGNED'
  | 'SIGNED'
  /** Work submitted / awaiting customer acceptance (aligns with backend `review`). */
  | 'REVIEW'
  /** Parties disagree — dispute opened (aligns with backend `disputed`). */
  | 'DISPUTED'
  | 'COMPLETED'
  | 'DECLINED'

export interface ContractParty {
  fullName: string
  email: string
  companyName?: string
  walletAddress?: string
}

export interface ContractSignature {
  walletAddress: string
  signature: string
  signedAt: string
}

export interface ContractSignatures {
  customer?: ContractSignature
  performer?: ContractSignature
}

export interface DisputeMessage {
  id: string
  side: 'customer' | 'performer'
  body: string
  createdAt: string
}

export interface DisputeAttachment {
  id: string
  fileName: string
  mimeType: string
  sizeBytes: number
  addedAt: string
}

export interface Contract {
  id: string
  templateKey: ContractTemplateKey
  number: string
  title: string

  customer: ContractParty
  performer: ContractParty

  subject: string
  technicalAssignment: string
  jurisdictionCode: string
  currency: string
  amount: number

  startDate: string | null
  endDate: string | null
  additionalTerms?: string

  text: string
  textHash?: string

  signatures: ContractSignatures
  status: ContractStatus

  /** Calendar days for dispute exchange (set at creation; default 7). */
  disputeResolutionDays?: number

  /** Set when status becomes DISPUTED (ISO). */
  disputeOpenedAt?: string
  /** End of dispute exchange window: openedAt + disputeResolutionDays (calendar days). */
  disputeDueAt?: string
  disputeMessages?: DisputeMessage[]
  disputeAttachments?: DisputeAttachment[]

  /** Wallet of the user who created the contract (customer for customer-flow). */
  createdBy: string

  /** Backend contract id (only set after backend POST /contracts succeeded). */
  backendId?: string
  /** On-chain escrow PDA (real base58 in solana mode, "mockPda_…" in mock mode). */
  onchainAddress?: string
  /** Tx signature from the customer's signed initialize tx (real base58 or "mockTx_…"). */
  initTxSignature?: string
  /** Tx signature from the customer's signed fund tx. */
  fundTxSignature?: string
  /** Tx signature from the customer's signed release tx. */
  releaseTxSignature?: string
  /** 'mock' or 'solana' — sourced from /health at the time of creation. */
  chainMode?: 'mock' | 'solana'
  /** Last error from the chain link flow (sticky until the next attempt). */
  chainError?: string

  /**
   * Last known backend status (mirror of `BackendContractDto.status`). The
   * fronted `status` field is computed from local signatures and is not
   * sufficient to drive performer accept / submit buttons — use this to
   * gate them.
   */
  backendStatus?:
    | 'draft'
    | 'open'
    | 'funded'
    | 'in_progress'
    | 'review'
    | 'completed'
    | 'disputed'
    | 'cancelled'
  /** Latest submission payload from the performer (set after submit). */
  submissionPayload?: string

  createdAt: string
  updatedAt: string
}

export interface CreateContractInput {
  templateKey: ContractTemplateKey
  customer: ContractParty
  performer: ContractParty
  subject: string
  technicalAssignment: string
  jurisdictionCode: string
  currency: string
  amount: number
  startDate: string | null
  endDate: string | null
  additionalTerms?: string
  /** Dispute resolution window in calendar days (1–30). */
  disputeResolutionDays?: number
}
