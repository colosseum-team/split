import { useEffect, type PropsWithChildren } from 'react'
import { useUserStore } from '@/entities/user'
import { useContractsStore } from '@/entities/contract'

/**
 * Bootstraps app-level state:
 * - seeds gallery mocks (statuses + extra REVIEW rows); for customer only, more REVIEW inbox demos.
 * - if the user is a performer, also seeds a partial mock once (inbox not empty).
 */
export function StoreProvider({ children }: PropsWithChildren) {
  const role = useUserStore((s) => s.role)
  const walletAddress = useUserStore((s) => s.walletAddress)
  const seedPerformerMockOnce = useContractsStore((s) => s.seedPerformerMockOnce)
  const ensureCompletedDisputeDemo = useContractsStore((s) => s.ensureCompletedDisputeDemo)
  const ensureStatusGalleryDemos = useContractsStore((s) => s.ensureStatusGalleryDemos)

  useEffect(() => {
    if (!walletAddress || !role) return
    ensureStatusGalleryDemos(walletAddress, role)
    ensureCompletedDisputeDemo(walletAddress, role)
    if (role === 'performer') {
      seedPerformerMockOnce(walletAddress)
    }
  }, [
    role,
    walletAddress,
    ensureCompletedDisputeDemo,
    ensureStatusGalleryDemos,
    seedPerformerMockOnce,
  ])

  return children
}
