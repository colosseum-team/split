import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import { findTemplate, renderContractText } from './templates'
import {
  buildCompletedDisputeDemoContract,
  buildCompletedDisputeDemoContractForCustomer,
  buildCustomerInboxReviewDemos,
  buildExtraReviewGalleryContracts,
  buildPerformerSeedContract,
  buildStatusGalleryContracts,
  DEMO_COMPLETED_DISPUTE_CONTRACT_ID,
  DEMO_COMPLETED_DISPUTE_CUSTOMER_CONTRACT_ID,
  isDemoContractId,
} from './mocks'
import type { UserRole } from '@/entities/user'
import { addDisputeCalendarDays } from '../lib/disputeDates'
import type {
  Contract,
  ContractSignature,
  ContractStatus,
  CreateContractInput,
  DisputeAttachment,
} from './types'

const computeContractStatus = (contract: Contract): ContractStatus => {
  const hasCustomer = !!contract.signatures.customer
  const hasPerformer = !!contract.signatures.performer
  if (hasCustomer && hasPerformer) return 'SIGNED'
  if (hasCustomer || hasPerformer) return 'PARTIALLY_SIGNED'
  return 'PENDING_SIGNING'
}

interface ContractsState {
  contracts: Contract[]
  /** flag preventing repeated mock seeding for the same performer wallet */
  seededPerformerWallets: string[]

  create: (input: CreateContractInput, createdBy: string) => Contract
  /**
   * Attach backend + on-chain provenance to a locally-created contract.
   * Called after the SPA has POSTed the contract to the backend and (in
   * solana mode) signed+submitted the initialize tx.
   */
  linkChain: (
    id: string,
    chain: Partial<
      Pick<
        Contract,
        | 'backendId'
        | 'onchainAddress'
        | 'initTxSignature'
        | 'fundTxSignature'
        | 'releaseTxSignature'
        | 'chainMode'
        | 'textHash'
        | 'chainError'
      >
    >,
  ) => void
  getById: (id: string) => Contract | undefined
  signByWallet: (id: string, signature: ContractSignature, side: 'customer' | 'performer') => void
  /**
   * Demo flow helper: once a performer connects a wallet, bind it to the contract
   * if performer wallet is not set yet (claim).
   */
  claimPerformerWallet: (id: string, performerWallet: string) => void
  markCompleted: (id: string) => void
  /** Local demo: move contract to disputed (does not call HTTP API). */
  openDispute: (id: string) => void
  appendDisputeMessage: (id: string, side: 'customer' | 'performer', body: string) => void
  appendDisputeAttachment: (
    id: string,
    file: Pick<DisputeAttachment, 'fileName' | 'mimeType' | 'sizeBytes'>,
  ) => void
  decline: (id: string) => void
  seedPerformerMockOnce: (performerWallet: string) => void
  /** Ensures the stable completed demo contract exists for the role (dispute / review demo). */
  ensureCompletedDisputeDemo: (walletAddress: string, role: Exclude<UserRole, null>) => void
  /** Inserts one mock per contract status (stable ids `demo-status-*`) if missing. */
  ensureStatusGalleryDemos: (walletAddress: string, role: Exclude<UserRole, null>) => void
  clearAll: () => void
}

