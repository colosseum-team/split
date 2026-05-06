import { type FC, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusIcon } from '@heroicons/react/24/outline'
import { useUserStore } from '@/entities/user'
import { useContractsStore } from '@/entities/contract'
import { useWalletAuth } from '@/features/wallet'
import { Header, Layout } from '@/widgets/layout'
import { ContractCard, StatusFilterButtons, type StatusFilter } from '@/widgets/contract'

export const HomePage: FC = () => {
  const navigate = useNavigate()
  const role = useUserStore((s) => s.role)
  const walletAddress = useUserStore((s) => s.walletAddress)
  const contracts = useContractsStore((s) => s.contracts)
  const { disconnect } = useWalletAuth()

  const [filter, setFilter] = useState<StatusFilter>('all')

  const myContracts = useMemo(() => {
    if (!walletAddress) return []
    return contracts.filter(
      (c) =>
        c.customer.walletAddress === walletAddress || c.performer.walletAddress === walletAddress,
    )
  }, [contracts, walletAddress])

  const filtered = useMemo(() => {
    switch (filter) {
      case 'pending':
        return myContracts.filter(
          (c) => c.status === 'PENDING_SIGNING' || c.status === 'PARTIALLY_SIGNED',
        )
      case 'signed':
        return myContracts.filter((c) => c.status === 'SIGNED')
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
          <div className="flex flex-col">
            <h1 className="md:text-[22px] text-[18px] font-bold text-(--color-text-black) leading-tight">
              All contracts
            </h1>
            <span className="text-[12px] font-medium text-(--color-role-text) capitalize">
              {role ?? ''}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDisconnect}
          className="flex items-center gap-1 text-[13px] font-bold text-(--color-text-purple) hover:opacity-80 transition-opacity cursor-pointer"
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
            <div className="text-[18px] font-bold text-(--color-text-dark-blue)">
              No contracts yet
            </div>
            <p className="text-[14px] font-medium text-(--color-text-start-page) max-w-[320px]">
              {role === 'customer'
                ? 'Tap the plus button below to create your first contract.'
                : 'Once a customer creates a contract for you, it will appear here.'}
            </p>
          </div>
        )}
      </div>

      {role === 'customer' && (
        <button
          type="button"
          onClick={handleCreate}
          className="fixed bottom-6 right-6 w-14 h-14 md:w-auto md:h-auto md:px-6 md:py-3 flex items-center gap-2 justify-center bg-(--color-button) border border-(--color-button-border) rounded-full md:rounded-[12px] shadow-lg md:shadow-md text-(--color-text-purple) font-bold cursor-pointer hover:opacity-90 transition-opacity z-40"
          aria-label="Create contract"
        >
          <PlusIcon className="w-5 h-5" />
          <span className="hidden md:inline">Create contract</span>
        </button>
      )}
    </Layout>
  )
}
