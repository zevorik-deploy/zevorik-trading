import { create } from 'zustand'

interface User {
  id: string
  name: string
  phone: string
  email?: string
  balance: number
  role: string
  avatar: string | null
  referralCode?: string
  kycStatus?: string
  bankName?: string
  bankAccount?: string
  bankHolder?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isLoggedIn: boolean
  login: (user: User, token: string) => void
  logout: () => void
  updateBalance: (balance: number) => void
  updateUser: (data: Partial<User>) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoggedIn: false,
  login: (user, token) => set({ user, token, isLoggedIn: true }),
  logout: () => set({ user: null, token: null, isLoggedIn: false }),
  updateBalance: (balance) =>
    set((state) => ({
      user: state.user ? { ...state.user, balance } : null,
    })),
  updateUser: (data) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...data } : null,
    })),
}))
