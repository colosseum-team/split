// Thin fetch wrapper for the Escros backend.
//
// Build base: `import.meta.env.VITE_API_URL` is injected by Vite at build
// time (set in frontend/Dockerfile). Defaults to `/api` so the SPA hits
// same-origin and nginx forwards to the backend container.
//
// Auth: callers supply the JWT explicitly; this module is intentionally
// state-less so it can be reused outside React (e.g. in tests). The store
// in entities/user keeps the token.
//
// Role terminology: the SPA uses `customer | performer`, the backend
// expects `customer | user`. We translate at the edge so neither side has
// to change. If/when the codebase aligns the names this maps drops out.

const API_BASE = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/+$/, '')

export type FeRole = 'customer' | 'performer'
export type BeRole = 'customer' | 'user'

export const feRoleToBe = (r: FeRole): BeRole => (r === 'performer' ? 'user' : 'customer')
export const beRoleToFe = (r: BeRole | null | undefined): FeRole | null =>
  r === 'user' ? 'performer' : r === 'customer' ? 'customer' : null

export class ApiError extends Error {
  status: number
  code: string
  body: unknown
  constructor(status: number, code: string, message: string, body: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.body = body
  }
}

interface RequestOpts {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  token?: string | null
  signal?: AbortSignal
}

function buildUrl(path: string, query?: Record<string, string | undefined>): string {
  const base = `${API_BASE}${path}`
  if (!query) return base
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, value)
  }
  const qs = params.toString()
  return qs ? `${base}?${qs}` : base
}

async function parseError(res: Response, parsed: unknown): Promise<never> {
  const obj = (typeof parsed === 'object' && parsed !== null ? parsed : {}) as Record<
    string,
    unknown
  >
  throw new ApiError(
    res.status,
    typeof obj.code === 'string' ? obj.code : 'HTTP_ERROR',
    typeof obj.message === 'string' ? obj.message : `HTTP ${res.status}`,
    parsed,
  )
}

async function request<T>(
  path: string,
  opts: RequestOpts & { query?: Record<string, string | undefined> } = {},
): Promise<T> {
  const { method = 'GET', body, token, signal, query } = opts
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['content-type'] = 'application/json'
  if (token) headers['authorization'] = `Bearer ${token}`

  const res = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  })

  const text = await res.text()
  let parsed: unknown
  try {
    parsed = text ? JSON.parse(text) : null
  } catch {
    parsed = text
  }

  if (!res.ok) await parseError(res, parsed)
  return parsed as T
}

