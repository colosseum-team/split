import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

/** Always merge `backend/.env` regardless of Node `cwd` (Docker uses `/workspace`). */
const backendEnvPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env')
dotenv.config({ path: backendEnvPath })

/** Patched `@qvac/sdk` reads this once at first import; keep a high floor for Docker/GGUF cold start. */
{
  const n = Number(process.env.QVAC_RPC_INIT_TIMEOUT_MS)
  if (!Number.isFinite(n) || n < 600_000) {
    process.env.QVAC_RPC_INIT_TIMEOUT_MS = '900000'
  }
}

const Env = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:5173,http://localhost:3000,http://localhost:3001'),

  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),

  MOCK_CHAIN: z
    .string()
    .default('true')
    .transform((v) => v === 'true'),
  SOLANA_RPC_URL: z.string().default('https://api.devnet.solana.com'),

  ARBITER_AUTOEXECUTE: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  ARBITER_PRIVATE_KEY: z.string().optional(),

  QVAC_ENABLED: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  QVAC_MODEL_ID: z.string().default('qvac-llamacpp'),
  QVAC_MODEL_VERSION: z.string().default('unknown'),

  /** Local directory for dispute attachment bytes (dev / single-node). */
  DISPUTE_UPLOAD_DIR: z.string().optional(),
})

const _env = Env.parse(process.env)
const _backendDir = path.dirname(fileURLToPath(import.meta.url))

export const config = {
  ..._env,
  DISPUTE_UPLOAD_DIR: _env.DISPUTE_UPLOAD_DIR ?? path.resolve(_backendDir, '../data/dispute-uploads'),
}
export const isDev = process.env.NODE_ENV !== 'production'
