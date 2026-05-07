import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserState } from './types'

const DEFAULT_PROFILE = {
  fullName: '',
  email: '',
  companyName: '',
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      walletAddress: null,
      role: null,
      profile: { ...DEFAULT_PROFILE },

      setWalletAddress: (address) => set({ walletAddress: address }),
      setRole: (role) => set({ role }),
      setProfile: (profile) =>
        set((state) => ({
          profile: { ...state.profile, ...profile },
        })),
      clearRole: () => set({ role: null }),
      clear: () =>
        set({
          walletAddress: null,
          role: null,
          profile: { ...DEFAULT_PROFILE },
        }),
    }),
    {
      name: 'split-user-store',
      version: 1,
      partialize: (state) => ({
        walletAddress: state.walletAddress,
        role: state.role,
        profile: state.profile,
      }),
    },
  ),
)
