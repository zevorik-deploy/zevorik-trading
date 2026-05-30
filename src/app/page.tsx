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
  MessageCircle, HelpCircle, LogIn, UserPlus, RotateCcw
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

interface BonusItem {
  id: string; type: string; amount: number; status: string; createdAt: string; description?: string;
}

interface PromoItem {
  id: string; title: string; description: string; imageUrl?: string; startDate: string; endDate: string; type: string;
}

interface LeaderboardEntry {
  rank: number; name: string; profit: number; profitPercent: number; avatar?: string;
}

// ============================================
// TICKER DATA (matching reference)
// ============================================
const REFERENCE_TICKERS = [
  { code: 'GS', change: '+1.59%', up: true },
  { code: 'IDX', change: '-2.13%', up: false },
  { code: 'IHSG', change: '+0.28%', up: true },
  { code: 'SAHAM', change: '+3.22%', up: true },
  { code: 'GOLD', change: '+4.04%', up: true },
  { code: 'BANK', change: '+3.30%', up: true },
  { code: 'ENERGY', change: '+3.77%', up: true },
  { code: 'OIL', change: '-3.48%', up: false },
  { code: 'GS', change: '+2.86%', up: true },
]

const PIE_COLORS = ['#17b85c', '#d4a331', '#3b82f6', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899']

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
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: 'linear-gradient(180deg, #f5f0e8 0%, #e8f5e9 50%, #c8e6c9 100%)' }}>
      {/* Desktop Left Branding Panel - hidden on mobile */}
      <div className="hidden md:flex md:w-1/2 lg:w-[55%] flex-col items-center justify-center p-8 lg:p-16 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #042d1a 0%, #08713a 54%, #17b85c 100%)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.04) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 text-center text-white max-w-lg">
          <div className="w-24 h-24 rounded-full bg-white p-2 mx-auto mb-6 shadow-[0_12px_40px_rgba(0,0,0,.3)]">
            <img src="/logo.svg" alt="Global Saham" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-black mb-3">Global Saham</h1>
          <p className="text-green-200 text-sm lg:text-base mb-8 leading-relaxed">Platform investasi saham terpercaya dengan akses pasar real-time, portofolio cerdas, dan reward eksklusif untuk investor Indonesia.</p>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl p-4 bg-white/10 border border-white/15 text-center">
              <BarChart3 className="w-6 h-6 text-yellow-300 mx-auto mb-2" />
              <b className="block text-sm font-black">Market</b>
              <span className="block text-xs text-green-200 font-bold">Live</span>
            </div>
            <div className="rounded-2xl p-4 bg-white/10 border border-white/15 text-center">
              <Users className="w-6 h-6 text-yellow-300 mx-auto mb-2" />
              <b className="block text-sm font-black">125K++</b>
              <span className="block text-xs text-green-200 font-bold">Pengguna</span>
            </div>
            <div className="rounded-2xl p-4 bg-white/10 border border-white/15 text-center">
              <Shield className="w-6 h-6 text-yellow-300 mx-auto mb-2" />
              <b className="block text-sm font-black">Aman</b>
              <span className="block text-xs text-green-200 font-bold">Terjamin</span>
            </div>
          </div>
          {/* Decorative chart line */}
          <div className="mt-8 mx-auto h-12 w-full max-w-sm rounded-xl overflow-hidden bg-white/8 border border-white/12">
            <svg className="w-full h-full" viewBox="0 0 400 50" preserveAspectRatio="none">
              <defs>
                <linearGradient id="deskChartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#d4a331" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#d4a331" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,38 L25,35 L50,33 L75,35 L100,28 L125,25 L150,27 L175,20 L200,17 L225,18 L250,12 L275,10 L300,11 L325,7 L350,8 L375,5 L400,3 L400,50 L0,50Z" fill="url(#deskChartGrad)" />
              <path d="M0,38 L25,35 L50,33 L75,35 L100,28 L125,25 L150,27 L175,20 L200,17 L225,18 L250,12 L275,10 L300,11 L325,7 L350,8 L375,5 L400,3" fill="none" stroke="#d4a331" strokeWidth="2.5" />
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
                <img src="/logo.svg" alt="Global Saham" className="w-full h-full object-contain" />
              </div>
              <div>
                <b className="block text-[11px] leading-tight font-black text-gs-green3 tracking-wide">GLOBAL SAHAM</b>
                <span className="block text-[7px] font-bold text-gs-green uppercase tracking-widest">GS Capital Access</span>
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
                <img src="/logo.svg" alt="Global Saham" className="w-full h-full object-contain" />
              </div>
              <div>
                <b className="block text-xs leading-tight font-black text-gs-green3 tracking-wide">GLOBAL SAHAM</b>
                <span className="block text-[9px] font-bold text-gs-green uppercase tracking-widest">GS Capital Access</span>
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
          <div className="relative overflow-hidden text-white" style={{ background: 'linear-gradient(145deg, #042d1a 0%, #08713a 54%, #17b85c 100%)' }}>
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.04) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

            {/* GS LIVE Badge + Ticker */}
            <div className="relative flex items-center gap-2 px-4 pt-3 pb-2">
              <div className="flex-shrink-0 h-6 px-2.5 rounded-full flex items-center gap-1.5 bg-yellow-500/20 border border-yellow-400/30">
                <Zap className="w-3 h-3 text-yellow-300" />
                <span className="text-[8px] font-black text-yellow-300 tracking-wide">GS LIVE</span>
              </div>
              <div className="flex-1 overflow-hidden h-6 rounded-full bg-white/10 border border-white/15">
                <div className="flex items-center gap-3 whitespace-nowrap animate-ticker px-2 h-full">
                  {[...REFERENCE_TICKERS, ...REFERENCE_TICKERS].map((item, i) => (
                    <span key={i} className={`flex items-center gap-1 text-[8px] font-bold ${item.up ? 'text-green-300' : 'text-red-300'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${item.up ? 'bg-green-400' : 'bg-red-400'}`} />
                      {item.code} {item.change}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Center Logo + Text */}
            <div className="relative z-10 flex flex-col items-center px-4 pt-2 pb-3">
              <div className="w-16 h-16 rounded-full bg-white p-1.5 mb-2 shadow-[0_8px_24px_rgba(0,0,0,.3)]">
                <img src="/logo.svg" alt="Global Saham" className="w-full h-full object-contain" />
              </div>

              {isLogin ? (
                <>
                  <h1 className="text-[18px] font-black text-center leading-tight">Masuk Investor<br />Global Saham</h1>
                  <p className="max-w-[280px] mt-1.5 text-[9px] text-center font-medium text-green-200 leading-relaxed">
                    Akses akun Global Saham untuk memantau portofolio, pergerakan saham, aktivitas profit, dan layanan Investor.
                  </p>
                </>
              ) : (
                <>
                  <div className="h-6 px-3 rounded-full bg-yellow-500/20 border border-yellow-400/30 flex items-center gap-1.5 mb-2">
                    <Shield className="w-3 h-3 text-yellow-300" />
                    <span className="text-[8px] font-black text-yellow-300 tracking-wide">REGISTRASI INVESTOR</span>
                  </div>
                  <h1 className="text-[18px] font-black text-center leading-tight">Daftar Global Saham</h1>
                  <p className="max-w-[280px] mt-1.5 text-[9px] text-center font-medium text-green-200 leading-relaxed">
                    Buat akun investor untuk akses portofolio, produk aktif, dan program reward Global Saham.
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
                      <span className="block text-[7px] text-green-200 font-bold">Live</span>
                    </div>
                    <div className="rounded-2xl p-2 bg-white/10 border border-white/15 text-center">
                      <Users className="w-4 h-4 text-yellow-300 mx-auto mb-0.5" />
                      <b className="block text-[8px] font-black">125K++</b>
                      <span className="block text-[7px] text-green-200 font-bold">Pengguna</span>
                    </div>
                    <div className="rounded-2xl p-2 bg-white/10 border border-white/15 text-center">
                      <Briefcase className="w-4 h-4 text-yellow-300 mx-auto mb-0.5" />
                      <b className="block text-[8px] font-black">Portofolio</b>
                      <span className="block text-[7px] text-green-200 font-bold">Akses</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-2xl p-2 bg-white/10 border border-white/15 text-center">
                      <Users className="w-4 h-4 text-yellow-300 mx-auto mb-0.5" />
                      <b className="block text-[8px] font-black">PENDUDUKA</b>
                      <span className="block text-[7px] text-green-200 font-bold">125K++</span>
                    </div>
                    <div className="rounded-2xl p-2 bg-white/10 border border-white/15 text-center">
                      <TrendingUp className="w-4 h-4 text-yellow-300 mx-auto mb-0.5" />
                      <b className="block text-[8px] font-black">MARKET</b>
                      <span className="block text-[7px] text-green-200 font-bold">+4.18%</span>
                    </div>
                    <div className="rounded-2xl p-2 bg-white/10 border border-white/15 text-center">
                      <CheckCircle className="w-4 h-4 text-yellow-300 mx-auto mb-0.5" />
                      <b className="block text-[8px] font-black">STATUS</b>
                      <span className="block text-[7px] text-green-200 font-bold">OPEN</span>
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
                    <stop offset="0%" stopColor="#d4a331" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#d4a331" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,38 L25,35 L50,33 L75,35 L100,28 L125,25 L150,27 L175,20 L200,17 L225,18 L250,12 L275,10 L300,11 L325,7 L350,8 L375,5 L400,3 L400,50 L0,50Z" fill="url(#chartGrad)" />
                <path d="M0,38 L25,35 L50,33 L75,35 L100,28 L125,25 L150,27 L175,20 L200,17 L225,18 L250,12 L275,10 L300,11 L325,7 L350,8 L375,5 L400,3" fill="none" stroke="#d4a331" strokeWidth="2.5" className="animate-chart-draw" />
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
                    Saya menyetujui proses pendaftaran dan memahami keamanan akun Global Saham.
                  </span>
                </label>
              )}

              {/* Submit Button */}
              <button type="submit" disabled={loading}
                className="w-full h-12 rounded-2xl overflow-hidden relative text-white text-[12px] font-black tracking-widest uppercase flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-70"
                style={{ background: 'linear-gradient(135deg, #064b28 0%, #08713a 50%, #17b85c 100%)' }}>
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
                  <>Belum punya akun? <span className="text-gs-green font-black cursor-pointer hover:underline" onClick={() => { setIsLogin(false); refreshMath(); }}>Daftar Global Saham</span></>
                ) : (
                  <>Sudah punya akun? <span className="text-gs-green font-black cursor-pointer hover:underline" onClick={() => setIsLogin(true)}>Masuk Global Saham</span></>
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
            <span className="block mt-0.5 text-[8px] md:text-[9px] font-semibold text-gs-muted">Halaman resmi Global Saham</span>
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
  const [financeTab, setFinanceTab] = useState<'deposit' | 'withdraw'>('deposit')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [profileEdit, setProfileEdit] = useState(false)
  const [profileForm, setProfileForm] = useState({ name: '', email: '', bankName: '', bankAccount: '', bankHolder: '' })
  const [referralInfo, setReferralInfo] = useState({ code: '', totalReferred: 0, totalBonus: 0, referredUsers: [] as { name: string; date: string; bonus: number }[] })
  const [copied, setCopied] = useState(false)
  const [txFilter, setTxFilter] = useState('all')
  const [showSideMenu, setShowSideMenu] = useState(false)
  const [showBalance, setShowBalance] = useState(true)
  const initialized = useRef(false)

  // ============ LIVE PRICE CHART STATE ============
  const [liveBuyChart, setLiveBuyChart] = useState<{time: string; price: number}[]>([])
  const [liveSellChart, setLiveSellChart] = useState<{time: string; price: number}[]>([])
  const [liveBuyPrice, setLiveBuyPrice] = useState(0)
  const [liveSellPrice, setLiveSellPrice] = useState(0)
  const [liveChartActive, setLiveChartActive] = useState(false)
  const liveChartRef = useRef<{buyPrice: number; sellPrice: number; trend: number}>({buyPrice: 0, sellPrice: 0, trend: 0})
  const MAX_CHART_POINTS = 80

  // Live price simulation effect
  useEffect(() => {
    if (!selectedStock || (!showStockDetail && !tradeModal)) {
      setLiveChartActive(false)
      return
    }
    const basePrice = selectedStock.price
    const spread = basePrice * 0.002 // 0.2% spread between buy/sell
    let buyPrice = basePrice - spread
    let sellPrice = basePrice + spread
    let trend = (Math.random() - 0.5) * 0.002 // initial trend direction
    let trendDuration = 0
    let pointCount = 0

    // Initialize with some historical data
    const initialBuy: {time: string; price: number}[] = []
    const initialSell: {time: string; price: number}[] = []
    let tempBuy = buyPrice
    let tempSell = sellPrice
    for (let i = 30; i >= 1; i--) {
      const t = (Math.random() - 0.5) * basePrice * 0.003
      tempBuy += t - spread * 0.1
      tempSell += t + spread * 0.1
      // Keep prices within reasonable range
      tempBuy = Math.max(basePrice * 0.95, Math.min(basePrice * 1.05, tempBuy))
      tempSell = Math.max(basePrice * 0.95, Math.min(basePrice * 1.05, tempSell))
      const now = Date.now() - i * 1500
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
    liveChartRef.current = {buyPrice, sellPrice, trend}
    setLiveChartActive(true)

    const interval = setInterval(() => {
      pointCount++
      // Shift trend occasionally for more natural movement
      trendDuration++
      if (trendDuration > 5 + Math.random() * 15) {
        trend = (Math.random() - 0.5) * basePrice * 0.004
        trendDuration = 0
      }

      // Random walk with trend bias
      const buyDelta = trend + (Math.random() - 0.5) * basePrice * 0.005
      const sellDelta = trend + (Math.random() - 0.5) * basePrice * 0.005

      buyPrice += buyDelta
      sellPrice += sellDelta

      // Ensure sell > buy (maintain spread)
      if (sellPrice <= buyPrice) {
        sellPrice = buyPrice + spread
      }

      // Keep within ±5% range
      buyPrice = Math.max(basePrice * 0.93, Math.min(basePrice * 1.07, buyPrice))
      sellPrice = Math.max(basePrice * 0.93, Math.min(basePrice * 1.07, sellPrice))

      // Mean reversion (soft pull back toward base)
      buyPrice += (basePrice - buyPrice) * 0.01
      sellPrice += (basePrice - sellPrice) * 0.01

      liveChartRef.current = {buyPrice, sellPrice, trend}
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
    }, 1500)

    return () => {
      clearInterval(interval)
      setLiveChartActive(false)
    }
  }, [selectedStock, showStockDetail, tradeModal])

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
  }, [user, fetchStocks, fetchPortfolio, fetchTransactions, fetchIndices, fetchNotifications, fetchNews, fetchWatchlist, fetchDeposits, fetchWithdrawals, fetchReferral, fetchBonuses, fetchPromos, fetchLeaderboard])

  useEffect(() => { const iv = setInterval(refreshAll, 30000); return () => clearInterval(iv) }, [refreshAll])

  // ============ TRADE ============
  const handleTrade = async () => {
    if (!user || !selectedStock || !tradeModal || !tradeShares) return
    const shares = parseInt(tradeShares)
    if (shares <= 0) return
    setTradeLoading(true)
    try {
      const livePrice = tradeModal === 'buy' ? (liveBuyPrice || selectedStock.price) : (liveSellPrice || selectedStock.price)
      const res = await fetch('/api/transactions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, stockId: selectedStock.id, type: tradeModal === 'buy' ? 'BUY' : 'SELL', shares, price: tradeOrderType === 'limit' ? parseFloat(tradePrice) || livePrice : livePrice }),
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

  // ============ DAILY CHECK-IN ============
  const handleCheckIn = async () => {
    if (!user) return
    try {
      const res = await fetch('/api/bonus', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, type: 'daily_checkin' }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: 'Check-in Berhasil!', description: `Bonus: ${formatRupiah(data.bonus?.amount || 10000)}` })
      fetchBonuses(); fetchPortfolio()
    } catch (err: unknown) { toast({ title: 'Gagal', description: err instanceof Error ? err.message : 'Error', variant: 'destructive' }) }
  }

  // ============ DERIVED ============
  const unreadNotif = notifications.filter(n => !n.isRead).length
  const filteredStocks = stocks.filter(s => {
    const ms = s.code.toLowerCase().includes(searchQuery.toLowerCase()) || s.name.toLowerCase().includes(searchQuery.toLowerCase())
    const mf = stockFilter === 'all' || s.category === stockFilter || s.sector === stockFilter
    return ms && mf
  })
  const categories = [{ key: 'all', label: 'Semua' }, { key: 'bluechip', label: 'Blue Chip' }, { key: 'tech', label: 'Teknologi' }, { key: 'banking', label: 'Perbankan' }, { key: 'energy', label: 'Energi' }, { key: 'consumer', label: 'Konsumer' }, { key: 'mining', label: 'Pertambangan' }, { key: 'healthcare', label: 'Kesehatan' }]
  const isWatched = (stockId: string) => watchlist.some(w => w.stockId === stockId)
  const openStockDetail = (stock: Stock) => { setSelectedStock(stock); setShowStockDetail(true); setLiveBuyChart([]); setLiveSellChart([]); setLiveBuyPrice(0); setLiveSellPrice(0); fetchPriceHistory(stock.id) }
  const openTrade = (stock: Stock, type: 'buy' | 'sell') => { setSelectedStock(stock); setTradeModal(type); setTradeShares(''); setTradePrice(''); setTradeOrderType('market'); setLiveBuyChart([]); setLiveSellChart([]); setLiveBuyPrice(0); setLiveSellPrice(0); fetchPriceHistory(stock.id) }
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
              <img src="/logo.svg" alt="GS" className="w-full h-full object-contain" />
            </div>
            <div>
              <b className="block text-[10px] md:text-xs font-black text-gs-green3 leading-tight">GLOBAL SAHAM</b>
              <span className="block text-[7px] md:text-[9px] font-bold text-gs-muted">Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={refreshAll} className="w-8 h-8 rounded-xl bg-gs-soft border border-gs-line grid place-items-center hover:bg-green-100 transition-colors">
              <RefreshCw className={`w-3.5 h-3.5 text-gs-green3 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => { setShowNotifPanel(true); markNotifRead() }} className="w-8 h-8 rounded-xl bg-gs-soft border border-gs-line grid place-items-center hover:bg-green-100 transition-colors relative">
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
                <span className={`text-[8px] md:text-[9px] font-black ${idx.changePercent >= 0 ? 'text-green-600' : 'text-red-500'}`}>{formatPercent(idx.changePercent)}</span>
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
              {/* Balance Card */}
              <div className="rounded-3xl overflow-hidden mb-4" style={{ background: 'linear-gradient(145deg, #042d1a 0%, #08713a 54%, #17b85c 100%)' }}>
                <div className="p-4 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-[9px] md:text-[10px] font-medium text-green-200">Selamat datang,</span>
                      <b className="block text-sm md:text-base font-black">{user?.name}</b>
                    </div>
                    <div className="flex items-center gap-2">
                      {user?.kycStatus === 'verified' && (
                        <div className="h-5 px-2 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center gap-1">
                          <Shield className="w-2.5 h-2.5 text-blue-300" />
                          <span className="text-[6px] font-black text-blue-200">KYC ✓</span>
                        </div>
                      )}
                      <div className="w-9 h-9 rounded-full bg-white/15 border border-white/20 grid place-items-center">
                        <User className="w-4 h-4 text-yellow-300" />
                      </div>
                    </div>
                  </div>
                  <div className="mb-2">
                    <span className="text-[9px] font-medium text-green-200">Total Aset</span>
                    <div className="flex items-center gap-2">
                      <b className="text-xl md:text-2xl font-black">{showBalance ? formatRupiah(portfolioSummary.totalAssets) : '••••••••'}</b>
                      <button onClick={() => setShowBalance(!showBalance)} className="text-white/60 hover:text-white">
                        {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-2xl p-2.5 bg-white/10 border border-white/15">
                      <span className="text-[7px] md:text-[8px] font-medium text-green-200">Saldo Kas</span>
                      <b className="block text-[11px] md:text-xs font-black mt-0.5">{showBalance ? formatRupiah(portfolioSummary.cashBalance) : '••••'}</b>
                    </div>
                    <div className="rounded-2xl p-2.5 bg-white/10 border border-white/15">
                      <span className="text-[7px] md:text-[8px] font-medium text-green-200">Investasi</span>
                      <b className="block text-[11px] md:text-xs font-black mt-0.5">{showBalance ? formatRupiah(portfolioSummary.totalCurrentValue) : '••••'}</b>
                    </div>
                    <div className="rounded-2xl p-2.5 bg-white/10 border border-white/15">
                      <span className="text-[7px] md:text-[8px] font-medium text-green-200">Profit/Loss</span>
                      <b className={`block text-[11px] md:text-xs font-black mt-0.5 ${portfolioSummary.totalProfitLoss >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                        {showBalance ? formatRupiah(portfolioSummary.totalProfitLoss) : '••••'}
                      </b>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-5 gap-1.5 mb-4">
                {[
                  { icon: <Plus className="w-4 h-4" />, label: 'Deposit', action: () => setActiveTab('finance'), color: 'bg-green-50 text-green-600' },
                  { icon: <Minus className="w-4 h-4" />, label: 'Withdraw', action: () => setActiveTab('finance'), color: 'bg-red-50 text-red-500' },
                  { icon: <BarChart3 className="w-4 h-4" />, label: 'Saham', action: () => setActiveTab('market'), color: 'bg-blue-50 text-blue-600' },
                  { icon: <Gift className="w-4 h-4" />, label: 'Bonus', action: () => setActiveTab('bonus'), color: 'bg-purple-50 text-purple-600' },
                  { icon: <Newspaper className="w-4 h-4" />, label: 'Berita', action: () => setActiveTab('news'), color: 'bg-amber-50 text-amber-600' },
                ].map((a, i) => (
                  <button key={i} onClick={a.action} className="flex flex-col items-center gap-1 py-2.5 rounded-2xl bg-white border border-gs-line shadow-sm hover:shadow-md transition-shadow">
                    <div className={`w-8 h-8 rounded-lg ${a.color} grid place-items-center`}>{a.icon}</div>
                    <span className="text-[7px] md:text-[8px] font-bold text-gs-green3">{a.label}</span>
                  </button>
                ))}
              </div>

              {/* Daily Check-in */}
              <div className="rounded-2xl p-3 bg-white border border-gs-line shadow-sm mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-gs-green3 grid place-items-center">
                      <CalendarDays className="w-5 h-5 text-yellow-300" />
                    </div>
                    <div>
                      <b className="text-[11px] md:text-xs font-black text-gs-green3">Daily Check-in</b>
                      <span className="block text-[8px] md:text-[9px] font-semibold text-gs-muted">Klaim bonus harian Anda</span>
                    </div>
                  </div>
                  <button onClick={handleCheckIn} className="h-8 px-4 rounded-xl bg-gs-green3 text-white text-[9px] font-bold hover:bg-gs-green transition-colors">
                    Klaim
                  </button>
                </div>
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
                          <span className={`text-[7px] md:text-[8px] font-black ${p.profitLoss >= 0 ? 'text-green-600' : 'text-red-500'}`}>{formatPercent(p.profitLossPercent)}</span>
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
                      <span className="text-[8px] md:text-[9px] font-bold text-green-600 mb-1 block">🔺 Gainers</span>
                      {topGainers.slice(0, 3).map(s => (
                        <button key={s.id} onClick={() => openStockDetail(s)} className="w-full flex items-center justify-between py-1.5 border-b border-gs-line last:border-0">
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-lg bg-green-50 grid place-items-center text-[7px] font-black text-green-600">{s.code.slice(0, 2)}</div>
                            <span className="text-[9px] font-bold text-gs-text">{s.code}</span>
                          </div>
                          <span className="text-[8px] font-black text-green-600">+{s.changePercent.toFixed(2)}%</span>
                        </button>
                      ))}
                    </div>
                    <div>
                      <span className="text-[8px] font-bold text-red-500 mb-1 block">🔻 Losers</span>
                      {topLosers.slice(0, 3).map(s => (
                        <button key={s.id} onClick={() => openStockDetail(s)} className="w-full flex items-center justify-between py-1.5 border-b border-gs-line last:border-0">
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-lg bg-red-50 grid place-items-center text-[7px] font-black text-red-500">{s.code.slice(0, 2)}</div>
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
                          <div className="w-7 h-7 rounded-lg bg-gs-soft grid place-items-center text-[7px] font-black text-gs-green3">{w.stock.code.slice(0, 2)}</div>
                          <div className="text-left">
                            <span className="block text-[9px] font-bold text-gs-text">{w.stock.code}</span>
                            <span className="block text-[7px] text-gs-muted">{w.stock.name.slice(0, 15)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="block text-[9px] font-black text-gs-text tabular-nums">{formatRupiah(w.stock.price)}</span>
                          <span className={`block text-[8px] font-black ${w.stock.changePercent >= 0 ? 'text-green-600' : 'text-red-500'}`}>{formatPercent(w.stock.changePercent)}</span>
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
                        <div className={`w-7 h-7 rounded-lg grid place-items-center ${tx.type === 'BUY' ? 'bg-green-50' : 'bg-red-50'}`}>
                          {tx.type === 'BUY' ? <ArrowDownRight className="w-3.5 h-3.5 text-green-600" /> : <ArrowUpRight className="w-3.5 h-3.5 text-red-500" />}
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold text-gs-text">{tx.type === 'BUY' ? 'Beli' : 'Jual'} {tx.stock.code}</span>
                          <span className="block text-[7px] text-gs-muted">{tx.shares} lot × {formatRupiah(tx.price)}</span>
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
                  <div className="p-3 md:p-4" style={{ background: 'linear-gradient(145deg, #042d1a 0%, #08713a 54%, #17b85c 100%)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-yellow-300" />
                        <span className="text-[10px] md:text-xs font-black text-white">Market Overview</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-[7px] md:text-[8px] font-bold text-green-200">LIVE</span>
                      </div>
                    </div>
                    {(() => {
                      const ihsgIdx = indices.find(idx => idx.code === 'IHSG') || indices[0]
                      if (!ihsgIdx) return null
                      // Generate IHSG chart data
                      const ihsgChartPts: {idx: number; value: number}[] = []
                      let val = ihsgIdx.value - ihsgIdx.value * 0.01
                      for (let i = 0; i < 30; i++) {
                        val += (Math.random() - 0.48) * ihsgIdx.value * 0.002
                        val = Math.max(ihsgIdx.value * 0.98, Math.min(ihsgIdx.value * 1.02, val))
                        ihsgChartPts.push({ idx: i, value: Math.round(val) })
                      }
                      ihsgChartPts.push({ idx: 30, value: ihsgIdx.value })
                      const isIhsgUp = ihsgIdx.changePercent >= 0
                      return (
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg md:text-xl font-black text-white tabular-nums">{formatNumber(ihsgIdx.value)}</span>
                            <span className={`text-[10px] md:text-xs font-bold ${isIhsgUp ? 'text-green-300' : 'text-red-300'}`}>
                              {isIhsgUp ? <TrendingUp className="w-3 h-3 inline" /> : <TrendingDown className="w-3 h-3 inline" />}
                              {' '}{formatPercent(ihsgIdx.changePercent)}
                            </span>
                          </div>
                          <div className="h-16 md:h-20">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={ihsgChartPts}>
                                <defs>
                                  <linearGradient id="ihsgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor={isIhsgUp ? '#4ade80' : '#f87171'} stopOpacity="0.4" />
                                    <stop offset="100%" stopColor={isIhsgUp ? '#4ade80' : '#f87171'} stopOpacity="0" />
                                  </linearGradient>
                                </defs>
                                <XAxis dataKey="idx" hide />
                                <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                                <Tooltip formatter={(value: number) => [formatNumber(value), 'IHSG']} contentStyle={{ fontSize: '10px', borderRadius: '10px', border: '1px solid #bbf7d0', background: '#f0fdf4' }} />
                                <Area type="monotone" dataKey="value" stroke={isIhsgUp ? '#4ade80' : '#f87171'} fill="url(#ihsgGrad)" strokeWidth={2} />
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
                            <span className="block text-[7px] md:text-[8px] font-bold text-green-600 mb-0.5">🔺 Top Gainer</span>
                            <span className="block text-[10px] md:text-xs font-black text-gs-text">{gainer?.code || '-'}</span>
                            <span className="block text-[8px] md:text-[10px] font-bold text-green-600">{gainer ? `+${gainer.changePercent.toFixed(2)}%` : '-'}</span>
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
                  // Generate sparkline data for recharts
                  const sparkData = (() => {
                    const pts: {i: number; p: number}[] = []
                    let p = s.open
                    for (let i = 0; i < 20; i++) {
                      p += (Math.random() - 0.5) * s.price * 0.003
                      p = Math.max(s.low, Math.min(s.high, p))
                      pts.push({ i, p: Math.round(p) })
                    }
                    pts.push({ i: 20, p: Math.round(s.price) })
                    return pts
                  })()
                  const isUp = s.changePercent >= 0
                  const sparkColor = isUp ? '#17b85c' : '#ef4444'
                  const buyPrice = Math.round(s.price * 0.998)
                  const sellPrice = Math.round(s.price * 1.002)
                  const maxVol = Math.max(...stocks.map(st => st.volume), 1)
                  const volPercent = Math.round((s.volume / maxVol) * 100)

                  return (
                    <div key={s.id} className={`rounded-2xl p-3 md:p-4 bg-white border shadow-sm hover:shadow-md transition-shadow ${isUp ? 'border-green-100' : 'border-red-100'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => openStockDetail(s)}>
                          <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl grid place-items-center text-[9px] md:text-[10px] font-black ${isUp ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{s.code.slice(0, 2)}</div>
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
                          <AreaChart data={sparkData}>
                            <defs>
                              <linearGradient id={`sparkGrad-${s.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor={sparkColor} stopOpacity="0.3" />
                                <stop offset="70%" stopColor={sparkColor} stopOpacity="0.05" />
                                <stop offset="100%" stopColor={sparkColor} stopOpacity="0" />
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="i" hide />
                            <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                            <Area type="monotone" dataKey="p" stroke={sparkColor} fill={`url(#sparkGrad-${s.id})`} strokeWidth={1.5} dot={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="flex items-end justify-between">
                        <div>
                          <span className="block text-[13px] md:text-sm font-black text-gs-text tabular-nums">{formatRupiah(s.price)}</span>
                          <div className={`inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded-md ${isUp ? 'bg-green-50' : 'bg-red-50'}`}>
                            {isUp ? <TrendingUp className="w-3 h-3 text-green-600" /> : <TrendingDown className="w-3 h-3 text-red-500" />}
                            <span className={`text-[9px] md:text-[10px] font-bold ${isUp ? 'text-green-600' : 'text-red-500'}`}>{formatPercent(s.changePercent)}</span>
                          </div>
                        </div>
                        <div className="flex gap-1 md:gap-1.5">
                          <button onClick={() => openTrade(s, 'buy')} className="h-7 md:h-8 px-2 md:px-3 rounded-lg bg-green-600 text-white text-[8px] md:text-[9px] font-bold hover:bg-green-700 transition-colors">Beli</button>
                          <button onClick={() => openTrade(s, 'sell')} className="h-7 md:h-8 px-2 md:px-3 rounded-lg bg-red-500 text-white text-[8px] md:text-[9px] font-bold hover:bg-red-600 transition-colors">Jual</button>
                        </div>
                      </div>

                      {/* Buy/Sell Price + Volume - Desktop extra info */}
                      <div className="mt-2 pt-2 border-t border-gs-line grid grid-cols-3 gap-1">
                        <div>
                          <span className="block text-[6px] md:text-[7px] font-bold text-gs-muted">Beli</span>
                          <span className="block text-[8px] md:text-[9px] font-black text-green-700 tabular-nums">{formatRupiah(buyPrice)}</span>
                        </div>
                        <div>
                          <span className="block text-[6px] md:text-[7px] font-bold text-gs-muted">Jual</span>
                          <span className="block text-[8px] md:text-[9px] font-black text-red-600 tabular-nums">{formatRupiah(sellPrice)}</span>
                        </div>
                        <div>
                          <span className="block text-[6px] md:text-[7px] font-bold text-gs-muted">Vol</span>
                          <div className="flex items-center gap-1">
                            <span className="text-[7px] md:text-[8px] font-bold text-gs-text">{formatNumber(s.volume)}</span>
                            <div className="flex-1 h-1.5 rounded-full bg-gs-soft overflow-hidden">
                              <div className={`h-full rounded-full ${isUp ? 'bg-green-500' : 'bg-red-400'}`} style={{ width: `${volPercent}%` }} />
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
              <div className="rounded-3xl overflow-hidden mb-4" style={{ background: 'linear-gradient(145deg, #042d1a 0%, #08713a 54%, #17b85c 100%)' }}>
                <div className="p-4 text-white">
                  <span className="text-[9px] font-medium text-green-200">Nilai Portofolio</span>
                  <b className="block text-2xl font-black mt-0.5">{formatRupiah(portfolioSummary.totalCurrentValue)}</b>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold ${portfolioSummary.totalProfitLoss >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                      {formatRupiah(portfolioSummary.totalProfitLoss)} ({formatPercent(portfolioSummary.totalProfitLossPercent)})
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="rounded-2xl p-2.5 bg-white/10 border border-white/15">
                      <span className="text-[7px] text-green-200">Investasi</span>
                      <b className="block text-[11px] font-black mt-0.5">{formatRupiah(portfolioSummary.totalInvested)}</b>
                    </div>
                    <div className="rounded-2xl p-2.5 bg-white/10 border border-white/15">
                      <span className="text-[7px] text-green-200">Saldo</span>
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
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg grid place-items-center text-[8px] md:text-[10px] font-black cursor-pointer ${p.profitLoss >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{p.stock.code.slice(0, 2)}</div>
                        <div>
                          <span className="block text-[10px] md:text-xs font-black text-gs-text">{p.stock.code}</span>
                          <span className="block text-[7px] md:text-[8px] text-gs-muted">{p.shares} lot × {formatRupiah(p.avgPrice)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] md:text-xs font-black text-gs-text tabular-nums">{formatRupiah(p.currentValue)}</span>
                        <span className={`block text-[9px] md:text-[10px] font-bold ${p.profitLoss >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {formatRupiah(p.profitLoss)} ({formatPercent(p.profitLossPercent)})
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => openTrade(p.stock, 'buy')} className="flex-1 h-7 md:h-8 rounded-lg bg-green-600 text-white text-[8px] md:text-[9px] font-bold">+ Tambah</button>
                      <button onClick={() => openTrade(p.stock, 'sell')} className="flex-1 h-7 md:h-8 rounded-lg bg-red-500 text-white text-[8px] md:text-[9px] font-bold">Jual</button>
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
                  <div className="rounded-2xl p-3 bg-gs-soft border border-gs-line mb-3">
                    <span className="text-[8px] font-bold text-gs-muted">Saldo Saat Ini</span>
                    <b className="block text-lg font-black text-gs-green3">{formatRupiah(user?.balance || 0)}</b>
                  </div>

                  {/* Deposit Form */}
                  <div className="rounded-2xl p-4 bg-white border border-gs-line shadow-sm mb-4">
                    <label className="block mb-1.5 text-[9px] font-black text-gs-muted uppercase tracking-widest">Jumlah Deposit</label>
                    <input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="Minimal Rp 10.000"
                      className="w-full h-11 rounded-2xl bg-gs-soft border border-gs-line px-4 text-[13px] font-semibold text-gs-dark outline-none focus:border-gs-green transition-colors mb-2" />
                    <div className="flex gap-1.5 mb-3">
                      {['100000', '500000', '1000000', '5000000'].map(a => (
                        <button key={a} onClick={() => setDepositAmount(a)} className="flex-1 h-7 rounded-lg bg-gs-soft border border-gs-line text-[8px] font-bold text-gs-green3 hover:bg-gs-green hover:text-white transition-colors">
                          {parseFloat(a) >= 1e6 ? `${(parseFloat(a) / 1e6).toFixed(0)}jt` : `${(parseFloat(a) / 1e3).toFixed(0)}rb`}
                        </button>
                      ))}
                    </div>

                    <label className="block mb-1.5 text-[9px] font-black text-gs-muted uppercase tracking-widest">Metode Pembayaran</label>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {[
                        { key: 'bank_transfer', label: 'Transfer Bank', icon: <CreditCard className="w-4 h-4" /> },
                        { key: 'e_wallet', label: 'E-Wallet', icon: <Wallet className="w-4 h-4" /> },
                      ].map(m => (
                        <button key={m.key} onClick={() => setDepositMethod(m.key)}
                          className={`h-10 rounded-xl border text-[9px] font-bold flex items-center justify-center gap-1.5 transition-colors ${depositMethod === m.key ? 'border-gs-green bg-green-50 text-gs-green3' : 'border-gs-line text-gs-muted'}`}>
                          {m.icon}{m.label}
                        </button>
                      ))}
                    </div>

                    <button onClick={handleDeposit} disabled={depositLoading}
                      className="w-full h-11 rounded-2xl bg-gs-green3 text-white text-[11px] font-bold hover:bg-gs-green transition-colors disabled:opacity-70">
                      {depositLoading ? 'Memproses...' : 'Deposit Sekarang'}
                    </button>
                  </div>

                  {/* Deposit History */}
                  <h3 className="text-[11px] font-black text-gs-green3 mb-2">Riwayat Deposit</h3>
                  <div className="space-y-1.5">
                    {deposits.map(d => (
                      <div key={d.id} className="rounded-2xl p-2.5 bg-white border border-gs-line flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-green-50 grid place-items-center"><Plus className="w-4 h-4 text-green-600" /></div>
                          <div>
                            <span className="block text-[9px] font-bold text-gs-text">{d.method === 'bank_transfer' ? 'Transfer Bank' : 'E-Wallet'}</span>
                            <span className="block text-[7px] text-gs-muted">{formatDateTime(d.createdAt)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="block text-[10px] font-black text-green-600">+{formatRupiah(d.amount)}</span>
                          <span className={`block text-[7px] font-bold ${d.status === 'completed' ? 'text-green-600' : d.status === 'pending' ? 'text-amber-500' : 'text-red-500'}`}>{d.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  {/* Balance */}
                  <div className="rounded-2xl p-3 bg-gs-soft border border-gs-line mb-3">
                    <span className="text-[8px] font-bold text-gs-muted">Saldo Tersedia</span>
                    <b className="block text-lg font-black text-gs-green3">{formatRupiah(user?.balance || 0)}</b>
                  </div>

                  {/* Withdraw Form */}
                  <div className="rounded-2xl p-4 bg-white border border-gs-line shadow-sm mb-4">
                    <label className="block mb-1.5 text-[9px] font-black text-gs-muted uppercase tracking-widest">Jumlah Withdraw</label>
                    <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="Minimal Rp 10.000"
                      className="w-full h-11 rounded-2xl bg-gs-soft border border-gs-line px-4 text-[13px] font-semibold text-gs-dark outline-none focus:border-gs-green transition-colors mb-3" />

                    <label className="block mb-1.5 text-[9px] font-black text-gs-muted uppercase tracking-widest">Rekening Tujuan</label>
                    <div className="rounded-xl p-3 bg-gs-soft border border-gs-line mb-3">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-gs-green" />
                        <div>
                          <span className="block text-[9px] font-bold text-gs-text">{user?.bankName || 'BCA'}</span>
                          <span className="block text-[7px] text-gs-muted">{user?.bankAccount || '1234567890'} - {user?.bankHolder || user?.name}</span>
                        </div>
                      </div>
                    </div>

                    <button onClick={handleWithdraw} disabled={withdrawLoading}
                      className="w-full h-11 rounded-2xl bg-gs-green3 text-white text-[11px] font-bold hover:bg-gs-green transition-colors disabled:opacity-70">
                      {withdrawLoading ? 'Memproses...' : 'Withdraw Sekarang'}
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
                          <span className={`block text-[7px] font-bold ${w.status === 'completed' ? 'text-green-600' : w.status === 'processing' ? 'text-amber-500' : 'text-red-500'}`}>{w.status}</span>
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
                        <div className={`w-9 h-9 rounded-xl grid place-items-center ${tx.type === 'BUY' ? 'bg-green-50' : 'bg-red-50'}`}>
                          {tx.type === 'BUY' ? <ArrowDownRight className="w-4 h-4 text-green-600" /> : <ArrowUpRight className="w-4 h-4 text-red-500" />}
                        </div>
                        <div>
                          <span className="block text-[10px] font-black text-gs-text">
                            {tx.type === 'BUY' ? 'Beli' : 'Jual'} {tx.stock?.code || 'N/A'}
                          </span>
                          <span className="block text-[7px] text-gs-muted">{tx.shares} lot × {formatRupiah(tx.price)} {tx.orderType ? `(${tx.orderType})` : ''}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`block text-[10px] font-black ${tx.type === 'BUY' ? 'text-red-500' : 'text-green-600'}`}>
                          {tx.type === 'BUY' ? '-' : '+'}{formatRupiah(tx.total)}
                        </span>
                        <div className="flex items-center gap-1 justify-end">
                          <span className={`w-1.5 h-1.5 rounded-full ${tx.status === 'completed' ? 'bg-green-500' : tx.status === 'pending' ? 'bg-amber-500' : 'bg-red-500'}`} />
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

          {/* ====== REFERRAL TAB ====== */}
          {activeTab === 'referral' && (
            <motion.div key="referral" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {/* Referral Card */}
              <div className="rounded-3xl overflow-hidden mb-4" style={{ background: 'linear-gradient(145deg, #042d1a 0%, #08713a 54%, #17b85c 100%)' }}>
                <div className="p-4 text-white text-center">
                  <Gift className="w-10 h-10 text-yellow-300 mx-auto mb-2" />
                  <h2 className="text-[16px] md:text-xl font-black">Program Referral</h2>
                  <p className="text-[9px] md:text-[10px] text-green-200 mt-1">Ajak teman dan dapatkan bonus untuk setiap referral</p>

                  <div className="mt-4 rounded-2xl p-3 bg-white/10 border border-white/15">
                    <span className="block text-[8px] font-bold text-green-200 mb-1">Kode Referral Anda</span>
                    <div className="flex items-center justify-center gap-2">
                      <b className="text-[20px] font-black tracking-widest">{referralInfo.code || user?.referralCode || 'GSXXXX'}</b>
                      <button onClick={() => { navigator.clipboard.writeText(referralInfo.code || user?.referralCode || ''); setCopied(true); setTimeout(() => setCopied(false), 2000); toast({ title: 'Kode disalin!' }) }}
                        className="w-8 h-8 rounded-lg bg-white/20 grid place-items-center hover:bg-white/30 transition-colors">
                        {copied ? <Check className="w-4 h-4 text-green-300" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button onClick={() => { navigator.clipboard.writeText(`Gabung Global Saham dengan kode referral saya: ${referralInfo.code || user?.referralCode || ''}`); toast({ title: 'Link disalin!' }) }}
                    className="mt-3 h-10 px-6 rounded-2xl bg-yellow-500 text-gs-dark text-[10px] font-bold inline-flex items-center gap-1.5 hover:bg-yellow-400 transition-colors">
                    <Share2 className="w-4 h-4" /> Bagikan Link
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="rounded-2xl p-3 bg-white border border-gs-line shadow-sm text-center">
                  <Users className="w-5 h-5 text-gs-green mx-auto mb-1" />
                  <b className="block text-[14px] font-black text-gs-green3">{referralInfo.totalReferred}</b>
                  <span className="block text-[8px] font-bold text-gs-muted">Referral</span>
                </div>
                <div className="rounded-2xl p-3 bg-white border border-gs-line shadow-sm text-center">
                  <Wallet className="w-5 h-5 text-gs-gold mx-auto mb-1" />
                  <b className="block text-[14px] font-black text-gs-gold">{formatRupiah(referralInfo.totalBonus)}</b>
                  <span className="block text-[8px] font-bold text-gs-muted">Bonus</span>
                </div>
                <div className="rounded-2xl p-3 bg-white border border-gs-line shadow-sm text-center">
                  <TrendingUp className="w-5 h-5 text-green-600 mx-auto mb-1" />
                  <b className="block text-[14px] font-black text-green-600">Active</b>
                  <span className="block text-[8px] font-bold text-gs-muted">Status</span>
                </div>
              </div>

              {/* Referred Users */}
              <h3 className="text-[11px] font-black text-gs-green3 mb-2">Daftar Referral</h3>
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
                    <span className="text-[9px] font-black text-green-600">+{formatRupiah(u.bonus)}</span>
                  </div>
                ))}
                {referralInfo.referredUsers.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-[10px] font-bold text-gs-muted">Belum ada referral</p>
                  </div>
                )}
              </div>
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
              <div className="rounded-3xl overflow-hidden mb-4" style={{ background: 'linear-gradient(145deg, #042d1a 0%, #08713a 54%, #17b85c 100%)' }}>
                <div className="p-4 text-white text-center">
                  <Flame className="w-10 h-10 text-yellow-300 mx-auto mb-2" />
                  <h2 className="text-[16px] md:text-xl font-black">Bonus Harian</h2>
                  <p className="text-[9px] md:text-[10px] text-green-200 mt-1">Klaim bonus check-in setiap hari</p>
                  <button onClick={handleCheckIn} className="mt-3 h-10 px-8 rounded-2xl bg-yellow-500 text-gs-dark text-[11px] font-bold hover:bg-yellow-400 transition-colors">
                    Check-in Sekarang
                  </button>
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
                    <span className="text-[10px] font-black text-green-600">+{formatRupiah(b.amount)}</span>
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
              <div className="rounded-3xl overflow-hidden mb-4" style={{ background: 'linear-gradient(145deg, #042d1a 0%, #08713a 54%, #17b85c 100%)' }}>
                <div className="p-4 text-white text-center">
                  <Trophy className="w-10 h-10 text-yellow-300 mx-auto mb-2" />
                  <h2 className="text-[16px] md:text-xl font-black">Leaderboard</h2>
                  <p className="text-[9px] md:text-[10px] text-green-200 mt-1">Top investor dengan profit tertinggi</p>
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
                    <span className={`text-[11px] font-black ${entry.profitPercent >= 0 ? 'text-green-600' : 'text-red-500'}`}>{formatPercent(entry.profitPercent)}</span>
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
              <div className="rounded-3xl overflow-hidden mb-4" style={{ background: 'linear-gradient(145deg, #042d1a 0%, #08713a 54%, #17b85c 100%)' }}>
                <div className="p-4 text-white text-center">
                  <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/30 grid place-items-center mx-auto mb-2">
                    <User className="w-8 h-8 text-yellow-300" />
                  </div>
                  <h2 className="text-[14px] md:text-lg font-black">{user?.name}</h2>
                  <span className="block text-[9px] md:text-[10px] text-green-200 mt-0.5">+62 {user?.phone}</span>
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
                  { icon: <Shield className="w-4 h-4 text-blue-600" />, label: 'Verifikasi KYC', desc: user?.kycStatus === 'verified' ? 'Terverifikasi' : 'Belum verifikasi', action: () => {} },
                  { icon: <Award className="w-4 h-4 text-gs-gold" />, label: 'VIP Level', desc: 'Gold', action: () => {} },
                  { icon: <Gift className="w-4 h-4 text-purple-600" />, label: 'Bonus & Promo', desc: 'Klaim bonus harian', action: () => setActiveTab('bonus') },
                  { icon: <Users className="w-4 h-4 text-gs-green" />, label: 'Referral', desc: 'Ajak teman, dapat bonus', action: () => setActiveTab('referral') },
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
            { key: 'portfolio', label: 'Portofolio', icon: Briefcase },
            { key: 'finance', label: 'Keuangan', icon: Wallet },
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
          { key: 'portfolio', label: 'Portofolio', icon: Briefcase },
          { key: 'finance', label: 'Keuangan', icon: Wallet },
          { key: 'history', label: 'Riwayat', icon: History },
          { key: 'bonus', label: 'Bonus', icon: Gift },
          { key: 'profile', label: 'Profil', icon: User },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`w-full flex flex-col items-center gap-0.5 py-2.5 transition-colors ${activeTab === tab.key ? 'text-gs-green3 bg-green-50' : 'text-gs-muted hover:text-gs-green hover:bg-gs-soft'}`}>
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
              <div className="p-4" style={{ background: 'linear-gradient(145deg, #042d1a 0%, #08713a 54%, #17b85c 100%)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 grid place-items-center"><User className="w-6 h-6 text-yellow-300" /></div>
                  <div className="text-white">
                    <b className="block text-[12px] font-black">{user?.name}</b>
                    <span className="block text-[8px] text-green-200">+62 {user?.phone}</span>
                  </div>
                </div>
              </div>
              <div className="p-2">
                {[
                  { icon: <HomeIcon className="w-4 h-4" />, label: 'Beranda', key: 'home' },
                  { icon: <BarChart3 className="w-4 h-4" />, label: 'Pasar Saham', key: 'market' },
                  { icon: <Briefcase className="w-4 h-4" />, label: 'Portofolio', key: 'portfolio' },
                  { icon: <Wallet className="w-4 h-4" />, label: 'Keuangan', key: 'finance' },
                  { icon: <History className="w-4 h-4" />, label: 'Riwayat', key: 'history' },
                  { icon: <Share2 className="w-4 h-4" />, label: 'Referral', key: 'referral' },
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
                  <div key={n.id} className={`p-3 rounded-xl mb-1 ${n.isRead ? 'bg-white' : 'bg-green-50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-6 h-6 rounded-lg grid place-items-center ${n.type === 'trade' ? 'bg-green-100' : n.type === 'deposit' ? 'bg-blue-100' : n.type === 'bonus' ? 'bg-purple-100' : 'bg-amber-100'}`}>
                        {n.type === 'trade' ? <BarChart3 className="w-3 h-3 text-green-600" /> : n.type === 'deposit' ? <Wallet className="w-3 h-3 text-blue-600" /> : n.type === 'bonus' ? <Gift className="w-3 h-3 text-purple-600" /> : <Bell className="w-3 h-3 text-amber-600" />}
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

      {/* Stock Detail Modal */}
      <AnimatePresence>
        {showStockDetail && selectedStock && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40" onClick={() => setShowStockDetail(false)} />
            <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25 }} className="fixed z-50 bottom-0 left-0 right-0 md:inset-0 md:bottom-auto md:left-auto md:right-auto md:top-auto md:flex md:items-center md:justify-center max-h-[85vh] md:max-h-[90vh] bg-white rounded-t-3xl md:rounded-3xl shadow-2xl overflow-y-auto custom-scrollbar md:w-[90vw] md:max-w-2xl md:mx-auto md:my-auto">
              <div className="sticky top-0 bg-white p-4 border-b border-gs-line flex items-center justify-between rounded-t-3xl">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gs-soft grid place-items-center text-[10px] font-black text-gs-green3">{selectedStock.code.slice(0, 2)}</div>
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
                    <span className={`text-[11px] font-bold ${selectedStock.changePercent >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {selectedStock.changePercent >= 0 ? <TrendingUp className="w-3.5 h-3.5 inline" /> : <TrendingDown className="w-3.5 h-3.5 inline" />}
                      {' '}{formatRupiah(selectedStock.change)} ({formatPercent(selectedStock.changePercent)})
                    </span>
                  </div>
                  {/* Live Buy/Sell Prices */}
                  {liveChartActive && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div className="rounded-xl p-2 bg-green-50 border border-green-200">
                        <div className="flex items-center gap-1">
                          <ArrowDownRight className="w-3 h-3 text-green-600" />
                          <span className="text-[7px] font-bold text-green-700 uppercase">Harga Beli</span>
                        </div>
                        <span className="block text-[13px] font-black text-green-700 tabular-nums mt-0.5">{formatRupiah(liveBuyPrice)}</span>
                      </div>
                      <div className="rounded-xl p-2 bg-red-50 border border-red-200">
                        <div className="flex items-center gap-1">
                          <ArrowUpRight className="w-3 h-3 text-red-500" />
                          <span className="text-[7px] font-bold text-red-600 uppercase">Harga Jual</span>
                        </div>
                        <span className="block text-[13px] font-black text-red-600 tabular-nums mt-0.5">{formatRupiah(liveSellPrice)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Live Buy/Sell Price Charts */}
                <div className="mb-3 space-y-2">
                  {/* Live Indicator */}
                  <div className="flex items-center gap-2 px-1">
                    <div className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${liveChartActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                      <span className="text-[8px] font-black text-gs-green3 uppercase tracking-wider">Live</span>
                    </div>
                    <span className="text-[7px] text-gs-muted">Harga berjalan real-time</span>
                  </div>

                  {/* Buy Price Chart (Green) */}
                  <div className="rounded-2xl border border-green-200 bg-gradient-to-b from-green-50/50 to-white overflow-hidden">
                    <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
                      <div className="flex items-center gap-1.5">
                        <ArrowDownRight className="w-3.5 h-3.5 text-green-600" />
                        <span className="text-[9px] font-black text-green-700 uppercase tracking-wider">Grafik Harga Beli</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[14px] font-black text-green-700 tabular-nums">{formatRupiah(liveBuyPrice)}</span>
                        {liveBuyChart.length >= 2 && (
                          <span className={`text-[8px] font-bold ${liveBuyChart[liveBuyChart.length-1]?.price >= liveBuyChart[liveBuyChart.length-2]?.price ? 'text-green-600' : 'text-red-500'}`}>
                            {liveBuyChart[liveBuyChart.length-1]?.price >= liveBuyChart[liveBuyChart.length-2]?.price ? '▲' : '▼'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-28 px-1 pb-1">
                      {liveBuyChart.length > 2 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={liveBuyChart}>
                            <defs>
                              <linearGradient id="buyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#17b85c" stopOpacity="0.35" />
                                <stop offset="60%" stopColor="#17b85c" stopOpacity="0.08" />
                                <stop offset="100%" stopColor="#17b85c" stopOpacity="0" />
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="time" hide />
                            <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                            <Tooltip formatter={(value: number) => [formatRupiah(value), 'Harga Beli']} contentStyle={{ fontSize: '10px', borderRadius: '10px', border: '1px solid #bbf7d0', background: '#f0fdf4' }} />
                            <Area type="monotone" dataKey="price" stroke="#17b85c" fill="url(#buyGrad)" strokeWidth={2.5} isAnimationActive={true} animationDuration={800} animationEasing="ease-out" />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-[10px] text-gs-muted">Memuat grafik beli...</div>
                      )}
                    </div>
                  </div>

                  {/* Sell Price Chart (Red) */}
                  <div className="rounded-2xl border border-red-200 bg-gradient-to-b from-red-50/50 to-white overflow-hidden">
                    <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
                      <div className="flex items-center gap-1.5">
                        <ArrowUpRight className="w-3.5 h-3.5 text-red-500" />
                        <span className="text-[9px] font-black text-red-600 uppercase tracking-wider">Grafik Harga Jual</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[14px] font-black text-red-600 tabular-nums">{formatRupiah(liveSellPrice)}</span>
                        {liveSellChart.length >= 2 && (
                          <span className={`text-[8px] font-bold ${liveSellChart[liveSellChart.length-1]?.price >= liveSellChart[liveSellChart.length-2]?.price ? 'text-green-600' : 'text-red-500'}`}>
                            {liveSellChart[liveSellChart.length-1]?.price >= liveSellChart[liveSellChart.length-2]?.price ? '▲' : '▼'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-28 px-1 pb-1">
                      {liveSellChart.length > 2 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={liveSellChart}>
                            <defs>
                              <linearGradient id="sellGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.35" />
                                <stop offset="60%" stopColor="#ef4444" stopOpacity="0.08" />
                                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="time" hide />
                            <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                            <Tooltip formatter={(value: number) => [formatRupiah(value), 'Harga Jual']} contentStyle={{ fontSize: '10px', borderRadius: '10px', border: '1px solid #fecaca', background: '#fef2f2' }} />
                            <Area type="monotone" dataKey="price" stroke="#ef4444" fill="url(#sellGrad)" strokeWidth={2.5} isAnimationActive={true} animationDuration={800} animationEasing="ease-out" />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-[10px] text-gs-muted">Memuat grafik jual...</div>
                      )}
                    </div>
                  </div>

                  {/* Spread Info */}
                  <div className="rounded-xl p-2.5 bg-gs-soft border border-gs-line">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-gs-gold" />
                        <span className="text-[8px] font-bold text-gs-muted">Spread (Selisih)</span>
                      </div>
                      <span className="text-[10px] font-black text-gs-gold tabular-nums">{formatRupiah(liveSellPrice - liveBuyPrice)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[7px] text-gs-muted">Beli: {formatRupiah(liveBuyPrice)}</span>
                      <span className="text-[7px] text-gs-muted">Jual: {formatRupiah(liveSellPrice)}</span>
                    </div>
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

                {/* Buy/Sell Buttons */}
                <div className="flex gap-2">
                  <button onClick={() => { setTradeModal('buy'); setShowStockDetail(false) }} className="flex-1 h-11 rounded-xl bg-green-600 text-white text-[11px] font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-1">
                    <ArrowDownRight className="w-4 h-4" />Beli
                  </button>
                  <button onClick={() => { setTradeModal('sell'); setShowStockDetail(false) }} className="flex-1 h-11 rounded-xl bg-red-500 text-white text-[11px] font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-1">
                    <ArrowUpRight className="w-4 h-4" />Jual
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Trade Modal */}
      <AnimatePresence>
        {tradeModal && selectedStock && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40" onClick={() => setTradeModal(null)} />
            <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25 }} className="fixed z-50 bottom-0 left-0 right-0 md:inset-0 md:bottom-auto md:left-auto md:right-auto md:top-auto md:flex md:items-center md:justify-center bg-white rounded-t-3xl md:rounded-3xl shadow-2xl md:w-[90vw] md:max-w-lg md:mx-auto md:my-auto">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[14px] font-black text-gs-green3">
                    {tradeModal === 'buy' ? 'Beli' : 'Jual'} {selectedStock.code}
                  </h3>
                  <button onClick={() => setTradeModal(null)} className="w-8 h-8 rounded-lg grid place-items-center hover:bg-gs-soft"><X className="w-4 h-4" /></button>
                </div>

                {/* Price Info */}
                <div className="rounded-xl p-3 bg-gs-soft mb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block text-[8px] font-bold text-gs-muted">
                        {tradeModal === 'buy' ? 'Harga Beli (Live)' : 'Harga Jual (Live)'}
                      </span>
                      <span className="block text-[16px] font-black tabular-nums" style={{color: tradeModal === 'buy' ? '#15803d' : '#dc2626'}}>
                        {formatRupiah(tradeModal === 'buy' ? (liveBuyPrice || selectedStock.price) : (liveSellPrice || selectedStock.price))}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[11px] font-bold ${selectedStock.changePercent >= 0 ? 'text-green-600' : 'text-red-500'}`}>{formatPercent(selectedStock.changePercent)}</span>
                      {liveChartActive && (
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-[7px] font-bold text-green-600">LIVE</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {liveChartActive && (
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gs-line">
                      <span className="text-[7px] text-gs-muted">Beli: {formatRupiah(liveBuyPrice)}</span>
                      <span className="text-[7px] text-gs-muted">Jual: {formatRupiah(liveSellPrice)}</span>
                    </div>
                  )}
                </div>

                {/* Order Type */}
                <div className="flex gap-2 mb-3">
                  <button onClick={() => setTradeOrderType('market')} className={`flex-1 h-8 rounded-lg text-[9px] font-bold ${tradeOrderType === 'market' ? 'bg-gs-green3 text-white' : 'bg-gs-soft text-gs-muted'}`}>Market</button>
                  <button onClick={() => setTradeOrderType('limit')} className={`flex-1 h-8 rounded-lg text-[9px] font-bold ${tradeOrderType === 'limit' ? 'bg-gs-green3 text-white' : 'bg-gs-soft text-gs-muted'}`}>Limit</button>
                </div>

                {tradeOrderType === 'limit' && (
                  <div className="mb-3">
                    <label className="block text-[8px] font-bold text-gs-muted mb-0.5">Harga Limit</label>
                    <input type="number" value={tradePrice} onChange={(e) => setTradePrice(e.target.value)} placeholder={selectedStock.price.toString()}
                      className="w-full h-10 rounded-xl bg-gs-soft border border-gs-line px-3 text-[12px] font-semibold outline-none focus:border-gs-green" />
                  </div>
                )}

                {/* Shares */}
                <div className="mb-3">
                  <label className="block text-[8px] font-bold text-gs-muted mb-0.5">Jumlah Lot</label>
                  <input type="number" value={tradeShares} onChange={(e) => setTradeShares(e.target.value)} placeholder="0"
                    className="w-full h-10 rounded-xl bg-gs-soft border border-gs-line px-3 text-[12px] font-semibold outline-none focus:border-gs-green" />
                </div>

                {/* Quick Lot Buttons */}
                <div className="flex gap-1.5 mb-3">
                  {['1', '5', '10', '50', '100'].map(lot => (
                    <button key={lot} onClick={() => setTradeShares(lot)} className="flex-1 h-7 rounded-lg bg-gs-soft border border-gs-line text-[8px] font-bold text-gs-green3 hover:bg-gs-green hover:text-white transition-colors">
                      {lot}
                    </button>
                  ))}
                </div>

                {/* Summary */}
                {tradeShares && (
                  <div className="rounded-xl p-3 bg-gs-soft mb-3">
                    <div className="flex items-center justify-between py-0.5">
                      <span className="text-[8px] text-gs-muted">Harga {tradeModal === 'buy' ? 'Beli' : 'Jual'}</span>
                      <span className="text-[8px] font-bold text-gs-text">{formatRupiah(tradeOrderType === 'limit' && tradePrice ? parseFloat(tradePrice) : (tradeModal === 'buy' ? (liveBuyPrice || selectedStock.price) : (liveSellPrice || selectedStock.price)))}</span>
                    </div>
                    <div className="flex items-center justify-between py-0.5">
                      <span className="text-[8px] text-gs-muted">Lot</span>
                      <span className="text-[8px] font-bold text-gs-text">{tradeShares}</span>
                    </div>
                    <div className="flex items-center justify-between py-0.5">
                      <span className="text-[8px] text-gs-muted">Biaya (0.15%)</span>
                      <span className="text-[8px] font-bold text-gs-text">{formatRupiah((tradeOrderType === 'limit' && tradePrice ? parseFloat(tradePrice) : (tradeModal === 'buy' ? (liveBuyPrice || selectedStock.price) : (liveSellPrice || selectedStock.price))) * parseInt(tradeShares || '0') * 0.0015)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 mt-1 border-t border-gs-line">
                      <span className="text-[9px] font-bold text-gs-green3">Total</span>
                      <span className="text-[9px] font-black text-gs-green3">{formatRupiah((tradeOrderType === 'limit' && tradePrice ? parseFloat(tradePrice) : (tradeModal === 'buy' ? (liveBuyPrice || selectedStock.price) : (liveSellPrice || selectedStock.price))) * parseInt(tradeShares || '0') * 1.0015)}</span>
                    </div>
                  </div>
                )}

                {/* Submit */}
                <button onClick={handleTrade} disabled={tradeLoading || !tradeShares}
                  className={`w-full h-12 rounded-xl text-white text-[12px] font-bold disabled:opacity-70 transition-colors ${tradeModal === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'}`}>
                  {tradeLoading ? 'Memproses...' : `${tradeModal === 'buy' ? 'Beli' : 'Jual'} ${selectedStock.code}`}
                </button>
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
