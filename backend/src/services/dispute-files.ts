import { createReadStream } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { nanoid } from 'nanoid'
import { config } from '../config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function getDisputeUploadRoot(): string {
  return config.DISPUTE_UPLOAD_DIR
}

export function resolveSafeStoragePath(storageKey: string): string {
  const root = path.resolve(getDisputeUploadRoot())
  const normalized = storageKey.replace(/\\/g, path.sep)
  const resolved = path.resolve(root, normalized)
  if (!resolved.startsWith(root + path.sep) && resolved !== root) {
    throw new Error('invalid storage key')
  }
  return resolved
}

const SAFE_NAME = /^[a-zA-Z0-9._-]{1,200}$/

export async function saveDisputeUpload(
  contractId: string,
  fileName: string,
  mimeType: string,
  buffer: Buffer,
): Promise<{ storageKey: string; size: number }> {
  const base = nanoid()
  const safeName = SAFE_NAME.test(path.basename(fileName)) ? path.basename(fileName) : 'upload.bin'
  const rel = path.join(contractId, base, safeName)
  const abs = resolveSafeStoragePath(rel)
  await fs.mkdir(path.dirname(abs), { recursive: true })
  await fs.writeFile(abs, buffer)
  return { storageKey: rel.split(path.sep).join('/'), size: buffer.length }
}

export function readDisputeFileStream(storageKey: string) {
  const abs = resolveSafeStoragePath(storageKey)
  return createReadStream(abs)
}

export async function disputeFileExists(storageKey: string): Promise<boolean> {
  try {
    await fs.access(resolveSafeStoragePath(storageKey))
    return true
  } catch {
    return false
  }
}
