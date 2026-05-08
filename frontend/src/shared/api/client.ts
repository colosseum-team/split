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
  let parsed: unknown = null
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

// ---------- endpoints ----------

export const api = {
  health: () => request<{ status: 'ok'; chain: string; rpcUrl: string }>('/health'),

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
}
