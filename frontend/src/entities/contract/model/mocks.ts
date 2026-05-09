import { nanoid } from 'nanoid'
import { addDisputeCalendarDays } from '../lib/disputeDates'
import { findTemplate, renderContractText } from './templates'
import type { Contract, ContractParty, ContractStatus } from './types'

/** Stable route: `/contracts/demo-completed-dispute` — performer wallet matches yours. */
export const DEMO_COMPLETED_DISPUTE_CONTRACT_ID = 'demo-completed-dispute' as const

/** Stable route: `/contracts/demo-completed-dispute-customer` — customer wallet matches yours. */
export const DEMO_COMPLETED_DISPUTE_CUSTOMER_CONTRACT_ID =
  'demo-completed-dispute-customer' as const

/** One stable id per `ContractStatus` for QA / UI gallery (`/contracts/demo-status-draft`, …). */
export const DEMO_STATUS_IDS = {
  DRAFT: 'demo-status-draft',
  PENDING_SIGNING: 'demo-status-pending-signing',
  PARTIALLY_SIGNED: 'demo-status-partially-signed',
  SIGNED: 'demo-status-signed',
  REVIEW: 'demo-status-review',
  DISPUTED: 'demo-status-disputed',
  COMPLETED: 'demo-status-completed',
  DECLINED: 'demo-status-declined',
} as const satisfies Record<ContractStatus, string>

/** Extra REVIEW-only gallery rows (same status, different stable URLs). */
export const EXTRA_REVIEW_GALLERY_IDS = [
  'demo-status-review-2',
  'demo-status-review-3',
  'demo-status-review-4',
] as const

/** Customer-role inbox only: extra `REVIEW` rows (your wallet = customer). */
export const CUSTOMER_INBOX_REVIEW_IDS = [
  'demo-customer-review-a',
  'demo-customer-review-b',
  'demo-customer-review-c',
] as const

const ALL_RESERVED_DEMO_IDS = new Set<string>([
  DEMO_COMPLETED_DISPUTE_CONTRACT_ID,
  DEMO_COMPLETED_DISPUTE_CUSTOMER_CONTRACT_ID,
  ...Object.values(DEMO_STATUS_IDS),
  ...EXTRA_REVIEW_GALLERY_IDS,
  ...CUSTOMER_INBOX_REVIEW_IDS,
])

/** Used so performer seed does not treat demo-only rows as “user already has contracts”. */
export const isDemoContractId = (id: string): boolean => ALL_RESERVED_DEMO_IDS.has(id)

/** @deprecated use {@link isDemoContractId} */
export const isDemoCompletedDisputeContractId = (id: string): boolean =>
  id === DEMO_COMPLETED_DISPUTE_CONTRACT_ID || id === DEMO_COMPLETED_DISPUTE_CUSTOMER_CONTRACT_ID

const GALLERY_FIXED_CUSTOMER_WALLET = 'CzNorthwaveDemoCustomerWalletAddress0000000000'
const GALLERY_FIXED_PERFORMER_WALLET = 'CzDemoPerformerGallery000000000000000000'

function galleryParties(
  walletAddress: string,
  role: 'customer' | 'performer',
): { customer: ContractParty; performer: ContractParty } {
  if (role === 'performer') {
    return {
      customer: {
        fullName: 'Gallery Customer',
        email: 'gallery.customer@split.demo',
        companyName: 'Northwave Studio',
        walletAddress: GALLERY_FIXED_CUSTOMER_WALLET,
      },
      performer: {
        fullName: 'You (performer demo)',
        email: 'performer@split.demo',
        companyName: 'Independent',
        walletAddress: walletAddress,
      },
    }
  }
  return {
    customer: {
      fullName: 'You (customer demo)',
      email: 'customer@split.demo',
      companyName: 'Your Studio',
      walletAddress: walletAddress,
    },
    performer: {
      fullName: 'Gallery Performer',
      email: 'gallery.performer@split.demo',
      companyName: 'Contractor LLC',
      walletAddress: GALLERY_FIXED_PERFORMER_WALLET,
    },
  }
}

/**
 * One mock per frontend status (incl. `REVIEW`) — same counterparty story, your wallet on your side.
 * Insert with {@link useContractsStore.getState().ensureStatusGalleryDemos}.
 */
