import { useState } from 'react'
import { useContractsStore, type Contract } from '@/entities/contract'
import { useUserStore } from '@/entities/user'
import { api } from '@/shared/api/client'
import { formatActionError } from '@/shared/api/errors'

interface UseSubmitWorkOptions {
  onSuccess?: () => void
  onError?: (message: string) => void
}

interface UseSubmitWorkResult {
  run: (payload: string) => Promise<void>
  isPending: boolean
  error: string | null
}

// Performer Submit work: posts the deliverable description / link / commit
// hash. Backend bumps status to `review`. No chain tx.
export function useSubmitWork(
  contract: Contract | null | undefined,
  opts: UseSubmitWorkOptions = {},
): UseSubmitWorkResult {
  const authToken = useUserStore((s) => s.authToken)
  const applyBackendContract = useContractsStore((s) => s.applyBackendContract)

  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async (payload: string) => {
    if (!contract) return
    setError(null)
    setIsPending(true)
    try {
      if (!authToken) throw new Error('Not authenticated — sign in with your wallet first')
      if (!contract.backendId) throw new Error('Contract has no backend record yet')
      const trimmed = payload.trim()
      if (trimmed.length < 1) throw new Error('Submission cannot be empty')
      if (trimmed.length > 20_000) throw new Error('Submission is too long (max 20000 chars)')

      const dto = await api.contracts.submitWork(authToken, contract.backendId, trimmed)
      applyBackendContract(contract.id, dto)

      opts.onSuccess?.()
    } catch (err) {
      const msg = formatActionError(err)
      setError(msg)
      opts.onError?.(msg)
    } finally {
      setIsPending(false)
    }
  }

  return { run, isPending, error }
}
