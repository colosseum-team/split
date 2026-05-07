import { buildApp } from './app.js'
import { config } from './config.js'

async function main() {
  const app = await buildApp()
  app.log.info({ chain: config.MOCK_CHAIN ? 'mock' : 'solana' }, 'starting backend')
  await app.listen({ port: config.PORT, host: config.HOST })
}

main().catch((err) => {
  console.error('fatal startup error', err)
  process.exit(1)
})