export function buildStatusGalleryContracts(
  walletAddress: string,
  role: 'customer' | 'performer',
): Contract[] {
  const template = findTemplate('landing-development')
  if (!template) {
    throw new Error('Template not found: landing-development')
  }

  const { customer, performer } = galleryParties(walletAddress, role)
  const subject = template.defaultSubject
  const technicalAssignment = template.defaultTechnicalAssignment
  const disputeResolutionDays = 7
  const now = Date.now()
  const day = 24 * 60 * 60 * 1000

  const baseDates = {
    startDate: new Date(now - 20 * day).toISOString(),
    endDate: new Date(now + 14 * day).toISOString(),
  }

  const mkText = (number: string) =>
    renderContractText({
      template,
      customer,
      performer,
      subject,
      technicalAssignment,
      amount: template.defaultAmount,
      currency: template.defaultCurrencyCode,
      jurisdictionCode: template.defaultJurisdictionCode,
      startDate: baseDates.startDate,
      endDate: baseDates.endDate,
      contractNumber: number,
      disputeResolutionDays,
    })

  const sigCustomer = {
    walletAddress: customer.walletAddress!,
    signature: 'demo-gallery-customer-sig',
    signedAt: new Date(now - 15 * day).toISOString(),
  }
  const sigPerformer = {
    walletAddress: performer.walletAddress!,
    signature: 'demo-gallery-performer-sig',
    signedAt: new Date(now - 14 * day).toISOString(),
  }

  const base = (status: ContractStatus, patch: Partial<Contract>): Contract => {
    const year = new Date().getFullYear()
    const numSuffix = {
      DRAFT: '9101',
      PENDING_SIGNING: '9102',
      PARTIALLY_SIGNED: '9103',
      SIGNED: '9104',
      REVIEW: '9114',
      DISPUTED: '9115',
      COMPLETED: '9105',
      DECLINED: '9106',
    }[status]
    const number = `№ ${year}-${numSuffix}`
    const createdAt = new Date(now - 18 * day).toISOString()
    const updatedAt = new Date(now - (status === 'DECLINED' ? 1 : 2) * day).toISOString()
    return {
      id: DEMO_STATUS_IDS[status],
      templateKey: template.key,
      number,
      title: `${template.title} (${status.replace(/_/g, ' ')})`,
      customer,
      performer,
      subject,
      technicalAssignment,
      jurisdictionCode: template.defaultJurisdictionCode,
      currency: template.defaultCurrencyCode,
      amount: template.defaultAmount,
      startDate: baseDates.startDate,
      endDate: baseDates.endDate,
      text: mkText(number),
      disputeResolutionDays,
      createdBy: customer.walletAddress!,
      createdAt,
      updatedAt,
      signatures: {},
      status: 'PENDING_SIGNING',
      ...patch,
    }
  }

  return [
    base('DRAFT', { status: 'DRAFT', signatures: {} }),
    base('PENDING_SIGNING', { status: 'PENDING_SIGNING', signatures: {} }),
    base('PARTIALLY_SIGNED', {
      status: 'PARTIALLY_SIGNED',
      signatures: { customer: sigCustomer },
    }),
    base('SIGNED', {
      status: 'SIGNED',
      signatures: { customer: sigCustomer, performer: sigPerformer },
    }),
    base('REVIEW', {
      status: 'REVIEW',
      signatures: { customer: sigCustomer, performer: sigPerformer },
      updatedAt: new Date(now - 3 * day).toISOString(),
    }),
    (() => {
      const opened = new Date(now - 2 * day)
      const due = addDisputeCalendarDays(opened, disputeResolutionDays)
      return base('DISPUTED', {
        status: 'DISPUTED',
        signatures: { customer: sigCustomer, performer: sigPerformer },
        updatedAt: opened.toISOString(),
        disputeOpenedAt: opened.toISOString(),
        disputeDueAt: due.toISOString(),
        disputeMessages: [],
        disputeAttachments: [],
      })
    })(),
    base('COMPLETED', {
      status: 'COMPLETED',
      signatures: { customer: sigCustomer, performer: sigPerformer },
    }),
    base('DECLINED', {
      status: 'DECLINED',
      signatures: { customer: sigCustomer, performer: sigPerformer },
    }),
  ]
}

/**
 * Additional contracts all in `REVIEW` — same parties as the main gallery, distinct ids/numbers.
 */
