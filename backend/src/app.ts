import Fastify from 'fastify'
import cors from '@fastify/cors'
import sensible from '@fastify/sensible'
import rateLimit from '@fastify/rate-limit'
import jwt from '@fastify/jwt'
import { config, isDev } from './config.js'
import errorPlugin from './plugins/error.js'
import authPlugin from './plugins/auth.js'
import { healthRoutes } from './routes/health.js'
import { authRoutes } from './routes/auth.js'
import { meRoutes } from './routes/me.js'
import { contractsRoutes } from './routes/contracts.js'
import { aiOutputsRoutes } from './routes/ai-outputs.js'

export async function buildApp() {
  const app = Fastify({
    logger: isDev
      ? {
          level: config.LOG_LEVEL,
          transport: {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'HH:MM:ss' },
          },
        }
      : { level: config.LOG_LEVEL },
  })

  await app.register(cors, {
    origin: config.CORS_ORIGIN.split(',').map((s) => s.trim()),
    credentials: true,
    allowedHeaders: ['content-type', 'authorization'],
  })
  await app.register(sensible)
  await app.register(rateLimit, { global: false })
  await app.register(jwt, { secret: config.JWT_SECRET })

  await app.register(errorPlugin)
  await app.register(authPlugin)

  await app.register(healthRoutes)
  await app.register(authRoutes)
  await app.register(meRoutes)
  await app.register(contractsRoutes)
  await app.register(aiOutputsRoutes)

  return app
}
