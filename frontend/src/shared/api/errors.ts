import { ApiError } from './client'
import { ChainTxError } from '@/shared/lib/chainTx'

// Folds ApiError / ChainTxError / Error / unknown into a single human-readable
// string for display in modals and inline error rows. Keeps the API
// `code` prefix so support can grep prod logs back to a specific endpoint.
export function formatActionError(err: unknown): string {
  if (err instanceof ApiError) return `${err.code}: ${err.message}`
  if (err instanceof ChainTxError) return err.message
  if (err instanceof Error) return err.message
  return 'Unknown error'
}
