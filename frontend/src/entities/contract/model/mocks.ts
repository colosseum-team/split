import { nanoid } from 'nanoid'
import { findTemplate, renderContractText } from './templates'
import type { Contract } from './types'

/**
 * Mock contract created by a fictional customer for the current performer to act on.
 * Inserted into the store the first time a performer logs in (no real contract exists yet).
 */
export const buildPerformerSeedContract = (performerWallet: string): Contract | null => {
  const template = findTemplate('landing-development')
  if (!template) return null

  const now = new Date()
  const startDate = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const endDate = new Date(startDate.getTime() + template.defaultDurationDays * 24 * 60 * 60 * 1000)

  const customer = {
    fullName: 'Helena Park',
    email: 'helena.park@northwave.demo',
    companyName: 'Northwave Studio',
    walletAddress: 'CzNorthwaveDemoCustomerWalletAddress0000000000',
  }

  const performer = {
    fullName: 'Alex Performer',
    email: 'performer@split.demo',
    companyName: 'Independent contractor',
    walletAddress: performerWallet,
  }

  const subject = template.defaultSubject
  const technicalAssignment = template.defaultTechnicalAssignment

  const number = `№ ${now.getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`
  const text = renderContractText({
    template,
    customer,
    performer,
    subject,
    technicalAssignment,
    amount: template.defaultAmount,
    currency: template.defaultCurrencyCode,
    jurisdictionCode: template.defaultJurisdictionCode,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    contractNumber: number,
  })

  return {
    id: nanoid(),
    templateKey: template.key,
    number,
    title: template.title,
    customer,
    performer,
    subject,
    technicalAssignment,
    jurisdictionCode: template.defaultJurisdictionCode,
    currency: template.defaultCurrencyCode,
    amount: template.defaultAmount,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    text,
    signatures: {
      customer: {
        walletAddress: customer.walletAddress!,
        signature: 'demo-mock-signature-of-customer',
        signedAt: now.toISOString(),
      },
    },
    status: 'PARTIALLY_SIGNED',
    createdBy: customer.walletAddress!,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }
}
