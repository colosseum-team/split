import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import { findTemplate, renderContractText } from './templates'
import { buildPerformerSeedContract } from './mocks'
import type { Contract, ContractSignature, ContractStatus, CreateContractInput } from './types'

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
  getById: (id: string) => Contract | undefined
  signByWallet: (id: string, signature: ContractSignature, side: 'customer' | 'performer') => void
  /**
   * Demo flow helper: once a performer connects a wallet, bind it to the contract
   * if performer wallet is not set yet (claim).
   */
  claimPerformerWallet: (id: string, performerWallet: string) => void
  markCompleted: (id: string) => void
  decline: (id: string) => void
  seedPerformerMockOnce: (performerWallet: string) => void
  clearAll: () => void
}

export const useContractsStore = create<ContractsState>()(
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

      getById: (id) => get().contracts.find((c) => c.id === id),

      signByWallet: (id, signature, side) => {
        set((state) => ({
          contracts: state.contracts.map((c) => {
            if (c.id !== id) return c
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

      seedPerformerMockOnce: (performerWallet) => {
        const state = get()
        if (state.seededPerformerWallets.includes(performerWallet)) return

        const exists = state.contracts.some(
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
      version: 1,
    },
  ),
)
