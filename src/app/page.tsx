'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuthStore } from '@/lib/store'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, TrendingDown, Eye, EyeOff, ArrowRight,
  Wallet, BarChart3, Briefcase, History, LogOut, RefreshCw,
  ChevronUp, ChevronDown, X, Search, Bell, Star,
  ArrowUpRight, ArrowDownRight, Home, User, Copy, Check,
  Plus, Minus, Gift, Newspaper, Shield, CreditCard, Settings,
  Clock, AlertCircle, CheckCircle, Info, ExternalLink, Share2,
  BookOpen, Award, Target, PieChart, Zap, Users, Menu
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell
} from 'recharts'

// ============================================
// UTILITY FUNCTIONS
// ============================================
const formatRupiah = (num: number): string =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num)

const formatNumber = (num: number): string =>
  new Intl.NumberFormat('id-ID').format(num)

const formatPercent = (num: number): string =>
  `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`

const formatMarketCap = (num: number): string => {
  if (num >= 1e12) return `${(num / 1e12).toFixed(1)}T`
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`
  return formatNumber(num)
}

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

const formatDateTime = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

const genRefCode = () => 'GS' + Math.random().toString(36).substring(2, 8).toUpperCase()

// ============================================
// TYPES
// ============================================
interface Stock {
  id: string; code: string; name: string; price: number; change: number;
  changePercent: number; high: number; low: number; open: number;
  volume: number; marketCap: number; category: string; sector?: string;
  description?: string; peRatio?: number; pbv?: number; dividendYield?: number; lotSize?: number;
}

interface PortfolioItem {
  id: string; userId: string; stockId: string; shares: number; avgPrice: number;
  stock: Stock; currentValue: number; investedValue: number; profitLoss: number; profitLossPercent: number;
}

interface Transaction {
  id: string; userId: string; stockId: string; type: string; orderType?: string;
  shares: number; price: number; total: number; fee?: number; status: string; createdAt: string;
  stock: Stock;
}

interface PriceHistory { id: string; stockCode: string; price: number; timestamp: string }

interface MarketIndex {
  id: string; code: string; name: string; value: number; change: number; changePercent: number;
}

interface NotificationItem {
  id: string; userId: string; title: string; message: string; type: string; isRead: boolean; createdAt: string;
}

interface NewsItem {
  id: string; title: string; content: string; category: string; imageUrl?: string; createdAt: string;
}

interface DepositItem {
  id: string; userId: string; amount: number; method: string; bankName?: string; status: string; createdAt: string;
}

interface WithdrawalItem {
  id: string; userId: string; amount: number; bankName?: string; bankAccount?: string; bankHolder?: string; status: string; createdAt: string;
}

interface WatchlistItem {
  id: string; userId: string; stockId: string; stock: Stock; createdAt: string;
}

// ============================================
// LOGIN PAGE
// ============================================
function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [refCode, setRefCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)

  const marketTickers = [
    { code: 'BBCA', change: '+2.81%', up: true }, { code: 'BBRI', change: '-0.43%', up: false },
    { code: 'TLKM', change: '+1.02%', up: true }, { code: 'GOLD', change: '+3.21%', up: true },
    { code: 'IHSG', change: '+1.09%', up: true }, { code: 'OIL', change: '-0.18%', up: false },
    { code: 'BMRI', change: '+1.63%', up: true }, { code: 'GOTO', change: '+2.78%', up: true },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone || !password || (!isLogin && !name)) {
      toast({ title: 'Error', description: 'Mohon isi semua field', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const url = isLogin ? '/api/auth/login' : '/api/auth/register'
      const body = isLogin ? { phone, password } : { name, phone, password, referralCode: refCode || undefined }
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      login(data.user, data.token)
      toast({ title: isLogin ? 'Selamat Datang!' : 'Registrasi Berhasil!', description: `Halo, ${data.user.name}` })
    } catch (err: unknown) {
      toast({ title: 'Gagal', description: err instanceof Error ? err.message : 'Terjadi kesalahan', variant: 'destructive' })
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'radial-gradient(circle at 8% 0%, rgba(16,147,70,.16), transparent 30%), radial-gradient(circle at 92% 8%, rgba(212,163,49,.17), transparent 28%), linear-gradient(180deg, #ffffff 0%, #f4fff7 58%, #fff8e8 100%)' }}>
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
          <button onClick={() => setIsLogin(!isLogin)} className="h-9 px-3.5 rounded-xl bg-white border border-gs-line shadow-sm text-[9px] font-black text-gs-green3 whitespace-nowrap hover:bg-gs-soft transition-colors">
            {isLogin ? 'Daftar' : 'Masuk'}
          </button>
        </header>

        <div className="rounded-3xl bg-white border border-gs-line shadow-lg overflow-hidden flex-1 flex flex-col">
          {/* Hero */}
          <div className="relative overflow-hidden p-4 text-white" style={{ background: 'radial-gradient(circle at top right, rgba(255,230,168,.22), transparent 28%), linear-gradient(145deg, #042d1a 0%, #08713a 54%, #17b85c 100%)' }}>
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,.055) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.045) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
            {/* Ticker */}
            <div className="relative flex items-center gap-2 mb-3">
              <div className="h-7 px-2.5 rounded-full flex items-center gap-1.5 bg-white/12 border border-white/15">
                <TrendingUp className="w-3.5 h-3.5 text-yellow-200" /><span className="text-[8px] font-bold text-yellow-200">GS LIVE</span>
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
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 rounded-[22px] bg-white p-2 mb-3 shadow-[0_20px_40px_rgba(0,0,0,.22),0_0_30px_rgba(255,230,168,.18)]">
                <img src="/logo.svg" alt="Global Saham" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-[22px] font-black tracking-tight text-center leading-tight">{isLogin ? 'Masuk Investor' : 'Daftar Investor'}<br />Global Saham</h1>
              <p className="max-w-[280px] mt-2 text-[10px] text-center font-bold text-green-200 leading-relaxed">
                {isLogin ? 'Akses akun untuk memantau portofolio, pergerakan saham, deposit/withdraw, dan layanan investor lengkap.' : 'Buat akun baru untuk mulai investasi saham dengan fitur lengkap dan real-time.'}
              </p>
            </div>
            <div className="relative z-10 mt-3 grid grid-cols-4 gap-1.5">
              {[
                { icon: <Users className="w-4 h-4" />, label: 'Investor', value: '12.8K+' },
                { icon: <TrendingUp className="w-4 h-4" />, label: 'Profit', value: '24.5%' },
                { icon: <Wallet className="w-4 h-4" />, label: 'AUM', value: 'Rp 8.2T' },
                { icon: <Shield className="w-4 h-4" />, label: 'OJK', value: 'Licensed' },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl p-2 bg-white/12 border border-white/15 text-center">
                  <div className="text-yellow-200 flex justify-center mb-1">{s.icon}</div>
                  <b className="block text-[7.5px] font-black text-white">{s.value}</b>
                  <span className="block mt-0.5 text-[6px] font-bold text-green-200">{s.label}</span>
                </div>
              ))}
            </div>
            <div className="relative z-10 mt-3 h-12 rounded-xl overflow-hidden bg-white/8 border border-white/12">
              <svg className="w-full h-full" viewBox="0 0 400 50" preserveAspectRatio="none">
                <defs><linearGradient id="cg" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#94ffc7" stopOpacity="0.3" /><stop offset="100%" stopColor="#94ffc7" stopOpacity="0" /></linearGradient></defs>
                <path d="M0,35 L30,32 L60,30 L90,32 L120,25 L150,22 L180,24 L210,18 L240,15 L270,16 L300,10 L330,8 L360,9 L400,4 L400,50 L0,50Z" fill="url(#cg)" />
                <path d="M0,35 L30,32 L60,30 L90,32 L120,25 L150,22 L180,24 L210,18 L240,15 L270,16 L300,10 L330,8 L360,9 L400,4" fill="none" stroke="#94ffc7" strokeWidth="2" className="animate-chart-draw" />
              </svg>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-200/10 to-transparent animate-shimmer" />
            </div>
          </div>

          {/* Form */}
          <div className="p-3.5 flex-1 flex flex-col overflow-y-auto custom-scrollbar">
            <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 flex-1">
              {!isLogin && (
                <div className="rounded-[20px] bg-gradient-to-br from-green-50/50 to-white border border-gs-line p-2.5 grid grid-cols-[44px_1fr] gap-2.5 items-center">
                  <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-gs-green3 to-gs-green2 grid place-items-center shadow-[0_8px_18px_rgba(16,147,70,.18)]">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <label className="block mb-1 text-[8px] font-black text-gs-muted uppercase tracking-widest">Nama Lengkap</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Masukkan nama" className="w-full h-7 bg-transparent text-gs-dark text-[13px] font-black outline-none placeholder:text-gray-400" />
                  </div>
                </div>
              )}
              <div className="rounded-[20px] bg-gradient-to-br from-green-50/50 to-white border border-gs-line p-2.5 grid grid-cols-[44px_1fr] gap-2.5 items-center">
                <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-gs-green3 to-gs-green2 grid place-items-center shadow-[0_8px_18px_rgba(16,147,70,.18)]">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>
                </div>
                <div>
                  <label className="block mb-1 text-[8px] font-black text-gs-muted uppercase tracking-widest">Nomor HP</label>
                  <div className="relative">
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gs-green font-mono">+62</span>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="81234567890" className="w-full h-7 bg-transparent text-gs-dark text-[13px] font-black outline-none pl-8 placeholder:text-gray-400" />
                  </div>
                </div>
              </div>
              <div className="rounded-[20px] bg-gradient-to-br from-green-50/50 to-white border border-gs-line p-2.5 grid grid-cols-[44px_1fr] gap-2.5 items-center">
                <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-orange-50 to-amber-100 border border-amber-200/30 grid place-items-center">
                  <svg className="w-5 h-5 text-amber-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                </div>
                <div>
                  <label className="block mb-1 text-[8px] font-black text-gs-muted uppercase tracking-widest">Password</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Masukkan password" className="w-full h-7 bg-transparent text-gs-dark text-[13px] font-black outline-none pr-16 placeholder:text-gray-400" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-1/2 -translate-y-1/2 h-7 px-2.5 rounded-lg bg-orange-50 border border-amber-200/30 text-gs-green3 text-[8px] font-black">
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
              {!isLogin && (
                <div className="rounded-[20px] bg-gradient-to-br from-green-50/50 to-white border border-gs-line p-2.5 grid grid-cols-[44px_1fr] gap-2.5 items-center">
                  <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200/30 grid place-items-center">
                    <Gift className="w-5 h-5 text-purple-700" />
                  </div>
                  <div>
                    <label className="block mb-1 text-[8px] font-black text-gs-muted uppercase tracking-widest">Kode Referral (Opsional)</label>
                    <input type="text" value={refCode} onChange={(e) => setRefCode(e.target.value.toUpperCase())} placeholder="Masukkan kode referral" className="w-full h-7 bg-transparent text-gs-dark text-[13px] font-black outline-none placeholder:text-gray-400 uppercase" />
                  </div>
                </div>
              )}
              {isLogin && (
                <div className="flex items-center justify-between gap-2 px-0.5 text-[9px] font-bold text-gs-muted">
                  <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" className="w-3.5 h-3.5 accent-gs-green" defaultChecked />Ingat saya</label>
                  <span className="text-amber-700 font-black cursor-pointer hover:underline">Lupa Password?</span>
                </div>
              )}
              <button type="submit" disabled={loading} className="w-full h-14 rounded-[20px] overflow-hidden relative text-white text-[11px] font-black tracking-widest uppercase bg-gradient-to-r from-gs-green3 via-gs-green2 to-gs-gold shadow-[0_16px_30px_rgba(16,147,70,.20)] flex items-center justify-center gap-2 hover:scale-[1.01] transition-transform disabled:opacity-70">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                <span className="relative z-10 flex items-center gap-2">
                  {loading ? <div className="w-5 h-5 rounded-full border-[3px] border-white/30 border-t-white animate-spin" /> : <>{isLogin ? 'Masuk Sekarang' : 'Daftar Sekarang'}<ArrowRight className="w-4 h-4" /></>}
                </span>
              </button>
              <p className="text-center text-[9.5px] font-bold text-gs-muted">
                {isLogin ? <>Belum punya akun? <span className="text-gs-green font-black cursor-pointer hover:underline" onClick={() => setIsLogin(false)}>Daftar di sini</span></> : <>Sudah punya akun? <span className="text-gs-green font-black cursor-pointer hover:underline" onClick={() => setIsLogin(true)}>Masuk di sini</span></>}
              </p>
              <div className="rounded-[18px] p-2.5 bg-gs-soft border border-gs-line flex items-center justify-between gap-2">
                <div><b className="block text-[10px] font-black text-gs-green3">Akun Demo</b><span className="block mt-0.5 text-[8px] font-bold text-gs-muted">+62 81234567890 / demo123</span></div>
                <button type="button" onClick={() => { setPhone('081234567890'); setPassword('demo123'); setIsLogin(true); }} className="text-[8px] font-black text-gs-green bg-white border border-gs-line px-2.5 py-1.5 rounded-lg">Gunakan</button>
              </div>
            </form>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {['OJK Licensed', 'IDX Partner', 'AES-256'].map((t, i) => <div key={i} className="rounded-full py-2 text-center bg-white border border-gs-line shadow-sm text-[7.5px] font-black text-gs-green3">{t}</div>)}
        </div>
      </div>
    </div>
  )
}

// ============================================
// MAIN DASHBOARD
// ============================================
function Dashboard() {
  const { user, logout, updateBalance, updateUser } = useAuthStore()
  const [stocks, setStocks] = useState<Stock[]>([])
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])
  const [portfolioSummary, setPortfolioSummary] = useState({ totalInvested: 0, totalCurrentValue: 0, totalProfitLoss: 0, totalProfitLossPercent: 0, cashBalance: 0, totalAssets: 0 })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [indices, setIndices] = useState<MarketIndex[]>([])
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [deposits, setDeposits] = useState<DepositItem[]>([])
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([])
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([])

  const [activeTab, setActiveTab] = useState<string>('home')
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null)
  const [showStockDetail, setShowStockDetail] = useState(false)
  const [tradeModal, setTradeModal] = useState<'buy' | 'sell' | null>(null)
  const [tradeShares, setTradeShares] = useState('')
  const [tradePrice, setTradePrice] = useState('')
  const [tradeOrderType, setTradeOrderType] = useState<'market' | 'limit'>('market')
  const [tradeLoading, setTradeLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [stockFilter, setStockFilter] = useState('all')
  const [refreshing, setRefreshing] = useState(false)
  const [showNotifPanel, setShowNotifPanel] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')
  const [depositMethod, setDepositMethod] = useState('bank_transfer')
  const [depositLoading, setDepositLoading] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [profileEdit, setProfileEdit] = useState(false)
  const [profileForm, setProfileForm] = useState({ name: '', email: '', bankName: '', bankAccount: '', bankHolder: '' })
  const [referralInfo, setReferralInfo] = useState({ code: '', totalReferred: 0, totalBonus: 0, referredUsers: [] as { name: string; date: string; bonus: number }[] })
  const [copied, setCopied] = useState(false)
  const [chartPeriod, setChartPeriod] = useState('1M')
  const [txFilter, setTxFilter] = useState('all')
  const [showSideMenu, setShowSideMenu] = useState(false)
  const initialized = useRef(false)

  // ============ FETCH FUNCTIONS ============
  const fetchStocks = useCallback(async () => {
    try { const r = await fetch('/api/stocks'); const d = await r.json(); if (d.stocks) setStocks(d.stocks) } catch {}
  }, [])
  const fetchPortfolio = useCallback(async () => {
    if (!user) return
    try { const r = await fetch(`/api/portfolio?userId=${user.id}`); const d = await r.json(); if (d.portfolio) { setPortfolio(d.portfolio); setPortfolioSummary(d.summary); updateBalance(d.summary.cashBalance) } } catch {}
  }, [user, updateBalance])
  const fetchTransactions = useCallback(async () => {
    if (!user) return
    try { const r = await fetch(`/api/transactions?userId=${user.id}`); const d = await r.json(); if (d.transactions) setTransactions(d.transactions) } catch {}
  }, [user])
  const fetchIndices = useCallback(async () => {
    try { const r = await fetch('/api/market'); const d = await r.json(); if (d.indices) setIndices(d.indices) } catch {}
  }, [])
  const fetchNotifications = useCallback(async () => {
    if (!user) return
    try { const r = await fetch(`/api/notifications?userId=${user.id}`); const d = await r.json(); if (d.notifications) setNotifications(d.notifications) } catch {}
  }, [user])
  const fetchNews = useCallback(async () => {
    try { const r = await fetch('/api/news'); const d = await r.json(); if (d.news) setNews(d.news) } catch {}
  }, [])
  const fetchWatchlist = useCallback(async () => {
    if (!user) return
    try { const r = await fetch(`/api/watchlist?userId=${user.id}`); const d = await r.json(); if (d.watchlist) setWatchlist(d.watchlist) } catch {}
  }, [user])
  const fetchDeposits = useCallback(async () => {
    if (!user) return
    try { const r = await fetch(`/api/deposit?userId=${user.id}`); const d = await r.json(); if (d.deposits) setDeposits(d.deposits) } catch {}
  }, [user])
  const fetchWithdrawals = useCallback(async () => {
    if (!user) return
    try { const r = await fetch(`/api/withdrawal?userId=${user.id}`); const d = await r.json(); if (d.withdrawals) setWithdrawals(d.withdrawals) } catch {}
  }, [user])
  const fetchReferral = useCallback(async () => {
    if (!user) return
    try { const r = await fetch(`/api/referral?userId=${user.id}`); const d = await r.json(); setReferralInfo({ code: d.referralCode || '', totalReferred: d.totalReferred || 0, totalBonus: d.totalBonus || 0, referredUsers: d.referredUsers || [] }) } catch {}
  }, [user])
  const fetchPriceHistory = useCallback(async (stockId: string) => {
    try { const r = await fetch(`/api/stocks/${stockId}`); const d = await r.json(); if (d.priceHistory) setPriceHistory(d.priceHistory) } catch {}
  }, [])

  const refreshAll = useCallback(async () => {
    setRefreshing(true)
    try { await fetch('/api/stocks/update-prices', { method: 'POST' }) } catch {}
    await Promise.all([fetchStocks(), fetchPortfolio(), fetchIndices()])
    setRefreshing(false)
  }, [fetchStocks, fetchPortfolio, fetchIndices])

  useEffect(() => {
    if (!user) return
    if (!initialized.current) { initialized.current = true }
    fetchStocks(); fetchPortfolio(); fetchTransactions(); fetchIndices()
    fetchNotifications(); fetchNews(); fetchWatchlist(); fetchDeposits()
    fetchWithdrawals(); fetchReferral()
  }, [user, fetchStocks, fetchPortfolio, fetchTransactions, fetchIndices, fetchNotifications, fetchNews, fetchWatchlist, fetchDeposits, fetchWithdrawals, fetchReferral])

  useEffect(() => { const iv = setInterval(refreshAll, 30000); return () => clearInterval(iv) }, [refreshAll])

  // ============ TRADE ============
  const handleTrade = async () => {
    if (!user || !selectedStock || !tradeModal || !tradeShares) return
    const shares = parseInt(tradeShares)
    if (shares <= 0) return
    setTradeLoading(true)
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, stockId: selectedStock.id, type: tradeModal === 'buy' ? 'BUY' : 'SELL', shares, price: tradeOrderType === 'limit' ? parseFloat(tradePrice) || selectedStock.price : selectedStock.price }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: 'Transaksi Berhasil!', description: `${tradeModal === 'buy' ? 'Beli' : 'Jual'} ${shares} lot ${selectedStock.code}` })
      setTradeModal(null); setTradeShares(''); setTradePrice('')
      fetchPortfolio(); fetchTransactions(); fetchStocks()
    } catch (err: unknown) {
      toast({ title: 'Gagal', description: err instanceof Error ? err.message : 'Error', variant: 'destructive' })
    } finally { setTradeLoading(false) }
  }

  // ============ DEPOSIT ============
  const handleDeposit = async () => {
    if (!user || !depositAmount) return
    const amount = parseFloat(depositAmount)
    if (amount < 10000) { toast({ title: 'Minimum deposit Rp 10.000', variant: 'destructive' }); return }
    setDepositLoading(true)
    try {
      const res = await fetch('/api/deposit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, amount, method: depositMethod, bankName: 'BCA' }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: 'Deposit Berhasil!', description: `+${formatRupiah(amount)} telah ditambahkan` })
      setDepositAmount(''); fetchPortfolio(); fetchDeposits(); fetchNotifications()
    } catch (err: unknown) { toast({ title: 'Gagal', description: err instanceof Error ? err.message : 'Error', variant: 'destructive' }) }
    finally { setDepositLoading(false) }
  }

  // ============ WITHDRAW ============
  const handleWithdraw = async () => {
    if (!user || !withdrawAmount) return
    const amount = parseFloat(withdrawAmount)
    if (amount < 10000) { toast({ title: 'Minimum withdraw Rp 10.000', variant: 'destructive' }); return }
    if (amount > (user?.balance || 0)) { toast({ title: 'Saldo tidak cukup', variant: 'destructive' }); return }
    setWithdrawLoading(true)
    try {
      const res = await fetch('/api/withdrawal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, amount, bankName: user.bankName || 'BCA', bankAccount: user.bankAccount || '1234567890', bankHolder: user.bankHolder || user.name }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: 'Withdraw Diproses!', description: `${formatRupiah(amount)} sedang diproses` })
      setWithdrawAmount(''); fetchPortfolio(); fetchWithdrawals()
    } catch (err: unknown) { toast({ title: 'Gagal', description: err instanceof Error ? err.message : 'Error', variant: 'destructive' }) }
    finally { setWithdrawLoading(false) }
  }

  // ============ WATCHLIST ============
  const toggleWatchlist = async (stockId: string) => {
    if (!user) return
    const exists = watchlist.some(w => w.stockId === stockId)
    try {
      if (exists) {
        await fetch('/api/watchlist', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, stockId }) })
      } else {
        await fetch('/api/watchlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, stockId }) })
      }
      fetchWatchlist()
    } catch {}
  }

  // ============ NOTIFICATIONS ============
  const markNotifRead = async (notifId?: string) => {
    if (!user) return
    try {
      await fetch('/api/notifications', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, notificationId: notifId, markAll: !notifId }) })
      fetchNotifications()
    } catch {}
  }

  // ============ PROFILE ============
  const handleProfileSave = async () => {
    if (!user) return
    try {
      const res = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, ...profileForm }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      updateUser(data.user)
      setProfileEdit(false)
      toast({ title: 'Profil Diperbarui!' })
    } catch (err: unknown) { toast({ title: 'Gagal', description: err instanceof Error ? err.message : 'Error', variant: 'destructive' }) }
  }

  // ============ DERIVED ============
  const unreadNotif = notifications.filter(n => !n.isRead).length
  const filteredStocks = stocks.filter(s => {
    const ms = s.code.toLowerCase().includes(searchQuery.toLowerCase()) || s.name.toLowerCase().includes(searchQuery.toLowerCase())
    const mf = stockFilter === 'all' || s.category === stockFilter || s.sector === stockFilter
    return ms && mf
  })
  const categories = [{ key: 'all', label: 'Semua' }, { key: 'bluechip', label: 'Blue Chip' }, { key: 'tech', label: 'Teknologi' }, { key: 'banking', label: 'Perbankan' }, { key: 'energy', label: 'Energi' }, { key: 'consumer', label: 'Konsumer' }, { key: 'media', label: 'Media' }]
  const isWatched = (stockId: string) => watchlist.some(w => w.stockId === stockId)
  const openStockDetail = (stock: Stock) => { setSelectedStock(stock); setShowStockDetail(true); fetchPriceHistory(stock.id) }
  const openTrade = (stock: Stock, type: 'buy' | 'sell') => { setSelectedStock(stock); setTradeModal(type); setTradeShares(''); setTradePrice(''); setTradeOrderType('market'); fetchPriceHistory(stock.id) }
  const portfolioPieData = portfolio.map(p => ({ name: p.stock.code, value: p.currentValue, color: '#' + ((Math.random() * 0xffffff) | 0).toString(16).padStart(6, '0') }))
  const filteredTransactions = transactions.filter(t => txFilter === 'all' || t.type === txFilter)

  // ============ RENDER ============
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white via-green-50/30 to-amber-50/20">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gs-line">
        <div className="max-w-[430px] mx-auto px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSideMenu(true)} className="w-9 h-9 rounded-xl bg-gs-soft border border-gs-line grid place-items-center">
              <Menu className="w-4 h-4 text-gs-green3" />
            </button>
            <div className="w-9 h-9 rounded-xl bg-white p-0.5 border border-gs-line shadow-sm">
              <img src="/logo.svg" alt="GS" className="w-full h-full object-contain" />
            </div>
            <div>
              <b className="block text-[10px] font-black text-gs-green3 leading-tight">GLOBAL SAHAM</b>
              <span className="block text-[7px] font-bold text-gs-muted">Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={refreshAll} className="w-8 h-8 rounded-xl bg-gs-soft border border-gs-line grid place-items-center hover:bg-green-100">
              <RefreshCw className={`w-3.5 h-3.5 text-gs-green3 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => { setShowNotifPanel(true); markNotifRead() }} className="w-8 h-8 rounded-xl bg-gs-soft border border-gs-line grid place-items-center hover:bg-green-100 relative">
              <Bell className="w-3.5 h-3.5 text-gs-green3" />
              {unreadNotif > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-gs-red border-2 border-white text-[6px] text-white font-black grid place-items-center">{unreadNotif > 9 ? '9+' : unreadNotif}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* Market Indices Bar */}
      {indices.length > 0 && (
        <div className="bg-white/60 border-b border-gs-line overflow-x-auto">
          <div className="max-w-[430px] mx-auto flex gap-3 px-3 py-1.5">
            {indices.map(idx => (
              <div key={idx.id} className="flex-shrink-0 flex items-center gap-1.5">
                <span className="text-[8px] font-black text-gs-green3">{idx.code}</span>
                <span className="text-[9px] font-black text-gs-text tabular-nums">{formatNumber(idx.value)}</span>
                <span className={`text-[8px] font-black ${idx.changePercent >= 0 ? 'text-green-600' : 'text-red-500'}`}>{formatPercent(idx.changePercent)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-[430px] mx-auto w-full px-3 py-3 pb-24">
        <AnimatePresence mode="wait">
          {/* ====== HOME TAB ====== */}
          {activeTab === 'home' && (
            <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              {/* Balance Card */}
              <div className="rounded-3xl overflow-hidden mb-4" style={{ background: 'radial-gradient(circle at top right, rgba(255,230,168,.22), transparent 28%), linear-gradient(145deg, #042d1a 0%, #08713a 54%, #17b85c 100%)' }}>
                <div className="p-4 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <div><span className="text-[9px] font-bold text-green-200">Selamat datang,</span><b className="block text-sm font-black">{user?.name}</b></div>
                    <div className="flex items-center gap-2">
                      {user?.kycStatus === 'verified' && <div className="h-6 px-2 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center gap-1"><Shield className="w-3 h-3 text-blue-300" /><span className="text-[7px] font-black text-blue-200">KYC ✓</span></div>}
                      <div className="w-10 h-10 rounded-full bg-white/15 border border-white/20 grid place-items-center"><User className="w-5 h-5 text-yellow-200" /></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-2xl p-3 bg-white/10 border border-white/15"><span className="text-[7px] font-bold text-green-200">Total Aset</span><b className="block text-[12px] font-black mt-0.5">{formatRupiah(portfolioSummary.totalAssets)}</b></div>
                    <div className="rounded-2xl p-3 bg-white/10 border border-white/15"><span className="text-[7px] font-bold text-green-200">Saldo Kas</span><b className="block text-[12px] font-black mt-0.5">{formatRupiah(portfolioSummary.cashBalance)}</b></div>
                    <div className="rounded-2xl p-3 bg-white/10 border border-white/15"><span className="text-[7px] font-bold text-green-200">Profit/Loss</span><b className={`block text-[12px] font-black mt-0.5 ${portfolioSummary.totalProfitLoss >= 0 ? 'text-green-300' : 'text-red-300'}`}>{formatRupiah(portfolioSummary.totalProfitLoss)}</b></div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-5 gap-1.5 mb-4">
                {[
                  { icon: <Plus className="w-4 h-4" />, label: 'Deposit', action: () => setActiveTab('finance'), color: 'bg-green-50 text-green-600' },
                  { icon: <Minus className="w-4 h-4" />, label: 'Withdraw', action: () => setActiveTab('finance'), color: 'bg-red-50 text-red-500' },
                  { icon: <BarChart3 className="w-4 h-4" />, label: 'Saham', action: () => setActiveTab('trade'), color: 'bg-blue-50 text-blue-600' },
                  { icon: <Gift className="w-4 h-4" />, label: 'Referral', action: () => setActiveTab('referral'), color: 'bg-purple-50 text-purple-600' },
                  { icon: <Newspaper className="w-4 h-4" />, label: 'Berita', action: () => setActiveTab('news'), color: 'bg-amber-50 text-amber-600' },
                ].map((a, i) => (
                  <button key={i} onClick={a.action} className="flex flex-col items-center gap-1 py-2.5 rounded-2xl bg-white border border-gs-line shadow-sm hover:shadow-md transition-shadow">
                    <div className={`w-8 h-8 rounded-lg ${a.color} grid place-items-center`}>{a.icon}</div>
                    <span className="text-[7px] font-black text-gs-green3">{a.label}</span>
                  </button>
                ))}
              </div>

              {/* Portfolio Chart */}
              {portfolio.length > 0 && (
                <div className="rounded-2xl p-3 bg-white border border-gs-line shadow-sm mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[11px] font-black text-gs-green3">Alokasi Portofolio</h3>
                    <span className="text-[8px] font-bold text-gs-muted">{portfolio.length} saham</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-24 flex-shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart><Pie data={portfolioPieData} innerRadius={25} outerRadius={40} paddingAngle={2} dataKey="value">
                          {portfolioPieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie></RePieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
                      {portfolio.map(p => (
                        <div key={p.id} className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: portfolioPieData.find(d => d.name === p.stock.code)?.color }} />
                          <span className="text-[8px] font-black text-gs-green3 flex-shrink-0">{p.stock.code}</span>
                          <span className="text-[7px] font-bold text-gs-muted flex-1">{formatRupiah(p.currentValue)}</span>
                          <span className={`text-[7px] font-black ${p.profitLoss >= 0 ? 'text-green-600' : 'text-red-500'}`}>{formatPercent(p.profitLossPercent)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Top Gainers & Losers */}
              <div className="mb-4">
                <h3 className="text-[11px] font-black text-gs-green3 mb-2">🏆 Top Movers</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-2xl p-2.5 bg-white border border-gs-line shadow-sm">
                    <span className="text-[8px] font-black text-green-600 mb-1.5 block">🟢 Top Gainer</span>
                    {[...stocks].sort((a, b) => b.changePercent - a.changePercent).slice(0, 3).map(s => (
                      <button key={s.id} onClick={() => openStockDetail(s)} className="flex items-center justify-between w-full py-1">
                        <span className="text-[9px] font-black text-gs-green3">{s.code}</span>
                        <span className="text-[8px] font-black text-green-600">{formatPercent(s.changePercent)}</span>
                      </button>
                    ))}
                  </div>
                  <div className="rounded-2xl p-2.5 bg-white border border-gs-line shadow-sm">
                    <span className="text-[8px] font-black text-red-500 mb-1.5 block">🔴 Top Loser</span>
                    {[...stocks].sort((a, b) => a.changePercent - b.changePercent).slice(0, 3).map(s => (
                      <button key={s.id} onClick={() => openStockDetail(s)} className="flex items-center justify-between w-full py-1">
                        <span className="text-[9px] font-black text-gs-green3">{s.code}</span>
                        <span className="text-[8px] font-black text-red-500">{formatPercent(s.changePercent)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Watchlist */}
              {watchlist.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[11px] font-black text-gs-green3">⭐ Watchlist</h3>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                    {watchlist.map(w => (
                      <button key={w.id} onClick={() => openStockDetail(w.stock)} className="flex-shrink-0 w-[120px] rounded-xl p-2.5 bg-white border border-gs-line shadow-sm text-left">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-black text-gs-green3">{w.stock.code}</span>
                          <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full ${w.stock.changePercent >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{formatPercent(w.stock.changePercent)}</span>
                        </div>
                        <span className="block text-[9px] font-black text-gs-text tabular-nums">{formatRupiah(w.stock.price)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Transactions */}
              {transactions.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2"><h3 className="text-[11px] font-black text-gs-green3">Transaksi Terakhir</h3><button onClick={() => setActiveTab('history')} className="text-[8px] font-black text-gs-green">Selengkapnya</button></div>
                  <div className="space-y-1.5">
                    {transactions.slice(0, 3).map(tx => (
                      <div key={tx.id} className="rounded-xl p-2.5 bg-white border border-gs-line shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg grid place-items-center ${tx.type === 'BUY' ? 'bg-green-100' : 'bg-red-100'}`}>
                            {tx.type === 'BUY' ? <ArrowDownRight className="w-3.5 h-3.5 text-green-600" /> : <ArrowUpRight className="w-3.5 h-3.5 text-red-500" />}
                          </div>
                          <div><b className="block text-[10px] font-black text-gs-green3">{tx.type === 'BUY' ? 'Beli' : 'Jual'} {tx.stock.code}</b><span className="text-[7px] font-bold text-gs-muted">{tx.shares} lot @ {formatRupiah(tx.price)}</span></div>
                        </div>
                        <div className="text-right"><b className="block text-[10px] font-black text-gs-text">{formatRupiah(tx.total)}</b><span className="text-[7px] font-bold text-gs-muted">{formatDateTime(tx.createdAt)}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* News */}
              {news.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2"><h3 className="text-[11px] font-black text-gs-green3">📰 Berita Pasar</h3><button onClick={() => setActiveTab('news')} className="text-[8px] font-black text-gs-green">Selengkapnya</button></div>
                  {news.slice(0, 2).map(n => (
                    <div key={n.id} className="rounded-xl p-2.5 bg-white border border-gs-line shadow-sm mb-1.5">
                      <div className="flex items-center gap-1 mb-1">
                        <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full ${n.category === 'market' ? 'bg-blue-100 text-blue-700' : n.category === 'system' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{n.category}</span>
                        <span className="text-[7px] font-bold text-gs-muted">{formatDate(n.createdAt)}</span>
                      </div>
                      <b className="block text-[10px] font-black text-gs-green3">{n.title}</b>
                      <p className="text-[8px] text-gs-muted font-bold mt-0.5 line-clamp-2">{n.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ====== TRADE TAB ====== */}
          {activeTab === 'trade' && (
            <motion.div key="trade" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <div className="flex items-center justify-between mb-3"><h2 className="text-base font-black text-gs-green3">Pasar Saham</h2><button onClick={refreshAll} className="flex items-center gap-1 text-[8px] font-black text-gs-green bg-gs-soft px-2.5 py-1.5 rounded-lg border border-gs-line"><RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />Refresh</button></div>
              <div className="relative mb-3"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gs-muted" /><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari saham..." className="w-full h-10 pl-9 pr-4 rounded-xl bg-white border border-gs-line text-[12px] font-bold text-gs-text outline-none focus:border-gs-green placeholder:text-gs-muted" /></div>
              <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 custom-scrollbar">
                {categories.map(c => <button key={c.key} onClick={() => setStockFilter(c.key)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[8px] font-black ${stockFilter === c.key ? 'bg-gs-green3 text-white shadow-sm' : 'bg-white text-gs-muted border border-gs-line'}`}>{c.label}</button>)}
              </div>
              <div className="space-y-2">
                {filteredStocks.map(stock => (
                  <div key={stock.id} className="rounded-2xl p-3 bg-white border border-gs-line shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-xl grid place-items-center text-white text-[10px] font-black ${stock.changePercent >= 0 ? 'bg-gradient-to-br from-gs-green3 to-gs-green2' : 'bg-gradient-to-br from-red-700 to-red-400'}`}>{stock.code.slice(0, 2)}</div>
                        <div>
                          <div className="flex items-center gap-1">
                            <b className="text-[11px] font-black text-gs-green3">{stock.code}</b>
                            <button onClick={() => toggleWatchlist(stock.id)} className="w-4 h-4 grid place-items-center"><Star className={`w-3 h-3 ${isWatched(stock.id) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} /></button>
                          </div>
                          <span className="block text-[7px] font-bold text-gs-muted max-w-[130px] truncate">{stock.name}</span>
                          <span className="block text-[6.5px] font-bold text-gs-muted">{stock.sector || stock.category}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <b className="block text-[12px] font-black text-gs-text tabular-nums">{formatRupiah(stock.price)}</b>
                        <div className="flex items-center gap-0.5 justify-end">{stock.changePercent >= 0 ? <ChevronUp className="w-3 h-3 text-green-600" /> : <ChevronDown className="w-3 h-3 text-red-500" />}<span className={`text-[9px] font-black tabular-nums ${stock.changePercent >= 0 ? 'text-green-600' : 'text-red-500'}`}>{formatPercent(stock.changePercent)}</span></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gs-line">
                      <div className="flex gap-2">
                        <span className="text-[7px] text-gs-muted"><b className="font-black text-gs-text">Vol</b> {formatMarketCap(stock.volume)}</span>
                        <span className="text-[7px] text-gs-muted"><b className="font-black text-gs-text">MCap</b> {formatMarketCap(stock.marketCap)}</span>
                        {stock.peRatio > 0 && <span className="text-[7px] text-gs-muted"><b className="font-black text-gs-text">PE</b> {stock.peRatio.toFixed(1)}</span>}
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => openStockDetail(stock)} className="h-7 px-2 rounded-lg bg-gs-soft border border-gs-line text-[8px] font-black text-gs-green3"><BarChart3 className="w-3 h-3" /></button>
                        <button onClick={() => openTrade(stock, 'buy')} className="h-7 px-3 rounded-lg bg-gradient-to-r from-gs-green3 to-gs-green2 text-white text-[8px] font-black">BELI</button>
                        <button onClick={() => openTrade(stock, 'sell')} className="h-7 px-3 rounded-lg bg-gradient-to-r from-red-600 to-red-400 text-white text-[8px] font-black">JUAL</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ====== PORTFOLIO TAB ====== */}
          {activeTab === 'portfolio' && (
            <motion.div key="portfolio" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <h2 className="text-base font-black text-gs-green3 mb-3">Portofolio Saya</h2>
              <div className="rounded-3xl overflow-hidden mb-4" style={{ background: 'radial-gradient(circle at top right, rgba(255,230,168,.22), transparent 28%), linear-gradient(145deg, #042d1a 0%, #08713a 54%, #17b85c 100%)' }}>
                <div className="p-3 text-white">
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="rounded-xl p-2.5 bg-white/10 border border-white/15"><span className="text-[7px] font-bold text-green-200">Nilai</span><b className="block text-[11px] font-black mt-0.5">{formatRupiah(portfolioSummary.totalCurrentValue)}</b></div>
                    <div className="rounded-xl p-2.5 bg-white/10 border border-white/15"><span className="text-[7px] font-bold text-green-200">Modal</span><b className="block text-[11px] font-black mt-0.5">{formatRupiah(portfolioSummary.totalInvested)}</b></div>
                    <div className="rounded-xl p-2.5 bg-white/10 border border-white/15"><span className="text-[7px] font-bold text-green-200">Return</span><b className={`block text-[11px] font-black mt-0.5 ${portfolioSummary.totalProfitLossPercent >= 0 ? 'text-green-300' : 'text-red-300'}`}>{formatPercent(portfolioSummary.totalProfitLossPercent)}</b></div>
                  </div>
                </div>
              </div>
              {portfolio.length === 0 ? (
                <div className="text-center py-8"><Briefcase className="w-10 h-10 text-gs-muted mx-auto mb-2" /><p className="text-sm font-bold text-gs-muted">Belum ada portofolio</p><button onClick={() => setActiveTab('trade')} className="mt-3 px-4 py-2 rounded-xl bg-gs-green text-white text-[9px] font-black">Mulai Investasi</button></div>
              ) : (
                <div className="space-y-2">{portfolio.map(item => (
                  <div key={item.id} className="rounded-2xl p-3 bg-white border border-gs-line shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-xl grid place-items-center text-white text-[10px] font-black ${item.profitLoss >= 0 ? 'bg-gradient-to-br from-gs-green3 to-gs-green2' : 'bg-gradient-to-br from-red-700 to-red-400'}`}>{item.stock.code.slice(0, 2)}</div>
                        <div><b className="block text-[11px] font-black text-gs-green3">{item.stock.code}</b><span className="block text-[7px] font-bold text-gs-muted">{item.shares} lot @ {formatRupiah(item.avgPrice)}</span></div>
                      </div>
                      <div className="text-right">
                        <b className="block text-[11px] font-black text-gs-text">{formatRupiah(item.currentValue)}</b>
                        <div className="flex items-center gap-0.5 justify-end">{item.profitLoss >= 0 ? <ArrowUpRight className="w-3 h-3 text-green-600" /> : <ArrowDownRight className="w-3 h-3 text-red-500" />}<span className={`text-[9px] font-black ${item.profitLoss >= 0 ? 'text-green-600' : 'text-red-500'}`}>{formatRupiah(item.profitLoss)} ({formatPercent(item.profitLossPercent)})</span></div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2"><button onClick={() => openTrade(item.stock, 'buy')} className="flex-1 h-8 rounded-lg bg-gradient-to-r from-gs-green3 to-gs-green2 text-white text-[8px] font-black">TAMBAH</button><button onClick={() => openTrade(item.stock, 'sell')} className="flex-1 h-8 rounded-lg bg-gradient-to-r from-red-600 to-red-400 text-white text-[8px] font-black">JUAL</button></div>
                  </div>
                ))}</div>
              )}
            </motion.div>
          )}

          {/* ====== FINANCE TAB (DEPOSIT/WITHDRAW) ====== */}
          {activeTab === 'finance' && (
            <motion.div key="finance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <h2 className="text-base font-black text-gs-green3 mb-3">Keuangan</h2>
              {/* Balance Card */}
              <div className="rounded-2xl p-3 bg-gs-soft border border-gs-line mb-4">
                <span className="text-[9px] font-bold text-gs-muted">Saldo Tersedia</span>
                <b className="block text-xl font-black text-gs-green3">{formatRupiah(user?.balance || 0)}</b>
              </div>
              {/* Deposit & Withdraw Tabs */}
              <div className="flex gap-2 mb-4">
                <button onClick={() => setDepositMethod('bank_transfer')} className={`flex-1 h-10 rounded-xl text-[10px] font-black flex items-center justify-center gap-1.5 ${depositMethod ? 'bg-gs-green3 text-white' : 'bg-white text-gs-muted border border-gs-line'}`}><Plus className="w-3.5 h-3.5" />Deposit</button>
                <button onClick={() => setDepositMethod('')} className={`flex-1 h-10 rounded-xl text-[10px] font-black flex items-center justify-center gap-1.5 ${!depositMethod ? 'bg-red-600 text-white' : 'bg-white text-gs-muted border border-gs-line'}`}><Minus className="w-3.5 h-3.5" />Withdraw</button>
              </div>

              {depositMethod ? (
                /* Deposit Form */
                <div className="rounded-2xl p-3 bg-white border border-gs-line shadow-sm mb-4">
                  <h3 className="text-[11px] font-black text-gs-green3 mb-3">Deposit Dana</h3>
                  <div className="mb-3">
                    <label className="block text-[8px] font-black text-gs-muted uppercase tracking-wider mb-1">Metode</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['bank_transfer', 'e_wallet'].map(m => <button key={m} onClick={() => setDepositMethod(m)} className={`h-9 rounded-lg text-[9px] font-black ${depositMethod === m ? 'bg-gs-green3 text-white' : 'bg-gs-soft border border-gs-line text-gs-muted'}`}>{m === 'bank_transfer' ? '🏦 Transfer Bank' : '📱 E-Wallet'}</button>)}
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-[8px] font-black text-gs-muted uppercase tracking-wider mb-1">Jumlah</label>
                    <input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="Minimal Rp 10.000" className="w-full h-10 px-3 rounded-xl bg-gs-soft border border-gs-line text-gs-text text-[13px] font-black outline-none focus:border-gs-green placeholder:text-gray-400" />
                  </div>
                  <div className="flex gap-1.5 mb-3">{[50000, 100000, 500000, 1000000, 5000000, 10000000].map(a => <button key={a} onClick={() => setDepositAmount(String(a))} className="flex-1 h-7 rounded-lg bg-gs-soft border border-gs-line text-[7px] font-black text-gs-green3 hover:bg-green-100">{formatMarketCap(a)}</button>)}</div>
                  <button onClick={handleDeposit} disabled={depositLoading || !depositAmount} className="w-full h-12 rounded-xl bg-gradient-to-r from-gs-green3 to-gs-green2 text-white text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50">
                    {depositLoading ? <div className="w-5 h-5 rounded-full border-[3px] border-white/30 border-t-white animate-spin" /> : <><Plus className="w-4 h-4" />Deposit Sekarang</>}
                  </button>
                </div>
              ) : (
                /* Withdraw Form */
                <div className="rounded-2xl p-3 bg-white border border-gs-line shadow-sm mb-4">
                  <h3 className="text-[11px] font-black text-gs-green3 mb-3">Withdraw Dana</h3>
                  <div className="mb-3">
                    <label className="block text-[8px] font-black text-gs-muted uppercase tracking-wider mb-1">Rekening Tujuan</label>
                    <div className="rounded-xl p-2.5 bg-gs-soft border border-gs-line">
                      <b className="block text-[10px] font-black text-gs-green3">{user?.bankName || 'BCA'} - {user?.bankAccount || '1234567890'}</b>
                      <span className="text-[8px] font-bold text-gs-muted">a.n. {user?.bankHolder || user?.name}</span>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-[8px] font-black text-gs-muted uppercase tracking-wider mb-1">Jumlah</label>
                    <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="Minimal Rp 10.000" className="w-full h-10 px-3 rounded-xl bg-gs-soft border border-gs-line text-gs-text text-[13px] font-black outline-none focus:border-gs-green placeholder:text-gray-400" />
                  </div>
                  <div className="flex gap-1.5 mb-3">{[50000, 100000, 500000, 1000000].map(a => <button key={a} onClick={() => setWithdrawAmount(String(a))} className="flex-1 h-7 rounded-lg bg-gs-soft border border-gs-line text-[7px] font-black text-gs-green3 hover:bg-green-100">{formatMarketCap(a)}</button>)}</div>
                  <button onClick={handleWithdraw} disabled={withdrawLoading || !withdrawAmount} className="w-full h-12 rounded-xl bg-gradient-to-r from-red-600 to-red-400 text-white text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50">
                    {withdrawLoading ? <div className="w-5 h-5 rounded-full border-[3px] border-white/30 border-t-white animate-spin" /> : <><Minus className="w-4 h-4" />Withdraw Sekarang</>}
                  </button>
                </div>
              )}

              {/* History */}
              <h3 className="text-[11px] font-black text-gs-green3 mb-2">Riwayat Keuangan</h3>
              <div className="space-y-1.5 max-h-60 overflow-y-auto custom-scrollbar">
                {[...deposits.map(d => ({ ...d, type: 'deposit' })), ...withdrawals.map(w => ({ ...w, type: 'withdrawal' }))]
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 10)
                  .map((item, i) => (
                    <div key={i} className="rounded-xl p-2.5 bg-white border border-gs-line shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg grid place-items-center ${item.type === 'deposit' ? 'bg-green-100' : 'bg-red-100'}`}>
                          {item.type === 'deposit' ? <ArrowDownRight className="w-4 h-4 text-green-600" /> : <ArrowUpRight className="w-4 h-4 text-red-500" />}
                        </div>
                        <div><b className="block text-[9px] font-black text-gs-green3">{item.type === 'deposit' ? 'Deposit' : 'Withdraw'}</b><span className="text-[7px] font-bold text-gs-muted">{formatDateTime(item.createdAt)}</span></div>
                      </div>
                      <div className="text-right">
                        <b className={`block text-[10px] font-black ${item.type === 'deposit' ? 'text-green-600' : 'text-red-500'}`}>{item.type === 'deposit' ? '+' : '-'}{formatRupiah(item.amount)}</b>
                        <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full ${item.status === 'completed' ? 'bg-green-100 text-green-700' : item.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'}`}>{item.status}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>
          )}

          {/* ====== HISTORY TAB ====== */}
          {activeTab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <h2 className="text-base font-black text-gs-green3 mb-3">Riwayat Transaksi</h2>
              <div className="flex gap-1.5 mb-3">
                {[{ key: 'all', label: 'Semua' }, { key: 'BUY', label: 'Beli' }, { key: 'SELL', label: 'Jual' }].map(f => (
                  <button key={f.key} onClick={() => setTxFilter(f.key)} className={`flex-1 h-8 rounded-lg text-[9px] font-black ${txFilter === f.key ? 'bg-gs-green3 text-white' : 'bg-white text-gs-muted border border-gs-line'}`}>{f.label}</button>
                ))}
              </div>
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-8"><History className="w-10 h-10 text-gs-muted mx-auto mb-2" /><p className="text-sm font-bold text-gs-muted">Belum ada transaksi</p></div>
              ) : (
                <div className="space-y-1.5 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
                  {filteredTransactions.map(tx => (
                    <div key={tx.id} className="rounded-xl p-2.5 bg-white border border-gs-line shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-9 h-9 rounded-xl grid place-items-center ${tx.type === 'BUY' ? 'bg-green-100' : 'bg-red-100'}`}>
                          {tx.type === 'BUY' ? <ArrowDownRight className="w-4 h-4 text-green-600" /> : <ArrowUpRight className="w-4 h-4 text-red-500" />}
                        </div>
                        <div>
                          <b className="block text-[10px] font-black text-gs-green3">{tx.type === 'BUY' ? 'Beli' : 'Jual'} {tx.stock.code}</b>
                          <span className="text-[7px] font-bold text-gs-muted">{tx.shares} lot × {formatRupiah(tx.price)} {tx.orderType === 'limit' ? '(Limit)' : '(Market)'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <b className={`block text-[10px] font-black ${tx.type === 'BUY' ? 'text-red-500' : 'text-green-600'}`}>{tx.type === 'BUY' ? '-' : '+'}{formatRupiah(tx.total)}</b>
                        <div className="flex items-center gap-1 justify-end"><span className="text-[7px] font-bold text-gs-muted">{formatDateTime(tx.createdAt)}</span><span className={`text-[6px] font-black px-1 py-0.5 rounded ${tx.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{tx.status}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ====== NEWS TAB ====== */}
          {activeTab === 'news' && (
            <motion.div key="news" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <h2 className="text-base font-black text-gs-green3 mb-3">Berita & Edukasi</h2>
              <div className="space-y-2">
                {news.map(n => (
                  <div key={n.id} className="rounded-2xl p-3 bg-white border border-gs-line shadow-sm">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className={`text-[7px] font-black px-2 py-0.5 rounded-full ${n.category === 'market' ? 'bg-blue-100 text-blue-700' : n.category === 'company' ? 'bg-purple-100 text-purple-700' : n.category === 'system' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{n.category}</span>
                      <span className="text-[7px] font-bold text-gs-muted">{formatDate(n.createdAt)}</span>
                    </div>
                    <b className="block text-[11px] font-black text-gs-green3 mb-1">{n.title}</b>
                    <p className="text-[8.5px] text-gs-muted font-bold leading-relaxed">{n.content}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ====== REFERRAL TAB ====== */}
          {activeTab === 'referral' && (
            <motion.div key="referral" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <h2 className="text-base font-black text-gs-green3 mb-3">Program Referral</h2>
              <div className="rounded-2xl p-4 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 mb-4 text-center">
                <Gift className="w-10 h-10 text-purple-600 mx-auto mb-2" />
                <h3 className="text-sm font-black text-purple-800 mb-1">Ajak Teman, Dapat Bonus!</h3>
                <p className="text-[9px] font-bold text-purple-600 mb-3">Bagikan kode referral Anda dan dapatkan bonus Rp 50.000 untuk setiap teman yang bergabung!</p>
                <div className="rounded-xl p-3 bg-white border border-purple-200 inline-block">
                  <span className="text-[8px] font-bold text-purple-600 block mb-1">Kode Referral Anda</span>
                  <b className="text-xl font-black text-purple-800 tracking-wider">{referralInfo.code || user?.referralCode || 'GS000000'}</b>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(referralInfo.code || user?.referralCode || ''); setCopied(true); setTimeout(() => setCopied(false), 2000) }} className="mt-3 h-9 px-5 rounded-xl bg-purple-600 text-white text-[9px] font-black flex items-center gap-1.5 mx-auto">
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}{copied ? 'Tersalin!' : 'Salin Kode'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="rounded-xl p-3 bg-white border border-gs-line shadow-sm text-center"><Users className="w-5 h-5 text-purple-600 mx-auto mb-1" /><b className="block text-lg font-black text-gs-green3">{referralInfo.totalReferred}</b><span className="text-[8px] font-bold text-gs-muted">Teman Direferensikan</span></div>
                <div className="rounded-xl p-3 bg-white border border-gs-line shadow-sm text-center"><Wallet className="w-5 h-5 text-green-600 mx-auto mb-1" /><b className="block text-lg font-black text-gs-green3">{formatRupiah(referralInfo.totalBonus)}</b><span className="text-[8px] font-bold text-gs-muted">Total Bonus</span></div>
              </div>
              <button onClick={() => { const text = `Gabung Global Saham! Pakai kode referral ${referralInfo.code || user?.referralCode} dan dapatkan bonus Rp 50.000! 🎉`; if (navigator.share) navigator.share({ title: 'Global Saham Referral', text }); else { navigator.clipboard.writeText(text); toast({ title: 'Link disalin!' }) } }} className="w-full h-10 rounded-xl bg-gradient-to-r from-purple-600 to-purple-400 text-white text-[9px] font-black flex items-center justify-center gap-2 mb-4"><Share2 className="w-3.5 h-3.5" />Bagikan ke Teman</button>
              {referralInfo.referredUsers.length > 0 && (
                <div><h3 className="text-[11px] font-black text-gs-green3 mb-2">Daftar Referral</h3><div className="space-y-1.5">{referralInfo.referredUsers.map((r, i) => (
                  <div key={i} className="rounded-xl p-2.5 bg-white border border-gs-line shadow-sm flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-purple-100 grid place-items-center"><User className="w-3.5 h-3.5 text-purple-600" /></div><div><b className="block text-[9px] font-black text-gs-green3">{r.name}</b><span className="text-[7px] font-bold text-gs-muted">{r.date}</span></div></div><span className="text-[9px] font-black text-green-600">+{formatRupiah(r.bonus)}</span></div>
                ))}</div></div>
              )}
            </motion.div>
          )}

          {/* ====== PROFILE TAB ====== */}
          {activeTab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <h2 className="text-base font-black text-gs-green3 mb-3">Profil Saya</h2>
              {/* Avatar & Name */}
              <div className="rounded-2xl p-4 bg-white border border-gs-line shadow-sm mb-4 flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gs-green3 to-gs-green2 grid place-items-center text-white text-xl font-black">{user?.name?.charAt(0) || 'U'}</div>
                <div>
                  <b className="block text-sm font-black text-gs-green3">{user?.name}</b>
                  <span className="block text-[9px] font-bold text-gs-muted">+62 {user?.phone}</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-[7px] font-black px-2 py-0.5 rounded-full ${user?.kycStatus === 'verified' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{user?.kycStatus === 'verified' ? '✓ KYC Verified' : '⏳ KYC Pending'}</span>
                  </div>
                </div>
              </div>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="rounded-xl p-2.5 bg-white border border-gs-line shadow-sm text-center"><Wallet className="w-4 h-4 text-green-600 mx-auto mb-1" /><b className="block text-[10px] font-black text-gs-green3">{formatRupiah(user?.balance || 0)}</b><span className="text-[7px] font-bold text-gs-muted">Saldo</span></div>
                <div className="rounded-xl p-2.5 bg-white border border-gs-line shadow-sm text-center"><Briefcase className="w-4 h-4 text-amber-600 mx-auto mb-1" /><b className="block text-[10px] font-black text-gs-green3">{portfolio.length}</b><span className="text-[7px] font-bold text-gs-muted">Saham</span></div>
                <div className="rounded-xl p-2.5 bg-white border border-gs-line shadow-sm text-center"><Gift className="w-4 h-4 text-purple-600 mx-auto mb-1" /><b className="block text-[10px] font-black text-gs-green3">{referralInfo.totalReferred}</b><span className="text-[7px] font-bold text-gs-muted">Referral</span></div>
              </div>
              {/* Profile Edit */}
              <div className="rounded-2xl p-3 bg-white border border-gs-line shadow-sm mb-4">
                <div className="flex items-center justify-between mb-3"><h3 className="text-[11px] font-black text-gs-green3">Informasi Akun</h3><button onClick={() => { setProfileEdit(!profileEdit); setProfileForm({ name: user?.name || '', email: user?.email || '', bankName: user?.bankName || '', bankAccount: user?.bankAccount || '', bankHolder: user?.bankHolder || '' }) }} className="text-[8px] font-black text-gs-green">{profileEdit ? 'Batal' : 'Edit'}</button></div>
                {profileEdit ? (
                  <div className="space-y-2.5">
                    <div><label className="block text-[8px] font-black text-gs-muted uppercase mb-1">Nama</label><input type="text" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} className="w-full h-9 px-3 rounded-lg bg-gs-soft border border-gs-line text-[12px] font-bold text-gs-text outline-none" /></div>
                    <div><label className="block text-[8px] font-black text-gs-muted uppercase mb-1">Email</label><input type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} className="w-full h-9 px-3 rounded-lg bg-gs-soft border border-gs-line text-[12px] font-bold text-gs-text outline-none" /></div>
                    <div><label className="block text-[8px] font-black text-gs-muted uppercase mb-1">Bank</label><input type="text" value={profileForm.bankName} onChange={(e) => setProfileForm({ ...profileForm, bankName: e.target.value })} placeholder="BCA, BRI, dll" className="w-full h-9 px-3 rounded-lg bg-gs-soft border border-gs-line text-[12px] font-bold text-gs-text outline-none" /></div>
                    <div><label className="block text-[8px] font-black text-gs-muted uppercase mb-1">Nomor Rekening</label><input type="text" value={profileForm.bankAccount} onChange={(e) => setProfileForm({ ...profileForm, bankAccount: e.target.value })} className="w-full h-9 px-3 rounded-lg bg-gs-soft border border-gs-line text-[12px] font-bold text-gs-text outline-none" /></div>
                    <div><label className="block text-[8px] font-black text-gs-muted uppercase mb-1">Nama Pemilik Rekening</label><input type="text" value={profileForm.bankHolder} onChange={(e) => setProfileForm({ ...profileForm, bankHolder: e.target.value })} className="w-full h-9 px-3 rounded-lg bg-gs-soft border border-gs-line text-[12px] font-bold text-gs-text outline-none" /></div>
                    <button onClick={handleProfileSave} className="w-full h-10 rounded-xl bg-gs-green3 text-white text-[9px] font-black">Simpan Perubahan</button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[{ l: 'Email', v: user?.email || '-' }, { l: 'Bank', v: user?.bankName || '-' }, { l: 'No. Rekening', v: user?.bankAccount || '-' }, { l: 'Nama Rekening', v: user?.bankHolder || '-' }, { l: 'Kode Referral', v: user?.referralCode || '-' }].map((f, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 border-b border-gs-line last:border-0"><span className="text-[9px] font-bold text-gs-muted">{f.l}</span><span className="text-[9px] font-black text-gs-green3">{f.v}</span></div>
                    ))}
                  </div>
                )}
              </div>
              {/* Menu Items */}
              <div className="space-y-1.5">
                {[
                  { icon: <Shield className="w-4 h-4 text-blue-600" />, label: 'Verifikasi KYC', desc: user?.kycStatus === 'verified' ? 'Terverifikasi' : 'Belum verifikasi', action: () => toast({ title: 'KYC', description: 'Fitur verifikasi KYC akan segera hadir' }) },
                  { icon: <Settings className="w-4 h-4 text-gray-600" />, label: 'Pengaturan', desc: 'Ubah PIN & keamanan', action: () => toast({ title: 'Pengaturan', description: 'Fitur pengaturan akan segera hadir' }) },
                  { icon: <BookOpen className="w-4 h-4 text-amber-600" />, label: 'Pusat Edukasi', desc: 'Pelajari investasi saham', action: () => setActiveTab('news') },
                  { icon: <CreditCard className="w-4 h-4 text-green-600" />, label: 'Keuangan', desc: 'Deposit & Withdraw', action: () => setActiveTab('finance') },
                  { icon: <LogOut className="w-4 h-4 text-red-500" />, label: 'Keluar', desc: 'Logout dari akun', action: logout },
                ].map((item, i) => (
                  <button key={i} onClick={item.action} className="w-full rounded-xl p-2.5 bg-white border border-gs-line shadow-sm flex items-center gap-2.5 hover:bg-gs-soft transition-colors text-left">
                    <div className="w-9 h-9 rounded-lg bg-gs-soft grid place-items-center">{item.icon}</div>
                    <div className="flex-1"><b className="block text-[10px] font-black text-gs-green3">{item.label}</b><span className="text-[8px] font-bold text-gs-muted">{item.desc}</span></div>
                    <ExternalLink className="w-3 h-3 text-gs-muted" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ============ TRADE MODAL ============ */}
      <AnimatePresence>
        {tradeModal && selectedStock && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center" onClick={() => setTradeModal(null)}>
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="w-full max-w-[430px] bg-white rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto custom-scrollbar" onClick={(e) => e.stopPropagation()}>
              <div className="w-10 h-1 rounded-full bg-gray-300 mx-auto mb-4" />
              <div className="flex items-center justify-between mb-3"><h3 className="text-lg font-black text-gs-green3">{tradeModal === 'buy' ? 'Beli' : 'Jual'} {selectedStock.code}</h3><button onClick={() => setTradeModal(null)} className="w-8 h-8 rounded-full bg-gray-100 grid place-items-center"><X className="w-4 h-4 text-gray-500" /></button></div>
              {/* Stock Info */}
              <div className="rounded-xl p-2.5 bg-gs-soft border border-gs-line mb-3 flex items-center justify-between">
                <div><b className="block text-[11px] font-black text-gs-green3">{selectedStock.name}</b><span className="text-[8px] font-bold text-gs-muted">{selectedStock.code} · {(selectedStock.sector || selectedStock.category).toUpperCase()}</span></div>
                <div className="text-right"><b className="block text-sm font-black text-gs-text tabular-nums">{formatRupiah(selectedStock.price)}</b><span className={`text-[9px] font-black ${selectedStock.changePercent >= 0 ? 'text-green-600' : 'text-red-500'}`}>{formatPercent(selectedStock.changePercent)}</span></div>
              </div>
              {/* Chart */}
              {priceHistory.length > 0 && (
                <div className="h-28 mb-3 rounded-xl overflow-hidden">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={priceHistory.slice(-30).map(h => ({ time: new Date(h.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }), price: h.price }))}>
                      <defs><linearGradient id="tg" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={selectedStock.changePercent >= 0 ? '#17b85c' : '#ef4444'} stopOpacity={0.3} /><stop offset="100%" stopColor={selectedStock.changePercent >= 0 ? '#17b85c' : '#ef4444'} stopOpacity={0} /></linearGradient></defs>
                      <XAxis dataKey="time" tick={{ fontSize: 7, fill: '#738579' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                      <YAxis hide /><Tooltip contentStyle={{ fontSize: 10, borderRadius: 12, border: '1px solid #dceee3' }} formatter={(v: number) => [formatRupiah(v), 'Harga']} />
                      <Area type="monotone" dataKey="price" stroke={selectedStock.changePercent >= 0 ? '#17b85c' : '#ef4444'} fill="url(#tg)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
              {/* Order Type */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button onClick={() => setTradeOrderType('market')} className={`h-8 rounded-lg text-[9px] font-black ${tradeOrderType === 'market' ? 'bg-gs-green3 text-white' : 'bg-gs-soft border border-gs-line text-gs-muted'}`}>Market Order</button>
                <button onClick={() => setTradeOrderType('limit')} className={`h-8 rounded-lg text-[9px] font-black ${tradeOrderType === 'limit' ? 'bg-gs-green3 text-white' : 'bg-gs-soft border border-gs-line text-gs-muted'}`}>Limit Order</button>
              </div>
              {tradeOrderType === 'limit' && (
                <div className="mb-3">
                  <label className="block text-[8px] font-black text-gs-muted uppercase tracking-wider mb-1">Harga Limit</label>
                  <input type="number" value={tradePrice} onChange={(e) => setTradePrice(e.target.value)} placeholder={formatRupiah(selectedStock.price)} className="w-full h-10 px-3 rounded-xl bg-gs-soft border border-gs-line text-gs-text text-[13px] font-black outline-none focus:border-gs-green placeholder:text-gray-400" />
                </div>
              )}
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-2 mb-3 text-[9px]">
                <div className="rounded-xl p-2 bg-gs-soft border border-gs-line"><span className="text-gs-muted font-bold">Harga / Lot</span><b className="block text-gs-text font-black text-[11px]">{formatRupiah(selectedStock.price)}</b></div>
                <div className="rounded-xl p-2 bg-gs-soft border border-gs-line"><span className="text-gs-muted font-bold">{tradeModal === 'buy' ? 'Saldo' : 'Dimiliki'}</span><b className="block text-gs-text font-black text-[11px]">{tradeModal === 'buy' ? formatRupiah(user?.balance || 0) : `${portfolio.find(p => p.stockId === selectedStock.id)?.shares || 0} lot`}</b></div>
              </div>
              {/* Shares */}
              <div className="mb-3"><label className="block text-[8px] font-black text-gs-muted uppercase tracking-wider mb-1">Jumlah Lot</label><input type="number" value={tradeShares} onChange={(e) => setTradeShares(e.target.value)} placeholder="Masukkan jumlah lot" className="w-full h-12 px-4 rounded-xl bg-gs-soft border border-gs-line text-gs-text text-[14px] font-black outline-none focus:border-gs-green placeholder:text-gray-400" /></div>
              <div className="flex gap-1.5 mb-3">{[1, 5, 10, 50, 100].map(n => <button key={n} onClick={() => setTradeShares(String(n))} className="flex-1 h-7 rounded-lg bg-white border border-gs-line text-[9px] font-black text-gs-green3 hover:bg-gs-soft">{n}</button>)}</div>
              {/* Summary */}
              <div className="rounded-xl p-3 bg-gs-soft border border-gs-line mb-3 space-y-1">
                <div className="flex justify-between text-[9px]"><span className="font-bold text-gs-muted">Subtotal</span><span className="font-black text-gs-text">{formatRupiah((parseInt(tradeShares) || 0) * selectedStock.price)}</span></div>
                <div className="flex justify-between text-[9px]"><span className="font-bold text-gs-muted">Biaya (0.15%)</span><span className="font-black text-gs-text">{formatRupiah((parseInt(tradeShares) || 0) * selectedStock.price * 0.0015)}</span></div>
                <div className="flex justify-between text-[10px] border-t border-gs-line pt-1"><span className="font-black text-gs-green3">Total</span><b className="font-black text-gs-green3">{formatRupiah((parseInt(tradeShares) || 0) * selectedStock.price * 1.0015)}</b></div>
              </div>
              <button onClick={handleTrade} disabled={tradeLoading || !tradeShares || parseInt(tradeShares) <= 0} className={`w-full h-14 rounded-2xl text-white text-[11px] font-black tracking-widest uppercase flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 ${tradeModal === 'buy' ? 'bg-gradient-to-r from-gs-green3 via-gs-green2 to-gs-gold' : 'bg-gradient-to-r from-red-700 via-red-500 to-orange-400'}`}>
                {tradeLoading ? <div className="w-5 h-5 rounded-full border-[3px] border-white/30 border-t-white animate-spin" /> : <>{tradeModal === 'buy' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}Konfirmasi {tradeModal === 'buy' ? 'Pembelian' : 'Penjualan'}</>}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ STOCK DETAIL MODAL ============ */}
      <AnimatePresence>
        {showStockDetail && selectedStock && !tradeModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center" onClick={() => { setShowStockDetail(false); setSelectedStock(null) }}>
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="w-full max-w-[430px] bg-white rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto custom-scrollbar" onClick={(e) => e.stopPropagation()}>
              <div className="w-10 h-1 rounded-full bg-gray-300 mx-auto mb-3" />
              <div className="flex items-center justify-between mb-2">
                <div><h3 className="text-lg font-black text-gs-green3">{selectedStock.code}</h3><span className="text-[9px] font-bold text-gs-muted">{selectedStock.name}</span></div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleWatchlist(selectedStock.id)} className="w-9 h-9 rounded-xl bg-gs-soft grid place-items-center"><Star className={`w-4 h-4 ${isWatched(selectedStock.id) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`} /></button>
                  <button onClick={() => { setShowStockDetail(false); setSelectedStock(null) }} className="w-9 h-9 rounded-full bg-gray-100 grid place-items-center"><X className="w-4 h-4 text-gray-500" /></button>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <b className="text-2xl font-black text-gs-text tabular-nums">{formatRupiah(selectedStock.price)}</b>
                <span className={`text-sm font-black ${selectedStock.changePercent >= 0 ? 'text-green-600' : 'text-red-500'}`}>{selectedStock.changePercent >= 0 ? <ChevronUp className="w-4 h-4 inline" /> : <ChevronDown className="w-4 h-4 inline" />}{formatPercent(selectedStock.changePercent)}</span>
              </div>
              {/* Chart Period */}
              <div className="flex gap-1 mb-2">{['1D', '1W', '1M', '3M', '1Y'].map(p => <button key={p} onClick={() => setChartPeriod(p)} className={`flex-1 h-7 rounded-lg text-[8px] font-black ${chartPeriod === p ? 'bg-gs-green3 text-white' : 'bg-gs-soft border border-gs-line text-gs-muted'}`}>{p}</button>)}</div>
              {/* Chart */}
              {priceHistory.length > 0 && (
                <div className="h-36 mb-3 rounded-xl overflow-hidden bg-gs-soft/50 p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={priceHistory.slice(chartPeriod === '1D' ? -5 : chartPeriod === '1W' ? -10 : chartPeriod === '1M' ? -30 : -60).map(h => ({ time: new Date(h.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }), price: h.price }))}>
                      <defs><linearGradient id="dg" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={selectedStock.changePercent >= 0 ? '#17b85c' : '#ef4444'} stopOpacity={0.3} /><stop offset="100%" stopColor={selectedStock.changePercent >= 0 ? '#17b85c' : '#ef4444'} stopOpacity={0} /></linearGradient></defs>
                      <XAxis dataKey="time" tick={{ fontSize: 7, fill: '#738579' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 7, fill: '#738579' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                      <Tooltip contentStyle={{ fontSize: 10, borderRadius: 12, border: '1px solid #dceee3' }} formatter={(v: number) => [formatRupiah(v), 'Harga']} />
                      <Area type="monotone" dataKey="price" stroke={selectedStock.changePercent >= 0 ? '#17b85c' : '#ef4444'} fill="url(#dg)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {[{ l: 'Open', v: formatRupiah(selectedStock.open) }, { l: 'High', v: formatRupiah(selectedStock.high) }, { l: 'Low', v: formatRupiah(selectedStock.low) }, { l: 'Volume', v: formatMarketCap(selectedStock.volume) }, { l: 'MCap', v: formatMarketCap(selectedStock.marketCap) }, { l: 'P/E', v: selectedStock.peRatio?.toFixed(1) || '-' }, { l: 'PBV', v: selectedStock.pbv?.toFixed(2) || '-' }, { l: 'Div. Yield', v: selectedStock.dividendYield ? `${selectedStock.dividendYield.toFixed(1)}%` : '-' }].map((s, i) => (
                  <div key={i} className="rounded-lg p-1.5 bg-gs-soft border border-gs-line"><span className="text-[6.5px] font-bold text-gs-muted block">{s.l}</span><b className="text-[9px] font-black text-gs-text block tabular-nums">{s.v}</b></div>
                ))}
              </div>
              {/* Description */}
              {selectedStock.description && <div className="mb-3"><h4 className="text-[10px] font-black text-gs-green3 mb-1">Tentang Perusahaan</h4><p className="text-[8.5px] text-gs-muted font-bold leading-relaxed">{selectedStock.description}</p></div>}
              {/* Order Book Simulation */}
              <div className="mb-3"><h4 className="text-[10px] font-black text-gs-green3 mb-1">Order Book</h4>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="space-y-0.5">{Array.from({ length: 5 }).map((_, i) => { const p = selectedStock.price + (5 - i) * 5; const vol = Math.floor(Math.random() * 5000) + 500; return <div key={`a${i}`} className="flex items-center justify-between text-[8px] py-0.5 relative"><div className="absolute inset-0 bg-green-100/50" style={{ width: `${Math.min(vol / 50, 100)}%` }} /><span className="relative font-black text-green-600 tabular-nums">{formatRupiah(p)}</span><span className="relative font-bold text-gs-muted tabular-nums">{vol}</span></div> })}</div>
                  <div className="space-y-0.5">{Array.from({ length: 5 }).map((_, i) => { const p = selectedStock.price - (i + 1) * 5; const vol = Math.floor(Math.random() * 5000) + 500; return <div key={`b${i}`} className="flex items-center justify-between text-[8px] py-0.5 relative"><div className="absolute inset-0 right-0 bg-red-100/50" style={{ width: `${Math.min(vol / 50, 100)}%`, marginLeft: 'auto' }} /><span className="relative font-black text-red-500 tabular-nums">{formatRupiah(p)}</span><span className="relative font-bold text-gs-muted tabular-nums">{vol}</span></div> })}</div>
                </div>
              </div>
              {/* Actions */}
              <div className="flex gap-2">
                <button onClick={() => { setShowStockDetail(false); openTrade(selectedStock, 'buy') }} className="flex-1 h-12 rounded-xl bg-gradient-to-r from-gs-green3 to-gs-green2 text-white text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1"><Plus className="w-4 h-4" />Beli</button>
                <button onClick={() => { setShowStockDetail(false); openTrade(selectedStock, 'sell') }} className="flex-1 h-12 rounded-xl bg-gradient-to-r from-red-600 to-red-400 text-white text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1"><Minus className="w-4 h-4" />Jual</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ NOTIFICATION PANEL ============ */}
      <AnimatePresence>
        {showNotifPanel && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center" onClick={() => setShowNotifPanel(false)}>
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="w-full max-w-[430px] bg-white rounded-t-3xl p-5 max-h-[70vh] overflow-y-auto custom-scrollbar" onClick={(e) => e.stopPropagation()}>
              <div className="w-10 h-1 rounded-full bg-gray-300 mx-auto mb-3" />
              <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-black text-gs-green3">Notifikasi</h3><button onClick={() => markNotifRead()} className="text-[8px] font-black text-gs-green">Tandai semua dibaca</button></div>
              {notifications.length === 0 ? <div className="text-center py-6"><Bell className="w-8 h-8 text-gs-muted mx-auto mb-2" /><p className="text-sm font-bold text-gs-muted">Tidak ada notifikasi</p></div> : (
                <div className="space-y-1.5">
                  {notifications.map(n => (
                    <div key={n.id} onClick={() => markNotifRead(n.id)} className={`rounded-xl p-2.5 border shadow-sm cursor-pointer ${n.isRead ? 'bg-white border-gs-line' : 'bg-green-50 border-green-200'}`}>
                      <div className="flex items-start gap-2">
                        <div className={`w-8 h-8 rounded-lg grid place-items-center flex-shrink-0 ${n.type === 'trade' ? 'bg-green-100' : n.type === 'deposit' ? 'bg-blue-100' : n.type === 'alert' ? 'bg-amber-100' : 'bg-gray-100'}`}>
                          {n.type === 'trade' ? <TrendingUp className="w-4 h-4 text-green-600" /> : n.type === 'deposit' ? <Wallet className="w-4 h-4 text-blue-600" /> : n.type === 'alert' ? <AlertCircle className="w-4 h-4 text-amber-600" /> : <Info className="w-4 h-4 text-gray-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <b className="block text-[10px] font-black text-gs-green3">{n.title}</b>
                          <p className="text-[8px] font-bold text-gs-muted leading-relaxed">{n.message}</p>
                          <span className="text-[7px] font-bold text-gs-muted mt-0.5 block">{formatDateTime(n.createdAt)}</span>
                        </div>
                        {!n.isRead && <div className="w-2 h-2 rounded-full bg-gs-green flex-shrink-0 mt-1" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ SIDE MENU ============ */}
      <AnimatePresence>
        {showSideMenu && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowSideMenu(false)}>
            <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', damping: 25 }} className="w-[260px] h-full bg-white shadow-2xl p-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gs-line">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gs-green3 to-gs-green2 grid place-items-center text-white text-lg font-black">{user?.name?.charAt(0)}</div>
                <div><b className="block text-sm font-black text-gs-green3">{user?.name}</b><span className="text-[8px] font-bold text-gs-muted">+62 {user?.phone}</span></div>
              </div>
              <div className="space-y-0.5">
                {[
                  { icon: <Home className="w-4 h-4" />, label: 'Beranda', tab: 'home' },
                  { icon: <BarChart3 className="w-4 h-4" />, label: 'Pasar Saham', tab: 'trade' },
                  { icon: <Briefcase className="w-4 h-4" />, label: 'Portofolio', tab: 'portfolio' },
                  { icon: <CreditCard className="w-4 h-4" />, label: 'Keuangan', tab: 'finance' },
                  { icon: <History className="w-4 h-4" />, label: 'Riwayat Transaksi', tab: 'history' },
                  { icon: <Star className="w-4 h-4" />, label: 'Watchlist', tab: 'trade' },
                  { icon: <Newspaper className="w-4 h-4" />, label: 'Berita & Edukasi', tab: 'news' },
                  { icon: <Gift className="w-4 h-4" />, label: 'Program Referral', tab: 'referral' },
                  { icon: <User className="w-4 h-4" />, label: 'Profil Saya', tab: 'profile' },
                ].map((item, i) => (
                  <button key={i} onClick={() => { setActiveTab(item.tab); setShowSideMenu(false) }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-black ${activeTab === item.tab ? 'bg-gs-soft text-gs-green3' : 'text-gs-muted hover:bg-gs-soft'}`}>
                    {item.icon}{item.label}
                  </button>
                ))}
                <div className="border-t border-gs-line mt-2 pt-2">
                  <button onClick={() => { logout(); setShowSideMenu(false) }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-black text-red-500 hover:bg-red-50"><LogOut className="w-4 h-4" />Keluar</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gs-line z-40">
        <div className="max-w-[430px] mx-auto flex items-center justify-around py-1.5">
          {[
            { key: 'home', icon: <Home className="w-5 h-5" />, label: 'Beranda' },
            { key: 'trade', icon: <BarChart3 className="w-5 h-5" />, label: 'Saham' },
            { key: 'portfolio', icon: <Briefcase className="w-5 h-5" />, label: 'Portofolio' },
            { key: 'finance', icon: <Wallet className="w-5 h-5" />, label: 'Keuangan' },
            { key: 'profile', icon: <User className="w-5 h-5" />, label: 'Profil' },
          ].map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-colors ${activeTab === tab.key ? 'text-gs-green' : 'text-gs-muted'}`}>
              {tab.icon}<span className="text-[6.5px] font-black">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

// ============================================
// MAIN PAGE
// ============================================
export default function MainPage() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)

  useEffect(() => {
    const seedIfEmpty = async () => {
      try {
        const res = await fetch('/api/stocks')
        const data = await res.json()
        if (!data.stocks || data.stocks.length === 0) {
          await fetch('/api/stocks/seed', { method: 'POST' })
        }
      } catch {}
    }
    seedIfEmpty()
  }, [])

  return isLoggedIn ? <Dashboard /> : <LoginPage />
}
