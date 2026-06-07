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
  Clock, AlertCircle, CheckCircle, XCircle, Info, ExternalLink, Share2,
  BookOpen, Award, Target, PieChart, Zap, Users, Menu,
  Phone, Lock, ChevronRight, Trophy, CalendarDays, Flame,
  MessageCircle, HelpCircle, LogIn, UserPlus, RotateCcw, DollarSign, Package, Sparkles,
  ListChecks, ClipboardList,
  Download, Gem, Building2, Headphones, ChevronLeft,
  Video, ThumbsUp, Eye as EyeIcon, Globe, Send,
  Sun, Moon, BellRing, Mail, MessageSquare
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, ReferenceLine,
  LineChart, Line, BarChart as ReBarChart, Bar, CartesianGrid
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
  id: string; title: string; description: string; imageUrl?: string; startDate: string; endDate: string; type: string; value?: number; isActive?: boolean;
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

interface CandleData {
  idx: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  time: string;
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

const PIE_COLORS = ['#2563eb', '#f59e0b', '#60a5fa', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899']

// ============================================
// ZEVORIX LOGO COMPONENT
// ============================================
function ZevorixLogo({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src="/zevorix-logo.png"
        alt="ZEVORIX"
        className="w-full h-full object-contain drop-shadow-[0_2px_8px_rgba(59,130,246,0.35)]"
      />
    </div>
  )
}

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
  const [accountType, setAccountType] = useState<'demo' | 'real'>('real')
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
      const body = isLogin ? { phone, password } : { name, phone, password, referralCode: refCode || undefined, accountType }
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      // If admin logs in on user page, store admin session and redirect to admin dashboard
      if (data.user?.role === 'admin') {
        localStorage.setItem('adminId', data.user.id)
        localStorage.setItem('adminToken', data.token)
        window.location.href = '/admin'
        return
      }
      login(data.user, data.token)
      toast({ title: isLogin ? 'Selamat Datang!' : 'Registrasi Berhasil!', description: `Halo, ${data.user.name}` })
    } catch (err: unknown) {
      toast({ title: 'Gagal', description: err instanceof Error ? err.message : 'Terjadi kesalahan', variant: 'destructive' })
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: 'linear-gradient(180deg, #eff6ff 0%, #dbeafe 50%, #bfdbfe 100%)' }}>
      {/* Desktop Left Branding Panel - hidden on mobile */}
      <div className="hidden md:flex md:w-1/2 lg:w-[55%] flex-col items-center justify-center p-8 lg:p-16 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #172554 0%, #1d4ed8 54%, #3b82f6 100%)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.04) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 text-center text-white max-w-lg">
          <div className="mx-auto mb-6">
            <ZevorixLogo size={80} />
          </div>
          <h1 className="text-3xl lg:text-4xl font-black mb-2 tracking-[0.15em]" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #93c5fd 50%, #60a5fa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', textShadow: '0 0 30px rgba(59,130,246,0.5)' }}>ZEVORIX</h1>
          <p className="text-blue-200/80 text-xs lg:text-sm mb-8 leading-relaxed tracking-widest uppercase font-medium">Future of Investing</p>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl p-4 bg-white/10 border border-white/15 text-center">
              <BarChart3 className="w-6 h-6 text-yellow-300 mx-auto mb-2" />
              <b className="block text-sm font-black">Market</b>
              <span className="block text-xs text-blue-200 font-bold">Live</span>
            </div>
            <div className="rounded-2xl p-4 bg-white/10 border border-white/15 text-center">
              <Users className="w-6 h-6 text-yellow-300 mx-auto mb-2" />
              <b className="block text-sm font-black">125K++</b>
              <span className="block text-xs text-blue-200 font-bold">Pengguna</span>
            </div>
            <div className="rounded-2xl p-4 bg-white/10 border border-white/15 text-center">
              <Shield className="w-6 h-6 text-yellow-300 mx-auto mb-2" />
              <b className="block text-sm font-black">Aman</b>
              <span className="block text-xs text-blue-200 font-bold">Terjamin</span>
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
              <ZevorixLogo size={36} />
              <div>
                <b className="block text-[11px] leading-tight font-black gradient-text tracking-wide">ZEVORIX</b>
                <span className="block text-[7px] font-bold text-[#3b82f6] uppercase tracking-[0.15em]">Pro Platform</span>
              </div>
            </div>
            <button
              onClick={() => { setIsLogin(!isLogin); refreshMath(); }}
              className="h-8 px-4 rounded-xl bg-[#1d4ed8] text-white text-[10px] font-bold hover:bg-[#3b82f6] transition-colors flex items-center gap-1"
            >
              {isLogin ? <><UserPlus className="w-3 h-3" />Daftar</> : <><LogIn className="w-3 h-3" />Masuk</>}
            </button>
          </header>

          {/* Desktop switch button */}
          <div className="hidden md:flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <ZevorixLogo size={36} />
              <div>
                <b className="block text-xs leading-tight font-black gradient-text tracking-wide">ZEVORIX</b>
                <span className="block text-[9px] font-bold text-[#3b82f6] uppercase tracking-[0.15em]">Pro Platform</span>
              </div>
            </div>
            <button
              onClick={() => { setIsLogin(!isLogin); refreshMath(); }}
              className="h-9 px-5 rounded-xl bg-[#1d4ed8] text-white text-xs font-bold hover:bg-[#3b82f6] transition-colors flex items-center gap-1.5"
            >
              {isLogin ? <><UserPlus className="w-3.5 h-3.5" />Daftar</> : <><LogIn className="w-3.5 h-3.5" />Masuk</>}
            </button>
          </div>

        {/* Main Card */}
        <div className="rounded-3xl bg-white shadow-xl overflow-hidden flex-1 md:flex-none flex flex-col">
          {/* Green Header Section */}
          <div className="relative overflow-hidden text-white" style={{ background: 'linear-gradient(145deg, #172554 0%, #1d4ed8 54%, #3b82f6 100%)' }}>
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
                    <span key={i} className={`flex items-center gap-1 text-[8px] font-bold ${item.up ? 'text-blue-300' : 'text-red-300'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${item.up ? 'bg-blue-400' : 'bg-red-400'}`} />
                      {item.code} {item.change}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Center Logo + Text */}
            <div className="relative z-10 flex flex-col items-center px-4 pt-2 pb-3">
              <div className="mb-2 mx-auto">
                <ZevorixLogo size={56} />
              </div>

              {isLogin ? (
                <>
                  <h1 className="text-[18px] font-black text-center leading-tight">Masuk Investor<br />ZEVORIX</h1>
                  <p className="max-w-[280px] mt-1.5 text-[9px] text-center font-medium text-blue-200 leading-relaxed">
                    Akses akun ZEVORIX untuk memantau portofolio, pergerakan saham, aktivitas profit, dan layanan Investor.
                  </p>
                </>
              ) : (
                <>
                  <div className="h-6 px-3 rounded-full bg-yellow-500/20 border border-yellow-400/30 flex items-center gap-1.5 mb-2">
                    <Shield className="w-3 h-3 text-yellow-300" />
                    <span className="text-[8px] font-black text-yellow-300 tracking-wide">REGISTRASI INVESTOR</span>
                  </div>
                  <h1 className="text-[18px] font-black text-center leading-tight">Daftar ZEVORIX</h1>
                  <p className="max-w-[280px] mt-1.5 text-[9px] text-center font-medium text-blue-200 leading-relaxed">
                    Buat akun investor untuk akses portofolio, produk aktif, dan program reward ZEVORIX.
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
                      <span className="block text-[7px] text-blue-200 font-bold">Live</span>
                    </div>
                    <div className="rounded-2xl p-2 bg-white/10 border border-white/15 text-center">
                      <Users className="w-4 h-4 text-yellow-300 mx-auto mb-0.5" />
                      <b className="block text-[8px] font-black">125K++</b>
                      <span className="block text-[7px] text-blue-200 font-bold">Pengguna</span>
                    </div>
                    <div className="rounded-2xl p-2 bg-white/10 border border-white/15 text-center">
                      <Briefcase className="w-4 h-4 text-yellow-300 mx-auto mb-0.5" />
                      <b className="block text-[8px] font-black">Portofolio</b>
                      <span className="block text-[7px] text-blue-200 font-bold">Akses</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-2xl p-2 bg-white/10 border border-white/15 text-center">
                      <Users className="w-4 h-4 text-yellow-300 mx-auto mb-0.5" />
                      <b className="block text-[8px] font-black">PENDUDUKA</b>
                      <span className="block text-[7px] text-blue-200 font-bold">125K++</span>
                    </div>
                    <div className="rounded-2xl p-2 bg-white/10 border border-white/15 text-center">
                      <TrendingUp className="w-4 h-4 text-yellow-300 mx-auto mb-0.5" />
                      <b className="block text-[8px] font-black">MARKET</b>
                      <span className="block text-[7px] text-blue-200 font-bold">+4.18%</span>
                    </div>
                    <div className="rounded-2xl p-2 bg-white/10 border border-white/15 text-center">
                      <CheckCircle className="w-4 h-4 text-yellow-300 mx-auto mb-0.5" />
                      <b className="block text-[8px] font-black">STATUS</b>
                      <span className="block text-[7px] text-blue-200 font-bold">OPEN</span>
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
              {/* Register: Account Type Selector */}
              {!isLogin && (
                <div>
                  <label className="flex items-center gap-1.5 mb-2 text-[9px] font-black text-[#3b82f6] uppercase tracking-widest">
                    <Shield className="w-3 h-3 text-[#3b82f6]" /> Tipe Akun
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setAccountType('real')}
                      className={`relative h-[68px] rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${accountType === 'real' ? 'border-[#3b82f6] bg-[#3b82f6]/10 shadow-md shadow-blue-500/10' : 'border-slate-200 bg-slate-50 hover:border-[#3b82f6]/30'}`}>
                      {accountType === 'real' && <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#3b82f6] grid place-items-center"><CheckCircle className="w-3 h-3 text-white" /></div>}
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#1d4ed8] to-[#3b82f6] grid place-items-center">
                        <DollarSign className="w-4 h-4 text-white" />
                      </div>
                      <span className={`text-[9px] font-black ${accountType === 'real' ? 'text-[#3b82f6]' : 'text-slate-600'}`}>AKUN REAL</span>
                      <span className="text-[7px] font-bold text-slate-400">Deposit & Withdraw</span>
                    </button>
                    <button type="button" onClick={() => setAccountType('demo')}
                      className={`relative h-[68px] rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${accountType === 'demo' ? 'border-amber-500 bg-amber-500/10 shadow-md shadow-amber-500/10' : 'border-slate-200 bg-slate-50 hover:border-amber-500/30'}`}>
                      {accountType === 'demo' && <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-amber-500 grid place-items-center"><CheckCircle className="w-3 h-3 text-white" /></div>}
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 grid place-items-center">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <span className={`text-[9px] font-black ${accountType === 'demo' ? 'text-amber-600' : 'text-slate-600'}`}>AKUN DEMO</span>
                      <span className="text-[7px] font-bold text-slate-400">Saldo Virtual</span>
                    </button>
                  </div>
                  {accountType === 'demo' && (
                    <div className="mt-2 rounded-xl p-2.5 bg-amber-50 border border-amber-200">
                      <div className="flex items-start gap-1.5">
                        <Info className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span className="text-[8px] font-bold text-amber-700 leading-relaxed">Akun demo mendapat saldo virtual Rp 100.000.000. Bisa request tambah saldo, namun <b>TIDAK BISA WITHDRAW</b>.</span>
                      </div>
                    </div>
                  )}
                  {accountType === 'real' && (
                    <div className="mt-2 rounded-xl p-2.5 bg-blue-50 border border-blue-200">
                      <div className="flex items-start gap-1.5">
                        <Shield className="w-3 h-3 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span className="text-[8px] font-bold text-blue-700 leading-relaxed">Akun real menggunakan uang asli. Saldo awal Rp 0. Deposit minimal Rp 100.000 via QRIS. Bisa withdraw kapan saja.</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Register: Username */}
              {!isLogin && (
                <div>
                  <label className="flex items-center gap-1.5 mb-1.5 text-[9px] font-black text-[#3b82f6] uppercase tracking-widest">
                    <User className="w-3 h-3 text-[#3b82f6]" /> Username
                  </label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Masukkan username"
                    className="w-full h-11 rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[13px] font-semibold text-slate-900 outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30 transition-all placeholder:text-gray-400" />
                </div>
              )}

              {/* NOMOR WHATSAPP */}
              <div>
                <label className="flex items-center gap-1.5 mb-1.5 text-[9px] font-black text-[#3b82f6] uppercase tracking-widest">
                  <Phone className="w-3 h-3 text-[#3b82f6]" /> NOMOR WHATSAPP
                </label>
                <div className="flex items-center h-11 rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden focus-within:border-[#3b82f6] focus-within:ring-1 focus-within:ring-[#3b82f6]/30 transition-all">
                  <div className="h-full px-3 flex items-center bg-[#1d4ed8] text-white border-r border-slate-200">
                    <span className="text-[11px] font-bold">+62</span>
                  </div>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="81234567890"
                    className="flex-1 h-full bg-transparent px-3 text-[13px] font-semibold text-slate-900 outline-none placeholder:text-gray-400" />
                </div>
              </div>

              {/* KATA SANDI */}
              <div>
                <label className="flex items-center gap-1.5 mb-1.5 text-[9px] font-black text-[#3b82f6] uppercase tracking-widest">
                  <Lock className="w-3 h-3 text-[#3b82f6]" /> KATA SANDI
                </label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Masukkan kata sandi"
                    className="w-full h-11 rounded-2xl bg-slate-50 border border-slate-200 px-4 pr-16 text-[13px] font-semibold text-slate-900 outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30 transition-all placeholder:text-gray-400" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-[#3b82f6] hover:text-[#1d4ed8] transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Register: Konfirmasi Sandi */}
              {!isLogin && (
                <div>
                  <label className="flex items-center gap-1.5 mb-1.5 text-[9px] font-black text-[#3b82f6] uppercase tracking-widest">
                    <Lock className="w-3 h-3 text-[#3b82f6]" /> KONFIRMASI SANDI
                  </label>
                  <div className="relative">
                    <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Konfirmasi kata sandi"
                      className="w-full h-11 rounded-2xl bg-slate-50 border border-slate-200 px-4 pr-16 text-[13px] font-semibold text-slate-900 outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30 transition-all placeholder:text-gray-400" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-[#3b82f6] hover:text-[#1d4ed8] transition-colors">
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Register: Kode Referral */}
              {!isLogin && (
                <div>
                  <label className="flex items-center gap-1.5 mb-1.5 text-[9px] font-black text-[#3b82f6] uppercase tracking-widest">
                    <Gift className="w-3 h-3 text-[#3b82f6]" /> KODE REFERRAL OPSIONAL
                  </label>
                  <input type="text" value={refCode} onChange={(e) => setRefCode(e.target.value.toUpperCase())} placeholder="Masukkan kode referral"
                    className="w-full h-11 rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[13px] font-semibold text-slate-900 outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30 transition-all placeholder:text-gray-400 uppercase" />
                </div>
              )}

              {/* Register: Math Verification */}
              {!isLogin && (
                <div>
                  <label className="flex items-center gap-1.5 mb-1.5 text-[9px] font-black text-[#3b82f6] uppercase tracking-widest">
                    <Shield className="w-3 h-3 text-[#3b82f6]" /> Verifikasi Keamanan
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="h-11 px-4 rounded-2xl bg-[#1d4ed8] text-white flex items-center gap-2">
                      <span className="text-[14px] font-black">{mathA} + {mathB}</span>
                    </div>
                    <input type="number" value={mathAnswer} onChange={(e) => setMathAnswer(e.target.value)} placeholder="Jawab"
                      className="w-20 h-11 rounded-2xl bg-slate-50 border border-slate-200 px-3 text-[13px] font-semibold text-slate-900 outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30 transition-all text-center placeholder:text-gray-400" />
                    <button type="button" onClick={refreshMath}
                      className="h-11 w-11 rounded-2xl bg-slate-50 border border-slate-200 grid place-items-center hover:bg-[#3b82f6] hover:text-white text-[#3b82f6] transition-colors">
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
                      className="w-4 h-4 rounded accent-[#3b82f6]" />
                    <span className="text-[10px] font-semibold text-slate-500">Ingat akun</span>
                  </label>
                  <button type="button" className="text-[10px] font-bold text-orange-500 hover:underline">Lupa sandi?</button>
                </div>
              )}

              {/* Register: Terms */}
              {!isLogin && (
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#3b82f6] mt-0.5" />
                  <span className="text-[9px] font-semibold text-slate-500 leading-relaxed">
                    Saya menyetujui proses pendaftaran dan memahami keamanan akun ZEVORIX.
                  </span>
                </label>
              )}

              {/* Submit Button */}
              <button type="submit" disabled={loading}
                className="w-full h-12 rounded-2xl overflow-hidden relative text-white text-[12px] font-black tracking-widest uppercase flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-70"
                style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)' }}>
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
              <p className="text-center text-[10px] font-semibold text-slate-500">
                {isLogin ? (
                  <>Belum punya akun? <span className="text-[#3b82f6] font-black cursor-pointer hover:underline" onClick={() => { setIsLogin(false); refreshMath(); }}>Daftar ZEVORIX</span></>
                ) : (
                  <>Sudah punya akun? <span className="text-[#3b82f6] font-black cursor-pointer hover:underline" onClick={() => setIsLogin(true)}>Masuk ZEVORIX</span></>
                )}
              </p>

              {/* Demo Account Quick Login */}
              {isLogin && (
              <div className="rounded-2xl p-3 bg-amber-50 border border-amber-200 flex items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <b className="block text-[10px] font-black text-amber-600">Coba Akun Demo</b>
                  </div>
                  <span className="block mt-0.5 text-[8px] font-bold text-amber-400">+62 81234567890 / demo123</span>
                </div>
                <button type="button" onClick={() => { setPhone('081234567890'); setPassword('demo123'); setIsLogin(true); }}
                  className="text-[8px] font-black text-white bg-amber-500 px-3 py-1.5 rounded-lg hover:bg-amber-600 transition-colors">
                  Gunakan
                </button>
              </div>
              )}
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-3 pb-2">
          <div className="text-center mb-2">
            <b className="block text-[9px] md:text-[10px] font-black text-[#1d4ed8]">Legalitas Perusahaan</b>
            <span className="block mt-0.5 text-[8px] md:text-[9px] font-semibold text-slate-500">Halaman resmi ZEVORIX</span>
          </div>
          <div className="flex items-center justify-center gap-3 mb-2">
            <Shield className="w-4 h-4 text-[#3b82f6]" />
            <CheckCircle className="w-4 h-4 text-amber-400" />
            <Lock className="w-4 h-4 text-[#3b82f6]" />
          </div>
          <div className="flex items-center justify-center gap-2 text-[8px] md:text-[9px] font-bold text-slate-500">
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
  const [depositStep, setDepositStep] = useState<'amount' | 'qris'>('amount')
  const [financeTab, setFinanceTab] = useState<'deposit' | 'withdraw'>('deposit')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawLoading, setWithdrawLoading] = useState(false)

  // ============ DEPOSIT REDESIGN STATE ============
  const [depositCategory, setDepositCategory] = useState<'qris'>('qris')
  const [qrisImageUrl, setQrisImageUrl] = useState<string | null>(null)

  // ============ WITHDRAW REDESIGN STATE ============
  const [withdrawCategory, setWithdrawCategory] = useState<'bank' | 'ewallet' | 'crypto'>('bank')
  const [withdrawBankMethod, setWithdrawBankMethod] = useState('BCA')
  const [withdrawEwalletMethod, setWithdrawEwalletMethod] = useState('GOPAY')
  const [withdrawCryptoMethod, setWithdrawCryptoMethod] = useState('USDT_TRC20')
  const [withdrawAccountNumber, setWithdrawAccountNumber] = useState('')
  const [withdrawAccountHolder, setWithdrawAccountHolder] = useState('')

  // ============ DEMO BALANCE REQUEST STATE ============
  const [demoRequestAmount, setDemoRequestAmount] = useState('')
  const [demoRequestLoading, setDemoRequestLoading] = useState(false)
  const isDemo = user?.accountType === 'demo'

  const [promoClaimLoadingId, setPromoClaimLoadingId] = useState<string | null>(null)

  // ============ PROMOSI & BONUS DASHBOARD STATE ============
  const [promoSubTab, setPromoSubTab] = useState<'daily' | 'promo' | 'video' | 'history'>('daily')
  const [promoPlatform, setPromoPlatform] = useState<'tiktok' | 'instagram' | 'youtube' | 'facebook' | 'twitter'>('tiktok')
  const [promoVideoLink, setPromoVideoLink] = useState('')
  const [promoVideos, setPromoVideos] = useState<{ id: string; platform: string; link: string; views: number; likes: number; bonus: number; status: 'pending' | 'verified' | 'rejected'; submittedAt: string }[]>([])
  const [promoSubmitLoading, setPromoSubmitLoading] = useState(false)
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
  const [investCategory, setInvestCategory] = useState<'starter' | 'growth' | 'premium'>('starter')
  const [showInvestModal, setShowInvestModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<InvestProduct | null>(null)
  const [investLoading, setInvestLoading] = useState(false)
  const [claimLoadingId, setClaimLoadingId] = useState<string | null>(null)
  const [investMovement, setInvestMovement] = useState<Map<string, {change: number; changePercent: number}>>(new Map())
  const [contractClaimLoadingId, setContractClaimLoadingId] = useState<string | null>(null)
  const initialized = useRef(false)

  // ============ BANNER CAROUSEL STATE ============
  const [bannerIndex, setBannerIndex] = useState(0)
  const bannerTimerRef = useRef<NodeJS.Timeout | null>(null)
  const bannerTouchStartX = useRef(0)
  const bannerTouchEndX = useRef(0)

  // ============ THEME STATE ============
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('zv-theme')
      return (saved === 'light' || saved === 'dark') ? saved : 'dark'
    }
    return 'dark'
  })
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    document.documentElement.className = newTheme
    localStorage.setItem('zv-theme', newTheme)
  }

  useEffect(() => {
    document.documentElement.className = theme
  }, [theme])

  // ============ BANNER AUTO-SCROLL ============
  useEffect(() => {
    const startTimer = () => {
      if (bannerTimerRef.current) clearInterval(bannerTimerRef.current)
      bannerTimerRef.current = setInterval(() => {
        setBannerIndex(prev => (prev + 1) % 5)
      }, 4000)
    }
    startTimer()
    return () => { if (bannerTimerRef.current) clearInterval(bannerTimerRef.current) }
  }, [])

  // ============ DAILY CHECK & TASKS STATE ============
  const [dailyCheckStatus, setDailyCheckStatus] = useState<DailyCheckStatus>({ streak: 0, lastCheckDate: null, canCheckToday: true, todayReward: 0 })
  const [dailyCheckLoading, setDailyCheckLoading] = useState(false)
  const [dailyCheckReward, setDailyCheckReward] = useState<number | null>(null)
  const [showDailyCheckModal, setShowDailyCheckModal] = useState(false)
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [tasksLoading, setTasksLoading] = useState(false)
  const [showTasksModal, setShowTasksModal] = useState(false)
  const [taskClaimingId, setTaskClaimingId] = useState<string | null>(null)

  // ============ EXTRA MODALS STATE ============
  const [showKycModal, setShowKycModal] = useState(false)
  const [kycForm, setKycForm] = useState({ fullName: '', idNumber: '', address: '', occupation: '', incomeRange: '' })
  const [kycKtpFile, setKycKtpFile] = useState<File | null>(null)
  const [kycSelfieFile, setKycSelfieFile] = useState<File | null>(null)
  const [kycBankFile, setKycBankFile] = useState<File | null>(null)
  const [kycAdditionalFile, setKycAdditionalFile] = useState<File | null>(null)
  const [kycSubmitting, setKycSubmitting] = useState(false)
  const [kycRecord, setKycRecord] = useState<any>(null)
  const [showVipModal, setShowVipModal] = useState(false)
  const [showCsModal, setShowCsModal] = useState(false)
  const [showAboutModal, setShowAboutModal] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [showPromoDetailModal, setShowPromoDetailModal] = useState(false)
  const [selectedPromo, setSelectedPromo] = useState<PromoItem | null>(null)
  const [promoNotified, setPromoNotified] = useState<Set<string>>(new Set())

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
    status: 'active' | 'won' | 'lost'; leverage: number; closedPL?: number;
    fee: number; workingCapital: number;
  }[]>([])
  const [sinyalDirection, setSinyalDirection] = useState<'NAIK' | 'TURUN'>('NAIK')
  const [sinyalAmount, setSinyalAmount] = useState('')
  const [sinyalLeverage, setSinyalLeverage] = useState<number>(1000)
  const [showConfirmTrade, setShowConfirmTrade] = useState(false)
  const [confirmTradeDir, setConfirmTradeDir] = useState<'NAIK' | 'TURUN'>('NAIK')
  const [sinyalCategory, setSinyalCategory] = useState<string>('popular')
  const [marketSignalTab, setMarketSignalTab] = useState<string>('favorit')
  const [marketFavFilter, setMarketFavFilter] = useState<string>('semua')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [marketSearchQuery, setMarketSearchQuery] = useState<string>('')
  const [sinyalHistoryFilter, setSinyalHistoryFilter] = useState<string>('Semua')
  const [selectedSinyalStock, setSelectedSinyalStock] = useState<Stock | null>(null)
  const [sinyalResults, setSinyalResults] = useState<{id: string; won: boolean; profit: number; stockCode: string; direction: 'NAIK' | 'TURUN'; amount: number; shownAt?: number}[]>([])
  // Track remaining time per position
  const [sinyalTimers, setSinyalTimers] = useState<Record<string, number>>({})
  const [aiSignalExpanded, setAiSignalExpanded] = useState(true)
  const [sinyalView, setSinyalView] = useState<'trading' | 'ai-pro'>('trading')
  const [aiProUnlocked, setAiProUnlocked] = useState(false)

  // Sinyal Pro live candlestick chart
  const [sinyalCandles, setSinyalCandles] = useState<CandleData[]>([])
  const [sinyalCurrentPrice, setSinyalCurrentPrice] = useState(0)
  const [sinyalChartTick, setSinyalChartTick] = useState(0)
  const [sinyalCrosshair, setSinyalCrosshair] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  // Timeframe: each candle duration = trade duration
  const [sinyalTimeframe, setSinyalTimeframe] = useState<'1m' | '2m' | '5m' | '10m' | '15m' | '30m' | '1h'>('1m')
  const sinyalTimeframeSeconds: Record<string, number> = { '1m': 60, '2m': 120, '5m': 300, '10m': 600, '15m': 900, '30m': 1800, '1h': 3600 }
  // Trade duration = candle timeframe
  const sinyalDuration = sinyalTimeframeSeconds[sinyalTimeframe] || 60
  // Chart panning: how many candles to offset from the latest
  const [sinyalChartOffset, setSinyalChartOffset] = useState(0)
  const sinyalChartOffsetRef = useRef(0)
  useEffect(() => { sinyalChartOffsetRef.current = sinyalChartOffset }, [sinyalChartOffset])
  // Chart zoom: number of visible candles (lower = more zoomed in)
  const [sinyalChartZoom, setSinyalChartZoom] = useState(40)
  const sinyalChartZoomRef = useRef(40)
  useEffect(() => { sinyalChartZoomRef.current = sinyalChartZoom }, [sinyalChartZoom])
  // Drag state for panning
  const sinyalDragRef = useRef<{ startX: number; startOffset: number; dragging: boolean }>({ startX: 0, startOffset: 0, dragging: false })
  const sinyalPinchRef = useRef<{ startDist: number; startZoom: number } | null>(null)
  const sinyalChartSimRef = useRef<{
    price: number; basePrice: number; momentum: number; trend: number;
    phase: number; phaseLen: number; vol: number;
    currentCandle: { open: number; high: number; low: number; close: number; volume: number; tickCount: number; maxTicks: number };
  } | null>(null)
  const sinyalPositionsRef = useRef(sinyalPositions)
  useEffect(() => { sinyalPositionsRef.current = sinyalPositions }, [sinyalPositions])

  // Track cumulative P&L offset from closed trades (client-side trades aren't on server)
  // When a trade closes, the net P&L (returnAmount - original investment) is added here
  // This offset is applied on top of the server balance so portfolio fetch doesn't overwrite
  const tradingPLOffsetRef = useRef(0)

  // Auto-select first stock when entering sinyal tab
  useEffect(() => {
    if (activeTab === 'sinyal' && !selectedSinyalStock && stocks.length > 0) {
      setSelectedSinyalStock(stocks[0])
    }
  }, [activeTab, selectedSinyalStock, stocks])

  // ============ LIVE INVESTMENT CHART DATA (CandleData) ============
  const [investChartData, setInvestChartData] = useState<Map<string, CandleData[]>>(new Map())
  const investChartSimRef = useRef<Map<string, {lastClose: number; baseVal: number; momentum: number; trend: number; phase: number; phaseLen: number; vol: number; initialized: boolean}>>(new Map())
  const investChartTickRef = useRef(0)

  // Generate a single realistic OHLC candle from previous close
  const generateCandle = useCallback((prevClose: number, baseVal: number, sim: {momentum: number; trend: number; phase: number; phaseLen: number; vol: number}, idx: number): CandleData => {
    // Phase management: trending, consolidation, breakout
    sim.phaseLen -= 1
    if (sim.phaseLen <= 0) {
      sim.phase = Math.random() < 0.3 ? 0 : Math.random() < 0.6 ? 1 : 2 // 0=consolidate, 1=trend, 2=breakout
      sim.phaseLen = sim.phase === 0 ? Math.floor(5 + Math.random() * 10) : sim.phase === 1 ? Math.floor(4 + Math.random() * 8) : Math.floor(2 + Math.random() * 3)
      if (sim.phase === 1) sim.trend = Math.random() > 0.5 ? 1 : -1
    }

    const volatility = baseVal * (sim.phase === 0 ? 0.002 : sim.phase === 1 ? 0.004 : 0.008)
    const drift = sim.phase === 1 ? sim.trend * baseVal * 0.002 : sim.phase === 2 ? (Math.random() > 0.5 ? 1 : -1) * baseVal * 0.005 : 0

    sim.momentum = sim.momentum * 0.4 + drift + (Math.random() - 0.5) * volatility * 2
    const meanRevert = (baseVal - prevClose) * 0.004

    const open = prevClose
    const rawClose = prevClose + sim.momentum + meanRevert
    const close = Math.round(Math.max(baseVal * 0.9, Math.min(baseVal * 1.1, rawClose)))
    const bodySize = Math.abs(close - open)
    const maxWick = Math.max(bodySize * 0.5, baseVal * 0.001)

    // Determine pattern type
    const patternRoll = Math.random()
    let high: number, low: number

    if (patternRoll < 0.08 && bodySize < baseVal * 0.0005) {
      // Doji: open ≈ close, small wicks
      high = Math.max(open, close) + Math.round(Math.random() * maxWick * 2)
      low = Math.min(open, close) - Math.round(Math.random() * maxWick * 2)
    } else if (patternRoll < 0.14 && close > open) {
      // Hammer: long lower wick, small body at top
      high = Math.max(open, close) + Math.round(Math.random() * maxWick * 0.5)
      low = Math.min(open, close) - Math.round(maxWick * (2 + Math.random() * 3))
    } else if (patternRoll < 0.20 && close < open) {
      // Shooting star: long upper wick, small body at bottom
      high = Math.max(open, close) + Math.round(maxWick * (2 + Math.random() * 3))
      low = Math.min(open, close) - Math.round(Math.random() * maxWick * 0.5)
    } else {
      // Normal candle
      high = Math.max(open, close) + Math.round(Math.random() * maxWick * 1.5 + baseVal * 0.0005)
      low = Math.min(open, close) - Math.round(Math.random() * maxWick * 1.5 + baseVal * 0.0005)
    }

    // Ensure high >= max(open,close) and low <= min(open,close)
    high = Math.max(high, Math.max(open, close))
    low = Math.min(low, Math.min(open, close))

    // Volume correlates with candle size
    const baseVol = sim.vol
    const volMultiplier = sim.phase === 2 ? 2.5 : sim.phase === 1 ? 1.3 : 0.8
    const bodyRatio = bodySize / baseVal
    const volume = Math.round(baseVol * volMultiplier * (0.6 + Math.random() * 0.8 + bodyRatio * 20))

    const now = new Date()
    now.setMinutes(now.getMinutes() - (40 - idx))
    const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0')

    return { idx, open, high, low, close, volume, time }
  }, [])

  // Helper: get data based on timeframe
  const getDataForTimeframe = useCallback((data: CandleData[], tf: string) => {
    if (data.length === 0) return data
    switch (tf) {
      case '1H': return data.slice(-10)
      case '1D': return data.slice(-25)
      case '1W': return data.slice(-40)
      case '1M': return data
      case 'ALL': return data
      default: return data
    }
  }, [])

  // Compute MA line values for candle data
  const computeMA = useCallback((data: CandleData[], period: number): (number | null)[] => {
    return data.map((_, i) => {
      if (i < period - 1) return null
      let sum = 0
      for (let j = i - period + 1; j <= i; j++) sum += data[j].close
      return sum / period
    })
  }, [])

  // Initialize investment candle chart data when products load
  useEffect(() => {
    if (investProducts.length === 0) return
    setInvestChartData(prev => {
      const next = new Map(prev)
      let changed = false
      investProducts.forEach(p => {
        if (investChartSimRef.current.has(p.id)) return
        changed = true
        const baseVal = p.modal
        const baseVol = Math.round(50000 + Math.random() * 150000)
        const sim = { lastClose: baseVal, baseVal, momentum: 0, trend: 0, phase: 1, phaseLen: 5, vol: baseVol, initialized: true }
        const candles: CandleData[] = []
        let prevClose = Math.round(baseVal * (0.97 + Math.random() * 0.06))
        for (let i = 0; i < 40; i++) {
          const candle = generateCandle(prevClose, baseVal, sim, i)
          candles.push(candle)
          prevClose = candle.close
          sim.lastClose = candle.close
        }
        // Ensure last candle ends near baseVal
        const lastCandle = candles[candles.length - 1]
        const diff = baseVal - lastCandle.close
        if (candles.length > 0) {
          const adjust = Math.round(diff * 0.7)
          candles[candles.length - 1] = {
            ...lastCandle,
            close: lastCandle.close + adjust,
            high: Math.max(lastCandle.high, lastCandle.close + adjust),
          }
        }
        next.set(p.id, candles)
        investChartSimRef.current.set(p.id, { lastClose: candles[candles.length - 1].close, baseVal, momentum: sim.momentum, trend: sim.trend, phase: sim.phase, phaseLen: sim.phaseLen, vol: baseVol, initialized: true })
      })
      return changed ? next : prev
    })
  }, [investProducts, generateCandle])

  // Live investment chart update — every 3 seconds, add a new candle
  useEffect(() => {
    const interval = setInterval(() => {
      const simMap = investChartSimRef.current
      if (simMap.size === 0) return
      investChartTickRef.current += 1

      simMap.forEach((sim, productId) => {
        setInvestChartData(prev => {
          const existing = prev.get(productId)
          if (!existing || existing.length === 0) return prev
          const prevClose = existing[existing.length - 1].close
          const newIdx = existing[existing.length - 1].idx + 1
          const candle = generateCandle(prevClose, sim.baseVal, sim, newIdx)
          sim.lastClose = candle.close

          const next = [...existing, candle]
          const trimmed = next.length > 60 ? next.slice(-60) : next
          const nextMap = new Map(prev)
          nextMap.set(productId, trimmed)
          return nextMap
        })
      })

      // Also update investMovement
      setInvestMovement(prev => {
        const next = new Map(prev)
        simMap.forEach((sim, productId) => {
          const changePercent = ((sim.lastClose - sim.baseVal) / sim.baseVal) * 100
          next.set(productId, { change: Math.round(sim.lastClose - sim.baseVal), changePercent: parseFloat(changePercent.toFixed(2)) })
        })
        return next
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [generateCandle])


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

    // Generate historical data with VISIBLE up/down zigzag
    const pts: {idx: number; value: number}[] = []
    let val = baseVal * (1 + (isUp ? -0.005 : 0.005))
    let momentum = 0

    for (let i = 0; i < 50; i++) {
      // Each tick: 50% chance to flip direction — creates natural zigzag
      const dir = Math.random() > 0.5 ? 1 : -1
      // Adaptive step: ensures ±1 visible change
      const minStep = Math.max(1, baseVal * 0.0005)
      const stepSize = minStep * (0.8 + Math.random() * 1.2)
      // Overall bias toward the final value
      const bias = (isUp ? 1 : -1) * baseVal * 0.00005
      // Combine: momentum carries, new direction adds, bias drifts toward target
      momentum = momentum * 0.25 + dir * stepSize + bias
      val += momentum
      // Light mean reversion — pulls toward baseVal
      val += (baseVal - val) * 0.005
      pts.push({ idx: i, value: Math.round(val) })
    }
    // End at actual value
    pts.push({ idx: 50, value: baseVal })
    setIhsgChartData(pts)
    ihsgChartRef.current = { val: baseVal, baseVal, initialized: true }
  }, [indices])

  // IHSG live update interval — runs independently, never stops
  useEffect(() => {
    let ihsgMomentum = 0
    const interval = setInterval(() => {
      const ref = ihsgChartRef.current
      if (!ref.initialized) return
      // Each tick: 50% chance to go up or down — natural zigzag
      const dir = Math.random() > 0.5 ? 1 : -1
      const stepSize = ref.baseVal * (0.0004 + Math.random() * 0.001)
      ihsgMomentum = ihsgMomentum * 0.25 + dir * stepSize
      ref.val += ihsgMomentum
      // Light mean reversion — keeps price near baseVal
      ref.val += (ref.baseVal - ref.val) * 0.004

      setIhsgChartData(prev => {
        if (prev.length === 0) return prev
        const nextIdx = prev[prev.length - 1].idx + 1
        const next = [...prev, { idx: nextIdx, value: Math.round(ref.val) }]
        return next.length > 60 ? next.slice(-60) : next
      })
    }, 2500)
    return () => clearInterval(interval)
  }, []) // empty deps = runs once, never restarts

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

  // ============ SVG INSTRUMENT LOGO GENERATOR ============
  const getInstrumentLogo = useCallback((code: string, size: number = 40) => {
    const specialColors: Record<string, [string, string]> = {
      // Crypto
      'BTC': ['#f7931a', '#e88a17'], 'ETH': ['#627eea', '#4c6edb'], 'XRP': ['#00aae4', '#0099cc'],
      'SOL': ['#9945ff', '#14f195'], 'DOGE': ['#c3a634', '#ba9e2d'], 'ADA': ['#0033ad', '#002d99'],
      'AVAX': ['#e84142', '#d13a3b'], 'DOT': ['#e6007a', '#cc006b'], 'LINK': ['#2a5ada', '#2450c2'],
      'MATIC': ['#8247e5', '#703cc9'], 'BCH': ['#0ac18e', '#09ad7e'], 'LTC': ['#bfbbbb', '#a8a5a5'],
      'XLM': ['#14b6e7', '#11a0cc'], 'UNI': ['#ff007a', '#e6006e'], 'AAVE': ['#b6509e', '#9e448c'],
      'SHIB': ['#ffa409', '#e69408'], 'ATOM': ['#2e3148', '#262a3d'], 'FIL': ['#0090ff', '#0080e6'],
      'NEAR': ['#00c1de', '#00abc5'], 'ALGO': ['#000000', '#1a1a1a'], 'VET': ['#15bdff', '#12a8e6'],
      'SAND': ['#04adef', '#039ad6'], 'MANA': ['#ff2d55', '#e6284d'], 'AXS': ['#0055d5', '#004cba'],
      'THETA': ['#2ab8e6', '#25a5cf'], 'APT': ['#2dd8a3', '#26c292'], 'ARB': ['#28a0f0', '#2390d6'],
      'OP': ['#ff0420', '#e6031d'], 'IMX': ['#00c3ff', '#00b0e6'], 'INJ': ['#00f2fe', '#00dbe6'],
      'TIA': ['#7b2bf9', '#6c27e0'], 'SEI': ['#9b1c1e', '#8a1819'], 'SUI': ['#6fbcf0', '#5fa8da'],
      'PEPE': ['#479F45', '#3d8a3b'], 'FTM': ['#1969ff', '#145ce6'], 'GRT': ['#6747ed', '#5a3dd4'],
      'ENS': ['#5298ff', '#4788e6'], 'LDO': ['#00a3ff', '#0092e6'], 'RPL': ['#ff6e4a', '#e66242'],
      'STX': ['#2d2d2d', '#1a1a1a'],
      // Commodities
      'GOLD': ['#ffd700', '#daa520'], 'SILVER': ['#c0c0c0', '#a0a0a0'], 'OIL': ['#2d2d2d', '#1a1a1a'],
      'NATGAS': ['#4a90d9', '#3d7cc2'], 'COPPER': ['#b87333', '#a0652d'], 'PLATINUM': ['#e5e4e2', '#c8c7c5'],
      'PALLADIUM': ['#ced0dd', '#b5b7c4'], 'WHEAT': ['#f5deb3', '#dcc89d'], 'CORN': ['#f4c430', '#dab22b'],
      'SOYBEANS': ['#8db255', '#7d9f4c'], 'SUGAR': ['#f8f8f8', '#dcdcdc'], 'COFFEE': ['#6f4e37', '#5e422e'],
      'COTTON': ['#f0f0f0', '#d4d4d4'], 'LUMBER': ['#deb887', '#c5a476'], 'RICE': ['#f5f5dc', '#d9d9c4'],
      'CACAO': ['#5c3317', '#4d2b14'], 'RUBBER': ['#333333', '#1a1a1a'], 'IRON': ['#8b8b8b', '#747474'],
      // Forex
      'EURUSD': ['#003399', '#002d88'], 'GBPUSD': ['#012169', '#011d5c'], 'USDJPY': ['#bc002d', '#a60027'],
      'AUDUSD': ['#00008b', '#00007a'], 'USDCAD': ['#ff0000', '#e60000'], 'NZDUSD': ['#000000', '#1a1a1a'],
      'USDCHF': ['#ff0000', '#e60000'], 'EURGBP': ['#003399', '#002d88'], 'EURJPY': ['#003399', '#002d88'],
      'GBPJPY': ['#012169', '#011d5c'], 'AUDJPY': ['#00008b', '#00007a'], 'EURAUD': ['#003399', '#002d88'],
      'GBPAUD': ['#012169', '#011d5c'], 'EURNZD': ['#003399', '#002d88'], 'GBPCAD': ['#012169', '#011d5c'],
      'USDSGD': ['#cc0000', '#b30000'], 'USDHKD': ['#cc0000', '#b30000'], 'USDSEK': ['#006aa7', '#005c93'],
      'USDNOK': ['#ba0c2f', '#a50a29'], 'USDDKK': ['#c8102e', '#b30e28'], 'USDZAR': ['#007749', '#006640'],
      'USDTRY': ['#e30a17', '#cc0915'], 'USDMXN': ['#006341', '#005538'], 'USDPLN': ['#dc143c', '#c61236'],
      'EURCHF': ['#003399', '#002d88'],
      // Tech / Bluechip
      'AAPL': ['#555555', '#444444'], 'NVDA': ['#76b900', '#67a000'], 'MSFT': ['#00a4ef', '#0093d6'],
      'GOOGL': ['#4285f4', '#3676d6'], 'META': ['#1877f2', '#1569d8'], 'AMZN': ['#ff9900', '#e68a00'],
      'TSLA': ['#cc0000', '#b30000'], 'AMD': ['#ed1c24', '#d4191f'], 'JPM': ['#003087', '#002b78'],
      'V': ['#1a1f71', '#151a63'], 'MA': ['#ff5f00', '#e65500'],
      // Banking
      'GS': ['#7b9abb', '#6a89a8'], 'BAC': ['#012169', '#011d5c'], 'PGR': ['#0072ce', '#0065b5'],
      // Healthcare
      'UNH': ['#002677', '#001f63'], 'JNJ': ['#d51900', '#bf1700'], 'PFE': ['#0063b2', '#005699'],
      'LLY': ['#d52b1e', '#bf261a'], 'ABBV': ['#071d49', '#061840'], 'MRK': ['#00857c', '#00746c'],
      'ABT': ['#009cde', '#008ac5'], 'TMO': ['#ee3124', '#d62c20'], 'DHR': ['#004b87', '#004075'],
      'ISRG': ['#00573f', '#004b36'], 'SYK': ['#5a2d82', '#4e2772'], 'BSX': ['#00854a', '#007440'],
      'EW': ['#e31837', '#cc1532'], 'GILD': ['#c41230', '#af102b'], 'AMGN': ['#0064b4', '#005799'],
      'BIIB': ['#1a3c6e', '#153360'], 'REGN': ['#c8102e', '#b30e28'], 'MRNA': ['#05204a', '#041b3f'],
      'VRTX': ['#6236a5', '#562e92'], 'CVS': ['#cc0000', '#b30000'], 'CI': ['#003c71', '#003462'],
      'HUM': ['#00539b', '#004887'], 'CNC': ['#005eb8', '#0052a0'],
      // Consumer
      'WMT': ['#0071ce', '#0064b5'], 'COST': ['#e31837', '#cc1532'], 'NKE': ['#f56565', '#e05555'],
      'MCD': ['#ffc72c', '#e6b427'], 'KO': ['#f40009', '#da0008'], 'SBUX': ['#006241', '#005538'],
      'PEP': ['#004b93', '#004080'], 'PG': ['#003DA5', '#003590'], 'CL': ['#d4002a', '#bf0026'],
      'EL': ['#0b2265', '#091d57'], 'PM': ['#003057', '#002a4e'], 'MO': ['#003057', '#002a4e'],
      'SPG': ['#c8102e', '#b30e28'], 'PLD': ['#003da5', '#003590'], 'AMT': ['#e31837', '#cc1532'],
      'EQIX': ['#ed1c24', '#d4191f'], 'O': ['#003da5', '#003590'],
      // Energy
      'XOM': ['#ed1c24', '#d4191f'], 'CVX': ['#0055a5', '#004c93'], 'COP': ['#c8102e', '#b30e28'],
      'SLB': ['#005cb9', '#0051a2'], 'FANG': ['#2e4a2e', '#264026'], 'MPC': ['#00539b', '#004887'],
      'PSX': ['#0d2344', '#0b1d3a'], 'OXY': ['#c8102e', '#b30e28'], 'EOG': ['#006241', '#005538'],
      // Infrastructure / Defense
      'CAT': ['#ffcd11', '#e6b810'], 'BA': ['#0033a0', '#002d8f'], 'GE': ['#3b73b9', '#3366a3'],
      'HON': ['#e31e26', '#cc1b22'], 'DE': ['#367c2b', '#2e6c24'], 'LMT': ['#0033a0', '#002d8f'],
      'NOC': ['#0033a0', '#002d8f'], 'RTX': ['#0033a0', '#002d8f'], 'GD': ['#0033a0', '#002d8f'],
      // Media
      'DIS': ['#113ccf', '#0f35b8'], 'NFLX': ['#e50914', '#cc0812'], 'CMCSA': ['#0c0c0c', '#1a1a1a'],
      // Tech / Growth
      'COIN': ['#0052ff', '#0049e6'], 'SQ': ['#006aff', '#005fe6'], 'PYPL': ['#003087', '#002b78'],
      'AVGO': ['#cc092f', '#b6082a'], 'INTC': ['#0071c5', '#0065ae'], 'TSM': ['#c41230', '#af102b'],
      'CRM': ['#00a1e0', '#0090c7'], 'ORCL': ['#f80000', '#df0000'], 'ADBE': ['#ff0000', '#e60000'],
      'IBM': ['#054ada', '#0442c2'], 'NOW': ['#81b5a1', '#73a291'], 'UBER': ['#000000', '#1a1a1a'],
      'SNAP': ['#fffc00', '#e6e300'], 'PINS': ['#e60023', '#cc001f'], 'RIVN': ['#f5f5f5', '#dcdcdc'],
      'LCID': ['#f5a623', '#db951f'], 'NIO': ['#00bfff', '#00ace6'], 'PLTR': ['#101010', '#1a1a1a'],
      'DKNG': ['#53d769', '#4ac15e'], 'RBLX': ['#e2231a', '#cb1f17'], 'SHOP': ['#96bf48', '#84a83f'],
      'SE': ['#e8333a', '#d02e34'], 'GRAB': ['#00b14f', '#009d45'], 'HOOD': ['#00c805', '#00b405'],
      'ROKU': ['#6d1be1', '#6118ca'], 'ZM': ['#2d8cff', '#267de6'], 'TEAM': ['#0052cc', '#0049b8'],
      // Cybersecurity / Software
      'CRWD': ['#e8243c', '#d02036'], 'PANW': ['#fa582d', '#e14f28'], 'MNDY': ['#ff3d57', '#e6364f'],
      'DDOG': ['#632ca6', '#572795'], 'NET': ['#f38020', '#da731d'], 'MDB': ['#00ed64', '#00d55a'],
      'HUBS': ['#ff7a59', '#e66e4f'], 'TWLO': ['#f22f46', '#da2a3f'], 'OKTA': ['#007dc1', '#006eab'],
      'ZS': ['#0078ff', '#006ce6'], 'PATH': ['#fa1e3c', '#e11b36'], 'AI': ['#c41230', '#af102b'],
      'SOUN': ['#00b4d8', '#00a1c1'],
      // Additional Financials
      'SCHW': ['#003057', '#002a4e'], 'BLK': ['#000000', '#1a1a1a'],
      'AXP': ['#006fcf', '#0062b8'], 'C': ['#003b70', '#003362'], 'WFC': ['#d71e28', '#c21a24'],
      'MS': ['#002395', '#001f82'], 'AXPO': ['#e31837', '#cc1532'],
      // Additional Real Estate / REITs
      'PSA': ['#e31837', '#cc1532'], 'CCI': ['#003da5', '#003590'], 'DLR': ['#003399', '#002d88'],
      'VICI': ['#003057', '#002a4e'],
      // Additional Media
      'WBD': ['#0057b8', '#004da0'], 'PARA': ['#0057b8', '#004da0'], 'FOX': ['#0c2340', '#0a1d36'],
      // Telecom
      'T': ['#009fdb', '#008ec2'], 'VZ': ['#cd040b', '#b6030a'], 'TMUS': ['#e20074', '#cb0068'],
      // Retail / Home
      'TGT': ['#cc0000', '#b30000'], 'LOW': ['#004990', '#004080'], 'HD': ['#f96302', '#e05a02'],
      'DLTR': ['#1f9f43', '#1a8c3b'], 'TJX': ['#c8102e', '#b30e28'],
      // Transportation
      'UPS': ['#351c15', '#2d1712'], 'FDX': ['#4d148c', '#421278'], 'DAL': ['#003366', '#002b57'],
      // Berkshire
      'BRK.B': ['#7b2d26', '#6c2822'],
    }
    // Emoji prefix map for special instrument types
    const emojiMap: Record<string, string> = {
      'BTC': '₿', 'ETH': 'Ξ', 'XRP': '✕', 'SOL': '◎', 'DOGE': 'Ð',
      'GOLD': '🥇', 'SILVER': '🥈', 'OIL': '🛢️', 'NATGAS': '🔥', 'COPPER': '🔶',
      'PLATINUM': '💍', 'PALLADIUM': '💎', 'WHEAT': '🌾', 'CORN': '🌽',
      'SOYBEANS': '🫘', 'SUGAR': '🍬', 'COFFEE': '☕', 'COTTON': '🧵', 'LUMBER': '🪵', 'RICE': '🍚',
      'EURUSD': '🇪🇺', 'GBPUSD': '🇬🇧', 'USDJPY': '🇯🇵', 'AUDUSD': '🇦🇺', 'USDCAD': '🇨🇦',
      'NZDUSD': '🇳🇿', 'USDCHF': '🇨🇭', 'EURGBP': '🇪🇺', 'EURJPY': '🇪🇺', 'GBPJPY': '🇬🇧',
      'AUDJPY': '🇦🇺', 'EURAUD': '🇪🇺', 'GBPAUD': '🇬🇧', 'EURNZD': '🇪🇺', 'GBPCAD': '🇬🇧',
      'USDSGD': '🇸🇬', 'USDHKD': '🇭🇰', 'USDSEK': '🇸🇪', 'USDNOK': '🇳🇴',
      'USDDKK': '🇩🇰', 'USDZAR': '🇿🇦', 'USDTRY': '🇹🇷', 'USDMXN': '🇲🇽',
      'USDPLN': '🇵🇱', 'EURCHF': '🇨🇭',
      'SHIB': '🐕', 'ATOM': '⚛️', 'FIL': '💾', 'NEAR': '🌊', 'ALGO': '∆', 'VET': '⚡',
      'SAND': '🏖️', 'MANA': '🌐', 'AXS': '⚔️', 'THETA': '📡', 'APT': '🔷', 'ARB': '🔵',
      'OP': '🔴', 'IMX': '♾️', 'INJ': '💉', 'TIA': '💜', 'SEI': '🟠', 'SUI': '💧',
      'PEPE': '🐸', 'FTM': '👻', 'GRT': '📊', 'ENS': '📛', 'LDO': '🏛️', 'RPL': '🚀',
      'STX': '🧱',
      'CACAO': '🍫', 'RUBBER': '⚫', 'IRON': '🔩',
    }
    const hash = code.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    const hue1 = hash % 360
    const hue2 = (hash * 7) % 360
    const gradientId = `logo-${code}-${size}`
    const colors = specialColors[code] || [`hsl(${hue1}, 70%, 50%)`, `hsl(${hue2}, 60%, 40%)`]
    const emoji = emojiMap[code]
    const displayText = code.length <= 3 ? code.slice(0, 2) : code.slice(0, 3)
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" style={{ flexShrink: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors[0]} />
            <stop offset="100%" stopColor={colors[1]} />
          </linearGradient>
        </defs>
        <circle cx="20" cy="20" r="20" fill={`url(#${gradientId})`} />
        {emoji ? (
          <text x="20" y="21" textAnchor="middle" dominantBaseline="central"
            fill="white" fontSize="14" fontWeight="900" fontFamily="system-ui">
            {emoji}
          </text>
        ) : (
          <text x="20" y="20" textAnchor="middle" dominantBaseline="central"
            fill="white" fontSize={displayText.length > 2 ? "9" : "12"} fontWeight="900" fontFamily="system-ui">
            {displayText}
          </text>
        )}
      </svg>
    )
  }, [])

  // ============ MARKET CATEGORY HELPER ============
  const getMarketCategory = useCallback((s: Stock): string => {
    const cat = (s.category || '').toLowerCase()
    const cryptoCodes = ['BTC', 'ETH', 'XRP', 'SOL', 'DOGE', 'ADA', 'AVAX', 'DOT', 'LINK', 'MATIC', 'BCH', 'LTC', 'XLM', 'UNI', 'AAVE', 'SHIB', 'ATOM', 'FIL', 'NEAR', 'ALGO', 'VET', 'SAND', 'MANA', 'AXS', 'THETA', 'APT', 'ARB', 'OP', 'IMX', 'INJ', 'TIA', 'SEI', 'SUI', 'PEPE', 'FTM', 'GRT', 'ENS', 'LDO', 'RPL', 'STX']
    const forexCodes = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD', 'USDCHF', 'EURGBP', 'EURJPY', 'GBPJPY', 'AUDJPY', 'EURAUD', 'GBPAUD', 'EURNZD', 'GBPCAD', 'USDSGD', 'USDHKD', 'USDSEK', 'USDNOK', 'USDDKK', 'USDZAR', 'USDTRY', 'USDMXN', 'USDPLN', 'EURCHF']
    const commodityCodes = ['GOLD', 'SILVER', 'OIL', 'NATGAS', 'COPPER', 'PLATINUM', 'PALLADIUM', 'WHEAT', 'CORN', 'SOYBEANS', 'SUGAR', 'COFFEE', 'COTTON', 'LUMBER', 'RICE', 'CACAO', 'RUBBER', 'IRON']
    if (cat.includes('crypto') || cat.includes('kripto') || cryptoCodes.includes(s.code)) return 'crypto'
    if (cat.includes('forex') || forexCodes.includes(s.code)) return 'forex'
    if (cat.includes('commodity') || cat.includes('komoditas') || commodityCodes.includes(s.code)) return 'komoditas'
    // All stock categories (tech, bluechip, banking, healthcare, consumer, energy, infrastructure, media, etc.) map to 'saham'
    return 'saham'
  }, [])

  // ============ TOGGLE FAVORITE ============
  const toggleFavorite = useCallback((code: string) => {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }, [])

  // Live sparkline update — shifts data left and adds new point every 2.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const currentStocks = stocksRef.current
      if (currentStocks.length === 0) return
      currentStocks.forEach(s => {
        const sim = sparklineSimRef.current.get(s.id)
        const cached = sparklineCache.current.get(s.id)
        if (!sim || !cached) return

        // Each tick: 50% chance to go up or down — natural zigzag
        const dir = Math.random() > 0.5 ? 1 : -1
        // Adaptive step: ensures ±1 visible change even for penny stocks
        const minStep = Math.max(1, s.price * 0.001)
        const stepSize = minStep * (0.5 + Math.random() * 1)
        // Use momentum carry-over for smooth movement
        sim.momentum = sim.momentum * 0.25 + dir * stepSize
        sim.val += sim.momentum
        // Adaptive mean reversion
        const reversionStrength = 0.008 + Math.abs(s.price - sim.val) / s.price * 0.08
        sim.val += (s.price - sim.val) * Math.min(reversionStrength, 0.04)

        // Shift sparkline data left and add new point
        const newPts = cached.slice(1).map((pt, idx) => ({ i: idx, p: pt.p }))
        newPts.push({ i: cached.length - 1, p: Math.round(sim.val) })
        sparklineCache.current.set(s.id, newPts)
      })
      // Force re-render by updating any state
      setStocks(prev => [...prev])
    }, 2500)
    return () => clearInterval(interval)
  }, []) // empty deps — uses stocksRef so interval never restarts

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

  // Live price simulation — REALISTIC stock movement with natural up/down zigzag
  useEffect(() => {
    if (!selectedStock || (!showStockDetail && !contractModal)) {
      setLiveChartActive(false)
      return
    }
    const basePrice = selectedStock.price
    const spread = basePrice * 0.002
    let buyPrice = basePrice - spread / 2
    let sellPrice = basePrice + spread / 2
    let momentum = 0
    let phase = 0

    // Build realistic historical data with VISIBLE zigzag swings
    const initialBuy: {time: string; price: number}[] = []
    const initialSell: {time: string; price: number}[] = []
    let tempBuy = buyPrice
    let tempSell = sellPrice
    let histMomentum = 0
    for (let i = 40; i >= 1; i--) {
      // Each tick: 50% chance to go up or down — natural zigzag
      const dir = Math.random() > 0.5 ? 1 : -1
      // Adaptive step: ensures visibility for all price ranges
      const minStep = Math.max(1, basePrice * 0.001)
      const stepSize = minStep * (0.8 + Math.random() * 1.2)
      histMomentum = histMomentum * 0.25 + dir * stepSize
      const mid = (tempBuy + tempSell) / 2 + histMomentum
      tempBuy = mid - spread / 2
      tempSell = mid + spread / 2
      // Light mean reversion
      tempBuy += (basePrice - tempBuy) * 0.005
      tempSell += (basePrice - tempSell) * 0.005
      const now = Date.now() - i * 2000
      const timeStr = new Date(now).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit', second: '2-digit'})
      initialBuy.push({time: timeStr, price: Math.round(tempBuy)})
      initialSell.push({time: timeStr, price: Math.round(tempSell)})
    }
    buyPrice = tempBuy
    sellPrice = tempSell
    setLiveBuyChart(initialBuy)
    setLiveSellChart(initialSell)
    setLiveBuyPrice(Math.round(buyPrice))
    setLiveSellPrice(Math.round(sellPrice))
    liveChartRef.current = {buyPrice, sellPrice, trend: 0, momentum: 0, phase}
    setLiveChartActive(true)

    const interval = setInterval(() => {
      phase++
      // Each tick: 50% chance to go up or down — natural zigzag
      const dir = Math.random() > 0.5 ? 1 : -1
      // Adaptive step: ensures visibility for all price ranges
      const minStep = Math.max(1, basePrice * 0.0008)
      const stepSize = minStep * (0.5 + Math.random() * 1)
      momentum = momentum * 0.25 + dir * stepSize

      const mid = (buyPrice + sellPrice) / 2 + momentum
      buyPrice = mid - spread / 2
      sellPrice = mid + spread / 2

      // Ensure sell > buy
      if (sellPrice <= buyPrice) sellPrice = buyPrice + spread

      // Light mean reversion
      buyPrice += (basePrice - buyPrice) * 0.003
      sellPrice += (basePrice - sellPrice) * 0.003

      liveChartRef.current = {buyPrice, sellPrice, trend: 0, momentum, phase}
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
    }, 2000) // 2s interval — smooth but responsive

    return () => {
      clearInterval(interval)
      setLiveChartActive(false)
    }
  }, [selectedStock, showStockDetail, contractModal])

  // ============ SINYAL PRO HELPERS & TIMER ============
  // Stockity-style payout: NAIK profit bigger, TURUN profit smaller
  // Payout rates vary per stock based on volatility tier
  const STOCK_PAYOUT_TIERS: Record<string, { upRange: [number, number]; downRange: [number, number]; volMultiplier: number }> = {
    // High volatility - highest UP payout, lowest DOWN
    TSLA: { upRange: [85, 92], downRange: [48, 56], volMultiplier: 1.8 },
    NVDA: { upRange: [84, 91], downRange: [50, 58], volMultiplier: 1.7 },
    AMD:  { upRange: [83, 90], downRange: [50, 58], volMultiplier: 1.6 },
    COIN: { upRange: [86, 93], downRange: [45, 53], volMultiplier: 2.0 },
    SQ:   { upRange: [84, 91], downRange: [48, 56], volMultiplier: 1.7 },
    // Medium-high volatility
    META: { upRange: [82, 88], downRange: [52, 60], volMultiplier: 1.4 },
    AMZN: { upRange: [81, 87], downRange: [53, 61], volMultiplier: 1.3 },
    NFLX: { upRange: [82, 89], downRange: [51, 59], volMultiplier: 1.5 },
    AVGO: { upRange: [83, 89], downRange: [52, 60], volMultiplier: 1.4 },
    INTC: { upRange: [80, 86], downRange: [54, 62], volMultiplier: 1.2 },
    TSM:  { upRange: [81, 88], downRange: [53, 61], volMultiplier: 1.3 },
    PYPL: { upRange: [80, 87], downRange: [54, 62], volMultiplier: 1.2 },
    // Medium volatility
    AAPL: { upRange: [78, 84], downRange: [56, 64], volMultiplier: 1.0 },
    MSFT: { upRange: [77, 83], downRange: [57, 65], volMultiplier: 0.9 },
    GOOGL:{ upRange: [78, 84], downRange: [56, 64], volMultiplier: 1.0 },
    CRM:  { upRange: [80, 86], downRange: [54, 62], volMultiplier: 1.2 },
    ORCL: { upRange: [79, 85], downRange: [55, 63], volMultiplier: 1.1 },
    ADBE: { upRange: [80, 86], downRange: [54, 62], volMultiplier: 1.2 },
    UBER: { upRange: [81, 87], downRange: [53, 61], volMultiplier: 1.3 },
    NOW:  { upRange: [81, 87], downRange: [53, 61], volMultiplier: 1.3 },
    // Low volatility - lower UP payout, higher DOWN (more stable)
    JPM:  { upRange: [75, 81], downRange: [58, 66], volMultiplier: 0.7 },
    V:    { upRange: [74, 80], downRange: [59, 67], volMultiplier: 0.6 },
    MA:   { upRange: [74, 80], downRange: [59, 67], volMultiplier: 0.6 },
    GS:   { upRange: [76, 82], downRange: [57, 65], volMultiplier: 0.8 },
    BAC:  { upRange: [75, 81], downRange: [58, 66], volMultiplier: 0.7 },
    PGR:  { upRange: [75, 81], downRange: [58, 66], volMultiplier: 0.7 },
    UNH:  { upRange: [76, 82], downRange: [57, 65], volMultiplier: 0.8 },
    JNJ:  { upRange: [73, 79], downRange: [60, 68], volMultiplier: 0.5 },
    PFE:  { upRange: [76, 82], downRange: [57, 65], volMultiplier: 0.8 },
    LLY:  { upRange: [78, 84], downRange: [56, 64], volMultiplier: 1.0 },
    ABBV: { upRange: [76, 82], downRange: [57, 65], volMultiplier: 0.8 },
    MRK:  { upRange: [75, 81], downRange: [58, 66], volMultiplier: 0.7 },
    WMT:  { upRange: [73, 79], downRange: [60, 68], volMultiplier: 0.5 },
    COST: { upRange: [74, 80], downRange: [59, 67], volMultiplier: 0.6 },
    NKE:  { upRange: [79, 85], downRange: [55, 63], volMultiplier: 1.1 },
    MCD:  { upRange: [73, 79], downRange: [60, 68], volMultiplier: 0.5 },
    KO:   { upRange: [72, 78], downRange: [61, 69], volMultiplier: 0.4 },
    SBUX: { upRange: [76, 82], downRange: [57, 65], volMultiplier: 0.8 },
    PEP:  { upRange: [73, 79], downRange: [60, 68], volMultiplier: 0.5 },
    XOM:  { upRange: [75, 81], downRange: [58, 66], volMultiplier: 0.7 },
    CVX:  { upRange: [75, 81], downRange: [58, 66], volMultiplier: 0.7 },
    COP:  { upRange: [76, 82], downRange: [57, 65], volMultiplier: 0.8 },
    CAT:  { upRange: [77, 83], downRange: [56, 64], volMultiplier: 0.9 },
    BA:   { upRange: [82, 88], downRange: [52, 60], volMultiplier: 1.4 },
    GE:   { upRange: [79, 85], downRange: [55, 63], volMultiplier: 1.1 },
    HON:  { upRange: [75, 81], downRange: [58, 66], volMultiplier: 0.7 },
    DE:   { upRange: [77, 83], downRange: [56, 64], volMultiplier: 0.9 },
    DIS:  { upRange: [78, 84], downRange: [56, 64], volMultiplier: 1.0 },
    CMCSA:{ upRange: [74, 80], downRange: [59, 67], volMultiplier: 0.6 },
    IBM:  { upRange: [74, 80], downRange: [59, 67], volMultiplier: 0.6 },
  }

  const getStockPayoutTier = useCallback((code: string) => {
    return STOCK_PAYOUT_TIERS[code] || { upRange: [78, 84] as [number, number], downRange: [56, 64] as [number, number], volMultiplier: 1.0 }
  }, [])

  // Payout rates are now computed from the chart state in real-time (see chartPayoutRates below)
  // No more periodic refresh — chart tick updates the payout every 500ms

  // Chart-based payout rates — calculated from the chart's real-time state
  // (volatility, momentum, trend direction, price distance from base)
  const [chartPayoutRates, setChartPayoutRates] = useState<{ up: number; down: number; upRange: [number, number]; downRange: [number, number] }>({ up: 82, down: 58, upRange: [78, 84], downRange: [56, 64] })

  // Compute payout from chart simulation state
  const computeChartPayout = useCallback((sim: NonNullable<typeof sinyalChartSimRef.current>, tier: { upRange: [number, number]; downRange: [number, number]; volMultiplier: number }) => {
    const baseVal = sim.basePrice
    // Factor 1: Current momentum strength (higher momentum = lower payout for that direction — harder to predict)
    const momentumStrength = Math.abs(sim.momentum) / (baseVal * 0.005) // normalized 0-1+
    // Factor 2: How far price is from base (extreme distance = lower payout)
    const priceDistance = Math.abs(sim.price - baseVal) / baseVal // 0-0.08
    // Factor 3: Trend consistency (strong trend = lower payout for trend direction)
    const trendBias = sim.trend * sim.momentum > 0 ? 0.8 : 0 // momentum aligns with trend

    // Calculate adjustments (these shift the base payout range)
    // When chart is moving strongly UP → NAIK payout decreases (too obvious), TURUN payout increases
    // When chart is moving strongly DOWN → TURUN payout decreases, NAIK payout increases
    const upAdjust = -momentumStrength * 3 - priceDistance * 10 * (sim.momentum > 0 ? 1 : -1) - trendBias * 2
    const downAdjust = momentumStrength * 3 + priceDistance * 10 * (sim.momentum > 0 ? 1 : -1) + trendBias * 2

    // Add some noise (like real platforms — slight random fluctuation)
    const noise = (Math.random() - 0.5) * 2

    const upRate = Math.max(tier.upRange[0], Math.min(tier.upRange[1], 
      (tier.upRange[0] + tier.upRange[1]) / 2 + upAdjust + noise))
    const downRate = Math.max(tier.downRange[0], Math.min(tier.downRange[1], 
      (tier.downRange[0] + tier.downRange[1]) / 2 + downAdjust - noise))

    return {
      up: Math.round(upRate * 10) / 10,
      down: Math.round(downRate * 10) / 10,
      upRange: tier.upRange,
      downRange: tier.downRange,
    }
  }, [])

  const calcSinyalProfit = useCallback((amount: number, _duration: number, direction: 'NAIK' | 'TURUN'): number => {
    // Payout is from chart state, NOT from duration
    return direction === 'NAIK' ? chartPayoutRates.up : chartPayoutRates.down
  }, [chartPayoutRates])

  // Stock base daily profit rates (varies per stock, max 7%)
  const getStockBaseRate = useCallback((code: string): number => {
    const rates: Record<string, number> = {
      AAPL: 5.0, NVDA: 7.0, MSFT: 5.5, GOOGL: 5.8, META: 7.0,
      AMZN: 6.5, TSLA: 7.0, AMD: 7.0, JPM: 5.0, V: 5.2,
      MA: 5.0, GS: 5.8, BAC: 5.0, PGR: 5.5, UNH: 5.2,
      JNJ: 5.0, PFE: 6.0, LLY: 7.0, ABBV: 5.8, MRK: 5.5,
      WMT: 5.0, COST: 5.2, NKE: 5.8, MCD: 5.0, KO: 5.0,
      SBUX: 5.5, PEP: 5.0, XOM: 5.2, CVX: 5.5, COP: 5.8,
      CAT: 5.5, BA: 7.0, GE: 6.2, HON: 5.2, DE: 5.5,
      DIS: 5.8, NFLX: 7.0, CMCSA: 5.0, COIN: 7.0, SQ: 7.0,
      PYPL: 6.2, AVGO: 7.0, INTC: 6.5, TSM: 7.0, CRM: 6.2,
      ORCL: 5.5, ADBE: 6.0, IBM: 5.0, NOW: 7.0, UBER: 7.0
    }
    return Math.min(rates[code] || 5.0, 7.0)
  }, [])

  const calcContractProfit = useCallback((stock: Stock, duration: number, amount: number) => {
    const baseRate = getStockBaseRate(stock.code)
    // Max profit rate is 7% - no multipliers allowed to exceed this
    const dailyRate = Math.min(baseRate, 7.0)
    const dailyProfitAmount = Math.round(amount * dailyRate / 100)
    const totalProfit = dailyProfitAmount * duration
    const totalReturn = amount + totalProfit
    return { dailyRate: Math.round(dailyRate * 100) / 100, dailyProfitAmount, totalProfit, totalReturn }
  }, [getStockBaseRate])

  const openSinyalPosition = useCallback((overrideDirection?: 'NAIK' | 'TURUN') => {
    if (!selectedSinyalStock || !sinyalAmount) return
    const amount = parseInt(sinyalAmount)
    if (amount < 100000) { toast({ title: 'Minimum Rp 100.000', variant: 'destructive' }); return }
    if (amount > (user?.balance || 0)) { toast({ title: 'Saldo tidak cukup', variant: 'destructive' }); return }
    const dir = overrideDirection || sinyalDirection
    // 10% fee deducted immediately, working capital = 90%
    const fee = Math.round(amount * 0.10)
    const workingCapital = amount - fee
    // Duration = remaining time in current candle (sync with candle close)
    const sim = sinyalChartSimRef.current
    const cc = sim?.currentCandle
    const candleRemaining = cc ? Math.max(cc.maxTicks - cc.tickCount, 3) : sinyalDuration
    const tradeDuration = candleRemaining
    const profitPercent = calcSinyalProfit(workingCapital, tradeDuration, dir)
    const posId = `sinyal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const newPosition = {
      id: posId,
      stockId: selectedSinyalStock.id,
      stockCode: selectedSinyalStock.code,
      stockName: selectedSinyalStock.name,
      direction: dir,
      amount,
      duration: tradeDuration,
      startPrice: sinyalCurrentPrice || selectedSinyalStock.price,
      startTime: Date.now(),
      profitPercent,
      status: 'active' as const,
      leverage: sinyalLeverage,
      fee,
      workingCapital,
    }
    setSinyalPositions(prev => [...prev, newPosition])
    setSinyalTimers(prev => ({ ...prev, [posId]: tradeDuration }))
    // Deduct full amount (including 10% fee) from balance immediately
    updateBalance((user?.balance || 0) - amount)
    const durMins = Math.floor(tradeDuration / 60)
    const durSecs = tradeDuration % 60
    const durLabel = durMins > 0 ? (durSecs > 0 ? `${durMins}m ${durSecs}s` : `${durMins}m`) : `${durSecs}s`
    toast({ title: 'Posisi Dibuka! 🎯', description: `${dir} ${selectedSinyalStock.code} • ${formatRupiah(amount)} (Fee ${formatRupiah(fee)}) • ${durLabel}` })
  }, [selectedSinyalStock, sinyalAmount, sinyalDirection, sinyalDuration, user, calcSinyalProfit, sinyalCurrentPrice, updateBalance, sinyalLeverage])

  // MT5-style: Close position early — proportional P&L based on real price movement × leverage
  // Fee (10%) is already deducted and NEVER returned. Only working capital + P&L returned.
  const closeSinyalPosition = useCallback((posId: string) => {
    const pos = sinyalPositionsRef.current.find(p => p.id === posId)
    if (!pos || pos.status !== 'active') return

    const currentPrice = sinyalCurrentPrice || sinyalChartSimRef.current?.price || pos.startPrice
    const lev = pos.leverage || 1000
    const wc = pos.workingCapital || Math.round(pos.amount * 0.9)

    // MT5-style P&L = effective position value × (price change / entry price) × direction
    const effectivePositionValue = wc * (lev / 100)
    const priceDiff = currentPrice - pos.startPrice
    const directionMultiplier = pos.direction === 'NAIK' ? 1 : -1
    const plAmount = Math.round(effectivePositionValue * (priceDiff / pos.startPrice) * directionMultiplier)

    // Cap: max loss = working capital (stop out), fee already gone
    const cappedPL = Math.max(-wc, plAmount)
    const isProfit = cappedPL >= 0
    // Return working capital + P&L (fee is already gone, never returned)
    const returnAmount = wc + cappedPL

    setSinyalPositions(prev => prev.map(p =>
      p.id === posId ? {...p, status: isProfit ? 'won' : 'lost', closedPL: cappedPL} : p
    ))

    setSinyalResults(prev => [...prev, {
      id: posId, won: isProfit, profit: cappedPL,
      stockCode: pos.stockCode, direction: pos.direction, amount: pos.amount, shownAt: Date.now(),
    }])
    setTimeout(() => setSinyalResults(prev => prev.filter(r => r.id !== posId)), 1200)

    // Track the net P&L offset (returnAmount - original amount deducted)
    // This ensures portfolio fetch doesn't overwrite the trade result
    // Net P&L = returnAmount - pos.amount (e.g., returned 27K from 100K invested = -73K)
    tradingPLOffsetRef.current += (returnAmount - pos.amount)

    // Return working capital + P&L to balance
    updateBalance((user?.balance || 0) + returnAmount)

    const plLabel = cappedPL >= 0 ? `+${formatRupiah(cappedPL)}` : formatRupiah(cappedPL)
    const feeLost = pos.fee || Math.round(pos.amount * 0.1)
    toast({ title: isProfit ? 'Posisi Ditutup — Untung! 🎉' : 'Posisi Ditutup — Rugi 📉', description: `${pos.direction === 'NAIK' ? 'Beli' : 'Jual'} ${pos.stockCode} • P&L ${plLabel} • Fee ${formatRupiah(feeLost)} • 1:${lev}` })
  }, [sinyalCurrentPrice, user, updateBalance])

  // MT5-style: Calculate live P&L based on REAL price movement
  // In MT5: P&L = Position Value × (Price Change / Entry Price) × Direction
  // Effective Position Value = Working Capital × (Leverage / 100)
  // This gives calibrated P&L: ~1K-2K per tick for 100K investment with 1:1000 leverage
  // Working Capital = Investment - Fee (10%)
  // This makes the balance follow the candlestick in real-time — exactly like MT5
  const getPositionLivePL = useCallback((pos: typeof sinyalPositions[0]) => {
    if (pos.status !== 'active') return 0
    const currentPrice = sinyalCurrentPrice || sinyalChartSimRef.current?.price || pos.startPrice
    const lev = pos.leverage || 1000
    const wc = pos.workingCapital || Math.round(pos.amount * 0.9)
    // Effective position value = working capital × (leverage / 100)
    // 1:1000 → 90K × 10 = 900K position | 1:500 → 90K × 5 = 450K position
    const effectivePositionValue = wc * (lev / 100)
    // Price change from entry
    const priceDiff = currentPrice - pos.startPrice
    // Direction: NAIK/BELI profits when price up, TURUN/JUAL profits when price down
    const directionMultiplier = pos.direction === 'NAIK' ? 1 : -1
    // P&L = effective position value × (price change %) × direction
    const plAmount = Math.round(effectivePositionValue * (priceDiff / pos.startPrice) * directionMultiplier)
    // Max loss capped at working capital (fee already gone, can't lose more than what's at risk)
    return Math.max(-wc, plAmount)
  }, [sinyalCurrentPrice])

  // ============ LIVE BALANCE (MT5 Equity) ============
  // In MT5: Equity = Balance + Unrealized P&L
  // This is the "saldo ikut alur batang" — follows the candle in real-time
  // When position goes against you, your equity drops tick by tick
  const liveBalance = (() => {
    const baseBalance = user?.balance || 0
    const activePos = sinyalPositions.filter(p => p.status === 'active')
    if (activePos.length === 0) return baseBalance
    // MT5 Equity = balance + unrealized P&L
    // balance already had full amount deducted when position opened
    // We add back working capital + P&L to show live equity
    const totalWorkingCapital = activePos.reduce((s, p) => s + (p.workingCapital || Math.round(p.amount * 0.9)), 0)
    const totalLivePL = activePos.reduce((s, p) => s + getPositionLivePL(p), 0)
    return baseBalance + totalWorkingCapital + totalLivePL
  })()

  // ============ LIVE MODAL (MT5 Margin) ============
  // This is the working capital that FOLLOWS THE CHART in real-time
  // Modal Live = Working Capital + P&L
  // When you open 100K: Modal = 90K
  // If chart goes against you: Modal drops to 85K, 80K, 70K... until stop out
  // If chart goes in your favor: Modal rises to 95K, 100K, 110K...
  const liveModal = (() => {
    const activePos = sinyalPositions.filter(p => p.status === 'active')
    if (activePos.length === 0) return 0
    const totalWorkingCapital = activePos.reduce((s, p) => s + (p.workingCapital || Math.round(p.amount * 0.9)), 0)
    const totalLivePL = activePos.reduce((s, p) => s + getPositionLivePL(p), 0)
    return totalWorkingCapital + totalLivePL
  })()

  // Sinyal Pro live candlestick chart — initialize historical candles + real-time intrabar updates
  useEffect(() => {
    if (activeTab !== 'sinyal' || !selectedSinyalStock) return

    // Reset chart offset when switching stocks/timeframes
    setSinyalChartOffset(0)

    // Candle duration in seconds based on selected timeframe
    const tfSeconds = sinyalTimeframeSeconds[sinyalTimeframe] || 60
    // Tick interval = 1 second, maxTicks = timeframe seconds
    const tickIntervalMs = 1000
    const maxTicks = tfSeconds

    // Initialize chart simulation when first opens
    if (sinyalChartSimRef.current === null) {
      const basePrice = selectedSinyalStock.price
      // Stock-specific volatility multiplier
      const stockTier = getStockPayoutTier(selectedSinyalStock.code)
      const volMult = stockTier.volMultiplier
      const vol = Math.round((30000 + Math.random() * 70000) * volMult)
      // Stock-specific initial trend bias (some stocks tend upward, some downward)
      const stockSeed = selectedSinyalStock.code.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
      const initialTrend = stockSeed % 2 === 0 ? 1 : -1
      const sim = {
        price: basePrice,
        basePrice,
        momentum: 0,
        trend: initialTrend,
        phase: 1,
        phaseLen: 5,
        vol,
        currentCandle: {
          open: basePrice,
          high: basePrice,
          low: basePrice,
          close: basePrice,
          volume: 0,
          tickCount: 0,
          maxTicks,
        },
        // No rigging — real MT5 trending, chart moves naturally
      }

      // Generate more historical candles based on timeframe
      // For 1m: 60 candles (1 hour of data), for 5m: 60 candles (5 hours), etc.
      const histCount = 60
      const histCandles: CandleData[] = []
      const histStartOffset = (stockSeed % 7 - 3) / 100
      let prevClose = Math.round(basePrice * (0.97 + histStartOffset + Math.random() * 0.04))
      const histSim = { momentum: 0, trend: initialTrend, phase: 1, phaseLen: 5, vol }
      const now = new Date()
      for (let i = 0; i < histCount; i++) {
        const candle = generateCandle(prevClose, basePrice, histSim, i)
        // Time label based on timeframe
        const candleTime = new Date(now.getTime() - (histCount - i) * tfSeconds * 1000)
        const timeLabel = candleTime.getHours().toString().padStart(2, '0') + ':' + candleTime.getMinutes().toString().padStart(2, '0')
        histCandles.push({ ...candle, time: timeLabel })
        prevClose = candle.close
      }
      setSinyalCandles(histCandles)
      setSinyalCurrentPrice(prevClose)
      sinyalChartSimRef.current = sim

      // Initialize chart-based payout rates for this stock
      const initialPayout = computeChartPayout(sim, stockTier)
      setChartPayoutRates(initialPayout)
    } else {
      // Update maxTicks when timeframe changes
      sinyalChartSimRef.current.currentCandle.maxTicks = maxTicks
    }

    const interval = setInterval(() => {
      const sim = sinyalChartSimRef.current
      if (!sim) return

      const cc = sim.currentCandle
      cc.tickCount++

      // REAL MT5 TRENDING — no rigging, chart moves naturally based on market dynamics
      // The price follows realistic market movement with trend, momentum, and noise
      const baseVal = sim.basePrice
      // Stock-specific volatility from payout tier
      const stockTier = getStockPayoutTier(selectedSinyalStock.code)
      const volMult = stockTier.volMultiplier
      // Scale volatility by timeframe — longer candles have more total movement
      const tfScale = Math.sqrt(tfSeconds / 60) // sqrt for realistic volatility scaling
      // Moderate volatility (0.0018) for realistic MT5-style movement
      const volatility = baseVal * 0.0018 * volMult * tfScale
      let drift = 0

      const progress = cc.tickCount / cc.maxTicks

      // Natural market movement — no rigging, pure trend + noise
      // Trend strength varies naturally through the candle (like real markets)
      const trendStrength = baseVal * 0.0005 * tfScale * (0.8 + Math.random() * 0.4)
      const noise = (Math.random() - 0.5) * volatility

      if (progress < 0.3) {
        // Early phase: trend emerges with noise (market finding direction)
        drift = sim.trend * trendStrength + noise
      } else if (progress < 0.7) {
        // Middle phase: trend strengthens (momentum builds naturally)
        drift = sim.trend * trendStrength * 1.3 + noise
      } else {
        // Late phase: trend continues or reversal attempt (natural market dynamics)
        // Small chance of trend reversal (like real markets)
        const reversalChance = Math.random() < 0.15
        if (reversalChance) {
          drift = -sim.trend * trendStrength * 0.8 + noise * 0.7
        } else {
          drift = sim.trend * trendStrength * 1.1 + noise * 0.6
        }
      }

      sim.momentum = sim.momentum * 0.5 + drift
      // Weaker mean reversion so trends develop more dramatically
      const meanRevert = (sim.basePrice - sim.price) * 0.001
      sim.price = Math.round(Math.max(baseVal * 0.85, Math.min(baseVal * 1.15, sim.price + sim.momentum + meanRevert)))

      cc.close = sim.price
      cc.high = Math.max(cc.high, cc.close)
      cc.low = Math.min(cc.low, cc.close)
      cc.volume += Math.round(Math.random() * 500 + 200)

      setSinyalCurrentPrice(sim.price)

      // Compute payout rates from chart state (every tick — real-time)
      const chartPayout = computeChartPayout(sim, stockTier)
      setChartPayoutRates(chartPayout)

      // If candle is complete
      if (cc.tickCount >= cc.maxTicks) {
        const now = new Date()
        const completedCandle: CandleData = {
          idx: 0,
          open: cc.open,
          high: cc.high,
          low: cc.low,
          close: cc.close,
          volume: cc.volume,
          time: now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0'),
        }
        setSinyalCandles(prev => [...prev, completedCandle])

        // Reset for next candle
        cc.open = cc.close
        cc.high = cc.close
        cc.low = cc.close
        cc.volume = 0
        cc.tickCount = 0
        cc.maxTicks = maxTicks
        sim.trend = Math.random() > 0.5 ? 1 : -1
      }
    }, tickIntervalMs)

    return () => clearInterval(interval)
  }, [activeTab, selectedSinyalStock, sinyalTimeframe, generateCandle, getStockPayoutTier, computeChartPayout])

  // Sinyal Pro multi-position timer — resolve ALL active positions independently
  // Uses working capital (90% after 10% fee) + leverage factor for dramatic P&L
  useEffect(() => {
    const activePositions = sinyalPositions.filter(p => p.status === 'active')
    if (activePositions.length === 0) return

    const interval = setInterval(() => {
      const now = Date.now()
      const currentPositions = sinyalPositionsRef.current.filter(p => p.status === 'active')
      const newTimers: Record<string, number> = {}
      const toResolve: string[] = []
      const toStopOut: string[] = []

      for (const pos of currentPositions) {
        const elapsed = Math.floor((now - pos.startTime) / 1000)
        const remaining = pos.duration - elapsed
        newTimers[pos.id] = remaining

        // MT5 Stop-Out: if Modal Live drops to 5% or less of working capital, auto close (margin call)
        // This prevents Modal Live from showing 0 — position gets force-closed before total wipeout
        const livePL = getPositionLivePL(pos)
        const wc = pos.workingCapital || Math.round(pos.amount * 0.9)
        const modalLive = wc + livePL
        if (modalLive <= wc * 0.05) {
          toStopOut.push(pos.id)
        } else if (remaining <= 0) {
          toResolve.push(pos.id)
        }
      }

      setSinyalTimers(prev => ({ ...prev, ...newTimers }))

      // Process stop-outs and expirations together
      const allToClose = [...toStopOut, ...toResolve]
      for (const posId of allToClose) {
        const pos = sinyalPositionsRef.current.find(p => p.id === posId)
        if (!pos || pos.status !== 'active') continue

        const currentPrice = sinyalCurrentPrice || sinyalChartSimRef.current?.price || pos.startPrice
        const lev = pos.leverage || 1000
        const wc = pos.workingCapital || Math.round(pos.amount * 0.9)

        // MT5-style P&L = effective position value × (price change / entry price) × direction
        const effectivePositionValue = wc * (lev / 100)
        const priceDiff = currentPrice - pos.startPrice
        const directionMultiplier = pos.direction === 'NAIK' ? 1 : -1
        const plAmount = Math.round(effectivePositionValue * (priceDiff / pos.startPrice) * directionMultiplier)

        // Max loss = working capital (fee already gone)
        const cappedPL = Math.max(-wc, plAmount)
        const isProfit = cappedPL >= 0
        const returnAmount = wc + cappedPL

        const isStopOut = toStopOut.includes(posId)

        setSinyalPositions(prev => prev.map(p =>
          p.id === posId ? {...p, status: isProfit ? 'won' : 'lost', closedPL: cappedPL} : p
        ))

        setSinyalResults(prev => [...prev, {
          id: posId,
          won: isProfit,
          profit: cappedPL,
          stockCode: pos.stockCode,
          direction: pos.direction,
          amount: pos.amount,
          shownAt: Date.now(),
        }])
        setTimeout(() => setSinyalResults(prev => prev.filter(r => r.id !== posId)), 1200)

        // Track the net P&L offset so portfolio fetch doesn't overwrite the trade result
        tradingPLOffsetRef.current += (returnAmount - pos.amount)

        // Return working capital + P&L to balance (fee already deducted)
        updateBalance((user?.balance || 0) + returnAmount)

        const plLabel = cappedPL >= 0 ? `+${formatRupiah(cappedPL)}` : formatRupiah(cappedPL)
        const feeLost = pos.fee || Math.round(pos.amount * 0.1)
        if (isStopOut) {
          toast({ title: 'Stop Out! ⚠️', description: `${pos.stockCode} • Loss mencapai 90% modal kerja • P&L ${plLabel} • Fee ${formatRupiah(feeLost)}` })
        }
      }
    }, 500)

    return () => clearInterval(interval)
  }, [sinyalPositions, sinyalCurrentPrice, user, updateBalance, getPositionLivePL])

  // ============ FETCH FUNCTIONS ============
  const fetchStocks = useCallback(async () => {
    try { const r = await fetch('/api/stocks'); const d = await r.json(); if (d.stocks) setStocks(d.stocks) } catch {}
  }, [])
  const fetchPortfolio = useCallback(async () => {
    if (!user) return
    try { const r = await fetch(`/api/portfolio?userId=${user.id}`); const d = await r.json(); if (d.portfolio) { setPortfolio(d.portfolio); setPortfolioSummary(d.summary); /* Apply trading P&L offset + active trade deductions on top of server balance Server doesn't know about client-side trades, so we must adjust: - tradingPLOffsetRef: cumulative net P&L from closed trades - activeTradeDeductions: total amount locked in active positions (already deducted locally) */ const activeTradeDeductions = sinyalPositionsRef.current.filter(p => p.status === 'active').reduce((sum, p) => sum + p.amount, 0); const adjustedBalance = d.summary.cashBalance + tradingPLOffsetRef.current - activeTradeDeductions; updateBalance(adjustedBalance) } } catch {}
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
    // Fetch QRIS image from admin settings
    fetch('/api/qris').then(r => r.json()).then(d => { if (d?.url) setQrisImageUrl(d.url) }).catch(() => {})
  }, [user])

  useEffect(() => { const iv = setInterval(refreshAll, 30000); return () => clearInterval(iv) }, [refreshAll])

  // ============ WELCOME MODAL LOGIC ============
  useEffect(() => {
    if (user) {
      const dismissed = localStorage.getItem('gs_welcome_dismissed')
      if (!dismissed || Date.now() > parseInt(dismissed)) {
        setShowWelcomeModal(true)
        // Auto-dismiss after 5 seconds so it doesn't block navigation
        const timer = setTimeout(() => setShowWelcomeModal(false), 5000)
        return () => clearTimeout(timer)
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
    if (user.accountType === 'demo') { toast({ title: 'Akun demo tidak dapat deposit', variant: 'destructive' }); return }
    const amount = parseFloat(depositAmount)
    if (amount < 100000) { toast({ title: 'Minimum deposit Rp 100.000', variant: 'destructive' }); return }
    setDepositLoading(true)
    try {
      const res = await fetch('/api/deposit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, amount, method: 'qris', bankName: 'QRIS' }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: 'Deposit Berhasil!', description: `+${formatRupiah(amount)} via QRIS telah ditambahkan` })
      setDepositAmount(''); setDepositStep('amount'); fetchPortfolio(); fetchDeposits(); fetchNotifications()
    } catch (err: unknown) { toast({ title: 'Gagal', description: err instanceof Error ? err.message : 'Error', variant: 'destructive' }) }
    finally { setDepositLoading(false) }
  }

  // ============ WITHDRAW ============
  const handleWithdraw = async () => {
    if (!user || !withdrawAmount) return
    if (user.accountType === 'demo') { toast({ title: 'Akun demo tidak dapat withdraw', variant: 'destructive' }); return }
    const amount = parseFloat(withdrawAmount)
    const isKycVerified = user?.kycStatus === 'verified'
    const minWithdraw = isKycVerified ? 50000 : 250000
    if (amount < minWithdraw) {
      toast({ title: `Minimum Withdraw Rp ${minWithdraw.toLocaleString('id-ID')}`, description: isKycVerified ? '' : 'Verifikasi KYC untuk minimum Rp 50.000!', variant: 'destructive' })
      return
    }
    if (amount > (user?.balance || 0)) { toast({ title: 'Saldo tidak cukup', variant: 'destructive' }); return }
    if (withdrawCategory !== 'crypto' && !withdrawAccountNumber) { toast({ title: 'Isi nomor rekening / HP terlebih dahulu', variant: 'destructive' }); return }
    if (withdrawCategory === 'bank' && !withdrawAccountHolder) { toast({ title: 'Isi nama pemilik rekening', variant: 'destructive' }); return }
    setWithdrawLoading(true)
    try {
      const methodName = withdrawCategory === 'bank' ? withdrawBankMethod : withdrawCategory === 'ewallet' ? withdrawEwalletMethod : withdrawCryptoMethod
      const res = await fetch('/api/withdrawal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, amount, bankName: methodName, bankAccount: withdrawAccountNumber || user.bankAccount || '0000000', bankHolder: withdrawAccountHolder || user.name }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const adminFee = data.adminFee || Math.round(amount * 0.10)
      const netAmount = data.netAmount || (amount - adminFee)
      toast({ title: 'Withdraw Diproses!', description: `${formatRupiah(amount)} via ${methodName}. Biaya admin 10%: ${formatRupiah(adminFee)}. Diterima: ${formatRupiah(netAmount)}` })
      setWithdrawAmount(''); setWithdrawAccountNumber(''); setWithdrawAccountHolder(''); fetchPortfolio(); fetchWithdrawals()
    } catch (err: unknown) { toast({ title: 'Gagal', description: err instanceof Error ? err.message : 'Error', variant: 'destructive' }) }
    finally { setWithdrawLoading(false) }
  }

  // ============ DEMO BALANCE REQUEST ============
  const handleDemoBalanceRequest = async () => {
    if (!user || !demoRequestAmount) return
    const amount = parseFloat(demoRequestAmount)
    if (amount <= 0) { toast({ title: 'Masukkan jumlah saldo', variant: 'destructive' }); return }
    if (amount > 1000000000) { toast({ title: 'Maksimal Rp 1.000.000.000 per request', variant: 'destructive' }); return }
    setDemoRequestLoading(true)
    try {
      const res = await fetch('/api/demo/balance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, amount }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      updateBalance(data.newBalance)
      toast({ title: 'Saldo Demo Ditambahkan! 🎮', description: `+${formatRupiah(amount)} saldo virtual telah ditambahkan` })
      setDemoRequestAmount('')
    } catch (err: unknown) { toast({ title: 'Gagal', description: err instanceof Error ? err.message : 'Error', variant: 'destructive' }) }
    finally { setDemoRequestLoading(false) }
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

  // ============ KYC ============
  const fetchKycStatus = async () => {
    if (!user) return
    try {
      const r = await fetch(`/api/kyc?userId=${user.id}`)
      const d = await r.json()
      if (d.kycRecord) setKycRecord(d.kycRecord)
      if (d.kycStatus) updateUser({ kycStatus: d.kycStatus })
    } catch {}
  }

  const uploadKycFile = async (file: File): Promise<string | null> => {
    if (!user) return null
    const fd = new FormData()
    fd.append('file', file)
    fd.append('userId', user.id)
    try {
      const r = await fetch('/api/upload', { method: 'POST', body: fd })
      const d = await r.json()
      if (d.url) return d.url
      return null
    } catch { return null }
  }

  const handleKycSubmit = async () => {
    if (!user) return
    if (!kycForm.fullName || !kycForm.idNumber || !kycForm.address || !kycForm.occupation || !kycForm.incomeRange) {
      toast({ title: 'Lengkapi Data', description: 'Semua field wajib diisi', variant: 'destructive' }); return
    }
    if (!kycKtpFile) {
      toast({ title: 'Upload KTP', description: 'Foto KTP wajib diupload', variant: 'destructive' }); return
    }
    if (!kycSelfieFile) {
      toast({ title: 'Upload Selfie', description: 'Foto selfie dengan KTP wajib diupload', variant: 'destructive' }); return
    }
    setKycSubmitting(true)
    try {
      // Upload files
      const ktpUrl = await uploadKycFile(kycKtpFile)
      if (!ktpUrl) { toast({ title: 'Gagal Upload', description: 'Gagal upload foto KTP', variant: 'destructive' }); setKycSubmitting(false); return }
      const selfieUrl = await uploadKycFile(kycSelfieFile)
      if (!selfieUrl) { toast({ title: 'Gagal Upload', description: 'Gagal upload foto selfie', variant: 'destructive' }); setKycSubmitting(false); return }
      let bankUrl: string | null = null
      if (kycBankFile) { bankUrl = await uploadKycFile(kycBankFile) }
      let additionalUrl: string | null = null
      if (kycAdditionalFile) { additionalUrl = await uploadKycFile(kycAdditionalFile) }

      const res = await fetch('/api/kyc', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id, ...kycForm,
          ktpImage: ktpUrl, selfieImage: selfieUrl,
          bankStatement: bankUrl, additionalDoc: additionalUrl,
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      updateUser({ kycStatus: 'pending' })
      setKycRecord(data.kycRecord)
      toast({ title: 'KYC Diajukan! 📋', description: 'Proses verifikasi 1-3 hari kerja. Setelah verified, minimum withdraw hanya Rp 50.000!' })
    } catch (err: unknown) {
      toast({ title: 'Gagal', description: err instanceof Error ? err.message : 'Gagal mengajukan KYC', variant: 'destructive' })
    } finally { setKycSubmitting(false) }
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
    return chartData.map((d, i) => ({ i, p: d.close }))
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

  // ============ KYC FORM CONTENT ============
  const kycFormContent = () => (
    <div className="space-y-3">
      {/* Personal Info */}
      <div className="rounded-2xl p-3 bg-[var(--zv-surface)] border border-[var(--zv-border)]">
        <p className="text-[9px] font-black text-[#3b82f6] uppercase tracking-widest mb-2">Data Pribadi</p>
        <div className="space-y-2.5">
          <div>
            <label className="block text-[9px] font-bold text-[var(--zv-muted)] mb-1">Nama Lengkap (sesuai KTP) *</label>
            <input type="text" value={kycForm.fullName} onChange={e => setKycForm({ ...kycForm, fullName: e.target.value })} placeholder="Masukkan nama lengkap" className="w-full h-10 rounded-xl bg-[var(--zv-bg)] border border-[var(--zv-border)] px-3 text-[11px] font-semibold text-[var(--zv-text)] outline-none focus:border-[#3b82f6] transition-all" />
          </div>
          <div>
            <label className="block text-[9px] font-bold text-[var(--zv-muted)] mb-1">Nomor KTP (16 digit) *</label>
            <input type="text" value={kycForm.idNumber} onChange={e => setKycForm({ ...kycForm, idNumber: e.target.value })} placeholder="16 digit nomor KTP" maxLength={16} className="w-full h-10 rounded-xl bg-[var(--zv-bg)] border border-[var(--zv-border)] px-3 text-[11px] font-semibold text-[var(--zv-text)] outline-none focus:border-[#3b82f6] transition-all" />
          </div>
          <div>
            <label className="block text-[9px] font-bold text-[var(--zv-muted)] mb-1">Alamat Lengkap *</label>
            <input type="text" value={kycForm.address} onChange={e => setKycForm({ ...kycForm, address: e.target.value })} placeholder="Alamat sesuai KTP" className="w-full h-10 rounded-xl bg-[var(--zv-bg)] border border-[var(--zv-border)] px-3 text-[11px] font-semibold text-[var(--zv-text)] outline-none focus:border-[#3b82f6] transition-all" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] font-bold text-[var(--zv-muted)] mb-1">Pekerjaan *</label>
              <select value={kycForm.occupation} onChange={e => setKycForm({ ...kycForm, occupation: e.target.value })} className="w-full h-10 rounded-xl bg-[var(--zv-bg)] border border-[var(--zv-border)] px-3 text-[11px] font-semibold text-[var(--zv-text)] outline-none focus:border-[#3b82f6] transition-all">
                <option value="">Pilih</option>
                <option value="Pegawai Swasta">Pegawai Swasta</option>
                <option value="PNS">PNS</option>
                <option value="Wiraswasta">Wiraswasta</option>
                <option value="Freelancer">Freelancer</option>
                <option value="Mahasiswa">Mahasiswa</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-bold text-[var(--zv-muted)] mb-1">Penghasilan *</label>
              <select value={kycForm.incomeRange} onChange={e => setKycForm({ ...kycForm, incomeRange: e.target.value })} className="w-full h-10 rounded-xl bg-[var(--zv-bg)] border border-[var(--zv-border)] px-3 text-[11px] font-semibold text-[var(--zv-text)] outline-none focus:border-[#3b82f6] transition-all">
                <option value="">Pilih</option>
                <option value="< 5 Juta">&lt; 5 Juta</option>
                <option value="5-10 Juta">5-10 Juta</option>
                <option value="10-25 Juta">10-25 Juta</option>
                <option value="25-50 Juta">25-50 Juta</option>
                <option value="> 50 Juta">&gt; 50 Juta</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Document Uploads */}
      <div className="rounded-2xl p-3 bg-[var(--zv-surface)] border border-[var(--zv-border)]">
        <p className="text-[9px] font-black text-[#3b82f6] uppercase tracking-widest mb-2">Upload Dokumen</p>
        <div className="space-y-3">
          {/* KTP Image */}
          <div>
            <label className="block text-[9px] font-bold text-[var(--zv-muted)] mb-1.5">Foto KTP * <span className="text-red-400">Wajib</span></label>
            <div className="relative">
              <input type="file" accept="image/*" onChange={e => setKycKtpFile(e.target.files?.[0] || null)} className="w-full text-[10px] file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-[9px] file:font-bold file:bg-blue-50 dark:file:bg-blue-950/30 file:text-blue-600 file:cursor-pointer" />
            </div>
            {kycKtpFile && (
              <div className="mt-2 flex items-center gap-2">
                <img src={URL.createObjectURL(kycKtpFile)} alt="KTP Preview" className="w-20 h-14 rounded-lg object-cover border border-[var(--zv-border)]" />
                <div>
                  <p className="text-[9px] font-bold text-green-500 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> KTP siap upload</p>
                  <p className="text-[8px] text-[var(--zv-muted)]">{kycKtpFile.name} ({(kycKtpFile.size / 1024).toFixed(0)} KB)</p>
                </div>
              </div>
            )}
          </div>

          {/* Selfie with KTP */}
          <div>
            <label className="block text-[9px] font-bold text-[var(--zv-muted)] mb-1.5">Selfie dengan KTP * <span className="text-red-400">Wajib</span></label>
            <div className="relative">
              <input type="file" accept="image/*" onChange={e => setKycSelfieFile(e.target.files?.[0] || null)} className="w-full text-[10px] file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-[9px] file:font-bold file:bg-blue-50 dark:file:bg-blue-950/30 file:text-blue-600 file:cursor-pointer" />
            </div>
            {kycSelfieFile && (
              <div className="mt-2 flex items-center gap-2">
                <img src={URL.createObjectURL(kycSelfieFile)} alt="Selfie Preview" className="w-20 h-14 rounded-lg object-cover border border-[var(--zv-border)]" />
                <div>
                  <p className="text-[9px] font-bold text-green-500 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Selfie siap upload</p>
                  <p className="text-[8px] text-[var(--zv-muted)]">{kycSelfieFile.name} ({(kycSelfieFile.size / 1024).toFixed(0)} KB)</p>
                </div>
              </div>
            )}
          </div>

          {/* Bank Statement - Optional */}
          <div>
            <label className="block text-[9px] font-bold text-[var(--zv-muted)] mb-1.5">Buku Rekening / Statement Bank <span className="text-[var(--zv-muted)]">(Opsional)</span></label>
            <input type="file" accept="image/*" onChange={e => setKycBankFile(e.target.files?.[0] || null)} className="w-full text-[10px] file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-[9px] file:font-bold file:bg-gray-50 dark:file:bg-gray-800 file:text-gray-600 file:cursor-pointer" />
            {kycBankFile && <p className="text-[8px] text-green-500 mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {kycBankFile.name}</p>}
          </div>

          {/* Additional Doc - Optional */}
          <div>
            <label className="block text-[9px] font-bold text-[var(--zv-muted)] mb-1.5">Dokumen Tambahan <span className="text-[var(--zv-muted)]">(Opsional)</span></label>
            <input type="file" accept="image/*" onChange={e => setKycAdditionalFile(e.target.files?.[0] || null)} className="w-full text-[10px] file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-[9px] file:font-bold file:bg-gray-50 dark:file:bg-gray-800 file:text-gray-600 file:cursor-pointer" />
            {kycAdditionalFile && <p className="text-[8px] text-green-500 mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {kycAdditionalFile.name}</p>}
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="rounded-xl p-2.5 bg-yellow-500/5 border border-yellow-500/10">
        <p className="text-[8px] font-bold text-yellow-600 dark:text-yellow-400 mb-1">⚠️ Penting:</p>
        <ul className="text-[8px] text-[var(--zv-muted)] space-y-0.5">
          <li>• Pastikan foto KTP jelas dan tidak terpotong</li>
          <li>• Selfie harus memegang KTP asli (bukan fotokopi)</li>
          <li>• Data harus sesuai dengan KTP yang diupload</li>
          <li>• Proses verifikasi 1-3 hari kerja</li>
          <li>• Setelah verified, min. withdraw turun ke Rp 50.000</li>
        </ul>
      </div>

      {/* Submit Button */}
      <button onClick={handleKycSubmit} disabled={kycSubmitting}
        className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white text-[12px] font-bold hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
        {kycSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
        {kycSubmitting ? 'Mengupload...' : 'Ajukan Verifikasi KYC'}
      </button>
    </div>
  )

  // ============ RENDER ============
  return (
    <div className="min-h-screen flex flex-col md:pl-[72px] lg:pl-[80px]" style={{ background: 'var(--zv-bg)' }}>
      {/* Top Header */}
      <header className="sticky top-0 z-40 glass-header border-b border-[var(--zv-border)]">
        <div className="max-w-7xl mx-auto px-3 md:px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button onClick={() => setShowSideMenu(true)} className="w-9 h-9 rounded-xl bg-[var(--zv-surface)] border border-[var(--zv-border)] grid place-items-center hover:bg-[var(--zv-border)] transition-colors">
              <Menu className="w-4 h-4 text-[var(--zv-muted)]" />
            </button>
            <ZevorixLogo size={36} className="flex-shrink-0" />
            <div>
              <b className="block text-[13px] md:text-base font-black gradient-text leading-tight">ZEVORIX</b>
              <span className="block text-[7px] md:text-[8px] font-bold text-[var(--zv-muted)] uppercase tracking-[0.2em]">Investment Platform</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-px h-6 bg-[var(--zv-border)] mx-1" />
            <button onClick={toggleTheme} className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--zv-surface)] to-[var(--zv-panel)] border border-[var(--zv-border)] grid place-items-center hover:bg-[var(--zv-hover)] hover:scale-105 transition-all shadow-sm">
              {theme === 'dark' ? <Sun className="w-4 h-4 text-[var(--zv-gold)]" /> : <Moon className="w-4 h-4 text-[var(--zv-muted)]" />}
            </button>
            <button onClick={refreshAll} className="w-9 h-9 rounded-xl bg-[var(--zv-surface)] border border-[var(--zv-border)] grid place-items-center hover:bg-[var(--zv-border)] transition-colors">
              <RefreshCw className={`w-4 h-4 text-[var(--zv-muted)] ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => { setShowNotifPanel(true); markNotifRead() }} className="w-9 h-9 rounded-xl bg-[var(--zv-surface)] border border-[var(--zv-border)] grid place-items-center hover:bg-[var(--zv-border)] transition-colors relative">
              <Bell className="w-4 h-4 text-[var(--zv-muted)]" />
              {unreadNotif > 0 && <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-gradient-to-r from-red-500 to-red-600 text-[7px] text-white font-black grid place-items-center shadow-lg shadow-red-500/30">{unreadNotif > 9 ? '9+' : unreadNotif}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* Market Indices Bar */}
      {indices.length > 0 && (
        <div className="border-b border-[var(--zv-border)] overflow-x-auto" style={{ background: 'var(--zv-panel)' }}>
          <div className="max-w-7xl mx-auto flex gap-3 px-3 md:px-6 py-2">
            {indices.map(idx => (
              <div key={idx.id} className="flex-shrink-0 flex items-center gap-1.5 bg-[var(--zv-surface)] rounded-lg px-2.5 py-1 border border-[var(--zv-border)]">
                <span className="text-[8px] md:text-[10px] font-black text-[var(--zv-muted)]">{idx.code}</span>
                <span className="text-[10px] md:text-[11px] font-black text-[var(--zv-text)] tabular-nums">{formatNumber(idx.value)}</span>
                <span className={`text-[8px] md:text-[10px] font-black ${idx.changePercent >= 0 ? 'text-[#22c55e]' : 'text-[#ef5350]'}`}>{formatPercent(idx.changePercent)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 md:px-6 py-4 pb-24 md:pb-6">
        <AnimatePresence mode="wait">
          {/* ====== HOME TAB ====== */}
          {activeTab === 'home' && (
            <motion.div key="home" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>

              {/* ══════════ PREMIUM BANNER CAROUSEL ══════════ */}
              <div
                className="relative rounded-2xl overflow-hidden mb-5"
                style={{ boxShadow: '0 8px 40px rgba(37,99,235,0.25)' }}
                onTouchStart={(e) => { bannerTouchStartX.current = e.touches[0].clientX }}
                onTouchEnd={(e) => {
                  bannerTouchEndX.current = e.changedTouches[0].clientX
                  const diff = bannerTouchStartX.current - bannerTouchEndX.current
                  if (Math.abs(diff) > 50) {
                    if (diff > 0) setBannerIndex(prev => (prev + 1) % 5)
                    else setBannerIndex(prev => (prev - 1 + 5) % 5)
                    if (bannerTimerRef.current) clearInterval(bannerTimerRef.current)
                    bannerTimerRef.current = setInterval(() => setBannerIndex(prev => (prev + 1) % 5), 4000)
                  }
                }}
              >
                {/* Slides */}
                <div className="relative w-full h-48 md:h-64">
                  {[
                    {
                      img: '/banner-beranda-hero.png',
                      overlay: 'linear-gradient(135deg, rgba(12,26,46,0.92) 0%, rgba(30,58,95,0.75) 35%, rgba(37,99,235,0.35) 100%)',
                      badge: null,
                      title: 'Investasi Cerdas,',
                      titleAccent: 'Profit Maksimal',
                      desc: 'Platform saham digital terpercaya dengan profit harian hingga 7% & sinyal trading real-time.',
                      btns: [
                        { label: 'Mulai Investasi', icon: <BarChart3 className="w-3.5 h-3.5" />, action: () => setActiveTab('market'), style: 'primary' as const },
                        { label: 'Sinyal Pro', icon: <Target className="w-3.5 h-3.5" />, action: () => setActiveTab('sinyal'), style: 'ghost' as const },
                      ],
                      live: true,
                    },
                    {
                      img: '/banner-sinyal-pro.png',
                      overlay: 'linear-gradient(135deg, rgba(8,15,30,0.93) 0%, rgba(6,182,212,0.55) 100%)',
                      badge: { icon: <Target className="w-4 h-4 text-cyan-300" />, text: 'SINYAL PRO' },
                      title: 'Trading Cerdas',
                      titleAccent: 'Payout 93%',
                      desc: 'Prediksi arah harga saham real-time dengan candlestick chart profesional.',
                      btns: [
                        { label: 'Mulai Trading', icon: <ArrowRight className="w-3 h-3" />, action: () => setActiveTab('sinyal'), style: 'primary' as const },
                      ],
                      live: true,
                    },
                    {
                      img: '/banner-investasi-promo.png',
                      overlay: 'linear-gradient(135deg, rgba(15,23,42,0.92) 0%, rgba(180,83,9,0.5) 100%)',
                      badge: { icon: <Gem className="w-4 h-4 text-amber-300" />, text: 'INVESTASI PRO' },
                      title: 'Profit Harian',
                      titleAccent: 'Hingga 7%',
                      desc: 'Kontrak saham premium dengan profit otomatis setiap 00:00 WIB.',
                      btns: [
                        { label: 'Mulai Investasi', icon: <ArrowRight className="w-3 h-3" />, action: () => setActiveTab('investasi'), style: 'primary' as const },
                      ],
                      live: false,
                    },
                    {
                      img: '/banner-undang-bonus.png',
                      overlay: 'linear-gradient(135deg, rgba(12,26,46,0.92) 0%, rgba(124,58,237,0.5) 100%)',
                      badge: { icon: <UserPlus className="w-4 h-4 text-violet-300" />, text: 'UNDANG TEMAN' },
                      title: 'Bonus Referral',
                      titleAccent: 'Tanpa Batas',
                      desc: 'Undang teman dan dapatkan bonus untuk setiap pendaftaran baru.',
                      btns: [
                        { label: 'Undang Sekarang', icon: <ArrowRight className="w-3 h-3" />, action: () => setActiveTab('undang'), style: 'primary' as const },
                      ],
                      live: false,
                    },
                    {
                      img: '/banner-daily-check.png',
                      overlay: 'linear-gradient(135deg, rgba(12,26,46,0.93) 0%, rgba(245,158,11,0.45) 100%)',
                      badge: { icon: <CalendarDays className="w-4 h-4 text-yellow-300" />, text: 'CEK HARIAN' },
                      title: 'Klaim Bonus',
                      titleAccent: 'Setiap Hari',
                      desc: dailyCheckStatus.streak > 0 ? `🔥 ${dailyCheckStatus.streak} Hari Berturut-turut!` : 'Klaim bonus harian Anda dan tingkatkan streak.',
                      btns: dailyCheckStatus.canCheckToday
                        ? [{ label: dailyCheckLoading ? '' : 'Klaim Sekarang', icon: dailyCheckLoading ? <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Gift className="w-3.5 h-3.5" />, action: handleDailyCheck, style: 'gold' as const }]
                        : [],
                      live: false,
                      dailyCheck: true,
                    },
                  ].map((slide, i) => (
                    <div
                      key={i}
                      className="absolute inset-0 transition-all duration-700 ease-in-out"
                      style={{ opacity: bannerIndex === i ? 1 : 0, transform: bannerIndex === i ? 'scale(1)' : 'scale(1.05)' }}
                    >
                      <img src={slide.img} alt={slide.titleAccent} className="w-full h-full object-cover" />
                      <div className="absolute inset-0" style={{ background: slide.overlay }} />
                      <div className="absolute inset-0 flex flex-col justify-center px-5 py-4">
                        {/* Live badge */}
                        {slide.live && (
                          <div className="absolute top-3 right-3 flex items-center gap-1.5 h-5 px-2.5 rounded-full bg-green-500/20 border border-green-400/30 backdrop-blur-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            <span className="text-[7px] font-black text-green-300 tracking-wider">LIVE</span>
                          </div>
                        )}
                        {/* Badge */}
                        {slide.badge && (
                          <div className="flex items-center gap-1.5 mb-2">
                            <div className="w-7 h-7 rounded-lg bg-white/15 border border-white/10 grid place-items-center backdrop-blur-sm">{slide.badge.icon}</div>
                            <span className="text-[9px] font-black tracking-[0.15em] uppercase text-white/90">{slide.badge.text}</span>
                          </div>
                        )}
                        {/* Zevorix brand on first slide */}
                        {i === 0 && (
                          <div className="flex items-center gap-2 mb-2">
                            <ZevorixLogo size={28} />
                            <span className="text-[8px] font-black tracking-[0.2em] uppercase text-blue-300/80">ZEVORIX</span>
                          </div>
                        )}
                        <h2 className="text-[17px] md:text-[22px] font-black text-white leading-tight mb-1 drop-shadow-lg">{slide.title}<br /><span className="gradient-text">{slide.titleAccent}</span></h2>
                        <p className="text-[9px] md:text-[11px] text-white/70 font-medium mb-3 max-w-[260px] leading-relaxed">{slide.desc}</p>
                        {slide.btns.length > 0 && (
                          <div className="flex items-center gap-2">
                            {slide.btns.map((btn, bi) => (
                              <button
                                key={bi}
                                onClick={btn.action}
                                disabled={slide.dailyCheck && dailyCheckLoading}
                                className={`h-8 px-4 rounded-xl text-[9px] font-bold flex items-center gap-1.5 transition-all active:scale-[0.96] ${
                                  btn.style === 'primary' ? 'bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white hover:from-[#60a5fa] hover:to-[#3b82f6] shadow-lg shadow-blue-500/30' :
                                  btn.style === 'gold' ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 hover:from-yellow-300 hover:to-amber-400 shadow-lg shadow-yellow-500/30 disabled:opacity-60' :
                                  'bg-white/10 border border-white/20 text-white hover:bg-white/20 backdrop-blur-sm'
                                }`}
                              >
                                {btn.icon}{btn.label}
                              </button>
                            ))}
                          </div>
                        )}
                        {/* Daily check reward display */}
                        {slide.dailyCheck && dailyCheckReward !== null && (
                          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                            className="mt-2 rounded-xl p-2 bg-yellow-500/20 border border-yellow-400/30 backdrop-blur-sm text-center">
                            <span className="text-[8px] text-yellow-200 font-bold">Bonus Hari Ini</span>
                            <b className="block text-sm font-black text-yellow-300">{formatRupiah(dailyCheckReward)}</b>
                          </motion.div>
                        )}
                        {slide.dailyCheck && !dailyCheckStatus.canCheckToday && dailyCheckReward === null && dailyCheckStatus.todayReward > 0 && (
                          <div className="mt-2 rounded-xl p-2 bg-white/10 border border-white/15 backdrop-blur-sm text-center">
                            <span className="text-[8px] text-white/70 font-bold">Bonus Hari Ini</span>
                            <b className="block text-sm font-black text-yellow-300">{formatRupiah(dailyCheckStatus.todayReward)}</b>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Dot Indicators */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
                  {[0,1,2,3,4].map(i => (
                    <button
                      key={i}
                      onClick={() => { setBannerIndex(i); if (bannerTimerRef.current) clearInterval(bannerTimerRef.current); bannerTimerRef.current = setInterval(() => setBannerIndex(prev => (prev + 1) % 5), 4000) }}
                      className="transition-all duration-300 rounded-full"
                      style={{
                        width: bannerIndex === i ? 24 : 8,
                        height: 8,
                        background: bannerIndex === i ? 'linear-gradient(90deg, #3b82f6, #06b6d4)' : 'rgba(255,255,255,0.5)',
                        boxShadow: bannerIndex === i ? '0 0 8px rgba(59,130,246,0.5)' : 'none',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* ══════════ PREMIUM WALLET CARD ══════════ */}
              <div className="relative rounded-2xl overflow-hidden mb-5 border border-blue-500/20" style={{ background: 'linear-gradient(145deg, #0c1a2e 0%, #1e3a5f 40%, #2563eb 100%)', boxShadow: '0 6px 32px rgba(37,99,235,0.22)' }}>
                {/* Decorative dots */}
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-blue-400/10 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-cyan-400/8 blur-3xl" />
                <div className="relative p-4 text-white">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 grid place-items-center backdrop-blur-sm">
                        <Wallet className="w-5 h-5 text-yellow-300" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black tracking-wider block">RINGKASAN SALDO</span>
                          {isDemo && (
                            <div className="h-4 px-1.5 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                              <span className="text-[6px] font-black text-amber-300">DEMO</span>
                            </div>
                          )}
                        </div>
                        <span className="text-[7px] font-bold text-blue-300/70">Selamat datang, {user?.name?.split(' ')[0]}</span>
                      </div>
                    </div>
                    <button onClick={() => setShowBalance(!showBalance)} className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 grid place-items-center text-white/60 hover:text-white hover:bg-white/20 transition-all">
                      {showBalance ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Main Balance — includes live P&L from active trading positions */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-bold text-blue-200/60 uppercase tracking-widest">{isDemo ? 'Saldo Virtual' : 'Total Saldo'}</span>
                      {sinyalPositions.filter(p => p.status === 'active').length > 0 && (
                        <div className="h-4 px-2 rounded-full bg-red-400/20 border border-red-400/30 flex items-center gap-1 animate-pulse">
                          <Zap className="w-2.5 h-2.5 text-red-300" />
                          <span className="text-[7px] font-black text-red-300 tracking-wide">LIVE</span>
                        </div>
                      )}
                      {isDemo && (
                        <div className="h-4 px-2 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                          <span className="text-[7px] font-black text-amber-300 tracking-wide">DEMO</span>
                        </div>
                      )}
                    </div>
                    <b className={`block text-[24px] md:text-[28px] font-black tracking-tight transition-colors duration-300 ${
                      sinyalPositions.filter(p => p.status === 'active').length > 0
                        ? (() => {
                            const totalPL = sinyalPositions.filter(p => p.status === 'active').reduce((s, p) => s + getPositionLivePL(p), 0)
                            return totalPL > 0 ? 'text-green-400' : totalPL < 0 ? 'text-red-400' : ''
                          })()
                        : ''
                    }`}>{showBalance ? formatRupiah(liveBalance + (user?.withdrawalBalance || 0)) : '••••••••••'}</b>
                    {sinyalPositions.filter(p => p.status === 'active').length > 0 && (() => {
                      const totalPL = sinyalPositions.filter(p => p.status === 'active').reduce((s, p) => s + getPositionLivePL(p), 0)
                      const totalFee = sinyalPositions.filter(p => p.status === 'active').reduce((s, p) => s + (p.fee || Math.round(p.amount * 0.1)), 0)
                      return (
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className={`text-[8px] font-bold ${totalPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            P&L: {totalPL >= 0 ? '+' : ''}{formatRupiah(totalPL)}
                          </span>
                          <span className="text-[8px] font-bold text-red-400/60">
                            Fee: -{formatRupiah(totalFee)}
                          </span>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Dual Wallets — Dompet Utama shows live balance */}
                  {!isDemo && (
                  <div className="grid grid-cols-2 gap-2.5 mb-4">
                    <div className="rounded-xl p-3 bg-white/8 border border-white/12 backdrop-blur-sm">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-5 h-5 rounded-lg bg-yellow-400/20 grid place-items-center"><Wallet className="w-3 h-3 text-yellow-300" /></div>
                        <span className="text-[7px] font-black text-blue-200/80 uppercase tracking-wider">Dompet Utama</span>
                        {sinyalPositions.filter(p => p.status === 'active').length > 0 && (
                          <Zap className="w-2.5 h-2.5 text-red-400 animate-pulse" />
                        )}
                      </div>
                      <b className={`block text-[14px] font-black ${sinyalPositions.filter(p => p.status === 'active').length > 0 ? (() => {
                        const totalPL = sinyalPositions.filter(p => p.status === 'active').reduce((s, p) => s + getPositionLivePL(p), 0)
                        return totalPL < 0 ? 'text-red-400' : totalPL > 0 ? 'text-green-400' : ''
                      })() : ''}`}>{showBalance ? formatRupiah(liveBalance) : '••••••'}</b>
                      <span className="block text-[6px] font-semibold text-blue-200/40 mt-0.5">Deposit & trading{sinyalPositions.filter(p => p.status === 'active').length > 0 ? ' (ikut grafik)' : ''}</span>
                    </div>
                    <div className="rounded-xl p-3 bg-white/8 border border-white/12 backdrop-blur-sm">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-5 h-5 rounded-lg bg-blue-400/20 grid place-items-center"><CreditCard className="w-3 h-3 text-blue-300" /></div>
                        <span className="text-[7px] font-black text-blue-200/80 uppercase tracking-wider">Penarikan</span>
                      </div>
                      <b className="block text-[14px] font-black">{showBalance ? formatRupiah(user?.withdrawalBalance || 0) : '••••••'}</b>
                      <span className="block text-[6px] font-semibold text-blue-200/40 mt-0.5">Dapat ditarik</span>
                    </div>
                  </div>
                  )}

                  {/* Demo Balance Request (only for demo accounts) */}
                  {isDemo && (
                  <div className="rounded-xl p-3 bg-amber-400/10 border border-amber-400/20 backdrop-blur-sm mb-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span className="text-[9px] font-black text-amber-200 uppercase tracking-wider">Request Saldo Demo</span>
                    </div>
                    <div className="flex gap-2">
                      <input type="number" value={demoRequestAmount} onChange={(e) => setDemoRequestAmount(e.target.value)} placeholder="Jumlah saldo"
                        className="flex-1 h-9 rounded-xl bg-white/10 border border-white/15 px-3 text-[12px] font-semibold text-white outline-none focus:border-amber-400/50 placeholder:text-white/30" />
                      <button onClick={handleDemoBalanceRequest} disabled={demoRequestLoading}
                        className="h-9 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 text-[9px] font-black hover:from-amber-300 hover:to-amber-400 transition-all disabled:opacity-60 flex items-center gap-1.5">
                        {demoRequestLoading ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <><Plus className="w-3.5 h-3.5" />Tambah</>}
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 mt-2">
                      {['10000000', '50000000', '100000000', '500000000'].map(a => (
                        <button key={a} onClick={() => setDemoRequestAmount(a)} className="h-7 rounded-lg bg-white/8 border border-white/10 text-[7px] font-bold text-amber-200 hover:bg-amber-400/20 hover:border-amber-400/30 transition-all">
                          {parseFloat(a) >= 1e6 ? `${(parseFloat(a) / 1e6).toFixed(0)}jt` : `${(parseFloat(a) / 1e3).toFixed(0)}rb`}
                        </button>
                      ))}
                    </div>
                  </div>
                  )}

                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    {isDemo ? (
                      <>
                        <button onClick={() => setActiveTab('finance')} className="h-10 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 text-[9px] font-bold hover:from-amber-300 hover:to-amber-400 transition-all flex items-center justify-center gap-1 shadow-lg shadow-amber-500/25 active:scale-[0.97]">
                          <Sparkles className="w-3.5 h-3.5" />Saldo
                        </button>
                        <button disabled className="h-10 rounded-xl bg-white/5 border border-white/10 text-white/30 text-[9px] font-bold flex items-center justify-center gap-1 cursor-not-allowed">
                          <Minus className="w-3.5 h-3.5" />Tarik
                        </button>
                        <button onClick={() => setActiveTab('investasi')} className="h-10 rounded-xl bg-white/12 border border-white/20 text-white text-[9px] font-bold hover:bg-white/20 transition-all flex items-center justify-center gap-1 backdrop-blur-sm active:scale-[0.97]">
                          <Briefcase className="w-3.5 h-3.5" />Investasi
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setActiveTab('finance')} className="h-10 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 text-[9px] font-bold hover:from-yellow-300 hover:to-amber-400 transition-all flex items-center justify-center gap-1 shadow-lg shadow-yellow-500/25 active:scale-[0.97]">
                          <Plus className="w-3.5 h-3.5" />Deposit
                        </button>
                        <button onClick={() => setActiveTab('finance')} className="h-10 rounded-xl bg-white/12 border border-white/20 text-white text-[9px] font-bold hover:bg-white/20 transition-all flex items-center justify-center gap-1 backdrop-blur-sm active:scale-[0.97]">
                          <Minus className="w-3.5 h-3.5" />Tarik
                        </button>
                        <button onClick={() => setActiveTab('investasi')} className="h-10 rounded-xl bg-white/12 border border-white/20 text-white text-[9px] font-bold hover:bg-white/20 transition-all flex items-center justify-center gap-1 backdrop-blur-sm active:scale-[0.97]">
                          <Briefcase className="w-3.5 h-3.5" />Investasi
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* ══════════ QUICK ACCESS MENU ══════════ */}
              <div className="mb-5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, #3b82f6, #06b6d4)' }} />
                  <h3 className="text-[12px] md:text-sm font-black gradient-text">Akses Cepat</h3>
                </div>
                <div className="grid grid-cols-4 gap-2.5">
                  {[
                    { icon: <Target className="w-5 h-5" />, label: 'Sinyal Pro', desc: 'Trading', action: () => setActiveTab('sinyal'), iconBg: 'bg-blue-500/15', iconColor: 'text-blue-400', glow: 'rgba(59,130,246,0.08)' },
                    { icon: <BarChart3 className="w-5 h-5" />, label: 'Pasar', desc: 'Saham', action: () => setActiveTab('market'), iconBg: 'bg-cyan-500/15', iconColor: 'text-cyan-400', glow: 'rgba(6,182,212,0.08)' },
                    { icon: <DollarSign className="w-5 h-5" />, label: 'Investasi', desc: 'Profit 7%', action: () => setActiveTab('investasi'), iconBg: 'bg-amber-500/15', iconColor: 'text-amber-400', glow: 'rgba(245,158,11,0.08)' },
                    { icon: <UserPlus className="w-5 h-5" />, label: 'Undang', desc: 'Bonus', action: () => setActiveTab('undang'), iconBg: 'bg-violet-500/15', iconColor: 'text-violet-400', glow: 'rgba(139,92,246,0.08)' },
                  ].map((a, i) => (
                    <button key={i} onClick={a.action} className="stock-card flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl bg-[var(--zv-surface)] border border-[var(--zv-border)] hover:border-[#3b82f6]/30 hover:shadow-lg transition-all active:scale-[0.96]" style={{ boxShadow: `0 4px 20px ${a.glow}` }}>
                      <div className={`w-11 h-11 rounded-xl ${a.iconBg} grid place-items-center ${a.iconColor}`}>{a.icon}</div>
                      <span className="text-[8px] md:text-[9px] font-black text-[var(--zv-text)]">{a.label}</span>
                      <span className="text-[6px] font-bold text-[var(--zv-muted)]">{a.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ══════════ DAILY CHECK BANNER (full-width) ══════════ */}
              <div className="rounded-2xl overflow-hidden mb-5 border border-blue-500/15 relative" style={{ background: 'linear-gradient(145deg, #0c1a2e 0%, #1e3a5f 54%, #2563eb 100%)', boxShadow: '0 4px 24px rgba(37,99,235,0.18)' }}>
                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }} />
                <div className="absolute top-0 right-0 w-28 h-28 rounded-full bg-yellow-400/8 blur-2xl" />
                <div className="relative p-4 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/10 grid place-items-center backdrop-blur-sm">
                        <CalendarDays className="w-5 h-5 text-yellow-300" />
                      </div>
                      <div>
                        <b className="text-[12px] font-black">CEK HARIAN</b>
                        <span className="block text-[8px] font-semibold text-blue-200">
                          {dailyCheckStatus.streak > 0 ? `🔥 ${dailyCheckStatus.streak} Hari Berturut-turut` : 'Klaim bonus harian Anda'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 h-6 px-2.5 rounded-full bg-white/8 border border-white/10">
                      <Flame className="w-3 h-3 text-orange-400" />
                      <span className="text-[8px] font-black text-orange-300">{dailyCheckStatus.streak}</span>
                    </div>
                  </div>
                  {dailyCheckStatus.canCheckToday ? (
                    <button onClick={handleDailyCheck} disabled={dailyCheckLoading}
                      className="w-full h-10 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 text-[10px] font-bold hover:from-yellow-300 hover:to-yellow-400 transition-all disabled:opacity-60 flex items-center justify-center gap-1.5 shadow-lg shadow-yellow-500/25">
                      {dailyCheckLoading ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <><Gift className="w-4 h-4" />Klaim Sekarang</>}
                    </button>
                  ) : (
                    <div className="w-full h-10 rounded-xl bg-white/15 border border-white/10 text-[10px] font-bold flex items-center justify-center gap-1.5 backdrop-blur-sm">
                      <CheckCircle className="w-4 h-4 text-blue-300" />Sudah Dicek Hari Ini
                    </div>
                  )}
                  {dailyCheckReward !== null && (
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                      className="rounded-xl p-2.5 bg-yellow-500/20 border border-yellow-400/30 text-center mt-3 backdrop-blur-sm">
                      <span className="text-[8px] text-yellow-200 font-bold">🎉 Bonus Hari Ini</span>
                      <b className="block text-[16px] font-black text-yellow-300">{formatRupiah(dailyCheckReward)}</b>
                    </motion.div>
                  )}
                  {!dailyCheckStatus.canCheckToday && dailyCheckReward === null && dailyCheckStatus.todayReward > 0 && (
                    <div className="rounded-xl p-2.5 bg-white/10 border border-white/15 text-center mt-3 backdrop-blur-sm">
                      <span className="text-[8px] text-blue-200 font-bold">Bonus Hari Ini</span>
                      <b className="block text-[16px] font-black text-yellow-300">{formatRupiah(dailyCheckStatus.todayReward)}</b>
                    </div>
                  )}
                </div>
              </div>

              {/* ══════════ PORTFOLIO OVERVIEW ══════════ */}
              <div className="rounded-2xl overflow-hidden mb-5 border border-[var(--zv-border)] relative" style={{ background: 'var(--zv-panel)', boxShadow: '0 4px 20px rgba(37,99,235,0.1)' }}>
                <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #3b82f6, #06b6d4, transparent)' }} />
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, #3b82f6, #06b6d4)' }} />
                      <h3 className="text-[12px] font-black gradient-text">Portofolio & Investasi</h3>
                    </div>
                    <button onClick={() => setActiveTab('portfolio')} className="text-[8px] font-bold text-[#3b82f6] hover:underline flex items-center gap-0.5">Selengkapnya <ChevronRight className="w-3 h-3" /></button>
                  </div>

                  {/* Portfolio Stats Row */}
                  <div className="grid grid-cols-3 gap-2.5 mb-3">
                    <div className="rounded-xl p-2.5 bg-[var(--zv-surface)] border border-[var(--zv-border)]" style={{ boxShadow: '0 2px 8px rgba(37,99,235,0.05)' }}>
                      <span className="text-[7px] font-bold text-[var(--zv-muted)] uppercase tracking-wider">Investasi</span>
                      <b className="block text-[11px] font-black text-[#3b82f6]">{showBalance ? formatRupiah(portfolioSummary.totalCurrentValue) : '••••'}</b>
                    </div>
                    <div className="rounded-xl p-2.5 bg-[var(--zv-surface)] border border-[var(--zv-border)]" style={{ boxShadow: '0 2px 8px rgba(37,99,235,0.05)' }}>
                      <span className="text-[7px] font-bold text-[var(--zv-muted)] uppercase tracking-wider">Profit/Loss</span>
                      <b className={`block text-[11px] font-black ${portfolioSummary.totalProfitLoss >= 0 ? 'text-[#22c55e]' : 'text-[#ef5350]'}`}>
                        {showBalance ? formatRupiah(Math.abs(portfolioSummary.totalProfitLoss)) : '••••'}
                      </b>
                    </div>
                    <div className="rounded-xl p-2.5 bg-[var(--zv-surface)] border border-[var(--zv-border)]" style={{ boxShadow: '0 2px 8px rgba(37,99,235,0.05)' }}>
                      <span className="text-[7px] font-bold text-[var(--zv-muted)] uppercase tracking-wider">Return</span>
                      <b className={`block text-[11px] font-black ${portfolioSummary.totalProfitLossPercent >= 0 ? 'text-[#22c55e]' : 'text-[#ef5350]'}`}>
                        {portfolioSummary.totalProfitLossPercent >= 0 ? '+' : ''}{portfolioSummary.totalProfitLossPercent.toFixed(1)}%
                      </b>
                    </div>
                  </div>

                  {/* Portfolio Chart */}
                  {portfolio.length > 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--zv-surface)] border border-[var(--zv-border)]" style={{ boxShadow: '0 2px 10px rgba(37,99,235,0.05)' }}>
                      <div className="w-20 h-20 flex-shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <RePieChart><Pie data={portfolioPieData} innerRadius={20} outerRadius={35} paddingAngle={2} dataKey="value">
                            {portfolioPieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                          </Pie></RePieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 space-y-1.5 max-h-20 overflow-y-auto custom-scrollbar">
                        {portfolio.slice(0, 4).map(p => (
                          <div key={p.id} className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: portfolioPieData.find(d => d.name === p.stock.code)?.color }} />
                            <span className="text-[8px] font-black text-[#3b82f6] flex-shrink-0">{p.stock.code}</span>
                            <span className="flex-1" />
                            <span className={`text-[8px] font-black ${p.profitLoss >= 0 ? 'text-[#22c55e]' : 'text-[#ef5350]'}`}>{formatPercent(p.profitLossPercent)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ══════════ TOP MOVERS ══════════ */}
              {stocks.length > 0 && (
                <div className="rounded-2xl p-4 bg-[var(--zv-panel)] border border-[var(--zv-border)] mb-5 relative" style={{ boxShadow: '0 4px 20px rgba(37,99,235,0.1)' }}>
                  <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, #22c55e, transparent, #ef5350)' }} />
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, #22c55e, #ef5350)' }} />
                      <h3 className="text-[12px] font-black gradient-text">Top Movers</h3>
                    </div>
                    <button onClick={() => setActiveTab('market')} className="text-[8px] font-bold text-[#3b82f6] hover:underline flex items-center gap-0.5">Lihat Semua <ChevronRight className="w-3 h-3" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Gainers */}
                    <div className="rounded-xl p-3 bg-[var(--zv-surface)] border border-[var(--zv-border)]" style={{ boxShadow: '0 2px 8px rgba(34,197,94,0.05)' }}>
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <div className="w-6 h-6 rounded-lg bg-green-500/15 grid place-items-center"><TrendingUp className="w-3.5 h-3.5 text-[#22c55e]" /></div>
                        <span className="text-[8px] font-black text-[#22c55e] uppercase tracking-wider">Gainers</span>
                      </div>
                      <div className="space-y-2">
                        {topGainers.slice(0, 3).map(s => (
                          <button key={s.id} onClick={() => openStockDetail(s)} className="w-full flex items-center justify-between py-1 hover:bg-[var(--zv-hover)] rounded-lg px-1.5 transition-colors">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg overflow-hidden bg-[var(--zv-panel)] flex items-center justify-center border border-[var(--zv-border)]">
                                {s.logo ? <img src={s.logo} alt={s.code} className="w-full h-full object-cover" /> : <span className="text-[7px] font-black text-[#22c55e]">{s.code.slice(0, 2)}</span>}
                              </div>
                              <span className="text-[9px] font-bold text-[var(--zv-text)]">{s.code}</span>
                            </div>
                            <span className="text-[8px] font-black text-[#22c55e] bg-green-500/10 px-2 py-0.5 rounded-md">+{s.changePercent.toFixed(2)}%</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Losers */}
                    <div className="rounded-xl p-3 bg-[var(--zv-surface)] border border-[var(--zv-border)]" style={{ boxShadow: '0 2px 8px rgba(239,83,80,0.05)' }}>
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <div className="w-6 h-6 rounded-lg bg-red-500/15 grid place-items-center"><TrendingDown className="w-3.5 h-3.5 text-[#ef5350]" /></div>
                        <span className="text-[8px] font-black text-[#ef5350] uppercase tracking-wider">Losers</span>
                      </div>
                      <div className="space-y-2">
                        {topLosers.slice(0, 3).map(s => (
                          <button key={s.id} onClick={() => openStockDetail(s)} className="w-full flex items-center justify-between py-1 hover:bg-[var(--zv-hover)] rounded-lg px-1.5 transition-colors">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg overflow-hidden bg-[var(--zv-panel)] flex items-center justify-center border border-[var(--zv-border)]">
                                {s.logo ? <img src={s.logo} alt={s.code} className="w-full h-full object-cover" /> : <span className="text-[7px] font-black text-[#ef5350]">{s.code.slice(0, 2)}</span>}
                              </div>
                              <span className="text-[9px] font-bold text-[var(--zv-text)]">{s.code}</span>
                            </div>
                            <span className="text-[8px] font-black text-[#ef5350] bg-red-500/10 px-2 py-0.5 rounded-md">{s.changePercent.toFixed(2)}%</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ══════════ TASKS & REWARDS ══════════ */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                {/* Tugas */}
                <div className="rounded-2xl p-3.5 bg-[var(--zv-panel)] border border-[var(--zv-border)] relative" style={{ boxShadow: '0 4px 20px rgba(37,99,235,0.1)' }}>
                  <div className="absolute top-0 left-4 w-8 h-[2px] rounded-full bg-amber-500/50" />
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/20 grid place-items-center">
                      <ListChecks className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <b className="text-[10px] font-black text-[var(--zv-text)]">Tugas</b>
                      <span className="block text-[7px] font-bold text-[var(--zv-muted)]">{tasks.filter(t => t.completed).length}/{tasks.length} selesai</span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--zv-surface)] overflow-hidden mb-2.5 border border-[var(--zv-border)]">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500" style={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0}%` }} />
                  </div>
                  <button onClick={() => { setTasksLoading(true); fetchTasks().finally(() => setTasksLoading(false)); setShowTasksModal(true) }}
                    className="w-full h-8 rounded-lg bg-amber-500/15 border border-amber-500/20 text-amber-500 text-[8px] font-bold hover:bg-amber-500/25 transition-colors">
                    Lihat Tugas
                  </button>
                </div>
                {/* Cek Harian mini */}
                <div className="rounded-2xl p-3.5 bg-[var(--zv-panel)] border border-[var(--zv-border)] relative" style={{ boxShadow: '0 4px 20px rgba(37,99,235,0.1)' }}>
                  <div className="absolute top-0 left-4 w-8 h-[2px] rounded-full bg-blue-500/50" />
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/20 grid place-items-center">
                      <CalendarDays className="w-4 h-4 text-[#3b82f6]" />
                    </div>
                    <div>
                      <b className="text-[10px] font-black text-[var(--zv-text)]">Cek Harian</b>
                      <span className="block text-[7px] font-bold text-[var(--zv-muted)]">{dailyCheckStatus.streak > 0 ? `${dailyCheckStatus.streak} hari streak` : 'Klaim sekarang'}</span>
                    </div>
                  </div>
                  {dailyCheckStatus.canCheckToday ? (
                    <button onClick={handleDailyCheck} disabled={dailyCheckLoading}
                      className="w-full h-8 rounded-lg bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 text-[8px] font-bold hover:from-yellow-300 hover:to-amber-400 transition-all disabled:opacity-60 shadow-md shadow-yellow-500/20">
                      {dailyCheckLoading ? '...' : 'Klaim Bonus'}
                    </button>
                  ) : (
                    <div className="w-full h-8 rounded-lg bg-[#22c55e]/15 border border-[#22c55e]/20 text-[#22c55e] text-[8px] font-bold flex items-center justify-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />Sudah Dicek
                    </div>
                  )}
                </div>
              </div>

              {/* ══════════ WATCHLIST ══════════ */}
              {watchlist.length > 0 && (
                <div className="rounded-2xl p-4 bg-[var(--zv-panel)] border border-[var(--zv-border)] mb-5 relative" style={{ boxShadow: '0 4px 20px rgba(37,99,235,0.1)' }}>
                  <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #f59e0b, transparent)' }} />
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-5 rounded-full bg-[#f59e0b]" />
                      <h3 className="text-[12px] font-black gradient-text">Watchlist</h3>
                    </div>
                    <Star className="w-4 h-4 text-[#f59e0b]" />
                  </div>
                  <div className="space-y-1.5">
                    {watchlist.slice(0, 4).map(w => (
                      <button key={w.id} onClick={() => openStockDetail(w.stock)} className="w-full flex items-center justify-between py-2 px-2 hover:bg-[var(--zv-hover)] rounded-xl transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-[var(--zv-surface)] flex items-center justify-center border border-[var(--zv-border)]">{w.stock.logo ? <img src={w.stock.logo} alt={w.stock.code} className="w-full h-full object-cover" /> : <span className="text-[7px] font-black text-[#3b82f6]">{w.stock.code.slice(0, 2)}</span>}</div>
                          <div className="text-left">
                            <span className="block text-[9px] font-bold text-[var(--zv-text)]">{w.stock.code}</span>
                            <span className="block text-[7px] text-[var(--zv-muted)]">{w.stock.name.slice(0, 15)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="block text-[9px] font-black text-[var(--zv-text)] tabular-nums">{formatRupiah(w.stock.price)}</span>
                          <span className={`block text-[8px] font-black ${w.stock.changePercent >= 0 ? 'text-[#22c55e]' : 'text-[#ef5350]'}`}>{formatPercent(w.stock.changePercent)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ══════════ RECENT TRANSACTIONS ══════════ */}
              {transactions.length > 0 && (
                <div className="rounded-2xl p-4 bg-[var(--zv-panel)] border border-[var(--zv-border)] mb-5 relative" style={{ boxShadow: '0 4px 20px rgba(37,99,235,0.1)' }}>
                  <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)' }} />
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-5 rounded-full bg-[#3b82f6]" />
                      <h3 className="text-[12px] font-black gradient-text">Transaksi Terakhir</h3>
                    </div>
                    <button onClick={() => setActiveTab('history')} className="text-[8px] font-bold text-[#3b82f6] hover:underline flex items-center gap-0.5">Semua <ChevronRight className="w-3 h-3" /></button>
                  </div>
                  <div className="space-y-2">
                    {transactions.slice(0, 3).map(tx => (
                      <div key={tx.id} className="flex items-center justify-between py-2 px-2 rounded-xl hover:bg-[var(--zv-hover)] transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-xl grid place-items-center ${tx.type === 'BUY' ? 'bg-blue-500/10 border border-blue-500/15' : 'bg-red-500/10 border border-red-500/15'}`}>
                            {tx.type === 'BUY' ? <ArrowDownRight className="w-4 h-4 text-[#3b82f6]" /> : <ArrowUpRight className="w-4 h-4 text-[#ef5350]" />}
                          </div>
                          <div>
                            <span className="block text-[9px] font-bold text-[var(--zv-text)]">{tx.type === 'BUY' ? 'Beli' : 'Jual'} {tx.stock.code}</span>
                            <span className="block text-[7px] text-[var(--zv-muted)]">{formatDateTime(tx.createdAt)}</span>
                          </div>
                        </div>
                        <span className={`text-[10px] font-black ${tx.type === 'BUY' ? 'text-[#ef5350]' : 'text-[#22c55e]'}`}>
                          {tx.type === 'BUY' ? '-' : '+'}{formatRupiah(tx.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ══════════ NEWS ══════════ */}
              {news.length > 0 && (
                <div className="rounded-2xl p-4 bg-[var(--zv-panel)] border border-[var(--zv-border)] mb-5 relative" style={{ boxShadow: '0 4px 20px rgba(37,99,235,0.1)' }}>
                  <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #06b6d4, transparent)' }} />
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-5 rounded-full bg-[#06b6d4]" />
                      <h3 className="text-[12px] font-black gradient-text">Berita Terkini</h3>
                    </div>
                    <button onClick={() => setActiveTab('news')} className="text-[8px] font-bold text-[#3b82f6] hover:underline flex items-center gap-0.5">Semua <ChevronRight className="w-3 h-3" /></button>
                  </div>
                  <div className="space-y-2.5">
                    {news.slice(0, 3).map(n => (
                      <div key={n.id} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[var(--zv-surface)] border border-[var(--zv-border)] hover:border-[#3b82f6]/20 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/15 grid place-items-center flex-shrink-0 mt-0.5">
                          <Newspaper className="w-4 h-4 text-cyan-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="block text-[9px] font-bold text-[var(--zv-text)] leading-snug line-clamp-2">{n.title}</span>
                          <span className="block text-[7px] text-[var(--zv-muted)] mt-1">{formatDate(n.createdAt)} • <span className="text-cyan-500">{n.category}</span></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ══════════ TRUST BADGES ══════════ */}
              <div className="rounded-2xl p-4 bg-[var(--zv-panel)] border border-[var(--zv-border)] relative" style={{ boxShadow: '0 4px 20px rgba(37,99,235,0.1)' }}>
                <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, #3b82f6, #06b6d4, #22c55e, #f59e0b)' }} />
                <div className="flex items-center justify-center gap-5 mb-3.5">
                  {[
                    { icon: <Shield className="w-4.5 h-4.5" />, label: 'Aman', color: 'blue', bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-[#3b82f6]' },
                    { icon: <CheckCircle className="w-4.5 h-4.5" />, label: 'Berlisensi', color: 'amber', bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-500' },
                    { icon: <Lock className="w-4.5 h-4.5" />, label: 'Terenkripsi', color: 'cyan', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-500' },
                    { icon: <Users className="w-4.5 h-4.5" />, label: '125K++', color: 'green', bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-500' },
                  ].map((item, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5">
                      <div className={`w-10 h-10 rounded-xl ${item.bg} border ${item.border} grid place-items-center ${item.text}`}>
                        {item.icon}
                      </div>
                      <span className={`text-[7px] font-black ${item.text}`}>{item.label}</span>
                    </div>
                  ))}
                </div>
                <p className="text-center text-[7px] font-black text-[var(--zv-muted)] tracking-wider uppercase">ZEVORIX • Aset Saham Terdaftar & Diawasi • V2.0</p>
              </div>

            </motion.div>
          )}

          {/* ====== MARKET TAB - PASAR SAHAM SIGNALS ====== */}
          {activeTab === 'market' && (
            <motion.div key="market" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>

              {/* Header - Dark Trading App Style */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-[16px] font-black text-[var(--zv-text)]">Pasar Saham</h2>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[var(--zv-surface)] border border-[var(--zv-border)]">
                      <Wallet className="w-3.5 h-3.5 text-[#f59e0b]" />
                      <span className="text-[10px] font-black text-[#f59e0b]">{formatRupiah(user?.balance || 0)}</span>
                    </div>
                    <button onClick={() => setMarketSearchQuery('')} className="w-8 h-8 rounded-lg bg-[var(--zv-surface)] border border-[var(--zv-border)] grid place-items-center hover:bg-[var(--zv-hover)] transition-colors">
                      <Search className="w-4 h-4 text-[var(--zv-muted)]" />
                    </button>
                  </div>
                </div>

                {/* Category Tabs - Favorit / Paling Ditraded / Top Movers */}
                <div className="flex gap-1 mb-2">
                  {[
                    { key: 'favorit', label: 'Favorit' },
                    { key: 'populer', label: 'Paling Ditraded' },
                    { key: 'top', label: 'Top Movers' },
                  ].map(tab => (
                    <button key={tab.key} onClick={() => setMarketSignalTab(tab.key)}
                      className={`flex-shrink-0 h-8 px-3 rounded-lg text-[10px] font-bold transition-all ${
                        marketSignalTab === tab.key
                          ? 'bg-[#3b82f6] text-white'
                          : 'bg-[var(--zv-surface)] text-[var(--zv-muted)] hover:text-[var(--zv-text)]'
                      }`}>
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Market Type Filter */}
                <div className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                  {(() => {
                    const counts: Record<string, number> = { semua: stocks.length, crypto: 0, forex: 0, komoditas: 0, saham: 0 }
                    stocks.forEach(s => { const c = getMarketCategory(s); if (counts[c] !== undefined) counts[c]++ })
                    return [
                      { key: 'semua', label: 'Semua' },
                      { key: 'crypto', label: '🪙 Kripto' },
                      { key: 'forex', label: '💱 Forex' },
                      { key: 'komoditas', label: '🛢️ Komoditas' },
                      { key: 'saham', label: '📊 Saham' },
                    ].map(cat => (
                      <button key={cat.key} onClick={() => setMarketFavFilter(cat.key)}
                        className={`flex-shrink-0 h-7 px-3 rounded-full text-[9px] font-bold transition-all ${
                          marketFavFilter === cat.key
                            ? 'bg-[var(--zv-text)] text-[var(--zv-background)]'
                            : 'bg-[var(--zv-surface)] text-[var(--zv-muted)] hover:text-[var(--zv-text)] border border-[var(--zv-border)]'
                        }`}>
                        {cat.label} <span className="opacity-60">{counts[cat.key] || 0}</span>
                      </button>
                    ))
                  })()}
                </div>
              </div>

              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--zv-muted)]" />
                <input
                  type="text"
                  value={marketSearchQuery}
                  onChange={(e) => setMarketSearchQuery(e.target.value)}
                  placeholder="Cari instrumen..."
                  className="w-full h-9 pl-9 pr-3 rounded-xl bg-[var(--zv-surface)] border border-[var(--zv-border)] text-[11px] text-[var(--zv-text)] placeholder:text-[var(--zv-muted)] focus:outline-none focus:border-[#3b82f6]/50 transition-colors"
                />
                {marketSearchQuery && (
                  <button onClick={() => setMarketSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[var(--zv-border)] grid place-items-center">
                    <X className="w-3 h-3 text-[var(--zv-muted)]" />
                  </button>
                )}
              </div>

              {/* Instrument List - Vertical Cards */}
              {(() => {
                // Filter by search
                let filteredMarketStocks = stocks.filter(s => {
                  const q = marketSearchQuery.toLowerCase()
                  if (q && !s.code.toLowerCase().includes(q) && !s.name.toLowerCase().includes(q)) return false
                  return true
                })

                // Filter by market category
                if (marketFavFilter !== 'semua') {
                  filteredMarketStocks = filteredMarketStocks.filter(s => getMarketCategory(s) === marketFavFilter)
                }

                // Filter/sort by tab
                if (marketSignalTab === 'favorit') {
                  if (favorites.size === 0) {
                    // Show all when no favorites yet
                  } else {
                    filteredMarketStocks = filteredMarketStocks.filter(s => favorites.has(s.code))
                  }
                } else if (marketSignalTab === 'populer') {
                  filteredMarketStocks = [...filteredMarketStocks].sort((a, b) => b.volume - a.volume)
                } else if (marketSignalTab === 'top') {
                  filteredMarketStocks = [...filteredMarketStocks].sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
                }

                const formatPrice = (s: Stock) => {
                  const mcat = getMarketCategory(s)
                  if (mcat === 'forex') return s.price.toFixed(4)
                  if (mcat === 'crypto') {
                    if (s.price >= 1000000) return formatRupiah(s.price)
                    return '$' + s.price.toLocaleString()
                  }
                  return formatRupiah(s.price)
                }

                return (
                  <div className="space-y-1.5">
                    {/* Results count */}
                    <div className="flex items-center justify-between px-1 mb-1">
                      <span className="text-[9px] font-bold text-[var(--zv-muted)]">{filteredMarketStocks.length} instrumen</span>
                      {marketSignalTab === 'favorit' && favorites.size > 0 && (
                        <span className="text-[9px] font-bold text-[#f59e0b]">{favorites.size} favorit</span>
                      )}
                    </div>

                    <div className="max-h-[calc(100vh-320px)] overflow-y-auto space-y-1.5 pr-0.5" style={{ scrollbarWidth: 'thin' }}>
                      {filteredMarketStocks.map(s => {
                        const isUp = s.changePercent >= 0
                        const sparkData = getSparklineData(s)
                        const sparkColor = isUp ? '#22c55e' : '#ef5350'
                        const mcat = getMarketCategory(s)
                        const isFav = favorites.has(s.code)

                        return (
                          <div key={s.id}
                            className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-[var(--zv-panel)] border border-[var(--zv-border)] hover:border-[#3b82f6]/30 hover:bg-[var(--zv-hover)] transition-all active:scale-[0.99] cursor-pointer group"
                            onClick={() => { setSelectedSinyalStock(s); setActiveTab('sinyal') }}>
                            
                            {/* Logo */}
                            <div className="flex-shrink-0" onClick={(e) => { e.stopPropagation() }}>
                              {getInstrumentLogo(s.code, 36)}
                            </div>

                            {/* Name + Description */}
                            <div className="flex-1 min-w-0 text-left">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[12px] font-black text-[var(--zv-text)]">{s.code}</span>
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                                  mcat === 'crypto' ? 'bg-orange-500/10 text-orange-400' :
                                  mcat === 'forex' ? 'bg-blue-500/10 text-blue-400' :
                                  mcat === 'komoditas' ? 'bg-amber-500/10 text-amber-400' :
                                  'bg-emerald-500/10 text-emerald-400'
                                }`}>
                                  {mcat === 'crypto' ? 'KRIPTO' : mcat === 'forex' ? 'FOREX' : mcat === 'komoditas' ? 'KOMODITAS' : 'SAHAM'}
                                </span>
                              </div>
                              <span className="block text-[9px] text-[var(--zv-muted)] truncate">{s.name}</span>
                            </div>

                            {/* Mini Sparkline */}
                            <div className="flex-shrink-0 w-16 h-8 hidden sm:block">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={sparkData.slice(-15)} margin={{ top: 1, right: 0, bottom: 1, left: 0 }}>
                                  <defs>
                                    <linearGradient id={`ml-${s.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                      <stop offset="0%" stopColor={sparkColor} stopOpacity="0.3" />
                                      <stop offset="100%" stopColor={sparkColor} stopOpacity="0" />
                                    </linearGradient>
                                  </defs>
                                  <Area type="monotone" dataKey="p" stroke={sparkColor} fill={`url(#ml-${s.id})`} strokeWidth={1.5} dot={false} />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>

                            {/* Price + Change */}
                            <div className="flex-shrink-0 text-right">
                              <span className="block text-[12px] font-black text-[var(--zv-text)] tabular-nums">{formatPrice(s)}</span>
                              <span className={`flex items-center justify-end gap-0.5 text-[10px] font-bold ${isUp ? 'text-[#22c55e]' : 'text-[#ef5350]'}`}>
                                {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {isUp ? '+' : ''}{s.changePercent.toFixed(2)}%
                              </span>
                            </div>

                            {/* Favorite star */}
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleFavorite(s.code) }}
                              className="flex-shrink-0 w-7 h-7 rounded-lg grid place-items-center hover:bg-[var(--zv-surface)] transition-colors"
                            >
                              <Star className={`w-3.5 h-3.5 transition-colors ${isFav ? 'fill-[#f59e0b] text-[#f59e0b]' : 'text-[var(--zv-muted)] group-hover:text-[#f59e0b]'}`} />
                            </button>
                          </div>
                        )
                      })}
                    </div>

                    {filteredMarketStocks.length === 0 && (
                      <div className="text-center py-8">
                        <BarChart3 className="w-10 h-10 text-[var(--zv-muted)] mx-auto mb-2" />
                        <p className="text-[11px] font-bold text-[var(--zv-muted)]">Tidak ada instrumen ditemukan</p>
                        {marketSignalTab === 'favorit' && favorites.size === 0 && (
                          <p className="text-[9px] text-[var(--zv-muted)] mt-1">Tap ⭐ untuk menambahkan favorit</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })()}
            </motion.div>
          )}

          {/* ====== PORTFOLIO TAB ====== */}
          {activeTab === 'portfolio' && (
            <motion.div key="portfolio" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {/* Portfolio Value Card */}
              <div className="rounded-2xl overflow-hidden mb-4 border border-blue-600/20" style={{ background: 'linear-gradient(145deg, #0c1a2e 0%, #1e3a5f 54%, #2563eb 100%)', boxShadow: '0 4px 24px rgba(37,99,235,0.15)' }}>
                <div className="p-4 text-white relative">
                  <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                  <span className="text-[9px] font-medium text-blue-200">Nilai Portofolio</span>
                  <b className="block text-2xl font-black mt-0.5">{formatRupiah(portfolioSummary.totalCurrentValue)}</b>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold ${portfolioSummary.totalProfitLoss >= 0 ? 'text-blue-300' : 'text-red-300'}`}>
                      {formatRupiah(portfolioSummary.totalProfitLoss)} ({formatPercent(portfolioSummary.totalProfitLossPercent)})
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="rounded-2xl p-2.5 bg-white/10 border border-white/15">
                      <span className="text-[7px] text-blue-200">Investasi</span>
                      <b className="block text-[11px] font-black mt-0.5">{formatRupiah(portfolioSummary.totalInvested)}</b>
                    </div>
                    <div className="rounded-2xl p-2.5 bg-white/10 border border-white/15">
                      <span className="text-[7px] text-blue-200">Saldo</span>
                      <b className="block text-[11px] font-black mt-0.5">{formatRupiah(portfolioSummary.cashBalance)}</b>
                    </div>
                  </div>
                </div>
              </div>

              {/* Holdings */}
              <h3 className="text-[11px] md:text-sm font-black text-[#3b82f6] mb-2">Saham Dimiliki</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
                {portfolio.map(p => (
                  <div key={p.id} className="rounded-2xl p-3 md:p-4 bg-[var(--zv-panel)] border border-[var(--zv-border)] transition-all hover:border-[#3b82f6]/30 hover:shadow-lg hover:shadow-blue-500/5">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 cursor-pointer" onClick={() => openStockDetail(p.stock)}>
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer ${p.profitLoss >= 0 ? 'bg-[var(--zv-surface)]' : 'bg-[var(--zv-surface)]'}`}>{p.stock.logo ? <img src={p.stock.logo} alt={p.stock.code} className="w-full h-full object-cover" /> : <span className={`text-[8px] md:text-[10px] font-black ${p.profitLoss >= 0 ? 'text-[#22c55e]' : 'text-[#ef5350]'}`}>{p.stock.code.slice(0, 2)}</span>}</div>
                        <div>
                          <span className="block text-[10px] md:text-xs font-black text-[var(--zv-text)]">{p.stock.code}</span>
                          <span className="block text-[7px] md:text-[8px] text-[var(--zv-muted)]">{formatRupiah(p.currentValue)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] md:text-xs font-black text-[var(--zv-text)] tabular-nums">{formatRupiah(p.currentValue)}</span>
                        <span className={`block text-[9px] md:text-[10px] font-bold ${p.profitLoss >= 0 ? 'text-[#22c55e]' : 'text-[#ef5350]'}`}>
                          {formatRupiah(p.profitLoss)} ({formatPercent(p.profitLossPercent)})
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => openContract(p.stock)} className="flex-1 h-7 md:h-8 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white text-[8px] md:text-[9px] font-bold flex items-center justify-center gap-1 shadow-sm shadow-blue-500/20"><Package className="w-3 h-3" />Kontrak</button>
                    </div>
                  </div>
                ))}
                {portfolio.length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <Briefcase className="w-10 h-10 text-[var(--zv-muted)] mx-auto mb-2" />
                    <p className="text-[11px] md:text-sm font-bold text-[var(--zv-muted)]">Belum ada saham di portofolio</p>
                    <button onClick={() => setActiveTab('market')} className="mt-2 h-8 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white text-[9px] md:text-[10px] font-bold shadow-md shadow-blue-500/20">Mulai Investasi</button>
                  </div>
                )}
              </div>

              {/* Active Stock Contracts */}
              {userContracts.filter(c => c.status === 'active').length > 0 && (
                <>
                  <h3 className="text-[11px] md:text-sm font-black text-[#3b82f6] mt-4 mb-2">Kontrak Saham Aktif</h3>
                  <div className="space-y-2">
                    {userContracts.filter(c => c.status === 'active').map(c => {
                      const progress = Math.round((c.daysElapsed / c.duration) * 100)
                      const canClaim = (() => {
                        if (!c.lastClaimAt) return true
                        const now = new Date()
                        const jakartaOffset = 7 * 60 * 60 * 1000
                        const jakartaNow = new Date(now.getTime() + jakartaOffset)
                        const todayStr = `${jakartaNow.getFullYear()}-${jakartaNow.getMonth()}-${jakartaNow.getDate()}`
                        const lastClaimJakarta = new Date(new Date(c.lastClaimAt).getTime() + jakartaOffset)
                        const lastClaimStr = `${lastClaimJakarta.getFullYear()}-${lastClaimJakarta.getMonth()}-${lastClaimJakarta.getDate()}`
                        return todayStr !== lastClaimStr
                      })()
                      return (
                        <div key={c.id} className="rounded-2xl p-3 bg-[var(--zv-panel)] border border-[var(--zv-border)]">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg grid place-items-center bg-[var(--zv-surface)]">
                                <Package className="w-4 h-4 text-[#3b82f6]" />
                              </div>
                              <div>
                                <span className="block text-[10px] md:text-xs font-black text-[var(--zv-text)]">{c.stockCode}</span>
                                <span className="block text-[7px] text-[var(--zv-muted)]">{c.duration} hari • {c.dailyProfitRate}%/hari</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="block text-[10px] font-black text-[var(--zv-text)]">{formatRupiah(c.amount)}</span>
                              <span className="block text-[8px] font-bold text-[#22c55e]">+{formatRupiah(c.dailyProfitAmount)}/hari</span>
                            </div>
                          </div>
                          {/* Progress */}
                          <div className="mb-2">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[7px] font-bold text-[var(--zv-muted)]">Hari {c.daysElapsed}/{c.duration}</span>
                              <span className="text-[7px] font-bold text-[#3b82f6]">{progress}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-[var(--zv-surface)] overflow-hidden">
                              <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[7px] text-[var(--zv-muted)]">Diklaim: {formatRupiah(c.totalClaimed)} / {formatRupiah(c.totalProfit)}</span>
                            <button onClick={() => handleContractClaim(c.id)} disabled={!canClaim || contractClaimLoadingId === c.id}
                              className={`h-7 px-3 rounded-lg text-[8px] font-bold transition-all ${canClaim ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-400 shadow-sm shadow-blue-500/20' : 'bg-[var(--zv-surface)] text-[var(--zv-muted)] cursor-not-allowed'}`}>
                              {contractClaimLoadingId === c.id ? '...' : canClaim ? 'Klaim Profit' : '00:00 WIB'}
                            </button>
                          </div>
                          <div className="flex items-center gap-1 mt-1.5">
                            <Clock className="w-2.5 h-2.5 text-[#3b82f6]" />
                            <span className="text-[7px] text-[#3b82f6]">Profit masuk 00:00 WIB</span>
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
                  <h3 className="text-[11px] md:text-sm font-black text-[#3b82f6] mt-4 mb-2">Investasi Aktif</h3>
                  <div className="space-y-2">
                    {userInvestments.filter(i => i.status === 'active').map(inv => {
                      const progress = Math.round((inv.daysElapsed / inv.duration) * 100)
                      return (
                        <div key={inv.id} className="rounded-2xl p-3 bg-[var(--zv-panel)] border border-[var(--zv-border)]">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg grid place-items-center bg-[var(--zv-surface)]">
                                <DollarSign className="w-4 h-4 text-[#3b82f6]" />
                              </div>
                              <div>
                                <span className="block text-[10px] font-black text-[var(--zv-text)]">{inv.product.name}</span>
                                <span className="block text-[7px] text-[var(--zv-muted)]">{formatRupiah(inv.amount)} • {inv.product.category === 'starter' ? 'Starter' : inv.product.category === 'growth' ? 'Growth' : 'Premium'}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="block text-[9px] font-black text-[#3b82f6]">+{formatRupiah(inv.dailyProfit)}/hari</span>
                              <span className="block text-[7px] text-[var(--zv-muted)]">{inv.daysElapsed}/{inv.duration} hari</span>
                            </div>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-[var(--zv-surface)] overflow-hidden mb-1">
                            <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: 'linear-gradient(135deg, #1e3a5f, #2563eb)' }} />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[7px] font-bold text-[var(--zv-muted)]">{formatRupiah(inv.totalClaimed)} diklaim</span>
                            <span className="text-[7px] font-bold text-[#3b82f6]">{progress}%</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {activeTab === 'investasi' && (
            <motion.div key="investasi" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {/* Investasi & Saham Section */}
              {indices.length > 0 && (
                <div className="rounded-2xl overflow-hidden mb-4 bg-[var(--zv-panel)] border border-[var(--zv-border)]">
                  <div className="p-3 md:p-4" style={{ background: 'linear-gradient(145deg, #0c1a2e 0%, #1e3a5f 54%, #2563eb 100%)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-yellow-300" />
                        <span className="text-[11px] md:text-sm font-black text-white">Investasi & Saham</span>
                      </div>
                      <div className="flex items-center gap-1.5 h-6 px-2.5 rounded-full bg-red-500/25 border border-red-400/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                        <span className="text-[8px] font-black text-red-300">LIVE</span>
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
                            <span className={`text-[10px] md:text-xs font-bold ${isIhsgUp ? 'text-blue-300' : 'text-red-300'}`}>
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
                  <div className="grid grid-cols-3 gap-2 p-3">
                    {(() => {
                      const gainer = topGainers[0]
                      const loser = topLosers[0]
                      const mostActive = stocks.length > 0 ? [...stocks].sort((a, b) => b.volume - a.volume)[0] : null
                      return (
                        <>
                          <div className="p-2.5 text-center rounded-xl bg-[var(--zv-surface)] border border-[var(--zv-border)]">
                            <span className="block text-[8px] md:text-[9px] font-bold text-[#3b82f6] mb-0.5">🔺 Top Gainer</span>
                            <span className="block text-[11px] md:text-sm font-black text-[var(--zv-text)]">{gainer?.code || '-'}</span>
                            <span className="block text-[9px] md:text-[10px] font-bold text-[#22c55e]">{gainer ? `+${gainer.changePercent.toFixed(2)}%` : '-'}</span>
                          </div>
                          <div className="p-2.5 text-center rounded-xl bg-[var(--zv-surface)] border border-[var(--zv-border)]">
                            <span className="block text-[8px] md:text-[9px] font-bold text-[#ef5350] mb-0.5">🔻 Top Loser</span>
                            <span className="block text-[11px] md:text-sm font-black text-[var(--zv-text)]">{loser?.code || '-'}</span>
                            <span className="block text-[9px] md:text-[10px] font-bold text-[#ef5350]">{loser ? `${loser.changePercent.toFixed(2)}%` : '-'}</span>
                          </div>
                          <div className="p-2.5 text-center rounded-xl bg-[var(--zv-surface)] border border-[var(--zv-border)]">
                            <span className="block text-[8px] md:text-[9px] font-bold text-[#f59e0b] mb-0.5">⚡ Most Active</span>
                            <span className="block text-[11px] md:text-sm font-black text-[var(--zv-text)]">{mostActive?.code || '-'}</span>
                            <span className="block text-[9px] md:text-[10px] font-bold text-[var(--zv-muted)]">{mostActive ? formatNumber(mostActive.volume) : '-'}</span>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>
              )}

              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--zv-muted)]" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari saham..."
                  className="w-full h-11 rounded-2xl bg-[var(--zv-surface)] border border-[var(--zv-border)] pl-10 pr-4 text-[12px] md:text-sm font-semibold text-[var(--zv-text)] outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30 transition-all placeholder:text-[var(--zv-muted)]" />
              </div>

              {/* Category Filter */}
              <div className="flex gap-2 overflow-x-auto pb-2 mb-3 custom-scrollbar">
                {categories.map(c => (
                  <button key={c.key} onClick={() => setStockFilter(c.key)}
                    className={`flex-shrink-0 h-8 md:h-9 px-4 md:px-5 rounded-xl text-[10px] md:text-[11px] font-bold transition-all ${stockFilter === c.key ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/20' : 'bg-[var(--zv-surface)] border border-[var(--zv-border)] text-[var(--zv-muted)] hover:bg-[var(--zv-border)] hover:border-[var(--zv-border)] hover:text-[#3b82f6]'}`}>
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Stock List - Multi Column Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {filteredStocks.map(s => {
                  // Use memoized sparkline data to prevent jitter on re-renders
                  const sparkData = getSparklineData(s)
                  const isUp = s.changePercent >= 0
                  const sparkColor = isUp ? '#2563eb' : '#ef4444'
                  const maxVol = Math.max(...stocks.map(st => st.volume), 1)
                  const volPercent = Math.round((s.volume / maxVol) * 100)

                  return (
                    <div key={s.id} className={`stock-card rounded-2xl bg-[var(--zv-panel)] border border-[var(--zv-border)] overflow-hidden hover:border-[#3b82f6]/30 hover:shadow-lg hover:shadow-blue-500/5 transition-all`}>
                      <div className="p-3 md:p-4">
                        <div className="flex items-center justify-between mb-2.5">
                          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => openStockDetail(s)}>
                            <div className={`w-10 h-10 md:w-11 md:h-11 rounded-xl overflow-hidden flex items-center justify-center border ${isUp ? 'bg-[var(--zv-surface)] border-[var(--zv-border)]' : 'bg-[var(--zv-surface)] border-[var(--zv-border)]'}`}>{s.logo ? <img src={s.logo} alt={s.code} className="w-full h-full object-cover" /> : <span className={`text-[10px] md:text-[11px] font-black ${isUp ? 'text-[#22c55e]' : 'text-[#ef5350]'}`}>{s.code.slice(0, 2)}</span>}</div>
                            <div>
                              <span className="block text-[11px] md:text-xs font-black text-[var(--zv-text)]">{s.code}</span>
                              <span className="block text-[8px] md:text-[9px] text-[var(--zv-muted)] max-w-[100px] md:max-w-[140px] truncate">{s.name}</span>
                            </div>
                          </div>
                          <button onClick={() => toggleWatchlist(s.id)} className="w-8 h-8 rounded-lg grid place-items-center hover:bg-[var(--zv-surface)] transition-colors">
                            <Star className={`w-4 h-4 ${isWatched(s.id) ? 'text-[#f59e0b] fill-[#f59e0b]' : 'text-[var(--zv-border)]'}`} />
                          </button>
                        </div>

                        {/* Recharts Mini AreaChart */}
                        <div className="h-[50px] md:h-[60px] -mx-1 mb-2.5">
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
                            <span className="block text-[14px] md:text-base font-black text-[var(--zv-text)] tabular-nums">{formatRupiah(s.price)}</span>
                            <div className={`inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-lg ${isUp ? 'bg-[var(--zv-surface)]' : 'bg-[var(--zv-surface)]'}`}>
                              {isUp ? <TrendingUp className="w-3.5 h-3.5 text-[#22c55e]" /> : <TrendingDown className="w-3.5 h-3.5 text-[#ef5350]" />}
                              <span className={`text-[10px] md:text-[11px] font-bold ${isUp ? 'text-[#22c55e]' : 'text-[#ef5350]'}`}>{formatPercent(s.changePercent)}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <button onClick={() => openContract(s)} className="h-10 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-white text-[11px] md:text-[12px] font-black hover:from-amber-400 hover:to-amber-300 transition-all flex items-center gap-2 shadow-md shadow-amber-500/20">
                              <Package className="w-4 h-4" />Kontrak
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Contract Info - Footer */}
                      <div className="px-3 md:px-4 py-2.5 bg-[var(--zv-surface)] border-t border-[var(--zv-border)] grid grid-cols-3 gap-2">
                        <div>
                          <span className="block text-[7px] md:text-[8px] font-bold text-[var(--zv-muted)]">High</span>
                          <span className="block text-[9px] md:text-[10px] font-black text-[#22c55e]">{formatNumber(s.high)}</span>
                        </div>
                        <div>
                          <span className="block text-[7px] md:text-[8px] font-bold text-[var(--zv-muted)]">Low</span>
                          <span className="block text-[9px] md:text-[10px] font-black text-[#ef5350]">{formatNumber(s.low)}</span>
                        </div>
                        <div>
                          <span className="block text-[7px] md:text-[8px] font-bold text-[var(--zv-muted)]">Vol</span>
                          <div className="flex items-center gap-1">
                            <span className="text-[8px] md:text-[9px] font-bold text-[var(--zv-text)]">{formatNumber(s.volume)}</span>
                            <div className="flex-1 h-1.5 rounded-full bg-[var(--zv-border)] overflow-hidden">
                              <div className={`h-full rounded-full ${isUp ? 'bg-[#22c55e]' : 'bg-[#ef5350]'}`} style={{ width: `${volPercent}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {filteredStocks.length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <BarChart3 className="w-10 h-10 text-[var(--zv-muted)] mx-auto mb-2" />
                    <p className="text-[11px] md:text-sm font-bold text-[var(--zv-muted)]">Tidak ada saham ditemukan</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ====== SINYAL PRO TAB - STOCKITY STYLE ====== */}
          {activeTab === 'sinyal' && (
            <motion.div key="sinyal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
              className="flex flex-col" style={{ minHeight: 'calc(100vh - 140px)' }}>

              {/* ── STOCKITY-STYLE LAYOUT ── */}

              {/* Top Bar: View Toggle + Category Tabs + Balance */}
              <div className="mb-1.5">
                {/* View Toggle: Trading / AI Pro */}
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="flex h-8 rounded-xl overflow-hidden border border-[var(--zv-border)]" style={{ background: 'var(--zv-surface)' }}>
                    <button onClick={() => setSinyalView('trading')}
                      className={`h-full px-3.5 flex items-center gap-1.5 text-[9px] font-bold transition-all ${
                        sinyalView === 'trading'
                          ? 'bg-gradient-to-r from-[#1e3a5f] to-[#1d4ed8] text-white shadow-lg shadow-blue-500/20'
                          : 'text-[var(--zv-muted)] hover:text-[var(--zv-text)]'
                      }`}>
                      <BarChart3 className="w-3.5 h-3.5" />
                      Trading
                    </button>
                    <button onClick={() => setSinyalView('ai-pro')}
                      className={`h-full px-3.5 flex items-center gap-1.5 text-[9px] font-bold transition-all relative ${
                        sinyalView === 'ai-pro'
                          ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                          : 'text-[var(--zv-muted)] hover:text-[var(--zv-text)]'
                      }`}>
                      <Sparkles className="w-3.5 h-3.5" />
                      AI Pro
                      {!aiProUnlocked && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 flex items-center justify-center">
                          <Lock className="w-2 h-2 text-white" />
                        </span>
                      )}
                    </button>
                  </div>
                  <div className="flex-1" />
                  <div className="flex items-center gap-1.5 flex-shrink-0 h-8 px-2.5 rounded-lg bg-[var(--zv-surface)] border border-[var(--zv-border)]">
                    <Wallet className="w-3.5 h-3.5 text-[#f59e0b]" />
                    <span className="text-[9px] font-black text-[#f59e0b]">{formatRupiah(user?.balance || 0)}</span>
                  </div>
                </div>

                {/* Category Tabs - only in trading view */}
                {sinyalView === 'trading' && (
                <div className="flex gap-1 mb-1.5">
                  {[
                    { key: 'popular', label: 'Popular' },
                    { key: 'crypto', label: 'Kripto' },
                    { key: 'komoditas', label: 'Komoditas' },
                    { key: 'forex', label: 'Forex' },
                  ].map(cat => (
                    <button key={cat.key} onClick={() => setSinyalCategory(cat.key)}
                      className={`flex-shrink-0 h-7 px-3 rounded-lg text-[9px] font-bold transition-all border ${
                        sinyalCategory === cat.key
                          ? 'bg-gradient-to-r from-[#1e3a5f] to-[#1d4ed8] text-white border-[#3b82f6] shadow-lg shadow-blue-500/20'
                          : 'bg-[var(--zv-surface)] text-[var(--zv-muted)] border-[var(--zv-border)] hover:border-[#3b82f6]/50 hover:text-[var(--zv-text)]'
                      }`}>
                      {cat.label}
                    </button>
                  ))}
                </div>
                )}
                {/* Stock pills for selected category - trading view only */}
                {sinyalView === 'trading' && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 custom-scrollbar" style={{ scrollbarWidth: 'none' }}>
                  {stocks.filter(s => {
                    const cat = s.category?.toLowerCase() || ''
                    if (sinyalCategory === 'popular') return true
                    if (sinyalCategory === 'crypto') return cat.includes('crypto') || cat.includes('kripto') || ['BTC', 'ETH', 'XRP', 'SOL', 'DOGE', 'ADA', 'AVAX', 'DOT', 'MATIC', 'LINK', 'BCH', 'LTC', 'XLM', 'UNI', 'AAVE'].includes(s.code)
                    if (sinyalCategory === 'komoditas') return cat.includes('commodity') || cat.includes('komoditas') || ['XOM', 'CVX', 'COP', 'GOLD', 'SILVER', 'OIL', 'NATGAS', 'COPPER'].includes(s.code)
                    if (sinyalCategory === 'forex') return cat.includes('forex') || ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD', 'USDCHF'].includes(s.code)
                    return true
                  }).slice(0, 30).map(s => {
                    const tier = getStockPayoutTier(s.code)
                    const isSelected = selectedSinyalStock?.id === s.id
                    const displayPayout = isSelected ? chartPayoutRates.up.toFixed(0) : tier.upRange[1]
                    return (
                      <button key={s.id} onClick={() => { setSelectedSinyalStock(s); setSinyalAmount(''); setSinyalDirection('NAIK'); setSinyalResults([]); setSinyalCandles([]); setSinyalCurrentPrice(0); setSinyalChartTick(0); setSinyalChartOffset(0); sinyalChartSimRef.current = null }}
                        className={`flex-shrink-0 h-7 px-2.5 rounded-lg text-[9px] font-bold flex items-center gap-1 transition-all border ${
                          isSelected
                            ? 'bg-gradient-to-r from-[#1e3a5f] to-[#1d4ed8] text-white border-[#3b82f6] shadow-lg shadow-blue-500/20'
                            : 'bg-[var(--zv-surface)] text-[var(--zv-text)] border-[var(--zv-border)] hover:border-[#3b82f6]/50 hover:bg-[var(--zv-hover)]'
                        }`}>
                        <span>{s.code}</span>
                        <span className={`text-[7px] font-black ${isSelected ? 'text-green-300' : 'text-green-500'}`}>+{displayPayout}%</span>
                      </button>
                    )
                  })}
                </div>
                )}
              </div>

              {/* ====== TRADING VIEW: Chart + Buy/Sell ====== */}
              {sinyalView === 'trading' && (<>

              {/* ── MAIN CHART AREA — Premium dark style ── */}
              {selectedSinyalStock && (
                <div className="relative rounded-xl overflow-hidden border border-[var(--zv-chart-border)]" style={{ background: 'linear-gradient(180deg, var(--zv-chart-bg) 0%, var(--zv-chart-bg2) 100%)', minHeight: '320px', flex: 1, boxShadow: theme === 'dark' ? '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(59,130,246,0.08)' : '0 4px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(59,130,246,0.06)' }}>
                  {/* Chart Header — Stockity info bar */}
                  <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 pt-2 pb-1.5" style={{ background: 'linear-gradient(to bottom, var(--zv-chart-overlay) 50%, transparent)' }}>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 h-5 px-2 rounded-full bg-green-500/10 border border-green-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-[7px] font-black text-green-400 tracking-widest">LIVE</span>
                      </div>
                      <span className="text-[10px] font-black text-[var(--zv-text)] drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]">{selectedSinyalStock.code}</span>
                      <div className="flex items-center gap-1">
                        <span className="h-5 px-1.5 rounded-md text-[7px] font-black bg-green-500/10 border border-green-500/20 text-green-400 flex items-center">↑{chartPayoutRates.up.toFixed(0)}%</span>
                        <span className="h-5 px-1.5 rounded-md text-[7px] font-black bg-red-500/10 border border-red-500/20 text-red-400 flex items-center">↓{chartPayoutRates.down.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {(() => {
                        const sim = sinyalChartSimRef.current
                        const openPrice = sim?.currentCandle.open || selectedSinyalStock.price
                        const curPrice = sinyalCurrentPrice || selectedSinyalStock.price
                        const priceChange = curPrice - openPrice
                        const changePercent = openPrice > 0 ? (priceChange / openPrice) * 100 : 0
                        const isPriceUp = priceChange >= 0
                        return (
                          <>
                            <span className="text-[12px] font-black tabular-nums" style={{ color: isPriceUp ? '#22c55e' : '#ef5350' }}>
                              {formatRupiah(curPrice)}
                            </span>
                            <span className={`text-[8px] font-bold ${isPriceUp ? 'text-green-400' : 'text-red-400'}`}>
                              {isPriceUp ? '+' : ''}{changePercent.toFixed(2)}%
                            </span>
                          </>
                        )
                      })()}
                    </div>
                  </div>

                  {/* Timeframe selector */}
                  <div className="absolute top-8 left-0 right-0 z-10 flex items-center justify-between px-3 py-0.5">
                    <div className="flex items-center gap-1 rounded-lg p-0.5 border border-[var(--zv-chart-border)]" style={{ backdropFilter: 'blur(8px)', background: 'var(--zv-chart-panel)' }}>
                      {(['1m', '2m', '5m', '10m', '15m', '30m', '1h'] as const).map(tf => (
                        <button key={tf} onClick={() => { setSinyalTimeframe(tf); sinyalChartSimRef.current = null; setSinyalCandles([]); setSinyalCurrentPrice(0); setSinyalChartOffset(0) }}
                          className={`h-5 px-2 rounded-md text-[7px] font-bold transition-all ${
                            sinyalTimeframe === tf
                              ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40 shadow-sm shadow-blue-500/20'
                              : 'text-gray-500 hover:text-gray-300 border border-transparent hover:bg-white/5'
                          }`}>
                          {tf}
                        </button>
                      ))}
                    </div>
                    {/* Candle countdown — prominent timer */}
                    {(() => {
                      const sim = sinyalChartSimRef.current
                      if (!sim) return null
                      const cc = sim.currentCandle
                      const totalSecs = cc.maxTicks
                      const elapsed = cc.tickCount
                      const remaining = totalSecs - elapsed
                      const progress = totalSecs > 0 ? elapsed / totalSecs : 0
                      const elapsedMins = Math.floor(elapsed / 60)
                      const elapsedSecs = elapsed % 60
                      const totalMins = Math.floor(totalSecs / 60)
                      const totalSecsRem = totalSecs % 60
                      const now = new Date()
                      const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0') + ':' + now.getSeconds().toString().padStart(2, '0')
                      const radius = 16
                      const circumference = 2 * Math.PI * radius
                      const strokeDash = circumference * progress
                      const isLow = remaining <= 5 && remaining > 0
                      return (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5">
                            <svg width="38" height="38" className="flex-shrink-0">
                              <circle cx="19" cy="19" r={radius} fill="none" stroke="var(--zv-chart-grid)" strokeWidth="2.5" opacity="0.5" />
                              <circle cx="19" cy="19" r={radius} fill="none" stroke={isLow ? '#f59e0b' : '#3b82f6'} strokeWidth="2.5"
                                strokeDasharray={`${strokeDash} ${circumference}`} strokeDashoffset="0"
                                strokeLinecap="round" transform="rotate(-90 19 19)"
                                style={{ transition: 'stroke-dasharray 0.8s linear' }} />
                              <text x="19" y="17" textAnchor="middle" fontSize="7" fontWeight="900" fill={isLow ? '#f59e0b' : 'var(--zv-text)'} fontFamily="monospace">
                                {remaining > 60 ? `${Math.ceil(remaining/60)}m` : `${remaining}`}
                              </text>
                              <text x="19" y="24" textAnchor="middle" fontSize="5" fill="var(--zv-muted)" fontFamily="monospace">left</text>
                            </svg>
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black tabular-nums text-[var(--zv-text)]">
                                {elapsedMins > 0 ? `${elapsedMins}:${elapsedSecs.toString().padStart(2, '0')}` : `0:${elapsedSecs.toString().padStart(2, '0')}`} / {totalMins > 0 ? `${totalMins}:${totalSecsRem.toString().padStart(2, '0')}` : `0:${totalSecsRem.toString().padStart(2, '0')}`}
                              </span>
                              <span className="text-[7px] font-bold text-[var(--zv-muted)] tabular-nums">{timeStr} WIB</span>
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Active Trades Overlay — MT5-style with live P&L & close button */}
                  {sinyalPositions.filter(p => p.status === 'active').length > 0 && (
                    <div className="absolute top-14 left-2 z-10 flex flex-col gap-1.5 max-w-[180px]">
                      {sinyalPositions.filter(p => p.status === 'active').map(ap => {
                        const remaining = sinyalTimers[ap.id] ?? ap.duration
                        const isUp = ap.direction === 'NAIK'
                        const livePL = getPositionLivePL(ap)
                        const currentPrice = sinyalCurrentPrice || sinyalChartSimRef.current?.price || ap.startPrice
                        // Timer ring
                        const radius = 12
                        const circumference = 2 * Math.PI * radius
                        const strokeDash = circumference * (remaining / ap.duration)
                        const mins = Math.floor(remaining / 60)
                        const secs = remaining % 60
                        const timerLabel = mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`
                        return (
                          <motion.div key={ap.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border ${isUp ? 'bg-green-500/10 border-green-500/25' : 'bg-red-500/10 border-red-500/25'}`}
                            style={{ backdropFilter: 'blur(10px)' }}>
                            {/* Timer ring */}
                            <svg width="28" height="28" className="flex-shrink-0">
                              <circle cx="14" cy="14" r={radius} fill="none" stroke="var(--zv-chart-border)" strokeWidth="2.5" />
                              <circle cx="14" cy="14" r={radius} fill="none" stroke={isUp ? '#22c55e' : '#ef5350'} strokeWidth="2.5"
                                strokeDasharray={`${strokeDash} ${circumference}`} strokeDashoffset="0"
                                strokeLinecap="round" transform="rotate(-90 14 14)"
                                style={{ transition: 'stroke-dasharray 0.5s linear' }} />
                              <text x="14" y="17" textAnchor="middle" fontSize="7" fontWeight="bold" fill="white">{timerLabel}</text>
                            </svg>
                            {/* Position info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <span className={`text-[8px] font-black ${isUp ? 'text-green-400' : 'text-red-400'}`}>{ap.direction === 'NAIK' ? 'Beli' : 'Jual'}</span>
                                <span className="text-[7px] text-[var(--zv-muted)] font-bold">{ap.stockCode}</span>
                                <span className="text-[6px] text-amber-400 font-bold">1:{ap.leverage || 1000}</span>
                              </div>
                              <div className="text-[6px] text-[var(--zv-muted)]">
                                {formatNumber(ap.startPrice)} → <span className="text-[var(--zv-text)] font-bold">{formatNumber(currentPrice)}</span>
                              </div>
                              {/* Modal Live - ikut grafik */}
                              <div className={`text-[9px] font-black ${livePL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                Modal: {formatRupiah((ap.workingCapital || Math.round(ap.amount * 0.9)) + livePL)}
                              </div>
                            </div>
                            {/* Close button */}
                            <button onClick={() => closeSinyalPosition(ap.id)}
                              className="w-5 h-5 rounded-full bg-[var(--zv-surface)] border border-[var(--zv-border)] flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/40 transition-all flex-shrink-0"
                              title="Tutup posisi">
                              <X className="w-2.5 h-2.5 text-[var(--zv-muted)]" />
                            </button>
                          </motion.div>
                        )
                      })}
                    </div>
                  )}

                  {/* ── CANDLESTICK CHART SVG — Premium style with panning ── */}
                  <div className="w-full h-full pt-14"
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      setSinyalCrosshair({ x: e.clientX - rect.left, y: e.clientY - rect.top, w: rect.width, h: rect.height })
                      // Handle drag panning
                      if (sinyalDragRef.current.dragging) {
                        const dx = e.clientX - sinyalDragRef.current.startX
                        const candlesPerPx = 3 / rect.width // ~3 candles per 100px drag
                        const offsetDelta = Math.round(dx * candlesPerPx)
                        const newOffset = Math.max(0, sinyalDragRef.current.startOffset + offsetDelta)
                        setSinyalChartOffset(newOffset)
                      }
                    }}
                    onMouseDown={(e) => {
                      sinyalDragRef.current = { startX: e.clientX, startOffset: sinyalChartOffsetRef.current, dragging: true }
                      e.preventDefault()
                    }}
                    onMouseUp={() => { sinyalDragRef.current.dragging = false }}
                    onMouseLeave={() => { setSinyalCrosshair(null); sinyalDragRef.current.dragging = false }}
                    onWheel={(e) => {
                      e.preventDefault()
                      if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                        // Shift+scroll or horizontal scroll = PAN
                        const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY
                        const direction = delta > 0 ? -1 : 1
                        setSinyalChartOffset(prev => Math.max(0, prev + direction * 2))
                      } else {
                        // Vertical scroll = ZOOM
                        const zoomDelta = e.deltaY > 0 ? 1 : -1
                        const step = sinyalChartZoomRef.current > 60 ? 4 : sinyalChartZoomRef.current > 30 ? 2 : 1
                        setSinyalChartZoom(prev => Math.max(8, Math.min(120, prev + zoomDelta * step)))
                      }
                    }}
                    onDoubleClick={() => { setSinyalChartZoom(40); setSinyalChartOffset(0) }}
                    onTouchStart={(e) => {
                      if (e.touches.length === 1) {
                        sinyalDragRef.current = { startX: e.touches[0].clientX, startOffset: sinyalChartOffsetRef.current, dragging: true }
                      } else if (e.touches.length === 2) {
                        sinyalDragRef.current.dragging = false
                        const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY)
                        sinyalPinchRef.current = { startDist: dist, startZoom: sinyalChartZoomRef.current }
                      }
                    }}
                    onTouchMove={(e) => {
                      if (e.touches.length === 1 && sinyalDragRef.current.dragging) {
                        const dx = e.touches[0].clientX - sinyalDragRef.current.startX
                        const candlesPerPx = 3 / (e.currentTarget.getBoundingClientRect().width || 300)
                        const offsetDelta = Math.round(dx * candlesPerPx)
                        setSinyalChartOffset(Math.max(0, sinyalDragRef.current.startOffset + offsetDelta))
                      } else if (e.touches.length === 2 && sinyalPinchRef.current) {
                        e.preventDefault()
                        const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY)
                        const scale = sinyalPinchRef.current.startDist / dist
                        const newZoom = Math.max(8, Math.min(120, Math.round(sinyalPinchRef.current.startZoom * scale)))
                        setSinyalChartZoom(newZoom)
                      }
                    }}
                    onTouchEnd={() => {
                      sinyalDragRef.current.dragging = false
                      sinyalPinchRef.current = null
                    }}
                    style={{ cursor: sinyalDragRef.current?.dragging ? 'grabbing' : 'grab' }}>
                    {(() => {
                      const allCandles = [...sinyalCandles]
                      const sim = sinyalChartSimRef.current
                      if (sim) {
                        const cc = sim.currentCandle
                        if (cc.tickCount > 0) {
                          allCandles.push({
                            idx: allCandles.length, open: cc.open, high: cc.high, low: cc.low, close: cc.close, volume: cc.volume,
                            time: new Date().getHours().toString().padStart(2, '0') + ':' + new Date().getMinutes().toString().padStart(2, '0'),
                          })
                        }
                      }
                      if (allCandles.length < 2) return <div className="flex items-center justify-center h-full text-[9px] text-[var(--zv-muted)]">Memuat grafik...</div>

                      // Calculate OHLC range
                      const allHighs = allCandles.map(c => c.high)
                      const allLows = allCandles.map(c => c.low)
                      const minP = Math.min(...allLows)
                      const maxP = Math.max(...allHighs)
                      const rangeP = maxP - minP || 1
                      const paddedMin = minP - rangeP * 0.1
                      const paddedMax = maxP + rangeP * 0.1
                      const paddedRange = paddedMax - paddedMin

                      const W = 600
                      const chartH = 180
                      const volH = 40
                      const H = chartH + volH
                      const padR = 52
                      const padL = 2
                      const padB = 14
                      const chartW = W - padR - padL
                      const priceAreaH = chartH - padB

                      const compactPrice = (p: number) => {
                        if (p >= 1e6) return `${(p / 1e6).toFixed(1)}M`
                        if (p >= 1e3) return `${(p / 1e3).toFixed(1)}K`
                        return p.toFixed(0)
                      }

                      const yScale = (price: number) => ((paddedMax - price) / paddedRange) * priceAreaH

                      // Candle width calculation with panning support
                      const maxVisible = sinyalChartZoom
                      const totalCandles = allCandles.length
                      const endIdx = totalCandles - sinyalChartOffset
                      const startIdx = Math.max(0, endIdx - maxVisible)
                      const visibleCandles = allCandles.slice(startIdx, endIdx)
                      const candleCount = visibleCandles.length
                      if (candleCount === 0) return <div className="flex items-center justify-center h-full text-[9px] text-[var(--zv-muted)]">Geser kembali...</div>
                      const candleSpacing = chartW / candleCount
                      const candleBodyW = Math.max(1.5, Math.min(candleSpacing * 0.65, 14))

                      // Volume scale
                      const maxVol = Math.max(...visibleCandles.map(c => c.volume), 1)

                      // Last price info
                      const lastCandle = visibleCandles[candleCount - 1]
                      const lastPrice = lastCandle.close
                      const yLast = yScale(lastPrice)
                      const isUp = lastCandle.close >= lastCandle.open
                      const priceColor = isUp ? '#22c55e' : '#ef5350'

                      // Active position entry prices
                      const activePositions = sinyalPositions.filter(p => p.status === 'active')

                      return (
                        <svg className="w-full h-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ fontFamily: 'monospace' }}>
                          <defs>
                            <filter id="candleGlow" x="-20%" y="-20%" width="140%" height="140%">
                              <feGaussianBlur stdDeviation="2" result="blur" />
                              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                            </filter>
                          </defs>

                          {/* Background subtle gradient */}
                          <rect x={padL} y={0} width={chartW} height={chartH} fill="transparent" />

                          {/* Horizontal grid lines + price labels */}
                          {[0, 1, 2, 3, 4, 5].map(gi => {
                            const gy = (gi / 5) * priceAreaH
                            const priceLabel = paddedMax - (paddedRange / 5) * gi
                            return (
                              <g key={`hg-${gi}`}>
                                <line x1={padL} y1={gy} x2={padL + chartW} y2={gy} stroke="var(--zv-chart-grid)" strokeWidth="0.4" strokeDasharray="2,3" opacity="0.8" />
                                <text x={padL + chartW + 3} y={gy + 3} fontSize="6" fill="var(--zv-chart-text)" fontFamily="monospace" fontWeight="bold">{compactPrice(Math.round(priceLabel))}</text>
                              </g>
                            )
                          })}

                          {/* Vertical grid lines + time labels */}
                          {visibleCandles.filter((_, i) => i % Math.max(1, Math.floor(candleCount / 6)) === 0).map((c, i) => {
                            const idx = visibleCandles.indexOf(c)
                            const vx = padL + (idx + 0.5) * candleSpacing
                            return (
                              <g key={`vg-${i}`}>
                                <line x1={vx} y1={0} x2={vx} y2={priceAreaH} stroke="var(--zv-chart-grid)" strokeWidth="0.4" strokeDasharray="2,3" opacity="0.5" />
                                <text x={vx} y={priceAreaH + 10} fontSize="5.5" fill="var(--zv-chart-text)" textAnchor="middle" fontFamily="monospace" fontWeight="bold">{c.time}</text>
                              </g>
                            )
                          })}

                          {/* Volume separator line */}
                          <line x1={padL} y1={chartH} x2={padL + chartW} y2={chartH} stroke="var(--zv-chart-grid)" strokeWidth="0.4" opacity="0.6" />

                          {/* Volume bars */}
                          {visibleCandles.map((c, i) => {
                            const x = padL + i * candleSpacing + (candleSpacing - candleBodyW * 0.7) / 2
                            const volBarH = (c.volume / maxVol) * (volH - 8)
                            const isBull = c.close >= c.open
                            return (
                              <rect key={`vol-${i}`} x={x} y={chartH + volH - volBarH - 4} width={candleBodyW * 0.7} height={Math.max(1, volBarH)}
                                fill={isBull ? 'var(--zv-chart-vol-up)' : 'var(--zv-chart-vol-down)'} rx="0.5" />
                            )
                          })}

                          {/* Candlestick bars */}
                          {visibleCandles.map((c, i) => {
                            const cx = padL + (i + 0.5) * candleSpacing
                            const isBull = c.close >= c.open
                            const bodyTop = yScale(Math.max(c.open, c.close))
                            const bodyBot = yScale(Math.min(c.open, c.close))
                            const bodyH = Math.max(1, bodyBot - bodyTop)
                            const wickTop = yScale(c.high)
                            const wickBot = yScale(c.low)

                            const fillColor = isBull ? '#22c55e' : '#ef5350'
                            const strokeColor = isBull ? '#16a34a' : '#dc2626'

                            return (
                              <g key={`candle-${i}`}>
                                {/* Upper wick */}
                                <line x1={cx} y1={wickTop} x2={cx} y2={bodyTop} stroke={fillColor} strokeWidth="1" />
                                {/* Lower wick */}
                                <line x1={cx} y1={bodyBot} x2={cx} y2={wickBot} stroke={fillColor} strokeWidth="1" />
                                {/* Body */}
                                <rect x={cx - candleBodyW / 2} y={bodyTop} width={candleBodyW} height={bodyH}
                                  fill={isBull ? fillColor : fillColor} stroke={strokeColor} strokeWidth="0.5" rx="0.5" />
                              </g>
                            )
                          })}

                          {/* MA5 line — yellow */}
                          {(() => {
                            const ma5 = computeMA(visibleCandles, 5)
                            const points = ma5.filter(v => v !== null).map((v, i) => {
                              const origIdx = ma5.findIndex((val, j) => val === v && j >= i)
                              return { x: padL + (origIdx + 0.5) * candleSpacing, y: yScale(v!) }
                            }).filter((_, i) => i > 0)
                            if (points.length < 2) return null
                            const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
                            return <path d={pathD} fill="none" stroke="#eab308" strokeWidth="0.7" opacity="0.7" />
                          })()}
                          {/* MA20 line — cyan */}
                          {(() => {
                            const ma20 = computeMA(visibleCandles, 20)
                            const points = ma20.filter(v => v !== null).map((v, i) => ({
                              x: padL + (i + 0.5) * candleSpacing, y: yScale(v!)
                            }))
                            if (points.length < 2) return null
                            const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
                            return <path d={pathD} fill="none" stroke="#06b6d4" strokeWidth="0.7" opacity="0.5" />
                          })()}
                          {/* MA legend */}
                          <g>
                            <rect x={padL + 1} y={1} width={58} height={12} rx="3" fill="var(--zv-chart-ma-legend-bg)" stroke="var(--zv-chart-border)" strokeWidth="0.3" />
                            <line x1={padL + 5} y1={7} x2={padL + 15} y2={7} stroke="#eab308" strokeWidth="1" opacity="0.8" />
                            <text x={padL + 17} y={9} fontSize="5" fill="#eab308" fontFamily="monospace" fontWeight="bold">MA5</text>
                            <line x1={padL + 33} y1={7} x2={padL + 43} y2={7} stroke="#06b6d4" strokeWidth="1" opacity="0.6" />
                            <text x={padL + 45} y={9} fontSize="5" fill="#06b6d4" fontFamily="monospace" fontWeight="bold">MA20</text>
                          </g>

                          {/* Active position entry lines */}
                          {activePositions.map(pos => {
                            const entryY = yScale(pos.startPrice)
                            const isPosUp = pos.direction === 'NAIK'
                            const lineColor = isPosUp ? '#22c55e' : '#ef5350'
                            return (
                              <g key={`pos-line-${pos.id}`}>
                                <line x1={padL} y1={entryY} x2={padL + chartW} y2={entryY}
                                  stroke={lineColor} strokeWidth="0.7" strokeDasharray="4,3" opacity="0.6" />
                                <rect x={padL + chartW - 28} y={entryY - 6} width={28} height="12" rx="3" fill={lineColor} opacity="0.9" />
                                <text x={padL + chartW - 14} y={entryY + 3} fontSize="5.5" fill="white" textAnchor="middle" fontWeight="bold">{isPosUp ? 'UP' : 'DOWN'}</text>
                              </g>
                            )
                          })}

                          {/* Current price horizontal line */}
                          <line x1={padL} y1={yLast} x2={padL + chartW} y2={yLast}
                            stroke={priceColor} strokeWidth="0.5" strokeDasharray="2,2" opacity="0.6" />

                          {/* Current price pulsing dot */}
                          <circle cx={padL + chartW} cy={yLast} r="2.5" fill={priceColor} filter="url(#candleGlow)">
                            <animate attributeName="r" values="2.5;4;2.5" dur="1.2s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="1;0.5;1" dur="1.2s" repeatCount="indefinite" />
                          </circle>

                          {/* Current price label on right */}
                          <rect x={padL + chartW + 1} y={yLast - 6} width={padR - 3} height="12" rx="2" fill={priceColor} />
                          <text x={padL + chartW + padR / 2} y={yLast + 3} fontSize="6" fill="white" textAnchor="middle" fontWeight="bold" fontFamily="monospace">{compactPrice(lastPrice)}</text>

                          {/* Crosshair */}
                          {sinyalCrosshair && (() => {
                            const svgX = (sinyalCrosshair.x / sinyalCrosshair.w) * W
                            const svgY = (sinyalCrosshair.y / sinyalCrosshair.h) * H
                            const crossPrice = paddedMax - (svgY / priceAreaH) * paddedRange
                            return (
                              <g opacity="0.7">
                                <line x1={svgX} y1={0} x2={svgX} y2={priceAreaH} stroke="#64748b" strokeWidth="0.4" strokeDasharray="2,2" />
                                <line x1={padL} y1={svgY} x2={padL + chartW} y2={svgY} stroke="#64748b" strokeWidth="0.4" strokeDasharray="2,2" />
                                {/* Crosshair price label */}
                                {svgY > 0 && svgY < priceAreaH && (
                                  <>
                                    <rect x={padL + chartW + 1} y={svgY - 6} width={padR - 3} height="12" rx="2" fill="var(--zv-chart-grid)" />
                                    <text x={padL + chartW + padR / 2} y={svgY + 3} fontSize="5.5" fill="var(--zv-chart-text)" textAnchor="middle" fontFamily="monospace" fontWeight="bold">{compactPrice(Math.round(crossPrice))}</text>
                                  </>
                                )}
                              </g>
                            )
                          })()}
                        </svg>
                      )
                    })()}
                  </div>

                  {/* Scroll to latest button — when panned away */}
                  {sinyalChartOffset > 0 && (
                    <button
                      onClick={() => setSinyalChartOffset(0)}
                      className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 h-7 px-4 rounded-full bg-blue-600/80 text-white text-[8px] font-bold flex items-center gap-1.5 hover:bg-blue-500 transition-colors backdrop-blur-sm border border-blue-400/30"
                      style={{ boxShadow: '0 2px 16px rgba(37,99,235,0.5)' }}>
                      <ChevronRight className="w-3 h-3 rotate-180" />
                      Terbaru
                    </button>
                  )}

                  {/* Zoom Controls */}
                  <div className="absolute bottom-3 right-2 z-20 flex flex-col gap-1">
                    <button
                      onClick={() => setSinyalChartZoom(prev => Math.max(8, prev - (prev > 60 ? 8 : prev > 30 ? 4 : 2)))}
                      className="h-7 w-7 rounded-lg border flex items-center justify-center text-gray-400 hover:text-blue-400 hover:border-blue-500/40 transition-all backdrop-blur-sm text-[14px] font-bold shadow-md" style={{ background: 'var(--zv-chart-control-bg)', borderColor: 'var(--zv-chart-control-border)' }}
                    >+</button>
                    <button
                      onClick={() => setSinyalChartZoom(prev => Math.min(120, prev + (prev > 60 ? 8 : prev > 30 ? 4 : 2)))}
                      className="h-7 w-7 rounded-lg border flex items-center justify-center text-gray-400 hover:text-blue-400 hover:border-blue-500/40 transition-all backdrop-blur-sm text-[14px] font-bold shadow-md" style={{ background: 'var(--zv-chart-control-bg)', borderColor: 'var(--zv-chart-control-border)' }}
                    >−</button>
                    <button
                      onClick={() => { setSinyalChartZoom(40); setSinyalChartOffset(0) }}
                      className="h-7 w-7 rounded-lg border flex items-center justify-center text-gray-400 hover:text-blue-400 hover:border-blue-500/40 transition-all backdrop-blur-sm shadow-md" style={{ background: 'var(--zv-chart-control-bg)', borderColor: 'var(--zv-chart-control-border)' }}
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Result flash — tiny pill, auto-removes in 1s */}
                  {sinyalResults.length > 0 && (() => {
                    const latest = sinyalResults[sinyalResults.length - 1]
                    if (!latest || !latest.shownAt || Date.now() - latest.shownAt > 1000) return null
                    const won = latest.won
                    return (
                      <motion.div key={latest.id} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="absolute top-14 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                        <div className={'flex items-center gap-1.5 px-3 py-1 rounded-full border ' + (won ? 'border-green-500/25 bg-green-500/10' : 'border-red-500/25 bg-red-500/10')} style={{ backdropFilter: 'blur(10px)' }}>
                          <span className={'text-[9px] font-black ' + (won ? 'text-green-400' : 'text-red-400')}>{won ? 'BENAR' : 'SALAH'}</span>
                          <span className={'text-[8px] font-bold ' + (won ? 'text-green-300' : 'text-red-300')}>{won ? '+' : '-'}{formatRupiah(Math.abs(latest.profit))}</span>
                        </div>
                      </motion.div>
                    )
                  })()}
                </div>
              )}


              {/* ── BOTTOM PANEL — Tuca-style margin trading ── */}
              <div className="mt-2 space-y-2.5">
                {/* Investment Amount */}
                <div className="px-1">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-wider">Jumlah Investasi</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-black text-[var(--zv-text)]">Rp</span>
                    <input type="number" value={sinyalAmount} onChange={(e) => setSinyalAmount(e.target.value)} placeholder="Masukkan jumlah"
                      className="w-full h-11 rounded-xl bg-[var(--zv-surface)] border border-[var(--zv-border)] pl-10 pr-3 text-[13px] font-bold text-[var(--zv-text)] outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-blue-500/20 transition-all placeholder:text-[var(--zv-muted)]" />
                  </div>
                  <div className="flex gap-1 mt-1.5">
                    {['100000', '200000', '500000', '1000000', '5000000'].map(amt => (
                      <button key={amt} onClick={() => setSinyalAmount(amt)}
                        className={`flex-1 h-7 rounded-lg text-[8px] font-bold transition-all ${sinyalAmount === amt
                          ? 'bg-gradient-to-r from-[#1e3a5f] to-[#1d4ed8] border border-blue-500/50 text-blue-300 shadow-sm shadow-blue-500/20'
                          : 'bg-[var(--zv-surface)] border border-[var(--zv-border)] text-[var(--zv-muted)] hover:text-[var(--zv-text)] hover:border-[#3b82f6]/30'
                        }`}>
                        {parseInt(amt) >= 1000000 ? `${parseInt(amt)/1000000}M` : `${parseInt(amt)/1000}K`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Leverage Selector */}
                <div className="px-1">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[9px] font-black text-amber-400 uppercase tracking-wider">Leverage</span>
                  </div>
                  <div className="flex gap-1.5">
                    {[300, 500, 800, 1000].map(lev => (
                      <button key={lev} onClick={() => setSinyalLeverage(lev)}
                        className={`flex-1 h-9 rounded-xl text-[10px] font-black transition-all border ${
                          sinyalLeverage === lev
                            ? 'bg-gradient-to-r from-amber-500 to-amber-400 border-amber-400/50 text-slate-900 shadow-md shadow-amber-500/20'
                            : 'bg-[var(--zv-surface)] border-[var(--zv-border)] text-[var(--zv-muted)] hover:border-amber-500/30 hover:text-amber-400'
                        }`}>
                        1:{lev}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Volume Calculation with 10% Fee Breakdown */}
                {sinyalAmount && parseInt(sinyalAmount) >= 100000 && (
                  <div className="px-1">
                    <div className="rounded-xl p-3 bg-gradient-to-r from-blue-500/8 to-purple-500/8 border border-blue-500/15">
                      {/* Fee breakdown */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[8px] font-bold text-red-400 uppercase">Fee 10% (Potong Langsung)</span>
                        <span className="text-[10px] font-black text-red-400">-{formatRupiah(Math.round(parseInt(sinyalAmount) * 0.10))}</span>
                      </div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[8px] font-bold text-blue-400 uppercase">Modal Kerja (Ikut Grafik)</span>
                        <span className="text-[12px] font-black text-[var(--zv-text)]">{formatRupiah(Math.round(parseInt(sinyalAmount) * 0.90))}</span>
                      </div>
                      <div className="h-px bg-[var(--zv-border)] my-1.5" />
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[8px] font-bold text-[var(--zv-muted)] uppercase">Posisi Efektif (MT5)</span>
                        <span className="text-[11px] font-black text-[var(--zv-text)]">{formatRupiah(Math.round(parseInt(sinyalAmount) * 0.90) * (sinyalLeverage / 100))}</span>
                      </div>
                      <div className="text-[7px] text-[var(--zv-muted)]">
                        {formatRupiah(Math.round(parseInt(sinyalAmount) * 0.90))} × {sinyalLeverage / 100}× = {formatRupiah(Math.round(parseInt(sinyalAmount) * 0.90) * (sinyalLeverage / 100))}
                      </div>
                      <div className="mt-1.5 flex items-center justify-between">
                        <div className="text-[7px] font-bold text-green-400">
                          Naik 1% = +{formatRupiah(Math.round(parseInt(sinyalAmount) * 0.90 * (sinyalLeverage / 100) * 0.01))}
                        </div>
                        <div className="text-[7px] font-bold text-red-400">
                          Turun 1% = -{formatRupiah(Math.round(parseInt(sinyalAmount) * 0.90 * (sinyalLeverage / 100) * 0.01))}
                        </div>
                      </div>
                      <div className="mt-1.5 text-[7px] text-amber-400 font-bold flex items-center gap-1">
                        <AlertCircle className="w-2.5 h-2.5" />
                        Real MT5 trending — saldo ikut pergerakan grafik real-time!
                      </div>
                    </div>
                  </div>
                )}

                {/* Trade duration info */}
                <div className="px-1">
                  <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[var(--zv-surface)] border border-[var(--zv-border)]">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#3b82f6]" />
                      <span className="text-[8px] font-bold text-[var(--zv-muted)]">Durasi Taruhan</span>
                    </div>
                    {(() => {
                      const sim = sinyalChartSimRef.current
                      const cc = sim?.currentCandle
                      const remaining = cc ? Math.max(cc.maxTicks - cc.tickCount, 0) : sinyalDuration
                      const mins = Math.floor(remaining / 60)
                      const secs = remaining % 60
                      return (
                        <span className="text-[10px] font-black text-[#3b82f6] tabular-nums">
                          {mins > 0 ? `${mins}m ${secs}s` : `${secs}s`} <span className="text-[7px] font-bold text-[var(--zv-muted)]">(s/d candle tutup)</span>
                        </span>
                      )
                    })()}
                  </div>
                </div>

                {/* BELI / JUAL — Tuca style */}
                <div className="grid grid-cols-2 gap-2 px-1">
                  <button
                    onClick={() => {
                      if (!sinyalAmount || parseInt(sinyalAmount) < 100000) {
                        toast({ title: 'Minimum Rp 100.000', variant: 'destructive' }); return
                      }
                      if (parseInt(sinyalAmount) > (user?.balance || 0)) {
                        toast({ title: 'Saldo tidak cukup', variant: 'destructive' }); return
                      }
                      setConfirmTradeDir('NAIK')
                      setShowConfirmTrade(true)
                    }}
                    className="h-14 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all relative overflow-hidden bg-gradient-to-b from-[#22c55e] to-[#16a34a] text-white shadow-lg shadow-green-600/30 active:scale-[0.97] border border-green-400/20">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-[13px] font-black tracking-wide">BELI</span>
                    </div>
                    <span className="text-[8px] font-bold text-green-100">Memprediksi kenaikan harga</span>
                  </button>
                  <button
                    onClick={() => {
                      if (!sinyalAmount || parseInt(sinyalAmount) < 100000) {
                        toast({ title: 'Minimum Rp 100.000', variant: 'destructive' }); return
                      }
                      if (parseInt(sinyalAmount) > (user?.balance || 0)) {
                        toast({ title: 'Saldo tidak cukup', variant: 'destructive' }); return
                      }
                      setConfirmTradeDir('TURUN')
                      setShowConfirmTrade(true)
                    }}
                    className="h-14 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all relative overflow-hidden bg-gradient-to-b from-[#ef4444] to-[#dc2626] text-white shadow-lg shadow-red-600/30 active:scale-[0.97] border border-red-400/20">
                    <div className="flex items-center gap-1.5">
                      <TrendingDown className="w-4 h-4" />
                      <span className="text-[13px] font-black tracking-wide">JUAL</span>
                    </div>
                    <span className="text-[8px] font-bold text-red-100">Memprediksi penurunan harga</span>
                  </button>
                </div>

                {/* Equity Summary - MT5 Style: Modal Kerja ikut grafik real-time */}
                <div className="px-1">
                  <div className="rounded-xl border border-[var(--zv-border)] overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--zv-surface), var(--zv-panel))' }}>
                    <div className="px-3 py-2 border-b border-[var(--zv-border)]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <PieChart className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-[9px] font-black text-blue-400 uppercase tracking-wider">Saldo Live</span>
                          {sinyalPositions.filter(p => p.status === 'active').length > 0 && (
                            <Zap className="w-3 h-3 text-red-400 animate-pulse" />
                          )}
                        </div>
                        {(() => {
                          const totalPL = sinyalPositions.filter(p => p.status === 'active').reduce((s, p) => s + getPositionLivePL(p), 0)
                          return totalPL !== 0 ? (
                            <span className={`text-[8px] font-black ${totalPL > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {totalPL > 0 ? '↑ Naik' : '↓ Turun'} • ikut grafik
                            </span>
                          ) : null
                        })()}
                      </div>
                      {(() => {
                        const totalPL = sinyalPositions.filter(p => p.status === 'active').reduce((s, p) => s + getPositionLivePL(p), 0)
                        return (
                          <b className={`block text-[18px] font-black transition-colors duration-300 ${totalPL > 0 ? 'text-green-400' : totalPL < 0 ? 'text-red-400' : 'text-[var(--zv-text)]'}`}>
                            {formatRupiah(liveBalance)}
                          </b>
                        )
                      })()}
                    </div>
                    <div className="grid grid-cols-3 divide-x divide-[var(--zv-border)]">
                      <div className="px-2 py-2 text-center">
                        <div className="text-[6px] font-bold text-[var(--zv-muted)] uppercase">Tersedia</div>
                        <div className="text-[9px] font-black text-[var(--zv-text)]">{formatRupiah(user?.balance || 0)}</div>
                      </div>
                      <div className="px-2 py-2 text-center">
                        <div className="text-[6px] font-bold text-[var(--zv-muted)] uppercase">Modal Live</div>
                        {(() => {
                          const totalWC = sinyalPositions.filter(p => p.status === 'active').reduce((s, p) => s + (p.workingCapital || Math.round(p.amount * 0.9)), 0)
                          const modalColor = liveModal > 0 ? (liveModal >= totalWC ? 'text-green-400' : 'text-red-400') : 'text-amber-400'
                          const modalPct = totalWC > 0 ? Math.max(0, Math.min(200, (liveModal / totalWC) * 100)) : 0
                          return (
                            <>
                              <div className={`text-[9px] font-black ${modalColor}`}>{formatRupiah(liveModal)}</div>
                              {totalWC > 0 && (
                                <div className="w-full h-0.5 rounded-full bg-[var(--zv-border)]/30 mt-0.5">
                                  <div className={`h-full rounded-full transition-all duration-500 ${liveModal >= totalWC ? 'bg-green-500' : liveModal >= totalWC * 0.5 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, modalPct)}%` }} />
                                </div>
                              )}
                            </>
                          )
                        })()}
                      </div>
                      <div className="px-2 py-2 text-center">
                        <div className="text-[6px] font-bold text-[var(--zv-muted)] uppercase">Fee 10%</div>
                        <div className="text-[9px] font-black text-red-400">{formatRupiah(sinyalPositions.filter(p => p.status === 'active').reduce((s, p) => s + (p.fee || Math.round(p.amount * 0.1)), 0))}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── MT5-style Position Management Panel ── */}
                {(() => {
                  const activePos = sinyalPositions.filter(p => p.status === 'active')
                  const closedPos = sinyalPositions.filter(p => p.status === 'won' || p.status === 'lost')
                  const totalActiveAmount = activePos.reduce((s, p) => s + p.amount, 0)
                  const totalLivePL = activePos.reduce((s, p) => s + getPositionLivePL(p), 0)
                  return (
                    <>
                      {/* Active Positions Panel */}
                      {activePos.length > 0 && (
                        <div className="space-y-1.5">
                          {/* Panel header */}
                          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[var(--zv-surface)] border border-blue-500/15" style={{ boxShadow: '0 0 12px rgba(59,130,246,0.06)' }}>
                            <div className="flex items-center gap-2">
                              <Zap className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                              <span className="text-[9px] font-black text-blue-400">{activePos.length} posisi aktif</span>
                              <span className="text-[8px] text-[var(--zv-muted)]">• Total: {formatRupiah(totalActiveAmount)}</span>
                            </div>
                            <div className={`text-[9px] font-black ${totalLivePL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              P&L: {totalLivePL >= 0 ? '+' : ''}{formatRupiah(totalLivePL)}
                            </div>
                          </div>

                          {/* Position cards */}
                          <div className="max-h-52 overflow-y-auto space-y-1.5 pr-0.5" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(59,130,246,0.3) transparent' }}>
                            {activePos.map(ap => {
                              const remaining = sinyalTimers[ap.id] ?? ap.duration
                              const isUp = ap.direction === 'NAIK'
                              const livePL = getPositionLivePL(ap)
                              const currentPrice = sinyalCurrentPrice || sinyalChartSimRef.current?.price || ap.startPrice
                              const progress = Math.max(0, Math.min(100, (1 - remaining / ap.duration) * 100))
                              const mins = Math.floor(remaining / 60)
                              const secs = remaining % 60
                              const timerLabel = mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`
                              return (
                                <motion.div key={ap.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                  className={`relative rounded-xl border overflow-hidden ${isUp ? 'bg-green-500/5 border-green-500/15' : 'bg-red-500/5 border-red-500/15'}`}>
                                  {/* Progress bar at top */}
                                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-[var(--zv-border)]/30">
                                    <div className={`h-full transition-all duration-500 ${isUp ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${progress}%` }} />
                                  </div>
                                  <div className="px-3 py-2">
                                    {/* Row 1: Direction, Stock, Timer */}
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-1.5">
                                        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-black ${isUp ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                          {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                                          {ap.direction === 'NAIK' ? 'Beli' : 'Jual'}
                                        </span>
                                        <span className="text-[9px] font-black text-[var(--zv-text)]">{ap.stockCode}</span>
                                        <span className="text-[7px] text-[var(--zv-muted)]">{ap.stockName}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Clock className="w-2.5 h-2.5 text-[var(--zv-muted)]" />
                                        <span className="text-[9px] font-black text-[var(--zv-text)] tabular-nums">{timerLabel}</span>
                                      </div>
                                    </div>
                                    {/* Row 2: Investment, Modal Live (ikut grafik), Entry → Current */}
                                    <div className="flex items-center justify-between mt-1">
                                      <div className="flex items-center gap-3">
                                        <div>
                                          <div className="text-[6px] text-[var(--zv-muted)] font-bold uppercase">Investasi</div>
                                          <div className="text-[9px] font-black text-[var(--zv-text)]">{formatRupiah(ap.amount)}</div>
                                          <div className="text-[6px] text-red-400 font-bold">Fee: {formatRupiah(ap.fee || Math.round(ap.amount * 0.1))}</div>
                                        </div>
                                        <div>
                                          <div className="text-[6px] text-[var(--zv-muted)] font-bold uppercase">Modal Live <span className="text-amber-400">(ikut grafik)</span></div>
                                          {(() => {
                                            const wc = ap.workingCapital || Math.round(ap.amount * 0.9)
                                            const modalLive = wc + livePL
                                            const modalPct = Math.max(0, Math.min(200, (modalLive / wc) * 100))
                                            return (
                                              <>
                                                <div className={`text-[10px] font-black ${modalLive >= wc ? 'text-green-400' : 'text-red-400'}`}>{formatRupiah(modalLive)}</div>
                                                {/* Modal erosion bar — shows how much of working capital is left */}
                                                <div className="w-full h-1 rounded-full bg-[var(--zv-border)]/30 mt-0.5">
                                                  <div className={`h-full rounded-full transition-all duration-500 ${modalLive >= wc ? 'bg-green-500' : modalLive >= wc * 0.5 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, modalPct)}%` }} />
                                                </div>
                                                <div className="text-[6px] text-[var(--zv-muted)] font-bold">
                                                  1:{ap.leverage || 1000} • {(() => { const p = livePL >= 0 ? '+' : ''; return `${p}${formatRupiah(livePL)}` })()}
                                                </div>
                                              </>
                                            )
                                          })()}
                                        </div>
                                        <div>
                                          <div className="text-[6px] text-[var(--zv-muted)] font-bold uppercase">Entry → Sekarang</div>
                                          <div className="text-[8px] font-bold text-[var(--zv-text)]">
                                            {formatNumber(ap.startPrice)} → <span className={livePL >= 0 ? 'text-green-400' : 'text-red-400'}>{formatNumber(currentPrice)}</span>
                                          </div>
                                          {(() => {
                                            const priceChgPct = ap.startPrice > 0 ? (((currentPrice - ap.startPrice) / ap.startPrice) * 100).toFixed(2) : '0.00'
                                            return <div className={`text-[6px] font-bold ${currentPrice >= ap.startPrice ? 'text-green-400/60' : 'text-red-400/60'}`}>Harga {currentPrice >= ap.startPrice ? '↑' : '↓'} {Math.abs(parseFloat(priceChgPct))}%</div>
                                          })()}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="text-right">
                                          <button onClick={() => closeSinyalPosition(ap.id)}
                                            className="h-7 px-2 rounded-lg bg-[var(--zv-surface)] border border-[var(--zv-border)] flex items-center justify-center gap-1 hover:bg-red-500/15 hover:border-red-500/30 transition-all active:scale-95"
                                            title="Tutup posisi">
                                            <X className="w-3 h-3 text-[var(--zv-muted)]" />
                                            <span className="text-[7px] font-bold text-[var(--zv-muted)]">TUTUP</span>
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Position History with Filters */}
                      {closedPos.length > 0 && (
                        <div className="px-1">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <History className="w-3 h-3 text-[var(--zv-muted)]" />
                              <span className="text-[9px] font-black text-[var(--zv-muted)] uppercase">Riwayat Posisi</span>
                            </div>
                            <div className="flex gap-1">
                              {['Semua', 'Profit', 'Loss'].map(filter => (
                                <button key={filter} onClick={() => setSinyalHistoryFilter(filter)}
                                  className={`h-5 px-2 rounded text-[7px] font-bold transition-all ${
                                    sinyalHistoryFilter === filter
                                      ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40'
                                      : 'text-[var(--zv-muted)] border border-transparent hover:text-[var(--zv-text)]'
                                  }`}>
                                  {filter}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="max-h-40 overflow-y-auto space-y-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(59,130,246,0.2) transparent' }}>
                            {closedPos.slice(-20).reverse().filter(cp => {
                              if (sinyalHistoryFilter === 'Profit') return cp.status === 'won'
                              if (sinyalHistoryFilter === 'Loss') return cp.status === 'lost'
                              return true
                            }).map(cp => {
                              const isWon = cp.status === 'won'
                              const isUp = cp.direction === 'NAIK'
                              const plAmt = cp.closedPL !== undefined ? cp.closedPL : (isWon ? Math.round((cp.workingCapital || Math.round(cp.amount * 0.9)) * cp.profitPercent / 100) : -(cp.workingCapital || Math.round(cp.amount * 0.9)))
                              const leverageLabel = cp.leverage ? `1:${cp.leverage}` : '1:1000'
                              const feeLost = cp.fee || Math.round(cp.amount * 0.1)
                              return (
                                <div key={cp.id} className={`flex items-center justify-between px-3 py-2 rounded-lg border ${isWon ? 'bg-green-500/5 border-green-500/10' : 'bg-red-500/5 border-red-500/10'}`}>
                                  <div className="flex items-center gap-2">
                                    {isWon ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <XCircle className="w-3.5 h-3.5 text-red-500" />}
                                    <div>
                                      <div className="flex items-center gap-1">
                                        <span className={`text-[9px] font-black ${isUp ? 'text-green-400' : 'text-red-400'}`}>{cp.direction === 'NAIK' ? 'Beli' : 'Jual'}</span>
                                        <span className="text-[9px] font-bold text-[var(--zv-text)]">{cp.stockCode}</span>
                                      </div>
                                      <div className="text-[7px] text-[var(--zv-muted)]">
                                        {formatRupiah(cp.amount)} • {leverageLabel} • Fee {formatRupiah(feeLost)}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className={`text-[10px] font-black ${isWon ? 'text-green-400' : 'text-red-400'}`}>
                                      {isWon ? '+' : ''}{formatRupiah(plAmt)}
                                    </div>
                                    <div className="text-[7px] text-red-400">
                                      Fee -{formatRupiah(feeLost)} • Total: {isWon ? '+' : ''}{formatRupiah(plAmt - feeLost)}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )
                })()}

                {/* Trade history moved to Riwayat tab */}
              </div>
              </>)}

              {/* ====== AI SIGNAL PRO DASHBOARD ====== */}
              {sinyalView === 'ai-pro' && (() => {
                if (!selectedSinyalStock) return null
                // === COMPUTE AI SIGNAL DATA FROM LIVE CHART ===
                const allCandles = [...sinyalCandles]
                const sim = sinyalChartSimRef.current
                if (sim?.currentCandle && sim.currentCandle.tickCount > 0) {
                  allCandles.push({
                    idx: allCandles.length,
                    open: sim.currentCandle.open,
                    high: sim.currentCandle.high,
                    low: sim.currentCandle.low,
                    close: sim.currentCandle.close,
                    volume: sim.currentCandle.volume,
                    time: new Date().getHours().toString().padStart(2, '0') + ':' + new Date().getMinutes().toString().padStart(2, '0'),
                  })
                }

                // Signal strength from recent candles
                const recentCandles = allCandles.slice(-10)
                let bullCount = 0
                let totalChange = 0
                for (const c of recentCandles) {
                  if (c.close > c.open) bullCount++
                  totalChange += (c.close - c.open) / (c.open || 1)
                }
                const bearCount = recentCandles.length - bullCount
                const avgChange = recentCandles.length > 0 ? totalChange / recentCandles.length : 0

                let signalType: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL'
                if (avgChange > 0.003 && bullCount >= 7) signalType = 'STRONG_BUY'
                else if (avgChange > 0.001 && bullCount >= 6) signalType = 'BUY'
                else if (avgChange < -0.003 && bearCount >= 7) signalType = 'STRONG_SELL'
                else if (avgChange < -0.001 && bearCount >= 6) signalType = 'SELL'
                else signalType = 'HOLD'

                const signalConfig: Record<string, { label: string; color: string; bg: string; border: string; glow: string }> = {
                  STRONG_BUY: { label: 'STRONG BUY', color: '#00ff88', bg: 'rgba(0,255,136,0.08)', border: 'rgba(0,255,136,0.25)', glow: '0 0 20px rgba(0,255,136,0.25)' },
                  BUY: { label: 'BUY', color: '#22c55e', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.25)', glow: '0 0 15px rgba(34,197,94,0.2)' },
                  HOLD: { label: 'HOLD', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', glow: '0 0 15px rgba(245,158,11,0.2)' },
                  SELL: { label: 'SELL', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', glow: '0 0 15px rgba(239,68,68,0.2)' },
                  STRONG_SELL: { label: 'STRONG SELL', color: '#ff3333', bg: 'rgba(255,51,51,0.08)', border: 'rgba(255,51,51,0.25)', glow: '0 0 20px rgba(255,51,51,0.25)' },
                }
                const cfg = signalConfig[signalType]
                const curPrice = sinyalCurrentPrice || selectedSinyalStock.price
                const stockSeed = selectedSinyalStock.code.split('').reduce((a, c) => a + c.charCodeAt(0), 0)

                // AI Metrics
                const aiConfidence = Math.min(98, 75 + (bullCount * 2) + (stockSeed % 10))
                const aiAccuracy = Math.min(96, 82 + (stockSeed % 9))
                const winCount = sinyalPositions.filter(p => p.status === 'won').length
                const loseCount = sinyalPositions.filter(p => p.status === 'lost').length
                const aiWinrate = (winCount + loseCount) > 0 ? Math.round((winCount / (winCount + loseCount)) * 100) : (84 + (stockSeed % 7))
                const momentumLabel = signalType === 'STRONG_BUY' ? 'Strong Bullish' : signalType === 'BUY' ? 'Bullish' : signalType === 'HOLD' ? 'Neutral' : signalType === 'SELL' ? 'Bearish' : 'Strong Bearish'
                const momentumColor = signalType.includes('BUY') ? '#22c55e' : signalType.includes('SELL') ? '#ef4444' : '#f59e0b'
                const probabilityUp = signalType === 'STRONG_BUY' ? 92 : signalType === 'BUY' ? 78 : signalType === 'HOLD' ? 52 : signalType === 'SELL' ? 28 : 12

                // AI Analysis
                const smcStatus = signalType.includes('BUY') ? 'Accumulation' : signalType.includes('SELL') ? 'Distribution' : 'Consolidation'
                const smcColor = signalType.includes('BUY') ? 'text-green-400' : signalType.includes('SELL') ? 'text-red-400' : 'text-amber-400'
                const liquidityZone = curPrice * (1 + (signalType.includes('BUY') ? 0.02 : -0.02))
                const fakeBreakout = (stockSeed % 5 === 0) ? 'Caution' : 'Clear'
                const fakeBreakoutColor = fakeBreakout === 'Caution' ? 'text-amber-400' : 'text-green-400'
                const whaleActivity = (signalType === 'STRONG_BUY' || signalType === 'STRONG_SELL') ? 'High' : signalType === 'HOLD' ? 'Low' : 'Medium'
                const whaleColor = whaleActivity === 'High' ? 'text-red-400' : whaleActivity === 'Medium' ? 'text-amber-400' : 'text-green-400'
                const trendStrength = (signalType === 'STRONG_BUY' || signalType === 'STRONG_SELL') ? 'Strong' : signalType === 'HOLD' ? 'Weak' : 'Moderate'
                const trendColor = trendStrength === 'Strong' ? 'text-cyan-400' : trendStrength === 'Moderate' ? 'text-amber-400' : 'text-[var(--zv-muted)]'
                const volatility = (stockSeed % 3 === 0) ? 'High' : (stockSeed % 3 === 1) ? 'Medium' : 'Low'
                const volColor = volatility === 'High' ? 'text-red-400' : volatility === 'Medium' ? 'text-amber-400' : 'text-green-400'

                // Signal Details
                const isBuySignal = signalType.includes('BUY')
                const entryPrice = curPrice
                const stopLoss = isBuySignal ? curPrice * 0.98 : curPrice * 1.02
                const takeProfit1 = isBuySignal ? curPrice * 1.03 : curPrice * 0.97
                const takeProfit2 = isBuySignal ? curPrice * 1.05 : curPrice * 0.95
                const estimatedProfit = sinyalAmount && parseInt(sinyalAmount) >= 100000 ? Math.round(parseInt(sinyalAmount) * 0.9 * (sinyalLeverage / 100) * 0.03) : 0

                // News Impact
                const newsEvents = [
                  { name: 'CPI', impact: 'HIGH', time: '14:30 WIB', active: stockSeed % 3 === 0 },
                  { name: 'FOMC', impact: 'HIGH', time: '21:00 WIB', active: stockSeed % 4 === 0 },
                  { name: 'NFP', impact: 'HIGH', time: '14:30 WIB', active: stockSeed % 5 === 0 },
                ]
                const hasHighImpact = newsEvents.some(n => n.active)

                // Signal History from positions
                const signalHistoryEntries = [
                  ...sinyalPositions.filter(p => p.status !== 'active').slice(-5).reverse().map(p => ({
                    pair: p.stockCode,
                    signal: p.direction === 'NAIK' ? 'BUY' : 'SELL',
                    result: p.status === 'won' ? 'WIN' : 'LOSS' as string,
                    profit: p.closedPL !== undefined ? p.closedPL : (p.status === 'won' ? Math.round((p.workingCapital || Math.round(p.amount * 0.9)) * p.profitPercent / 100) : -(p.workingCapital || Math.round(p.amount * 0.9))),
                    timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                  })),
                ]
                if (sinyalPositions.some(p => p.status === 'active')) {
                  const activePos = sinyalPositions.find(p => p.status === 'active')!
                  signalHistoryEntries.unshift({
                    pair: activePos.stockCode,
                    signal: activePos.direction === 'NAIK' ? 'BUY' : 'SELL',
                    result: 'RUNNING',
                    profit: getPositionLivePL(activePos),
                    timestamp: 'now',
                  })
                }

                return (
                <div className="space-y-3 relative">
                  {/* Premium Lock Overlay — shown when not unlocked */}
                  {!aiProUnlocked && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-xl" style={{ background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(12px)' }}>
                      {/* Hologram lock animation */}
                      <div className="relative mb-4">
                        <div className="w-20 h-20 rounded-full flex items-center justify-center animate-ai-pulse-glow" style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, rgba(15,23,42,0.9) 70%)', border: '2px solid rgba(6,182,212,0.3)', boxShadow: '0 0 30px rgba(6,182,212,0.2), 0 0 60px rgba(6,182,212,0.1)' }}>
                          <Lock className="w-8 h-8 text-cyan-400" />
                        </div>
                        <div className="absolute inset-0 rounded-full animate-radar-ping" style={{ border: '2px solid rgba(6,182,212,0.4)' }} />
                      </div>
                      <div className="text-center px-6">
                        <div className="flex items-center justify-center gap-1.5 mb-2">
                          <Sparkles className="w-4 h-4 text-cyan-400" />
                          <span className="text-[14px] font-black text-cyan-400 uppercase tracking-[0.15em]">AI Signal Pro</span>
                          <Sparkles className="w-4 h-4 text-cyan-400" />
                        </div>
                        <p className="text-[10px] text-cyan-400/60 font-bold mb-4 leading-relaxed max-w-[260px]">
                          Analisis AI real-time, smart money detection, whale tracking, dan sinyal trading profesional.
                        </p>
                        <div className="rounded-xl px-6 py-3 mb-4 border border-amber-500/30" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(15,23,42,0.9) 100%)' }}>
                          <span className="block text-[7px] font-black text-amber-400/60 uppercase tracking-widest mb-1">Harga Premium</span>
                          <span className="block text-[22px] font-black text-amber-400">Rp 3.700.000</span>
                          <span className="block text-[7px] font-bold text-amber-400/40 mt-0.5">Sekali bayar • Akses selamanya</span>
                        </div>
                        <button onClick={() => setAiProUnlocked(true)}
                          className="w-full h-12 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
                          style={{ background: 'linear-gradient(135deg, #0891b2 0%, #1d4ed8 50%, #7c3aed 100%)', boxShadow: '0 4px 20px rgba(6,182,212,0.3), 0 0 40px rgba(59,130,246,0.15)' }}>
                          <Gem className="w-4 h-4" />
                          Aktifkan AI Signal Pro
                        </button>
                        <span className="block text-[7px] text-cyan-400/30 mt-2 font-bold">Preview dashboard di bawah (blurred)</span>
                      </div>
                    </div>
                  )}

                  {/* Dashboard Content — blurred when locked */}
                  <div className={aiProUnlocked ? '' : 'blur-sm pointer-events-none select-none'}>

                  {/* ── Stock selector for AI Pro ── */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 custom-scrollbar" style={{ scrollbarWidth: 'none' }}>
                    {stocks.filter(s => {
                      const cat = s.category?.toLowerCase() || ''
                      if (sinyalCategory === 'popular') return true
                      if (sinyalCategory === 'crypto') return cat.includes('crypto') || cat.includes('kripto') || ['BTC', 'ETH', 'XRP', 'SOL', 'DOGE', 'ADA', 'AVAX', 'DOT', 'MATIC', 'LINK', 'BCH', 'LTC', 'XLM', 'UNI', 'AAVE'].includes(s.code)
                      if (sinyalCategory === 'komoditas') return cat.includes('commodity') || cat.includes('komoditas') || ['XOM', 'CVX', 'COP', 'GOLD', 'SILVER', 'OIL', 'NATGAS', 'COPPER'].includes(s.code)
                      if (sinyalCategory === 'forex') return cat.includes('forex') || ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD', 'USDCHF'].includes(s.code)
                      return true
                    }).slice(0, 20).map(s => {
                      const isSelected = selectedSinyalStock?.id === s.id
                      return (
                        <button key={s.id} onClick={() => { setSelectedSinyalStock(s); setSinyalCandles([]); setSinyalCurrentPrice(0); setSinyalChartOffset(0); sinyalChartSimRef.current = null }}
                          className={`flex-shrink-0 h-7 px-2.5 rounded-lg text-[9px] font-bold flex items-center gap-1 transition-all border ${
                            isSelected
                              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-500/50 shadow-lg shadow-cyan-500/20'
                              : 'bg-[var(--zv-surface)] text-[var(--zv-text)] border-[var(--zv-border)] hover:border-cyan-500/50 hover:bg-[var(--zv-hover)]'
                          }`}>
                          <span>{s.code}</span>
                          <span className={`text-[7px] font-black ${isSelected ? 'text-cyan-300' : 'text-[var(--zv-muted)]'}`}>{formatRupiah(s.price).replace('Rp', '').trim()}</span>
                        </button>
                      )
                    })}
                  </div>

                  {/* ── AI Pro Premium Header ── */}
                  <div className="rounded-xl overflow-hidden animate-ai-pulse-glow animate-border-glow-cycle border"
                    style={{ background: `linear-gradient(135deg, ${cfg.bg} 0%, rgba(6,182,212,0.06) 25%, rgba(15,23,42,0.97) 50%, ${cfg.bg} 100%)`, borderColor: cfg.border }}>
                    {/* Hologram scan line */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
                      <div className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent animate-hologram-line" />
                      <div className="absolute inset-0 opacity-[0.03]" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(6,182,212,0.1) 2px, rgba(6,182,212,0.1) 4px)' }} />
                    </div>

                    <div className="relative z-10 px-4 py-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {/* Radar scanner */}
                          <div className="relative flex-shrink-0">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: `radial-gradient(circle, ${cfg.bg} 0%, transparent 70%)` }}>
                              <svg width="40" height="40" viewBox="0 0 40 40" className="animate-radar-scan">
                                <circle cx="20" cy="20" r="18" fill="none" stroke={cfg.color} strokeWidth="0.5" opacity="0.3" />
                                <circle cx="20" cy="20" r="13" fill="none" stroke={cfg.color} strokeWidth="0.5" opacity="0.2" />
                                <circle cx="20" cy="20" r="8" fill="none" stroke={cfg.color} strokeWidth="0.5" opacity="0.15" />
                                <line x1="20" y1="20" x2="20" y2="2" stroke={cfg.color} strokeWidth="1.5" opacity="0.8" strokeLinecap="round" />
                                <circle cx="20" cy="20" r="3" fill={cfg.color} opacity="0.9" />
                              </svg>
                            </div>
                            <div className="absolute inset-0 rounded-full animate-radar-ping" style={{ border: `1px solid ${cfg.color}`, opacity: 0.3 }} />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 mb-1">
                              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                              <span className="text-[8px] font-black text-cyan-400 uppercase tracking-[0.2em]">AI Signal Pro</span>
                              {aiProUnlocked && (
                                <span className="h-4 px-1.5 rounded-full bg-green-500/15 border border-green-500/30 text-[6px] font-black text-green-400 flex items-center gap-0.5">
                                  <CheckCircle className="w-2.5 h-2.5" /> ACTIVE
                                </span>
                              )}
                            </div>
                            <span className="text-[20px] font-black animate-signal-pulse leading-tight" style={{ color: cfg.color }}>{cfg.label}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-[7px] text-cyan-400/60 font-black uppercase tracking-widest block">Confidence</span>
                            <span className="text-[20px] font-black text-cyan-400">{aiConfidence}%</span>
                          </div>
                          <div className="relative w-14 h-14 flex-shrink-0">
                            <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
                              <circle cx="28" cy="28" r="22" fill="none" stroke="var(--zv-border)" strokeWidth="4" />
                              <circle cx="28" cy="28" r="22" fill="none" stroke={cfg.color} strokeWidth="4"
                                strokeDasharray={`${(aiConfidence / 100) * 138.2} ${138.2 - (aiConfidence / 100) * 138.2}`}
                                strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${cfg.color})`, transition: 'stroke-dasharray 1s ease' }} />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Sparkles className="w-4 h-4 text-cyan-400" />
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Stock info */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-black text-[var(--zv-text)]">{selectedSinyalStock.code}</span>
                          <span className="text-[10px] font-black" style={{ color: cfg.color }}>{formatRupiah(curPrice)}</span>
                          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: cfg.color, boxShadow: `0 0 8px ${cfg.color}` }} />
                        </div>
                        <span className="text-[7px] font-bold text-cyan-400/40 uppercase tracking-widest">AI Analysis Active</span>
                      </div>
                    </div>
                  </div>

                  {/* ── AI Metrics Row ── */}
                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { label: 'Accuracy', value: `${aiAccuracy}%`, color: '#22c55e' },
                      { label: 'Winrate', value: `${aiWinrate}%`, color: '#06b6d4' },
                      { label: 'Momentum', value: momentumLabel.split(' ')[0], color: momentumColor },
                      { label: 'Prob ↑', value: `${probabilityUp}%`, color: probabilityUp > 60 ? '#22c55e' : probabilityUp > 40 ? '#f59e0b' : '#ef4444' },
                      { label: 'Volatility', value: volatility, color: volatility === 'High' ? '#ef4444' : volatility === 'Medium' ? '#f59e0b' : '#22c55e' },
                    ].map((m, i) => (
                      <div key={i} className="relative rounded-xl p-2.5 border overflow-hidden"
                        style={{ background: `linear-gradient(135deg, rgba(6,182,212,0.06) 0%, rgba(15,23,42,0.95) 100%)`, borderColor: `${m.color}25` }}>
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--zv-border)]/30">
                          <div className="h-full animate-ai-metric-bar" style={{ background: m.color, '--metric-width': `${parseInt(m.value) || 50}%` } as React.CSSProperties} />
                        </div>
                        <span className="block text-[7px] text-[var(--zv-muted)] font-black uppercase tracking-wider">{m.label}</span>
                        <span className="block text-[13px] font-black mt-0.5" style={{ color: m.color }}>{m.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* ── AI Analysis Panel ── */}
                  <div className="rounded-xl border overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.04) 0%, rgba(15,23,42,0.97) 100%)', borderColor: 'rgba(6,182,212,0.2)' }}>
                    <div className="px-3 py-2 border-b flex items-center gap-1.5" style={{ borderColor: 'rgba(6,182,212,0.12)' }}>
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-[8px] font-black text-cyan-400 uppercase tracking-[0.15em]">AI Deep Analysis</span>
                      <div className="flex-1" />
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      <span className="text-[7px] font-bold text-cyan-400/60">SCANNING</span>
                    </div>
                    <div className="grid grid-cols-3 gap-px" style={{ background: 'rgba(6,182,212,0.08)' }}>
                      {[
                        { icon: '◈', label: 'Smart Money', value: smcStatus, color: smcColor },
                        { icon: '◇', label: 'Liquidity Zone', value: `Rp${formatNumber(Math.round(liquidityZone))}`, color: 'text-cyan-400' },
                        { icon: '⟐', label: 'Fake Breakout', value: fakeBreakout, color: fakeBreakoutColor },
                        { icon: '🐋', label: 'Whale Activity', value: whaleActivity, color: whaleColor },
                        { icon: '◈', label: 'Trend Strength', value: trendStrength, color: trendColor },
                        { icon: '◎', label: 'Vol Scanner', value: volatility, color: volColor },
                      ].map((item, i) => (
                        <div key={i} className="px-3 py-2.5" style={{ background: 'rgba(15,23,42,0.97)' }}>
                          <div className="flex items-center gap-1 mb-0.5">
                            <span className="text-[9px]" style={{ color: 'rgba(6,182,212,0.5)' }}>{item.icon}</span>
                            <span className="text-[7px] text-[var(--zv-muted)] font-bold uppercase tracking-wider">{item.label}</span>
                          </div>
                          <span className={`text-[10px] font-black ${item.color}`}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Signal Details ── */}
                  <div className="rounded-xl border overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.04) 0%, rgba(15,23,42,0.97) 100%)', borderColor: 'rgba(6,182,212,0.2)' }}>
                    <div className="px-3 py-2 border-b flex items-center gap-1.5" style={{ borderColor: 'rgba(6,182,212,0.12)' }}>
                      <Target className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-[8px] font-black text-cyan-400 uppercase tracking-[0.15em]">Signal Details</span>
                      <div className="flex-1" />
                      <span className="h-5 px-2 rounded-md text-[7px] font-black flex items-center gap-1" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: cfg.color }} />
                        LIVE
                      </span>
                    </div>
                    <div className="p-3 grid grid-cols-2 gap-x-4 gap-y-2">
                      {[
                        { label: 'Entry Price', value: formatRupiah(Math.round(entryPrice)), color: 'text-[var(--zv-text)]' },
                        { label: 'Stop Loss', value: formatRupiah(Math.round(stopLoss)), color: 'text-red-400' },
                        { label: 'Take Profit 1', value: formatRupiah(Math.round(takeProfit1)), color: 'text-green-400' },
                        { label: 'Take Profit 2', value: formatRupiah(Math.round(takeProfit2)), color: 'text-green-400' },
                        { label: 'Risk:Reward', value: '1:2.5', color: 'text-cyan-400' },
                        { label: 'Est. Profit', value: estimatedProfit > 0 ? `+${formatRupiah(estimatedProfit)}` : '—', color: 'text-green-400' },
                      ].map((d, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-[8px] text-[var(--zv-muted)] font-bold uppercase">{d.label}</span>
                          <span className={`text-[10px] font-black tabular-nums ${d.color}`}>{d.value}</span>
                        </div>
                      ))}
                    </div>
                    {/* Prediction line SVG */}
                    <div className="px-3 pb-3">
                      <div className="h-10 rounded-lg overflow-hidden" style={{ background: 'rgba(6,182,212,0.04)', border: '1px solid rgba(6,182,212,0.1)' }}>
                        <svg className="w-full h-full" viewBox="0 0 300 40" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id={`predGrad2-${signalType}`} x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor={cfg.color} stopOpacity="0.2" />
                              <stop offset="100%" stopColor={cfg.color} stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          {isBuySignal ? (
                            <>
                              <path d="M0,32 L40,28 L80,22 L120,18 L160,14 L200,10 L240,7 L280,4 L300,3 L300,40 L0,40Z" fill={`url(#predGrad2-${signalType})`} />
                              <path d="M0,32 L40,28 L80,22 L120,18 L160,14 L200,10 L240,7 L280,4 L300,3" fill="none" stroke={cfg.color} strokeWidth="2" className="animate-prediction-draw" style={{ filter: `drop-shadow(0 0 4px ${cfg.color})` }} />
                            </>
                          ) : signalType === 'HOLD' ? (
                            <>
                              <path d="M0,20 L40,19 L80,21 L120,20 L160,18 L200,20 L240,19 L280,21 L300,20 L300,40 L0,40Z" fill={`url(#predGrad2-${signalType})`} />
                              <path d="M0,20 L40,19 L80,21 L120,20 L160,18 L200,20 L240,19 L280,21 L300,20" fill="none" stroke={cfg.color} strokeWidth="2" className="animate-prediction-draw" style={{ filter: `drop-shadow(0 0 4px ${cfg.color})` }} />
                            </>
                          ) : (
                            <>
                              <path d="M0,8 L40,12 L80,18 L120,24 L160,28 L200,32 L240,35 L280,37 L300,38 L300,40 L0,40Z" fill={`url(#predGrad2-${signalType})`} />
                              <path d="M0,8 L40,12 L80,18 L120,24 L160,28 L200,32 L240,35 L280,37 L300,38" fill="none" stroke={cfg.color} strokeWidth="2" className="animate-prediction-draw" style={{ filter: `drop-shadow(0 0 4px ${cfg.color})` }} />
                            </>
                          )}
                          <circle cx="0" cy={isBuySignal ? 32 : signalType === 'HOLD' ? 20 : 8} r="3" fill={cfg.color}>
                            <animate attributeName="r" values="3;5;3" dur="1.5s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite" />
                          </circle>
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* ── News Impact ── */}
                  <div className={`rounded-xl border overflow-hidden ${hasHighImpact ? 'animate-flash-warning' : ''}`}
                    style={{ background: `linear-gradient(135deg, ${hasHighImpact ? 'rgba(239,68,68,0.1)' : 'rgba(6,182,212,0.04)'} 0%, rgba(15,23,42,0.97) 100%)`, borderColor: hasHighImpact ? 'rgba(239,68,68,0.35)' : 'rgba(6,182,212,0.2)' }}>
                    <div className="px-3 py-2 border-b flex items-center gap-1.5" style={{ borderColor: hasHighImpact ? 'rgba(239,68,68,0.2)' : 'rgba(6,182,212,0.12)' }}>
                      <AlertCircle className={`w-3.5 h-3.5 ${hasHighImpact ? 'text-red-400' : 'text-cyan-400'}`} />
                      <span className={`text-[8px] font-black uppercase tracking-[0.15em] ${hasHighImpact ? 'text-red-400' : 'text-cyan-400'}`}>
                        {hasHighImpact ? 'HIGH IMPACT NEWS DETECTED' : 'NEWS IMPACT MONITOR'}
                      </span>
                      {hasHighImpact && <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse ml-1" />}
                    </div>
                    <div className="flex gap-2 p-3">
                      {newsEvents.map((n, i) => (
                        <div key={i} className={`flex-1 rounded-lg px-2.5 py-2 border text-center transition-all ${n.active ? '' : 'opacity-40'}`}
                          style={{ background: n.active ? 'rgba(239,68,68,0.08)' : 'rgba(6,182,212,0.04)', borderColor: n.active ? 'rgba(239,68,68,0.2)' : 'rgba(6,182,212,0.12)' }}>
                          <span className={`block text-[10px] font-black ${n.active ? 'text-red-400' : 'text-cyan-400'}`}>{n.name}</span>
                          <span className={`block text-[7px] font-bold ${n.active ? 'text-red-400/60' : 'text-cyan-400/40'}`}>{n.impact} IMPACT</span>
                          <span className="block text-[7px] font-bold text-[var(--zv-muted)]">{n.time}</span>
                          {n.active && <span className="block text-[6px] font-black text-red-400 animate-pulse mt-0.5">⚠ ACTIVE</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Signal History ── */}
                  <div className="rounded-xl border overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.04) 0%, rgba(15,23,42,0.97) 100%)', borderColor: 'rgba(6,182,212,0.2)' }}>
                    <div className="px-3 py-2 border-b flex items-center gap-1.5" style={{ borderColor: 'rgba(6,182,212,0.12)' }}>
                      <History className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-[8px] font-black text-cyan-400 uppercase tracking-[0.15em]">Signal History</span>
                      <div className="flex-1" />
                      <span className="text-[7px] font-bold text-[var(--zv-muted)]">{signalHistoryEntries.length} entries</span>
                    </div>
                    {signalHistoryEntries.length > 0 ? (
                    <div className="max-h-40 overflow-y-auto custom-scrollbar" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(6,182,212,0.3) transparent' }}>
                      {signalHistoryEntries.map((h, i) => {
                        const resultCfg = h.result === 'WIN'
                          ? { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)', text: 'text-green-400' }
                          : h.result === 'LOSS'
                            ? { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)', text: 'text-red-400' }
                            : { bg: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.25)', text: 'text-cyan-400' }
                        return (
                          <div key={i} className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'rgba(6,182,212,0.06)' }}>
                            <div className="flex items-center gap-2.5">
                              <span className={`h-5 px-2 rounded text-[7px] font-black flex items-center gap-0.5 ${resultCfg.text}`} style={{ background: resultCfg.bg, border: `1px solid ${resultCfg.border}` }}>
                                {h.result === 'RUNNING' && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse mr-0.5" />}
                                {h.result}
                              </span>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-black text-[var(--zv-text)]">{h.pair}</span>
                                  <span className={`text-[8px] font-bold ${h.signal === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>{h.signal}</span>
                                </div>
                                <span className="text-[7px] text-[var(--zv-muted)]">{h.timestamp}</span>
                              </div>
                            </div>
                            <span className={`text-[10px] font-black tabular-nums ${h.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {h.profit >= 0 ? '+' : ''}{formatRupiah(h.profit)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                    ) : (
                    <div className="px-3 py-6 text-center">
                      <History className="w-6 h-6 text-[var(--zv-muted)]/30 mx-auto mb-2" />
                      <span className="block text-[9px] font-bold text-[var(--zv-muted)]">No signals yet</span>
                      <span className="block text-[7px] text-[var(--zv-muted)]/60 mt-0.5">Trade history will appear here</span>
                    </div>
                    )}
                  </div>

                  </div>{/* end blur wrapper */}
                </div>
                )
              })()}

            </motion.div>
          )}

          {/* ====== FINANCE TAB ====== */}
          {activeTab === 'finance' && (
            <motion.div key="finance" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <div className="max-w-lg mx-auto">
              {/* Finance Tabs */}
              <div className="flex gap-2 mb-4">
                <button onClick={() => { setFinanceTab('deposit'); setDepositStep('amount') }} className={`flex-1 h-10 rounded-2xl text-[11px] md:text-xs font-bold transition-all ${financeTab === 'deposit' ? (isDemo ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-900 shadow-md shadow-amber-500/20' : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/20') : 'bg-[var(--zv-panel)] border border-[var(--zv-border)] text-[var(--zv-muted)] hover:border-[#3b82f6]/30 hover:text-[#3b82f6]'}`}>
                  {isDemo ? <Sparkles className="w-3.5 h-3.5 inline mr-1" /> : <Plus className="w-3.5 h-3.5 inline mr-1" />}{isDemo ? 'Saldo Demo' : 'Deposit'}
                </button>
                {!isDemo && (
                <button onClick={() => setFinanceTab('withdraw')} className={`flex-1 h-10 rounded-2xl text-[11px] md:text-xs font-bold transition-all ${financeTab === 'withdraw' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/20' : 'bg-[var(--zv-panel)] border border-[var(--zv-border)] text-[var(--zv-muted)] hover:border-[#3b82f6]/30 hover:text-[#3b82f6]'}`}>
                  <Minus className="w-3.5 h-3.5 inline mr-1" />Withdraw
                </button>
                )}
              </div>

              {/* Demo Account: Balance Request Instead of Deposit */}
              {isDemo && financeTab === 'deposit' ? (
                <>
                  {/* Demo Balance Info */}
                  <div className="rounded-2xl p-4 bg-gradient-to-br from-amber-500/10 to-amber-400/5 border border-amber-500/20 mb-3">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                      <div>
                        <span className="block text-[10px] font-black text-amber-600 uppercase tracking-wider">Akun Demo</span>
                        <span className="block text-[8px] font-bold text-amber-500/70">Saldo virtual — tidak dapat ditarik</span>
                      </div>
                    </div>
                    <b className="block text-2xl font-black text-amber-600 mb-1">{formatRupiah(user?.balance || 0)}</b>
                    <span className="text-[8px] font-bold text-amber-500/50">Saldo saat ini</span>
                  </div>

                  {/* Demo Balance Request Form */}
                  <div className="rounded-2xl p-4 bg-[var(--zv-panel)] border border-[var(--zv-border)] mb-4">
                    <label className="block mb-1.5 text-[9px] font-black text-[var(--zv-muted)] uppercase tracking-widest">Tambah Saldo Demo</label>
                    <input type="number" value={demoRequestAmount} onChange={(e) => setDemoRequestAmount(e.target.value)} placeholder="Masukkan jumlah saldo"
                      className="w-full h-11 rounded-2xl bg-[var(--zv-surface)] border border-[var(--zv-border)] px-4 text-[13px] font-semibold text-[var(--zv-text)] outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all mb-2" />
                    <div className="grid grid-cols-4 gap-1.5 mb-4">
                      {['10000000', '50000000', '100000000', '250000000', '500000000', '750000000', '1000000000'].map(a => (
                        <button key={a} onClick={() => setDemoRequestAmount(a)} className="h-8 rounded-lg bg-[var(--zv-surface)] border border-[var(--zv-border)] text-[8px] md:text-[9px] font-bold text-amber-500 hover:bg-gradient-to-r hover:from-amber-500 hover:to-amber-400 hover:text-slate-900 hover:border-transparent transition-all">
                          {parseFloat(a) >= 1e9 ? `${(parseFloat(a) / 1e9).toFixed(0)}M` : parseFloat(a) >= 1e6 ? `${(parseFloat(a) / 1e6).toFixed(0)}jt` : `${(parseFloat(a) / 1e3).toFixed(0)}rb`}
                        </button>
                      ))}
                    </div>
                    <button onClick={handleDemoBalanceRequest} disabled={demoRequestLoading}
                      className="w-full h-12 rounded-2xl text-white text-[11px] font-black tracking-wider uppercase flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-70 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-900">
                      {demoRequestLoading ? (
                        <div className="w-5 h-5 rounded-full border-[3px] border-white/30 border-t-white animate-spin" />
                      ) : (
                        <><Sparkles className="w-4 h-4" />Tambah Saldo Demo</>
                      )}
                    </button>
                  </div>

                  {/* Demo Notice */}
                  <div className="rounded-xl p-3 bg-amber-500/5 border border-amber-500/10 mb-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[9px] font-bold text-amber-600 mb-0.5">Akun Demo</p>
                        <p className="text-[8px] text-amber-500/70 leading-relaxed">Saldo demo adalah saldo virtual yang tidak memiliki nilai riil. Anda dapat menambah saldo demo kapan saja untuk belajar trading. Akun demo <b>TIDAK DAPAT melakukan withdraw</b>.</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : !isDemo && financeTab === 'deposit' ? (
                <>
                  {depositStep === 'amount' ? (
                    <motion.div key="deposit-amount" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }}>
                      {/* Balance */}
                      <div className="rounded-2xl p-4 bg-gradient-to-br from-[var(--zv-surface)] to-[var(--zv-panel)] border border-[var(--zv-border)] mb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[9px] font-bold text-[var(--zv-muted)] uppercase tracking-wider">Saldo Saat Ini</span>
                            <b className="block text-xl font-black text-[#3b82f6]">{formatRupiah(user?.balance || 0)}</b>
                          </div>
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--zv-surface)] to-[var(--zv-surface)] border border-[var(--zv-border)] grid place-items-center">
                            <Wallet className="w-6 h-6 text-[#3b82f6]" />
                          </div>
                        </div>
                      </div>

                      {/* QRIS Header Badge */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-7 px-2.5 rounded-full flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-blue-500">
                          <CreditCard className="w-3 h-3 text-white" />
                          <span className="text-[8px] font-black text-white tracking-wide">QRIS PAYMENT</span>
                        </div>
                        <span className="text-[8px] font-bold text-[var(--zv-muted)]">Deposit hanya via QRIS</span>
                      </div>

                      {/* Deposit Amount Form Card */}
                      <div className="rounded-2xl p-4 bg-[var(--zv-panel)] border border-[var(--zv-border)] mb-4">

                        {/* Amount Input */}
                        <label className="block mb-1.5 text-[9px] font-black text-[var(--zv-muted)] uppercase tracking-widest">Jumlah Deposit</label>
                        <input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="Minimal Rp 100.000"
                          className="w-full h-11 rounded-2xl bg-[var(--zv-surface)] border border-[var(--zv-border)] px-4 text-[13px] font-semibold text-[var(--zv-text)] outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30 transition-all mb-2" />
                        <div className="grid grid-cols-4 gap-1.5 mb-4">
                          {['100000', '200000', '500000', '1000000', '2000000', '5000000', '10000000'].map(a => (
                            <button key={a} onClick={() => setDepositAmount(a)} className="h-8 rounded-lg bg-[var(--zv-surface)] border border-[var(--zv-border)] text-[8px] md:text-[9px] font-bold text-[#3b82f6] hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-500 hover:text-white hover:border-transparent transition-all">
                              {parseFloat(a) >= 1e6 ? `${(parseFloat(a) / 1e6).toFixed(0)}jt` : `${(parseFloat(a) / 1e3).toFixed(0)}rb`}
                            </button>
                          ))}
                        </div>

                        {/* QRIS Method Info */}
                        <div className="rounded-xl p-3 bg-[var(--zv-surface)] border border-[var(--zv-border)] mb-4">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-[#3b82f6]" />
                            <div>
                              <span className="block text-[9px] font-bold text-[var(--zv-text)]">QRIS</span>
                              <span className="block text-[7px] text-[var(--zv-muted)]">Scan QR code untuk pembayaran</span>
                            </div>
                          </div>
                        </div>

                        {/* Lanjutkan Button */}
                        <button onClick={() => {
                          if (!depositAmount || parseFloat(depositAmount) < 100000) {
                            toast({ title: 'Minimum deposit Rp 100.000', variant: 'destructive' })
                            return
                          }
                          setDepositStep('qris')
                        }}
                          className="w-full h-12 rounded-2xl text-white text-[11px] font-black tracking-wider uppercase flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
                          style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1e3a5f 50%, #2563eb 100%)' }}>
                          <span>Lanjutkan</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="deposit-qris" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                      {/* QRIS Payment Step */}
                      <div className="rounded-2xl p-4 bg-[var(--zv-panel)] border border-[var(--zv-border)] mb-4">

                        {/* QRIS Code */}
                        <div className="mb-4 flex flex-col items-center py-4">
                          {qrisImageUrl ? (
                            <div className="w-48 h-48 rounded-2xl bg-white border-2 border-[var(--zv-border)] p-2 mb-3 shadow-lg">
                              <img src={qrisImageUrl} alt="QRIS Payment" className="w-full h-full object-contain rounded-lg" />
                            </div>
                          ) : (
                            <div className="w-48 h-48 rounded-2xl bg-[var(--zv-panel)] border-2 border-dashed border-[var(--zv-border)] p-3 mb-3 flex items-center justify-center">
                              <svg viewBox="0 0 200 200" className="w-full h-full">
                                <rect width="200" height="200" fill="white" rx="8" />
                                <rect x="20" y="20" width="50" height="50" fill="#0c1a2e" rx="4" />
                                <rect x="28" y="28" width="34" height="34" fill="white" rx="2" />
                                <rect x="36" y="36" width="18" height="18" fill="#0c1a2e" rx="1" />
                                <rect x="130" y="20" width="50" height="50" fill="#0c1a2e" rx="4" />
                                <rect x="138" y="28" width="34" height="34" fill="white" rx="2" />
                                <rect x="146" y="36" width="18" height="18" fill="#0c1a2e" rx="1" />
                                <rect x="20" y="130" width="50" height="50" fill="#0c1a2e" rx="4" />
                                <rect x="28" y="138" width="34" height="34" fill="white" rx="2" />
                                <rect x="36" y="146" width="18" height="18" fill="#0c1a2e" rx="1" />
                                <rect x="80" y="20" width="8" height="8" fill="#0c1a2e" />
                                <rect x="96" y="20" width="8" height="8" fill="#0c1a2e" />
                                <rect x="112" y="36" width="8" height="8" fill="#0c1a2e" />
                                <rect x="80" y="60" width="8" height="8" fill="#0c1a2e" />
                                <rect x="96" y="60" width="8" height="8" fill="#0c1a2e" />
                                <rect x="112" y="60" width="8" height="8" fill="#0c1a2e" />
                                <rect x="20" y="80" width="8" height="8" fill="#0c1a2e" />
                                <rect x="36" y="96" width="8" height="8" fill="#0c1a2e" />
                                <rect x="52" y="80" width="8" height="8" fill="#0c1a2e" />
                                <rect x="130" y="80" width="8" height="8" fill="#0c1a2e" />
                                <rect x="146" y="80" width="8" height="8" fill="#0c1a2e" />
                                <rect x="80" y="96" width="8" height="8" fill="#0c1a2e" />
                                <rect x="112" y="96" width="8" height="8" fill="#0c1a2e" />
                                <rect x="130" y="130" width="8" height="8" fill="#0c1a2e" />
                                <rect x="162" y="162" width="8" height="8" fill="#0c1a2e" />
                                <rect x="80" y="162" width="8" height="8" fill="#0c1a2e" />
                                <rect x="96" y="162" width="8" height="8" fill="#0c1a2e" />
                                <text x="100" y="195" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#0c1a2e">QRIS</text>
                              </svg>
                            </div>
                          )}

                          {/* QRIS Logo */}
                          <img src="/qris-logo.png" alt="QRIS" className="h-6 object-contain mb-3" />

                          {/* Amount Display */}
                          <div className="rounded-xl px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 mb-3 shadow-lg shadow-blue-500/20">
                            <span className="text-[8px] font-bold text-white/80 uppercase tracking-wider block">Total Pembayaran</span>
                            <span className="text-lg font-black text-white">{formatRupiah(parseFloat(depositAmount) || 0)}</span>
                          </div>

                          {/* Instructions */}
                          <div className="flex items-start gap-2 px-4 mb-2">
                            <AlertCircle className="w-3.5 h-3.5 text-[var(--zv-muted)] flex-shrink-0 mt-0.5" />
                            <span className="text-[9px] text-[var(--zv-muted)] leading-relaxed">Scan QR code di atas menggunakan aplikasi e-wallet atau mobile banking Anda</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <button onClick={() => setDepositStep('amount')}
                            className="flex-1 h-12 rounded-2xl text-[11px] font-black tracking-wider uppercase flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform bg-[var(--zv-surface)] border border-[var(--zv-border)] text-[var(--zv-text)]">
                            <span>Kembali</span>
                          </button>
                          <button onClick={handleDeposit} disabled={depositLoading}
                            className="flex-[2] h-12 rounded-2xl text-white text-[11px] font-black tracking-wider uppercase flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-70"
                            style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1e3a5f 50%, #2563eb 100%)' }}>
                            {depositLoading ? (
                              <div className="w-5 h-5 rounded-full border-[3px] border-white/30 border-t-white animate-spin" />
                            ) : (
                              <><CheckCircle className="w-4 h-4" />Sudah Bayar</>
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Deposit History */}
                  <h3 className="text-[11px] font-black text-[#3b82f6] mb-2">Riwayat Deposit</h3>
                  <div className="space-y-1.5">
                    {deposits.map(d => (
                      <div key={d.id} className="rounded-2xl p-2.5 bg-[var(--zv-panel)] border border-[var(--zv-border)] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-[var(--zv-surface)] grid place-items-center"><Plus className="w-4 h-4 text-[#3b82f6]" /></div>
                          <div>
                            <span className="block text-[9px] font-bold text-[var(--zv-text)]">{d.method === 'qris' ? 'QRIS' : d.bankName || 'Transfer'}</span>
                            <span className="block text-[7px] text-[var(--zv-muted)]">{formatDateTime(d.createdAt)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="block text-[10px] font-black text-[#3b82f6]">+{formatRupiah(d.amount)}</span>
                          <span className={`block text-[7px] font-bold ${d.status === 'completed' ? 'text-[#3b82f6]' : d.status === 'pending' ? 'text-[#f59e0b]' : 'text-[#ef5350]'}`}>{d.status}</span>
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
                      <div className="rounded-2xl p-3 bg-[var(--zv-surface)] border border-[var(--zv-border)]">
                        <span className="text-[7px] font-bold text-[var(--zv-muted)]">Dompet Utama</span>
                        <b className="block text-[13px] font-black text-[#3b82f6]">{formatRupiah(user?.balance || 0)}</b>
                        <span className="block text-[6px] font-semibold text-[var(--zv-muted)] mt-0.5">Saldo deposit hanya untuk investasi</span>
                      </div>
                      <div className="rounded-2xl p-3 bg-[var(--zv-surface)] border border-[var(--zv-border)]">
                        <span className="text-[7px] font-bold text-[var(--zv-muted)]">Dompet Penarikan</span>
                        <b className="block text-[13px] font-black text-[#f59e0b]">{formatRupiah(user?.withdrawalBalance || 0)}</b>
                        <span className="block text-[6px] font-semibold text-[var(--zv-muted)] mt-0.5">Saldo yang dapat ditarik</span>
                      </div>
                    </div>
                    {/* Deposit not withdrawable notice */}
                    <div className="rounded-xl p-2 bg-[var(--zv-surface)] border border-[var(--zv-border)] mb-2">
                      <div className="flex items-start gap-1.5">
                        <AlertCircle className="w-3 h-3 text-[#f59e0b] flex-shrink-0 mt-0.5" />
                        <span className="text-[6px] font-bold text-[#f59e0b] leading-relaxed">⚠️ Saldo deposit tidak dapat ditarik. Saldo deposit hanya untuk investasi produk.</span>
                      </div>
                    </div>
                    {/* Transfer to withdrawal button */}
                    <button
                      onClick={() => toast({ title: 'Fitur Segera Hadir', description: 'Transfer ke penarikan akan tersedia segera' })}
                      className="w-full h-9 rounded-xl bg-[#3b82f6]/10 border border-[#3b82f6]/20 text-[#3b82f6] text-[9px] font-bold flex items-center justify-center gap-1.5 hover:bg-[#3b82f6]/20 transition-all"
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
                        className={`flex-1 h-9 rounded-xl text-[9px] md:text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${withdrawCategory === cat.key ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm shadow-blue-500/20' : 'bg-[var(--zv-panel)] border border-[var(--zv-border)] text-[var(--zv-muted)] hover:border-[#3b82f6]/30 hover:text-[#3b82f6]'}`}>
                        {cat.icon}{cat.label}
                      </button>
                    ))}
                  </div>

                  {/* KYC Withdrawal Info */}
                  <div className={`rounded-xl p-2.5 mb-3 border ${user?.kycStatus === 'verified' ? 'bg-green-500/5 border-green-500/10' : 'bg-yellow-500/5 border-yellow-500/10'}`}>
                    <div className="flex items-center gap-2">
                      {user?.kycStatus === 'verified' ? (
                        <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                      ) : (
                        <Shield className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="text-[9px] font-bold text-[var(--zv-text)]">
                          {user?.kycStatus === 'verified' ? 'KYC Verified' : 'Belum Verifikasi KYC'}
                        </p>
                        <p className="text-[8px] text-[var(--zv-muted)]">
                          {user?.kycStatus === 'verified'
                            ? 'Min. withdraw Rp 50.000 • Biaya admin 10%'
                            : 'Min. withdraw Rp 250.000 • Biaya admin 10% • Verifikasi KYC untuk min. Rp 50.000'}
                        </p>
                      </div>
                      {user?.kycStatus !== 'verified' && (
                        <button onClick={() => { setShowKycModal(true); fetchKycStatus() }} className="shrink-0 px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[8px] font-bold text-blue-500 hover:bg-blue-500/20 transition-colors">
                          Verifikasi
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Withdraw Form Card */}
                  <div className="rounded-2xl p-4 bg-[var(--zv-panel)] border border-[var(--zv-border)] mb-4">

                    {/* Bank Method Carousel */}
                    {withdrawCategory === 'bank' && (
                      <div className="mb-3">
                        <span className="block text-[9px] font-black text-[var(--zv-muted)] uppercase tracking-widest mb-2">Pilih Bank Tujuan</span>
                        <div className="carousel-hide-scrollbar flex gap-2 overflow-x-auto flex-nowrap pb-1">
                          {[
                            { code: 'BCA', name: 'BCA', color: '#003399' },
                            { code: 'BNI', name: 'BNI', color: '#F15A22' },
                            { code: 'BRI', name: 'BRI', color: '#00529C' },
                            { code: 'Mandiri', name: 'Mandiri', color: '#003066' },
                            { code: 'CIMB', name: 'CIMB', color: '#7B0E24' },
                            { code: 'Permata', name: 'Permata', color: '#005EAB' },
                            { code: 'BSI', name: 'BSI', color: '#00A650' },
                            { code: 'Danamon', name: 'Danamon', color: '#FDDA24' },
                            { code: 'Panin', name: 'Panin', color: '#003764' },
                            { code: 'Maybank', name: 'Maybank', color: '#002F6C' },
                            { code: 'OCBC', name: 'OCBC', color: '#E2231A' },
                            { code: 'BTN', name: 'BTN', color: '#F7941D' },
                            { code: 'Mega', name: 'Mega', color: '#00468B' },
                            { code: 'Sinarmas', name: 'Sinarmas', color: '#0061AF' },
                          ].map(bank => (
                            <button key={bank.code} onClick={() => setWithdrawBankMethod(bank.code)}
                              className={`shrink-0 w-[64px] rounded-xl p-1.5 border-2 transition-all flex flex-col items-center justify-center gap-1 ${withdrawBankMethod === bank.code ? 'border-[#3b82f6] bg-[#3b82f6]/10 shadow-sm shadow-blue-500/10' : 'border-[var(--zv-border)] bg-[var(--zv-surface)] hover:border-[#3b82f6]/30'}`}>
                              <div className="w-8 h-8 rounded-lg grid place-items-center text-white text-[8px] font-black" style={{ backgroundColor: bank.color }}>
                                {bank.name.slice(0, 2)}
                              </div>
                              <span className={`text-[6px] font-bold text-center leading-tight ${withdrawBankMethod === bank.code ? 'text-[#3b82f6]' : 'text-[var(--zv-muted)]'}`}>{bank.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* E-Wallet Method Carousel */}
                    {withdrawCategory === 'ewallet' && (
                      <div className="mb-3">
                        <span className="block text-[9px] font-black text-[var(--zv-muted)] uppercase tracking-widest mb-2">Pilih E-Wallet</span>
                        <div className="carousel-hide-scrollbar flex gap-2 overflow-x-auto flex-nowrap pb-1">
                          {[
                            { code: 'GOPAY', name: 'GoPay', color: '#00AED6' },
                            { code: 'OVO', name: 'OVO', color: '#4C2A86' },
                            { code: 'DANA', name: 'DANA', color: '#108EE9' },
                            { code: 'SHOPEEPAY', name: 'ShopeePay', color: '#EE4D2D' },
                            { code: 'LINKAJA', name: 'LinkAja', color: '#E82529' },
                            { code: 'SAKUKU', name: 'Sakuku', color: '#003399' },
                            { code: 'JENIUS', name: 'Jenius', color: '#00A651' },
                            { code: 'BLU', name: 'Blu by BCA', color: '#005BAA' },
                            { code: 'DOKU', name: 'Doku', color: '#E71E26' },
                            { code: 'ISAKU', name: 'iSaku', color: '#FF6B00' },
                          ].map(ew => (
                            <button key={ew.code} onClick={() => setWithdrawEwalletMethod(ew.code)}
                              className={`shrink-0 w-[64px] rounded-xl p-1.5 border-2 transition-all flex flex-col items-center justify-center gap-1 ${withdrawEwalletMethod === ew.code ? 'border-[#3b82f6] bg-[#3b82f6]/10 shadow-sm shadow-blue-500/10' : 'border-[var(--zv-border)] bg-[var(--zv-surface)] hover:border-[#3b82f6]/30'}`}>
                              <div className="w-8 h-8 rounded-lg grid place-items-center text-white text-[8px] font-black" style={{ backgroundColor: ew.color }}>
                                {ew.name.slice(0, 2)}
                              </div>
                              <span className={`text-[6px] font-bold text-center leading-tight ${withdrawEwalletMethod === ew.code ? 'text-[#3b82f6]' : 'text-[var(--zv-muted)]'}`}>{ew.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Crypto Method Carousel */}
                    {withdrawCategory === 'crypto' && (
                      <div className="mb-3">
                        <span className="block text-[9px] font-black text-[var(--zv-muted)] uppercase tracking-widest mb-2">Pilih Crypto</span>
                        <div className="carousel-hide-scrollbar flex gap-2 overflow-x-auto flex-nowrap pb-1">
                          {[
                            { code: 'USDT_TRC20', name: 'USDT', network: 'TRC20', color: '#26A17B' },
                            { code: 'USDT_ERC20', name: 'USDT', network: 'ERC20', color: '#627EEA' },
                            { code: 'BTC', name: 'BTC', network: 'BTC', color: '#F7931A' },
                            { code: 'ETH', name: 'ETH', network: 'ERC20', color: '#627EEA' },
                            { code: 'BNB', name: 'BNB', network: 'BEP20', color: '#F3BA2F' },
                            { code: 'SOL', name: 'SOL', network: 'SOL', color: '#9945FF' },
                            { code: 'XRP', name: 'XRP', network: 'XRP', color: '#23292F' },
                            { code: 'DOGE', name: 'DOGE', network: 'DOGE', color: '#C2A633' },
                          ].map(cr => (
                            <button key={cr.code} onClick={() => setWithdrawCryptoMethod(cr.code)}
                              className={`shrink-0 w-[64px] rounded-xl p-1.5 border-2 transition-all flex flex-col items-center justify-center gap-0.5 ${withdrawCryptoMethod === cr.code ? 'border-[#3b82f6] bg-[#3b82f6]/10 shadow-sm shadow-blue-500/10' : 'border-[var(--zv-border)] bg-[var(--zv-surface)] hover:border-[#3b82f6]/30'}`}>
                              <div className="w-7 h-7 rounded-full grid place-items-center text-white text-[7px] font-black" style={{ backgroundColor: cr.color }}>
                                {cr.name.slice(0, 2)}
                              </div>
                              <span className={`text-[7px] font-black text-center leading-tight ${withdrawCryptoMethod === cr.code ? 'text-[#3b82f6]' : 'text-[var(--zv-text)]'}`}>{cr.name}</span>
                              <span className="text-[5px] font-bold text-[var(--zv-muted)]">{cr.network}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Amount Input */}
                    <label className="block mb-1.5 text-[9px] font-black text-[var(--zv-muted)] uppercase tracking-widest">Jumlah Withdraw</label>
                    <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder={user?.kycStatus === 'verified' ? 'Minimal Rp 50.000' : 'Minimal Rp 250.000'}
                      className="w-full h-11 rounded-2xl bg-[var(--zv-surface)] border border-[var(--zv-border)] px-4 text-[13px] font-semibold text-[var(--zv-text)] outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30 transition-all mb-2" />
                    <div className="grid grid-cols-4 gap-1.5 mb-3">
                      {['50000', '100000', '200000', '500000', '1000000', '2000000', '5000000'].map(a => (
                        <button key={a} onClick={() => setWithdrawAmount(a)} className="h-8 rounded-lg bg-[var(--zv-surface)] border border-[var(--zv-border)] text-[8px] md:text-[9px] font-bold text-[#3b82f6] hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-500 hover:text-white hover:border-transparent transition-all">
                          {parseFloat(a) >= 1e6 ? `${(parseFloat(a) / 1e6).toFixed(0)}jt` : `${(parseFloat(a) / 1e3).toFixed(0)}rb`}
                        </button>
                      ))}
                    </div>

                    {/* Account Detail Form - Dynamic based on category */}
                    {withdrawCategory === 'bank' && (
                      <div className="mb-3">
                        <label className="block mb-1.5 text-[9px] font-black text-[var(--zv-muted)] uppercase tracking-widest">Nomor Rekening</label>
                        <input type="text" value={withdrawAccountNumber} onChange={(e) => setWithdrawAccountNumber(e.target.value)} placeholder="Masukkan nomor rekening"
                          className="w-full h-11 rounded-2xl bg-[var(--zv-surface)] border border-[var(--zv-border)] px-4 text-[13px] font-semibold text-[var(--zv-text)] outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30 transition-all mb-2" />
                        <label className="block mb-1.5 text-[9px] font-black text-[var(--zv-muted)] uppercase tracking-widest">Nama Pemilik Rekening</label>
                        <input type="text" value={withdrawAccountHolder} onChange={(e) => setWithdrawAccountHolder(e.target.value)} placeholder="Nama sesuai rekening"
                          className="w-full h-11 rounded-2xl bg-[var(--zv-surface)] border border-[var(--zv-border)] px-4 text-[13px] font-semibold text-[var(--zv-text)] outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30 transition-all" />
                      </div>
                    )}

                    {withdrawCategory === 'ewallet' && (
                      <div className="mb-3">
                        <label className="block mb-1.5 text-[9px] font-black text-[var(--zv-muted)] uppercase tracking-widest">Nomor HP / Email</label>
                        <input type="text" value={withdrawAccountNumber} onChange={(e) => setWithdrawAccountNumber(e.target.value)} placeholder="Masukkan nomor HP atau email e-wallet"
                          className="w-full h-11 rounded-2xl bg-[var(--zv-surface)] border border-[var(--zv-border)] px-4 text-[13px] font-semibold text-[var(--zv-text)] outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30 transition-all" />
                      </div>
                    )}

                    {withdrawCategory === 'crypto' && (
                      <div className="mb-3">
                        <label className="block mb-1.5 text-[9px] font-black text-[var(--zv-muted)] uppercase tracking-widest">Wallet Address</label>
                        <input type="text" value={withdrawAccountNumber} onChange={(e) => setWithdrawAccountNumber(e.target.value)} placeholder="Masukkan alamat wallet crypto"
                          className="w-full h-11 rounded-2xl bg-[var(--zv-surface)] border border-[var(--zv-border)] px-4 text-[13px] font-semibold text-[var(--zv-text)] outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30 transition-all" />
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
                  <h3 className="text-[11px] font-black text-[#3b82f6] mb-2">Riwayat Withdraw</h3>
                  <div className="space-y-1.5">
                    {withdrawals.map(w => (
                      <div key={w.id} className="rounded-2xl p-2.5 bg-[var(--zv-panel)] border border-[var(--zv-border)] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-[var(--zv-surface)] grid place-items-center"><Minus className="w-4 h-4 text-[#ef5350]" /></div>
                          <div>
                            <span className="block text-[9px] font-bold text-[var(--zv-text)]">{w.bankName || 'Transfer Bank'}</span>
                            <span className="block text-[7px] text-[var(--zv-muted)]">{formatDateTime(w.createdAt)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="block text-[10px] font-black text-[#ef5350]">-{formatRupiah(w.amount)}</span>
                          <span className={`block text-[7px] font-bold ${w.status === 'completed' ? 'text-[#3b82f6]' : w.status === 'processing' ? 'text-[#f59e0b]' : 'text-[#ef5350]'}`}>{w.status}</span>
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
              <h2 className="text-[14px] md:text-lg font-black text-[#3b82f6] mb-3">Riwayat</h2>

              {/* ── Sinyal Pro Trade History ── */}
              {sinyalPositions.filter(p => p.status !== 'active').length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-purple-500" />
                      <h3 className="text-[12px] font-black text-[var(--zv-text)]">Sinyal Pro</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-bold text-green-400">{sinyalPositions.filter(p => p.status === 'won').length} Menang</span>
                      <span className="text-[8px] text-[var(--zv-muted)]">•</span>
                      <span className="text-[8px] font-bold text-red-400">{sinyalPositions.filter(p => p.status === 'lost').length} Kalah</span>
                      <span className="text-[8px] text-[var(--zv-muted)]">•</span>
                      <span className="text-[8px] font-bold text-[var(--zv-muted)]">Win Rate {(() => {
                        const total = sinyalPositions.filter(p => p.status !== 'active').length
                        const wins = sinyalPositions.filter(p => p.status === 'won').length
                        return total > 0 ? `${Math.round(wins / total * 100)}%` : '0%'
                      })()}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5 max-h-80 overflow-y-auto custom-scrollbar">
                    {sinyalPositions.filter(p => p.status !== 'active').slice().reverse().map(pos => {
                      const isWon = pos.status === 'won'
                      const plAmt = pos.closedPL !== undefined ? pos.closedPL : (isWon ? Math.round((pos.workingCapital || Math.round(pos.amount * 0.9)) * pos.profitPercent / 100) : -(pos.workingCapital || Math.round(pos.amount * 0.9)))
                      const feeLost = pos.fee || Math.round(pos.amount * 0.1)
                      return (
                        <div key={pos.id} className={`rounded-xl p-2.5 border ${isWon ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-lg grid place-items-center ${isWon ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                {isWon ? <CheckCircle className="w-4 h-4 text-green-400" /> : <X className="w-4 h-4 text-red-400" />}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-black text-[var(--zv-text)]">{pos.stockCode}</span>
                                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${pos.direction === 'NAIK' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{pos.direction}</span>
                                </div>
                                <span className="text-[7px] text-[var(--zv-muted)]">{formatRupiah(pos.amount)} • Fee {formatRupiah(feeLost)} • Entry {formatNumber(pos.startPrice)}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`block text-[11px] font-black ${isWon ? 'text-green-400' : 'text-red-400'}`}>
                                {isWon ? '+' : ''}{formatRupiah(plAmt)}
                              </span>
                              <span className="text-[7px] text-red-400">Total: {isWon ? '+' : ''}{formatRupiah(plAmt - feeLost)}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ── Divider ── */}
              {sinyalPositions.filter(p => p.status !== 'active').length > 0 && filteredTransactions.length > 0 && (
                <div className="border-t border-[var(--zv-border)] my-4" />
              )}

              {/* ── Transaction History ── */}
              <div>
                <h3 className="text-[12px] font-black text-[var(--zv-text)] mb-2">Transaksi Saham</h3>

                {/* Filter */}
                <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3">
                  {[{ key: 'all', label: 'Semua' }, { key: 'BUY', label: 'Beli' }, { key: 'SELL', label: 'Jual' }, { key: 'DEPOSIT', label: 'Deposit' }, { key: 'WITHDRAW', label: 'Withdraw' }].map(f => (
                    <button key={f.key} onClick={() => setTxFilter(f.key)}
                      className={`flex-shrink-0 h-7 px-3 rounded-full text-[9px] font-bold transition-all ${txFilter === f.key ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm' : 'bg-[var(--zv-panel)] border border-[var(--zv-border)] text-[var(--zv-muted)] hover:border-[#3b82f6]/30 hover:text-[#3b82f6]'}`}>
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Transaction List */}
                <div className="space-y-1.5">
                  {filteredTransactions.map(tx => (
                    <div key={tx.id} className="rounded-2xl p-3 bg-[var(--zv-panel)] border border-[var(--zv-border)]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-9 h-9 rounded-xl grid place-items-center ${tx.type === 'BUY' ? 'bg-[var(--zv-surface)]' : 'bg-[var(--zv-surface)]'}`}>
                            {tx.type === 'BUY' ? <ArrowDownRight className="w-4 h-4 text-[#3b82f6]" /> : <ArrowUpRight className="w-4 h-4 text-[#ef5350]" />}
                          </div>
                          <div>
                            <span className="block text-[10px] font-black text-[var(--zv-text)]">
                              {tx.type === 'BUY' ? 'Beli' : 'Jual'} {tx.stock?.code || 'N/A'}
                            </span>
                            <span className="block text-[7px] text-[var(--zv-muted)]">{formatRupiah(tx.total)} {tx.orderType ? `(${tx.orderType})` : ''}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`block text-[10px] font-black ${tx.type === 'BUY' ? 'text-[#ef5350]' : 'text-[#3b82f6]'}`}>
                            {tx.type === 'BUY' ? '-' : '+'}{formatRupiah(tx.total)}
                          </span>
                          <div className="flex items-center gap-1 justify-end">
                            <span className={`w-1.5 h-1.5 rounded-full ${tx.status === 'completed' ? 'bg-[#3b82f6]' : tx.status === 'pending' ? 'bg-[#f59e0b]' : 'bg-[#ef5350]'}`} />
                            <span className="text-[7px] font-bold text-[var(--zv-muted)]">{tx.status}</span>
                          </div>
                          <span className="block text-[7px] text-[var(--zv-muted)]">{formatDateTime(tx.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredTransactions.length === 0 && (
                    <div className="text-center py-8">
                      <History className="w-10 h-10 text-[var(--zv-muted)] mx-auto mb-2" />
                      <p className="text-[11px] font-bold text-[var(--zv-muted)]">Belum ada transaksi</p>
                    </div>
                  )}
                </div>
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
                    <h2 className="text-[16px] md:text-xl font-black text-[#3b82f6]">Program Referral</h2>
                  </div>
                  <span className="text-[9px] font-black text-[#f59e0b] tracking-widest uppercase">Komisi Hingga 14%</span>
                  <p className="text-[8px] font-semibold text-[var(--zv-muted)] mt-0.5">Ajak Teman, Tumbuh Bersama</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-[#3b82f6]/10 border border-[#3b82f6]/20 grid place-items-center">
                  <UserPlus className="w-5 h-5 text-[#3b82f6]" />
                </div>
              </div>

              {/* ====== JARINGAN REFERRAL (TREE/SUN VISUAL) ====== */}
              <div className="rounded-2xl bg-[var(--zv-panel)] border border-[var(--zv-border)] mb-4 overflow-hidden">
                <div className="p-3 md:p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 grid place-items-center">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-[12px] md:text-[14px] font-black text-[#3b82f6]">Jaringan Referral</h3>
                      <span className="text-[7px] font-bold text-[#f59e0b] tracking-widest uppercase">Makin Banyak, Makin Luas!</span>
                    </div>
                  </div>

                  {/* Sun/Tree Network SVG Visualization */}
                  <div className="rounded-xl bg-[var(--zv-surface)] border border-[var(--zv-border)] p-3 mb-3 overflow-x-auto">
                    <svg viewBox="0 0 340 220" className="w-full min-w-[300px]" style={{ maxHeight: 220 }}>
                      <defs>
                        <radialGradient id="centerGrad" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#2563eb" />
                          <stop offset="100%" stopColor="#1e3a5f" />
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
                        <line key={`l1-${i}`} x1={l.fx} y1={l.fy} x2={l.tx} y2={l.ty} stroke="#2563eb" strokeWidth="2" strokeOpacity="0.6" />
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
                          <circle cx={n.x} cy={n.y} r="13" fill="#2563eb" fillOpacity="0.85" filter="url(#glow)" />
                          <text x={n.x} y={n.y + 3.5} textAnchor="middle" fontSize="8" fontWeight="bold" fill="white">{n.label}</text>
                        </g>
                      ))}

                      {/* Center node (YOU) */}
                      <circle cx="170" cy="110" r="28" fill="url(#centerGrad)" filter="url(#glow)" />
                      <circle cx="170" cy="110" r="28" fill="none" stroke="#f59e0b" strokeWidth="2" strokeOpacity="0.6" />
                      <text x="170" y="107" textAnchor="middle" fontSize="8" fontWeight="bold" fill="white">ANDA</text>
                      <text x="170" y="117" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#f59e0b">CENTER</text>

                      {/* Animated pulse on center */}
                      <circle cx="170" cy="110" r="28" fill="none" stroke="#2563eb" strokeWidth="2">
                        <animate attributeName="r" from="28" to="42" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="stroke-opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite" />
                      </circle>
                    </svg>
                  </div>

                  {/* Network Stats */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl p-2 bg-[var(--zv-surface)] border border-[var(--zv-border)] text-center">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                        <span className="text-[7px] font-black text-[var(--zv-muted)]">LEVEL 1</span>
                      </div>
                      <b className="block text-[14px] font-black text-[#3b82f6]">{referralInfo.tiers[0]?.activeMembers + referralInfo.tiers[0]?.inactiveMembers || 0}</b>
                      <span className="block text-[6px] font-bold text-[var(--zv-muted)]">Langsung</span>
                    </div>
                    <div className="rounded-xl p-2 bg-[var(--zv-surface)] border border-[var(--zv-border)] text-center">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                        <span className="text-[7px] font-black text-[var(--zv-muted)]">LEVEL 2</span>
                      </div>
                      <b className="block text-[14px] font-black text-[#ff9800]">{referralInfo.tiers[1]?.activeMembers + referralInfo.tiers[1]?.inactiveMembers || 0}</b>
                      <span className="block text-[6px] font-bold text-[var(--zv-muted)]">Cabang</span>
                    </div>
                    <div className="rounded-xl p-2 bg-[var(--zv-surface)] border border-[var(--zv-border)] text-center">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <span className="text-[7px] font-black text-[var(--zv-muted)]">LEVEL 3</span>
                      </div>
                      <b className="block text-[14px] font-black text-[#f59e0b]">{referralInfo.tiers[2]?.activeMembers + referralInfo.tiers[2]?.inactiveMembers || 0}</b>
                      <span className="block text-[6px] font-bold text-[var(--zv-muted)]">Akar</span>
                    </div>
                  </div>

                  {/* Expand hint */}
                  <div className="mt-2 text-center">
                    <span className="text-[7px] font-bold text-[var(--zv-muted)]">💡 Semakin banyak yang Anda undang, jaringan makin luas seperti akar pohon!</span>
                  </div>
                </div>
              </div>

              {/* Hero Card */}
              <div className="rounded-3xl overflow-hidden mb-4 relative" style={{ background: 'linear-gradient(145deg, #0c1a2e 0%, #1e3a5f 54%, #2563eb 100%)' }}>
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
                    <span className="block text-[9px] font-bold text-blue-200 mt-0.5">Komisi Hingga</span>
                  </div>

                  <h3 className="text-[14px] md:text-[16px] font-black mb-1">Ajak Teman, Tumbuh Bersama</h3>
                  <p className="text-[9px] md:text-[10px] text-blue-200 leading-relaxed max-w-[300px] mx-auto mb-4">
                    Dapatkan komisi dari setiap teman yang berinvestasi melalui tautan referral Anda.
                  </p>

                  {/* Total Commission */}
                  <div className="rounded-2xl p-3 bg-white/10 border border-white/15">
                    <span className="block text-[8px] font-bold text-blue-200 mb-1">TOTAL KOMISI DIPEROLEH</span>
                    <b className="text-[20px] md:text-[24px] font-black text-yellow-300">{formatRupiah(referralInfo.totalCommission)}</b>
                    {referralInfo.pendingCommission > 0 && (
                      <div className="mt-1 flex items-center justify-center gap-2">
                        <span className="text-[8px] text-blue-200">Pending: {formatRupiah(referralInfo.pendingCommission)}</span>
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
                          className="h-6 px-3 rounded-lg bg-yellow-500 text-[var(--zv-text)] text-[8px] font-black inline-flex items-center gap-1 hover:bg-yellow-400 transition-colors disabled:opacity-50"
                        >
                          {claimLoading ? <div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <><DollarSign className="w-3 h-3" />Klaim</>}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Referral Code & Link */}
              <div className="rounded-2xl p-4 bg-[var(--zv-panel)] border border-[var(--zv-border)] mb-4">
                <span className="block text-[9px] font-black text-[#3b82f6] mb-2">Kode Referral Anda</span>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-11 rounded-xl bg-[var(--zv-surface)] border border-[var(--zv-border)] px-4 flex items-center">
                    <b className="text-[18px] font-black tracking-[0.2em] text-[#3b82f6]">{referralInfo.code || user?.referralCode || 'GSXXXX'}</b>
                  </div>
                  <button
                    onClick={() => { navigator.clipboard.writeText(referralInfo.code || user?.referralCode || ''); setCopied(true); setTimeout(() => setCopied(false), 2000); toast({ title: 'Kode disalin!' }) }}
                    className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 text-white grid place-items-center hover:from-blue-500 hover:to-blue-400 transition-all shadow-md shadow-blue-500/20"
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>

                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => { navigator.clipboard.writeText(referralInfo.code || user?.referralCode || ''); toast({ title: 'Kode disalin!' }) }}
                    className="flex-1 h-10 rounded-xl bg-[var(--zv-surface)] border border-[var(--zv-border)] text-[#3b82f6] text-[10px] font-bold hover:bg-[var(--zv-surface)] transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />Salin
                  </button>
                  <button
                    onClick={() => {
                      const shareText = `Gabung ZEVORIX dan mulai investasi! Daftar melalui tautan saya: https://globalsaham.com/register/${referralInfo.code || user?.referralCode || ''}`
                      if (navigator.share) {
                        navigator.share({ title: 'ZEVORIX - Undang Teman', text: shareText }).catch(() => {})
                      } else {
                        navigator.clipboard.writeText(shareText)
                        toast({ title: 'Link disalin!' })
                      }
                    }}
                    className="flex-1 h-10 rounded-xl bg-yellow-500 text-[var(--zv-text)] text-[10px] font-bold hover:bg-yellow-400 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5" />Bagikan
                  </button>
                </div>

                <span className="block text-[9px] font-black text-[var(--zv-muted)] mb-1">Tautan Referral</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-9 rounded-lg bg-[var(--zv-surface)] border border-[var(--zv-border)] px-3 flex items-center overflow-hidden">
                    <span className="text-[9px] font-semibold text-[var(--zv-text)] truncate">https://globalsaham.com/register/{referralInfo.code || user?.referralCode || 'GSXXXX'}</span>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="rounded-2xl p-3 bg-[var(--zv-panel)] border border-[var(--zv-border)] text-center">
                  <Users className="w-5 h-5 text-[#3b82f6] mx-auto mb-1" />
                  <b className="block text-[14px] font-black text-[#3b82f6]">{referralInfo.totalMembers}</b>
                  <span className="block text-[8px] font-bold text-[var(--zv-muted)]">Anggota</span>
                </div>
                <div className="rounded-2xl p-3 bg-[var(--zv-panel)] border border-[var(--zv-border)] text-center">
                  <Wallet className="w-5 h-5 text-[#f59e0b] mx-auto mb-1" />
                  <b className="block text-[12px] font-black text-[#f59e0b]">{formatRupiah(referralInfo.totalDeposit)}</b>
                  <span className="block text-[8px] font-bold text-[var(--zv-muted)]">Deposit</span>
                </div>
                <div className="rounded-2xl p-3 bg-[var(--zv-panel)] border border-[var(--zv-border)] text-center">
                  <DollarSign className="w-5 h-5 text-[#3b82f6] mx-auto mb-1" />
                  <b className="block text-[12px] font-black text-[#3b82f6]">{formatRupiah(referralInfo.totalCommission)}</b>
                  <span className="block text-[8px] font-bold text-[var(--zv-muted)]">Komisi</span>
                </div>
              </div>

              {/* Tier Commission System with Gem Badges */}
              <h3 className="text-[12px] font-black text-[#3b82f6] mb-3">Sistem Komisi Tier</h3>
              <div className="space-y-2 mb-4">
                {referralInfo.tiers.map((tier) => {
                  const tierColors = [
                    { bg: 'bg-blue-500', text: 'text-[#3b82f6]', light: 'bg-[var(--zv-surface)]', gem: '💎', border: 'border-[var(--zv-border)]' },
                    { bg: 'bg-orange-500', text: 'text-[#ff9800]', light: 'bg-[var(--zv-surface)]', gem: '🔥', border: 'border-[var(--zv-border)]' },
                    { bg: 'bg-blue-500', text: 'text-[#3b82f6]', light: 'bg-[var(--zv-surface)]', gem: '💚', border: 'border-[var(--zv-border)]' },
                  ]
                  const tc = tierColors[tier.level - 1] || tierColors[0]
                  return (
                    <div key={tier.level} className={`rounded-2xl p-3 bg-[var(--zv-panel)] border ${tc.border} shadow-sm`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-9 h-9 rounded-lg ${tc.bg} grid place-items-center text-white shadow-sm`}>
                            <Gem className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="block text-[10px] font-black text-[var(--zv-text)]">Level {tier.level}</span>
                            <span className="block text-[7px] text-[var(--zv-muted)]">
                              {tier.level === 1 ? 'Referral langsung' : tier.level === 2 ? 'Referral dari referral Anda' : 'Referral level ketiga'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-[18px] font-black ${tc.text}`}>
                            {tier.commissionPercent}%
                          </span>
                          <span className="block text-[7px] font-bold text-[var(--zv-muted)]">Komisi</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className={`rounded-lg p-1.5 ${tc.light} text-center`}>
                          <b className="block text-[11px] font-black text-[var(--zv-text)]">{tier.activeMembers + tier.inactiveMembers}</b>
                          <span className="block text-[6px] font-bold text-[var(--zv-muted)]">Anggota</span>
                        </div>
                        <div className={`rounded-lg p-1.5 ${tc.light} text-center`}>
                          <b className="block text-[9px] font-black text-[var(--zv-text)]">{tier.activeMembers}/{tier.inactiveMembers}</b>
                          <span className="block text-[6px] font-bold text-[var(--zv-muted)]">Aktif/Nonaktif</span>
                        </div>
                        <div className={`rounded-lg p-1.5 ${tc.light} text-center`}>
                          <b className="block text-[9px] font-black text-[#f59e0b]">{formatRupiah(tier.deposit)}</b>
                          <span className="block text-[6px] font-bold text-[var(--zv-muted)]">Deposit</span>
                        </div>
                      </div>
                      {tier.commission > 0 && (
                        <div className="mt-2 pt-2 border-t border-[var(--zv-border)] flex items-center justify-between">
                          <span className="text-[8px] font-bold text-[var(--zv-muted)]">Komisi Level {tier.level}</span>
                          <span className="text-[10px] font-black text-[#3b82f6]">+{formatRupiah(tier.commission)}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Referral History */}
              <h3 className="text-[12px] font-black text-[#3b82f6] mb-3">Riwayat Komisi</h3>
              <div className="rounded-2xl bg-[var(--zv-panel)] border border-[var(--zv-border)] overflow-hidden">
                {referralInfo.history.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto custom-scrollbar">
                    {referralInfo.history.map((h) => (
                      <div key={h.id} className="p-3 border-b border-[var(--zv-border)] last:border-0 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full grid place-items-center ${
                            h.level === 1 ? 'bg-[var(--zv-surface)]' : h.level === 2 ? 'bg-[var(--zv-surface)]' : 'bg-[var(--zv-surface)]'
                          }`}>
                            <Gem className={`w-3.5 h-3.5 ${
                              h.level === 1 ? 'text-[#3b82f6]' : h.level === 2 ? 'text-orange-500' : 'text-[#3b82f6]'
                            }`} />
                          </div>
                          <div>
                            <span className="block text-[9px] font-bold text-[var(--zv-text)]">{h.name}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[7px] text-[var(--zv-muted)]">{formatDate(h.date)}</span>
                              {h.status === 'claimed' && (
                                <span className="text-[6px] font-bold text-[#3b82f6] bg-[var(--zv-surface)] px-1 rounded">Diklaim</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="block text-[9px] font-black text-[#3b82f6]">+{formatRupiah(h.commission)}</span>
                          <span className="block text-[7px] text-[var(--zv-muted)]">Deposit: {formatRupiah(h.deposit)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <UserPlus className="w-10 h-10 text-[var(--zv-muted)] mx-auto mb-2" />
                    <p className="text-[10px] font-bold text-[var(--zv-muted)]">Belum ada komisi referral</p>
                    <p className="text-[8px] text-[var(--zv-muted)] mt-1">Ajak teman untuk mulai mendapatkan komisi</p>
                  </div>
                )}
              </div>

              {/* Backwards compat: referred users list */}
              {referralInfo.referredUsers.length > 0 && (
                <>
                  <h3 className="text-[12px] font-black text-[#3b82f6] mb-3 mt-4">Daftar Referral Langsung</h3>
                  <div className="space-y-1.5">
                    {referralInfo.referredUsers.map((u, i) => (
                      <div key={i} className="rounded-2xl p-2.5 bg-[var(--zv-panel)] border border-[var(--zv-border)] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[var(--zv-surface)] grid place-items-center"><User className="w-4 h-4 text-[#3b82f6]" /></div>
                          <div>
                            <span className="block text-[9px] font-bold text-[var(--zv-text)]">{u.name}</span>
                            <span className="block text-[7px] text-[var(--zv-muted)]">{formatDate(u.date)}</span>
                          </div>
                        </div>
                        <span className="text-[9px] font-black text-[#3b82f6]">+{formatRupiah(u.bonus)}</span>
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
              <h2 className="text-[14px] md:text-lg font-black text-[#3b82f6] mb-3">Berita & Edukasi</h2>
              <div className="space-y-2">
                {news.map(n => (
                  <div key={n.id} className="rounded-2xl p-3 bg-[var(--zv-panel)] border border-[var(--zv-border)]">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="h-5 px-2 rounded-full bg-[var(--zv-surface)] text-[7px] font-bold text-[#3b82f6] flex items-center">{n.category}</span>
                      <span className="text-[7px] text-[var(--zv-muted)]">{formatDate(n.createdAt)}</span>
                    </div>
                    <h4 className="text-[11px] font-bold text-[var(--zv-text)] leading-snug mb-1">{n.title}</h4>
                    <p className="text-[8px] text-[var(--zv-muted)] leading-relaxed line-clamp-2">{n.content}</p>
                  </div>
                ))}
                {news.length === 0 && (
                  <div className="text-center py-8">
                    <Newspaper className="w-10 h-10 text-[var(--zv-muted)] mx-auto mb-2" />
                    <p className="text-[11px] font-bold text-[var(--zv-muted)]">Belum ada berita</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ====== PROMOSI & BONUS DASHBOARD ====== */}
          {activeTab === 'bonus' && (
            <motion.div key="bonus" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>

              {/* ── HERO HEADER ── */}
              <div className="relative rounded-3xl overflow-hidden mb-5" style={{ background: 'linear-gradient(145deg, #0c0a1a 0%, #1a0a2e 30%, #3b1a6e 60%, #6d28d9 100%)' }}>
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(168,85,247,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(59,130,246,0.3) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(245,158,11,0.15) 0%, transparent 60%)' }} />
                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.05) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                {/* Animated floating orbs */}
                <div className="absolute top-6 left-8 w-16 h-16 rounded-full bg-purple-500/20 blur-xl animate-pulse pointer-events-none" />
                <div className="absolute bottom-4 right-10 w-20 h-20 rounded-full bg-yellow-400/15 blur-2xl animate-pulse pointer-events-none" style={{ animationDelay: '1s' }} />
                <div className="absolute top-10 right-20 w-12 h-12 rounded-full bg-blue-400/20 blur-lg animate-pulse pointer-events-none" style={{ animationDelay: '0.5s' }} />

                <div className="relative p-5 md:p-7 text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-2xl grid place-items-center" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', boxShadow: '0 4px 20px rgba(245,158,11,0.4)' }}>
                      <Gift className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-[18px] md:text-[22px] font-black tracking-tight">Promosi & Bonus</h2>
                      <span className="text-[9px] font-bold text-yellow-300 tracking-widest uppercase">Pusat Hadiah & Keuntungan</span>
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="rounded-2xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.12)' }}>
                      <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
                      <b className="block text-[14px] font-black">{dailyCheckStatus.streak}</b>
                      <span className="block text-[7px] font-bold text-purple-200/80">Hari Streak</span>
                    </div>
                    <div className="rounded-2xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.12)' }}>
                      <Gift className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                      <b className="block text-[14px] font-black">{bonuses.length}</b>
                      <span className="block text-[7px] font-bold text-purple-200/80">Total Bonus</span>
                    </div>
                    <div className="rounded-2xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.12)' }}>
                      <DollarSign className="w-5 h-5 text-green-400 mx-auto mb-1" />
                      <b className="block text-[14px] font-black">{formatRupiah(bonuses.reduce((s, b) => s + b.amount, 0)).replace('Rp', '').trim()}</b>
                      <span className="block text-[7px] font-bold text-purple-200/80">Total Diperoleh</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── SUB TABS ── */}
              <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 custom-scrollbar">
                {[
                  { key: 'daily' as const, label: 'Cek Harian', icon: <Flame className="w-3.5 h-3.5" /> },
                  { key: 'promo' as const, label: 'Promo', icon: <Zap className="w-3.5 h-3.5" /> },
                  { key: 'video' as const, label: 'Promosi Video', icon: <Video className="w-3.5 h-3.5" /> },
                  { key: 'history' as const, label: 'Riwayat', icon: <History className="w-3.5 h-3.5" /> },
                ].map(t => (
                  <button key={t.key} onClick={() => setPromoSubTab(t.key)}
                    className={`flex-shrink-0 h-9 px-4 rounded-xl flex items-center gap-1.5 text-[10px] font-bold transition-all ${promoSubTab === t.key ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-lg shadow-purple-500/20 scale-[1.02]' : 'bg-[var(--zv-surface)] border border-[var(--zv-border)] text-[var(--zv-muted)] hover:border-purple-500/30 hover:text-[var(--zv-text)]'}`}>
                    {t.icon}{t.label}
                  </button>
                ))}
              </div>

              {/* ── DAILY CHECK-IN ── */}
              {promoSubTab === 'daily' && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
                  {/* Streak Progress Card */}
                  <div className="relative rounded-2xl overflow-hidden mb-4" style={{ background: 'linear-gradient(135deg, #1a0a00 0%, #7c2d12 40%, #ea580c 100%)' }}>
                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.04) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                    <div className="relative p-5 text-white text-center">
                      <div className="w-16 h-16 rounded-full mx-auto mb-3 grid place-items-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 0 30px rgba(245,158,11,0.4)' }}>
                        <Flame className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-[16px] font-black mb-1">Cek Harian</h3>
                      <p className="text-[9px] text-orange-200 font-semibold mb-3">Klaim bonus setiap hari dan bangun streak Anda!</p>

                      {/* Streak Visualization */}
                      <div className="flex items-center justify-center gap-1 mb-4">
                        {Array.from({ length: 7 }).map((_, i) => {
                          const dayNum = i + 1
                          const isCompleted = dailyCheckStatus.streak >= dayNum
                          const isToday = dailyCheckStatus.streak === dayNum - 1 && dailyCheckStatus.canCheckToday
                          return (
                            <div key={i} className="flex flex-col items-center gap-0.5">
                              <div className={`w-9 h-9 rounded-xl grid place-items-center text-[10px] font-black transition-all ${isCompleted ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-md shadow-orange-500/30 scale-110' : isToday ? 'bg-white/20 border-2 border-dashed border-yellow-400/60 text-yellow-300 animate-pulse' : 'bg-white/10 text-white/30'}`}>
                                {isCompleted ? '✓' : dayNum}
                              </div>
                              <span className="text-[6px] font-bold text-white/50">Hari {dayNum}</span>
                            </div>
                          )
                        })}
                      </div>

                      {/* Reward Preview */}
                      <div className="rounded-xl p-2.5 bg-white/10 border border-white/15 mb-3 inline-block">
                        <span className="text-[8px] font-bold text-yellow-200">Bonus Hari Ini: </span>
                        <span className="text-[12px] font-black text-yellow-300">{formatRupiah(dailyCheckStatus.todayReward || 1000)}</span>
                      </div>

                      <div>
                        {dailyCheckStatus.canCheckToday ? (
                          <button onClick={handleDailyCheck} disabled={dailyCheckLoading}
                            className="h-11 px-10 rounded-2xl text-[12px] font-bold transition-all disabled:opacity-60 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02]"
                            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                            {dailyCheckLoading ? (
                              <span className="flex items-center gap-2"><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Memproses...</span>
                            ) : '🔥 Klaim Sekarang'}
                          </button>
                        ) : (
                          <div className="h-11 px-10 rounded-2xl bg-white/15 inline-flex items-center gap-1.5 text-[12px] font-bold">
                            <CheckCircle className="w-5 h-5 text-green-400" /> Sudah Diklaim Hari Ini ✓
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tasks */}
                  {tasks.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-[12px] font-black text-[var(--zv-text)] mb-3 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-purple-500/10 border border-purple-500/20 grid place-items-center"><ListChecks className="w-3.5 h-3.5 text-purple-400" /></div>
                        Tugas Bonus
                      </h3>
                      <div className="space-y-2">
                        {tasks.map(task => (
                          <div key={task.id} className="rounded-2xl p-3 bg-[var(--zv-panel)] border border-[var(--zv-border)] hover:border-purple-500/20 transition-all">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-xl grid place-items-center ${task.completed ? 'bg-green-500/10' : 'bg-purple-500/10'}`}>
                                  {task.completed ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Target className="w-4 h-4 text-purple-400" />}
                                </div>
                                <div>
                                  <span className="block text-[10px] font-bold text-[var(--zv-text)]">{task.title}</span>
                                  <span className="block text-[7px] text-[var(--zv-muted)]">{task.description}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="block text-[11px] font-black text-[#f59e0b]">+{formatRupiah(task.reward)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 rounded-full bg-[var(--zv-surface)] overflow-hidden">
                                <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500" style={{ width: `${Math.min(100, (task.progress / task.target) * 100)}%` }} />
                              </div>
                              <span className="text-[8px] font-bold text-[var(--zv-muted)]">{task.progress}/{task.target}</span>
                              {task.completed && !task.claimed && (
                                <button onClick={() => handleClaimTask(task.id)} disabled={taskClaimingId === task.id}
                                  className="h-6 px-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-500 text-white text-[8px] font-bold flex items-center gap-1 hover:from-purple-500 hover:to-blue-400 transition-all disabled:opacity-60">
                                  {taskClaimingId === task.id ? <div className="w-3 h-3 rounded-full border border-white/30 border-t-white animate-spin" /> : <><DollarSign className="w-3 h-3" />Klaim</>}
                                </button>
                              )}
                              {task.claimed && (
                                <span className="h-6 px-2 rounded-lg bg-green-500/10 text-green-500 text-[8px] font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" />Selesai</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── PROMO ── */}
              {promoSubTab === 'promo' && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
                  {/* Active Promos */}
                  {promos.length > 0 ? (
                    <div className="space-y-3">
                      {promos.map(p => (
                        <button key={p.id} onClick={() => { setSelectedPromo(p); setShowPromoDetailModal(true) }}
                          className="w-full text-left rounded-2xl overflow-hidden group hover:scale-[1.01] transition-all" style={{ background: 'linear-gradient(135deg, #0c1a2e 0%, #1e3a5f 50%, #2563eb 100%)' }}>
                          <div className="relative p-4 text-white">
                            <div className="flex items-center gap-2.5 mb-2">
                              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 border border-yellow-400/30 grid place-items-center">
                                <Zap className="w-5 h-5 text-yellow-300" />
                              </div>
                              <div className="flex-1">
                                <span className="block text-[12px] font-black">{p.title}</span>
                                <span className="block text-[8px] text-blue-200 mt-0.5">{p.type === 'deposit_bonus' ? 'Deposit Bonus' : p.type === 'trading_bonus' ? 'Trading Bonus' : p.type === 'welcome_bonus' ? 'Welcome Bonus' : p.type === 'referral_program' ? 'Referral Program' : p.type === 'trading_competition' ? 'Kompetisi Trading' : p.type === 'daily_checkin' ? 'Daily Check-in' : 'Special Promo'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="h-7 px-3 rounded-full bg-yellow-500/20 border border-yellow-400/30 flex items-center gap-1">
                                  <span className="text-[8px] font-black text-yellow-300">AKTIF</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/80 transition-colors" />
                              </div>
                            </div>
                            <p className="text-[9px] text-blue-100/80 leading-relaxed line-clamp-2">{p.description}</p>
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center gap-1 text-[8px] text-blue-200">
                                <CalendarDays className="w-3 h-3" />
                                <span>{p.startDate ? formatDate(p.startDate) : 'Sekarang'} — {p.endDate ? formatDate(p.endDate) : 'Berlangsung'}</span>
                              </div>
                              <span className="text-[8px] font-bold text-yellow-300 group-hover:underline">Lihat Detail →</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 rounded-full bg-[var(--zv-surface)] border border-[var(--zv-border)] grid place-items-center mx-auto mb-4">
                        <Zap className="w-8 h-8 text-[var(--zv-muted)]" />
                      </div>
                      <p className="text-[12px] font-bold text-[var(--zv-muted)]">Belum Ada Promo Aktif</p>
                      <p className="text-[9px] text-[var(--zv-muted)] mt-1">Cek kembali nanti untuk promo menarik!</p>
                    </div>
                  )}

                  {/* Upcoming Promo Teasers */}
                  <div className="mt-5">
                    <h3 className="text-[11px] font-black text-[var(--zv-text)] mb-3 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-yellow-500/10 border border-yellow-500/20 grid place-items-center"><Sparkles className="w-3.5 h-3.5 text-yellow-400" /></div>
                      Segera Hadir
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        { id: 'upcoming-deposit150', title: 'Bonus Deposit 150%', desc: 'Deposit minimal Rp 500.000 dan dapatkan bonus 150%', color: 'from-purple-600 to-blue-500', icon: <CreditCard className="w-4 h-4" /> },
                        { id: 'upcoming-marathon', title: 'Trading Marathon', desc: 'Trade 50x dan dapatkan bonus hingga Rp 500.000', color: 'from-orange-500 to-red-500', icon: <BarChart3 className="w-4 h-4" /> },
                        { id: 'upcoming-referral', title: 'Referral Super', desc: 'Ajak 10 teman dan dapatkan bonus Rp 100.000', color: 'from-green-500 to-emerald-500', icon: <UserPlus className="w-4 h-4" /> },
                        { id: 'upcoming-cashback', title: 'VIP Cashback', desc: 'Cashback 5% untuk semua transaksi VIP', color: 'from-yellow-500 to-amber-500', icon: <DollarSign className="w-4 h-4" /> },
                      ].map((promo) => (
                        <div key={promo.id} className="rounded-2xl p-3.5 bg-[var(--zv-panel)] border border-[var(--zv-border)] hover:border-purple-500/20 transition-all group">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${promo.color} grid place-items-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                              {promo.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="block text-[10px] font-black text-[var(--zv-text)]">{promo.title}</span>
                              <span className="block text-[7px] text-[var(--zv-muted)] mt-0.5 leading-relaxed">{promo.desc}</span>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-[var(--zv-muted)]" />
                              <span className="text-[7px] font-bold text-[var(--zv-muted)]">Segera Hadir</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setPromoNotified(prev => {
                                  const newNotified = new Set(prev)
                                  if (newNotified.has(promo.id)) {
                                    newNotified.delete(promo.id)
                                    toast({ title: 'Notifikasi Dibatalkan', description: `Anda tidak akan diberitahu untuk ${promo.title}` })
                                  } else {
                                    newNotified.add(promo.id)
                                    toast({ title: 'Akan Diberitahu! 🔔', description: `Anda akan diberitahu saat ${promo.title} dimulai` })
                                  }
                                  return newNotified
                                })
                              }}
                              className={`h-6 px-2.5 rounded-lg text-[7px] font-bold flex items-center gap-1 transition-all ${promoNotified.has(promo.id) ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' : 'bg-[var(--zv-surface)] border border-[var(--zv-border)] text-[var(--zv-muted)] hover:border-purple-500/30 hover:text-purple-500'}`}
                            >
                              {promoNotified.has(promo.id) ? <><Bell className="w-2.5 h-2.5" />Berlangganan</> : <><BellRing className="w-2.5 h-2.5" />Beri Tahu</>}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── PROMOSI VIDEO ── */}
              {promoSubTab === 'video' && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
                  {/* Video Promo Hero */}
                  <div className="relative rounded-2xl overflow-hidden mb-4" style={{ background: 'linear-gradient(135deg, #1a0020 0%, #4a044e 40%, #c026d3 100%)' }}>
                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 30% 70%, rgba(236,72,153,0.5) 0%, transparent 50%)' }} />
                    <div className="relative p-4 text-white">
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="w-10 h-10 rounded-xl grid place-items-center" style={{ background: 'linear-gradient(135deg, #ec4899, #f43f5e)', boxShadow: '0 4px 15px rgba(236,72,153,0.4)' }}>
                          <Video className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-[14px] font-black">Promosi Video</h3>
                          <span className="text-[8px] font-bold text-pink-200 tracking-widest uppercase">Review & Dapatkan Bonus!</span>
                        </div>
                      </div>

                      {/* How it works - Step cards */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {[
                          { step: '1', label: 'Upload Video', desc: 'Review ZEVORIX di sosial media', icon: '📹' },
                          { step: '2', label: 'Kirim Link', desc: 'Submit link video Anda', icon: '🔗' },
                          { step: '3', label: 'Dapat Views', desc: 'Video Anda ditonton', icon: '👀' },
                          { step: '4', label: 'Terima Bonus', desc: 'Dibayar per 1.000 views', icon: '💰' },
                        ].map((s, i) => (
                          <div key={i} className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <span className="text-[16px] block mb-0.5">{s.icon}</span>
                            <span className="block text-[9px] font-black text-white">{s.label}</span>
                            <span className="block text-[7px] text-pink-200/70">{s.desc}</span>
                          </div>
                        ))}
                      </div>

                      {/* Reward tiers */}
                      <div className="space-y-1.5 mb-3">
                        {[
                          { views: '1.000', bonus: 'Rp 5.000', icon: '🥉', color: 'from-amber-700 to-amber-500' },
                          { views: '10.000', bonus: 'Rp 50.000', icon: '🥈', color: 'from-gray-400 to-gray-300' },
                          { views: '100.000', bonus: 'Rp 500.000', icon: '🥇', color: 'from-yellow-500 to-yellow-300' },
                          { views: '1.000.000', bonus: 'Rp 5.000.000', icon: '💎', color: 'from-cyan-500 to-blue-400' },
                        ].map((t, i) => (
                          <div key={i} className="rounded-xl p-2 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div className="flex items-center gap-2">
                              <span className="text-[14px]">{t.icon}</span>
                              <span className="text-[9px] font-black text-white">{t.views} Views</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className={`h-1.5 w-8 rounded-full bg-gradient-to-r ${t.color}`} />
                              <span className="text-[10px] font-black text-yellow-300">{t.bonus}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Warning */}
                      <div className="rounded-xl p-2.5 flex items-start gap-1.5" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                        <AlertCircle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <span className="text-[7px] font-bold text-yellow-200/80 leading-relaxed">Views & Likes harus REAL/ORGANIK. Dilarang suntikan views/bot. Jika terdeteksi, bonus dibatalkan.</span>
                      </div>
                    </div>
                  </div>

                  {/* Platform Selector + Submit Form */}
                  <div className="rounded-2xl bg-[var(--zv-panel)] border border-[var(--zv-border)] p-3.5 mb-4">
                    <span className="block text-[9px] font-black text-[var(--zv-text)] uppercase tracking-widest mb-2">Pilih Platform</span>
                    <div className="flex gap-2 overflow-x-auto pb-1 mb-3 custom-scrollbar">
                      {[
                        { key: 'tiktok' as const, label: 'TikTok', icon: '🎵', gradient: 'from-black to-gray-800' },
                        { key: 'instagram' as const, label: 'Instagram', icon: '📸', gradient: 'from-purple-500 to-pink-500' },
                        { key: 'youtube' as const, label: 'YouTube', icon: '▶️', gradient: 'from-red-600 to-red-700' },
                        { key: 'facebook' as const, label: 'Facebook', icon: '📘', gradient: 'from-blue-600 to-blue-700' },
                        { key: 'twitter' as const, label: 'X/Twitter', icon: '🐦', gradient: 'from-gray-700 to-gray-900' },
                      ].map(p => (
                        <button key={p.key} onClick={() => setPromoPlatform(p.key)}
                          className={`flex-shrink-0 h-10 px-4 rounded-xl flex items-center gap-1.5 text-[10px] font-bold transition-all ${promoPlatform === p.key ? `bg-gradient-to-r ${p.gradient} text-white shadow-lg scale-105` : 'bg-[var(--zv-surface)] border border-[var(--zv-border)] text-[var(--zv-muted)] hover:border-pink-500/30'}`}>
                          <span className="text-[14px]">{p.icon}</span>
                          <span>{p.label}</span>
                        </button>
                      ))}
                    </div>

                    <span className="block text-[9px] font-black text-[var(--zv-text)] uppercase tracking-widest mb-2">Link Video</span>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--zv-muted)]" />
                        <input
                          type="url"
                          value={promoVideoLink}
                          onChange={(e) => setPromoVideoLink(e.target.value)}
                          placeholder={`Masukkan link ${promoPlatform === 'tiktok' ? 'TikTok' : promoPlatform === 'instagram' ? 'Instagram' : promoPlatform === 'youtube' ? 'YouTube' : promoPlatform === 'facebook' ? 'Facebook' : 'X/Twitter'}`}
                          className="w-full h-11 rounded-xl bg-[var(--zv-surface)] border border-[var(--zv-border)] pl-10 pr-3 text-[11px] font-semibold text-[var(--zv-text)] outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/30 transition-all placeholder:text-[var(--zv-muted)]"
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
                        className="h-11 px-5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[10px] font-bold flex items-center gap-1.5 hover:from-pink-400 hover:to-purple-500 transition-all disabled:opacity-60 flex-shrink-0 shadow-lg shadow-pink-500/20"
                      >
                        {promoSubmitLoading ? (
                          <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        ) : (
                          <><Send className="w-4 h-4" />Kirim</>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Submitted Videos */}
                  {promoVideos.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-[var(--zv-text)]">Video Anda ({promoVideos.length})</span>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-[#f59e0b]" />
                          <span className="text-[12px] font-black text-[#f59e0b]">{formatRupiah(promoVideos.reduce((s, v) => s + v.bonus, 0))}</span>
                        </div>
                      </div>
                      <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                        {promoVideos.map((v) => {
                          const platformInfo: Record<string, { label: string; icon: string; color: string }> = {
                            tiktok: { label: 'TikTok', icon: '🎵', color: 'bg-black' },
                            instagram: { label: 'Instagram', icon: '📸', color: 'bg-gradient-to-br from-purple-500 to-pink-500' },
                            youtube: { label: 'YouTube', icon: '▶️', color: 'bg-red-600' },
                            facebook: { label: 'Facebook', icon: '📘', color: 'bg-blue-600' },
                            twitter: { label: 'X/Twitter', icon: '🐦', color: 'bg-gray-800' },
                          }
                          const pi = platformInfo[v.platform] || platformInfo.tiktok
                          return (
                            <div key={v.id} className="rounded-2xl p-3 bg-[var(--zv-panel)] border border-[var(--zv-border)]">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className={`w-8 h-8 rounded-lg ${pi.color} grid place-items-center text-[14px]`}>
                                    {pi.icon}
                                  </div>
                                  <div>
                                    <span className="block text-[10px] font-bold text-[var(--zv-text)]">{pi.label}</span>
                                    <span className="block text-[7px] text-[var(--zv-muted)] truncate max-w-[160px]">{v.link}</span>
                                  </div>
                                </div>
                                <span className={`h-5 px-2 rounded-full text-[7px] font-black flex items-center gap-1 ${v.status === 'verified' ? 'bg-green-500/10 text-green-500' : v.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'}`}>
                                  {v.status === 'verified' ? <><CheckCircle className="w-2.5 h-2.5" />Verifikasi</> : v.status === 'pending' ? <><Clock className="w-2.5 h-2.5" />Diperiksa</> : <><AlertCircle className="w-2.5 h-2.5" />Ditolak</>}
                                </span>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                  <EyeIcon className="w-3.5 h-3.5 text-[#3b82f6]" />
                                  <span className="text-[9px] font-black text-[var(--zv-text)]">{v.views.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <ThumbsUp className="w-3.5 h-3.5 text-pink-500" />
                                  <span className="text-[9px] font-black text-[var(--zv-text)]">{v.likes.toLocaleString()}</span>
                                </div>
                                <div className="ml-auto flex items-center gap-1">
                                  <DollarSign className="w-3.5 h-3.5 text-[#f59e0b]" />
                                  <span className="text-[10px] font-black text-[#f59e0b]">{formatRupiah(v.bonus)}</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── BONUS HISTORY ── */}
              {promoSubTab === 'history' && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
                  {/* Total Stats */}
                  <div className="grid grid-cols-2 gap-2.5 mb-4">
                    <div className="rounded-2xl p-3.5 bg-[var(--zv-panel)] border border-[var(--zv-border)]">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 grid place-items-center"><Gift className="w-4 h-4 text-purple-400" /></div>
                        <span className="text-[8px] font-black text-[var(--zv-muted)] uppercase tracking-wider">Total Bonus</span>
                      </div>
                      <b className="block text-[16px] font-black text-[var(--zv-text)]">{formatRupiah(bonuses.reduce((s, b) => s + b.amount, 0))}</b>
                    </div>
                    <div className="rounded-2xl p-3.5 bg-[var(--zv-panel)] border border-[var(--zv-border)]">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 grid place-items-center"><Flame className="w-4 h-4 text-yellow-400" /></div>
                        <span className="text-[8px] font-black text-[var(--zv-muted)] uppercase tracking-wider">Streak</span>
                      </div>
                      <b className="block text-[16px] font-black text-[var(--zv-text)]">{dailyCheckStatus.streak} Hari</b>
                    </div>
                  </div>

                  {/* Bonus List */}
                  <h3 className="text-[11px] font-black text-[var(--zv-text)] mb-3 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 grid place-items-center"><History className="w-3.5 h-3.5 text-blue-400" /></div>
                    Riwayat Bonus
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                    {bonuses.map(b => {
                      const iconMap: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
                        daily_checkin: { icon: <Flame className="w-4 h-4" />, color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/20' },
                        trading_bonus: { icon: <BarChart3 className="w-4 h-4" />, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' },
                        deposit_bonus: { icon: <Wallet className="w-4 h-4" />, color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/20' },
                        referral_bonus: { icon: <UserPlus className="w-4 h-4" />, color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/20' },
                        welcome_bonus: { icon: <Sparkles className="w-4 h-4" />, color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/20' },
                      }
                      const info = iconMap[b.type] || iconMap.welcome_bonus
                      return (
                        <div key={b.id} className="rounded-2xl p-3 bg-[var(--zv-panel)] border border-[var(--zv-border)] hover:border-purple-500/20 transition-all">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-10 h-10 rounded-xl border grid place-items-center ${info.bg} ${info.color}`}>
                                {info.icon}
                              </div>
                              <div>
                                <span className="block text-[10px] font-bold text-[var(--zv-text)]">
                                  {b.type === 'daily_checkin' ? 'Daily Check-in' : b.type === 'trading_bonus' ? 'Trading Bonus' : b.type === 'deposit_bonus' ? 'Deposit Bonus' : b.type === 'referral_bonus' ? 'Referral Bonus' : 'Welcome Bonus'}
                                </span>
                                <span className="block text-[8px] text-[var(--zv-muted)]">{formatDateTime(b.createdAt)}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="block text-[12px] font-black text-green-500">+{formatRupiah(b.amount)}</span>
                              <span className="block text-[7px] font-bold text-green-500/60">{b.status === 'credited' ? 'Dikreditkan' : 'Pending'}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    {bonuses.length === 0 && (
                      <div className="text-center py-10">
                        <div className="w-16 h-16 rounded-full bg-[var(--zv-surface)] border border-[var(--zv-border)] grid place-items-center mx-auto mb-3">
                          <Gift className="w-7 h-7 text-[var(--zv-muted)]" />
                        </div>
                        <p className="text-[11px] font-bold text-[var(--zv-muted)]">Belum Ada Bonus</p>
                        <p className="text-[8px] text-[var(--zv-muted)] mt-1">Mulai check-in harian untuk mendapat bonus pertama!</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

            </motion.div>
          )}

          {/* ====== LEADERBOARD TAB ====== */}
          {activeTab === 'leaderboard' && (
            <motion.div key="leaderboard" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              <div className="rounded-3xl overflow-hidden mb-4" style={{ background: 'linear-gradient(145deg, #0c1a2e 0%, #1e3a5f 54%, #2563eb 100%)' }}>
                <div className="p-4 text-white text-center">
                  <Trophy className="w-10 h-10 text-yellow-300 mx-auto mb-2" />
                  <h2 className="text-[16px] md:text-xl font-black">Leaderboard</h2>
                  <p className="text-[9px] md:text-[10px] text-blue-200 mt-1">Top investor dengan profit tertinggi</p>
                </div>
              </div>

              <div className="space-y-1.5">
                {leaderboard.map((entry, i) => (
                  <div key={i} className={`rounded-2xl p-3 border shadow-sm flex items-center gap-3 ${i === 0 ? 'bg-[var(--zv-surface)] border-[var(--zv-border)]' : i === 1 ? 'bg-[var(--zv-surface)] border-[var(--zv-border)]' : i === 2 ? 'bg-[var(--zv-surface)] border-[var(--zv-border)]' : 'bg-[var(--zv-panel)] border-[var(--zv-border)]'}`}>
                    <div className={`w-8 h-8 rounded-full grid place-items-center text-[11px] font-black ${i === 0 ? 'bg-yellow-500 text-white' : i === 1 ? 'bg-gray-400 text-white' : i === 2 ? 'bg-orange-400 text-white' : 'bg-[var(--zv-surface)] text-[var(--zv-muted)]'}`}>
                      {entry.rank || i + 1}
                    </div>
                    <div className="flex-1">
                      <span className="block text-[10px] font-bold text-[var(--zv-text)]">{entry.name}</span>
                      <span className="block text-[8px] text-[var(--zv-muted)]">Profit: {formatRupiah(entry.profit)}</span>
                    </div>
                    <span className={`text-[11px] font-black ${entry.profitPercent >= 0 ? 'text-[#22c55e]' : 'text-[#ef5350]'}`}>{formatPercent(entry.profitPercent)}</span>
                  </div>
                ))}
                {leaderboard.length === 0 && (
                  <div className="text-center py-8">
                    <Trophy className="w-10 h-10 text-[var(--zv-muted)] mx-auto mb-2" />
                    <p className="text-[11px] font-bold text-[var(--zv-muted)]">Belum ada data leaderboard</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ====== PROFILE TAB ====== */}
          {activeTab === 'profil' && (
            <motion.div key="profile" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {/* Profile Header */}
              <div className="rounded-3xl overflow-hidden mb-4" style={{ background: 'linear-gradient(145deg, #0c1a2e 0%, #1e3a5f 54%, #2563eb 100%)' }}>
                <div className="p-4 text-white text-center">
                  <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/30 grid place-items-center mx-auto mb-2">
                    <User className="w-8 h-8 text-yellow-300" />
                  </div>
                  <h2 className="text-[14px] md:text-lg font-black">{user?.name}</h2>
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    <span className="text-[9px] md:text-[10px] text-blue-200">+62 {user?.phone}</span>
                    <span className="h-4 px-1.5 rounded-full bg-blue-500/30 border border-blue-400/40 text-[7px] font-black text-blue-300 flex items-center gap-0.5">
                      <CheckCircle className="w-2.5 h-2.5" />VERIFIED
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    {isDemo && (
                      <span className="h-5 px-2 rounded-full bg-amber-400/20 border border-amber-400/30 text-[7px] font-bold text-amber-300 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />DEMO
                      </span>
                    )}
                    <span className="h-5 px-2 rounded-full bg-yellow-500/20 border border-yellow-400/30 text-[7px] font-bold text-yellow-300 flex items-center gap-1">
                      <Award className="w-2.5 h-2.5" />Gold VIP
                    </span>
                    {user?.kycStatus === 'verified' && (
                      <span className="h-5 px-2 rounded-full bg-blue-500/20 border border-blue-400/30 text-[7px] font-bold text-blue-200 flex items-center gap-1">
                        <Shield className="w-2.5 h-2.5" />KYC Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Info */}
              <div className="rounded-2xl p-4 bg-[var(--zv-panel)] border border-[var(--zv-border)] mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[11px] font-black text-[#3b82f6]">Informasi Profil</h3>
                  <button onClick={() => { setProfileForm({ name: user?.name || '', email: user?.email || '', bankName: user?.bankName || '', bankAccount: user?.bankAccount || '', bankHolder: user?.bankHolder || '' }); setProfileEdit(!profileEdit) }}
                    className="text-[9px] font-bold text-[#3b82f6] hover:underline flex items-center gap-1">
                    <Settings className="w-3 h-3" />{profileEdit ? 'Batal' : 'Edit'}
                  </button>
                </div>
                {profileEdit ? (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[8px] font-bold text-[var(--zv-muted)] mb-0.5">Nama</label>
                      <input type="text" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="w-full h-9 rounded-xl bg-[var(--zv-surface)] border border-[var(--zv-border)] px-3 text-[11px] font-semibold text-[var(--zv-text)] outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30 transition-all" />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-[var(--zv-muted)] mb-0.5">Email</label>
                      <input type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        className="w-full h-9 rounded-xl bg-[var(--zv-surface)] border border-[var(--zv-border)] px-3 text-[11px] font-semibold text-[var(--zv-text)] outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30 transition-all" />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-[var(--zv-muted)] mb-0.5">Bank</label>
                      <input type="text" value={profileForm.bankName} onChange={(e) => setProfileForm({ ...profileForm, bankName: e.target.value })}
                        className="w-full h-9 rounded-xl bg-[var(--zv-surface)] border border-[var(--zv-border)] px-3 text-[11px] font-semibold text-[var(--zv-text)] outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30 transition-all" />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-[var(--zv-muted)] mb-0.5">Nomor Rekening</label>
                      <input type="text" value={profileForm.bankAccount} onChange={(e) => setProfileForm({ ...profileForm, bankAccount: e.target.value })}
                        className="w-full h-9 rounded-xl bg-[var(--zv-surface)] border border-[var(--zv-border)] px-3 text-[11px] font-semibold text-[var(--zv-text)] outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30 transition-all" />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-[var(--zv-muted)] mb-0.5">Nama Pemilik Rekening</label>
                      <input type="text" value={profileForm.bankHolder} onChange={(e) => setProfileForm({ ...profileForm, bankHolder: e.target.value })}
                        className="w-full h-9 rounded-xl bg-[var(--zv-surface)] border border-[var(--zv-border)] px-3 text-[11px] font-semibold text-[var(--zv-text)] outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30 transition-all" />
                    </div>
                    <button onClick={handleProfileSave} className="w-full h-10 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white text-[10px] font-bold hover:from-blue-500 hover:to-blue-400 transition-all shadow-md shadow-blue-500/20">
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
                      <div key={i} className="flex items-center justify-between py-1.5 border-b border-[var(--zv-border)] last:border-0">
                        <span className="text-[9px] font-bold text-[var(--zv-muted)]">{item.label}</span>
                        <span className="text-[9px] font-semibold text-[var(--zv-text)]">{item.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Menu Items */}
              <div className="rounded-2xl bg-[var(--zv-panel)] border border-[var(--zv-border)] overflow-hidden mb-4">
                {[
                  { icon: <Briefcase className="w-4 h-4 text-[#3b82f6]" />, label: 'Portofolio', desc: 'Lihat portofolio investasi', action: () => setActiveTab('portfolio') },
                  { icon: <Wallet className="w-4 h-4 text-[#22c55e]" />, label: 'Keuangan', desc: 'Deposit & penarikan', action: () => setActiveTab('finance') },
                  { icon: <History className="w-4 h-4 text-[#f59e0b]" />, label: 'Riwayat', desc: 'Riwayat transaksi', action: () => setActiveTab('history') },
                  { icon: <Gift className="w-4 h-4 text-[#9c27b0]" />, label: 'Promosi', desc: 'Klaim bonus & promo', action: () => setActiveTab('bonus') },
                  { icon: <UserPlus className="w-4 h-4 text-[#3b82f6]" />, label: 'Undang Teman', desc: 'Ajak teman, dapat komisi', action: () => setActiveTab('undang') },
                  { icon: <Settings className="w-4 h-4 text-[var(--zv-muted)]" />, label: 'Pengaturan', desc: 'Edit profil & keamanan', action: () => { setProfileForm({ name: user?.name || '', email: user?.email || '', bankName: user?.bankName || '', bankAccount: user?.bankAccount || '', bankHolder: user?.bankHolder || '' }); setProfileEdit(true) } },
                  { icon: <Shield className="w-4 h-4 text-[#3b82f6]" />, label: 'Verifikasi KYC', desc: user?.kycStatus === 'verified' ? 'Terverifikasi' : user?.kycStatus === 'pending' ? 'Menunggu verifikasi' : 'Belum verifikasi', action: () => { setShowKycModal(true); fetchKycStatus() } },
                  { icon: <HelpCircle className="w-4 h-4 text-[#f59e0b]" />, label: 'Bantuan', desc: 'FAQ & Support', action: () => setShowHelpModal(true) },
                ].map((item, i) => (
                  <button key={i} onClick={item.action} className="w-full flex items-center gap-3 p-3 border-b border-[var(--zv-border)] last:border-0 hover:bg-[var(--zv-surface)] transition-colors">
                    {item.icon}
                    <div className="flex-1 text-left">
                      <span className="block text-[10px] font-bold text-[var(--zv-text)]">{item.label}</span>
                      <span className="block text-[7px] text-[var(--zv-muted)]">{item.desc}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--zv-muted)]" />
                  </button>
                ))}
              </div>

              {/* Account Type Badge */}
              <div className="rounded-2xl p-3 bg-[var(--zv-panel)] border border-[var(--zv-border)] mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl grid place-items-center ${isDemo ? 'bg-amber-500/15 border border-amber-500/25' : 'bg-green-500/15 border border-green-500/25'}`}>
                    {isDemo ? <Sparkles className="w-5 h-5 text-amber-400" /> : <CheckCircle className="w-5 h-5 text-green-400" />}
                  </div>
                  <div className="flex-1">
                    <span className="block text-[10px] font-black text-[var(--zv-text)]">Akun {isDemo ? 'Demo' : 'Real'}</span>
                    <span className="block text-[8px] text-[var(--zv-muted)]">{isDemo ? 'Saldo virtual untuk latihan' : 'Saldo riil untuk trading'}</span>
                  </div>
                  <span className={`h-5 px-2 rounded-full text-[7px] font-bold flex items-center gap-1 ${isDemo ? 'bg-amber-500/20 border border-amber-400/30 text-amber-300' : 'bg-green-500/20 border border-green-400/30 text-green-300'}`}>
                    {isDemo ? 'DEMO' : 'REAL'}
                  </span>
                </div>
              </div>

              {/* Regulatory Footer */}
              <div className="rounded-2xl p-4 bg-gradient-to-br from-[var(--zv-surface)] to-[var(--zv-panel)] border border-[var(--zv-border)] mb-4 shadow-sm">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-[var(--zv-border)] grid place-items-center"><Shield className="w-4 h-4 text-[#3b82f6]" /></div>
                  <div className="w-8 h-8 rounded-lg bg-[var(--zv-border)] grid place-items-center"><CheckCircle className="w-4 h-4 text-[#f59e0b]" /></div>
                </div>
                <p className="text-center text-[8px] font-black text-[var(--zv-muted)] tracking-wider">ASET SAHAM • TERDAFTAR & DIAWASI OJK • V1.0</p>
              </div>

              {/* Logout */}
              <button onClick={() => { logout(); toast({ title: 'Berhasil logout' }) }}
                className="w-full h-11 rounded-2xl bg-[var(--zv-surface)] border border-[var(--zv-border)] text-[#ef5350] text-[11px] font-bold flex items-center justify-center gap-2 hover:bg-[var(--zv-border)] transition-colors">
                <LogOut className="w-4 h-4" />Keluar
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Trade Confirmation Modal - Tuca Style */}
      <AnimatePresence>
        {showConfirmTrade && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowConfirmTrade(false)} />
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto">
              <div className="rounded-t-3xl bg-[var(--zv-panel)] border-t border-[var(--zv-border)] p-5" style={{ boxShadow: '0 -10px 40px rgba(0,0,0,0.3)' }}>
                <div className="w-10 h-1 rounded-full bg-[var(--zv-border)] mx-auto mb-4" />
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${confirmTradeDir === 'NAIK' ? 'bg-green-500/15' : 'bg-red-500/15'}`}>
                    {confirmTradeDir === 'NAIK' ? <TrendingUp className="w-6 h-6 text-green-500" /> : <TrendingDown className="w-6 h-6 text-red-500" />}
                  </div>
                  <div>
                    <span className={`text-[10px] font-black ${confirmTradeDir === 'NAIK' ? 'text-green-500' : 'text-red-500'}`}>
                      {confirmTradeDir === 'NAIK' ? 'BELI' : 'JUAL'} {selectedSinyalStock?.code}
                    </span>
                    <span className="block text-[8px] text-[var(--zv-muted)]">
                      {confirmTradeDir === 'NAIK' ? 'Memprediksi kenaikan harga' : 'Memprediksi penurunan harga'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between py-2 border-b border-[var(--zv-border)]">
                    <span className="text-[10px] text-[var(--zv-muted)] font-bold">Jumlah Investasi</span>
                    <span className="text-[10px] font-black text-[var(--zv-text)]">{formatRupiah(parseInt(sinyalAmount) || 0)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[var(--zv-border)]">
                    <span className="text-[10px] text-red-400 font-bold">Fee 10% (Potong Langsung)</span>
                    <span className="text-[10px] font-black text-red-400">-{formatRupiah(Math.round((parseInt(sinyalAmount) || 0) * 0.10))}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[var(--zv-border)]">
                    <span className="text-[10px] text-blue-400 font-bold">Modal Kerja (Ikut Grafik)</span>
                    <span className="text-[10px] font-black text-blue-400">{formatRupiah(Math.round((parseInt(sinyalAmount) || 0) * 0.90))}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[var(--zv-border)]">
                    <span className="text-[10px] text-[var(--zv-muted)] font-bold">Leverage</span>
                    <span className="text-[10px] font-black text-amber-400">1:{sinyalLeverage}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[var(--zv-border)]">
                    <span className="text-[10px] text-[var(--zv-muted)] font-bold">Posisi Efektif</span>
                    <span className="text-[10px] font-black text-[var(--zv-text)]">{formatRupiah(Math.round((parseInt(sinyalAmount) || 0) * 0.90) * (sinyalLeverage / 100))}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[var(--zv-border)]">
                    <span className="text-[10px] text-[var(--zv-muted)] font-bold">Profit/Loss per 1%</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-green-400">+{formatRupiah(Math.round((parseInt(sinyalAmount) || 0) * 0.90 * (sinyalLeverage / 100) * 0.01))}</span>
                      <span className="text-[9px] text-[var(--zv-muted)]">/</span>
                      <span className="text-[9px] font-bold text-red-400">-{formatRupiah(Math.round((parseInt(sinyalAmount) || 0) * 0.90 * (sinyalLeverage / 100) * 0.01))}</span>
                    </div>
                  </div>
                  <div className="rounded-lg p-2 bg-red-500/8 border border-red-500/15">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-3 h-3 text-red-400" />
                      <span className="text-[8px] font-bold text-red-400">Fee 10% langsung dipotong & TIDAK dikembalikan. Real MT5 trending — saldo ikut pergerakan grafik real-time!</span>
                    </div>
                  </div>
                </div>

                <button onClick={() => {
                  openSinyalPosition(confirmTradeDir)
                  setShowConfirmTrade(false)
                }} className={`w-full h-12 rounded-xl text-white text-[12px] font-black tracking-wide flex items-center justify-center gap-2 transition-all active:scale-[0.97] ${confirmTradeDir === 'NAIK' ? 'bg-gradient-to-r from-green-500 to-green-600 shadow-lg shadow-green-500/30' : 'bg-gradient-to-r from-red-500 to-red-600 shadow-lg shadow-red-500/30'}`}>
                  {confirmTradeDir === 'NAIK' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  KONFIRMASI {confirmTradeDir === 'NAIK' ? 'BELI' : 'JUAL'}
                </button>
                <button onClick={() => setShowConfirmTrade(false)} className="w-full h-10 mt-2 rounded-xl bg-[var(--zv-surface)] border border-[var(--zv-border)] text-[10px] font-bold text-[var(--zv-muted)] hover:text-[var(--zv-text)] transition-all">
                  Batal
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--zv-border)] md:hidden bottom-nav-safe glass-header">
        <div className="max-w-7xl mx-auto flex">
          {[
            { key: 'home', label: 'Beranda', icon: HomeIcon },
            { key: 'market', label: 'Pasar Saham', icon: BarChart3 },
            { key: 'sinyal', label: 'Sinyal', icon: Target },
            { key: 'investasi', label: 'Investasi', icon: DollarSign },
            { key: 'profil', label: 'Profil', icon: User },
          ].map(tab => {
            const isActive = activeTab === tab.key
            return (
              <button key={tab.key} onClick={() => {
                setActiveTab(tab.key)
              }} className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-all relative ${isActive ? 'text-[#3b82f6]' : 'text-[var(--zv-muted)] opacity-70 hover:opacity-100 hover:text-[var(--zv-text)]'}`}>
                {isActive && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[3px] rounded-b-full" style={{ background: 'linear-gradient(135deg, #3b82f6, #60a5fa)' }} />}
                <div className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${isActive ? 'bg-[#3b82f6]/10' : ''}`}>
                  <tab.icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                  <span className={`text-[9px] font-bold ${isActive ? 'text-[#3b82f6]' : ''}`}>{tab.label}</span>
                </div>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Desktop Sidebar Navigation - hidden on mobile */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 z-30 w-[72px] lg:w-[80px] border-r border-[var(--zv-border)] flex-col items-center pt-4 pb-4 gap-0.5" style={{ background: 'var(--zv-panel)' }}>
        {/* Logo */}
        <div className="flex flex-col items-center gap-1 mb-3 pb-3 border-b border-[var(--zv-border)]">
          <ZevorixLogo size={32} />
          <span className="text-[7px] font-black gradient-text tracking-wider">ZEVORIX</span>
        </div>
        {[
          { key: 'home', label: 'Beranda', icon: HomeIcon },
          { key: 'market', label: 'Pasar', icon: BarChart3 },
          { key: 'sinyal', label: 'Sinyal', icon: Target },
          { key: 'investasi', label: 'Investasi', icon: DollarSign },
          { key: 'profil', label: 'Profil', icon: User },
          { key: 'portfolio', label: 'Portofolio', icon: Briefcase },
          { key: 'finance', label: 'Keuangan', icon: Wallet },
          { key: 'history', label: 'Riwayat', icon: History },
          { key: 'undang', label: 'Undang', icon: UserPlus },
          { key: 'bonus', label: 'Promosi', icon: Gift },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`w-full flex flex-col items-center gap-0.5 py-2.5 transition-all relative ${activeTab === tab.key ? 'text-[#3b82f6] bg-[var(--zv-surface)]' : 'text-[var(--zv-muted)] opacity-70 hover:opacity-100 hover:text-[#3b82f6] hover:bg-[var(--zv-surface)]'}`}>
            {activeTab === tab.key && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full" style={{ background: 'linear-gradient(180deg, #3b82f6, #60a5fa)' }} />}
            <tab.icon className="w-5 h-5" />
            <span className="text-[7px] lg:text-[8px] font-bold">{tab.label}</span>
          </button>
        ))}
        <div className="mt-auto">
          <button onClick={() => { logout(); toast({ title: 'Berhasil logout' }) }}
            className="w-full flex flex-col items-center gap-0.5 py-2.5 text-[#ef5350] hover:text-[#ff6b6b] transition-colors">
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
            <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: 'spring', damping: 25 }} className="fixed left-0 top-0 bottom-0 z-50 w-[280px] md:w-[320px] bg-[var(--zv-panel)] border-r border-[var(--zv-border)] overflow-y-auto custom-scrollbar">
              <div className="p-5" style={{ background: 'linear-gradient(145deg, #0c1a2e 0%, #1e3a5f 54%, #2563eb 100%)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white/20 border border-white/10 grid place-items-center"><User className="w-6 h-6 text-yellow-300" /></div>
                    <div className="text-white">
                      <b className="block text-[13px] font-black">{user?.name}</b>
                      <span className="block text-[9px] text-blue-200">+62 {user?.phone}</span>
                    </div>
                  </div>
                  <button onClick={() => setShowSideMenu(false)} className="w-8 h-8 rounded-full bg-white/10 border border-white/10 grid place-items-center text-white hover:bg-white/20 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-xl p-2 bg-white/10 border border-white/15 text-center">
                    <Wallet className="w-4 h-4 text-yellow-300 mx-auto mb-0.5" />
                    <b className="block text-[9px] font-black text-white">{formatRupiah(user?.balance || 0).replace('Rp', '').trim()}</b>
                    <span className="block text-[7px] text-blue-200">Saldo</span>
                  </div>
                  <div className="flex-1 rounded-xl p-2 bg-white/10 border border-white/15 text-center">
                    <Briefcase className="w-4 h-4 text-blue-300 mx-auto mb-0.5" />
                    <b className="block text-[9px] font-black text-white">{portfolioSummary.totalCurrentValue > 0 ? formatRupiah(portfolioSummary.totalCurrentValue).replace('Rp', '').trim() : '0'}</b>
                    <span className="block text-[7px] text-blue-200">Portofolio</span>
                  </div>
                </div>
              </div>
              <div className="p-3">
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
                  { icon: <Gift className="w-4 h-4" />, label: 'Promosi & Bonus', key: 'bonus' },
                  { icon: <Trophy className="w-4 h-4" />, label: 'Leaderboard', key: 'leaderboard' },
                  { icon: <User className="w-4 h-4" />, label: 'Profil', key: 'profil' },
                ].map(item => (
                  <button key={item.key} onClick={() => { setActiveTab(item.key); setShowSideMenu(false) }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[11px] font-bold transition-all ${activeTab === item.key ? 'bg-[var(--zv-surface)] text-[#3b82f6] border border-[var(--zv-border)]' : 'text-[var(--zv-text)] hover:bg-[var(--zv-surface)]'}`}>
                    {item.icon}{item.label}
                  </button>
                ))}
                <div className="mt-3 pt-3 border-t border-[var(--zv-border)]">
                  <button onClick={() => { logout(); setShowSideMenu(false); toast({ title: 'Berhasil logout' }) }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[11px] font-bold text-[#ef5350] hover:bg-[var(--zv-surface)] transition-colors">
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
            <motion.div initial={{ x: 300 }} animate={{ x: 0 }} exit={{ x: 300 }} transition={{ type: 'spring', damping: 25 }} className="fixed right-0 top-0 bottom-0 z-50 w-[320px] md:w-[400px] bg-[var(--zv-panel)] border-l border-[var(--zv-border)] overflow-y-auto custom-scrollbar">
              <div className="p-4 border-b border-[var(--zv-border)] flex items-center justify-between" style={{ background: 'linear-gradient(145deg, var(--zv-surface) 0%, var(--zv-panel) 100%)' }}>
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#3b82f6]" />
                  <h3 className="text-[14px] font-black gradient-text">Notifikasi</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => markNotifRead()} className="text-[9px] font-bold text-[#3b82f6] hover:underline">Tandai dibaca</button>
                  <button onClick={() => setShowNotifPanel(false)} className="w-8 h-8 rounded-xl grid place-items-center hover:bg-[var(--zv-surface)] bg-[var(--zv-panel)] border border-[var(--zv-border)] text-[var(--zv-muted)] hover:text-[var(--zv-text)]"><X className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="p-3">
                {notifications.map(n => (
                  <div key={n.id} className={`p-3 rounded-xl mb-2 border transition-colors ${n.isRead ? 'bg-[var(--zv-panel)] border-[var(--zv-border)]' : 'bg-[var(--zv-surface)] border-[var(--zv-border)]'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-6 h-6 rounded-lg grid place-items-center ${n.type === 'trade' ? 'bg-[var(--zv-surface)]' : n.type === 'deposit' ? 'bg-[var(--zv-surface)]' : n.type === 'bonus' ? 'bg-[var(--zv-surface)]' : 'bg-[var(--zv-surface)]'}`}>
                        {n.type === 'trade' ? <BarChart3 className="w-3 h-3 text-[#3b82f6]" /> : n.type === 'deposit' ? <Wallet className="w-3 h-3 text-[#3b82f6]" /> : n.type === 'bonus' ? <Gift className="w-3 h-3 text-purple-400" /> : <Bell className="w-3 h-3 text-[#f59e0b]" />}
                      </div>
                      <span className="flex-1 text-[9px] font-bold text-[var(--zv-text)]">{n.title}</span>
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                    </div>
                    <p className="text-[8px] text-[var(--zv-muted)] leading-relaxed">{n.message}</p>
                    <span className="block text-[7px] text-[var(--zv-muted)] mt-1">{formatDateTime(n.createdAt)}</span>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <div className="text-center py-8">
                    <Bell className="w-8 h-8 text-[var(--zv-muted)] mx-auto mb-2" />
                    <p className="text-[10px] font-bold text-[var(--zv-muted)]">Tidak ada notifikasi</p>
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
            <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25 }} className="fixed z-50 bottom-0 left-0 right-0 md:inset-0 md:bottom-auto md:left-auto md:right-auto md:flex md:items-center md:justify-center max-h-[85vh] md:max-h-[90vh] bg-[var(--zv-panel)] rounded-t-3xl md:rounded-3xl border border-[var(--zv-border)] overflow-y-auto custom-scrollbar md:w-[90vw] md:max-w-md md:mx-auto md:my-auto">
              <div className="p-4 md:p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[14px] md:text-lg font-black text-[#3b82f6]">RINGKASAN INVESTASI</h3>
                  <button onClick={() => setShowInvestModal(false)} className="w-8 h-8 rounded-full grid place-items-center hover:bg-[var(--zv-surface)] text-[var(--zv-muted)] hover:text-[var(--zv-text)]"><X className="w-4 h-4" /></button>
                </div>

                {/* Product Info */}
                <div className="rounded-2xl p-3 mb-4" style={{ background: 'linear-gradient(145deg, #0c1a2e 0%, #1e3a5f 54%, #2563eb 100%)' }}>
                  <div className="text-white">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-5 h-5 text-yellow-300" />
                      <span className="text-[13px] font-black">{selectedProduct.name}</span>
                    </div>
                    <span className="text-[8px] font-bold text-blue-200">Aset Saham • {selectedProduct.category === 'starter' ? 'Paket Starter' : selectedProduct.category === 'growth' ? 'Paket Growth' : 'Paket Premium'}</span>
                  </div>
                </div>

                {/* Summary Details */}
                <div className="space-y-2.5 mb-4">
                  <div className="flex items-center justify-between py-1.5 border-b border-[var(--zv-border)]">
                    <span className="text-[9px] font-bold text-[var(--zv-muted)] uppercase tracking-wider">JUMLAH INVESTASI</span>
                    <span className="text-[12px] font-black text-[var(--zv-text)]">{formatRupiah(selectedProduct.modal)}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-[var(--zv-border)]">
                    <span className="text-[9px] font-bold text-[var(--zv-muted)] uppercase tracking-wider">SALDO TERSEDIA</span>
                    <span className={`text-[12px] font-black ${(user?.balance || 0) >= selectedProduct.modal ? 'text-[#3b82f6]' : 'text-[#ef5350]'}`}>{formatRupiah(user?.balance || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-[var(--zv-border)]">
                    <span className="text-[9px] font-bold text-[var(--zv-muted)] uppercase tracking-wider">PENDAPATAN HARIAN</span>
                    <span className="text-[12px] font-black text-[#22c55e]">+{formatRupiah(selectedProduct.dailyProfit)}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-[var(--zv-border)]">
                    <span className="text-[9px] font-bold text-[var(--zv-muted)] uppercase tracking-wider">DURASI</span>
                    <span className="text-[12px] font-black text-[var(--zv-text)]">{selectedProduct.duration} Hari</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-[9px] font-bold text-[var(--zv-muted)] uppercase tracking-wider">TOTAL KEUNTUNGAN</span>
                    <div className="text-right">
                      <span className="text-[12px] font-black text-[#22c55e]">{formatRupiah(selectedProduct.totalReturn)}</span>
                      <span className="ml-1 text-[8px] font-bold text-[#f59e0b] bg-[var(--zv-surface)] px-1 rounded">ROI {selectedProduct.roi}%</span>
                    </div>
                  </div>
                </div>

                {/* Balance Warning */}
                {(user?.balance || 0) < selectedProduct.modal && (
                  <div className="rounded-xl p-2.5 bg-[var(--zv-surface)] border border-[var(--zv-border)] mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-[#ef5350] flex-shrink-0" />
                    <span className="text-[9px] font-bold text-[#ef5350]">Saldo tidak mencukupi. Silakan deposit terlebih dahulu.</span>
                  </div>
                )}

                {/* Note */}
                <div className="rounded-xl p-2.5 bg-[var(--zv-surface)] border border-[var(--zv-border)] mb-4 flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-[#3b82f6] flex-shrink-0 mt-0.5" />
                  <span className="text-[8px] text-[#3b82f6] leading-relaxed">Pembelian akan diproses langsung dari saldo Anda setelah konfirmasi.</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button onClick={() => setShowInvestModal(false)} className="flex-1 h-11 rounded-xl bg-[var(--zv-surface)] border border-[var(--zv-border)] text-[var(--zv-muted)] text-[11px] font-bold hover:bg-[var(--zv-border)] transition-colors">
                    Nanti
                  </button>
                  <button onClick={handlePurchaseInvestment} disabled={investLoading || (user?.balance || 0) < selectedProduct.modal}
                    className="flex-1 h-11 rounded-xl text-white text-[11px] font-black disabled:opacity-70 hover:scale-[1.02] transition-transform"
                    style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1e3a5f 50%, #2563eb 100%)' }}>
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
            <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25 }} className="fixed z-50 bottom-0 left-0 right-0 md:inset-0 md:bottom-auto md:left-auto md:right-auto md:top-auto md:flex md:items-center md:justify-center max-h-[85vh] md:max-h-[90vh] bg-[var(--zv-panel)] rounded-t-3xl md:rounded-3xl border border-[var(--zv-border)] overflow-y-auto custom-scrollbar md:w-[90vw] md:max-w-2xl md:mx-auto md:my-auto">
              <div className="sticky top-0 bg-[var(--zv-panel)] p-4 border-b border-[var(--zv-border)] flex items-center justify-between rounded-t-3xl">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-[var(--zv-surface)] flex items-center justify-center">{selectedStock.logo ? <img src={selectedStock.logo} alt={selectedStock.code} className="w-full h-full object-cover" /> : <span className="text-[10px] font-black text-[#3b82f6]">{selectedStock.code.slice(0, 2)}</span>}</div>
                  <div>
                    <span className="block text-[12px] font-black text-[var(--zv-text)]">{selectedStock.code}</span>
                    <span className="block text-[8px] text-[var(--zv-muted)]">{selectedStock.name}</span>
                  </div>
                </div>
                <button onClick={() => setShowStockDetail(false)} className="w-8 h-8 rounded-lg grid place-items-center hover:bg-[var(--zv-surface)] text-[var(--zv-muted)] hover:text-[var(--zv-text)]"><X className="w-4 h-4" /></button>
              </div>

              <div className="p-4">
                {/* Price */}
                <div className="mb-3">
                  <span className="block text-2xl font-black text-[var(--zv-text)] tabular-nums">{formatRupiah(selectedStock.price)}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[11px] font-bold ${selectedStock.changePercent >= 0 ? 'text-[#22c55e]' : 'text-[#ef5350]'}`}>
                      {selectedStock.changePercent >= 0 ? <TrendingUp className="w-3.5 h-3.5 inline" /> : <TrendingDown className="w-3.5 h-3.5 inline" />}
                      {' '}{formatRupiah(selectedStock.change)} ({formatPercent(selectedStock.changePercent)})
                    </span>
                  </div>
                </div>
                  {/* Contract Profit Preview */}
                  <div className="mb-3 rounded-xl p-3 border border-[var(--zv-border)] bg-[var(--zv-surface)]">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Package className="w-4 h-4 text-[#3b82f6]" />
                      <span className="text-[10px] font-black text-[#3b82f6] uppercase tracking-wider">Info Kontrak</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-lg p-2 bg-[var(--zv-panel)] border border-[var(--zv-border)] text-center">
                        <span className="block text-[7px] font-bold text-[var(--zv-muted)]">Rate Dasar</span>
                        <span className="block text-[12px] font-black text-[#22c55e]">{getStockBaseRate(selectedStock.code)}%</span>
                        <span className="block text-[6px] text-[var(--zv-muted)]">per hari</span>
                      </div>
                      <div className="rounded-lg p-2 bg-[var(--zv-panel)] border border-[var(--zv-border)] text-center">
                        <span className="block text-[7px] font-bold text-[var(--zv-muted)]">Min. Durasi</span>
                        <span className="block text-[12px] font-black text-[#3b82f6]">30</span>
                        <span className="block text-[6px] text-[var(--zv-muted)]">hari</span>
                      </div>
                      <div className="rounded-lg p-2 bg-[var(--zv-panel)] border border-[var(--zv-border)] text-center">
                        <span className="block text-[7px] font-bold text-[var(--zv-muted)]">Max. Durasi</span>
                        <span className="block text-[12px] font-black text-[#3b82f6]">365</span>
                        <span className="block text-[6px] text-[var(--zv-muted)]">hari</span>
                      </div>
                    </div>
                    <div className="mt-2 rounded-lg p-2 bg-[var(--zv-panel)] border border-[var(--zv-border)]">
                      <div className="flex items-center gap-1 mb-1">
                        <Zap className="w-3 h-3 text-[#f59e0b]" />
                        <span className="text-[7px] font-bold text-[var(--zv-muted)]">Contoh: Rp 1.000.000 × 30 hari</span>
                      </div>
                      {(() => {
                        const exampleProfit = calcContractProfit(selectedStock, 30, 1000000)
                        return (
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] text-[var(--zv-muted)]">Profit/hari: <b className="text-[#22c55e]">{formatRupiah(exampleProfit.dailyProfitAmount)}</b></span>
                            <span className="text-[8px] text-[var(--zv-muted)]">Total: <b className="text-[#22c55e]">{formatRupiah(exampleProfit.totalReturn)}</b></span>
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
                    <div key={i} className="rounded-xl p-2 bg-[var(--zv-surface)] text-center">
                      <span className="block text-[7px] font-bold text-[var(--zv-muted)]">{s.label}</span>
                      <span className="block text-[8px] font-black text-[var(--zv-text)] tabular-nums">{s.value}</span>
                    </div>
                  ))}
                </div>

                {/* Fundamentals */}
                <div className="rounded-xl p-3 bg-[var(--zv-surface)] mb-3">
                  <h4 className="text-[9px] font-black text-[#3b82f6] mb-1.5">Data Fundamental</h4>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { label: 'Market Cap', value: formatMarketCap(selectedStock.marketCap) },
                      { label: 'P/E Ratio', value: selectedStock.peRatio?.toFixed(1) || '-' },
                      { label: 'PBV', value: selectedStock.pbv?.toFixed(2) || '-' },
                      { label: 'Div. Yield', value: selectedStock.dividendYield ? `${selectedStock.dividendYield.toFixed(2)}%` : '-' },
                    ].map((f, i) => (
                      <div key={i} className="flex items-center justify-between py-0.5">
                        <span className="text-[8px] text-[var(--zv-muted)]">{f.label}</span>
                        <span className="text-[8px] font-bold text-[var(--zv-text)]">{f.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contract Button */}
                <button onClick={() => { setContractModal(true); setShowStockDetail(false) }} className="w-full h-12 rounded-xl bg-[#3b82f6] text-white text-[12px] font-bold hover:bg-[#2e9e93] transition-colors flex items-center justify-center gap-2">
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
            <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25 }} className="fixed z-50 bottom-0 left-0 right-0 md:inset-0 md:bottom-auto md:left-auto md:right-auto md:top-auto md:flex md:items-center md:justify-center bg-[var(--zv-panel)] rounded-t-3xl md:rounded-3xl border border-[var(--zv-border)] md:w-[90vw] md:max-w-lg md:mx-auto md:my-auto">
              <div className="p-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl overflow-hidden bg-[var(--zv-surface)] flex items-center justify-center">
                      {selectedStock.logo ? <img src={selectedStock.logo} alt={selectedStock.code} className="w-full h-full object-cover" /> : <span className="text-[9px] font-black text-[#3b82f6]">{selectedStock.code.slice(0, 2)}</span>}
                    </div>
                    <div>
                      <h3 className="text-[14px] font-black text-[#3b82f6]">Beli Kontrak {selectedStock.code}</h3>
                      <span className="text-[8px] text-[var(--zv-muted)]">{selectedStock.name} • {formatRupiah(selectedStock.price)}</span>
                    </div>
                  </div>
                  <button onClick={() => setContractModal(false)} className="w-8 h-8 rounded-lg grid place-items-center hover:bg-[var(--zv-surface)] text-[var(--zv-muted)] hover:text-[var(--zv-text)]"><X className="w-4 h-4" /></button>
                </div>

                {/* Stock Info */}
                <div className="rounded-xl p-3 bg-[var(--zv-surface)] mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-bold text-[var(--zv-muted)]">Harga Saham</span>
                    <span className="text-[14px] font-black text-[var(--zv-text)] tabular-nums">{formatRupiah(selectedStock.price)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[8px] text-[var(--zv-muted)]">Rate Dasar</span>
                    <span className="text-[11px] font-black text-[#22c55e]">{getStockBaseRate(selectedStock.code)}% / hari</span>
                  </div>
                </div>

                {/* Duration Selection */}
                <div className="mb-3">
                  <label className="block text-[9px] font-black text-[#3b82f6] mb-1.5">Durasi Kontrak</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[30, 60, 90, 120, 180, 365].map(d => {
                      const effectiveRate = Math.min(getStockBaseRate(selectedStock.code), 7.0)
                      return (
                        <button key={d} onClick={() => setContractDuration(d)}
                          className={`rounded-xl p-2 text-center border-2 transition-all ${contractDuration === d ? 'border-[#3b82f6] bg-[var(--zv-surface)]' : 'border-[var(--zv-border)] bg-[var(--zv-panel)] hover:border-[#3b82f6]'}`}>
                          <span className="block text-[11px] font-black text-[var(--zv-text)]">{d}</span>
                          <span className="block text-[7px] font-bold text-[var(--zv-muted)]">hari</span>
                          <span className="block text-[8px] font-black text-[#22c55e] mt-0.5">{effectiveRate.toFixed(1)}%/hari</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Amount Input */}
                <div className="mb-3">
                  <label className="block text-[9px] font-black text-[#3b82f6] mb-1.5">Jumlah Investasi (Rp)</label>
                  <input type="number" value={contractAmount} onChange={(e) => setContractAmount(e.target.value)} placeholder="Min. 100.000"
                    className="w-full h-10 rounded-xl bg-[var(--zv-surface)] border border-[var(--zv-border)] px-3 text-[12px] font-semibold text-[var(--zv-text)] outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30 placeholder:text-[var(--zv-muted)]" />
                </div>

                {/* Quick Amount Buttons */}
                <div className="flex gap-1.5 mb-3">
                  {['100000', '200000', '500000', '1000000', '5000000'].map(amt => (
                    <button key={amt} onClick={() => setContractAmount(amt)} className="flex-1 h-7 rounded-lg bg-[var(--zv-surface)] border border-[var(--zv-border)] text-[7px] font-bold text-[#3b82f6] hover:bg-[#3b82f6] hover:text-white transition-colors">
                      {parseInt(amt) >= 1000000 ? `${parseInt(amt)/1000000}M` : `${parseInt(amt)/1000}K`}
                    </button>
                  ))}
                </div>

                {/* Profit Summary */}
                {contractAmount && parseInt(contractAmount) > 0 && (() => {
                  const amount = parseInt(contractAmount)
                  const profit = calcContractProfit(selectedStock, contractDuration, amount)
                  return (
                    <div className="rounded-xl p-3 border border-[var(--zv-border)] bg-[var(--zv-surface)] mb-3">
                      <h4 className="text-[9px] font-black text-[#3b82f6] mb-1.5">Ringkasan Kontrak</h4>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] text-[var(--zv-muted)]">Jumlah Investasi</span>
                          <span className="text-[8px] font-bold text-[var(--zv-text)]">{formatRupiah(amount)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] text-[var(--zv-muted)]">Durasi</span>
                          <span className="text-[8px] font-bold text-[var(--zv-text)]">{contractDuration} hari</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] text-[var(--zv-muted)]">Rate Harian</span>
                          <span className="text-[8px] font-black text-[#22c55e]">{profit.dailyRate}%/hari</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] text-[var(--zv-muted)]">Profit Harian</span>
                          <span className="text-[8px] font-black text-[#22c55e]">{formatRupiah(profit.dailyProfitAmount)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] text-[var(--zv-muted)]">Total Profit ({contractDuration} hari)</span>
                          <span className="text-[9px] font-black text-[#22c55e]">{formatRupiah(profit.totalProfit)}</span>
                        </div>
                        <div className="flex items-center justify-between pt-1 mt-1 border-t border-[var(--zv-border)]">
                          <span className="text-[9px] font-black text-[#22c55e]">Total Kembali</span>
                          <span className="text-[11px] font-black text-[#22c55e]">{formatRupiah(profit.totalReturn)}</span>
                        </div>
                      </div>
                      <div className="mt-2 rounded-lg p-1.5 bg-[#f59e0b]/10 border border-[#f59e0b]/20">
                        <span className="text-[7px] text-[#f59e0b] font-bold">💡 Lebih lama kontrak & lebih besar modal = profit lebih tinggi!</span>
                      </div>
                    </div>
                  )
                })()}

                {/* Balance Check */}
                {contractAmount && parseInt(contractAmount) > (user?.balance || 0) && (
                  <div className="rounded-xl p-2 bg-[var(--zv-surface)] border border-[var(--zv-border)] mb-3">
                    <span className="text-[8px] font-bold text-[#ef5350]">Saldo tidak cukup! Saldo: {formatRupiah(user?.balance || 0)}</span>
                  </div>
                )}

                <div className="rounded-xl p-2.5 bg-[#3b82f6]/5 border border-[#3b82f6]/20 mb-3">
    <div className="flex items-center gap-1.5 mb-1">
      <Clock className="w-3 h-3 text-[#3b82f6]" />
      <span className="text-[9px] font-black text-[#3b82f6]">Profit Masuk 00:00 WIB</span>
    </div>
    <div className="flex items-center gap-1.5">
      <span className="text-[8px] text-[var(--zv-muted)]">Klaim berikutnya dalam:</span>
      <span className="text-[10px] font-black text-[#3b82f6] tabular-nums">{(() => {
        const now = new Date()
        const utc = now.getTime() + now.getTimezoneOffset() * 60000
        const jakarta = new Date(utc + 7 * 3600000)
        const nextMidnight = new Date(jakarta)
        nextMidnight.setHours(24, 0, 0, 0)
        const diff = nextMidnight.getTime() - jakarta.getTime()
        const h = Math.floor(diff / 3600000)
        const m = Math.floor((diff % 3600000) / 60000)
        const s = Math.floor((diff % 60000) / 1000)
        return `${h}j ${m}m ${s}d`
      })()}</span>
    </div>
    <span className="block text-[7px] text-[var(--zv-muted)] mt-1">Kontrak berakhir setelah {contractDuration} hari</span>
  </div>

                {/* Submit */}
                <button onClick={handleContract} disabled={contractLoading || !contractAmount || parseInt(contractAmount) < 100000}
                  className="w-full h-12 rounded-xl bg-[#3b82f6] hover:bg-[#2e9e93] text-white text-[12px] font-bold disabled:opacity-70 transition-colors flex items-center justify-center gap-2">
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

      {/* Daily Check-in Modal */}
      <AnimatePresence>
        {showDailyCheckModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40" onClick={() => setShowDailyCheckModal(false)} />
            <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25 }} className="fixed z-50 bottom-0 left-0 right-0 md:inset-0 md:bottom-auto md:left-auto md:right-auto md:flex md:items-center md:justify-center max-h-[85vh] md:max-h-[90vh] bg-[var(--zv-panel)] rounded-t-3xl md:rounded-3xl border border-[var(--zv-border)] overflow-y-auto custom-scrollbar md:w-[90vw] md:max-w-md md:mx-auto md:my-auto">
              <div className="sticky top-0 bg-[var(--zv-panel)] p-4 border-b border-[var(--zv-border)] flex items-center justify-between rounded-t-3xl">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-[#3b82f6]" />
                  <span className="text-[12px] font-black text-[var(--zv-text)]">Cek Harian</span>
                </div>
                <button onClick={() => setShowDailyCheckModal(false)} className="w-8 h-8 rounded-lg grid place-items-center hover:bg-[var(--zv-surface)] text-[var(--zv-muted)] hover:text-[var(--zv-text)]"><X className="w-4 h-4" /></button>
              </div>

              <div className="p-4">
                {/* Streak Display */}
                <div className="rounded-2xl p-4 text-center mb-4" style={{ background: 'linear-gradient(145deg, #0c1a2e 0%, #1e3a5f 54%, #2563eb 100%)' }}>
                  <Flame className="w-12 h-12 text-yellow-300 mx-auto mb-2" />
                  <h3 className="text-lg font-black text-white mb-1">
                    {dailyCheckStatus.streak > 0 ? `${dailyCheckStatus.streak} Hari Berturut-turut` : 'Mulai Streak Anda!'}
                  </h3>
                  <p className="text-[9px] text-blue-200">Cek setiap hari untuk mendapat bonus Rp 500</p>

                  {/* Streak dots */}
                  <div className="flex items-center justify-center gap-1.5 mt-3">
                    {[1, 2, 3, 4, 5, 6, 7].map(day => (
                      <div key={day} className={`w-7 h-7 rounded-full flex items-center justify-center text-[8px] font-black border-2 ${
                        day <= dailyCheckStatus.streak
                          ? 'bg-yellow-500 border-yellow-400 text-[var(--zv-text)]'
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
                      <span className="text-[9px] text-blue-200 font-bold">Bonus Hari Ini</span>
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
                    style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1e3a5f 50%, #2563eb 100%)' }}
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
                  <div className="w-full h-12 rounded-xl bg-[var(--zv-surface)] border border-[var(--zv-border)] flex items-center justify-center gap-2 text-[var(--zv-muted)] text-[11px] font-bold">
                    <CheckCircle className="w-4 h-4 text-[#3b82f6]" />
                    Sudah Dicek Hari Ini ✓
                  </div>
                )}

                {/* Info */}
                <div className="mt-3 rounded-xl p-2.5 bg-[var(--zv-surface)] border border-[var(--zv-border)] flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-[#3b82f6] flex-shrink-0 mt-0.5" />
                  <span className="text-[8px] text-[#3b82f6] leading-relaxed">Streak bertambah setiap kali Anda cek harian secara berturut-turut. Jangan sampai putus!</span>
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
            <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25 }} className="fixed z-50 bottom-0 left-0 right-0 md:inset-0 md:bottom-auto md:left-auto md:right-auto md:flex md:items-center md:justify-center max-h-[85vh] md:max-h-[90vh] bg-[var(--zv-panel)] rounded-t-3xl md:rounded-3xl border border-[var(--zv-border)] overflow-y-auto custom-scrollbar md:w-[90vw] md:max-w-md md:mx-auto md:my-auto">
              <div className="sticky top-0 bg-[var(--zv-panel)] p-4 border-b border-[var(--zv-border)] flex items-center justify-between rounded-t-3xl">
                <div className="flex items-center gap-2">
                  <ListChecks className="w-5 h-5 text-[#f59e0b]" />
                  <span className="text-[12px] font-black text-[var(--zv-text)]">Tugas</span>
                </div>
                <button onClick={() => setShowTasksModal(false)} className="w-8 h-8 rounded-lg grid place-items-center hover:bg-[var(--zv-surface)] text-[var(--zv-muted)] hover:text-[var(--zv-text)]"><X className="w-4 h-4" /></button>
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
                      <div key={task.id} className={`rounded-xl p-3 border ${task.claimed ? 'bg-[var(--zv-surface)] border-[var(--zv-border)]' : task.completed ? 'bg-[var(--zv-surface)] border-[var(--zv-border)]' : 'bg-[var(--zv-panel)] border-[var(--zv-border)]'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-xl grid place-items-center ${
                              task.claimed ? 'bg-[var(--zv-surface)] text-[#3b82f6]' :
                              task.completed ? 'bg-[var(--zv-surface)] text-[#f59e0b]' :
                              'bg-[var(--zv-surface)] text-[var(--zv-muted)]'
                            }`}>
                              {task.claimed ? <CheckCircle className="w-4 h-4" /> : taskIcons[task.taskType] || <Target className="w-4 h-4" />}
                            </div>
                            <div>
                              <span className="block text-[10px] font-black text-[var(--zv-text)]">{task.title}</span>
                              <span className="block text-[8px] text-[var(--zv-muted)]">{task.description}</span>
                              <div className="flex items-center gap-1 mt-0.5">
                                <div className="w-16 h-1.5 rounded-full bg-[var(--zv-surface)] overflow-hidden">
                                  <div className={`h-full rounded-full transition-all duration-500 ${task.claimed ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${task.target > 0 ? (task.progress / task.target) * 100 : 0}%` }} />
                                </div>
                                <span className="text-[7px] font-bold text-[var(--zv-muted)]">{task.progress}/{task.target}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <b className="block text-[10px] font-black text-[#3b82f6]">+{formatRupiah(task.reward)}</b>
                            {task.claimed ? (
                              <span className="text-[7px] font-bold text-[#3b82f6]">Diklaim ✓</span>
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
                              <span className="text-[7px] font-bold text-[var(--zv-muted)]">Mulai</span>
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
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} transition={{ type: 'spring', damping: 20 }} className="fixed z-50 top-4 left-4 right-4 bottom-20 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[90vw] md:max-w-md md:bottom-auto bg-[var(--zv-panel)] rounded-3xl border border-[var(--zv-border)] overflow-y-auto custom-scrollbar">
              <div className="relative">
                {/* Green Header */}
                <div className="p-6 text-center text-white relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #0c1a2e 0%, #1e3a5f 54%, #2563eb 100%)' }}>
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.04) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                  <div className="relative z-10">
                    <div className="mx-auto mb-3">
                      <ZevorixLogo size={60} />
                    </div>
                    <h2 className="text-lg font-black mb-1">Selamat Datang di ZEVORIX</h2>
                    <p className="text-[9px] text-blue-200 leading-relaxed max-w-[280px] mx-auto">
                      Platform investasi terpercaya dengan profit harian, portofolio cerdas, dan reward eksklusif untuk investor Indonesia.
                    </p>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  {/* Regulatory Badges */}
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-10 h-10 rounded-xl bg-[var(--zv-surface)] border border-[var(--zv-border)] grid place-items-center">
                        <Shield className="w-5 h-5 text-[#3b82f6]" />
                      </div>
                      <span className="text-[7px] font-bold text-[var(--zv-muted)]">OJK</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-10 h-10 rounded-xl bg-[var(--zv-surface)] border border-[var(--zv-border)] grid place-items-center">
                        <CheckCircle className="w-5 h-5 text-[#f59e0b]" />
                      </div>
                      <span className="text-[7px] font-bold text-[var(--zv-muted)]">Bappebti</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-10 h-10 rounded-xl bg-[var(--zv-surface)] border border-[var(--zv-border)] grid place-items-center">
                        <Lock className="w-5 h-5 text-[#3b82f6]" />
                      </div>
                      <span className="text-[7px] font-bold text-[var(--zv-muted)]">Aman</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <button
                    onClick={() => { handleWelcomeClose(); setActiveTab('investasi') }}
                    className="w-full h-11 rounded-xl text-white text-[11px] font-black tracking-wide hover:scale-[1.02] transition-transform mb-2"
                    style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1e3a5f 50%, #2563eb 100%)' }}
                  >
                    Mulai Berinvestasi
                  </button>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button
                      onClick={handleWelcomeClose}
                      className="h-9 rounded-xl bg-[var(--zv-surface)] border border-[var(--zv-border)] text-[#3b82f6] text-[9px] font-bold hover:bg-[var(--zv-border)] transition-colors flex items-center justify-center gap-1"
                    >
                      <Headphones className="w-3.5 h-3.5" />Hubungi CS
                    </button>
                    <button
                      onClick={handleWelcomeClose}
                      className="h-9 rounded-xl bg-[var(--zv-surface)] border border-[var(--zv-border)] text-[#f59e0b] text-[9px] font-bold hover:bg-[var(--zv-border)] transition-colors flex items-center justify-center gap-1"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />Gabung Channel
                    </button>
                  </div>

                  {/* Don't show checkbox */}
                  <label className="flex items-center gap-2 cursor-pointer justify-center">
                    <input type="checkbox" checked={welcomeDontShow} onChange={(e) => setWelcomeDontShow(e.target.checked)}
                      className="w-3.5 h-3.5 rounded accent-blue-500" />
                    <span className="text-[8px] font-semibold text-[var(--zv-muted)]">Jangan tampilkan selama 30 menit</span>
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
            <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25 }} className="fixed z-50 bottom-0 left-0 right-0 md:inset-0 md:bottom-auto md:left-auto md:right-auto md:flex md:items-center md:justify-center max-h-[90vh] bg-[var(--zv-panel)] rounded-t-3xl md:rounded-3xl border border-[var(--zv-border)] overflow-y-auto custom-scrollbar md:w-[90vw] md:max-w-lg md:mx-auto md:my-auto">
              <div className="sticky top-0 bg-[var(--zv-panel)] p-4 border-b border-[var(--zv-border)] flex items-center justify-between rounded-t-3xl z-10">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[#3b82f6]" />
                  <span className="text-[12px] font-black text-[var(--zv-text)]">Detail Investasi</span>
                </div>
                <button onClick={() => setShowInvestDetailModal(false)} className="w-8 h-8 rounded-lg grid place-items-center hover:bg-[var(--zv-surface)] text-[var(--zv-muted)] hover:text-[var(--zv-text)]"><X className="w-4 h-4" /></button>
              </div>

              <div className="p-4">
                {/* Product Header */}
                <div className="rounded-2xl p-3 mb-4" style={{ background: 'linear-gradient(145deg, #0c1a2e 0%, #1e3a5f 54%, #2563eb 100%)' }}>
                  <div className="text-white">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-5 h-5 text-yellow-300" />
                      <span className="text-[14px] font-black">{selectedDetailProduct.name}</span>
                    </div>
                    <span className="text-[8px] font-bold text-blue-200">Aset Saham • {selectedDetailProduct.category === 'starter' ? 'Paket Starter' : selectedDetailProduct.category === 'growth' ? 'Paket Growth' : 'Paket Premium'}</span>
                  </div>
                </div>

                {/* Live Chart with Type & Timeframe Selectors */}
                {(() => {
                  const rawData = getInvestChartData(selectedDetailProduct)
                  const chartData = getDataForTimeframe(rawData, investTimeframe)
                  const movement = investMovement.get(selectedDetailProduct.id)
                  const isUp = movement ? movement.changePercent >= 0 : true
                  const chartColor = isUp ? '#2563eb' : '#ef4444'
                  const lastValue = chartData.length > 0 ? chartData[chartData.length - 1].close : selectedDetailProduct.modal
                  return (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          <BarChart3 className="w-3 h-3 text-[var(--zv-muted)]" />
                          <span className="text-[8px] font-bold text-[var(--zv-muted)] uppercase tracking-wider">PERGERAKAN MARKET</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                          <span className="text-[7px] font-black text-[#3b82f6]">LIVE</span>
                        </div>
                      </div>
                      {/* Current Price Display */}
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xl font-black text-[var(--zv-text)] tabular-nums">{formatRupiah(lastValue)}</span>
                        <span className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${isUp ? 'bg-[var(--zv-surface)] text-[#22c55e]' : 'bg-[var(--zv-surface)] text-[#ef5350]'}`}>
                          {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {movement ? (isUp ? '+' : '') + movement.changePercent.toFixed(2) + '%' : '+0.00%'}
                        </span>
                      </div>
                      {/* Chart Type & Timeframe Selectors */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1 bg-[var(--zv-surface)] rounded-xl p-1">
                          {([
                            { type: 'area' as const, label: '📈 Area' },
                            { type: 'line' as const, label: '📉 Line' },
                            { type: 'candle' as const, label: '🕯️ Candle' },
                            { type: 'bar' as const, label: '📊 Bar' },
                          ]).map(ct => (
                            <button key={ct.type} onClick={() => setInvestChartType(ct.type)}
                              className={`h-7 px-2.5 rounded-lg text-[8px] font-black transition-all ${investChartType === ct.type ? 'bg-[var(--zv-panel)] shadow-sm text-[#3b82f6]' : 'text-[var(--zv-muted)] hover:text-[var(--zv-text)]'}`}>
                              {ct.label}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-0.5 bg-[var(--zv-surface)] rounded-xl p-1">
                          {(['1H', '1D', '1W', '1M', 'ALL'] as const).map(tf => (
                            <button key={tf} onClick={() => setInvestTimeframe(tf)}
                              className={`h-7 px-2.5 rounded-lg text-[8px] font-black transition-all ${investTimeframe === tf ? 'bg-[#3b82f6] text-white' : 'text-[var(--zv-muted)] hover:text-[var(--zv-text)]'}`}>
                              {tf}
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* Chart Area */}
                      <div className="h-56 w-full rounded-2xl border border-[var(--zv-border)] p-0 overflow-hidden" style={{ background: 'var(--zv-panel)' }}>
                        {chartData.length > 2 ? (() => {
                          const candles = chartData
                          const allPrices = candles.flatMap(c => [c.high, c.low])
                          const minP = Math.min(...allPrices)
                          const maxP = Math.max(...allPrices)
                          const rangeP = maxP - minP || 1
                          const totalCandles = candles.length
                          const maxVol = Math.max(...candles.map(c => c.volume), 1)
                          const padTop = 12
                          const padBot = 18
                          const priceH = 138 // price chart area height (70%)
                          const volH = 56 // volume area height (30%)
                          const totalH = priceH + volH
                          const svgH = padTop + totalH + padBot
                          const priceScaleW = 64
                          const timeScaleH = padBot
                          const leftPad = 8
                          const candleW = Math.max(6, Math.floor(240 / totalCandles))
                          const gapW = Math.max(3, Math.floor(50 / totalCandles))
                          const chartW = totalCandles * (candleW + gapW) + gapW * 2
                          const svgW = chartW + priceScaleW

                          // Compute MA lines
                          const ma7 = computeMA(candles, 7)
                          const ma25 = computeMA(candles, 25)
                          const ma99 = computeMA(candles, 99)

                          // Compact price formatter for grid labels
                          const compactPrice = (p: number) => {
                            if (p >= 1e6) return `${(p / 1e6).toFixed(1)}M`
                            if (p >= 1e3) return `${(p / 1e3).toFixed(1)}K`
                            return p.toFixed(0)
                          }

                          // Candlestick (large, full featured)
                          if (investChartType === 'candle') {
                            if (candles.length < 2) return <div className="flex items-center justify-center h-full text-[10px] text-gray-500">Data kurang...</div>
                            return (
                              <svg className="w-full h-full" viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="none" style={{ fontFamily: 'monospace' }} shapeRendering="crispEdges">
                                {/* Grid lines - horizontal with 8 lines, dotted style */}
                                {[0, 1, 2, 3, 4, 5, 6, 7].map(gi => {
                                  const gy = padTop + (gi / 7) * priceH
                                  const priceLabel = Math.round(maxP - (rangeP / 7) * gi)
                                  return (
                                    <g key={`hgrid-${gi}`}>
                                      <line x1={leftPad} y1={gy} x2={chartW} y2={gy} stroke="var(--zv-border)" strokeWidth="0.5" strokeDasharray="3,3" />
                                      <text x={chartW + 6} y={gy + 3} fontSize="7" fill="var(--zv-muted)">{compactPrice(priceLabel)}</text>
                                    </g>
                                  )
                                })}
                                {/* Grid lines - vertical, dotted */}
                                {candles.filter((_, i) => i % Math.max(1, Math.floor(totalCandles / 6)) === 0).map((c, _idx, arr) => {
                                  const i = _idx === 0 ? 0 : Math.floor(totalCandles / 6) * _idx
                                  const gx = leftPad + gapW + i * (candleW + gapW) + candleW / 2
                                  return (
                                    <g key={`vgrid-${i}`}>
                                      <line x1={gx} y1={padTop} x2={gx} y2={padTop + totalH} stroke="var(--zv-border)" strokeWidth="0.5" strokeDasharray="3,3" />
                                      <text x={gx} y={svgH - 4} fontSize="6" fill="var(--zv-muted)" textAnchor="middle">{c.time}</text>
                                    </g>
                                  )
                                })}
                                {/* Volume bars with opacity variation & rounded top */}
                                {candles.map((c, i) => {
                                  const x = leftPad + gapW + i * (candleW + gapW)
                                  const isGreen = c.close >= c.open
                                  const volBarH = (c.volume / maxVol) * volH
                                  const volY = padTop + priceH + volH - volBarH
                                  const volOpacity = 0.2 + (i / totalCandles) * 0.25
                                  return <rect key={`vol-${i}`} x={x} y={volY} width={candleW} height={volBarH} fill={isGreen ? '#22c55e' : '#ef5350'} opacity={volOpacity} rx="1" />
                                })}
                                {/* MA7 line (yellow) - smoothed */}
                                <polyline
                                  fill="none"
                                  stroke="#f5c542"
                                  strokeWidth="1"
                                  opacity="0.8"
                                  strokeLinejoin="round"
                                  strokeLinecap="round"
                                  points={ma7.map((v, i) => {
                                    if (v === null) return ''
                                    const x = leftPad + gapW + i * (candleW + gapW) + candleW / 2
                                    const y = padTop + ((maxP - v) / rangeP) * priceH
                                    return `${x},${y}`
                                  }).filter(Boolean).join(' ')}
                                />
                                {/* MA25 line (blue) - smoothed */}
                                <polyline
                                  fill="none"
                                  stroke="#2196f3"
                                  strokeWidth="1"
                                  opacity="0.8"
                                  strokeLinejoin="round"
                                  strokeLinecap="round"
                                  points={ma25.map((v, i) => {
                                    if (v === null) return ''
                                    const x = leftPad + gapW + i * (candleW + gapW) + candleW / 2
                                    const y = padTop + ((maxP - v) / rangeP) * priceH
                                    return `${x},${y}`
                                  }).filter(Boolean).join(' ')}
                                />
                                {/* MA99 line (purple) - smoothed */}
                                <polyline
                                  fill="none"
                                  stroke="#9c27b0"
                                  strokeWidth="1"
                                  opacity="0.8"
                                  strokeLinejoin="round"
                                  strokeLinecap="round"
                                  points={ma99.map((v, i) => {
                                    if (v === null) return ''
                                    const x = leftPad + gapW + i * (candleW + gapW) + candleW / 2
                                    const y = padTop + ((maxP - v) / rangeP) * priceH
                                    return `${x},${y}`
                                  }).filter(Boolean).join(' ')}
                                />
                                {/* Candlesticks - TradingView style with hollow bearish */}
                                {candles.map((c, i) => {
                                  const x = leftPad + gapW + i * (candleW + gapW)
                                  const yH = padTop + ((maxP - c.high) / rangeP) * priceH
                                  const yL = padTop + ((maxP - c.low) / rangeP) * priceH
                                  const yO = padTop + ((maxP - c.open) / rangeP) * priceH
                                  const yC = padTop + ((maxP - c.close) / rangeP) * priceH
                                  const isGreen = c.close >= c.open
                                  const bodyTop = Math.min(yO, yC)
                                  const bodyH = Math.max(Math.abs(yO - yC), 2)
                                  const isLast = i === totalCandles - 1
                                  return (
                                    <g key={i} opacity={isLast ? 1 : 0.9}>
                                      <line x1={x + candleW / 2} y1={yH} x2={x + candleW / 2} y2={yL} stroke={isGreen ? '#22c55e' : '#ef5350'} strokeWidth={isLast ? "1" : "0.7"} />
                                      <rect x={x} y={bodyTop} width={candleW} height={bodyH} fill={isGreen ? '#22c55e' : '#ef5350'} stroke={isGreen ? '#22c55e' : '#ef5350'} strokeWidth="0.7" rx="0.8" />
                                    </g>
                                  )
                                })}
                                {/* Current price line with tag */}
                                {candles.length > 0 && (() => {
                                  const lastC = candles[candles.length - 1]
                                  const isGreen = lastC.close >= lastC.open
                                  const yLast = padTop + ((maxP - lastC.close) / rangeP) * priceH
                                  return (
                                    <>
                                      <line x1={leftPad} y1={yLast} x2={chartW} y2={yLast} stroke={isGreen ? '#22c55e' : '#ef5350'} strokeWidth="0.7" strokeDasharray="4,3" opacity="0.8" />
                                      <rect x={chartW + 2} y={yLast - 8} width={priceScaleW - 4} height="16" rx="3" fill={isGreen ? '#22c55e' : '#ef5350'} />
                                      <text x={chartW + priceScaleW / 2} y={yLast + 3.5} fontSize="7" fill="white" textAnchor="middle" fontWeight="bold">{compactPrice(lastC.close)}</text>
                                    </>
                                  )
                                })()}
                                {/* MA Legend */}
                                <text x={leftPad + 4} y={padTop - 2} fontSize="7" fill="#f5c542" fontWeight="bold">MA7</text>
                                <text x={leftPad + 34} y={padTop - 2} fontSize="7" fill="#2196f3" fontWeight="bold">MA25</text>
                                <text x={leftPad + 70} y={padTop - 2} fontSize="7" fill="#9c27b0" fontWeight="bold">MA99</text>
                              </svg>
                            )
                          }

                          const values = chartData.map(d => d.close)
                          const minV = Math.min(...values)
                          const maxV = Math.max(...values)
                          const rangeV = maxV - minV || 1
                          const domain: [number, number] = [Math.floor(minV - rangeV * 0.12), Math.ceil(maxV + rangeV * 0.12)]

                          // Bar chart
                          if (investChartType === 'bar') {
                            const barData = chartData.map((d, i) => ({
                              idx: d.idx,
                              close: d.close,
                              fill: i > 0 && d.close >= chartData[i - 1].close ? '#2563eb' : '#ef4444'
                            }))
                            return (
                              <ResponsiveContainer width="100%" height="100%">
                                <ReBarChart data={barData} margin={{ top: 5, right: 12, bottom: 0, left: 5 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                  <XAxis dataKey="idx" hide />
                                  <YAxis hide domain={domain} />
                                  <Tooltip formatter={(value: number) => [formatRupiah(value), 'Harga']} contentStyle={{ fontSize: '10px', borderRadius: '10px', border: '1px solid #e5e7eb' }} />
                                  <Bar dataKey="close" radius={[3, 3, 0, 0]} isAnimationActive={true} animationDuration={400}>
                                    {barData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                  </Bar>
                                </ReBarChart>
                              </ResponsiveContainer>
                            )
                          }

                          // Line chart
                          if (investChartType === 'line') {
                            return (
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 5, right: 12, bottom: 0, left: 5 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                  <XAxis dataKey="idx" hide />
                                  <YAxis hide domain={domain} />
                                  <ReferenceLine y={lastValue} stroke={chartColor} strokeDasharray="3 3" strokeOpacity={0.3} />
                                  <Tooltip formatter={(value: number) => [formatRupiah(value), 'Harga']} contentStyle={{ fontSize: '10px', borderRadius: '10px', border: `1px solid ${isUp ? '#bbf7d0' : '#fecaca'}`, background: isUp ? '#f0fdf4' : '#fef2f2' }} />
                                  <Line type="monotone" dataKey="close" stroke={chartColor} strokeWidth={2.5} dot={false}
                                    activeDot={{ r: 5, fill: chartColor, stroke: '#fff', strokeWidth: 2 }}
                                    isAnimationActive={true} animationDuration={500} animationEasing="ease-out" />
                                </LineChart>
                              </ResponsiveContainer>
                            )
                          }

                          // Area chart (default)
                          return (
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={chartData} margin={{ top: 5, right: 12, bottom: 0, left: 5 }}>
                                <defs>
                                  <linearGradient id={`investDetailGrad-${selectedDetailProduct.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor={chartColor} stopOpacity="0.4" />
                                    <stop offset="50%" stopColor={chartColor} stopOpacity="0.1" />
                                    <stop offset="100%" stopColor={chartColor} stopOpacity="0" />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                <XAxis dataKey="idx" hide />
                                <YAxis hide domain={domain} />
                                <ReferenceLine y={lastValue} stroke={chartColor} strokeDasharray="3 3" strokeOpacity={0.3} />
                                <Tooltip formatter={(value: number) => [formatRupiah(value), 'Harga']} contentStyle={{ fontSize: '10px', borderRadius: '10px', border: `1px solid ${isUp ? '#bbf7d0' : '#fecaca'}`, background: isUp ? '#f0fdf4' : '#fef2f2' }} />
                                <Area type="monotone" dataKey="close" stroke={chartColor} fill={`url(#investDetailGrad-${selectedDetailProduct.id})`} strokeWidth={2.5}
                                  dot={(props: Record<string, unknown>) => {
                                    const { cx, cy, index } = props as { cx: number; cy: number; index: number }
                                    if (index !== chartData.length - 1) return <g key={String(index)} />
                                    return (
                                      <g key={`invest-detail-dot-${selectedDetailProduct.id}`}>
                                        <circle cx={cx} cy={cy} r={8} fill={chartColor} opacity={0.2}>
                                          <animate attributeName="r" values="6;12;6" dur="2s" repeatCount="indefinite" />
                                          <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
                                        </circle>
                                        <circle cx={cx} cy={cy} r={4} fill={chartColor} stroke="#fff" strokeWidth={1.5} />
                                      </g>
                                    )
                                  }}
                                  activeDot={false}
                                  isAnimationActive={true} animationDuration={500} animationEasing="ease-out" />
                              </AreaChart>
                            </ResponsiveContainer>
                          )
                        })() : (
                          <div className="flex items-center justify-center h-full text-[10px] text-gray-500">Memuat data market...</div>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1">
                          {isUp ? <TrendingUp className="w-3.5 h-3.5 text-[#22c55e]" /> : <TrendingDown className="w-3.5 h-3.5 text-[#ef5350]" />}
                          <span className={`text-[10px] font-bold ${isUp ? 'text-[#22c55e]' : 'text-[#ef5350]'}`}>
                            Modal: {formatRupiah(selectedDetailProduct.modal)}
                          </span>
                        </div>
                        <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${isUp ? 'bg-[var(--zv-surface)] text-[#22c55e]' : 'bg-[var(--zv-surface)] text-[#ef5350]'}`}>
                          {formatRupiah(lastValue)}
                        </span>
                      </div>
                    </div>
                  )
                })()}

                {/* Full Financial Details */}
                <div className="space-y-2.5 mb-4">
                  <div className="flex items-center justify-between py-1.5 border-b border-[var(--zv-border)]">
                    <span className="text-[9px] font-bold text-[var(--zv-muted)] uppercase tracking-wider">JUMLAH MODAL</span>
                    <span className="text-[12px] font-black text-[var(--zv-text)]">{formatRupiah(selectedDetailProduct.modal)}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-[var(--zv-border)]">
                    <span className="text-[9px] font-bold text-[var(--zv-muted)] uppercase tracking-wider">PROFIT HARIAN</span>
                    <span className="text-[12px] font-black text-[#22c55e]">+{formatRupiah(selectedDetailProduct.dailyProfit)}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-[var(--zv-border)]">
                    <span className="text-[9px] font-bold text-[var(--zv-muted)] uppercase tracking-wider">DURASI</span>
                    <span className="text-[12px] font-black text-[var(--zv-text)]">{selectedDetailProduct.duration} Hari</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-[var(--zv-border)]">
                    <span className="text-[9px] font-bold text-[var(--zv-muted)] uppercase tracking-wider">TOTAL KEUNTUNGAN</span>
                    <div className="text-right">
                      <span className="text-[12px] font-black text-[#22c55e]">{formatRupiah(selectedDetailProduct.totalReturn)}</span>
                      <span className="ml-1 text-[8px] font-bold text-[#f59e0b] bg-[var(--zv-surface)] px-1 rounded">ROI {selectedDetailProduct.roi}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-[9px] font-bold text-[var(--zv-muted)] uppercase tracking-wider">SALDO TERSEDIA</span>
                    <span className={`text-[12px] font-black ${(user?.balance || 0) >= selectedDetailProduct.modal ? 'text-[#3b82f6]' : 'text-[#ef5350]'}`}>{formatRupiah(user?.balance || 0)}</span>
                  </div>
                </div>

                {/* Profit Distribution with AUTO toggle */}
                <div className="rounded-xl p-3 bg-[var(--zv-surface)] border border-[var(--zv-border)] mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#3b82f6]" />
                      <span className="text-[9px] font-bold text-[#3b82f6]">Pembagian Profit Setiap 24 jam</span>
                    </div>
                    <button
                      onClick={() => setInvestDetailAutoProfit(!investDetailAutoProfit)}
                      className={`h-6 px-3 rounded-full text-[7px] font-black transition-colors ${investDetailAutoProfit ? 'bg-[#3b82f6] text-white' : 'bg-[var(--zv-border)] text-[var(--zv-muted)]'}`}
                    >
                      {investDetailAutoProfit ? 'AUTO' : 'MANUAL'}
                    </button>
                  </div>
                  <p className="text-[7px] text-[var(--zv-muted)] mt-1">
                    {investDetailAutoProfit
                      ? 'Profit akan otomatis dikreditkan ke saldo Anda setiap 24 jam.'
                      : 'Anda perlu mengklaim profit secara manual setiap hari.'}
                  </p>
                </div>

                {/* Balance Warning */}
                {(user?.balance || 0) < selectedDetailProduct.modal && (
                  <div className="rounded-xl p-2.5 bg-[var(--zv-surface)] border border-[var(--zv-border)] mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-[#ef5350] flex-shrink-0" />
                    <span className="text-[9px] font-bold text-[#ef5350]">Saldo tidak mencukupi. Silakan deposit terlebih dahulu.</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button onClick={() => setShowInvestDetailModal(false)} className="flex-1 h-11 rounded-xl bg-[var(--zv-surface)] border border-[var(--zv-border)] text-[var(--zv-muted)] text-[11px] font-bold hover:bg-[var(--zv-border)] transition-colors">
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
                    style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1e3a5f 50%, #2563eb 100%)' }}
                  >
                    Investasi Sekarang
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Promo Detail Modal */}
      <AnimatePresence>
        {showPromoDetailModal && selectedPromo && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowPromoDetailModal(false)} />
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} transition={{ type: 'spring', damping: 20 }} className="fixed z-50 inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[90vw] md:max-w-md bg-[var(--zv-panel)] rounded-3xl border border-[var(--zv-border)] overflow-y-auto custom-scrollbar">
              <div className="relative">
                {/* Header */}
                <div className="p-5 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0c1a2e 0%, #1e3a5f 50%, #2563eb 100%)' }}>
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.04) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                  <button onClick={() => setShowPromoDetailModal(false)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 grid place-items-center text-white hover:bg-white/20 transition-colors"><X className="w-4 h-4" /></button>
                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-yellow-500/20 border border-yellow-400/30 grid place-items-center mx-auto mb-3">
                      <Zap className="w-7 h-7 text-yellow-300" />
                    </div>
                    <h2 className="text-[16px] font-black text-center">{selectedPromo.title}</h2>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <span className="h-5 px-2.5 rounded-full bg-yellow-500/20 border border-yellow-400/30 text-[8px] font-black text-yellow-300 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />AKTIF</span>
                      <span className="h-5 px-2.5 rounded-full bg-white/10 border border-white/15 text-[8px] font-bold text-blue-200">{selectedPromo.type === 'deposit_bonus' ? 'Deposit' : selectedPromo.type === 'trading_bonus' ? 'Trading' : selectedPromo.type === 'welcome_bonus' ? 'Welcome' : selectedPromo.type === 'referral_program' ? 'Referral' : selectedPromo.type === 'trading_competition' ? 'Kompetisi' : selectedPromo.type === 'daily_checkin' ? 'Check-in' : 'Promo'}</span>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-[11px] text-[var(--zv-text)] leading-relaxed mb-4">{selectedPromo.description}</p>
                  <div className="rounded-2xl p-3 bg-[var(--zv-surface)] border border-[var(--zv-border)] mb-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-[var(--zv-muted)]">Periode</span>
                      <span className="text-[9px] font-bold text-[var(--zv-text)]">{selectedPromo.startDate ? formatDate(selectedPromo.startDate) : 'Sekarang'} — {selectedPromo.endDate ? formatDate(selectedPromo.endDate) : 'Berlangsung'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-[var(--zv-muted)]">Nilai</span>
                      <span className="text-[11px] font-black text-[#f59e0b]">{selectedPromo.value ? (selectedPromo.value >= 1000 ? formatRupiah(selectedPromo.value) : `${selectedPromo.value}%`) : '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-[var(--zv-muted)]">Status</span>
                      <span className="text-[9px] font-black text-green-500">Aktif</span>
                    </div>
                  </div>
                  {/* Claim / Action buttons based on promo type */}
                  {selectedPromo.type === 'daily_checkin' ? (
                    <button onClick={() => { setShowPromoDetailModal(false); setPromoSubTab('daily') }} className="w-full h-11 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 text-[11px] font-bold hover:from-yellow-300 hover:to-yellow-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20">
                      <Flame className="w-4 h-4" />Klaim Cek Harian
                    </button>
                  ) : selectedPromo.type === 'referral_program' ? (
                    <button onClick={() => { setShowPromoDetailModal(false); setActiveTab('undang') }} className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white text-[11px] font-bold hover:from-blue-500 hover:to-blue-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20">
                      <UserPlus className="w-4 h-4" />Ajak Teman Sekarang
                    </button>
                  ) : selectedPromo.type === 'deposit_bonus' ? (
                    <button onClick={() => { setShowPromoDetailModal(false); setActiveTab('finance') }} className="w-full h-11 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[11px] font-bold hover:from-green-400 hover:to-emerald-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20">
                      <Plus className="w-4 h-4" />Deposit Sekarang
                    </button>
                  ) : selectedPromo.type === 'trading_bonus' ? (
                    <button onClick={() => { setShowPromoDetailModal(false); setActiveTab('sinyal') }} className="w-full h-11 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 text-white text-[11px] font-bold hover:from-purple-500 hover:to-blue-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20">
                      <Target className="w-4 h-4" />Mulai Trading
                    </button>
                  ) : selectedPromo.type === 'trading_competition' ? (
                    <button onClick={() => { setShowPromoDetailModal(false); setActiveTab('sinyal') }} className="w-full h-11 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white text-[11px] font-bold hover:from-orange-400 hover:to-red-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20">
                      <Trophy className="w-4 h-4" />Ikut Kompetisi
                    </button>
                  ) : selectedPromo.type === 'welcome_bonus' ? (
                    <button onClick={() => { setShowPromoDetailModal(false); toast({ title: 'Bonus Selamat Datang', description: 'Bonus sudah otomatis dikreditkan ke saldo Anda!' }) }} className="w-full h-11 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 text-[11px] font-bold hover:from-yellow-300 hover:to-yellow-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20">
                      <Gift className="w-4 h-4" />Klaim Bonus
                    </button>
                  ) : (
                    <button onClick={() => { setShowPromoDetailModal(false); toast({ title: 'Promo Aktif', description: 'Anda sudah berpartisipasi dalam promo ini!' }) }} className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white text-[11px] font-bold hover:from-blue-500 hover:to-blue-400 transition-all flex items-center justify-center gap-2">
                      <Zap className="w-4 h-4" />Partisipasi
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* KYC Verification Modal */}
      <AnimatePresence>
        {showKycModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowKycModal(false)} />
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} transition={{ type: 'spring', damping: 20 }} className="fixed z-50 inset-2 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[95vw] md:max-w-lg bg-[var(--zv-panel)] rounded-3xl border border-[var(--zv-border)] overflow-y-auto custom-scrollbar">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 grid place-items-center"><Shield className="w-5 h-5 text-[#3b82f6]" /></div>
                    <div>
                      <h2 className="text-[16px] font-black text-[var(--zv-text)]">Verifikasi KYC</h2>
                      <p className="text-[9px] text-[var(--zv-muted)]">Wajib upload KTP & Selfie</p>
                    </div>
                  </div>
                  <button onClick={() => setShowKycModal(false)} className="w-8 h-8 rounded-full bg-[var(--zv-surface)] border border-[var(--zv-border)] grid place-items-center hover:bg-[var(--zv-border)] transition-colors"><X className="w-4 h-4 text-[var(--zv-muted)]" /></button>
                </div>

                {user?.kycStatus === 'verified' ? (
                  /* ===== VERIFIED STATE ===== */
                  <div className="text-center py-6">
                    <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 grid place-items-center mx-auto mb-3"><CheckCircle className="w-8 h-8 text-green-500" /></div>
                    <h3 className="text-[14px] font-black text-green-500">Terverifikasi ✓</h3>
                    <p className="text-[10px] text-[var(--zv-muted)] mt-1">Akun Anda sudah terverifikasi</p>
                    <div className="mt-4 rounded-xl bg-green-500/5 border border-green-500/10 p-3">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-[var(--zv-muted)]">Min. Withdrawal</span>
                        <span className="font-bold text-green-500">Rp 50.000</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] mt-1">
                        <span className="text-[var(--zv-muted)]">Biaya Admin</span>
                        <span className="font-bold text-[var(--zv-text)]">10%</span>
                      </div>
                    </div>
                  </div>
                ) : user?.kycStatus === 'pending' || kycRecord?.status === 'pending' ? (
                  /* ===== PENDING STATE ===== */
                  <div className="text-center py-6">
                    <div className="w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/20 grid place-items-center mx-auto mb-3"><Clock className="w-8 h-8 text-yellow-500" /></div>
                    <h3 className="text-[14px] font-black text-yellow-500">Sedang Diverifikasi ⏳</h3>
                    <p className="text-[10px] text-[var(--zv-muted)] mt-1">Pengajuan KYC Anda sedang diproses admin. Proses 1-3 hari kerja.</p>
                    <div className="mt-4 rounded-xl bg-yellow-500/5 border border-yellow-500/10 p-3">
                      <p className="text-[10px] text-yellow-600 dark:text-yellow-400 font-semibold">Saat ini minimum withdrawal Anda: Rp 250.000</p>
                      <p className="text-[9px] text-[var(--zv-muted)] mt-1">Setelah verified, minimum withdrawal turun ke Rp 50.000</p>
                    </div>
                  </div>
                ) : kycRecord?.status === 'rejected' ? (
                  /* ===== REJECTED STATE ===== */
                  <div className="py-4">
                    <div className="text-center mb-4">
                      <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 grid place-items-center mx-auto mb-3"><XCircle className="w-7 h-7 text-red-500" /></div>
                      <h3 className="text-[14px] font-black text-red-500">KYC Ditolak</h3>
                      <p className="text-[10px] text-[var(--zv-muted)] mt-1">Silakan ajukan ulang dengan data yang benar</p>
                    </div>
                    {kycRecord.rejectReason && (
                      <div className="rounded-xl bg-red-500/5 border border-red-500/10 p-3 mb-4">
                        <p className="text-[9px] font-bold text-red-500 mb-1">Alasan Penolakan:</p>
                        <p className="text-[10px] text-[var(--zv-text)]">{kycRecord.rejectReason}</p>
                      </div>
                    )}
                    {/* Re-submit form below */}
                    {kycFormContent()}
                  </div>
                ) : (
                  /* ===== NEW/FORM STATE ===== */
                  <>
                    {/* Benefits Card */}
                    <div className="rounded-2xl p-3 mb-4" style={{ background: 'linear-gradient(135deg, #172554 0%, #1d4ed8 100%)' }}>
                      <p className="text-[9px] text-blue-200 font-bold mb-2">🎯 Keuntungan Verifikasi KYC</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-xl bg-white/10 p-2 text-center">
                          <p className="text-[8px] text-blue-200">Min. Withdraw</p>
                          <p className="text-[14px] font-black text-white">Rp 50K</p>
                          <p className="text-[7px] text-blue-300">vs Rp 250K tanpa KYC</p>
                        </div>
                        <div className="rounded-xl bg-white/10 p-2 text-center">
                          <p className="text-[8px] text-blue-200">Biaya Admin</p>
                          <p className="text-[14px] font-black text-white">10%</p>
                          <p className="text-[7px] text-blue-300">Sama untuk semua</p>
                        </div>
                      </div>
                    </div>

                    {kycFormContent()}
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* VIP Level Modal */}
      <AnimatePresence>
        {showVipModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowVipModal(false)} />
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} transition={{ type: 'spring', damping: 20 }} className="fixed z-50 inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[90vw] md:max-w-md bg-[var(--zv-panel)] rounded-3xl border border-[var(--zv-border)] overflow-y-auto custom-scrollbar">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 grid place-items-center"><Award className="w-5 h-5 text-[#f59e0b]" /></div>
                    <h2 className="text-[16px] font-black text-[var(--zv-text)]">VIP Level</h2>
                  </div>
                  <button onClick={() => setShowVipModal(false)} className="w-8 h-8 rounded-full bg-[var(--zv-surface)] border border-[var(--zv-border)] grid place-items-center hover:bg-[var(--zv-border)] transition-colors"><X className="w-4 h-4 text-[var(--zv-muted)]" /></button>
                </div>
                {/* Current Level */}
                <div className="rounded-2xl overflow-hidden mb-4" style={{ background: 'linear-gradient(135deg, #1a0a00 0%, #7c2d12 40%, #ea580c 100%)' }}>
                  <div className="p-4 text-white text-center">
                    <span className="text-[32px]">🥇</span>
                    <h3 className="text-[18px] font-black mt-1">Gold</h3>
                    <p className="text-[9px] text-orange-200">Level saat ini</p>
                  </div>
                </div>
                {/* VIP Tiers */}
                <div className="space-y-2">
                  {[
                    { level: 'Bronze', icon: '🥉', color: 'from-amber-800 to-amber-600', deposit: 'Rp 0', payout: '80%', commission: '5%' },
                    { level: 'Silver', icon: '🥈', color: 'from-gray-400 to-gray-300', deposit: 'Rp 5.000.000', payout: '85%', commission: '8%' },
                    { level: 'Gold', icon: '🥇', color: 'from-yellow-500 to-yellow-300', deposit: 'Rp 25.000.000', payout: '90%', commission: '10%', active: true },
                    { level: 'Platinum', icon: '💎', color: 'from-cyan-500 to-blue-400', deposit: 'Rp 100.000.000', payout: '95%', commission: '14%' },
                  ].map((tier) => (
                    <div key={tier.level} className={`rounded-2xl p-3 border transition-all ${tier.active ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-[var(--zv-surface)] border-[var(--zv-border)]'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-[20px]">{tier.icon}</span>
                          <div>
                            <span className="block text-[11px] font-black text-[var(--zv-text)]">{tier.level}</span>
                            <span className="block text-[8px] text-[var(--zv-muted)]">Deposit {tier.deposit}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="block text-[10px] font-black text-[#f59e0b]">Payout {tier.payout}</span>
                          <span className="block text-[8px] text-[var(--zv-muted)]">Komisi {tier.commission}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[8px] text-[var(--zv-muted)] text-center mt-3">Deposit lebih banyak untuk meningkatkan level VIP dan mendapat benefit eksklusif!</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Customer Service Modal */}
      <AnimatePresence>
        {showCsModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowCsModal(false)} />
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} transition={{ type: 'spring', damping: 20 }} className="fixed z-50 inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[90vw] md:max-w-md bg-[var(--zv-panel)] rounded-3xl border border-[var(--zv-border)] overflow-y-auto custom-scrollbar">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 grid place-items-center"><Headphones className="w-5 h-5 text-[#3b82f6]" /></div>
                    <h2 className="text-[16px] font-black text-[var(--zv-text)]">Layanan Pelanggan</h2>
                  </div>
                  <button onClick={() => setShowCsModal(false)} className="w-8 h-8 rounded-full bg-[var(--zv-surface)] border border-[var(--zv-border)] grid place-items-center hover:bg-[var(--zv-border)] transition-colors"><X className="w-4 h-4 text-[var(--zv-muted)]" /></button>
                </div>
                <div className="rounded-2xl overflow-hidden mb-4" style={{ background: 'linear-gradient(135deg, #0c1a2e 0%, #1e3a5f 50%, #2563eb 100%)' }}>
                  <div className="p-4 text-white text-center">
                    <Headphones className="w-10 h-10 mx-auto mb-2 text-blue-200" />
                    <h3 className="text-[14px] font-black">CS 24/7 Siap Membantu</h3>
                    <p className="text-[9px] text-blue-200 mt-1">Respon cepat dalam 5 menit</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { icon: <MessageCircle className="w-4 h-4" />, label: 'Live Chat', desc: 'Chat langsung dengan CS', color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/20' },
                    { icon: <Mail className="w-4 h-4" />, label: 'Email', desc: 'support@zevorix.com', color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' },
                    { icon: <Phone className="w-4 h-4" />, label: 'Telepon', desc: '+62 21 1234 5678', color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/20' },
                    { icon: <MessageSquare className="w-4 h-4" />, label: 'WhatsApp', desc: '+62 812 3456 7890', color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/20' },
                  ].map((ch, i) => (
                    <button key={i} onClick={() => toast({ title: ch.label, description: `Menghubungi via ${ch.label}...` })} className="w-full rounded-2xl p-3 bg-[var(--zv-surface)] border border-[var(--zv-border)] flex items-center gap-3 hover:border-[#3b82f6]/30 transition-all">
                      <div className={`w-9 h-9 rounded-xl border grid place-items-center ${ch.bg} ${ch.color}`}>{ch.icon}</div>
                      <div className="text-left flex-1">
                        <span className="block text-[10px] font-black text-[var(--zv-text)]">{ch.label}</span>
                        <span className="block text-[8px] text-[var(--zv-muted)]">{ch.desc}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[var(--zv-muted)]" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* About Company Modal */}
      <AnimatePresence>
        {showAboutModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowAboutModal(false)} />
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} transition={{ type: 'spring', damping: 20 }} className="fixed z-50 inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[90vw] md:max-w-md bg-[var(--zv-panel)] rounded-3xl border border-[var(--zv-border)] overflow-y-auto custom-scrollbar">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 grid place-items-center"><Building2 className="w-5 h-5 text-[#3b82f6]" /></div>
                    <h2 className="text-[16px] font-black text-[var(--zv-text)]">Tentang ZEVORIX</h2>
                  </div>
                  <button onClick={() => setShowAboutModal(false)} className="w-8 h-8 rounded-full bg-[var(--zv-surface)] border border-[var(--zv-border)] grid place-items-center hover:bg-[var(--zv-border)] transition-colors"><X className="w-4 h-4 text-[var(--zv-muted)]" /></button>
                </div>
                <div className="rounded-2xl overflow-hidden mb-4" style={{ background: 'linear-gradient(145deg, #0c1a2e 0%, #1e3a5f 54%, #2563eb 100%)' }}>
                  <div className="p-5 text-white text-center">
                    <div className="mx-auto mb-3 w-fit">
                      <ZevorixLogo size={50} />
                    </div>
                    <h3 className="text-[18px] font-black gradient-text tracking-[0.15em]">ZEVORIX</h3>
                    <p className="text-[9px] text-blue-200 tracking-[0.2em] uppercase font-medium">Platform Investasi Saham Digital</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] text-[var(--zv-text)] leading-relaxed">ZEVORIX adalah platform investasi saham digital terpercaya yang menyediakan akses ke pasar saham global dengan teknologi terdepan. Didirikan dengan visi demokratisasi investasi untuk semua orang Indonesia.</p>
                  <div className="rounded-2xl p-3 bg-[var(--zv-surface)] border border-[var(--zv-border)] space-y-2">
                    {[
                      { label: 'Didirikan', value: '2024' },
                      { label: 'Terdaftar', value: 'OJK & Bappebti' },
                      { label: 'Pengguna', value: '50.000+' },
                      { label: 'Total Aset Kelola', value: 'Rp 500M+' },
                      { label: 'Kantor Pusat', value: 'Jakarta, Indonesia' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-1 border-b border-[var(--zv-border)] last:border-0">
                        <span className="text-[9px] font-bold text-[var(--zv-muted)]">{item.label}</span>
                        <span className="text-[9px] font-bold text-[var(--zv-text)]">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Help / FAQ Modal */}
      <AnimatePresence>
        {showHelpModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowHelpModal(false)} />
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} transition={{ type: 'spring', damping: 20 }} className="fixed z-50 inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[90vw] md:max-w-md bg-[var(--zv-panel)] rounded-3xl border border-[var(--zv-border)] overflow-y-auto custom-scrollbar">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 grid place-items-center"><HelpCircle className="w-5 h-5 text-[#f59e0b]" /></div>
                    <h2 className="text-[16px] font-black text-[var(--zv-text)]">Bantuan & FAQ</h2>
                  </div>
                  <button onClick={() => setShowHelpModal(false)} className="w-8 h-8 rounded-full bg-[var(--zv-surface)] border border-[var(--zv-border)] grid place-items-center hover:bg-[var(--zv-border)] transition-colors"><X className="w-4 h-4 text-[var(--zv-muted)]" /></button>
                </div>
                <div className="space-y-2">
                  {[
                    { q: 'Bagaimana cara deposit?', a: 'Klik menu Dompet → Isi Saldo → Pilih metode pembayaran → Masukkan jumlah → Konfirmasi pembayaran.' },
                    { q: 'Berapa minimal deposit?', a: 'Minimal deposit adalah Rp 50.000 untuk semua metode pembayaran.' },
                    { q: 'Bagaimana cara menarik dana?', a: 'Klik menu Dompet → Tarik Saldo → Masukkan jumlah dan rekening tujuan → Konfirmasi penarikan. Proses 1-3 hari kerja.' },
                    { q: 'Apa itu Sinyal Pro?', a: 'Sinyal Pro adalah fitur trading dimana Anda memprediksi arah harga saham (UP/DOWN) dalam waktu tertentu untuk mendapat profit.' },
                    { q: 'Bagaimana sistem komisi referral?', a: 'Anda mendapat komisi 10% dari Level 1, 3% dari Level 2, dan 1% dari Level 3. Komisi bisa diklaim kapan saja.' },
                    { q: 'Apakah ZEVORIX aman?', a: 'ZEVORIX terdaftar dan diawasi oleh OJK. Semua dana nasabah dijamin oleh LPS. Kami menggunakan enkripsi SSL 256-bit.' },
                  ].map((faq, i) => (
                    <details key={i} className="rounded-2xl bg-[var(--zv-surface)] border border-[var(--zv-border)] overflow-hidden group">
                      <summary className="p-3 flex items-center justify-between cursor-pointer hover:bg-[var(--zv-panel)] transition-colors">
                        <span className="text-[10px] font-bold text-[var(--zv-text)] pr-2">{faq.q}</span>
                        <ChevronRight className="w-4 h-4 text-[var(--zv-muted)] flex-shrink-0 group-open:rotate-90 transition-transform" />
                      </summary>
                      <div className="px-3 pb-3">
                        <p className="text-[9px] text-[var(--zv-muted)] leading-relaxed">{faq.a}</p>
                      </div>
                    </details>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <p className="text-[9px] text-[var(--zv-muted)] mb-2">Masih butuh bantuan?</p>
                  <button onClick={() => { setShowHelpModal(false); setShowCsModal(true) }} className="h-9 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white text-[10px] font-bold hover:from-blue-500 hover:to-blue-400 transition-all flex items-center justify-center gap-1.5 mx-auto">
                    <Headphones className="w-3.5 h-3.5" />Hubungi CS
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


export default function Home() {
  const { isLoggedIn } = useAuthStore()
  if (!isLoggedIn) return <LoginPage />
  return <Dashboard />
}
