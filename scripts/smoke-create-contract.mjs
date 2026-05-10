// SIWS auth → POST /contracts → log the chain bundle the SPA gets back.
// Use to verify the backend's MockChain (or live SolanaChain) returns
// the expected onchainAddress + unsignedTx without driving the UI.

import { Keypair } from '@solana/web3.js'
import bs58 from 'bs58'
import nacl from 'tweetnacl'

const BASE = process.env.BASE_URL ?? 'https://app.escros.work.gd/api'

async function http(method, path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    json = { raw: text }
  }
  return { ok: res.ok, status: res.status, json }
}

const customer = Keypair.generate()
const performer = Keypair.generate()
const wallet = customer.publicKey.toBase58()

const nonce = await http('POST', '/auth/nonce', { walletAddress: wallet })
if (!nonce.ok) {
  console.log('nonce fail', nonce.status, nonce.json)
  process.exit(1)
}
const sig = nacl.sign.detached(new TextEncoder().encode(nonce.json.message), customer.secretKey)
const signature = bs58.default ? bs58.default.encode(sig) : bs58.encode(sig)
const verify = await http('POST', '/auth/verify', { walletAddress: wallet, signature })
let token = verify.json.token
const role = await http('POST', '/me/role', { role: 'customer' }, token)
if (role.ok && role.json?.token) token = role.json.token

const create = await http(
  'POST',
  '/contracts',
  {
    title: 'Smoke logo',
    description: 'Wordmark logo for the chain smoke test.',
    amount: '100000',
    currency: 'SOL',
    disputeResolutionDays: 7,
  },
  token,
)
console.log('POST /contracts →', create.status)
if (!create.ok) {
  console.log(create.json)
  process.exit(2)
}
const c = create.json
console.log('id:              ', c.id)
console.log('status:          ', c.status)
console.log('onchainAddress:  ', c.onchainAddress)
console.log('contractHash:    ', c.contractHash)
console.log('unsignedTx (40c):', String(c.unsignedTx).slice(0, 40))
console.log('amount/currency: ', c.amount, c.currency)
process.exit(0)
