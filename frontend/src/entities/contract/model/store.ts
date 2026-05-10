import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import { findTemplate, renderContractText } from './templates'
import {
  buildCompletedDisputeDemoContract,
  buildCompletedDisputeDemoContractForCustomer,
  buildPerformerSeedContract,
  buildStatusGalleryContracts,
  DEMO_COMPLETED_DISPUTE_CONTRACT_ID,
  DEMO_COMPLETED_DISPUTE_CUSTOMER_CONTRACT_ID,
  DEMO_STATUS_IDS,
  isDemoContractId,
  LEGACY_REMOVED_GALLERY_IDS,
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
import type {
  BackendContractDto,
  BackendDisputeAttachmentDto,
  BackendDisputeMessageDto,
} from '@/shared/api/client'
import { patchFromBackendDto, stubContractFromBackendDto } from './statusMap'

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
  /**
   * Patch chain-/backend-tracked fields (`backendStatus`, status,
   * fund/release tx signatures, submissionPayload, …) from the latest
   * backend DTO. Local signatures and dispute messages are NOT touched.
   * Use after every successful mutation (fund / accept / submit / approve)
   * or on-mount refetch.
   */
  applyBackendContract: (localId: string, dto: BackendContractDto) => void
  /**
   * Same as `applyBackendContract`, but resolves the local row by
   * `backendId === dto.id`. Useful after `GET /contracts` / `GET /contracts/:id`
   * when the caller has only the backend id at hand.
   */
  applyBackendContractByBackendId: (dto: BackendContractDto) => void
  /**
   * Merge a server-side contract list into the local store:
   *  - rows already linked to a `backendId` are patched in place;
   *  - new rows are inserted via `stubContractFromBackendDto`;
   *  - demo rows (stable `demo-*` ids) are kept untouched — they have no
   *    `backendId` so the merge never touches them.
   * Local-only rows that have no `backendId` (e.g. drafts created before
   * `POST /contracts` resolved) are also preserved.
   */
  hydrateFromBackend: (dtos: BackendContractDto[]) => void
  /**
   * Replaces the in-memory dispute thread (messages + attachments) with the
   * normalized server view. Maps `authorWallet` to the SPA's
   * `customer | performer` side using the contract's customer/performer
   * wallet addresses.
   */
  setDisputeThread: (localId: string, payload: { messages: BackendDisputeMessageDto[] }) => void
  /** Append a single dispute message returned by the backend. */
  appendBackendDisputeMessage: (localId: string, message: BackendDisputeMessageDto) => void
  /** Append a single attachment returned by the backend (without a message yet). */
  appendBackendDisputeAttachment: (localId: string, attachment: BackendDisputeAttachmentDto) => void
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

        applyBackendContract: (localId, dto) => {
          set((state) => ({
            contracts: state.contracts.map((c) => {
              if (c.id !== localId) return c
              const patch = patchFromBackendDto(dto, c)
              return { ...c, ...patch, updatedAt: new Date().toISOString() }
            }),
          }))
        },

        applyBackendContractByBackendId: (dto) => {
          set((state) => ({
            contracts: state.contracts.map((c) => {
              if (c.backendId !== dto.id) return c
              const patch = patchFromBackendDto(dto, c)
              return { ...c, ...patch, updatedAt: new Date().toISOString() }
            }),
          }))
        },

        hydrateFromBackend: (dtos) => {
          set((state) => {
            const byBackendId = new Map<string, Contract>()
            for (const c of state.contracts) {
              if (c.backendId) byBackendId.set(c.backendId, c)
            }

            const seenBackendIds = new Set<string>()
            const incomingNew: Contract[] = []

            for (const dto of dtos) {
              seenBackendIds.add(dto.id)
              if (!byBackendId.has(dto.id)) {
                incomingNew.push(stubContractFromBackendDto(dto))
              }
            }

            const merged = state.contracts.map((c) => {
              if (!c.backendId) return c
              const dto = dtos.find((d) => d.id === c.backendId)
              if (!dto) return c
              const patch = patchFromBackendDto(dto, c)
              return { ...c, ...patch }
            })

            if (incomingNew.length === 0) return { contracts: merged }
            return { contracts: [...incomingNew, ...merged] }
          })
        },

        setDisputeThread: (localId, payload) => {
          set((state) => ({
            contracts: state.contracts.map((c) => {
              if (c.id !== localId) return c
              const customerWallet = c.customer.walletAddress
              const serverAttachmentIds = new Set<string>()
              for (const m of payload.messages) {
                for (const a of m.attachments ?? []) serverAttachmentIds.add(a.id)
              }
              const messages = payload.messages.map((m) => {
                const msgAttachments = m.attachments ?? []
                return {
                  id: m.id,
                  side: (m.authorWallet === customerWallet ? 'customer' : 'performer') as
                    | 'customer'
                    | 'performer',
                  body: m.body,
                  createdAt: m.createdAt,
                  attachments:
                    msgAttachments.length > 0
                      ? msgAttachments.map((a) => ({
                          id: a.id,
                          fileName: a.fileName,
                          mimeType: a.mimeType,
                          sizeBytes: a.size,
                          addedAt: a.createdAt,
                        }))
                      : undefined,
                }
              })
              // Keep only attachments not yet reflected on the server thread (e.g. uploads
              // queued before the next message is posted).
              const pendingFlat = (c.disputeAttachments ?? []).filter(
                (a) => !serverAttachmentIds.has(a.id),
              )
              return {
                ...c,
                disputeMessages: messages,
                disputeAttachments: pendingFlat,
              }
            }),
          }))
        },

        appendBackendDisputeMessage: (localId, message) => {
          set((state) => ({
            contracts: state.contracts.map((c) => {
              if (c.id !== localId) return c
              const customerWallet = c.customer.walletAddress
              const side: 'customer' | 'performer' =
                message.authorWallet === customerWallet ? 'customer' : 'performer'
              const prev = c.disputeMessages ?? []
              const prevAttachments = c.disputeAttachments ?? []
              const msgAttachments = message.attachments.map((a) => ({
                id: a.id,
                fileName: a.fileName,
                mimeType: a.mimeType,
                sizeBytes: a.size,
                addedAt: a.createdAt,
              }))
              const linkedIds = new Set(msgAttachments.map((a) => a.id))
              return {
                ...c,
                disputeMessages: [
                  ...prev,
                  {
                    id: message.id,
                    side,
                    body: message.body,
                    createdAt: message.createdAt,
                    attachments: msgAttachments.length ? msgAttachments : undefined,
                  },
                ],
                disputeAttachments: prevAttachments.filter((a) => !linkedIds.has(a.id)),
                updatedAt: message.createdAt,
              }
            }),
          }))
        },

        appendBackendDisputeAttachment: (localId, attachment) => {
          set((state) => ({
            contracts: state.contracts.map((c) => {
              if (c.id !== localId) return c
              const prev = c.disputeAttachments ?? []
              if (prev.some((a) => a.id === attachment.id)) return c
              return {
                ...c,
                disputeAttachments: [
                  ...prev,
                  {
                    id: attachment.id,
                    fileName: attachment.fileName,
                    mimeType: attachment.mimeType,
                    sizeBytes: attachment.size,
                    addedAt: attachment.createdAt,
                  },
                ],
              }
            }),
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
            const gallery = [...buildStatusGalleryContracts(walletAddress, role)]
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
        version: 4,
        migrate: (persistedState, version) => {
          if (version >= 4) return persistedState
          const legacyRemoved = new Set<string>(LEGACY_REMOVED_GALLERY_IDS)
          const statusGalleryIds = new Set<string>(Object.values(DEMO_STATUS_IDS))
          const slice = persistedState as {
            contracts?: Contract[]
            seededPerformerWallets?: string[]
          }
          if (!slice.contracts?.length) return persistedState

          const landing = findTemplate('landing-development')
          const galleryTitle = landing?.title ?? 'Landing page development'

          slice.contracts = slice.contracts
            .filter((c) => !legacyRemoved.has(c.id))
            .map((c) => (statusGalleryIds.has(c.id) ? { ...c, title: galleryTitle } : c))

          return persistedState
        },
      },
    ),
    {
      name: 'contracts',
      enabled: import.meta.env.DEV,
    },
  ),
)
