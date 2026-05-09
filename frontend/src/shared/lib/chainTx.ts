// Decodes a backend-built unsigned VersionedTransaction (base64), asks the
// wallet adapter to sign it, and submits to the configured RPC. Used by
// the contract create / fund / approve flows to put real txs on-chain.
//
// In MOCK_CHAIN mode the backend returns sentinel strings like
// "mockTx_create_xxxx" that aren't valid Solana txs. Callers must consult
// api.health().chain first and skip this helper when chain==='mock'.

import { Connection, VersionedTransaction } from '@solana/web3.js'
import type { WalletContextState } from '@solana/wallet-adapter-react'

const MAINNET_FALLBACK = 'https://api.devnet.solana.com'

let cachedConnection: Connection | null = null

/**
 * Lazy-built Connection so the heavy @solana/web3.js init cost only fires
 * the first time we actually want to send a chain tx.
 */
export function getChainConnection(): Connection {
  if (cachedConnection) return cachedConnection
  const rpc = (import.meta.env.VITE_SOLANA_RPC_URL as string | undefined) ?? MAINNET_FALLBACK
  cachedConnection = new Connection(rpc, 'confirmed')
  return cachedConnection
}

export class ChainTxError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message)
    this.name = 'ChainTxError'
  }
}

export function decodeBase64Tx(base64: string): VersionedTransaction {
  try {
    // browser-safe base64 → Uint8Array
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < bytes.length; i++) bytes[i] = binary.charCodeAt(i)
    return VersionedTransaction.deserialize(bytes)
  } catch (err) {
    throw new ChainTxError('Failed to decode unsigned tx (not valid base64?)', err)
  }
}

export interface SignAndSendResult {
  signature: string
  /** True when the tx was confirmed at "confirmed" commitment within the window. */
  confirmed: boolean
}

/**
 * Decode + wallet-sign + RPC-submit + await confirmation. Errors out at
 * any failed step rather than silently passing a half-broken signature
 * back to the backend. Caller can fall through to error UI.
 */
export async function signAndSendChainTx(
  unsignedTxBase64: string,
  wallet: Pick<WalletContextState, 'signTransaction' | 'publicKey'>,
): Promise<SignAndSendResult> {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new ChainTxError('Wallet not connected or does not support signTransaction')
  }
  const tx = decodeBase64Tx(unsignedTxBase64)

  let signed: VersionedTransaction
  try {
    signed = await wallet.signTransaction(tx)
  } catch (err) {
    throw new ChainTxError('Wallet declined to sign the transaction', err)
  }

  const conn = getChainConnection()
  let signature: string
  try {
    signature = await conn.sendTransaction(signed, { skipPreflight: false })
  } catch (err) {
    throw new ChainTxError('RPC rejected sendTransaction', err)
  }

  // Best-effort confirmation. Devnet sometimes drops sigs on the floor;
  // we still return `signature` so the backend can index it later.
  let confirmed = false
  try {
    const latest = await conn.getLatestBlockhash('confirmed')
    const result = await conn.confirmTransaction(
      { signature, blockhash: latest.blockhash, lastValidBlockHeight: latest.lastValidBlockHeight },
      'confirmed',
    )
    confirmed = !result.value.err
  } catch {
    confirmed = false
  }
  return { signature, confirmed }
}
