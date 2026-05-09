import bs58 from 'bs58'
import { computeContractTextHash } from '@/entities/contract'

/** UTF-8 prefix so wallets (e.g. Phantom) accept signMessage — raw hash bytes are often rejected. */
const CONTRACT_SIGN_PREFIX = 'Escros contract agreement\nContract text SHA-256 (hex):\n'

export function buildContractSignMessageBytes(textHash: string): Uint8Array {
  const body = `${CONTRACT_SIGN_PREFIX}${textHash}\n`
  return new TextEncoder().encode(body)
}

export interface SignContractParams {
  text: string
  signMessage: (message: Uint8Array) => Promise<Uint8Array>
}

export interface SignContractResult {
  /** Hex of SHA-256(contract text) */
  textHash: string
  /** base58 encoded wallet signature */
  signature: string
}

/**
 * Hashes the contract text with SHA-256 and asks the wallet to sign a UTF-8 message
 * that embeds that hash (wallet-safe; signing raw 32-byte hashes often fails on Phantom).
 * Returns hash + base58 signature for storage.
 */
export const signContractText = async ({
  text,
  signMessage,
}: SignContractParams): Promise<SignContractResult> => {
  const textHash = computeContractTextHash(text)
  const messageBytes = buildContractSignMessageBytes(textHash)

  const signatureBytes = await signMessage(messageBytes)
  const signature = bs58.encode(signatureBytes)

  return { textHash, signature }
}
