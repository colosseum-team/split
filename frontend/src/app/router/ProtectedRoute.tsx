import type { PropsWithChildren } from 'react'
import { Navigate } from 'react-router-dom'
import { useUserStore } from '@/entities/user'

interface ProtectedRouteProps extends PropsWithChildren {
  /** if true — redirect to /start when there is no wallet/role yet. */
  requireRole?: boolean
}

export function ProtectedRoute({ children, requireRole = true }: ProtectedRouteProps) {
  const walletAddress = useUserStore((s) => s.walletAddress)
  const role = useUserStore((s) => s.role)

  if (!walletAddress) {
    return <Navigate to="/start" replace />
  }
  if (requireRole && !role) {
    return <Navigate to="/start" replace />
  }

  return children
}
