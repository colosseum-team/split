import { useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useUserStore } from '@/entities/user'

/**
 * Bridges Solana wallet adapter -> useUserStore:
 * - on connect: writes the public key (base58) to walletAddress
 * - on disconnect: clears walletAddress and role (forcing user back to /start)
 */
export function useWalletAuth() {
  const { publicKey, connected, connecting, disconnect } = useWallet()
  const setWalletAddress = useUserStore((s) => s.setWalletAddress)
  const clearRole = useUserStore((s) => s.clearRole)
  const walletAddress = useUserStore((s) => s.walletAddress)

  useEffect(() => {
    const next = connected && publicKey ? publicKey.toBase58() : null
    if (next !== walletAddress) {
      setWalletAddress(next)
      if (next === null) {
        clearRole()
      }
    }
  }, [connected, publicKey, walletAddress, setWalletAddress, clearRole])

  return {
    walletAddress,
    connected,
    connecting,
    disconnect,
  }
}