export const useContractsStore = create<ContractsState>()(
  devtools(
    persist(
      (set, get) => ({
        contracts: [],
        seededPerformerWallets: [],

        create: (input, createdBy) => {
          const template = findTemplate(input.templateKey)
          if (!template) {
            throw new Error(`Template not found: ${input.templateKey}`)
          }

          const now = new Date().toISOString()
          const number = `№ ${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`

          const disputeResolutionDays = input.disputeResolutionDays ?? 7

          const text = renderContractText({
            template,
            customer: input.customer,
            performer: input.performer,
            subject: input.subject,
            technicalAssignment: input.technicalAssignment,
            amount: input.amount,
            currency: input.currency,
            jurisdictionCode: input.jurisdictionCode,
            startDate: input.startDate,
            endDate: input.endDate,
            additionalTerms: input.additionalTerms,
            contractNumber: number,
            disputeResolutionDays,
          })

          const contract: Contract = {
            id: nanoid(),
            templateKey: input.templateKey,
            number,
            title: template.title,
            customer: input.customer,
            performer: input.performer,
            subject: input.subject,
            technicalAssignment: input.technicalAssignment,
            jurisdictionCode: input.jurisdictionCode,
            currency: input.currency,
            amount: input.amount,
            startDate: input.startDate,
            endDate: input.endDate,
            additionalTerms: input.additionalTerms,
            text,
            signatures: {},
            status: 'PENDING_SIGNING',
            disputeResolutionDays,
            createdBy,
            createdAt: now,
            updatedAt: now,
          }

          set((state) => ({ contracts: [contract, ...state.contracts] }))
          return contract
        },

        linkChain: (id, chain) => {
          set((state) => ({
            contracts: state.contracts.map((c) =>
              c.id === id ? { ...c, ...chain, updatedAt: new Date().toISOString() } : c,
            ),
          }))
        },

        getById: (id) => get().contracts.find((c) => c.id === id),

        signByWallet: (id, signature, side) => {
          set((state) => ({
            contracts: state.contracts.map((c) => {
              if (c.id !== id) return c
              if (c.status === 'DISPUTED' || c.status === 'COMPLETED' || c.status === 'DECLINED') {
                return c
              }
              const next: Contract = {
                ...c,
                signatures: { ...c.signatures, [side]: signature },
                updatedAt: new Date().toISOString(),
              }
              next.status = computeContractStatus(next)
              return next
            }),
          }))
        },

        claimPerformerWallet: (id, performerWallet) => {
          set((state) => ({
            contracts: state.contracts.map((c) => {
              if (c.id !== id) return c
              if (c.performer.walletAddress) return c
              return {
                ...c,
                performer: { ...c.performer, walletAddress: performerWallet },
                updatedAt: new Date().toISOString(),
              }
            }),
          }))
        },

        markCompleted: (id) => {
          set((state) => ({
            contracts: state.contracts.map((c) =>
              c.id === id
                ? {
                    ...c,
                    status: 'COMPLETED' as ContractStatus,
                    updatedAt: new Date().toISOString(),
                  }
                : c,
            ),
          }))
        },

        openDispute: (id) => {
          const now = new Date()
          const openedAt = now.toISOString()
          set((state) => ({
            contracts: state.contracts.map((c) => {
              if (c.id !== id) return c
              const days = c.disputeResolutionDays ?? 7
              const due = addDisputeCalendarDays(now, days)
              return {
                ...c,
                status: 'DISPUTED' as ContractStatus,
                disputeOpenedAt: openedAt,
                disputeDueAt: due.toISOString(),
                disputeMessages: c.disputeMessages ?? [],
                disputeAttachments: c.disputeAttachments ?? [],
                updatedAt: openedAt,
              }
            }),
          }))
        },

        appendDisputeMessage: (id, side, body) => {
          const trimmed = body.trim()
          if (!trimmed) return
          const msgId = nanoid()
          const createdAt = new Date().toISOString()
          set((state) => ({
            contracts: state.contracts.map((c) => {
              if (c.id !== id) return c
              const prev = c.disputeMessages ?? []
              return {
                ...c,
                disputeMessages: [...prev, { id: msgId, side, body: trimmed, createdAt }],
                updatedAt: createdAt,
              }
            }),
          }))
        },

        appendDisputeAttachment: (id, file) => {
          const row: DisputeAttachment = {
            id: nanoid(),
            fileName: file.fileName,
            mimeType: file.mimeType,
            sizeBytes: file.sizeBytes,
            addedAt: new Date().toISOString(),
          }
          set((state) => ({
            contracts: state.contracts.map((c) => {
              if (c.id !== id) return c
              const prev = c.disputeAttachments ?? []
              return {
                ...c,
                disputeAttachments: [...prev, row],
                updatedAt: row.addedAt,
              }
            }),
          }))
        },

        decline: (id) => {
          set((state) => ({
            contracts: state.contracts.map((c) =>
              c.id === id
                ? {
                    ...c,
                    status: 'DECLINED' as ContractStatus,
                    updatedAt: new Date().toISOString(),
                  }
                : c,
            ),
          }))
        },

        ensureCompletedDisputeDemo: (walletAddress, role) => {
          const id =
            role === 'performer'
              ? DEMO_COMPLETED_DISPUTE_CONTRACT_ID
              : DEMO_COMPLETED_DISPUTE_CUSTOMER_CONTRACT_ID
          set((state) => {
            if (state.contracts.some((c) => c.id === id)) {
              return state
            }
            const completed =
              role === 'performer'
                ? buildCompletedDisputeDemoContract(walletAddress)
                : buildCompletedDisputeDemoContractForCustomer(walletAddress)
            return { contracts: [completed, ...state.contracts] }
          })
        },

        ensureStatusGalleryDemos: (walletAddress, role) => {
          set((state) => {
            const gallery = [
              ...buildStatusGalleryContracts(walletAddress, role),
              ...buildExtraReviewGalleryContracts(walletAddress, role),
              ...(role === 'customer' ? buildCustomerInboxReviewDemos(walletAddress) : []),
            ]
            const existing = new Set(state.contracts.map((c) => c.id))
            const toAdd = gallery.filter((c) => !existing.has(c.id))
            if (toAdd.length === 0) return state
            return { contracts: [...toAdd, ...state.contracts] }
          })
        },

        seedPerformerMockOnce: (performerWallet) => {
          const state = get()
          if (state.seededPerformerWallets.includes(performerWallet)) return

          const userContracts = state.contracts.filter((c) => !isDemoContractId(c.id))
          const exists = userContracts.some(
            (c) =>
              c.performer.walletAddress === performerWallet ||
              c.customer.walletAddress === performerWallet,
          )
          if (exists) {
            set({ seededPerformerWallets: [...state.seededPerformerWallets, performerWallet] })
            return
          }

          const seed = buildPerformerSeedContract(performerWallet)
          if (!seed) return

          set({
            contracts: [seed, ...state.contracts],
            seededPerformerWallets: [...state.seededPerformerWallets, performerWallet],
          })
        },

        clearAll: () => set({ contracts: [], seededPerformerWallets: [] }),
      }),
      {
        name: 'split-contracts-store',
        version: 2,
      },
    ),
    {
      name: 'contracts',
      enabled: import.meta.env.DEV,
    },
  ),
)
