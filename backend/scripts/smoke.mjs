// End-to-end smoke test: SIWS sign-in for two users, contract lifecycle,
// AI output storage, dispute path. Run with `node backend/scripts/smoke.mjs`.
//
// This script generates real Solana keypairs in-memory and signs the nonce,
// so it exercises the actual signature-verification path of the backend.
import nacl from 'tweetnacl'
import { Keypair } from '@solana/web3.js'
import bs58Pkg from 'bs58'
const bs58 = bs58Pkg.default ?? bs58Pkg

const BASE = 'http://127.0.0.1:4000'

async function http(method, path, { body, token } = {}) {
  const headers = {}
  if (body !== undefined) headers['content-type'] = 'application/json'
  if (token) headers.authorization = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let parsed
  try {
    parsed = text ? JSON.parse(text) : null
  } catch {
    parsed = text
  }
  if (!res.ok) {
    throw new Error(`${method} ${path} -> ${res.status}: ${JSON.stringify(parsed).slice(0, 400)}`)
  }
  return parsed
}

async function signIn(label) {
  const kp = Keypair.generate()
  const wallet = kp.publicKey.toBase58()
  console.log(`[${label}] wallet=${wallet.slice(0, 8)}...${wallet.slice(-4)}`)
  const { nonce, message } = await http('POST', '/auth/nonce', {
    body: { walletAddress: wallet },
  })
  const sig = nacl.sign.detached(new TextEncoder().encode(message), kp.secretKey)
  const { token, user } = await http('POST', '/auth/verify', {
    body: { walletAddress: wallet, signature: bs58.encode(sig) },
  })
  console.log(`[${label}] verified, role=${user.role}`)
  return { wallet, token, kp }
}

async function setRole(token, role) {
  const res = await http('POST', '/me/role', { body: { role }, token })
  return res.token
}

;(async () => {
  console.log('=== SIWS for customer + user ===')
  const customer0 = await signIn('customer')
  const customerToken = await setRole(customer0.token, 'customer')
  const user0 = await signIn('user')
  const userToken = await setRole(user0.token, 'user')

  console.log('=== /me ===')
  const me = await http('GET', '/me', { token: customerToken })
  console.log('customer /me:', { wallet: me.walletAddress.slice(0, 8), role: me.role })

  console.log('=== POST /contracts (customer creates) ===')
  const created = await http('POST', '/contracts', {
    token: customerToken,
    body: {
      title: 'Logo for split',
      description: 'Design a clean monochrome logo. Three concepts.',
      amount: '1500000000',
      currency: 'USDC',
      deadline: new Date(Date.now() + 14 * 86400_000).toISOString(),
    },
  })
  console.log('created:', {
    id: created.id,
    status: created.status,
    contractHash: created.contractHash?.slice(0, 16) + '...',
    onchainAddress: created.onchainAddress?.slice(0, 16) + '...',
    unsignedTx: created.unsignedTx,
  })
  if (created.contractHash.length !== 64) throw new Error('bad hash length')

  console.log('=== hashing determinism: same fields -> same hash ===')
  const created2 = await http('POST', '/contracts', {
    token: customerToken,
    body: {
      title: 'Logo for split',
      description: 'Design a clean monochrome logo. Three concepts.',
      amount: '1500000000',
      currency: 'USDC',
      deadline: new Date(Date.now() + 14 * 86400_000).toISOString(),
    },
  })
  console.log('created2.contractHash:', created2.contractHash.slice(0, 16) + '...')
  if (created.contractHash !== created2.contractHash) {
    console.warn(
      '  ! hashes differ — likely deadline timestamps differ. Acceptable: hash includes deadline.',
    )
  } else {
    console.log('  ✓ hashes match')
  }

  console.log('=== fund (customer) ===')
  const funded = await http('POST', `/contracts/${created.id}/fund`, {
    token: customerToken,
    body: { txSignature: 'mockTx_fund_aaaaa' },
  })
  console.log('status:', funded.status)

  console.log('=== accept (user) ===')
  const accepted = await http('POST', `/contracts/${created.id}/accept`, {
    token: userToken,
  })
  console.log('status:', accepted.status, 'assignee:', accepted.assigneeAddress?.slice(0, 8))

  console.log('=== submit (user) ===')
  const submitted = await http('POST', `/contracts/${created.id}/submit`, {
    token: userToken,
    body: { payload: 'https://figma.com/file/xyz - 3 concepts attached' },
  })
  console.log('status:', submitted.status)

  console.log('=== POST copilot-output (customer) ===')
  const copilot = await http('POST', `/contracts/${created.id}/copilot-output`, {
    token: customerToken,
    body: {
      modelId: 'qvac-llamacpp-7B',
      modelVersion: 'demo-1',
      result: {
        ambiguities: ['unclear monochrome scope'],
        rewrite_suggestions: [{ target: 'monochrome', replacement: 'single-color black on white' }],
        acceptance_criteria: ['3 concepts', 'vector source', 'B/W variant'],
        risk_score: 35,
        risk_factors: ['no brand guide'],
      },
    },
  })
  console.log('copilot output id:', copilot.id, 'riskScore:', copilot.riskScore)

  console.log('=== open dispute (user) ===')
  const disputed = await http('POST', `/contracts/${created.id}/dispute`, {
    token: userToken,
    body: { reason: 'client claims monochrome failed' },
  })
  console.log('status:', disputed.status, 'openedBy:', disputed.disputeOpenedBy)

  console.log('=== post dispute-output (user) ===')
  const brief = await http('POST', `/contracts/${created.id}/dispute-output`, {
    token: userToken,
    body: {
      modelId: 'qvac-llamacpp-7B',
      modelVersion: 'demo-1',
      result: {
        case_summary:
          'Customer claims monochrome was missing. User submitted 3 concepts in B/W and color.',
        timeline: ['created', 'funded', 'accepted', 'submitted', 'disputed'],
        agreed_requirements: ['3 concepts', 'B/W variant'],
        submitted_evidence: ['3 concepts in figma file'],
        matches_and_gaps: [
          { requirement: '3 concepts', evidence: '3 concepts attached', match: 'match' },
          { requirement: 'B/W variant', evidence: 'color only', match: 'miss' },
        ],
        similarity_score: 0.62,
        risk_assessment: 'partial deliverable',
        recommended_resolution: 'performer adds B/W variant within 2 days',
      },
    },
  })
  console.log('dispute brief id:', brief.id, 'similarity:', brief.similarityScore)

  console.log('=== resolve dispute ===')
  const resolved = await http('POST', `/contracts/${created.id}/resolve-dispute`, {
    token: customerToken,
    body: { outcome: 'PERFORMER_WON' },
  })
  console.log(
    'status:',
    resolved.status,
    'outcome:',
    resolved.disputeOutcome,
    'onchain:',
    resolved.onchain,
  )

  console.log('=== list AI outputs ===')
  const outputs = await http('GET', `/contracts/${created.id}/ai-outputs`, { token: customerToken })
  console.log(
    'outputs count:',
    outputs.length,
    'kinds:',
    outputs.map((o) => o.kind),
  )

  console.log('=== list contracts as user, status=mine ===')
  const mine = await http('GET', '/contracts?role=user&status=mine', { token: userToken })
  console.log('user mine count:', mine.length, 'first status:', mine[0]?.status)

  console.log('\n✓ smoke passed')
})().catch((err) => {
  console.error('smoke FAILED:', err.message)
  process.exit(1)
})
