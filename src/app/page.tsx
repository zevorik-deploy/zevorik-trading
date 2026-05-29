'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/lib/store'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, TrendingDown, Eye, EyeOff, ArrowRight,
  Wallet, BarChart3, Briefcase, History, LogOut, RefreshCw,
  ChevronUp, ChevronDown, X, Minus, Search, Bell, Star,
  ArrowUpRight, ArrowDownRight, Menu, Home, User, Settings
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts'

// ============================================
// UTILITY FUNCTIONS
// ============================================
function formatRupiah(num: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num)
}

function formatPercent(num: number): string {
  const sign = num >= 0 ? '+' : ''
  return `${sign}${num.toFixed(2)}%`
}

function formatMarketCap(num: number): string {
  if (num >= 1e12) return `${(num / 1e12).toFixed(1)}T`
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`
  return formatNumber(num)
}

// ============================================
// TYPES
// ============================================
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

interface PortfolioItem {
  id: string
  userId: string
  stockId: string
  shares: number
  avgPrice: number
  stock: Stock
  currentValue: number
  investedValue: number
  profitLoss: number
  profitLossPercent: number
}

interface Transaction {
  id: string
  userId: string
  stockId: string
  type: string
  shares: number
  price: number
  total: number
  status: string
  createdAt: string
  stock: Stock
}

interface PriceHistory {
  id: string
  stockCode: string
  price: number
  timestamp: string
}

// ============================================
// LOGIN PAGE COMPONENT
// ============================================
function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)

  const marketTickers = [
    { code: 'BBCA', change: '+2.81%', up: true },
    { code: 'BBRI', change: '-0.43%', up: false },
    { code: 'TLKM', change: '+1.02%', up: true },
    { code: 'GOLD', change: '+3.21%', up: true },
    { code: 'IHSG', change: '+1.09%', up: true },
    { code: 'OIL', change: '-0.18%', up: false },
    { code: 'BMRI', change: '+1.63%', up: true },
    { code: 'GOTO', change: '+2.78%', up: true },
    { code: 'ASII', change: '-0.93%', up: false },
    { code: 'ICBP', change: '+1.34%', up: true },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone || !password) {
      toast({ title: 'Error', description: 'Mohon isi semua field', variant: 'destructive' })
      return
    }
    if (!isLogin && !name) {
      toast({ title: 'Error', description: 'Mohon isi nama', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      if (isLogin) {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, password }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        login(data.user, data.token)
        toast({ title: 'Selamat Datang!', description: `Halo, ${data.user.name}` })
      } else {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, password }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        login(data.user, data.token)
        toast({ title: 'Registrasi Berhasil!', description: 'Akun Anda telah dibuat' })
      }
    } catch (err: unknown) {
      toast({
        title: 'Gagal',
        description: err instanceof Error ? err.message : 'Terjadi kesalahan',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col"
      style={{
        background: 'radial-gradient(circle at 8% 0%, rgba(16,147,70,.16), transparent 30%), radial-gradient(circle at 92% 8%, rgba(212,163,49,.17), transparent 28%), linear-gradient(180deg, #ffffff 0%, #f4fff7 58%, #fff8e8 100%)',
      }}
    >
      <div className="w-full max-w-[430px] mx-auto px-3 py-4 flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-white p-1 border border-gs-line shadow-sm flex-shrink-0">
              <img src="/logo.svg" alt="Global Saham" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <b className="block text-[12.5px] leading-tight font-black text-gs-green3 tracking-wide truncate">GLOBAL SAHAM</b>
              <span className="block mt-0.5 text-[8px] font-bold text-gs-green uppercase tracking-wider">GS Capital Access</span>
            </div>
          </div>
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="h-9 px-3.5 rounded-xl bg-white border border-gs-line shadow-sm text-[9px] font-black text-gs-green3 whitespace-nowrap hover:bg-gs-soft transition-colors"
          >
            {isLogin ? 'Daftar' : 'Masuk'}
          </button>
        </header>

        {/* Login Card */}
        <div className="rounded-3xl bg-white border border-gs-line shadow-lg overflow-hidden flex-1 flex flex-col">
          {/* Hero Section */}
          <div className="relative overflow-hidden p-4 text-white"
            style={{
              background: 'radial-gradient(circle at top right, rgba(255,230,168,.22), transparent 28%), linear-gradient(145deg, #042d1a 0%, #08713a 54%, #17b85c 100%)',
            }}
          >
            {/* Grid overlay */}
            <div className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: 'linear-gradient(to right, rgba(255,255,255,.055) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.045) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }}
            />

            {/* Market Ticker */}
            <div className="relative flex items-center gap-2 mb-3">
              <div className="h-7 px-2.5 rounded-full flex items-center gap-1.5 bg-white/12 border border-white/15">
                <TrendingUp className="w-3.5 h-3.5 text-yellow-200" />
                <span className="text-[8px] font-bold text-yellow-200">GS LIVE</span>
              </div>
              <div className="flex-1 overflow-hidden h-7 rounded-full bg-white/12 border border-white/15">
                <div className="flex items-center gap-4 whitespace-nowrap animate-ticker px-2">
                  {[...marketTickers, ...marketTickers].map((item, i) => (
                    <span key={i} className={`flex items-center gap-1.5 text-[8px] font-bold ${item.up ? 'text-green-300' : 'text-red-300'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${item.up ? 'bg-green-400 shadow-[0_0_8px_#94ffc7]' : 'bg-red-400 shadow-[0_0_8px_#ffb1b1]'}`} />
                      {item.code} {item.change}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Logo & Title */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 rounded-[22px] bg-white p-2 mb-3 shadow-[0_20px_40px_rgba(0,0,0,.22),0_0_30px_rgba(255,230,168,.18)]">
                <img src="/logo.svg" alt="Global Saham" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-[22px] font-black tracking-tight text-center leading-tight">
                {isLogin ? 'Masuk Investor' : 'Daftar Investor'}<br />Global Saham
              </h1>
              <p className="max-w-[280px] mt-2 text-[10px] text-center font-bold text-green-200 leading-relaxed">
                {isLogin
                  ? 'Akses akun Global Saham untuk memantau portofolio, pergerakan saham, aktivitas profit, dan layanan investor.'
                  : 'Buat akun baru untuk mulai berinvestasi saham dan memantau portofolio Anda secara real-time.'}
              </p>
            </div>

            {/* Stats */}
            <div className="relative z-10 mt-3 grid grid-cols-3 gap-1.5">
              {[
                { icon: <User className="w-5 h-5" />, label: 'Investor', value: '12.8K+' },
                { icon: <TrendingUp className="w-5 h-5" />, label: 'Profit Rate', value: '24.5%' },
                { icon: <Wallet className="w-5 h-5" />, label: 'AUM', value: 'Rp 8.2T' },
              ].map((stat, i) => (
                <div key={i} className="rounded-2xl p-2 bg-white/12 border border-white/15 text-center">
                  <div className="text-yellow-200 flex justify-center mb-1">{stat.icon}</div>
                  <b className="block text-[8px] font-black text-white">{stat.value}</b>
                  <span className="block mt-0.5 text-[6.5px] font-bold text-green-200">{stat.label}</span>
                </div>
              ))}
            </div>

            {/* Mini Chart SVG */}
            <div className="relative z-10 mt-3 h-14 rounded-xl overflow-hidden bg-white/8 border border-white/12">
              <svg className="w-full h-full" viewBox="0 0 400 60" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#94ffc7" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#94ffc7" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,45 L30,42 L60,38 L90,40 L120,32 L150,28 L180,30 L210,22 L240,18 L270,20 L300,14 L330,10 L360,12 L400,6 L400,60 L0,60Z" fill="url(#chartGrad)" />
                <path d="M0,45 L30,42 L60,38 L90,40 L120,32 L150,28 L180,30 L210,22 L240,18 L270,20 L300,14 L330,10 L360,12 L400,6" fill="none" stroke="#94ffc7" strokeWidth="2" className="animate-chart-draw" />
              </svg>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-200/10 to-transparent animate-shimmer" />
            </div>
          </div>

          {/* Form Area */}
          <div className="p-3.5 flex-1 flex flex-col">
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 flex-1">
              {/* Name field (register only) */}
              {!isLogin && (
                <div className="rounded-[20px] bg-gradient-to-br from-green-50/50 to-white border border-gs-line p-2.5 grid grid-cols-[44px_1fr] gap-2.5 items-center">
                  <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-gs-green3 to-gs-green2 grid place-items-center shadow-[0_8px_18px_rgba(16,147,70,.18)]">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <label className="block mb-1 text-[8px] font-black text-gs-muted uppercase tracking-widest">Nama Lengkap</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Masukkan nama"
                      className="w-full h-7 bg-transparent text-gs-dark text-[13px] font-black outline-none placeholder:text-gray-400"
                    />
                  </div>
                </div>
              )}

              {/* Phone field */}
              <div className="rounded-[20px] bg-gradient-to-br from-green-50/50 to-white border border-gs-line p-2.5 grid grid-cols-[44px_1fr] gap-2.5 items-center">
                <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-gs-green3 to-gs-green2 grid place-items-center shadow-[0_8px_18px_rgba(16,147,70,.18)]">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
                  </svg>
                </div>
                <div>
                  <label className="block mb-1 text-[8px] font-black text-gs-muted uppercase tracking-widest">Nomor HP</label>
                  <div className="relative">
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gs-green font-mono">+62</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="81234567890"
                      className="w-full h-7 bg-transparent text-gs-dark text-[13px] font-black outline-none pl-8 placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </div>

              {/* Password field */}
              <div className="rounded-[20px] bg-gradient-to-br from-green-50/50 to-white border border-gs-line p-2.5 grid grid-cols-[44px_1fr] gap-2.5 items-center">
                <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-orange-50 to-amber-100 border border-amber-200/30 grid place-items-center">
                  <svg className="w-5 h-5 text-amber-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <div>
                  <label className="block mb-1 text-[8px] font-black text-gs-muted uppercase tracking-widest">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan password"
                      className="w-full h-7 bg-transparent text-gs-dark text-[13px] font-black outline-none pr-16 placeholder:text-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 h-7 px-2.5 rounded-lg bg-orange-50 border border-amber-200/30 text-gs-green3 text-[8px] font-black hover:bg-amber-100 transition-colors"
                    >
                      {showPassword ? 'Sembunyikan' : 'Lihat'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Remember / Forgot */}
              {isLogin && (
                <div className="flex items-center justify-between gap-2 px-0.5 text-[9px] font-bold text-gs-muted">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" className="w-3.5 h-3.5 accent-gs-green" defaultChecked />
                    Ingat saya
                  </label>
                  <span className="text-amber-700 font-black cursor-pointer hover:underline">Lupa Password?</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-[20px] overflow-hidden relative text-white text-[11px] font-black tracking-widest uppercase bg-gradient-to-r from-gs-green3 via-gs-green2 to-gs-gold shadow-[0_16px_30px_rgba(16,147,70,.20)] flex items-center justify-center gap-2 hover:scale-[1.01] transition-transform disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                <span className="relative z-10 flex items-center gap-2">
                  {loading ? (
                    <div className="w-5 h-5 rounded-full border-[3px] border-white/30 border-t-white animate-spin" />
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4" />
                      {isLogin ? 'Masuk Sekarang' : 'Daftar Sekarang'}
                    </>
                  )}
                </span>
              </button>

              {/* Switch Login/Register */}
              <p className="text-center text-[9.5px] font-bold text-gs-muted leading-relaxed">
                {isLogin ? (
                  <>Belum punya akun? <span className="text-gs-green font-black cursor-pointer hover:underline" onClick={() => setIsLogin(false)}>Daftar di sini</span></>
                ) : (
                  <>Sudah punya akun? <span className="text-gs-green font-black cursor-pointer hover:underline" onClick={() => setIsLogin(true)}>Masuk di sini</span></>
                )}
              </p>

              {/* Demo info */}
              <div className="rounded-[18px] p-2.5 bg-gs-soft border border-gs-line flex items-center justify-between gap-2">
                <div>
                  <b className="block text-[10px] font-black text-gs-green3">Akun Demo</b>
                  <span className="block mt-0.5 text-[8px] font-bold text-gs-muted">+62 81234567890 / demo123</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setPhone('081234567890'); setPassword('demo123'); setIsLogin(true); }}
                  className="text-[8px] font-black text-gs-green bg-white border border-gs-line px-2.5 py-1.5 rounded-lg hover:bg-gs-soft transition-colors"
                >
                  Gunakan
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer Tags */}
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {['OJK Licensed', 'IDX Partner', 'AES-256'].map((tag, i) => (
            <div key={i} className="rounded-full py-2 text-center bg-white border border-gs-line shadow-sm text-[7.5px] font-black text-gs-green3">
              {tag}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================
// DASHBOARD COMPONENT
// ============================================
function Dashboard() {
  const { user, logout, updateBalance } = useAuthStore()
  const [stocks, setStocks] = useState<Stock[]>([])
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])
  const [portfolioSummary, setPortfolioSummary] = useState({
    totalInvested: 0, totalCurrentValue: 0, totalProfitLoss: 0,
    totalProfitLossPercent: 0, cashBalance: 0, totalAssets: 0,
  })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [activeTab, setActiveTab] = useState<'home' | 'portfolio' | 'trade' | 'history'>('home')
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null)
  const [tradeModal, setTradeModal] = useState<'buy' | 'sell' | null>(null)
  const [tradeShares, setTradeShares] = useState('')
  const [tradeLoading, setTradeLoading] = useState(false)
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [stockFilter, setStockFilter] = useState('all')
  const [refreshing, setRefreshing] = useState(false)

  const fetchStocks = useCallback(async () => {
    try {
      const res = await fetch('/api/stocks')
      const data = await res.json()
      if (data.stocks) setStocks(data.stocks)
    } catch (err) {
      console.error('Failed to fetch stocks:', err)
    }
  }, [])

  const fetchPortfolio = useCallback(async () => {
    if (!user) return
    try {
      const res = await fetch(`/api/portfolio?userId=${user.id}`)
      const data = await res.json()
      if (data.portfolio) {
        setPortfolio(data.portfolio)
        setPortfolioSummary(data.summary)
        updateBalance(data.summary.cashBalance)
      }
    } catch (err) {
      console.error('Failed to fetch portfolio:', err)
    }
  }, [user, updateBalance])

  const fetchTransactions = useCallback(async () => {
    if (!user) return
    try {
      const res = await fetch(`/api/transactions?userId=${user.id}`)
      const data = await res.json()
      if (data.transactions) setTransactions(data.transactions)
    } catch (err) {
      console.error('Failed to fetch transactions:', err)
    }
  }, [user])

  const fetchPriceHistory = useCallback(async (stockId: string) => {
    try {
      const res = await fetch(`/api/stocks/${stockId}`)
      const data = await res.json()
      if (data.priceHistory) setPriceHistory(data.priceHistory)
    } catch (err) {
      console.error('Failed to fetch price history:', err)
    }
  }, [])

  const refreshPrices = useCallback(async () => {
    setRefreshing(true)
    try {
      await fetch('/api/stocks/update-prices', { method: 'POST' })
      await fetchStocks()
      await fetchPortfolio()
    } catch (err) {
      console.error('Failed to refresh prices:', err)
    } finally {
      setRefreshing(false)
    }
  }, [fetchStocks, fetchPortfolio])

  useEffect(() => {
    fetchStocks()
    fetchPortfolio()
    fetchTransactions()
  }, [fetchStocks, fetchPortfolio, fetchTransactions])

  // Auto refresh prices every 30 seconds
  useEffect(() => {
    const interval = setInterval(refreshPrices, 30000)
    return () => clearInterval(interval)
  }, [refreshPrices])

  const handleTrade = async () => {
    if (!user || !selectedStock || !tradeModal || !tradeShares) return
    const shares = parseInt(tradeShares)
    if (shares <= 0) return

    setTradeLoading(true)
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          stockId: selectedStock.id,
          type: tradeModal === 'buy' ? 'BUY' : 'SELL',
          shares,
          price: selectedStock.price,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast({
        title: 'Transaksi Berhasil!',
        description: `${tradeModal === 'buy' ? 'Beli' : 'Jual'} ${shares} lot ${selectedStock.code}`,
      })
      setTradeModal(null)
      setTradeShares('')
      fetchPortfolio()
      fetchTransactions()
      fetchStocks()
    } catch (err: unknown) {
      toast({
        title: 'Transaksi Gagal',
        description: err instanceof Error ? err.message : 'Terjadi kesalahan',
        variant: 'destructive',
      })
    } finally {
      setTradeLoading(false)
    }
  }

  const openTradeModal = (stock: Stock, type: 'buy' | 'sell') => {
    setSelectedStock(stock)
    setTradeModal(type)
    setTradeShares('')
    fetchPriceHistory(stock.id)
  }

  const filteredStocks = stocks.filter((s) => {
    const matchesSearch = s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = stockFilter === 'all' || s.category === stockFilter
    return matchesSearch && matchesFilter
  })

  const categories = [
    { key: 'all', label: 'Semua' },
    { key: 'bluechip', label: 'Blue Chip' },
    { key: 'tech', label: 'Teknologi' },
    { key: 'banking', label: 'Perbankan' },
    { key: 'energy', label: 'Energi' },
    { key: 'consumer', label: 'Konsumer' },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white via-green-50/30 to-amber-50/20">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gs-line">
        <div className="max-w-[430px] mx-auto px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white p-0.5 border border-gs-line shadow-sm">
              <img src="/logo.svg" alt="GS" className="w-full h-full object-contain" />
            </div>
            <div>
              <b className="block text-[11px] font-black text-gs-green3 leading-tight">GLOBAL SAHAM</b>
              <span className="block text-[7px] font-bold text-gs-muted">Dashboard Investor</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={refreshPrices} className="w-8 h-8 rounded-xl bg-gs-soft border border-gs-line grid place-items-center hover:bg-green-100 transition-colors" title="Refresh">
              <RefreshCw className={`w-3.5 h-3.5 text-gs-green3 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button className="w-8 h-8 rounded-xl bg-gs-soft border border-gs-line grid place-items-center hover:bg-green-100 transition-colors relative">
              <Bell className="w-3.5 h-3.5 text-gs-green3" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-gs-red border-2 border-white" />
            </button>
            <button onClick={logout} className="w-8 h-8 rounded-xl bg-red-50 border border-red-100 grid place-items-center hover:bg-red-100 transition-colors" title="Keluar">
              <LogOut className="w-3.5 h-3.5 text-red-500" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[430px] mx-auto w-full px-3 py-3 pb-24">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              {/* Welcome & Balance Card */}
              <div className="rounded-3xl overflow-hidden mb-4"
                style={{
                  background: 'radial-gradient(circle at top right, rgba(255,230,168,.22), transparent 28%), linear-gradient(145deg, #042d1a 0%, #08713a 54%, #17b85c 100%)',
                }}
              >
                <div className="p-4 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-[9px] font-bold text-green-200">Selamat datang,</span>
                      <b className="block text-sm font-black">{user?.name}</b>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/15 border border-white/20 grid place-items-center">
                      <User className="w-5 h-5 text-yellow-200" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-2xl p-3 bg-white/10 border border-white/15">
                      <span className="text-[7.5px] font-bold text-green-200">Total Aset</span>
                      <b className="block text-[13px] font-black mt-0.5">{formatRupiah(portfolioSummary.totalAssets)}</b>
                    </div>
                    <div className="rounded-2xl p-3 bg-white/10 border border-white/15">
                      <span className="text-[7.5px] font-bold text-green-200">Saldo Kas</span>
                      <b className="block text-[13px] font-black mt-0.5">{formatRupiah(portfolioSummary.cashBalance)}</b>
                    </div>
                    <div className="rounded-2xl p-3 bg-white/10 border border-white/15">
                      <span className="text-[7.5px] font-bold text-green-200">Nilai Portofolio</span>
                      <b className="block text-[13px] font-black mt-0.5">{formatRupiah(portfolioSummary.totalCurrentValue)}</b>
                    </div>
                    <div className="rounded-2xl p-3 bg-white/10 border border-white/15">
                      <span className="text-[7.5px] font-bold text-green-200">Profit / Loss</span>
                      <b className={`block text-[13px] font-black mt-0.5 ${portfolioSummary.totalProfitLoss >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                        {formatRupiah(portfolioSummary.totalProfitLoss)}
                      </b>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { icon: <BarChart3 className="w-5 h-5" />, label: 'Saham', tab: 'trade' as const, color: 'bg-green-50 text-gs-green' },
                  { icon: <Briefcase className="w-5 h-5" />, label: 'Portofolio', tab: 'portfolio' as const, color: 'bg-amber-50 text-amber-700' },
                  { icon: <History className="w-5 h-5" />, label: 'Riwayat', tab: 'history' as const, color: 'bg-blue-50 text-blue-600' },
                  { icon: <TrendingUp className="w-5 h-5" />, label: 'Top Gainer', tab: 'trade' as const, color: 'bg-emerald-50 text-emerald-600' },
                ].map((action, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTab(action.tab)}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-white border border-gs-line shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className={`w-10 h-10 rounded-xl ${action.color} grid place-items-center`}>
                      {action.icon}
                    </div>
                    <span className="text-[8px] font-black text-gs-green3">{action.label}</span>
                  </button>
                ))}
              </div>

              {/* Market Overview */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-black text-gs-green3">Pergerakan Pasar</h3>
                  <button onClick={() => setActiveTab('trade')} className="text-[8px] font-black text-gs-green hover:underline">Lihat Semua</button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 custom-scrollbar">
                  {stocks.slice(0, 8).map((stock) => (
                    <button
                      key={stock.id}
                      onClick={() => { setSelectedStock(stock); fetchPriceHistory(stock.id) }}
                      className="flex-shrink-0 w-[130px] rounded-2xl p-3 bg-white border border-gs-line shadow-sm hover:shadow-md transition-shadow text-left"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-black text-gs-green3">{stock.code}</span>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${
                          stock.changePercent >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                        }`}>
                          {formatPercent(stock.changePercent)}
                        </span>
                      </div>
                      <span className="block text-[10px] font-black text-gs-text">{formatRupiah(stock.price)}</span>
                      <div className="mt-1.5 h-6">
                        <MiniChart data={priceHistory.filter(h => h.stockCode === stock.code)} positive={stock.changePercent >= 0} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Portfolio Summary on Home */}
              {portfolio.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-black text-gs-green3">Portofolio Anda</h3>
                    <button onClick={() => setActiveTab('portfolio')} className="text-[8px] font-black text-gs-green hover:underline">Selengkapnya</button>
                  </div>
                  <div className="space-y-2">
                    {portfolio.slice(0, 3).map((item) => (
                      <div key={item.id} className="rounded-2xl p-3 bg-white border border-gs-line shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-xl grid place-items-center text-white text-[9px] font-black ${
                            item.profitLoss >= 0 ? 'bg-gradient-to-br from-gs-green3 to-gs-green2' : 'bg-gradient-to-br from-red-700 to-red-400'
                          }`}>
                            {item.stock.code.slice(0, 2)}
                          </div>
                          <div>
                            <b className="block text-[11px] font-black text-gs-green3">{item.stock.code}</b>
                            <span className="block text-[8px] font-bold text-gs-muted">{item.shares} lot</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <b className="block text-[11px] font-black text-gs-text">{formatRupiah(item.currentValue)}</b>
                          <span className={`block text-[8px] font-black ${item.profitLoss >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {formatRupiah(item.profitLoss)} ({formatPercent(item.profitLossPercent)})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Transactions */}
              {transactions.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-black text-gs-green3">Transaksi Terakhir</h3>
                    <button onClick={() => setActiveTab('history')} className="text-[8px] font-black text-gs-green hover:underline">Selengkapnya</button>
                  </div>
                  <div className="space-y-2">
                    {transactions.slice(0, 3).map((tx) => (
                      <div key={tx.id} className="rounded-2xl p-3 bg-white border border-gs-line shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-xl grid place-items-center ${
                            tx.type === 'BUY' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                          }`}>
                            {tx.type === 'BUY' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                          </div>
                          <div>
                            <b className="block text-[11px] font-black text-gs-green3">
                              {tx.type === 'BUY' ? 'Beli' : 'Jual'} {tx.stock.code}
                            </b>
                            <span className="block text-[8px] font-bold text-gs-muted">
                              {tx.shares} lot @ {formatRupiah(tx.price)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <b className="block text-[11px] font-black text-gs-text">{formatRupiah(tx.total)}</b>
                          <span className="block text-[7px] font-bold text-gs-muted">
                            {new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'trade' && (
            <motion.div key="trade" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-black text-gs-green3">Pasar Saham</h2>
                <button onClick={refreshPrices} className="flex items-center gap-1 text-[8px] font-black text-gs-green bg-gs-soft px-2.5 py-1.5 rounded-lg border border-gs-line">
                  <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
                </button>
              </div>

              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gs-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari saham..."
                  className="w-full h-10 pl-9 pr-4 rounded-xl bg-white border border-gs-line text-[12px] font-bold text-gs-text outline-none focus:border-gs-green transition-colors placeholder:text-gs-muted"
                />
              </div>

              {/* Category Filter */}
              <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 custom-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setStockFilter(cat.key)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[8px] font-black transition-colors ${
                      stockFilter === cat.key
                        ? 'bg-gs-green3 text-white shadow-sm'
                        : 'bg-white text-gs-muted border border-gs-line hover:bg-gs-soft'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Stock List */}
              <div className="space-y-2">
                {filteredStocks.map((stock) => (
                  <div key={stock.id} className="rounded-2xl p-3 bg-white border border-gs-line shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-xl grid place-items-center text-white text-[10px] font-black ${
                          stock.changePercent >= 0
                            ? 'bg-gradient-to-br from-gs-green3 to-gs-green2'
                            : 'bg-gradient-to-br from-red-700 to-red-400'
                        }`}>
                          {stock.code.slice(0, 2)}
                        </div>
                        <div>
                          <b className="block text-[12px] font-black text-gs-green3">{stock.code}</b>
                          <span className="block text-[8px] font-bold text-gs-muted max-w-[120px] truncate">{stock.name}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <b className="block text-[12px] font-black text-gs-text tabular-nums">{formatRupiah(stock.price)}</b>
                        <div className="flex items-center gap-1 justify-end">
                          {stock.changePercent >= 0 ? (
                            <ChevronUp className="w-3 h-3 text-green-600" />
                          ) : (
                            <ChevronDown className="w-3 h-3 text-red-500" />
                          )}
                          <span className={`text-[9px] font-black tabular-nums ${stock.changePercent >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {formatPercent(stock.changePercent)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stock Detail Row */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gs-line">
                      <div className="flex gap-3">
                        <span className="text-[7.5px] text-gs-muted">
                          <b className="font-black text-gs-text">Vol:</b> {formatMarketCap(stock.volume)}
                        </span>
                        <span className="text-[7.5px] text-gs-muted">
                          <b className="font-black text-gs-text">MCap:</b> {formatMarketCap(stock.marketCap)}
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => openTradeModal(stock, 'buy')}
                          className="h-7 px-3 rounded-lg bg-gradient-to-r from-gs-green3 to-gs-green2 text-white text-[8px] font-black hover:shadow-md transition-shadow"
                        >
                          BELI
                        </button>
                        <button
                          onClick={() => openTradeModal(stock, 'sell')}
                          className="h-7 px-3 rounded-lg bg-gradient-to-r from-red-600 to-red-400 text-white text-[8px] font-black hover:shadow-md transition-shadow"
                        >
                          JUAL
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredStocks.length === 0 && (
                <div className="text-center py-10">
                  <Search className="w-10 h-10 text-gs-muted mx-auto mb-2" />
                  <p className="text-sm font-bold text-gs-muted">Saham tidak ditemukan</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'portfolio' && (
            <motion.div key="portfolio" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <h2 className="text-base font-black text-gs-green3 mb-3">Portofolio Saya</h2>

              {/* Portfolio Summary */}
              <div className="rounded-3xl overflow-hidden mb-4"
                style={{
                  background: 'radial-gradient(circle at top right, rgba(255,230,168,.22), transparent 28%), linear-gradient(145deg, #042d1a 0%, #08713a 54%, #17b85c 100%)',
                }}
              >
                <div className="p-4 text-white">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-2xl p-3 bg-white/10 border border-white/15">
                      <span className="text-[7.5px] font-bold text-green-200">Nilai Investasi</span>
                      <b className="block text-[12px] font-black mt-0.5">{formatRupiah(portfolioSummary.totalCurrentValue)}</b>
                    </div>
                    <div className="rounded-2xl p-3 bg-white/10 border border-white/15">
                      <span className="text-[7.5px] font-bold text-green-200">Modal Investasi</span>
                      <b className="block text-[12px] font-black mt-0.5">{formatRupiah(portfolioSummary.totalInvested)}</b>
                    </div>
                    <div className="rounded-2xl p-3 bg-white/10 border border-white/15">
                      <span className="text-[7.5px] font-bold text-green-200">Profit / Loss</span>
                      <b className={`block text-[12px] font-black mt-0.5 ${portfolioSummary.totalProfitLoss >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                        {formatRupiah(portfolioSummary.totalProfitLoss)}
                      </b>
                    </div>
                    <div className="rounded-2xl p-3 bg-white/10 border border-white/15">
                      <span className="text-[7.5px] font-bold text-green-200">Return</span>
                      <b className={`block text-[12px] font-black mt-0.5 ${portfolioSummary.totalProfitLossPercent >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                        {formatPercent(portfolioSummary.totalProfitLossPercent)}
                      </b>
                    </div>
                  </div>
                </div>
              </div>

              {/* Portfolio Items */}
              {portfolio.length === 0 ? (
                <div className="text-center py-10">
                  <Briefcase className="w-10 h-10 text-gs-muted mx-auto mb-2" />
                  <p className="text-sm font-bold text-gs-muted">Belum ada portofolio</p>
                  <p className="text-[10px] text-gs-muted mt-1">Mulai investasi dengan membeli saham</p>
                  <button onClick={() => setActiveTab('trade')} className="mt-3 px-4 py-2 rounded-xl bg-gs-green text-white text-[9px] font-black">
                    Mulai Investasi
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {portfolio.map((item) => (
                    <div key={item.id} className="rounded-2xl p-3 bg-white border border-gs-line shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-10 h-10 rounded-xl grid place-items-center text-white text-[10px] font-black ${
                            item.profitLoss >= 0
                              ? 'bg-gradient-to-br from-gs-green3 to-gs-green2'
                              : 'bg-gradient-to-br from-red-700 to-red-400'
                          }`}>
                            {item.stock.code.slice(0, 2)}
                          </div>
                          <div>
                            <b className="block text-[12px] font-black text-gs-green3">{item.stock.code}</b>
                            <span className="block text-[8px] font-bold text-gs-muted">{item.shares} lot @ {formatRupiah(item.avgPrice)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <b className="block text-[12px] font-black text-gs-text">{formatRupiah(item.currentValue)}</b>
                          <div className="flex items-center gap-1 justify-end">
                            {item.profitLoss >= 0 ? (
                              <ArrowUpRight className="w-3 h-3 text-green-600" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3 text-red-500" />
                            )}
                            <span className={`text-[9px] font-black ${item.profitLoss >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                              {formatRupiah(item.profitLoss)} ({formatPercent(item.profitLossPercent)})
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => openTradeModal(item.stock, 'buy')}
                          className="flex-1 h-8 rounded-lg bg-gradient-to-r from-gs-green3 to-gs-green2 text-white text-[8px] font-black"
                        >
                          TAMBAH
                        </button>
                        <button
                          onClick={() => openTradeModal(item.stock, 'sell')}
                          className="flex-1 h-8 rounded-lg bg-gradient-to-r from-red-600 to-red-400 text-white text-[8px] font-black"
                        >
                          JUAL
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <h2 className="text-base font-black text-gs-green3 mb-3">Riwayat Transaksi</h2>

              {transactions.length === 0 ? (
                <div className="text-center py-10">
                  <History className="w-10 h-10 text-gs-muted mx-auto mb-2" />
                  <p className="text-sm font-bold text-gs-muted">Belum ada transaksi</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="rounded-2xl p-3 bg-white border border-gs-line shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-xl grid place-items-center ${
                          tx.type === 'BUY' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {tx.type === 'BUY' ? (
                            <ArrowDownRight className="w-5 h-5 text-green-600" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                        <div>
                          <b className="block text-[11px] font-black text-gs-green3">
                            {tx.type === 'BUY' ? 'Beli' : 'Jual'} {tx.stock.code}
                          </b>
                          <span className="block text-[8px] font-bold text-gs-muted">
                            {tx.shares} lot × {formatRupiah(tx.price)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <b className={`block text-[11px] font-black ${tx.type === 'BUY' ? 'text-red-500' : 'text-green-600'}`}>
                          {tx.type === 'BUY' ? '-' : '+'}{formatRupiah(tx.total)}
                        </b>
                        <span className="block text-[7px] font-bold text-gs-muted">
                          {new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Trade Modal */}
      <AnimatePresence>
        {tradeModal && selectedStock && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center"
            onClick={() => setTradeModal(null)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-[430px] bg-white rounded-t-3xl p-5"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="w-10 h-1 rounded-full bg-gray-300 mx-auto mb-4" />

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-gs-green3">
                  {tradeModal === 'buy' ? 'Beli' : 'Jual'} {selectedStock.code}
                </h3>
                <button onClick={() => setTradeModal(null)} className="w-8 h-8 rounded-full bg-gray-100 grid place-items-center">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Stock Info */}
              <div className="rounded-2xl p-3 bg-gs-soft border border-gs-line mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <b className="block text-sm font-black text-gs-green3">{selectedStock.name}</b>
                    <span className="text-[9px] font-bold text-gs-muted">{selectedStock.code} · {selectedStock.category.toUpperCase()}</span>
                  </div>
                  <div className="text-right">
                    <b className="block text-base font-black text-gs-text tabular-nums">{formatRupiah(selectedStock.price)}</b>
                    <span className={`text-[9px] font-black ${selectedStock.changePercent >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {formatPercent(selectedStock.changePercent)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Chart */}
              {priceHistory.length > 0 && (
                <div className="h-32 mb-4 rounded-xl overflow-hidden">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={priceHistory.map(h => ({
                      time: new Date(h.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
                      price: h.price,
                    }))}>
                      <defs>
                        <linearGradient id="priceGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor={selectedStock.changePercent >= 0 ? '#17b85c' : '#ef4444'} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={selectedStock.changePercent >= 0 ? '#17b85c' : '#ef4444'} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" tick={{ fontSize: 7, fill: '#738579' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{ fontSize: 10, borderRadius: 12, border: '1px solid #dceee3' }}
                        formatter={(value: number) => [formatRupiah(value), 'Harga']}
                      />
                      <Area type="monotone" dataKey="price" stroke={selectedStock.changePercent >= 0 ? '#17b85c' : '#ef4444'} fill="url(#priceGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Trade Info */}
              <div className="grid grid-cols-2 gap-2 mb-4 text-[9px]">
                <div className="rounded-xl p-2 bg-gs-soft border border-gs-line">
                  <span className="text-gs-muted font-bold">Harga / Lot</span>
                  <b className="block text-gs-text font-black text-[11px]">{formatRupiah(selectedStock.price)}</b>
                </div>
                <div className="rounded-xl p-2 bg-gs-soft border border-gs-line">
                  <span className="text-gs-muted font-bold">{tradeModal === 'buy' ? 'Saldo Tersedia' : 'Saham Dimiliki'}</span>
                  <b className="block text-gs-text font-black text-[11px]">
                    {tradeModal === 'buy'
                      ? formatRupiah(user?.balance || 0)
                      : `${portfolio.find(p => p.stockId === selectedStock.id)?.shares || 0} lot`
                    }
                  </b>
                </div>
              </div>

              {/* Shares Input */}
              <div className="mb-4">
                <label className="block text-[9px] font-black text-gs-muted uppercase tracking-wider mb-1.5">Jumlah Lot</label>
                <input
                  type="number"
                  value={tradeShares}
                  onChange={(e) => setTradeShares(e.target.value)}
                  placeholder="Masukkan jumlah lot"
                  className="w-full h-12 px-4 rounded-xl bg-gs-soft border border-gs-line text-gs-text text-[14px] font-black outline-none focus:border-gs-green transition-colors placeholder:text-gray-400"
                />
              </div>

              {/* Quick Amount Buttons */}
              <div className="flex gap-2 mb-4">
                {[1, 5, 10, 50, 100].map(n => (
                  <button
                    key={n}
                    onClick={() => setTradeShares(String(n))}
                    className="flex-1 h-8 rounded-lg bg-white border border-gs-line text-[9px] font-black text-gs-green3 hover:bg-gs-soft transition-colors"
                  >
                    {n} lot
                  </button>
                ))}
              </div>

              {/* Total */}
              <div className="rounded-xl p-3 bg-gs-soft border border-gs-line mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gs-muted">Total Pembayaran</span>
                  <b className="text-base font-black text-gs-green3 tabular-nums">
                    {formatRupiah((parseInt(tradeShares) || 0) * selectedStock.price)}
                  </b>
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleTrade}
                disabled={tradeLoading || !tradeShares || parseInt(tradeShares) <= 0}
                className={`w-full h-14 rounded-2xl text-white text-[11px] font-black tracking-widest uppercase flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  tradeModal === 'buy'
                    ? 'bg-gradient-to-r from-gs-green3 via-gs-green2 to-gs-gold'
                    : 'bg-gradient-to-r from-red-700 via-red-500 to-orange-400'
                }`}
              >
                {tradeLoading ? (
                  <div className="w-5 h-5 rounded-full border-[3px] border-white/30 border-t-white animate-spin" />
                ) : (
                  <>
                    {tradeModal === 'buy' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    Konfirmasi {tradeModal === 'buy' ? 'Pembelian' : 'Penjualan'}
                  </>
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stock Detail Modal */}
      <AnimatePresence>
        {selectedStock && !tradeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center"
            onClick={() => setSelectedStock(null)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-[430px] bg-white rounded-t-3xl p-5 max-h-[70vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 rounded-full bg-gray-300 mx-auto mb-4" />

              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-black text-gs-green3">{selectedStock.code}</h3>
                  <span className="text-[9px] font-bold text-gs-muted">{selectedStock.name}</span>
                </div>
                <button onClick={() => setSelectedStock(null)} className="w-8 h-8 rounded-full bg-gray-100 grid place-items-center">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <b className="text-2xl font-black text-gs-text tabular-nums">{formatRupiah(selectedStock.price)}</b>
                <span className={`text-sm font-black ${selectedStock.changePercent >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {selectedStock.changePercent >= 0 ? <ChevronUp className="w-4 h-4 inline" /> : <ChevronDown className="w-4 h-4 inline" />}
                  {formatPercent(selectedStock.changePercent)}
                </span>
              </div>

              {/* Chart */}
              {priceHistory.length > 0 && (
                <div className="h-40 mb-4 rounded-xl overflow-hidden bg-gs-soft/50 p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={priceHistory.map(h => ({
                      time: new Date(h.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
                      price: h.price,
                    }))}>
                      <defs>
                        <linearGradient id="detailGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor={selectedStock.changePercent >= 0 ? '#17b85c' : '#ef4444'} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={selectedStock.changePercent >= 0 ? '#17b85c' : '#ef4444'} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" tick={{ fontSize: 7, fill: '#738579' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 7, fill: '#738579' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                      <Tooltip
                        contentStyle={{ fontSize: 10, borderRadius: 12, border: '1px solid #dceee3' }}
                        formatter={(value: number) => [formatRupiah(value), 'Harga']}
                      />
                      <Area type="monotone" dataKey="price" stroke={selectedStock.changePercent >= 0 ? '#17b85c' : '#ef4444'} fill="url(#detailGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { label: 'Tertinggi', value: formatRupiah(selectedStock.high) },
                  { label: 'Terendah', value: formatRupiah(selectedStock.low) },
                  { label: 'Volume', value: formatMarketCap(selectedStock.volume) },
                  { label: 'Kap. Pasar', value: formatMarketCap(selectedStock.marketCap) },
                ].map((stat, i) => (
                  <div key={i} className="rounded-xl p-2.5 bg-gs-soft border border-gs-line">
                    <span className="text-[8px] font-bold text-gs-muted">{stat.label}</span>
                    <b className="block text-[11px] font-black text-gs-text mt-0.5 tabular-nums">{stat.value}</b>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => { setTradeModal('buy') }}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-gs-green3 to-gs-green2 text-white text-[10px] font-black uppercase tracking-wider"
                >
                  Beli
                </button>
                <button
                  onClick={() => { setTradeModal('sell') }}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-red-600 to-red-400 text-white text-[10px] font-black uppercase tracking-wider"
                >
                  Jual
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gs-line z-40">
        <div className="max-w-[430px] mx-auto flex items-center justify-around py-2">
          {[
            { key: 'home' as const, icon: <Home className="w-5 h-5" />, label: 'Beranda' },
            { key: 'trade' as const, icon: <BarChart3 className="w-5 h-5" />, label: 'Saham' },
            { key: 'portfolio' as const, icon: <Briefcase className="w-5 h-5" />, label: 'Portofolio' },
            { key: 'history' as const, icon: <History className="w-5 h-5" />, label: 'Riwayat' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
                activeTab === tab.key
                  ? 'text-gs-green'
                  : 'text-gs-muted hover:text-gs-green3'
              }`}
            >
              {tab.icon}
              <span className="text-[7px] font-black">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

// ============================================
// MINI CHART COMPONENT
// ============================================
function MiniChart({ data, positive }: { data: PriceHistory[]; positive: boolean }) {
  if (data.length === 0) return <div />

  const prices = data.slice(-20).map(d => d.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const range = max - min || 1

  const points = prices.map((p, i) => {
    const x = (i / (prices.length - 1)) * 120
    const y = 20 - ((p - min) / range) * 18
    return `${x},${y}`
  }).join(' ')

  return (
    <svg viewBox="0 0 120 22" className="w-full h-full" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={positive ? '#17b85c' : '#ef4444'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ============================================
// MAIN PAGE
// ============================================
export default function MainPage() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)

  // Seed the database on first load
  useEffect(() => {
    const seedIfEmpty = async () => {
      try {
        const res = await fetch('/api/stocks')
        const data = await res.json()
        if (!data.stocks || data.stocks.length === 0) {
          await fetch('/api/stocks/seed', { method: 'POST' })
        }
      } catch {
        // Silently ignore
      }
    }
    seedIfEmpty()
  }, [])

  return isLoggedIn ? <Dashboard /> : <LoginPage />
}
