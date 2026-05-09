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

const kp = Keypair.generate()
const wallet = kp.publicKey.toBase58()
console.log('wallet', wallet)

const nonce = await http('POST', '/auth/nonce', { walletAddress: wallet })
console.log('nonce', nonce.status, nonce.json)
if (!nonce.ok) process.exit(1)

const msgBytes = new TextEncoder().encode(nonce.json.message)
const sigBytes = nacl.sign.detached(msgBytes, kp.secretKey)
const signature = bs58.default ? bs58.default.encode(sigBytes) : bs58.encode(sigBytes)

const verify = await http('POST', '/auth/verify', { walletAddress: wallet, signature })
console.log('verify', verify.status, verify.json && { token: verify.json.token?.slice(0, 24) + '...', user: verify.json.user })
if (!verify.ok) process.exit(1)
const token = verify.json.token

const role = await http('POST', '/me/role', { role: 'customer' }, token)
console.log('role', role.status, role.json)

console.log('--- /ai/copilot-preview (this exercises QVAC inference end-to-end)')
const t0 = Date.now()
const preview = await http(
  'POST',
  '/ai/copilot-preview',
  {
    scenario: 'logo',
    input: {
      technicalAssignment:
        'Need a clean wordmark logo for a freelance escrow platform. Pastel palette. Two color variants (light/dark). Deliver SVG and PNG. Two rounds of revisions, deadline two weeks.',
    },
  },
  token,
)
const elapsed = ((Date.now() - t0) / 1000).toFixed(1)
console.log(`status ${preview.status}  in ${elapsed}s`)
console.log(JSON.stringify(preview.json, null, 2).slice(0, 1500))
process.exit(preview.ok ? 0 : 2)
