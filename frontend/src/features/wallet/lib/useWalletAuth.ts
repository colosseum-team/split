import { useEffect, useRef } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import bs58Pkg from 'bs58'
import { useUserStore } from '@/entities/user'
import { api, ApiError, beRoleToFe } from '@/shared/api/client'

// bs58 v6 ships dual ESM/CJS; pick whichever export shape this build resolved to.
const bs58 = (bs58Pkg as unknown as { default?: typeof bs58Pkg }).default ?? bs58Pkg

/**
 * Bridges Solana wallet adapter -> useUserStore + backend SIWS:
 *
 *   1. On wallet connect: writes the public key (base58) to walletAddress.
 *   2. If we don't have a JWT yet for this wallet, run the SIWS round-trip:
 *      `POST /auth/nonce` → `wallet.signMessage` → `POST /auth/verify` → JWT.
 *      The returned `user.role` (if any) is mirrored into the store as the
 *      source of truth, so a returning customer/performer skips role pick.
 *   3. On disconnect: clears walletAddress, role, and the JWT.
 *
 * Failures (user rejects sign, network error, etc.) leave the wallet
 * connected but without a token — UI components can fall back to the
 * mock-only flow and a future "Sign in" button can retry. We don't
 * disconnect automatically: the user might just want to read the SPA.
 */
export function useWalletAuth() {
  const { publicKey, connected, connecting, disconnect, signMessage } = useWallet()
  const walletAddress = useUserStore((s) => s.walletAddress)
  const authToken = useUserStore((s) => s.authToken)
  const setWalletAddress = useUserStore((s) => s.setWalletAddress)
  const setAuthToken = useUserStore((s) => s.setAuthToken)
  const setRole = useUserStore((s) => s.setRole)
  const clearRole = useUserStore((s) => s.clearRole)

  // Avoid kicking off the SIWS round-trip multiple times for the same wallet.
  const signingFor = useRef<string | null>(null)

  useEffect(() => {
    const next = connected && publicKey ? publicKey.toBase58() : null
    if (next !== walletAddress) {
      setWalletAddress(next)
      if (next === null) {
        clearRole()
        setAuthToken(null)
        signingFor.current = null
      }
    }
  }, [connected, publicKey, walletAddress, setWalletAddress, clearRole, setAuthToken])

  useEffect(() => {
    if (!connected || !publicKey || !signMessage) return
    if (authToken) return
    const wallet = publicKey.toBase58()
    if (signingFor.current === wallet) return
    signingFor.current = wallet

    let cancelled = false
    void (async () => {
      try {
        const { message } = await api.authNonce(wallet)
        const messageBytes = new TextEncoder().encode(message)
        const sigBytes = await signMessage(messageBytes)
        const signatureBase58 = bs58.encode(sigBytes)
        const { token, user } = await api.authVerify(wallet, signatureBase58)
        if (cancelled) return
        setAuthToken(token)
        const fe = beRoleToFe(user.role)
        if (fe) setRole(fe)
      } catch (err) {
        if (cancelled) return
        // eslint-disable-next-line no-console
        console.warn(
          '[wallet] SIWS sign-in failed:',
          err instanceof ApiError ? `${err.code} ${err.message}` : err,
        )
        // Allow retry on the next connect cycle.
        signingFor.current = null
      }
    })()

    return () => {
      cancelled = true
    }
  }, [connected, publicKey, signMessage, authToken, setAuthToken, setRole])

  // Server-truth hydration: on every (wallet, token) pair, refresh `/me`
  // so a role change made from another device is reflected here. Skipped
  // when there's no token (the SIWS effect above will run first).
  useEffect(() => {
    if (!authToken || !walletAddress) return
    let cancelled = false
    void (async () => {
      try {
        const me = await api.me(authToken)
        if (cancelled) return
        const fe = beRoleToFe(me.role)
        if (fe) setRole(fe)
      } catch (err) {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 401) {
          // Token was rejected — drop it so the SIWS round-trip can run again.
          setAuthToken(null)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [authToken, walletAddress, setRole, setAuthToken])

  return {
    walletAddress,
    connected,
    connecting,
    disconnect,
    authToken,
  }
}
