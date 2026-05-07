import 'dotenv/config'
import { z } from 'zod'

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
  QVAC_WORKER_URL: z.string().url().default('http://localhost:4100'),
})

export const config = Env.parse(process.env)
export const isDev = process.env.NODE_ENV !== 'production'