export function buildExtraReviewGalleryContracts(
  walletAddress: string,
  role: 'customer' | 'performer',
): Contract[] {
  const template = findTemplate('landing-development')
  if (!template) {
    throw new Error('Template not found: landing-development')
  }

  const { customer, performer } = galleryParties(walletAddress, role)
  const subject = template.defaultSubject
  const technicalAssignment = template.defaultTechnicalAssignment
  const disputeResolutionDays = 7
  const now = Date.now()
  const day = 24 * 60 * 60 * 1000

  const baseDates = {
    startDate: new Date(now - 20 * day).toISOString(),
    endDate: new Date(now + 14 * day).toISOString(),
  }

  const mkText = (number: string) =>
    renderContractText({
      template,
      customer,
      performer,
      subject,
      technicalAssignment,
      amount: template.defaultAmount,
      currency: template.defaultCurrencyCode,
      jurisdictionCode: template.defaultJurisdictionCode,
      startDate: baseDates.startDate,
      endDate: baseDates.endDate,
      contractNumber: number,
      disputeResolutionDays,
    })

  const sigCustomer = {
    walletAddress: customer.walletAddress!,
    signature: 'demo-gallery-customer-sig',
    signedAt: new Date(now - 15 * day).toISOString(),
  }
  const sigPerformer = {
    walletAddress: performer.walletAddress!,
    signature: 'demo-gallery-performer-sig',
    signedAt: new Date(now - 14 * day).toISOString(),
  }

  const year = new Date().getFullYear()
  const numSuffixes = ['9121', '9122', '9123']

  return EXTRA_REVIEW_GALLERY_IDS.map((id, i) => {
    const number = `№ ${year}-${numSuffixes[i]}`
    const createdAt = new Date(now - (18 + i) * day).toISOString()
    const updatedAt = new Date(now - (5 + i) * day).toISOString()
    return {
      id,
      templateKey: template.key,
      number,
      title: `${template.title} (In review ${i + 2})`,
      customer,
      performer,
      subject,
      technicalAssignment,
      jurisdictionCode: template.defaultJurisdictionCode,
      currency: template.defaultCurrencyCode,
      amount: template.defaultAmount,
      startDate: baseDates.startDate,
      endDate: baseDates.endDate,
      text: mkText(number),
      signatures: { customer: sigCustomer, performer: sigPerformer },
      status: 'REVIEW',
      disputeResolutionDays,
      createdBy: customer.walletAddress!,
      createdAt,
      updatedAt,
    }
  })
}

/**
 * Additional `REVIEW` contracts seeded **only for role customer** — wallet on the customer side,
 * distinct template/titles so the customer inbox is easy to scan.
 */
export function buildCustomerInboxReviewDemos(walletAddress: string): Contract[] {
  const template = findTemplate('logo-design')
  if (!template) {
    throw new Error('Template not found: logo-design')
  }

  const customer = {
    fullName: 'You (customer inbox)',
    email: 'customer-inbox@split.demo',
    companyName: 'Your Studio',
    walletAddress,
  }

  const performer = {
    fullName: 'Gallery Performer',
    email: 'gallery.performer@split.demo',
    companyName: 'Contractor LLC',
    walletAddress: GALLERY_FIXED_PERFORMER_WALLET,
  }

  const subject = template.defaultSubject
  const technicalAssignment = template.defaultTechnicalAssignment
  const disputeResolutionDays = 7
  const now = Date.now()
  const day = 24 * 60 * 60 * 1000

  const baseDates = {
    startDate: new Date(now - 25 * day).toISOString(),
    endDate: new Date(now + 12 * day).toISOString(),
  }

  const mkText = (number: string) =>
    renderContractText({
      template,
      customer,
      performer,
      subject,
      technicalAssignment,
      amount: template.defaultAmount,
      currency: template.defaultCurrencyCode,
      jurisdictionCode: template.defaultJurisdictionCode,
      startDate: baseDates.startDate,
      endDate: baseDates.endDate,
      contractNumber: number,
      disputeResolutionDays,
    })

  const sigCustomer = {
    walletAddress,
    signature: 'demo-customer-inbox-sig',
    signedAt: new Date(now - 16 * day).toISOString(),
  }
  const sigPerformer = {
    walletAddress: performer.walletAddress,
    signature: 'demo-performer-inbox-sig',
    signedAt: new Date(now - 14 * day).toISOString(),
  }

  const year = new Date().getFullYear()
  const labels = ['Alpha', 'Beta', 'Gamma']

  return CUSTOMER_INBOX_REVIEW_IDS.map((id, i) => {
    const number = `№ ${year}-${9201 + i}`
    const createdAt = new Date(now - (20 + i) * day).toISOString()
    const updatedAt = new Date(now - (6 + i) * day).toISOString()
    return {
      id,
      templateKey: template.key,
      number,
      title: `${template.shortTitle} · Review (${labels[i]})`,
      customer,
      performer,
      subject,
      technicalAssignment,
      jurisdictionCode: template.defaultJurisdictionCode,
      currency: template.defaultCurrencyCode,
      amount: template.defaultAmount,
      startDate: baseDates.startDate,
      endDate: baseDates.endDate,
      text: mkText(number),
      signatures: { customer: sigCustomer, performer: sigPerformer },
      status: 'REVIEW' as const,
      disputeResolutionDays,
      createdBy: walletAddress,
      createdAt,
      updatedAt,
    }
  })
}

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
    disputeResolutionDays: 7,
    createdBy: customer.walletAddress!,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }
}