async function requestBlob(
  path: string,
  opts: { token?: string | null; signal?: AbortSignal } = {},
): Promise<Blob> {
  const { token, signal } = opts
  const headers: Record<string, string> = {}
  if (token) headers['authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { method: 'GET', headers, signal })
  if (!res.ok) {
    let parsed: unknown
    try {
      parsed = await res.json()
    } catch {
      parsed = null
    }
    await parseError(res, parsed)
  }
  return res.blob()
}

// ---------- types from backend ----------

export interface NonceResponse {
  nonce: string
  message: string
  expiresAt: string
}

export interface UserDto {
  id: string
  walletAddress: string
  role: BeRole | null
  createdAt: string
}

export interface VerifyResponse {
  token: string
  user: UserDto
}

export interface SetRoleResponse {
  user: UserDto
  token: string
}

// Chain bundle returned by /contracts. unsignedTx is base64-encoded
// VersionedTransaction; in MOCK_CHAIN mode it's a sentinel string the
// SPA must NOT pass to the wallet adapter (use api.health().chain to
// branch). escrowAddress is the on-chain PDA (or a mockPda_… string).
export interface CreateContractRequest {
  title: string
  description: string
  amount: string | number
  currency?: string
  deadline?: string
  assigneeAddress?: string
  disputeResolutionDays?: number
}

export interface CreateContractResponse {
  id: string
  customerAddress: string
  assigneeAddress: string | null
  status: string
  amount: string
  currency: string
  contractHash: string
  onchainAddress: string
  unsignedTx: string
  createdAt: string
  updatedAt: string
}

// Backend serialization of a Contract row (see backend/src/routes/contracts.ts
// `serialize`). All BigInt/Date fields are stringified. Used for refetches
// after mutating actions (fund / accept / submit / approve) so the SPA can
// re-derive its local view from the source of truth.
export type BackendContractStatus =
  | 'draft'
  | 'open'
  | 'funded'
  | 'in_progress'
  | 'review'
  | 'completed'
  | 'disputed'
  | 'cancelled'

export interface BackendContractDto {
  id: string
  title: string
  description: string
  amount: string
  currency: string
  deadline: string | null
  customerAddress: string
  assigneeAddress: string | null
  status: BackendContractStatus
  contractHash: string | null
  onchainAddress: string | null
  fundTxSignature: string | null
  approveTxSignature: string | null
  resolveTxSignature: string | null
  submissionPayload: string | null
  submissionAt: string | null
  disputeOpenedBy: 'customer' | 'user' | null
  disputeOpenedAt: string | null
  disputeDueAt: string | null
  disputeResolvedAt: string | null
  disputeOutcome: 'PERFORMER_WON' | 'CLIENT_WON' | 'INCONCLUSIVE' | null
  disputeResolutionDays: number
  createdAt: string
  updatedAt: string
}

// Server-side `serializeDisputeAttachment` shape — note that the server uses
// `size` (bytes) where the SPA's local `DisputeAttachment` carries `sizeBytes`.
export interface BackendDisputeAttachmentDto {
  id: string
  fileName: string
  mimeType: string
  size: number
  createdAt: string
}

// Server-side `serializeDisputeMessage` shape: messages are keyed by wallet,
// not the SPA's `customer | performer` side. Callers map `authorWallet` to a
// side using the contract's customer/assignee addresses.
export interface BackendDisputeMessageDto {
  id: string
  authorWallet: string
  body: string
  createdAt: string
  attachments: BackendDisputeAttachmentDto[]
}

export interface BackendDisputeBundleDto {
  contract: BackendContractDto
  messages: BackendDisputeMessageDto[]
}

export type DisputeOutcome = 'PERFORMER_WON' | 'CLIENT_WON' | 'INCONCLUSIVE'

export interface ResolveDisputeResponse extends BackendContractDto {
  onchain: {
    executed: boolean
    txSignature: string | null
    reason: string | null
  }
}

// Filter values for `GET /contracts`. `available` and `mine` are performer-
// only convenience queries (`available` → `status=open` + no assignee).
export type ContractListStatus = BackendContractStatus | 'available' | 'mine'

export interface ContractListQuery {
  role?: BeRole
  status?: ContractListStatus
}

export interface PatchContractRequest {
  title?: string
  description?: string
  amount?: string | number
  currency?: string
  deadline?: string
  assigneeAddress?: string
  disputeResolutionDays?: number
}

export interface OpenDisputeRequest {
  reason?: string
}

// ---------- endpoints ----------

export const api = {
  health: () =>
    request<{ status: 'ok'; chain: 'mock' | 'solana'; rpcUrl: string; qvac?: unknown }>('/health'),

  authNonce: (walletAddress: string) =>
    request<NonceResponse>('/auth/nonce', {
      method: 'POST',
      body: { walletAddress },
    }),

  authVerify: (walletAddress: string, signatureBase58: string) =>
    request<VerifyResponse>('/auth/verify', {
      method: 'POST',
      body: { walletAddress, signature: signatureBase58 },
    }),

  me: (token: string) => request<UserDto>('/me', { token }),

  setRole: (token: string, role: FeRole) =>
    request<SetRoleResponse>('/me/role', {
      method: 'POST',
      body: { role: feRoleToBe(role) },
      token,
    }),

  patchRole: (token: string, role: FeRole) =>
    request<SetRoleResponse>('/me/role', {
      method: 'PATCH',
      body: { role: feRoleToBe(role) },
      token,
    }),

  contracts: {
    create: (token: string, body: CreateContractRequest) =>
      request<CreateContractResponse>('/contracts', { method: 'POST', body, token }),

    list: (token: string, query?: ContractListQuery) =>
      request<BackendContractDto[]>('/contracts', {
        token,
        query: { role: query?.role, status: query?.status },
      }),

    get: (token: string, contractId: string) =>
      request<BackendContractDto>(`/contracts/${contractId}`, { token }),

    patch: (token: string, contractId: string, body: PatchContractRequest) =>
      request<BackendContractDto>(`/contracts/${contractId}`, {
        method: 'PATCH',
        body: { ...body, amount: body.amount !== undefined ? String(body.amount) : undefined },
        token,
      }),

    buildFundTx: (token: string, contractId: string) =>
      request<{ tx: string; escrowAddress: string }>(`/contracts/${contractId}/fund-tx`, {
        method: 'POST',
        body: {},
        token,
      }),

    recordFund: (token: string, contractId: string, txSignature: string) =>
      request<BackendContractDto>(`/contracts/${contractId}/fund`, {
        method: 'POST',
        body: { txSignature },
        token,
      }),

    buildReleaseTx: (token: string, contractId: string) =>
      request<{ tx: string; escrowAddress: string }>(`/contracts/${contractId}/release-tx`, {
        method: 'POST',
        body: {},
        token,
      }),

    recordApprove: (token: string, contractId: string, txSignature: string) =>
      request<BackendContractDto>(`/contracts/${contractId}/approve`, {
        method: 'POST',
        body: { txSignature },
        token,
      }),

    accept: (token: string, contractId: string) =>
      request<BackendContractDto>(`/contracts/${contractId}/accept`, {
        method: 'POST',
        body: {},
        token,
      }),

    submitWork: (token: string, contractId: string, payload: string) =>
      request<BackendContractDto>(`/contracts/${contractId}/submit`, {
        method: 'POST',
        body: { payload },
        token,
      }),

    openDispute: (token: string, contractId: string, body: OpenDisputeRequest = {}) =>
      request<BackendContractDto>(`/contracts/${contractId}/dispute`, {
        method: 'POST',
        body,
        token,
      }),

    resolveDispute: (token: string, contractId: string, outcome: DisputeOutcome) =>
      request<ResolveDisputeResponse>(`/contracts/${contractId}/resolve-dispute`, {
        method: 'POST',
        body: { outcome },
        token,
      }),

    getDispute: (token: string, contractId: string) =>
      request<BackendDisputeBundleDto>(`/contracts/${contractId}/dispute`, { token }),

    uploadDisputeAttachment: (
      token: string,
      contractId: string,
      payload: { fileName: string; mimeType: string; dataBase64: string },
    ) =>
      request<BackendDisputeAttachmentDto>(`/contracts/${contractId}/dispute/attachments`, {
        method: 'POST',
        body: payload,
        token,
      }),

    postDisputeMessage: (
      token: string,
      contractId: string,
      payload: { body: string; attachmentIds?: string[] },
    ) =>
      request<BackendDisputeMessageDto>(`/contracts/${contractId}/dispute/messages`, {
        method: 'POST',
        body: payload,
        token,
      }),

    /** Returns the raw attachment file as a Blob. Caller is responsible for
     * creating an `URL.createObjectURL(blob)` and revoking it when done. */
    fetchDisputeAttachment: (token: string, contractId: string, attachmentId: string) =>
      requestBlob(`/contracts/${contractId}/dispute/attachments/${attachmentId}/file`, {
        token,
      }),
  },
}
