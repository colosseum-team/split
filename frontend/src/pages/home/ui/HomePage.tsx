import { type FC, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusIcon } from '@heroicons/react/24/outline'
import { useUserStore } from '@/entities/user'
import { useContractsStore } from '@/entities/contract'
import { useWalletAuth } from '@/features/wallet'
import { Header, Layout } from '@/widgets/layout'
import { ContractCard, StatusFilterButtons, type StatusFilter } from '@/widgets/contract'
import { Button, RoleChip } from '@/shared/ui'

export const HomePage: FC = () => {
  const navigate = useNavigate()
  const role = useUserStore((s) => s.role)
  const walletAddress = useUserStore((s) => s.walletAddress)
  const contracts = useContractsStore((s) => s.contracts)
  const { disconnect } = useWalletAuth()

  const [filter, setFilter] = useState<StatusFilter>('all')

  const myContracts = useMemo(() => {
    if (role === 'performer') {
      // Demo inbox: show unclaimed contracts (no performer wallet yet) + contracts assigned to this wallet.
      return contracts.filter(
        (c) => !c.performer.walletAddress || c.performer.walletAddress === walletAddress,
      )
    }
    if (!walletAddress) return []
    return contracts.filter((c) => c.customer.walletAddress === walletAddress)
  }, [contracts, role, walletAddress])

  const filtered = useMemo(() => {
    switch (filter) {
      case 'pending':
        return myContracts.filter(
          (c) => c.status === 'PENDING_SIGNING' || c.status === 'PARTIALLY_SIGNED',
        )
      case 'signed':
        return myContracts.filter((c) => c.status === 'SIGNED')
      case 'review':
        return myContracts.filter((c) => c.status === 'REVIEW')
      case 'disputed':
        return myContracts.filter((c) => c.status === 'DISPUTED')
      case 'completed':
        return myContracts.filter((c) => c.status === 'COMPLETED')
      case 'declined':
        return myContracts.filter((c) => c.status === 'DECLINED')
      default:
        return myContracts
    }
  }, [myContracts, filter])

  const handleCreate = () => navigate('/contracts/new')
  const handleDisconnect = () => {
    disconnect().catch(() => {})
  }

  return (
    <Layout>
      <Header className="justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          {/* place for logo */}
          <div className="flex flex-col gap-2">
            <h1 className="text-h2 text-(--color-text-primary)">All contracts</h1>
            <RoleChip role={role} />
          </div>
        </div>
        <button
          type="button"
          onClick={handleDisconnect}
          className="flex items-center gap-1 text-[13px] font-bold text-(--color-brand) hover:opacity-80 transition-opacity cursor-pointer"
          aria-label="Disconnect wallet"
        >
          <span className="hidden md:inline">Disconnect</span>
        </button>
      </Header>

      <div className="mb-4">
        <StatusFilterButtons selected={filter} onChange={setFilter} />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-24">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((contract) => (
              <ContractCard key={contract.id} contract={contract} currentWallet={walletAddress} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-16 gap-2">
            <div className="text-h3 text-(--color-text-primary)">No contracts yet</div>
            <p className="text-body text-(--color-text-secondary) max-w-[320px]">
              {role === 'customer'
                ? 'Tap the plus button below to create your first contract.'
                : 'Once a customer creates a contract for you, it will appear here.'}
            </p>
          </div>
        )}
      </div>

      {role === 'customer' && (
        <div className="fixed bottom-6 left-0 right-0 z-40 pointer-events-none">
          <div className="w-full max-w-[820px] mx-auto px-4 md:px-6 flex justify-end">
            <Button
              onClick={handleCreate}
              size="lg"
              role="customer"
              className="pointer-events-auto w-14 px-0 rounded-[var(--radius-pill)] md:w-auto md:px-6 shadow-[var(--shadow-md)]"
              aria-label="Create contract"
            >
              <PlusIcon className="w-5 h-5" />
              <span className="hidden md:inline">Create contract</span>
            </Button>
          </div>
        </div>
      )}
    </Layout>
  )
}
