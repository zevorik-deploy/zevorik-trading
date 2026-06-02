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
  Video, Play, ThumbsUp, Eye as EyeIcon, Globe, Send,
  Sun, Moon
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
      className={`rounded-full overflow-hidden flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src="/zevorix-logo.png"
        alt="ZEVORIX"
        className="w-full h-full object-cover"
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
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: 'linear-gradient(180deg, #eff6ff 0%, #dbeafe 50%, #bfdbfe 100%)' }}>
      {/* Desktop Left Branding Panel - hidden on mobile */}
      <div className="hidden md:flex md:w-1/2 lg:w-[55%] flex-col items-center justify-center p-8 lg:p-16 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #172554 0%, #1d4ed8 54%, #3b82f6 100%)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.04) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 text-center text-white max-w-lg">
          <div className="mx-auto mb-6 p-1.5 bg-white/90 rounded-full shadow-[0_12px_40px_rgba(0,0,0,.3)]">
            <ZevorixLogo size={72} />
          </div>
          <h1 className="text-3xl lg:text-4xl font-black mb-3">ZEVORIX</h1>
          <p className="text-blue-200 text-sm lg:text-base mb-8 leading-relaxed">Future of Investing</p>
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
              <ZevorixLogo size={36} className="ring-2 ring-white shadow-md" />
              <div>
                <b className="block text-[11px] leading-tight font-black text-[#1d4ed8] tracking-wide">ZEVORIX</b>
                <span className="block text-[7px] font-bold text-[#3b82f6] uppercase tracking-widest">ZEVORIX Pro</span>
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
              <ZevorixLogo size={36} className="ring-2 ring-white shadow-md" />
              <div>
                <b className="block text-xs leading-tight font-black text-[#1d4ed8] tracking-wide">ZEVORIX</b>
                <span className="block text-[9px] font-bold text-[#3b82f6] uppercase tracking-widest">ZEVORIX Pro</span>
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
              <div className="mb-2 mx-auto p-1 bg-white/90 rounded-full shadow-[0_8px_24px_rgba(0,0,0,.3)]">
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

              {/* Demo Account */}
              <div className="rounded-2xl p-3 bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                <div>
                  <b className="block text-[10px] font-black text-[#1d4ed8]">Akun Demo</b>
                  <span className="block mt-0.5 text-[8px] font-bold text-slate-500">+62 81234567890 / demo123</span>
                </div>
                <button type="button" onClick={() => { setPhone('081234567890'); setPassword('demo123'); setIsLogin(true); }}
                  className="text-[8px] font-black text-white bg-[#3b82f6] px-3 py-1.5 rounded-lg hover:bg-[#1d4ed8] transition-colors">
                  Gunakan
                </button>
              </div>
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
  const [sinyalDuration, setSinyalDuration] = useState(20)
  const [selectedSinyalStock, setSelectedSinyalStock] = useState<Stock | null>(null)
  const [sinyalResults, setSinyalResults] = useState<{id: string; won: boolean; profit: number; stockCode: string; direction: 'NAIK' | 'TURUN'; amount: number}[]>([])
  const [sinyalAutoPending, setSinyalAutoPending] = useState(false)
  // Track remaining time per position
  const [sinyalTimers, setSinyalTimers] = useState<Record<string, number>>({})

  // Sinyal Pro live candlestick chart
  const [sinyalCandles, setSinyalCandles] = useState<CandleData[]>([])
  const [sinyalCurrentPrice, setSinyalCurrentPrice] = useState(0)
  const [sinyalChartTick, setSinyalChartTick] = useState(0)
  const sinyalChartSimRef = useRef<{
    price: number; basePrice: number; momentum: number; trend: number;
    phase: number; phaseLen: number; vol: number;
    currentCandle: { open: number; high: number; low: number; close: number; volume: number; tickCount: number; maxTicks: number };
    riggedDirection: 'up' | 'down' | null;
    riggedApplied: boolean;
  } | null>(null)
  const sinyalPositionsRef = useRef(sinyalPositions)
  useEffect(() => { sinyalPositionsRef.current = sinyalPositions }, [sinyalPositions])

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
  const getPayoutRates = useCallback((): { up: number; down: number } => {
    // Base rates that fluctuate slightly (like Stockity)
    const upBase = 80 + Math.random() * 8  // 80-88%
    const downBase = 55 + Math.random() * 10 // 55-65%
    return { up: Math.round(upBase * 10) / 10, down: Math.round(downBase * 10) / 10 }
  }, [])

  const [sinyalPayoutRates, setSinyalPayoutRates] = useState<{ up: number; down: number }>({ up: 82, down: 58 })

  // Refresh payout rates periodically (like real trading platforms)
  useEffect(() => {
    if (activeTab !== 'sinyal') return
    const interval = setInterval(() => {
      setSinyalPayoutRates(getPayoutRates())
    }, 15000) // Every 15 seconds
    return () => clearInterval(interval)
  }, [activeTab, getPayoutRates])

  const calcSinyalProfit = useCallback((amount: number, duration: number, direction: 'NAIK' | 'TURUN'): number => {
    const rate = direction === 'NAIK' ? sinyalPayoutRates.up : sinyalPayoutRates.down
    // Duration bonus: longer = slightly higher payout
    const durationBonus = duration <= 10 ? 0 : duration <= 20 ? 2 : duration <= 30 ? 4 : 6
    return rate + durationBonus
  }, [sinyalPayoutRates])

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

  const openSinyalPosition = useCallback((overrideDirection?: 'NAIK' | 'TURUN') => {
    if (!selectedSinyalStock || !sinyalAmount) return
    const amount = parseInt(sinyalAmount)
    if (amount < 100000) { toast({ title: 'Minimum Rp 100.000', variant: 'destructive' }); return }
    if (amount > (user?.balance || 0)) { toast({ title: 'Saldo tidak cukup', variant: 'destructive' }); return }
    const dir = overrideDirection || sinyalDirection
    const profitPercent = calcSinyalProfit(amount, sinyalDuration, dir)
    const posId = `sinyal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const newPosition = {
      id: posId,
      stockId: selectedSinyalStock.id,
      stockCode: selectedSinyalStock.code,
      stockName: selectedSinyalStock.name,
      direction: dir,
      amount,
      duration: sinyalDuration,
      startPrice: sinyalCurrentPrice || selectedSinyalStock.price,
      startTime: Date.now(),
      profitPercent,
      status: 'active' as const,
    }
    setSinyalPositions(prev => [...prev, newPosition])
    setSinyalTimers(prev => ({ ...prev, [posId]: sinyalDuration }))
    // Deduct balance immediately when opening position
    updateBalance((user?.balance || 0) - amount)
    toast({ title: 'Posisi Dibuka! 🎯', description: `${dir} ${selectedSinyalStock.code} • ${formatRupiah(amount)} • ${sinyalDuration}s` })
  }, [selectedSinyalStock, sinyalAmount, sinyalDirection, sinyalDuration, user, calcSinyalProfit, sinyalCurrentPrice, updateBalance])

  // Sinyal Pro live candlestick chart — initialize historical candles + real-time intrabar updates
  useEffect(() => {
    if (activeTab !== 'sinyal' || !selectedSinyalStock) return

    // Initialize chart simulation when modal first opens
    if (sinyalChartSimRef.current === null) {
      const basePrice = selectedSinyalStock.price
      const vol = Math.round(30000 + Math.random() * 70000)
      const sim = {
        price: basePrice,
        basePrice,
        momentum: 0,
        trend: Math.random() > 0.5 ? 1 : -1,
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
          maxTicks: sinyalActive ? sinyalDuration * 2 : 10,
        },
        riggedDirection: null as 'up' | 'down' | null,
        riggedApplied: false,
      }

      // Generate historical candles
      const histCandles: CandleData[] = []
      let prevClose = Math.round(basePrice * (0.97 + Math.random() * 0.06))
      const histSim = { momentum: 0, trend: 0, phase: 1, phaseLen: 5, vol }
      for (let i = 0; i < 25; i++) {
        const candle = generateCandle(prevClose, basePrice, histSim, i)
        histCandles.push(candle)
        prevClose = candle.close
      }
      setSinyalCandles(histCandles)
      setSinyalCurrentPrice(prevClose)
      sinyalChartSimRef.current = sim
    }

    const interval = setInterval(() => {
      const sim = sinyalChartSimRef.current
      if (!sim) return

      const cc = sim.currentCandle
      cc.tickCount++

      // Determine rigged direction at ~70% of candle duration (only when a position is active)
      if (sinyalActive && cc.tickCount >= cc.maxTicks * 0.7 && !sim.riggedApplied) {
        const shouldWin = Math.random() < 0.42
        const activePos = sinyalPositionsRef.current.find(p => p.status === 'active')
        if (activePos) {
          sim.riggedDirection = shouldWin
            ? (activePos.direction === 'NAIK' ? 'up' : 'down')
            : (activePos.direction === 'NAIK' ? 'down' : 'up')
        }
        sim.riggedApplied = true
      }

      // Generate realistic tick movement with fake-outs
      const baseVal = sim.basePrice
      const volatility = baseVal * 0.0015
      let drift = 0

      const progress = cc.tickCount / cc.maxTicks

      // Early phase: random movement with slight trend
      if (progress < 0.3) {
        drift = sim.trend * baseVal * 0.0003 + (Math.random() - 0.5) * volatility
      }
      // Middle phase: fake-out potential (stronger moves in opposite direction)
      else if (progress < 0.6) {
        const fakeOut = Math.random() < 0.3
        drift = fakeOut
          ? -sim.trend * baseVal * 0.001 + (Math.random() - 0.5) * volatility * 0.5
          : sim.trend * baseVal * 0.0005 + (Math.random() - 0.5) * volatility
      }
      // Late phase: apply rigged direction if available
      else {
        if (sim.riggedDirection) {
          const rigDrift = sim.riggedDirection === 'up' ? 1 : -1
          drift = rigDrift * baseVal * 0.001 * (0.5 + Math.random()) + (Math.random() - 0.5) * volatility * 0.3
        } else {
          drift = sim.trend * baseVal * 0.0005 + (Math.random() - 0.5) * volatility
        }
      }

      sim.momentum = sim.momentum * 0.5 + drift
      const meanRevert = (sim.basePrice - sim.price) * 0.002
      sim.price = Math.round(Math.max(baseVal * 0.92, Math.min(baseVal * 1.08, sim.price + sim.momentum + meanRevert)))

      cc.close = sim.price
      cc.high = Math.max(cc.high, cc.close)
      cc.low = Math.min(cc.low, cc.close)
      cc.volume += Math.round(Math.random() * 500 + 200)

      setSinyalCurrentPrice(sim.price)
      setSinyalChartTick(t => t + 1)

      // If candle is complete
      if (cc.tickCount >= cc.maxTicks) {
        const completedCandle: CandleData = {
          idx: 0,
          open: cc.open,
          high: cc.high,
          low: cc.low,
          close: cc.close,
          volume: cc.volume,
          time: new Date().getHours().toString().padStart(2, '0') + ':' + new Date().getMinutes().toString().padStart(2, '0'),
        }
        setSinyalCandles(prev => [...prev, completedCandle])

        // Reset for next candle
        cc.open = cc.close
        cc.high = cc.close
        cc.low = cc.close
        cc.volume = 0
        cc.tickCount = 0
        cc.maxTicks = sinyalActive ? sinyalDuration * 2 : 10
        sim.riggedApplied = false
        sim.riggedDirection = null
        sim.trend = Math.random() > 0.5 ? 1 : -1
      }
    }, 500)

    return () => clearInterval(interval)
  }, [activeTab, selectedSinyalStock, sinyalActive, sinyalDuration, generateCandle])

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
            <ZevorixLogo size={34} className="flex-shrink-0 ring-2 ring-[var(--zv-border)] shadow-sm" />
            <div>
              <b className="block text-[11px] md:text-sm font-black gradient-text leading-tight">ZEVORIX</b>
              <span className="block text-[8px] md:text-[10px] font-bold text-[var(--zv-muted)]">Dashboard</span>
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
              {/* Dual Wallet Card */}
              <div className="rounded-2xl overflow-hidden mb-4 border border-blue-600/20" style={{ background: 'linear-gradient(145deg, #0c1a2e 0%, #1e3a5f 54%, #2563eb 100%)', boxShadow: '0 4px 24px rgba(37,99,235,0.18)' }}>
                <div className="p-4 text-white relative">
                  {/* Decorative pattern */}
                  <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] md:text-[11px] font-black tracking-wider">RINGKASAN SALDO</span>
                      <span className="h-4 px-1.5 rounded-full bg-blue-400/30 border border-blue-400/40 text-[7px] font-black text-blue-300 flex items-center gap-0.5">
                        <span className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" />AKTIF
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
                        <span className="text-[7px] md:text-[8px] font-bold text-blue-200 uppercase tracking-wider">DOMPET UTAMA</span>
                      </div>
                      <b className="block text-[13px] md:text-sm font-black">{showBalance ? formatRupiah(user?.balance || 0) : '••••••••'}</b>
                      <span className="block text-[5px] font-semibold text-blue-200/60 mt-0.5">Deposit untuk investasi</span>
                    </div>
                    {/* Dompet Penarikan */}
                    <div className="rounded-2xl p-3 bg-white/10 border border-white/15">
                      <div className="flex items-center gap-1 mb-1">
                        <CreditCard className="w-3 h-3 text-blue-300" />
                        <span className="text-[7px] md:text-[8px] font-bold text-blue-200 uppercase tracking-wider">DOMPET PENARIKAN</span>
                      </div>
                      <b className="block text-[13px] md:text-sm font-black">{showBalance ? formatRupiah(user?.withdrawalBalance || 0) : '••••••••'}</b>
                      <span className="block text-[5px] font-semibold text-blue-200/60 mt-0.5">Dapat ditarik</span>
                    </div>
                  </div>

                  {/* Total Investasi */}
                  <div className="rounded-2xl p-2.5 bg-white/8 border border-white/12 mb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-yellow-300" />
                        <span className="text-[8px] font-bold text-blue-200">TOTAL INVESTASI</span>
                      </div>
                      <b className="text-[12px] font-black">{showBalance ? formatRupiah(portfolioSummary.totalCurrentValue) : '••••••••'}</b>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button onClick={() => setActiveTab('finance')} className="h-10 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 text-[10px] font-bold hover:from-yellow-300 hover:to-yellow-400 transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-yellow-500/20">
                      <Plus className="w-4 h-4" />Isi Saldo
                    </button>
                    <button onClick={() => setActiveTab('finance')} className="h-10 rounded-xl bg-white/10 border border-white/25 text-white text-[10px] font-bold hover:bg-white/20 hover:border-white/40 transition-all flex items-center justify-center gap-1.5 backdrop-blur-sm">
                      <Minus className="w-4 h-4" />Tarik Saldo
                    </button>
                  </div>

                  {/* Regulatory Badges */}
                  <div className="flex items-center justify-center gap-3">
                    <div className="flex items-center gap-1">
                      <Shield className="w-3 h-3 text-blue-300" />
                      <span className="text-[7px] font-bold text-blue-200">Terdaftar & Diawasi</span>
                    </div>
                    <div className="w-px h-3 bg-white/20" />
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-yellow-300" />
                      <span className="text-[7px] font-bold text-blue-200">Berlisensi Resmi</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu Cepat */}
              <div className="mb-4">
                <div className="mb-2.5 flex items-center gap-2">
                  <div className="w-1 h-5 rounded-full bg-[#3b82f6]" />
                  <div>
                    <h3 className="text-[12px] md:text-sm font-black text-[#3b82f6]">Menu Cepat</h3>
                    <span className="text-[9px] font-semibold text-[var(--zv-muted)]">Akses fitur penting hanya dalam satu ketukan</span>
                  </div>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1 custom-scrollbar">
                  {[
                    { icon: <ClipboardList className="w-5 h-5" />, label: 'Cek Harian', action: () => setShowDailyCheckModal(true), color: 'bg-[var(--zv-panel)] text-[#3b82f6]', border: 'border-[var(--zv-border)]' },
                    { icon: <CalendarDays className="w-5 h-5" />, label: 'Tugas', action: () => { setTasksLoading(true); fetchTasks().finally(() => setTasksLoading(false)); setShowTasksModal(true) }, color: 'bg-[var(--zv-panel)] text-[#f59e0b]', border: 'border-[var(--zv-border)]' },
                    { icon: <Download className="w-5 h-5" />, label: 'Unduh App', action: () => {}, color: 'bg-[var(--zv-panel)] text-[#2196f3]', border: 'border-[var(--zv-border)]' },
                  ].map((a, i) => (
                    <button key={i} onClick={a.action} className="stock-card flex-shrink-0 flex flex-col items-center gap-2 py-3.5 px-5 rounded-2xl bg-[var(--zv-surface)] border border-[var(--zv-border)] relative min-w-[88px]">
                      <div className={`w-10 h-10 rounded-xl ${a.color} border ${a.border} grid place-items-center`}>{a.icon}</div>
                      <span className="text-[9px] md:text-[10px] font-bold text-[#3b82f6]">{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cek Harian Card */}
              <div className="rounded-2xl overflow-hidden mb-4 border border-blue-600/20" style={{ background: 'linear-gradient(145deg, #0c1a2e 0%, #1e3a5f 54%, #2563eb 100%)', boxShadow: '0 4px 20px rgba(37,99,235,0.15)' }}>
                <div className="p-4 text-white relative">
                  <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/10 grid place-items-center">
                        <CalendarDays className="w-5 h-5 text-yellow-300" />
                      </div>
                      <div>
                        <b className="text-[12px] md:text-sm font-black">CEK HARIAN</b>
                        <span className="block text-[9px] md:text-[10px] font-semibold text-blue-200">
                          {dailyCheckStatus.streak > 0 ? `🔥 ${dailyCheckStatus.streak} Hari Berturut-turut` : 'Klaim bonus harian Anda'}
                        </span>
                      </div>
                    </div>
                    {dailyCheckStatus.canCheckToday ? (
                      <button
                        onClick={handleDailyCheck}
                        disabled={dailyCheckLoading}
                        className="h-9 px-4 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 text-[10px] font-bold hover:from-yellow-300 hover:to-yellow-400 transition-all disabled:opacity-60 flex items-center gap-1.5 shadow-lg shadow-yellow-500/20"
                      >
                        {dailyCheckLoading ? (
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        ) : (
                          'Klaim Sekarang'
                        )}
                      </button>
                    ) : (
                      <div className="h-9 px-4 rounded-xl bg-white/15 border border-white/10 text-[10px] font-bold flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-blue-300" />
                        Sudah Dicek
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
                      <span className="text-[8px] text-blue-200 font-bold">Bonus Hari Ini</span>
                      <b className="block text-sm font-black text-yellow-300">{formatRupiah(dailyCheckStatus.todayReward)}</b>
                    </div>
                  )}
                </div>
              </div>

              {/* Tugas (Tasks) Summary Card */}
              <div className="rounded-2xl p-3.5 bg-[var(--zv-panel)] border border-[var(--zv-border)] mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-[var(--zv-surface)] grid place-items-center">
                      <ListChecks className="w-4.5 h-4.5 text-amber-600" />
                    </div>
                    <div>
                      <b className="text-[11px] md:text-xs font-black text-[#3b82f6]">Tugas</b>
                      <span className="block text-[8px] font-semibold text-[var(--zv-muted)]">
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
                <div className="w-full h-1.5 rounded-full bg-[var(--zv-surface)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all duration-500"
                    style={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0}%` }}
                  />
                </div>
                {/* Show first 2 unclaimed tasks */}
                {tasks.filter(t => !t.claimed).slice(0, 2).map(task => (
                  <div key={task.id} className="flex items-center justify-between mt-2 py-1 border-b border-[var(--zv-border)] last:border-0">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-5 h-5 rounded-md grid place-items-center ${task.completed ? 'bg-[var(--zv-surface)]' : 'bg-[var(--zv-surface)]'}`}>
                        {task.completed ? <CheckCircle className="w-3 h-3 text-[#3b82f6]" /> : <Target className="w-3 h-3 text-amber-600" />}
                      </div>
                      <div>
                        <span className="block text-[8px] font-bold text-[var(--zv-text)]">{task.title}</span>
                        <span className="block text-[7px] text-[var(--zv-muted)]">{task.progress}/{task.target}</span>
                      </div>
                    </div>
                    <span className="text-[8px] font-black text-[#3b82f6]">+{formatRupiah(task.reward)}</span>
                  </div>
                ))}
              </div>

              {/* Portfolio Chart */}
              {portfolio.length > 0 && (
                <div className="rounded-2xl p-3.5 bg-[var(--zv-panel)] border border-[var(--zv-border)] mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[11px] md:text-xs font-black text-[#3b82f6]">Alokasi Portofolio</h3>
                    <span className="text-[8px] md:text-[9px] font-bold text-[var(--zv-muted)]">{portfolio.length} saham</span>
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
                          <span className="text-[8px] font-black text-[#3b82f6] flex-shrink-0">{p.stock.code}</span>
                          <span className="text-[7px] md:text-[8px] font-bold text-[var(--zv-muted)] flex-1">{formatRupiah(p.currentValue)}</span>
                          <span className={`text-[7px] md:text-[8px] font-black ${p.profitLoss >= 0 ? 'text-[#22c55e]' : 'text-[#ef5350]'}`}>{formatPercent(p.profitLossPercent)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Top Movers */}
              {stocks.length > 0 && (
                <div className="rounded-2xl p-3.5 bg-[var(--zv-panel)] border border-[var(--zv-border)] mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[11px] md:text-xs font-black text-[#3b82f6]">Top Movers</h3>
                    <button onClick={() => setActiveTab('market')} className="text-[8px] md:text-[9px] font-bold text-[#3b82f6] hover:underline">Lihat Semua</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[8px] md:text-[9px] font-bold text-[#3b82f6] mb-1 block">🔺 Gainers</span>
                      {topGainers.slice(0, 3).map(s => (
                        <button key={s.id} onClick={() => openStockDetail(s)} className="w-full flex items-center justify-between py-1.5 border-b border-[var(--zv-border)] last:border-0">
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-lg overflow-hidden bg-[var(--zv-surface)] flex items-center justify-center">{s.logo ? <img src={s.logo} alt={s.code} className="w-full h-full object-cover" /> : <span className="text-[7px] font-black text-[#22c55e]">{s.code.slice(0, 2)}</span>}</div>
                            <span className="text-[9px] font-bold text-[var(--zv-text)]">{s.code}</span>
                          </div>
                          <span className="text-[8px] font-black text-[#22c55e]">+{s.changePercent.toFixed(2)}%</span>
                        </button>
                      ))}
                    </div>
                    <div>
                      <span className="text-[8px] font-bold text-[#ef5350] mb-1 block">🔻 Losers</span>
                      {topLosers.slice(0, 3).map(s => (
                        <button key={s.id} onClick={() => openStockDetail(s)} className="w-full flex items-center justify-between py-1.5 border-b border-[var(--zv-border)] last:border-0">
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-lg overflow-hidden bg-[var(--zv-surface)] flex items-center justify-center">{s.logo ? <img src={s.logo} alt={s.code} className="w-full h-full object-cover" /> : <span className="text-[7px] font-black text-[#ef5350]">{s.code.slice(0, 2)}</span>}</div>
                            <span className="text-[9px] font-bold text-[var(--zv-text)]">{s.code}</span>
                          </div>
                          <span className="text-[8px] font-black text-[#ef5350]">{s.changePercent.toFixed(2)}%</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Watchlist */}
              {watchlist.length > 0 && (
                <div className="rounded-2xl p-3.5 bg-[var(--zv-panel)] border border-[var(--zv-border)] mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[11px] md:text-xs font-black text-[#3b82f6]">Watchlist</h3>
                    <Star className="w-3.5 h-3.5 text-[#f59e0b]" />
                  </div>
                  <div className="space-y-1.5">
                    {watchlist.slice(0, 5).map(w => (
                      <button key={w.id} onClick={() => openStockDetail(w.stock)} className="w-full flex items-center justify-between py-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg overflow-hidden bg-[var(--zv-surface)] flex items-center justify-center">{w.stock.logo ? <img src={w.stock.logo} alt={w.stock.code} className="w-full h-full object-cover" /> : <span className="text-[7px] font-black text-[#3b82f6]">{w.stock.code.slice(0, 2)}</span>}</div>
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

              {/* Recent Transactions */}
              {transactions.length > 0 && (
                <div className="rounded-2xl p-3.5 bg-[var(--zv-panel)] border border-[var(--zv-border)] mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[11px] md:text-xs font-black text-[#3b82f6]">Transaksi Terakhir</h3>
                    <button onClick={() => setActiveTab('history')} className="text-[8px] md:text-[9px] font-bold text-[#3b82f6] hover:underline">Lihat Semua</button>
                  </div>
                  {transactions.slice(0, 4).map(tx => (
                    <div key={tx.id} className="flex items-center justify-between py-1.5 border-b border-[var(--zv-border)] last:border-0">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg grid place-items-center ${tx.type === 'BUY' ? 'bg-[var(--zv-surface)]' : 'bg-[var(--zv-surface)]'}`}>
                          {tx.type === 'BUY' ? <ArrowDownRight className="w-3.5 h-3.5 text-[#3b82f6]" /> : <ArrowUpRight className="w-3.5 h-3.5 text-[#ef5350]" />}
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold text-[var(--zv-text)]">{tx.type === 'BUY' ? 'Beli' : 'Jual'} {tx.stock.code}</span>
                          <span className="block text-[7px] text-[var(--zv-muted)]">{formatRupiah(tx.total)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block text-[9px] font-black text-[var(--zv-text)]">{formatRupiah(tx.total)}</span>
                        <span className="block text-[7px] text-[var(--zv-muted)]">{formatDateTime(tx.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* News */}
              {news.length > 0 && (
                <div className="rounded-2xl p-3.5 bg-[var(--zv-panel)] border border-[var(--zv-border)]">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[11px] md:text-xs font-black text-[#3b82f6]">Berita Terkini</h3>
                    <button onClick={() => setActiveTab('news')} className="text-[8px] md:text-[9px] font-bold text-[#3b82f6] hover:underline">Lihat Semua</button>
                  </div>
                  {news.slice(0, 3).map(n => (
                    <div key={n.id} className="py-2 border-b border-[var(--zv-border)] last:border-0">
                      <span className="block text-[9px] font-bold text-[var(--zv-text)] leading-snug">{n.title}</span>
                      <span className="block text-[7px] text-[var(--zv-muted)] mt-0.5">{formatDate(n.createdAt)} • {n.category}</span>
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
                <div className="rounded-2xl overflow-hidden mb-4 bg-[var(--zv-panel)] border border-[var(--zv-border)]">
                  <div className="p-3 md:p-4" style={{ background: 'linear-gradient(145deg, #0c1a2e 0%, #1e3a5f 54%, #2563eb 100%)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-yellow-300" />
                        <span className="text-[11px] md:text-sm font-black text-white">Market Overview</span>
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
                            <button onClick={() => openContract(s)} className="h-9 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white text-[10px] md:text-[11px] font-bold hover:from-blue-500 hover:to-blue-400 transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/20">
                              <Package className="w-3.5 h-3.5" />Kontrak
                            </button>
                            <span className="text-[8px] font-bold text-[#f59e0b]">Mulai 5%/hari</span>
                          </div>
                        </div>
                      </div>

                      {/* Contract Info - Footer */}
                      <div className="px-3 md:px-4 py-2.5 bg-[var(--zv-surface)] border-t border-[var(--zv-border)] grid grid-cols-3 gap-2">
                        <div>
                          <span className="block text-[7px] md:text-[8px] font-bold text-[var(--zv-muted)]">Rate</span>
                          <span className="block text-[9px] md:text-[10px] font-black text-[#22c55e]">{getStockBaseRate(s.code)}%/hari</span>
                        </div>
                        <div>
                          <span className="block text-[7px] md:text-[8px] font-bold text-[var(--zv-muted)]">Durasi</span>
                          <span className="block text-[9px] md:text-[10px] font-black text-[#f59e0b]">30-365 Hari</span>
                        </div>
                        <div>
                          <span className="block text-[7px] md:text-[8px] font-bold text-[var(--zv-muted)]">Volume</span>
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
                      const canClaim = !c.lastClaimAt || new Date(c.lastClaimAt).toDateString() !== new Date().toDateString()
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
                                <span className="block text-[7px] text-[var(--zv-muted)]">{formatRupiah(inv.amount)} • {inv.product.category === 'potential' ? 'Potential' : 'Dividen'}</span>
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

          {/* ====== INVESTASI TAB ====== */}
          {activeTab === 'investasi' && (
            <motion.div key="investasi" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {/* Header Card */}
              <div className="rounded-2xl overflow-hidden mb-4 border border-blue-600/20" style={{ background: 'linear-gradient(145deg, #0c1a2e 0%, #1e3a5f 54%, #2563eb 100%)', boxShadow: '0 4px 24px rgba(37,99,235,0.15)' }}>
                <div className="p-4 text-white relative">
                  <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-yellow-300" />
                    <h2 className="text-[16px] md:text-xl font-black">Investasi</h2>
                  </div>
                  <p className="text-[10px] md:text-[11px] text-blue-200 leading-relaxed mb-3">Pilih paket investasi dan dapatkan profit harian secara otomatis. Semua profit dikreditkan ke saldo Anda setiap 24 jam.</p>

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
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                      <span className="text-[8px] font-black text-blue-300">Live 24/7</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="rounded-2xl p-2.5 bg-white/10 border border-white/15 text-center">
                      <Package className="w-4 h-4 text-yellow-300 mx-auto mb-0.5" />
                      <b className="block text-[8px] font-black">{investProducts.length}</b>
                      <span className="block text-[7px] text-blue-200 font-bold">Produk</span>
                    </div>
                    <div className="rounded-2xl p-2.5 bg-white/10 border border-white/15 text-center">
                      <Sparkles className="w-4 h-4 text-yellow-300 mx-auto mb-0.5" />
                      <b className="block text-[8px] font-black">{userInvestments.filter(i => i.status === 'active').length}</b>
                      <span className="block text-[7px] text-blue-200 font-bold">Aktif</span>
                    </div>
                    <div className="rounded-2xl p-2.5 bg-white/10 border border-white/15 text-center">
                      <Wallet className="w-4 h-4 text-yellow-300 mx-auto mb-0.5" />
                      <b className="block text-[8px] font-black">{formatRupiah(user?.balance || 0).replace('Rp', '').trim()}</b>
                      <span className="block text-[7px] text-blue-200 font-bold">Saldo</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category Tabs */}
              <div className="flex gap-2 mb-4">
                <button onClick={() => setInvestCategory('potential')} className={`flex-1 h-10 rounded-2xl text-[11px] md:text-xs font-bold transition-all ${investCategory === 'potential' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/20' : 'bg-[var(--zv-surface)] border border-[var(--zv-border)] text-[var(--zv-muted)] hover:border-[#3b82f6]/30 hover:text-[#3b82f6]'}`}>
                  <TrendingUp className="w-3.5 h-3.5 inline mr-1" />Saham Potential
                </button>
                <button onClick={() => setInvestCategory('dividen')} className={`flex-1 h-10 rounded-2xl text-[11px] md:text-xs font-bold transition-all ${investCategory === 'dividen' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/20' : 'bg-[var(--zv-surface)] border border-[var(--zv-border)] text-[var(--zv-muted)] hover:border-[#3b82f6]/30 hover:text-[#3b82f6]'}`}>
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
                  const chartColor = isUp ? '#2563eb' : '#ef4444'
                  const lastValue = chartData.length > 0 ? chartData[chartData.length - 1].close : product.modal

                  return (
                    <div key={product.id} className="rounded-2xl bg-[var(--zv-panel)] border border-[var(--zv-border)] hover:border-[#3b82f6]/30 hover:shadow-lg hover:shadow-blue-500/5 transition-all overflow-hidden card-depth">
                      {/* Top badges */}
                      <div className="px-3 pt-3 flex items-center gap-1.5 flex-wrap">
                        <span className="h-4 px-1.5 rounded-full bg-[var(--zv-surface)] border border-[var(--zv-border)] text-[7px] font-black text-[#3b82f6] flex items-center gap-0.5">
                          <CheckCircle className="w-2.5 h-2.5" />Tersedia
                        </span>
                        <span className="h-4 px-1.5 rounded-full bg-[var(--zv-surface)] border border-[var(--zv-border)] text-[7px] font-black text-[#f59e0b]">DAILY PROFIT</span>
                        <span className="h-4 px-1.5 rounded-full bg-[var(--zv-surface)] border border-[var(--zv-border)] text-[7px] font-bold text-[#3b82f6]">{product.duration} Hari</span>
                      </div>

                      {/* Product Name + Price */}
                      <div className="px-3 pt-2 pb-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-[13px] font-black text-[var(--zv-text)]">{product.name}</h3>
                            <span className="text-[8px] font-bold text-[var(--zv-muted)]">Aset Saham</span>
                          </div>
                          <div className="text-right">
                            <span className="block text-[12px] font-black tabular-nums" style={{ color: isUp ? '#22c55e' : '#ef5350' }}>{formatRupiah(lastValue)}</span>
                            <span className={`text-[8px] font-black ${isUp ? 'text-[#22c55e]' : 'text-[#ef5350]'}`}>
                              {isUp ? '▲' : '▼'} {movement ? (isUp ? '+' : '') + movement.changePercent.toFixed(2) + '%' : '+0.00%'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Chart Controls */}
                      <div className="px-3 py-0.5">
                        <div className="flex items-center justify-between">
                          {/* Chart Type Selector */}
                          <div className="flex items-center gap-0.5 bg-[var(--zv-surface)] rounded-lg p-0.5">
                            {([
                              { type: 'area' as const, icon: ' area', label: 'Area' },
                              { type: 'line' as const, icon: ' line', label: 'Line' },
                              { type: 'candle' as const, icon: ' candle', label: 'Candle' },
                              { type: 'bar' as const, icon: ' bar', label: 'Bar' },
                            ]).map(ct => (
                              <button key={ct.type} onClick={() => setInvestChartType(ct.type)}
                                className={`h-5 px-1.5 rounded-md text-[6px] font-black transition-all ${investChartType === ct.type ? 'bg-[var(--zv-panel)] text-[#3b82f6]' : 'text-[var(--zv-muted)] hover:text-[var(--zv-text)]'}`}>
                                {ct.label}
                              </button>
                            ))}
                          </div>
                          {/* Timeframe Selector */}
                          <div className="flex items-center gap-0.5">
                            {(['1H', '1D', '1W', '1M', 'ALL'] as const).map(tf => (
                              <button key={tf} onClick={() => setInvestTimeframe(tf)}
                                className={`h-5 px-1.5 rounded-md text-[6px] font-black transition-all ${investTimeframe === tf ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm' : 'text-[var(--zv-muted)] hover:text-[var(--zv-text)] hover:bg-[var(--zv-surface)]'}`}>
                                {tf}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <div className="flex items-center gap-1">
                            <BarChart3 className="w-2.5 h-2.5 text-[var(--zv-muted)]" />
                            <span className="text-[7px] font-bold text-[var(--zv-muted)] uppercase tracking-wider">PERGERAKAN MARKET</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-[6px] font-black text-[#3b82f6]">LIVE</span>
                          </div>
                        </div>
                      </div>

                      {/* Live Chart */}
                      <div className="px-3 py-1">
                        <div className="h-24 w-full relative rounded-lg border border-[var(--zv-border)]/50 overflow-hidden" style={{ background: 'var(--zv-panel)' }}>
                          {chartData.length > 2 ? (() => {
                              // Candlestick chart (small)
                              if (investChartType === 'candle') {
                                const candles = chartData
                                const allPrices = candles.flatMap(c => [c.high, c.low])
                                const minP = Math.min(...allPrices)
                                const maxP = Math.max(...allPrices)
                                const rangeP = maxP - minP || 1
                                const totalCandles = candles.length
                                const maxVol = Math.max(...candles.map(c => c.volume), 1)
                                const priceH = 68
                                const volH = 20
                                const padTop = 4
                                const padBot = 4
                                const svgH = padTop + priceH + volH + padBot
                                const priceScaleW = 42
                                const leftPad = 6
                                const candleW = Math.max(4, Math.floor(140 / totalCandles))
                                const gapW = Math.max(2, Math.floor(30 / totalCandles))
                                const chartW = totalCandles * (candleW + gapW) + gapW * 2
                                const svgW = chartW + priceScaleW
                                if (candles.length < 2) return <div className="flex items-center justify-center h-full text-[8px] text-gray-400">Data kurang...</div>
                                const compactPriceSmall = (p: number) => {
                                  if (p >= 1e6) return `${(p / 1e6).toFixed(1)}M`
                                  if (p >= 1e3) return `${(p / 1e3).toFixed(1)}K`
                                  return p.toFixed(0)
                                }
                                return (
                                  <svg className="w-full h-full" viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="none" style={{ fontFamily: 'monospace' }} shapeRendering="crispEdges">
                                    {/* Grid lines - dotted */}
                                    {[0, 1, 2, 3, 4].map(gi => {
                                      const gy = padTop + (gi / 4) * priceH
                                      return (
                                        <g key={`grid-${gi}`}>
                                          <line x1={leftPad} y1={gy} x2={chartW} y2={gy} stroke="var(--zv-border)" strokeWidth="0.5" strokeDasharray="3,3" />
                                          <text x={chartW + 4} y={gy + 3} fontSize="5.5" fill="var(--zv-muted)">{compactPriceSmall(Math.round(maxP - (rangeP / 4) * gi))}</text>
                                        </g>
                                      )
                                    })}
                                    {/* Volume bars with opacity variation */}
                                    {candles.map((c, i) => {
                                      const x = leftPad + gapW + i * (candleW + gapW)
                                      const isGreen = c.close >= c.open
                                      const volBarH = (c.volume / maxVol) * volH
                                      const volY = padTop + priceH + volH - volBarH
                                      const volOpacity = 0.2 + (i / totalCandles) * 0.2
                                      return <rect key={`vol-${i}`} x={x} y={volY} width={candleW} height={volBarH} fill={isGreen ? '#22c55e' : '#ef5350'} opacity={volOpacity} rx="0.5" />
                                    })}
                                    {/* Candles - hollow bearish style */}
                                    {candles.map((c, i) => {
                                      const x = leftPad + gapW + i * (candleW + gapW)
                                      const yH = padTop + ((maxP - c.high) / rangeP) * priceH
                                      const yL = padTop + ((maxP - c.low) / rangeP) * priceH
                                      const yO = padTop + ((maxP - c.open) / rangeP) * priceH
                                      const yC = padTop + ((maxP - c.close) / rangeP) * priceH
                                      const isGreen = c.close >= c.open
                                      const bodyTop = Math.min(yO, yC)
                                      const bodyH = Math.max(Math.abs(yO - yC), 1)
                                      const isLast = i === totalCandles - 1
                                      return (
                                        <g key={i} opacity={isLast ? 1 : 0.85}>
                                          <line x1={x + candleW / 2} y1={yH} x2={x + candleW / 2} y2={yL} stroke={isGreen ? '#22c55e' : '#ef5350'} strokeWidth="0.7" />
                                          <rect x={x} y={bodyTop} width={candleW} height={bodyH} fill={isGreen ? '#22c55e' : 'var(--zv-panel)'} stroke={isGreen ? '#22c55e' : '#ef5350'} strokeWidth="0.5" rx="0.5" />
                                        </g>
                                      )
                                    })}
                                    {/* Current price line */}
                                    {candles.length > 0 && (() => {
                                      const lastC = candles[candles.length - 1]
                                      const isGreen = lastC.close >= lastC.open
                                      const yLast = padTop + ((maxP - lastC.close) / rangeP) * priceH
                                      return (
                                        <>
                                          <line x1={leftPad} y1={yLast} x2={chartW} y2={yLast} stroke={isGreen ? '#22c55e' : '#ef5350'} strokeWidth="0.5" strokeDasharray="3,2" opacity="0.7" />
                                          <rect x={chartW + 2} y={yLast - 5} width={priceScaleW - 4} height="10" rx="2" fill={isGreen ? '#22c55e' : '#ef5350'} />
                                          <text x={chartW + priceScaleW / 2} y={yLast + 2.5} fontSize="5.5" fill="white" textAnchor="middle" fontWeight="bold">{compactPriceSmall(lastC.close)}</text>
                                        </>
                                      )
                                    })()}
                                  </svg>
                                )
                              }

                              const values = chartData.map(d => d.close)
                              const minV = Math.min(...values)
                              const maxV = Math.max(...values)
                              const rangeV = maxV - minV || 1
                              const domain: [number, number] = [Math.floor(minV - rangeV * 0.1), Math.ceil(maxV + rangeV * 0.1)]

                              // Bar chart
                              if (investChartType === 'bar') {
                                const barData = chartData.map((d, i) => ({
                                  idx: d.idx,
                                  close: d.close,
                                  fill: i > 0 && d.close >= chartData[i - 1].close ? '#2563eb' : '#ef4444'
                                }))
                                return (
                                  <ResponsiveContainer width="100%" height="100%">
                                    <ReBarChart data={barData} margin={{ top: 2, right: 4, bottom: 2, left: 2 }}>
                                      <XAxis dataKey="idx" hide />
                                      <YAxis hide domain={domain} />
                                      <Bar dataKey="close" radius={[2, 2, 0, 0]} isAnimationActive={true} animationDuration={400}
                                        shape={(props: Record<string, unknown>) => {
                                          const { x, y, width, height, fill: _fill } = props as { x: number; y: number; width: number; height: number; fill: string }
                                          return <rect x={x} y={y} width={Math.max(width, 2)} height={Math.max(height, 1)} fill={_fill} rx={2} opacity={0.8} />
                                        }}>
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
                                    <LineChart data={chartData} margin={{ top: 2, right: 8, bottom: 2, left: 2 }}>
                                      <XAxis dataKey="idx" hide />
                                      <YAxis hide domain={domain} />
                                      <Line type="monotone" dataKey="close" stroke={chartColor} strokeWidth={2} dot={false}
                                        activeDot={false}
                                        isAnimationActive={true} animationDuration={500} animationEasing="ease-out" />
                                    </LineChart>
                                  </ResponsiveContainer>
                                )
                              }

                              // Area chart (default)
                              return (
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={chartData} margin={{ top: 2, right: 8, bottom: 2, left: 2 }}>
                                    <defs>
                                      <linearGradient id={`investGrad-${product.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor={chartColor} stopOpacity="0.35" />
                                        <stop offset="70%" stopColor={chartColor} stopOpacity="0.08" />
                                        <stop offset="100%" stopColor={chartColor} stopOpacity="0" />
                                      </linearGradient>
                                    </defs>
                                    <XAxis dataKey="idx" hide />
                                    <YAxis hide domain={domain} />
                                    <Area type="monotone" dataKey="close" stroke={chartColor} fill={`url(#investGrad-${product.id})`} strokeWidth={1.8}
                                      dot={(props: Record<string, unknown>) => {
                                        const { cx, cy, index } = props as { cx: number; cy: number; index: number }
                                        if (index !== chartData.length - 1) return <g key={String(index)} />
                                        return (
                                          <g key={`invest-dot-${product.id}`}>
                                            <circle cx={cx} cy={cy} r={5} fill={chartColor} opacity={0.2}>
                                              <animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite" />
                                              <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
                                            </circle>
                                            <circle cx={cx} cy={cy} r={3} fill={chartColor} stroke="#fff" strokeWidth={1} />
                                          </g>
                                        )
                                      }}
                                      activeDot={false}
                                      isAnimationActive={true} animationDuration={500} animationEasing="ease-out" />
                                  </AreaChart>
                                </ResponsiveContainer>
                              )
                            })() : (
                              <div className="flex items-center justify-center h-full text-[8px] text-[var(--zv-muted)]">Memuat data...</div>
                            )
                          }
                        </div>
                      </div>

                      {/* Product Details */}
                      <div className="px-3 pt-2 pb-1 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-bold text-[var(--zv-muted)] uppercase tracking-wider">MODAL</span>
                          <span className="text-[10px] font-black text-[var(--zv-text)]">{formatRupiah(product.modal)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-bold text-[var(--zv-muted)] uppercase tracking-wider">PROFIT HARIAN</span>
                          <span className="text-[10px] font-black text-[#22c55e]">+{formatRupiah(product.dailyProfit)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-bold text-[var(--zv-muted)] uppercase tracking-wider">TOTAL KEUNTUNGAN</span>
                          <div className="text-right">
                            <span className="text-[10px] font-black text-[#22c55e]">{formatRupiah(product.totalReturn)}</span>
                            <span className="ml-1 text-[7px] font-bold text-[#f59e0b] bg-[var(--zv-surface)] px-1 rounded">ROI {product.roi}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Profit Distribution Footer */}
                      <div className="px-3 py-1.5 bg-[var(--zv-surface)] border-t border-[var(--zv-border)]">
                        <div className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-[#3b82f6]" />
                          <span className="text-[7px] font-bold text-[#3b82f6]">PEMBAGIAN PROFIT: Setiap 24 jam AUTO</span>
                        </div>
                      </div>

                      {/* Buttons */}
                      <div className="px-3 pb-3 pt-2 flex gap-2">
                        <button onClick={() => { setSelectedDetailProduct(product); setShowInvestDetailModal(true) }}
                          className="flex-1 h-9 rounded-xl bg-[var(--zv-surface)] border border-[var(--zv-border)] text-[#3b82f6] text-[9px] font-bold hover:bg-[var(--zv-surface)] transition-colors">
                          Lihat Selengkapnya
                        </button>
                        <button onClick={() => { setSelectedProduct(product); setShowInvestModal(true) }}
                          className="flex-1 h-9 rounded-xl text-white text-[9px] font-black tracking-wide hover:scale-[1.02] transition-transform"
                          style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1e3a5f 50%, #2563eb 100%)' }}>
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
                  <h3 className="text-[11px] md:text-sm font-black text-[#3b82f6] mb-2">Investasi Aktif Anda</h3>
                  <div className="space-y-2">
                    {userInvestments.filter(i => i.status === 'active').map(inv => {
                      const progress = Math.round((inv.daysElapsed / inv.duration) * 100)
                      const canClaim = !inv.lastClaimAt || (Date.now() - new Date(inv.lastClaimAt).getTime()) > 10000
                      return (
                        <div key={inv.id} className="rounded-2xl p-3 bg-[var(--zv-panel)] border border-[var(--zv-border)]">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className="block text-[11px] font-black text-[var(--zv-text)]">{inv.product.name}</span>
                              <span className="block text-[8px] text-[var(--zv-muted)]">{formatRupiah(inv.amount)} • {inv.daysElapsed}/{inv.duration} hari</span>
                            </div>
                            <div className="text-right">
                              <span className="block text-[10px] font-black text-[#22c55e]">+{formatRupiah(inv.dailyProfit)}/hari</span>
                              <span className="block text-[8px] text-[var(--zv-muted)]">Diklaim: {formatRupiah(inv.totalClaimed)}</span>
                            </div>
                          </div>
                          {/* Progress Bar */}
                          <div className="w-full h-2 rounded-full bg-[var(--zv-surface)] overflow-hidden mb-2">
                            <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: 'linear-gradient(135deg, #1e3a5f, #2563eb)' }} />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-bold text-[var(--zv-muted)]">{progress}% selesai</span>
                            <button onClick={() => handleClaimProfit(inv.id)} disabled={claimLoadingId === inv.id || !canClaim}
                              className={`h-7 px-3 rounded-lg text-[8px] font-bold transition-all ${canClaim ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-400 shadow-sm shadow-blue-500/20' : 'bg-[var(--zv-surface)] text-[var(--zv-muted)] cursor-not-allowed'}`}>
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
                  <h3 className="text-[11px] md:text-sm font-black text-[#3b82f6] mb-2">Investasi Selesai</h3>
                  <div className="space-y-1.5">
                    {userInvestments.filter(i => i.status === 'completed').map(inv => (
                      <div key={inv.id} className="rounded-2xl p-3 bg-[var(--zv-surface)] border border-[var(--zv-border)] flex items-center justify-between">
                        <div>
                          <span className="block text-[10px] font-bold text-[var(--zv-text)]">{inv.product.name}</span>
                          <span className="block text-[8px] text-[var(--zv-muted)]">Modal: {formatRupiah(inv.amount)}</span>
                        </div>
                        <div className="text-right">
                          <span className="block text-[10px] font-black text-[#22c55e]">+{formatRupiah(inv.totalClaimed)}</span>
                          <span className="block text-[7px] text-[var(--zv-muted)] flex items-center gap-0.5 justify-end"><CheckCircle className="w-2.5 h-2.5" />Selesai</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ====== SINYAL PRO TAB - STOCKITY STYLE ====== */}
          {activeTab === 'sinyal' && (
            <motion.div key="sinyal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
              className="flex flex-col" style={{ minHeight: 'calc(100vh - 140px)' }}>

              {/* Top Bar: Stock selector + Balance */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {stocks.slice(0, 10).map(s => (
                    <button key={s.id} onClick={() => { setSelectedSinyalStock(s); setSinyalAmount(''); setSinyalDirection('NAIK'); setSinyalResult(null); setSinyalCandles([]); setSinyalCurrentPrice(0); setSinyalChartTick(0); sinyalChartSimRef.current = null }}
                      className={`flex-shrink-0 h-7 px-2.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all border ${
                        selectedSinyalStock?.id === s.id
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-[var(--zv-panel)] text-[var(--zv-text)] border-[var(--zv-border)] hover:border-blue-500/30'
                      }`}>
                      {s.changePercent >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                      <span>{s.code}</span>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  <Wallet className="w-3 h-3 text-blue-400" />
                  <span className="text-[9px] font-black text-blue-400">{formatRupiah(user?.balance || 0)}</span>
                </div>
              </div>

              {/* MAIN CHART AREA - Full width, takes most space */}
              {selectedSinyalStock && (
                <div className="flex-1 rounded-xl overflow-hidden border border-[var(--zv-border)] relative" style={{ background: 'var(--zv-panel)', minHeight: '300px' }}>
                  {/* Chart Header Overlay */}
                  <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-2.5 pt-2 pb-1" style={{ background: 'linear-gradient(to bottom, var(--zv-panel) 60%, transparent)' }}>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      <span className="text-[8px] font-black text-blue-400 tracking-widest">LIVE</span>
                      <span className="text-[8px] text-[var(--zv-muted)]">|</span>
                      <span className="text-[10px] font-black text-[var(--zv-text)]">{selectedSinyalStock.code}/IDR</span>
                    </div>
                    {/* Live price */}
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-black tabular-nums" style={{ color: sinyalCurrentPrice >= (sinyalChartSimRef.current?.currentCandle.open || 0) ? '#22c55e' : '#ef5350' }}>
                        {formatRupiah(sinyalCurrentPrice || selectedSinyalStock.price)}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${selectedSinyalStock.changePercent >= 0 ? 'bg-green-500/20 text-[#22c55e]' : 'bg-red-500/20 text-[#ef5350]'}`}>
                        {formatPercent(selectedSinyalStock.changePercent)}
                      </span>
                    </div>
                  </div>

                  {/* OHLC Display */}
                  <div className="absolute top-7 left-0 z-10 px-2.5">
                    {(() => {
                      const allCandlesPeek = [...sinyalCandles]
                      const simPeek = sinyalChartSimRef.current
                      if (simPeek && simPeek.currentCandle.tickCount > 0) {
                        allCandlesPeek.push({ idx: allCandlesPeek.length, open: simPeek.currentCandle.open, high: simPeek.currentCandle.high, low: simPeek.currentCandle.low, close: simPeek.currentCandle.close, volume: simPeek.currentCandle.volume, time: '' })
                      }
                      const lastOHLC = allCandlesPeek[allCandlesPeek.length - 1]
                      if (!lastOHLC) return null
                      const ohlcIsGreen = lastOHLC.close >= lastOHLC.open
                      return (
                        <div className="flex items-center gap-3">
                          <span className="text-[7px] text-[var(--zv-muted)]">O <span className="text-[var(--zv-text)]">{formatRupiah(lastOHLC.open)}</span></span>
                          <span className="text-[7px] text-[var(--zv-muted)]">H <span className="text-blue-400">{formatRupiah(lastOHLC.high)}</span></span>
                          <span className="text-[7px] text-[var(--zv-muted)]">L <span className="text-red-400">{formatRupiah(lastOHLC.low)}</span></span>
                          <span className="text-[7px] text-[var(--zv-muted)]">C <span className={ohlcIsGreen ? 'text-[#22c55e]' : 'text-[#ef5350]'}>{formatRupiah(lastOHLC.close)}</span></span>
                        </div>
                      )
                    })()}
                  </div>

                  {/* ACTIVE TRADE TIMER OVERLAY */}
                  {sinyalActive && sinyalPositions.find(p => p.status === 'active') && (() => {
                    const ap = sinyalPositions.find(p => p.status === 'active')!
                    const progress = Math.max(0, (1 - sinyalTimer / ap.duration) * 100)
                    const isUp = ap.direction === 'NAIK'
                    return (
                      <div className="absolute top-11 left-2.5 z-10">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`h-6 px-2 rounded-md flex items-center gap-1 ${isUp ? 'bg-green-500/20 border border-green-500/40' : 'bg-red-500/20 border border-red-500/40'}`}>
                            {isUp ? <TrendingUp className="w-3 h-3 text-[#22c55e]" /> : <TrendingDown className="w-3 h-3 text-[#ef5350]" />}
                            <span className={`text-[10px] font-black ${isUp ? 'text-[#22c55e]' : 'text-[#ef5350]'}`}>{ap.direction}</span>
                          </div>
                          <span className="text-[18px] font-black text-[var(--zv-text)] tabular-nums">{sinyalTimer}s</span>
                        </div>
                        <div className="w-32 h-1.5 rounded-full bg-[var(--zv-surface)] overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%`, background: isUp ? 'linear-gradient(135deg, #16a34a, #22c55e)' : 'linear-gradient(135deg, #d32f2f, #ef5350)' }} />
                        </div>
                        <span className="text-[8px] text-[var(--zv-muted)] mt-0.5 block">{formatRupiah(ap.amount)} • +{ap.profitPercent.toFixed(0)}% profit</span>
                      </div>
                    )
                  })()}

                  {/* Chart SVG */}
                  <div className="w-full h-full pt-12" key={`sinyal-chart-${sinyalChartTick}`}>
                    {(() => {
                      const allCandles = [...sinyalCandles]
                      const sim = sinyalChartSimRef.current
                      if (sim) {
                        const cc = sim.currentCandle
                        if (cc.tickCount > 0) {
                          allCandles.push({
                            idx: allCandles.length,
                            open: cc.open,
                            high: cc.high,
                            low: cc.low,
                            close: cc.close,
                            volume: cc.volume,
                            time: new Date().getHours().toString().padStart(2, '0') + ':' + new Date().getMinutes().toString().padStart(2, '0'),
                          })
                        }
                      }

                      if (allCandles.length < 2) return <div className="flex items-center justify-center h-full text-[9px] text-gray-600">Memuat grafik...</div>

                      const allPrices = allCandles.flatMap(c => [c.high, c.low])
                      const minP = Math.min(...allPrices)
                      const maxP = Math.max(...allPrices)
                      const rangeP = maxP - minP || 1
                      const paddedMin = minP - rangeP * 0.05
                      const paddedMax = maxP + rangeP * 0.05
                      const paddedRange = paddedMax - paddedMin

                      const totalCandles = allCandles.length
                      const maxVol = Math.max(...allCandles.map(c => c.volume), 1)
                      const padTop = 10
                      const padBot = 18
                      const priceH = 160
                      const volH = 40
                      const totalH = priceH + volH
                      const svgH = padTop + totalH + padBot
                      const priceScaleW = 60
                      const leftPad = 6
                      const candleW = Math.max(5, Math.floor(200 / totalCandles))
                      const gapW = Math.max(2, Math.floor(50 / totalCandles))
                      const chartW = totalCandles * (candleW + gapW) + gapW * 2
                      const svgW = Math.max(chartW + priceScaleW, 300)

                      const ma7 = computeMA(allCandles, 7)
                      const ma25 = computeMA(allCandles, 25)

                      const compactPrice = (p: number) => {
                        if (p >= 1e6) return `${(p / 1e6).toFixed(1)}M`
                        if (p >= 1e3) return `${(p / 1e3).toFixed(1)}K`
                        return p.toFixed(0)
                      }

                      return (
                        <svg className="w-full h-full" viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="none" style={{ fontFamily: 'monospace' }} shapeRendering="crispEdges">
                          <defs>
                            <filter id="sinyal-glow" x="-20%" y="-20%" width="140%" height="140%">
                              <feGaussianBlur stdDeviation="2" result="blur" />
                              <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                              </feMerge>
                            </filter>
                          </defs>
                          {/* Horizontal grid lines */}
                          {[0, 1, 2, 3, 4, 5, 6, 7].map(gi => {
                            const gy = padTop + (gi / 7) * priceH
                            const priceLabel = Math.round(paddedMax - (paddedRange / 7) * gi)
                            return (
                              <g key={`hg-${gi}`}>
                                <line x1={leftPad} y1={gy} x2={chartW} y2={gy} stroke="var(--zv-border)" strokeWidth="0.5" strokeDasharray="3,3" />
                                <text x={chartW + 4} y={gy + 3} fontSize="7" fill="var(--zv-muted)">{compactPrice(priceLabel)}</text>
                              </g>
                            )
                          })}
                          {/* Vertical grid lines */}
                          {allCandles.filter((_, i) => i % Math.max(1, Math.floor(totalCandles / 5)) === 0).map((c, _idx) => {
                            const indices = allCandles.map((_, i) => i).filter(i => i % Math.max(1, Math.floor(totalCandles / 5)) === 0)
                            const i = indices[_idx] || 0
                            const gx = leftPad + gapW + i * (candleW + gapW) + candleW / 2
                            return (
                              <g key={`vg-${i}`}>
                                <line x1={gx} y1={padTop} x2={gx} y2={padTop + totalH} stroke="var(--zv-border)" strokeWidth="0.5" strokeDasharray="3,3" />
                                <text x={gx} y={svgH - 4} fontSize="6" fill="var(--zv-muted)" textAnchor="middle">{c.time}</text>
                              </g>
                            )
                          })}
                          {/* Volume separator */}
                          <line x1={leftPad} y1={padTop + priceH} x2={chartW} y2={padTop + priceH} stroke="var(--zv-border)" strokeWidth="0.5" />
                          {/* Volume bars */}
                          {allCandles.map((c, i) => {
                            const x = leftPad + gapW + i * (candleW + gapW)
                            const isGreen = c.close >= c.open
                            const volBarH = (c.volume / maxVol) * volH
                            const volY = padTop + priceH + volH - volBarH
                            const isLast = i === totalCandles - 1 && sim !== null
                            const volOpacity = isLast ? 0.5 : (0.15 + (i / totalCandles) * 0.2)
                            return <rect key={`vol-${i}`} x={x} y={volY} width={candleW} height={Math.max(volBarH, 1)} fill={isGreen ? '#22c55e' : '#ef5350'} opacity={volOpacity} rx="1" />
                          })}
                          {/* MA7 */}
                          <polyline fill="none" stroke="#f5c542" strokeWidth="1" opacity="0.7" strokeLinejoin="round" strokeLinecap="round"
                            points={ma7.map((v, i) => {
                              if (v === null) return ''
                              const x = leftPad + gapW + i * (candleW + gapW) + candleW / 2
                              const y = padTop + ((paddedMax - v) / paddedRange) * priceH
                              return `${x},${y}`
                            }).filter(Boolean).join(' ')} />
                          {/* MA25 */}
                          <polyline fill="none" stroke="#2196f3" strokeWidth="1" opacity="0.7" strokeLinejoin="round" strokeLinecap="round"
                            points={ma25.map((v, i) => {
                              if (v === null) return ''
                              const x = leftPad + gapW + i * (candleW + gapW) + candleW / 2
                              const y = padTop + ((paddedMax - v) / paddedRange) * priceH
                              return `${x},${y}`
                            }).filter(Boolean).join(' ')} />
                          {/* Candlesticks */}
                          {allCandles.map((c, i) => {
                            const x = leftPad + gapW + i * (candleW + gapW)
                            const yH = padTop + ((paddedMax - c.high) / paddedRange) * priceH
                            const yL = padTop + ((paddedMax - c.low) / paddedRange) * priceH
                            const yO = padTop + ((paddedMax - c.open) / paddedRange) * priceH
                            const yC = padTop + ((paddedMax - c.close) / paddedRange) * priceH
                            const isGreen = c.close >= c.open
                            const bodyTop = Math.min(yO, yC)
                            const bodyH = Math.max(Math.abs(yO - yC), 2)
                            const isLast = i === totalCandles - 1 && sim !== null
                            return (
                              <g key={`candle-${i}`} opacity={isLast ? 1 : 0.9}>
                                <line x1={x + candleW / 2} y1={yH} x2={x + candleW / 2} y2={yL} stroke={isGreen ? '#22c55e' : '#ef5350'} strokeWidth={isLast ? "1.2" : "0.8"} />
                                <rect x={x} y={bodyTop} width={candleW} height={bodyH}
                                  fill={isGreen ? '#22c55e' : 'var(--zv-panel)'}
                                  stroke={isGreen ? '#22c55e' : '#ef5350'}
                                  strokeWidth="0.8" rx="0.5"
                                />
                                {isLast && (
                                  <g filter="url(#sinyal-glow)">
                                    <rect x={x - 1} y={bodyTop - 1} width={candleW + 2} height={bodyH + 2}
                                      fill="none" stroke={isGreen ? '#22c55e' : '#ef5350'} strokeWidth="0.5" rx="1"
                                      opacity="0.5">
                                      <animate attributeName="opacity" values="0.5;0.1;0.5" dur="1s" repeatCount="indefinite" />
                                    </rect>
                                  </g>
                                )}
                              </g>
                            )
                          })}
                          {/* Current price line */}
                          {allCandles.length > 0 && (() => {
                            const lastC = allCandles[allCandles.length - 1]
                            const isGreen = lastC.close >= lastC.open
                            const yLast = padTop + ((paddedMax - lastC.close) / paddedRange) * priceH
                            return (
                              <>
                                <line x1={leftPad} y1={yLast} x2={chartW} y2={yLast} stroke={isGreen ? '#22c55e' : '#ef5350'} strokeWidth="0.5" strokeDasharray="3,2" opacity="0.7" />
                                <rect x={chartW + 1} y={yLast - 8} width={priceScaleW - 3} height="16" rx="3" fill={isGreen ? '#22c55e' : '#ef5350'} />
                                <text x={chartW + priceScaleW / 2} y={yLast + 4} fontSize="7" fill="white" textAnchor="middle" fontWeight="bold">{compactPrice(lastC.close)}</text>
                              </>
                            )
                          })()}
                        </svg>
                      )
                    })()}
                  </div>

                  {/* Result overlay on chart */}
                  {sinyalResult && !sinyalActive && (
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                      className="absolute inset-0 flex items-center justify-center z-20" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                      <div className={`text-center p-5 rounded-2xl border ${sinyalResult.won ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10'}`}>
                        <span className="text-[36px] block mb-1">{sinyalResult.won ? '🎯' : '❌'}</span>
                        <h3 className={`text-[18px] font-black ${sinyalResult.won ? 'text-[#22c55e]' : 'text-[#ef5350]'}`}>
                          {sinyalResult.won ? 'BENAR!' : 'SALAH'}
                        </h3>
                        <span className={`text-[16px] font-bold ${sinyalResult.won ? 'text-[#22c55e]' : 'text-[#ef5350]'}`}>
                          {sinyalResult.won ? '+' : '-'}{formatRupiah(Math.abs(sinyalResult.profit))}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* BOTTOM CONTROL PANEL - Stockity Style */}
              <div className="mt-2 space-y-2">
                {/* Duration + Amount Row */}
                <div className="flex gap-2">
                  {/* Duration Selector */}
                  <div className="flex-1">
                    <label className="block text-[8px] font-bold text-[var(--zv-muted)] mb-1 uppercase tracking-wider">Durasi</label>
                    <div className="flex gap-1">
                      {[10, 20, 30, 60].map(dur => (
                        <button key={dur} onClick={() => setSinyalDuration(dur)} disabled={sinyalActive}
                          className={`flex-1 h-8 rounded-lg text-[10px] font-bold transition-all ${sinyalDuration === dur ? 'bg-blue-600/30 text-blue-400 border border-blue-500/50' : 'bg-[var(--zv-surface)] border border-[var(--zv-border)] text-[var(--zv-muted)] hover:text-[var(--zv-text)]'} ${sinyalActive ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          {dur}s
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Amount Input + Quick Amounts */}
                <div>
                  <div className="flex gap-1.5 mb-1.5">
                    <div className="flex-1 relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-[var(--zv-muted)]">Rp</span>
                      <input type="number" value={sinyalAmount} onChange={(e) => setSinyalAmount(e.target.value)} placeholder="100.000" disabled={sinyalActive}
                        className={`w-full h-9 rounded-lg bg-[var(--zv-surface)] border border-[var(--zv-border)] pl-7 pr-2 text-[12px] font-semibold text-[var(--zv-text)] outline-none focus:border-blue-500 transition-all placeholder:text-[var(--zv-muted)] ${sinyalActive ? 'opacity-50' : ''}`} />
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setSinyalAmount(String(Math.min((parseInt(sinyalAmount) || 100000) * 2, (user?.balance || 0))))} disabled={sinyalActive}
                        className={`h-9 w-9 rounded-lg bg-[var(--zv-surface)] border border-[var(--zv-border)] flex items-center justify-center text-[var(--zv-muted)] hover:text-blue-400 hover:border-blue-500/30 transition-all ${sinyalActive ? 'opacity-50' : ''}`}>
                        <Plus className="w-3 h-3" />
                      </button>
                      <button onClick={() => setSinyalAmount(String(Math.max(Math.floor((parseInt(sinyalAmount) || 200000) / 2), 100000)))} disabled={sinyalActive}
                        className={`h-9 w-9 rounded-lg bg-[var(--zv-surface)] border border-[var(--zv-border)] flex items-center justify-center text-[var(--zv-muted)] hover:text-blue-400 hover:border-blue-500/30 transition-all ${sinyalActive ? 'opacity-50' : ''}`}>
                        <Minus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {['100000', '200000', '500000', '1000000', '5000000'].map(amt => (
                      <button key={amt} onClick={() => setSinyalAmount(amt)} disabled={sinyalActive}
                        className={`flex-1 h-7 rounded-md bg-[var(--zv-surface)] border border-[var(--zv-border)] text-[8px] font-bold text-[var(--zv-muted)] hover:bg-blue-600/20 hover:border-blue-500/30 hover:text-blue-400 transition-all ${sinyalAmount === amt ? 'bg-blue-600/20 border-blue-500/30 text-blue-400' : ''} ${sinyalActive ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {parseInt(amt) >= 1000000 ? `${parseInt(amt)/1000000}M` : `${parseInt(amt)/1000}K`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Profit preview for both directions */}
                {sinyalAmount && parseInt(sinyalAmount) >= 100000 && (
                  <div className="flex gap-2">
                    <div className="flex-1 rounded-lg p-1.5 bg-green-500/10 border border-green-500/20 text-center">
                      <span className="text-[7px] text-green-400/70 font-bold block">NAIK PROFIT</span>
                      <span className="text-[11px] font-black text-[#22c55e]">+{formatRupiah(Math.round(parseInt(sinyalAmount) * calcSinyalProfit(parseInt(sinyalAmount), sinyalDuration, 'NAIK') / 100))}</span>
                    </div>
                    <div className="flex-1 rounded-lg p-1.5 bg-red-500/10 border border-red-500/20 text-center">
                      <span className="text-[7px] text-red-400/70 font-bold block">TURUN PROFIT</span>
                      <span className="text-[11px] font-black text-[#ef5350]">+{formatRupiah(Math.round(parseInt(sinyalAmount) * calcSinyalProfit(parseInt(sinyalAmount), sinyalDuration, 'TURUN') / 100))}</span>
                    </div>
                  </div>
                )}

                {/* NAIK / TURUN Buttons - BIG Stockity Style */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setSinyalDirection('NAIK')
                      if (!sinyalActive && sinyalAmount && parseInt(sinyalAmount) >= 100000 && parseInt(sinyalAmount) <= (user?.balance || 0)) {
                        openSinyalPosition('NAIK')
                      }
                    }}
                    disabled={sinyalActive}
                    className={`h-16 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all relative overflow-hidden ${
                      sinyalActive
                        ? 'bg-[var(--zv-surface)] text-gray-600 border border-[var(--zv-border)] opacity-50 cursor-not-allowed'
                        : 'bg-gradient-to-br from-[#22c55e] to-[#15803d] text-white shadow-lg shadow-green-600/30 hover:shadow-green-500/50 active:scale-[0.97]'
                    }`}>
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-5 h-5" />
                      <span className="text-[16px] font-black">NAIK</span>
                    </div>
                    <span className="text-[11px] font-bold opacity-90">+{calcSinyalProfit(parseInt(sinyalAmount) || 100000, sinyalDuration, 'NAIK').toFixed(0)}%</span>
                    {/* Shine effect */}
                    {!sinyalActive && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shine_3s_infinite]" />}
                  </button>
                  <button
                    onClick={() => {
                      setSinyalDirection('TURUN')
                      if (!sinyalActive && sinyalAmount && parseInt(sinyalAmount) >= 100000 && parseInt(sinyalAmount) <= (user?.balance || 0)) {
                        openSinyalPosition('TURUN')
                      }
                    }}
                    disabled={sinyalActive}
                    className={`h-16 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all relative overflow-hidden ${
                      sinyalActive
                        ? 'bg-[var(--zv-surface)] text-gray-600 border border-[var(--zv-border)] opacity-50 cursor-not-allowed'
                        : 'bg-gradient-to-br from-[#ef5350] to-[#b91c1c] text-white shadow-lg shadow-red-600/30 hover:shadow-red-500/50 active:scale-[0.97]'
                    }`}>
                    <div className="flex items-center gap-1.5">
                      <TrendingDown className="w-5 h-5" />
                      <span className="text-[16px] font-black">TURUN</span>
                    </div>
                    <span className="text-[11px] font-bold opacity-90">+{calcSinyalProfit(parseInt(sinyalAmount) || 100000, sinyalDuration, 'TURUN').toFixed(0)}%</span>
                    {/* Shine effect */}
                    {!sinyalActive && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shine_3s_infinite_1s]" />}
                  </button>
                </div>

                {/* Recent Trade History - Compact */}
                {sinyalPositions.filter(p => p.status !== 'active').length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[8px] font-black text-[var(--zv-muted)] uppercase tracking-wider">Riwayat</span>
                      <span className="text-[8px] text-[var(--zv-muted)]">{sinyalPositions.filter(p => p.status === 'won').length}W / {sinyalPositions.filter(p => p.status === 'lost').length}L</span>
                    </div>
                    <div className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                      {sinyalPositions.filter(p => p.status !== 'active').slice(-10).reverse().map(pos => (
                        <div key={pos.id} className={`flex-shrink-0 w-14 h-14 rounded-lg flex flex-col items-center justify-center border ${
                          pos.status === 'won' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
                        }`}>
                          {pos.status === 'won' ? <CheckCircle className="w-3.5 h-3.5 text-[#22c55e]" /> : <X className="w-3.5 h-3.5 text-[#ef5350]" />}
                          <span className={`text-[8px] font-black ${pos.status === 'won' ? 'text-[#22c55e]' : 'text-[#ef5350]'}`}>
                            {pos.status === 'won' ? `+${formatRupiah(Math.round(pos.amount * pos.profitPercent / 100))}` : `-${formatRupiah(pos.amount)}`}
                          </span>
                          <span className="text-[6px] text-[var(--zv-muted)]">{pos.stockCode} {pos.direction === 'NAIK' ? '↑' : '↓'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ====== FINANCE TAB ====== */}
          {activeTab === 'finance' && (
            <motion.div key="finance" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <div className="max-w-lg mx-auto">
              {/* Finance Tabs */}
              <div className="flex gap-2 mb-4">
                <button onClick={() => setFinanceTab('deposit')} className={`flex-1 h-10 rounded-2xl text-[11px] md:text-xs font-bold transition-all ${financeTab === 'deposit' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/20' : 'bg-[var(--zv-panel)] border border-[var(--zv-border)] text-[var(--zv-muted)] hover:border-[#3b82f6]/30 hover:text-[#3b82f6]'}`}>
                  <Plus className="w-3.5 h-3.5 inline mr-1" />Deposit
                </button>
                <button onClick={() => setFinanceTab('withdraw')} className={`flex-1 h-10 rounded-2xl text-[11px] md:text-xs font-bold transition-all ${financeTab === 'withdraw' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/20' : 'bg-[var(--zv-panel)] border border-[var(--zv-border)] text-[var(--zv-muted)] hover:border-[#3b82f6]/30 hover:text-[#3b82f6]'}`}>
                  <Minus className="w-3.5 h-3.5 inline mr-1" />Withdraw
                </button>
              </div>

              {financeTab === 'deposit' ? (
                <>
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

                  {/* Payment Category Tabs */}
                  <div className="flex gap-1.5 mb-3">
                    {[
                      { key: 'bank' as const, label: 'Transfer Bank', icon: <Building2 className="w-3.5 h-3.5" /> },
                      { key: 'ewallet' as const, label: 'E-Wallet', icon: <Wallet className="w-3.5 h-3.5" /> },
                      { key: 'qris' as const, label: 'QRIS', icon: <CreditCard className="w-3.5 h-3.5" /> },
                    ].map(cat => (
                      <button key={cat.key} onClick={() => setDepositCategory(cat.key)}
                        className={`flex-1 h-9 rounded-xl text-[9px] md:text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${depositCategory === cat.key ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm shadow-blue-500/20' : 'bg-[var(--zv-panel)] border border-[var(--zv-border)] text-[var(--zv-muted)] hover:border-[#3b82f6]/30 hover:text-[#3b82f6]'}`}>
                        {cat.icon}{cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Deposit Form Card */}
                  <div className="rounded-2xl p-4 bg-[var(--zv-panel)] border border-[var(--zv-border)] mb-4">

                    {/* Bank Method Grid */}
                    {depositCategory === 'bank' && (
                      <div className="mb-3">
                        <span className="block text-[9px] font-black text-[var(--zv-muted)] uppercase tracking-widest mb-2">Pilih Bank</span>
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
                              className={`rounded-xl p-2 border-2 transition-all min-h-[52px] flex flex-col items-center justify-center gap-1 ${depositBankMethod === bank.code ? 'border-[#3b82f6] bg-[var(--zv-surface)]' : 'border-[var(--zv-border)] bg-[var(--zv-surface)]'}`}>
                              <div className="w-7 h-7 rounded-lg grid place-items-center text-white text-[8px] font-black" style={{ backgroundColor: bank.color }}>
                                {bank.code.slice(0, 2)}
                              </div>
                              <span className={`text-[7px] font-bold text-center leading-tight ${depositBankMethod === bank.code ? 'text-[#3b82f6]' : 'text-[var(--zv-muted)]'}`}>{bank.code}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* E-Wallet Method Grid */}
                    {depositCategory === 'ewallet' && (
                      <div className="mb-3">
                        <span className="block text-[9px] font-black text-[var(--zv-muted)] uppercase tracking-widest mb-2">Pilih E-Wallet</span>
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
                              className={`rounded-xl p-2 border-2 transition-all min-h-[52px] flex flex-col items-center justify-center gap-1 ${depositEwalletMethod === ew.code ? 'border-[#3b82f6] bg-[var(--zv-surface)]' : 'border-[var(--zv-border)] bg-[var(--zv-surface)]'}`}>
                              <div className="w-7 h-7 rounded-lg grid place-items-center text-white text-[8px] font-black" style={{ backgroundColor: ew.color }}>
                                {ew.name.slice(0, 2)}
                              </div>
                              <span className={`text-[7px] font-bold text-center leading-tight ${depositEwalletMethod === ew.code ? 'text-[#3b82f6]' : 'text-[var(--zv-muted)]'}`}>{ew.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* QRIS Section */}
                    {depositCategory === 'qris' && (
                      <div className="mb-3 flex flex-col items-center py-4">
                        <div className="w-40 h-40 rounded-2xl bg-[var(--zv-panel)] border-2 border-[var(--zv-border)] p-3 mb-3">
                          <svg viewBox="0 0 200 200" className="w-full h-full">
                            <rect width="200" height="200" fill="white" rx="8" />
                            {/* QR pattern simulation */}
                            <rect x="20" y="20" width="50" height="50" fill="#0c1a2e" rx="4" />
                            <rect x="28" y="28" width="34" height="34" fill="white" rx="2" />
                            <rect x="36" y="36" width="18" height="18" fill="#0c1a2e" rx="1" />
                            <rect x="130" y="20" width="50" height="50" fill="#0c1a2e" rx="4" />
                            <rect x="138" y="28" width="34" height="34" fill="white" rx="2" />
                            <rect x="146" y="36" width="18" height="18" fill="#0c1a2e" rx="1" />
                            <rect x="20" y="130" width="50" height="50" fill="#0c1a2e" rx="4" />
                            <rect x="28" y="138" width="34" height="34" fill="white" rx="2" />
                            <rect x="36" y="146" width="18" height="18" fill="#0c1a2e" rx="1" />
                            {/* Middle pattern */}
                            <rect x="80" y="20" width="8" height="8" fill="#0c1a2e" />
                            <rect x="96" y="20" width="8" height="8" fill="#0c1a2e" />
                            <rect x="112" y="20" width="8" height="8" fill="#0c1a2e" />
                            <rect x="80" y="36" width="8" height="8" fill="#0c1a2e" />
                            <rect x="96" y="44" width="8" height="8" fill="#0c1a2e" />
                            <rect x="112" y="36" width="8" height="8" fill="#0c1a2e" />
                            <rect x="80" y="60" width="8" height="8" fill="#0c1a2e" />
                            <rect x="96" y="60" width="8" height="8" fill="#0c1a2e" />
                            <rect x="112" y="60" width="8" height="8" fill="#0c1a2e" />
                            {/* Bottom middle */}
                            <rect x="20" y="80" width="8" height="8" fill="#0c1a2e" />
                            <rect x="36" y="80" width="8" height="8" fill="#0c1a2e" />
                            <rect x="52" y="80" width="8" height="8" fill="#0c1a2e" />
                            <rect x="20" y="96" width="8" height="8" fill="#0c1a2e" />
                            <rect x="36" y="104" width="8" height="8" fill="#0c1a2e" />
                            <rect x="52" y="96" width="8" height="8" fill="#0c1a2e" />
                            <rect x="20" y="112" width="8" height="8" fill="#0c1a2e" />
                            <rect x="36" y="112" width="8" height="8" fill="#0c1a2e" />
                            <rect x="52" y="112" width="8" height="8" fill="#0c1a2e" />
                            {/* Right middle */}
                            <rect x="80" y="80" width="8" height="8" fill="#0c1a2e" />
                            <rect x="96" y="96" width="8" height="8" fill="#0c1a2e" />
                            <rect x="112" y="80" width="8" height="8" fill="#0c1a2e" />
                            <rect x="130" y="80" width="8" height="8" fill="#0c1a2e" />
                            <rect x="146" y="80" width="8" height="8" fill="#0c1a2e" />
                            <rect x="162" y="80" width="8" height="8" fill="#0c1a2e" />
                            <rect x="80" y="96" width="8" height="8" fill="#0c1a2e" />
                            <rect x="112" y="96" width="8" height="8" fill="#0c1a2e" />
                            <rect x="130" y="96" width="8" height="8" fill="#0c1a2e" />
                            <rect x="162" y="96" width="8" height="8" fill="#0c1a2e" />
                            <rect x="80" y="112" width="8" height="8" fill="#0c1a2e" />
                            <rect x="96" y="112" width="8" height="8" fill="#0c1a2e" />
                            <rect x="130" y="112" width="8" height="8" fill="#0c1a2e" />
                            <rect x="146" y="112" width="8" height="8" fill="#0c1a2e" />
                            <rect x="162" y="112" width="8" height="8" fill="#0c1a2e" />
                            {/* Bottom section */}
                            <rect x="80" y="130" width="8" height="8" fill="#0c1a2e" />
                            <rect x="96" y="130" width="8" height="8" fill="#0c1a2e" />
                            <rect x="112" y="130" width="8" height="8" fill="#0c1a2e" />
                            <rect x="80" y="146" width="8" height="8" fill="#0c1a2e" />
                            <rect x="112" y="146" width="8" height="8" fill="#0c1a2e" />
                            <rect x="130" y="130" width="8" height="8" fill="#0c1a2e" />
                            <rect x="146" y="146" width="8" height="8" fill="#0c1a2e" />
                            <rect x="162" y="130" width="8" height="8" fill="#0c1a2e" />
                            <rect x="130" y="162" width="8" height="8" fill="#0c1a2e" />
                            <rect x="146" y="162" width="8" height="8" fill="#0c1a2e" />
                            <rect x="162" y="162" width="8" height="8" fill="#0c1a2e" />
                            <rect x="80" y="162" width="8" height="8" fill="#0c1a2e" />
                            <rect x="96" y="162" width="8" height="8" fill="#0c1a2e" />
                            <rect x="20" y="162" width="8" height="8" fill="#0c1a2e" />
                            <rect x="36" y="162" width="8" height="8" fill="#0c1a2e" />
                            <rect x="52" y="162" width="8" height="8" fill="#0c1a2e" />
                            {/* QRIS label */}
                            <text x="100" y="195" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#0c1a2e">QRIS</text>
                          </svg>
                        </div>
                        <span className="text-[10px] font-bold text-[#3b82f6]">Scan QRIS untuk deposit</span>
                        <span className="text-[8px] text-[var(--zv-muted)] mt-0.5">Gunakan aplikasi e-wallet atau mobile banking</span>
                      </div>
                    )}

                    {/* Amount Input */}
                    <label className="block mb-1.5 text-[9px] font-black text-[var(--zv-muted)] uppercase tracking-widest">Jumlah Deposit</label>
                    <input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="Minimal Rp 10.000"
                      className="w-full h-11 rounded-2xl bg-[var(--zv-surface)] border border-[var(--zv-border)] px-4 text-[13px] font-semibold text-[var(--zv-text)] outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30 transition-all mb-2" />
                    <div className="grid grid-cols-4 gap-1.5 mb-4">
                      {['50000', '100000', '200000', '500000', '1000000', '2000000', '5000000'].map(a => (
                        <button key={a} onClick={() => setDepositAmount(a)} className="h-8 rounded-lg bg-[var(--zv-surface)] border border-[var(--zv-border)] text-[8px] md:text-[9px] font-bold text-[#3b82f6] hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-500 hover:text-white hover:border-transparent transition-all">
                          {parseFloat(a) >= 1e6 ? `${(parseFloat(a) / 1e6).toFixed(0)}jt` : `${(parseFloat(a) / 1e3).toFixed(0)}rb`}
                        </button>
                      ))}
                    </div>

                    {/* Selected Method Info */}
                    <div className="rounded-xl p-3 bg-[var(--zv-surface)] border border-[var(--zv-border)] mb-4">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-[#3b82f6]" />
                        <div>
                          <span className="block text-[9px] font-bold text-[var(--zv-text)]">
                            {depositCategory === 'bank' ? `Transfer ${depositBankMethod}` : depositCategory === 'ewallet' ? depositEwalletMethod : 'QRIS'}
                          </span>
                          <span className="block text-[7px] text-[var(--zv-muted)]">Metode pembayaran dipilih</span>
                        </div>
                      </div>
                    </div>

                    {/* Deposit Button */}
                    <button onClick={handleDeposit} disabled={depositLoading}
                      className="w-full h-12 rounded-2xl text-white text-[11px] font-black tracking-wider uppercase flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-70"
                      style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1e3a5f 50%, #2563eb 100%)' }}>
                      {depositLoading ? (
                        <div className="w-5 h-5 rounded-full border-[3px] border-white/30 border-t-white animate-spin" />
                      ) : (
                        <><Plus className="w-4 h-4" />Deposit Sekarang</>
                      )}
                    </button>
                  </div>

                  {/* Deposit History */}
                  <h3 className="text-[11px] font-black text-[#3b82f6] mb-2">Riwayat Deposit</h3>
                  <div className="space-y-1.5">
                    {deposits.map(d => (
                      <div key={d.id} className="rounded-2xl p-2.5 bg-[var(--zv-panel)] border border-[var(--zv-border)] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-[var(--zv-surface)] grid place-items-center"><Plus className="w-4 h-4 text-[#3b82f6]" /></div>
                          <div>
                            <span className="block text-[9px] font-bold text-[var(--zv-text)]">{d.bankName || (d.method === 'bank_transfer' ? 'Transfer Bank' : 'E-Wallet')}</span>
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

                  {/* Withdraw Form Card */}
                  <div className="rounded-2xl p-4 bg-[var(--zv-panel)] border border-[var(--zv-border)] mb-4">

                    {/* Bank Method Grid */}
                    {withdrawCategory === 'bank' && (
                      <div className="mb-3">
                        <span className="block text-[9px] font-black text-[var(--zv-muted)] uppercase tracking-widest mb-2">Pilih Bank Tujuan</span>
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
                              className={`rounded-xl p-2 border-2 transition-all min-h-[52px] flex flex-col items-center justify-center gap-1 ${withdrawBankMethod === bank.code ? 'border-[#3b82f6] bg-[var(--zv-surface)]' : 'border-[var(--zv-border)] bg-[var(--zv-surface)]'}`}>
                              <div className="w-7 h-7 rounded-lg grid place-items-center text-white text-[8px] font-black" style={{ backgroundColor: bank.color }}>
                                {bank.code.slice(0, 2)}
                              </div>
                              <span className={`text-[7px] font-bold text-center leading-tight ${withdrawBankMethod === bank.code ? 'text-[#3b82f6]' : 'text-[var(--zv-muted)]'}`}>{bank.code}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* E-Wallet Method Grid */}
                    {withdrawCategory === 'ewallet' && (
                      <div className="mb-3">
                        <span className="block text-[9px] font-black text-[var(--zv-muted)] uppercase tracking-widest mb-2">Pilih E-Wallet</span>
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
                              className={`rounded-xl p-2 border-2 transition-all min-h-[52px] flex flex-col items-center justify-center gap-1 ${withdrawEwalletMethod === ew.code ? 'border-[#3b82f6] bg-[var(--zv-surface)]' : 'border-[var(--zv-border)] bg-[var(--zv-surface)]'}`}>
                              <div className="w-7 h-7 rounded-lg grid place-items-center text-white text-[8px] font-black" style={{ backgroundColor: ew.color }}>
                                {ew.name.slice(0, 2)}
                              </div>
                              <span className={`text-[7px] font-bold text-center leading-tight ${withdrawEwalletMethod === ew.code ? 'text-[#3b82f6]' : 'text-[var(--zv-muted)]'}`}>{ew.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Crypto Method Grid */}
                    {withdrawCategory === 'crypto' && (
                      <div className="mb-3">
                        <span className="block text-[9px] font-black text-[var(--zv-muted)] uppercase tracking-widest mb-2">Pilih Crypto</span>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { code: 'USDT_TRC20', name: 'USDT', network: 'TRC20', color: '#26A17B' },
                            { code: 'USDT_ERC20', name: 'USDT', network: 'ERC20', color: '#627EEA' },
                            { code: 'BTC', name: 'Bitcoin', network: 'BTC', color: '#F7931A' },
                            { code: 'ETH', name: 'Ethereum', network: 'ERC20', color: '#627EEA' },
                            { code: 'BNB', name: 'BNB', network: 'BEP20', color: '#F3BA2F' },
                          ].map(cr => (
                            <button key={cr.code} onClick={() => setWithdrawCryptoMethod(cr.code)}
                              className={`rounded-xl p-2 border-2 transition-all min-h-[56px] flex flex-col items-center justify-center gap-1 ${withdrawCryptoMethod === cr.code ? 'border-[#3b82f6] bg-[var(--zv-surface)]' : 'border-[var(--zv-border)] bg-[var(--zv-surface)]'}`}>
                              <div className="w-7 h-7 rounded-full grid place-items-center text-white text-[8px] font-black" style={{ backgroundColor: cr.color }}>
                                {cr.name.slice(0, 2)}
                              </div>
                              <span className={`text-[8px] font-black text-center leading-tight ${withdrawCryptoMethod === cr.code ? 'text-[#3b82f6]' : 'text-[var(--zv-text)]'}`}>{cr.name}</span>
                              <span className="text-[6px] font-bold text-[var(--zv-muted)]">{cr.network}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Amount Input */}
                    <label className="block mb-1.5 text-[9px] font-black text-[var(--zv-muted)] uppercase tracking-widest">Jumlah Withdraw</label>
                    <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="Minimal Rp 10.000"
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
              <h2 className="text-[14px] md:text-lg font-black text-[#3b82f6] mb-3">Riwayat Transaksi</h2>

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
                        { target: 100, bonus: 400000, medal: '💎', tier: 'Berlian', color: 'from-cyan-500 to-blue-400', barColor: 'bg-cyan-400', borderColor: 'border-cyan-400/40' },
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
                                <span className="h-7 px-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white text-[8px] font-black flex items-center gap-1 shadow-sm shadow-blue-500/20">
                                  <CheckCircle className="w-3 h-3" />Diklaim
                                </span>
                              ) : reached ? (
                                <button
                                  onClick={() => {
                                    setClaimedMissions(prev => new Set(prev).add(m.target))
                                    toast({ title: 'Bonus Diklaim!', description: `+${formatRupiah(m.bonus)} bonus undangan ${m.tier}` })
                                  }}
                                  className="h-7 px-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-[8px] font-black flex items-center gap-1 transition-all shadow-sm shadow-blue-500/20"
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

              {/* ====== MISI PROMOSI VIDEO ====== */}
              <div className="rounded-2xl bg-[var(--zv-panel)] border border-[var(--zv-border)] mb-4 overflow-hidden">
                <div className="p-3 md:p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 to-red-500 grid place-items-center">
                      <Video className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-[12px] md:text-[14px] font-black text-[#3b82f6]">Misi Promosi Video</h3>
                      <span className="text-[7px] font-bold text-[#ff4081] tracking-widest uppercase">Review & Dapatkan Bonus!</span>
                    </div>
                  </div>

                  {/* How it works */}
                  <div className="rounded-xl p-3 bg-[var(--zv-surface)] border border-[var(--zv-border)] mb-3">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-[#ff4081] flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-[9px] font-black text-[var(--zv-text)] mb-1">Cara Kerja:</span>
                        <div className="space-y-0.5">
                          <span className="block text-[7px] font-semibold text-[var(--zv-muted)]">1️⃣ Upload video review tentang ZEVORIX ke media sosial</span>
                          <span className="block text-[7px] font-semibold text-[var(--zv-muted)]">2️⃣ Kirim link video yang sudah di-upload</span>
                          <span className="block text-[7px] font-semibold text-[var(--zv-muted)]">3️⃣ Bonus dihitung dari views & likes video Anda!</span>
                          <span className="block text-[7px] font-semibold text-[var(--zv-muted)]">4️⃣ Wajib tag @GlobalSaham di video</span>
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
                      <div key={i} className="rounded-xl p-2 bg-[var(--zv-surface)] border border-[var(--zv-border)] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px]">{t.icon}</span>
                          <span className="text-[9px] font-black text-[#3b82f6]">{t.views} Views</span>
                        </div>
                        <span className="text-[10px] font-black text-[#f59e0b]">= {t.bonus}</span>
                      </div>
                    ))}
                  </div>

                  {/* Anti-injection notice */}
                  <div className="rounded-xl p-2.5 bg-[var(--zv-surface)] border border-[var(--zv-border)] mb-3">
                    <div className="flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-[#f59e0b] flex-shrink-0 mt-0.5" />
                      <span className="text-[7px] font-bold text-[#f59e0b] leading-relaxed">⚠️ Perhatian: Views & Likes harus REAL/ORGANIK. Dilarang suntikan views/bot. Jika terdeteksi, bonus akan dibatalkan.</span>
                    </div>
                  </div>

                  {/* Platform selector */}
                  <div className="mb-3">
                    <span className="block text-[8px] font-black text-[var(--zv-muted)] uppercase tracking-widest mb-1.5">Pilih Platform</span>
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {[
                        { key: 'tiktok' as const, label: 'TikTok', color: 'bg-black', icon: '🎵' },
                        { key: 'instagram' as const, label: 'Instagram', color: 'bg-gradient-to-br from-purple-500 to-pink-500', icon: '📸' },
                        { key: 'youtube' as const, label: 'YouTube', color: 'bg-red-600', icon: '▶️' },
                        { key: 'facebook' as const, label: 'Facebook', color: 'bg-blue-600', icon: '📘' },
                        { key: 'twitter' as const, label: 'X/Twitter', color: 'bg-gray-800', icon: '🐦' },
                      ].map(p => (
                        <button key={p.key} onClick={() => setPromoPlatform(p.key)}
                          className={`flex-shrink-0 h-9 px-3 rounded-xl flex items-center gap-1.5 text-[9px] font-bold transition-all ${promoPlatform === p.key ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm scale-105' : 'bg-[var(--zv-surface)] border border-[var(--zv-border)] text-[var(--zv-muted)] hover:border-[#3b82f6]/30'}`}>
                          <span className="text-[12px]">{p.icon}</span>
                          <span>{p.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Video link input */}
                  <div className="mb-3">
                    <span className="block text-[8px] font-black text-[var(--zv-muted)] uppercase tracking-widest mb-1.5">Link Video</span>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--zv-muted)]" />
                        <input
                          type="url"
                          value={promoVideoLink}
                          onChange={(e) => setPromoVideoLink(e.target.value)}
                          placeholder={`Masukkan link ${promoPlatform === 'tiktok' ? 'TikTok' : promoPlatform === 'instagram' ? 'Instagram' : promoPlatform === 'youtube' ? 'YouTube' : promoPlatform === 'facebook' ? 'Facebook' : 'X/Twitter'}`}
                          className="w-full h-10 rounded-xl bg-[var(--zv-surface)] border border-[var(--zv-border)] pl-9 pr-3 text-[11px] font-semibold text-[var(--zv-text)] outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30 transition-all placeholder:text-[var(--zv-muted)]"
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
                        className="h-10 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white text-[9px] font-bold flex items-center gap-1.5 hover:from-blue-500 hover:to-blue-400 transition-all disabled:opacity-60 flex-shrink-0 shadow-md shadow-blue-500/20"
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
                      <span className="block text-[8px] font-black text-[var(--zv-muted)] uppercase tracking-widest mb-1.5">Video Anda ({promoVideos.length})</span>
                      <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar">
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
                            <div key={v.id} className="rounded-xl p-2.5 bg-[var(--zv-surface)] border border-[var(--zv-border)]">
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                  <div className={`w-7 h-7 rounded-lg ${pi.color} grid place-items-center text-[12px]`}>
                                    {pi.icon}
                                  </div>
                                  <div>
                                    <span className="block text-[9px] font-bold text-[var(--zv-text)]">{pi.label}</span>
                                    <span className="block text-[6px] text-[var(--zv-muted)] truncate max-w-[140px]">{v.link}</span>
                                  </div>
                                </div>
                                <span className={`h-5 px-2 rounded-full text-[7px] font-black flex items-center gap-1 ${v.status === 'verified' ? 'bg-[var(--zv-border)] text-[#3b82f6]' : v.status === 'pending' ? 'bg-[var(--zv-border)] text-[#f59e0b]' : 'bg-[var(--zv-border)] text-red-700'}`}>
                                  {v.status === 'verified' ? <><CheckCircle className="w-2.5 h-2.5" />Terverifikasi</> : v.status === 'pending' ? <><Clock className="w-2.5 h-2.5" />Diperiksa</> : <><AlertCircle className="w-2.5 h-2.5" />Ditolak</>}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                  <EyeIcon className="w-3 h-3 text-[#3b82f6]" />
                                  <span className="text-[8px] font-black text-[var(--zv-text)]">{v.views.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <ThumbsUp className="w-3 h-3 text-[#ff4081]" />
                                  <span className="text-[8px] font-black text-[var(--zv-text)]">{v.likes.toLocaleString()}</span>
                                </div>
                                <div className="ml-auto flex items-center gap-1">
                                  <DollarSign className="w-3 h-3 text-[#f59e0b]" />
                                  <span className="text-[9px] font-black text-[#f59e0b]">{formatRupiah(v.bonus)}</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Total video bonus */}
                      <div className="mt-2 rounded-xl p-2.5 bg-[var(--zv-surface)] border border-[var(--zv-border)] flex items-center justify-between">
                        <span className="text-[8px] font-bold text-[var(--zv-muted)]">Total Bonus Video</span>
                        <span className="text-[12px] font-black text-[#f59e0b]">{formatRupiah(promoVideos.reduce((s, v) => s + v.bonus, 0))}</span>
                      </div>
                    </div>
                  )}
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

          {/* ====== BONUS TAB ====== */}
          {activeTab === 'bonus' && (
            <motion.div key="bonus" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {/* Daily Check-in */}
              <div className="rounded-3xl overflow-hidden mb-4" style={{ background: 'linear-gradient(145deg, #0c1a2e 0%, #1e3a5f 54%, #2563eb 100%)' }}>
                <div className="p-4 text-white text-center">
                  <Flame className="w-10 h-10 text-yellow-300 mx-auto mb-2" />
                  <h2 className="text-[16px] md:text-xl font-black">Bonus Harian</h2>
                  <p className="text-[9px] md:text-[10px] text-blue-200 mt-1">Klaim bonus check-in setiap hari</p>
                  {dailyCheckStatus.streak > 0 && (
                    <p className="text-[8px] text-yellow-300 font-bold mt-1">🔥 Streak: {dailyCheckStatus.streak} hari</p>
                  )}
                  {dailyCheckStatus.canCheckToday ? (
                    <button onClick={handleDailyCheck} disabled={dailyCheckLoading} className="mt-3 h-10 px-8 rounded-2xl bg-yellow-500 text-[var(--zv-text)] text-[11px] font-bold hover:bg-yellow-400 transition-colors disabled:opacity-60">
                      {dailyCheckLoading ? 'Memproses...' : 'Check-in Sekarang'}
                    </button>
                  ) : (
                    <div className="mt-3 h-10 px-8 rounded-2xl bg-white/15 inline-flex items-center gap-1 text-[11px] font-bold">
                      <CheckCircle className="w-4 h-4 text-blue-300" /> Sudah Dicek ✓
                    </div>
                  )}
                </div>
              </div>

              {/* Promos */}
              {promos.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-[11px] font-black text-[#3b82f6] mb-2">Promo Aktif</h3>
                  <div className="space-y-2">
                    {promos.map(p => (
                      <div key={p.id} className="rounded-2xl p-3 bg-[var(--zv-panel)] border border-[var(--zv-border)]">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Gift className="w-4 h-4 text-[#f59e0b]" />
                          <span className="text-[10px] font-black text-[var(--zv-text)]">{p.title}</span>
                        </div>
                        <p className="text-[8px] text-[var(--zv-muted)]">{p.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bonus History */}
              <h3 className="text-[11px] font-black text-[#3b82f6] mb-2">Riwayat Bonus</h3>
              <div className="space-y-1.5">
                {bonuses.map(b => (
                  <div key={b.id} className="rounded-2xl p-2.5 bg-[var(--zv-panel)] border border-[var(--zv-border)] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[var(--zv-surface)] grid place-items-center"><Gift className="w-4 h-4 text-[#9c27b0]" /></div>
                      <div>
                        <span className="block text-[9px] font-bold text-[var(--zv-text)]">{b.type === 'daily_checkin' ? 'Daily Check-in' : b.type === 'trading_bonus' ? 'Trading Bonus' : b.type === 'deposit_bonus' ? 'Deposit Bonus' : b.type === 'referral_bonus' ? 'Referral Bonus' : 'Welcome Bonus'}</span>
                        <span className="block text-[7px] text-[var(--zv-muted)]">{formatDateTime(b.createdAt)}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-[#3b82f6]">+{formatRupiah(b.amount)}</span>
                  </div>
                ))}
                {bonuses.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-[10px] font-bold text-[var(--zv-muted)]">Belum ada bonus</p>
                  </div>
                )}
              </div>
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
          {activeTab === 'profile' && (
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
                  { icon: <Shield className="w-4 h-4 text-[#3b82f6]" />, label: 'Verifikasi KYC', desc: user?.kycStatus === 'verified' ? 'Terverifikasi' : 'Belum verifikasi', action: () => {} },
                  { icon: <Award className="w-4 h-4 text-[#f59e0b]" />, label: 'VIP Level', desc: 'Gold', action: () => {} },
                  { icon: <Gift className="w-4 h-4 text-[#9c27b0]" />, label: 'Bonus & Promo', desc: 'Klaim bonus harian', action: () => setActiveTab('bonus') },
                  { icon: <UserPlus className="w-4 h-4 text-[#3b82f6]" />, label: 'Undang', desc: 'Ajak teman, dapat komisi', action: () => setActiveTab('undang') },
                  { icon: <Headphones className="w-4 h-4 text-[#3b82f6]" />, label: 'Layanan Pelanggan', desc: 'Bantuan & CS 24/7', action: () => {} },
                  { icon: <Building2 className="w-4 h-4 text-[#3b82f6]" />, label: 'Profil Perusahaan', desc: 'Tentang ZEVORIX', action: () => {} },
                  { icon: <HelpCircle className="w-4 h-4 text-[#f59e0b]" />, label: 'Bantuan', desc: 'FAQ & Support', action: () => {} },
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

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--zv-border)] md:hidden bottom-nav-safe glass-header">
        <div className="max-w-7xl mx-auto flex">
          {[
            { key: 'home', label: 'Beranda', icon: HomeIcon },
            { key: 'market', label: 'Pasar', icon: BarChart3 },
            { key: 'sinyal', label: 'Sinyal', icon: Target },
            { key: 'investasi', label: 'Investasi', icon: DollarSign },
            { key: 'more', label: 'Lainnya', icon: Menu },
          ].map(tab => {
            const isActive = activeTab === tab.key || (tab.key === 'more' && showSideMenu)
            return (
              <button key={tab.key} onClick={() => {
                if (tab.key === 'more') setShowSideMenu(true)
                else setActiveTab(tab.key)
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
          <ZevorixLogo size={30} className="shadow-sm" />
          <span className="text-[7px] font-black gradient-text tracking-wider">ZEVORIX</span>
        </div>
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
                  { icon: <Gift className="w-4 h-4" />, label: 'Bonus & Promo', key: 'bonus' },
                  { icon: <Trophy className="w-4 h-4" />, label: 'Leaderboard', key: 'leaderboard' },
                  { icon: <User className="w-4 h-4" />, label: 'Profil', key: 'profile' },
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
                    <span className="text-[8px] font-bold text-blue-200">Aset Saham • {selectedProduct.category === 'potential' ? 'Saham Potential' : 'Saham Dividen'}</span>
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
                      const durMult = d <= 30 ? 1 : d <= 60 ? 1.15 : d <= 90 ? 1.3 : d <= 120 ? 1.5 : d <= 180 ? 1.8 : 2.5
                      const effectiveRate = getStockBaseRate(selectedStock.code) * durMult
                      return (
                        <button key={d} onClick={() => setContractDuration(d)}
                          className={`rounded-xl p-2 text-center border-2 transition-all ${contractDuration === d ? 'border-[#3b82f6] bg-[var(--zv-surface)]' : 'border-[var(--zv-border)] bg-[var(--zv-panel)] hover:border-[#3b82f6]'}`}>
                          <span className="block text-[11px] font-black text-[var(--zv-text)]">{d}</span>
                          <span className="block text-[7px] font-bold text-[var(--zv-muted)]">hari</span>
                          <span className="block text-[8px] font-black text-[#22c55e] mt-0.5">{(effectiveRate).toFixed(1)}%</span>
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

                <span className="block text-[8px] text-[#3b82f6] leading-relaxed mb-3">Profit harian dapat diklaim setiap hari pukul 00:00 WIB. Kontrak berakhir setelah {contractDuration} hari.</span>

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
                  <p className="text-[9px] text-blue-200">Cek setiap hari untuk mendapat bonus Rp 1.000 - Rp 10.000</p>

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
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} transition={{ type: 'spring', damping: 20 }} className="fixed z-50 inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[90vw] md:max-w-md bg-[var(--zv-panel)] rounded-3xl border border-[var(--zv-border)] overflow-y-auto custom-scrollbar">
              <div className="relative">
                {/* Green Header */}
                <div className="p-6 text-center text-white relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #0c1a2e 0%, #1e3a5f 54%, #2563eb 100%)' }}>
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.04) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                  <div className="relative z-10">
                    <div className="mx-auto mb-3 p-1 bg-white/90 rounded-full shadow-[0_8px_24px_rgba(0,0,0,.3)]">
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
                    <span className="text-[8px] font-bold text-blue-200">Aset Saham • {selectedDetailProduct.category === 'potential' ? 'Saham Potential' : 'Saham Dividen'}</span>
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
                                      <rect x={x} y={bodyTop} width={candleW} height={bodyH} fill={isGreen ? '#22c55e' : 'var(--zv-panel)'} stroke={isGreen ? '#22c55e' : '#ef5350'} strokeWidth="0.7" rx="0.8" />
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
