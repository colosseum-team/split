import type { FC } from 'react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'

interface WalletConnectButtonProps {
  className?: string
  /** Hide the disconnect alternative when already connected. */
  hideDisconnect?: boolean
}

const truncateAddress = (address: string, head = 4, tail = 4) =>
  address.length <= head + tail + 1 ? address : `${address.slice(0, head)}…${address.slice(-tail)}`

export const WalletConnectButton: FC<WalletConnectButtonProps> = ({
  className = '',
  hideDisconnect = false,
}) => {
  const { setVisible } = useWalletModal()
  const { connected, connecting, publicKey, disconnect, wallet } = useWallet()

  const handleConnect = () => setVisible(true)
  const handleDisconnect = () => disconnect()

  if (!connected) {
    return (
      <button
        type="button"
        onClick={handleConnect}
        disabled={connecting}
        className={`flex items-center justify-center gap-2 w-full h-[52px] rounded-[12px] bg-[var(--color-button)] border border-[var(--color-button-border)] text-[14px] font-bold text-[var(--color-continue-button-text)] hover:opacity-90 transition-opacity disabled:opacity-60 cursor-pointer ${className}`}
      >
        <WalletIcon className="w-5 h-5" />
        <span>{connecting ? 'Connecting…' : 'Connect wallet'}</span>
      </button>
    )
  }

  return (
    <div className={`flex flex-col gap-2 w-full ${className}`}>
      <div className="flex items-center justify-between gap-2 w-full h-[52px] rounded-[12px] bg-[var(--color-wallet-address-input)] px-4">
        <div className="flex items-center gap-2 min-w-0">
          {wallet?.adapter.icon && (
            <img src={wallet.adapter.icon} alt={wallet.adapter.name} className="w-5 h-5 rounded" />
          )}
          <span className="text-[14px] font-medium text-[var(--color-wallet-address-input-text)] truncate">
            {publicKey ? truncateAddress(publicKey.toBase58()) : 'Connected'}
          </span>
        </div>

        {!hideDisconnect && (
          <button
            type="button"
            onClick={handleDisconnect}
            className="flex items-center gap-1 text-[14px] font-bold text-[var(--color-text-purple)] cursor-pointer hover:opacity-80 transition-opacity"
            aria-label="Disconnect wallet"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            <span>Disconnect</span>
          </button>
        )}
      </div>
    </div>
  )
}
