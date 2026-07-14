'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/lib/store'
import {
  Eye, EyeOff, ArrowRight,
  BarChart3, Briefcase,
  Shield,
  Lock,
  User, CheckCircle,
  Phone,
  Zap, Users, Mail,
  UserPlus, LogIn
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { REFERENCE_TICKERS } from '@/lib/trading-utils'
import { ZevorikLogo } from '@/components/ZevorikLogo'


// ============================================
// LOGIN / REGISTER PAGE (2-Step with PIN)
// ============================================
export function LoginPage() {
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
