import { create } from 'zustand'

interface User {
  id: string
  name: string
  phone: string
  email: string
  balance: number
  role: string
  avatar: string | null
  kycStatus?: string
  bankName?: string
  bankAccount?: string
  bankHolder?: string
  totalDeposit?: number
  totalTrading?: number
  emailVerified?: boolean
}

interface AuthState {
  user: User | null
  token: string | null
  isLoggedIn: boolean
  adminViewingUserMode: boolean
  pendingUserId: string | null
  tempToken: string | null
  login: (user: User, token: string) => void
  logout: () => void
  updateBalance: (balance: number) => void
  updateUser: (data: Partial<User>) => void
  setAdminViewingUserMode: (v: boolean) => void
  setPendingLogin: (userId: string, tempToken: string) => void
  clearPendingLogin: () => void
}

const PERSIST_KEY = 'zv-auth-storage'

const loadPersistedState = () => {
  if (typeof window === 'undefined') return null
  try {
    const saved = localStorage.getItem(PERSIST_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.state?.isLoggedIn) return parsed.state
    }
  } catch {}
  return null
}

const persistState = (state: AuthState) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(PERSIST_KEY, JSON.stringify({
      state: {
        user: state.user,
        token: state.token,
        isLoggedIn: state.isLoggedIn,
      },
    }))
  } catch {}
}

const persisted = loadPersistedState()

export const useAuthStore = create<AuthState>((set) => ({
  user: persisted?.user ?? null,
  token: persisted?.token ?? null,
  isLoggedIn: persisted?.isLoggedIn ?? false,
  adminViewingUserMode: false,
  pendingUserId: null,
  tempToken: null,
  login: (user, token) => {
    const newState = { user, token, isLoggedIn: true, pendingUserId: null, tempToken: null }
    set(newState)
    persistState(newState as AuthState)
  },
  logout: () => {
    const newState = { user: null, token: null, isLoggedIn: false, adminViewingUserMode: false, pendingUserId: null, tempToken: null }
    set(newState)
    if (typeof window !== 'undefined') localStorage.removeItem(PERSIST_KEY)
  },
  updateBalance: (balance) =>
    set((state) => {
      const newState = { user: state.user ? { ...state.user, balance } : null }
      persistState({ ...state, ...newState } as AuthState)
      return newState
    }),
  updateUser: (data) =>
    set((state) => {
      const newState = { user: state.user ? { ...state.user, ...data } : null }
      persistState({ ...state, ...newState } as AuthState)
      return newState
    }),
  setAdminViewingUserMode: (v) => set({ adminViewingUserMode: v }),
  setPendingLogin: (userId, tempToken) => set({ pendingUserId: userId, tempToken }),
  clearPendingLogin: () => set({ pendingUserId: null, tempToken: null }),
}))
