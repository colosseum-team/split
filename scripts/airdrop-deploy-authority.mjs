// Airdrop devnet SOL to the bootstrap deploy authority. Devnet's public
// faucet caps each request at 2 SOL with a per-IP cooldown that's been
// known to vary; we retry with backoff until the wallet has at least
// MIN_SOL or we hit MAX_ATTEMPTS.

import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'

const RPC = process.env.SOLANA_RPC_URL ?? 'https://api.devnet.solana.com'
const PUBKEY = process.env.DEPLOY_PUBKEY
const TARGET_SOL = Number(process.env.TARGET_SOL ?? 5)
const MAX_ATTEMPTS = Number(process.env.MAX_ATTEMPTS ?? 12)

if (!PUBKEY) {
  console.error('DEPLOY_PUBKEY env required')
  process.exit(1)
}

const conn = new Connection(RPC, 'confirmed')
const target = new PublicKey(PUBKEY)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const lamports = await conn.getBalance(target)
    const sol = lamports / LAMPORTS_PER_SOL
    console.log(`[${attempt}] balance: ${sol} SOL (target ${TARGET_SOL})`)
    if (sol >= TARGET_SOL) {
      console.log('TARGET_REACHED')
      process.exit(0)
    }
    try {
      const sig = await conn.requestAirdrop(target, 2 * LAMPORTS_PER_SOL)
      console.log(`  airdrop sig ${sig}`)
      await conn.confirmTransaction({ signature: sig, ...(await conn.getLatestBlockhash()) }, 'confirmed')
      console.log('  confirmed')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`  airdrop failed: ${msg}`)
      // Common rate-limit shapes — back off and try again.
      const wait = msg.toLowerCase().includes('rate') || msg.includes('429') ? 60_000 : 15_000
      console.log(`  sleeping ${wait / 1000}s`)
      await sleep(wait)
    }
  }
  const lamports = await conn.getBalance(target)
  const sol = lamports / LAMPORTS_PER_SOL
  console.log(`final balance: ${sol} SOL`)
  if (sol < TARGET_SOL) {
    console.error(`did not reach target ${TARGET_SOL} SOL after ${MAX_ATTEMPTS} attempts`)
    process.exit(2)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
