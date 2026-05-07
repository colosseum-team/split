import type { ContractTemplateKey } from './templates'

export type ContractStatus =
  | 'DRAFT'
  | 'PENDING_SIGNING'
  | 'PARTIALLY_SIGNED'
  | 'SIGNED'
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

  /** Wallet of the user who created the contract (customer for customer-flow). */
  createdBy: string

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
}
