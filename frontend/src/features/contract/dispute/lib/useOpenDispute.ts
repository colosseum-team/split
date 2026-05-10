import { useState } from 'react'
import { useContractsStore, type Contract } from '@/entities/contract'
import { useUserStore } from '@/entities/user'
import { api } from '@/shared/api/client'
import { formatActionError } from '@/shared/api/errors'

interface UseOpenDisputeOptions {
  onSuccess?: () => void
  onError?: (message: string) => void
}

interface UseOpenDisputeResult {
  run: (reason?: string) => Promise<void>
  isPending: boolean
  error: string | null
}

// Posts `POST /contracts/:id/dispute` and patches the local store via
// `applyBackendContract`. Falls back to the local-only `openDispute` action
// when the contract has no `backendId` yet (demo rows or pre-server drafts)
// so QA gallery flows still work.
export function useOpenDispute(
  contract: Contract | null | undefined,
  opts: UseOpenDisputeOptions = {},
): UseOpenDisputeResult {
  const authToken = useUserStore((s) => s.authToken)
  const applyBackendContract = useContractsStore((s) => s.applyBackendContract)
  const openDisputeLocal = useContractsStore((s) => s.openDispute)

  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async (reason?: string) => {
    if (!contract) return
    setError(null)
    setIsPending(true)
    try {
      if (contract.backendId && authToken) {
        const dto = await api.contracts.openDispute(authToken, contract.backendId, { reason })
        applyBackendContract(contract.id, dto)
      } else {
        openDisputeLocal(contract.id)
      }
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
