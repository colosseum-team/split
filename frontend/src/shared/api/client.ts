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

async function request<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const { method = 'GET', body, token, signal } = opts
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['content-type'] = 'application/json'
  if (token) headers['authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, {
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

  if (!res.ok) {
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
  return parsed as T
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

    buildFundTx: (token: string, contractId: string) =>
      request<{ tx: string; escrowAddress: string }>(`/contracts/${contractId}/fund-tx`, {
        method: 'POST',
        body: {},
        token,
      }),

    recordFund: (token: string, contractId: string, txSignature: string) =>
      request<unknown>(`/contracts/${contractId}/fund`, {
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
      request<unknown>(`/contracts/${contractId}/approve`, {
        method: 'POST',
        body: { txSignature },
        token,
      }),
  },
}
