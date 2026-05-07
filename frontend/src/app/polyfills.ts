import { Buffer } from 'buffer'

declare global {
  interface Window {
    Buffer?: typeof Buffer
    global?: typeof globalThis
    process?: { env?: Record<string, string | undefined> }
  }
}

if (typeof window !== 'undefined') {
  if (!window.Buffer) window.Buffer = Buffer
  if (!window.global) window.global = window
  if (!window.process) {
    window.process = { env: {} }
  }
}
