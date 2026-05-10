import { useState } from 'react'
import { useContractsStore, type Contract } from '@/entities/contract'
import { useUserStore } from '@/entities/user'
import { api } from '@/shared/api/client'
import { formatActionError } from '@/shared/api/errors'

interface UseAcceptContractOptions {
  onSuccess?: () => void
  onError?: (message: string) => void
}

interface UseAcceptContractResult {
  run: () => Promise<void>
  isPending: boolean
  error: string | null
}

// Performer Accept: pure DB-only action (no chain tx). The endpoint sets
// `assigneeAddress = me` and bumps status to `in_progress`.
export function useAcceptContract(
  contract: Contract | null | undefined,
  opts: UseAcceptContractOptions = {},
): UseAcceptContractResult {
  const authToken = useUserStore((s) => s.authToken)
  const applyBackendContract = useContractsStore((s) => s.applyBackendContract)

  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async () => {
    if (!contract) return
    setError(null)
    setIsPending(true)
    try {
      if (!authToken) throw new Error('Not authenticated — sign in with your wallet first')
      if (!contract.backendId) {
        throw new Error('Contract has no backend record yet')
      }

      const dto = await api.contracts.accept(authToken, contract.backendId)
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
