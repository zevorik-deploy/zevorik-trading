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
  _hydrated: boolean
  login: (user: User, token: string) => void
  logout: () => void
  updateBalance: (balance: number) => void
  updateUser: (data: Partial<User>) => void
  refreshUser: () => Promise<void>
  setAdminViewingUserMode: (v: boolean) => void
  setPendingLogin: (userId: string, tempToken: string) => void
  clearPendingLogin: () => void
  hydrate: () => void
}

const PERSIST_KEY = 'zv-auth-storage'

const loadPersistedState = () => {
  if (typeof window === 'undefined') return null
  try {
    const saved = localStorage.getItem(PERSIST_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.state?.isLoggedIn && parsed.state?.user && parsed.state?.token) {
        return parsed.state
      }
    }
  } catch {
    // Clear corrupt data
    try { localStorage.removeItem(PERSIST_KEY) } catch {}
  }
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

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoggedIn: false,
  adminViewingUserMode: false,
  pendingUserId: null,
  tempToken: null,
  _hydrated: false,

  // Hydrate from localStorage after mount (prevents SSR mismatch)
  hydrate: () => {
    const persisted = loadPersistedState()
    if (persisted) {
      set({
        user: persisted.user,
        token: persisted.token,
        isLoggedIn: persisted.isLoggedIn,
        _hydrated: true,
      })
    } else {
      set({ _hydrated: true })
    }
  },

  login: (user, token) => {
    const newState = { user, token, isLoggedIn: true, pendingUserId: null, tempToken: null, _hydrated: true }
    set(newState)
    persistState(newState as AuthState)
  },
  logout: () => {
    const newState = { user: null, token: null, isLoggedIn: false, adminViewingUserMode: false, pendingUserId: null, tempToken: null, _hydrated: true }
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
  refreshUser: async () => {
    const user = get().user
    if (!user) return
    try {
      const res = await fetch(`/api/profile?userId=${user.id}`)
      const data = await res.json()
      if (data.user) {
        const newState = { user: { ...user, ...data.user } }
        set(newState)
        persistState({ ...get(), ...newState } as AuthState)
      }
    } catch {}
  },
  setAdminViewingUserMode: (v) => set({ adminViewingUserMode: v }),
  setPendingLogin: (userId, tempToken) => set({ pendingUserId: userId, tempToken }),
  clearPendingLogin: () => set({ pendingUserId: null, tempToken: null }),
}))