/**
 * Fully signed and marked completed — for viewing the finished state and trying dispute summary (local AI).
 * Inserted once per browser profile via `ensureCompletedDisputeDemo`.
 */
export const buildCompletedDisputeDemoContract = (performerWallet: string): Contract => {
  const template = findTemplate('landing-development')
  if (!template) {
    throw new Error('Template not found: landing-development')
  }
  const now = Date.now()
  const day = 24 * 60 * 60 * 1000
  const createdAt = new Date(now - 45 * day)
  const signedCustomerAt = new Date(now - 30 * day)
  const signedPerformerAt = new Date(now - 28 * day)
  const completedAt = new Date(now - 5 * day)
  const startDate = new Date(now - 40 * day)
  const endDate = new Date(now - 10 * day)

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
  const number = `№ ${createdAt.getFullYear()}-8844`
  const disputeResolutionDays = 7

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
    disputeResolutionDays,
  })

  return {
    id: DEMO_COMPLETED_DISPUTE_CONTRACT_ID,
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
        signature: 'demo-mock-signature-customer-completed',
        signedAt: signedCustomerAt.toISOString(),
      },
      performer: {
        walletAddress: performerWallet,
        signature: 'demo-mock-signature-performer-completed',
        signedAt: signedPerformerAt.toISOString(),
      },
    },
    status: 'COMPLETED',
    disputeResolutionDays,
    createdBy: customer.walletAddress!,
    createdAt: createdAt.toISOString(),
    updatedAt: completedAt.toISOString(),
  }
}

/**
 * Same story as {@link buildCompletedDisputeDemoContract}, but the connected wallet is the customer
 * so the contract appears in the customer inbox for dispute testing.
 */
export const buildCompletedDisputeDemoContractForCustomer = (customerWallet: string): Contract => {
  const template = findTemplate('landing-development')
  if (!template) {
    throw new Error('Template not found: landing-development')
  }
  const now = Date.now()
  const day = 24 * 60 * 60 * 1000
  const createdAt = new Date(now - 45 * day)
  const signedCustomerAt = new Date(now - 30 * day)
  const signedPerformerAt = new Date(now - 28 * day)
  const completedAt = new Date(now - 5 * day)
  const startDate = new Date(now - 40 * day)
  const endDate = new Date(now - 10 * day)

  const customer = {
    fullName: 'You (demo customer)',
    email: 'customer@split.demo',
    companyName: 'Demo Studio',
    walletAddress: customerWallet,
  }

  const performer = {
    fullName: 'Alex Performer',
    email: 'performer@split.demo',
    companyName: 'Independent contractor',
    walletAddress: 'CzDemoPerformerForDisputeFlow000000000000',
  }

  const subject = template.defaultSubject
  const technicalAssignment = template.defaultTechnicalAssignment
  const number = `№ ${createdAt.getFullYear()}-9933`
  const disputeResolutionDays = 7

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
    disputeResolutionDays,
  })

  return {
    id: DEMO_COMPLETED_DISPUTE_CUSTOMER_CONTRACT_ID,
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
        walletAddress: customerWallet,
        signature: 'demo-mock-signature-customer-completed',
        signedAt: signedCustomerAt.toISOString(),
      },
      performer: {
        walletAddress: performer.walletAddress,
        signature: 'demo-mock-signature-performer-completed',
        signedAt: signedPerformerAt.toISOString(),
      },
    },
    status: 'COMPLETED',
    disputeResolutionDays,
    createdBy: customerWallet,
    createdAt: createdAt.toISOString(),
    updatedAt: completedAt.toISOString(),
  }
}
