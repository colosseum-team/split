import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserState } from './types'

const DEFAULT_PROFILE = {
  fullName: '',
  email: '',
  companyName: '',
}
const AUTH_TOKEN_STORAGE_KEY = 'split-auth-token'

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      walletAddress: null,
      authToken: null,
      role: null,
      profile: { ...DEFAULT_PROFILE },

      setWalletAddress: (address) => set({ walletAddress: address }),
      setAuthToken: (token) => {
        if (token) localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token)
        else localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
        set({ authToken: token })
      },
      setRole: (role) => set({ role }),
      setProfile: (profile) =>
        set((state) => ({
          profile: { ...state.profile, ...profile },
        })),
      clearRole: () => set({ role: null }),
      clearAuth: () => {
        localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
        set({ authToken: null })
      },
      clear: () => {
        localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
        set({
          walletAddress: null,
          authToken: null,
          role: null,
          profile: { ...DEFAULT_PROFILE },
        })
      },
    }),
    {
      name: 'split-user-store',
      version: 1,
      partialize: (state) => ({
        walletAddress: state.walletAddress,
        authToken: state.authToken,
        role: state.role,
        profile: state.profile,
      }),
    },
  ),
)
