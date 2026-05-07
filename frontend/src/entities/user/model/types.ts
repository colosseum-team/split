export type UserRole = 'customer' | 'performer'

export interface UserProfile {
  fullName: string
  email: string
  companyName?: string
}

export interface UserState {
  walletAddress: string | null
  role: UserRole | null
  profile: UserProfile

  setWalletAddress: (address: string | null) => void
  setRole: (role: UserRole | null) => void
  setProfile: (profile: Partial<UserProfile>) => void
  clear: () => void
  clearRole: () => void
}
