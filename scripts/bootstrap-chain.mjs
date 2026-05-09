// One-shot bootstrap for the Escros chain track. Generates the three
// keypairs we need (program, deploy authority, arbiter), writes them to
// /tmp/escros-bootstrap/ for handoff to gh secret set, and prints the
// pubkeys so we can patch declare_id!()/Anchor.toml/the backend IDL.
//
// Run: node scripts/bootstrap-chain.mjs
// Re-run-safe: refuses to overwrite existing keypair files.

import { Keypair } from '@solana/web3.js'
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const OUT_DIR = process.env.OUT_DIR ?? '/tmp/escros-bootstrap'
mkdirSync(OUT_DIR, { recursive: true })

function makeKeypair(name) {
  const file = join(OUT_DIR, `${name}.json`)
  if (existsSync(file)) {
    throw new Error(`${file} already exists — delete manually if you really want a new keypair`)
  }
  const kp = Keypair.generate()
  writeFileSync(file, JSON.stringify(Array.from(kp.secretKey)))
  return { file, pubkey: kp.publicKey.toBase58() }
}

const program = makeKeypair('program-keypair')
const deploy = makeKeypair('deploy-authority')
const arbiter = makeKeypair('arbiter-keypair')

console.log(JSON.stringify({
  program: { pubkey: program.pubkey, file: program.file },
  deploy: { pubkey: deploy.pubkey, file: deploy.file },
  arbiter: { pubkey: arbiter.pubkey, file: arbiter.file },
}, null, 2))
