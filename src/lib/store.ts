import { create } from 'zustand'

interface User {
  id: string
  name: string
  phone: string
  balance: number
  role: string
  avatar: string | null
}

interface AuthState {
  user: User | null
  token: string | null
  isLoggedIn: boolean
  login: (user: User, token: string) => void
  logout: () => void
  updateBalance: (balance: number) => void
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
}))

interface Stock {
  id: string
  code: string
  name: string
  price: number
  change: number
  changePercent: number
  high: number
  low: number
  volume: number
  marketCap: number
  category: string
}

interface StockState {
  stocks: Stock[]
  loading: boolean
  setStocks: (stocks: Stock[]) => void
  setLoading: (loading: boolean) => void
}

export const useStockStore = create<StockState>((set) => ({
  stocks: [],
  loading: false,
  setStocks: (stocks) => set({ stocks }),
  setLoading: (loading) => set({ loading }),
}))
