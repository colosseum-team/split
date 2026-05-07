import bs58 from 'bs58'
import { hexToBytes } from '@noble/hashes/utils'
import { computeContractTextHash } from '@/entities/contract'

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
 * Hashes the contract text with SHA-256 and asks the wallet to sign the bytes.
 * Returns hash + base58 signature for storage.
 */
export const signContractText = async ({
  text,
  signMessage,
}: SignContractParams): Promise<SignContractResult> => {
  const textHash = computeContractTextHash(text)
  const hashBytes = hexToBytes(textHash)

  const signatureBytes = await signMessage(hashBytes)
  const signature = bs58.encode(signatureBytes)

  return { textHash, signature }
}
