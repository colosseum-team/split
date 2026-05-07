import type { PropsWithChildren } from 'react'
import { useMemo } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { clusterApiUrl } from '@solana/web3.js'

import '@solana/wallet-adapter-react-ui/styles.css'

interface SolanaProviderProps extends PropsWithChildren {
  /** Cluster name. Devnet by default — sufficient for the MVP. */
  cluster?: 'devnet' | 'testnet' | 'mainnet-beta'
}

/**
 * Lightweight Solana provider:
 * - relies on Wallet Standard auto-discovery (Phantom, Solflare, Backpack, etc.).
 * - does NOT bundle any specific wallet-adapter-* packages.
 */
export function SolanaProvider({ children, cluster = 'devnet' }: SolanaProviderProps) {
  const endpoint = useMemo(() => clusterApiUrl(cluster), [cluster])
  const wallets = useMemo(() => [], [])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
