import { useEffect, type PropsWithChildren } from 'react'
import { useUserStore } from '@/entities/user'
import { useContractsStore } from '@/entities/contract'

/**
 * Bootstraps app-level state:
 * - if the user is a performer, seeds a mock contract once (so the inbox isn't empty).
 */
export function StoreProvider({ children }: PropsWithChildren) {
  const role = useUserStore((s) => s.role)
  const walletAddress = useUserStore((s) => s.walletAddress)
  const seedPerformerMockOnce = useContractsStore((s) => s.seedPerformerMockOnce)

  useEffect(() => {
    if (role === 'performer' && walletAddress) {
      seedPerformerMockOnce(walletAddress)
    }
  }, [role, walletAddress, seedPerformerMockOnce])

  return children
}
