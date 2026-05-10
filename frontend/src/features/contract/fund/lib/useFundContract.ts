import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useContractsStore, type Contract } from '@/entities/contract'
import { useUserStore } from '@/entities/user'
import { api } from '@/shared/api/client'
import { formatActionError } from '@/shared/api/errors'
import { signAndSendChainTx } from '@/shared/lib/chainTx'

interface UseFundContractOptions {
  onSuccess?: () => void
  onError?: (message: string) => void
}

interface UseFundContractResult {
  run: () => Promise<void>
  isPending: boolean
  error: string | null
}

// Customer Fund: build the unsigned fund tx on the backend, sign+submit
// with Phantom, post the signature back to /contracts/:id/fund, then
// refetch the contract DTO and patch local state via applyBackendContract.
export function useFundContract(
  contract: Contract | null | undefined,
  opts: UseFundContractOptions = {},
): UseFundContractResult {
  const wallet = useWallet()
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
      if (contract.chainMode !== 'solana' || !contract.backendId) {
        throw new Error('Contract has no on-chain escrow yet')
      }
      if (!wallet.publicKey || !wallet.signTransaction) {
        throw new Error('Connect Phantom on Devnet to continue')
      }

      const { tx } = await api.contracts.buildFundTx(authToken, contract.backendId)
      const { signature } = await signAndSendChainTx(tx, wallet)
      await api.contracts.recordFund(authToken, contract.backendId, signature)
      const dto = await api.contracts.get(authToken, contract.backendId)
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
