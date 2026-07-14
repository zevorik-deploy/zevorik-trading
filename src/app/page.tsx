'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuthStore } from '@/lib/store'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, TrendingDown, Eye, EyeOff, ArrowRight,
  Wallet, BarChart3, Briefcase, History, LogOut, RefreshCw,
  ChevronUp, ChevronDown, X, Search, Bell, Star,
  ArrowUpRight, ArrowDownRight, Home as HomeIcon, User, Copy, Check,
  Plus, Minus, Shield, CreditCard, Settings,
  Clock, AlertCircle, CheckCircle, XCircle, Info, ExternalLink, Share2,
  BookOpen, Target, PieChart, Zap, Users, Menu,
  Phone, Lock, ChevronRight,
  MessageCircle, HelpCircle, LogIn, UserPlus, RotateCcw, DollarSign, Package,
  Download, Gem, Building2, Headphones, ChevronLeft,
  Video, ThumbsUp, Eye as EyeIcon, Globe, Send,
  Sun, Moon, BellRing, Mail, MessageSquare,
  Crosshair, Activity, SlidersHorizontal
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

interface DepositItem {
  id: string; userId: string; amount: number; method: string; bankName?: string; status: string; createdAt: string;
}

interface WithdrawalItem {
  id: string; userId: string; amount: number; bankName?: string; bankAccount?: string; bankHolder?: string; status: string; createdAt: string;
}

interface WatchlistItem {
  id: string; userId: string; stockId: string; stock: Stock; createdAt: string;
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
// ZEVORIK LOGO COMPONENT
// ============================================
function ZevorikLogo({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src="/zevorix-logo.png"
        alt="ZEVORIK"
        className="w-full h-full object-contain drop-shadow-[0_2px_8px_rgba(59,130,246,0.35)]"
      />
    </div>
  )
}

// ============================================
// LOGO WITH FALLBACK COMPONENT
// ============================================
function LogoWithFallback({ src, alt, size, code, className = '' }: { src: string; alt: string; size: number; code: string; className?: string }) {
  const [errored, setErrored] = useState(false)
  if (errored) {
    return (
      <div className="flex items-center justify-center rounded-full bg-[#3b82f6]/15 border border-[#3b82f6]/30" style={{ width: size, height: size, minWidth: size, minHeight: size }}>
        <span className="text-[10px] font-black text-[#3b82f6]">{code.slice(0, 2)}</span>
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={className}
      style={{ minWidth: size, minHeight: size }}
      onError={() => setErrored(true)}
    />
  )
}

// ============================================
// LOGIN / REGISTER PAGE (2-Step with PIN)
// ============================================
function LoginPage() {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'pin' | 'otp'>('login')
  const [identifier, setIdentifier] = useState('') // email or phone
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pin, setPin] = useState(['', '', '', '', '', ''])
  const [registerPin, setRegisterPin] = useState(['', '', '', '', '', ''])
  const [confirmPin, setConfirmPin] = useState(['', '', '', '', '', ''])
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [tempToken, setTempToken] = useState<string | null>(null)

  // OTP state
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', ''])
  const [otpRefs, setOtpRefs] = useState<(HTMLInputElement | null)[]>([])
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [otpResendTimer, setOtpResendTimer] = useState(0)
  const login = useAuthStore((s) => s.login)

  const pinRefs = useRef<(HTMLInputElement | null)[]>([])
  const registerPinRefs = useRef<(HTMLInputElement | null)[]>([])
  const confirmPinRefs = useRef<(HTMLInputElement | null)[]>([])
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handlePinChange = (index: number, value: string, pinArr: string[], setPinArr: (v: string[]) => void, refs: React.MutableRefObject<(HTMLInputElement | null)[]>) => {
    if (!/^\d*$/.test(value)) return
    const newPin = [...pinArr]
    newPin[index] = value.slice(-1)
    setPinArr(newPin)
    if (value && index < 5) {
      refs.current[index + 1]?.focus()
    }
  }

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent, pinArr: string[], setPinArr: (v: string[]) => void, refs: React.MutableRefObject<(HTMLInputElement | null)[]>) => {
    if (e.key === 'Backspace' && !pinArr[index] && index > 0) {
      refs.current[index - 1]?.focus()
    }
  }

  const handlePinPaste = (e: React.ClipboardEvent, setPinArr: (v: string[]) => void, refs: React.MutableRefObject<(HTMLInputElement | null)[]>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newPin = [...Array(6)].map((_, i) => pasted[i] || '')
    setPinArr(newPin)
    const nextIndex = Math.min(pasted.length, 5)
    refs.current[nextIndex]?.focus()
  }

  // OTP helpers
  const maskEmail = (emailAddr: string) => {
    if (!emailAddr) return ''
    const [local, domain] = emailAddr.split('@')
    if (!domain) return emailAddr
    const masked = local.length <= 1 ? local : local[0] + '***'
    return `${masked}@${domain}`
  }

