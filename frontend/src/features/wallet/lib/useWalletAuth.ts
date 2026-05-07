import { useEffect, useRef } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import bs58 from 'bs58'
import { useUserStore } from '@/entities/user'

/**
 * Bridges Solana wallet adapter -> useUserStore:
 * - on connect: writes the public key (base58) to walletAddress
 * - on disconnect: clears walletAddress and role (forcing user back to /start)
 */
export function useWalletAuth() {
  const { publicKey, connected, connecting, disconnect, signMessage } = useWallet()
  const setWalletAddress = useUserStore((s) => s.setWalletAddress)
  const setAuthToken = useUserStore((s) => s.setAuthToken)
  const clearAuth = useUserStore((s) => s.clearAuth)
  const clearRole = useUserStore((s) => s.clearRole)
  const authToken = useUserStore((s) => s.authToken)
  const walletAddress = useUserStore((s) => s.walletAddress)
  const authInFlightRef = useRef(false)

  useEffect(() => {
    const next = connected && publicKey ? publicKey.toBase58() : null
    if (next !== walletAddress) {
      setWalletAddress(next)
      if (walletAddress && next && walletAddress !== next) {
        clearAuth()
      }
      if (next === null) {
        clearAuth()
        clearRole()
      }
    }
  }, [connected, publicKey, walletAddress, setWalletAddress, clearAuth, clearRole])

  useEffect(() => {
    const authenticate = async () => {
      if (!connected || !publicKey || !signMessage) return
      if (authToken) return
      if (authInFlightRef.current) return

      authInFlightRef.current = true
      try {
        const apiBaseUrl =
          (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:4000'
        const normalizedBaseUrl = apiBaseUrl.replace(/\/$/, '')
        const currentWallet = publicKey.toBase58()

        const nonceResponse = await fetch(`${normalizedBaseUrl}/auth/nonce`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ walletAddress: currentWallet }),
        })
        if (!nonceResponse.ok) throw new Error(`Nonce request failed (${nonceResponse.status})`)
        const noncePayload = (await nonceResponse.json()) as { message: string }

        const signed = await signMessage(new TextEncoder().encode(noncePayload.message))
        const signature = bs58.encode(signed)

        const verifyResponse = await fetch(`${normalizedBaseUrl}/auth/verify`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ walletAddress: currentWallet, signature }),
        })
        if (!verifyResponse.ok) throw new Error(`Verify request failed (${verifyResponse.status})`)
        const verifyPayload = (await verifyResponse.json()) as { token: string }

        setAuthToken(verifyPayload.token)
      } catch (error) {
        console.error('Wallet SIWS auth failed', error)
      } finally {
        authInFlightRef.current = false
      }
    }

    authenticate().catch((error) => console.error('Wallet auth flow crashed', error))
  }, [connected, publicKey, signMessage, authToken, setAuthToken])

  return {
    walletAddress,
    authToken,
    connected,
    connecting,
    disconnect,
  }
}
