'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuthStore } from '@/lib/store'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, TrendingDown, Eye, EyeOff, ArrowRight,
  Wallet, BarChart3, Briefcase, History, LogOut, RefreshCw,
  ChevronUp, ChevronDown, X, Search, Bell, Star,
  ArrowUpRight, ArrowDownRight, Home as HomeIcon, User, Copy, Check,
  Plus, Minus, Gift, Newspaper, Shield, CreditCard, Settings,
  Clock, AlertCircle, CheckCircle, Info, ExternalLink, Share2,
  BookOpen, Award, Target, PieChart, Zap, Users, Menu,
  Phone, Lock, ChevronRight, Trophy, CalendarDays, Flame,
  MessageCircle, HelpCircle, LogIn, UserPlus, RotateCcw, DollarSign, Package, Sparkles,
  ListChecks, ClipboardList,
  Download, Gem, Building2, Headphones, ChevronLeft,
  Video, Play, ThumbsUp, Eye as EyeIcon, Globe, Send
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, ReferenceLine,
  LineChart, Line, BarChart as ReBarChart, Bar, CartesianGrid,
  ComposedChart
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

// ============================================
// TYPES
// ============================================
interface Stock {
  id: string; code: string; name: string; price: number; change: number;
  changePercent: number; high: number; low: number; open: number;
  volume: number; marketCap: number; category: string; sector?: string;
  logo?: string; description?: string; peRatio?: number; pbv?: number; dividendYield?: number; lotSize?: number;
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

interface BonusItem {
  id: string; type: string; amount: number; status: string; createdAt: string; description?: string;
}

interface PromoItem {
  id: string; title: string; description: string; imageUrl?: string; startDate: string; endDate: string; type: string;
}

interface LeaderboardEntry {
  rank: number; name: string; profit: number; profitPercent: number; avatar?: string;
}

interface InvestProduct {
  id: string; name: string; category: string; modal: number; dailyProfit: number;
  totalReturn: number; duration: number; roi: number; order: number; isActive: boolean;
}

interface UserInvestment {
  id: string; userId: string; productId: string; amount: number; dailyProfit: number;
  totalReturn: number; duration: number; daysElapsed: number; totalClaimed: number;
  status: string; lastClaimAt: string | null; createdAt: string;
  product: InvestProduct;
}

interface DailyCheckStatus {
  streak: number; lastCheckDate: string | null; canCheckToday: boolean; todayReward: number;
}

interface TaskItem {
  id: string; taskType: string; title: string; description: string | null;
  reward: number; progress: number; target: number; completed: boolean; claimed: boolean;
}

interface StockContract {
  id: string; userId: string; stockId: string; stockCode: string; stockName: string;
  amount: number; dailyProfitRate: number; dailyProfitAmount: number;
  totalProfit: number; totalReturn: number; duration: number;
  daysElapsed: number; totalClaimed: number; status: string;
  lastClaimAt: string | null; createdAt: string;
  stock: Stock;
}

// ============================================
// TICKER DATA (matching reference)
// ============================================
const REFERENCE_TICKERS = [
  { code: 'TE', change: '+1.59%', up: true },
  { code: 'IDX', change: '-2.13%', up: false },
  { code: 'IHSG', change: '+0.28%', up: true },
  { code: 'SAHAM', change: '+3.22%', up: true },
  { code: 'GOLD', change: '+4.04%', up: true },
  { code: 'BANK', change: '+3.30%', up: true },
  { code: 'ENERGY', change: '+3.77%', up: true },
  { code: 'OIL', change: '-3.48%', up: false },
  { code: 'TE', change: '+2.86%', up: true },
]

const PIE_COLORS = ['#059669', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899']

// ============================================
// LOGIN / REGISTER PAGE
// ============================================
function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [refCode, setRefCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [mathA, setMathA] = useState(Math.floor(Math.random() * 15) + 1)
  const [mathB, setMathB] = useState(Math.floor(Math.random() * 15) + 1)
  const [mathAnswer, setMathAnswer] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const login = useAuthStore((s) => s.login)

  const refreshMath = () => {
    setMathA(Math.floor(Math.random() * 15) + 1)
    setMathB(Math.floor(Math.random() * 15) + 1)
    setMathAnswer('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLogin) {
      if (!phone || !password) {
        toast({ title: 'Error', description: 'Mohon isi nomor WhatsApp dan kata sandi', variant: 'destructive' })
        return
      }
    } else {
      if (!name || !phone || !password || !confirmPassword) {
        toast({ title: 'Error', description: 'Mohon isi semua field', variant: 'destructive' })
        return
      }
      if (password !== confirmPassword) {
        toast({ title: 'Error', description: 'Kata sandi tidak cocok', variant: 'destructive' })
        return
      }
      if (parseInt(mathAnswer) !== mathA + mathB) {
        toast({ title: 'Error', description: 'Jawaban verifikasi keamanan salah', variant: 'destructive' })
        return
      }
      if (!agreeTerms) {
        toast({ title: 'Error', description: 'Anda harus menyetujui proses pendaftaran', variant: 'destructive' })
        return
      }
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
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: 'linear-gradient(180deg, #f5f0e8 0%, #d1fae5 50%, #a7f3d0 100%)' }}>
      {/* Desktop Left Branding Panel - hidden on mobile */}
      <div className="hidden md:flex md:w-1/2 lg:w-[55%] flex-col items-center justify-center p-8 lg:p-16 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #022c22 0%, #064e3b 54%, #059669 100%)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.04) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 text-center text-white max-w-lg">
          <div className="w-24 h-24 rounded-full bg-white p-2 mx-auto mb-6 shadow-[0_12px_40px_rgba(0,0,0,.3)]">
            <img src="/trendedge-logo.png" alt="TrendEdge" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-black mb-3">TrendEdge</h1>
          <p className="text-emerald-200 text-sm lg:text-base mb-8 leading-relaxed">Platform investasi saham terpercaya dengan akses pasar real-time, portofolio cerdas, dan reward eksklusif untuk investor Indonesia.</p>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl p-4 bg-white/10 border border-white/15 text-center">
              <BarChart3 className="w-6 h-6 text-yellow-300 mx-auto mb-2" />
              <b className="block text-sm font-black">Market</b>
              <span className="block text-xs text-emerald-200 font-bold">Live</span>
            </div>
            <div className="rounded-2xl p-4 bg-white/10 border border-white/15 text-center">
              <Users className="w-6 h-6 text-yellow-300 mx-auto mb-2" />
              <b className="block text-sm font-black">125K++</b>
              <span className="block text-xs text-emerald-200 font-bold">Pengguna</span>
            </div>
            <div className="rounded-2xl p-4 bg-white/10 border border-white/15 text-center">
              <Shield className="w-6 h-6 text-yellow-300 mx-auto mb-2" />
              <b className="block text-sm font-black">Aman</b>
              <span className="block text-xs text-emerald-200 font-bold">Terjamin</span>
            </div>
          </div>
          {/* Decorative chart line */}
          <div className="mt-8 mx-auto h-12 w-full max-w-sm rounded-xl overflow-hidden bg-white/8 border border-white/12">
            <svg className="w-full h-full" viewBox="0 0 400 50" preserveAspectRatio="none">
              <defs>
                <linearGradient id="deskChartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,38 L25,35 L50,33 L75,35 L100,28 L125,25 L150,27 L175,20 L200,17 L225,18 L250,12 L275,10 L300,11 L325,7 L350,8 L375,5 L400,3 L400,50 L0,50Z" fill="url(#deskChartGrad)" />
              <path d="M0,38 L25,35 L50,33 L75,35 L100,28 L125,25 L150,27 L175,20 L200,17 L225,18 L250,12 L275,10 L300,11 L325,7 L350,8 L375,5 L400,3" fill="none" stroke="#f59e0b" strokeWidth="2.5" />
            </svg>
          </div>
        </div>
      </div>

      {/* Right Side / Mobile Full Content */}
      <div className="w-full md:w-1/2 lg:w-[45%] flex items-center justify-center px-4 py-4 md:px-8 md:py-8 min-h-screen md:min-h-0">
        <div className="w-full max-w-[430px] md:max-w-md flex flex-col flex-1 md:flex-none md:justify-center">
          {/* Top Navigation - mobile only */}
          <header className="flex items-center justify-between mb-3 md:hidden">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-white p-1 border border-gs-line shadow-sm">
                <img src="/trendedge-logo.png" alt="TrendEdge" className="w-full h-full object-contain" />
              </div>
              <div>
                <b className="block text-[11px] leading-tight font-black text-gs-green3 tracking-wide">TRENDEDGE</b>
                <span className="block text-[7px] font-bold text-gs-green uppercase tracking-widest">TrendEdge Pro</span>
              </div>
            </div>
            <button
              onClick={() => { setIsLogin(!isLogin); refreshMath(); }}
              className="h-8 px-4 rounded-xl bg-gs-green3 text-white text-[10px] font-bold hover:bg-gs-green transition-colors flex items-center gap-1"
            >
              {isLogin ? <><UserPlus className="w-3 h-3" />Daftar</> : <><LogIn className="w-3 h-3" />Masuk</>}
            </button>
          </header>

          {/* Desktop switch button */}
          <div className="hidden md:flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-white p-1 border border-gs-line shadow-sm">
                <img src="/trendedge-logo.png" alt="TrendEdge" className="w-full h-full object-contain" />
              </div>
              <div>
                <b className="block text-xs leading-tight font-black text-gs-green3 tracking-wide">TRENDEDGE</b>
                <span className="block text-[9px] font-bold text-gs-green uppercase tracking-widest">TrendEdge Pro</span>
              </div>
            </div>
            <button
              onClick={() => { setIsLogin(!isLogin); refreshMath(); }}
              className="h-9 px-5 rounded-xl bg-gs-green3 text-white text-xs font-bold hover:bg-gs-green transition-colors flex items-center gap-1.5"
            >
              {isLogin ? <><UserPlus className="w-3.5 h-3.5" />Daftar</> : <><LogIn className="w-3.5 h-3.5" />Masuk</>}
            </button>
          </div>

        {/* Main Card */}
        <div className="rounded-3xl bg-white shadow-xl overflow-hidden flex-1 md:flex-none flex flex-col">
          {/* Green Header Section */}
          <div className="relative overflow-hidden text-white" style={{ background: 'linear-gradient(145deg, #022c22 0%, #064e3b 54%, #059669 100%)' }}>
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.04) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

            {/* LIVE Badge + Ticker */}
            <div className="relative flex items-center gap-2 px-4 pt-3 pb-2">
              <div className="flex-shrink-0 h-6 px-2.5 rounded-full flex items-center gap-1.5 bg-yellow-500/20 border border-yellow-400/30">
                <Zap className="w-3 h-3 text-yellow-300" />
                <span className="text-[8px] font-black text-yellow-300 tracking-wide">LIVE</span>
              </div>
              <div className="flex-1 overflow-hidden h-6 rounded-full bg-white/10 border border-white/15">
                <div className="flex items-center gap-3 whitespace-nowrap animate-ticker px-2 h-full">
                  {[...REFERENCE_TICKERS, ...REFERENCE_TICKERS].map((item, i) => (
                    <span key={i} className={`flex items-center gap-1 text-[8px] font-bold ${item.up ? 'text-emerald-300' : 'text-red-300'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${item.up ? 'bg-emerald-400' : 'bg-red-400'}`} />
                      {item.code} {item.change}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Center Logo + Text */}
            <div className="relative z-10 flex flex-col items-center px-4 pt-2 pb-3">
              <div className="w-16 h-16 rounded-full bg-white p-1.5 mb-2 shadow-[0_8px_24px_rgba(0,0,0,.3)]">
                <img src="/trendedge-logo.png" alt="TrendEdge" className="w-full h-full object-contain" />
              </div>

              {isLogin ? (
                <>
                  <h1 className="text-[18px] font-black text-center leading-tight">Masuk Investor<br />TrendEdge</h1>
                  <p className="max-w-[280px] mt-1.5 text-[9px] text-center font-medium text-emerald-200 leading-relaxed">
                    Akses akun TrendEdge untuk memantau portofolio, pergerakan saham, aktivitas profit, dan layanan Investor.
                  </p>
                </>
              ) : (
                <>
                  <div className="h-6 px-3 rounded-full bg-yellow-500/20 border border-yellow-400/30 flex items-center gap-1.5 mb-2">
                    <Shield className="w-3 h-3 text-yellow-300" />
                    <span className="text-[8px] font-black text-yellow-300 tracking-wide">REGISTRASI INVESTOR</span>
                  </div>
                  <h1 className="text-[18px] font-black text-center leading-tight">Daftar TrendEdge</h1>
                  <p className="max-w-[280px] mt-1.5 text-[9px] text-center font-medium text-emerald-200 leading-relaxed">
                    Buat akun investor untuk akses portofolio, produk aktif, dan program reward TrendEdge.
                  </p>
                </>
              )}

              {/* Stat Boxes */}
              <div className="mt-3 grid grid-cols-3 gap-2 w-full">
                {isLogin ? (
                  <>
                    <div className="rounded-2xl p-2 bg-white/10 border border-white/15 text-center">
                      <BarChart3 className="w-4 h-4 text-yellow-300 mx-auto mb-0.5" />
                      <b className="block text-[8px] font-black">Market</b>
                      <span className="block text-[7px] text-emerald-200 font-bold">Live</span>
                    </div>
                    <div className="rounded-2xl p-2 bg-white/10 border border-white/15 text-center">
                      <Users className="w-4 h-4 text-yellow-300 mx-auto mb-0.5" />
                      <b className="block text-[8px] font-black">125K++</b>
                      <span className="block text-[7px] text-emerald-200 font-bold">Pengguna</span>
                    </div>
                    <div className="rounded-2xl p-2 bg-white/10 border border-white/15 text-center">
                      <Briefcase className="w-4 h-4 text-yellow-300 mx-auto mb-0.5" />
                      <b className="block text-[8px] font-black">Portofolio</b>
                      <span className="block text-[7px] text-emerald-200 font-bold">Akses</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-2xl p-2 bg-white/10 border border-white/15 text-center">
                      <Users className="w-4 h-4 text-yellow-300 mx-auto mb-0.5" />
                      <b className="block text-[8px] font-black">PENDUDUKA</b>
                      <span className="block text-[7px] text-emerald-200 font-bold">125K++</span>
                    </div>
                    <div className="rounded-2xl p-2 bg-white/10 border border-white/15 text-center">
                      <TrendingUp className="w-4 h-4 text-yellow-300 mx-auto mb-0.5" />
                      <b className="block text-[8px] font-black">MARKET</b>
                      <span className="block text-[7px] text-emerald-200 font-bold">+4.18%</span>
                    </div>
                    <div className="rounded-2xl p-2 bg-white/10 border border-white/15 text-center">
                      <CheckCircle className="w-4 h-4 text-yellow-300 mx-auto mb-0.5" />
                      <b className="block text-[8px] font-black">STATUS</b>
                      <span className="block text-[7px] text-emerald-200 font-bold">OPEN</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Yellow Line Graph */}
            <div className="relative z-10 mx-4 mb-3 h-10 rounded-xl overflow-hidden bg-white/8 border border-white/12">
              <svg className="w-full h-full" viewBox="0 0 400 50" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,38 L25,35 L50,33 L75,35 L100,28 L125,25 L150,27 L175,20 L200,17 L225,18 L250,12 L275,10 L300,11 L325,7 L350,8 L375,5 L400,3 L400,50 L0,50Z" fill="url(#chartGrad)" />
                <path d="M0,38 L25,35 L50,33 L75,35 L100,28 L125,25 L150,27 L175,20 L200,17 L225,18 L250,12 L275,10 L300,11 L325,7 L350,8 L375,5 L400,3" fill="none" stroke="#f59e0b" strokeWidth="2.5" className="animate-chart-draw" />
              </svg>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-300/10 to-transparent animate-shimmer" />
            </div>
          </div>

          {/* Form Section */}
          <div className="p-4 flex-1 flex flex-col overflow-y-auto custom-scrollbar">
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 flex-1">
              {/* Register: Username */}
              {!isLogin && (
                <div>
                  <label className="flex items-center gap-1.5 mb-1.5 text-[9px] font-black text-gs-muted uppercase tracking-widest">
                    <User className="w-3 h-3 text-gs-green" /> Username
                  </label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Masukkan username"
                    className="w-full h-11 rounded-2xl bg-gs-soft border border-gs-line px-4 text-[13px] font-semibold text-gs-dark outline-none focus:border-gs-green focus:ring-1 focus:ring-gs-green/30 transition-all placeholder:text-gray-400" />
                </div>
              )}

              {/* NOMOR WHATSAPP */}
              <div>
                <label className="flex items-center gap-1.5 mb-1.5 text-[9px] font-black text-gs-muted uppercase tracking-widest">
                  <Phone className="w-3 h-3 text-gs-green" /> NOMOR WHATSAPP
                </label>
                <div className="flex items-center h-11 rounded-2xl bg-gs-soft border border-gs-line overflow-hidden focus-within:border-gs-green focus-within:ring-1 focus-within:ring-gs-green/30 transition-all">
                  <div className="h-full px-3 flex items-center bg-gs-green3 text-white border-r border-gs-line">
                    <span className="text-[11px] font-bold">+62</span>
                  </div>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="81234567890"
                    className="flex-1 h-full bg-transparent px-3 text-[13px] font-semibold text-gs-dark outline-none placeholder:text-gray-400" />
                </div>
              </div>

              {/* KATA SANDI */}
              <div>
                <label className="flex items-center gap-1.5 mb-1.5 text-[9px] font-black text-gs-muted uppercase tracking-widest">
                  <Lock className="w-3 h-3 text-gs-green" /> KATA SANDI
                </label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Masukkan kata sandi"
                    className="w-full h-11 rounded-2xl bg-gs-soft border border-gs-line px-4 pr-16 text-[13px] font-semibold text-gs-dark outline-none focus:border-gs-green focus:ring-1 focus:ring-gs-green/30 transition-all placeholder:text-gray-400" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-gs-green hover:text-gs-green3 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Register: Konfirmasi Sandi */}
              {!isLogin && (
                <div>
                  <label className="flex items-center gap-1.5 mb-1.5 text-[9px] font-black text-gs-muted uppercase tracking-widest">
                    <Lock className="w-3 h-3 text-gs-green" /> KONFIRMASI SANDI
                  </label>
                  <div className="relative">
                    <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Konfirmasi kata sandi"
                      className="w-full h-11 rounded-2xl bg-gs-soft border border-gs-line px-4 pr-16 text-[13px] font-semibold text-gs-dark outline-none focus:border-gs-green focus:ring-1 focus:ring-gs-green/30 transition-all placeholder:text-gray-400" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-gs-green hover:text-gs-green3 transition-colors">
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Register: Kode Referral */}
              {!isLogin && (
                <div>
                  <label className="flex items-center gap-1.5 mb-1.5 text-[9px] font-black text-gs-muted uppercase tracking-widest">
                    <Gift className="w-3 h-3 text-gs-gold" /> KODE REFERRAL OPSIONAL
                  </label>
                  <input type="text" value={refCode} onChange={(e) => setRefCode(e.target.value.toUpperCase())} placeholder="Masukkan kode referral"
                    className="w-full h-11 rounded-2xl bg-gs-soft border border-gs-line px-4 text-[13px] font-semibold text-gs-dark outline-none focus:border-gs-green focus:ring-1 focus:ring-gs-green/30 transition-all placeholder:text-gray-400 uppercase" />
                </div>
              )}

              {/* Register: Math Verification */}
              {!isLogin && (
                <div>
                  <label className="flex items-center gap-1.5 mb-1.5 text-[9px] font-black text-gs-muted uppercase tracking-widest">
                    <Shield className="w-3 h-3 text-gs-green" /> Verifikasi Keamanan
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="h-11 px-4 rounded-2xl bg-gs-green3 text-white flex items-center gap-2">
                      <span className="text-[14px] font-black">{mathA} + {mathB}</span>
                    </div>
                    <input type="number" value={mathAnswer} onChange={(e) => setMathAnswer(e.target.value)} placeholder="Jawab"
                      className="w-20 h-11 rounded-2xl bg-gs-soft border border-gs-line px-3 text-[13px] font-semibold text-gs-dark outline-none focus:border-gs-green focus:ring-1 focus:ring-gs-green/30 transition-all text-center placeholder:text-gray-400" />
                    <button type="button" onClick={refreshMath}
                      className="h-11 w-11 rounded-2xl bg-gs-soft border border-gs-line grid place-items-center hover:bg-gs-green hover:text-white text-gs-green transition-colors">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Login: Remember + Forgot */}
              {isLogin && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded accent-gs-green" />
                    <span className="text-[10px] font-semibold text-gs-muted">Ingat akun</span>
                  </label>
                  <button type="button" className="text-[10px] font-bold text-orange-500 hover:underline">Lupa sandi?</button>
                </div>
              )}

              {/* Register: Terms */}
              {!isLogin && (
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 rounded accent-gs-green mt-0.5" />
                  <span className="text-[9px] font-semibold text-gs-muted leading-relaxed">
                    Saya menyetujui proses pendaftaran dan memahami keamanan akun TrendEdge.
                  </span>
                </label>
              )}

              {/* Submit Button */}
              <button type="submit" disabled={loading}
                className="w-full h-12 rounded-2xl overflow-hidden relative text-white text-[12px] font-black tracking-widest uppercase flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-70"
                style={{ background: 'linear-gradient(135deg, #064e3b 0%, #064e3b 50%, #059669 100%)' }}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-shimmer" />
                <span className="relative z-10 flex items-center gap-2">
                  {loading ? (
                    <div className="w-5 h-5 rounded-full border-[3px] border-white/30 border-t-white animate-spin" />
                  ) : (
                    <>
                      {isLogin ? 'MASUK SEKARANG' : 'DAFTAR SEKARANG'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </span>
              </button>

              {/* Switch Login/Register */}
              <p className="text-center text-[10px] font-semibold text-gs-muted">
                {isLogin ? (
                  <>Belum punya akun? <span className="text-gs-green font-black cursor-pointer hover:underline" onClick={() => { setIsLogin(false); refreshMath(); }}>Daftar TrendEdge</span></>
                ) : (
                  <>Sudah punya akun? <span className="text-gs-green font-black cursor-pointer hover:underline" onClick={() => setIsLogin(true)}>Masuk TrendEdge</span></>
                )}
              </p>

              {/* Demo Account */}
              <div className="rounded-2xl p-3 bg-gs-soft border border-gs-line flex items-center justify-between gap-2">
                <div>
                  <b className="block text-[10px] font-black text-gs-green3">Akun Demo</b>
                  <span className="block mt-0.5 text-[8px] font-bold text-gs-muted">+62 81234567890 / demo123</span>
                </div>
                <button type="button" onClick={() => { setPhone('081234567890'); setPassword('demo123'); setIsLogin(true); }}
                  className="text-[8px] font-black text-white bg-gs-green px-3 py-1.5 rounded-lg hover:bg-gs-green3 transition-colors">
                  Gunakan
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-3 pb-2">
          <div className="text-center mb-2">
            <b className="block text-[9px] md:text-[10px] font-black text-gs-green3">Legalitas Perusahaan</b>
            <span className="block mt-0.5 text-[8px] md:text-[9px] font-semibold text-gs-muted">Halaman resmi TrendEdge</span>
          </div>
          <div className="flex items-center justify-center gap-3 mb-2">
            <Shield className="w-4 h-4 text-gs-green" />
            <CheckCircle className="w-4 h-4 text-gs-gold" />
            <Lock className="w-4 h-4 text-gs-green" />
          </div>
          <div className="flex items-center justify-center gap-2 text-[8px] md:text-[9px] font-bold text-gs-muted">
            <span>Investasi Aman</span>
            <span>•</span>
            <span>Market Live</span>
            <span>•</span>
            <span>125K++ Pengguna</span>
          </div>
        </div>
        </div>{/* end max-w-md wrapper */}
      </div>{/* end right-side container */}
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
  const [bonuses, setBonuses] = useState<BonusItem[]>([])
  const [promos, setPromos] = useState<PromoItem[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])

  const [activeTab, setActiveTab] = useState<string>('home')
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null)
  const [showStockDetail, setShowStockDetail] = useState(false)
  const [contractModal, setContractModal] = useState(false)
  const [contractAmount, setContractAmount] = useState('')
  const [contractDuration, setContractDuration] = useState(30)
  const [contractLoading, setContractLoading] = useState(false)
  const [userContracts, setUserContracts] = useState<StockContract[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [stockFilter, setStockFilter] = useState('all')
  const [refreshing, setRefreshing] = useState(false)
  const [showNotifPanel, setShowNotifPanel] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')
  const [depositMethod, setDepositMethod] = useState('bank_transfer')
  const [depositLoading, setDepositLoading] = useState(false)
  const [financeTab, setFinanceTab] = useState<'deposit' | 'withdraw'>('deposit')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawLoading, setWithdrawLoading] = useState(false)

  // ============ DEPOSIT REDESIGN STATE ============
  const [depositCategory, setDepositCategory] = useState<'bank' | 'ewallet' | 'qris'>('bank')
  const [depositBankMethod, setDepositBankMethod] = useState('BCA')
  const [depositEwalletMethod, setDepositEwalletMethod] = useState('GOPAY')

  // ============ WITHDRAW REDESIGN STATE ============
  const [withdrawCategory, setWithdrawCategory] = useState<'bank' | 'ewallet' | 'crypto'>('bank')
  const [withdrawBankMethod, setWithdrawBankMethod] = useState('BCA')
  const [withdrawEwalletMethod, setWithdrawEwalletMethod] = useState('GOPAY')
  const [withdrawCryptoMethod, setWithdrawCryptoMethod] = useState('USDT_TRC20')
  const [withdrawAccountNumber, setWithdrawAccountNumber] = useState('')
  const [withdrawAccountHolder, setWithdrawAccountHolder] = useState('')

  // ============ REFERRAL MISSION CLAIM STATE ============
  const [claimedMissions, setClaimedMissions] = useState<Set<number>>(new Set())

  // ============ PROMO VIDEO MISSION STATE ============
  const [promoPlatform, setPromoPlatform] = useState<'tiktok' | 'instagram' | 'youtube' | 'facebook' | 'twitter'>('tiktok')
  const [promoVideoLink, setPromoVideoLink] = useState('')
  const [promoVideos, setPromoVideos] = useState<{ id: string; platform: string; link: string; views: number; likes: number; bonus: number; status: 'pending' | 'verified' | 'rejected'; submittedAt: string }[]>([])
  const [promoSubmitLoading, setPromoSubmitLoading] = useState(false)
  const [promoClaimLoadingId, setPromoClaimLoadingId] = useState<string | null>(null)
  const [profileEdit, setProfileEdit] = useState(false)
  const [profileForm, setProfileForm] = useState({ name: '', email: '', bankName: '', bankAccount: '', bankHolder: '' })
  const [referralInfo, setReferralInfo] = useState({ code: '', totalReferred: 0, totalBonus: 0, referredUsers: [] as { name: string; date: string; bonus: number }[], totalMembers: 0, totalDeposit: 0, totalCommission: 0, pendingCommission: 0, claimedCommission: 0, tiers: [{ level: 1, commissionPercent: 10, members: 0, activeMembers: 0, inactiveMembers: 0, deposit: 0, commission: 0 }, { level: 2, commissionPercent: 3, members: 0, activeMembers: 0, inactiveMembers: 0, deposit: 0, commission: 0 }, { level: 3, commissionPercent: 1, members: 0, activeMembers: 0, inactiveMembers: 0, deposit: 0, commission: 0 }], history: [] as { id: string; name: string; date: string; level: number; deposit: number; commission: number; status: string }[] })
  const [claimLoading, setClaimLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [txFilter, setTxFilter] = useState('all')
  const [showSideMenu, setShowSideMenu] = useState(false)
  const [showBalance, setShowBalance] = useState(true)
  const [investProducts, setInvestProducts] = useState<InvestProduct[]>([])
  const [userInvestments, setUserInvestments] = useState<UserInvestment[]>([])
  const [investCategory, setInvestCategory] = useState<'potential' | 'dividen'>('potential')
  const [showInvestModal, setShowInvestModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<InvestProduct | null>(null)
  const [investLoading, setInvestLoading] = useState(false)
  const [claimLoadingId, setClaimLoadingId] = useState<string | null>(null)
  const [investMovement, setInvestMovement] = useState<Map<string, {change: number; changePercent: number}>>(new Map())
  const [contractClaimLoadingId, setContractClaimLoadingId] = useState<string | null>(null)
  const initialized = useRef(false)

  // ============ DAILY CHECK & TASKS STATE ============
  const [dailyCheckStatus, setDailyCheckStatus] = useState<DailyCheckStatus>({ streak: 0, lastCheckDate: null, canCheckToday: true, todayReward: 0 })
  const [dailyCheckLoading, setDailyCheckLoading] = useState(false)
  const [dailyCheckReward, setDailyCheckReward] = useState<number | null>(null)
  const [showDailyCheckModal, setShowDailyCheckModal] = useState(false)
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [tasksLoading, setTasksLoading] = useState(false)
  const [showTasksModal, setShowTasksModal] = useState(false)
  const [taskClaimingId, setTaskClaimingId] = useState<string | null>(null)

  // ============ WELCOME MODAL STATE ============
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  const [welcomeDontShow, setWelcomeDontShow] = useState(false)

  // ============ INVEST DETAIL MODAL STATE ============
  const [showInvestDetailModal, setShowInvestDetailModal] = useState(false)
  const [selectedDetailProduct, setSelectedDetailProduct] = useState<InvestProduct | null>(null)
  const [investDetailAutoProfit, setInvestDetailAutoProfit] = useState(true)
  const [investChartType, setInvestChartType] = useState<'area' | 'line' | 'candle' | 'bar'>('area')
  const [investTimeframe, setInvestTimeframe] = useState<'1H' | '1D' | '1W' | '1M' | 'ALL'>('1D')

  // ============ SINYAL PRO STATE ============
  const [sinyalPositions, setSinyalPositions] = useState<{
    id: string; stockId: string; stockCode: string; stockName: string;
    direction: 'NAIK' | 'TURUN'; amount: number; duration: number;
    startPrice: number; startTime: number; profitPercent: number;
    status: 'active' | 'won' | 'lost';
  }[]>([])
  const [sinyalAutoMode, setSinyalAutoMode] = useState(false)
  const [sinyalDirection, setSinyalDirection] = useState<'NAIK' | 'TURUN'>('NAIK')
  const [sinyalAmount, setSinyalAmount] = useState('')
  const [sinyalDuration, setSinyalDuration] = useState(30)
  const [showSinyalModal, setShowSinyalModal] = useState(false)
  const [selectedSinyalStock, setSelectedSinyalStock] = useState<Stock | null>(null)
  const [sinyalResult, setSinyalResult] = useState<{won: boolean; profit: number} | null>(null)
  const [sinyalTimer, setSinyalTimer] = useState(0)
  const [sinyalActive, setSinyalActive] = useState(false)
  const [sinyalAutoPending, setSinyalAutoPending] = useState(false)
  const [sinyalChartType, setSinyalChartType] = useState<'area' | 'line' | 'candle' | 'bar' | 'mountain' | 'step' | 'histogram' | 'hollow'>('candle')
  const [sinyalTimeframe, setSinyalTimeframe] = useState<'1M' | '5M' | '15M' | '1H' | '4H' | '1D' | '1W' | 'ALL'>('1H')
  const [sinyalChartData, setSinyalChartData] = useState<Map<string, {idx: number; value: number}[]>>(new Map())
  const sinyalChartSimRef = useRef<Map<string, {val: number; baseVal: number; momentum: number; initialized: boolean}>>(new Map())
  const [sinyalChartStock, setSinyalChartStock] = useState<Stock | null>(null)
  const [sinyalShowMA7, setSinyalShowMA7] = useState(true)
  const [sinyalShowMA25, setSinyalShowMA25] = useState(true)
  const [sinyalShowMA99, setSinyalShowMA99] = useState(false)
  const [sinyalShowBB, setSinyalShowBB] = useState(false)
  const [sinyalShowVolume, setSinyalShowVolume] = useState(true)
  const [sinyalShowRSI, setSinyalShowRSI] = useState(false)
  const [sinyalCrosshair, setSinyalCrosshair] = useState<{x: number; y: number; idx: number} | null>(null)

  // ============ LIVE INVESTMENT CHART DATA ============
  const [investChartData, setInvestChartData] = useState<Map<string, {idx: number; value: number}[]>>(new Map())
  const investChartSimRef = useRef<Map<string, {val: number; baseVal: number; momentum: number; initialized: boolean}>>(new Map())
  const investChartTickRef = useRef(0)

  // Helper: derive OHLC candlestick data from line data
  const getCandleData = useCallback((data: {idx: number; value: number}[]) => {
    if (data.length < 4) return []
    const candles: {idx: number; open: number; high: number; low: number; close: number}[] = []
    const groupSize = Math.max(2, Math.floor(data.length / 24))
    for (let i = 0; i < data.length; i += groupSize) {
      const group = data.slice(i, i + groupSize)
      if (group.length < 2) continue
      candles.push({
        idx: candles.length,
        open: group[0].value,
        high: Math.max(...group.map(g => g.value)),
        low: Math.min(...group.map(g => g.value)),
        close: group[group.length - 1].value,
      })
    }
    return candles
  }, [])

  // Helper: get data based on timeframe
  const getDataForTimeframe = useCallback((data: {idx: number; value: number}[], tf: string) => {
    if (data.length === 0) return data
    switch (tf) {
      case '1M': return data.slice(-15)
      case '5M': return data.slice(-25)
      case '15M': return data.slice(-35)
      case '1H': return data.slice(-50)
      case '4H': return data.slice(-75)
      case '1D': return data.slice(-100)
      case '1W': return data
      case 'ALL': return data
      default: return data
    }
  }, [])

  // Helper: compute Moving Average
  const computeMA = useCallback((data: {idx: number; value: number}[], period: number): (number | null)[] => {
    return data.map((_, i) => {
      if (i < period - 1) return null
      const slice = data.slice(i - period + 1, i + 1)
      return Math.round(slice.reduce((s, d) => s + d.value, 0) / period)
    })
  }, [])

  // Helper: compute Bollinger Bands
  const computeBB = useCallback((data: {idx: number; value: number}[], period: number = 20, mult: number = 2) => {
    const upper: (number | null)[] = []
    const lower: (number | null)[] = []
    const mid: (number | null)[] = []
    data.forEach((_, i) => {
      if (i < period - 1) { upper.push(null); lower.push(null); mid.push(null); return }
      const slice = data.slice(i - period + 1, i + 1)
      const mean = slice.reduce((s, d) => s + d.value, 0) / period
      const std = Math.sqrt(slice.reduce((s, d) => s + Math.pow(d.value - mean, 2), 0) / period)
      mid.push(Math.round(mean))
      upper.push(Math.round(mean + mult * std))
      lower.push(Math.round(mean - mult * std))
    })
    return { upper, lower, mid }
  }, [])

  // Helper: generate volume data from price data
  const generateVolume = useCallback((data: {idx: number; value: number}[]): {idx: number; vol: number; up: boolean}[] => {
    return data.map((d, i) => ({
      idx: d.idx,
      vol: Math.round(50000 + Math.random() * 500000 + (i > 0 ? Math.abs(d.value - data[i-1].value) * 10 : 0)),
      up: i === 0 || d.value >= data[i-1].value
    }))
  }, [])

  // Helper: compute RSI (Relative Strength Index)
  const computeRSI = useCallback((data: {idx: number; value: number}[], period: number = 14): (number | null)[] => {
    if (data.length < period + 1) return data.map(() => null)
    const results: (number | null)[] = data.map(() => null)
    let avgGain = 0, avgLoss = 0
    for (let i = 1; i <= period; i++) {
      const diff = data[i].value - data[i-1].value
      if (diff > 0) avgGain += diff; else avgLoss += Math.abs(diff)
    }
    avgGain /= period; avgLoss /= period
    results[period] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss))
    for (let i = period + 1; i < data.length; i++) {
      const diff = data[i].value - data[i-1].value
      const gain = diff > 0 ? diff : 0
      const loss = diff < 0 ? Math.abs(diff) : 0
      avgGain = (avgGain * (period - 1) + gain) / period
      avgLoss = (avgLoss * (period - 1) + loss) / period
      results[i] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss))
    }
    return results
  }, [])

  // ============ CORE TRENDING ENGINE ============
  // Real stock chart simulation: visible trends with proper drift/volatility ratio
  // Key insight: Real trending stocks have drift that DOMINATES noise
  // A stock trending up 2% over 50 candles needs ~0.04% drift/candle with ~0.15% noise
  const gbmTick = useCallback((currentPrice: number, basePrice: number, trendDir: number, trendStr: number, volRegime: number): number => {
    // Drift: 0.15-0.6% per tick depending on strength — THIS is what makes trends VISIBLE
    // trendStr ranges 0.3-1.0, so drift = 0.0005 to 0.006 (0.05% to 0.6%)
    const drift = trendDir * 0.004 * trendStr
    // Volatility: 0.08-0.25% per tick — LOWER than drift so trends are clearly visible
    const vol = (0.0008 + volRegime * 0.0017)
    // Box-Muller transform for normal distribution
    const u1 = Math.random()
    const u2 = Math.random()
    const z = Math.sqrt(-2 * Math.log(Math.max(u1, 1e-10))) * Math.cos(2 * Math.PI * u2)
    // GBM step
    const returnPct = drift + vol * z
    let newPrice = currentPrice * (1 + returnPct)
    // Soft boundary: only pull back if price deviates >8% from base
    // This allows REAL trends to develop without artificial mean reversion
    const deviation = (newPrice - basePrice) / basePrice
    if (Math.abs(deviation) > 0.08) {
      newPrice += (basePrice - newPrice) * 0.002
    }
    return Math.round(newPrice)
  }, [])

  // Initialize investment area chart data when products load — REAL trending
  useEffect(() => {
    if (investProducts.length === 0) return
    setInvestChartData(prev => {
      const next = new Map(prev)
      let changed = false
      investProducts.forEach(p => {
        if (investChartSimRef.current.has(p.id)) return
        changed = true
        const baseVal = p.modal
        const pts: {idx: number; value: number}[] = []
        let val = baseVal * (0.98 + Math.random() * 0.04)
        let currentTrend = Math.random() > 0.5 ? 1 : -1
        let trendStrength = 0.5 + Math.random() * 0.5
        let volRegime = 0.4 + Math.random() * 0.4
        let ticksInTrend = 0
        let trendDuration = 20 + Math.floor(Math.random() * 25)
        for (let i = 0; i < 60; i++) {
          ticksInTrend++
          // Trend persistence: 85% continue
          if (ticksInTrend >= trendDuration) {
            currentTrend = Math.random() > 0.15 ? currentTrend : -currentTrend
            trendStrength = 0.4 + Math.random() * 0.6
            volRegime = 0.3 + Math.random() * 0.5
            ticksInTrend = 0
            trendDuration = 20 + Math.floor(Math.random() * 25)
          }
          volRegime = volRegime * 0.97 + (0.3 + Math.random() * 0.5) * 0.03
          volRegime = Math.max(0.2, Math.min(1.2, volRegime))
          const momentumBoost = 1 + (ticksInTrend / trendDuration) * 0.3
          val = gbmTick(val, baseVal, currentTrend, trendStrength * momentumBoost, volRegime)
          pts.push({ idx: i, value: val })
        }
        // End near current modal price
        pts.push({ idx: 60, value: Math.round(baseVal * (0.998 + Math.random() * 0.004)) })
        next.set(p.id, pts)
        investChartSimRef.current.set(p.id, { val: pts[pts.length - 1].value, baseVal, momentum: 0, initialized: true })
      })
      return changed ? next : prev
    })
  }, [investProducts, gbmTick])

  // Live investment chart update — every 3s with REAL trending
  useEffect(() => {
    const trendState = new Map<string, {direction: number; strength: number; volRegime: number; phase: number; ticksInTrend: number; trendDuration: number}>()
    const interval = setInterval(() => {
      const simMap = investChartSimRef.current
      if (simMap.size === 0) return
      investChartTickRef.current += 1
      const tick = investChartTickRef.current

      simMap.forEach((sim, productId) => {
        if (!trendState.has(productId)) {
          trendState.set(productId, {
            direction: Math.random() > 0.5 ? 1 : -1,
            strength: 0.5 + Math.random() * 0.5,
            volRegime: 0.4 + Math.random() * 0.4,
            phase: 0,
            ticksInTrend: 0,
            trendDuration: 25 + Math.floor(Math.random() * 35)
          })
        }
        const ts = trendState.get(productId)!
        ts.phase++
        ts.ticksInTrend++

        // Trend persistence: 85% continue — REAL trending
        if (ts.ticksInTrend >= ts.trendDuration) {
          ts.direction = Math.random() > 0.15 ? ts.direction : -ts.direction
          ts.strength = 0.4 + Math.random() * 0.6
          ts.ticksInTrend = 0
          ts.trendDuration = 25 + Math.floor(Math.random() * 40)
        }

        ts.volRegime = ts.volRegime * 0.97 + (0.3 + Math.random() * 0.5) * 0.03
        ts.volRegime = Math.max(0.2, Math.min(1.2, ts.volRegime))

        const momentumBoost = 1 + (ts.ticksInTrend / ts.trendDuration) * 0.3
        sim.val = gbmTick(sim.val, sim.baseVal, ts.direction, ts.strength * momentumBoost, ts.volRegime)

        setInvestChartData(prev => {
          const existing = prev.get(productId)
          if (!existing) return prev
          const next = [...existing, { idx: tick + 60, value: sim.val }]
          const trimmed = next.length > 80 ? next.slice(-80) : next
          const nextMap = new Map(prev)
          nextMap.set(productId, trimmed)
          return nextMap
        })
      })

      // Also update investMovement
      setInvestMovement(prev => {
        const next = new Map(prev)
        simMap.forEach((sim, productId) => {
          const changePercent = ((sim.val - sim.baseVal) / sim.baseVal) * 100
          next.set(productId, { change: Math.round(sim.val - sim.baseVal), changePercent: parseFloat(changePercent.toFixed(2)) })
        })
        return next
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [gbmTick])


  const initialized2 = useRef(false)
  const stocksRef = useRef<Stock[]>([])
  useEffect(() => { stocksRef.current = stocks }, [stocks])

  // ============ LIVE PRICE CHART STATE ============
  const [liveBuyChart, setLiveBuyChart] = useState<{time: string; price: number}[]>([])
  const [liveSellChart, setLiveSellChart] = useState<{time: string; price: number}[]>([])
  const [liveBuyPrice, setLiveBuyPrice] = useState(0)
  const [liveSellPrice, setLiveSellPrice] = useState(0)
  const [liveChartActive, setLiveChartActive] = useState(false)
  const liveChartRef = useRef<{buyPrice: number; sellPrice: number; trend: number; momentum: number; phase: number}>({buyPrice: 0, sellPrice: 0, trend: 0, momentum: 0, phase: 0})
  const MAX_CHART_POINTS = 60

  // ============ LIVE IHSG CHART STATE (stable, always running) ============
  const [ihsgChartData, setIhsgChartData] = useState<{idx: number; value: number}[]>([])
  const ihsgChartRef = useRef<{val: number; baseVal: number; initialized: boolean}>({val: 0, baseVal: 0, initialized: false})

  // Initialize IHSG chart data ONCE when indices first loads
  useEffect(() => {
    const ihsgIdx = indices.find(idx => idx.code === 'IHSG') || indices[0]
    if (!ihsgIdx || ihsgChartRef.current.initialized) return

    ihsgChartRef.current.initialized = true
    const baseVal = ihsgIdx.value
    ihsgChartRef.current.baseVal = baseVal
    const isUp = ihsgIdx.changePercent >= 0

    // Generate historical data with REAL trending
    const pts: {idx: number; value: number}[] = []
    let val = baseVal * (1 + (isUp ? -0.01 : 0.01))
    let currentTrend = isUp ? 1 : -1
    let trendStrength = 0.5 + Math.random() * 0.5
    let volRegime = 0.4 + Math.random() * 0.4
    let ticksInTrend = 0
    let trendDuration = 20 + Math.floor(Math.random() * 25)

    for (let i = 0; i < 50; i++) {
      ticksInTrend++
      if (ticksInTrend >= trendDuration) {
        currentTrend = Math.random() > 0.15 ? currentTrend : -currentTrend
        trendStrength = 0.4 + Math.random() * 0.6
        volRegime = 0.3 + Math.random() * 0.5
        ticksInTrend = 0
        trendDuration = 20 + Math.floor(Math.random() * 25)
      }
      volRegime = volRegime * 0.97 + (0.3 + Math.random() * 0.5) * 0.03
      volRegime = Math.max(0.2, Math.min(1.2, volRegime))
      const momentumBoost = 1 + (ticksInTrend / trendDuration) * 0.3
      val = gbmTick(val, baseVal, currentTrend, trendStrength * momentumBoost, volRegime)
      pts.push({ idx: i, value: val })
    }
    // End at actual value
    pts.push({ idx: 50, value: baseVal })
    setIhsgChartData(pts)
    ihsgChartRef.current = { val: baseVal, baseVal, initialized: true }
  }, [indices, gbmTick])

  // IHSG live update interval — REAL trending, 3s interval
  useEffect(() => {
    let ihsgTrendDir = Math.random() > 0.5 ? 1 : -1
    let ihsgTrendStr = 0.5 + Math.random() * 0.5
    let ihsgVolRegime = 0.4 + Math.random() * 0.4
    let ihsgPhase = 0
    let ihsgTicksInTrend = 0
    let ihsgTrendDuration = 25 + Math.floor(Math.random() * 30)
    const interval = setInterval(() => {
      const ref = ihsgChartRef.current
      if (!ref.initialized) return
      ihsgPhase++
      ihsgTicksInTrend++
      // Trend persistence: 85% continue — REAL trending
      if (ihsgTicksInTrend >= ihsgTrendDuration) {
        ihsgTrendDir = Math.random() > 0.15 ? ihsgTrendDir : -ihsgTrendDir
        ihsgTrendStr = 0.4 + Math.random() * 0.6
        ihsgTicksInTrend = 0
        ihsgTrendDuration = 25 + Math.floor(Math.random() * 35)
      }
      ihsgVolRegime = ihsgVolRegime * 0.97 + (0.3 + Math.random() * 0.5) * 0.03
      ihsgVolRegime = Math.max(0.2, Math.min(1.2, ihsgVolRegime))

      const momentumBoost = 1 + (ihsgTicksInTrend / ihsgTrendDuration) * 0.3
      ref.val = gbmTick(ref.val, ref.baseVal, ihsgTrendDir, ihsgTrendStr * momentumBoost, ihsgVolRegime)

      setIhsgChartData(prev => {
        if (prev.length === 0) return prev
        const nextIdx = prev[prev.length - 1].idx + 1
        const next = [...prev, { idx: nextIdx, value: Math.round(ref.val) }]
        return next.length > 60 ? next.slice(-60) : next
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [gbmTick])

  // ============ MEMOIZED SPARKLINE DATA (prevents re-render jitter) ============
  const sparklineCache = useRef<Map<string, {i: number; p: number}[]>>(new Map())
  const sparklineSimRef = useRef<Map<string, {val: number; prevD: number; trend: number; momentum: number}>>(new Map())

  const getSparklineData = useCallback((stock: Stock) => {
    // Only generate ONCE per stock ID — never regenerate on price changes
    if (sparklineCache.current.has(stock.id)) {
      return sparklineCache.current.get(stock.id)!
    }
    const pts: {i: number; p: number}[] = []
    const mainDir = stock.changePercent >= 0 ? 1 : -1
    let p = stock.open
    let momentum = 0

    for (let i = 0; i < 25; i++) {
      const dir = Math.random() > 0.5 ? 1 : -1
      // Adaptive step: ensures ±1 visible change even for penny stocks (GOTO=74)
      const minStep = Math.max(1, stock.price * 0.0015)
      const stepSize = minStep * (0.8 + Math.random() * 1.2)
      const bias = mainDir * stock.price * 0.0003
      momentum = momentum * 0.25 + dir * stepSize + bias
      p += momentum
      // Adaptive mean reversion: stronger when far from target
      const reversionStrength = 0.01 + Math.abs(stock.price - p) / stock.price * 0.1
      p += (stock.price - p) * Math.min(reversionStrength, 0.05)
      pts.push({ i, p: Math.round(p) })
    }
    pts.push({ i: 25, p: Math.round(stock.price) })
    sparklineCache.current.set(stock.id, pts)
    // Save simulation state for live updates
    sparklineSimRef.current.set(stock.id, { val: stock.price, prevD: momentum * 0.25, trend: mainDir * stock.price * 0.0003, momentum: 0 })
    return pts
  }, [])

  // Live sparkline update — GBM trending every 3s
  useEffect(() => {
    const sparkTrendState = new Map<string, {direction: number; strength: number; volRegime: number; ticksInTrend: number; trendDuration: number}>()
    const interval = setInterval(() => {
      const currentStocks = stocksRef.current
      if (currentStocks.length === 0) return
      currentStocks.forEach(s => {
        const sim = sparklineSimRef.current.get(s.id)
        const cached = sparklineCache.current.get(s.id)
        if (!sim || !cached) return

        if (!sparkTrendState.has(s.id)) {
          sparkTrendState.set(s.id, {
            direction: sim.trend >= 0 ? 1 : -1,
            strength: 0.5 + Math.random() * 0.5,
            volRegime: 0.4 + Math.random() * 0.4,
            ticksInTrend: 0,
            trendDuration: 20 + Math.floor(Math.random() * 30)
          })
        }
        const ts = sparkTrendState.get(s.id)!
        ts.ticksInTrend++
        // Trend persistence: 85% continue
        if (ts.ticksInTrend >= ts.trendDuration) {
          ts.direction = Math.random() > 0.15 ? ts.direction : -ts.direction
          ts.strength = 0.4 + Math.random() * 0.6
          ts.ticksInTrend = 0
          ts.trendDuration = 20 + Math.floor(Math.random() * 30)
        }
        ts.volRegime = ts.volRegime * 0.97 + (0.3 + Math.random() * 0.5) * 0.03
        ts.volRegime = Math.max(0.2, Math.min(1.2, ts.volRegime))

        const momentumBoost = 1 + (ts.ticksInTrend / ts.trendDuration) * 0.3
        sim.val = gbmTick(sim.val, s.price, ts.direction, ts.strength * momentumBoost, ts.volRegime)

        // Shift sparkline data left and add new point
        const newPts = cached.slice(1).map((pt, idx) => ({ i: idx, p: pt.p }))
        newPts.push({ i: cached.length - 1, p: sim.val })
        sparklineCache.current.set(s.id, newPts)
      })
      // Force re-render by updating any state
      setStocks(prev => [...prev])
    }, 3000)
    return () => clearInterval(interval)
  }, [gbmTick])

  // ============ SINYAL PRO CHART DATA ============

  // Initialize chart data when stocks load — REAL trending with visible up/down phases
  useEffect(() => {
    if (stocks.length === 0) return
    setSinyalChartData(prev => {
      const next = new Map(prev)
      let changed = false
      stocks.forEach(s => {
        if (sinyalChartSimRef.current.has(s.id)) return
        changed = true
        const baseVal = s.price
        const pts: {idx: number; value: number}[] = []
        // Start 1-3% away from base to show the journey
        const mainDir = s.changePercent >= 0 ? 1 : -1
        let val = baseVal * (1 + (mainDir === 1 ? -0.02 : 0.02) * (0.5 + Math.random() * 0.5))
        let currentTrend = mainDir
        let trendStrength = 0.5 + Math.random() * 0.5
        let volRegime = 0.4 + Math.random() * 0.4
        let ticksInTrend = 0
        let trendDuration = 25 + Math.floor(Math.random() * 40) // 25-65 ticks per trend phase
        for (let i = 0; i < 120; i++) {
          ticksInTrend++
          // Trend persistence: 85% continue, 15% reverse — creates REAL trending
          if (ticksInTrend >= trendDuration) {
            currentTrend = Math.random() > 0.15 ? currentTrend : -currentTrend
            // Trend momentum: strengthening trends get stronger, new trends start moderate
            trendStrength = ticksInTrend > 40 ? Math.min(trendStrength * 1.1, 1.0) : (0.4 + Math.random() * 0.6)
            volRegime = 0.3 + Math.random() * 0.5
            ticksInTrend = 0
            trendDuration = 25 + Math.floor(Math.random() * 45) // 25-70 ticks
          }
          // Volatility clustering: smooth transitions (lighter)
          volRegime = volRegime * 0.97 + (0.3 + Math.random() * 0.5) * 0.03
          volRegime = Math.max(0.2, Math.min(1.2, volRegime))
          // Trend momentum: as trend persists, drift strengthens
          const momentumBoost = 1 + (ticksInTrend / trendDuration) * 0.3
          val = gbmTick(val, baseVal, currentTrend, trendStrength * momentumBoost, volRegime)
          pts.push({ idx: i, value: val })
        }
        // End near actual price with smooth convergence
        const lastVal = pts[pts.length - 1].value
        const targetVal = Math.round(baseVal * (0.998 + Math.random() * 0.004))
        // Blend last 5 points toward target for smooth ending
        for (let j = Math.max(0, pts.length - 5); j < pts.length; j++) {
          const blend = (j - (pts.length - 5)) / 5
          pts[j] = { ...pts[j], value: Math.round(pts[j].value * (1 - blend) + targetVal * blend) }
        }
        next.set(s.id, pts)
        sinyalChartSimRef.current.set(s.id, { val: targetVal, baseVal, momentum: 0, initialized: true })
      })
      return changed ? next : prev
    })
  }, [stocks, gbmTick])

  // Live sinyal chart update — every 3s with REAL trending
  useEffect(() => {
    const simMap = sinyalChartSimRef.current
    const trendState = new Map<string, {direction: number; strength: number; volRegime: number; phase: number; ticksInTrend: number; trendDuration: number}>()
    const interval = setInterval(() => {
      if (simMap.size === 0) return

      simMap.forEach((sim, stockId) => {
        if (!trendState.has(stockId)) {
          trendState.set(stockId, {
            direction: Math.random() > 0.5 ? 1 : -1,
            strength: 0.5 + Math.random() * 0.5,
            volRegime: 0.4 + Math.random() * 0.4,
            phase: 0,
            ticksInTrend: 0,
            trendDuration: 30 + Math.floor(Math.random() * 40) // 30-70 ticks per trend
          })
        }
        const ts = trendState.get(stockId)!
        ts.phase++
        ts.ticksInTrend++

        // Trend persistence: 85% continue, 15% reverse — REAL trending behavior
        if (ts.ticksInTrend >= ts.trendDuration) {
          ts.direction = Math.random() > 0.15 ? ts.direction : -ts.direction
          ts.strength = 0.4 + Math.random() * 0.6
          ts.ticksInTrend = 0
          ts.trendDuration = 30 + Math.floor(Math.random() * 45) // 30-75 ticks
        }

        // Volatility clustering (lighter)
        ts.volRegime = ts.volRegime * 0.97 + (0.3 + Math.random() * 0.5) * 0.03
        ts.volRegime = Math.max(0.2, Math.min(1.2, ts.volRegime))

        // Trend momentum: drift strengthens as trend persists
        const momentumBoost = 1 + (ts.ticksInTrend / ts.trendDuration) * 0.3
        sim.val = gbmTick(sim.val, sim.baseVal, ts.direction, ts.strength * momentumBoost, ts.volRegime)

        setSinyalChartData(prev => {
          const next = new Map(prev)
          const existing = next.get(stockId)
          if (!existing) return prev
          const newPts = [...existing.slice(1), { idx: existing[existing.length - 1].idx + 1, value: sim.val }]
          next.set(stockId, newPts.length > 150 ? newPts.slice(-150) : newPts)
          return next
        })
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [gbmTick])

  // Auto-select first stock for sinyal chart if none selected
  useEffect(() => {
    if (!sinyalChartStock && stocks.length > 0) {
      setSinyalChartStock(stocks[0])
    }
  }, [stocks, sinyalChartStock])

  // Helper to get sinyal chart data for a stock
  const getSinyalChartData = useCallback((stockId: string) => {
    return sinyalChartData.get(stockId) || []
  }, [sinyalChartData])

  // ============ HELPER: compute Y-axis domain from chart data ============
  const computeYDomain = useCallback((data: {price: number}[], paddingPercent = 0.08): [number, number] => {
    if (data.length === 0) return [0, 100]
    const prices = data.map(d => d.price)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const range = max - min || 1
    const pad = range * paddingPercent
    return [Math.floor(min - pad), Math.ceil(max + pad)]
  }, [])

  // Live price simulation — REAL trending stock movement
  useEffect(() => {
    if (!selectedStock || (!showStockDetail && !contractModal)) {
      setLiveChartActive(false)
      return
    }
    const basePrice = selectedStock.price
    const spread = basePrice * 0.002
    let buyPrice = basePrice - spread / 2
    let sellPrice = basePrice + spread / 2
    let midPrice = basePrice
    let phase = 0

    // Build historical data with REAL trending
    const initialBuy: {time: string; price: number}[] = []
    const initialSell: {time: string; price: number}[] = []
    let tempMid = basePrice
    let histTrendDir = Math.random() > 0.5 ? 1 : -1
    let histTrendStr = 0.5 + Math.random() * 0.5
    let histVolRegime = 0.4 + Math.random() * 0.4
    let histTicksInTrend = 0
    let histTrendDuration = 15 + Math.floor(Math.random() * 20)
    for (let i = 40; i >= 1; i--) {
      histTicksInTrend++
      // Trend persistence: 85% continue
      if (histTicksInTrend >= histTrendDuration) {
        histTrendDir = Math.random() > 0.15 ? histTrendDir : -histTrendDir
        histTrendStr = 0.4 + Math.random() * 0.6
        histVolRegime = 0.3 + Math.random() * 0.5
        histTicksInTrend = 0
        histTrendDuration = 15 + Math.floor(Math.random() * 20)
      }
      histVolRegime = histVolRegime * 0.97 + (0.3 + Math.random() * 0.5) * 0.03
      histVolRegime = Math.max(0.2, Math.min(1.2, histVolRegime))
      const momentumBoost = 1 + (histTicksInTrend / histTrendDuration) * 0.3
      tempMid = gbmTick(tempMid, basePrice, histTrendDir, histTrendStr * momentumBoost, histVolRegime)
      const now = Date.now() - i * 3000
      const timeStr = new Date(now).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit', second: '2-digit'})
      initialBuy.push({time: timeStr, price: Math.round(tempMid - spread / 2)})
      initialSell.push({time: timeStr, price: Math.round(tempMid + spread / 2)})
    }
    buyPrice = tempMid - spread / 2
    sellPrice = tempMid + spread / 2
    midPrice = tempMid
    setLiveBuyChart(initialBuy)
    setLiveSellChart(initialSell)
    setLiveBuyPrice(Math.round(buyPrice))
    setLiveSellPrice(Math.round(sellPrice))
    liveChartRef.current = {buyPrice, sellPrice, trend: 0, momentum: 0, phase}
    setLiveChartActive(true)

    // Live REAL trending
    let liveTrendDir = Math.random() > 0.5 ? 1 : -1
    let liveTrendStr = 0.5 + Math.random() * 0.5
    let liveVolRegime = 0.4 + Math.random() * 0.4
    let livePhase = 0
    let liveTicksInTrend = 0
    let liveTrendDuration = 20 + Math.floor(Math.random() * 25)
    const interval = setInterval(() => {
      phase++
      livePhase++
      liveTicksInTrend++
      // Trend persistence: 85% continue — REAL trending
      if (liveTicksInTrend >= liveTrendDuration) {
        liveTrendDir = Math.random() > 0.15 ? liveTrendDir : -liveTrendDir
        liveTrendStr = 0.4 + Math.random() * 0.6
        liveTicksInTrend = 0
        liveTrendDuration = 20 + Math.floor(Math.random() * 25)
      }
      liveVolRegime = liveVolRegime * 0.97 + (0.3 + Math.random() * 0.5) * 0.03
      liveVolRegime = Math.max(0.2, Math.min(1.2, liveVolRegime))

      const momentumBoost = 1 + (liveTicksInTrend / liveTrendDuration) * 0.3
      midPrice = gbmTick(midPrice, basePrice, liveTrendDir, liveTrendStr * momentumBoost, liveVolRegime)
      buyPrice = midPrice - spread / 2
      sellPrice = midPrice + spread / 2
      if (sellPrice <= buyPrice) sellPrice = buyPrice + spread

      liveChartRef.current = {buyPrice, sellPrice, trend: 0, momentum: 0, phase}
      const now = new Date()
      const timeStr = now.toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit', second: '2-digit'})

      setLiveBuyChart(prev => {
        const next = [...prev, {time: timeStr, price: Math.round(buyPrice)}]
        return next.length > MAX_CHART_POINTS ? next.slice(-MAX_CHART_POINTS) : next
      })
      setLiveSellChart(prev => {
        const next = [...prev, {time: timeStr, price: Math.round(sellPrice)}]
        return next.length > MAX_CHART_POINTS ? next.slice(-MAX_CHART_POINTS) : next
      })
      setLiveBuyPrice(Math.round(buyPrice))
      setLiveSellPrice(Math.round(sellPrice))
    }, 3000)

    return () => {
      clearInterval(interval)
      setLiveChartActive(false)
    }
  }, [selectedStock, showStockDetail, contractModal, gbmTick])

  // ============ SINYAL PRO HELPERS & TIMER ============
  const calcSinyalProfit = useCallback((amount: number, duration: number): number => {
    const amountFactor = Math.min(amount / 10000000, 1)
    const durationFactor = (duration - 10) / (300 - 10)
    return 5 + (amountFactor * 15) + (durationFactor * 20)
  }, [])

  // Stock base daily profit rates (varies per stock, 5-12%)
  const getStockBaseRate = useCallback((code: string): number => {
    const rates: Record<string, number> = {
      AAPL: 5.2, NVDA: 8.5, MSFT: 5.8, GOOGL: 6.1, META: 7.2,
      AMZN: 6.8, TSLA: 9.2, AMD: 8.8, JPM: 5.0, V: 5.5,
      MA: 5.3, GS: 6.0, BAC: 5.1, PGR: 5.8, UNH: 5.5,
      JNJ: 5.0, PFE: 6.2, LLY: 7.5, ABBV: 6.0, MRK: 5.8,
      WMT: 5.2, COST: 5.5, NKE: 6.0, MCD: 5.0, KO: 5.1,
      SBUX: 5.8, PEP: 5.3, XOM: 5.5, CVX: 5.8, COP: 6.0,
      CAT: 5.8, BA: 7.2, GE: 6.5, HON: 5.5, DE: 5.8,
      DIS: 6.0, NFLX: 7.8, CMCSA: 5.2, COIN: 10.5, SQ: 8.5,
      PYPL: 6.5, AVGO: 8.0, INTC: 6.8, TSM: 7.5, CRM: 6.5,
      ORCL: 5.8, ADBE: 6.2, IBM: 5.0, NOW: 7.0, UBER: 7.5
    }
    return rates[code] || 5.0
  }, [])

  const calcContractProfit = useCallback((stock: Stock, duration: number, amount: number) => {
    const baseRate = getStockBaseRate(stock.code)
    // Duration multiplier: longer = higher
    const durMult = duration <= 30 ? 1 : duration <= 60 ? 1.15 : duration <= 90 ? 1.3 : duration <= 120 ? 1.5 : duration <= 180 ? 1.8 : 2.5
    // Amount multiplier: more = higher
    const amtMult = amount < 500000 ? 1 : amount < 1000000 ? 1.1 : amount < 5000000 ? 1.2 : amount < 10000000 ? 1.3 : 1.5
    const dailyRate = baseRate * durMult * amtMult
    const dailyProfitAmount = Math.round(amount * dailyRate / 100)
    const totalProfit = dailyProfitAmount * duration
    const totalReturn = amount + totalProfit
    return { dailyRate: Math.round(dailyRate * 100) / 100, dailyProfitAmount, totalProfit, totalReturn }
  }, [getStockBaseRate])

  const openSinyalPosition = useCallback(() => {
    if (!selectedSinyalStock || !sinyalAmount) return
    const amount = parseInt(sinyalAmount)
    if (amount < 100000) { toast({ title: 'Minimum Rp 100.000', variant: 'destructive' }); return }
    if (amount > (user?.balance || 0)) { toast({ title: 'Saldo tidak cukup', variant: 'destructive' }); return }
    const profitPercent = calcSinyalProfit(amount, sinyalDuration)
    const posId = `sinyal-${Date.now()}`
    const newPosition = {
      id: posId,
      stockId: selectedSinyalStock.id,
      stockCode: selectedSinyalStock.code,
      stockName: selectedSinyalStock.name,
      direction: sinyalDirection,
      amount,
      duration: sinyalDuration,
      startPrice: selectedSinyalStock.price,
      startTime: Date.now(),
      profitPercent,
      status: 'active' as const,
    }
    setSinyalPositions(prev => [...prev, newPosition])
    setSinyalActive(true)
    setSinyalResult(null)
    setSinyalTimer(sinyalDuration)
    toast({ title: 'Posisi Dibuka! 🎯', description: `${sinyalDirection} ${selectedSinyalStock.code} • ${formatRupiah(amount)} • ${sinyalDuration}s` })
  }, [selectedSinyalStock, sinyalAmount, sinyalDirection, sinyalDuration, user, calcSinyalProfit])

  // Sinyal Pro timer
  useEffect(() => {
    if (!sinyalActive || sinyalPositions.length === 0) return
    const activePos = sinyalPositions.find(p => p.status === 'active')
    if (!activePos) return

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - activePos.startTime) / 1000)
      const remaining = activePos.duration - elapsed
      setSinyalTimer(remaining)

      if (remaining <= 0) {
        const currentStock = stocks.find(s => s.id === activePos.stockId)
        if (currentStock) {
          const endPrice = currentStock.price
          // Rigged: ~42% win rate with some randomness
          const finalWon = Math.random() < 0.42

          const profit = finalWon ? Math.round(activePos.amount * activePos.profitPercent / 100) : -activePos.amount

          setSinyalPositions(prev => prev.map(p =>
            p.id === activePos.id ? {...p, status: finalWon ? 'won' : 'lost'} : p
          ))

          setSinyalResult({won: finalWon, profit})

          if (finalWon) {
            updateBalance((user?.balance || 0) + Math.abs(profit))
            toast({ title: 'Prediksi Benar! 🎯', description: `Profit +${formatRupiah(Math.abs(profit))}` })
          } else {
            updateBalance((user?.balance || 0) - activePos.amount)
            toast({ title: 'Prediksi Salah', description: `Kehilangan ${formatRupiah(activePos.amount)}`, variant: 'destructive' })
          }

          setSinyalActive(false)

          // AUTO mode: schedule new position
          if (sinyalAutoMode && (user?.balance || 0) >= parseInt(sinyalAmount || '0')) {
            setSinyalAutoPending(true)
          }
        }
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [sinyalActive, sinyalPositions, sinyalAutoMode, sinyalAmount, stocks, user, updateBalance])

  // AUTO mode: start new position after delay
  useEffect(() => {
    if (!sinyalAutoPending || !selectedSinyalStock) return
    const timeout = setTimeout(() => {
      setSinyalAutoPending(false)
      setSinyalResult(null)
      if (sinyalAutoMode && (user?.balance || 0) >= parseInt(sinyalAmount || '0')) {
        openSinyalPosition()
      }
    }, 2000)
    return () => clearTimeout(timeout)
  }, [sinyalAutoPending, sinyalAutoMode, selectedSinyalStock, sinyalAmount, user, openSinyalPosition])

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
    try {
      const r = await fetch(`/api/referral?userId=${user.id}`)
      const d = await r.json()
      setReferralInfo({
        code: d.referralCode || '',
        totalReferred: d.totalReferred || 0,
        totalBonus: d.totalBonus || 0,
        referredUsers: d.referredUsers || [],
        totalMembers: d.totalMembers || 0,
        totalDeposit: d.totalDeposit || 0,
        totalCommission: d.totalCommission || 0,
        pendingCommission: d.pendingCommission || 0,
        claimedCommission: d.claimedCommission || 0,
        tiers: d.tiers || [{ level: 1, commissionPercent: 10, members: 0, activeMembers: 0, inactiveMembers: 0, deposit: 0, commission: 0 }, { level: 2, commissionPercent: 3, members: 0, activeMembers: 0, inactiveMembers: 0, deposit: 0, commission: 0 }, { level: 3, commissionPercent: 1, members: 0, activeMembers: 0, inactiveMembers: 0, deposit: 0, commission: 0 }],
        history: d.history || [],
      })
    } catch {}
  }, [user])
  const fetchPriceHistory = useCallback(async (stockId: string) => {
    try { const r = await fetch(`/api/stocks/${stockId}`); const d = await r.json(); if (d.priceHistory) setPriceHistory(d.priceHistory) } catch {}
  }, [])
  const fetchBonuses = useCallback(async () => {
    if (!user) return
    try { const r = await fetch(`/api/bonus?userId=${user.id}`); const d = await r.json(); if (d.bonuses) setBonuses(d.bonuses) } catch {}
  }, [user])
  const fetchPromos = useCallback(async () => {
    try { const r = await fetch('/api/promo'); const d = await r.json(); if (d.promos) setPromos(d.promos) } catch {}
  }, [])
  const fetchLeaderboard = useCallback(async () => {
    try { const r = await fetch('/api/leaderboard'); const d = await r.json(); if (d.leaderboard) setLeaderboard(d.leaderboard) } catch {}
  }, [])
  const fetchInvestProducts = useCallback(async () => {
    try { const r = await fetch('/api/invest'); const d = await r.json(); if (d.products) setInvestProducts(d.products) } catch {}
  }, [])
  const fetchUserInvestments = useCallback(async () => {
    if (!user) return
    try { const r = await fetch(`/api/investments?userId=${user.id}`); const d = await r.json(); if (d.investments) setUserInvestments(d.investments) } catch {}
  }, [user])

  const fetchDailyCheck = useCallback(async () => {
    if (!user) return
    try { const r = await fetch(`/api/daily-check?userId=${user.id}`); const d = await r.json(); setDailyCheckStatus({ streak: d.streak, lastCheckDate: d.lastCheckDate, canCheckToday: d.canCheckToday, todayReward: d.todayReward }) } catch {}
  }, [user])

  const fetchTasks = useCallback(async () => {
    if (!user) return
    try { const r = await fetch(`/api/tasks?userId=${user.id}`); const d = await r.json(); if (d.tasks) setTasks(d.tasks) } catch {}
  }, [user])

  const fetchContracts = useCallback(async () => {
    if (!user) return
    try { const r = await fetch(`/api/contracts?userId=${user.id}`); const d = await r.json(); if (d.contracts) setUserContracts(d.contracts) } catch {}
  }, [user])

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
    fetchWithdrawals(); fetchReferral(); fetchBonuses(); fetchPromos(); fetchLeaderboard()
    fetchInvestProducts(); fetchUserInvestments()
    fetchDailyCheck(); fetchTasks(); fetchContracts()
  }, [user, fetchStocks, fetchPortfolio, fetchTransactions, fetchIndices, fetchNotifications, fetchNews, fetchWatchlist, fetchDeposits, fetchWithdrawals, fetchReferral, fetchBonuses, fetchPromos, fetchLeaderboard, fetchInvestProducts, fetchUserInvestments, fetchDailyCheck, fetchTasks, fetchContracts])

  useEffect(() => { const iv = setInterval(refreshAll, 30000); return () => clearInterval(iv) }, [refreshAll])

  // ============ WELCOME MODAL LOGIC ============
  useEffect(() => {
    if (user) {
      const dismissed = localStorage.getItem('gs_welcome_dismissed')
      if (!dismissed || Date.now() > parseInt(dismissed)) {
        setShowWelcomeModal(true)
      }
    }
  }, [user])

  const handleWelcomeClose = () => {
    if (welcomeDontShow) {
      localStorage.setItem('gs_welcome_dismissed', (Date.now() + 30 * 60 * 1000).toString())
    }
    setShowWelcomeModal(false)
  }

  // ============ INVEST CHART DATA HELPER ============
  const getInvestChartData = useCallback((product: InvestProduct) => {
    return investChartData.get(product.id) || []
  }, [investChartData])

  // ============ CONTRACT ============
  const handleContract = async () => {
    if (!user || !selectedStock || !contractAmount) return
    const amount = parseInt(contractAmount)
    if (amount < 100000) { toast({ title: 'Minimum investasi Rp 100.000', variant: 'destructive' }); return }
    if (amount > (user?.balance || 0)) { toast({ title: 'Saldo tidak cukup', variant: 'destructive' }); return }
    if (contractDuration < 30) { toast({ title: 'Durasi minimal 30 hari', variant: 'destructive' }); return }
    setContractLoading(true)
    try {
      const profit = calcContractProfit(selectedStock, contractDuration, amount)
      const res = await fetch('/api/contracts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id, stockId: selectedStock.id, amount, duration: contractDuration,
          dailyProfitRate: profit.dailyRate, dailyProfitAmount: profit.dailyProfitAmount,
          totalProfit: profit.totalProfit, totalReturn: profit.totalReturn,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      updateBalance(data.newBalance)
      toast({ title: 'Kontrak Berhasil Dibeli!', description: `Kontrak ${selectedStock.code} • ${contractDuration} hari • Profit ${profit.dailyRate}%/hari` })
      setContractModal(false); setContractAmount(''); setContractDuration(30)
      fetchContracts(); fetchPortfolio()
    } catch (err: unknown) {
      toast({ title: 'Gagal', description: err instanceof Error ? err.message : 'Error', variant: 'destructive' })
    } finally { setContractLoading(false) }
  }

  const handleContractClaim = async (contractId: string) => {
    if (!user) return
    setContractClaimLoadingId(contractId)
    try {
      const res = await fetch('/api/contracts', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId, action: 'claim' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.claimedAmount) {
        updateBalance((user?.balance || 0) + data.claimedAmount)
        toast({ title: data.isCompleted ? 'Kontrak Selesai!' : 'Profit Diterima!', description: `+${formatRupiah(data.claimedAmount)} dari kontrak` })
      }
      fetchContracts(); fetchPortfolio()
    } catch (err: unknown) {
      toast({ title: 'Gagal', description: err instanceof Error ? err.message : 'Error', variant: 'destructive' })
    } finally { setContractClaimLoadingId(null) }
  }

  // ============ DEPOSIT ============
  const handleDeposit = async () => {
    if (!user || !depositAmount) return
    const amount = parseFloat(depositAmount)
    if (amount < 10000) { toast({ title: 'Minimum deposit Rp 10.000', variant: 'destructive' }); return }
    setDepositLoading(true)
    try {
      const methodName = depositCategory === 'bank' ? depositBankMethod : depositCategory === 'ewallet' ? depositEwalletMethod : 'QRIS'
      const res = await fetch('/api/deposit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, amount, method: depositCategory === 'qris' ? 'qris' : depositCategory === 'ewallet' ? 'e_wallet' : 'bank_transfer', bankName: methodName }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: 'Deposit Berhasil!', description: `+${formatRupiah(amount)} via ${methodName} telah ditambahkan` })
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
    if (withdrawCategory !== 'crypto' && !withdrawAccountNumber) { toast({ title: 'Isi nomor rekening / HP terlebih dahulu', variant: 'destructive' }); return }
    if (withdrawCategory === 'bank' && !withdrawAccountHolder) { toast({ title: 'Isi nama pemilik rekening', variant: 'destructive' }); return }
    setWithdrawLoading(true)
    try {
      const methodName = withdrawCategory === 'bank' ? withdrawBankMethod : withdrawCategory === 'ewallet' ? withdrawEwalletMethod : withdrawCryptoMethod
      const res = await fetch('/api/withdrawal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, amount, bankName: methodName, bankAccount: withdrawAccountNumber || user.bankAccount || '0000000', bankHolder: withdrawAccountHolder || user.name }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: 'Withdraw Diproses!', description: `${formatRupiah(amount)} via ${methodName} sedang diproses` })
      setWithdrawAmount(''); setWithdrawAccountNumber(''); setWithdrawAccountHolder(''); fetchPortfolio(); fetchWithdrawals()
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

  // ============ DAILY CHECK-IN ============
  const handleDailyCheck = async () => {
    if (!user) return
    setDailyCheckLoading(true)
    try {
      const res = await fetch('/api/daily-check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDailyCheckReward(data.reward)
      setDailyCheckStatus(prev => ({ ...prev, canCheckToday: false, todayReward: data.reward, streak: data.streak }))
      updateBalance((user.balance || 0) + data.reward)
      toast({ title: 'Cek Harian Berhasil! 🔥', description: `Bonus ${formatRupiah(data.reward)} — Streak ${data.streak} hari!` })
      fetchBonuses(); fetchPortfolio(); fetchTasks()
    } catch (err: unknown) { toast({ title: 'Gagal', description: err instanceof Error ? err.message : 'Error', variant: 'destructive' }) }
    finally { setDailyCheckLoading(false) }
  }

  // ============ TASK CLAIM ============
  const handleClaimTask = async (taskId: string) => {
    if (!user) return
    setTaskClaimingId(taskId)
    try {
      const res = await fetch('/api/tasks/claim', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, taskId }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, claimed: true } : t))
      updateBalance((user.balance || 0) + data.reward)
      toast({ title: 'Tugas Selesai! 🎯', description: `Bonus ${formatRupiah(data.reward)} dari "${data.taskTitle}"` })
      fetchBonuses(); fetchPortfolio()
    } catch (err: unknown) { toast({ title: 'Gagal', description: err instanceof Error ? err.message : 'Error', variant: 'destructive' }) }
    finally { setTaskClaimingId(null) }
  }

  // ============ INVESTMENT MOVEMENT (now driven by live candlestick data) ============

  // ============ INVESTMENT HANDLERS ============
  const handlePurchaseInvestment = async () => {
    if (!user || !selectedProduct) return
    setInvestLoading(true)
    try {
      const res = await fetch('/api/invest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, productId: selectedProduct.id }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      updateBalance(data.newBalance)
      toast({ title: 'Investasi Berhasil!', description: `Anda berhasil membeli ${selectedProduct.name}` })
      setShowInvestModal(false)
      setSelectedProduct(null)
      fetchUserInvestments(); fetchPortfolio()
    } catch (err: unknown) {
      toast({ title: 'Gagal', description: err instanceof Error ? err.message : 'Error', variant: 'destructive' })
    } finally { setInvestLoading(false) }
  }

  const handleClaimProfit = async (investmentId: string) => {
    if (!user) return
    setClaimLoadingId(investmentId)
    try {
      const res = await fetch('/api/invest/claim', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, investmentId }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      updateBalance(data.newBalance)
      toast({ title: 'Profit Diterima!', description: `+${formatRupiah(data.claimedAmount)} dikreditkan ke saldo` })
      fetchUserInvestments(); fetchPortfolio()
    } catch (err: unknown) {
      toast({ title: 'Gagal', description: err instanceof Error ? err.message : 'Error', variant: 'destructive' })
    } finally { setClaimLoadingId(null) }
  }

  // ============ INVESTMENT SPARKLINE (derived from live chart data) ============
  const getInvestSparkline = useCallback((product: InvestProduct) => {
    const chartData = investChartData.get(product.id)
    if (!chartData || chartData.length === 0) return []
    return chartData.map((d, i) => ({ i, p: d.value }))
  }, [investChartData])

  // ============ DERIVED ============
  const unreadNotif = notifications.filter(n => !n.isRead).length
  const filteredStocks = stocks.filter(s => {
    const ms = s.code.toLowerCase().includes(searchQuery.toLowerCase()) || s.name.toLowerCase().includes(searchQuery.toLowerCase())
    const mf = stockFilter === 'all' || s.category === stockFilter || s.sector === stockFilter
    return ms && mf
  })
  const categories = [{ key: 'all', label: 'Semua' }, { key: 'bluechip', label: 'Blue Chip' }, { key: 'tech', label: 'Teknologi' }, { key: 'banking', label: 'Keuangan' }, { key: 'energy', label: 'Energi' }, { key: 'consumer', label: 'Konsumer' }, { key: 'healthcare', label: 'Kesehatan' }, { key: 'infrastructure', label: 'Industri' }, { key: 'media', label: 'Hiburan' }]
  const isWatched = (stockId: string) => watchlist.some(w => w.stockId === stockId)
  const openStockDetail = (stock: Stock) => { setSelectedStock(stock); setShowStockDetail(true); setLiveBuyChart([]); setLiveSellChart([]); setLiveBuyPrice(0); setLiveSellPrice(0); fetchPriceHistory(stock.id) }
  const openContract = (stock: Stock) => { setSelectedStock(stock); setContractModal(true); setContractAmount(''); setContractDuration(30); fetchPriceHistory(stock.id) }
  const portfolioPieData = portfolio.map((p, i) => ({ name: p.stock.code, value: p.currentValue, color: PIE_COLORS[i % PIE_COLORS.length] }))
  const filteredTransactions = transactions.filter(t => txFilter === 'all' || t.type === txFilter)
  const topGainers = [...stocks].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5)
  const topLosers = [...stocks].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5)

  // ============ RENDER ============
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 md:pl-[72px] lg:pl-[80px]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gs-line shadow-sm">
        <div className="max-w-7xl mx-auto px-3 md:px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSideMenu(true)} className="w-9 h-9 rounded-xl bg-gs-soft border border-gs-line grid place-items-center">
              <Menu className="w-4 h-4 text-gs-green3" />
            </button>
            <div className="w-8 h-8 rounded-full bg-white p-0.5 border border-gs-line shadow-sm">
              <img src="/trendedge-logo.png" alt="GS" className="w-full h-full object-contain" />
            </div>
            <div>
              <b className="block text-[10px] md:text-xs font-black text-gs-green3 leading-tight">TRENDEDGE</b>
              <span className="block text-[7px] md:text-[9px] font-bold text-gs-muted">Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={refreshAll} className="w-8 h-8 rounded-xl bg-gs-soft border border-gs-line grid place-items-center hover:bg-emerald-100 transition-colors">
              <RefreshCw className={`w-3.5 h-3.5 text-gs-green3 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => { setShowNotifPanel(true); markNotifRead() }} className="w-8 h-8 rounded-xl bg-gs-soft border border-gs-line grid place-items-center hover:bg-emerald-100 transition-colors relative">
              <Bell className="w-3.5 h-3.5 text-gs-green3" />
              {unreadNotif > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-gs-red border-2 border-white text-[6px] text-white font-black grid place-items-center">{unreadNotif > 9 ? '9+' : unreadNotif}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* Market Indices Bar */}
      {indices.length > 0 && (
        <div className="bg-white border-b border-gs-line overflow-x-auto">
          <div className="max-w-7xl mx-auto flex gap-3 px-3 md:px-6 py-1.5">
            {indices.map(idx => (
              <div key={idx.id} className="flex-shrink-0 flex items-center gap-1">
                <span className="text-[8px] md:text-[9px] font-black text-gs-green3">{idx.code}</span>
                <span className="text-[9px] md:text-[10px] font-black text-gs-text tabular-nums">{formatNumber(idx.value)}</span>
                <span className={`text-[8px] md:text-[9px] font-black ${idx.changePercent >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{formatPercent(idx.changePercent)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 md:px-6 py-3 pb-20 md:pb-6">
        <AnimatePresence mode="wait">
          {/* ====== HOME TAB ====== */}
          {activeTab === 'home' && (
            <motion.div key="home" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {/* Dual Wallet Card */}
              <div className="rounded-3xl overflow-hidden mb-4" style={{ background: 'linear-gradient(145deg, #022c22 0%, #064e3b 54%, #059669 100%)' }}>
                <div className="p-4 text-white">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] md:text-[11px] font-black tracking-wider">RINGKASAN SALDO</span>
                      <span className="h-4 px-1.5 rounded-full bg-emerald-400/30 border border-emerald-400/40 text-[7px] font-black text-emerald-300 flex items-center gap-0.5">
                        <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />AKTIF
                      </span>
                    </div>
                    <button onClick={() => setShowBalance(!showBalance)} className="text-white/60 hover:text-white">
                      {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Dual Wallets */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {/* Dompet Utama */}
                    <div className="rounded-2xl p-3 bg-white/10 border border-white/15">
                      <div className="flex items-center gap-1 mb-1">
                        <Wallet className="w-3 h-3 text-yellow-300" />
                        <span className="text-[7px] md:text-[8px] font-bold text-emerald-200 uppercase tracking-wider">DOMPET UTAMA</span>
                      </div>
                      <b className="block text-[13px] md:text-sm font-black">{showBalance ? formatRupiah(user?.balance || 0) : '••••••••'}</b>
                      <span className="block text-[5px] font-semibold text-emerald-200/60 mt-0.5">Deposit untuk investasi</span>
                    </div>
                    {/* Dompet Penarikan */}
                    <div className="rounded-2xl p-3 bg-white/10 border border-white/15">
                      <div className="flex items-center gap-1 mb-1">
                        <CreditCard className="w-3 h-3 text-emerald-300" />
                        <span className="text-[7px] md:text-[8px] font-bold text-emerald-200 uppercase tracking-wider">DOMPET PENARIKAN</span>
                      </div>
                      <b className="block text-[13px] md:text-sm font-black">{showBalance ? formatRupiah(user?.withdrawalBalance || 0) : '••••••••'}</b>
                      <span className="block text-[5px] font-semibold text-emerald-200/60 mt-0.5">Dapat ditarik</span>
                    </div>
                  </div>

                  {/* Total Investasi */}
                  <div className="rounded-2xl p-2.5 bg-white/8 border border-white/12 mb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-yellow-300" />
                        <span className="text-[8px] font-bold text-emerald-200">TOTAL INVESTASI</span>
                      </div>
                      <b className="text-[12px] font-black">{showBalance ? formatRupiah(portfolioSummary.totalCurrentValue) : '••••••••'}</b>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button onClick={() => setActiveTab('finance')} className="h-9 rounded-xl bg-yellow-500 text-gs-dark text-[9px] font-bold hover:bg-yellow-400 transition-colors flex items-center justify-center gap-1">
                      <Plus className="w-3.5 h-3.5" />Isi Saldo
                    </button>
                    <button onClick={() => setActiveTab('finance')} className="h-9 rounded-xl bg-white/15 border border-white/20 text-white text-[9px] font-bold hover:bg-white/20 transition-colors flex items-center justify-center gap-1">
                      <Minus className="w-3.5 h-3.5" />Tarik Saldo
                    </button>
                  </div>

                  {/* Regulatory Badges */}
                  <div className="flex items-center justify-center gap-3">
                    <div className="flex items-center gap-1">
                      <Shield className="w-3 h-3 text-emerald-300" />
                      <span className="text-[7px] font-bold text-emerald-200">Terdaftar & Diawasi</span>
                    </div>
                    <div className="w-px h-3 bg-white/20" />
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-yellow-300" />
                      <span className="text-[7px] font-bold text-emerald-200">Berlisensi Resmi</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu Cepat */}
              <div className="mb-4">
                <div className="mb-2">
                  <h3 className="text-[11px] md:text-xs font-black text-gs-green3">Menu Cepat</h3>
                  <span className="text-[8px] font-semibold text-gs-muted">Akses fitur penting hanya dalam satu ketukan</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                  {[
                    { icon: <ClipboardList className="w-4 h-4" />, label: 'Cek Harian', action: () => setShowDailyCheckModal(true), color: 'bg-emerald-50 text-emerald-600' },
                    { icon: <CalendarDays className="w-4 h-4" />, label: 'Tugas', action: () => { setTasksLoading(true); fetchTasks().finally(() => setTasksLoading(false)); setShowTasksModal(true) }, color: 'bg-amber-50 text-amber-600' },
                    { icon: <Download className="w-4 h-4" />, label: 'Unduh Aplikasi', action: () => {}, color: 'bg-emerald-50 text-emerald-600' },
                  ].map((a, i) => (
                    <button key={i} onClick={a.action} className="flex-shrink-0 flex flex-col items-center gap-1.5 py-3 px-4 rounded-2xl bg-white border border-gs-line shadow-sm hover:shadow-md transition-shadow relative min-w-[80px]">
                      <div className={`w-9 h-9 rounded-xl ${a.color} grid place-items-center`}>{a.icon}</div>
                      <span className="text-[7px] md:text-[8px] font-bold text-gs-green3">{a.label}</span>
                      {'badge' in a && a.badge && (
                        <span className="absolute -top-1 -right-1 h-4 px-1 rounded-full bg-emerald-500 text-white text-[6px] font-black flex items-center">{a.badge}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cek Harian Card */}
              <div className="rounded-2xl overflow-hidden mb-4 border border-emerald-200" style={{ background: 'linear-gradient(145deg, #022c22 0%, #064e3b 54%, #059669 100%)' }}>
                <div className="p-3 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-white/15 grid place-items-center">
                        <CalendarDays className="w-5 h-5 text-yellow-300" />
                      </div>
                      <div>
                        <b className="text-[11px] md:text-xs font-black">CEK HARIAN</b>
                        <span className="block text-[8px] md:text-[9px] font-semibold text-emerald-200">
                          {dailyCheckStatus.streak > 0 ? `🔥 ${dailyCheckStatus.streak} Hari Berturut-turut` : 'Klaim bonus harian Anda'}
                        </span>
                      </div>
                    </div>
                    {dailyCheckStatus.canCheckToday ? (
                      <button
                        onClick={handleDailyCheck}
                        disabled={dailyCheckLoading}
                        className="h-8 px-4 rounded-xl bg-yellow-500 text-gs-dark text-[9px] font-bold hover:bg-yellow-400 transition-colors disabled:opacity-60 flex items-center gap-1"
                      >
                        {dailyCheckLoading ? (
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-gs-dark/30 border-t-gs-dark animate-spin" />
                        ) : (
                          'Klaim Sekarang'
                        )}
                      </button>
                    ) : (
                      <div className="h-8 px-4 rounded-xl bg-white/15 text-[9px] font-bold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-300" />
                        Sudah Dicek ✓
                      </div>
                    )}
                  </div>
                  {dailyCheckReward !== null && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="rounded-xl p-2 bg-yellow-500/20 border border-yellow-400/30 text-center"
                    >
                      <span className="text-[8px] text-yellow-200 font-bold">Bonus Hari Ini</span>
                      <b className="block text-sm font-black text-yellow-300">{formatRupiah(dailyCheckReward)}</b>
                    </motion.div>
                  )}
                  {!dailyCheckStatus.canCheckToday && dailyCheckReward === null && dailyCheckStatus.todayReward > 0 && (
                    <div className="rounded-xl p-2 bg-white/10 border border-white/15 text-center">
                      <span className="text-[8px] text-emerald-200 font-bold">Bonus Hari Ini</span>
                      <b className="block text-sm font-black text-yellow-300">{formatRupiah(dailyCheckStatus.todayReward)}</b>
                    </div>
                  )}
                </div>
              </div>

              {/* Tugas (Tasks) Summary Card */}
              <div className="rounded-2xl p-3 bg-white border border-gs-line shadow-sm mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 grid place-items-center">
                      <ListChecks className="w-4.5 h-4.5 text-amber-600" />
                    </div>
                    <div>
                      <b className="text-[11px] md:text-xs font-black text-gs-green3">Tugas</b>
                      <span className="block text-[8px] font-semibold text-gs-muted">
                        {tasks.filter(t => t.completed).length}/{tasks.length} selesai
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => { setTasksLoading(true); fetchTasks().finally(() => setTasksLoading(false)); setShowTasksModal(true) }}
                    className="h-7 px-3 rounded-lg bg-amber-500 text-white text-[8px] font-bold hover:bg-amber-600 transition-colors"
                  >
                    Lihat Semua
                  </button>
                </div>
                {/* Task progress bar */}
                <div className="w-full h-1.5 rounded-full bg-gs-soft overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all duration-500"
                    style={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0}%` }}
                  />
                </div>
                {/* Show first 2 unclaimed tasks */}
                {tasks.filter(t => !t.claimed).slice(0, 2).map(task => (
                  <div key={task.id} className="flex items-center justify-between mt-2 py-1 border-b border-gs-line last:border-0">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-5 h-5 rounded-md grid place-items-center ${task.completed ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                        {task.completed ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : <Target className="w-3 h-3 text-amber-600" />}
                      </div>
                      <div>
                        <span className="block text-[8px] font-bold text-gs-text">{task.title}</span>
                        <span className="block text-[7px] text-gs-muted">{task.progress}/{task.target}</span>
                      </div>
                    </div>
                    <span className="text-[8px] font-black text-emerald-600">+{formatRupiah(task.reward)}</span>
                  </div>
                ))}
              </div>

              {/* Portfolio Chart */}
              {portfolio.length > 0 && (
                <div className="rounded-2xl p-3 bg-white border border-gs-line shadow-sm mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[11px] md:text-xs font-black text-gs-green3">Alokasi Portofolio</h3>
                    <span className="text-[8px] md:text-[9px] font-bold text-gs-muted">{portfolio.length} saham</span>
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
                          <span className="text-[7px] md:text-[8px] font-bold text-gs-muted flex-1">{formatRupiah(p.currentValue)}</span>
                          <span className={`text-[7px] md:text-[8px] font-black ${p.profitLoss >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{formatPercent(p.profitLossPercent)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Top Movers */}
              {stocks.length > 0 && (
                <div className="rounded-2xl p-3 bg-white border border-gs-line shadow-sm mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[11px] md:text-xs font-black text-gs-green3">Top Movers</h3>
                    <button onClick={() => setActiveTab('market')} className="text-[8px] md:text-[9px] font-bold text-gs-green hover:underline">Lihat Semua</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[8px] md:text-[9px] font-bold text-emerald-600 mb-1 block">🔺 Gainers</span>
                      {topGainers.slice(0, 3).map(s => (
                        <button key={s.id} onClick={() => openStockDetail(s)} className="w-full flex items-center justify-between py-1.5 border-b border-gs-line last:border-0">
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-lg overflow-hidden bg-emerald-50 flex items-center justify-center">{s.logo ? <img src={s.logo} alt={s.code} className="w-full h-full object-cover" /> : <span className="text-[7px] font-black text-emerald-600">{s.code.slice(0, 2)}</span>}</div>
                            <span className="text-[9px] font-bold text-gs-text">{s.code}</span>
                          </div>
                          <span className="text-[8px] font-black text-emerald-600">+{s.changePercent.toFixed(2)}%</span>
                        </button>
                      ))}
                    </div>
                    <div>
                      <span className="text-[8px] font-bold text-red-500 mb-1 block">🔻 Losers</span>
                      {topLosers.slice(0, 3).map(s => (
                        <button key={s.id} onClick={() => openStockDetail(s)} className="w-full flex items-center justify-between py-1.5 border-b border-gs-line last:border-0">
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-lg overflow-hidden bg-red-50 flex items-center justify-center">{s.logo ? <img src={s.logo} alt={s.code} className="w-full h-full object-cover" /> : <span className="text-[7px] font-black text-red-500">{s.code.slice(0, 2)}</span>}</div>
                            <span className="text-[9px] font-bold text-gs-text">{s.code}</span>
                          </div>
                          <span className="text-[8px] font-black text-red-500">{s.changePercent.toFixed(2)}%</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Watchlist */}
              {watchlist.length > 0 && (
                <div className="rounded-2xl p-3 bg-white border border-gs-line shadow-sm mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[11px] md:text-xs font-black text-gs-green3">Watchlist</h3>
                    <Star className="w-3.5 h-3.5 text-gs-gold" />
                  </div>
                  <div className="space-y-1.5">
                    {watchlist.slice(0, 5).map(w => (
                      <button key={w.id} onClick={() => openStockDetail(w.stock)} className="w-full flex items-center justify-between py-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg overflow-hidden bg-gs-soft flex items-center justify-center">{w.stock.logo ? <img src={w.stock.logo} alt={w.stock.code} className="w-full h-full object-cover" /> : <span className="text-[7px] font-black text-gs-green3">{w.stock.code.slice(0, 2)}</span>}</div>
                          <div className="text-left">
                            <span className="block text-[9px] font-bold text-gs-text">{w.stock.code}</span>
                            <span className="block text-[7px] text-gs-muted">{w.stock.name.slice(0, 15)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="block text-[9px] font-black text-gs-text tabular-nums">{formatRupiah(w.stock.price)}</span>
                          <span className={`block text-[8px] font-black ${w.stock.changePercent >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{formatPercent(w.stock.changePercent)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Transactions */}
              {transactions.length > 0 && (
                <div className="rounded-2xl p-3 bg-white border border-gs-line shadow-sm mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[11px] md:text-xs font-black text-gs-green3">Transaksi Terakhir</h3>
                    <button onClick={() => setActiveTab('history')} className="text-[8px] md:text-[9px] font-bold text-gs-green hover:underline">Lihat Semua</button>
                  </div>
                  {transactions.slice(0, 4).map(tx => (
                    <div key={tx.id} className="flex items-center justify-between py-1.5 border-b border-gs-line last:border-0">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg grid place-items-center ${tx.type === 'BUY' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                          {tx.type === 'BUY' ? <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" /> : <ArrowUpRight className="w-3.5 h-3.5 text-red-500" />}
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold text-gs-text">{tx.type === 'BUY' ? 'Beli' : 'Jual'} {tx.stock.code}</span>
                          <span className="block text-[7px] text-gs-muted">{formatRupiah(tx.total)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block text-[9px] font-black text-gs-text">{formatRupiah(tx.total)}</span>
                        <span className="block text-[7px] text-gs-muted">{formatDateTime(tx.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* News */}
              {news.length > 0 && (
                <div className="rounded-2xl p-3 bg-white border border-gs-line shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[11px] md:text-xs font-black text-gs-green3">Berita Terkini</h3>
                    <button onClick={() => setActiveTab('news')} className="text-[8px] md:text-[9px] font-bold text-gs-green hover:underline">Lihat Semua</button>
                  </div>
                  {news.slice(0, 3).map(n => (
                    <div key={n.id} className="py-2 border-b border-gs-line last:border-0">
                      <span className="block text-[9px] font-bold text-gs-text leading-snug">{n.title}</span>
                      <span className="block text-[7px] text-gs-muted mt-0.5">{formatDate(n.createdAt)} • {n.category}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ====== MARKET TAB ====== */}
          {activeTab === 'market' && (
            <motion.div key="market" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {/* Market Overview Section */}
              {indices.length > 0 && (
                <div className="rounded-2xl overflow-hidden mb-4 bg-white border border-gs-line shadow-sm">
                  <div className="p-3 md:p-4" style={{ background: 'linear-gradient(145deg, #022c22 0%, #064e3b 54%, #059669 100%)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-yellow-300" />
                        <span className="text-[10px] md:text-xs font-black text-white">Market Overview</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[7px] md:text-[8px] font-bold text-emerald-200">LIVE</span>
                      </div>
                    </div>
                    {(() => {
                      const ihsgIdx = indices.find(idx => idx.code === 'IHSG') || indices[0]
                      if (!ihsgIdx || ihsgChartData.length < 2) return null
                      const isIhsgUp = ihsgIdx.changePercent >= 0
                      const ihsgPrices = ihsgChartData.map(p => p.value)
                      const ihsgMin = Math.min(...ihsgPrices)
                      const ihsgMax = Math.max(...ihsgPrices)
                      const ihsgRange = ihsgMax - ihsgMin || 1
                      const ihsgDomain: [number, number] = [Math.floor(ihsgMin - ihsgRange * 0.1), Math.ceil(ihsgMax + ihsgRange * 0.1)]
                      const lastIhsgVal = ihsgChartData[ihsgChartData.length - 1].value
                      const ihsgStroke = isIhsgUp ? '#4ade80' : '#f87171'
                      return (
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg md:text-xl font-black text-white tabular-nums">{formatNumber(lastIhsgVal)}</span>
                            <span className={`text-[10px] md:text-xs font-bold ${isIhsgUp ? 'text-emerald-300' : 'text-red-300'}`}>
                              {isIhsgUp ? <TrendingUp className="w-3 h-3 inline" /> : <TrendingDown className="w-3 h-3 inline" />}
                              {' '}{formatPercent(ihsgIdx.changePercent)}
                            </span>
                          </div>
                          <div className="h-20 md:h-24">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={ihsgChartData} margin={{ top: 5, right: 12, bottom: 0, left: 5 }}>
                                <defs>
                                  <linearGradient id="ihsgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor={ihsgStroke} stopOpacity="0.45" />
                                    <stop offset="50%" stopColor={ihsgStroke} stopOpacity="0.1" />
                                    <stop offset="100%" stopColor={ihsgStroke} stopOpacity="0" />
                                  </linearGradient>
                                </defs>
                                <XAxis dataKey="idx" hide />
                                <YAxis hide domain={ihsgDomain} />
                                <ReferenceLine y={lastIhsgVal} stroke={ihsgStroke} strokeDasharray="3 3" strokeOpacity={0.3} />
                                <Tooltip formatter={(value: number) => [formatNumber(value), 'IHSG']} contentStyle={{ fontSize: '10px', borderRadius: '10px', border: '1px solid #bbf7d0', background: '#f0fdf4' }} />
                                <Area type="monotone" dataKey="value" stroke={ihsgStroke} fill="url(#ihsgGrad)" strokeWidth={2}
                                  dot={(props: Record<string, unknown>) => {
                                    const { cx, cy, index } = props as { cx: number; cy: number; index: number }
                                    if (index !== ihsgChartData.length - 1) return <g key={String(index)} />
                                    return (
                                      <g key="live-dot-ihsg">
                                        <circle cx={cx} cy={cy} r={8} fill={ihsgStroke} opacity={0.2}>
                                          <animate attributeName="r" values="6;12;6" dur="2s" repeatCount="indefinite" />
                                          <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
                                        </circle>
                                        <circle cx={cx} cy={cy} r={4} fill={ihsgStroke} stroke="#fff" strokeWidth={1.5} />
                                      </g>
                                    )
                                  }}
                                  activeDot={false}
                                  isAnimationActive={true} animationDuration={500} animationEasing="ease-out" />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-0 divide-x divide-gs-line">
                    {(() => {
                      const gainer = topGainers[0]
                      const loser = topLosers[0]
                      const mostActive = stocks.length > 0 ? [...stocks].sort((a, b) => b.volume - a.volume)[0] : null
                      return (
                        <>
                          <div className="p-2 md:p-3 text-center">
                            <span className="block text-[7px] md:text-[8px] font-bold text-emerald-600 mb-0.5">🔺 Top Gainer</span>
                            <span className="block text-[10px] md:text-xs font-black text-gs-text">{gainer?.code || '-'}</span>
                            <span className="block text-[8px] md:text-[10px] font-bold text-emerald-600">{gainer ? `+${gainer.changePercent.toFixed(2)}%` : '-'}</span>
                          </div>
                          <div className="p-2 md:p-3 text-center">
                            <span className="block text-[7px] md:text-[8px] font-bold text-red-500 mb-0.5">🔻 Top Loser</span>
                            <span className="block text-[10px] md:text-xs font-black text-gs-text">{loser?.code || '-'}</span>
                            <span className="block text-[8px] md:text-[10px] font-bold text-red-500">{loser ? `${loser.changePercent.toFixed(2)}%` : '-'}</span>
                          </div>
                          <div className="p-2 md:p-3 text-center">
                            <span className="block text-[7px] md:text-[8px] font-bold text-gs-gold mb-0.5">⚡ Most Active</span>
                            <span className="block text-[10px] md:text-xs font-black text-gs-text">{mostActive?.code || '-'}</span>
                            <span className="block text-[8px] md:text-[10px] font-bold text-gs-muted">{mostActive ? formatNumber(mostActive.volume) : '-'}</span>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>
              )}

              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gs-muted" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari saham..."
                  className="w-full h-10 rounded-2xl bg-white border border-gs-line pl-9 pr-4 text-[12px] md:text-sm font-semibold text-gs-dark outline-none focus:border-gs-green transition-colors placeholder:text-gray-400" />
              </div>

              {/* Category Filter */}
              <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 custom-scrollbar">
                {categories.map(c => (
                  <button key={c.key} onClick={() => setStockFilter(c.key)}
                    className={`flex-shrink-0 h-7 md:h-8 px-3 md:px-4 rounded-full text-[9px] md:text-[10px] font-bold transition-colors ${stockFilter === c.key ? 'bg-gs-green3 text-white' : 'bg-white border border-gs-line text-gs-muted hover:bg-gs-soft'}`}>
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Stock List - Multi Column Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-3">
                {filteredStocks.map(s => {
                  // Use memoized sparkline data to prevent jitter on re-renders
                  const sparkData = getSparklineData(s)
                  const isUp = s.changePercent >= 0
                  const sparkColor = isUp ? '#059669' : '#ef4444'
                  const maxVol = Math.max(...stocks.map(st => st.volume), 1)
                  const volPercent = Math.round((s.volume / maxVol) * 100)

                  return (
                    <div key={s.id} className={`rounded-2xl p-3 md:p-4 bg-white border shadow-sm hover:shadow-md transition-shadow ${isUp ? 'border-emerald-100' : 'border-red-100'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => openStockDetail(s)}>
                          <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl overflow-hidden flex items-center justify-center ${isUp ? 'bg-emerald-50' : 'bg-red-50'}`}>{s.logo ? <img src={s.logo} alt={s.code} className="w-full h-full object-cover" /> : <span className={`text-[9px] md:text-[10px] font-black ${isUp ? 'text-emerald-700' : 'text-red-600'}`}>{s.code.slice(0, 2)}</span>}</div>
                          <div>
                            <span className="block text-[10px] md:text-xs font-black text-gs-text">{s.code}</span>
                            <span className="block text-[7px] md:text-[8px] text-gs-muted max-w-[100px] md:max-w-[140px] truncate">{s.name}</span>
                          </div>
                        </div>
                        <button onClick={() => toggleWatchlist(s.id)} className="w-7 h-7 rounded-lg grid place-items-center hover:bg-gs-soft transition-colors">
                          <Star className={`w-3.5 h-3.5 ${isWatched(s.id) ? 'text-gs-gold fill-gs-gold' : 'text-gray-300'}`} />
                        </button>
                      </div>

                      {/* Recharts Mini AreaChart */}
                      <div className="h-[50px] md:h-[60px] -mx-1 mb-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={sparkData} margin={{ top: 2, right: 8, bottom: 2, left: 2 }}>
                            <defs>
                              <linearGradient id={`sparkGrad-${s.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor={sparkColor} stopOpacity="0.3" />
                                <stop offset="70%" stopColor={sparkColor} stopOpacity="0.05" />
                                <stop offset="100%" stopColor={sparkColor} stopOpacity="0" />
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="i" hide />
                            <YAxis hide domain={computeYDomain(sparkData.map(d => ({price: d.p})), 0.1)} />
                            <Area type="monotone" dataKey="p" stroke={sparkColor} fill={`url(#sparkGrad-${s.id})`} strokeWidth={1.5}
                              dot={(props: Record<string, unknown>) => {
                                const { cx, cy, index } = props as { cx: number; cy: number; index: number }
                                if (index !== sparkData.length - 1) return <g key={String(index)} />
                                return (
                                  <g key={`dot-${s.id}`}>
                                    <circle cx={cx} cy={cy} r={5} fill={sparkColor} opacity={0.2}>
                                      <animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite" />
                                      <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
                                    </circle>
                                    <circle cx={cx} cy={cy} r={3} fill={sparkColor} stroke="#fff" strokeWidth={1} />
                                  </g>
                                )
                              }}
                              activeDot={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="flex items-end justify-between">
                        <div>
                          <span className="block text-[13px] md:text-sm font-black text-gs-text tabular-nums">{formatRupiah(s.price)}</span>
                          <div className={`inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded-md ${isUp ? 'bg-emerald-50' : 'bg-red-50'}`}>
                            {isUp ? <TrendingUp className="w-3 h-3 text-emerald-600" /> : <TrendingDown className="w-3 h-3 text-red-500" />}
                            <span className={`text-[9px] md:text-[10px] font-bold ${isUp ? 'text-emerald-600' : 'text-red-500'}`}>{formatPercent(s.changePercent)}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <button onClick={() => openContract(s)} className="h-8 px-4 rounded-lg bg-emerald-600 text-white text-[9px] md:text-[10px] font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1">
                            <Package className="w-3.5 h-3.5" />Kontrak
                          </button>
                          <span className="text-[7px] font-bold text-gs-gold">Mulai 5%/hari</span>
                        </div>
                      </div>

                      {/* Contract Info */}
                      <div className="mt-2 pt-2 border-t border-gs-line grid grid-cols-3 gap-1">
                        <div>
                          <span className="block text-[6px] md:text-[7px] font-bold text-gs-muted">Rate</span>
                          <span className="block text-[8px] md:text-[9px] font-black text-emerald-700">{getStockBaseRate(s.code)}%/hari</span>
                        </div>
                        <div>
                          <span className="block text-[6px] md:text-[7px] font-bold text-gs-muted">Min. 30 Hari</span>
                          <span className="block text-[8px] md:text-[9px] font-black text-gs-gold">s/d 365 Hari</span>
                        </div>
                        <div>
                          <span className="block text-[6px] md:text-[7px] font-bold text-gs-muted">Vol</span>
                          <div className="flex items-center gap-1">
                            <span className="text-[7px] md:text-[8px] font-bold text-gs-text">{formatNumber(s.volume)}</span>
                            <div className="flex-1 h-1.5 rounded-full bg-gs-soft overflow-hidden">
                              <div className={`h-full rounded-full ${isUp ? 'bg-emerald-500' : 'bg-red-400'}`} style={{ width: `${volPercent}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {filteredStocks.length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <BarChart3 className="w-10 h-10 text-gs-muted mx-auto mb-2" />
                    <p className="text-[11px] md:text-sm font-bold text-gs-muted">Tidak ada saham ditemukan</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ====== PORTFOLIO TAB ====== */}
          {activeTab === 'portfolio' && (
            <motion.div key="portfolio" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {/* Portfolio Value Card */}
              <div className="rounded-3xl overflow-hidden mb-4" style={{ background: 'linear-gradient(145deg, #022c22 0%, #064e3b 54%, #059669 100%)' }}>
                <div className="p-4 text-white">
                  <span className="text-[9px] font-medium text-emerald-200">Nilai Portofolio</span>
                  <b className="block text-2xl font-black mt-0.5">{formatRupiah(portfolioSummary.totalCurrentValue)}</b>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold ${portfolioSummary.totalProfitLoss >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                      {formatRupiah(portfolioSummary.totalProfitLoss)} ({formatPercent(portfolioSummary.totalProfitLossPercent)})
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="rounded-2xl p-2.5 bg-white/10 border border-white/15">
                      <span className="text-[7px] text-emerald-200">Investasi</span>
                      <b className="block text-[11px] font-black mt-0.5">{formatRupiah(portfolioSummary.totalInvested)}</b>
                    </div>
                    <div className="rounded-2xl p-2.5 bg-white/10 border border-white/15">
                      <span className="text-[7px] text-emerald-200">Saldo</span>
                      <b className="block text-[11px] font-black mt-0.5">{formatRupiah(portfolioSummary.cashBalance)}</b>
                    </div>
                  </div>
                </div>
              </div>

              {/* Holdings */}
              <h3 className="text-[11px] md:text-sm font-black text-gs-green3 mb-2">Saham Dimiliki</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
                {portfolio.map(p => (
                  <div key={p.id} className="rounded-2xl p-3 md:p-4 bg-white border border-gs-line shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 cursor-pointer" onClick={() => openStockDetail(p.stock)}>
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer ${p.profitLoss >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>{p.stock.logo ? <img src={p.stock.logo} alt={p.stock.code} className="w-full h-full object-cover" /> : <span className={`text-[8px] md:text-[10px] font-black ${p.profitLoss >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{p.stock.code.slice(0, 2)}</span>}</div>
                        <div>
                          <span className="block text-[10px] md:text-xs font-black text-gs-text">{p.stock.code}</span>
                          <span className="block text-[7px] md:text-[8px] text-gs-muted">{formatRupiah(p.currentValue)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] md:text-xs font-black text-gs-text tabular-nums">{formatRupiah(p.currentValue)}</span>
                        <span className={`block text-[9px] md:text-[10px] font-bold ${p.profitLoss >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {formatRupiah(p.profitLoss)} ({formatPercent(p.profitLossPercent)})
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => openContract(p.stock)} className="flex-1 h-7 md:h-8 rounded-lg bg-emerald-600 text-white text-[8px] md:text-[9px] font-bold flex items-center justify-center gap-1"><Package className="w-3 h-3" />Kontrak</button>
                    </div>
                  </div>
                ))}
                {portfolio.length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <Briefcase className="w-10 h-10 text-gs-muted mx-auto mb-2" />
                    <p className="text-[11px] md:text-sm font-bold text-gs-muted">Belum ada saham di portofolio</p>
                    <button onClick={() => setActiveTab('market')} className="mt-2 h-8 px-4 rounded-xl bg-gs-green3 text-white text-[9px] md:text-[10px] font-bold">Mulai Investasi</button>
                  </div>
                )}
              </div>

              {/* Active Stock Contracts */}
              {userContracts.filter(c => c.status === 'active').length > 0 && (
                <>
                  <h3 className="text-[11px] md:text-sm font-black text-gs-green3 mt-4 mb-2">Kontrak Saham Aktif</h3>
                  <div className="space-y-2">
                    {userContracts.filter(c => c.status === 'active').map(c => {
                      const progress = Math.round((c.daysElapsed / c.duration) * 100)
                      const canClaim = !c.lastClaimAt || new Date(c.lastClaimAt).toDateString() !== new Date().toDateString()
                      return (
                        <div key={c.id} className="rounded-2xl p-3 bg-white border border-emerald-200 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg grid place-items-center bg-emerald-50">
                                <Package className="w-4 h-4 text-emerald-600" />
                              </div>
                              <div>
                                <span className="block text-[10px] md:text-xs font-black text-gs-text">{c.stockCode}</span>
                                <span className="block text-[7px] text-gs-muted">{c.duration} hari • {c.dailyProfitRate}%/hari</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="block text-[10px] font-black text-gs-text">{formatRupiah(c.amount)}</span>
                              <span className="block text-[8px] font-bold text-emerald-600">+{formatRupiah(c.dailyProfitAmount)}/hari</span>
                            </div>
                          </div>
                          {/* Progress */}
                          <div className="mb-2">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[7px] font-bold text-gs-muted">Hari {c.daysElapsed}/{c.duration}</span>
                              <span className="text-[7px] font-bold text-gs-green3">{progress}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-gs-soft overflow-hidden">
                              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[7px] text-gs-muted">Diklaim: {formatRupiah(c.totalClaimed)} / {formatRupiah(c.totalProfit)}</span>
                            <button onClick={() => handleContractClaim(c.id)} disabled={!canClaim || contractClaimLoadingId === c.id}
                              className={`h-7 px-3 rounded-lg text-[8px] font-bold transition-colors ${canClaim ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gs-soft text-gs-muted cursor-not-allowed'}`}>
                              {contractClaimLoadingId === c.id ? '...' : canClaim ? 'Klaim Profit' : 'Sudah Diklaim'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              {/* Active Investments in Portfolio */}
              {userInvestments.filter(i => i.status === 'active').length > 0 && (
                <>
                  <h3 className="text-[11px] md:text-sm font-black text-gs-green3 mt-4 mb-2">Investasi Aktif</h3>
                  <div className="space-y-2">
                    {userInvestments.filter(i => i.status === 'active').map(inv => {
                      const progress = Math.round((inv.daysElapsed / inv.duration) * 100)
                      return (
                        <div key={inv.id} className="rounded-2xl p-3 bg-white border border-gs-line shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg grid place-items-center bg-emerald-50">
                                <DollarSign className="w-4 h-4 text-emerald-600" />
                              </div>
                              <div>
                                <span className="block text-[10px] font-black text-gs-text">{inv.product.name}</span>
                                <span className="block text-[7px] text-gs-muted">{formatRupiah(inv.amount)} • {inv.product.category === 'potential' ? 'Potential' : 'Dividen'}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="block text-[9px] font-black text-emerald-600">+{formatRupiah(inv.dailyProfit)}/hari</span>
                              <span className="block text-[7px] text-gs-muted">{inv.daysElapsed}/{inv.duration} hari</span>
                            </div>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-gs-soft overflow-hidden mb-1">
                            <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: 'linear-gradient(135deg, #064e3b, #059669)' }} />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[7px] font-bold text-gs-muted">{formatRupiah(inv.totalClaimed)} diklaim</span>
                            <span className="text-[7px] font-bold text-gs-green3">{progress}%</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ====== INVESTASI TAB ====== */}
          {activeTab === 'investasi' && (
            <motion.div key="investasi" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {/* Header Card */}
              <div className="rounded-3xl overflow-hidden mb-4" style={{ background: 'linear-gradient(145deg, #022c22 0%, #064e3b 54%, #059669 100%)' }}>
                <div className="p-4 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-yellow-300" />
                    <h2 className="text-[16px] md:text-xl font-black">Investasi</h2>
                  </div>
                  <p className="text-[9px] md:text-[10px] text-emerald-200 leading-relaxed mb-3">Pilih paket investasi dan dapatkan profit harian secara otomatis. Semua profit dikreditkan ke saldo Anda setiap 24 jam.</p>

                  {/* Pasar Aktif Stats */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-white/10 border border-white/15">
                      <Package className="w-3 h-3 text-yellow-300" />
                      <span className="text-[8px] font-black text-white">{investProducts.length} Produk</span>
                    </div>
                    <div className="flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-white/10 border border-white/15">
                      <Award className="w-3 h-3 text-yellow-300" />
                      <span className="text-[8px] font-black text-white">{new Set(investProducts.map(p => p.category)).size} Kategori</span>
                    </div>
                    <div className="flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-white/10 border border-white/15">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[8px] font-black text-emerald-300">Live 24/7</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="rounded-2xl p-2.5 bg-white/10 border border-white/15 text-center">
                      <Package className="w-4 h-4 text-yellow-300 mx-auto mb-0.5" />
                      <b className="block text-[8px] font-black">{investProducts.length}</b>
                      <span className="block text-[7px] text-emerald-200 font-bold">Produk</span>
                    </div>
                    <div className="rounded-2xl p-2.5 bg-white/10 border border-white/15 text-center">
                      <Sparkles className="w-4 h-4 text-yellow-300 mx-auto mb-0.5" />
                      <b className="block text-[8px] font-black">{userInvestments.filter(i => i.status === 'active').length}</b>
                      <span className="block text-[7px] text-emerald-200 font-bold">Aktif</span>
                    </div>
                    <div className="rounded-2xl p-2.5 bg-white/10 border border-white/15 text-center">
                      <Wallet className="w-4 h-4 text-yellow-300 mx-auto mb-0.5" />
                      <b className="block text-[8px] font-black">{formatRupiah(user?.balance || 0).replace('Rp', '').trim()}</b>
                      <span className="block text-[7px] text-emerald-200 font-bold">Saldo</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category Tabs */}
              <div className="flex gap-2 mb-4">
                <button onClick={() => setInvestCategory('potential')} className={`flex-1 h-10 rounded-2xl text-[11px] md:text-xs font-bold transition-colors ${investCategory === 'potential' ? 'bg-gs-green3 text-white' : 'bg-white border border-gs-line text-gs-muted'}`}>
                  <TrendingUp className="w-3.5 h-3.5 inline mr-1" />Saham Potential
                </button>
                <button onClick={() => setInvestCategory('dividen')} className={`flex-1 h-10 rounded-2xl text-[11px] md:text-xs font-bold transition-colors ${investCategory === 'dividen' ? 'bg-gs-green3 text-white' : 'bg-white border border-gs-line text-gs-muted'}`}>
                  <Award className="w-3.5 h-3.5 inline mr-1" />Saham Dividen
                </button>
              </div>

              {/* Product Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {investProducts.filter(p => p.category === investCategory).map(product => {
                  const movement = investMovement.get(product.id)
                  const isUp = movement ? movement.changePercent >= 0 : true
                  const currentVal = product.modal + (movement?.change || 0)
                  const rawData = getInvestChartData(product)
                  const chartData = getDataForTimeframe(rawData, investTimeframe)
                  const chartColor = isUp ? '#059669' : '#ef4444'
                  const lastValue = chartData.length > 0 ? chartData[chartData.length - 1].value : product.modal

                  return (
                    <div key={product.id} className="rounded-2xl bg-white border border-gs-line shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                      {/* Top badges */}
                      <div className="px-3 pt-3 flex items-center gap-1.5 flex-wrap">
                        <span className="h-4 px-1.5 rounded-full bg-emerald-100 border border-emerald-200 text-[7px] font-black text-emerald-700 flex items-center gap-0.5">
                          <CheckCircle className="w-2.5 h-2.5" />Tersedia
                        </span>
                        <span className="h-4 px-1.5 rounded-full bg-yellow-100 border border-yellow-200 text-[7px] font-black text-yellow-700">DAILY PROFIT</span>
                        <span className="h-4 px-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[7px] font-bold text-emerald-600">{product.duration} Hari</span>
                      </div>

                      {/* Product Name + Price */}
                      <div className="px-3 pt-2 pb-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-[13px] font-black text-gs-text">{product.name}</h3>
                            <span className="text-[8px] font-bold text-gs-muted">Aset Saham</span>
                          </div>
                          <div className="text-right">
                            <span className="block text-[12px] font-black tabular-nums" style={{ color: isUp ? '#16a34a' : '#dc2626' }}>{formatRupiah(lastValue)}</span>
                            <span className={`text-[8px] font-black ${isUp ? 'text-emerald-600' : 'text-red-500'}`}>
                              {isUp ? '▲' : '▼'} {movement ? (isUp ? '+' : '') + movement.changePercent.toFixed(2) + '%' : '+0.00%'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Professional Dark Chart Section */}
                      <div className="mx-3 mt-2 rounded-xl overflow-hidden" style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {/* Chart Header — controls row */}
                        <div className="flex items-center justify-between px-2.5 py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <div className="flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: isUp ? '#34d399' : '#f87171' }} />
                            <span className="text-[6px] font-black" style={{ color: isUp ? '#34d399' : '#f87171' }}>LIVE</span>
                            <span className="text-[6px] font-bold text-gray-600 ml-1">MARKET</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {/* Chart Type Selector — pill style */}
                            <div className="flex items-center rounded-md p-0.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                              {(['candle', 'area', 'line', 'bar'] as const).map(ct => (
                                <button key={ct} onClick={() => setInvestChartType(ct)}
                                  className={`h-4 px-1.5 rounded text-[6px] font-bold transition-all duration-200 ${investChartType === ct ? '' : 'opacity-40 hover:opacity-70'}`}
                                  style={investChartType === ct ? { background: 'rgba(5,150,105,0.3)', color: '#34d399' } : { color: '#9ca3af' }}>
                                  {ct.charAt(0).toUpperCase() + ct.slice(1)}
                                </button>
                              ))}
                            </div>
                            {/* Timeframe Selector */}
                            <div className="flex items-center gap-0.5">
                              {(['1H', '1D', '1W', '1M', 'ALL'] as const).map(tf => (
                                <button key={tf} onClick={() => setInvestTimeframe(tf)}
                                  className={`h-4 px-1 rounded text-[6px] font-bold transition-all ${investTimeframe === tf ? '' : 'opacity-40 hover:opacity-70'}`}
                                  style={investTimeframe === tf ? { background: 'rgba(5,150,105,0.3)', color: '#34d399' } : { color: '#9ca3af' }}>
                                  {tf}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        {/* Gradient separator */}
                        <div className="h-px" style={{ background: isUp ? 'linear-gradient(90deg, transparent, rgba(52,211,153,0.2), transparent)' : 'linear-gradient(90deg, transparent, rgba(248,113,113,0.2), transparent)' }} />

                        {/* Chart Area */}
                        <div className="h-[160px] px-1 py-2" style={{ background: '#0d1117' }}>
                          {chartData.length > 2 ? (() => {
                            const values = chartData.map(d => d.value)
                            const minV = Math.min(...values)
                            const maxV = Math.max(...values)
                            const rangeV = maxV - minV || 1
                            const domain: [number, number] = [Math.floor(minV - rangeV * 0.08), Math.ceil(maxV + rangeV * 0.08)]

                            // Candlestick chart
                            if (investChartType === 'candle') {
                              const candles = getCandleData(chartData)
                              if (candles.length < 2) return <div className="flex items-center justify-center h-full text-[8px] text-gray-500">Memuat...</div>
                              const allPrices = candles.flatMap(c => [c.high, c.low])
                              const minP = Math.min(...allPrices)
                              const maxP = Math.max(...allPrices)
                              const rangeP = maxP - minP || 1
                              const totalCandles = candles.length
                              const svgW = 400
                              const priceH = 130
                              const candleW = Math.max(3, Math.floor((svgW - 16) / totalCandles * 0.65))
                              const gapW = Math.max(1, Math.floor((svgW - 16) / totalCandles * 0.35))
                              const padding = { top: 8, bottom: 8, left: 4, right: 42 }
                              const priceToY = (p: number) => padding.top + ((maxP - p) / rangeP) * (priceH - padding.top - padding.bottom)
                              return (
                                <svg className="w-full h-full" viewBox={`0 0 ${svgW} ${priceH}`} preserveAspectRatio="xMidYMid meet">
                                  {/* Grid lines — dashed horizontal + vertical */}
                                  {[0, 1, 2, 3, 4].map(gi => {
                                    const y = padding.top + gi * ((priceH - padding.top - padding.bottom) / 5)
                                    return <line key={`gh${gi}`} x1={padding.left} y1={y} x2={svgW - padding.right} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" strokeDasharray="2,4" />
                                  })}
                                  {[0, 1, 2, 3, 4].map(gi => {
                                    const x = padding.left + gi * ((svgW - padding.left - padding.right) / 4)
                                    return <line key={`gv${gi}`} x1={x} y1={padding.top} x2={x} y2={priceH - padding.bottom} stroke="rgba(255,255,255,0.025)" strokeWidth="0.5" strokeDasharray="2,6" />
                                  })}
                                  {/* Price labels with pills */}
                                  {[0, 2, 4].map(gi => {
                                    const price = maxP - (gi / 5) * rangeP
                                    const y = priceToY(price)
                                    return (
                                      <g key={`p${gi}`}>
                                        <rect x={svgW - padding.right + 2} y={y - 4} width={padding.right - 4} height="8" rx="2" fill="rgba(255,255,255,0.04)" />
                                        <text x={svgW - 2} y={y + 2.5} textAnchor="end" fill="rgba(255,255,255,0.25)" fontSize="6" fontFamily="monospace" fontWeight="500">{formatRupiah(Math.round(price)).replace('Rp', '').trim()}</text>
                                      </g>
                                    )
                                  })}
                                  {/* Current price line */}
                                  <line x1={padding.left} y1={priceToY(lastValue)} x2={svgW - padding.right} y2={priceToY(lastValue)} stroke={chartColor} strokeWidth="0.5" strokeDasharray="3,3" opacity="0.35" />
                                  <rect x={svgW - padding.right + 1} y={priceToY(lastValue) - 5} width={padding.right - 2} height="10" rx="3" fill={chartColor} opacity="0.85" />
                                  <text x={svgW - padding.right + 2 + (padding.right - 6) / 2} y={priceToY(lastValue) + 2.5} textAnchor="middle" fill="white" fontSize="5" fontFamily="monospace" fontWeight="700">{formatRupiah(lastValue).replace('Rp', '').trim()}</text>
                                  {/* Candles */}
                                  {candles.map((c, i) => {
                                    const candleSpacing = (svgW - padding.left - padding.right) / totalCandles
                                    const cx = padding.left + i * candleSpacing + candleSpacing / 2
                                    const x = cx - candleW / 2
                                    const yH = priceToY(c.high)
                                    const yL = priceToY(c.low)
                                    const yO = priceToY(c.open)
                                    const yC = priceToY(c.close)
                                    const isGreen = c.close >= c.open
                                    const bodyTop = Math.min(yO, yC)
                                    const bodyH = Math.max(Math.abs(yO - yC), 1.5)
                                    const isLast = i === totalCandles - 1
                                    const fillColor = isGreen ? '#22c55e' : '#ef4444'
                                    return (
                                      <g key={i} opacity={isLast ? 1 : 0.9}>
                                        <line x1={cx} y1={yH} x2={cx} y2={yL} stroke={fillColor} strokeWidth="0.8" opacity={isLast ? 1 : 0.7} />
                                        <rect x={x} y={bodyTop} width={candleW} height={bodyH} fill={fillColor} rx="1" />
                                        {isLast && (
                                          <>
                                            <circle cx={cx} cy={yC} r="2" fill={fillColor}>
                                              <animate attributeName="r" values="2;4;2" dur="1.5s" repeatCount="indefinite" />
                                              <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.5s" repeatCount="indefinite" />
                                            </circle>
                                            <circle cx={cx} cy={yC} r="1.5" fill={fillColor} />
                                          </>
                                        )}
                                      </g>
                                    )
                                  })}
                                </svg>
                              )
                            }

                            // Bar chart
                            if (investChartType === 'bar') {
                              const barData = chartData.map((d, i) => ({
                                idx: d.idx, value: d.value,
                                fill: i > 0 && d.value >= chartData[i - 1].value ? '#22c55e' : '#ef4444'
                              }))
                              return (
                                <ResponsiveContainer width="100%" height="100%">
                                  <ReBarChart data={barData} margin={{ top: 4, right: 40, bottom: 2, left: 2 }}>
                                    <CartesianGrid strokeDasharray="1 3" stroke="rgba(255,255,255,0.03)" horizontal vertical={false} />
                                    <XAxis dataKey="idx" hide />
                                    <YAxis hide domain={domain} />
                                    <Bar dataKey="value" radius={[1, 1, 0, 0]} maxBarSize={8} isAnimationActive={true} animationDuration={800}
                                      shape={(props: Record<string, unknown>) => {
                                        const { x, y, width, height, fill: _fill } = props as { x: number; y: number; width: number; height: number; fill: string }
                                        return <rect x={x} y={y} width={Math.max(width, 1.5)} height={Math.max(height, 0.5)} fill={_fill} opacity={0.85} />
                                      }}>
                                      {barData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}
                                    </Bar>
                                    <YAxis yAxisId="price" orientation="right" domain={domain} tickFormatter={(v: number) => formatRupiah(v).replace('Rp', '').trim()} tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 7, fontFamily: 'monospace' }} axisLine={false} tickLine={false} width={38} />
                                  </ReBarChart>
                                </ResponsiveContainer>
                              )
                            }

                            // Line chart
                            if (investChartType === 'line') {
                              return (
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={chartData} margin={{ top: 4, right: 40, bottom: 2, left: 2 }}>
                                    <CartesianGrid strokeDasharray="1 3" stroke="rgba(255,255,255,0.03)" horizontal vertical={false} />
                                    <XAxis dataKey="idx" hide />
                                    <YAxis hide domain={domain} />
                                    <ReferenceLine y={lastValue} stroke={chartColor} strokeDasharray="3 3" strokeOpacity={0.3} />
                                    <Line type="monotone" dataKey="value" stroke={chartColor} strokeWidth={1.5} dot={false}
                                      activeDot={{ r: 3, fill: chartColor, stroke: '#0d1117', strokeWidth: 1.5 }}
                                      isAnimationActive={true} animationDuration={800} />
                                    <YAxis yAxisId="price" orientation="right" domain={domain} tickFormatter={(v: number) => formatRupiah(v).replace('Rp', '').trim()} tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 7, fontFamily: 'monospace' }} axisLine={false} tickLine={false} width={38} />
                                  </LineChart>
                                </ResponsiveContainer>
                              )
                            }

                            // Area chart (default)
                            return (
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 4, right: 40, bottom: 2, left: 2 }}>
                                  <defs>
                                    <linearGradient id={`investGrad-${product.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                      <stop offset="0%" stopColor={chartColor} stopOpacity="0.15" />
                                      <stop offset="50%" stopColor={chartColor} stopOpacity="0.06" />
                                      <stop offset="100%" stopColor={chartColor} stopOpacity="0.02" />
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="1 3" stroke="rgba(255,255,255,0.03)" horizontal vertical={false} />
                                  <XAxis dataKey="idx" hide />
                                  <YAxis hide domain={domain} />
                                  <ReferenceLine y={lastValue} stroke={chartColor} strokeDasharray="3 3" strokeOpacity={0.25} />
                                  <Area type="monotone" dataKey="value" stroke={chartColor} fill={`url(#investGrad-${product.id})`} strokeWidth={1.5}
                                    dot={(props: Record<string, unknown>) => {
                                      const { cx, cy, index } = props as { cx: number; cy: number; index: number }
                                      if (index !== chartData.length - 1) return <g key={String(index)} />
                                      return (
                                        <g key={`invest-dot-${product.id}`}>
                                          <circle cx={cx} cy={cy} r={5} fill={chartColor} opacity={0.1}>
                                            <animate attributeName="r" values="5;9;5" dur="2s" repeatCount="indefinite" />
                                            <animate attributeName="opacity" values="0.1;0;0.1" dur="2s" repeatCount="indefinite" />
                                          </circle>
                                          <circle cx={cx} cy={cy} r={2.5} fill={chartColor} stroke="#0d1117" strokeWidth={1.5} />
                                        </g>
                                      )
                                    }}
                                    activeDot={{ r: 3, fill: chartColor, stroke: '#0d1117', strokeWidth: 1.5 }}
                                    isAnimationActive={true} animationDuration={800} />
                                  <YAxis yAxisId="price" orientation="right" domain={domain} tickFormatter={(v: number) => formatRupiah(v).replace('Rp', '').trim()} tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 7, fontFamily: 'monospace' }} axisLine={false} tickLine={false} width={38} />
                                </AreaChart>
                              </ResponsiveContainer>
                            )
                          })() : (
                            <div className="flex items-center justify-center h-full text-[8px] text-gray-500">Memuat data...</div>
                          )
                          }
                        </div>
                      </div>

                      {/* Product Details */}
                      <div className="px-3 pt-2 pb-1 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-bold text-gs-muted uppercase tracking-wider">MODAL</span>
                          <span className="text-[10px] font-black text-gs-text">{formatRupiah(product.modal)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-bold text-gs-muted uppercase tracking-wider">PROFIT HARIAN</span>
                          <span className="text-[10px] font-black text-emerald-600">+{formatRupiah(product.dailyProfit)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-bold text-gs-muted uppercase tracking-wider">TOTAL KEUNTUNGAN</span>
                          <div className="text-right">
                            <span className="text-[10px] font-black text-gs-green3">{formatRupiah(product.totalReturn)}</span>
                            <span className="ml-1 text-[7px] font-bold text-yellow-600 bg-yellow-50 px-1 rounded">ROI {product.roi}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Profit Distribution Footer */}
                      <div className="px-3 py-1.5 bg-gs-soft border-t border-gs-line">
                        <div className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-gs-green" />
                          <span className="text-[7px] font-bold text-gs-green">PEMBAGIAN PROFIT: Setiap 24 jam AUTO</span>
                        </div>
                      </div>

                      {/* Buttons */}
                      <div className="px-3 pb-3 pt-2 flex gap-2">
                        <button onClick={() => { setSelectedDetailProduct(product); setShowInvestDetailModal(true) }}
                          className="flex-1 h-9 rounded-xl bg-gs-soft border border-gs-line text-gs-green3 text-[9px] font-bold hover:bg-emerald-50 transition-colors">
                          Lihat Selengkapnya
                        </button>
                        <button onClick={() => { setSelectedProduct(product); setShowInvestModal(true) }}
                          className="flex-1 h-9 rounded-xl text-white text-[9px] font-black tracking-wide hover:scale-[1.02] transition-transform"
                          style={{ background: 'linear-gradient(135deg, #064e3b 0%, #064e3b 50%, #059669 100%)' }}>
                          Investasi Sekarang
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Active Investments Summary */}
              {userInvestments.filter(i => i.status === 'active').length > 0 && (
                <div className="mt-6">
                  <h3 className="text-[11px] md:text-sm font-black text-gs-green3 mb-2">Investasi Aktif Anda</h3>
                  <div className="space-y-2">
                    {userInvestments.filter(i => i.status === 'active').map(inv => {
                      const progress = Math.round((inv.daysElapsed / inv.duration) * 100)
                      const canClaim = !inv.lastClaimAt || (Date.now() - new Date(inv.lastClaimAt).getTime()) > 10000
                      return (
                        <div key={inv.id} className="rounded-2xl p-3 bg-white border border-gs-line shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className="block text-[11px] font-black text-gs-text">{inv.product.name}</span>
                              <span className="block text-[8px] text-gs-muted">{formatRupiah(inv.amount)} • {inv.daysElapsed}/{inv.duration} hari</span>
                            </div>
                            <div className="text-right">
                              <span className="block text-[10px] font-black text-emerald-600">+{formatRupiah(inv.dailyProfit)}/hari</span>
                              <span className="block text-[8px] text-gs-muted">Diklaim: {formatRupiah(inv.totalClaimed)}</span>
                            </div>
                          </div>
                          {/* Progress Bar */}
                          <div className="w-full h-2 rounded-full bg-gs-soft overflow-hidden mb-2">
                            <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: 'linear-gradient(135deg, #064e3b, #059669)' }} />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-bold text-gs-muted">{progress}% selesai</span>
                            <button onClick={() => handleClaimProfit(inv.id)} disabled={claimLoadingId === inv.id || !canClaim}
                              className={`h-7 px-3 rounded-lg text-[8px] font-bold transition-colors ${canClaim ? 'bg-gs-green3 text-white hover:bg-gs-green' : 'bg-gs-soft text-gs-muted cursor-not-allowed'}`}>
                              {claimLoadingId === inv.id ? 'Memproses...' : canClaim ? 'Klaim Profit' : 'Menunggu...'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Completed Investments */}
              {userInvestments.filter(i => i.status === 'completed').length > 0 && (
                <div className="mt-4">
                  <h3 className="text-[11px] md:text-sm font-black text-gs-green3 mb-2">Investasi Selesai</h3>
                  <div className="space-y-1.5">
                    {userInvestments.filter(i => i.status === 'completed').map(inv => (
                      <div key={inv.id} className="rounded-2xl p-3 bg-gray-50 border border-gray-200 flex items-center justify-between">
                        <div>
                          <span className="block text-[10px] font-bold text-gs-text">{inv.product.name}</span>
                          <span className="block text-[8px] text-gs-muted">Modal: {formatRupiah(inv.amount)}</span>
                        </div>
                        <div className="text-right">
                          <span className="block text-[10px] font-black text-emerald-600">+{formatRupiah(inv.totalClaimed)}</span>
                          <span className="block text-[7px] text-gs-muted flex items-center gap-0.5 justify-end"><CheckCircle className="w-2.5 h-2.5" />Selesai</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ====== SINYAL PRO TAB ====== */}
          {activeTab === 'sinyal' && (
            <motion.div key="sinyal" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {/* Header Card */}
              <div className="rounded-3xl overflow-hidden mb-4" style={{ background: 'linear-gradient(145deg, #022c22 0%, #064e3b 54%, #059669 100%)' }}>
                <div className="p-4 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-yellow-300" />
                      <h2 className="text-[16px] md:text-xl font-black">Sinyal Pro</h2>
                    </div>
                    <div className="flex items-center gap-1.5 h-6 px-2.5 rounded-full bg-red-500/30 border border-red-400/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                      <span className="text-[8px] font-black text-red-300">LIVE</span>
                    </div>
                  </div>
                  <p className="text-[9px] md:text-[10px] text-emerald-200 leading-relaxed mb-3">Analisis arah pasar dan raih profit hingga 40%</p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-2xl p-2.5 bg-white/10 border border-white/15 text-center">
                      <Zap className="w-4 h-4 text-yellow-300 mx-auto mb-0.5" />
                      <b className="block text-[10px] font-black">{sinyalPositions.filter(p => p.status === 'active').length}</b>
                      <span className="block text-[7px] text-emerald-200 font-bold">Posisi Aktif</span>
                    </div>
                    <div className="rounded-2xl p-2.5 bg-white/10 border border-white/15 text-center">
                      <TrendingUp className="w-4 h-4 text-emerald-300 mx-auto mb-0.5" />
                      <b className="block text-[10px] font-black">{formatRupiah(sinyalPositions.filter(p => p.status === 'won').reduce((acc, p) => acc + Math.round(p.amount * p.profitPercent / 100), 0)).replace('Rp', '').trim()}</b>
                      <span className="block text-[7px] text-emerald-200 font-bold">Total Profit</span>
                    </div>
                    <div className="rounded-2xl p-2.5 bg-white/10 border border-white/15 text-center">
                      <Award className="w-4 h-4 text-yellow-300 mx-auto mb-0.5" />
                      <b className="block text-[10px] font-black">{sinyalPositions.filter(p => p.status !== 'active').length > 0 ? Math.round(sinyalPositions.filter(p => p.status === 'won').length / sinyalPositions.filter(p => p.status !== 'active').length * 100) : 0}%</b>
                      <span className="block text-[7px] text-emerald-200 font-bold">Win Rate</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ====== LIVE TRENDING CHART — PROFESSIONAL ====== */}
              {sinyalChartStock && (() => {
                const rawData = getSinyalChartData(sinyalChartStock.id)
                const chartData = getDataForTimeframe(rawData, sinyalTimeframe)
                const isUp = sinyalChartStock.changePercent >= 0
                const chartColor = isUp ? '#059669' : '#ef4444'
                const lastValue = chartData.length > 0 ? chartData[chartData.length - 1].value : sinyalChartStock.price
                const ma7 = computeMA(chartData, 7)
                const ma25 = computeMA(chartData, 25)
                const ma99 = computeMA(chartData, 99)
                const bb = computeBB(chartData, 20, 2)
                const volData = generateVolume(chartData)
                // Merge MA data into chartData for Recharts
                const enrichedData = chartData.map((d, i) => ({
                  ...d,
                  ma7: ma7[i],
                  ma25: ma25[i],
                  ma99: ma99[i],
                  bbUpper: sinyalShowBB ? bb.upper[i] : null,
                  bbLower: sinyalShowBB ? bb.lower[i] : null,
                  bbMid: sinyalShowBB ? bb.mid[i] : null,
                }))

                return (
                  <div className="rounded-2xl overflow-hidden mb-4 shadow-lg" style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 0 20px rgba(0,0,0,0.4), 0 0 1px rgba(52,211,153,0.1)' }}>
                    {/* ROW 1: Header Bar — Stock info left, Chart type right */}
                    <div className="py-3 px-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {/* LEFT: Stock Info */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center ${isUp ? 'bg-emerald-900/40' : 'bg-red-900/40'}`}>
                          {sinyalChartStock.logo ? <img src={sinyalChartStock.logo} alt={sinyalChartStock.code} className="w-full h-full object-cover" /> : <span className={`text-[9px] font-black ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>{sinyalChartStock.code.slice(0, 2)}</span>}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[14px] font-black text-white">{sinyalChartStock.code}</span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black flex items-center gap-0.5 ${isUp ? 'bg-emerald-900/60 text-emerald-400' : 'bg-red-900/60 text-red-400'}`}>
                              {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                              {formatPercent(sinyalChartStock.changePercent)}
                            </span>
                          </div>
                          <span className="block text-[8px] text-gray-500 max-w-[160px] truncate">{sinyalChartStock.name}</span>
                        </div>
                      </div>
                      {/* CENTER: Chart Type Selector — segmented control */}
                      <div className="hidden md:flex items-center rounded-lg p-0.5 mx-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {([
                          { type: 'candle' as const, label: 'Candle' },
                          { type: 'area' as const, label: 'Area' },
                          { type: 'line' as const, label: 'Line' },
                          { type: 'bar' as const, label: 'Bar' },
                          { type: 'mountain' as const, label: 'Mtn' },
                          { type: 'step' as const, label: 'Step' },
                          { type: 'histogram' as const, label: 'Histo' },
                          { type: 'hollow' as const, label: 'Hollow' },
                        ]).map(ct => (
                          <button key={ct.type} onClick={() => setSinyalChartType(ct.type)}
                            className={`h-7 px-2.5 rounded-md text-[9px] font-bold flex items-center justify-center transition-all duration-200 whitespace-nowrap ${sinyalChartType === ct.type ? '' : 'opacity-40 hover:opacity-70 hover:bg-white/5'}`}
                            style={sinyalChartType === ct.type ? { background: 'rgba(5,150,105,0.3)', color: '#34d399', boxShadow: '0 0 8px rgba(52,211,153,0.15), inset 0 1px 0 rgba(255,255,255,0.08)' } : { color: '#9ca3af' }}>
                            {ct.label}
                          </button>
                        ))}
                      </div>
                      {/* RIGHT: Price + LIVE badge + Stats */}
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-baseline gap-2 justify-end">
                          <span className="text-[18px] font-black tabular-nums font-mono leading-none" style={{ color: isUp ? '#34d399' : '#f87171' }}>{formatRupiah(lastValue)}</span>
                          <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: isUp ? '#34d399' : '#f87171' }} />
                            <span className="text-[7px] font-black" style={{ color: isUp ? '#34d399' : '#f87171' }}>LIVE</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 mt-0.5 justify-end">
                          <span className="text-[7px] text-gray-600">O <span className="font-mono font-bold text-gray-400">{formatRupiah(chartData.length > 0 ? chartData[0].value : sinyalChartStock.price).replace('Rp', '').trim()}</span></span>
                          <span className="text-[7px] text-gray-600">H <span className="font-mono font-bold text-emerald-400">{formatRupiah(Math.max(...chartData.map(d => d.value))).replace('Rp', '').trim()}</span></span>
                          <span className="text-[7px] text-gray-600">L <span className="font-mono font-bold text-red-400">{formatRupiah(Math.min(...chartData.map(d => d.value))).replace('Rp', '').trim()}</span></span>
                        </div>
                      </div>
                    </div>

                    {/* ROW 2: Controls Bar — Timeframe left, Indicators right */}
                    <div className="py-2 px-4 flex items-center justify-between gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.015)' }}>
                      <div className="flex items-center gap-2">
                        {/* Mobile Chart Type Selector */}
                        <div className="md:hidden flex items-center rounded-lg p-0.5 overflow-x-auto" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          {([
                            { type: 'candle' as const, label: 'C' },
                            { type: 'area' as const, label: 'A' },
                            { type: 'line' as const, label: 'L' },
                            { type: 'bar' as const, label: 'B' },
                            { type: 'mountain' as const, label: 'M' },
                            { type: 'step' as const, label: 'S' },
                            { type: 'histogram' as const, label: 'H' },
                            { type: 'hollow' as const, label: 'O' },
                          ]).map(ct => (
                            <button key={ct.type} onClick={() => setSinyalChartType(ct.type)}
                              className={`h-6 w-6 rounded text-[8px] font-bold flex items-center justify-center transition-all duration-200 ${sinyalChartType === ct.type ? '' : 'opacity-40 hover:opacity-70'}`}
                              style={sinyalChartType === ct.type ? { background: 'rgba(5,150,105,0.3)', color: '#34d399' } : { color: '#9ca3af' }}>
                              {ct.label}
                            </button>
                          ))}
                        </div>
                        {/* Timeframe Selector — segmented control */}
                        <div className="flex items-center rounded-lg p-0.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          {(['1M', '5M', '15M', '1H', '4H', '1D', '1W', 'ALL'] as const).map(tf => (
                            <button key={tf} onClick={() => setSinyalTimeframe(tf)}
                              className={`h-6 px-2 rounded-md text-[8px] font-bold transition-all duration-200 ${sinyalTimeframe === tf ? '' : 'opacity-40 hover:opacity-70'}`}
                              style={sinyalTimeframe === tf ? { background: 'rgba(5,150,105,0.3)', color: '#34d399', boxShadow: '0 0 6px rgba(52,211,153,0.1)' } : { color: '#9ca3af' }}>
                              {tf}
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* Indicator Toggles — pill buttons with dot indicator */}
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setSinyalShowMA7(!sinyalShowMA7)}
                          className={`h-6 px-2 rounded-md text-[8px] font-bold flex items-center gap-1 transition-all duration-200 ${sinyalShowMA7 ? '' : 'opacity-35 hover:opacity-60'}`}
                          style={sinyalShowMA7 ? { background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.15)' } : { color: '#9ca3af', border: '1px solid transparent' }}>
                          {sinyalShowMA7 && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />}MA7
                        </button>
                        <button onClick={() => setSinyalShowMA25(!sinyalShowMA25)}
                          className={`h-6 px-2 rounded-md text-[8px] font-bold flex items-center gap-1 transition-all duration-200 ${sinyalShowMA25 ? '' : 'opacity-35 hover:opacity-60'}`}
                          style={sinyalShowMA25 ? { background: 'rgba(96,165,250,0.12)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.15)' } : { color: '#9ca3af', border: '1px solid transparent' }}>
                          {sinyalShowMA25 && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}MA25
                        </button>
                        <button onClick={() => setSinyalShowMA99(!sinyalShowMA99)}
                          className={`h-6 px-2 rounded-md text-[8px] font-bold flex items-center gap-1 transition-all duration-200 ${sinyalShowMA99 ? '' : 'opacity-35 hover:opacity-60'}`}
                          style={sinyalShowMA99 ? { background: 'rgba(192,132,252,0.12)', color: '#c084fc', border: '1px solid rgba(192,132,252,0.15)' } : { color: '#9ca3af', border: '1px solid transparent' }}>
                          {sinyalShowMA99 && <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />}MA99
                        </button>
                        <button onClick={() => setSinyalShowBB(!sinyalShowBB)}
                          className={`h-6 px-2 rounded-md text-[8px] font-bold flex items-center gap-1 transition-all duration-200 ${sinyalShowBB ? '' : 'opacity-35 hover:opacity-60'}`}
                          style={sinyalShowBB ? { background: 'rgba(244,114,182,0.12)', color: '#f472b6', border: '1px solid rgba(244,114,182,0.15)' } : { color: '#9ca3af', border: '1px solid transparent' }}>
                          {sinyalShowBB && <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />}BB
                        </button>
                        <button onClick={() => setSinyalShowVolume(!sinyalShowVolume)}
                          className={`h-6 px-2 rounded-md text-[8px] font-bold flex items-center gap-1 transition-all duration-200 ${sinyalShowVolume ? '' : 'opacity-35 hover:opacity-60'}`}
                          style={sinyalShowVolume ? { background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.15)' } : { color: '#9ca3af', border: '1px solid transparent' }}>
                          {sinyalShowVolume && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}VOL
                        </button>
                        <button onClick={() => setSinyalShowRSI(!sinyalShowRSI)}
                          className={`h-6 px-2 rounded-md text-[8px] font-bold flex items-center gap-1 transition-all duration-200 ${sinyalShowRSI ? '' : 'opacity-35 hover:opacity-60'}`}
                          style={sinyalShowRSI ? { background: 'rgba(167,139,250,0.12)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.15)' } : { color: '#9ca3af', border: '1px solid transparent' }}>
                          {sinyalShowRSI && <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />}RSI
                        </button>
                      </div>
                    </div>

                    {/* Separator — gradient line */}
                    <div className="h-px" style={{ background: isUp ? 'linear-gradient(90deg, transparent 0%, rgba(52,211,153,0.25) 50%, transparent 100%)' : 'linear-gradient(90deg, transparent 0%, rgba(248,113,113,0.25) 50%, transparent 100%)' }} />

                    {/* Chart Area — Professional TradingView-style */}
                    <div className="relative px-2 py-3" style={{ minHeight: 280, background: '#0d1117' }}
                      onMouseMove={(e) => { const rect = e.currentTarget.getBoundingClientRect(); setSinyalCrosshair({ x: e.clientX - rect.left, y: e.clientY - rect.top, idx: Math.floor(((e.clientX - rect.left) / rect.width) * chartData.length) }) }}
                      onMouseLeave={() => setSinyalCrosshair(null)}>
                      {/* Crosshair overlay */}
                      {sinyalCrosshair && chartData.length > 2 && (
                        <div className="chart-crosshair absolute inset-0 z-10 pointer-events-none" style={{ left: 8, right: 8, top: 12, bottom: 12 }}>
                          <div className="absolute top-0 bottom-0 w-px" style={{ left: sinyalCrosshair.x - 8, background: 'rgba(255,255,255,0.06)' }} />
                          <div className="absolute left-0 right-0 h-px" style={{ top: sinyalCrosshair.y - 12, background: 'rgba(255,255,255,0.06)' }} />
                          {sinyalCrosshair.idx >= 0 && sinyalCrosshair.idx < chartData.length && (
                            <div className="chart-tooltip absolute px-2 py-1 rounded text-[8px] font-mono font-bold" style={{ left: Math.min(sinyalCrosshair.x + 2, 200), top: Math.max(sinyalCrosshair.y - 24, 0), background: 'rgba(13,17,23,0.95)', border: '1px solid rgba(255,255,255,0.1)', color: chartData[sinyalCrosshair.idx].value >= (sinyalCrosshair.idx > 0 ? chartData[sinyalCrosshair.idx - 1].value : chartData[sinyalCrosshair.idx].value) ? '#34d399' : '#f87171', zIndex: 20 }}>
                              {formatRupiah(chartData[sinyalCrosshair.idx].value)}
                            </div>
                          )}
                        </div>
                      )}
                      {chartData.length > 2 ? (() => {
                        const values = chartData.map(d => d.value)
                        const minV = Math.min(...values)
                        const maxV = Math.max(...values)
                        const rangeV = maxV - minV || 1
                        const domain: [number, number] = [Math.floor(minV - rangeV * 0.08), Math.ceil(maxV + rangeV * 0.08)]

                        // RSI data
                        const rsiData = sinyalShowRSI ? computeRSI(chartData) : null

                        // ---- CANDLESTICK CHART (default) ----
                        if (sinyalChartType === 'candle' || sinyalChartType === 'hollow') {
                          const candles = getCandleData(chartData)
                          if (candles.length < 2) return <div className="flex items-center justify-center h-48 text-[9px] text-gray-500">Memuat data...</div>
                          const allPrices = candles.flatMap(c => [c.high, c.low])
                          const minP = Math.min(...allPrices)
                          const maxP = Math.max(...allPrices)
                          const rangeP = maxP - minP || 1
                          const totalCandles = candles.length
                          // Wider viewBox for sharper retina rendering
                          const svgW = 840
                          const padding = { top: 16, bottom: 8, left: 6, right: 62 }
                          const drawW = svgW - padding.left - padding.right
                          const candleSpacing = drawW / totalCandles
                          const candleW = Math.max(6, Math.floor(candleSpacing * 0.65))
                          const rsiH = sinyalShowRSI ? 64 : 0
                          const priceH = 240
                          const volH = sinyalShowVolume ? 44 : 0
                          const chartH = priceH + volH + rsiH + 8

                          // MA data for candles
                          const candleMA7 = computeMA(chartData, 7)
                          const candleMA25 = computeMA(chartData, 25)
                          const ma7Points: string[] = []
                          const ma25Points: string[] = []
                          const stepX = svgW / chartData.length

                          // Map price to Y coordinate
                          const priceToY = (p: number) => padding.top + ((maxP - p) / rangeP) * (priceH - padding.top - padding.bottom)

                          chartData.forEach((d, i) => {
                            if (candleMA7[i] !== null) ma7Points.push(`${i * stepX},${priceToY(candleMA7[i]!)}`)
                            if (candleMA25[i] !== null) ma25Points.push(`${i * stepX},${priceToY(candleMA25[i]!)}`)
                          })

                          // Current price Y
                          const curPriceY = priceToY(sinyalChartStock.price)

                          return (
                            <svg className="w-full" viewBox={`0 0 ${svgW} ${chartH}`} preserveAspectRatio="xMidYMid meet" style={{ minHeight: 280 }}>
                              <defs>
                                {/* Subtle pulse animation for last candle dot */}
                                <filter id="candlePulse" x="-50%" y="-50%" width="200%" height="200%">
                                  <feGaussianBlur stdDeviation="1.5" result="blur" />
                                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                </filter>
                              </defs>
                              {/* Grid lines — subtle dashed horizontal */}
                              {[0, 1, 2, 3, 4, 5, 6, 7].map(gi => {
                                const y = padding.top + gi * ((priceH - padding.top - padding.bottom) / 8)
                                return <line key={`gh${gi}`} x1={padding.left} y1={y} x2={svgW - padding.right} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" strokeDasharray="2,4" />
                              })}
                              {/* Grid lines — subtle dashed vertical */}
                              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(gi => {
                                const x = padding.left + gi * (drawW / 8)
                                return <line key={`gv${gi}`} x1={x} y1={padding.top} x2={x} y2={priceH - padding.bottom} stroke="rgba(255,255,255,0.025)" strokeWidth="0.5" strokeDasharray="2,6" />
                              })}
                              {/* Price labels — right side with background pills */}
                              {[0, 2, 4, 6].map(gi => {
                                const price = maxP - (gi / 8) * rangeP
                                const y = padding.top + gi * ((priceH - padding.top - padding.bottom) / 8)
                                const label = formatRupiah(Math.round(price)).replace('Rp', '').trim()
                                return (
                                  <g key={`p${gi}`}>
                                    <rect x={svgW - padding.right + 4} y={y - 5} width={padding.right - 6} height="10" rx="2" fill="rgba(255,255,255,0.04)" />
                                    <text x={svgW - 4} y={y + 3} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize="7" fontFamily="monospace" fontWeight="500">{label}</text>
                                  </g>
                                )
                              })}
                              {/* Current price line — thin dashed with price tag pill */}
                              <line x1={padding.left} y1={curPriceY} x2={svgW - padding.right} y2={curPriceY} stroke={chartColor} strokeWidth="0.5" strokeDasharray="3,3" opacity="0.35" />
                              <rect x={svgW - padding.right + 2} y={curPriceY - 7} width={padding.right - 4} height="14" rx="3" fill={chartColor} opacity="0.9" />
                              <text x={svgW - padding.right + 4 + (padding.right - 8) / 2} y={curPriceY + 3} textAnchor="middle" fill="white" fontSize="7" fontFamily="monospace" fontWeight="700">{formatRupiah(sinyalChartStock.price).replace('Rp', '').trim()}</text>
                              {/* MA Lines — clean, no glow */}
                              {sinyalShowMA7 && ma7Points.length > 1 && <polyline points={ma7Points.join(' ')} fill="none" stroke="#fbbf24" strokeWidth="1" opacity="0.6" />}
                              {sinyalShowMA25 && ma25Points.length > 1 && <polyline points={ma25Points.join(' ')} fill="none" stroke="#60a5fa" strokeWidth="1" opacity="0.6" />}
                              {/* Candles — professional TradingView-style */}
                              {candles.map((c, i) => {
                                const cx = padding.left + i * candleSpacing + candleSpacing / 2
                                const x = cx - candleW / 2
                                const yH = priceToY(c.high)
                                const yL = priceToY(c.low)
                                const yO = priceToY(c.open)
                                const yC = priceToY(c.close)
                                const isGreen = c.close >= c.open
                                const bodyTop = Math.min(yO, yC)
                                const bodyH = Math.max(Math.abs(yO - yC), 1.5)
                                const isLast = i === totalCandles - 1
                                const isHollow = sinyalChartType === 'hollow'
                                const fillColor = isGreen ? (isLast ? '#2dd469' : '#22c55e') : (isLast ? '#f87171' : '#ef4444')
                                return (
                                  <g key={i} opacity={isLast ? 1 : 0.9}>
                                    {/* Wick — thin, centered */}
                                    <line x1={cx} y1={yH} x2={cx} y2={yL} stroke={fillColor} strokeWidth="0.8" opacity={isLast ? 1 : 0.7} />
                                    {/* Body — thick with subtle rounded corners */}
                                    {isHollow ? (
                                      <rect x={x} y={bodyTop} width={candleW} height={bodyH} fill={isGreen ? 'transparent' : fillColor} stroke={fillColor} strokeWidth="0.8" rx="1" />
                                    ) : (
                                      <rect x={x} y={bodyTop} width={candleW} height={bodyH} fill={fillColor} rx="1" />
                                    )}
                                    {/* Last candle indicator — subtle pulsing dot */}
                                    {isLast && (
                                      <>
                                        <circle cx={cx} cy={yC} r="2" fill={fillColor}>
                                          <animate attributeName="r" values="2;4;2" dur="1.5s" repeatCount="indefinite" />
                                          <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.5s" repeatCount="indefinite" />
                                        </circle>
                                        <circle cx={cx} cy={yC} r="1.5" fill={fillColor} />
                                      </>
                                    )}
                                  </g>
                                )
                              })}
                              {/* Volume bars — clean, flat, aligned with candles */}
                              {sinyalShowVolume && volData.slice(0, totalCandles * Math.ceil(chartData.length / totalCandles)).filter((_, i) => i % Math.ceil(chartData.length / totalCandles) === 0).slice(0, totalCandles).map((v, i) => {
                                const cx = padding.left + i * candleSpacing + candleSpacing / 2
                                const x = cx - candleW / 2
                                const maxVol = Math.max(...volData.map(vd => vd.vol))
                                const h = Math.max(1, (v.vol / maxVol) * volH * 0.8)
                                const volBaseY = priceH + 4
                                return <rect key={`v${i}`} x={x} y={volBaseY - h} width={candleW} height={h} fill={v.up ? '#22c55e' : '#ef4444'} opacity={0.4} />
                              })}
                              {/* RSI Subplot */}
                              {sinyalShowRSI && rsiData && (() => {
                                const rsiY = priceH + volH + 8
                                const rsiChartH = 56
                                const rsiPadTop = 10
                                const rsiPadBot = 6
                                const rsiDrawH = rsiChartH - rsiPadTop - rsiPadBot
                                const rsiToY = (val: number) => rsiY + rsiPadTop + rsiDrawH * (1 - val / 100)
                                return (
                                  <g>
                                    <line x1={padding.left} y1={rsiY} x2={svgW - padding.right} y2={rsiY} stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
                                    <text x={padding.left + 2} y={rsiY + 8} fill="rgba(167,139,250,0.5)" fontSize="7" fontFamily="monospace" fontWeight="600">RSI(14)</text>
                                    {/* Reference lines at 30 and 70 */}
                                    <line x1={padding.left} y1={rsiToY(70)} x2={svgW - padding.right} y2={rsiToY(70)} stroke="rgba(239,68,68,0.2)" strokeWidth="0.5" strokeDasharray="3,4" />
                                    <line x1={padding.left} y1={rsiToY(30)} x2={svgW - padding.right} y2={rsiToY(30)} stroke="rgba(34,197,94,0.2)" strokeWidth="0.5" strokeDasharray="3,4" />
                                    {/* RSI labels */}
                                    <text x={svgW - padding.right + 6} y={rsiToY(70) + 3} fill="rgba(239,68,68,0.35)" fontSize="6" fontFamily="monospace">70</text>
                                    <text x={svgW - padding.right + 6} y={rsiToY(30) + 3} fill="rgba(34,197,94,0.35)" fontSize="6" fontFamily="monospace">30</text>
                                    <text x={svgW - padding.right + 6} y={rsiToY(50) + 3} fill="rgba(255,255,255,0.15)" fontSize="5" fontFamily="monospace">50</text>
                                    {/* Fill between 30-70 */}
                                    <rect x={padding.left} y={rsiToY(70)} width={drawW} height={rsiToY(30) - rsiToY(70)} fill="rgba(167,139,250,0.03)" />
                                    {/* RSI Line — clean, no glow */}
                                    {(() => {
                                      const rsiPts: string[] = []
                                      rsiData.forEach((val, i) => {
                                        if (val !== null) rsiPts.push(`${i * stepX},${rsiToY(val)}`)
                                      })
                                      return rsiPts.length > 1 ? <polyline points={rsiPts.join(' ')} fill="none" stroke="#a78bfa" strokeWidth="1" opacity="0.75" /> : null
                                    })()}
                                  </g>
                                )
                              })()}
                            </svg>
                          )
                        }

                        // ---- RECHARTS-BASED CHARTS ----
                        // Prepare enriched data with MA lines + volume for ComposedChart
                        const composedData = enrichedData.map((d, i) => ({
                          ...d,
                          vol: volData[i]?.vol || 0,
                          volUp: volData[i]?.up || true,
                        }))
                        const maxVol = Math.max(...volData.map(v => v.vol))

                        // Shared RSI subplot renderer
                        const renderRSI = () => sinyalShowRSI && rsiData ? (
                          <div className="h-[52px] mt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={chartData.map((d, i) => ({ idx: d.idx, rsi: rsiData[i] }))} margin={{ top: 4, right: 52, bottom: 2, left: 8 }}>
                                <defs>
                                  <linearGradient id="rsiFill" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.08" />
                                    <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="1 3" stroke="rgba(255,255,255,0.03)" horizontal vertical={false} />
                                <XAxis dataKey="idx" hide />
                                <YAxis hide domain={[0, 100]} />
                                <ReferenceLine y={70} stroke="rgba(239,68,68,0.2)" strokeDasharray="3 3" strokeWidth={0.5} />
                                <ReferenceLine y={30} stroke="rgba(34,197,94,0.2)" strokeDasharray="3 3" strokeWidth={0.5} />
                                <ReferenceLine y={50} stroke="rgba(255,255,255,0.04)" strokeDasharray="2 4" strokeWidth={0.5} />
                                <Area type="monotone" dataKey="rsi" stroke="none" fill="url(#rsiFill)" dot={false} connectNulls />
                                <Line type="monotone" dataKey="rsi" stroke="#a78bfa" strokeWidth={1} dot={false} activeDot={{ r: 3, fill: '#a78bfa', stroke: '#0d1117', strokeWidth: 1.5 }} connectNulls />
                                <YAxis yAxisId="rsiLabel" orientation="right" domain={[0, 100]} tickFormatter={() => ''} axisLine={false} tickLine={false} width={50} />
                              </LineChart>
                            </ResponsiveContainer>
                            <div className="flex items-center justify-between px-2 -mt-0.5">
                              <span className="text-[7px] font-bold text-violet-400/50">RSI(14)</span>
                              {rsiData.filter(v => v !== null).length > 0 && <span className="text-[8px] font-mono font-bold text-violet-400">{rsiData.filter(v => v !== null).slice(-1)[0]?.toFixed(1)}</span>}
                            </div>
                          </div>
                        ) : null

                        // Area / Mountain / Step chart — ComposedChart with volume overlay
                        if (sinyalChartType === 'area' || sinyalChartType === 'mountain' || sinyalChartType === 'step') {
                          const areaType = sinyalChartType === 'step' ? 'stepAfter' : 'monotone'
                          return (
                            <div className="relative" style={{ paddingLeft: 8, paddingRight: 0 }}>
                              <div className="h-[260px] md:h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                  <ComposedChart data={composedData} margin={{ top: 8, right: 52, bottom: 0, left: 0 }}>
                                    <defs>
                                      <linearGradient id={`proGrad-${sinyalChartStock.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor={chartColor} stopOpacity={sinyalChartType === 'mountain' ? 0.45 : 0.15} />
                                        <stop offset="50%" stopColor={chartColor} stopOpacity={sinyalChartType === 'mountain' ? 0.25 : 0.06} />
                                        <stop offset="100%" stopColor={chartColor} stopOpacity={0.02} />
                                      </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="1 3" stroke="rgba(255,255,255,0.03)" horizontal vertical={false} />
                                    <XAxis dataKey="idx" hide />
                                    <YAxis yAxisId="price" orientation="right" domain={domain} tickFormatter={(v: number) => formatRupiah(v).replace('Rp', '').trim()} tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 8, fontFamily: 'monospace' }} axisLine={false} tickLine={false} width={52} />
                                    <YAxis yAxisId="volume" orientation="right" domain={[0, maxVol * 4]} hide />
                                    <ReferenceLine yAxisId="price" y={sinyalChartStock.price} stroke={chartColor} strokeDasharray="3 3" strokeOpacity={0.3} />
                                    {/* Volume bars — overlaid */}
                                    {sinyalShowVolume && <Bar yAxisId="volume" dataKey="vol" maxBarSize={6} isAnimationActive={false}
                                      shape={(props: Record<string, unknown>) => {
                                        const { x, y, width, height, payload } = props as { x: number; y: number; width: number; height: number; payload: { volUp: boolean } }
                                        return <rect x={x} y={y} width={Math.max(width, 1)} height={Math.max(height, 0.5)} fill={payload.volUp ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'} />
                                      }} />}
                                    {/* Bollinger Bands */}
                                    {sinyalShowBB && <>
                                      <Area yAxisId="price" type="monotone" dataKey="bbUpper" stroke="none" fill="transparent" dot={false} />
                                      <Area yAxisId="price" type="monotone" dataKey="bbLower" stroke="#f472b6" fill="rgba(244,114,182,0.05)" strokeWidth={0.6} strokeDasharray="3 2" dot={false} />
                                    </>}
                                    {/* MA Lines */}
                                    {sinyalShowMA7 && <Line yAxisId="price" type="monotone" dataKey="ma7" stroke="#fbbf24" strokeWidth={1} dot={false} activeDot={false} connectNulls />}
                                    {sinyalShowMA25 && <Line yAxisId="price" type="monotone" dataKey="ma25" stroke="#60a5fa" strokeWidth={1} dot={false} activeDot={false} connectNulls />}
                                    {sinyalShowMA99 && <Line yAxisId="price" type="monotone" dataKey="ma99" stroke="#c084fc" strokeWidth={0.8} dot={false} activeDot={false} connectNulls />}
                                    {/* Main area */}
                                    <Area yAxisId="price" type={areaType} dataKey="value" stroke={chartColor} fill={`url(#proGrad-${sinyalChartStock.id})`} strokeWidth={sinyalChartType === 'mountain' ? 0 : 1.5}
                                      dot={(props: Record<string, unknown>) => {
                                        const { cx, cy, index } = props as { cx: number; cy: number; index: number }
                                        if (index !== composedData.length - 1) return <g key={String(index)} />
                                        return (
                                          <g key="pro-dot">
                                            <circle cx={cx} cy={cy} r={5} fill={chartColor} opacity={0.1}>
                                              <animate attributeName="r" values="5;10;5" dur="2s" repeatCount="indefinite" />
                                              <animate attributeName="opacity" values="0.1;0;0.1" dur="2s" repeatCount="indefinite" />
                                            </circle>
                                            <circle cx={cx} cy={cy} r={2.5} fill={chartColor} stroke="#0d1117" strokeWidth={1.5} />
                                          </g>
                                        )
                                      }}
                                      activeDot={{ r: 3, fill: chartColor, stroke: '#0d1117', strokeWidth: 1.5 }}
                                      isAnimationActive={true} animationDuration={800} />
                                  </ComposedChart>
                                </ResponsiveContainer>
                              </div>
                              {renderRSI()}
                            </div>
                          )
                        }

                        // Line chart — ComposedChart with volume overlay
                        if (sinyalChartType === 'line') {
                          return (
                            <div className="relative" style={{ paddingLeft: 8, paddingRight: 0 }}>
                              <div className="h-[260px] md:h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                  <ComposedChart data={composedData} margin={{ top: 8, right: 52, bottom: 0, left: 0 }}>
                                    <CartesianGrid strokeDasharray="1 3" stroke="rgba(255,255,255,0.03)" horizontal vertical={false} />
                                    <XAxis dataKey="idx" hide />
                                    <YAxis yAxisId="price" orientation="right" domain={domain} tickFormatter={(v: number) => formatRupiah(v).replace('Rp', '').trim()} tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 8, fontFamily: 'monospace' }} axisLine={false} tickLine={false} width={52} />
                                    <YAxis yAxisId="volume" orientation="right" domain={[0, maxVol * 4]} hide />
                                    <ReferenceLine yAxisId="price" y={sinyalChartStock.price} stroke={chartColor} strokeDasharray="3 3" strokeOpacity={0.3} />
                                    {/* Volume bars — overlaid */}
                                    {sinyalShowVolume && <Bar yAxisId="volume" dataKey="vol" maxBarSize={6} isAnimationActive={false}
                                      shape={(props: Record<string, unknown>) => {
                                        const { x, y, width, height, payload } = props as { x: number; y: number; width: number; height: number; payload: { volUp: boolean } }
                                        return <rect x={x} y={y} width={Math.max(width, 1)} height={Math.max(height, 0.5)} fill={payload.volUp ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'} />
                                      }} />}
                                    {sinyalShowMA7 && <Line yAxisId="price" type="monotone" dataKey="ma7" stroke="#fbbf24" strokeWidth={1} dot={false} activeDot={false} connectNulls />}
                                    {sinyalShowMA25 && <Line yAxisId="price" type="monotone" dataKey="ma25" stroke="#60a5fa" strokeWidth={1} dot={false} activeDot={false} connectNulls />}
                                    {sinyalShowMA99 && <Line yAxisId="price" type="monotone" dataKey="ma99" stroke="#c084fc" strokeWidth={0.8} dot={false} activeDot={false} connectNulls />}
                                    {/* Main line */}
                                    <Line yAxisId="price" type="monotone" dataKey="value" stroke={chartColor} strokeWidth={1.5} dot={false}
                                      activeDot={{ r: 3, fill: chartColor, stroke: '#0d1117', strokeWidth: 1.5 }}
                                      isAnimationActive={true} animationDuration={800} connectNulls />
                                  </ComposedChart>
                                </ResponsiveContainer>
                              </div>
                              {renderRSI()}
                            </div>
                          )
                        }

                        // Bar / Histogram chart — ComposedChart with volume overlay
                        if (sinyalChartType === 'bar' || sinyalChartType === 'histogram') {
                          const barComposedData = composedData.map((d, i) => ({
                            ...d,
                            barFill: i > 0 && d.value >= composedData[i - 1].value ? '#22c55e' : '#ef4444'
                          }))
                          return (
                            <div className="relative" style={{ paddingLeft: 8, paddingRight: 0 }}>
                              <div className="h-[260px] md:h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                  <ComposedChart data={barComposedData} margin={{ top: 8, right: 52, bottom: 0, left: 0 }}>
                                    <CartesianGrid strokeDasharray="1 3" stroke="rgba(255,255,255,0.03)" horizontal vertical={false} />
                                    <XAxis dataKey="idx" hide />
                                    <YAxis yAxisId="price" orientation="right" domain={domain} tickFormatter={(v: number) => formatRupiah(v).replace('Rp', '').trim()} tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 8, fontFamily: 'monospace' }} axisLine={false} tickLine={false} width={52} />
                                    <YAxis yAxisId="volume" orientation="right" domain={[0, maxVol * 4]} hide />
                                    <ReferenceLine yAxisId="price" y={sinyalChartStock.price} stroke={chartColor} strokeDasharray="3 3" strokeOpacity={0.3} />
                                    {/* Volume bars — overlaid */}
                                    {sinyalShowVolume && <Bar yAxisId="volume" dataKey="vol" maxBarSize={6} isAnimationActive={false}
                                      shape={(props: Record<string, unknown>) => {
                                        const { x, y, width, height, payload } = props as { x: number; y: number; width: number; height: number; payload: { volUp: boolean } }
                                        return <rect x={x} y={y} width={Math.max(width, 1)} height={Math.max(height, 0.5)} fill={payload.volUp ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'} />
                                      }} />}
                                    {/* MA Lines */}
                                    {sinyalShowMA7 && <Line yAxisId="price" type="monotone" dataKey="ma7" stroke="#fbbf24" strokeWidth={1} dot={false} activeDot={false} connectNulls />}
                                    {sinyalShowMA25 && <Line yAxisId="price" type="monotone" dataKey="ma25" stroke="#60a5fa" strokeWidth={1} dot={false} activeDot={false} connectNulls />}
                                    {/* Price bars */}
                                    <Bar yAxisId="price" dataKey="value" radius={[1, 1, 0, 0]} isAnimationActive={true} animationDuration={800} maxBarSize={sinyalChartType === 'histogram' ? 4 : 10}
                                      shape={(props: Record<string, unknown>) => {
                                        const { x, y, width, height, payload } = props as { x: number; y: number; width: number; height: number; payload: { barFill: string } }
                                        return <rect x={x} y={y} width={Math.max(width, 1.5)} height={Math.max(height, 0.5)} fill={payload.barFill} opacity={0.85} />
                                      }} />
                                  </ComposedChart>
                                </ResponsiveContainer>
                              </div>
                              {renderRSI()}
                            </div>
                          )
                        }

                        // Fallback — Area
                        return null
                      })() : (
                        <div className="flex items-center justify-center h-48 text-[9px] text-gray-500">Memuat data grafik...</div>
                      )}
                    </div>

                    {/* Trade Buttons */}
                    <div className="py-3 px-4 flex gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <button onClick={() => { setSelectedSinyalStock(sinyalChartStock); setShowSinyalModal(true); setSinyalDirection('NAIK'); setSinyalAmount(''); setSinyalDuration(30); setSinyalResult(null) }}
                        className="flex-1 h-11 rounded-xl text-white text-[12px] font-black flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        style={{ background: 'linear-gradient(135deg, #059669, #34d399)', boxShadow: '0 2px 8px rgba(5,150,105,0.3)' }}>
                        <TrendingUp className="w-4 h-4" />NAIK
                      </button>
                      <button onClick={() => { setSelectedSinyalStock(sinyalChartStock); setShowSinyalModal(true); setSinyalDirection('TURUN'); setSinyalAmount(''); setSinyalDuration(30); setSinyalResult(null) }}
                        className="flex-1 h-11 rounded-xl text-white text-[12px] font-black flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        style={{ background: 'linear-gradient(135deg, #dc2626, #f87171)', boxShadow: '0 2px 8px rgba(220,38,38,0.3)' }}>
                        <TrendingDown className="w-4 h-4" />TURUN
                      </button>
                    </div>
                  </div>
                )
              })()}

              {/* Stock Selector Horizontal Scroll */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[11px] md:text-sm font-black text-gs-green3">Pilih Saham</h3>
                  <div className="flex items-center gap-1">
                    <BarChart3 className="w-3 h-3 text-gs-muted" />
                    <span className="text-[8px] font-bold text-gs-muted">{stocks.length} Saham</span>
                  </div>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar" style={{ scrollSnapType: 'x mandatory' }}>
                  {stocks.slice(0, 20).map(s => {
                    const isUp = s.changePercent >= 0
                    const isSelected = sinyalChartStock?.id === s.id
                    return (
                      <button key={s.id} onClick={() => setSinyalChartStock(s)}
                        className={`flex-shrink-0 rounded-xl p-2.5 border transition-all text-left min-w-[120px] ${isSelected ? 'border-gs-green3 bg-emerald-50 shadow-md shadow-emerald-100' : 'border-gs-line bg-white hover:border-emerald-200 hover:shadow-sm'}`}
                        style={{ scrollSnapAlign: 'start' }}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className={`w-6 h-6 rounded-lg overflow-hidden flex items-center justify-center ${isUp ? 'bg-emerald-50' : 'bg-red-50'}`}>
                            {s.logo ? <img src={s.logo} alt={s.code} className="w-full h-full object-cover" /> : <span className={`text-[7px] font-black ${isUp ? 'text-emerald-700' : 'text-red-600'}`}>{s.code.slice(0, 2)}</span>}
                          </div>
                          <div>
                            <span className="block text-[9px] font-black text-gs-text">{s.code}</span>
                            <span className={`block text-[7px] font-bold ${isUp ? 'text-emerald-600' : 'text-red-500'}`}>{formatPercent(s.changePercent)}</span>
                          </div>
                        </div>
                        <span className="block text-[10px] font-black tabular-nums text-gs-text">{formatRupiah(s.price)}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Active Position Card */}
              {sinyalActive && sinyalPositions.find(p => p.status === 'active') && (() => {
                const ap = sinyalPositions.find(p => p.status === 'active')!
                return (
                  <div className="rounded-2xl p-4 mb-4 border-2 border-emerald-500 bg-emerald-50 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-emerald-600 animate-pulse" />
                        <span className="text-[11px] font-black text-emerald-700">POSISI AKTIF</span>
                      </div>
                      <span className="text-[9px] font-bold text-emerald-500">{ap.stockCode}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className={`text-[16px] font-black ${ap.direction === 'NAIK' ? 'text-emerald-600' : 'text-red-600'}`}>{ap.direction}</span>
                        <span className="block text-[8px] text-gs-muted">{formatRupiah(ap.amount)} • Profit +{ap.profitPercent.toFixed(1)}%</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[24px] font-black text-emerald-700 tabular-nums">{sinyalTimer}s</span>
                        <span className="block text-[7px] text-gs-muted">sisa waktu</span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-emerald-200 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(0, (1 - sinyalTimer / ap.duration) * 100)}%`, background: 'linear-gradient(135deg, #064e3b, #059669)' }} />
                    </div>
                  </div>
                )
              })()}

              {/* Last Result */}
              {sinyalResult && !sinyalActive && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={`rounded-2xl p-4 mb-4 border-2 ${sinyalResult.won ? 'border-emerald-500 bg-emerald-50' : 'border-red-500 bg-red-50'}`}>
                  <div className="text-center">
                    <span className="text-[24px]">{sinyalResult.won ? '🎯' : '❌'}</span>
                    <h3 className={`text-[14px] font-black ${sinyalResult.won ? 'text-emerald-700' : 'text-red-700'}`}>
                      {sinyalResult.won ? 'Prediksi Benar!' : 'Prediksi Salah'}
                    </h3>
                    <span className={`text-[12px] font-bold ${sinyalResult.won ? 'text-emerald-600' : 'text-red-600'}`}>
                      {sinyalResult.won ? `+${formatRupiah(Math.abs(sinyalResult.profit))}` : `-${formatRupiah(Math.abs(sinyalResult.profit))}`}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Stock Grid — All Stocks with Mini Sparklines */}
              <div className="mb-2">
                <h3 className="text-[11px] md:text-sm font-black text-gs-green3 mb-2">Semua Saham</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-3">
                {stocks.slice(0, 20).map(s => {
                  const sparkData = getSparklineData(s)
                  const isUp = s.changePercent >= 0
                  const sparkColor = isUp ? '#059669' : '#ef4444'
                  const isSelected = sinyalChartStock?.id === s.id

                  return (
                    <div key={s.id} className={`rounded-2xl p-3 md:p-4 bg-white border shadow-sm hover:shadow-md transition-all cursor-pointer ${isSelected ? 'border-gs-green3 ring-1 ring-gs-green3/30' : isUp ? 'border-emerald-100' : 'border-red-100'}`}
                      onClick={() => setSinyalChartStock(s)}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl overflow-hidden flex items-center justify-center ${isUp ? 'bg-emerald-50' : 'bg-red-50'}`}>{s.logo ? <img src={s.logo} alt={s.code} className="w-full h-full object-cover" /> : <span className={`text-[9px] md:text-[10px] font-black ${isUp ? 'text-emerald-700' : 'text-red-600'}`}>{s.code.slice(0, 2)}</span>}</div>
                          <div>
                            <span className="block text-[10px] md:text-xs font-black text-gs-text">{s.code}</span>
                            <span className="block text-[7px] md:text-[8px] text-gs-muted max-w-[100px] md:max-w-[140px] truncate">{s.name}</span>
                          </div>
                        </div>
                        {isSelected ? <div className="w-5 h-5 rounded-full bg-gs-green3 grid place-items-center"><CheckCircle className="w-3 h-3 text-white" /></div> : <Target className="w-4 h-4 text-gs-muted" />}
                      </div>

                      {/* Mini Sparkline */}
                      <div className="h-[40px] -mx-1 mb-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={sparkData} margin={{ top: 2, right: 8, bottom: 2, left: 2 }}>
                            <defs>
                              <linearGradient id={`sinyalGrad-${s.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor={sparkColor} stopOpacity="0.3" />
                                <stop offset="70%" stopColor={sparkColor} stopOpacity="0.05" />
                                <stop offset="100%" stopColor={sparkColor} stopOpacity="0" />
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="i" hide />
                            <YAxis hide domain={computeYDomain(sparkData.map(d => ({price: d.p})), 0.1)} />
                            <Area type="monotone" dataKey="p" stroke={sparkColor} fill={`url(#sinyalGrad-${s.id})`} strokeWidth={1.5} dot={false} activeDot={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="flex items-end justify-between">
                        <div>
                          <span className="block text-[13px] md:text-sm font-black text-gs-text tabular-nums">{formatRupiah(s.price)}</span>
                          <div className={`inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded-md ${isUp ? 'bg-emerald-50' : 'bg-red-50'}`}>
                            {isUp ? <TrendingUp className="w-3 h-3 text-emerald-600" /> : <TrendingDown className="w-3 h-3 text-red-500" />}
                            <span className={`text-[9px] md:text-[10px] font-bold ${isUp ? 'text-emerald-600' : 'text-red-500'}`}>{formatPercent(s.changePercent)}</span>
                          </div>
                        </div>
                        <span className="text-[8px] font-bold text-gs-gold">+40%</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Position History */}
              {sinyalPositions.filter(p => p.status !== 'active').length > 0 && (
                <div className="mt-4">
                  <h3 className="text-[11px] md:text-sm font-black text-gs-green3 mb-2">Riwayat Posisi</h3>
                  <div className="space-y-2">
                    {sinyalPositions.filter(p => p.status !== 'active').slice(-5).reverse().map(pos => (
                      <div key={pos.id} className={`rounded-2xl p-3 border ${pos.status === 'won' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg grid place-items-center ${pos.status === 'won' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                              {pos.status === 'won' ? <TrendingUp className="w-4 h-4 text-emerald-600" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
                            </div>
                            <div>
                              <span className="block text-[10px] font-black text-gs-text">{pos.stockCode} • {pos.direction}</span>
                              <span className="block text-[7px] text-gs-muted">{formatRupiah(pos.amount)} • {pos.duration}s</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`block text-[10px] font-black ${pos.status === 'won' ? 'text-emerald-600' : 'text-red-600'}`}>
                              {pos.status === 'won' ? `+${formatRupiah(Math.round(pos.amount * pos.profitPercent / 100))}` : `-${formatRupiah(pos.amount)}`}
                            </span>
                            <span className={`block text-[7px] font-bold ${pos.status === 'won' ? 'text-emerald-500' : 'text-red-500'}`}>{pos.status === 'won' ? 'BENAR' : 'SALAH'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ====== FINANCE TAB ====== */}
          {activeTab === 'finance' && (
            <motion.div key="finance" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <div className="max-w-lg mx-auto">
              {/* Finance Tabs */}
              <div className="flex gap-2 mb-4">
                <button onClick={() => setFinanceTab('deposit')} className={`flex-1 h-10 rounded-2xl text-[11px] md:text-xs font-bold transition-colors ${financeTab === 'deposit' ? 'bg-gs-green3 text-white' : 'bg-white border border-gs-line text-gs-muted'}`}>
                  <Plus className="w-3.5 h-3.5 inline mr-1" />Deposit
                </button>
                <button onClick={() => setFinanceTab('withdraw')} className={`flex-1 h-10 rounded-2xl text-[11px] md:text-xs font-bold transition-colors ${financeTab === 'withdraw' ? 'bg-gs-green3 text-white' : 'bg-white border border-gs-line text-gs-muted'}`}>
                  <Minus className="w-3.5 h-3.5 inline mr-1" />Withdraw
                </button>
              </div>

              {financeTab === 'deposit' ? (
                <>
                  {/* Balance */}
                  <div className="rounded-2xl p-4 bg-gs-soft border border-gs-line mb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[8px] font-bold text-gs-muted">Saldo Saat Ini</span>
                        <b className="block text-lg font-black text-gs-green3">{formatRupiah(user?.balance || 0)}</b>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-gs-green3/10 grid place-items-center">
                        <Wallet className="w-5 h-5 text-gs-green3" />
                      </div>
                    </div>
                  </div>

                  {/* Payment Category Tabs */}
                  <div className="flex gap-1.5 mb-3">
                    {[
                      { key: 'bank' as const, label: 'Transfer Bank', icon: <Building2 className="w-3.5 h-3.5" /> },
                      { key: 'ewallet' as const, label: 'E-Wallet', icon: <Wallet className="w-3.5 h-3.5" /> },
                      { key: 'qris' as const, label: 'QRIS', icon: <CreditCard className="w-3.5 h-3.5" /> },
                    ].map(cat => (
                      <button key={cat.key} onClick={() => setDepositCategory(cat.key)}
                        className={`flex-1 h-9 rounded-xl text-[9px] md:text-[10px] font-bold flex items-center justify-center gap-1 transition-colors ${depositCategory === cat.key ? 'bg-gs-green3 text-white shadow-sm' : 'bg-white border border-gs-line text-gs-muted'}`}>
                        {cat.icon}{cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Deposit Form Card */}
                  <div className="rounded-2xl p-4 bg-white border border-gs-line shadow-sm mb-4">

                    {/* Bank Method Grid */}
                    {depositCategory === 'bank' && (
                      <div className="mb-3">
                        <span className="block text-[9px] font-black text-gs-muted uppercase tracking-widest mb-2">Pilih Bank</span>
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                          {[
                            { code: 'BCA', name: 'Bank BCA', color: '#003399' },
                            { code: 'BNI', name: 'Bank BNI', color: '#F15A22' },
                            { code: 'BRI', name: 'Bank BRI', color: '#00529C' },
                            { code: 'Mandiri', name: 'Bank Mandiri', color: '#003066' },
                            { code: 'CIMB', name: 'CIMB Niaga', color: '#7B0E24' },
                            { code: 'Permata', name: 'Bank Permata', color: '#005EAB' },
                            { code: 'BSI', name: 'Bank BSI', color: '#00A650' },
                            { code: 'Danamon', name: 'Bank Danamon', color: '#FDDA24' },
                          ].map(bank => (
                            <button key={bank.code} onClick={() => setDepositBankMethod(bank.code)}
                              className={`rounded-xl p-2 border-2 transition-all min-h-[52px] flex flex-col items-center justify-center gap-1 ${depositBankMethod === bank.code ? 'border-gs-green bg-emerald-50 shadow-sm' : 'border-gs-line bg-gs-soft'}`}>
                              <div className="w-7 h-7 rounded-lg grid place-items-center text-white text-[8px] font-black" style={{ backgroundColor: bank.color }}>
                                {bank.code.slice(0, 2)}
                              </div>
                              <span className={`text-[7px] font-bold text-center leading-tight ${depositBankMethod === bank.code ? 'text-gs-green3' : 'text-gs-muted'}`}>{bank.code}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* E-Wallet Method Grid */}
                    {depositCategory === 'ewallet' && (
                      <div className="mb-3">
                        <span className="block text-[9px] font-black text-gs-muted uppercase tracking-widest mb-2">Pilih E-Wallet</span>
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                          {[
                            { code: 'GOPAY', name: 'GoPay', color: '#00AED6' },
                            { code: 'OVO', name: 'OVO', color: '#4C2A86' },
                            { code: 'DANA', name: 'DANA', color: '#108EE9' },
                            { code: 'SHOPEEPAY', name: 'ShopeePay', color: '#EE4D2D' },
                            { code: 'LINKAJA', name: 'LinkAja', color: '#E82529' },
                            { code: 'SAKUKU', name: 'Sakuku', color: '#003399' },
                          ].map(ew => (
                            <button key={ew.code} onClick={() => setDepositEwalletMethod(ew.code)}
                              className={`rounded-xl p-2 border-2 transition-all min-h-[52px] flex flex-col items-center justify-center gap-1 ${depositEwalletMethod === ew.code ? 'border-gs-green bg-emerald-50 shadow-sm' : 'border-gs-line bg-gs-soft'}`}>
                              <div className="w-7 h-7 rounded-lg grid place-items-center text-white text-[8px] font-black" style={{ backgroundColor: ew.color }}>
                                {ew.name.slice(0, 2)}
                              </div>
                              <span className={`text-[7px] font-bold text-center leading-tight ${depositEwalletMethod === ew.code ? 'text-gs-green3' : 'text-gs-muted'}`}>{ew.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* QRIS Section */}
                    {depositCategory === 'qris' && (
                      <div className="mb-3 flex flex-col items-center py-4">
                        <div className="w-40 h-40 rounded-2xl bg-white border-2 border-gs-line p-3 mb-3">
                          <svg viewBox="0 0 200 200" className="w-full h-full">
                            <rect width="200" height="200" fill="white" rx="8" />
                            {/* QR pattern simulation */}
                            <rect x="20" y="20" width="50" height="50" fill="#022c22" rx="4" />
                            <rect x="28" y="28" width="34" height="34" fill="white" rx="2" />
                            <rect x="36" y="36" width="18" height="18" fill="#022c22" rx="1" />
                            <rect x="130" y="20" width="50" height="50" fill="#022c22" rx="4" />
                            <rect x="138" y="28" width="34" height="34" fill="white" rx="2" />
                            <rect x="146" y="36" width="18" height="18" fill="#022c22" rx="1" />
                            <rect x="20" y="130" width="50" height="50" fill="#022c22" rx="4" />
                            <rect x="28" y="138" width="34" height="34" fill="white" rx="2" />
                            <rect x="36" y="146" width="18" height="18" fill="#022c22" rx="1" />
                            {/* Middle pattern */}
                            <rect x="80" y="20" width="8" height="8" fill="#022c22" />
                            <rect x="96" y="20" width="8" height="8" fill="#022c22" />
                            <rect x="112" y="20" width="8" height="8" fill="#022c22" />
                            <rect x="80" y="36" width="8" height="8" fill="#022c22" />
                            <rect x="96" y="44" width="8" height="8" fill="#022c22" />
                            <rect x="112" y="36" width="8" height="8" fill="#022c22" />
                            <rect x="80" y="60" width="8" height="8" fill="#022c22" />
                            <rect x="96" y="60" width="8" height="8" fill="#022c22" />
                            <rect x="112" y="60" width="8" height="8" fill="#022c22" />
                            {/* Bottom middle */}
                            <rect x="20" y="80" width="8" height="8" fill="#022c22" />
                            <rect x="36" y="80" width="8" height="8" fill="#022c22" />
                            <rect x="52" y="80" width="8" height="8" fill="#022c22" />
                            <rect x="20" y="96" width="8" height="8" fill="#022c22" />
                            <rect x="36" y="104" width="8" height="8" fill="#022c22" />
                            <rect x="52" y="96" width="8" height="8" fill="#022c22" />
                            <rect x="20" y="112" width="8" height="8" fill="#022c22" />
                            <rect x="36" y="112" width="8" height="8" fill="#022c22" />
                            <rect x="52" y="112" width="8" height="8" fill="#022c22" />
                            {/* Right middle */}
                            <rect x="80" y="80" width="8" height="8" fill="#022c22" />
                            <rect x="96" y="96" width="8" height="8" fill="#022c22" />
                            <rect x="112" y="80" width="8" height="8" fill="#022c22" />
                            <rect x="130" y="80" width="8" height="8" fill="#022c22" />
                            <rect x="146" y="80" width="8" height="8" fill="#022c22" />
                            <rect x="162" y="80" width="8" height="8" fill="#022c22" />
                            <rect x="80" y="96" width="8" height="8" fill="#022c22" />
                            <rect x="112" y="96" width="8" height="8" fill="#022c22" />
                            <rect x="130" y="96" width="8" height="8" fill="#022c22" />
                            <rect x="162" y="96" width="8" height="8" fill="#022c22" />
                            <rect x="80" y="112" width="8" height="8" fill="#022c22" />
                            <rect x="96" y="112" width="8" height="8" fill="#022c22" />
                            <rect x="130" y="112" width="8" height="8" fill="#022c22" />
                            <rect x="146" y="112" width="8" height="8" fill="#022c22" />
                            <rect x="162" y="112" width="8" height="8" fill="#022c22" />
                            {/* Bottom section */}
                            <rect x="80" y="130" width="8" height="8" fill="#022c22" />
                            <rect x="96" y="130" width="8" height="8" fill="#022c22" />
                            <rect x="112" y="130" width="8" height="8" fill="#022c22" />
                            <rect x="80" y="146" width="8" height="8" fill="#022c22" />
                            <rect x="112" y="146" width="8" height="8" fill="#022c22" />
                            <rect x="130" y="130" width="8" height="8" fill="#022c22" />
                            <rect x="146" y="146" width="8" height="8" fill="#022c22" />
                            <rect x="162" y="130" width="8" height="8" fill="#022c22" />
                            <rect x="130" y="162" width="8" height="8" fill="#022c22" />
                            <rect x="146" y="162" width="8" height="8" fill="#022c22" />
                            <rect x="162" y="162" width="8" height="8" fill="#022c22" />
                            <rect x="80" y="162" width="8" height="8" fill="#022c22" />
                            <rect x="96" y="162" width="8" height="8" fill="#022c22" />
                            <rect x="20" y="162" width="8" height="8" fill="#022c22" />
                            <rect x="36" y="162" width="8" height="8" fill="#022c22" />
                            <rect x="52" y="162" width="8" height="8" fill="#022c22" />
                            {/* QRIS label */}
                            <text x="100" y="195" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#022c22">QRIS</text>
                          </svg>
                        </div>
                        <span className="text-[10px] font-bold text-gs-green3">Scan QRIS untuk deposit</span>
                        <span className="text-[8px] text-gs-muted mt-0.5">Gunakan aplikasi e-wallet atau mobile banking</span>
                      </div>
                    )}

                    {/* Amount Input */}
                    <label className="block mb-1.5 text-[9px] font-black text-gs-muted uppercase tracking-widest">Jumlah Deposit</label>
                    <input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="Minimal Rp 10.000"
                      className="w-full h-11 rounded-2xl bg-gs-soft border border-gs-line px-4 text-[13px] font-semibold text-gs-dark outline-none focus:border-gs-green transition-colors mb-2" />
                    <div className="grid grid-cols-4 gap-1.5 mb-4">
                      {['50000', '100000', '200000', '500000', '1000000', '2000000', '5000000'].map(a => (
                        <button key={a} onClick={() => setDepositAmount(a)} className="h-8 rounded-lg bg-gs-soft border border-gs-line text-[8px] md:text-[9px] font-bold text-gs-green3 hover:bg-gs-green hover:text-white transition-colors">
                          {parseFloat(a) >= 1e6 ? `${(parseFloat(a) / 1e6).toFixed(0)}jt` : `${(parseFloat(a) / 1e3).toFixed(0)}rb`}
                        </button>
                      ))}
                    </div>

                    {/* Selected Method Info */}
                    <div className="rounded-xl p-3 bg-gs-soft border border-gs-line mb-4">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-gs-green" />
                        <div>
                          <span className="block text-[9px] font-bold text-gs-text">
                            {depositCategory === 'bank' ? `Transfer ${depositBankMethod}` : depositCategory === 'ewallet' ? depositEwalletMethod : 'QRIS'}
                          </span>
                          <span className="block text-[7px] text-gs-muted">Metode pembayaran dipilih</span>
                        </div>
                      </div>
                    </div>

                    {/* Deposit Button */}
                    <button onClick={handleDeposit} disabled={depositLoading}
                      className="w-full h-12 rounded-2xl text-white text-[11px] font-black tracking-wider uppercase flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-70"
                      style={{ background: 'linear-gradient(135deg, #064e3b 0%, #064e3b 50%, #059669 100%)' }}>
                      {depositLoading ? (
                        <div className="w-5 h-5 rounded-full border-[3px] border-white/30 border-t-white animate-spin" />
                      ) : (
                        <><Plus className="w-4 h-4" />Deposit Sekarang</>
                      )}
                    </button>
                  </div>

                  {/* Deposit History */}
                  <h3 className="text-[11px] font-black text-gs-green3 mb-2">Riwayat Deposit</h3>
                  <div className="space-y-1.5">
                    {deposits.map(d => (
                      <div key={d.id} className="rounded-2xl p-2.5 bg-white border border-gs-line flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 grid place-items-center"><Plus className="w-4 h-4 text-emerald-600" /></div>
                          <div>
                            <span className="block text-[9px] font-bold text-gs-text">{d.bankName || (d.method === 'bank_transfer' ? 'Transfer Bank' : 'E-Wallet')}</span>
                            <span className="block text-[7px] text-gs-muted">{formatDateTime(d.createdAt)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="block text-[10px] font-black text-emerald-600">+{formatRupiah(d.amount)}</span>
                          <span className={`block text-[7px] font-bold ${d.status === 'completed' ? 'text-emerald-600' : d.status === 'pending' ? 'text-amber-500' : 'text-red-500'}`}>{d.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  {/* Balance - Dompet Utama & Penarikan */}
                  <div className="mb-3">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div className="rounded-2xl p-3 bg-gs-soft border border-gs-line">
                        <span className="text-[7px] font-bold text-gs-muted">Dompet Utama</span>
                        <b className="block text-[13px] font-black text-gs-green3">{formatRupiah(user?.balance || 0)}</b>
                        <span className="block text-[6px] font-semibold text-gs-muted mt-0.5">Saldo deposit hanya untuk investasi</span>
                      </div>
                      <div className="rounded-2xl p-3 bg-gs-soft border border-gs-line">
                        <span className="text-[7px] font-bold text-gs-muted">Dompet Penarikan</span>
                        <b className="block text-[13px] font-black text-gs-gold">{formatRupiah(user?.withdrawalBalance || 0)}</b>
                        <span className="block text-[6px] font-semibold text-gs-muted mt-0.5">Saldo yang dapat ditarik</span>
                      </div>
                    </div>
                    {/* Deposit not withdrawable notice */}
                    <div className="rounded-xl p-2 bg-amber-50 border border-amber-200 mb-2">
                      <div className="flex items-start gap-1.5">
                        <AlertCircle className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span className="text-[6px] font-bold text-amber-700 leading-relaxed">⚠️ Saldo deposit tidak dapat ditarik. Saldo deposit hanya untuk investasi produk.</span>
                      </div>
                    </div>
                    {/* Transfer to withdrawal button */}
                    <button
                      onClick={() => toast({ title: 'Fitur Segera Hadir', description: 'Transfer ke penarikan akan tersedia segera' })}
                      className="w-full h-9 rounded-xl bg-gs-green3/10 border border-gs-green3/20 text-gs-green3 text-[9px] font-bold flex items-center justify-center gap-1.5 hover:bg-gs-green3/20 transition-colors"
                    >
                      <ArrowRight className="w-3.5 h-3.5" /> Transfer ke Penarikan
                    </button>
                  </div>

                  {/* Withdraw Category Tabs */}
                  <div className="flex gap-1.5 mb-3">
                    {[
                      { key: 'bank' as const, label: 'Transfer Bank', icon: <Building2 className="w-3.5 h-3.5" /> },
                      { key: 'ewallet' as const, label: 'E-Wallet', icon: <Wallet className="w-3.5 h-3.5" /> },
                      { key: 'crypto' as const, label: 'Crypto', icon: <Gem className="w-3.5 h-3.5" /> },
                    ].map(cat => (
                      <button key={cat.key} onClick={() => setWithdrawCategory(cat.key)}
                        className={`flex-1 h-9 rounded-xl text-[9px] md:text-[10px] font-bold flex items-center justify-center gap-1 transition-colors ${withdrawCategory === cat.key ? 'bg-gs-green3 text-white shadow-sm' : 'bg-white border border-gs-line text-gs-muted'}`}>
                        {cat.icon}{cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Withdraw Form Card */}
                  <div className="rounded-2xl p-4 bg-white border border-gs-line shadow-sm mb-4">

                    {/* Bank Method Grid */}
                    {withdrawCategory === 'bank' && (
                      <div className="mb-3">
                        <span className="block text-[9px] font-black text-gs-muted uppercase tracking-widest mb-2">Pilih Bank Tujuan</span>
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                          {[
                            { code: 'BCA', name: 'Bank BCA', color: '#003399' },
                            { code: 'BNI', name: 'Bank BNI', color: '#F15A22' },
                            { code: 'BRI', name: 'Bank BRI', color: '#00529C' },
                            { code: 'Mandiri', name: 'Bank Mandiri', color: '#003066' },
                            { code: 'CIMB', name: 'CIMB Niaga', color: '#7B0E24' },
                            { code: 'Permata', name: 'Bank Permata', color: '#005EAB' },
                            { code: 'BSI', name: 'Bank BSI', color: '#00A650' },
                            { code: 'Danamon', name: 'Bank Danamon', color: '#FDDA24' },
                            { code: 'Panin', name: 'Bank Panin', color: '#003764' },
                            { code: 'Maybank', name: 'Maybank', color: '#002F6C' },
                          ].map(bank => (
                            <button key={bank.code} onClick={() => setWithdrawBankMethod(bank.code)}
                              className={`rounded-xl p-2 border-2 transition-all min-h-[52px] flex flex-col items-center justify-center gap-1 ${withdrawBankMethod === bank.code ? 'border-gs-green bg-emerald-50 shadow-sm' : 'border-gs-line bg-gs-soft'}`}>
                              <div className="w-7 h-7 rounded-lg grid place-items-center text-white text-[8px] font-black" style={{ backgroundColor: bank.color }}>
                                {bank.code.slice(0, 2)}
                              </div>
                              <span className={`text-[7px] font-bold text-center leading-tight ${withdrawBankMethod === bank.code ? 'text-gs-green3' : 'text-gs-muted'}`}>{bank.code}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* E-Wallet Method Grid */}
                    {withdrawCategory === 'ewallet' && (
                      <div className="mb-3">
                        <span className="block text-[9px] font-black text-gs-muted uppercase tracking-widest mb-2">Pilih E-Wallet</span>
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                          {[
                            { code: 'GOPAY', name: 'GoPay', color: '#00AED6' },
                            { code: 'OVO', name: 'OVO', color: '#4C2A86' },
                            { code: 'DANA', name: 'DANA', color: '#108EE9' },
                            { code: 'SHOPEEPAY', name: 'ShopeePay', color: '#EE4D2D' },
                            { code: 'LINKAJA', name: 'LinkAja', color: '#E82529' },
                            { code: 'SAKUKU', name: 'Sakuku', color: '#003399' },
                            { code: 'JENIUS', name: 'Jenius', color: '#00A651' },
                            { code: 'BLU', name: 'Blu by BCA', color: '#005BAA' },
                          ].map(ew => (
                            <button key={ew.code} onClick={() => setWithdrawEwalletMethod(ew.code)}
                              className={`rounded-xl p-2 border-2 transition-all min-h-[52px] flex flex-col items-center justify-center gap-1 ${withdrawEwalletMethod === ew.code ? 'border-gs-green bg-emerald-50 shadow-sm' : 'border-gs-line bg-gs-soft'}`}>
                              <div className="w-7 h-7 rounded-lg grid place-items-center text-white text-[8px] font-black" style={{ backgroundColor: ew.color }}>
                                {ew.name.slice(0, 2)}
                              </div>
                              <span className={`text-[7px] font-bold text-center leading-tight ${withdrawEwalletMethod === ew.code ? 'text-gs-green3' : 'text-gs-muted'}`}>{ew.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Crypto Method Grid */}
                    {withdrawCategory === 'crypto' && (
                      <div className="mb-3">
                        <span className="block text-[9px] font-black text-gs-muted uppercase tracking-widest mb-2">Pilih Crypto</span>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { code: 'USDT_TRC20', name: 'USDT', network: 'TRC20', color: '#26A17B' },
                            { code: 'USDT_ERC20', name: 'USDT', network: 'ERC20', color: '#627EEA' },
                            { code: 'BTC', name: 'Bitcoin', network: 'BTC', color: '#F7931A' },
                            { code: 'ETH', name: 'Ethereum', network: 'ERC20', color: '#627EEA' },
                            { code: 'BNB', name: 'BNB', network: 'BEP20', color: '#F3BA2F' },
                          ].map(cr => (
                            <button key={cr.code} onClick={() => setWithdrawCryptoMethod(cr.code)}
                              className={`rounded-xl p-2 border-2 transition-all min-h-[56px] flex flex-col items-center justify-center gap-1 ${withdrawCryptoMethod === cr.code ? 'border-gs-green bg-emerald-50 shadow-sm' : 'border-gs-line bg-gs-soft'}`}>
                              <div className="w-7 h-7 rounded-full grid place-items-center text-white text-[8px] font-black" style={{ backgroundColor: cr.color }}>
                                {cr.name.slice(0, 2)}
                              </div>
                              <span className={`text-[8px] font-black text-center leading-tight ${withdrawCryptoMethod === cr.code ? 'text-gs-green3' : 'text-gs-text'}`}>{cr.name}</span>
                              <span className="text-[6px] font-bold text-gs-muted">{cr.network}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Amount Input */}
                    <label className="block mb-1.5 text-[9px] font-black text-gs-muted uppercase tracking-widest">Jumlah Withdraw</label>
                    <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="Minimal Rp 10.000"
                      className="w-full h-11 rounded-2xl bg-gs-soft border border-gs-line px-4 text-[13px] font-semibold text-gs-dark outline-none focus:border-gs-green transition-colors mb-2" />
                    <div className="grid grid-cols-4 gap-1.5 mb-3">
                      {['50000', '100000', '200000', '500000', '1000000', '2000000', '5000000'].map(a => (
                        <button key={a} onClick={() => setWithdrawAmount(a)} className="h-8 rounded-lg bg-gs-soft border border-gs-line text-[8px] md:text-[9px] font-bold text-gs-green3 hover:bg-gs-green hover:text-white transition-colors">
                          {parseFloat(a) >= 1e6 ? `${(parseFloat(a) / 1e6).toFixed(0)}jt` : `${(parseFloat(a) / 1e3).toFixed(0)}rb`}
                        </button>
                      ))}
                    </div>

                    {/* Account Detail Form - Dynamic based on category */}
                    {withdrawCategory === 'bank' && (
                      <div className="mb-3">
                        <label className="block mb-1.5 text-[9px] font-black text-gs-muted uppercase tracking-widest">Nomor Rekening</label>
                        <input type="text" value={withdrawAccountNumber} onChange={(e) => setWithdrawAccountNumber(e.target.value)} placeholder="Masukkan nomor rekening"
                          className="w-full h-11 rounded-2xl bg-gs-soft border border-gs-line px-4 text-[13px] font-semibold text-gs-dark outline-none focus:border-gs-green transition-colors mb-2" />
                        <label className="block mb-1.5 text-[9px] font-black text-gs-muted uppercase tracking-widest">Nama Pemilik Rekening</label>
                        <input type="text" value={withdrawAccountHolder} onChange={(e) => setWithdrawAccountHolder(e.target.value)} placeholder="Nama sesuai rekening"
                          className="w-full h-11 rounded-2xl bg-gs-soft border border-gs-line px-4 text-[13px] font-semibold text-gs-dark outline-none focus:border-gs-green transition-colors" />
                      </div>
                    )}

                    {withdrawCategory === 'ewallet' && (
                      <div className="mb-3">
                        <label className="block mb-1.5 text-[9px] font-black text-gs-muted uppercase tracking-widest">Nomor HP / Email</label>
                        <input type="text" value={withdrawAccountNumber} onChange={(e) => setWithdrawAccountNumber(e.target.value)} placeholder="Masukkan nomor HP atau email e-wallet"
                          className="w-full h-11 rounded-2xl bg-gs-soft border border-gs-line px-4 text-[13px] font-semibold text-gs-dark outline-none focus:border-gs-green transition-colors" />
                      </div>
                    )}

                    {withdrawCategory === 'crypto' && (
                      <div className="mb-3">
                        <label className="block mb-1.5 text-[9px] font-black text-gs-muted uppercase tracking-widest">Wallet Address</label>
                        <input type="text" value={withdrawAccountNumber} onChange={(e) => setWithdrawAccountNumber(e.target.value)} placeholder="Masukkan alamat wallet crypto"
                          className="w-full h-11 rounded-2xl bg-gs-soft border border-gs-line px-4 text-[13px] font-semibold text-gs-dark outline-none focus:border-gs-green transition-colors" />
                      </div>
                    )}

                    {/* Withdraw Button */}
                    <button onClick={handleWithdraw} disabled={withdrawLoading}
                      className="w-full h-12 rounded-2xl text-white text-[11px] font-black tracking-wider uppercase flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-70"
                      style={{ background: 'linear-gradient(135deg, #6b2100 0%, #b45309 50%, #f59e0b 100%)' }}>
                      {withdrawLoading ? (
                        <div className="w-5 h-5 rounded-full border-[3px] border-white/30 border-t-white animate-spin" />
                      ) : (
                        <><Minus className="w-4 h-4" />Withdraw Sekarang</>
                      )}
                    </button>
                  </div>

                  {/* Withdraw History */}
                  <h3 className="text-[11px] font-black text-gs-green3 mb-2">Riwayat Withdraw</h3>
                  <div className="space-y-1.5">
                    {withdrawals.map(w => (
                      <div key={w.id} className="rounded-2xl p-2.5 bg-white border border-gs-line flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-red-50 grid place-items-center"><Minus className="w-4 h-4 text-red-500" /></div>
                          <div>
                            <span className="block text-[9px] font-bold text-gs-text">{w.bankName || 'Transfer Bank'}</span>
                            <span className="block text-[7px] text-gs-muted">{formatDateTime(w.createdAt)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="block text-[10px] font-black text-red-500">-{formatRupiah(w.amount)}</span>
                          <span className={`block text-[7px] font-bold ${w.status === 'completed' ? 'text-emerald-600' : w.status === 'processing' ? 'text-amber-500' : 'text-red-500'}`}>{w.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            </motion.div>
          )}

          {/* ====== HISTORY TAB ====== */}
          {activeTab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              <h2 className="text-[14px] md:text-lg font-black text-gs-green3 mb-3">Riwayat Transaksi</h2>

              {/* Filter */}
              <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3">
                {[{ key: 'all', label: 'Semua' }, { key: 'BUY', label: 'Beli' }, { key: 'SELL', label: 'Jual' }, { key: 'DEPOSIT', label: 'Deposit' }, { key: 'WITHDRAW', label: 'Withdraw' }].map(f => (
                  <button key={f.key} onClick={() => setTxFilter(f.key)}
                    className={`flex-shrink-0 h-7 px-3 rounded-full text-[9px] font-bold transition-colors ${txFilter === f.key ? 'bg-gs-green3 text-white' : 'bg-white border border-gs-line text-gs-muted'}`}>
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Transaction List */}
              <div className="space-y-1.5">
                {filteredTransactions.map(tx => (
                  <div key={tx.id} className="rounded-2xl p-3 bg-white border border-gs-line shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-9 h-9 rounded-xl grid place-items-center ${tx.type === 'BUY' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                          {tx.type === 'BUY' ? <ArrowDownRight className="w-4 h-4 text-emerald-600" /> : <ArrowUpRight className="w-4 h-4 text-red-500" />}
                        </div>
                        <div>
                          <span className="block text-[10px] font-black text-gs-text">
                            {tx.type === 'BUY' ? 'Beli' : 'Jual'} {tx.stock?.code || 'N/A'}
                          </span>
                          <span className="block text-[7px] text-gs-muted">{formatRupiah(tx.total)} {tx.orderType ? `(${tx.orderType})` : ''}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`block text-[10px] font-black ${tx.type === 'BUY' ? 'text-red-500' : 'text-emerald-600'}`}>
                          {tx.type === 'BUY' ? '-' : '+'}{formatRupiah(tx.total)}
                        </span>
                        <div className="flex items-center gap-1 justify-end">
                          <span className={`w-1.5 h-1.5 rounded-full ${tx.status === 'completed' ? 'bg-emerald-500' : tx.status === 'pending' ? 'bg-amber-500' : 'bg-red-500'}`} />
                          <span className="text-[7px] font-bold text-gs-muted">{tx.status}</span>
                        </div>
                        <span className="block text-[7px] text-gs-muted">{formatDateTime(tx.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredTransactions.length === 0 && (
                  <div className="text-center py-8">
                    <History className="w-10 h-10 text-gs-muted mx-auto mb-2" />
                    <p className="text-[11px] font-bold text-gs-muted">Belum ada transaksi</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ====== UNDANG (REFERRAL) TAB ====== */}
          {activeTab === 'undang' && (
            <motion.div key="undang" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-[16px] md:text-xl font-black text-gs-green3">Program Referral</h2>
                  </div>
                  <span className="text-[9px] font-black text-gs-gold tracking-widest uppercase">Komisi Hingga 14%</span>
                  <p className="text-[8px] font-semibold text-gs-muted mt-0.5">Ajak Teman, Tumbuh Bersama</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-gs-green3/10 grid place-items-center">
                  <UserPlus className="w-5 h-5 text-gs-green3" />
                </div>
              </div>

              {/* ====== MISI BONUS UNDANGAN ====== */}
              <div className="rounded-3xl overflow-hidden mb-4" style={{ background: 'linear-gradient(145deg, #1a0a00 0%, #7c3a00 54%, #f59e0b 100%)' }}>
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.04) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                <div className="relative p-4 md:p-5 text-white">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/30 border border-yellow-400/40 grid place-items-center">
                      <Trophy className="w-5 h-5 text-yellow-300" />
                    </div>
                    <div>
                      <h3 className="text-[14px] md:text-[16px] font-black">Misi Bonus Undangan</h3>
                      <span className="text-[8px] font-bold text-yellow-200">Ajak lebih banyak teman, dapatkan bonus lebih besar!</span>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {(() => {
                      const missions = [
                        { target: 5, bonus: 25000, medal: '🥉', tier: 'Perunggu', color: 'from-amber-700 to-amber-500', barColor: 'bg-amber-400', borderColor: 'border-amber-400/40' },
                        { target: 20, bonus: 75000, medal: '🥈', tier: 'Perak', color: 'from-gray-400 to-gray-300', barColor: 'bg-gray-300', borderColor: 'border-gray-300/40' },
                        { target: 50, bonus: 150000, medal: '🥇', tier: 'Emas', color: 'from-yellow-500 to-yellow-300', barColor: 'bg-yellow-400', borderColor: 'border-yellow-400/40' },
                        { target: 100, bonus: 400000, medal: '💎', tier: 'Berlian', color: 'from-cyan-500 to-emerald-400', barColor: 'bg-cyan-400', borderColor: 'border-cyan-400/40' },
                      ]
                      const totalMembers = referralInfo.totalMembers || 0
                      return missions.map((m) => {
                        const progress = Math.min(totalMembers, m.target)
                        const pct = Math.min(100, (progress / m.target) * 100)
                        const reached = totalMembers >= m.target
                        const claimed = claimedMissions.has(m.target)
                        return (
                          <div key={m.target} className={`rounded-2xl p-3 bg-white/10 border ${m.borderColor} backdrop-blur-sm`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[18px]">{m.medal}</span>
                                <div>
                                  <span className="block text-[10px] font-black text-white">Undang {m.target} Teman</span>
                                  <span className="block text-[7px] font-bold text-yellow-200">{m.tier} — Bonus {formatRupiah(m.bonus)}</span>
                                  <span className="block text-[6px] font-semibold text-yellow-200/70">Wajib aktif deposit min Rp 100.000</span>
                                </div>
                              </div>
                              {claimed ? (
                                <span className="h-7 px-3 rounded-lg bg-emerald-500 text-white text-[8px] font-black flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />Diklaim
                                </span>
                              ) : reached ? (
                                <button
                                  onClick={() => {
                                    setClaimedMissions(prev => new Set(prev).add(m.target))
                                    toast({ title: 'Bonus Diklaim!', description: `+${formatRupiah(m.bonus)} bonus undangan ${m.tier}` })
                                  }}
                                  className="h-7 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[8px] font-black flex items-center gap-1 transition-colors"
                                >
                                  <DollarSign className="w-3 h-3" />Klaim
                                </button>
                              ) : (
                                <span className="h-7 px-3 rounded-lg bg-white/15 text-white/50 text-[8px] font-black flex items-center gap-1">
                                  <Clock className="w-3 h-3" />Belum
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                                <div className={`h-full rounded-full ${m.barColor} transition-all duration-500`} style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-[8px] font-bold text-white/70">{progress}/{m.target}</span>
                            </div>
                          </div>
                        )
                      })
                    })()}
                  </div>
                </div>
              </div>

              {/* ====== JARINGAN REFERRAL (TREE/SUN VISUAL) ====== */}
              <div className="rounded-2xl bg-white border border-gs-line shadow-sm mb-4 overflow-hidden">
                <div className="p-3 md:p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 grid place-items-center">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-[12px] md:text-[14px] font-black text-gs-green3">Jaringan Referral</h3>
                      <span className="text-[7px] font-bold text-gs-gold tracking-widest uppercase">Makin Banyak, Makin Luas!</span>
                    </div>
                  </div>

                  {/* Sun/Tree Network SVG Visualization */}
                  <div className="rounded-xl bg-gs-soft border border-gs-line p-3 mb-3 overflow-x-auto">
                    <svg viewBox="0 0 340 220" className="w-full min-w-[300px]" style={{ maxHeight: 220 }}>
                      <defs>
                        <radialGradient id="centerGrad" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#059669" />
                          <stop offset="100%" stopColor="#064e3b" />
                        </radialGradient>
                        <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                        </radialGradient>
                        <filter id="glow">
                          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                      </defs>

                      {/* Sun glow background */}
                      <circle cx="170" cy="110" r="100" fill="url(#sunGlow)" />

                      {/* Level 3 lines (outermost, faintest) */}
                      {(() => {
                        const l2Positions = [
                          { x: 56, y: 55 }, { x: 284, y: 55 }, { x: 56, y: 165 }, { x: 284, y: 165 },
                          { x: 40, y: 110 }, { x: 300, y: 110 },
                        ]
                        const lines: React.ReactNode[] = []
                        l2Positions.forEach((p, pi) => {
                          const angle1 = Math.PI * 0.3 + (pi * 0.2)
                          const angle2 = Math.PI * 0.3 + ((pi + 1) * 0.2)
                          lines.push(
                            <line key={`l3-${pi}-a`} x1={p.x} y1={p.y} x2={p.x + Math.cos(angle1) * 28} y2={p.y + Math.sin(angle1) * 28} stroke="#f59e0b" strokeWidth="1" strokeOpacity="0.25" />,
                            <circle key={`l3-${pi}-a-c`} cx={p.x + Math.cos(angle1) * 28} cy={p.y + Math.sin(angle1) * 28} r="4" fill="#f59e0b" fillOpacity="0.3" />,
                          )
                          if (pi % 2 === 0) {
                            lines.push(
                              <line key={`l3-${pi}-b`} x1={p.x} y1={p.y} x2={p.x + Math.cos(angle2) * 25} y2={p.y + Math.sin(angle2) * 25} stroke="#f59e0b" strokeWidth="1" strokeOpacity="0.2" />,
                              <circle key={`l3-${pi}-b-c`} cx={p.x + Math.cos(angle2) * 25} cy={p.y + Math.sin(angle2) * 25} r="3" fill="#f59e0b" fillOpacity="0.2" />,
                            )
                          }
                        })
                        return lines
                      })()}

                      {/* Level 2 lines (middle layer) */}
                      {[
                        { fx: 170, fy: 110, tx: 56, ty: 55, color: '#f97316' },
                        { fx: 170, fy: 110, tx: 284, ty: 55, color: '#f97316' },
                        { fx: 170, fy: 110, tx: 40, ty: 110, color: '#f97316' },
                        { fx: 170, fy: 110, tx: 300, ty: 110, color: '#f97316' },
                        { fx: 170, fy: 110, tx: 56, ty: 165, color: '#f97316' },
                        { fx: 170, fy: 110, tx: 284, ty: 165, color: '#f97316' },
                      ].map((l, i) => (
                        <line key={`l2-${i}`} x1={l.fx} y1={l.fy} x2={l.tx} y2={l.ty} stroke={l.color} strokeWidth="1.5" strokeOpacity="0.35" strokeDasharray="4 3" />
                      ))}

                      {/* Level 1 lines (direct referrals, brightest) */}
                      {[
                        { fx: 170, fy: 110, tx: 90, ty: 40 },
                        { fx: 170, fy: 110, tx: 170, ty: 25 },
                        { fx: 170, fy: 110, tx: 250, ty: 40 },
                        { fx: 170, fy: 110, tx: 75, ty: 110 },
                        { fx: 170, fy: 110, tx: 265, ty: 110 },
                        { fx: 170, fy: 110, tx: 90, ty: 180 },
                        { fx: 170, fy: 110, tx: 170, ty: 195 },
                        { fx: 170, fy: 110, tx: 250, ty: 180 },
                      ].map((l, i) => (
                        <line key={`l1-${i}`} x1={l.fx} y1={l.fy} x2={l.tx} y2={l.ty} stroke="#059669" strokeWidth="2" strokeOpacity="0.6" />
                      ))}

                      {/* Level 2 nodes (orange) */}
                      {[
                        { x: 56, y: 55, label: 'L2' }, { x: 284, y: 55, label: 'L2' },
                        { x: 40, y: 110, label: 'L2' }, { x: 300, y: 110, label: 'L2' },
                        { x: 56, y: 165, label: 'L2' }, { x: 284, y: 165, label: 'L2' },
                      ].map((n, i) => (
                        <g key={`n2-${i}`}>
                          <circle cx={n.x} cy={n.y} r="10" fill="#f97316" fillOpacity="0.7" filter="url(#glow)" />
                          <text x={n.x} y={n.y + 3} textAnchor="middle" fontSize="6" fontWeight="bold" fill="white">{n.label}</text>
                        </g>
                      ))}

                      {/* Level 1 nodes (green, direct referrals) */}
                      {[
                        { x: 90, y: 40, label: '1' }, { x: 170, y: 25, label: '2' }, { x: 250, y: 40, label: '3' },
                        { x: 75, y: 110, label: '4' }, { x: 265, y: 110, label: '5' },
                        { x: 90, y: 180, label: '6' }, { x: 170, y: 195, label: '7' }, { x: 250, y: 180, label: '8' },
                      ].map((n, i) => (
                        <g key={`n1-${i}`}>
                          <circle cx={n.x} cy={n.y} r="13" fill="#059669" fillOpacity="0.85" filter="url(#glow)" />
                          <text x={n.x} y={n.y + 3.5} textAnchor="middle" fontSize="8" fontWeight="bold" fill="white">{n.label}</text>
                        </g>
                      ))}

                      {/* Center node (YOU) */}
                      <circle cx="170" cy="110" r="28" fill="url(#centerGrad)" filter="url(#glow)" />
                      <circle cx="170" cy="110" r="28" fill="none" stroke="#f59e0b" strokeWidth="2" strokeOpacity="0.6" />
                      <text x="170" y="107" textAnchor="middle" fontSize="8" fontWeight="bold" fill="white">ANDA</text>
                      <text x="170" y="117" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#f59e0b">CENTER</text>

                      {/* Animated pulse on center */}
                      <circle cx="170" cy="110" r="28" fill="none" stroke="#059669" strokeWidth="2">
                        <animate attributeName="r" from="28" to="42" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="stroke-opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite" />
                      </circle>
                    </svg>
                  </div>

                  {/* Network Stats */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl p-2 bg-emerald-50 border border-emerald-200 text-center">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-gs-green2" />
                        <span className="text-[7px] font-black text-gs-muted">LEVEL 1</span>
                      </div>
                      <b className="block text-[14px] font-black text-gs-green3">{referralInfo.tiers[0]?.activeMembers + referralInfo.tiers[0]?.inactiveMembers || 0}</b>
                      <span className="block text-[6px] font-bold text-gs-muted">Langsung</span>
                    </div>
                    <div className="rounded-xl p-2 bg-orange-50 border border-orange-200 text-center">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                        <span className="text-[7px] font-black text-gs-muted">LEVEL 2</span>
                      </div>
                      <b className="block text-[14px] font-black text-orange-600">{referralInfo.tiers[1]?.activeMembers + referralInfo.tiers[1]?.inactiveMembers || 0}</b>
                      <span className="block text-[6px] font-bold text-gs-muted">Cabang</span>
                    </div>
                    <div className="rounded-xl p-2 bg-yellow-50 border border-yellow-200 text-center">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-gs-gold" />
                        <span className="text-[7px] font-black text-gs-muted">LEVEL 3</span>
                      </div>
                      <b className="block text-[14px] font-black text-gs-gold">{referralInfo.tiers[2]?.activeMembers + referralInfo.tiers[2]?.inactiveMembers || 0}</b>
                      <span className="block text-[6px] font-bold text-gs-muted">Akar</span>
                    </div>
                  </div>

                  {/* Expand hint */}
                  <div className="mt-2 text-center">
                    <span className="text-[7px] font-bold text-gs-muted">💡 Semakin banyak yang Anda undang, jaringan makin luas seperti akar pohon!</span>
                  </div>
                </div>
              </div>

              {/* ====== MISI PROMOSI VIDEO ====== */}
              <div className="rounded-2xl bg-white border border-gs-line shadow-sm mb-4 overflow-hidden">
                <div className="p-3 md:p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 to-red-500 grid place-items-center">
                      <Video className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-[12px] md:text-[14px] font-black text-gs-green3">Misi Promosi Video</h3>
                      <span className="text-[7px] font-bold text-pink-500 tracking-widest uppercase">Review & Dapatkan Bonus!</span>
                    </div>
                  </div>

                  {/* How it works */}
                  <div className="rounded-xl p-3 bg-gradient-to-r from-pink-50 to-red-50 border border-pink-200 mb-3">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-pink-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-[9px] font-black text-gs-text mb-1">Cara Kerja:</span>
                        <div className="space-y-0.5">
                          <span className="block text-[7px] font-semibold text-gs-muted">1️⃣ Upload video review tentang TrendEdge ke media sosial</span>
                          <span className="block text-[7px] font-semibold text-gs-muted">2️⃣ Kirim link video yang sudah di-upload</span>
                          <span className="block text-[7px] font-semibold text-gs-muted">3️⃣ Bonus dihitung dari views & likes video Anda!</span>
                          <span className="block text-[7px] font-semibold text-gs-muted">4️⃣ Wajib tag @GlobalSaham di video</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reward formula cards */}
                  <div className="space-y-1.5 mb-3">
                    {[
                      { views: '1.000', bonus: 'Rp 5.000', icon: '💰' },
                      { views: '10.000', bonus: 'Rp 50.000', icon: '💰' },
                      { views: '100.000', bonus: 'Rp 500.000', icon: '💰' },
                    ].map((t, i) => (
                      <div key={i} className="rounded-xl p-2 bg-gs-soft border border-gs-line flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px]">{t.icon}</span>
                          <span className="text-[9px] font-black text-gs-green3">{t.views} Views</span>
                        </div>
                        <span className="text-[10px] font-black text-gs-gold">= {t.bonus}</span>
                      </div>
                    ))}
                  </div>

                  {/* Anti-injection notice */}
                  <div className="rounded-xl p-2.5 bg-amber-50 border border-amber-200 mb-3">
                    <div className="flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span className="text-[7px] font-bold text-amber-700 leading-relaxed">⚠️ Perhatian: Views & Likes harus REAL/ORGANIK. Dilarang suntikan views/bot. Jika terdeteksi, bonus akan dibatalkan.</span>
                    </div>
                  </div>

                  {/* Platform selector */}
                  <div className="mb-3">
                    <span className="block text-[8px] font-black text-gs-muted uppercase tracking-widest mb-1.5">Pilih Platform</span>
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {[
                        { key: 'tiktok' as const, label: 'TikTok', color: 'bg-black', icon: '🎵' },
                        { key: 'instagram' as const, label: 'Instagram', color: 'bg-gradient-to-br from-purple-500 to-pink-500', icon: '📸' },
                        { key: 'youtube' as const, label: 'YouTube', color: 'bg-red-600', icon: '▶️' },
                        { key: 'facebook' as const, label: 'Facebook', color: 'bg-emerald-600', icon: '📘' },
                        { key: 'twitter' as const, label: 'X/Twitter', color: 'bg-gray-800', icon: '🐦' },
                      ].map(p => (
                        <button key={p.key} onClick={() => setPromoPlatform(p.key)}
                          className={`flex-shrink-0 h-9 px-3 rounded-xl flex items-center gap-1.5 text-[9px] font-bold transition-all ${promoPlatform === p.key ? 'bg-gs-green3 text-white shadow-sm scale-105' : 'bg-gs-soft border border-gs-line text-gs-muted'}`}>
                          <span className="text-[12px]">{p.icon}</span>
                          <span>{p.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Video link input */}
                  <div className="mb-3">
                    <span className="block text-[8px] font-black text-gs-muted uppercase tracking-widest mb-1.5">Link Video</span>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gs-muted" />
                        <input
                          type="url"
                          value={promoVideoLink}
                          onChange={(e) => setPromoVideoLink(e.target.value)}
                          placeholder={`Masukkan link ${promoPlatform === 'tiktok' ? 'TikTok' : promoPlatform === 'instagram' ? 'Instagram' : promoPlatform === 'youtube' ? 'YouTube' : promoPlatform === 'facebook' ? 'Facebook' : 'X/Twitter'}`}
                          className="w-full h-10 rounded-xl bg-gs-soft border border-gs-line pl-9 pr-3 text-[11px] font-semibold text-gs-dark outline-none focus:border-gs-green focus:ring-1 focus:ring-gs-green/30 transition-all placeholder:text-gray-400"
                        />
                      </div>
                      <button
                        onClick={() => {
                          if (!promoVideoLink.trim()) {
                            toast({ title: 'Error', description: 'Masukkan link video terlebih dahulu', variant: 'destructive' })
                            return
                          }
                          if (!promoVideoLink.startsWith('http')) {
                            toast({ title: 'Error', description: 'Link video tidak valid, harus dimulai dengan http', variant: 'destructive' })
                            return
                          }
                          setPromoSubmitLoading(true)
                          setTimeout(() => {
                            const simulatedViews = Math.floor(Math.random() * 5000) + 50
                            const simulatedLikes = Math.floor(simulatedViews * (Math.random() * 0.15 + 0.02))
                            const bonus = Math.floor(simulatedViews / 1000) * 5000
                            const newVideo = {
                              id: `promo-${Date.now()}`,
                              platform: promoPlatform,
                              link: promoVideoLink,
                              views: simulatedViews,
                              likes: simulatedLikes,
                              bonus,
                              status: 'verified' as const,
                              submittedAt: new Date().toISOString(),
                            }
                            setPromoVideos(prev => [newVideo, ...prev])
                            setPromoVideoLink('')
                            toast({ title: 'Video Terkirim! 🎬', description: `Bonus ${formatRupiah(bonus)} dari ${simulatedViews.toLocaleString()} views` })
                            setPromoSubmitLoading(false)
                          }, 1500)
                        }}
                        disabled={promoSubmitLoading}
                        className="h-10 px-4 rounded-xl bg-gs-green3 text-white text-[9px] font-bold flex items-center gap-1.5 hover:bg-gs-green transition-colors disabled:opacity-60 flex-shrink-0"
                      >
                        {promoSubmitLoading ? (
                          <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        ) : (
                          <><Send className="w-3.5 h-3.5" />Kirim</>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Submitted videos list */}
                  {promoVideos.length > 0 && (
                    <div>
                      <span className="block text-[8px] font-black text-gs-muted uppercase tracking-widest mb-1.5">Video Anda ({promoVideos.length})</span>
                      <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar">
                        {promoVideos.map((v) => {
                          const platformInfo: Record<string, { label: string; icon: string; color: string }> = {
                            tiktok: { label: 'TikTok', icon: '🎵', color: 'bg-black' },
                            instagram: { label: 'Instagram', icon: '📸', color: 'bg-gradient-to-br from-purple-500 to-pink-500' },
                            youtube: { label: 'YouTube', icon: '▶️', color: 'bg-red-600' },
                            facebook: { label: 'Facebook', icon: '📘', color: 'bg-emerald-600' },
                            twitter: { label: 'X/Twitter', icon: '🐦', color: 'bg-gray-800' },
                          }
                          const pi = platformInfo[v.platform] || platformInfo.tiktok
                          return (
                            <div key={v.id} className="rounded-xl p-2.5 bg-gs-soft border border-gs-line">
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                  <div className={`w-7 h-7 rounded-lg ${pi.color} grid place-items-center text-[12px]`}>
                                    {pi.icon}
                                  </div>
                                  <div>
                                    <span className="block text-[9px] font-bold text-gs-text">{pi.label}</span>
                                    <span className="block text-[6px] text-gs-muted truncate max-w-[140px]">{v.link}</span>
                                  </div>
                                </div>
                                <span className={`h-5 px-2 rounded-full text-[7px] font-black flex items-center gap-1 ${v.status === 'verified' ? 'bg-emerald-100 text-emerald-700' : v.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                  {v.status === 'verified' ? <><CheckCircle className="w-2.5 h-2.5" />Terverifikasi</> : v.status === 'pending' ? <><Clock className="w-2.5 h-2.5" />Diperiksa</> : <><AlertCircle className="w-2.5 h-2.5" />Ditolak</>}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                  <EyeIcon className="w-3 h-3 text-emerald-500" />
                                  <span className="text-[8px] font-black text-gs-text">{v.views.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <ThumbsUp className="w-3 h-3 text-pink-500" />
                                  <span className="text-[8px] font-black text-gs-text">{v.likes.toLocaleString()}</span>
                                </div>
                                <div className="ml-auto flex items-center gap-1">
                                  <DollarSign className="w-3 h-3 text-gs-gold" />
                                  <span className="text-[9px] font-black text-gs-gold">{formatRupiah(v.bonus)}</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Total video bonus */}
                      <div className="mt-2 rounded-xl p-2.5 bg-gradient-to-r from-pink-50 to-yellow-50 border border-gs-gold/30 flex items-center justify-between">
                        <span className="text-[8px] font-bold text-gs-muted">Total Bonus Video</span>
                        <span className="text-[12px] font-black text-gs-gold">{formatRupiah(promoVideos.reduce((s, v) => s + v.bonus, 0))}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Hero Card */}
              <div className="rounded-3xl overflow-hidden mb-4 relative" style={{ background: 'linear-gradient(145deg, #022c22 0%, #064e3b 54%, #059669 100%)' }}>
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.04) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                <div className="relative p-4 md:p-6 text-white text-center">
                  {/* Badge */}
                  <div className="inline-flex items-center gap-1.5 h-6 px-3 rounded-full bg-yellow-500/20 border border-yellow-400/30 mb-3">
                    <Zap className="w-3 h-3 text-yellow-300" />
                    <span className="text-[8px] font-black text-yellow-300 tracking-wide">PROGRAM REFERRAL</span>
                  </div>

                  {/* Commission highlight */}
                  <div className="mb-2">
                    <span className="text-[28px] md:text-[36px] font-black text-yellow-300 drop-shadow-lg">14%</span>
                    <span className="block text-[9px] font-bold text-emerald-200 mt-0.5">Komisi Hingga</span>
                  </div>

                  <h3 className="text-[14px] md:text-[16px] font-black mb-1">Ajak Teman, Tumbuh Bersama</h3>
                  <p className="text-[9px] md:text-[10px] text-emerald-200 leading-relaxed max-w-[300px] mx-auto mb-4">
                    Dapatkan komisi dari setiap teman yang berinvestasi melalui tautan referral Anda.
                  </p>

                  {/* Total Commission */}
                  <div className="rounded-2xl p-3 bg-white/10 border border-white/15">
                    <span className="block text-[8px] font-bold text-emerald-200 mb-1">TOTAL KOMISI DIPEROLEH</span>
                    <b className="text-[20px] md:text-[24px] font-black text-yellow-300">{formatRupiah(referralInfo.totalCommission)}</b>
                    {referralInfo.pendingCommission > 0 && (
                      <div className="mt-1 flex items-center justify-center gap-2">
                        <span className="text-[8px] text-emerald-200">Pending: {formatRupiah(referralInfo.pendingCommission)}</span>
                        <button
                          onClick={async () => {
                            if (claimLoading) return
                            setClaimLoading(true)
                            try {
                              const res = await fetch('/api/referral/claim', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ userId: user?.id }),
                              })
                              const data = await res.json()
                              if (!res.ok) throw new Error(data.error)
                              toast({ title: 'Komisi Diklaim!', description: `${formatRupiah(data.claimedAmount)} telah ditambahkan ke saldo Anda` })
                              fetchReferral()
                              if (updateBalance) updateBalance(data.newBalance)
                            } catch (err: unknown) {
                              toast({ title: 'Gagal', description: err instanceof Error ? err.message : 'Gagal mengklaim komisi', variant: 'destructive' })
                            } finally {
                              setClaimLoading(false)
                            }
                          }}
                          disabled={claimLoading}
                          className="h-6 px-3 rounded-lg bg-yellow-500 text-gs-dark text-[8px] font-black inline-flex items-center gap-1 hover:bg-yellow-400 transition-colors disabled:opacity-50"
                        >
                          {claimLoading ? <div className="w-3 h-3 rounded-full border-2 border-gs-dark/30 border-t-gs-dark animate-spin" /> : <><DollarSign className="w-3 h-3" />Klaim</>}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Referral Code & Link */}
              <div className="rounded-2xl p-4 bg-white border border-gs-line shadow-sm mb-4">
                <span className="block text-[9px] font-black text-gs-green3 mb-2">Kode Referral Anda</span>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-11 rounded-xl bg-gs-soft border border-gs-line px-4 flex items-center">
                    <b className="text-[18px] font-black tracking-[0.2em] text-gs-green3">{referralInfo.code || user?.referralCode || 'GSXXXX'}</b>
                  </div>
                  <button
                    onClick={() => { navigator.clipboard.writeText(referralInfo.code || user?.referralCode || ''); setCopied(true); setTimeout(() => setCopied(false), 2000); toast({ title: 'Kode disalin!' }) }}
                    className="h-11 w-11 rounded-xl bg-gs-green3 text-white grid place-items-center hover:bg-gs-green transition-colors"
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>

                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => { navigator.clipboard.writeText(referralInfo.code || user?.referralCode || ''); toast({ title: 'Kode disalin!' }) }}
                    className="flex-1 h-10 rounded-xl bg-gs-soft border border-gs-line text-gs-green3 text-[10px] font-bold hover:bg-emerald-50 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />Salin
                  </button>
                  <button
                    onClick={() => {
                      const shareText = `Gabung TrendEdge dan mulai investasi! Daftar melalui tautan saya: https://globalsaham.com/register/${referralInfo.code || user?.referralCode || ''}`
                      if (navigator.share) {
                        navigator.share({ title: 'TrendEdge - Undang Teman', text: shareText }).catch(() => {})
                      } else {
                        navigator.clipboard.writeText(shareText)
                        toast({ title: 'Link disalin!' })
                      }
                    }}
                    className="flex-1 h-10 rounded-xl bg-yellow-500 text-gs-dark text-[10px] font-bold hover:bg-yellow-400 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5" />Bagikan
                  </button>
                </div>

                <span className="block text-[9px] font-black text-gs-muted mb-1">Tautan Referral</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-9 rounded-lg bg-gs-soft border border-gs-line px-3 flex items-center overflow-hidden">
                    <span className="text-[9px] font-semibold text-gs-text truncate">https://globalsaham.com/register/{referralInfo.code || user?.referralCode || 'GSXXXX'}</span>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="rounded-2xl p-3 bg-white border border-gs-line shadow-sm text-center">
                  <Users className="w-5 h-5 text-gs-green mx-auto mb-1" />
                  <b className="block text-[14px] font-black text-gs-green3">{referralInfo.totalMembers}</b>
                  <span className="block text-[8px] font-bold text-gs-muted">Anggota</span>
                </div>
                <div className="rounded-2xl p-3 bg-white border border-gs-line shadow-sm text-center">
                  <Wallet className="w-5 h-5 text-gs-gold mx-auto mb-1" />
                  <b className="block text-[12px] font-black text-gs-gold">{formatRupiah(referralInfo.totalDeposit)}</b>
                  <span className="block text-[8px] font-bold text-gs-muted">Deposit</span>
                </div>
                <div className="rounded-2xl p-3 bg-white border border-gs-line shadow-sm text-center">
                  <DollarSign className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                  <b className="block text-[12px] font-black text-emerald-600">{formatRupiah(referralInfo.totalCommission)}</b>
                  <span className="block text-[8px] font-bold text-gs-muted">Komisi</span>
                </div>
              </div>

              {/* Tier Commission System with Gem Badges */}
              <h3 className="text-[12px] font-black text-gs-green3 mb-3">Sistem Komisi Tier</h3>
              <div className="space-y-2 mb-4">
                {referralInfo.tiers.map((tier) => {
                  const tierColors = [
                    { bg: 'bg-emerald-500', text: 'text-emerald-500', light: 'bg-emerald-50', gem: '💎', border: 'border-emerald-200' },
                    { bg: 'bg-orange-500', text: 'text-orange-500', light: 'bg-orange-50', gem: '🔥', border: 'border-orange-200' },
                    { bg: 'bg-emerald-500', text: 'text-emerald-500', light: 'bg-emerald-50', gem: '💚', border: 'border-emerald-200' },
                  ]
                  const tc = tierColors[tier.level - 1] || tierColors[0]
                  return (
                    <div key={tier.level} className={`rounded-2xl p-3 bg-white border ${tc.border} shadow-sm`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-9 h-9 rounded-lg ${tc.bg} grid place-items-center text-white shadow-sm`}>
                            <Gem className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="block text-[10px] font-black text-gs-text">Level {tier.level}</span>
                            <span className="block text-[7px] text-gs-muted">
                              {tier.level === 1 ? 'Referral langsung' : tier.level === 2 ? 'Referral dari referral Anda' : 'Referral level ketiga'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-[18px] font-black ${tc.text}`}>
                            {tier.commissionPercent}%
                          </span>
                          <span className="block text-[7px] font-bold text-gs-muted">Komisi</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className={`rounded-lg p-1.5 ${tc.light} text-center`}>
                          <b className="block text-[11px] font-black text-gs-text">{tier.activeMembers + tier.inactiveMembers}</b>
                          <span className="block text-[6px] font-bold text-gs-muted">Anggota</span>
                        </div>
                        <div className={`rounded-lg p-1.5 ${tc.light} text-center`}>
                          <b className="block text-[9px] font-black text-gs-text">{tier.activeMembers}/{tier.inactiveMembers}</b>
                          <span className="block text-[6px] font-bold text-gs-muted">Aktif/Nonaktif</span>
                        </div>
                        <div className={`rounded-lg p-1.5 ${tc.light} text-center`}>
                          <b className="block text-[9px] font-black text-gs-gold">{formatRupiah(tier.deposit)}</b>
                          <span className="block text-[6px] font-bold text-gs-muted">Deposit</span>
                        </div>
                      </div>
                      {tier.commission > 0 && (
                        <div className="mt-2 pt-2 border-t border-gs-line flex items-center justify-between">
                          <span className="text-[8px] font-bold text-gs-muted">Komisi Level {tier.level}</span>
                          <span className="text-[10px] font-black text-emerald-600">+{formatRupiah(tier.commission)}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Referral History */}
              <h3 className="text-[12px] font-black text-gs-green3 mb-3">Riwayat Komisi</h3>
              <div className="rounded-2xl bg-white border border-gs-line shadow-sm overflow-hidden">
                {referralInfo.history.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto custom-scrollbar">
                    {referralInfo.history.map((h) => (
                      <div key={h.id} className="p-3 border-b border-gs-line last:border-0 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full grid place-items-center ${
                            h.level === 1 ? 'bg-emerald-50' : h.level === 2 ? 'bg-orange-50' : 'bg-emerald-50'
                          }`}>
                            <Gem className={`w-3.5 h-3.5 ${
                              h.level === 1 ? 'text-emerald-500' : h.level === 2 ? 'text-orange-500' : 'text-emerald-500'
                            }`} />
                          </div>
                          <div>
                            <span className="block text-[9px] font-bold text-gs-text">{h.name}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[7px] text-gs-muted">{formatDate(h.date)}</span>
                              {h.status === 'claimed' && (
                                <span className="text-[6px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">Diklaim</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="block text-[9px] font-black text-emerald-600">+{formatRupiah(h.commission)}</span>
                          <span className="block text-[7px] text-gs-muted">Deposit: {formatRupiah(h.deposit)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <UserPlus className="w-10 h-10 text-gs-muted mx-auto mb-2" />
                    <p className="text-[10px] font-bold text-gs-muted">Belum ada komisi referral</p>
                    <p className="text-[8px] text-gs-muted mt-1">Ajak teman untuk mulai mendapatkan komisi</p>
                  </div>
                )}
              </div>

              {/* Backwards compat: referred users list */}
              {referralInfo.referredUsers.length > 0 && (
                <>
                  <h3 className="text-[12px] font-black text-gs-green3 mb-3 mt-4">Daftar Referral Langsung</h3>
                  <div className="space-y-1.5">
                    {referralInfo.referredUsers.map((u, i) => (
                      <div key={i} className="rounded-2xl p-2.5 bg-white border border-gs-line flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gs-soft grid place-items-center"><User className="w-4 h-4 text-gs-green" /></div>
                          <div>
                            <span className="block text-[9px] font-bold text-gs-text">{u.name}</span>
                            <span className="block text-[7px] text-gs-muted">{formatDate(u.date)}</span>
                          </div>
                        </div>
                        <span className="text-[9px] font-black text-emerald-600">+{formatRupiah(u.bonus)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ====== NEWS TAB ====== */}
          {activeTab === 'news' && (
            <motion.div key="news" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              <h2 className="text-[14px] md:text-lg font-black text-gs-green3 mb-3">Berita & Edukasi</h2>
              <div className="space-y-2">
                {news.map(n => (
                  <div key={n.id} className="rounded-2xl p-3 bg-white border border-gs-line shadow-sm">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="h-5 px-2 rounded-full bg-gs-soft text-[7px] font-bold text-gs-green3 flex items-center">{n.category}</span>
                      <span className="text-[7px] text-gs-muted">{formatDate(n.createdAt)}</span>
                    </div>
                    <h4 className="text-[11px] font-bold text-gs-text leading-snug mb-1">{n.title}</h4>
                    <p className="text-[8px] text-gs-muted leading-relaxed line-clamp-2">{n.content}</p>
                  </div>
                ))}
                {news.length === 0 && (
                  <div className="text-center py-8">
                    <Newspaper className="w-10 h-10 text-gs-muted mx-auto mb-2" />
                    <p className="text-[11px] font-bold text-gs-muted">Belum ada berita</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ====== BONUS TAB ====== */}
          {activeTab === 'bonus' && (
            <motion.div key="bonus" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {/* Daily Check-in */}
              <div className="rounded-3xl overflow-hidden mb-4" style={{ background: 'linear-gradient(145deg, #022c22 0%, #064e3b 54%, #059669 100%)' }}>
                <div className="p-4 text-white text-center">
                  <Flame className="w-10 h-10 text-yellow-300 mx-auto mb-2" />
                  <h2 className="text-[16px] md:text-xl font-black">Bonus Harian</h2>
                  <p className="text-[9px] md:text-[10px] text-emerald-200 mt-1">Klaim bonus check-in setiap hari</p>
                  {dailyCheckStatus.streak > 0 && (
                    <p className="text-[8px] text-yellow-300 font-bold mt-1">🔥 Streak: {dailyCheckStatus.streak} hari</p>
                  )}
                  {dailyCheckStatus.canCheckToday ? (
                    <button onClick={handleDailyCheck} disabled={dailyCheckLoading} className="mt-3 h-10 px-8 rounded-2xl bg-yellow-500 text-gs-dark text-[11px] font-bold hover:bg-yellow-400 transition-colors disabled:opacity-60">
                      {dailyCheckLoading ? 'Memproses...' : 'Check-in Sekarang'}
                    </button>
                  ) : (
                    <div className="mt-3 h-10 px-8 rounded-2xl bg-white/15 inline-flex items-center gap-1 text-[11px] font-bold">
                      <CheckCircle className="w-4 h-4 text-emerald-300" /> Sudah Dicek ✓
                    </div>
                  )}
                </div>
              </div>

              {/* Promos */}
              {promos.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-[11px] font-black text-gs-green3 mb-2">Promo Aktif</h3>
                  <div className="space-y-2">
                    {promos.map(p => (
                      <div key={p.id} className="rounded-2xl p-3 bg-white border border-gs-line shadow-sm">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Gift className="w-4 h-4 text-gs-gold" />
                          <span className="text-[10px] font-black text-gs-text">{p.title}</span>
                        </div>
                        <p className="text-[8px] text-gs-muted">{p.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bonus History */}
              <h3 className="text-[11px] font-black text-gs-green3 mb-2">Riwayat Bonus</h3>
              <div className="space-y-1.5">
                {bonuses.map(b => (
                  <div key={b.id} className="rounded-2xl p-2.5 bg-white border border-gs-line flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 grid place-items-center"><Gift className="w-4 h-4 text-purple-600" /></div>
                      <div>
                        <span className="block text-[9px] font-bold text-gs-text">{b.type === 'daily_checkin' ? 'Daily Check-in' : b.type === 'trading_bonus' ? 'Trading Bonus' : b.type === 'deposit_bonus' ? 'Deposit Bonus' : b.type === 'referral_bonus' ? 'Referral Bonus' : 'Welcome Bonus'}</span>
                        <span className="block text-[7px] text-gs-muted">{formatDateTime(b.createdAt)}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-emerald-600">+{formatRupiah(b.amount)}</span>
                  </div>
                ))}
                {bonuses.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-[10px] font-bold text-gs-muted">Belum ada bonus</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ====== LEADERBOARD TAB ====== */}
          {activeTab === 'leaderboard' && (
            <motion.div key="leaderboard" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              <div className="rounded-3xl overflow-hidden mb-4" style={{ background: 'linear-gradient(145deg, #022c22 0%, #064e3b 54%, #059669 100%)' }}>
                <div className="p-4 text-white text-center">
                  <Trophy className="w-10 h-10 text-yellow-300 mx-auto mb-2" />
                  <h2 className="text-[16px] md:text-xl font-black">Leaderboard</h2>
                  <p className="text-[9px] md:text-[10px] text-emerald-200 mt-1">Top investor dengan profit tertinggi</p>
                </div>
              </div>

              <div className="space-y-1.5">
                {leaderboard.map((entry, i) => (
                  <div key={i} className={`rounded-2xl p-3 border shadow-sm flex items-center gap-3 ${i === 0 ? 'bg-yellow-50 border-yellow-200' : i === 1 ? 'bg-gray-50 border-gray-200' : i === 2 ? 'bg-orange-50 border-orange-200' : 'bg-white border-gs-line'}`}>
                    <div className={`w-8 h-8 rounded-full grid place-items-center text-[11px] font-black ${i === 0 ? 'bg-yellow-500 text-white' : i === 1 ? 'bg-gray-400 text-white' : i === 2 ? 'bg-orange-400 text-white' : 'bg-gs-soft text-gs-muted'}`}>
                      {entry.rank || i + 1}
                    </div>
                    <div className="flex-1">
                      <span className="block text-[10px] font-bold text-gs-text">{entry.name}</span>
                      <span className="block text-[8px] text-gs-muted">Profit: {formatRupiah(entry.profit)}</span>
                    </div>
                    <span className={`text-[11px] font-black ${entry.profitPercent >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{formatPercent(entry.profitPercent)}</span>
                  </div>
                ))}
                {leaderboard.length === 0 && (
                  <div className="text-center py-8">
                    <Trophy className="w-10 h-10 text-gs-muted mx-auto mb-2" />
                    <p className="text-[11px] font-bold text-gs-muted">Belum ada data leaderboard</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ====== PROFILE TAB ====== */}
          {activeTab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {/* Profile Header */}
              <div className="rounded-3xl overflow-hidden mb-4" style={{ background: 'linear-gradient(145deg, #022c22 0%, #064e3b 54%, #059669 100%)' }}>
                <div className="p-4 text-white text-center">
                  <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/30 grid place-items-center mx-auto mb-2">
                    <User className="w-8 h-8 text-yellow-300" />
                  </div>
                  <h2 className="text-[14px] md:text-lg font-black">{user?.name}</h2>
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    <span className="text-[9px] md:text-[10px] text-emerald-200">+62 {user?.phone}</span>
                    <span className="h-4 px-1.5 rounded-full bg-emerald-500/30 border border-emerald-400/40 text-[7px] font-black text-emerald-300 flex items-center gap-0.5">
                      <CheckCircle className="w-2.5 h-2.5" />VERIFIED
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <span className="h-5 px-2 rounded-full bg-yellow-500/20 border border-yellow-400/30 text-[7px] font-bold text-yellow-300 flex items-center gap-1">
                      <Award className="w-2.5 h-2.5" />Gold VIP
                    </span>
                    {user?.kycStatus === 'verified' && (
                      <span className="h-5 px-2 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[7px] font-bold text-emerald-200 flex items-center gap-1">
                        <Shield className="w-2.5 h-2.5" />KYC Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Info */}
              <div className="rounded-2xl p-4 bg-white border border-gs-line shadow-sm mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[11px] font-black text-gs-green3">Informasi Profil</h3>
                  <button onClick={() => { setProfileForm({ name: user?.name || '', email: user?.email || '', bankName: user?.bankName || '', bankAccount: user?.bankAccount || '', bankHolder: user?.bankHolder || '' }); setProfileEdit(!profileEdit) }}
                    className="text-[9px] font-bold text-gs-green hover:underline flex items-center gap-1">
                    <Settings className="w-3 h-3" />{profileEdit ? 'Batal' : 'Edit'}
                  </button>
                </div>
                {profileEdit ? (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[8px] font-bold text-gs-muted mb-0.5">Nama</label>
                      <input type="text" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="w-full h-9 rounded-xl bg-gs-soft border border-gs-line px-3 text-[11px] font-semibold outline-none focus:border-gs-green" />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-gs-muted mb-0.5">Email</label>
                      <input type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        className="w-full h-9 rounded-xl bg-gs-soft border border-gs-line px-3 text-[11px] font-semibold outline-none focus:border-gs-green" />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-gs-muted mb-0.5">Bank</label>
                      <input type="text" value={profileForm.bankName} onChange={(e) => setProfileForm({ ...profileForm, bankName: e.target.value })}
                        className="w-full h-9 rounded-xl bg-gs-soft border border-gs-line px-3 text-[11px] font-semibold outline-none focus:border-gs-green" />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-gs-muted mb-0.5">Nomor Rekening</label>
                      <input type="text" value={profileForm.bankAccount} onChange={(e) => setProfileForm({ ...profileForm, bankAccount: e.target.value })}
                        className="w-full h-9 rounded-xl bg-gs-soft border border-gs-line px-3 text-[11px] font-semibold outline-none focus:border-gs-green" />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-gs-muted mb-0.5">Nama Pemilik Rekening</label>
                      <input type="text" value={profileForm.bankHolder} onChange={(e) => setProfileForm({ ...profileForm, bankHolder: e.target.value })}
                        className="w-full h-9 rounded-xl bg-gs-soft border border-gs-line px-3 text-[11px] font-semibold outline-none focus:border-gs-green" />
                    </div>
                    <button onClick={handleProfileSave} className="w-full h-10 rounded-xl bg-gs-green3 text-white text-[10px] font-bold hover:bg-gs-green transition-colors">
                      Simpan Perubahan
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[
                      { label: 'Nama', value: user?.name || '-' },
                      { label: 'Email', value: user?.email || '-' },
                      { label: 'Bank', value: user?.bankName || '-' },
                      { label: 'Rekening', value: user?.bankAccount || '-' },
                      { label: 'Pemilik', value: user?.bankHolder || '-' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 border-b border-gs-line last:border-0">
                        <span className="text-[9px] font-bold text-gs-muted">{item.label}</span>
                        <span className="text-[9px] font-semibold text-gs-text">{item.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Menu Items */}
              <div className="rounded-2xl bg-white border border-gs-line shadow-sm overflow-hidden mb-4">
                {[
                  { icon: <Shield className="w-4 h-4 text-emerald-600" />, label: 'Verifikasi KYC', desc: user?.kycStatus === 'verified' ? 'Terverifikasi' : 'Belum verifikasi', action: () => {} },
                  { icon: <Award className="w-4 h-4 text-gs-gold" />, label: 'VIP Level', desc: 'Gold', action: () => {} },
                  { icon: <Gift className="w-4 h-4 text-purple-600" />, label: 'Bonus & Promo', desc: 'Klaim bonus harian', action: () => setActiveTab('bonus') },
                  { icon: <UserPlus className="w-4 h-4 text-gs-green" />, label: 'Undang', desc: 'Ajak teman, dapat komisi', action: () => setActiveTab('undang') },
                  { icon: <Headphones className="w-4 h-4 text-emerald-600" />, label: 'Layanan Pelanggan', desc: 'Bantuan & CS 24/7', action: () => {} },
                  { icon: <Building2 className="w-4 h-4 text-gs-green3" />, label: 'Profil Perusahaan', desc: 'Tentang TrendEdge', action: () => {} },
                  { icon: <HelpCircle className="w-4 h-4 text-amber-600" />, label: 'Bantuan', desc: 'FAQ & Support', action: () => {} },
                ].map((item, i) => (
                  <button key={i} onClick={item.action} className="w-full flex items-center gap-3 p-3 border-b border-gs-line last:border-0 hover:bg-gs-soft transition-colors">
                    {item.icon}
                    <div className="flex-1 text-left">
                      <span className="block text-[10px] font-bold text-gs-text">{item.label}</span>
                      <span className="block text-[7px] text-gs-muted">{item.desc}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gs-muted" />
                  </button>
                ))}
              </div>

              {/* Regulatory Footer */}
              <div className="rounded-2xl p-3 bg-gs-soft border border-gs-line mb-4">
                <div className="flex items-center justify-center gap-2 mb-1.5">
                  <Shield className="w-4 h-4 text-gs-green" />
                  <CheckCircle className="w-4 h-4 text-gs-gold" />
                </div>
                <p className="text-center text-[7px] font-black text-gs-muted tracking-wider">ASET SAHAM • TERDAFTAR & DIAWASI OJK • V1.0</p>
              </div>

              {/* Logout */}
              <button onClick={() => { logout(); toast({ title: 'Berhasil logout' }) }}
                className="w-full h-11 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-[11px] font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
                <LogOut className="w-4 h-4" />Keluar
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gs-line shadow-[0_-2px_10px_rgba(0,0,0,.05)] md:hidden">
        <div className="max-w-7xl mx-auto flex">
          {[
            { key: 'home', label: 'Beranda', icon: HomeIcon },
            { key: 'market', label: 'Pasar', icon: BarChart3 },
            { key: 'sinyal', label: 'Sinyal', icon: Target },
            { key: 'investasi', label: 'Investasi', icon: DollarSign },
            { key: 'more', label: 'Lainnya', icon: Menu },
          ].map(tab => (
            <button key={tab.key} onClick={() => {
              if (tab.key === 'more') setShowSideMenu(true)
              else setActiveTab(tab.key)
            }} className={`flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors ${activeTab === tab.key ? 'text-gs-green3' : 'text-gs-muted hover:text-gs-green'}`}>
              <tab.icon className={`w-5 h-5 ${activeTab === tab.key ? 'text-gs-green3' : ''}`} />
              <span className={`text-[8px] font-bold ${activeTab === tab.key ? 'text-gs-green3' : ''}`}>{tab.label}</span>
              {activeTab === tab.key && <div className="w-1 h-1 rounded-full bg-gs-green3" />}
            </button>
          ))}
        </div>
      </nav>

      {/* Desktop Sidebar Navigation - hidden on mobile */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 z-30 w-[72px] lg:w-[80px] bg-white border-r border-gs-line flex-col items-center pt-16 pb-4 gap-1">
        {[
          { key: 'home', label: 'Beranda', icon: HomeIcon },
          { key: 'market', label: 'Pasar', icon: BarChart3 },
          { key: 'sinyal', label: 'Sinyal', icon: Target },
          { key: 'investasi', label: 'Investasi', icon: DollarSign },
          { key: 'undang', label: 'Undang', icon: UserPlus },
          { key: 'portfolio', label: 'Portofolio', icon: Briefcase },
          { key: 'finance', label: 'Keuangan', icon: Wallet },
          { key: 'history', label: 'Riwayat', icon: History },
          { key: 'bonus', label: 'Bonus', icon: Gift },
          { key: 'profile', label: 'Profil', icon: User },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`w-full flex flex-col items-center gap-0.5 py-2.5 transition-colors ${activeTab === tab.key ? 'text-gs-green3 bg-emerald-50' : 'text-gs-muted hover:text-gs-green hover:bg-gs-soft'}`}>
            <tab.icon className="w-5 h-5" />
            <span className="text-[7px] lg:text-[8px] font-bold">{tab.label}</span>
          </button>
        ))}
        <div className="mt-auto">
          <button onClick={() => { logout(); toast({ title: 'Berhasil logout' }) }}
            className="w-full flex flex-col items-center gap-0.5 py-2.5 text-red-400 hover:text-red-600 transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="text-[7px] lg:text-[8px] font-bold">Keluar</span>
          </button>
        </div>
      </nav>

      {/* Side Menu */}
      <AnimatePresence>
        {showSideMenu && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40" onClick={() => setShowSideMenu(false)} />
            <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: 'spring', damping: 25 }} className="fixed left-0 top-0 bottom-0 z-50 w-[270px] md:w-[320px] bg-white shadow-2xl overflow-y-auto custom-scrollbar">
              <div className="p-4" style={{ background: 'linear-gradient(145deg, #022c22 0%, #064e3b 54%, #059669 100%)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 grid place-items-center"><User className="w-6 h-6 text-yellow-300" /></div>
                  <div className="text-white">
                    <b className="block text-[12px] font-black">{user?.name}</b>
                    <span className="block text-[8px] text-emerald-200">+62 {user?.phone}</span>
                  </div>
                </div>
              </div>
              <div className="p-2">
                {[
                  { icon: <HomeIcon className="w-4 h-4" />, label: 'Beranda', key: 'home' },
                  { icon: <BarChart3 className="w-4 h-4" />, label: 'Pasar Saham', key: 'market' },
                  { icon: <Target className="w-4 h-4" />, label: 'Sinyal Pro', key: 'sinyal' },
                  { icon: <DollarSign className="w-4 h-4" />, label: 'Investasi', key: 'investasi' },
                  { icon: <Briefcase className="w-4 h-4" />, label: 'Portofolio', key: 'portfolio' },
                  { icon: <Wallet className="w-4 h-4" />, label: 'Keuangan', key: 'finance' },
                  { icon: <History className="w-4 h-4" />, label: 'Riwayat', key: 'history' },
                  { icon: <UserPlus className="w-4 h-4" />, label: 'Undang', key: 'undang' },
                  { icon: <Newspaper className="w-4 h-4" />, label: 'Berita', key: 'news' },
                  { icon: <Gift className="w-4 h-4" />, label: 'Bonus & Promo', key: 'bonus' },
                  { icon: <Trophy className="w-4 h-4" />, label: 'Leaderboard', key: 'leaderboard' },
                  { icon: <User className="w-4 h-4" />, label: 'Profil', key: 'profile' },
                ].map(item => (
                  <button key={item.key} onClick={() => { setActiveTab(item.key); setShowSideMenu(false) }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[10px] font-bold transition-colors ${activeTab === item.key ? 'bg-gs-soft text-gs-green3' : 'text-gs-text hover:bg-gs-soft'}`}>
                    {item.icon}{item.label}
                  </button>
                ))}
                <div className="mt-3 pt-3 border-t border-gs-line">
                  <button onClick={() => { logout(); setShowSideMenu(false); toast({ title: 'Berhasil logout' }) }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[10px] font-bold text-red-500 hover:bg-red-50 transition-colors">
                    <LogOut className="w-4 h-4" />Keluar
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Notification Panel */}
      <AnimatePresence>
        {showNotifPanel && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40" onClick={() => setShowNotifPanel(false)} />
            <motion.div initial={{ x: 300 }} animate={{ x: 0 }} exit={{ x: 300 }} transition={{ type: 'spring', damping: 25 }} className="fixed right-0 top-0 bottom-0 z-50 w-[300px] md:w-[380px] bg-white shadow-2xl overflow-y-auto custom-scrollbar">
              <div className="p-4 border-b border-gs-line flex items-center justify-between">
                <h3 className="text-[13px] font-black text-gs-green3">Notifikasi</h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => markNotifRead()} className="text-[8px] font-bold text-gs-green hover:underline">Tandai semua dibaca</button>
                  <button onClick={() => setShowNotifPanel(false)} className="w-7 h-7 rounded-lg grid place-items-center hover:bg-gs-soft"><X className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="p-2">
                {notifications.map(n => (
                  <div key={n.id} className={`p-3 rounded-xl mb-1 ${n.isRead ? 'bg-white' : 'bg-emerald-50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-6 h-6 rounded-lg grid place-items-center ${n.type === 'trade' ? 'bg-emerald-100' : n.type === 'deposit' ? 'bg-emerald-100' : n.type === 'bonus' ? 'bg-purple-100' : 'bg-amber-100'}`}>
                        {n.type === 'trade' ? <BarChart3 className="w-3 h-3 text-emerald-600" /> : n.type === 'deposit' ? <Wallet className="w-3 h-3 text-emerald-600" /> : n.type === 'bonus' ? <Gift className="w-3 h-3 text-purple-600" /> : <Bell className="w-3 h-3 text-amber-600" />}
                      </div>
                      <span className="flex-1 text-[9px] font-bold text-gs-text">{n.title}</span>
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-gs-green" />}
                    </div>
                    <p className="text-[8px] text-gs-muted leading-relaxed">{n.message}</p>
                    <span className="block text-[7px] text-gs-muted mt-1">{formatDateTime(n.createdAt)}</span>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <div className="text-center py-8">
                    <Bell className="w-8 h-8 text-gs-muted mx-auto mb-2" />
                    <p className="text-[10px] font-bold text-gs-muted">Tidak ada notifikasi</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Investment Confirmation Modal */}
      <AnimatePresence>
        {showInvestModal && selectedProduct && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40" onClick={() => setShowInvestModal(false)} />
            <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25 }} className="fixed z-50 bottom-0 left-0 right-0 md:inset-0 md:bottom-auto md:left-auto md:right-auto md:flex md:items-center md:justify-center max-h-[85vh] md:max-h-[90vh] bg-white rounded-t-3xl md:rounded-3xl shadow-2xl overflow-y-auto custom-scrollbar md:w-[90vw] md:max-w-md md:mx-auto md:my-auto">
              <div className="p-4 md:p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[14px] md:text-lg font-black text-gs-green3">RINGKASAN INVESTASI</h3>
                  <button onClick={() => setShowInvestModal(false)} className="w-8 h-8 rounded-full grid place-items-center hover:bg-gs-soft"><X className="w-4 h-4" /></button>
                </div>

                {/* Product Info */}
                <div className="rounded-2xl p-3 mb-4" style={{ background: 'linear-gradient(145deg, #022c22 0%, #064e3b 54%, #059669 100%)' }}>
                  <div className="text-white">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-5 h-5 text-yellow-300" />
                      <span className="text-[13px] font-black">{selectedProduct.name}</span>
                    </div>
                    <span className="text-[8px] font-bold text-emerald-200">Aset Saham • {selectedProduct.category === 'potential' ? 'Saham Potential' : 'Saham Dividen'}</span>
                  </div>
                </div>

                {/* Summary Details */}
                <div className="space-y-2.5 mb-4">
                  <div className="flex items-center justify-between py-1.5 border-b border-gs-line">
                    <span className="text-[9px] font-bold text-gs-muted uppercase tracking-wider">JUMLAH INVESTASI</span>
                    <span className="text-[12px] font-black text-gs-text">{formatRupiah(selectedProduct.modal)}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-gs-line">
                    <span className="text-[9px] font-bold text-gs-muted uppercase tracking-wider">SALDO TERSEDIA</span>
                    <span className={`text-[12px] font-black ${(user?.balance || 0) >= selectedProduct.modal ? 'text-gs-green3' : 'text-red-500'}`}>{formatRupiah(user?.balance || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-gs-line">
                    <span className="text-[9px] font-bold text-gs-muted uppercase tracking-wider">PENDAPATAN HARIAN</span>
                    <span className="text-[12px] font-black text-emerald-600">+{formatRupiah(selectedProduct.dailyProfit)}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-gs-line">
                    <span className="text-[9px] font-bold text-gs-muted uppercase tracking-wider">DURASI</span>
                    <span className="text-[12px] font-black text-gs-text">{selectedProduct.duration} Hari</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-[9px] font-bold text-gs-muted uppercase tracking-wider">TOTAL KEUNTUNGAN</span>
                    <div className="text-right">
                      <span className="text-[12px] font-black text-gs-green3">{formatRupiah(selectedProduct.totalReturn)}</span>
                      <span className="ml-1 text-[8px] font-bold text-yellow-600 bg-yellow-50 px-1 rounded">ROI {selectedProduct.roi}%</span>
                    </div>
                  </div>
                </div>

                {/* Balance Warning */}
                {(user?.balance || 0) < selectedProduct.modal && (
                  <div className="rounded-xl p-2.5 bg-red-50 border border-red-200 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-[9px] font-bold text-red-600">Saldo tidak mencukupi. Silakan deposit terlebih dahulu.</span>
                  </div>
                )}

                {/* Note */}
                <div className="rounded-xl p-2.5 bg-emerald-50 border border-emerald-100 mb-4 flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-[8px] text-emerald-700 leading-relaxed">Pembelian akan diproses langsung dari saldo Anda setelah konfirmasi.</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button onClick={() => setShowInvestModal(false)} className="flex-1 h-11 rounded-xl bg-gs-soft border border-gs-line text-gs-muted text-[11px] font-bold hover:bg-gray-100 transition-colors">
                    Nanti
                  </button>
                  <button onClick={handlePurchaseInvestment} disabled={investLoading || (user?.balance || 0) < selectedProduct.modal}
                    className="flex-1 h-11 rounded-xl text-white text-[11px] font-black disabled:opacity-70 hover:scale-[1.02] transition-transform"
                    style={{ background: 'linear-gradient(135deg, #064e3b 0%, #064e3b 50%, #059669 100%)' }}>
                    {investLoading ? 'Memproses...' : 'Konfirmasi Pembelian'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Stock Detail Modal */}
      <AnimatePresence>
        {showStockDetail && selectedStock && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40" onClick={() => setShowStockDetail(false)} />
            <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25 }} className="fixed z-50 bottom-0 left-0 right-0 md:inset-0 md:bottom-auto md:left-auto md:right-auto md:top-auto md:flex md:items-center md:justify-center max-h-[85vh] md:max-h-[90vh] bg-white rounded-t-3xl md:rounded-3xl shadow-2xl overflow-y-auto custom-scrollbar md:w-[90vw] md:max-w-2xl md:mx-auto md:my-auto">
              <div className="sticky top-0 bg-white p-4 border-b border-gs-line flex items-center justify-between rounded-t-3xl">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-gs-soft flex items-center justify-center">{selectedStock.logo ? <img src={selectedStock.logo} alt={selectedStock.code} className="w-full h-full object-cover" /> : <span className="text-[10px] font-black text-gs-green3">{selectedStock.code.slice(0, 2)}</span>}</div>
                  <div>
                    <span className="block text-[12px] font-black text-gs-text">{selectedStock.code}</span>
                    <span className="block text-[8px] text-gs-muted">{selectedStock.name}</span>
                  </div>
                </div>
                <button onClick={() => setShowStockDetail(false)} className="w-8 h-8 rounded-lg grid place-items-center hover:bg-gs-soft"><X className="w-4 h-4" /></button>
              </div>

              <div className="p-4">
                {/* Price */}
                <div className="mb-3">
                  <span className="block text-2xl font-black text-gs-text tabular-nums">{formatRupiah(selectedStock.price)}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[11px] font-bold ${selectedStock.changePercent >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {selectedStock.changePercent >= 0 ? <TrendingUp className="w-3.5 h-3.5 inline" /> : <TrendingDown className="w-3.5 h-3.5 inline" />}
                      {' '}{formatRupiah(selectedStock.change)} ({formatPercent(selectedStock.changePercent)})
                    </span>
                  </div>
                </div>
                  {/* Contract Profit Preview */}
                  <div className="mb-3 rounded-xl p-3 border border-emerald-200 bg-gradient-to-b from-emerald-50/50 to-white">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Package className="w-4 h-4 text-emerald-600" />
                      <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Info Kontrak</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-lg p-2 bg-white border border-emerald-100 text-center">
                        <span className="block text-[7px] font-bold text-gs-muted">Rate Dasar</span>
                        <span className="block text-[12px] font-black text-emerald-700">{getStockBaseRate(selectedStock.code)}%</span>
                        <span className="block text-[6px] text-gs-muted">per hari</span>
                      </div>
                      <div className="rounded-lg p-2 bg-white border border-emerald-100 text-center">
                        <span className="block text-[7px] font-bold text-gs-muted">Min. Durasi</span>
                        <span className="block text-[12px] font-black text-gs-green3">30</span>
                        <span className="block text-[6px] text-gs-muted">hari</span>
                      </div>
                      <div className="rounded-lg p-2 bg-white border border-emerald-100 text-center">
                        <span className="block text-[7px] font-bold text-gs-muted">Max. Durasi</span>
                        <span className="block text-[12px] font-black text-gs-green3">365</span>
                        <span className="block text-[6px] text-gs-muted">hari</span>
                      </div>
                    </div>
                    <div className="mt-2 rounded-lg p-2 bg-emerald-50 border border-emerald-100">
                      <div className="flex items-center gap-1 mb-1">
                        <Zap className="w-3 h-3 text-gs-gold" />
                        <span className="text-[7px] font-bold text-gs-muted">Contoh: Rp 1.000.000 × 30 hari</span>
                      </div>
                      {(() => {
                        const exampleProfit = calcContractProfit(selectedStock, 30, 1000000)
                        return (
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] text-gs-muted">Profit/hari: <b className="text-emerald-700">{formatRupiah(exampleProfit.dailyProfitAmount)}</b></span>
                            <span className="text-[8px] text-gs-muted">Total: <b className="text-emerald-700">{formatRupiah(exampleProfit.totalReturn)}</b></span>
                          </div>
                        )
                      })()}
                    </div>
                  </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[
                    { label: 'Open', value: formatRupiah(selectedStock.open) },
                    { label: 'High', value: formatRupiah(selectedStock.high) },
                    { label: 'Low', value: formatRupiah(selectedStock.low) },
                    { label: 'Volume', value: formatNumber(selectedStock.volume) },
                  ].map((s, i) => (
                    <div key={i} className="rounded-xl p-2 bg-gs-soft text-center">
                      <span className="block text-[7px] font-bold text-gs-muted">{s.label}</span>
                      <span className="block text-[8px] font-black text-gs-text tabular-nums">{s.value}</span>
                    </div>
                  ))}
                </div>

                {/* Fundamentals */}
                <div className="rounded-xl p-3 bg-gs-soft mb-3">
                  <h4 className="text-[9px] font-black text-gs-green3 mb-1.5">Data Fundamental</h4>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { label: 'Market Cap', value: formatMarketCap(selectedStock.marketCap) },
                      { label: 'P/E Ratio', value: selectedStock.peRatio?.toFixed(1) || '-' },
                      { label: 'PBV', value: selectedStock.pbv?.toFixed(2) || '-' },
                      { label: 'Div. Yield', value: selectedStock.dividendYield ? `${selectedStock.dividendYield.toFixed(2)}%` : '-' },
                    ].map((f, i) => (
                      <div key={i} className="flex items-center justify-between py-0.5">
                        <span className="text-[8px] text-gs-muted">{f.label}</span>
                        <span className="text-[8px] font-bold text-gs-text">{f.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contract Button */}
                <button onClick={() => { setContractModal(true); setShowStockDetail(false) }} className="w-full h-12 rounded-xl bg-emerald-600 text-white text-[12px] font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
                  <Package className="w-5 h-5" />Beli Kontrak {selectedStock.code}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Contract Modal */}
      <AnimatePresence>
        {contractModal && selectedStock && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40" onClick={() => setContractModal(false)} />
            <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25 }} className="fixed z-50 bottom-0 left-0 right-0 md:inset-0 md:bottom-auto md:left-auto md:right-auto md:top-auto md:flex md:items-center md:justify-center bg-white rounded-t-3xl md:rounded-3xl shadow-2xl md:w-[90vw] md:max-w-lg md:mx-auto md:my-auto">
              <div className="p-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl overflow-hidden bg-gs-soft flex items-center justify-center">
                      {selectedStock.logo ? <img src={selectedStock.logo} alt={selectedStock.code} className="w-full h-full object-cover" /> : <span className="text-[9px] font-black text-gs-green3">{selectedStock.code.slice(0, 2)}</span>}
                    </div>
                    <div>
                      <h3 className="text-[14px] font-black text-gs-green3">Beli Kontrak {selectedStock.code}</h3>
                      <span className="text-[8px] text-gs-muted">{selectedStock.name} • {formatRupiah(selectedStock.price)}</span>
                    </div>
                  </div>
                  <button onClick={() => setContractModal(false)} className="w-8 h-8 rounded-lg grid place-items-center hover:bg-gs-soft"><X className="w-4 h-4" /></button>
                </div>

                {/* Stock Info */}
                <div className="rounded-xl p-3 bg-gs-soft mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-bold text-gs-muted">Harga Saham</span>
                    <span className="text-[14px] font-black text-gs-text tabular-nums">{formatRupiah(selectedStock.price)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[8px] text-gs-muted">Rate Dasar</span>
                    <span className="text-[11px] font-black text-emerald-700">{getStockBaseRate(selectedStock.code)}% / hari</span>
                  </div>
                </div>

                {/* Duration Selection */}
                <div className="mb-3">
                  <label className="block text-[9px] font-black text-gs-green3 mb-1.5">Durasi Kontrak</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[30, 60, 90, 120, 180, 365].map(d => {
                      const durMult = d <= 30 ? 1 : d <= 60 ? 1.15 : d <= 90 ? 1.3 : d <= 120 ? 1.5 : d <= 180 ? 1.8 : 2.5
                      const effectiveRate = getStockBaseRate(selectedStock.code) * durMult
                      return (
                        <button key={d} onClick={() => setContractDuration(d)}
                          className={`rounded-xl p-2 text-center border-2 transition-all ${contractDuration === d ? 'border-emerald-500 bg-emerald-50' : 'border-gs-line bg-white hover:border-emerald-200'}`}>
                          <span className="block text-[11px] font-black text-gs-text">{d}</span>
                          <span className="block text-[7px] font-bold text-gs-muted">hari</span>
                          <span className="block text-[8px] font-black text-emerald-700 mt-0.5">{(effectiveRate).toFixed(1)}%</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Amount Input */}
                <div className="mb-3">
                  <label className="block text-[9px] font-black text-gs-green3 mb-1.5">Jumlah Investasi (Rp)</label>
                  <input type="number" value={contractAmount} onChange={(e) => setContractAmount(e.target.value)} placeholder="Min. 100.000"
                    className="w-full h-10 rounded-xl bg-gs-soft border border-gs-line px-3 text-[12px] font-semibold outline-none focus:border-gs-green" />
                </div>

                {/* Quick Amount Buttons */}
                <div className="flex gap-1.5 mb-3">
                  {['100000', '200000', '500000', '1000000', '5000000'].map(amt => (
                    <button key={amt} onClick={() => setContractAmount(amt)} className="flex-1 h-7 rounded-lg bg-gs-soft border border-gs-line text-[7px] font-bold text-gs-green3 hover:bg-gs-green hover:text-white transition-colors">
                      {parseInt(amt) >= 1000000 ? `${parseInt(amt)/1000000}M` : `${parseInt(amt)/1000}K`}
                    </button>
                  ))}
                </div>

                {/* Profit Summary */}
                {contractAmount && parseInt(contractAmount) > 0 && (() => {
                  const amount = parseInt(contractAmount)
                  const profit = calcContractProfit(selectedStock, contractDuration, amount)
                  return (
                    <div className="rounded-xl p-3 border border-emerald-200 bg-emerald-50/50 mb-3">
                      <h4 className="text-[9px] font-black text-emerald-700 mb-1.5">Ringkasan Kontrak</h4>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] text-gs-muted">Jumlah Investasi</span>
                          <span className="text-[8px] font-bold text-gs-text">{formatRupiah(amount)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] text-gs-muted">Durasi</span>
                          <span className="text-[8px] font-bold text-gs-text">{contractDuration} hari</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] text-gs-muted">Rate Harian</span>
                          <span className="text-[8px] font-black text-emerald-700">{profit.dailyRate}%/hari</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] text-gs-muted">Profit Harian</span>
                          <span className="text-[8px] font-black text-emerald-700">{formatRupiah(profit.dailyProfitAmount)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] text-gs-muted">Total Profit ({contractDuration} hari)</span>
                          <span className="text-[9px] font-black text-emerald-700">{formatRupiah(profit.totalProfit)}</span>
                        </div>
                        <div className="flex items-center justify-between pt-1 mt-1 border-t border-emerald-200">
                          <span className="text-[9px] font-black text-gs-green3">Total Kembali</span>
                          <span className="text-[11px] font-black text-gs-green3">{formatRupiah(profit.totalReturn)}</span>
                        </div>
                      </div>
                      <div className="mt-2 rounded-lg p-1.5 bg-gs-gold/10 border border-gs-gold/20">
                        <span className="text-[7px] text-gs-gold font-bold">💡 Lebih lama kontrak & lebih besar modal = profit lebih tinggi!</span>
                      </div>
                    </div>
                  )
                })()}

                {/* Balance Check */}
                {contractAmount && parseInt(contractAmount) > (user?.balance || 0) && (
                  <div className="rounded-xl p-2 bg-red-50 border border-red-200 mb-3">
                    <span className="text-[8px] font-bold text-red-600">Saldo tidak cukup! Saldo: {formatRupiah(user?.balance || 0)}</span>
                  </div>
                )}

                <span className="block text-[8px] text-emerald-700 leading-relaxed mb-3">Profit harian dapat diklaim setiap hari pukul 00:00 WIB. Kontrak berakhir setelah {contractDuration} hari.</span>

                {/* Submit */}
                <button onClick={handleContract} disabled={contractLoading || !contractAmount || parseInt(contractAmount) < 100000}
                  className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold disabled:opacity-70 transition-colors flex items-center justify-center gap-2">
                  {contractLoading ? (
                    <div className="w-5 h-5 rounded-full border-[3px] border-white/30 border-t-white animate-spin" />
                  ) : (
                    <><Package className="w-4 h-4" />Beli Kontrak {selectedStock.code}</>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sinyal Pro Modal */}
      <AnimatePresence>
        {showSinyalModal && selectedSinyalStock && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40" onClick={() => { setShowSinyalModal(false); setSinyalActive(false); setSinyalAutoMode(false) }} />
            <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25 }} className="fixed z-50 bottom-0 left-0 right-0 md:inset-0 md:bottom-auto md:left-auto md:right-auto md:flex md:items-center md:justify-center max-h-[90vh] bg-white rounded-t-3xl md:rounded-3xl shadow-2xl overflow-y-auto custom-scrollbar md:w-[90vw] md:max-w-lg md:mx-auto md:my-auto">
              <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-gs-green3" />
                    <div>
                      <h3 className="text-[14px] font-black text-gs-green3">Sinyal Pro — {selectedSinyalStock.code}</h3>
                      <span className="text-[8px] text-gs-muted">{selectedSinyalStock.name} • {formatRupiah(selectedSinyalStock.price)}</span>
                    </div>
                  </div>
                  <button onClick={() => { setShowSinyalModal(false); setSinyalActive(false); setSinyalAutoMode(false) }} className="w-8 h-8 rounded-lg grid place-items-center hover:bg-gs-soft"><X className="w-4 h-4" /></button>
                </div>

                {/* Live Chart — Dark Pro Theme */}
                <div className="rounded-xl overflow-hidden mb-3" style={{ background: 'linear-gradient(180deg, #0d1117 0%, #161b22 100%)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 0 12px rgba(0,0,0,0.3)' }}>
                  <div className="flex items-center justify-between px-2 pt-2 pb-1" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)' }}>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[7px] font-black text-emerald-400">LIVE</span>
                    </div>
                    {/* Mini chart type + timeframe controls — Professional pills */}
                    <div className="flex items-center gap-1">
                      <div className="flex items-center gap-0.5 rounded-md p-0.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {(['candle', 'area', 'line', 'bar', 'mountain', 'step', 'histogram', 'hollow'] as const).map(ct => (
                          <button key={ct} onClick={() => setSinyalChartType(ct)}
                            className={`h-5 px-1.5 rounded text-[6px] font-bold flex items-center justify-center transition-all duration-200 ${sinyalChartType === ct ? '' : 'opacity-40 hover:opacity-70'}`}
                            style={sinyalChartType === ct ? { background: 'linear-gradient(135deg, rgba(5,150,105,0.35), rgba(16,185,129,0.2))', color: '#34d399', boxShadow: '0 0 6px rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.2)' } : { color: '#9ca3af', border: '1px solid transparent' }}>
                            {ct.charAt(0).toUpperCase()}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-0.5">
                        {(['1M', '5M', '15M', '1H', '4H', '1D', '1W', 'ALL'] as const).map(tf => (
                          <button key={tf} onClick={() => setSinyalTimeframe(tf)}
                            className={`h-4 px-1 rounded text-[6px] font-bold transition-all ${sinyalTimeframe === tf ? '' : 'opacity-40 hover:opacity-70'}`}
                            style={sinyalTimeframe === tf ? { background: 'rgba(5,150,105,0.25)', color: '#34d399', boxShadow: '0 0 4px rgba(52,211,153,0.1)' } : { color: '#9ca3af' }}>
                            {tf}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Glow line under header */}
                  <div className="h-px" style={{ background: selectedSinyalStock.changePercent >= 0 ? 'linear-gradient(90deg, transparent 0%, rgba(52,211,153,0.2) 50%, transparent 100%)' : 'linear-gradient(90deg, transparent 0%, rgba(248,113,113,0.2) 50%, transparent 100%)' }} />
                  <div className="h-[130px] px-1 pb-1">
                    {(() => {
                      const rawData = getSinyalChartData(selectedSinyalStock.id)
                      const chartData = getDataForTimeframe(rawData, sinyalTimeframe)
                      const isUp = selectedSinyalStock.changePercent >= 0
                      const chartColor = isUp ? '#34d399' : '#f87171'
                      const ma7 = computeMA(chartData, 7)
                      const ma25 = computeMA(chartData, 25)
                      const enrichedData = chartData.map((d, i) => ({ ...d, ma7: ma7[i], ma25: ma25[i] }))

                      if (chartData.length < 3) {
                        const sparkData = getSparklineData(selectedSinyalStock)
                        return (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={sparkData} margin={{ top: 2, right: 8, bottom: 2, left: 2 }}>
                              <defs><linearGradient id="sinyalModalFallback" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={chartColor} stopOpacity="0.3" /><stop offset="50%" stopColor={chartColor} stopOpacity="0.1" /><stop offset="100%" stopColor={chartColor} stopOpacity="0" /></linearGradient></defs>
                              <XAxis dataKey="i" hide /><YAxis hide domain={computeYDomain(sparkData.map(d => ({price: d.p})), 0.1)} />
                              <Line type="monotone" dataKey="p" stroke={chartColor} strokeWidth={4} dot={false} activeDot={false} strokeOpacity={0.12} />
                              <Area type="monotone" dataKey="p" stroke={chartColor} fill="url(#sinyalModalFallback)" strokeWidth={2} dot={false} activeDot={false} />
                            </AreaChart>
                          </ResponsiveContainer>
                        )
                      }
                      const values = chartData.map(d => d.value)
                      const minV = Math.min(...values)
                      const maxV = Math.max(...values)
                      const rangeV = maxV - minV || 1
                      const domain: [number, number] = [Math.floor(minV - rangeV * 0.08), Math.ceil(maxV + rangeV * 0.08)]

                      if (sinyalChartType === 'candle' || sinyalChartType === 'hollow') {
                        const candles = getCandleData(chartData)
                        if (candles.length < 2) return <div className="flex items-center justify-center h-full text-[8px] text-gray-500">Memuat...</div>
                        const allPrices = candles.flatMap(c => [c.high, c.low])
                        const minP = Math.min(...allPrices)
                        const maxP = Math.max(...allPrices)
                        const rangeP = maxP - minP || 1
                        const totalCandles = candles.length
                        const svgW = totalCandles * 12 + 44
                        const priceH = 120
                        const padding = { top: 6, bottom: 6, left: 4, right: 40 }
                        const drawW = svgW - padding.left - padding.right
                        const candleSpacing = drawW / totalCandles
                        const candleW = Math.max(3, Math.floor(candleSpacing * 0.6))
                        const priceToY = (p: number) => padding.top + ((maxP - p) / rangeP) * (priceH - padding.top - padding.bottom)
                        // MA for SVG candles
                        const cma7 = computeMA(chartData, 7)
                        const cma25 = computeMA(chartData, 25)
                        const ma7Pts: string[] = []
                        const ma25Pts: string[] = []
                        const stX = svgW / chartData.length
                        chartData.forEach((d, i) => {
                          if (cma7[i] !== null) ma7Pts.push(`${i * stX},${priceToY(cma7[i]!)}`)
                          if (cma25[i] !== null) ma25Pts.push(`${i * stX},${priceToY(cma25[i]!)}`)
                        })
                        return (
                          <svg className="w-full h-full" viewBox={`0 0 ${svgW} ${priceH}`} preserveAspectRatio="xMidYMid meet">
                            {/* Grid — dashed horizontal */}
                            {[0, 1, 2, 3].map(gi => {
                              const y = padding.top + gi * ((priceH - padding.top - padding.bottom) / 4)
                              return <line key={`mgh${gi}`} x1={padding.left} y1={y} x2={svgW - padding.right} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" strokeDasharray="2,4" />
                            })}
                            {/* Price labels */}
                            {[0, 2, 4].map(gi => {
                              const price = maxP - (gi / 4) * rangeP
                              const y = priceToY(price)
                              return (
                                <g key={`mp${gi}`}>
                                  <rect x={svgW - padding.right + 2} y={y - 3.5} width={padding.right - 4} height="7" rx="1.5" fill="rgba(255,255,255,0.04)" />
                                  <text x={svgW - 2} y={y + 2} textAnchor="end" fill="rgba(255,255,255,0.25)" fontSize="5" fontFamily="monospace" fontWeight="500">{formatRupiah(Math.round(price)).replace('Rp', '').trim()}</text>
                                </g>
                              )
                            })}
                            {candles.map((c, i) => {
                              const cx = padding.left + i * candleSpacing + candleSpacing / 2
                              const x = cx - candleW / 2
                              const yH = priceToY(c.high)
                              const yL = priceToY(c.low)
                              const yO = priceToY(c.open)
                              const yC = priceToY(c.close)
                              const isGreen = c.close >= c.open
                              const bodyTop = Math.min(yO, yC)
                              const bodyH = Math.max(Math.abs(yO - yC), 1.5)
                              const isHollow = sinyalChartType === 'hollow'
                              const isLast = i === totalCandles - 1
                              const fillColor = isGreen ? '#22c55e' : '#ef4444'
                              return (
                                <g key={i} opacity={isLast ? 1 : 0.9}>
                                  <line x1={cx} y1={yH} x2={cx} y2={yL} stroke={fillColor} strokeWidth="0.8" opacity={isLast ? 1 : 0.7} />
                                  {isHollow ? (
                                    <rect x={x} y={bodyTop} width={candleW} height={bodyH} fill={isGreen ? 'transparent' : fillColor} stroke={fillColor} strokeWidth="0.6" rx="0.5" />
                                  ) : (
                                    <rect x={x} y={bodyTop} width={candleW} height={bodyH} fill={fillColor} rx="0.5" />
                                  )}
                                  {isLast && (
                                    <>
                                      <circle cx={cx} cy={yC} r="2" fill={fillColor}>
                                        <animate attributeName="r" values="2;4;2" dur="1.5s" repeatCount="indefinite" />
                                        <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.5s" repeatCount="indefinite" />
                                      </circle>
                                      <circle cx={cx} cy={yC} r="1.5" fill={fillColor} />
                                    </>
                                  )}
                                </g>
                              )
                            })}
                            {sinyalShowMA7 && ma7Pts.length > 1 && <polyline points={ma7Pts.join(' ')} fill="none" stroke="#fbbf24" strokeWidth="0.8" opacity="0.6" />}
                            {sinyalShowMA25 && ma25Pts.length > 1 && <polyline points={ma25Pts.join(' ')} fill="none" stroke="#60a5fa" strokeWidth="0.8" opacity="0.6" />}
                          </svg>
                        )
                      }

                      // Recharts-based
                      if (sinyalChartType === 'line') {
                        return (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={enrichedData} margin={{ top: 4, right: 40, bottom: 2, left: 2 }}>
                              <CartesianGrid strokeDasharray="1 3" stroke="rgba(255,255,255,0.03)" horizontal vertical={false} />
                              <XAxis dataKey="idx" hide /><YAxis hide domain={domain} />
                              <ReferenceLine y={selectedSinyalStock.price} stroke={chartColor} strokeDasharray="3 3" strokeOpacity={0.3} />
                              {sinyalShowMA7 && <Line type="monotone" dataKey="ma7" stroke="#fbbf24" strokeWidth={1} dot={false} activeDot={false} connectNulls />}
                              {sinyalShowMA25 && <Line type="monotone" dataKey="ma25" stroke="#60a5fa" strokeWidth={1} dot={false} activeDot={false} connectNulls />}
                              <Line type="monotone" dataKey="value" stroke={chartColor} strokeWidth={1.5} dot={false}
                                activeDot={{ r: 3, fill: chartColor, stroke: '#0d1117', strokeWidth: 1.5 }}
                                isAnimationActive={true} animationDuration={800} connectNulls />
                              <YAxis yAxisId="price" orientation="right" domain={domain} tickFormatter={(v: number) => formatRupiah(v).replace('Rp', '').trim()} tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 7, fontFamily: 'monospace' }} axisLine={false} tickLine={false} width={38} />
                            </LineChart>
                          </ResponsiveContainer>
                        )
                      }

                      if (sinyalChartType === 'bar' || sinyalChartType === 'histogram') {
                        const barData = chartData.map((d, i) => ({ idx: d.idx, value: d.value, fill: i > 0 && d.value >= chartData[i - 1].value ? '#22c55e' : '#ef4444' }))
                        return (
                          <ResponsiveContainer width="100%" height="100%">
                            <ReBarChart data={barData} margin={{ top: 4, right: 40, bottom: 2, left: 2 }}>
                              <CartesianGrid strokeDasharray="1 3" stroke="rgba(255,255,255,0.03)" horizontal vertical={false} />
                              <XAxis dataKey="idx" hide /><YAxis hide domain={domain} />
                              <Bar dataKey="value" radius={[1, 1, 0, 0]} maxBarSize={sinyalChartType === 'histogram' ? 3 : 8} isAnimationActive={true} animationDuration={800}
                                shape={(props: Record<string, unknown>) => {
                                  const { x, y, width, height, fill: _fill } = props as { x: number; y: number; width: number; height: number; fill: string }
                                  return <rect x={x} y={y} width={Math.max(width, 1)} height={Math.max(height, 0.5)} fill={_fill} opacity={0.85} />
                                }}>
                                {barData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}
                              </Bar>
                              <YAxis yAxisId="price" orientation="right" domain={domain} tickFormatter={(v: number) => formatRupiah(v).replace('Rp', '').trim()} tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 7, fontFamily: 'monospace' }} axisLine={false} tickLine={false} width={38} />
                            </ReBarChart>
                          </ResponsiveContainer>
                        )
                      }

                      // Area / Mountain / Step
                      const areaType = sinyalChartType === 'step' ? 'stepAfter' : 'monotone'
                      return (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={enrichedData} margin={{ top: 4, right: 40, bottom: 2, left: 2 }}>
                            <defs>
                              <linearGradient id="sinyalModalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor={chartColor} stopOpacity={sinyalChartType === 'mountain' ? 0.45 : 0.15} />
                                <stop offset="50%" stopColor={chartColor} stopOpacity={sinyalChartType === 'mountain' ? 0.25 : 0.06} />
                                <stop offset="100%" stopColor={chartColor} stopOpacity={0.02} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="1 3" stroke="rgba(255,255,255,0.03)" horizontal vertical={false} />
                            <XAxis dataKey="idx" hide /><YAxis hide domain={domain} />
                            <ReferenceLine y={selectedSinyalStock.price} stroke={chartColor} strokeDasharray="3 3" strokeOpacity={0.3} />
                            {sinyalShowMA7 && <Line type="monotone" dataKey="ma7" stroke="#fbbf24" strokeWidth={1} dot={false} activeDot={false} connectNulls />}
                            {sinyalShowMA25 && <Line type="monotone" dataKey="ma25" stroke="#60a5fa" strokeWidth={1} dot={false} activeDot={false} connectNulls />}
                            <Area type={areaType} dataKey="value" stroke={sinyalChartType === 'mountain' ? 'none' : chartColor} fill="url(#sinyalModalGrad)" strokeWidth={1.5}
                              dot={(props: Record<string, unknown>) => {
                                const { cx, cy, index } = props as { cx: number; cy: number; index: number }
                                if (index !== enrichedData.length - 1) return <g key={String(index)} />
                                return (
                                  <g key="sinyal-dot">
                                    <circle cx={cx} cy={cy} r={5} fill={chartColor} opacity={0.1}>
                                      <animate attributeName="r" values="5;9;5" dur="2s" repeatCount="indefinite" />
                                      <animate attributeName="opacity" values="0.1;0;0.1" dur="2s" repeatCount="indefinite" />
                                    </circle>
                                    <circle cx={cx} cy={cy} r={2.5} fill={chartColor} stroke="#0d1117" strokeWidth={1.5} />
                                  </g>
                                )
                              }}
                              activeDot={{ r: 3, fill: chartColor, stroke: '#0d1117', strokeWidth: 1.5 }}
                              isAnimationActive={true} animationDuration={800} />
                            <YAxis yAxisId="price" orientation="right" domain={domain} tickFormatter={(v: number) => formatRupiah(v).replace('Rp', '').trim()} tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 7, fontFamily: 'monospace' }} axisLine={false} tickLine={false} width={38} />
                          </AreaChart>
                        </ResponsiveContainer>
                      )
                    })()}
                  </div>
                  <div className="flex items-center justify-between px-2 pb-2">
                    <span className="text-[10px] font-black tabular-nums font-mono" style={{ color: selectedSinyalStock.changePercent >= 0 ? '#34d399' : '#f87171', textShadow: selectedSinyalStock.changePercent >= 0 ? '0 0 8px rgba(52,211,153,0.25)' : '0 0 8px rgba(248,113,113,0.25)' }}>{formatRupiah(selectedSinyalStock.price)}</span>
                    <span className={`text-[9px] font-bold ${selectedSinyalStock.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatPercent(selectedSinyalStock.changePercent)}</span>
                  </div>
                </div>

                {/* Direction Selector */}
                <div className="mb-3">
                  <label className="block text-[8px] font-bold text-gs-muted mb-1">Arah Prediksi</label>
                  <div className="flex gap-2">
                    <button onClick={() => setSinyalDirection('NAIK')}
                      className={`flex-1 h-11 rounded-xl text-[12px] font-black flex items-center justify-center gap-1.5 transition-all ${sinyalDirection === 'NAIK' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200' : 'bg-gs-soft text-emerald-700 border border-emerald-200'}`}>
                      <TrendingUp className="w-4 h-4" />NAIK
                    </button>
                    <button onClick={() => setSinyalDirection('TURUN')}
                      className={`flex-1 h-11 rounded-xl text-[12px] font-black flex items-center justify-center gap-1.5 transition-all ${sinyalDirection === 'TURUN' ? 'bg-red-500 text-white shadow-md shadow-red-200' : 'bg-gs-soft text-red-700 border border-red-200'}`}>
                      <TrendingDown className="w-4 h-4" />TURUN
                    </button>
                  </div>
                </div>

                {/* Amount Input */}
                <div className="mb-3">
                  <label className="block text-[8px] font-bold text-gs-muted mb-0.5">Jumlah (Rp)</label>
                  <input type="number" value={sinyalAmount} onChange={(e) => setSinyalAmount(e.target.value)} placeholder="Min. 100.000"
                    className="w-full h-10 rounded-xl bg-gs-soft border border-gs-line px-3 text-[12px] font-semibold outline-none focus:border-gs-green" />
                </div>

                {/* Quick Amount Buttons */}
                <div className="flex gap-1.5 mb-3">
                  {['100000', '200000', '500000', '1000000', '5000000'].map(amt => (
                    <button key={amt} onClick={() => setSinyalAmount(amt)} className="flex-1 h-7 rounded-lg bg-gs-soft border border-gs-line text-[7px] font-bold text-gs-green3 hover:bg-gs-green hover:text-white transition-colors">
                      {parseInt(amt) >= 1000000 ? `${parseInt(amt)/1000000}M` : `${parseInt(amt)/1000}K`}
                    </button>
                  ))}
                </div>

                {/* Duration Selector */}
                <div className="mb-3">
                  <label className="block text-[8px] font-bold text-gs-muted mb-1">Durasi Kontrak</label>
                  <div className="flex gap-1.5">
                    {[10, 30, 60, 120, 300].map(dur => (
                      <button key={dur} onClick={() => setSinyalDuration(dur)}
                        className={`flex-1 h-8 rounded-lg text-[9px] font-bold transition-colors ${sinyalDuration === dur ? 'bg-gs-green3 text-white' : 'bg-gs-soft border border-gs-line text-gs-green3'}`}>
                        {dur >= 60 ? `${dur/60}m` : `${dur}s`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Profit Calculator */}
                {sinyalAmount && parseInt(sinyalAmount) >= 100000 && (
                  <div className="rounded-xl p-3 bg-gs-soft mb-3">
                    <div className="flex items-center justify-between py-0.5">
                      <span className="text-[8px] text-gs-muted">Jumlah</span>
                      <span className="text-[8px] font-bold text-gs-text">{formatRupiah(parseInt(sinyalAmount))}</span>
                    </div>
                    <div className="flex items-center justify-between py-0.5">
                      <span className="text-[8px] text-gs-muted">Durasi</span>
                      <span className="text-[8px] font-bold text-gs-text">{sinyalDuration}s</span>
                    </div>
                    <div className="flex items-center justify-between py-0.5">
                      <span className="text-[8px] text-gs-muted">Profit Rate</span>
                      <span className="text-[8px] font-bold text-gs-green3">+{calcSinyalProfit(parseInt(sinyalAmount), sinyalDuration).toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 mt-1 border-t border-gs-line">
                      <span className="text-[9px] font-bold text-gs-green3">Potensi Profit</span>
                      <span className="text-[9px] font-black text-gs-green3">+{formatRupiah(Math.round(parseInt(sinyalAmount) * calcSinyalProfit(parseInt(sinyalAmount), sinyalDuration) / 100))}</span>
                    </div>
                  </div>
                )}

                {/* AUTO Mode Toggle */}
                <div className="flex items-center justify-between mb-3 p-2 rounded-xl bg-gs-soft border border-gs-line">
                  <div className="flex items-center gap-2">
                    <Zap className={`w-4 h-4 ${sinyalAutoMode ? 'text-gs-gold' : 'text-gs-muted'}`} />
                    <div>
                      <span className="block text-[9px] font-bold text-gs-text">Mode AUTO</span>
                      <span className="block text-[7px] text-gs-muted">Otomatis buka posisi baru</span>
                    </div>
                  </div>
                  <button onClick={() => setSinyalAutoMode(!sinyalAutoMode)}
                    className={`w-10 h-5 rounded-full transition-colors flex items-center ${sinyalAutoMode ? 'bg-gs-green3 justify-end' : 'bg-gray-300 justify-start'}`}>
                    <div className="w-4 h-4 rounded-full bg-white shadow-sm mx-0.5" />
                  </button>
                </div>

                {/* AUTO AKTIF Indicator */}
                {sinyalAutoMode && sinyalActive && (
                  <div className="flex items-center justify-center gap-2 mb-3 py-2 rounded-xl bg-gs-gold/10 border border-gs-gold/30">
                    <Zap className="w-4 h-4 text-gs-gold animate-pulse" />
                    <span className="text-[9px] font-black text-gs-gold">AUTO AKTIF — Posisi akan dibuka ulang otomatis</span>
                  </div>
                )}

                {/* Active Timer in Modal */}
                {sinyalActive && sinyalPositions.find(p => p.status === 'active') && (() => {
                  const ap = sinyalPositions.find(p => p.status === 'active')!
                  return (
                    <div className="rounded-xl p-3 mb-3 border-2 border-emerald-500 bg-emerald-50">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[12px] font-black ${ap.direction === 'NAIK' ? 'text-emerald-600' : 'text-red-600'}`}>{ap.direction} {ap.stockCode}</span>
                        <span className="text-[16px] font-black text-emerald-700 tabular-nums">{sinyalTimer}s</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-emerald-200 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(0, (1 - sinyalTimer / ap.duration) * 100)}%`, background: 'linear-gradient(135deg, #064e3b, #059669)' }} />
                      </div>
                    </div>
                  )
                })()}

                {/* Result in Modal */}
                {sinyalResult && !sinyalActive && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={`rounded-xl p-3 mb-3 text-center ${sinyalResult.won ? 'bg-emerald-50 border-2 border-emerald-400' : 'bg-red-50 border-2 border-red-400'}`}>
                    <span className="text-[20px]">{sinyalResult.won ? '🎯' : '❌'}</span>
                    <h4 className={`text-[12px] font-black ${sinyalResult.won ? 'text-emerald-700' : 'text-red-700'}`}>{sinyalResult.won ? 'Prediksi Benar!' : 'Prediksi Salah'}</h4>
                    <span className={`text-[11px] font-bold ${sinyalResult.won ? 'text-emerald-600' : 'text-red-600'}`}>{sinyalResult.won ? '+' : '-'}{formatRupiah(Math.abs(sinyalResult.profit))}</span>
                  </motion.div>
                )}

                {/* Submit */}
                <button onClick={openSinyalPosition}
                  disabled={sinyalActive || !sinyalAmount || parseInt(sinyalAmount) < 100000 || parseInt(sinyalAmount) > (user?.balance || 0)}
                  className="w-full h-12 rounded-xl text-white text-[12px] font-black disabled:opacity-70 transition-colors"
                  style={{ background: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)' }}>
                  {sinyalActive ? 'Menunggu Hasil...' : 'Buka Posisi'}
                </button>

                {/* Balance info */}
                <div className="flex items-center justify-center gap-1 mt-2">
                  <Wallet className="w-3 h-3 text-gs-muted" />
                  <span className="text-[8px] font-bold text-gs-muted">Saldo: {formatRupiah(user?.balance || 0)}</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Daily Check-in Modal */}
      <AnimatePresence>
        {showDailyCheckModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40" onClick={() => setShowDailyCheckModal(false)} />
            <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25 }} className="fixed z-50 bottom-0 left-0 right-0 md:inset-0 md:bottom-auto md:left-auto md:right-auto md:flex md:items-center md:justify-center max-h-[85vh] md:max-h-[90vh] bg-white rounded-t-3xl md:rounded-3xl shadow-2xl overflow-y-auto custom-scrollbar md:w-[90vw] md:max-w-md md:mx-auto md:my-auto">
              <div className="sticky top-0 bg-white p-4 border-b border-gs-line flex items-center justify-between rounded-t-3xl">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-gs-green3" />
                  <span className="text-[12px] font-black text-gs-text">Cek Harian</span>
                </div>
                <button onClick={() => setShowDailyCheckModal(false)} className="w-8 h-8 rounded-lg grid place-items-center hover:bg-gs-soft"><X className="w-4 h-4" /></button>
              </div>

              <div className="p-4">
                {/* Streak Display */}
                <div className="rounded-2xl p-4 text-center mb-4" style={{ background: 'linear-gradient(145deg, #022c22 0%, #064e3b 54%, #059669 100%)' }}>
                  <Flame className="w-12 h-12 text-yellow-300 mx-auto mb-2" />
                  <h3 className="text-lg font-black text-white mb-1">
                    {dailyCheckStatus.streak > 0 ? `${dailyCheckStatus.streak} Hari Berturut-turut` : 'Mulai Streak Anda!'}
                  </h3>
                  <p className="text-[9px] text-emerald-200">Cek setiap hari untuk mendapat bonus Rp 1.000 - Rp 10.000</p>

                  {/* Streak dots */}
                  <div className="flex items-center justify-center gap-1.5 mt-3">
                    {[1, 2, 3, 4, 5, 6, 7].map(day => (
                      <div key={day} className={`w-7 h-7 rounded-full flex items-center justify-center text-[8px] font-black border-2 ${
                        day <= dailyCheckStatus.streak
                          ? 'bg-yellow-500 border-yellow-400 text-gs-dark'
                          : 'bg-white/10 border-white/20 text-white/40'
                      }`}>
                        {day <= dailyCheckStatus.streak ? '✓' : day}
                      </div>
                    ))}
                  </div>

                  {/* Reward animation */}
                  {dailyCheckReward !== null && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', bounce: 0.5 }}
                      className="mt-4 rounded-xl p-3 bg-yellow-500/20 border border-yellow-400/30"
                    >
                      <span className="text-[9px] text-yellow-200 font-bold">Bonus Hari Ini</span>
                      <b className="block text-2xl font-black text-yellow-300">{formatRupiah(dailyCheckReward)}</b>
                    </motion.div>
                  )}

                  {!dailyCheckStatus.canCheckToday && dailyCheckReward === null && dailyCheckStatus.todayReward > 0 && (
                    <div className="mt-4 rounded-xl p-3 bg-white/10 border border-white/15">
                      <span className="text-[9px] text-emerald-200 font-bold">Bonus Hari Ini</span>
                      <b className="block text-2xl font-black text-yellow-300">{formatRupiah(dailyCheckStatus.todayReward)}</b>
                    </div>
                  )}
                </div>

                {/* Check-in Button */}
                {dailyCheckStatus.canCheckToday ? (
                  <button
                    onClick={handleDailyCheck}
                    disabled={dailyCheckLoading}
                    className="w-full h-12 rounded-xl text-white text-[12px] font-black hover:scale-[1.02] transition-transform disabled:opacity-70"
                    style={{ background: 'linear-gradient(135deg, #064e3b 0%, #064e3b 50%, #059669 100%)' }}
                  >
                    {dailyCheckLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 rounded-full border-[3px] border-white/30 border-t-white animate-spin" />
                        Memproses...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <CalendarDays className="w-4 h-4" /> Klaim Sekarang
                      </div>
                    )}
                  </button>
                ) : (
                  <div className="w-full h-12 rounded-xl bg-gs-soft border border-gs-line flex items-center justify-center gap-2 text-gs-muted text-[11px] font-bold">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Sudah Dicek Hari Ini ✓
                  </div>
                )}

                {/* Info */}
                <div className="mt-3 rounded-xl p-2.5 bg-emerald-50 border border-emerald-100 flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-[8px] text-emerald-700 leading-relaxed">Streak bertambah setiap kali Anda cek harian secara berturut-turut. Jangan sampai putus!</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Tasks Modal */}
      <AnimatePresence>
        {showTasksModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40" onClick={() => setShowTasksModal(false)} />
            <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25 }} className="fixed z-50 bottom-0 left-0 right-0 md:inset-0 md:bottom-auto md:left-auto md:right-auto md:flex md:items-center md:justify-center max-h-[85vh] md:max-h-[90vh] bg-white rounded-t-3xl md:rounded-3xl shadow-2xl overflow-y-auto custom-scrollbar md:w-[90vw] md:max-w-md md:mx-auto md:my-auto">
              <div className="sticky top-0 bg-white p-4 border-b border-gs-line flex items-center justify-between rounded-t-3xl">
                <div className="flex items-center gap-2">
                  <ListChecks className="w-5 h-5 text-amber-600" />
                  <span className="text-[12px] font-black text-gs-text">Tugas</span>
                </div>
                <button onClick={() => setShowTasksModal(false)} className="w-8 h-8 rounded-lg grid place-items-center hover:bg-gs-soft"><X className="w-4 h-4" /></button>
              </div>

              <div className="p-4">
                {/* Progress overview */}
                <div className="rounded-2xl p-3 mb-4" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                  <div className="flex items-center justify-between text-white">
                    <div>
                      <span className="text-[9px] font-bold text-amber-100">Progress Tugas</span>
                      <b className="block text-lg font-black">{tasks.filter(t => t.completed).length}/{tasks.length}</b>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-bold text-amber-100">Total Bonus</span>
                      <b className="block text-lg font-black">{formatRupiah(tasks.filter(t => t.claimed).reduce((sum, t) => sum + t.reward, 0))}</b>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/20 mt-2 overflow-hidden">
                    <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0}%` }} />
                  </div>
                </div>

                {/* Task List */}
                <div className="space-y-2">
                  {tasks.map(task => {
                    const taskIcons: Record<string, React.ReactNode> = {
                      first_invest: <DollarSign className="w-4 h-4" />,
                      top_up: <Wallet className="w-4 h-4" />,
                      invite_3: <Users className="w-4 h-4" />,
                      verify: <Shield className="w-4 h-4" />,
                      invest_3: <Package className="w-4 h-4" />,
                      check_7: <Flame className="w-4 h-4" />,
                    }
                    return (
                      <div key={task.id} className={`rounded-xl p-3 border ${task.claimed ? 'bg-emerald-50 border-emerald-200' : task.completed ? 'bg-amber-50 border-amber-200' : 'bg-white border-gs-line'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-xl grid place-items-center ${
                              task.claimed ? 'bg-emerald-100 text-emerald-600' :
                              task.completed ? 'bg-amber-100 text-amber-600' :
                              'bg-gs-soft text-gs-muted'
                            }`}>
                              {task.claimed ? <CheckCircle className="w-4 h-4" /> : taskIcons[task.taskType] || <Target className="w-4 h-4" />}
                            </div>
                            <div>
                              <span className="block text-[10px] font-black text-gs-text">{task.title}</span>
                              <span className="block text-[8px] text-gs-muted">{task.description}</span>
                              <div className="flex items-center gap-1 mt-0.5">
                                <div className="w-16 h-1.5 rounded-full bg-gs-soft overflow-hidden">
                                  <div className={`h-full rounded-full transition-all duration-500 ${task.claimed ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${task.target > 0 ? (task.progress / task.target) * 100 : 0}%` }} />
                                </div>
                                <span className="text-[7px] font-bold text-gs-muted">{task.progress}/{task.target}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <b className="block text-[10px] font-black text-emerald-600">+{formatRupiah(task.reward)}</b>
                            {task.claimed ? (
                              <span className="text-[7px] font-bold text-emerald-600">Diklaim ✓</span>
                            ) : task.completed ? (
                              <button
                                onClick={() => handleClaimTask(task.id)}
                                disabled={taskClaimingId === task.id}
                                className="mt-1 h-6 px-3 rounded-lg bg-amber-500 text-white text-[8px] font-bold hover:bg-amber-600 transition-colors disabled:opacity-60"
                              >
                                {taskClaimingId === task.id ? (
                                  <div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                ) : 'Klaim'}
                              </button>
                            ) : (
                              <span className="text-[7px] font-bold text-gs-muted">Mulai</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Welcome Modal */}
      <AnimatePresence>
        {showWelcomeModal && user && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50" onClick={handleWelcomeClose} />
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} transition={{ type: 'spring', damping: 20 }} className="fixed z-50 inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[90vw] md:max-w-md bg-white rounded-3xl shadow-2xl overflow-y-auto custom-scrollbar">
              <div className="relative">
                {/* Green Header */}
                <div className="p-6 text-center text-white relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #022c22 0%, #064e3b 54%, #059669 100%)' }}>
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.04) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                  <div className="relative z-10">
                    <div className="w-16 h-16 rounded-full bg-white p-1.5 mx-auto mb-3 shadow-[0_8px_24px_rgba(0,0,0,.3)]">
                      <img src="/trendedge-logo.png" alt="TrendEdge" className="w-full h-full object-contain" />
                    </div>
                    <h2 className="text-lg font-black mb-1">Selamat Datang di TrendEdge</h2>
                    <p className="text-[9px] text-emerald-200 leading-relaxed max-w-[280px] mx-auto">
                      Platform investasi terpercaya dengan profit harian, portofolio cerdas, dan reward eksklusif untuk investor Indonesia.
                    </p>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  {/* Regulatory Badges */}
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 grid place-items-center">
                        <Shield className="w-5 h-5 text-emerald-600" />
                      </div>
                      <span className="text-[7px] font-bold text-gs-muted">OJK</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-10 h-10 rounded-xl bg-yellow-50 border border-yellow-200 grid place-items-center">
                        <CheckCircle className="w-5 h-5 text-yellow-600" />
                      </div>
                      <span className="text-[7px] font-bold text-gs-muted">Bappebti</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 grid place-items-center">
                        <Lock className="w-5 h-5 text-emerald-600" />
                      </div>
                      <span className="text-[7px] font-bold text-gs-muted">Aman</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <button
                    onClick={() => { handleWelcomeClose(); setActiveTab('investasi') }}
                    className="w-full h-11 rounded-xl text-white text-[11px] font-black tracking-wide hover:scale-[1.02] transition-transform mb-2"
                    style={{ background: 'linear-gradient(135deg, #064e3b 0%, #064e3b 50%, #059669 100%)' }}
                  >
                    Mulai Berinvestasi
                  </button>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button
                      onClick={handleWelcomeClose}
                      className="h-9 rounded-xl bg-gs-soft border border-gs-line text-gs-green3 text-[9px] font-bold hover:bg-emerald-50 transition-colors flex items-center justify-center gap-1"
                    >
                      <Headphones className="w-3.5 h-3.5" />Hubungi CS
                    </button>
                    <button
                      onClick={handleWelcomeClose}
                      className="h-9 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-700 text-[9px] font-bold hover:bg-yellow-100 transition-colors flex items-center justify-center gap-1"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />Gabung Channel
                    </button>
                  </div>

                  {/* Don't show checkbox */}
                  <label className="flex items-center gap-2 cursor-pointer justify-center">
                    <input type="checkbox" checked={welcomeDontShow} onChange={(e) => setWelcomeDontShow(e.target.checked)}
                      className="w-3.5 h-3.5 rounded accent-gs-green" />
                    <span className="text-[8px] font-semibold text-gs-muted">Jangan tampilkan selama 30 menit</span>
                  </label>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Investment Product Detail Modal */}
      <AnimatePresence>
        {showInvestDetailModal && selectedDetailProduct && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40" onClick={() => setShowInvestDetailModal(false)} />
            <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25 }} className="fixed z-50 bottom-0 left-0 right-0 md:inset-0 md:bottom-auto md:left-auto md:right-auto md:flex md:items-center md:justify-center max-h-[90vh] bg-white rounded-t-3xl md:rounded-3xl shadow-2xl overflow-y-auto custom-scrollbar md:w-[90vw] md:max-w-lg md:mx-auto md:my-auto">
              <div className="sticky top-0 bg-white p-4 border-b border-gs-line flex items-center justify-between rounded-t-3xl z-10">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-gs-green3" />
                  <span className="text-[12px] font-black text-gs-text">Detail Investasi</span>
                </div>
                <button onClick={() => setShowInvestDetailModal(false)} className="w-8 h-8 rounded-lg grid place-items-center hover:bg-gs-soft"><X className="w-4 h-4" /></button>
              </div>

              <div className="p-4">
                {/* Product Header */}
                <div className="rounded-2xl p-3 mb-4" style={{ background: 'linear-gradient(145deg, #022c22 0%, #064e3b 54%, #059669 100%)' }}>
                  <div className="text-white">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-5 h-5 text-yellow-300" />
                      <span className="text-[14px] font-black">{selectedDetailProduct.name}</span>
                    </div>
                    <span className="text-[8px] font-bold text-emerald-200">Aset Saham • {selectedDetailProduct.category === 'potential' ? 'Saham Potential' : 'Saham Dividen'}</span>
                  </div>
                </div>

                {/* Live Chart with Type & Timeframe Selectors */}
                {(() => {
                  const rawData = getInvestChartData(selectedDetailProduct)
                  const chartData = getDataForTimeframe(rawData, investTimeframe)
                  const movement = investMovement.get(selectedDetailProduct.id)
                  const isUp = movement ? movement.changePercent >= 0 : true
                  const chartColor = isUp ? '#059669' : '#ef4444'
                  const lastValue = chartData.length > 0 ? chartData[chartData.length - 1].value : selectedDetailProduct.modal
                  return (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          <BarChart3 className="w-3 h-3 text-gs-muted" />
                          <span className="text-[8px] font-bold text-gs-muted uppercase tracking-wider">PERGERAKAN MARKET</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[7px] font-black text-emerald-600">LIVE</span>
                        </div>
                      </div>
                      {/* Current Price Display */}
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xl font-black text-gs-text tabular-nums">{formatRupiah(lastValue)}</span>
                        <span className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${isUp ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                          {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {movement ? (isUp ? '+' : '') + movement.changePercent.toFixed(2) + '%' : '+0.00%'}
                        </span>
                      </div>
                      {/* Professional Dark Chart */}
                      <div className="rounded-xl overflow-hidden" style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {/* Chart Controls */}
                        <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: isUp ? '#34d399' : '#f87171' }} />
                            <span className="text-[7px] font-black" style={{ color: isUp ? '#34d399' : '#f87171' }}>LIVE</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center rounded-md p-0.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                              {(['candle', 'area', 'line', 'bar'] as const).map(ct => (
                                <button key={ct} onClick={() => setInvestChartType(ct)}
                                  className={`h-5 px-2 rounded text-[7px] font-bold transition-all duration-200 ${investChartType === ct ? '' : 'opacity-40 hover:opacity-70'}`}
                                  style={investChartType === ct ? { background: 'rgba(5,150,105,0.3)', color: '#34d399' } : { color: '#9ca3af' }}>
                                  {ct.charAt(0).toUpperCase() + ct.slice(1)}
                                </button>
                              ))}
                            </div>
                            <div className="flex items-center gap-0.5">
                              {(['1H', '1D', '1W', '1M', 'ALL'] as const).map(tf => (
                                <button key={tf} onClick={() => setInvestTimeframe(tf)}
                                  className={`h-5 px-1.5 rounded text-[7px] font-bold transition-all ${investTimeframe === tf ? '' : 'opacity-40 hover:opacity-70'}`}
                                  style={investTimeframe === tf ? { background: 'rgba(5,150,105,0.3)', color: '#34d399' } : { color: '#9ca3af' }}>
                                  {tf}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="h-px" style={{ background: isUp ? 'linear-gradient(90deg, transparent, rgba(52,211,153,0.2), transparent)' : 'linear-gradient(90deg, transparent, rgba(248,113,113,0.2), transparent)' }} />
                        <div className="h-56 px-2 py-2" style={{ background: '#0d1117' }}>
                        {chartData.length > 2 ? (() => {
                          const values = chartData.map(d => d.value)
                          const minV = Math.min(...values)
                          const maxV = Math.max(...values)
                          const rangeV = maxV - minV || 1
                          const domain: [number, number] = [Math.floor(minV - rangeV * 0.12), Math.ceil(maxV + rangeV * 0.12)]

                          // Candlestick
                          if (investChartType === 'candle') {
                            const candles = getCandleData(chartData)
                            if (candles.length < 2) return <div className="flex items-center justify-center h-full text-[10px] text-gs-muted">Data kurang...</div>
                            const allPrices = candles.flatMap(c => [c.high, c.low])
                            const minP = Math.min(...allPrices)
                            const maxP = Math.max(...allPrices)
                            const rangeP = maxP - minP || 1
                            const totalCandles = candles.length
                            const svgW = 400
                            const priceH = 196
                            const padding = { top: 10, bottom: 10, left: 6, right: 46 }
                            const drawW = svgW - padding.left - padding.right
                            const candleSpacing = drawW / totalCandles
                            const candleW = Math.max(6, Math.floor(candleSpacing * 0.6))
                            const priceToY = (p: number) => padding.top + ((maxP - p) / rangeP) * (priceH - padding.top - padding.bottom)
                            return (
                              <svg className="w-full h-full" viewBox={`0 0 ${svgW} ${priceH}`} preserveAspectRatio="xMidYMid meet">
                                {/* Grid — dashed horizontal + vertical */}
                                {[0, 1, 2, 3, 4].map(gi => {
                                  const y = padding.top + gi * ((priceH - padding.top - padding.bottom) / 4)
                                  return <line key={`gh${gi}`} x1={padding.left} y1={y} x2={svgW - padding.right} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" strokeDasharray="2,4" />
                                })}
                                {[0, 1, 2, 3, 4].map(gi => {
                                  const x = padding.left + gi * (drawW / 4)
                                  return <line key={`gv${gi}`} x1={x} y1={padding.top} x2={x} y2={priceH - padding.bottom} stroke="rgba(255,255,255,0.025)" strokeWidth="0.5" strokeDasharray="2,6" />
                                })}
                                {/* Price labels with pills */}
                                {[0, 1, 2, 3, 4].map(gi => {
                                  const price = maxP - (gi / 4) * rangeP
                                  const y = priceToY(price)
                                  return (
                                    <g key={`p${gi}`}>
                                      <rect x={svgW - padding.right + 2} y={y - 4} width={padding.right - 4} height="8" rx="2" fill="rgba(255,255,255,0.04)" />
                                      <text x={svgW - 2} y={y + 2.5} textAnchor="end" fill="rgba(255,255,255,0.25)" fontSize="5" fontFamily="monospace" fontWeight="500">{formatRupiah(Math.round(price)).replace('Rp', '').trim()}</text>
                                    </g>
                                  )
                                })}
                                {/* Current price line with pill */}
                                <line x1={padding.left} y1={priceToY(lastValue)} x2={svgW - padding.right} y2={priceToY(lastValue)} stroke={chartColor} strokeWidth="0.5" strokeDasharray="3,3" opacity="0.35" />
                                <rect x={svgW - padding.right + 1} y={priceToY(lastValue) - 5} width={padding.right - 2} height="10" rx="3" fill={chartColor} opacity="0.85" />
                                <text x={svgW - padding.right + 2 + (padding.right - 6) / 2} y={priceToY(lastValue) + 2.5} textAnchor="middle" fill="white" fontSize="5" fontFamily="monospace" fontWeight="700">{formatRupiah(lastValue).replace('Rp', '').trim()}</text>
                                {candles.map((c, i) => {
                                  const cx = padding.left + i * candleSpacing + candleSpacing / 2
                                  const x = cx - candleW / 2
                                  const yH = priceToY(c.high)
                                  const yL = priceToY(c.low)
                                  const yO = priceToY(c.open)
                                  const yC = priceToY(c.close)
                                  const isGreen = c.close >= c.open
                                  const bodyTop = Math.min(yO, yC)
                                  const bodyH = Math.max(Math.abs(yO - yC), 1.5)
                                  const isLast = i === totalCandles - 1
                                  const fillColor = isGreen ? '#22c55e' : '#ef4444'
                                  return (
                                    <g key={i} opacity={isLast ? 1 : 0.9}>
                                      <line x1={cx} y1={yH} x2={cx} y2={yL} stroke={fillColor} strokeWidth="0.8" opacity={isLast ? 1 : 0.7} />
                                      <rect x={x} y={bodyTop} width={candleW} height={bodyH} fill={fillColor} rx="1" />
                                      {isLast && (
                                        <>
                                          <circle cx={cx} cy={yC} r="2" fill={fillColor}>
                                            <animate attributeName="r" values="2;4;2" dur="1.5s" repeatCount="indefinite" />
                                            <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.5s" repeatCount="indefinite" />
                                          </circle>
                                          <circle cx={cx} cy={yC} r="1.5" fill={fillColor} />
                                        </>
                                      )}
                                    </g>
                                  )
                                })}
                              </svg>
                            )
                          }

                          // Bar chart
                          if (investChartType === 'bar') {
                            const barData = chartData.map((d, i) => ({
                              idx: d.idx,
                              value: d.value,
                              fill: i > 0 && d.value >= chartData[i - 1].value ? '#22c55e' : '#ef4444'
                            }))
                            return (
                              <ResponsiveContainer width="100%" height="100%">
                                <ReBarChart data={barData} margin={{ top: 5, right: 45, bottom: 0, left: 5 }}>
                                  <CartesianGrid strokeDasharray="1 3" stroke="rgba(255,255,255,0.03)" horizontal vertical={false} />
                                  <XAxis dataKey="idx" hide />
                                  <YAxis hide domain={domain} />
                                  <Bar dataKey="value" radius={[1, 1, 0, 0]} maxBarSize={10} isAnimationActive={true} animationDuration={800}
                                    shape={(props: Record<string, unknown>) => {
                                      const { x, y, width, height, fill: _fill } = props as { x: number; y: number; width: number; height: number; fill: string }
                                      return <rect x={x} y={y} width={Math.max(width, 1.5)} height={Math.max(height, 0.5)} fill={_fill} opacity={0.85} />
                                    }}>
                                    {barData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}
                                  </Bar>
                                  <YAxis yAxisId="price" orientation="right" domain={domain} tickFormatter={(v: number) => formatRupiah(v).replace('Rp', '').trim()} tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 8, fontFamily: 'monospace' }} axisLine={false} tickLine={false} width={42} />
                                </ReBarChart>
                              </ResponsiveContainer>
                            )
                          }

                          // Line chart
                          if (investChartType === 'line') {
                            return (
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 5, right: 45, bottom: 0, left: 5 }}>
                                  <CartesianGrid strokeDasharray="1 3" stroke="rgba(255,255,255,0.03)" horizontal vertical={false} />
                                  <XAxis dataKey="idx" hide />
                                  <YAxis hide domain={domain} />
                                  <ReferenceLine y={lastValue} stroke={chartColor} strokeDasharray="3 3" strokeOpacity={0.3} />
                                  <Line type="monotone" dataKey="value" stroke={chartColor} strokeWidth={1.5} dot={false}
                                    activeDot={{ r: 3, fill: chartColor, stroke: '#0d1117', strokeWidth: 1.5 }}
                                    isAnimationActive={true} animationDuration={800} />
                                  <YAxis yAxisId="price" orientation="right" domain={domain} tickFormatter={(v: number) => formatRupiah(v).replace('Rp', '').trim()} tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 8, fontFamily: 'monospace' }} axisLine={false} tickLine={false} width={42} />
                                </LineChart>
                              </ResponsiveContainer>
                            )
                          }

                          // Area chart (default)
                          return (
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={chartData} margin={{ top: 5, right: 45, bottom: 0, left: 5 }}>
                                <defs>
                                  <linearGradient id={`investDetailGrad-${selectedDetailProduct.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor={chartColor} stopOpacity="0.15" />
                                    <stop offset="50%" stopColor={chartColor} stopOpacity="0.06" />
                                    <stop offset="100%" stopColor={chartColor} stopOpacity="0.02" />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="1 3" stroke="rgba(255,255,255,0.03)" horizontal vertical={false} />
                                <XAxis dataKey="idx" hide />
                                <YAxis hide domain={domain} />
                                <ReferenceLine y={lastValue} stroke={chartColor} strokeDasharray="3 3" strokeOpacity={0.25} />
                                <Area type="monotone" dataKey="value" stroke={chartColor} fill={`url(#investDetailGrad-${selectedDetailProduct.id})`} strokeWidth={1.5}
                                  dot={(props: Record<string, unknown>) => {
                                    const { cx, cy, index } = props as { cx: number; cy: number; index: number }
                                    if (index !== chartData.length - 1) return <g key={String(index)} />
                                    return (
                                      <g key={`invest-detail-dot-${selectedDetailProduct.id}`}>
                                        <circle cx={cx} cy={cy} r={5} fill={chartColor} opacity={0.1}>
                                          <animate attributeName="r" values="5;9;5" dur="2s" repeatCount="indefinite" />
                                          <animate attributeName="opacity" values="0.1;0;0.1" dur="2s" repeatCount="indefinite" />
                                        </circle>
                                        <circle cx={cx} cy={cy} r={2.5} fill={chartColor} stroke="#0d1117" strokeWidth={1.5} />
                                      </g>
                                    )
                                  }}
                                  activeDot={{ r: 3, fill: chartColor, stroke: '#0d1117', strokeWidth: 1.5 }}
                                  isAnimationActive={true} animationDuration={800} />
                                <YAxis yAxisId="price" orientation="right" domain={domain} tickFormatter={(v: number) => formatRupiah(v).replace('Rp', '').trim()} tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 8, fontFamily: 'monospace' }} axisLine={false} tickLine={false} width={42} />
                              </AreaChart>
                            </ResponsiveContainer>
                          )
                        })() : (
                          <div className="flex items-center justify-center h-full text-[9px] text-gray-500">Memuat data market...</div>
                        )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1">
                          {isUp ? <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> : <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
                          <span className={`text-[10px] font-bold ${isUp ? 'text-emerald-600' : 'text-red-500'}`}>
                            Modal: {formatRupiah(selectedDetailProduct.modal)}
                          </span>
                        </div>
                        <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${isUp ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                          {formatRupiah(lastValue)}
                        </span>
                      </div>
                    </div>
                  )
                })()}

                {/* Full Financial Details */}
                <div className="space-y-2.5 mb-4">
                  <div className="flex items-center justify-between py-1.5 border-b border-gs-line">
                    <span className="text-[9px] font-bold text-gs-muted uppercase tracking-wider">JUMLAH MODAL</span>
                    <span className="text-[12px] font-black text-gs-text">{formatRupiah(selectedDetailProduct.modal)}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-gs-line">
                    <span className="text-[9px] font-bold text-gs-muted uppercase tracking-wider">PROFIT HARIAN</span>
                    <span className="text-[12px] font-black text-emerald-600">+{formatRupiah(selectedDetailProduct.dailyProfit)}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-gs-line">
                    <span className="text-[9px] font-bold text-gs-muted uppercase tracking-wider">DURASI</span>
                    <span className="text-[12px] font-black text-gs-text">{selectedDetailProduct.duration} Hari</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-gs-line">
                    <span className="text-[9px] font-bold text-gs-muted uppercase tracking-wider">TOTAL KEUNTUNGAN</span>
                    <div className="text-right">
                      <span className="text-[12px] font-black text-gs-green3">{formatRupiah(selectedDetailProduct.totalReturn)}</span>
                      <span className="ml-1 text-[8px] font-bold text-yellow-600 bg-yellow-50 px-1 rounded">ROI {selectedDetailProduct.roi}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-[9px] font-bold text-gs-muted uppercase tracking-wider">SALDO TERSEDIA</span>
                    <span className={`text-[12px] font-black ${(user?.balance || 0) >= selectedDetailProduct.modal ? 'text-gs-green3' : 'text-red-500'}`}>{formatRupiah(user?.balance || 0)}</span>
                  </div>
                </div>

                {/* Profit Distribution with AUTO toggle */}
                <div className="rounded-xl p-3 bg-gs-soft border border-gs-line mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gs-green" />
                      <span className="text-[9px] font-bold text-gs-green3">Pembagian Profit Setiap 24 jam</span>
                    </div>
                    <button
                      onClick={() => setInvestDetailAutoProfit(!investDetailAutoProfit)}
                      className={`h-6 px-3 rounded-full text-[7px] font-black transition-colors ${investDetailAutoProfit ? 'bg-gs-green3 text-white' : 'bg-gray-200 text-gs-muted'}`}
                    >
                      {investDetailAutoProfit ? 'AUTO' : 'MANUAL'}
                    </button>
                  </div>
                  <p className="text-[7px] text-gs-muted mt-1">
                    {investDetailAutoProfit
                      ? 'Profit akan otomatis dikreditkan ke saldo Anda setiap 24 jam.'
                      : 'Anda perlu mengklaim profit secara manual setiap hari.'}
                  </p>
                </div>

                {/* Balance Warning */}
                {(user?.balance || 0) < selectedDetailProduct.modal && (
                  <div className="rounded-xl p-2.5 bg-red-50 border border-red-200 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-[9px] font-bold text-red-600">Saldo tidak mencukupi. Silakan deposit terlebih dahulu.</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button onClick={() => setShowInvestDetailModal(false)} className="flex-1 h-11 rounded-xl bg-gs-soft border border-gs-line text-gs-muted text-[11px] font-bold hover:bg-gray-100 transition-colors">
                    Kembali
                  </button>
                  <button
                    onClick={() => {
                      setShowInvestDetailModal(false)
                      setSelectedProduct(selectedDetailProduct)
                      setShowInvestModal(true)
                    }}
                    disabled={(user?.balance || 0) < selectedDetailProduct.modal}
                    className="flex-1 h-11 rounded-xl text-white text-[11px] font-black disabled:opacity-70 hover:scale-[1.02] transition-transform"
                    style={{ background: 'linear-gradient(135deg, #064e3b 0%, #064e3b 50%, #059669 100%)' }}
                  >
                    Investasi Sekarang
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================
// MAIN EXPORT
// ============================================
export default function Home() {
  const { isLoggedIn } = useAuthStore()
  return isLoggedIn ? <Dashboard /> : <LoginPage />
}
