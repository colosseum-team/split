import { sha256 } from '@noble/hashes/sha2'
import { bytesToHex } from '@noble/hashes/utils'

export const computeContractTextHash = (text: string): string => {
  const encoder = new TextEncoder()
  const messageBytes = encoder.encode(text)
  const hashBytes = sha256(messageBytes)
  return bytesToHex(hashBytes)
}
