import type { ContractTemplateKey } from '@/entities/contract'

export interface ContractFormValues {
  templateKey: ContractTemplateKey

  customerFullName: string
  customerEmail: string
  customerCompanyName: string

  performerFullName: string
  performerEmail: string
  performerCompanyName: string
  performerWalletAddress: string

  technicalAssignment: string
  subject: string

  startDate: string | null
  endDate: string | null

  amount: number
  currency: string

  jurisdictionCode: string

  additionalTerms: string
}
