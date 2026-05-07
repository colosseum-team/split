import type { FastifyPluginAsync } from 'fastify'
import { config } from '../config.js'

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/health', async () => ({
    status: 'ok',
    chain: config.MOCK_CHAIN ? 'mock' : 'solana',
    rpcUrl: config.SOLANA_RPC_URL,
  }))
}