  // Send OTP for registration
  const handleSendOtp = async () => {
    if (!email) { toast({ title: 'Error', description: 'Masukkan email terlebih dahulu', variant: 'destructive' }); return }
    setOtpLoading(true)
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'register' })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setOtpSent(true)
      setOtpResendTimer(60)
      toast({ title: 'OTP Terkirim!', description: `Kode verifikasi dikirim ke ${maskEmail(email)}` })
      setAuthMode('otp')
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100)
    } catch (err: unknown) {
      toast({ title: 'Gagal', description: err instanceof Error ? err.message : 'Gagal mengirim OTP', variant: 'destructive' })
    } finally { setOtpLoading(false) }
  }

  // Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = otpCode.join('')
    if (code.length !== 6) { toast({ title: 'Error', description: 'Masukkan 6 digit kode OTP', variant: 'destructive' }); return }
    setOtpLoading(true)
    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, type: 'register' })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setOtpVerified(true)
      toast({ title: 'Email Terverifikasi!', description: 'Email Anda berhasil diverifikasi' })
      // Now proceed with registration
      await doRegister()
    } catch (err: unknown) {
      toast({ title: 'Verifikasi Gagal', description: err instanceof Error ? err.message : 'Kode OTP salah', variant: 'destructive' })
      setOtpCode(['', '', '', '', '', ''])
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100)
    } finally { setOtpLoading(false) }
  }

  // Actual registration after OTP verified
  const doRegister = async () => {
    const pinStr = registerPin.join('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password, pin: pinStr, otpVerified: true })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.user?.role === 'admin') {
        localStorage.setItem('adminId', data.user.id)
        localStorage.setItem('adminToken', data.token)
        window.location.href = '/admin'
        return
      }
      login(data.user, data.token)
      toast({ title: 'Registrasi Berhasil!', description: `Selamat datang, ${data.user.name}!` })
    } catch (err: unknown) {
      toast({ title: 'Gagal', description: err instanceof Error ? err.message : 'Terjadi kesalahan', variant: 'destructive' })
    } finally { setLoading(false) }
  }

  // OTP resend timer
  useEffect(() => {
    if (otpResendTimer <= 0) return
    const timer = setTimeout(() => setOtpResendTimer(otpResendTimer - 1), 1000)
    return () => clearTimeout(timer)
  }, [otpResendTimer])

  // Step 1: Login with identifier + password
  const handleLoginStep1 = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!identifier || !password) {
      toast({ title: 'Error', description: 'Mohon isi email/nomor HP dan kata sandi', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.step === 'pin_required') {
        setTempToken(data.tempToken)
        setAuthMode('pin')
        setTimeout(() => pinRefs.current[0]?.focus(), 100)
      } else {
        // Admin direct login (no PIN required for admin)
        if (data.user?.role === 'admin') {
          localStorage.setItem('adminId', data.user.id)
          localStorage.setItem('adminToken', data.token)
          window.location.href = '/admin'
          return
        }
        login(data.user, data.token)
        toast({ title: 'Selamat Datang!', description: `Halo, ${data.user.name}` })
      }
    } catch (err: unknown) {
      toast({ title: 'Gagal', description: err instanceof Error ? err.message : 'Terjadi kesalahan', variant: 'destructive' })
    } finally { setLoading(false) }
  }

  // Step 2: Verify PIN
  const handlePinVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    const pinStr = pin.join('')
    if (pinStr.length !== 6) {
      toast({ title: 'Error', description: 'Masukkan 6 digit PIN', variant: 'destructive' })
      return
    }
    if (!tempToken) {
      toast({ title: 'Error', description: 'Sesi kadaluarsa, silakan login ulang', variant: 'destructive' })
      setAuthMode('login')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, pin: pinStr })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.user?.role === 'admin') {
        localStorage.setItem('adminId', data.user.id)
        localStorage.setItem('adminToken', data.token)
        window.location.href = '/admin'
        return
      }
      login(data.user, data.token)
      toast({ title: 'Selamat Datang!', description: `Halo, ${data.user.name}` })
    } catch (err: unknown) {
      toast({ title: 'PIN Salah', description: err instanceof Error ? err.message : 'Verifikasi PIN gagal', variant: 'destructive' })
      setPin(['', '', '', '', '', ''])
      setTimeout(() => pinRefs.current[0]?.focus(), 100)
    } finally { setLoading(false) }
  }

  // Register - validates fields then sends OTP
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !phone || !password || !confirmPassword) {
      toast({ title: 'Error', description: 'Mohon isi semua field', variant: 'destructive' })
      return
    }
    if (password !== confirmPassword) {
      toast({ title: 'Error', description: 'Kata sandi tidak cocok', variant: 'destructive' })
      return
    }
    if (password.length < 6) {
      toast({ title: 'Error', description: 'Kata sandi minimal 6 karakter', variant: 'destructive' })
      return
    }
    const pinStr = registerPin.join('')
    const confirmPinStr = confirmPin.join('')
    if (pinStr.length !== 6) {
      toast({ title: 'Error', description: 'Masukkan 6 digit PIN', variant: 'destructive' })
      return
    }
    if (pinStr !== confirmPinStr) {
      toast({ title: 'Error', description: 'Konfirmasi PIN tidak cocok', variant: 'destructive' })
      return
    }
    if (!agreeTerms) {
      toast({ title: 'Error', description: 'Anda harus menyetujui proses pendaftaran', variant: 'destructive' })
      return
    }
    // All validations passed — send OTP
    await handleSendOtp()
  }

  const getHeaderText = () => {
    if (authMode === 'pin') return { title: 'Verifikasi PIN', subtitle: 'Masukkan 6 digit PIN keamanan Anda untuk melanjutkan login.' }
    if (authMode === 'otp') return { title: 'Verifikasi Email', subtitle: `Masukkan 6 digit kode OTP yang dikirim ke ${maskEmail(email)}` }
    if (authMode === 'register') return { title: 'Daftar ZEVORIK', subtitle: 'Buat akun investor untuk akses portofolio, trading, dan layanan investor ZEVORIK.' }
    return { title: 'Masuk Investor ZEVORIK', subtitle: 'Akses akun ZEVORIK untuk memantau portofolio, pergerakan saham, dan aktivitas profit.' }
  }
  const headerText = getHeaderText()

  const renderPinInputs = (pinArr: string[], setPinArr: (v: string[]) => void, refs: React.MutableRefObject<(HTMLInputElement | null)[]>) => (
    <div className="flex items-center justify-center gap-2">
      {pinArr.map((digit, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el }}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handlePinChange(i, e.target.value, pinArr, setPinArr, refs)}
          onKeyDown={(e) => handlePinKeyDown(i, e, pinArr, setPinArr, refs)}
          onPaste={(e) => handlePinPaste(e, setPinArr, refs)}
          className="w-11 h-13 rounded-xl bg-slate-50 border-2 border-slate-200 text-center text-[18px] font-black text-slate-900 outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30 transition-all"
        />
      ))}
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: 'linear-gradient(180deg, #eff6ff 0%, #dbeafe 50%, #bfdbfe 100%)' }}>
      {/* Desktop Left Branding Panel */}
      <div className="hidden md:flex md:w-1/2 lg:w-[55%] flex-col items-center justify-center p-8 lg:p-16 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #172554 0%, #1d4ed8 54%, #3b82f6 100%)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.04) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 text-center text-white max-w-lg">
          <div className="mx-auto mb-6">
            <ZevorikLogo size={80} />
          </div>
          <h1 className="text-3xl lg:text-4xl font-black mb-2 tracking-[0.15em]" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #93c5fd 50%, #60a5fa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', textShadow: '0 0 30px rgba(59,130,246,0.5)' }}>ZEVORIK</h1>
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
              <ZevorikLogo size={36} />
              <div>
                <b className="block text-[11px] leading-tight font-black gradient-text tracking-wide">ZEVORIK</b>
                <span className="block text-[7px] font-bold text-[#3b82f6] uppercase tracking-[0.15em]">Pro Platform</span>
              </div>
            </div>
            {authMode !== 'pin' && authMode !== 'otp' && (
              <button
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="h-8 px-4 rounded-xl bg-[#1d4ed8] text-white text-[10px] font-bold hover:bg-[#3b82f6] transition-colors flex items-center gap-1"
              >
                {authMode === 'login' ? <><UserPlus className="w-3 h-3" />Daftar</> : <><LogIn className="w-3 h-3" />Masuk</>}
              </button>
            )}
          </header>

          {/* Desktop switch button */}
          <div className="hidden md:flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <ZevorikLogo size={36} />
              <div>
                <b className="block text-xs leading-tight font-black gradient-text tracking-wide">ZEVORIK</b>
                <span className="block text-[9px] font-bold text-[#3b82f6] uppercase tracking-[0.15em]">Pro Platform</span>
              </div>
            </div>
            {authMode !== 'pin' && authMode !== 'otp' && (
              <button
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="h-9 px-5 rounded-xl bg-[#1d4ed8] text-white text-xs font-bold hover:bg-[#3b82f6] transition-colors flex items-center gap-1.5"
              >
                {authMode === 'login' ? <><UserPlus className="w-3.5 h-3.5" />Daftar</> : <><LogIn className="w-3.5 h-3.5" />Masuk</>}
              </button>
            )}
          </div>

        {/* Main Card */}
        <div className="rounded-3xl bg-white shadow-xl overflow-hidden flex-1 md:flex-none flex flex-col">
          {/* Header Section */}
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
                <ZevorikLogo size={56} />
              </div>

              {authMode === 'pin' ? (
                <>
                  <div className="h-6 px-3 rounded-full bg-green-500/20 border border-green-400/30 flex items-center gap-1.5 mb-2">
                    <Lock className="w-3 h-3 text-green-300" />
                    <span className="text-[8px] font-black text-green-300 tracking-wide">VERIFIKASI PIN</span>
                  </div>
                  <h1 className="text-[18px] font-black text-center leading-tight">{headerText.title}</h1>
                  <p className="max-w-[280px] mt-1.5 text-[9px] text-center font-medium text-blue-200 leading-relaxed">{headerText.subtitle}</p>
                </>
              ) : authMode === 'otp' ? (
                <>
                  <div className="h-6 px-3 rounded-full bg-cyan-500/20 border border-cyan-400/30 flex items-center gap-1.5 mb-2">
                    <Mail className="w-3 h-3 text-cyan-300" />
                    <span className="text-[8px] font-black text-cyan-300 tracking-wide">VERIFIKASI EMAIL</span>
                  </div>
                  <h1 className="text-[18px] font-black text-center leading-tight">{headerText.title}</h1>
                  <p className="max-w-[280px] mt-1.5 text-[9px] text-center font-medium text-blue-200 leading-relaxed">{headerText.subtitle}</p>
                </>
              ) : authMode === 'register' ? (
                <>
                  <div className="h-6 px-3 rounded-full bg-yellow-500/20 border border-yellow-400/30 flex items-center gap-1.5 mb-2">
                    <Shield className="w-3 h-3 text-yellow-300" />
                    <span className="text-[8px] font-black text-yellow-300 tracking-wide">REGISTRASI INVESTOR</span>
                  </div>
                  <h1 className="text-[18px] font-black text-center leading-tight">{headerText.title}</h1>
                  <p className="max-w-[280px] mt-1.5 text-[9px] text-center font-medium text-blue-200 leading-relaxed">{headerText.subtitle}</p>
                </>
              ) : (
                <>
                  <h1 className="text-[18px] font-black text-center leading-tight">{headerText.title}</h1>
                  <p className="max-w-[280px] mt-1.5 text-[9px] text-center font-medium text-blue-200 leading-relaxed">{headerText.subtitle}</p>
                </>
              )}

              {/* Stat Boxes */}
              <div className="mt-3 grid grid-cols-3 gap-2 w-full">
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
                  <Shield className="w-4 h-4 text-yellow-300 mx-auto mb-0.5" />
                  <b className="block text-[8px] font-black">Aman</b>
                  <span className="block text-[7px] text-blue-200 font-bold">Terjamin</span>
                </div>
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

            {/* ===== PIN VERIFICATION MODE ===== */}
            {authMode === 'pin' && (
              <form onSubmit={handlePinVerify} className="flex flex-col gap-4 flex-1">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Lock className="w-5 h-5 text-[#3b82f6]" />
                  <span className="text-[11px] font-black text-[#3b82f6] uppercase tracking-widest">Masukkan PIN Keamanan</span>
                </div>
                {renderPinInputs(pin, setPin, pinRefs)}
                <p className="text-center text-[9px] font-semibold text-slate-400">Masukkan 6 digit PIN yang Anda buat saat registrasi</p>
                <button type="submit" disabled={loading}
                  className="w-full h-12 rounded-2xl overflow-hidden relative text-white text-[12px] font-black tracking-widest uppercase flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-70"
                  style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)' }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-shimmer" />
                  <span className="relative z-10 flex items-center gap-2">
                    {loading ? <div className="w-5 h-5 rounded-full border-[3px] border-white/30 border-t-white animate-spin" /> : <><Shield className="w-4 h-4" />VERIFIKASI PIN</>}
                  </span>
                </button>
                <button type="button" onClick={() => { setAuthMode('login'); setPin(['', '', '', '', '', '']); setTempToken(null); }}
                  className="text-center text-[10px] font-bold text-slate-500 hover:text-[#3b82f6] transition-colors">
                  ← Kembali ke Login
                </button>
              </form>
            )}

            {/* ===== OTP VERIFICATION MODE ===== */}
            {authMode === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4 flex-1">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Mail className="w-5 h-5 text-cyan-500" />
                  <span className="text-[11px] font-black text-cyan-500 uppercase tracking-widest">Kode OTP</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  {otpCode.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { otpInputRefs.current[i] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => {
                        if (!/^\d*$/.test(e.target.value)) return
                        const newOtp = [...otpCode]
                        newOtp[i] = e.target.value.slice(-1)
                        setOtpCode(newOtp)
                        if (e.target.value && i < 5) otpInputRefs.current[i + 1]?.focus()
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !otpCode[i] && i > 0) otpInputRefs.current[i - 1]?.focus()
                      }}
                      onPaste={(e) => {
                        e.preventDefault()
                        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
                        const newOtp = [...Array(6)].map((_, idx) => pasted[idx] || '')
                        setOtpCode(newOtp)
                        const nextIdx = Math.min(pasted.length, 5)
                        otpInputRefs.current[nextIdx]?.focus()
                      }}
                      className="w-11 h-13 rounded-xl bg-slate-50 border-2 border-slate-200 text-center text-[18px] font-black text-slate-900 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                    />
                  ))}
                </div>
                <p className="text-center text-[9px] font-semibold text-slate-400">
                  Kode OTP 6 digit dikirim ke <span className="font-black text-cyan-600">{maskEmail(email)}</span>
                </p>
                <button type="submit" disabled={otpLoading || otpCode.join('').length !== 6}
                  className="w-full h-12 rounded-2xl overflow-hidden relative text-white text-[12px] font-black tracking-widest uppercase flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-70"
                  style={{ background: 'linear-gradient(135deg, #0e7490 0%, #06b6d4 50%, #22d3ee 100%)' }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-shimmer" />
                  <span className="relative z-10 flex items-center gap-2">
                    {otpLoading ? <div className="w-5 h-5 rounded-full border-[3px] border-white/30 border-t-white animate-spin" /> : <><Mail className="w-4 h-4" />VERIFIKASI OTP</>}
                  </span>
                </button>
                <div className="flex items-center justify-center gap-2">
                  <button type="button" onClick={() => { setAuthMode('register'); setOtpCode(['', '', '', '', '', '']); }}
                    className="text-[10px] font-bold text-slate-500 hover:text-[#3b82f6] transition-colors">
                    ← Kembali ke Daftar
                  </button>
                  <span className="text-slate-300">|</span>
                  {otpResendTimer > 0 ? (
                    <span className="text-[10px] font-bold text-slate-400">Kirim ulang ({otpResendTimer}s)</span>
                  ) : (
                    <button type="button" onClick={handleSendOtp} disabled={otpLoading}
                      className="text-[10px] font-bold text-[#3b82f6] hover:underline disabled:opacity-50">
                      Kirim Ulang OTP
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* ===== LOGIN MODE ===== */}
            {authMode === 'login' && (
              <form onSubmit={handleLoginStep1} className="flex flex-col gap-3 flex-1">
                {/* Email/Phone */}
                <div>
                  <label className="flex items-center gap-1.5 mb-1.5 text-[9px] font-black text-[#3b82f6] uppercase tracking-widest">
                    <Mail className="w-3 h-3 text-[#3b82f6]" /> EMAIL / NOMOR WHATSAPP
                  </label>
                  <div className="flex items-center h-11 rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden focus-within:border-[#3b82f6] focus-within:ring-1 focus-within:ring-[#3b82f6]/30 transition-all">
                    <div className="h-full px-3 flex items-center bg-[#1d4ed8] text-white border-r border-slate-200">
                      <User className="w-4 h-4" />
                    </div>
                    <input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="email@contoh.com atau 81234567890"
                      className="flex-1 h-full bg-transparent px-3 text-[13px] font-semibold text-slate-900 outline-none placeholder:text-gray-400" />
                  </div>
                </div>

                {/* Password */}
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

                {/* Submit */}
                <button type="submit" disabled={loading}
                  className="w-full h-12 rounded-2xl overflow-hidden relative text-white text-[12px] font-black tracking-widest uppercase flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-70"
                  style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)' }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-shimmer" />
                  <span className="relative z-10 flex items-center gap-2">
                    {loading ? <div className="w-5 h-5 rounded-full border-[3px] border-white/30 border-t-white animate-spin" /> : <>MASUK SEKARANG <ArrowRight className="w-4 h-4" /></>}
                  </span>
                </button>

                <p className="text-center text-[10px] font-semibold text-slate-500">
                  Belum punya akun? <span className="text-[#3b82f6] font-black cursor-pointer hover:underline" onClick={() => setAuthMode('register')}>Daftar ZEVORIK</span>
                </p>
              </form>
            )}

            {/* ===== REGISTER MODE ===== */}
            {authMode === 'register' && (
              <form onSubmit={handleRegister} className="flex flex-col gap-3 flex-1">
                {/* Nama Lengkap */}
                <div>
                  <label className="flex items-center gap-1.5 mb-1.5 text-[9px] font-black text-[#3b82f6] uppercase tracking-widest">
                    <User className="w-3 h-3 text-[#3b82f6]" /> NAMA LENGKAP
                  </label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Masukkan nama lengkap"
                    className="w-full h-11 rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[13px] font-semibold text-slate-900 outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30 transition-all placeholder:text-gray-400" />
                </div>

                {/* Email */}
                <div>
                  <label className="flex items-center gap-1.5 mb-1.5 text-[9px] font-black text-[#3b82f6] uppercase tracking-widest">
                    <Mail className="w-3 h-3 text-[#3b82f6]" /> EMAIL
                  </label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@contoh.com"
                    className="w-full h-11 rounded-2xl bg-slate-50 border border-slate-200 px-4 text-[13px] font-semibold text-slate-900 outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30 transition-all placeholder:text-gray-400" />
                </div>

                {/* Phone */}
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

                {/* Password */}
                <div>
                  <label className="flex items-center gap-1.5 mb-1.5 text-[9px] font-black text-[#3b82f6] uppercase tracking-widest">
                    <Lock className="w-3 h-3 text-[#3b82f6]" /> KATA SANDI
                  </label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimal 6 karakter"
                      className="w-full h-11 rounded-2xl bg-slate-50 border border-slate-200 px-4 pr-16 text-[13px] font-semibold text-slate-900 outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30 transition-all placeholder:text-gray-400" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-[#3b82f6] hover:text-[#1d4ed8] transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
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

                {/* PIN */}
                <div>
                  <label className="flex items-center gap-1.5 mb-2 text-[9px] font-black text-[#3b82f6] uppercase tracking-widest">
                    <Shield className="w-3 h-3 text-[#3b82f6]" /> PIN KEAMANAN (6 DIGIT)
                  </label>
                  {renderPinInputs(registerPin, setRegisterPin, registerPinRefs)}
                </div>

                {/* Confirm PIN */}
                <div>
                  <label className="flex items-center gap-1.5 mb-2 text-[9px] font-black text-[#3b82f6] uppercase tracking-widest">
                    <Shield className="w-3 h-3 text-[#3b82f6]" /> KONFIRMASI PIN
                  </label>
                  {renderPinInputs(confirmPin, setConfirmPin, confirmPinRefs)}
                </div>

                {/* Terms */}
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#3b82f6] mt-0.5" />
                  <span className="text-[9px] font-semibold text-slate-500 leading-relaxed">
                    Saya menyetujui proses pendaftaran dan memahami keamanan akun ZEVORIK.
                  </span>
                </label>

                {/* Submit */}
                <button type="submit" disabled={loading}
                  className="w-full h-12 rounded-2xl overflow-hidden relative text-white text-[12px] font-black tracking-widest uppercase flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-70"
                  style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)' }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-shimmer" />
                  <span className="relative z-10 flex items-center gap-2">
                    {loading ? <div className="w-5 h-5 rounded-full border-[3px] border-white/30 border-t-white animate-spin" /> : <>DAFTAR SEKARANG <ArrowRight className="w-4 h-4" /></>}
                  </span>
                </button>

                <p className="text-center text-[10px] font-semibold text-slate-500">
                  Sudah punya akun? <span className="text-[#3b82f6] font-black cursor-pointer hover:underline" onClick={() => setAuthMode('login')}>Masuk ZEVORIK</span>
                </p>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-3 pb-2">
          <div className="text-center mb-2">
            <b className="block text-[9px] md:text-[10px] font-black text-[#1d4ed8]">Legalitas Perusahaan</b>
            <span className="block mt-0.5 text-[8px] md:text-[9px] font-semibold text-slate-500">Halaman resmi ZEVORIK</span>
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
// ── MT5 Indicator Definitions ──
const ALL_INDICATORS = [
  // TREND
  { key: 'adx', label: 'ADX', color: '#f97316', group: 'Trend', desc: 'Directional Movement' },
  { key: 'bollinger', label: 'Bollinger Bands', color: '#8b5cf6', group: 'Trend', desc: 'BB (20,2)' },
  { key: 'envelopes', label: 'Envelopes', color: '#14b8a6', group: 'Trend', desc: 'Env (20,5%)' },
  { key: 'ichimoku', label: 'Ichimoku', color: '#eab308', group: 'Trend', desc: 'Kinko Hyo' },
  { key: 'ma5', label: 'MA 5', color: '#eab308', group: 'Trend', desc: 'Moving Average 5' },
  { key: 'ma20', label: 'MA 20', color: '#06b6d4', group: 'Trend', desc: 'Moving Average 20' },
  { key: 'sar', label: 'Parabolic SAR', color: '#22c55e', group: 'Trend', desc: 'Stop & Reverse' },
  { key: 'stddev', label: 'Std Deviation', color: '#ec4899', group: 'Trend', desc: 'Volatility' },
  { key: 'zigzag', label: 'ZigZag', color: '#a855f7', group: 'Trend', desc: 'Pattern Filter' },
  // OSCILLATOR
  { key: 'atr', label: 'ATR', color: '#f97316', group: 'Oscillator', desc: 'Avg True Range' },
  { key: 'bears', label: 'Bears Power', color: '#ef4444', group: 'Oscillator', desc: 'Seller Strength' },
  { key: 'bulls', label: 'Bulls Power', color: '#22c55e', group: 'Oscillator', desc: 'Buyer Strength' },
  { key: 'cci', label: 'CCI', color: '#06b6d4', group: 'Oscillator', desc: 'Commodity Channel' },
  { key: 'demarker', label: 'DeMarker', color: '#8b5cf6', group: 'Oscillator', desc: 'Reversal Risk' },
  { key: 'force', label: 'Force Index', color: '#3b82f6', group: 'Oscillator', desc: 'Price × Volume' },
  { key: 'macd', label: 'MACD', color: '#3b82f6', group: 'Oscillator', desc: 'MACD (12,26,9)' },
  { key: 'momentum', label: 'Momentum', color: '#f59e0b', group: 'Oscillator', desc: 'Rate of Change' },
  { key: 'osma', label: 'OsMA', color: '#6366f1', group: 'Oscillator', desc: 'MA of Oscillator' },
  { key: 'rsi', label: 'RSI', color: '#f59e0b', group: 'Oscillator', desc: 'Relative Strength' },
  { key: 'rvi', label: 'RVI', color: '#14b8a6', group: 'Oscillator', desc: 'Relative Vigor' },
  { key: 'stochastic', label: 'Stochastic', color: '#ec4899', group: 'Oscillator', desc: 'Stoch (5,3)' },
  { key: 'williamsr', label: "Williams'%R", color: '#a855f7', group: 'Oscillator', desc: 'Percent Range' },
  // VOLUME
  { key: 'ad', label: 'A/D', color: '#3b82f6', group: 'Volume', desc: 'Accumulation/Dist' },
  { key: 'mfi', label: 'MFI', color: '#8b5cf6', group: 'Volume', desc: 'Money Flow Index' },
  { key: 'obv', label: 'OBV', color: '#f59e0b', group: 'Volume', desc: 'On Balance Volume' },
  { key: 'volumes', label: 'Volumes', color: '#06b6d4', group: 'Volume', desc: 'Trade Volume' },
  // BILL WILLIAMS
  { key: 'ac', label: 'Accelerator', color: '#ef4444', group: 'Bill Williams', desc: 'AC Oscillator' },
  { key: 'alligator', label: 'Alligator', color: '#22c55e', group: 'Bill Williams', desc: 'Jaw/Teeth/Lips' },
  { key: 'ao', label: 'Awesome AO', color: '#3b82f6', group: 'Bill Williams', desc: 'AO Oscillator' },
  { key: 'fractals', label: 'Fractals', color: '#f59e0b', group: 'Bill Williams', desc: 'Peak/Valley' },
  { key: 'gator', label: 'Gator', color: '#14b8a6', group: 'Bill Williams', desc: 'Gator Oscillator' },
  { key: 'bwMFI', label: 'BW MFI', color: '#ec4899', group: 'Bill Williams', desc: 'Mkt Facilitation' },
]

const OVERLAY_KEYS = ['ma5', 'ma20', 'bollinger', 'envelopes', 'ichimoku', 'sar', 'zigzag', 'alligator', 'fractals']
const SUBCHART_KEYS = ['adx', 'atr', 'bears', 'bulls', 'cci', 'demarker', 'force', 'macd', 'momentum', 'osma', 'rsi', 'rvi', 'stochastic', 'williamsr', 'ad', 'mfi', 'obv', 'volumes', 'ac', 'ao', 'gator', 'bwMFI', 'stddev']

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
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [deposits, setDeposits] = useState<DepositItem[]>([])
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([])
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([])


  const [activeTab, setActiveTab] = useState<string>('home')
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null)
  const [showStockDetail, setShowStockDetail] = useState(false)

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

  // ============ WITHDRAW OTP STATE ============
  const [withdrawOtpSent, setWithdrawOtpSent] = useState(false)
  const [withdrawOtpCode, setWithdrawOtpCode] = useState(['', '', '', '', '', ''])
  const [withdrawOtpVerified, setWithdrawOtpVerified] = useState(false)
  const [withdrawOtpLoading, setWithdrawOtpLoading] = useState(false)
  const [withdrawOtpTimer, setWithdrawOtpTimer] = useState(0)
  const withdrawOtpRefs = useRef<(HTMLInputElement | null)[]>([])

  // ============ CONTRACT STATE ============
  const [contractModal, setContractModal] = useState(false)
  const [contractAmount, setContractAmount] = useState('')
  const [contractDuration, setContractDuration] = useState(30)
  const [contractLoading, setContractLoading] = useState(false)
  const [contractClaimLoadingId, setContractClaimLoadingId] = useState<string | null>(null)

  // Withdraw OTP timer
  useEffect(() => {
    if (withdrawOtpTimer <= 0) return
    const timer = setTimeout(() => setWithdrawOtpTimer(withdrawOtpTimer - 1), 1000)
    return () => clearTimeout(timer)
  }, [withdrawOtpTimer])


  const [profileEdit, setProfileEdit] = useState(false)
  const [profileForm, setProfileForm] = useState({ name: '', email: '', bankName: '', bankAccount: '', bankHolder: '' })

  const [copied, setCopied] = useState(false)
  const [txFilter, setTxFilter] = useState('all')
  const [showSideMenu, setShowSideMenu] = useState(false)
  const [showBalance, setShowBalance] = useState(true)

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
        setBannerIndex(prev => (prev + 1) % 3)
      }, 4000)
    }
    startTimer()
    return () => { if (bannerTimerRef.current) clearInterval(bannerTimerRef.current) }
  }, [])

  // ============ EXTRA MODALS STATE ============
  const [showKycModal, setShowKycModal] = useState(false)
  const [kycForm, setKycForm] = useState({ fullName: '', idNumber: '', address: '', occupation: '', incomeRange: '' })
  const [kycKtpFile, setKycKtpFile] = useState<File | null>(null)
  const [kycSelfieFile, setKycSelfieFile] = useState<File | null>(null)
  const [kycBankFile, setKycBankFile] = useState<File | null>(null)
  const [kycAdditionalFile, setKycAdditionalFile] = useState<File | null>(null)
  const [kycSubmitting, setKycSubmitting] = useState(false)
  const [kycRecord, setKycRecord] = useState<any>(null)
  const [showCsModal, setShowCsModal] = useState(false)
  const [showAboutModal, setShowAboutModal] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)

  // ============ SINYAL PRO STATE ============
  const [sinyalPositions, setSinyalPositions] = useState<{
    id: string; stockId: string; stockCode: string; stockName: string;
    direction: 'NAIK' | 'TURUN'; amount: number; duration: number;
    startPrice: number; startTime: number; profitPercent: number;
    status: 'active' | 'won' | 'lost'; leverage: number; closedPL?: number;
    fee?: number; workingCapital?: number;
  }[]>([])
  const [sinyalDirection, setSinyalDirection] = useState<'NAIK' | 'TURUN'>('NAIK')
  const [sinyalAmount, setSinyalAmount] = useState('')
  const [sinyalLots, setSinyalLots] = useState<string>('0.10')
  const LOT_SIZE = 100000 // 1 Lot = Rp 100,000
  const sinyalAmountFromLots = Math.round(parseFloat(sinyalLots || '0') * LOT_SIZE)
  const [sinyalLeverage, setSinyalLeverage] = useState<number>(1000)
  const [showConfirmTrade, setShowConfirmTrade] = useState(false)
  const [confirmTradeDir, setConfirmTradeDir] = useState<'NAIK' | 'TURUN'>('NAIK')
  const [sinyalCategory, setSinyalCategory] = useState<string>('popular')
  const [marketSignalTab, setMarketSignalTab] = useState<string>('favorit')
  const [marketFavFilter, setMarketFavFilter] = useState<string>('semua')
  const [marketRegionFilter, setMarketRegionFilter] = useState<string>('semua')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [marketSearchQuery, setMarketSearchQuery] = useState<string>('')
  const [marketPage, setMarketPage] = useState<number>(1)
  const MARKET_PAGE_SIZE = 50
  const [sinyalHistoryFilter, setSinyalHistoryFilter] = useState<string>('Semua')
  const [saldoSubTab, setSaldoSubTab] = useState<'posisi' | 'riwayat' | 'order'>('posisi')
  const [sinyalTerminalTab, setSinyalTerminalTab] = useState<'trade' | 'history'>('trade')
  const [stopLossPrice, setStopLossPrice] = useState('')
  const [takeProfitPrice, setTakeProfitPrice] = useState('')
  const [selectedSinyalStock, setSelectedSinyalStock] = useState<Stock | null>(null)
  const [sinyalResults, setSinyalResults] = useState<{id: string; won: boolean; profit: number; stockCode: string; direction: 'NAIK' | 'TURUN'; amount: number; shownAt?: number}[]>([])
  // Track remaining time per position
  const [sinyalTimers, setSinyalTimers] = useState<Record<string, number>>({})


  // Sinyal Pro live candlestick chart
  const [sinyalCandles, setSinyalCandles] = useState<CandleData[]>([])
  const [sinyalCurrentPrice, setSinyalCurrentPrice] = useState(0)
  const [sinyalChartTick, setSinyalChartTick] = useState(0)
  const [sinyalCrosshair, setSinyalCrosshair] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  // Timeframe: each candle duration = trade duration
  const [sinyalTimeframe, setSinyalTimeframe] = useState<'1m' | '2m' | '5m' | '10m' | '15m' | '30m' | '1h'>('1m')
  const [showTimeframeMenu, setShowTimeframeMenu] = useState(false)
  const [showLeverageMenu, setShowLeverageMenu] = useState(false)
  // Chart toolbar: type, crosshair mode, indicators
  const [chartType, setChartType] = useState<'candle' | 'line' | 'bar'>('candle')
  const [crosshairMode, setCrosshairMode] = useState(false)
  const [showIndicatorMenu, setShowIndicatorMenu] = useState(false)
  const [activeIndicators, setActiveIndicators] = useState<{ key: string; label: string; color: string }[]>([
    { key: 'ma5', label: 'MA5', color: '#eab308' },
    { key: 'ma20', label: 'MA20', color: '#06b6d4' },
  ])
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

  // Generate a single realistic OHLC candle from previous close
  // Uses a structured approach: first determine the candle's direction & body,
  // then add realistic wicks based on intra-candle price action simulation
  const generateCandle = useCallback((prevClose: number, baseVal: number, sim: {momentum: number; trend: number; phase: number; phaseLen: number; vol: number}, idx: number): CandleData => {
    // ── Phase Management (longer phases for realistic trends) ──
    // 0 = consolidation/ranging, 1 = trending, 2 = breakout/volatile
    sim.phaseLen -= 1
    if (sim.phaseLen <= 0) {
      const r = Math.random()
      if (r < 0.30) {
        // Consolidation — price chops sideways in a range
        sim.phase = 0
        sim.phaseLen = Math.floor(8 + Math.random() * 18) // 8-25 candles of ranging
      } else if (r < 0.82) {
        // Trending — sustained directional move (most common in real markets)
        sim.phase = 1
        sim.phaseLen = Math.floor(12 + Math.random() * 30) // 12-41 candles of trend
        // 65% continue existing trend, 35% reverse
        if (Math.random() < 0.35) sim.trend = (sim.trend === 1 ? -1 : 1) as 1 | -1
      } else {
        // Breakout — volatile expansion after consolidation
        sim.phase = 2
        sim.phaseLen = Math.floor(3 + Math.random() * 6) // 3-8 volatile candles
        sim.trend = Math.random() > 0.5 ? 1 : -1
      }
    }

    // ── Core Price Movement Engine ──
    const open = prevClose

    // Volatility scales with phase — trending markets have moderate vol,
    // consolidation has low vol, breakouts have high vol
    const baseVol = baseVal * 0.0012
    const phaseVol = sim.phase === 0 ? 0.5 : sim.phase === 1 ? 1.0 : 2.2
    const volatility = baseVol * phaseVol

    // Trend drift — the directional force
    let drift: number
    if (sim.phase === 1) {
      // Strong trend: consistent directional bias
      drift = sim.trend * baseVal * 0.0022
      // Small pullback within trend (~20% of candles pull back against trend)
      if (Math.random() < 0.18) {
        drift = -sim.trend * baseVal * 0.0008
      }
    } else if (sim.phase === 2) {
      // Breakout: strong directional move with high vol
      drift = sim.trend * baseVal * 0.0035
    } else {
      // Consolidation: very small random drift, mostly noise
      drift = (Math.random() - 0.5) * baseVal * 0.0004
    }

    // Momentum with HIGH persistence — this is key to realistic consecutive candles
    // Higher persistence (0.90) = trends continue smoothly
    sim.momentum = sim.momentum * 0.90 + drift * 0.35 + (Math.random() - 0.5) * volatility

    // Weak mean reversion — prevents price from drifting too far from base
    const meanRevert = (baseVal - prevClose) * 0.0008

    const rawClose = prevClose + sim.momentum + meanRevert
    const close = Math.round(Math.max(baseVal * 0.85, Math.min(baseVal * 1.15, rawClose)))
    const bodySize = Math.abs(close - open)
    const isBullish = close >= open

    // ── Realistic Wick Generation ──
    // Simulate intra-candle price action to generate wicks
    // In real markets: trending candles have wicks opposite to trend direction
    // Consolidation candles have balanced wicks
    let upperWick: number, lowerWick: number

    if (sim.phase === 1) {
      // Trending phase: wick mainly on the RETREAT side
      if (isBullish) {
        // Bullish trend candle: small upper wick, moderate lower wick (rejection of lows)
        upperWick = bodySize * (0.1 + Math.random() * 0.4) + baseVal * 0.00015
        lowerWick = bodySize * (0.3 + Math.random() * 0.8) + baseVal * 0.0003
      } else {
        // Bearish trend candle: moderate upper wick (rejection of highs), small lower wick
        upperWick = bodySize * (0.3 + Math.random() * 0.8) + baseVal * 0.0003
        lowerWick = bodySize * (0.1 + Math.random() * 0.4) + baseVal * 0.00015
      }
    } else if (sim.phase === 2) {
      // Breakout: longer wicks on both sides (volatility)
      upperWick = bodySize * (0.4 + Math.random() * 1.0) + baseVal * 0.0005
      lowerWick = bodySize * (0.4 + Math.random() * 1.0) + baseVal * 0.0005
    } else {
      // Consolidation: balanced wicks, often long relative to body
      upperWick = bodySize * (0.4 + Math.random() * 1.2) + baseVal * 0.0004
      lowerWick = bodySize * (0.4 + Math.random() * 1.2) + baseVal * 0.0004
    }

    // Special patterns (infrequent, like real markets)
    const patternRoll = Math.random()
    if (patternRoll < 0.04 && bodySize < baseVal * 0.0003) {
      // Doji: very small body, moderate wicks
      upperWick = baseVal * (0.0008 + Math.random() * 0.0015)
      lowerWick = baseVal * (0.0008 + Math.random() * 0.0015)
    } else if (patternRoll < 0.07 && isBullish) {
      // Hammer: long lower wick, small upper wick
      lowerWick = bodySize * (2.0 + Math.random() * 2.5) + baseVal * 0.0005
      upperWick = bodySize * (0.05 + Math.random() * 0.2)
    } else if (patternRoll < 0.10 && !isBullish) {
      // Shooting star: long upper wick, small lower wick
      upperWick = bodySize * (2.0 + Math.random() * 2.5) + baseVal * 0.0005
      lowerWick = bodySize * (0.05 + Math.random() * 0.2)
    }

    const high = Math.max(open, close) + Math.round(upperWick)
    const low = Math.min(open, close) - Math.round(lowerWick)

    // Volume correlates with phase and candle size
    const simBaseVol = sim.vol
    const volMultiplier = sim.phase === 2 ? 2.2 : sim.phase === 1 ? 1.2 : 0.6
    const bodyRatio = bodySize / baseVal
    const volume = Math.round(simBaseVol * volMultiplier * (0.6 + Math.random() * 0.8 + bodyRatio * 15))

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

  // Bollinger Bands (20,2)
  const computeBollinger = useCallback((data: CandleData[]): { upper: (number | null)[]; middle: (number | null)[]; lower: (number | null)[] } => {
    const ma20 = computeMA(data, 20)
    const upper: (number | null)[] = []
    const lower: (number | null)[] = []
    data.forEach((_, i) => {
      if (ma20[i] === null) { upper.push(null); lower.push(null); return }
      let sumSq = 0
      for (let j = i - 19; j <= i; j++) sumSq += (data[j].close - ma20[i]!) ** 2
      const std = Math.sqrt(sumSq / 20)
      upper.push(ma20[i]! + 2 * std)
      lower.push(ma20[i]! - 2 * std)
    })
    return { upper, middle: ma20, lower }
  }, [computeMA])

  // RSI (14)
  const computeRSI = useCallback((data: CandleData[], period = 14): (number | null)[] => {
    const result: (number | null)[] = []
    if (data.length < period + 1) return data.map(() => null)
    let avgGain = 0, avgLoss = 0
    for (let i = 1; i <= period; i++) {
      const change = data[i].close - data[i - 1].close
      if (change > 0) avgGain += change; else avgLoss += Math.abs(change)
    }
    avgGain /= period; avgLoss /= period
    for (let i = 0; i < period; i++) result.push(null)
    result.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss))
    for (let i = period + 1; i < data.length; i++) {
      const change = data[i].close - data[i - 1].close
      avgGain = (avgGain * (period - 1) + (change > 0 ? change : 0)) / period
      avgLoss = (avgLoss * (period - 1) + (change < 0 ? Math.abs(change) : 0)) / period
      result.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss))
    }
    return result
  }, [])

  // MACD (12,26,9)
  const computeMACD = useCallback((data: CandleData[]): { macd: (number | null)[]; signal: (number | null)[]; histogram: (number | null)[] } => {
    const ema = (arr: number[], p: number): number[] => {
      const k = 2 / (p + 1)
      const res: number[] = [arr[0]]
      for (let i = 1; i < arr.length; i++) res.push(arr[i] * k + res[i - 1] * (1 - k))
      return res
    }
    const closes = data.map(d => d.close)
    const ema12 = ema(closes, 12)
    const ema26 = ema(closes, 26)
    const macdLine = ema12.map((v, i) => i >= 25 ? v - ema26[i] : 0)
    const signalLine = ema(macdLine.slice(25), 9)
    const macd: (number | null)[] = macdLine.map((v, i) => i >= 25 ? v : null)
    const signal: (number | null)[] = macdLine.map((_, i) => i >= 25 ? (signalLine[i - 25] ?? null) : null)
    const histogram: (number | null)[] = macd.map((v, i) => v !== null && signal[i] !== null ? v - signal[i]! : null)
    return { macd, signal, histogram }
  }, [])

  // ── TREND INDICATORS ──

  // ADX (Average Directional Movement Index) - period 14
  const computeADX = useCallback((data: CandleData[], period = 14) => {
    if (data.length < period * 2) return { adx: data.map(() => null) as (number | null)[], plusDI: data.map(() => null) as (number | null)[], minusDI: data.map(() => null) as (number | null)[] }
    const plusDM: number[] = [], minusDM: number[] = [], tr: number[] = []
    for (let i = 1; i < data.length; i++) {
      const highDiff = data[i].high - data[i-1].high
      const lowDiff = data[i-1].low - data[i].low
      plusDM.push(highDiff > lowDiff && highDiff > 0 ? highDiff : 0)
      minusDM.push(lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0)
      tr.push(Math.max(data[i].high - data[i].low, Math.abs(data[i].high - data[i-1].close), Math.abs(data[i].low - data[i-1].close)))
    }
    const smooth = (arr: number[], p: number) => {
      const res: number[] = [arr.slice(0, p).reduce((a,b) => a+b, 0)]
      for (let i = p; i < arr.length; i++) res.push(res[i-p] - res[i-p]/p + arr[i])
      return res
    }
    const smoothTR = smooth(tr, period), smoothPDM = smooth(plusDM, period), smoothMDM = smooth(minusDM, period)
    const plusDI = smoothPDM.map((v, i) => smoothTR[i] > 0 ? (v / smoothTR[i]) * 100 : 0)
    const minusDI = smoothMDM.map((v, i) => smoothTR[i] > 0 ? (v / smoothTR[i]) * 100 : 0)
    const dx = plusDI.map((v, i) => v + minusDI[i] > 0 ? Math.abs(v - minusDI[i]) / (v + minusDI[i]) * 100 : 0)
    const adx: (number | null)[] = [null]
    let adxVal = dx.slice(0, period).reduce((a,b) => a+b, 0) / period
    adx.push(adxVal)
    for (let i = period; i < dx.length; i++) {
      adxVal = (adxVal * (period - 1) + dx[i]) / period
      adx.push(adxVal)
    }
    while (adx.length < data.length) adx.unshift(null)
    while (plusDI.length < data.length) plusDI.unshift(0)
    while (minusDI.length < data.length) minusDI.unshift(0)
    return { adx, plusDI: plusDI.map(v => v as number | null), minusDI: minusDI.map(v => v as number | null) }
  }, [])

  // Envelopes (20, 0.05)
  const computeEnvelopes = useCallback((data: CandleData[], period = 20, pct = 0.05) => {
    const ma = computeMA(data, period)
    return {
      upper: ma.map(v => v !== null ? v * (1 + pct) : null),
      middle: ma,
      lower: ma.map(v => v !== null ? v * (1 - pct) : null),
    }
  }, [computeMA])

  // Ichimoku Kinko Hyo (9, 26, 52)
  const computeIchimoku = useCallback((data: CandleData[]) => {
    const periodHigh = (d: CandleData[], start: number, len: number) => {
      let h = -Infinity
      for (let i = Math.max(0, start); i <= Math.min(d.length-1, start+len-1); i++) h = Math.max(h, d[i].high)
      return h
    }
    const periodLow = (d: CandleData[], start: number, len: number) => {
      let l = Infinity
      for (let i = Math.max(0, start); i <= Math.min(d.length-1, start+len-1); i++) l = Math.min(l, d[i].low)
      return l
    }
    const tenkan = data.map((_, i) => i < 8 ? null : (periodHigh(data, i-8, 9) + periodLow(data, i-8, 9)) / 2)
    const kijun = data.map((_, i) => i < 25 ? null : (periodHigh(data, i-25, 26) + periodLow(data, i-25, 26)) / 2)
    const senkouA = data.map((_, i) => i < 25 ? null : (tenkan[i] !== null && kijun[i] !== null ? (tenkan[i]! + kijun[i]!) / 2 : null))
    const senkouB = data.map((_, i) => i < 51 ? null : (periodHigh(data, i-51, 52) + periodLow(data, i-51, 52)) / 2)
    const chikou = data.map((_, i) => i + 26 < data.length ? data[i+26].close : null)
    return { tenkan, kijun, senkouA, senkouB, chikou }
  }, [])

  // Parabolic SAR
  const computeSAR = useCallback((data: CandleData[], step = 0.02, max = 0.2) => {
    if (data.length < 2) return data.map(() => null)
    const result: (number | null)[] = [null]
    let isLong = data[1].close > data[0].close
    let af = step
    let ep = isLong ? data[0].high : data[0].low
    let sar = isLong ? data[0].low : data[0].high
    for (let i = 1; i < data.length; i++) {
      sar = sar + af * (ep - sar)
      if (isLong) {
        if (i >= 2) sar = Math.min(sar, data[i-1].low, data[i-2].low)
        if (data[i].low < sar) { isLong = false; sar = ep; ep = data[i].low; af = step }
        else { if (data[i].high > ep) { ep = data[i].high; af = Math.min(af + step, max) } }
      } else {
        if (i >= 2) sar = Math.max(sar, data[i-1].high, data[i-2].high)
        if (data[i].high > sar) { isLong = true; sar = ep; ep = data[i].high; af = step }
        else { if (data[i].low < ep) { ep = data[i].low; af = Math.min(af + step, max) } }
      }
      result.push(sar)
    }
    return result
  }, [])

  // Standard Deviation
  const computeStdDev = useCallback((data: CandleData[], period = 20) => {
    const ma = computeMA(data, period)
    return data.map((_, i) => {
      if (ma[i] === null) return null
      let sumSq = 0
      for (let j = i - period + 1; j <= i; j++) sumSq += (data[j].close - ma[i]!) ** 2
      return Math.sqrt(sumSq / period)
    })
  }, [computeMA])

  // ZigZag (deviation 5%)
  const computeZigZag = useCallback((data: CandleData[], deviation = 5) => {
    if (data.length < 3) return data.map(() => null)
    const points: { idx: number; price: number; isHigh: boolean }[] = []
    let lastHigh = { idx: 0, price: data[0].high }, lastLow = { idx: 0, price: data[0].low }
    let isUp = true
    for (let i = 1; i < data.length; i++) {
      const changeFromHigh = ((data[i].high - lastHigh.price) / lastHigh.price) * 100
      const changeFromLow = ((data[i].low - lastLow.price) / lastLow.price) * 100
      if (isUp) {
        if (changeFromHigh > 0) lastHigh = { idx: i, price: data[i].high }
        if (changeFromLow < -deviation) {
          points.push({ idx: lastHigh.idx, price: lastHigh.price, isHigh: true })
          lastLow = { idx: i, price: data[i].low }
          isUp = false
        }
      } else {
        if (changeFromLow < 0) lastLow = { idx: i, price: data[i].low }
        if (changeFromHigh > deviation) {
          points.push({ idx: lastLow.idx, price: lastLow.price, isHigh: false })
          lastHigh = { idx: i, price: data[i].high }
          isUp = true
        }
      }
    }
    const result: (number | null)[] = data.map(() => null)
    points.forEach(p => { result[p.idx] = p.price })
    return result
  }, [])

  // ── OSCILLATOR INDICATORS ──

  // ATR (Average True Range) - period 14
  const computeATR = useCallback((data: CandleData[], period = 14) => {
    if (data.length < 2) return data.map(() => null)
    const tr: number[] = [data[0].high - data[0].low]
    for (let i = 1; i < data.length; i++) {
      tr.push(Math.max(data[i].high - data[i].low, Math.abs(data[i].high - data[i-1].close), Math.abs(data[i].low - data[i-1].close)))
    }
    const result: (number | null)[] = []
    for (let i = 0; i < period - 1; i++) result.push(null)
    let atr = tr.slice(0, period).reduce((a,b) => a+b, 0) / period
    result.push(atr)
    for (let i = period; i < tr.length; i++) {
      atr = (atr * (period - 1) + tr[i]) / period
      result.push(atr)
    }
    return result
  }, [])

  // Bears Power
  const computeBearsPower = useCallback((data: CandleData[], period = 13) => {
    const ma = computeMA(data, period)
    return data.map((d, i) => ma[i] !== null ? d.low - ma[i]! : null)
  }, [computeMA])

  // Bulls Power
  const computeBullsPower = useCallback((data: CandleData[], period = 13) => {
    const ma = computeMA(data, period)
    return data.map((d, i) => ma[i] !== null ? d.high - ma[i]! : null)
  }, [computeMA])

  // CCI (Commodity Channel Index) - period 14
  const computeCCI = useCallback((data: CandleData[], period = 14) => {
    const tp = data.map(d => (d.high + d.low + d.close) / 3)
    const result: (number | null)[] = []
    for (let i = 0; i < period - 1; i++) result.push(null)
    for (let i = period - 1; i < data.length; i++) {
      let sum = 0
      for (let j = i - period + 1; j <= i; j++) sum += tp[j]
      const mean = sum / period
      let meanDev = 0
      for (let j = i - period + 1; j <= i; j++) meanDev += Math.abs(tp[j] - mean)
      meanDev /= period
      result.push(meanDev > 0 ? (tp[i] - mean) / (0.015 * meanDev) : 0)
    }
    return result
  }, [])

  // DeMarker
  const computeDeMarker = useCallback((data: CandleData[], period = 14) => {
    if (data.length < 2) return data.map(() => null)
    const dMax: number[] = [0], dMin: number[] = [0]
    for (let i = 1; i < data.length; i++) {
      dMax.push(data[i].high > data[i-1].high ? data[i].high - data[i-1].high : 0)
      dMin.push(data[i].low < data[i-1].low ? data[i-1].low - data[i].low : 0)
    }
    const result: (number | null)[] = []
    for (let i = 0; i < period; i++) result.push(null)
    for (let i = period; i < data.length; i++) {
      const maxSum = dMax.slice(i-period+1, i+1).reduce((a,b) => a+b, 0)
      const minSum = dMin.slice(i-period+1, i+1).reduce((a,b) => a+b, 0)
      result.push(maxSum + minSum > 0 ? maxSum / (maxSum + minSum) : 0.5)
    }
    return result
  }, [])

  // Force Index
  const computeForceIndex = useCallback((data: CandleData[], period = 13) => {
    const fi: number[] = [0]
    for (let i = 1; i < data.length; i++) fi.push((data[i].close - data[i-1].close) * data[i].volume)
    const result: (number | null)[] = []
    for (let i = 0; i < period - 1; i++) result.push(null)
    for (let i = period - 1; i < fi.length; i++) {
      let sum = 0
      for (let j = i - period + 1; j <= i; j++) sum += fi[j]
      result.push(sum / period)
    }
    return result
  }, [])

  // Momentum
  const computeMomentum = useCallback((data: CandleData[], period = 14) => {
    return data.map((_, i) => i < period ? null : data[i].close - data[i-period].close)
  }, [])

  // OsMA (Moving Average of Oscillator)
  const computeOsMA = useCallback((data: CandleData[]) => {
    const macdData = computeMACD(data)
    return macdData.histogram
  }, [computeMACD])

  // Relative Vigor Index
  const computeRVI = useCallback((data: CandleData[], period = 10) => {
    if (data.length < period + 3) return { rvi: data.map(() => null) as (number | null)[], signal: data.map(() => null) as (number | null)[] }
    const co: number[] = data.map(d => d.close - d.open)
    const hl: number[] = data.map(d => d.high - d.low)
    const rvi: (number | null)[] = data.map(() => null)
    const signal: (number | null)[] = data.map(() => null)
    for (let i = period + 3; i < data.length; i++) {
      let numSum = 0, denSum = 0
      for (let j = i - period + 1; j <= i; j++) {
        if (j >= 1 && j < co.length - 1) {
          numSum += (co[j-1] + 2*co[j] + co[Math.min(j+1, co.length-1)]) / 4
          denSum += (hl[j-1] + 2*hl[j] + hl[Math.min(j+1, hl.length-1)]) / 4
        }
      }
      rvi[i] = denSum > 0 ? numSum / denSum : 0
    }
    for (let i = period + 6; i < data.length; i++) {
      if (rvi[i-3] !== null && rvi[i-2] !== null && rvi[i-1] !== null && rvi[i] !== null) {
        signal[i] = (rvi[i-3]! + 2*rvi[i-2]! + 2*rvi[i-1]! + rvi[i]!) / 6
      }
    }
    return { rvi, signal }
  }, [])

  // Stochastic Oscillator (5,3,3)
  const computeStochastic = useCallback((data: CandleData[], kPeriod = 5, dPeriod = 3) => {
    const k: (number | null)[] = []
    for (let i = 0; i < data.length; i++) {
      if (i < kPeriod - 1) { k.push(null); continue }
      let highest = -Infinity, lowest = Infinity
      for (let j = i - kPeriod + 1; j <= i; j++) { highest = Math.max(highest, data[j].high); lowest = Math.min(lowest, data[j].low) }
      k.push(highest - lowest > 0 ? ((data[i].close - lowest) / (highest - lowest)) * 100 : 50)
    }
    const d: (number | null)[] = []
    for (let i = 0; i < data.length; i++) {
      if (i < kPeriod + dPeriod - 2 || k[i] === null) { d.push(null); continue }
      let sum = 0, count = 0
      for (let j = i - dPeriod + 1; j <= i; j++) { if (k[j] !== null) { sum += k[j]!; count++ } }
      d.push(count > 0 ? sum / count : null)
    }
    return { k, d }
  }, [])

  // Williams' Percent Range (14)
  const computeWilliamsR = useCallback((data: CandleData[], period = 14) => {
    return data.map((_, i) => {
      if (i < period - 1) return null
      let highest = -Infinity, lowest = Infinity
      for (let j = i - period + 1; j <= i; j++) { highest = Math.max(highest, data[j].high); lowest = Math.min(lowest, data[j].low) }
      return highest - lowest > 0 ? ((highest - data[i].close) / (highest - lowest)) * -100 : -50
    })
  }, [])

  // ── VOLUME INDICATORS ──

  // Accumulation/Distribution
  const computeAD = useCallback((data: CandleData[]) => {
    const result: number[] = [0]
    for (let i = 1; i < data.length; i++) {
      const clv = data[i].high - data[i].low > 0 ? ((data[i].close - data[i].low) - (data[i].high - data[i].close)) / (data[i].high - data[i].low) : 0
      result.push(result[i-1] + clv * data[i].volume)
    }
    return result
  }, [])

  // Money Flow Index (14)
  const computeMFI = useCallback((data: CandleData[], period = 14) => {
    const tp = data.map(d => (d.high + d.low + d.close) / 3)
    const mf = tp.map((v, i) => v * data[i].volume)
    const result: (number | null)[] = data.map(() => null)
    for (let i = period; i < data.length; i++) {
      let posFlow = 0, negFlow = 0
      for (let j = i - period + 1; j <= i; j++) {
        if (tp[j] > tp[j-1]) posFlow += mf[j]; else negFlow += mf[j]
      }
      result[i] = negFlow > 0 ? 100 - 100 / (1 + posFlow / negFlow) : 100
    }
    return result
  }, [])

  // On Balance Volume
  const computeOBV = useCallback((data: CandleData[]) => {
    const result: number[] = [0]
    for (let i = 1; i < data.length; i++) {
      if (data[i].close > data[i-1].close) result.push(result[i-1] + data[i].volume)
      else if (data[i].close < data[i-1].close) result.push(result[i-1] - data[i].volume)
      else result.push(result[i-1])
    }
    return result
  }, [])

  // ── BILL WILLIAMS INDICATORS ──

  // Awesome Oscillator
  const computeAO = useCallback((data: CandleData[]) => {
    const midpoint = data.map(d => (d.high + d.low) / 2)
    const sma5: (number | null)[] = [], sma34: (number | null)[] = []
    for (let i = 0; i < data.length; i++) {
      if (i < 4) { sma5.push(null) } else { let s = 0; for (let j = i-4; j <= i; j++) s += midpoint[j]; sma5.push(s/5) }
      if (i < 33) { sma34.push(null) } else { let s = 0; for (let j = i-33; j <= i; j++) s += midpoint[j]; sma34.push(s/34) }
    }
    return sma5.map((v, i) => v !== null && sma34[i] !== null ? v! - sma34[i]! : null)
  }, [])

  // Accelerator Oscillator
  const computeAC = useCallback((data: CandleData[]) => {
    const ao = computeAO(data)
    const result: (number | null)[] = []
    for (let i = 0; i < data.length; i++) {
      if (i < 4 || ao[i] === null) { result.push(null); continue }
      let sum = 0, count = 0
      for (let j = i - 4; j <= i; j++) { if (ao[j] !== null) { sum += ao[j]!; count++ } }
      result.push(count > 0 ? ao[i]! - sum / count : null)
    }
    return result
  }, [computeAO])

  // Alligator (Jaw 13, Teeth 8, Lips 5)
  const computeAlligator = useCallback((data: CandleData[]) => {
    const jaw = computeMA(data, 13).map((v, i) => i < 8 ? null : v)
    const teeth = computeMA(data, 8).map((v, i) => i < 5 ? null : v)
    const lips = computeMA(data, 5).map((v, i) => i < 3 ? null : v)
    return { jaw, teeth, lips }
  }, [computeMA])

  // Fractals
  const computeFractals = useCallback((data: CandleData[]) => {
    const up: (boolean | null)[] = data.map(() => null)
    const down: (boolean | null)[] = data.map(() => null)
    for (let i = 2; i < data.length - 2; i++) {
      if (data[i].high > data[i-1].high && data[i].high > data[i-2].high && data[i].high > data[i+1].high && data[i].high > data[i+2].high) up[i] = true
      if (data[i].low < data[i-1].low && data[i].low < data[i-2].low && data[i].low < data[i+1].low && data[i].low < data[i+2].low) down[i] = true
    }
    return { up, down }
  }, [])

  // Gator Oscillator
  const computeGator = useCallback((data: CandleData[]) => {
    const { jaw, teeth, lips } = computeAlligator(data)
    const upper: (number | null)[] = jaw.map((v, i) => v !== null && teeth[i] !== null ? Math.abs(v! - teeth[i]!) : null)
    const lower: (number | null)[] = teeth.map((v, i) => v !== null && lips[i] !== null ? -Math.abs(v! - lips[i]!) : null)
    return { upper, lower }
  }, [computeAlligator])

  // Market Facilitation Index
  const computeBWIMFI = useCallback((data: CandleData[]) => {
    return data.map(d => d.high - d.low > 0 ? (d.high - d.low) / d.volume : 0)
  }, [])

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

  // ============ REAL LOGO HELPER ============
  const getRealLogo = useCallback((code: string, size: number = 36) => {
    // Stock domain mapping for Google Favicon API
    const stockDomains: Record<string, string> = {
      'AAPL': 'apple.com', 'NVDA': 'nvidia.com', 'MSFT': 'microsoft.com',
      'GOOGL': 'google.com', 'META': 'meta.com', 'AMZN': 'amazon.com',
      'TSLA': 'tesla.com', 'AMD': 'amd.com', 'JPM': 'jpmorgan.com',
      'V': 'visa.com', 'MA': 'mastercard.com', 'GS': 'goldmansachs.com',
      'BAC': 'bankofamerica.com', 'UNH': 'unitedhealthgroup.com',
      'JNJ': 'jnj.com', 'PFE': 'pfizer.com', 'LLY': 'lilly.com',
      'ABBV': 'abbvie.com', 'MRK': 'merck.com', 'WMT': 'walmart.com',
      'COST': 'costco.com', 'NKE': 'nike.com', 'MCD': 'mcdonalds.com',
      'KO': 'coca-cola.com', 'SBUX': 'starbucks.com', 'PEP': 'pepsico.com',
      'XOM': 'exxonmobil.com', 'CVX': 'chevron.com', 'COP': 'conocophillips.com',
      'CAT': 'caterpillar.com', 'BA': 'boeing.com', 'GE': 'ge.com',
      'HON': 'honeywell.com', 'DE': 'deere.com', 'DIS': 'disney.com',
      'NFLX': 'netflix.com', 'CMCSA': 'comcast.com', 'COIN': 'coinbase.com',
      'SQ': 'block.xyz', 'PYPL': 'paypal.com', 'AVGO': 'broadcom.com',
      'INTC': 'intel.com', 'TSM': 'tsmc.com', 'CRM': 'salesforce.com',
      'ORCL': 'oracle.com', 'ADBE': 'adobe.com', 'IBM': 'ibm.com',
      'NOW': 'servicenow.com', 'UBER': 'uber.com', 'PG': 'pg.com',
      'CL': 'colgatepalmolive.com', 'EL': 'estee.com', 'PM': 'pmi.com',
      'MO': 'altria.com', 'ABT': 'abbott.com', 'TMO': 'thermofisher.com',
      'DHR': 'danaher.com', 'ISRG': 'intuitivesurgical.com', 'SYK': 'stryker.com',
      'BSX': 'bsci.com', 'EW': 'edwards.com', 'GILD': 'gilead.com',
      'AMGN': 'amgen.com', 'BIIB': 'biogen.com', 'REGN': 'regeneron.com',
      'MRNA': 'modernatx.com', 'VRTX': 'vertexpharma.com', 'CVS': 'cvshealth.com',
      'CI': 'cigna.com', 'HUM': 'humana.com', 'CNC': 'centene.com',
      'SLB': 'slb.com', 'FANG': 'diamondbackenergy.com', 'MPC': 'marathonpetroleum.com',
      'PSX': 'phillips66.com', 'OXY': 'oxy.com', 'EOG': 'eogresources.com',
      'LMT': 'lockheedmartin.com', 'NOC': 'northropgrumman.com', 'RTX': 'rtx.com',
      'GD': 'gd.com', 'PGR': 'progressive.com', 'SCHW': 'schwab.com',
      'BLK': 'blackrock.com', 'AXP': 'americanexpress.com', 'C': 'citigroup.com',
      'WFC': 'wellsfargo.com', 'MS': 'morganstanley.com',
      'SPG': 'simon.com', 'PLD': 'prologis.com', 'AMT': 'americantower.com',
      'EQIX': 'equinix.com', 'O': 'realtvstock.com', 'PSA': 'publicstorage.com',
      'CCI': 'crowncastle.com', 'DLR': 'digitalrealty.com', 'VICI': 'vicivp.com',
      'WBD': 'warnerbrosdiscovery.com', 'PARA': 'paramount.com', 'FOX': 'fox.com',
      'T': 'att.com', 'VZ': 'verizon.com', 'TMUS': 't-mobile.com',
      'TGT': 'target.com', 'LOW': 'lowes.com', 'HD': 'homedepot.com',
      'DLTR': 'dollartree.com', 'TJX': 'tjx.com',
      'UPS': 'ups.com', 'FDX': 'fedex.com', 'DAL': 'delta.com',
      'DOW': 'dow.com',
      'BRK.B': 'berkshirehathaway.com',
      'SNAP': 'snap.com', 'PINS': 'pinterest.com', 'RIVN': 'rivian.com',
      'LCID': 'lucidmotors.com', 'NIO': 'nio.com', 'PLTR': 'palantir.com',
      'DKNG': 'draftkings.com', 'RBLX': 'roblox.com', 'SHOP': 'shopify.com',
      'SE': 'seagroup.com', 'GRAB': 'grab.com', 'HOOD': 'robinhood.com',
      'ROKU': 'roku.com', 'ZM': 'zoom.us', 'TEAM': 'atlassian.com',
      'CRWD': 'crowdstrike.com', 'PANW': 'paloaltonetworks.com',
      'MNDY': 'monday.com', 'DDOG': 'datadoghq.com', 'NET': 'cloudflare.com',
      'MDB': 'mongodb.com', 'HUBS': 'hubspot.com', 'TWLO': 'twilio.com',
      'OKTA': 'okta.com', 'ZS': 'zscaler.com', 'PATH': 'uipath.com',
      'AI': 'c3.ai', 'SOUN': 'soundhound.com',
    }

    // Crypto code mapping for CoinCap
    const cryptoMap: Record<string, string> = {
      'BTC': 'bitcoin', 'ETH': 'ethereum', 'XRP': 'xrp', 'SOL': 'solana',
      'DOGE': 'dogecoin', 'ADA': 'cardano', 'AVAX': 'avalanche', 'DOT': 'polkadot',
      'LINK': 'chainlink', 'MATIC': 'polygon', 'BCH': 'bitcoin-cash', 'LTC': 'litecoin',
      'XLM': 'stellar', 'UNI': 'uniswap', 'AAVE': 'aave', 'SHIB': 'shiba-inu',
      'ATOM': 'cosmos', 'FIL': 'filecoin', 'NEAR': 'near-protocol', 'ALGO': 'algorand',
      'VET': 'vechain', 'SAND': 'the-sandbox', 'MANA': 'decentraland', 'AXS': 'axie-infinity',
      'THETA': 'theta', 'APT': 'aptos', 'ARB': 'arbitrum', 'OP': 'optimism',
      'IMX': 'immutable-x', 'INJ': 'injective', 'TIA': 'celestia', 'SEI': 'sei',
      'SUI': 'sui', 'PEPE': 'pepe', 'FTM': 'fantom', 'GRT': 'the-graph',
      'ENS': 'ethereum-name-service', 'LDO': 'lido-dao', 'RPL': 'rocket-pool',
      'STX': 'stacks',
    }

    // Forex flag mapping
    const forexFlags: Record<string, [string, string]> = {
      'EURUSD': ['eu', 'us'], 'GBPUSD': ['gb', 'us'], 'USDJPY': ['us', 'jp'],
      'AUDUSD': ['au', 'us'], 'USDCAD': ['us', 'ca'], 'NZDUSD': ['nz', 'us'],
      'USDCHF': ['us', 'ch'], 'EURGBP': ['eu', 'gb'], 'EURJPY': ['eu', 'jp'],
      'GBPJPY': ['gb', 'jp'], 'AUDJPY': ['au', 'jp'], 'EURAUD': ['eu', 'au'],
      'GBPAUD': ['gb', 'au'], 'EURNZD': ['eu', 'nz'], 'GBPCAD': ['gb', 'ca'],
      'USDSGD': ['us', 'sg'], 'USDHKD': ['us', 'hk'], 'USDSEK': ['us', 'se'],
      'USDNOK': ['us', 'no'], 'USDDKK': ['us', 'dk'], 'USDZAR': ['us', 'za'],
      'USDTRY': ['us', 'tr'], 'USDMXN': ['us', 'mx'], 'USDPLN': ['us', 'pl'],
      'EURCHF': ['eu', 'ch'],
    }

    // Commodity icons
    const commodityIcons: Record<string, { emoji: string; bg: string }> = {
      'GOLD': { emoji: '🥇', bg: '#fbbf24' },
      'SILVER': { emoji: '🥈', bg: '#9ca3af' },
      'OIL': { emoji: '🛢️', bg: '#1f2937' },
      'NATGAS': { emoji: '🔥', bg: '#ef4444' },
      'COPPER': { emoji: '🔶', bg: '#b45309' },
      'PLATINUM': { emoji: '💍', bg: '#e5e7eb' },
      'PALLADIUM': { emoji: '💎', bg: '#a78bfa' },
      'WHEAT': { emoji: '🌾', bg: '#d97706' },
      'CORN': { emoji: '🌽', bg: '#eab308' },
      'SOYBEANS': { emoji: '🫘', bg: '#65a30d' },
      'SUGAR': { emoji: '🍬', bg: '#f9a8d4' },
      'COFFEE': { emoji: '☕', bg: '#78350f' },
      'COTTON': { emoji: '🧵', bg: '#f5f5f4' },
      'LUMBER': { emoji: '🪵', bg: '#a16207' },
      'RICE': { emoji: '🍚', bg: '#fef3c7' },
      'CACAO': { emoji: '🍫', bg: '#5c3317' },
      'RUBBER': { emoji: '⚫', bg: '#1f2937' },
      'IRON': { emoji: '🔩', bg: '#6b7280' },
    }

    // 1. Check crypto
    if (cryptoMap[code]) {
      return (
        <LogoWithFallback
          src={`https://assets.coincap.io/assets/icons/${code.toLowerCase()}@2x.png`}
          alt={code}
          size={size}
          code={code}
          className="rounded-full object-contain"
        />
      )
    }

    // 2. Check forex
    if (forexFlags[code]) {
      const [flag1, flag2] = forexFlags[code]
      return (
        <div className="flex items-center relative" style={{ width: size, height: size, minWidth: size, minHeight: size }}>
          <img src={`https://flagcdn.com/w40/${flag1}.png`} alt={flag1} width={size * 0.65} height={size * 0.65} className="rounded-sm object-cover absolute left-0 top-0 border border-white/20"
            onError={(e) => { const el = e.target as HTMLImageElement; el.style.display = 'none' }} />
          <img src={`https://flagcdn.com/w40/${flag2}.png`} alt={flag2} width={size * 0.65} height={size * 0.65} className="rounded-sm object-cover absolute right-0 bottom-0 border border-white/20"
            onError={(e) => { const el = e.target as HTMLImageElement; el.style.display = 'none' }} />
          {/* Fallback if both flags fail */}
          <div className="flex items-center justify-center w-full h-full">
            <span className="text-[8px] font-black text-[#3b82f6]">{code.slice(0, 3)}</span>
          </div>
        </div>
      )
    }

    // 3. Check commodity
    if (commodityIcons[code]) {
      const ci = commodityIcons[code]
      return (
        <div className="flex items-center justify-center rounded-full" style={{ width: size, height: size, minWidth: size, minHeight: size, background: ci.bg + '33', border: `1px solid ${ci.bg}55` }}>
          <span style={{ fontSize: size * 0.45 }}>{ci.emoji}</span>
        </div>
      )
    }

    // 4. Check stock
    if (stockDomains[code]) {
      return (
        <LogoWithFallback
          src={`https://www.google.com/s2/favicons?domain=${stockDomains[code]}&sz=64`}
          alt={code}
          size={size}
          code={code}
          className="rounded-lg object-contain bg-white/90 p-0.5"
        />
      )
    }

    // 5. Fallback: first letters
    return (
      <div className="flex items-center justify-center rounded-full bg-[#3b82f6]/15 border border-[#3b82f6]/30" style={{ width: size, height: size, minWidth: size, minHeight: size }}>
        <span className="text-[10px] font-black text-[#3b82f6]">{code.slice(0, 2)}</span>
      </div>
    )
  }, [])

  // ============ MARKET CATEGORY HELPER ============
  const getMarketCategory = useCallback((s: Stock): string => {
    const cat = (s.category || '').toLowerCase()
    const cryptoCodes = ['BTC', 'ETH', 'XRP', 'SOL', 'DOGE', 'ADA', 'AVAX', 'DOT', 'LINK', 'MATIC', 'BCH', 'LTC', 'XLM', 'UNI', 'AAVE', 'SHIB', 'ATOM', 'FIL', 'NEAR', 'ALGO', 'VET', 'SAND', 'MANA', 'AXS', 'THETA', 'APT', 'ARB', 'OP', 'IMX', 'INJ', 'TIA', 'SEI', 'SUI', 'PEPE', 'FTM', 'GRT', 'ENS', 'LDO', 'RPL', 'STX', 'RUNE', 'KAVA', 'DYDX', 'MINA', 'WLD', 'BONK', 'JUP', 'WIF']
    const forexCodes = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD', 'USDCHF', 'EURGBP', 'EURJPY', 'GBPJPY', 'AUDJPY', 'EURAUD', 'GBPAUD', 'EURNZD', 'GBPCAD', 'USDSGD', 'USDHKD', 'USDSEK', 'USDNOK', 'USDDKK', 'USDZAR', 'USDTRY', 'USDMXN', 'USDPLN', 'EURCHF', 'CADJPY', 'CHFJPY', 'NZDJPY', 'AUDCAD', 'AUDNZD', 'GBPNZD', 'EURCAD']
    const commodityCodes = ['GOLD', 'SILVER', 'OIL', 'NATGAS', 'COPPER', 'PLATINUM', 'PALLADIUM', 'WHEAT', 'CORN', 'SOYBEANS', 'SUGAR', 'COFFEE', 'COTTON', 'LUMBER', 'RICE', 'CACAO', 'RUBBER', 'IRON', 'ALUMINIUM', 'ZINC', 'NICKEL', 'LEAD', 'OILWTI', 'ETHANOL', 'OJ', 'OATS', 'COCOA']
    if (cat.includes('crypto') || cat.includes('kripto') || cryptoCodes.includes(s.code)) return 'crypto'
    if (cat.includes('forex') || forexCodes.includes(s.code)) return 'forex'
    if (cat.includes('commodity') || cat.includes('komoditas') || commodityCodes.includes(s.code)) return 'komoditas'
    // All stock categories (tech, bluechip, banking, healthcare, consumer, energy, infrastructure, media, saham, etc.) map to 'saham'
    return 'saham'
  }, [])

  const getMarketRegion = useCallback((s: Stock): string => {
    const sector = (s.sector || '').toLowerCase()
    const code = s.code.toUpperCase()
    // IDX stocks
    const idxCodes = ['BBRI', 'BBCA', 'BMRI', 'TLKM', 'ASII', 'BBNI', 'UNVR', 'GOTO', 'EMTK', 'ANTM', 'BRIS', 'ICBP', 'KLBF', 'ACES', 'MAPI']
    if (idxCodes.includes(code) || sector === 'idx') return 'IDX'
    // European stocks
    const euCodes = ['SAP', 'ASML', 'NESN', 'AZN', 'SHEL', 'BP', 'RIO', 'BHP', 'GSK', 'SNY', 'NOVN', 'ROG', 'NOVO', 'LVMH', 'MC', 'DTE', 'SIE', 'AIR', 'TTE', 'BN', 'UL']
    if (euCodes.includes(code) || sector === 'european') return 'European'
    // Asian stocks
    const asiaCodes = ['BABA', 'JD', 'PDD', 'TCEHY', 'SONY', 'TM', 'HMC', 'SSNLF', 'HYMTF', 'KRX', 'MUFG', 'NTDOY', 'HDB', 'INFY', 'WIT', 'SEHK', 'SMFG', 'LI', 'XPEV', 'YMM', 'NIO', 'TSM']
    if (asiaCodes.includes(code) || sector === 'asian') return 'Asian'
    // Default: US
    return 'US'
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
    if (!selectedStock || !showStockDetail) {
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
  }, [selectedStock, showStockDetail])

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
    if (!selectedSinyalStock) return
    const amount = sinyalAmountFromLots || parseInt(sinyalAmount) || 0
    if (amount < 1000) { toast({ title: 'Minimum 0.01 Lot (Rp 1.000)', variant: 'destructive' }); return }
    // MT5-style: Check if amount exceeds available balance (simplified margin check)
    // In MT5, Free Margin = Equity - Used Margin. We check against total balance for simplicity.
    const totalBalance = (user?.balance || 0)
    if (amount > totalBalance) { toast({ title: 'Saldo tidak cukup', description: `Saldo: ${formatRupiah(totalBalance)}`, variant: 'destructive' }); return }
    const dir = overrideDirection || sinyalDirection
    // MT5-style: No fee deducted on open. Balance stays the same.
    // No duration — position stays open until user manually closes it (like real MT5)
    const posId = `sinyal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const newPosition = {
      id: posId,
      stockId: selectedSinyalStock.id,
      stockCode: selectedSinyalStock.code,
      stockName: selectedSinyalStock.name,
      direction: dir,
      amount,
      duration: 0, // No timer — manual close only
      startPrice: sinyalCurrentPrice || selectedSinyalStock.price,
      startTime: Date.now(),
      profitPercent: 0,
      status: 'active' as const,
      leverage: sinyalLeverage,
    }
    setSinyalPositions(prev => [...prev, newPosition])
    setSinyalTimers(prev => ({ ...prev, [posId]: 0 }))
    // MT5-style: Balance does NOT change when opening a position
    // Only realized P/L is added/deducted when position closes
    const lotsLabel = sinyalLots || (amount / LOT_SIZE).toFixed(2)
    toast({ title: 'Posisi Dibuka! 🎯', description: `${dir === 'NAIK' ? 'Buy' : 'Sell'} ${selectedSinyalStock.code} • ${lotsLabel} Lot (${formatRupiah(amount)}) • Tutup manual` })
  }, [selectedSinyalStock, sinyalAmount, sinyalAmountFromLots, sinyalDirection, user, sinyalCurrentPrice, updateBalance, sinyalLeverage, sinyalLots])

  // MT5-style: Close position early — proportional P&L based on real price movement × leverage
  const closeSinyalPosition = useCallback((posId: string) => {
    const pos = sinyalPositionsRef.current.find(p => p.id === posId)
    if (!pos || pos.status !== 'active') return

    const currentPrice = sinyalCurrentPrice || sinyalChartSimRef.current?.price || pos.startPrice
    const lev = pos.leverage || 1000

    // MT5-style P&L = effective position value × (price change / entry price) × direction
    const effectivePositionValue = pos.amount * (lev / 100)
    const priceDiff = currentPrice - pos.startPrice
    const directionMultiplier = pos.direction === 'NAIK' ? 1 : -1
    const plAmount = Math.round(effectivePositionValue * (priceDiff / pos.startPrice) * directionMultiplier)

    // Cap: max loss = position amount (stop out)
    const cappedPL = Math.max(-pos.amount, plAmount)
    const isProfit = cappedPL >= 0

    setSinyalPositions(prev => prev.map(p =>
      p.id === posId ? {...p, status: isProfit ? 'won' : 'lost', closedPL: cappedPL} : p
    ))

    setSinyalResults(prev => [...prev, {
      id: posId, won: isProfit, profit: cappedPL,
      stockCode: pos.stockCode, direction: pos.direction, amount: pos.amount, shownAt: Date.now(),
    }])
    setTimeout(() => setSinyalResults(prev => prev.filter(r => r.id !== posId)), 1200)

    // MT5-style: Track realized P&L for portfolio reconciliation
    tradingPLOffsetRef.current += cappedPL

    // MT5-style: Add realized P/L to balance (positive = profit, negative = loss)
    updateBalance((user?.balance || 0) + cappedPL)

    const plLabel = cappedPL >= 0 ? `+${formatRupiah(cappedPL)}` : formatRupiah(cappedPL)
    toast({ title: isProfit ? 'Posisi Ditutup — Untung! 🎉' : 'Posisi Ditutup — Rugi 📉', description: `${pos.direction === 'NAIK' ? 'Buy' : 'Sell'} ${pos.stockCode} • P&L ${plLabel} • 1:${lev}` })
  }, [sinyalCurrentPrice, user, updateBalance])

  // MT5-style: Calculate live P&L based on REAL price movement
  // In MT5: P&L = Position Value × (Price Change / Entry Price) × Direction
  // Effective Position Value = Amount × (Leverage / 100)
  // This makes the balance follow the candlestick in real-time — exactly like MT5
  const getPositionLivePL = useCallback((pos: typeof sinyalPositions[0]) => {
    if (pos.status !== 'active') return 0
    const currentPrice = sinyalCurrentPrice || sinyalChartSimRef.current?.price || pos.startPrice
    const lev = pos.leverage || 1000
    // Effective position value = amount × (leverage / 100)
    // 1:1000 → 100K × 10 = 1M position | 1:500 → 100K × 5 = 500K position
    const effectivePositionValue = pos.amount * (lev / 100)
    // Price change from entry
    const priceDiff = currentPrice - pos.startPrice
    // Direction: NAIK/BUY profits when price up, TURUN/SELL profits when price down
    const directionMultiplier = pos.direction === 'NAIK' ? 1 : -1
    // P&L = effective position value × (price change %) × direction
    const plAmount = Math.round(effectivePositionValue * (priceDiff / pos.startPrice) * directionMultiplier)
    // Max loss capped at position amount (stop out)
    return Math.max(-pos.amount, plAmount)
  }, [sinyalCurrentPrice])

  // ============ LIVE BALANCE (MT5-style) ============
  // In MT5: Balance does NOT change when you open positions
  // Balance only changes when positions close (realized P&L)
  // Equity = Balance + Floating P/L — this follows the chart in real-time
  const liveBalance = (() => {
    return user?.balance || 0
  })()

  // ============ LIVE EQUITY (MT5-style) ============
  // Equity = Balance + Floating P/L — this is what FOLLOWS the chart in real-time
  // When no positions: Equity = Balance (static, shows initial deposit)
  // When positions open: Equity moves with the market price — exactly like MT5 Terminal
  const liveEquity = (() => {
    const baseBalance = (user?.balance || 0)
    const activePos = sinyalPositions.filter(p => p.status === 'active')
    if (activePos.length === 0) return baseBalance
    const totalFloatingPL = activePos.reduce((s, p) => s + getPositionLivePL(p), 0)
    return baseBalance + totalFloatingPL
  })()

  // ============ LIVE MODAL (MT5 Margin + Floating P/L) ============
  // In MT5: Margin = collateral held by broker
  // Modal Live = sum of all position amounts + their floating P/L
  // This represents the live value of all open positions
  const liveModal = (() => {
    const activePos = sinyalPositions.filter(p => p.status === 'active')
    if (activePos.length === 0) return 0
    const totalMargin = activePos.reduce((s, p) => s + p.amount, 0)
    const totalLivePL = activePos.reduce((s, p) => s + getPositionLivePL(p), 0)
    return totalMargin + totalLivePL
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

      // Generate historical candles FIRST, then connect simulation to the last candle
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

      // CRITICAL: Simulation starts where last historical candle ended
      // This ensures seamless continuity — new candle open = last candle close
      const sim = {
        price: prevClose,
        basePrice,
        momentum: histSim.momentum, // Carry over momentum for smooth transition
        trend: histSim.trend,       // Carry over trend direction
        phase: histSim.phase,
        phaseLen: histSim.phaseLen,
        vol,
        currentCandle: {
          open: prevClose,  // NEW candle opens at last candle's close
          high: prevClose,
          low: prevClose,
          close: prevClose,
          volume: 0,
          tickCount: 0,
          maxTicks,
        },
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

      // ── Realistic intra-candle tick simulation ──
      const baseVal = sim.basePrice
      const stockTier = getStockPayoutTier(selectedSinyalStock.code)
      const volMult = stockTier.volMultiplier
      const tfScale = Math.sqrt(tfSeconds / 60)

      // Base volatility per tick (small, accumulates over many ticks)
      const tickVol = baseVal * 0.0003 * volMult * tfScale
      const noise = (Math.random() - 0.5) * tickVol

      // Trend drift per tick — consistent directional force
      const trendDrift = sim.trend * baseVal * 0.00008 * tfScale

      // Momentum with HIGH persistence for smooth sequential flow
      // This ensures candles flow in the same direction instead of zigzagging
      sim.momentum = sim.momentum * 0.92 + trendDrift * 0.3 + noise

      // Very weak mean reversion — only prevents extreme drift
      const meanRevert = (sim.basePrice - sim.price) * 0.0003
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
        // Trend continues most of the time — only 22% reversal per candle
        // This creates natural consecutive trend candles
        sim.trend = Math.random() < 0.22 ? -sim.trend as 1 | -1 : sim.trend
      }
    }, tickIntervalMs)

    return () => clearInterval(interval)
  }, [activeTab, selectedSinyalStock, sinyalTimeframe, generateCandle, getStockPayoutTier, computeChartPayout])

  // Sinyal Pro — Track elapsed time for active positions (NO auto-close, user closes manually)
  // Positions stay open until the user manually closes them — just like real MT5
  useEffect(() => {
    const activePositions = sinyalPositions.filter(p => p.status === 'active')
    if (activePositions.length === 0) return

    const interval = setInterval(() => {
      const now = Date.now()
      const currentPositions = sinyalPositionsRef.current.filter(p => p.status === 'active')
      const newTimers: Record<string, number> = {}

      for (const pos of currentPositions) {
        const elapsed = Math.floor((now - pos.startTime) / 1000)
        // Store elapsed time as positive number (time since open)
        newTimers[pos.id] = elapsed
      }

      setSinyalTimers(prev => ({ ...prev, ...newTimers }))
    }, 500)

    return () => clearInterval(interval)
  }, [sinyalPositions])

  // ════════ BACKGROUND PRICE TICKER ════════
  // Keeps sinyalCurrentPrice updating when user is NOT on the sinyal tab
  // This makes saldo/margin/equity numbers follow the chart in real-time — exactly like MT5
  useEffect(() => {
    if (activeTab === 'sinyal' || !selectedSinyalStock) return
    const activePositions = sinyalPositionsRef.current.filter(p => p.status === 'active')
    if (activePositions.length === 0) return

    const tickIntervalMs = 1000
    const interval = setInterval(() => {
      if (sinyalChartSimRef.current) {
        // Continue the existing simulation's price movement (same algorithm as chart)
        const sim = sinyalChartSimRef.current
        const prevPrice = sim.price
        // Same price simulation logic as the chart tick
        sim.momentum += (Math.random() - 0.5) * sim.vol * 0.002
        sim.momentum *= 0.95
        sim.trend = Math.sin(sim.phase / sim.phaseLen * Math.PI * 2) * 0.4
        sim.phase += 0.02
        sim.price += sim.momentum + sim.trend * sim.vol * 0.0003 + (Math.random() - 0.5) * sim.vol * 0.0008
        // Keep price within reasonable bounds
        if (sim.price < sim.basePrice * 0.7) sim.price = sim.basePrice * 0.7 + Math.random() * sim.vol * 0.5
        if (sim.price > sim.basePrice * 1.5) sim.price = sim.basePrice * 1.5 - Math.random() * sim.vol * 0.5
        setSinyalCurrentPrice(sim.price)
      } else if (selectedSinyalStock) {
        // Simple random walk if no simulation exists yet
        setSinyalCurrentPrice(prev => {
          const basePrice = selectedSinyalStock.price
          const currentPrice = prev || basePrice
          const vol = basePrice * 0.0005
          const change = (Math.random() - 0.5) * vol * 2
          return currentPrice + change
        })
      }
    }, tickIntervalMs)

    return () => clearInterval(interval)
  }, [activeTab, selectedSinyalStock, sinyalPositions])

  // ============ FETCH FUNCTIONS ============
  const fetchStocks = useCallback(async () => {
    try { const r = await fetch('/api/stocks'); const d = await r.json(); if (d.stocks) setStocks(d.stocks) } catch {}
  }, [])
  const fetchPortfolio = useCallback(async () => {
    if (!user) return
    try { const r = await fetch(`/api/portfolio?userId=${user.id}`); const d = await r.json(); if (d.portfolio) { setPortfolio(d.portfolio); setPortfolioSummary(d.summary); /* MT5-style portfolio reconciliation: Server doesn't know about client-side trades, so we must adjust: - tradingPLOffsetRef: cumulative realized P/L from closed trades */ const adjustedBalance = d.summary.cashBalance + tradingPLOffsetRef.current; updateBalance(adjustedBalance) } } catch {}
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
  const fetchContracts = useCallback(async () => {
    // Contracts feature not available
  }, [])

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
    fetchNotifications(); fetchWatchlist(); fetchDeposits()
    fetchWithdrawals()
    // Fetch QRIS image from admin settings
    fetch('/api/qris').then(r => r.json()).then(d => { if (d?.url) setQrisImageUrl(d.url) }).catch(() => {})
  }, [user])

  useEffect(() => { const iv = setInterval(refreshAll, 30000); return () => clearInterval(iv) }, [refreshAll])

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

  // ============ WITHDRAW OTP ============
  const handleSendWithdrawOtp = async () => {
    if (!user?.email) { toast({ title: 'Error', description: 'Email tidak ditemukan', variant: 'destructive' }); return }
    setWithdrawOtpLoading(true)
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, type: 'withdrawal' })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setWithdrawOtpSent(true)
      setWithdrawOtpTimer(60)
      toast({ title: 'OTP Terkirim!', description: `Kode verifikasi dikirim ke ${user.email.replace(/(.{1})(.*)(@.*)/, '$1***$3')}` })
      setTimeout(() => withdrawOtpRefs.current[0]?.focus(), 100)
    } catch (err: unknown) {
      toast({ title: 'Gagal', description: err instanceof Error ? err.message : 'Gagal mengirim OTP', variant: 'destructive' })
    } finally { setWithdrawOtpLoading(false) }
  }

  const handleVerifyWithdrawOtp = async () => {
    if (!user?.email) return
    const code = withdrawOtpCode.join('')
    if (code.length !== 6) { toast({ title: 'Error', description: 'Masukkan 6 digit kode OTP', variant: 'destructive' }); return }
    setWithdrawOtpLoading(true)
    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, code, type: 'withdrawal' })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setWithdrawOtpVerified(true)
      toast({ title: 'OTP Terverifikasi!', description: 'Anda dapat melanjutkan withdrawal' })
    } catch (err: unknown) {
      toast({ title: 'Verifikasi Gagal', description: err instanceof Error ? err.message : 'Kode OTP salah', variant: 'destructive' })
      setWithdrawOtpCode(['', '', '', '', '', ''])
      setTimeout(() => withdrawOtpRefs.current[0]?.focus(), 100)
    } finally { setWithdrawOtpLoading(false) }
  }

  // ============ WITHDRAW ============
  const handleWithdraw = async () => {
    if (!user || !withdrawAmount) return
    if (!withdrawOtpVerified) { toast({ title: 'Verifikasi OTP Terlebih Dahulu', description: 'Kirim dan verifikasi OTP sebelum withdrawal', variant: 'destructive' }); return }
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
      const res = await fetch('/api/withdrawal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, amount, bankName: methodName, bankAccount: withdrawAccountNumber || user.bankAccount || '0000000', bankHolder: withdrawAccountHolder || user.name, otpVerified: true }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const adminFee = data.adminFee || Math.round(amount * 0.10)
      const netAmount = data.netAmount || (amount - adminFee)
      toast({ title: 'Withdraw Diproses!', description: `${formatRupiah(amount)} via ${methodName}. Biaya admin 10%: ${formatRupiah(adminFee)}. Diterima: ${formatRupiah(netAmount)}` })
      setWithdrawAmount(''); setWithdrawAccountNumber(''); setWithdrawAccountHolder(''); setWithdrawOtpVerified(false); setWithdrawOtpSent(false); setWithdrawOtpCode(['', '', '', '', '', '']); fetchPortfolio(); fetchWithdrawals()
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
            <ZevorikLogo size={36} className="flex-shrink-0" />
            <div>
              <b className="block text-[13px] md:text-base font-black gradient-text leading-tight">ZEVORIK</b>
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
                    if (diff > 0) setBannerIndex(prev => (prev + 1) % 3)
                    else setBannerIndex(prev => (prev - 1 + 3) % 3)
                    if (bannerTimerRef.current) clearInterval(bannerTimerRef.current)
                    bannerTimerRef.current = setInterval(() => setBannerIndex(prev => (prev + 1) % 3), 4000)
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
                        { label: 'Trading', icon: <Target className="w-3.5 h-3.5" />, action: () => setActiveTab('sinyal'), style: 'ghost' as const },
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
                        { label: 'Mulai Investasi', icon: <ArrowRight className="w-3 h-3" />, action: () => setActiveTab('market'), style: 'primary' as const },
                      ],
                      live: false,
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
                            <ZevorikLogo size={28} />
                            <span className="text-[8px] font-black tracking-[0.2em] uppercase text-blue-300/80">ZEVORIK</span>
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
                                className={`h-8 px-4 rounded-xl text-[9px] font-bold flex items-center gap-1.5 transition-all active:scale-[0.96] ${
                                  btn.style === 'primary' ? 'bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white hover:from-[#60a5fa] hover:to-[#3b82f6] shadow-lg shadow-blue-500/30' :
                                  'bg-white/10 border border-white/20 text-white hover:bg-white/20 backdrop-blur-sm'
                                }`}
                              >
                                {btn.icon}{btn.label}
                              </button>
                            ))}
                          </div>
                        )}

                      </div>
                    </div>
                  ))}
                </div>
                {/* Dot Indicators */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
                  {[0,1,2].map(i => (
                    <button
                      key={i}
                      onClick={() => { setBannerIndex(i); if (bannerTimerRef.current) clearInterval(bannerTimerRef.current); bannerTimerRef.current = setInterval(() => setBannerIndex(prev => (prev + 1) % 3), 4000) }}
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
                      <span className="text-[8px] font-bold text-blue-200/60 uppercase tracking-widest">Total Saldo</span>
                      {sinyalPositions.filter(p => p.status === 'active').length > 0 && (
                        <div className="h-4 px-2 rounded-full bg-red-400/20 border border-red-400/30 flex items-center gap-1 animate-pulse">
                          <Zap className="w-2.5 h-2.5 text-red-300" />
                          <span className="text-[7px] font-black text-red-300 tracking-wide">LIVE</span>
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
                    }`}>{showBalance ? formatRupiah(liveEquity) : '••••••••••'}</b>
                    {sinyalPositions.filter(p => p.status === 'active').length > 0 && (() => {
                      const totalPL = sinyalPositions.filter(p => p.status === 'active').reduce((s, p) => s + getPositionLivePL(p), 0)
                      return (
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className={`text-[8px] font-bold ${totalPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            P&L: {totalPL >= 0 ? '+' : ''}{formatRupiah(totalPL)}
                          </span>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Dual Wallets — Dompet Utama shows live balance */}
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
                      })() : ''}`}>{showBalance ? formatRupiah(liveEquity) : '••••••'}</b>
                      <span className="block text-[6px] font-semibold text-blue-200/40 mt-0.5">Deposit & trading{sinyalPositions.filter(p => p.status === 'active').length > 0 ? ' (ikut grafik)' : ''}</span>
                    </div>
                    <div className="rounded-xl p-3 bg-white/8 border border-white/12 backdrop-blur-sm">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-5 h-5 rounded-lg bg-blue-400/20 grid place-items-center"><CreditCard className="w-3 h-3 text-blue-300" /></div>
                        <span className="text-[7px] font-black text-blue-200/80 uppercase tracking-wider">Penarikan</span>
                      </div>
                      <b className="block text-[14px] font-black">{showBalance ? formatRupiah(0) : '••••••'}</b>
                      <span className="block text-[6px] font-semibold text-blue-200/40 mt-0.5">Dapat ditarik</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    <>
                      <button onClick={() => setActiveTab('finance')} className="h-10 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 text-[9px] font-bold hover:from-yellow-300 hover:to-amber-400 transition-all flex items-center justify-center gap-1 shadow-lg shadow-yellow-500/25 active:scale-[0.97]">
                        <Plus className="w-3.5 h-3.5" />Deposit
                      </button>
                      <button onClick={() => setActiveTab('finance')} className="h-10 rounded-xl bg-white/12 border border-white/20 text-white text-[9px] font-bold hover:bg-white/20 transition-all flex items-center justify-center gap-1 backdrop-blur-sm active:scale-[0.97]">
                        <Minus className="w-3.5 h-3.5" />Tarik
                      </button>
                      <button onClick={() => setActiveTab('market')} className="h-10 rounded-xl bg-white/12 border border-white/20 text-white text-[9px] font-bold hover:bg-white/20 transition-all flex items-center justify-center gap-1 backdrop-blur-sm active:scale-[0.97]">
                        <BarChart3 className="w-3.5 h-3.5" />Pasar
                      </button>
                    </>
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
                    { icon: <Target className="w-5 h-5" />, label: 'Trading', desc: 'Real MT5', action: () => setActiveTab('sinyal'), iconBg: 'bg-blue-500/15', iconColor: 'text-blue-400', glow: 'rgba(59,130,246,0.08)' },
                    { icon: <BarChart3 className="w-5 h-5" />, label: 'Pasar', desc: 'Global', action: () => setActiveTab('market'), iconBg: 'bg-cyan-500/15', iconColor: 'text-cyan-400', glow: 'rgba(6,182,212,0.08)' },
                    { icon: <Briefcase className="w-5 h-5" />, label: 'Portofolio', desc: 'Saham', action: () => setActiveTab('portfolio'), iconBg: 'bg-amber-500/15', iconColor: 'text-amber-400', glow: 'rgba(245,158,11,0.08)' },
                    { icon: <CreditCard className="w-5 h-5" />, label: 'Keuangan', desc: 'Deposit', action: () => setActiveTab('finance'), iconBg: 'bg-violet-500/15', iconColor: 'text-violet-400', glow: 'rgba(139,92,246,0.08)' },
                  ].map((a, i) => (
                    <button key={i} onClick={a.action} className="stock-card flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl bg-[var(--zv-surface)] border border-[var(--zv-border)] hover:border-[#3b82f6]/30 hover:shadow-lg transition-all active:scale-[0.96]" style={{ boxShadow: `0 4px 20px ${a.glow}` }}>
                      <div className={`w-11 h-11 rounded-xl ${a.iconBg} grid place-items-center ${a.iconColor}`}>{a.icon}</div>
                      <span className="text-[8px] md:text-[9px] font-black text-[var(--zv-text)]">{a.label}</span>
                      <span className="text-[6px] font-bold text-[var(--zv-muted)]">{a.desc}</span>
                    </button>
                  ))}
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
                              <div className="flex-shrink-0">
                                {getRealLogo(s.code, 28)}
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
                              <div className="flex-shrink-0">
                                {getRealLogo(s.code, 28)}
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
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-[var(--zv-surface)] flex items-center justify-center border border-[var(--zv-border)]">{getRealLogo(w.stock.code, 32)}</div>
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
                            <span className="block text-[9px] font-bold text-[var(--zv-text)]">{tx.type === 'BUY' ? 'Buy' : 'Sell'} {tx.stock.code}</span>
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
                <p className="text-center text-[7px] font-black text-[var(--zv-muted)] tracking-wider uppercase">ZEVORIK • Aset Saham Terdaftar & Diawasi • V2.0</p>
              </div>

            </motion.div>
          )}

          {/* ====== MARKET TAB - PASAR SAHAM SIGNALS ====== */}
          {activeTab === 'market' && (
            <motion.div key="market" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>

              {/* Header - Dark Trading App Style */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-[16px] font-black text-[var(--zv-text)]">Quote</h2>
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

                {/* Market Indices Overview */}
                <div className="flex gap-2 overflow-x-auto pb-2 mb-2" style={{ scrollbarWidth: 'none' }}>
                  {(() => {
                    const indices = [
                      { name: 'DOW', value: 42512.84, change: -42.77, changePct: -0.11 },
                      { name: 'S&P 500', value: 5921.41, change: 28.73, changePct: 0.49 },
                      { name: 'NASDAQ', value: 18920.80, change: 145.62, changePct: 0.78 },
                      { name: 'NIKKEI', value: 38456.12, change: -312.45, changePct: -0.81 },
                      { name: 'FTSE', value: 8245.63, change: 18.34, changePct: 0.22 },
                      { name: 'DAX', value: 18452.78, change: 85.12, changePct: 0.46 },
                      { name: 'IDX', value: 7245.18, change: 32.56, changePct: 0.45 },
                      { name: 'SHCOMP', value: 3312.56, change: -18.32, changePct: -0.55 },
                      { name: 'HANG', value: 18456.32, change: 125.78, changePct: 0.69 },
                    ]
                    return indices.map(idx => {
                      const isUp = idx.changePct >= 0
                      return (
                        <div key={idx.name} className="flex-shrink-0 min-w-[100px] px-2.5 py-1.5 rounded-lg bg-[var(--zv-surface)] border border-[var(--zv-border)]">
                          <span className="block text-[8px] font-bold text-[var(--zv-muted)]">{idx.name}</span>
                          <span className="block text-[10px] font-black text-[var(--zv-text)] tabular-nums">{idx.value.toLocaleString()}</span>
                          <span className={`text-[8px] font-bold ${isUp ? 'text-[#22c55e]' : 'text-[#ef5350]'}`}>
                            {isUp ? '+' : ''}{idx.changePct.toFixed(2)}%
                          </span>
                        </div>
                      )
                    })
                  })()}
                </div>

                {/* Category Tabs - Favorit / Paling Ditraded / Top Movers */}
                <div className="flex gap-1 mb-2">
                  {[
                    { key: 'favorit', label: 'Favorit' },
                    { key: 'populer', label: 'Paling Ditraded' },
                    { key: 'top', label: 'Top Movers' },
                  ].map(tab => (
                    <button key={tab.key} onClick={() => { setMarketSignalTab(tab.key); setMarketPage(1) }}
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
                      { key: 'crypto', label: 'Kripto' },
                      { key: 'forex', label: 'Forex' },
                      { key: 'komoditas', label: 'Komoditas' },
                      { key: 'saham', label: 'Saham' },
                    ].map(cat => (
                      <button key={cat.key} onClick={() => { setMarketFavFilter(cat.key); setMarketRegionFilter('semua'); setMarketPage(1) }}
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

                {/* Region Filter (only visible when Saham is selected) */}
                {marketFavFilter === 'saham' && (
                  <div className="flex gap-1 overflow-x-auto pb-1 mt-1.5" style={{ scrollbarWidth: 'none' }}>
                    {(() => {
                      const regionCounts: Record<string, number> = { semua: 0, US: 0, European: 0, Asian: 0, IDX: 0 }
                      stocks.forEach(s => {
                        if (getMarketCategory(s) === 'saham') {
                          regionCounts.semua++
                          const r = getMarketRegion(s)
                          if (regionCounts[r] !== undefined) regionCounts[r]++
                        }
                      })
                      return [
                        { key: 'semua', label: 'Semua Region' },
                        { key: 'US', label: '🇺🇸 US' },
                        { key: 'European', label: '🇪🇺 Europe' },
                        { key: 'Asian', label: '🌏 Asia' },
                        { key: 'IDX', label: '🇮🇩 IDX' },
                      ].map(region => (
                        <button key={region.key} onClick={() => { setMarketRegionFilter(region.key); setMarketPage(1) }}
                          className={`flex-shrink-0 h-6 px-2.5 rounded-full text-[8px] font-bold transition-all ${
                            marketRegionFilter === region.key
                              ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40'
                              : 'bg-[var(--zv-surface)] text-[var(--zv-muted)] hover:text-[var(--zv-text)] border border-[var(--zv-border)]'
                          }`}>
                          {region.label} <span className="opacity-60">{regionCounts[region.key] || 0}</span>
                        </button>
                      ))
                    })()}
                  </div>
                )}
              </div>

              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--zv-muted)]" />
                <input
                  type="text"
                  value={marketSearchQuery}
                  onChange={(e) => { setMarketSearchQuery(e.target.value); setMarketPage(1) }}
                  placeholder="Cari kode, nama, atau sektor..."
                  className="w-full h-9 pl-9 pr-3 rounded-xl bg-[var(--zv-surface)] border border-[var(--zv-border)] text-[11px] text-[var(--zv-text)] placeholder:text-[var(--zv-muted)] focus:outline-none focus:border-[#3b82f6]/50 transition-colors"
                />
                {marketSearchQuery && (
                  <button onClick={() => { setMarketSearchQuery(''); setMarketPage(1) }} className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[var(--zv-border)] grid place-items-center">
                    <X className="w-3 h-3 text-[var(--zv-muted)]" />
                  </button>
                )}
              </div>

              {/* Instrument List - Vertical Cards */}
              {(() => {
                // Filter by search (now includes sector)
                let filteredMarketStocks = stocks.filter(s => {
                  const q = marketSearchQuery.toLowerCase()
                  if (q && !s.code.toLowerCase().includes(q) && !s.name.toLowerCase().includes(q) && !(s.sector || '').toLowerCase().includes(q) && !(s.description || '').toLowerCase().includes(q)) return false
                  return true
                })

                // Filter by market category
                if (marketFavFilter !== 'semua') {
                  filteredMarketStocks = filteredMarketStocks.filter(s => getMarketCategory(s) === marketFavFilter)
                }

                // Filter by region (only for saham)
                if (marketFavFilter === 'saham' && marketRegionFilter !== 'semua') {
                  filteredMarketStocks = filteredMarketStocks.filter(s => getMarketRegion(s) === marketRegionFilter)
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

                // Pagination
                const totalItems = filteredMarketStocks.length
                const totalPages = Math.ceil(totalItems / MARKET_PAGE_SIZE)
                const paginatedStocks = filteredMarketStocks.slice(0, marketPage * MARKET_PAGE_SIZE)
                const hasMore = marketPage < totalPages

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
                      {paginatedStocks.map(s => {
                        const isUp = s.changePercent >= 0
                        const sparkData = getSparklineData(s)
                        const sparkColor = isUp ? '#22c55e' : '#ef5350'
                        const mcat = getMarketCategory(s)
                        const isFav = favorites.has(s.code)

                        return (
                          <div key={s.id}
                            className="w-full p-2.5 rounded-xl bg-[var(--zv-panel)] border border-[var(--zv-border)] hover:border-[#3b82f6]/30 hover:bg-[var(--zv-hover)] transition-all active:scale-[0.99] cursor-pointer group"
                            onClick={() => { setSelectedSinyalStock(s); setActiveTab('sinyal') }}>
                            
                            {/* Row 1: Logo + Name + Price + Star */}
                            <div className="flex items-center gap-2.5">
                              {/* Logo */}
                              <div className="flex-shrink-0" onClick={(e) => { e.stopPropagation() }}>
                                {getRealLogo(s.code, 36)}
                              </div>

                              {/* Name + Category */}
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
                                  {mcat === 'saham' && (
                                    <span className="text-[7px] font-bold px-1 py-0.5 rounded bg-[var(--zv-surface)] text-[var(--zv-muted)]">
                                      {getMarketRegion(s)}
                                    </span>
                                  )}
                                </div>
                                <span className="block text-[9px] text-[var(--zv-muted)] truncate">{s.name}</span>
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

                            {/* Row 2: Sparkline + Stats */}
                            <div className="flex items-center gap-2 mt-1.5 pl-[44px]">
                              {/* Mini Sparkline - visible on all screens */}
                              <div className="flex-shrink-0 w-20 h-7">
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

                              {/* Stats */}
                              <div className="flex-1 flex items-center gap-3 text-[8px]">
                                <div>
                                  <span className="text-[var(--zv-muted)]">H </span>
                                  <span className="font-bold text-[#22c55e]">{mcat === 'forex' ? s.high.toFixed(4) : mcat === 'crypto' && s.price < 1000000 ? '$' + s.high.toLocaleString() : formatRupiah(s.high)}</span>
                                </div>
                                <div>
                                  <span className="text-[var(--zv-muted)]">L </span>
                                  <span className="font-bold text-[#ef5350]">{mcat === 'forex' ? s.low.toFixed(4) : mcat === 'crypto' && s.price < 1000000 ? '$' + s.low.toLocaleString() : formatRupiah(s.low)}</span>
                                </div>
                                <div>
                                  <span className="text-[var(--zv-muted)]">Vol </span>
                                  <span className="font-bold text-[var(--zv-text)]">{formatMarketCap(s.volume)}</span>
                                </div>
                                {s.marketCap > 0 && mcat === 'saham' && (
                                  <div className="hidden sm:block">
                                    <span className="text-[var(--zv-muted)]">MCap </span>
                                    <span className="font-bold text-[var(--zv-text)]">${formatMarketCap(s.marketCap)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
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

                    {/* Load More Button */}
                    {hasMore && (
                      <div className="flex justify-center pt-3 pb-2">
                        <button
                          onClick={() => setMarketPage(p => p + 1)}
                          className="h-9 px-6 rounded-xl bg-[var(--zv-surface)] border border-[var(--zv-border)] text-[10px] font-bold text-[var(--zv-muted)] hover:text-[var(--zv-text)] hover:border-[#3b82f6]/30 transition-all"
                        >
                          Muat Lagi ({totalItems - paginatedStocks.length} tersisa)
                        </button>
                      </div>
                    )}

                    {/* Results summary */}
                    {totalItems > 0 && (
                      <div className="text-center pt-1 pb-2">
                        <span className="text-[8px] text-[var(--zv-muted)]">
                          Menampilkan {paginatedStocks.length} dari {totalItems} instrumen
                        </span>
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
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer bg-[var(--zv-surface)]">{getRealLogo(p.stock.code, 36)}</div>
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


            </motion.div>
          )}

          {/* ====== TRADING TAB - MT5 EXACT LAYOUT ====== */}
          {activeTab === 'sinyal' && (() => {
            // ── Computed values for MT5 terminal ──
            const activePos = sinyalPositions.filter(p => p.status === 'active')
            const totalBalance = (user?.balance || 0)
            const totalLivePL = activePos.reduce((s, p) => s + getPositionLivePL(p), 0)
            // MT5-style: Equity = Balance + Floating P/L (follows chart in real-time)
            const equity = totalBalance + totalLivePL
            const usedMargin = activePos.reduce((s, p) => s + p.amount, 0)
            const freeMargin = equity - usedMargin
            const marginLevel = usedMargin > 0 ? (equity / usedMargin) * 100 : 0

            // ── Bid/Ask spread ──
            const spreadPercent = selectedSinyalStock ? (
              (selectedSinyalStock.category?.toLowerCase().includes('crypto') || selectedSinyalStock.category?.toLowerCase().includes('kripto')) ? 0.05 :
              selectedSinyalStock.category?.toLowerCase().includes('forex') ? 0.01 :
              0.03
            ) : 0.03
            const bidPrice = (sinyalCurrentPrice || selectedSinyalStock?.price || 0) * (1 - spreadPercent / 100)
            const askPrice = (sinyalCurrentPrice || selectedSinyalStock?.price || 0) * (1 + spreadPercent / 100)
            const spreadValue = askPrice - bidPrice

            // ── Price formatting for chart ──
            const fmtChartPrice = (p: number) => {
              if (p >= 1e6) return `${(p / 1e6).toFixed(2)}M`
              if (p >= 1e3) return `${(p / 1e3).toFixed(1)}K`
              return p.toFixed(2)
            }
            const fmtPrice5 = (p: number) => {
              if (p >= 1e6) return `${(p / 1e6).toFixed(3)}M`
              if (p >= 1e4) return `${(p / 1e3).toFixed(2)}K`
              if (p >= 1e3) return `${(p / 1e3).toFixed(3)}K`
              return p.toFixed(5)
            }

            // ── Theme config for trading tab ──
            const isTrDark = theme === 'dark'
            const trTheme = {
              bg: isTrDark ? '#131722' : '#f0f2f5',
              bgDeep: isTrDark ? '#0a0e17' : '#ffffff',
              bgPanel: isTrDark ? '#1e222d' : '#ffffff',
              bgCard: isTrDark ? '#0c0f18' : '#e8eaed',
              border: isTrDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)',
              borderSubtle: isTrDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)',
              text: isTrDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.87)',
              textSecondary: isTrDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.54)',
              textMuted: isTrDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.35)',
              textFaint: isTrDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.22)',
              gridLine: isTrDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)',
              gridText: isTrDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)',
              chartBg: isTrDark ? '#0a0e17' : '#ffffff',
              inputBg: isTrDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
              inputBorder: isTrDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)',
              green: '#26a69a',
              red: '#ef5350',
              pillInactive: isTrDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)',
              pillActiveBg: isTrDark ? 'rgba(29,78,216,0.25)' : 'rgba(29,78,216,0.12)',
              pillActiveBorder: isTrDark ? 'rgba(29,78,216,0.4)' : 'rgba(29,78,216,0.3)',
              btnBg: isTrDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
              btnBorder: isTrDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.10)',
              btnText: isTrDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
              btnTextMuted: isTrDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)',
            }

            return (
            <motion.div key="sinyal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
              className="flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 140px)' }}>

              {/* ══ 1. HEADER — Super Clean Single Row ══ */}
              <div className="flex-shrink-0" style={{ background: trTheme.bg, borderBottom: '1px solid ' + trTheme.border }}>
                {selectedSinyalStock ? (
                  <div className="flex items-center justify-between px-3 py-2">
                    {/* Left: Symbol + Price */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[14px] font-black" style={{ color: trTheme.text }}>{selectedSinyalStock.code}</span>
                        <span className="text-[9px] font-bold" style={{ color: trTheme.textMuted }}>/</span>
                        <span className="text-[9px] font-bold" style={{ color: trTheme.textSecondary }}>{selectedSinyalStock.name?.slice(0, 16)}</span>
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
                              <span className="text-[15px] font-black tabular-nums" style={{ color: isPriceUp ? '#22c55e' : '#ef5350' }}>{formatRupiah(curPrice)}</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isPriceUp ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>
                                {isPriceUp ? '▲' : '▼'} {isPriceUp ? '+' : ''}{changePercent.toFixed(2)}%
                              </span>
                            </>
                          )
                        })()}
                        {/* Candle countdown */}
                        {(() => {
                          const sim = sinyalChartSimRef.current
                          if (!sim) return null
                          const cc = sim.currentCandle
                          const totalSecs = cc.maxTicks
                          const elapsed = cc.tickCount
                          const remaining = totalSecs - elapsed
                          const progress = totalSecs > 0 ? elapsed / totalSecs : 0
                          const isLow = remaining <= 5 && remaining > 0
                          const radius = 9
                          const circumference = 2 * Math.PI * radius
                          const strokeDash = circumference * progress
                          return (
                            <div className="flex items-center gap-0.5 ml-1">
                              <svg width="22" height="22" className="flex-shrink-0">
                                <circle cx="11" cy="11" r={radius} fill="none" stroke={trTheme.borderSubtle} strokeWidth="1.5" />
                                <circle cx="11" cy="11" r={radius} fill="none" stroke={isLow ? '#f59e0b' : '#3b82f6'} strokeWidth="1.5"
                                  strokeDasharray={`${strokeDash} ${circumference}`} strokeDashoffset="0"
                                  strokeLinecap="round" transform="rotate(-90 11 11)"
                                  style={{ transition: 'stroke-dasharray 0.8s linear' }} />
                                <text x="11" y="13" textAnchor="middle" fontSize="6" fontWeight="900" fill={isLow ? '#f59e0b' : trTheme.textSecondary} fontFamily="monospace">
                                  {remaining > 60 ? `${Math.ceil(remaining/60)}m` : `${remaining}`}
                                </text>
                              </svg>
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                    {/* Right: Timeframe Dropdown + Zoom + Theme Toggle */}
                    <div className="flex items-center gap-1.5">
                      {/* Theme Toggle */}
                      <button onClick={toggleTheme} className="h-6 w-6 rounded-md flex items-center justify-center transition-all hover:scale-105"
                        style={{ background: trTheme.inputBg, border: '1px solid ' + trTheme.inputBorder }}
                        title={isTrDark ? 'Light mode' : 'Dark mode'}>
                        {isTrDark ? <Sun className="w-3 h-3" style={{ color: '#eab308' }} /> : <Moon className="w-3 h-3" style={{ color: trTheme.textSecondary }} />}
                      </button>
                      {/* Timeframe Dropdown — MT5 Style */}
                      <div className="relative">
                        <button onClick={() => { setShowTimeframeMenu(prev => !prev); setShowLeverageMenu(false) }}
                          className="h-7 px-2 rounded-md flex items-center gap-1 transition-all"
                          style={{ background: showTimeframeMenu ? trTheme.pillActiveBg : trTheme.btnBg, border: `1px solid ${showTimeframeMenu ? trTheme.pillActiveBorder : trTheme.btnBorder}` }}>
                          <span className="text-[10px] font-black uppercase" style={{ color: trTheme.btnText }}>{sinyalTimeframe}</span>
                          <ChevronDown className={`w-3 h-3 transition-transform ${showTimeframeMenu ? 'rotate-180' : ''}`} style={{ color: trTheme.btnTextMuted }} />
                        </button>
                        {showTimeframeMenu && (
                          <div className="absolute right-0 top-8 z-50 rounded-lg overflow-hidden py-0.5"
                            style={{ background: trTheme.bgPanel, border: '1px solid ' + trTheme.border, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', minWidth: '64px' }}>
                            {(['1m', '2m', '5m', '10m', '15m', '30m', '1h'] as const).map(tf => (
                              <button key={tf} onClick={() => { setSinyalTimeframe(tf); sinyalChartSimRef.current = null; setSinyalCandles([]); setSinyalCurrentPrice(0); setSinyalChartOffset(0); setShowTimeframeMenu(false) }}
                                className={`w-full px-3 py-1.5 text-[10px] font-bold text-left transition-colors ${
                                  sinyalTimeframe === tf ? 'text-blue-400 bg-blue-500/10' : 'hover:bg-black/5'
                                }`}
                                style={{ color: sinyalTimeframe === tf ? undefined : trTheme.textSecondary }}>
                                {tf}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Zoom */}
                      <div className="flex items-center gap-0.5 rounded-md p-0.5" style={{ background: trTheme.inputBg }}>
                        <button onClick={() => setSinyalChartZoom(prev => Math.max(8, prev - (prev > 60 ? 8 : prev > 30 ? 4 : 2)))}
                          className="h-6 w-6 rounded flex items-center justify-center text-[11px] font-bold transition-colors hover:opacity-80" style={{ color: trTheme.btnTextMuted }}>−</button>
                        <button onClick={() => setSinyalChartZoom(prev => Math.min(120, prev + (prev > 60 ? 8 : prev > 30 ? 4 : 2)))}
                          className="h-6 w-6 rounded flex items-center justify-center text-[11px] font-bold transition-colors hover:opacity-80" style={{ color: trTheme.btnTextMuted }}>+</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center px-3 py-2">
                    <span className="text-[10px] font-bold" style={{ color: trTheme.textMuted }}>Pilih instrumen untuk mulai trading</span>
                  </div>
                )}
                {/* ══ Market Selector — Scrollable MT5 Style ══ */}
                <div className="flex-shrink-0" style={{ background: trTheme.bg, borderBottom: '1px solid ' + trTheme.border }}>
                  {/* Category tabs — clean horizontal */}
                  <div className="flex items-center px-2 pt-1.5 gap-0.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                    {[
                      { key: 'popular', label: 'Popular' },
                      { key: 'saham', label: 'Saham' },
                      { key: 'crypto', label: 'Kripto' },
                      { key: 'komoditas', label: 'Komoditas' },
                      { key: 'forex', label: 'Forex' },
                    ].map(cat => (
                      <button key={cat.key} onClick={() => setSinyalCategory(cat.key)}
                        className={`flex-shrink-0 h-7 px-2.5 rounded-md text-[9px] font-bold transition-all ${
                          sinyalCategory === cat.key
                            ? 'bg-[#1d4ed8]/20 text-blue-400 border border-blue-500/20'
                            : 'border border-transparent'
                        }`}
                        style={sinyalCategory !== cat.key ? { color: trTheme.textMuted } : undefined}>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  {/* Stock pills — scrollable row with smooth scroll */}
                  <div className="flex items-center gap-1 px-2 pb-1.5 pt-1 overflow-x-auto" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                    {stocks.filter(s => {
                      const cat = s.category?.toLowerCase() || ''
                      if (sinyalCategory === 'popular') return true
                      if (sinyalCategory === 'saham') return !cat.includes('crypto') && !cat.includes('kripto') && !cat.includes('forex') && !cat.includes('commodity') && !cat.includes('komoditas') && !['BTC', 'ETH', 'XRP', 'SOL', 'DOGE', 'ADA', 'AVAX', 'DOT', 'MATIC', 'LINK', 'BCH', 'LTC', 'XLM', 'UNI', 'AAVE', 'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD', 'USDCHF', 'GOLD', 'SILVER', 'OIL', 'NATGAS', 'COPPER'].includes(s.code)
                      if (sinyalCategory === 'crypto') return cat.includes('crypto') || cat.includes('kripto') || ['BTC', 'ETH', 'XRP', 'SOL', 'DOGE', 'ADA', 'AVAX', 'DOT', 'MATIC', 'LINK', 'BCH', 'LTC', 'XLM', 'UNI', 'AAVE'].includes(s.code)
                      if (sinyalCategory === 'komoditas') return cat.includes('commodity') || cat.includes('komoditas') || ['XOM', 'CVX', 'COP', 'GOLD', 'SILVER', 'OIL', 'NATGAS', 'COPPER'].includes(s.code)
                      if (sinyalCategory === 'forex') return cat.includes('forex') || ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD', 'USDCHF'].includes(s.code)
                      return true
                    }).slice(0, 30).map(s => {
                      const isSelected = selectedSinyalStock?.id === s.id
                      const isUp = s.change >= 0
                      return (
                        <button key={s.id} onClick={() => { setSelectedSinyalStock(s); setSinyalLots('0.01'); setSinyalAmount(''); setSinyalDirection('NAIK'); setSinyalResults([]); setSinyalCandles([]); setSinyalCurrentPrice(0); setSinyalChartTick(0); setSinyalChartOffset(0); sinyalChartSimRef.current = null }}
                          className={`flex-shrink-0 h-7 px-2.5 rounded-md text-[9px] font-bold flex items-center gap-1 transition-all ${
                            isSelected
                              ? 'bg-[#1d4ed8] text-white shadow-sm shadow-blue-500/20'
                              : isUp
                                ? 'text-green-400/60 hover:text-green-400/90 hover:bg-green-500/5'
                                : 'text-red-400/60 hover:text-red-400/90 hover:bg-red-500/5'
                          }`}
                          style={!isSelected ? { border: '1px solid ' + trTheme.borderSubtle } : undefined}>
                          <span>{s.code}</span>
                          <span className={`text-[7px] ${isSelected ? 'text-white/60' : ''}`}>{isUp ? '▲' : '▼'}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* ══ 2. QUICK BUY/SELL BAR — Chart Only (Full trading in Trade tab) ══ */}
              {selectedSinyalStock && (() => {
                const buyPL = activePos.filter(p => p.direction === 'NAIK').reduce((s, p) => s + getPositionLivePL(p), 0)
                const sellPL = activePos.filter(p => p.direction === 'TURUN').reduce((s, p) => s + getPositionLivePL(p), 0)
                const hasBuyPos = activePos.some(p => p.direction === 'NAIK')
                const hasSellPos = activePos.some(p => p.direction === 'TURUN')
                return (
              <div className="flex-shrink-0" style={{ background: trTheme.bgPanel, borderBottom: '1px solid ' + trTheme.border }}>
                <div className="flex items-center gap-1.5 px-2 py-1.5">
                  {/* SELL Button */}
                  <button
                    onClick={() => {
                      if (sinyalAmountFromLots < 1000) {
                        toast({ title: 'Minimum 0.01 Lot (Rp 1.000)', variant: 'destructive' }); return
                      }
                      if (sinyalAmountFromLots > freeMargin) {
                        toast({ title: 'Free Margin tidak cukup', variant: 'destructive' }); return
                      }
                      setConfirmTradeDir('TURUN')
                      setShowConfirmTrade(true)
                    }}
                    className="flex-1 relative rounded-lg flex items-center justify-center gap-1.5 transition-all overflow-hidden active:scale-[0.97] h-[40px]"
                    style={(() => {
                      let bg: string
                      if (hasSellPos) {
                        bg = sellPL > 0
                          ? 'linear-gradient(135deg, #f87171, #ef4444, #dc2626)'
                          : 'linear-gradient(135deg, #b91c1c, #991b1b)'
                      } else {
                        bg = 'linear-gradient(135deg, #ef5350, #dc2626, #b91c1c)'
                      }
                      return { background: bg, boxShadow: '0 2px 12px rgba(239,68,68,0.3)' }
                    })()}>
                    <TrendingDown className="w-4 h-4 text-white/90" />
                    <span className="text-[13px] font-black tracking-[0.15em] text-white">SELL</span>
                    <span className="text-[8px] font-bold tabular-nums text-white/50">{sinyalCurrentPrice > 0 ? fmtPrice5(bidPrice) : '—'}</span>
                  </button>

                  {/* Lot Selector with -/+ buttons side by side */}
                  <div className="flex items-center rounded-lg overflow-hidden h-[40px]" style={{ background: trTheme.inputBg, border: '1px solid ' + trTheme.inputBorder }}>
                    <button onClick={() => { const cur = parseFloat(sinyalLots || '0'); const next = Math.max(0.01, cur - 0.01); setSinyalLots(next.toFixed(2)); setSinyalAmount(String(Math.round(next * LOT_SIZE))) }}
                      className="h-full w-8 flex items-center justify-center transition-colors hover:bg-red-500/20 active:bg-red-500/30" style={{ borderRight: '1px solid ' + trTheme.borderSubtle }}>
                      <Minus className="w-3 h-3" style={{ color: '#f87171' }} strokeWidth={2.5} />
                    </button>
                    <div className="flex flex-col items-center justify-center px-2 min-w-[42px]">
                      <span className="text-[12px] font-black tabular-nums leading-none" style={{ color: trTheme.text }}>{sinyalLots}</span>
                      <span className="text-[5px] font-bold leading-none mt-0.5" style={{ color: 'rgba(251,191,36,0.6)' }}>LOT</span>
                    </div>
                    <button onClick={() => { const cur = parseFloat(sinyalLots || '0'); const next = Math.max(0.01, cur + 0.01); setSinyalLots(next.toFixed(2)); setSinyalAmount(String(Math.round(next * LOT_SIZE))) }}
                      className="h-full w-8 flex items-center justify-center transition-colors hover:bg-green-500/20 active:bg-green-500/30" style={{ borderLeft: '1px solid ' + trTheme.borderSubtle }}>
                      <Plus className="w-3 h-3" style={{ color: '#4ade80' }} strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* BUY Button */}
                  <button
                    onClick={() => {
                      if (sinyalAmountFromLots < 1000) {
                        toast({ title: 'Minimum 0.01 Lot (Rp 1.000)', variant: 'destructive' }); return
                      }
                      if (sinyalAmountFromLots > freeMargin) {
                        toast({ title: 'Free Margin tidak cukup', variant: 'destructive' }); return
                      }
                      setConfirmTradeDir('NAIK')
                      setShowConfirmTrade(true)
                    }}
                    className="flex-1 relative rounded-lg flex items-center justify-center gap-1.5 transition-all overflow-hidden active:scale-[0.97] h-[40px]"
                    style={(() => {
                      let bg: string
                      if (hasBuyPos) {
                        bg = buyPL > 0
                          ? 'linear-gradient(135deg, #4ade80, #22c55e, #16a34a)'
                          : 'linear-gradient(135deg, #166534, #14532d)'
                      } else {
                        bg = 'linear-gradient(135deg, #22c55e, #16a34a, #15803d)'
                      }
                      return { background: bg, boxShadow: '0 2px 12px rgba(34,197,94,0.3)' }
                    })()}>
                    <TrendingUp className="w-4 h-4 text-white/90" />
                    <span className="text-[13px] font-black tracking-[0.15em] text-white">BUY</span>
                    <span className="text-[8px] font-bold tabular-nums text-white/50">{sinyalCurrentPrice > 0 ? fmtPrice5(askPrice) : '—'}</span>
                  </button>
                </div>
              </div>
                )
              })()}

              {/* ══ 2.5 CHART TOOLBAR — MT5 Style ══ */}
              {selectedSinyalStock && (
              <div className="flex-shrink-0 flex items-center gap-1 px-2 py-1" style={{ background: trTheme.bgDeep, borderBottom: '1px solid ' + trTheme.borderSubtle }}>
                {/* Chart Type Buttons */}
                <div className="flex items-center gap-0.5 mr-1">
                  {([
                    { type: 'candle' as const, label: '🕯', tip: 'Candlestick' },
                    { type: 'line' as const, label: '📈', tip: 'Line' },
                    { type: 'bar' as const, label: '📊', tip: 'Bar' },
                  ]).map(ct => (
                    <button key={ct.type} onClick={() => setChartType(ct.type)} title={ct.tip}
                      className={`h-6 w-7 rounded flex items-center justify-center text-[11px] transition-all ${
                        chartType === ct.type
                          ? 'bg-black/10 text-white'
                          : ''
                      }`}
                      style={chartType !== ct.type ? { color: trTheme.textMuted } : undefined}>
                      {ct.label}
                    </button>
                  ))}
                </div>
                <div className="w-px h-4" style={{ background: trTheme.borderSubtle }} />
                {/* Crosshair Toggle */}
                <button onClick={() => setCrosshairMode(prev => !prev)} title="Crosshair"
                  className={`h-6 w-7 rounded flex items-center justify-center transition-all ${
                    crosshairMode ? 'bg-blue-500/20 text-blue-400' : ''
                  }`}
                  style={!crosshairMode ? { color: trTheme.textMuted } : undefined}>
                  <Crosshair className="w-3.5 h-3.5" />
                </button>
                <div className="w-px h-4" style={{ background: trTheme.borderSubtle }} />
                {/* Indicators Button */}
                <div className="relative">
                  <button onClick={() => { setShowIndicatorMenu(prev => !prev); setShowTimeframeMenu(false); setShowLeverageMenu(false) }} title="Indicators"
                    className={`h-6 px-2 rounded flex items-center gap-0.5 transition-all ${
                      showIndicatorMenu ? 'bg-purple-500/20 text-purple-400' : activeIndicators.length > 0 ? 'text-purple-400/70' : ''
                    }`}
                    style={!showIndicatorMenu && activeIndicators.length === 0 ? { color: trTheme.textMuted } : undefined}>
                    <Activity className="w-3.5 h-3.5" />
                    <span className="text-[8px] font-bold">{activeIndicators.length > 0 ? activeIndicators.length : ''}</span>
                  </button>
                  {showIndicatorMenu && (
                    <div className="absolute left-0 top-8 z-50 rounded-lg overflow-hidden py-1"
                      style={{ background: trTheme.bgPanel, border: '1px solid ' + trTheme.border, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', minWidth: '190px', maxHeight: '320px', overflowY: 'auto' }}>
                      {['Trend', 'Oscillator', 'Volume', 'Bill Williams'].map(group => {
                        const groupIndicators = ALL_INDICATORS.filter(ind => ind.group === group)
                        return (
                          <div key={group}>
                            <div className="px-2 py-0.5 text-[7px] font-bold uppercase tracking-widest flex items-center gap-1" style={{ color: trTheme.textFaint, borderTop: group === 'Trend' ? 'none' : `1px solid ${trTheme.borderSubtle}`, marginTop: group === 'Trend' ? 0 : 2, paddingTop: group === 'Trend' ? undefined : 4 }}>
                              <span>{group === 'Trend' ? '📊' : group === 'Oscillator' ? '📈' : group === 'Volume' ? '📦' : '🐊'}</span>
                              <span>{group}</span>
                            </div>
                            {groupIndicators.map(ind => {
                              const isActive = activeIndicators.some(a => a.key === ind.key)
                              return (
                                <button key={ind.key} onClick={() => {
                                  setActiveIndicators(prev => {
                                    if (isActive) return prev.filter(a => a.key !== ind.key)
                                    return [...prev, { key: ind.key, label: ind.label, color: ind.color }]
                                  })
                                }}
                                  className={`w-full px-2 py-1 text-[9px] font-bold text-left flex items-center gap-1.5 transition-colors ${
                                    isActive ? 'bg-black/5' : 'hover:bg-black/5'
                                  }`}
                                  style={{ color: isActive ? trTheme.text : trTheme.textSecondary }}>
                                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: isActive ? ind.color : trTheme.inputBg, border: `1px solid ${isActive ? ind.color : trTheme.inputBorder}` }} />
                                  <span className="flex-1">{ind.label}</span>
                                  <span className="text-[6px]" style={{ color: trTheme.textFaint }}>{ind.desc}</span>
                                  {isActive && <Check className="w-2 h-2 text-green-400" />}
                                </button>
                              )
                            })}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
                <div className="w-px h-4" style={{ background: trTheme.borderSubtle }} />
                {/* Active indicator pills */}
                <div className="flex items-center gap-0.5 overflow-x-auto flex-1" style={{ scrollbarWidth: 'none' }}>
                  {activeIndicators.map(ind => (
                    <span key={ind.key} className="flex-shrink-0 h-5 px-1.5 rounded text-[7px] font-bold flex items-center gap-0.5" style={{ background: `${ind.color}15`, color: ind.color, border: `0.5px solid ${ind.color}30` }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: ind.color }} />
                      {ind.label}
                    </span>
                  ))}
                </div>
              </div>
              )}

              {/* ══ 3. CHART AREA — MT5 Professional Chart (flex-1 fills remaining space) ══ */}
              <div className="flex-1 min-h-0 flex flex-col">
                  {selectedSinyalStock && (
                    <div className="relative flex-1 min-h-0 overflow-hidden" style={{ background: trTheme.chartBg }}>
                      {/* Active Trades Overlay — Premium Glass Badges */}
                      {sinyalPositions.filter(p => p.status === 'active').length > 0 && (
                        <div className="absolute top-1.5 left-1.5 z-10 flex flex-col gap-1 max-w-[140px]">
                          {sinyalPositions.filter(p => p.status === 'active').map(ap => {
                            const isUp = ap.direction === 'NAIK'
                            const livePL = getPositionLivePL(ap)
                            return (
                              <div key={ap.id}
                                className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
                                style={{
                                  backdropFilter: 'blur(12px)',
                                  background: isUp ? 'rgba(34,197,94,0.06)' : 'rgba(239,83,80,0.06)',
                                  border: `1px solid ${isUp ? 'rgba(34,197,94,0.12)' : 'rgba(239,83,80,0.12)'}`,
                                  boxShadow: `0 2px 8px ${isUp ? 'rgba(34,197,94,0.08)' : 'rgba(239,83,80,0.08)'}`
                                }}>
                                <div className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-md"
                                  style={{ background: isUp ? 'linear-gradient(135deg, #4ade80, #22c55e)' : 'linear-gradient(135deg, #f87171, #ef5350)' }}>
                                  <span className="text-[6px] font-black text-white">{isUp ? 'B' : 'S'}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className={`text-[8px] font-black ${isUp ? 'text-green-400' : 'text-red-400'}`}>{isUp ? 'BUY' : 'SELL'}</span>
                                  <span className={`text-[8px] font-black ${livePL >= 0 ? 'text-green-400' : 'text-red-400'} ml-0.5`}>
                                    {livePL >= 0 ? '+' : ''}{formatRupiah(livePL)}
                                  </span>
                                </div>
                                <button onClick={() => closeSinyalPosition(ap.id)}
                                  className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 hover:scale-110 transition-transform"
                                  style={{ background: 'rgba(239,83,80,0.3)' }}
                                  title="Tutup posisi">
                                  <X className="w-2.5 h-2.5 text-white" />
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* ── CANDLESTICK CHART SVG ── */}
                      <div className="w-full h-full"
                        onMouseMove={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect()
                          setSinyalCrosshair({ x: e.clientX - rect.left, y: e.clientY - rect.top, w: rect.width, h: rect.height })
                          if (sinyalDragRef.current.dragging) {
                            const dx = e.clientX - sinyalDragRef.current.startX
                            const candlesPerPx = 3 / rect.width
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
                            const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY
                            const direction = delta > 0 ? -1 : 1
                            setSinyalChartOffset(prev => Math.max(0, prev + direction * 2))
                          } else {
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
                          if (allCandles.length < 2) return <div className="flex items-center justify-center h-full text-[10px]" style={{ color: trTheme.textMuted }}>Memuat grafik...</div>

                          const allHighs = allCandles.map(c => c.high)
                          const allLows = allCandles.map(c => c.low)
                          const minP = Math.min(...allLows)
                          const maxP = Math.max(...allHighs)
                          const rangeP = maxP - minP || 1
                          const paddedMin = minP - rangeP * 0.08
                          const paddedMax = maxP + rangeP * 0.08
                          const paddedRange = paddedMax - paddedMin

                          const W = 600
                          const padR = 54
                          const padL = 1
                          const padT = 14
                          const padB = 0
                          const volH = 24
                          const timeAxisH = 12
                          const priceAreaH = 340 - padT - padB
                          const chartH = priceAreaH + padT + padB
                          const activeSubCharts = activeIndicators.filter(a => SUBCHART_KEYS.includes(a.key))
                          const visibleSubCharts = activeSubCharts.slice(0, 3)
                          const subChartH = visibleSubCharts.length * 44
                          const H = chartH + volH + timeAxisH + subChartH
                          const chartW = W - padR - padL

                          const yScale = (price: number) => padT + ((paddedMax - price) / paddedRange) * priceAreaH

                          const maxVisible = sinyalChartZoom
                          const totalCandles = allCandles.length
                          const endIdx = totalCandles - sinyalChartOffset
                          const startIdx = Math.max(0, endIdx - maxVisible)
                          const visibleCandles = allCandles.slice(startIdx, endIdx)
                          const candleCount = visibleCandles.length
                          if (candleCount === 0) return <div className="flex items-center justify-center h-full text-[10px]" style={{ color: trTheme.textMuted }}>Geser kembali...</div>
                          const candleSpacing = chartW / candleCount
                          const candleBodyW = Math.max(1.5, Math.min(candleSpacing * 0.65, 14))

                          const maxVol = Math.max(...visibleCandles.map(c => c.volume), 1)

                          const lastCandle = visibleCandles[candleCount - 1]
                          const lastPrice = lastCandle.close
                          const yLast = yScale(lastPrice)
                          const isUp = lastCandle.close >= lastCandle.open
                          const priceColor = isUp ? '#26a69a' : '#ef5350'

                          const activePositions = sinyalPositions.filter(p => p.status === 'active')

                          const gridLevels = 6
                          const gridPriceStep = paddedRange / gridLevels

                          return (
                            <svg className="w-full h-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ fontFamily: 'monospace' }}>
                              <defs>
                                <linearGradient id="priceBadgeGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor={priceColor} stopOpacity="1" />
                                  <stop offset="100%" stopColor={priceColor} stopOpacity="0.85" />
                                </linearGradient>
                                <filter id="glowDot" x="-100%" y="-100%" width="300%" height="300%">
                                  <feGaussianBlur stdDeviation="2" result="blur" />
                                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                                </filter>
                              </defs>

                              {/* ── Chart Background ── */}
                              <defs>
                                <linearGradient id="chartBgGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor={isTrDark ? '#0d1117' : '#fafbfc'} />
                                  <stop offset="50%" stopColor={isTrDark ? '#0a0e17' : '#ffffff'} />
                                  <stop offset="100%" stopColor={isTrDark ? '#080c14' : '#f5f6f8'} />
                                </linearGradient>
                              </defs>
                              <rect x={padL} y={padT} width={chartW} height={priceAreaH} fill="url(#chartBgGrad)" />

                              {/* ── Horizontal grid lines — MT5 subtle dotted ── */}
                              {Array.from({ length: gridLevels + 1 }).map((_, gi) => {
                                const gy = padT + (gi / gridLevels) * priceAreaH
                                const priceLabel = paddedMax - gridPriceStep * gi
                                return (
                                  <g key={`hg-${gi}`}>
                                    <line x1={padL} y1={gy} x2={padL + chartW} y2={gy}
                                      stroke={trTheme.gridLine} strokeWidth="0.3" strokeDasharray="1,3" />
                                    <text x={padL + chartW + 3} y={gy + 2.5} fontSize="7" fill={trTheme.gridText} fontFamily="monospace" fontWeight="600" textAnchor="start">{fmtChartPrice(priceLabel)}</text>
                                  </g>
                                )
                              })}

                              {/* ── Vertical grid lines with time labels ── */}
                              {(() => {
                                const step = Math.max(1, Math.floor(candleCount / 5))
                                const items: JSX.Element[] = []
                                visibleCandles.forEach((c, i) => {
                                  if (i % step !== 0 && i !== candleCount - 1) return
                                  const vx = padL + (i + 0.5) * candleSpacing
                                  items.push(
                                    <g key={`vg-${i}`}>
                                      <line x1={vx} y1={padT} x2={vx} y2={padT + priceAreaH}
                                        stroke={trTheme.gridLine} strokeWidth="0.3" strokeDasharray="1,3" />
                                      <text x={vx} y={chartH + volH + 8} fontSize="5.5" fill={trTheme.gridText} textAnchor="middle" fontFamily="monospace" fontWeight="600">{c.time}</text>
                                    </g>
                                  )
                                })
                                return items
                              })()}

                              {/* ── Price/Volume separator ── */}
                              <line x1={padL} y1={chartH} x2={padL + chartW} y2={chartH} stroke={trTheme.border} strokeWidth="0.3" />

                              {/* Volume bars — MT5 style thin */}
                              {visibleCandles.map((c, i) => {
                                const x = padL + i * candleSpacing + (candleSpacing - candleBodyW * 0.4) / 2
                                const volBarH = (c.volume / maxVol) * (volH - 4)
                                const isBull = c.close >= c.open
                                return (
                                  <rect key={`vol-${i}`} x={x} y={chartH + volH - volBarH - 1} width={candleBodyW * 0.4} height={Math.max(0.3, volBarH)}
                                    fill={isBull ? 'rgba(38,166,154,0.30)' : 'rgba(239,83,80,0.30)'} />
                                )
                              })}

                              {/* ── Chart Type Rendering ── */}
                              {chartType === 'candle' && visibleCandles.map((c, i) => {
                                const cx = padL + (i + 0.5) * candleSpacing
                                const isBull = c.close >= c.open
                                const bodyTop = yScale(Math.max(c.open, c.close))
                                const bodyBot = yScale(Math.min(c.open, c.close))
                                const bodyH = Math.max(0.6, bodyBot - bodyTop)
                                const wickTop = yScale(c.high)
                                const wickBot = yScale(c.low)
                                const wickW = candleBodyW > 6 ? 1 : 0.7
                                const bullColor = '#26a69a'
                                const bearColor = '#ef5350'
                                const fillColor = isBull ? bullColor : bearColor
                                const strokeColor = isBull ? '#2bbd8e' : '#f87171'
                                return (
                                  <g key={`candle-${i}`}>
                                    {/* Upper wick */}
                                    <line x1={cx} y1={wickTop} x2={cx} y2={bodyTop} stroke={fillColor} strokeWidth={wickW} strokeLinecap="round" />
                                    {/* Lower wick */}
                                    <line x1={cx} y1={bodyBot} x2={cx} y2={wickBot} stroke={fillColor} strokeWidth={wickW} strokeLinecap="round" />
                                    {/* Candle body — solid filled */}
                                    <rect x={cx - candleBodyW / 2} y={bodyTop} width={candleBodyW} height={bodyH}
                                      fill={fillColor} stroke={strokeColor} strokeWidth={candleBodyW > 4 ? 0.4 : 0.2} rx={candleBodyW > 8 ? 0.8 : candleBodyW > 5 ? 0.4 : 0} />
                                    {/* Subtle inner glow for 3D effect */}
                                    {candleBodyW > 5 && bodyH > 2 && (
                                      <rect x={cx - candleBodyW / 2 + 0.5} y={bodyTop + 0.5} width={candleBodyW - 1} height={Math.max(0.3, bodyH * 0.3)}
                                        fill={isBull ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.08)'} rx="0.3" />
                                    )}
                                  </g>
                                )
                              })}

                              {/* Continuous Price Line - smooth spline */}
                              {chartType === 'candle' && (() => {
                                const pts: { x: number; y: number }[] = []
                                visibleCandles.forEach((c, i) => {
                                  pts.push({ x: padL + (i + 0.5) * candleSpacing, y: yScale(c.close) })
                                })
                                if (pts.length < 2) return null
                                let pathD = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`
                                for (let j = 1; j < pts.length; j++) {
                                  const prev = pts[j - 1]
                                  const curr = pts[j]
                                  const cpx = (prev.x + curr.x) / 2
                                  pathD += ` C${cpx.toFixed(1)},${prev.y.toFixed(1)} ${cpx.toFixed(1)},${curr.y.toFixed(1)} ${curr.x.toFixed(1)},${curr.y.toFixed(1)}`
                                }
                                const lineColor = isUp ? 'rgba(38,166,154,' : 'rgba(239,83,80,'
                                return <g>
                                  <path d={pathD} fill="none" stroke={lineColor + '0.12)'} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
                                  <path d={pathD} fill="none" stroke={lineColor + '0.35)'} strokeWidth="0.7" strokeLinejoin="round" strokeLinecap="round" />
                                </g>
                              })()}
                              {/* Line Chart */}
                              {chartType === 'line' && (() => {
                                const pts: { x: number; y: number }[] = []
                                visibleCandles.forEach((c, i) => {
                                  pts.push({ x: padL + (i + 0.5) * candleSpacing, y: yScale(c.close) })
                                })
                                if (pts.length < 2) return null
                                const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
                                const areaD = pathD + ` L${pts[pts.length - 1].x.toFixed(1)},${(padT + priceAreaH).toFixed(1)} L${pts[0].x.toFixed(1)},${(padT + priceAreaH).toFixed(1)} Z`
                                return (
                                  <g>
                                    <defs>
                                      <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={priceColor} stopOpacity="0.15" />
                                        <stop offset="100%" stopColor={priceColor} stopOpacity="0" />
                                      </linearGradient>
                                    </defs>
                                    <path d={areaD} fill="url(#lineAreaGrad)" />
                                    <path d={pathD} fill="none" stroke={priceColor} strokeWidth="1" strokeLinejoin="round" strokeLinecap="round" opacity="0.9" />
                                  </g>
                                )
                              })()}

                              {/* Bar Chart (OHLC bars) */}
                              {chartType === 'bar' && visibleCandles.map((c, i) => {
                                const cx = padL + (i + 0.5) * candleSpacing
                                const isBull = c.close >= c.open
                                const color = isBull ? '#26a69a' : '#ef5350'
                                const wickTop = yScale(c.high)
                                const wickBot = yScale(c.low)
                                const openY = yScale(c.open)
                                const closeY = yScale(c.close)
                                const barHalf = Math.max(1, candleBodyW * 0.35)
                                return (
                                  <g key={`bar-${i}`}>
                                    <line x1={cx} y1={wickTop} x2={cx} y2={wickBot} stroke={color} strokeWidth="0.6" />
                                    <line x1={cx - barHalf} y1={openY} x2={cx} y2={openY} stroke={color} strokeWidth="0.8" />
                                    <line x1={cx} y1={closeY} x2={cx + barHalf} y2={closeY} stroke={color} strokeWidth="0.8" />
                                  </g>
                                )
                              })}

                              {/* ── Indicator Overlays ── */}
                              {/* MA5 */}
                              {activeIndicators.some(a => a.key === 'ma5') && (() => {
                                const ma5 = computeMA(visibleCandles, 5)
                                const pts: { x: number; y: number }[] = []
                                ma5.forEach((v, i) => { if (v !== null) pts.push({ x: padL + (i + 0.5) * candleSpacing, y: yScale(v) }) })
                                if (pts.length < 2) return null
                                const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
                                return <path d={pathD} fill="none" stroke="#eab308" strokeWidth="0.5" opacity="0.45" strokeLinejoin="round" strokeLinecap="round" />
                              })()}
                              {/* MA20 */}
                              {activeIndicators.some(a => a.key === 'ma20') && (() => {
                                const ma20 = computeMA(visibleCandles, 20)
                                const pts: { x: number; y: number }[] = []
                                ma20.forEach((v, i) => { if (v !== null) pts.push({ x: padL + (i + 0.5) * candleSpacing, y: yScale(v) }) })
                                if (pts.length < 2) return null
                                const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
                                return <path d={pathD} fill="none" stroke="#06b6d4" strokeWidth="0.5" opacity="0.35" strokeLinejoin="round" strokeLinecap="round" />
                              })()}

                              {/* Bollinger Bands */}
                              {activeIndicators.some(a => a.key === 'bollinger') && (() => {
                                const bb = computeBollinger(visibleCandles)
                                const upperPts: { x: number; y: number }[] = []
                                const lowerPts: { x: number; y: number }[] = []
                                bb.upper.forEach((v, i) => { if (v !== null) upperPts.push({ x: padL + (i + 0.5) * candleSpacing, y: yScale(v) }) })
                                bb.lower.forEach((v, i) => { if (v !== null) lowerPts.push({ x: padL + (i + 0.5) * candleSpacing, y: yScale(v) }) })
                                if (upperPts.length < 2 || lowerPts.length < 2) return null
                                const upperPath = upperPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
                                const lowerPath = lowerPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
                                const fillPath = upperPath + ' ' + lowerPts.slice().reverse().map((p, i) => `${i === 0 ? 'L' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z'
                                return (
                                  <g>
                                    <path d={fillPath} fill="rgba(139,92,246,0.04)" />
                                    <path d={upperPath} fill="none" stroke="#8b5cf6" strokeWidth="0.4" opacity="0.5" strokeLinejoin="round" />
                                    <path d={lowerPath} fill="none" stroke="#8b5cf6" strokeWidth="0.4" opacity="0.5" strokeLinejoin="round" />
                                  </g>
                                )
                              })()}

                              {/* Envelopes */}
                              {activeIndicators.some(a => a.key === 'envelopes') && (() => {
                                const env = computeEnvelopes(visibleCandles)
                                const upperPts: { x: number; y: number }[] = []
                                const lowerPts: { x: number; y: number }[] = []
                                env.upper.forEach((v, i) => { if (v !== null) upperPts.push({ x: padL + (i + 0.5) * candleSpacing, y: yScale(v) }) })
                                env.lower.forEach((v, i) => { if (v !== null) lowerPts.push({ x: padL + (i + 0.5) * candleSpacing, y: yScale(v) }) })
                                if (upperPts.length < 2 || lowerPts.length < 2) return null
                                const upperPath = upperPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
                                const lowerPath = lowerPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
                                const fillPath = upperPath + ' ' + lowerPts.slice().reverse().map(p => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z'
                                return (
                                  <g>
                                    <path d={fillPath} fill="rgba(20,184,166,0.03)" />
                                    <path d={upperPath} fill="none" stroke="#14b8a6" strokeWidth="0.4" opacity="0.45" strokeLinejoin="round" />
                                    <path d={lowerPath} fill="none" stroke="#14b8a6" strokeWidth="0.4" opacity="0.45" strokeLinejoin="round" />
                                  </g>
                                )
                              })()}

                              {/* Ichimoku Kinko Hyo */}
                              {activeIndicators.some(a => a.key === 'ichimoku') && (() => {
                                const ich = computeIchimoku(visibleCandles)
                                const mkPts = (arr: (number | null)[]) => { const pts: { x: number; y: number }[] = []; arr.forEach((v, i) => { if (v !== null) pts.push({ x: padL + (i + 0.5) * candleSpacing, y: yScale(v) }) }); return pts }
                                const mkPath = (pts: { x: number; y: number }[]) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
                                const tenkanPts = mkPts(ich.tenkan)
                                const kijunPts = mkPts(ich.kijun)
                                const senkouAPts = mkPts(ich.senkouA)
                                const senkouBPts = mkPts(ich.senkouB)
                                const chikouPts = mkPts(ich.chikou)
                                // Cloud fill
                                let cloudFill: JSX.Element | null = null
                                if (senkouAPts.length >= 2 && senkouBPts.length >= 2) {
                                  const aPath = mkPath(senkouAPts)
                                  const bPath = mkPath(senkouBPts)
                                  const fillD = aPath + ' ' + senkouBPts.slice().reverse().map(p => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z'
                                  cloudFill = <path d={fillD} fill="rgba(234,179,8,0.04)" />
                                }
                                return (
                                  <g>
                                    {cloudFill}
                                    {tenkanPts.length >= 2 && <path d={mkPath(tenkanPts)} fill="none" stroke="#eab308" strokeWidth="0.4" opacity="0.5" strokeLinejoin="round" />}
                                    {kijunPts.length >= 2 && <path d={mkPath(kijunPts)} fill="none" stroke="#3b82f6" strokeWidth="0.4" opacity="0.5" strokeLinejoin="round" />}
                                    {senkouAPts.length >= 2 && <path d={mkPath(senkouAPts)} fill="none" stroke="#22c55e" strokeWidth="0.3" opacity="0.35" strokeLinejoin="round" strokeDasharray="2,1" />}
                                    {senkouBPts.length >= 2 && <path d={mkPath(senkouBPts)} fill="none" stroke="#ef4444" strokeWidth="0.3" opacity="0.35" strokeLinejoin="round" strokeDasharray="2,1" />}
                                    {chikouPts.length >= 2 && <path d={mkPath(chikouPts)} fill="none" stroke="#a855f7" strokeWidth="0.3" opacity="0.3" strokeLinejoin="round" />}
                                  </g>
                                )
                              })()}

                              {/* Parabolic SAR */}
                              {activeIndicators.some(a => a.key === 'sar') && (() => {
                                const sarData = computeSAR(visibleCandles)
                                return (
                                  <g>
                                    {sarData.map((v, i) => {
                                      if (v === null) return null
                                      const cx = padL + (i + 0.5) * candleSpacing
                                      const cy = yScale(v)
                                      const isAbove = v > visibleCandles[i].close
                                      return <circle key={`sar-${i}`} cx={cx} cy={cy} r={candleSpacing > 4 ? 1.2 : 0.8} fill={isAbove ? 'rgba(239,83,80,0.5)' : 'rgba(34,197,94,0.5)'} />
                                    })}
                                  </g>
                                )
                              })()}

                              {/* ZigZag */}
                              {activeIndicators.some(a => a.key === 'zigzag') && (() => {
                                const zzData = computeZigZag(visibleCandles)
                                const pts: { x: number; y: number }[] = []
                                zzData.forEach((v, i) => { if (v !== null) pts.push({ x: padL + (i + 0.5) * candleSpacing, y: yScale(v) }) })
                                if (pts.length < 2) return null
                                const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
                                return <path d={pathD} fill="none" stroke="#a855f7" strokeWidth="0.6" opacity="0.5" strokeLinejoin="round" strokeLinecap="round" />
                              })()}

                              {/* Alligator */}
                              {activeIndicators.some(a => a.key === 'alligator') && (() => {
                                const alg = computeAlligator(visibleCandles)
                                const mkPts = (arr: (number | null)[]) => { const pts: { x: number; y: number }[] = []; arr.forEach((v, i) => { if (v !== null) pts.push({ x: padL + (i + 0.5) * candleSpacing, y: yScale(v) }) }); return pts }
                                const mkPath = (pts: { x: number; y: number }[]) => pts.length >= 2 ? pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') : ''
                                const jawPts = mkPts(alg.jaw)
                                const teethPts = mkPts(alg.teeth)
                                const lipsPts = mkPts(alg.lips)
                                return (
                                  <g>
                                    {jawPts.length >= 2 && <path d={mkPath(jawPts)} fill="none" stroke="#3b82f6" strokeWidth="0.5" opacity="0.4" strokeLinejoin="round" />}
                                    {teethPts.length >= 2 && <path d={mkPath(teethPts)} fill="none" stroke="#ef4444" strokeWidth="0.5" opacity="0.4" strokeLinejoin="round" />}
                                    {lipsPts.length >= 2 && <path d={mkPath(lipsPts)} fill="none" stroke="#22c55e" strokeWidth="0.5" opacity="0.4" strokeLinejoin="round" />}
                                  </g>
                                )
                              })()}

                              {/* Fractals */}
                              {activeIndicators.some(a => a.key === 'fractals') && (() => {
                                const frac = computeFractals(visibleCandles)
                                return (
                                  <g>
                                    {frac.up.map((v, i) => {
                                      if (!v) return null
                                      const cx = padL + (i + 0.5) * candleSpacing
                                      const cy = yScale(visibleCandles[i].high) - 3
                                      return <polygon key={`frac-up-${i}`} points={`${cx},${cy} ${cx-1.5},${cy-2.5} ${cx+1.5},${cy-2.5}`} fill="rgba(239,83,80,0.5)" />
                                    })}
                                    {frac.down.map((v, i) => {
                                      if (!v) return null
                                      const cx = padL + (i + 0.5) * candleSpacing
                                      const cy = yScale(visibleCandles[i].low) + 3
                                      return <polygon key={`frac-dn-${i}`} points={`${cx},${cy} ${cx-1.5},${cy+2.5} ${cx+1.5},${cy+2.5}`} fill="rgba(34,197,94,0.5)" />
                                    })}
                                  </g>
                                )
                              })()}

                              {/* ── Sub-chart Indicators (dynamic, max 3) ── */}
                              {visibleSubCharts.map((subInd, subIdx) => {
                                const subY = padT + priceAreaH + volH + timeAxisH + subIdx * 44 + 2
                                const subH = 40
                                const subPad = 2
                                const xOf = (i: number) => padL + (i + 0.5) * candleSpacing
                                const indColor = subInd.color
                                const indKey = subInd.key
                                const indLabel = subInd.label

                                // Helper: make line path from array
                                const mkLine = (arr: (number | null)[], yFn: (v: number) => number) => {
                                  const pts: { x: number; y: number }[] = []
                                  arr.forEach((v, i) => { if (v !== null) pts.push({ x: xOf(i), y: yFn(v) }) })
                                  return pts.length >= 2 ? pts.map((p, j) => `${j === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') : null
                                }

                                // Helper: auto-scale from array
                                const autoScale = (arr: (number | null)[], pad = 2) => {
                                  const vals = arr.filter((v): v is number => v !== null)
                                  if (vals.length === 0) return { min: -1, max: 1, yFn: (v: number) => subY + subH / 2 }
                                  const mn = Math.min(...vals), mx = Math.max(...vals)
                                  const range = mx - mn || 1
                                  const scaledMin = mn - range * 0.05, scaledMax = mx + range * 0.05
                                  const scaledRange = scaledMax - scaledMin
                                  return { min: scaledMin, max: scaledMax, yFn: (v: number) => subY + subPad + ((scaledMax - v) / scaledRange) * (subH - subPad * 2) }
                                }

                                // Helper: fixed range scale
                                const fixedScale = (lo: number, hi: number) => {
                                  const range = hi - lo
                                  return (v: number) => subY + subPad + ((hi - v) / range) * (subH - subPad * 2)
                                }

                                // Helper: zero-centered auto-scale
                                const zeroScale = (arr: (number | null)[]) => {
                                  const vals = arr.filter((v): v is number => v !== null)
                                  const maxAbs = Math.max(...vals.map(Math.abs), 0.001)
                                  return (v: number) => subY + subH / 2 - (v / maxAbs) * (subH / 2 - subPad)
                                }

                                // Background & label for every sub-chart
                                const bgRect = <rect x={padL} y={subY} width={chartW} height={subH} fill={`${indColor}03`} rx="1" />
                                const labelText = <text x={padL + 2} y={subY + 5} fontSize="4.5" fill={`${indColor}80`} fontFamily="monospace" fontWeight="700">{indLabel}</text>

                                switch (indKey) {
                                  case 'rsi': {
                                    const data = computeRSI(visibleCandles)
                                    const yFn = fixedScale(0, 100)
                                    const line = mkLine(data, yFn)
                                    return (
                                      <g key={indKey}>
                                        {bgRect}{labelText}
                                        <line x1={padL} y1={yFn(70)} x2={padL + chartW} y2={yFn(70)} stroke="rgba(239,83,80,0.2)" strokeWidth="0.3" strokeDasharray="2,2" />
                                        <line x1={padL} y1={yFn(30)} x2={padL + chartW} y2={yFn(30)} stroke="rgba(34,197,94,0.2)" strokeWidth="0.3" strokeDasharray="2,2" />
                                        <line x1={padL} y1={yFn(50)} x2={padL + chartW} y2={yFn(50)} stroke={trTheme.gridLine} strokeWidth="0.2" />
                                        <text x={padL + chartW + 2} y={yFn(70) + 2} fontSize="4" fill="rgba(239,83,80,0.35)" fontFamily="monospace">70</text>
                                        <text x={padL + chartW + 2} y={yFn(30) + 2} fontSize="4" fill="rgba(34,197,94,0.35)" fontFamily="monospace">30</text>
                                        {line && <path d={line} fill="none" stroke={indColor} strokeWidth="0.5" opacity="0.7" strokeLinejoin="round" />}
                                      </g>
                                    )
                                  }
                                  case 'macd': {
                                    const data = computeMACD(visibleCandles)
                                    const yFn = zeroScale([...data.macd, ...data.signal].filter((v): v is number => v !== null))
                                    const macdLine = mkLine(data.macd, yFn)
                                    const sigLine = mkLine(data.signal, yFn)
                                    return (
                                      <g key={indKey}>
                                        {bgRect}{labelText}
                                        <line x1={padL} y1={subY + subH / 2} x2={padL + chartW} y2={subY + subH / 2} stroke={trTheme.border} strokeWidth="0.3" />
                                        {data.histogram.map((v, i) => {
                                          if (v === null) return null
                                          const x = padL + i * candleSpacing + candleSpacing * 0.15
                                          const w = candleSpacing * 0.7
                                          const y0 = subY + subH / 2
                                          const y1 = yFn(v)
                                          return <rect key={`macd-h-${i}`} x={x} y={Math.min(y0, y1)} width={Math.max(0.3, w)} height={Math.abs(y1 - y0)} fill={v >= 0 ? 'rgba(34,197,94,0.3)' : 'rgba(239,83,80,0.3)'} rx="0.3" />
                                        })}
                                        {macdLine && <path d={macdLine} fill="none" stroke="#3b82f6" strokeWidth="0.5" opacity="0.7" strokeLinejoin="round" />}
                                        {sigLine && <path d={sigLine} fill="none" stroke="#ef5350" strokeWidth="0.4" opacity="0.5" strokeLinejoin="round" />}
                                      </g>
                                    )
                                  }
                                  case 'adx': {
                                    const data = computeADX(visibleCandles)
                                    const yFn = fixedScale(0, 100)
                                    const adxLine = mkLine(data.adx, yFn)
                                    const pdiLine = mkLine(data.plusDI, yFn)
                                    const mdiLine = mkLine(data.minusDI, yFn)
                                    return (
                                      <g key={indKey}>
                                        {bgRect}{labelText}
                                        <line x1={padL} y1={yFn(25)} x2={padL + chartW} y2={yFn(25)} stroke={trTheme.gridLine} strokeWidth="0.2" strokeDasharray="2,2" />
                                        <text x={padL + chartW + 2} y={yFn(25) + 2} fontSize="4" fill={`${indColor}40`} fontFamily="monospace">25</text>
                                        {adxLine && <path d={adxLine} fill="none" stroke={indColor} strokeWidth="0.6" opacity="0.7" strokeLinejoin="round" />}
                                        {pdiLine && <path d={pdiLine} fill="none" stroke="#22c55e" strokeWidth="0.4" opacity="0.5" strokeLinejoin="round" />}
                                        {mdiLine && <path d={mdiLine} fill="none" stroke="#ef4444" strokeWidth="0.4" opacity="0.5" strokeLinejoin="round" />}
                                      </g>
                                    )
                                  }
                                  case 'atr': {
                                    const data = computeATR(visibleCandles)
                                    const { yFn } = autoScale(data)
                                    const line = mkLine(data, yFn)
                                    return (
                                      <g key={indKey}>
                                        {bgRect}{labelText}
                                        {line && <path d={line} fill="none" stroke={indColor} strokeWidth="0.5" opacity="0.7" strokeLinejoin="round" />}
                                      </g>
                                    )
                                  }
                                  case 'bears': {
                                    const data = computeBearsPower(visibleCandles)
                                    const yFn = zeroScale(data)
                                    const line = mkLine(data, yFn)
                                    return (
                                      <g key={indKey}>
                                        {bgRect}{labelText}
                                        <line x1={padL} y1={subY + subH / 2} x2={padL + chartW} y2={subY + subH / 2} stroke={trTheme.border} strokeWidth="0.3" />
                                        {line && <path d={line} fill="none" stroke={indColor} strokeWidth="0.5" opacity="0.7" strokeLinejoin="round" />}
                                      </g>
                                    )
                                  }
                                  case 'bulls': {
                                    const data = computeBullsPower(visibleCandles)
                                    const yFn = zeroScale(data)
                                    const line = mkLine(data, yFn)
                                    return (
                                      <g key={indKey}>
                                        {bgRect}{labelText}
                                        <line x1={padL} y1={subY + subH / 2} x2={padL + chartW} y2={subY + subH / 2} stroke={trTheme.border} strokeWidth="0.3" />
                                        {line && <path d={line} fill="none" stroke={indColor} strokeWidth="0.5" opacity="0.7" strokeLinejoin="round" />}
                                      </g>
                                    )
                                  }
                                  case 'cci': {
                                    const data = computeCCI(visibleCandles)
                                    const yFn = zeroScale(data)
                                    const line = mkLine(data, yFn)
                                    return (
                                      <g key={indKey}>
                                        {bgRect}{labelText}
                                        <line x1={padL} y1={subY + subH / 2} x2={padL + chartW} y2={subY + subH / 2} stroke={trTheme.border} strokeWidth="0.3" />
                                        <line x1={padL} y1={yFn(100)} x2={padL + chartW} y2={yFn(100)} stroke="rgba(239,83,80,0.15)" strokeWidth="0.3" strokeDasharray="2,2" />
                                        <line x1={padL} y1={yFn(-100)} x2={padL + chartW} y2={yFn(-100)} stroke="rgba(34,197,94,0.15)" strokeWidth="0.3" strokeDasharray="2,2" />
                                        {line && <path d={line} fill="none" stroke={indColor} strokeWidth="0.5" opacity="0.7" strokeLinejoin="round" />}
                                      </g>
                                    )
                                  }
                                  case 'demarker': {
                                    const data = computeDeMarker(visibleCandles)
                                    const yFn = fixedScale(0, 1)
                                    const line = mkLine(data, yFn)
                                    return (
                                      <g key={indKey}>
                                        {bgRect}{labelText}
                                        <line x1={padL} y1={yFn(0.7)} x2={padL + chartW} y2={yFn(0.7)} stroke="rgba(239,83,80,0.2)" strokeWidth="0.3" strokeDasharray="2,2" />
                                        <line x1={padL} y1={yFn(0.3)} x2={padL + chartW} y2={yFn(0.3)} stroke="rgba(34,197,94,0.2)" strokeWidth="0.3" strokeDasharray="2,2" />
                                        <line x1={padL} y1={yFn(0.5)} x2={padL + chartW} y2={yFn(0.5)} stroke={trTheme.gridLine} strokeWidth="0.2" />
                                        {line && <path d={line} fill="none" stroke={indColor} strokeWidth="0.5" opacity="0.7" strokeLinejoin="round" />}
                                      </g>
                                    )
                                  }
                                  case 'force': {
                                    const data = computeForceIndex(visibleCandles)
                                    const yFn = zeroScale(data)
                                    const line = mkLine(data, yFn)
                                    return (
                                      <g key={indKey}>
                                        {bgRect}{labelText}
                                        <line x1={padL} y1={subY + subH / 2} x2={padL + chartW} y2={subY + subH / 2} stroke={trTheme.border} strokeWidth="0.3" />
                                        {line && <path d={line} fill="none" stroke={indColor} strokeWidth="0.5" opacity="0.7" strokeLinejoin="round" />}
                                      </g>
                                    )
                                  }
                                  case 'momentum': {
                                    const data = computeMomentum(visibleCandles)
                                    const yFn = zeroScale(data)
                                    const line = mkLine(data, yFn)
                                    return (
                                      <g key={indKey}>
                                        {bgRect}{labelText}
                                        <line x1={padL} y1={subY + subH / 2} x2={padL + chartW} y2={subY + subH / 2} stroke={trTheme.border} strokeWidth="0.3" />
                                        {line && <path d={line} fill="none" stroke={indColor} strokeWidth="0.5" opacity="0.7" strokeLinejoin="round" />}
                                      </g>
                                    )
                                  }
                                  case 'osma': {
                                    const data = computeOsMA(visibleCandles)
                                    const yFn = zeroScale(data)
                                    return (
                                      <g key={indKey}>
                                        {bgRect}{labelText}
                                        <line x1={padL} y1={subY + subH / 2} x2={padL + chartW} y2={subY + subH / 2} stroke={trTheme.border} strokeWidth="0.3" />
                                        {data.map((v, i) => {
                                          if (v === null) return null
                                          const x = padL + i * candleSpacing + candleSpacing * 0.15
                                          const w = candleSpacing * 0.7
                                          const y0 = subY + subH / 2
                                          const y1 = yFn(v)
                                          return <rect key={`osma-h-${i}`} x={x} y={Math.min(y0, y1)} width={Math.max(0.3, w)} height={Math.abs(y1 - y0)} fill={v >= 0 ? 'rgba(34,197,94,0.3)' : 'rgba(239,83,80,0.3)'} rx="0.3" />
                                        })}
                                      </g>
                                    )
                                  }
                                  case 'rvi': {
                                    const data = computeRVI(visibleCandles)
                                    const yFn = zeroScale([...data.rvi, ...data.signal].filter((v): v is number => v !== null))
                                    const rviLine = mkLine(data.rvi, yFn)
                                    const sigLine = mkLine(data.signal, yFn)
                                    return (
                                      <g key={indKey}>
                                        {bgRect}{labelText}
                                        <line x1={padL} y1={subY + subH / 2} x2={padL + chartW} y2={subY + subH / 2} stroke={trTheme.border} strokeWidth="0.3" />
                                        {rviLine && <path d={rviLine} fill="none" stroke={indColor} strokeWidth="0.5" opacity="0.7" strokeLinejoin="round" />}
                                        {sigLine && <path d={sigLine} fill="none" stroke="#ef5350" strokeWidth="0.4" opacity="0.5" strokeLinejoin="round" />}
                                      </g>
                                    )
                                  }
                                  case 'stochastic': {
                                    const data = computeStochastic(visibleCandles)
                                    const yFn = fixedScale(0, 100)
                                    const kLine = mkLine(data.k, yFn)
                                    const dLine = mkLine(data.d, yFn)
                                    return (
                                      <g key={indKey}>
                                        {bgRect}{labelText}
                                        <line x1={padL} y1={yFn(80)} x2={padL + chartW} y2={yFn(80)} stroke="rgba(239,83,80,0.2)" strokeWidth="0.3" strokeDasharray="2,2" />
                                        <line x1={padL} y1={yFn(20)} x2={padL + chartW} y2={yFn(20)} stroke="rgba(34,197,94,0.2)" strokeWidth="0.3" strokeDasharray="2,2" />
                                        <line x1={padL} y1={yFn(50)} x2={padL + chartW} y2={yFn(50)} stroke={trTheme.gridLine} strokeWidth="0.2" />
                                        {kLine && <path d={kLine} fill="none" stroke={indColor} strokeWidth="0.5" opacity="0.7" strokeLinejoin="round" />}
                                        {dLine && <path d={dLine} fill="none" stroke="#3b82f6" strokeWidth="0.4" opacity="0.5" strokeLinejoin="round" />}
                                      </g>
                                    )
                                  }
                                  case 'williamsr': {
                                    const data = computeWilliamsR(visibleCandles)
                                    const yFn = fixedScale(-100, 0)
                                    const line = mkLine(data, yFn)
                                    return (
                                      <g key={indKey}>
                                        {bgRect}{labelText}
                                        <line x1={padL} y1={yFn(-20)} x2={padL + chartW} y2={yFn(-20)} stroke="rgba(239,83,80,0.2)" strokeWidth="0.3" strokeDasharray="2,2" />
                                        <line x1={padL} y1={yFn(-80)} x2={padL + chartW} y2={yFn(-80)} stroke="rgba(34,197,94,0.2)" strokeWidth="0.3" strokeDasharray="2,2" />
                                        <line x1={padL} y1={yFn(-50)} x2={padL + chartW} y2={yFn(-50)} stroke={trTheme.gridLine} strokeWidth="0.2" />
                                        {line && <path d={line} fill="none" stroke={indColor} strokeWidth="0.5" opacity="0.7" strokeLinejoin="round" />}
                                      </g>
                                    )
                                  }
                                  case 'ad': {
                                    const data = computeAD(visibleCandles)
                                    const dataNullable: (number | null)[] = data
                                    const { yFn } = autoScale(dataNullable)
                                    const line = mkLine(dataNullable, yFn)
                                    return (
                                      <g key={indKey}>
                                        {bgRect}{labelText}
                                        {line && <path d={line} fill="none" stroke={indColor} strokeWidth="0.5" opacity="0.7" strokeLinejoin="round" />}
                                      </g>
                                    )
                                  }
                                  case 'mfi': {
                                    const data = computeMFI(visibleCandles)
                                    const yFn = fixedScale(0, 100)
                                    const line = mkLine(data, yFn)
                                    return (
                                      <g key={indKey}>
                                        {bgRect}{labelText}
                                        <line x1={padL} y1={yFn(80)} x2={padL + chartW} y2={yFn(80)} stroke="rgba(239,83,80,0.2)" strokeWidth="0.3" strokeDasharray="2,2" />
                                        <line x1={padL} y1={yFn(20)} x2={padL + chartW} y2={yFn(20)} stroke="rgba(34,197,94,0.2)" strokeWidth="0.3" strokeDasharray="2,2" />
                                        {line && <path d={line} fill="none" stroke={indColor} strokeWidth="0.5" opacity="0.7" strokeLinejoin="round" />}
                                      </g>
                                    )
                                  }
                                  case 'obv': {
                                    const data = computeOBV(visibleCandles)
                                    const dataNullable: (number | null)[] = data
                                    const { yFn } = autoScale(dataNullable)
                                    const line = mkLine(dataNullable, yFn)
                                    return (
                                      <g key={indKey}>
                                        {bgRect}{labelText}
                                        {line && <path d={line} fill="none" stroke={indColor} strokeWidth="0.5" opacity="0.7" strokeLinejoin="round" />}
                                      </g>
                                    )
                                  }
                                  case 'volumes': {
                                    const data = visibleCandles.map(c => c.volume)
                                    const { yFn } = autoScale(data.map(v => v as number | null), 2)
                                    return (
                                      <g key={indKey}>
                                        {bgRect}{labelText}
                                        {data.map((v, i) => {
                                          const x = padL + i * candleSpacing + candleSpacing * 0.1
                                          const w = candleSpacing * 0.8
                                          const y1 = yFn(v)
                                          const y0 = yFn(0)
                                          const isBull = visibleCandles[i].close >= visibleCandles[i].open
                                          return <rect key={`vol-h-${i}`} x={x} y={Math.min(y0, y1)} width={Math.max(0.3, w)} height={Math.abs(y1 - y0)} fill={isBull ? 'rgba(34,197,94,0.25)' : 'rgba(239,83,80,0.25)'} rx="0.3" />
                                        })}
                                      </g>
                                    )
                                  }
                                  case 'ac': {
                                    const data = computeAC(visibleCandles)
                                    const yFn = zeroScale(data)
                                    return (
                                      <g key={indKey}>
                                        {bgRect}{labelText}
                                        <line x1={padL} y1={subY + subH / 2} x2={padL + chartW} y2={subY + subH / 2} stroke={trTheme.border} strokeWidth="0.3" />
                                        {data.map((v, i) => {
                                          if (v === null) return null
                                          const x = padL + i * candleSpacing + candleSpacing * 0.1
                                          const w = candleSpacing * 0.8
                                          const y0 = subY + subH / 2
                                          const y1 = yFn(v)
                                          const prev = i > 0 && data[i-1] !== null ? data[i-1]! : 0
                                          const barColor = v > prev ? 'rgba(34,197,94,0.35)' : 'rgba(239,83,80,0.35)'
                                          return <rect key={`ac-h-${i}`} x={x} y={Math.min(y0, y1)} width={Math.max(0.3, w)} height={Math.abs(y1 - y0)} fill={barColor} rx="0.3" />
                                        })}
                                      </g>
                                    )
                                  }
                                  case 'ao': {
                                    const data = computeAO(visibleCandles)
                                    const yFn = zeroScale(data)
                                    return (
                                      <g key={indKey}>
                                        {bgRect}{labelText}
                                        <line x1={padL} y1={subY + subH / 2} x2={padL + chartW} y2={subY + subH / 2} stroke={trTheme.border} strokeWidth="0.3" />
                                        {data.map((v, i) => {
                                          if (v === null) return null
                                          const x = padL + i * candleSpacing + candleSpacing * 0.1
                                          const w = candleSpacing * 0.8
                                          const y0 = subY + subH / 2
                                          const y1 = yFn(v)
                                          const prev = i > 0 && data[i-1] !== null ? data[i-1]! : 0
                                          const barColor = v > prev ? 'rgba(34,197,94,0.35)' : 'rgba(239,83,80,0.35)'
                                          return <rect key={`ao-h-${i}`} x={x} y={Math.min(y0, y1)} width={Math.max(0.3, w)} height={Math.abs(y1 - y0)} fill={barColor} rx="0.3" />
                                        })}
                                      </g>
                                    )
                                  }
                                  case 'gator': {
                                    const data = computeGator(visibleCandles)
                                    const allVals = [...data.upper, ...data.lower].filter((v): v is number => v !== null)
                                    const maxAbs = Math.max(...allVals.map(Math.abs), 0.001)
                                    const yFn = (v: number) => subY + subH / 2 - (v / maxAbs) * (subH / 2 - subPad)
                                    return (
                                      <g key={indKey}>
                                        {bgRect}{labelText}
                                        <line x1={padL} y1={subY + subH / 2} x2={padL + chartW} y2={subY + subH / 2} stroke={trTheme.border} strokeWidth="0.3" />
                                        {data.upper.map((v, i) => {
                                          if (v === null) return null
                                          const x = padL + i * candleSpacing + candleSpacing * 0.1
                                          const w = candleSpacing * 0.8
                                          const y0 = yFn(0)
                                          const y1 = yFn(v)
                                          const prev = i > 0 && data.upper[i-1] !== null ? data.upper[i-1]! : 0
                                          const barColor = v > prev ? 'rgba(34,197,94,0.35)' : 'rgba(34,197,94,0.2)'
                                          return <rect key={`gator-u-${i}`} x={x} y={Math.min(y0, y1)} width={Math.max(0.3, w)} height={Math.abs(y1 - y0)} fill={barColor} rx="0.3" />
                                        })}
                                        {data.lower.map((v, i) => {
                                          if (v === null) return null
                                          const x = padL + i * candleSpacing + candleSpacing * 0.1
                                          const w = candleSpacing * 0.8
                                          const y0 = yFn(0)
                                          const y1 = yFn(v)
                                          const prev = i > 0 && data.lower[i-1] !== null ? data.lower[i-1]! : 0
                                          const barColor = v < prev ? 'rgba(239,83,80,0.35)' : 'rgba(239,83,80,0.2)'
                                          return <rect key={`gator-l-${i}`} x={x} y={Math.min(y0, y1)} width={Math.max(0.3, w)} height={Math.abs(y1 - y0)} fill={barColor} rx="0.3" />
                                        })}
                                      </g>
                                    )
                                  }
                                  case 'bwMFI': {
                                    const data = computeBWIMFI(visibleCandles)
                                    const dataN: (number | null)[] = data
                                    const { yFn } = autoScale(dataN)
                                    const line = mkLine(dataN, yFn)
                                    return (
                                      <g key={indKey}>
                                        {bgRect}{labelText}
                                        {line && <path d={line} fill="none" stroke={indColor} strokeWidth="0.5" opacity="0.7" strokeLinejoin="round" />}
                                      </g>
                                    )
                                  }
                                  case 'stddev': {
                                    const data = computeStdDev(visibleCandles)
                                    const { yFn } = autoScale(data)
                                    const line = mkLine(data, yFn)
                                    return (
                                      <g key={indKey}>
                                        {bgRect}{labelText}
                                        {line && <path d={line} fill="none" stroke={indColor} strokeWidth="0.5" opacity="0.7" strokeLinejoin="round" />}
                                      </g>
                                    )
                                  }
                                  default:
                                    return null
                                }
                              })}

                              {/* Indicator Legend — top area */}
                              <g opacity="0.55">
                                {activeIndicators.map((ind, idx) => (
                                  <g key={`legend-${ind.key}`}>
                                    <line x1={padL + 4 + idx * 32} y1={padT - 5} x2={padL + 12 + idx * 32} y2={padT - 5} stroke={ind.color} strokeWidth="0.7" />
                                    <text x={padL + 14 + idx * 32} y={padT - 3} fontSize="5.5" fill={ind.color} fontFamily="monospace" fontWeight="700">{ind.label}</text>
                                  </g>
                                ))}
                              </g>

                              {/* Position entry lines — MT5 order lines */}
                              {activePositions.map(pos => {
                                const entryY = yScale(pos.startPrice)
                                const isPosBuy = pos.direction === 'NAIK'
                                const lineColor = isPosBuy ? '#2962ff' : '#ef5350'
                                const livePL = getPositionLivePL(pos)
                                const lotSize = (pos.amount / LOT_SIZE).toFixed(2)
                                const plStr = livePL >= 0 ? `+${formatRupiah(livePL)}` : formatRupiah(livePL)
                                const labelText = `${isPosBuy ? 'BUY' : 'SELL'} ${lotSize}, ${plStr}`
                                const labelW = labelText.length * 3.2 + 6
                                return (
                                  <g key={`pos-line-${pos.id}`}>
                                    <line x1={padL} y1={entryY} x2={padL + chartW} y2={entryY}
                                      stroke={lineColor} strokeWidth="0.5" strokeDasharray="3,2" opacity="0.45" />
                                    <rect x={padL + 3} y={entryY - 4.5} width={labelW} height="9" rx="1" fill={lineColor} opacity="0.9" />
                                    <text x={padL + 3 + labelW / 2} y={entryY + 2} fontSize="5" fill="white" textAnchor="middle" fontWeight="bold" fontFamily="monospace">{labelText}</text>
                                  </g>
                                )
                              })}

                              {/* Current price line — solid with glow */}
                              <line x1={padL} y1={yLast} x2={padL + chartW} y2={yLast}
                                stroke={priceColor} strokeWidth="0.5" strokeDasharray="4,2" opacity="0.55" />
                              {/* Subtle glow under price line */}
                              <line x1={padL} y1={yLast} x2={padL + chartW} y2={yLast}
                                stroke={priceColor} strokeWidth="3" opacity="0.06" />

                              {/* Current price dot — glowing */}
                              <circle cx={padL + chartW} cy={yLast} r="2" fill={priceColor} filter="url(#glowDot)">
                                <animate attributeName="r" values="2;3;2" dur="2s" repeatCount="indefinite" />
                              </circle>

                              {/* Current price badge — right edge MT5 style */}
                              <rect x={padL + chartW + 0.5} y={yLast - 6} width={padR - 1} height="12" rx="1.5" fill="url(#priceBadgeGrad)" />
                              <text x={padL + chartW + padR / 2} y={yLast + 3} fontSize="6.5" fill="white" textAnchor="middle" fontWeight="800" fontFamily="monospace">{fmtChartPrice(lastPrice)}</text>

                              {/* Crosshair — Premium MT5 Style with candle snapping */}
                              {sinyalCrosshair && (() => {
                                const rawSvgX = (sinyalCrosshair.x / sinyalCrosshair.w) * W
                                const svgY = (sinyalCrosshair.y / sinyalCrosshair.h) * H
                                // Snap vertical line to nearest candle center
                                const rawCandleIdx = (rawSvgX - padL) / candleSpacing - 0.5
                                const snappedIdx = Math.max(0, Math.min(visibleCandles.length - 1, Math.round(rawCandleIdx)))
                                const svgX = padL + (snappedIdx + 0.5) * candleSpacing
                                const crossPrice = paddedMax - ((svgY - padT) / priceAreaH) * paddedRange
                                const hoveredCandle = snappedIdx >= 0 && snappedIdx < visibleCandles.length ? visibleCandles[snappedIdx] : null
                                const timeLabel = hoveredCandle ? hoveredCandle.time : ''
                                const crosshairColor = isTrDark ? 'rgba(160,175,195,0.6)' : 'rgba(60,60,60,0.5)'
                                const crosshairDotColor = isUp ? '#26a69a' : '#ef5350'
                                return (
                                  <g>
                                    {/* Vertical crosshair line — snapped to candle center */}
                                    <line x1={svgX} y1={padT} x2={svgX} y2={chartH + volH + timeAxisH}
                                      stroke={crosshairColor} strokeWidth="0.5" strokeDasharray="3,2" />
                                    {/* Horizontal crosshair line */}
                                    <line x1={padL} y1={svgY} x2={padL + chartW} y2={svgY}
                                      stroke={crosshairColor} strokeWidth="0.5" strokeDasharray="3,2" />
                                    {/* Crosshair center dot */}
                                    {svgY > padT && svgY < padT + priceAreaH && svgX > padL && svgX < padL + chartW && (
                                      <>
                                        <circle cx={svgX} cy={svgY} r="3" fill={crosshairDotColor} opacity="0.15" />
                                        <circle cx={svgX} cy={svgY} r="1.8" fill={crosshairDotColor} opacity="0.8" />
                                        <circle cx={svgX} cy={svgY} r="0.6" fill="#ffffff" opacity="0.9" />
                                      </>
                                    )}
                                    {/* Price label on right axis */}
                                    {svgY > padT && svgY < padT + priceAreaH && (
                                      <>
                                        <rect x={padL + chartW + 0.5} y={svgY - 6.5} width={padR - 1} height="13" rx="2"
                                          fill={crosshairDotColor} stroke="none" />
                                        <text x={padL + chartW + padR / 2} y={svgY + 3} fontSize="7" fill="#ffffff" textAnchor="middle" fontFamily="monospace" fontWeight="800">{fmtChartPrice(crossPrice)}</text>
                                      </>
                                    )}
                                    {/* Time label on bottom axis — snapped to candle */}
                                    {svgX > padL && svgX < padL + chartW && timeLabel && (
                                      <>
                                        <rect x={svgX - 16} y={chartH + volH + 0.5} width="32" height="12" rx="2"
                                          fill={isTrDark ? 'rgba(20,28,50,0.95)' : 'rgba(240,242,245,0.95)'} stroke={isTrDark ? 'rgba(148,163,184,0.25)' : 'rgba(0,0,0,0.12)'} strokeWidth="0.3" />
                                        <text x={svgX} y={chartH + volH + 9} fontSize="6.5" fill={isTrDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.75)'} textAnchor="middle" fontFamily="monospace" fontWeight="700">{timeLabel}</text>
                                      </>
                                    )}
                                    {/* OHLC data tooltip — top-left corner of chart */}
                                    {hoveredCandle && svgX > padL && svgX < padL + chartW && (
                                      <g>
                                        <rect x={padL + 3} y={padT + 2} width="62" height="32" rx="2"
                                          fill={isTrDark ? 'rgba(10,14,23,0.92)' : 'rgba(255,255,255,0.92)'} stroke={isTrDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'} strokeWidth="0.3" />
                                        <text x={padL + 6} y={padT + 9} fontSize="5" fill={isTrDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'} fontFamily="monospace" fontWeight="600">O <tspan fill={isTrDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)'}>{fmtChartPrice(hoveredCandle.open)}</tspan>  H <tspan fill={hoveredCandle.high >= hoveredCandle.open ? '#26a69a' : '#ef5350'}>{fmtChartPrice(hoveredCandle.high)}</tspan></text>
                                        <text x={padL + 6} y={padT + 17} fontSize="5" fill={isTrDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'} fontFamily="monospace" fontWeight="600">L <tspan fill={hoveredCandle.low < hoveredCandle.open ? '#ef5350' : '#26a69a'}>{fmtChartPrice(hoveredCandle.low)}</tspan>  C <tspan fill={hoveredCandle.close >= hoveredCandle.open ? '#26a69a' : '#ef5350'}>{fmtChartPrice(hoveredCandle.close)}</tspan></text>
                                        <text x={padL + 6} y={padT + 25} fontSize="4.5" fill={isTrDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)'} fontFamily="monospace" fontWeight="600">Vol {formatNumber(hoveredCandle.volume)}</text>
                                      </g>
                                    )}
                                  </g>
                                )
                              })()}
                            </svg>
                          )
                        })()}
                      </div>

                      {/* Scroll to latest */}
                      {sinyalChartOffset > 0 && (
                        <button
                          onClick={() => setSinyalChartOffset(0)}
                          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 h-7 px-3 rounded-full text-[8px] font-bold flex items-center gap-0.5 hover:bg-[#1d4ed8] transition-colors"
                          style={{ background: 'rgba(29,78,216,0.6)', backdropFilter: 'blur(4px)', color: 'white' }}>
                          <ChevronRight className="w-2.5 h-2.5 rotate-180" />
                          Terbaru
                        </button>
                      )}

                      {/* Result flash */}
                      {sinyalResults.length > 0 && (() => {
                        const latest = sinyalResults[sinyalResults.length - 1]
                        if (!latest || !latest.shownAt || Date.now() - latest.shownAt > 1000) return null
                        const won = latest.won
                        return (
                          <motion.div key={latest.id} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="absolute top-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                            <div className={'flex items-center gap-1 px-2 py-0.5 rounded-full ' + (won ? 'border border-green-500/20 bg-green-500/10' : 'border border-red-500/20 bg-red-500/10')} style={{ backdropFilter: 'blur(8px)' }}>
                              <span className={'text-[8px] font-black ' + (won ? 'text-green-400' : 'text-red-400')}>{won ? 'BENAR' : 'SALAH'}</span>
                              <span className={'text-[7px] font-bold ' + (won ? 'text-green-300' : 'text-red-300')}>{won ? '+' : '-'}{formatRupiah(Math.abs(latest.profit))}</span>
                            </div>
                          </motion.div>
                        )
                      })()}
                    </div>
                  )}
                  {!selectedSinyalStock && (
                    <div className="flex-1 flex items-center justify-center" style={{ background: trTheme.chartBg }}>
                      <div className="text-center">
                        <BarChart3 className="w-10 h-10 mx-auto mb-2" style={{ color: trTheme.textMuted }} />
                        <p className="text-[10px] font-bold" style={{ color: trTheme.textMuted }}>Pilih instrumen untuk mulai trading</p>
                      </div>
                    </div>
                  )}
                </div>

              {/* ══ 4. BOTTOM TRADE STATUS BAR — Premium Glass Badges ══ */}
              {activePos.length > 0 && (
                <div className="flex-shrink-0 flex items-center gap-1.5 px-2 py-1 overflow-x-auto" style={{ background: trTheme.bgCard, borderTop: '1px solid ' + trTheme.borderSubtle, scrollbarWidth: 'none' }}>
                  {activePos.slice(0, 3).map(pos => {
                    const livePL = getPositionLivePL(pos)
                    const isUp = pos.direction === 'NAIK'
                    return (
                      <div key={pos.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg flex-shrink-0" style={{ background: isUp ? 'rgba(34,197,94,0.04)' : 'rgba(239,83,80,0.04)', border: `1px solid ${isUp ? 'rgba(34,197,94,0.10)' : 'rgba(239,83,80,0.10)'}` }}>
                        <span className="text-[8px] font-black" style={{ color: trTheme.textSecondary }}>{pos.stockCode}</span>
                        <span className={`px-1 py-0.5 rounded text-[7px] font-black text-white ${isUp ? 'bg-green-600/80' : 'bg-red-600/80'}`}>{isUp ? 'BUY' : 'SELL'}</span>
                        <span className="text-[7px] font-bold tabular-nums" style={{ color: trTheme.textMuted }}>{(pos.amount / LOT_SIZE).toFixed(2)}</span>
                        <span className={`text-[8px] font-black tabular-nums ${livePL >= 0 ? 'text-green-400' : 'text-red-400'}`}>{livePL >= 0 ? '+' : ''}{formatRupiah(livePL)}</span>
                        <button onClick={() => closeSinyalPosition(pos.id)} className="w-5 h-5 rounded flex items-center justify-center hover:scale-110 transition-transform" style={{ background: 'rgba(239,83,80,0.35)' }}>
                          <X className="w-2 h-2 text-white" />
                        </button>
                      </div>
                    )
                  })}
                  {activePos.length > 3 && (
                    <span className="text-[7px] font-bold flex-shrink-0" style={{ color: trTheme.textMuted }}>+{activePos.length - 3} lagi</span>
                  )}
                </div>
              )}

              {/* ══ 5. TERMINAL BAR — Premium MT5 Strip ══ */}
              <div className="flex-shrink-0" style={{ background: trTheme.bg, borderTop: '1px solid ' + trTheme.borderSubtle }}>
                <div className="flex items-center px-2 py-1.5 gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                  {[
                    { label: 'Balance', value: formatRupiah(totalBalance), color: trTheme.text },
                    { label: 'Equity', value: formatRupiah(equity), color: equity >= totalBalance ? '#4ade80' : '#f87171' },
                    { label: 'Margin', value: formatRupiah(usedMargin), color: '#fbbf24' },
                    { label: 'Free Mrg', value: formatRupiah(freeMargin), color: freeMargin >= 0 ? '#22d3ee' : '#f87171' },
                    { label: 'P&L', value: `${totalLivePL >= 0 ? '+' : ''}${formatRupiah(totalLivePL)}`, color: totalLivePL >= 0 ? '#4ade80' : '#f87171' },
                  ].map((item) => (
                    <div key={item.label} className="flex flex-col items-center justify-center px-3 py-1 flex-shrink-0 rounded-lg" style={{ background: trTheme.inputBg, border: '1px solid ' + trTheme.borderSubtle, minWidth: '68px' }}>
                      <span className="text-[7px] font-bold uppercase tracking-[0.15em]" style={{ color: trTheme.textMuted }}>{item.label}</span>
                      <span className="text-[9px] font-black tabular-nums mt-0.5" style={{ color: item.color }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ══ 6. TERMINAL PANEL — Trade / History Tabs (MT5 Style) ══ */}
              <div className="flex-shrink-0" style={{ background: trTheme.bgCard }}>
                {/* Terminal Tab Header */}
                <div className="flex items-center border-b" style={{ borderColor: trTheme.borderSubtle }}>
                  {(['trade', 'history'] as const).map(tab => (
                    <button key={tab} onClick={() => setSinyalTerminalTab(tab)}
                      className={`px-4 py-1.5 text-[8px] font-black uppercase tracking-[0.15em] transition-all relative ${
                        sinyalTerminalTab === tab ? '' : ''
                      }`}
                      style={{
                        color: sinyalTerminalTab === tab ? '#3b82f6' : trTheme.textMuted,
                        borderBottom: sinyalTerminalTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
                      }}>
                      {tab === 'trade' ? `Trade (${activePos.length})` : `History (${sinyalPositions.filter(p => p.status === 'won' || p.status === 'lost').length})`}
                    </button>
                  ))}
                </div>

                {/* Trade Tab — Active Positions */}
                {sinyalTerminalTab === 'trade' && (
                  <>
                    {activePos.length > 0 ? (
                      <>
                        <div className="grid grid-cols-12 gap-0 px-3 py-1 text-[7px] font-black uppercase tracking-[0.15em]" style={{ color: trTheme.textMuted, borderBottom: '1px solid ' + trTheme.borderSubtle }}>
                          <div className="col-span-2">Symbol</div>
                          <div className="col-span-1">Type</div>
                          <div className="col-span-1">Vol</div>
                          <div className="col-span-2">Entry</div>
                          <div className="col-span-2">Current</div>
                          <div className="col-span-3">P&L</div>
                          <div className="col-span-1"></div>
                        </div>
                        <div className="max-h-24 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                          {activePos.map((pos, idx) => {
                            const livePL = getPositionLivePL(pos)
                            const currentPrice = sinyalCurrentPrice || sinyalChartSimRef.current?.price || pos.startPrice
                            const isUp = pos.direction === 'NAIK'
                            return (
                              <div key={pos.id} className={`grid grid-cols-12 gap-0 px-3 py-1 items-center text-[8px] font-bold transition-colors`} style={idx % 2 === 0 ? { background: trTheme.inputBg } : undefined}>
                                <div className="col-span-2 font-black" style={{ color: trTheme.text }}>{pos.stockCode}</div>
                                <div className="col-span-1">
                                  <span className="px-1 py-0.5 rounded text-[6px] font-black text-white"
                                    style={isUp
                                      ? { background: 'linear-gradient(135deg, #4ade80, #22c55e)' }
                                      : { background: 'linear-gradient(135deg, #f87171, #ef5350)' }}>
                                    {isUp ? 'BUY' : 'SELL'}
                                  </span>
                                </div>
                                <div className="col-span-1 tabular-nums" style={{ color: trTheme.textMuted }}>{(pos.amount / LOT_SIZE).toFixed(2)}</div>
                                <div className="col-span-2 tabular-nums" style={{ color: trTheme.textMuted }}>{formatNumber(pos.startPrice)}</div>
                                <div className="col-span-2 tabular-nums" style={{ color: trTheme.textSecondary }}>{formatNumber(currentPrice)}</div>
                                <div className={`col-span-3 font-black tabular-nums ${livePL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {livePL >= 0 ? '+' : ''}{formatRupiah(livePL)}
                                </div>
                                <div className="col-span-1 flex justify-end">
                                  <button onClick={() => closeSinyalPosition(pos.id)}
                                    className="h-5 w-5 rounded flex items-center justify-center transition-all hover:scale-110 active:scale-90"
                                    style={{ background: 'linear-gradient(135deg, #f87171, #ef5350)', boxShadow: '0 1px 4px rgba(239,83,80,0.3)' }}
                                    title="Tutup posisi">
                                    <X className="w-2.5 h-2.5 text-white" />
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        <div className="flex items-center justify-between px-2 py-0.5" style={{ borderTop: '1px solid ' + trTheme.borderSubtle }}>
                          <span className="text-[7px] font-bold" style={{ color: trTheme.textMuted }}>{activePos.length} posisi aktif</span>
                          <div className="flex items-center gap-1">
                            <span className="text-[7px] font-bold" style={{ color: trTheme.textMuted }}>Total P&L:</span>
                            <span className={`text-[8px] font-black tabular-nums ${totalLivePL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {totalLivePL >= 0 ? '+' : ''}{formatRupiah(totalLivePL)}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="px-4 py-3 text-center">
                        <p className="text-[8px] font-bold" style={{ color: trTheme.textMuted }}>No open positions</p>
                      </div>
                    )}
                  </>
                )}

                {/* History Tab — Closed Positions (Riwayat) */}
                {sinyalTerminalTab === 'history' && (() => {
                  const closedPos = sinyalPositions.filter(p => p.status === 'won' || p.status === 'lost')
                  const wonCount = closedPos.filter(p => p.status === 'won').length
                  const lostCount = closedPos.filter(p => p.status === 'lost').length
                  const totalProfitPL = closedPos.filter(p => p.status === 'won').reduce((s, p) => s + (p.closedPL || 0), 0)
                  const totalLossPL = closedPos.filter(p => p.status === 'lost').reduce((s, p) => s + (p.closedPL || 0), 0)
                  const netPL = totalProfitPL + totalLossPL
                  return (
                    <>
                      {/* Summary bar */}
                      <div className="flex items-center justify-between px-3 py-1.5" style={{ borderBottom: '1px solid ' + trTheme.borderSubtle }}>
                        <div className="flex items-center gap-3">
                          <span className="text-[7px] font-black text-green-400">{wonCount} Win</span>
                          <span className="text-[7px] font-black text-red-400">{lostCount} Loss</span>
                        </div>
                        <span className={`text-[8px] font-black tabular-nums ${netPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          Net: {netPL >= 0 ? '+' : ''}{formatRupiah(netPL)}
                        </span>
                      </div>
                      {/* Filter buttons */}
                      <div className="flex items-center gap-1 px-2 py-1" style={{ borderBottom: '1px solid ' + trTheme.borderSubtle }}>
                        {['Semua', 'Profit', 'Loss'].map(filter => (
                          <button key={filter} onClick={() => setSinyalHistoryFilter(filter)}
                            className={`h-5 px-2 rounded text-[7px] font-bold transition-all border ${
                              sinyalHistoryFilter === filter
                                ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                                : 'text-[var(--zv-muted)] border-[var(--zv-border)] hover:text-[var(--zv-text)]'
                            }`}>
                            {filter}
                          </button>
                        ))}
                      </div>
                      {closedPos.length === 0 ? (
                        <div className="px-4 py-4 text-center">
                          <History className="w-5 h-5 mx-auto mb-1.5" style={{ color: trTheme.textMuted }} />
                          <p className="text-[8px] font-bold" style={{ color: trTheme.textMuted }}>Belum ada riwayat trading</p>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-12 gap-0 px-3 py-1 text-[7px] font-black uppercase tracking-[0.15em]" style={{ color: trTheme.textMuted, borderBottom: '1px solid ' + trTheme.borderSubtle }}>
                            <div className="col-span-2">Symbol</div>
                            <div className="col-span-1">Type</div>
                            <div className="col-span-1">Vol</div>
                            <div className="col-span-2">Entry</div>
                            <div className="col-span-2">Close</div>
                            <div className="col-span-3">P&L</div>
                            <div className="col-span-1">Tm</div>
                          </div>
                          <div className="max-h-32 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                            {closedPos.slice().reverse().filter(cp => {
                              if (sinyalHistoryFilter === 'Profit') return cp.status === 'won'
                              if (sinyalHistoryFilter === 'Loss') return cp.status === 'lost'
                              return true
                            }).map((cp, idx) => {
                              const isWon = cp.status === 'won'
                              const isUp = cp.direction === 'NAIK'
                              const plAmt = cp.closedPL !== undefined ? cp.closedPL : (isWon ? Math.round(cp.amount * cp.profitPercent / 100) : -cp.amount)
                              const tradeDate = new Date(cp.startTime)
                              const dateStr = `${tradeDate.getHours().toString().padStart(2, '0')}:${tradeDate.getMinutes().toString().padStart(2, '0')}`
                              return (
                                <div key={cp.id} className="grid grid-cols-12 gap-0 px-3 py-1 items-center text-[7px] font-bold transition-colors"
                                  style={idx % 2 === 0 ? { background: trTheme.inputBg } : undefined}>
                                  <div className="col-span-2 font-black" style={{ color: trTheme.text }}>{cp.stockCode}</div>
                                  <div className="col-span-1">
                                    <span className="px-0.5 py-0.5 rounded text-[5px] font-black text-white"
                                      style={isUp
                                        ? { background: 'linear-gradient(135deg, #4ade80, #22c55e)' }
                                        : { background: 'linear-gradient(135deg, #f87171, #ef5350)' }}>
                                      {isUp ? 'BUY' : 'SELL'}
                                    </span>
                                  </div>
                                  <div className="col-span-1 tabular-nums" style={{ color: trTheme.textMuted }}>{(cp.amount / LOT_SIZE).toFixed(2)}</div>
                                  <div className="col-span-2 tabular-nums" style={{ color: trTheme.textMuted }}>{formatNumber(cp.startPrice)}</div>
                                  <div className="col-span-2 tabular-nums" style={{ color: trTheme.textSecondary }}>—</div>
                                  <div className={`col-span-3 font-black tabular-nums ${isWon ? 'text-green-400' : 'text-red-400'}`}>
                                    {isWon ? '+' : ''}{formatRupiah(plAmt)}
                                  </div>
                                  <div className="col-span-1 tabular-nums" style={{ color: trTheme.textMuted }}>{dateStr}</div>
                                </div>
                              )
                            })}
                          </div>
                        </>
                      )}
                    </>
                  )
                })()}
              </div>

            </motion.div>
            )
          })()}


          {/* ====== SALDO LIVE TAB — MT5-Style Premium Dashboard ====== */}
          {activeTab === 'saldo' && (
            <motion.div key="saldo" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
              className="flex flex-col gap-3" style={{ minHeight: 'calc(100vh - 140px)' }}>

              {(() => {
                const activePos = sinyalPositions.filter(p => p.status === 'active')
                const closedPos = sinyalPositions.filter(p => p.status === 'won' || p.status === 'lost')
                const totalLivePL = activePos.reduce((s, p) => s + getPositionLivePL(p), 0)
                const totalBalance = (user?.balance || 0)
                // MT5-style: Equity = Balance + Floating P/L (follows chart in real-time)
                const equity = totalBalance + totalLivePL
                const usedMargin = activePos.reduce((s, p) => s + p.amount, 0)
                const freeMargin = equity - usedMargin
                const marginLevel = usedMargin > 0 ? (equity / usedMargin) * 100 : 0
                const wonCount = closedPos.filter(p => p.status === 'won').length
                const lostCount = closedPos.filter(p => p.status === 'lost').length
                const totalTrades = closedPos.length
                const winRate = totalTrades > 0 ? (wonCount / totalTrades) * 100 : 0
                const totalProfitPL = closedPos.filter(p => p.status === 'won').reduce((s, p) => s + (p.closedPL || 0), 0)
                const totalLossPL = closedPos.filter(p => p.status === 'lost').reduce((s, p) => s + (p.closedPL || 0), 0)
                const netPL = totalProfitPL + totalLossPL
                const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
                const todayPL = closedPos.filter(p => p.startTime >= todayStart.getTime()).reduce((s, p) => s + (p.closedPL || 0), 0)
                const marginLevelColor = marginLevel > 200 ? '#22c55e' : marginLevel > 100 ? '#f59e0b' : marginLevel > 50 ? '#ef5350' : '#dc2626'
                const marginLevelBg = marginLevel > 200 ? 'bg-green-500' : marginLevel > 100 ? 'bg-amber-500' : 'bg-red-500'
                const freeMarginColor = freeMargin >= 0 ? (freeMargin > totalBalance * 0.3 ? 'text-green-400' : 'text-cyan-400') : 'text-red-400'

                return (
                  <>
              {/* ════════ ACCOUNT SUMMARY CARD — Premium MT5 Dark ════════ */}
              <div className="relative rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(145deg, #080f1e 0%, #0c1a2e 25%, #162544 55%, #1e3a5f 100%)' }}>
                {/* Subtle top highlight */}
                <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(59,130,246,0.3) 50%, transparent 90%)' }} />
                {/* Subtle glow */}
                <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }} />

                <div className="relative px-4 pt-4 pb-3">
                  {/* Top row: Account badge + Refresh */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-blue-400" />
                      <span className="text-[10px] font-black text-blue-300/80 uppercase tracking-widest">ZEVORIK Terminal</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {activePos.length > 0 && (
                        <span className="flex items-center gap-1 h-5 px-2 rounded-full bg-green-500/15 border border-green-500/25">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                          <span className="text-[7px] font-black text-green-400">LIVE</span>
                        </span>
                      )}
                      <span className="h-5 px-2.5 rounded-full text-[7px] font-black flex items-center gap-1 border bg-green-500/15 border-green-500/30 text-green-400">
                        <span className="w-1 h-1 rounded-full bg-green-400" />
                        REAL
                      </span>
                      <button onClick={() => { fetchPortfolio(); fetchTransactions(); }} className="h-6 w-6 rounded-lg bg-white/5 border border-white/10 grid place-items-center hover:border-blue-500/30 hover:bg-white/10 transition-all">
                        <RefreshCw className="w-3 h-3 text-blue-300/60" />
                      </button>
                    </div>
                  </div>

                  {/* Balance — Big & Prominent */}
                  <div className="mb-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <DollarSign className="w-3 h-3 text-blue-300/50" />
                      <span className="text-[8px] font-bold text-blue-300/50 uppercase tracking-widest">Balance</span>
                    </div>
                    <b className={`block text-[26px] font-black transition-colors duration-500 leading-tight text-white`}
                      style={{ textShadow: totalLivePL !== 0 ? `0 0 20px ${totalLivePL > 0 ? 'rgba(34,197,94,0.2)' : 'rgba(239,83,80,0.2)'}` : 'none' }}>
                      {formatRupiah(totalBalance)}
                    </b>
                  </div>

                  {/* Equity + Floating P&L — Always show Equity (MT5: Equity = Balance when no positions) */}
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <BarChart3 className="w-3 h-3 text-blue-300/50" />
                        <span className="text-[8px] font-bold text-blue-300/50 uppercase tracking-widest">Equity</span>
                        {activePos.length > 0 && (
                          <span className="flex items-center gap-0.5 ml-1">
                            <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
                            <span className="text-[6px] font-black text-green-400">LIVE</span>
                          </span>
                        )}
                      </div>
                      <div className={`text-[18px] font-black transition-colors duration-500 ${totalLivePL > 0 ? 'text-green-400' : totalLivePL < 0 ? 'text-red-400' : 'text-blue-100'}`}>
                        {formatRupiah(equity)}
                      </div>
                    </div>
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${totalLivePL >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                      {totalLivePL >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-green-400" /> : <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
                      <div>
                        <div className="text-[7px] font-bold text-blue-300/50 uppercase">Floating P&L</div>
                        <div className={`text-[13px] font-black ${totalLivePL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {activePos.length > 0 ? `${totalLivePL >= 0 ? '+' : ''}${formatRupiah(totalLivePL)}` : 'Rp0'}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* ════════ MT5 Terminal Stats Grid — 2x3 ════════ */}
                <div className="grid grid-cols-3 gap-px bg-white/[0.03] border-t border-white/[0.06]">
                  {/* Saldo */}
                  <div className="px-3 py-2.5" style={{ background: 'linear-gradient(135deg, rgba(8,15,30,0.95), rgba(12,26,46,0.95))' }}>
                    <div className="flex items-center gap-1 mb-1">
                      <Wallet className="w-2.5 h-2.5 text-blue-400/50" />
                      <span className="text-[6px] font-bold text-blue-300/40 uppercase tracking-wider">Saldo</span>
                    </div>
                    <div className="text-[11px] font-black text-white">{formatRupiah(totalBalance)}</div>
                  </div>
                  {/* Equity */}
                  <div className="px-3 py-2.5" style={{ background: 'linear-gradient(135deg, rgba(8,15,30,0.95), rgba(12,26,46,0.95))' }}>
                    <div className="flex items-center gap-1 mb-1">
                      <BarChart3 className="w-2.5 h-2.5 text-blue-400/50" />
                      <span className="text-[6px] font-bold text-blue-300/40 uppercase tracking-wider">Equity</span>
                    </div>
                    <div className={`text-[11px] font-black ${totalLivePL > 0 ? 'text-green-400' : totalLivePL < 0 ? 'text-red-400' : 'text-white'}`}>{formatRupiah(equity)}</div>
                  </div>
                  {/* Margin (Used) */}
                  <div className="px-3 py-2.5" style={{ background: 'linear-gradient(135deg, rgba(8,15,30,0.95), rgba(12,26,46,0.95))' }}>
                    <div className="flex items-center gap-1 mb-1">
                      <Shield className="w-2.5 h-2.5 text-amber-400/50" />
                      <span className="text-[6px] font-bold text-amber-300/40 uppercase tracking-wider">Margin</span>
                    </div>
                    <div className="text-[11px] font-black text-amber-400">{usedMargin > 0 ? formatRupiah(usedMargin) : 'Rp0'}</div>
                  </div>
                  {/* Free Margin */}
                  <div className="px-3 py-2.5" style={{ background: 'linear-gradient(135deg, rgba(8,15,30,0.95), rgba(12,26,46,0.95))' }}>
                    <div className="flex items-center gap-1 mb-1">
                      <CreditCard className="w-2.5 h-2.5 text-blue-400/50" />
                      <span className="text-[6px] font-bold text-blue-300/40 uppercase tracking-wider">Mrg Bebas</span>
                    </div>
                    <div className={`text-[11px] font-black ${freeMarginColor}`}>{formatRupiah(freeMargin)}</div>
                  </div>
                  {/* Margin Level */}
                  <div className="px-3 py-2.5" style={{ background: 'linear-gradient(135deg, rgba(8,15,30,0.95), rgba(12,26,46,0.95))' }}>
                    <div className="flex items-center gap-1 mb-1">
                      <Zap className="w-2.5 h-2.5 text-blue-400/50" />
                      <span className="text-[6px] font-bold text-blue-300/40 uppercase tracking-wider">Level Mrg</span>
                    </div>
                    <div className={`text-[11px] font-black`} style={{ color: activePos.length > 0 ? marginLevelColor : 'rgba(255,255,255,0.5)' }}>
                      {usedMargin > 0 ? `${formatNumber(Math.round(marginLevel * 100) / 100)}%` : '—'}
                    </div>
                    {usedMargin > 0 && (
                      <div className="w-full h-1 rounded-full bg-white/10 mt-1">
                        <div className={`h-full rounded-full transition-all duration-700 ${marginLevelBg}`} style={{ width: `${Math.min(100, Math.max(0, marginLevel))}%` }} />
                      </div>
                    )}
                  </div>
                  {/* Modal Live */}
                  <div className="px-3 py-2.5" style={{ background: 'linear-gradient(135deg, rgba(8,15,30,0.95), rgba(12,26,46,0.95))' }}>
                    <div className="flex items-center gap-1 mb-1">
                      <Target className="w-2.5 h-2.5 text-blue-400/50" />
                      <span className="text-[6px] font-bold text-blue-300/40 uppercase tracking-wider">Modal Live</span>
                    </div>
                    <div className={`text-[11px] font-black ${liveModal > 0 ? (totalLivePL >= 0 ? 'text-green-400' : 'text-red-400') : 'text-white/50'}`}>
                      {liveModal > 0 ? formatRupiah(liveModal) : '—'}
                    </div>
                  </div>
                </div>

                {/* Margin Level Warning Bar */}
                {activePos.length > 0 && marginLevel > 0 && marginLevel < 100 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="px-4 py-2 border-t border-white/[0.06] flex items-center gap-2"
                    style={{ background: marginLevel < 50 ? 'rgba(220,38,38,0.15)' : 'rgba(245,158,11,0.1)' }}>
                    <AlertCircle className={`w-3.5 h-3.5 ${marginLevel < 50 ? 'text-red-400 animate-pulse' : 'text-amber-400'}`} />
                    <span className={`text-[8px] font-black uppercase ${marginLevel < 50 ? 'text-red-400' : 'text-amber-400'}`}>
                      {marginLevel < 50 ? '⚠️ STOP OUT RISK! Modal hampir habis' : '⚠️ MARGIN CALL — Level Margin di bawah 100%'}
                    </span>
                  </motion.div>
                )}
              </div>

              {/* ════════ TRADING PERFORMANCE ════════ */}
              <div className="rounded-2xl overflow-hidden border border-[var(--zv-border)] bg-[var(--zv-surface)]">
                <div className="px-4 py-2.5 border-b border-[var(--zv-border)] flex items-center gap-2">
                  <PieChart className="w-3.5 h-3.5 text-[#3b82f6]" />
                  <span className="text-[9px] font-black text-[var(--zv-text)] uppercase tracking-wider">Performa Trading</span>
                </div>
                <div className="grid grid-cols-4 gap-px bg-[var(--zv-border)]/30">
                  {/* Total Trades */}
                  <div className="p-3 bg-[var(--zv-surface)] text-center">
                    <div className="text-[7px] font-bold text-[var(--zv-muted)] uppercase mb-1">Trade</div>
                    <div className="text-[16px] font-black text-[var(--zv-text)]">{totalTrades}</div>
                  </div>
                  {/* Win Rate */}
                  <div className="p-3 bg-[var(--zv-surface)] text-center">
                    <div className="text-[7px] font-bold text-[var(--zv-muted)] uppercase mb-1">Win Rate</div>
                    <div className="relative mx-auto w-10 h-10">
                      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        <circle cx="18" cy="18" r="14" fill="none" stroke="var(--zv-border)" strokeWidth="3" />
                        <circle cx="18" cy="18" r="14" fill="none" stroke={winRate >= 50 ? '#22c55e' : '#ef5350'} strokeWidth="3"
                          strokeDasharray={`${winRate * 0.88} 88`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.8s ease' }} />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-[8px] font-black ${winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>{winRate.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                  {/* Net P&L */}
                  <div className="p-3 bg-[var(--zv-surface)] text-center">
                    <div className="text-[7px] font-bold text-[var(--zv-muted)] uppercase mb-1">Total P&L</div>
                    <div className={`text-[12px] font-black ${netPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {netPL >= 0 ? '+' : ''}{formatRupiah(netPL)}
                    </div>
                  </div>
                  {/* Today P&L */}
                  <div className="p-3 bg-[var(--zv-surface)] text-center">
                    <div className="text-[7px] font-bold text-[var(--zv-muted)] uppercase mb-1">Hari Ini</div>
                    <div className={`text-[12px] font-black ${todayPL >= 0 ? 'text-green-400' : todayPL < 0 ? 'text-red-400' : 'text-[var(--zv-muted)]'}`}>
                      {todayPL !== 0 ? `${todayPL >= 0 ? '+' : ''}${formatRupiah(todayPL)}` : '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* ════════ QUICK ACTION BUTTONS ════════ */}
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => setActiveTab('sinyal')}
                  className="h-10 rounded-xl flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#1d4ed8] to-[#3b82f6] text-white text-[9px] font-bold shadow-md shadow-blue-500/20 active:scale-[0.97] transition-transform border border-blue-400/20">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Mulai Trading
                </button>
                <button onClick={() => setActiveTab('finance')}
                  className="h-10 rounded-xl flex items-center justify-center gap-1.5 bg-[var(--zv-surface)] border border-[var(--zv-border)] text-[9px] font-bold text-green-400 hover:border-green-500/30 transition-all active:scale-[0.97]">
                  <Plus className="w-3.5 h-3.5" />
                  Deposit
                </button>
                <button onClick={() => setActiveTab('finance')}
                  className="h-10 rounded-xl flex items-center justify-center gap-1.5 bg-[var(--zv-surface)] border border-[var(--zv-border)] text-[9px] font-bold text-red-400 hover:border-red-500/30 transition-all active:scale-[0.97]">
                  <Minus className="w-3.5 h-3.5" />
                  Withdraw
                </button>
              </div>

              {/* ════════ SUB-TAB: ORDER / POSISI / RIWAYAT ════════ */}
              <div className="flex gap-1">
                {(['order', 'posisi', 'riwayat'] as const).map(sub => (
                  <button key={sub} onClick={() => setSaldoSubTab(sub)}
                    className={`flex-1 h-9 rounded-xl text-[10px] font-bold transition-all border ${
                      saldoSubTab === sub
                        ? 'bg-gradient-to-r from-[#1e3a5f] to-[#1d4ed8] text-white border-[#3b82f6] shadow-md shadow-blue-500/20'
                        : 'bg-[var(--zv-surface)] text-[var(--zv-muted)] border-[var(--zv-border)] hover:border-[#3b82f6]/30 hover:text-[var(--zv-text)]'
                    }`}>
                    {sub === 'order' ? '📋 Order' : sub === 'posisi' ? `Posisi (${activePos.length})` : `Riwayat (${closedPos.length})`}
                  </button>
                ))}
              </div>

              {/* ════════ ORDER FORM — Full Trading Panel ════════ */}
              {saldoSubTab === 'order' && (
                <div className="rounded-2xl overflow-hidden border border-[var(--zv-border)]" style={{ background: 'linear-gradient(145deg, #080f1e 0%, #0c1a2e 25%, #162544 55%, #1e3a5f 100%)' }}>
                  {/* Header */}
                  <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-400" />
                      <span className="text-[10px] font-black text-blue-300/80 uppercase tracking-widest">Open Position</span>
                    </div>
                    {selectedSinyalStock && (
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-black text-white">{selectedSinyalStock.code}</span>
                        <span className={`text-[10px] font-bold ${selectedSinyalStock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatRupiah(sinyalCurrentPrice || selectedSinyalStock.price)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 space-y-3">
                    {/* Instrument Selector */}
                    <div>
                      <label className="flex items-center gap-1.5 mb-1.5 text-[8px] font-bold text-blue-300/50 uppercase tracking-widest">
                        <BarChart3 className="w-3 h-3" /> Instrument
                      </label>
                      {!selectedSinyalStock ? (
                        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                          {stocks.slice(0, 12).map(s => (
                            <button key={s.id} onClick={() => { setSelectedSinyalStock(s); setSinyalLots('0.01'); setSinyalAmount(''); setSinyalCandles([]); setSinyalCurrentPrice(0); sinyalChartSimRef.current = null }}
                              className="flex-shrink-0 h-8 px-3 rounded-lg text-[9px] font-bold border border-white/10 text-white/60 hover:border-blue-500/40 hover:text-blue-300 transition-all"
                              style={{ background: 'rgba(255,255,255,0.04)' }}>
                              {s.code}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-10 rounded-xl flex items-center justify-between px-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-black text-white">{selectedSinyalStock.code}</span>
                              <span className="text-[8px] text-blue-300/50">{selectedSinyalStock.name?.slice(0, 14)}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-black tabular-nums" style={{ color: sinyalCurrentPrice >= (selectedSinyalStock.price) ? '#4ade80' : '#f87171' }}>
                                {formatRupiah(sinyalCurrentPrice || selectedSinyalStock.price)}
                              </span>
                            </div>
                          </div>
                          <button onClick={() => setSelectedSinyalStock(null)} className="h-10 w-10 rounded-xl grid place-items-center border border-white/10 text-white/40 hover:text-red-400 hover:border-red-500/30 transition-all" style={{ background: 'rgba(255,255,255,0.04)' }}>
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Lot & Leverage Row */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Lot Size */}
                      <div>
                        <label className="flex items-center gap-1 mb-1 text-[8px] font-bold text-blue-300/50 uppercase tracking-widest">
                          <Package className="w-2.5 h-2.5" /> Lot Size
                        </label>
                        <div className="flex items-center rounded-xl overflow-hidden h-10" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <button onClick={() => { const cur = parseFloat(sinyalLots || '0'); const next = Math.max(0.01, cur - 0.01); setSinyalLots(next.toFixed(2)); setSinyalAmount(String(Math.round(next * LOT_SIZE))) }}
                            className="h-full w-10 flex items-center justify-center hover:bg-red-500/15 transition-all">
                            <Minus className="w-3 h-3 text-red-400/70" strokeWidth={2.5} />
                          </button>
                          <div className="flex-1 flex flex-col items-center justify-center" style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                            <span className="text-[15px] font-black tabular-nums text-white leading-none">{sinyalLots}</span>
                            <span className="text-[6px] font-bold text-blue-300/40 uppercase tracking-widest mt-0.5">LOT</span>
                          </div>
                          <button onClick={() => { const cur = parseFloat(sinyalLots || '0'); const next = cur + 0.01; setSinyalLots(next.toFixed(2)); setSinyalAmount(String(Math.round(next * LOT_SIZE))) }}
                            className="h-full w-10 flex items-center justify-center hover:bg-green-500/15 transition-all">
                            <Plus className="w-3 h-3 text-green-400/70" strokeWidth={2.5} />
                          </button>
                        </div>
                        <div className="text-[7px] font-bold text-amber-400/50 mt-0.5 text-center">{formatRupiah(sinyalAmountFromLots)}</div>
                      </div>
                      {/* Leverage */}
                      <div>
                        <label className="flex items-center gap-1 mb-1 text-[8px] font-bold text-blue-300/50 uppercase tracking-widest">
                          <Zap className="w-2.5 h-2.5" /> Leverage
                        </label>
                        <div className="relative">
                          <button onClick={() => { setShowLeverageMenu(prev => !prev); setShowTimeframeMenu(false) }}
                            className="w-full h-10 rounded-xl flex items-center justify-between px-3 transition-all"
                            style={{ background: showLeverageMenu ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.05)', border: `1px solid ${showLeverageMenu ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.08)'}` }}>
                            <span className="text-[14px] font-black text-amber-400">1:{sinyalLeverage}</span>
                            <ChevronDown className={`w-3 h-3 text-amber-400/50 transition-transform ${showLeverageMenu ? 'rotate-180' : ''}`} />
                          </button>
                          {showLeverageMenu && (
                            <div className="absolute left-0 right-0 top-11 z-50 rounded-xl overflow-hidden py-0.5"
                              style={{ background: '#0c1a2e', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
                              {[100, 200, 300, 500, 1000].map(lev => (
                                <button key={lev} onClick={() => { setSinyalLeverage(lev); setShowLeverageMenu(false) }}
                                  className={`w-full px-3 py-2 text-[11px] font-bold text-left transition-colors flex items-center justify-between ${
                                    sinyalLeverage === lev ? 'text-amber-400 bg-amber-500/10' : 'text-white/60 hover:bg-white/5'
                                  }`}>
                                  <span>1:{lev}</span>
                                  {sinyalLeverage === lev && <CheckCircle className="w-3 h-3 text-amber-400" />}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-[7px] font-bold text-blue-300/30 mt-0.5 text-center">Multiplier</div>
                      </div>
                    </div>

                    {/* Stop Loss & Take Profit */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="flex items-center gap-1 mb-1 text-[8px] font-bold text-red-300/50 uppercase tracking-widest">
                          <AlertCircle className="w-2.5 h-2.5" /> Stop Loss
                        </label>
                        <div className="relative">
                          <input type="number" value={stopLossPrice} onChange={(e) => setStopLossPrice(e.target.value)} placeholder="Opsional"
                            className="w-full h-10 rounded-xl px-3 pr-10 text-[12px] font-bold text-red-300 placeholder:text-red-300/20 outline-none transition-all focus:border-red-500/30"
                            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }} />
                          {stopLossPrice && (
                            <button onClick={() => setStopLossPrice('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                              <X className="w-3 h-3 text-red-400/40" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="flex items-center gap-1 mb-1 text-[8px] font-bold text-green-300/50 uppercase tracking-widest">
                          <Target className="w-2.5 h-2.5" /> Take Profit
                        </label>
                        <div className="relative">
                          <input type="number" value={takeProfitPrice} onChange={(e) => setTakeProfitPrice(e.target.value)} placeholder="Opsional"
                            className="w-full h-10 rounded-xl px-3 pr-10 text-[12px] font-bold text-green-300 placeholder:text-green-300/20 outline-none transition-all focus:border-green-500/30"
                            style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.12)' }} />
                          {takeProfitPrice && (
                            <button onClick={() => setTakeProfitPrice('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                              <X className="w-3 h-3 text-green-400/40" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Spread Info */}
                    {selectedSinyalStock && (
                      <div className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="text-[6px] font-bold text-blue-300/30 uppercase">Bid</div>
                            <div className="text-[10px] font-black text-red-400 tabular-nums">{sinyalCurrentPrice > 0 ? fmtPrice5(bidPrice) : '—'}</div>
                          </div>
                          <div className="text-[7px] font-bold text-blue-300/20">|</div>
                          <div>
                            <div className="text-[6px] font-bold text-blue-300/30 uppercase">Ask</div>
                            <div className="text-[10px] font-black text-green-400 tabular-nums">{sinyalCurrentPrice > 0 ? fmtPrice5(askPrice) : '—'}</div>
                          </div>
                          <div className="text-[7px] font-bold text-blue-300/20">|</div>
                          <div>
                            <div className="text-[6px] font-bold text-blue-300/30 uppercase">Spread</div>
                            <div className="text-[10px] font-black text-amber-400/70 tabular-nums">{sinyalCurrentPrice > 0 ? spreadValue.toFixed(1) : '—'}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[6px] font-bold text-blue-300/30 uppercase">Free Margin</div>
                          <div className={`text-[10px] font-black tabular-nums ${freeMargin >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>{formatRupiah(freeMargin)}</div>
                        </div>
                      </div>
                    )}

                    {/* BUY / SELL Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          if (!selectedSinyalStock) { toast({ title: 'Pilih instrument', variant: 'destructive' }); return }
                          if (sinyalAmountFromLots < 1000) { toast({ title: 'Minimum 0.01 Lot (Rp 1.000)', variant: 'destructive' }); return }
                          if (sinyalAmountFromLots > freeMargin) { toast({ title: 'Free Margin tidak cukup', variant: 'destructive' }); return }
                          setConfirmTradeDir('TURUN')
                          setShowConfirmTrade(true)
                        }}
                        className="relative rounded-xl flex flex-col items-center justify-center transition-all overflow-hidden active:scale-[0.97] h-[56px]"
                        style={{ background: 'linear-gradient(135deg, #ef5350, #dc2626, #b91c1c)', boxShadow: '0 4px 20px rgba(239,68,68,0.4)' }}>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                        <div className="relative flex items-center gap-2">
                          <TrendingDown className="w-5 h-5 text-white/80" />
                          <span className="text-[18px] font-black tracking-[0.25em] text-white">SELL</span>
                        </div>
                        <span className="text-[9px] font-bold tabular-nums text-white/50 mt-0.5 relative">{sinyalCurrentPrice > 0 ? fmtPrice5(bidPrice) : '—'}</span>
                      </button>
                      <button
                        onClick={() => {
                          if (!selectedSinyalStock) { toast({ title: 'Pilih instrument', variant: 'destructive' }); return }
                          if (sinyalAmountFromLots < 1000) { toast({ title: 'Minimum 0.01 Lot (Rp 1.000)', variant: 'destructive' }); return }
                          if (sinyalAmountFromLots > freeMargin) { toast({ title: 'Free Margin tidak cukup', variant: 'destructive' }); return }
                          setConfirmTradeDir('NAIK')
                          setShowConfirmTrade(true)
                        }}
                        className="relative rounded-xl flex flex-col items-center justify-center transition-all overflow-hidden active:scale-[0.97] h-[56px]"
                        style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a, #15803d)', boxShadow: '0 4px 20px rgba(34,197,94,0.4)' }}>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                        <div className="relative flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-white/80" />
                          <span className="text-[18px] font-black tracking-[0.25em] text-white">BUY</span>
                        </div>
                        <span className="text-[9px] font-bold tabular-nums text-white/50 mt-0.5 relative">{sinyalCurrentPrice > 0 ? fmtPrice5(askPrice) : '—'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ════════ ACTIVE POSITIONS — Premium MT5 Cards ════════ */}
              {saldoSubTab === 'posisi' && (
                <>
                  {activePos.length === 0 ? (
                    <div className="rounded-2xl p-8 bg-[var(--zv-surface)] border border-[var(--zv-border)] text-center">
                      <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center mx-auto mb-3">
                        <BarChart3 className="w-7 h-7 text-blue-400/40" />
                      </div>
                      <p className="text-[12px] font-bold text-[var(--zv-text)] mb-1">Belum Ada Posisi Aktif</p>
                      <p className="text-[9px] text-[var(--zv-muted)] mb-3">Buka posisi di tab Trade untuk mulai trading</p>
                      <button onClick={() => setActiveTab('sinyal')} className="h-10 px-8 rounded-xl bg-gradient-to-r from-[#1d4ed8] to-[#3b82f6] text-white text-[11px] font-bold shadow-lg shadow-blue-500/25 active:scale-[0.97] transition-transform">
                        Mulai Trading →
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Total Floating P&L Summary Bar */}
                      <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl border ${totalLivePL >= 0 ? 'bg-green-500/8 border-green-500/15' : 'bg-red-500/8 border-red-500/15'}`}>
                        <div className="flex items-center gap-2">
                          <Zap className={`w-4 h-4 ${totalLivePL >= 0 ? 'text-green-400' : 'text-red-400'} animate-pulse`} />
                          <span className="text-[9px] font-black text-[var(--zv-muted)] uppercase">Total Floating P&L</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-[14px] font-black ${totalLivePL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {totalLivePL >= 0 ? '+' : ''}{formatRupiah(totalLivePL)}
                          </span>
                          {activePos.length > 1 && (
                            <button onClick={() => activePos.forEach(p => closeSinyalPosition(p.id))}
                              className="relative h-7 px-3 rounded-lg overflow-hidden text-[7px] font-black text-white transition-all active:scale-[0.95]"
                              style={{ background: 'linear-gradient(180deg, #f87171 0%, #ef5350 50%, #dc2626 100%)', boxShadow: '0 2px 8px rgba(239,83,80,0.3)' }}>
                              CLOSE ALL
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Position Cards */}
                      {activePos.map(ap => {
                        const isUp = ap.direction === 'NAIK'
                        const livePL = getPositionLivePL(ap)
                        const currentPrice = sinyalCurrentPrice || sinyalChartSimRef.current?.price || ap.startPrice
                        const lots = (ap.amount / LOT_SIZE).toFixed(2)
                        const elapsed = sinyalTimers[ap.id] ?? 0
                        const mins = Math.floor(elapsed / 60)
                        const secs = elapsed % 60
                        const elapsedLabel = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
                        const modalLive = ap.amount + livePL
                        return (
                          <motion.div key={ap.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                            className="rounded-xl overflow-hidden border"
                            style={{ borderColor: isUp ? 'rgba(34,197,94,0.2)' : 'rgba(239,83,80,0.2)', background: 'var(--zv-surface)' }}>
                            {/* Gradient border top */}
                            <div className={`h-0.5 ${isUp ? 'bg-gradient-to-r from-green-500 via-green-400 to-green-500' : 'bg-gradient-to-r from-red-500 via-red-400 to-red-500'}`} />
                            <div className="px-3.5 py-3">
                              {/* Row 1: Stock + Direction + Leverage */}
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[12px] font-black text-[var(--zv-text)]">{ap.stockCode}</span>
                                  <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[8px] font-black text-white ${isUp ? '' : ''}`}
                                    style={isUp
                                      ? { background: 'linear-gradient(180deg, #4ade80, #22c55e)', boxShadow: '0 2px 6px rgba(34,197,94,0.3)' }
                                      : { background: 'linear-gradient(180deg, #f87171, #ef5350)', boxShadow: '0 2px 6px rgba(239,83,80,0.3)' }}>
                                    {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                                    {isUp ? 'BUY' : 'SELL'}
                                  </span>
                                  <span className="text-[8px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/15">1:{ap.leverage || 1000}</span>
                                </div>
                                <button onClick={() => closeSinyalPosition(ap.id)}
                                  className="relative h-7 px-3 rounded-lg overflow-hidden text-[8px] font-black text-white transition-all active:scale-[0.95]"
                                  style={{ background: 'linear-gradient(180deg, #f87171 0%, #ef5350 50%, #dc2626 100%)', boxShadow: '0 2px 8px rgba(239,83,80,0.3)' }}>
                                  ✕ Tutup
                                </button>
                              </div>
                              {/* Row 2: Stats Grid */}
                              <div className="grid grid-cols-4 gap-2 mb-2">
                                <div>
                                  <div className="text-[6px] font-bold text-[var(--zv-muted)] uppercase">Lot</div>
                                  <div className="text-[10px] font-black text-[var(--zv-text)]">{lots}</div>
                                </div>
                                <div>
                                  <div className="text-[6px] font-bold text-[var(--zv-muted)] uppercase">Entry</div>
                                  <div className="text-[10px] font-black text-[var(--zv-text)]">{formatNumber(ap.startPrice)}</div>
                                </div>
                                <div>
                                  <div className="text-[6px] font-bold text-[var(--zv-muted)] uppercase">Current</div>
                                  <div className={`text-[10px] font-black ${livePL >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatNumber(currentPrice)}</div>
                                </div>
                                <div>
                                  <div className="text-[6px] font-bold text-[var(--zv-muted)] uppercase">Modal Live</div>
                                  <div className={`text-[10px] font-black ${modalLive >= ap.amount ? 'text-green-400' : 'text-red-400'}`}>{formatRupiah(modalLive)}</div>
                                </div>
                              </div>
                              {/* Row 3: P&L + Elapsed Time */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {/* Elapsed time */}
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="w-3 h-3 text-blue-400" />
                                    <span className="text-[8px] font-black text-blue-400 tabular-nums">{elapsedLabel}</span>
                                    <span className="text-[7px] font-bold text-[var(--zv-muted)]">terbuka</span>
                                  </div>
                                </div>
                                {/* P&L */}
                                <div className={`text-[14px] font-black ${livePL >= 0 ? 'text-green-400' : 'text-red-400'}`}
                                  style={{ textShadow: `0 0 12px ${livePL >= 0 ? 'rgba(34,197,94,0.2)' : 'rgba(239,83,80,0.2)'}` }}>
                                  {livePL >= 0 ? '+' : ''}{formatRupiah(livePL)}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  )}
                </>
              )}

              {/* ════════ CLOSED POSITIONS HISTORY ════════ */}
              {saldoSubTab === 'riwayat' && (
                <>
                  {closedPos.length === 0 ? (
                    <div className="rounded-2xl p-8 bg-[var(--zv-surface)] border border-[var(--zv-border)] text-center">
                      <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center mx-auto mb-3">
                        <History className="w-7 h-7 text-blue-400/40" />
                      </div>
                      <p className="text-[12px] font-bold text-[var(--zv-text)] mb-1">Belum Ada Riwayat</p>
                      <p className="text-[9px] text-[var(--zv-muted)]">Riwayat trading akan muncul setelah posisi ditutup</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Summary bar */}
                      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[var(--zv-surface)] border border-[var(--zv-border)]">
                        <div className="flex items-center gap-3">
                          <span className="text-[8px] font-bold text-green-400">{wonCount} Win</span>
                          <span className="text-[8px] font-bold text-red-400">{lostCount} Loss</span>
                        </div>
                        <span className={`text-[10px] font-black ${netPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          Net: {netPL >= 0 ? '+' : ''}{formatRupiah(netPL)}
                        </span>
                      </div>
                      {/* Filter buttons */}
                      <div className="flex gap-1">
                        {['Semua', 'Profit', 'Loss'].map(filter => (
                          <button key={filter} onClick={() => setSinyalHistoryFilter(filter)}
                            className={`h-7 px-3 rounded-lg text-[8px] font-bold transition-all border ${
                              sinyalHistoryFilter === filter
                                ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                                : 'text-[var(--zv-muted)] border-[var(--zv-border)] bg-[var(--zv-surface)] hover:text-[var(--zv-text)]'
                            }`}>
                            {filter}
                          </button>
                        ))}
                      </div>
                      <div className="max-h-96 overflow-y-auto space-y-1.5 pr-0.5" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(59,130,246,0.2) transparent' }}>
                        {closedPos.slice(-30).reverse().filter(cp => {
                          if (sinyalHistoryFilter === 'Profit') return cp.status === 'won'
                          if (sinyalHistoryFilter === 'Loss') return cp.status === 'lost'
                          return true
                        }).map(cp => {
                          const isWon = cp.status === 'won'
                          const isUp = cp.direction === 'NAIK'
                          const plAmt = cp.closedPL !== undefined ? cp.closedPL : (isWon ? Math.round(cp.amount * cp.profitPercent / 100) : -cp.amount)
                          const lots = (cp.amount / LOT_SIZE).toFixed(2)
                          const tradeDate = new Date(cp.startTime)
                          const dateStr = `${tradeDate.getDate()}/${tradeDate.getMonth() + 1} ${tradeDate.getHours().toString().padStart(2, '0')}:${tradeDate.getMinutes().toString().padStart(2, '0')}`
                          return (
                            <div key={cp.id} className={`rounded-xl overflow-hidden border ${isWon ? 'border-green-500/15' : 'border-red-500/15'}`} style={{ background: 'var(--zv-surface)' }}>
                              <div className={`h-0.5 ${isWon ? 'bg-gradient-to-r from-green-500 via-green-400 to-green-500' : 'bg-gradient-to-r from-red-500 via-red-400 to-red-500'}`} />
                              <div className="px-3 py-2.5">
                                <div className="flex items-center justify-between mb-1.5">
                                  <div className="flex items-center gap-2">
                                    {isWon ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                                    <span className="text-[11px] font-black text-[var(--zv-text)]">{cp.stockCode}</span>
                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${isUp ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{isUp ? 'Buy' : 'Sell'}</span>
                                    <span className="text-[7px] font-bold text-amber-400">{lots} lot</span>
                                    <span className="text-[7px] font-bold text-[var(--zv-muted)]">1:{cp.leverage || 1000}</span>
                                  </div>
                                  <span className="text-[7px] font-bold text-[var(--zv-muted)]">{dateStr}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="text-[7px] text-[var(--zv-muted)]">
                                    Vol {formatRupiah(cp.amount)}
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="text-right">
                                      <div className={`text-[11px] font-black ${isWon ? 'text-green-400' : 'text-red-400'}`}>
                                        {isWon ? '+' : ''}{formatRupiah(plAmt)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
                  </>
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
                <button onClick={() => { setFinanceTab('deposit'); setDepositStep('amount') }} className={`flex-1 h-10 rounded-2xl text-[11px] md:text-xs font-bold transition-all ${financeTab === 'deposit' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/20' : 'bg-[var(--zv-panel)] border border-[var(--zv-border)] text-[var(--zv-muted)] hover:border-[#3b82f6]/30 hover:text-[#3b82f6]'}`}>
                  <Plus className="w-3.5 h-3.5 inline mr-1" />Deposit
                </button>
                <button onClick={() => setFinanceTab('withdraw')} className={`flex-1 h-10 rounded-2xl text-[11px] md:text-xs font-bold transition-all ${financeTab === 'withdraw' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/20' : 'bg-[var(--zv-panel)] border border-[var(--zv-border)] text-[var(--zv-muted)] hover:border-[#3b82f6]/30 hover:text-[#3b82f6]'}`}>
                  <Minus className="w-3.5 h-3.5 inline mr-1" />Withdraw
                </button>
              </div>

              {/* Deposit Section */}
              {financeTab === 'deposit' ? (
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
                        <b className="block text-[13px] font-black text-[#f59e0b]">{formatRupiah(0)}</b>
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

                    {/* OTP Verification for Withdrawal */}
                    <div className="rounded-xl p-3 bg-[var(--zv-surface)] border border-[var(--zv-border)] mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="w-4 h-4 text-[#3b82f6]" />
                        <span className="text-[9px] font-black text-[#3b82f6] uppercase tracking-widest">Verifikasi Email</span>
                        {withdrawOtpVerified && (
                          <span className="h-4 px-1.5 rounded-full bg-green-500/20 border border-green-400/30 text-[7px] font-black text-green-400 flex items-center gap-0.5">
                            <CheckCircle className="w-2.5 h-2.5" />Verified
                          </span>
                        )}
                      </div>
                      {!withdrawOtpSent ? (
                        <button onClick={handleSendWithdrawOtp} disabled={withdrawOtpLoading}
                          className="w-full h-10 rounded-xl bg-[#3b82f6]/10 border border-[#3b82f6]/20 text-[#3b82f6] text-[10px] font-bold flex items-center justify-center gap-1.5 hover:bg-[#3b82f6]/20 transition-all disabled:opacity-50">
                          {withdrawOtpLoading ? <div className="w-4 h-4 rounded-full border-2 border-[#3b82f6]/30 border-t-[#3b82f6] animate-spin" /> : <><Mail className="w-3.5 h-3.5" />Kirim OTP ke Email</>}
                        </button>
                      ) : !withdrawOtpVerified ? (
                        <>
                          <div className="flex items-center justify-center gap-1.5 mb-2">
                            {withdrawOtpCode.map((digit, i) => (
                              <input
                                key={i}
                                ref={el => { withdrawOtpRefs.current[i] = el }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => {
                                  if (!/^\d*$/.test(e.target.value)) return
                                  const newOtp = [...withdrawOtpCode]
                                  newOtp[i] = e.target.value.slice(-1)
                                  setWithdrawOtpCode(newOtp)
                                  if (e.target.value && i < 5) withdrawOtpRefs.current[i + 1]?.focus()
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Backspace' && !withdrawOtpCode[i] && i > 0) withdrawOtpRefs.current[i - 1]?.focus()
                                }}
                                onPaste={(e) => {
                                  e.preventDefault()
                                  const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
                                  const newOtp = [...Array(6)].map((_, idx) => pasted[idx] || '')
                                  setWithdrawOtpCode(newOtp)
                                  const nextIdx = Math.min(pasted.length, 5)
                                  withdrawOtpRefs.current[nextIdx]?.focus()
                                }}
                                className="w-9 h-10 rounded-lg bg-[var(--zv-panel)] border border-[var(--zv-border)] text-center text-[14px] font-black text-[var(--zv-text)] outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30 transition-all"
                              />
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <button onClick={handleVerifyWithdrawOtp} disabled={withdrawOtpLoading || withdrawOtpCode.join('').length !== 6}
                              className="flex-1 h-9 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white text-[9px] font-bold flex items-center justify-center gap-1 hover:from-blue-500 hover:to-blue-400 transition-all disabled:opacity-50">
                              {withdrawOtpLoading ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <><CheckCircle className="w-3 h-3" />Verifikasi</>}
                            </button>
                            {withdrawOtpTimer > 0 ? (
                              <span className="h-9 px-3 rounded-xl bg-[var(--zv-panel)] border border-[var(--zv-border)] text-[9px] font-bold text-[var(--zv-muted)] flex items-center">({withdrawOtpTimer}s)</span>
                            ) : (
                              <button onClick={handleSendWithdrawOtp} disabled={withdrawOtpLoading}
                                className="h-9 px-3 rounded-xl bg-[var(--zv-panel)] border border-[var(--zv-border)] text-[9px] font-bold text-[#3b82f6] hover:bg-[#3b82f6]/10 transition-all disabled:opacity-50">
                                Kirim Ulang
                              </button>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[9px] text-green-400 font-bold">
                          <CheckCircle className="w-3.5 h-3.5" />Email berhasil diverifikasi
                        </div>
                      )}
                    </div>

                    {/* Withdraw Button */}
                    <button onClick={handleWithdraw} disabled={withdrawLoading || !withdrawOtpVerified}
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
                      <h3 className="text-[12px] font-black text-[var(--zv-text)]">Trading</h3>
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
                      const plAmt = pos.closedPL !== undefined ? pos.closedPL : (isWon ? Math.round(pos.amount * pos.profitPercent / 100) : -pos.amount)
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
                                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${pos.direction === 'NAIK' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{pos.direction === 'NAIK' ? 'Buy' : 'Sell'}</span>
                                </div>
                                <span className="text-[7px] text-[var(--zv-muted)]">{formatRupiah(pos.amount)} • Entry {formatNumber(pos.startPrice)}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`block text-[11px] font-black ${isWon ? 'text-green-400' : 'text-red-400'}`}>
                                {isWon ? '+' : ''}{formatRupiah(plAmt)}
                              </span>
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
                  {[{ key: 'all', label: 'Semua' }, { key: 'BUY', label: 'Buy' }, { key: 'SELL', label: 'Sell' }, { key: 'DEPOSIT', label: 'Deposit' }, { key: 'WITHDRAW', label: 'Withdraw' }].map(f => (
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
                              {tx.type === 'BUY' ? 'Buy' : 'Sell'} {tx.stock?.code || 'N/A'}
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
                  <div className="w-10 h-10 rounded-xl grid place-items-center bg-green-500/15 border border-green-500/25">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <span className="block text-[10px] font-black text-[var(--zv-text)]">Akun Real</span>
                    <span className="block text-[8px] text-[var(--zv-muted)]">Saldo riil untuk trading</span>
                  </div>
                  <span className="h-5 px-2 rounded-full text-[7px] font-bold flex items-center gap-1 bg-green-500/20 border border-green-400/30 text-green-300">
                    REAL
                  </span>
                </div>
              </div>

              {/* Regulatory Footer */}
              <div className="rounded-2xl p-4 bg-gradient-to-br from-[var(--zv-surface)] to-[var(--zv-panel)] border border-[var(--zv-border)] mb-4 shadow-sm">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-[var(--zv-border)] grid place-items-center"><Shield className="w-4 h-4 text-[#3b82f6]" /></div>
                  <div className="w-8 h-8 rounded-lg bg-[var(--zv-border)] grid place-items-center"><CheckCircle className="w-4 h-4 text-[#f59e0b]" /></div>
                </div>
                <p className="text-center text-[8px] font-black text-[var(--zv-muted)] tracking-wider">ASET GLOBAL • TERDAFTAR & DIAWASI OJK • V1.0</p>
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
                      {confirmTradeDir === 'NAIK' ? 'BUY' : 'SELL'} {selectedSinyalStock?.code}
                    </span>
                    <span className="block text-[8px] text-[var(--zv-muted)]">
                      {confirmTradeDir === 'NAIK' ? 'Memprediksi kenaikan harga' : 'Memprediksi penurunan harga'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between py-2 border-b border-[var(--zv-border)]">
                    <span className="text-[10px] text-[var(--zv-muted)] font-bold">Lot</span>
                    <span className="text-[10px] font-black text-[#3b82f6]">{sinyalLots} Lot ({formatRupiah(sinyalAmountFromLots)})</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[var(--zv-border)]">
                    <span className="text-[10px] text-[var(--zv-muted)] font-bold">Leverage</span>
                    <span className="text-[10px] font-black text-amber-400">1:{sinyalLeverage}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[var(--zv-border)]">
                    <span className="text-[10px] text-[var(--zv-muted)] font-bold">Effective Position</span>
                    <span className="text-[10px] font-black text-[var(--zv-text)]">{formatRupiah(sinyalAmountFromLots * (sinyalLeverage / 100))}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[var(--zv-border)]">
                    <span className="text-[10px] text-[var(--zv-muted)] font-bold">Profit/Loss per 1%</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-green-400">+{formatRupiah(Math.round(sinyalAmountFromLots * (sinyalLeverage / 100) * 0.01))}</span>
                      <span className="text-[9px] text-[var(--zv-muted)]">/</span>
                      <span className="text-[9px] font-bold text-red-400">-{formatRupiah(Math.round(sinyalAmountFromLots * (sinyalLeverage / 100) * 0.01))}</span>
                    </div>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[var(--zv-border)]">
                    <span className="text-[10px] text-[var(--zv-muted)] font-bold">Tutup Posisi</span>
                    <span className="text-[10px] font-black text-green-400">Manual (Anda tentukan)</span>
                  </div>
                  <div className="rounded-lg p-2 bg-blue-500/8 border border-blue-500/15">
                    <div className="flex items-center gap-1.5">
                      <Info className="w-3 h-3 text-blue-400" />
                      <span className="text-[8px] font-bold text-blue-400">Posisi terbuka sampai Anda tutup manual. Saldo ikut pergerakan grafik real-time seperti MT5!</span>
                    </div>
                  </div>
                </div>

                <button onClick={() => {
                  openSinyalPosition(confirmTradeDir)
                  setShowConfirmTrade(false)
                }}
                  className="relative w-full h-14 rounded-xl text-white text-[13px] font-black tracking-wide flex items-center justify-center gap-2 transition-all active:scale-[0.96] overflow-hidden"
                  style={confirmTradeDir === 'NAIK'
                    ? { background: 'linear-gradient(180deg, #4ade80 0%, #22c55e 30%, #16a34a 70%, #166534 100%)', boxShadow: '0 6px 28px rgba(34,197,94,0.45), 0 2px 8px rgba(34,197,94,0.3), inset 0 1px 0 rgba(255,255,255,0.2)' }
                    : { background: 'linear-gradient(180deg, #f87171 0%, #ef5350 30%, #dc2626 70%, #991b1b 100%)', boxShadow: '0 6px 28px rgba(239,83,80,0.45), 0 2px 8px rgba(239,83,80,0.3), inset 0 1px 0 rgba(255,255,255,0.2)' }
                  }>
                  <div className="absolute inset-x-0 top-0 h-1/3" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%)' }} />
                  {confirmTradeDir === 'NAIK' ? <TrendingUp className="w-5 h-5 relative drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" /> : <TrendingDown className="w-5 h-5 relative drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" />}
                  <span className="relative drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)]">CONFIRM {confirmTradeDir === 'NAIK' ? 'BUY' : 'SELL'}</span>
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
            { key: 'market', label: 'Quote', icon: BarChart3 },
            { key: 'sinyal', label: 'Chart', icon: Activity },
            { key: 'saldo', label: 'Trade', icon: Wallet },
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
          <ZevorikLogo size={32} />
          <span className="text-[7px] font-black gradient-text tracking-wider">ZEVORIK</span>
        </div>
        {[
          { key: 'home', label: 'Beranda', icon: HomeIcon },
          { key: 'market', label: 'Quote', icon: BarChart3 },
          { key: 'sinyal', label: 'Chart', icon: Activity },
          { key: 'saldo', label: 'Trade', icon: Wallet },
          { key: 'profil', label: 'Profil', icon: User },
          { key: 'portfolio', label: 'Portofolio', icon: Briefcase },
          { key: 'finance', label: 'Keuangan', icon: CreditCard },
          { key: 'history', label: 'Riwayat', icon: History },
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
                  { icon: <BarChart3 className="w-4 h-4" />, label: 'Pasar Global', key: 'market' },
                  { icon: <Target className="w-4 h-4" />, label: 'Trading', key: 'sinyal' },
                  { icon: <Wallet className="w-4 h-4" />, label: 'Saldo Live', key: 'saldo' },
                  { icon: <Briefcase className="w-4 h-4" />, label: 'Portofolio', key: 'portfolio' },
                  { icon: <CreditCard className="w-4 h-4" />, label: 'Keuangan', key: 'finance' },
                  { icon: <History className="w-4 h-4" />, label: 'Riwayat', key: 'history' },
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
                      <div className="w-6 h-6 rounded-lg grid place-items-center bg-[var(--zv-surface)]">
                        {n.type === 'trade' ? <BarChart3 className="w-3 h-3 text-[#3b82f6]" /> : n.type === 'deposit' ? <Wallet className="w-3 h-3 text-[#3b82f6]" /> : <Bell className="w-3 h-3 text-[#f59e0b]" />}
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


      {/* Stock Detail Modal */}
      <AnimatePresence>
        {showStockDetail && selectedStock && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40" onClick={() => setShowStockDetail(false)} />
            <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25 }} className="fixed z-50 bottom-0 left-0 right-0 md:inset-0 md:bottom-auto md:left-auto md:right-auto md:top-auto md:flex md:items-center md:justify-center max-h-[85vh] md:max-h-[90vh] bg-[var(--zv-panel)] rounded-t-3xl md:rounded-3xl border border-[var(--zv-border)] overflow-y-auto custom-scrollbar md:w-[90vw] md:max-w-2xl md:mx-auto md:my-auto">
              <div className="sticky top-0 bg-[var(--zv-panel)] p-4 border-b border-[var(--zv-border)] flex items-center justify-between rounded-t-3xl">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-[var(--zv-surface)] flex items-center justify-center">{getRealLogo(selectedStock.code, 40)}</div>
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
                  <Package className="w-5 h-5" />Buy Contract {selectedStock.code}
                </button>
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
                    <h2 className="text-[16px] font-black text-[var(--zv-text)]">Tentang ZEVORIK</h2>
                  </div>
                  <button onClick={() => setShowAboutModal(false)} className="w-8 h-8 rounded-full bg-[var(--zv-surface)] border border-[var(--zv-border)] grid place-items-center hover:bg-[var(--zv-border)] transition-colors"><X className="w-4 h-4 text-[var(--zv-muted)]" /></button>
                </div>
                <div className="rounded-2xl overflow-hidden mb-4" style={{ background: 'linear-gradient(145deg, #0c1a2e 0%, #1e3a5f 54%, #2563eb 100%)' }}>
                  <div className="p-5 text-white text-center">
                    <div className="mx-auto mb-3 w-fit">
                      <ZevorikLogo size={50} />
                    </div>
                    <h3 className="text-[18px] font-black gradient-text tracking-[0.15em]">ZEVORIK</h3>
                    <p className="text-[9px] text-blue-200 tracking-[0.2em] uppercase font-medium">Platform Investasi Saham Digital</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] text-[var(--zv-text)] leading-relaxed">ZEVORIK adalah platform investasi saham digital terpercaya yang menyediakan akses ke pasar saham global dengan teknologi terdepan. Didirikan dengan visi demokratisasi investasi untuk semua orang Indonesia.</p>
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
                    { q: 'Apa itu Trading?', a: 'Trading adalah fitur dimana Anda membuka posisi Buy/Sell dengan Lot & Leverage. Posisi terbuka sampai Anda tutup manual, saldo ikut pergerakan grafik real-time seperti MT5.' },
                    { q: 'Apakah ZEVORIK aman?', a: 'ZEVORIK terdaftar dan diawasi oleh OJK. Semua dana nasabah dijamin oleh LPS. Kami menggunakan enkripsi SSL 256-bit.' },
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
  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #eff6ff 0%, #dbeafe 50%, #bfdbfe 100%)' }}>
      <div className="flex flex-col items-center gap-3">
        <ZevorikLogo size={56} />
        <span className="text-[12px] font-black text-[#1d4ed8] tracking-widest animate-pulse">LOADING...</span>
      </div>
    </div>
  )
  if (!isLoggedIn) return <LoginPage />
  return <Dashboard />
}
