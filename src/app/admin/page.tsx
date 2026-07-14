'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  LayoutDashboard, Users, ArrowDownToLine, ArrowUpFromLine, TrendingUp,
  Newspaper, Gift, Image as ImageIcon, Settings, LogOut, Search, RefreshCw,
  Check, X, Plus, Trash2, Edit3, Save, Upload, Eye, EyeOff, Menu,
  DollarSign, BarChart3, Clock, AlertCircle, CheckCircle2, Shield, QrCode,
  Zap, Bell, FileText, UserCheck, Activity, ChevronDown, LogIn, User,
  UserPlus, Smartphone, Hash, Globe, Palette, Database, Megaphone,
  TrendingDown, Wallet, CreditCard, Receipt, Timer
} from 'lucide-react'

/* ── types ── */
interface AdminUser { id: string; name: string; phone: string; role: string }
interface Stats {
  totalUsers: number; totalBalance: number; totalDeposits: number; totalWithdrawals: number;
  activeInvestments: number; platformRevenue: number; pendingDeposits: number; pendingWithdrawals: number;
  totalNews: number; activePromos: number; totalStocks: number; activeTrades: number; activeContracts: number;
}

type Section = 'dashboard' | 'users' | 'deposits' | 'withdrawals' | 'stocks' | 'investments' | 'news' | 'promos' | 'banners' | 'trades' | 'contracts' | 'kyc' | 'notifications' | 'qris' | 'settings'

const SECTIONS: { key: Section; label: string; icon: React.ReactNode; group: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, group: 'Utama' },
  { key: 'users', label: 'Users', icon: <Users size={18} />, group: 'Manajemen' },
  { key: 'kyc', label: 'Verifikasi KYC', icon: <UserCheck size={18} />, group: 'Manajemen' },
  { key: 'deposits', label: 'Deposit', icon: <ArrowDownToLine size={18} />, group: 'Keuangan' },
  { key: 'withdrawals', label: 'Withdrawal', icon: <ArrowUpFromLine size={18} />, group: 'Keuangan' },
  { key: 'trades', label: 'Sinyal Trade', icon: <Activity size={18} />, group: 'Keuangan' },
  { key: 'contracts', label: 'Kontrak Saham', icon: <FileText size={18} />, group: 'Keuangan' },
  { key: 'stocks', label: 'Stocks', icon: <TrendingUp size={18} />, group: 'Konten' },
  { key: 'investments', label: 'Investasi', icon: <BarChart3 size={18} />, group: 'Konten' },
  { key: 'news', label: 'News', icon: <Newspaper size={18} />, group: 'Konten' },
  { key: 'promos', label: 'Promos', icon: <Gift size={18} />, group: 'Konten' },
  { key: 'banners', label: 'Banners', icon: <ImageIcon size={18} />, group: 'Konten' },
  { key: 'notifications', label: 'Notifikasi', icon: <Bell size={18} />, group: 'Sistem' },
  { key: 'qris', label: 'QRIS Payment', icon: <QrCode size={18} />, group: 'Sistem' },
  { key: 'settings', label: 'Settings', icon: <Settings size={18} />, group: 'Sistem' },
]

function fmt(n: number) {
  if (n === undefined || n === null) return '0'
  return new Intl.NumberFormat('id-ID').format(n)
}
function fmtDate(d: string) {
  return new Date(d).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function statusBadge(s: string) {
  const m: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    verified: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    active: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    won: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    lost: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300',
    processing: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  }
  return m[s] || 'bg-gray-100 text-gray-800'
}

/* ── Zevorix Logo SVG ── */
function ZevorixLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <rect width="60" height="60" rx="16" fill="#1d4ed8" />
      <path d="M15 18L30 42L45 18" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 18L30 32L38 18" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function AdminDashboard() {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [section, setSection] = useState<Section>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loginPhone, setLoginPhone] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginErr, setLoginErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>()

  const showToast = useCallback((msg: string, type: 'ok' | 'err' = 'ok') => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ msg, type })
    toastTimer.current = setTimeout(() => setToast(null), 2500)
  }, [])

  const handleLogin = async () => {
    setLoginErr('')
    setLoading(true)
    try {
      const r = await fetch('/api/admin/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: loginPhone, password: loginPass })
      })
      const d = await r.json()
      if (!r.ok) { setLoginErr(d.error || 'Login gagal'); return }
      setAdmin(d.admin)
      localStorage.setItem('adminId', d.admin.id)
      localStorage.setItem('adminToken', d.token)
      showToast('Login berhasil!')
    } catch { setLoginErr('Koneksi gagal') }
    finally { setLoading(false) }
  }

  const handleLogout = () => {
    setAdmin(null)
    localStorage.removeItem('adminId')
    localStorage.removeItem('adminToken')
    setSection('dashboard')
  }

  useEffect(() => {
    const id = localStorage.getItem('adminId')
    const token = localStorage.getItem('adminToken')
    if (id && token) {
      setAdmin({ id, name: 'Admin', phone: '', role: 'admin' })
    }
  }, [])

  const uploadFile = async (file: File): Promise<string | null> => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('adminId', admin?.id || '')
    try {
      const r = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const d = await r.json()
      if (d.url) return d.url
      showToast('Upload gagal', 'err')
      return null
    } catch {
      showToast('Upload gagal', 'err')
      return null
    }
  }

  const api = useCallback(async (path: string, opts?: RequestInit) => {
    try {
      const r = await fetch(path, opts)
      return await r.json()
    } catch { return null }
  }, [])

  /* ═══════════════════ LOGIN SCREEN (Like User App) ═══════════════════ */
  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1e3a5f] to-[#0f172a] p-4">
        <div className="w-full max-w-[420px]">
          <div className="rounded-3xl bg-white/5 backdrop-blur-2xl shadow-2xl border border-white/10 overflow-hidden">
            {/* Blue Header */}
            <div className="relative overflow-hidden text-white" style={{ background: 'linear-gradient(145deg, #172554 0%, #1d4ed8 54%, #3b82f6 100%)' }}>
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.04) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
              {/* LIVE Badge */}
              <div className="relative flex items-center gap-2 px-5 pt-4 pb-2">
                <div className="flex-shrink-0 h-6 px-2.5 rounded-full flex items-center gap-1.5 bg-yellow-500/20 border border-yellow-400/30">
                  <Shield className="w-3 h-3 text-yellow-300" />
                  <span className="text-[8px] font-black text-yellow-300 tracking-wide">ADMIN</span>
                </div>
                <div className="flex-1 overflow-hidden h-6 rounded-full bg-white/10 border border-white/15 flex items-center px-2">
                  <span className="text-[8px] font-bold text-blue-200 whitespace-nowrap animate-pulse">Secure Admin Access &bull; Full Control Panel</span>
                </div>
              </div>
              {/* Logo + Text */}
              <div className="relative z-10 flex flex-col items-center px-4 pt-2 pb-4">
                <div className="mb-2"><ZevorixLogo size={56} /></div>
                <h1 className="text-[18px] font-black text-center leading-tight">Masuk Admin<br />ZEVORIK</h1>
                <p className="max-w-[280px] mt-1.5 text-[9px] text-center font-medium text-blue-200 leading-relaxed">
                  Akses panel admin ZEVORIK untuk mengelola pengguna, deposit, withdrawal, dan seluruh platform.
                </p>
              </div>
              {/* Chart Line */}
              <div className="relative z-10 mx-4 mb-3 h-8 rounded-xl overflow-hidden bg-white/8 border border-white/12">
                <svg className="w-full h-full" viewBox="0 0 400 40" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="admChartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,30 L25,28 L50,26 L75,28 L100,22 L125,20 L150,22 L175,16 L200,14 L225,15 L250,10 L275,8 L300,9 L325,6 L350,7 L375,4 L400,3 L400,40 L0,40Z" fill="url(#admChartGrad)" />
                  <path d="M0,30 L25,28 L50,26 L75,28 L100,22 L125,20 L150,22 L175,16 L200,14 L225,15 L250,10 L275,8 L300,9 L325,6 L350,7 L375,4 L400,3" fill="none" stroke="#f59e0b" strokeWidth="2.5" />
                </svg>
              </div>
            </div>

            {/* Form Section */}
            <div className="p-5 space-y-4">
              {loginErr && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle size={16} /> {loginErr}
                </div>
              )}
              <div>
                <label className="flex items-center gap-1.5 mb-1.5 text-[10px] font-black text-[#3b82f6] uppercase tracking-widest">
                  <Smartphone className="w-3 h-3 text-[#3b82f6]" /> Nomor HP
                </label>
                <input type="text" value={loginPhone} onChange={e => setLoginPhone(e.target.value)}
                  placeholder="080000000000"
                  className="w-full h-11 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-all" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 mb-1.5 text-[10px] font-black text-[#3b82f6] uppercase tracking-widest">
                  <Hash className="w-3 h-3 text-[#3b82f6]" /> Password
                </label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={loginPass} onChange={e => setLoginPass(e.target.value)}
                    placeholder="Masukkan kata sandi"
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    className="w-full h-11 px-4 pr-10 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-all" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button onClick={handleLogin} disabled={loading}
                className="w-full h-12 rounded-xl bg-[#1d4ed8] hover:bg-[#3b82f6] text-white font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20">
                {loading ? <RefreshCw size={18} className="animate-spin" /> : <LogIn size={18} />}
                Masuk Admin
              </button>
              <p className="text-center text-gray-400 text-[10px]">Default: 080000000000 / admin123</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ═══════════════════ MAIN DASHBOARD ═══════════════════ */
  const grouped = SECTIONS.reduce<Record<string, typeof SECTIONS>>((acc, s) => {
    if (!acc[s.group]) acc[s.group] = []
    acc[s.group].push(s)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      {toast && (
        <div className={`fixed top-4 right-4 z-[999] px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 animate-in slide-in-from-top-2 ${
          toast.type === 'ok' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.type === 'ok' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-56' : 'w-14'} transition-all duration-300 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col shrink-0 fixed md:relative h-full z-40`}>
        <div className="h-14 flex items-center justify-between px-3 border-b border-gray-200 dark:border-gray-800 shrink-0">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <ZevorixLogo size={28} />
              <span className="text-sm font-black text-[#3b82f6]">ZEVORIK</span>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
            <Menu size={16} />
          </button>
        </div>
        <nav className="flex-1 py-1 overflow-y-auto custom-scrollbar">
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group} className="mb-1">
              {sidebarOpen && <p className="px-4 pt-3 pb-1 text-[9px] font-black text-gray-400 uppercase tracking-widest">{group}</p>}
              {items.map(s => (
                <button key={s.key} onClick={() => setSection(s.key)} title={s.label}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 mx-1.5 rounded-lg text-[12px] transition ${
                    section === s.key
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}>
                  {s.icon}
                  {sidebarOpen && <span>{s.label}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="border-t border-gray-200 dark:border-gray-800 p-2 shrink-0">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition">
            <LogOut size={16} />
            {sidebarOpen && <span>Keluar</span>}
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <main className="flex-1 overflow-auto md:ml-0">
        <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
              <Menu size={18} />
            </button>
            <h2 className="text-base font-bold text-gray-800 dark:text-gray-200 capitalize">{SECTIONS.find(s => s.key === section)?.label}</h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Shield size={14} className="text-blue-600" />
            <span className="font-medium">{admin.name}</span>
          </div>
        </header>
        <div className="p-4 md:p-6">
          {section === 'dashboard' && <DashboardSection adminId={admin.id} api={api} />}
          {section === 'users' && <UsersSection adminId={admin.id} api={api} showToast={showToast} />}
          {section === 'kyc' && <KycSection adminId={admin.id} api={api} showToast={showToast} />}
          {section === 'deposits' && <DepositsSection adminId={admin.id} api={api} showToast={showToast} />}
          {section === 'withdrawals' && <WithdrawalsSection adminId={admin.id} api={api} showToast={showToast} />}
          {section === 'trades' && <TradesSection adminId={admin.id} api={api} showToast={showToast} />}
          {section === 'contracts' && <ContractsSection adminId={admin.id} api={api} showToast={showToast} />}
          {section === 'stocks' && <StocksSection adminId={admin.id} api={api} showToast={showToast} uploadFile={uploadFile} />}
          {section === 'investments' && <InvestmentsSection adminId={admin.id} api={api} showToast={showToast} />}
          {section === 'news' && <NewsSection adminId={admin.id} api={api} showToast={showToast} uploadFile={uploadFile} />}
          {section === 'promos' && <PromosSection adminId={admin.id} api={api} showToast={showToast} />}
          {section === 'banners' && <BannersSection adminId={admin.id} api={api} showToast={showToast} uploadFile={uploadFile} />}
          {section === 'notifications' && <NotificationsSection adminId={admin.id} api={api} showToast={showToast} />}
          {section === 'qris' && <QrisSection adminId={admin.id} api={api} showToast={showToast} uploadFile={uploadFile} />}
          {section === 'settings' && <SettingsSection adminId={admin.id} api={api} showToast={showToast} uploadFile={uploadFile} />}
        </div>
      </main>
    </div>
  )
}

/* ── reusable fetch hook ── */
function useAdminFetch<T>(url: string, adminId: string, api: (p: string, o?: RequestInit) => Promise<any>, key: string) {
  const [data, setData] = useState<T | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const loaded = data !== null

  useEffect(() => {
    api(`${url}?userId=${adminId}`).then(d => {
      if (d?.[key]) setData(d[key])
      setRefreshing(false)
    })
  }, [url, adminId, api, key])

  const refresh = useCallback(() => {
    setRefreshing(true)
    api(`${url}?userId=${adminId}`).then(d => {
      if (d?.[key]) setData(d[key])
      setRefreshing(false)
    })
  }, [url, adminId, api, key])

  return { data, setData, refreshing, loading: !loaded || refreshing, refresh }
}

/* ═══════════════════ DASHBOARD ═══════════════════ */
function DashboardSection({ adminId, api }: { adminId: string; api: (p: string, o?: RequestInit) => Promise<any> }) {
  const { data: raw, loading, refresh } = useAdminFetch<any>('/api/admin/dashboard', adminId, api, 'stats')
  const [recentDeps, setRecentDeps] = useState<any[]>([])
  const [recentWiths, setRecentWiths] = useState<any[]>([])
  const [recentUsers, setRecentUsers] = useState<any[]>([])

  useEffect(() => {
    api(`/api/admin/dashboard?userId=${adminId}`).then(d => {
      if (d?.recentDeposits) setRecentDeps(d.recentDeposits)
      if (d?.recentWithdrawals) setRecentWiths(d.recentWithdrawals)
      if (d?.recentUsers) setRecentUsers(d.recentUsers)
    })
  }, [adminId, api])

  const stats = raw as Stats | null

  const cards = stats ? [
    { label: 'Total Users', value: fmt(stats.totalUsers), icon: <Users size={20} />, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' },
    { label: 'Total Saldo User', value: 'Rp ' + fmt(stats.totalBalance), icon: <Wallet size={20} />, color: 'text-green-600 bg-green-50 dark:bg-green-950/40' },
    { label: 'Total Deposit', value: 'Rp ' + fmt(stats.totalDeposits), icon: <ArrowDownToLine size={20} />, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
    { label: 'Total Withdrawal', value: 'Rp ' + fmt(stats.totalWithdrawals), icon: <ArrowUpFromLine size={20} />, color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/40' },
    { label: 'Revenue Platform', value: 'Rp ' + fmt(stats.platformRevenue), icon: <DollarSign size={20} />, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40' },
    { label: 'Trade Aktif', value: fmt(stats.activeTrades || 0), icon: <Activity size={20} />, color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40' },
    { label: 'Investasi Aktif', value: fmt(stats.activeInvestments), icon: <TrendingUp size={20} />, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40' },
    { label: 'Kontrak Aktif', value: fmt(stats.activeContracts || 0), icon: <FileText size={20} />, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40' },
    { label: 'Pending Deposit', value: fmt(stats.pendingDeposits), icon: <Clock size={20} />, color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/40' },
    { label: 'Pending Withdrawal', value: fmt(stats.pendingWithdrawals), icon: <AlertCircle size={20} />, color: 'text-red-600 bg-red-50 dark:red-950/40' },
    { label: 'Total Saham', value: fmt(stats.totalStocks), icon: <BarChart3 size={20} />, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40' },
    { label: 'Promo Aktif', value: fmt(stats.activePromos), icon: <Gift size={20} />, color: 'text-pink-600 bg-pink-50 dark:bg-pink-950/40' },
  ] : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Overview</h3>
        <button onClick={refresh} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {loading ? Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        )) : cards.map((c, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${c.color}`}>{c.icon}</div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{c.label}</p>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{c.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
          <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2"><ArrowDownToLine size={14} className="text-green-600" /> Deposit Terbaru</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
            {recentDeps.map((d: any) => (
              <div key={d.id} className="flex items-center justify-between text-xs">
                <div><p className="font-medium text-gray-800 dark:text-gray-200">{d.user?.name}</p><p className="text-gray-400">{fmtDate(d.createdAt)}</p></div>
                <div className="text-right"><p className="font-bold text-green-600">+Rp {fmt(d.amount)}</p><span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${statusBadge(d.status)}`}>{d.status}</span></div>
              </div>
            ))}
            {recentDeps.length === 0 && <p className="text-gray-400 text-xs text-center py-4">Belum ada data</p>}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
          <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2"><ArrowUpFromLine size={14} className="text-orange-600" /> Withdrawal Terbaru</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
            {recentWiths.map((w: any) => (
              <div key={w.id} className="flex items-center justify-between text-xs">
                <div><p className="font-medium text-gray-800 dark:text-gray-200">{w.user?.name}</p><p className="text-gray-400">{fmtDate(w.createdAt)}</p></div>
                <div className="text-right"><p className="font-bold text-orange-600">-Rp {fmt(w.amount)}</p><span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${statusBadge(w.status)}`}>{w.status}</span></div>
              </div>
            ))}
            {recentWiths.length === 0 && <p className="text-gray-400 text-xs text-center py-4">Belum ada data</p>}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
          <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2"><Users size={14} className="text-blue-600" /> User Terbaru</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
            {recentUsers.map((u: any) => (
              <div key={u.id} className="flex items-center justify-between text-xs">
                <div><p className="font-medium text-gray-800 dark:text-gray-200">{u.name}</p><p className="text-gray-400">{u.phone}</p></div>
                <p className="font-bold text-gray-600 dark:text-gray-300">Rp {fmt(u.balance)}</p>
              </div>
            ))}
            {recentUsers.length === 0 && <p className="text-gray-400 text-xs text-center py-4">Belum ada data</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════ USERS ═══════════════════ */
function UsersSection({ adminId, api, showToast }: { adminId: string; api: any; showToast: any }) {
  const { data: users, setData: setUsers, loading, refresh } = useAdminFetch<any[]>('/api/admin/users', adminId, api, 'users')
  const [search, setSearch] = useState('')
  const [editUser, setEditUser] = useState<any>(null)
  const [form, setForm] = useState({ name: '', phone: '', email: '', role: 'investor', vipLevel: 'Bronze', kycStatus: 'pending', balanceAdjust: '', bankName: '', bankAccount: '', bankHolder: '' })

  const doSearch = () => {
    api(`/api/admin/users?userId=${adminId}${search ? `&search=${search}` : ''}`).then(d => {
      if (d?.users) setUsers(d.users)
    })
  }

  const startEdit = (u: any) => {
    setForm({ name: u.name, phone: u.phone, email: u.email || '', role: u.role, vipLevel: u.vipLevel, kycStatus: u.kycStatus, balanceAdjust: '', bankName: u.bankName || '', bankAccount: u.bankAccount || '', bankHolder: u.bankHolder || '' })
    setEditUser(u)
  }

  const handleEdit = async () => {
    if (!editUser) return
    const body: Record<string, unknown> = { adminId, name: form.name, phone: form.phone, email: form.email, role: form.role, vipLevel: form.vipLevel, kycStatus: form.kycStatus, bankName: form.bankName, bankAccount: form.bankAccount, bankHolder: form.bankHolder }
    if (form.balanceAdjust) body.balanceAdjust = Number(form.balanceAdjust)
    const d = await api(`/api/admin/users/${editUser.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    })
    if (d?.user) { showToast('User updated'); setEditUser(null); refresh() }
    else showToast('Gagal update', 'err')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus user ini? Semua data user akan dihapus permanen!')) return
    const d = await api(`/api/admin/users/${id}`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId })
    })
    if (d?.success) { showToast('User dihapus'); refresh() }
    else showToast('Gagal hapus', 'err')
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()}
            placeholder="Cari nama/HP/email..." className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-400" />
        </div>
        <button onClick={refresh} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto max-h-[70vh] overflow-y-auto custom-scrollbar">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
              <tr>
                {['Nama', 'HP', 'Saldo', 'Role', 'VIP', 'KYC', 'Deposit', 'Bank', 'Aksi'].map(h => (
                  <th key={h} className="text-left p-2.5 text-gray-500 font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {(users || []).map(u => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="p-2.5 font-semibold text-gray-800 dark:text-gray-200">{u.name}</td>
                  <td className="p-2.5 text-gray-600 dark:text-gray-400">{u.phone}</td>
                  <td className="p-2.5 text-gray-800 dark:text-gray-200 font-medium">Rp {fmt(u.balance)}</td>
                  <td className="p-2.5"><span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${statusBadge(u.role === 'admin' ? 'active' : 'pending')}`}>{u.role}</span></td>
                  <td className="p-2.5 text-gray-600 dark:text-gray-400">{u.vipLevel}</td>
                  <td className="p-2.5"><span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${statusBadge(u.kycStatus)}`}>{u.kycStatus}</span></td>
                  <td className="p-2.5 text-gray-600 dark:text-gray-400">Rp {fmt(u.totalDeposit)}</td>
                  <td className="p-2.5 text-gray-400 max-w-[100px] truncate">{u.bankName || '-'}</td>
                  <td className="p-2.5">
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(u)} className="p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-600"><Edit3 size={12} /></button>
                      <button onClick={() => handleDelete(u.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!users || users.length === 0) && !loading && (
                <tr><td colSpan={9} className="p-8 text-center text-gray-400">Tidak ada data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditUser(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-200">Edit User: {editUser.name}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[10px] font-bold text-gray-500 uppercase">Nama</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-400" /></div>
              <div><label className="text-[10px] font-bold text-gray-500 uppercase">HP</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-400" /></div>
              <div><label className="text-[10px] font-bold text-gray-500 uppercase">Email</label><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-400" /></div>
              <div><label className="text-[10px] font-bold text-gray-500 uppercase">Role</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-400">
                  <option value="investor">Investor</option><option value="admin">Admin</option>
                </select>
              </div>
              <div><label className="text-[10px] font-bold text-gray-500 uppercase">VIP Level</label>
                <select value={form.vipLevel} onChange={e => setForm({ ...form, vipLevel: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-400">
                  {['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div><label className="text-[10px] font-bold text-gray-500 uppercase">KYC Status</label>
                <select value={form.kycStatus} onChange={e => setForm({ ...form, kycStatus: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-400">
                  <option value="pending">Pending</option><option value="verified">Verified</option><option value="rejected">Rejected</option>
                </select>
              </div>
              <div><label className="text-[10px] font-bold text-gray-500 uppercase">Bank</label><input value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })} placeholder="BCA, Mandiri..." className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-400" /></div>
              <div><label className="text-[10px] font-bold text-gray-500 uppercase">No. Rekening</label><input value={form.bankAccount} onChange={e => setForm({ ...form, bankAccount: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-400" /></div>
              <div><label className="text-[10px] font-bold text-gray-500 uppercase">Nama Rekening</label><input value={form.bankHolder} onChange={e => setForm({ ...form, bankHolder: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-400" /></div>
              <div><label className="text-[10px] font-bold text-gray-500 uppercase">Saat ini: Rp {fmt(editUser.balance)}</label><input value={form.balanceAdjust} onChange={e => setForm({ ...form, balanceAdjust: e.target.value })} type="number" placeholder="Adjust saldo (+/-)" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-400" /></div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setEditUser(null)} className="flex-1 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600">Batal</button>
              <button onClick={handleEdit} className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 flex items-center justify-center gap-1"><Save size={14} /> Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════ KYC ═══════════════════ */
function KycSection({ adminId, api, showToast }: { adminId: string; api: any; showToast: any }) {
  const { data: records, loading, refresh } = useAdminFetch<any[]>('/api/admin/kyc', adminId, api, 'kycRecords')
  const [detailKyc, setDetailKyc] = useState<any>(null)
  const [rejectReason, setRejectReason] = useState('')

  const handleAction = async (id: string, status: string) => {
    if (status === 'rejected' && !rejectReason.trim()) {
      showToast('Alasan penolakan wajib diisi', 'err')
      return
    }
    const d = await api('/api/admin/kyc', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, kycId: id, status, rejectReason: status === 'rejected' ? rejectReason : undefined })
    })
    if (d?.kyc) {
      showToast(`KYC ${status === 'verified' ? 'disetujui' : 'ditolak'}`)
      setDetailKyc(null)
      setRejectReason('')
      refresh()
    }
    else showToast('Gagal update', 'err')
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={refresh} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto max-h-[70vh] overflow-y-auto custom-scrollbar">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
              <tr>
                {['User', 'Nama', 'No. KTP', 'Dokumen', 'Status', 'Tanggal', 'Aksi'].map(h => (
                  <th key={h} className="text-left p-2.5 text-gray-500 font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {(records || []).map(k => (
                <tr key={k.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="p-2.5"><p className="font-semibold text-gray-800 dark:text-gray-200">{k.user?.name}</p><p className="text-gray-400">{k.user?.phone}</p></td>
                  <td className="p-2.5 text-gray-800 dark:text-gray-200">{k.fullName}</td>
                  <td className="p-2.5 text-gray-600 dark:text-gray-400 font-mono">{k.idNumber}</td>
                  <td className="p-2.5">
                    <div className="flex gap-1.5">
                      {k.ktpImage && <button onClick={() => setDetailKyc(k)} className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/30 text-blue-600 text-[9px] font-bold flex items-center gap-0.5"><ImageIcon size={10} />KTP</button>}
                      {k.selfieImage && <button onClick={() => setDetailKyc(k)} className="px-1.5 py-0.5 rounded bg-green-50 dark:bg-green-950/30 text-green-600 text-[9px] font-bold flex items-center gap-0.5"><UserCheck size={10} />Selfie</button>}
                      {k.bankStatement && <button onClick={() => setDetailKyc(k)} className="px-1.5 py-0.5 rounded bg-orange-50 dark:bg-orange-950/30 text-orange-600 text-[9px] font-bold flex items-center gap-0.5"><CreditCard size={10} />Bank</button>}
                      {!k.ktpImage && !k.selfieImage && <span className="text-[9px] text-gray-400">-</span>}
                    </div>
                  </td>
                  <td className="p-2.5"><span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${statusBadge(k.status)}`}>{k.status}</span></td>
                  <td className="p-2.5 text-gray-400">{fmtDate(k.createdAt)}</td>
                  <td className="p-2.5">
                    {k.status === 'pending' ? (
                      <div className="flex gap-1">
                        <button onClick={() => setDetailKyc(k)} className="p-1 rounded bg-blue-50 dark:bg-blue-950/30 text-blue-600" title="Lihat Detail"><Eye size={12} /></button>
                        <button onClick={() => handleAction(k.id, 'verified')} className="p-1 rounded bg-green-50 dark:bg-green-950/30 text-green-600" title="Setujui"><Check size={12} /></button>
                        <button onClick={() => { setDetailKyc(k); setRejectReason('') }} className="p-1 rounded bg-red-50 dark:bg-red-950/30 text-red-600" title="Tolak"><X size={12} /></button>
                      </div>
                    ) : k.status === 'rejected' && k.rejectReason ? (
                      <span className="text-[9px] text-red-500" title={k.rejectReason}>Ditolak: {k.rejectReason.substring(0, 20)}...</span>
                    ) : null}
                  </td>
                </tr>
              ))}
              {(!records || records.length === 0) && !loading && <tr><td colSpan={7} className="p-8 text-center text-gray-400">Tidak ada data KYC</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {detailKyc && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setDetailKyc(null); setRejectReason('') }}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Detail KYC - {detailKyc.fullName}</h3>
              <button onClick={() => { setDetailKyc(null); setRejectReason('') }} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X size={16} /></button>
            </div>

            {/* User Info */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                <p className="text-[9px] font-bold text-gray-500 uppercase">Nama Lengkap</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{detailKyc.fullName}</p>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                <p className="text-[9px] font-bold text-gray-500 uppercase">No. KTP</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 font-mono">{detailKyc.idNumber}</p>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                <p className="text-[9px] font-bold text-gray-500 uppercase">Alamat</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{detailKyc.address}</p>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                <p className="text-[9px] font-bold text-gray-500 uppercase">Pekerjaan</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{detailKyc.occupation}</p>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                <p className="text-[9px] font-bold text-gray-500 uppercase">Penghasilan</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{detailKyc.incomeRange}</p>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                <p className="text-[9px] font-bold text-gray-500 uppercase">Status</p>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadge(detailKyc.status)}`}>{detailKyc.status}</span>
              </div>
            </div>

            {/* Document Images */}
            <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200 mb-3">Dokumen Upload</h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {detailKyc.ktpImage && (
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <p className="text-[9px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/30 px-3 py-1.5">Foto KTP</p>
                  <img src={detailKyc.ktpImage} alt="KTP" className="w-full h-48 object-contain bg-white" />
                </div>
              )}
              {detailKyc.selfieImage && (
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <p className="text-[9px] font-bold text-green-600 bg-green-50 dark:bg-green-950/30 px-3 py-1.5">Selfie dengan KTP</p>
                  <img src={detailKyc.selfieImage} alt="Selfie" className="w-full h-48 object-contain bg-white" />
                </div>
              )}
              {detailKyc.bankStatement && (
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <p className="text-[9px] font-bold text-orange-600 bg-orange-50 dark:bg-orange-950/30 px-3 py-1.5">Buku Rekening</p>
                  <img src={detailKyc.bankStatement} alt="Bank Statement" className="w-full h-48 object-contain bg-white" />
                </div>
              )}
              {detailKyc.additionalDoc && (
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <p className="text-[9px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-950/30 px-3 py-1.5">Dokumen Tambahan</p>
                  <img src={detailKyc.additionalDoc} alt="Additional" className="w-full h-48 object-contain bg-white" />
                </div>
              )}
            </div>

            {/* Rejection Info */}
            {detailKyc.status === 'rejected' && detailKyc.rejectReason && (
              <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-3 mb-4">
                <p className="text-[9px] font-bold text-red-600 mb-1">Alasan Penolakan:</p>
                <p className="text-xs text-red-700 dark:text-red-400">{detailKyc.rejectReason}</p>
              </div>
            )}

            {/* Action Buttons */}
            {detailKyc.status === 'pending' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Alasan Penolakan (jika menolak)</label>
                  <input type="text" value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Masukkan alasan penolakan..." className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-red-400" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAction(detailKyc.id, 'verified')}
                    className="flex-1 py-2.5 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-500 flex items-center justify-center gap-1.5">
                    <Check size={14} /> Setujui KYC
                  </button>
                  <button onClick={() => handleAction(detailKyc.id, 'rejected')}
                    disabled={!rejectReason.trim()}
                    className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-500 disabled:opacity-50 flex items-center justify-center gap-1.5">
                    <X size={14} /> Tolak KYC
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════ DEPOSITS ═══════════════════ */
function DepositsSection({ adminId, api, showToast }: { adminId: string; api: any; showToast: any }) {
  const { data: deposits, loading, refresh } = useAdminFetch<any[]>('/api/admin/deposits', adminId, api, 'deposits')
  const [filter, setFilter] = useState<string>('all')

  const handleAction = async (id: string, status: 'completed' | 'rejected') => {
    const d = await api(`/api/admin/deposits/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, status })
    })
    if (d?.deposit) { showToast(`Deposit ${status === 'completed' ? 'disetujui' : 'ditolak'}`); refresh() }
    else showToast('Gagal update', 'err')
  }

  const filtered = filter === 'all' ? (deposits || []) : (deposits || []).filter(d => d.status === filter)
  const pending = (deposits || []).filter(d => d.status === 'pending')

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {['all', 'pending', 'completed', 'rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}>
            {f === 'all' ? `Semua (${(deposits || []).length})` : f === 'pending' ? `Pending (${pending.length})` : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <button onClick={refresh} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 ml-auto">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {pending.length > 0 && (
        <div className="mb-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-900">
          <h4 className="font-bold text-yellow-800 dark:text-yellow-300 mb-3 flex items-center gap-2 text-sm"><Clock size={14} /> Deposit Menunggu ({pending.length})</h4>
          <div className="space-y-2">
            {pending.map(d => (
              <div key={d.id} className="bg-white dark:bg-gray-900 rounded-lg p-3 flex items-center justify-between border border-yellow-100 dark:border-gray-800">
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{d.user?.name} <span className="text-gray-400 text-[10px]">({d.user?.phone})</span></p>
                  <p className="text-base font-bold text-gray-800 dark:text-gray-200">Rp {fmt(d.amount)}</p>
                  <p className="text-[10px] text-gray-500">{fmtDate(d.createdAt)} - QRIS</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAction(d.id, 'completed')} className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-bold hover:bg-green-500 flex items-center gap-1"><Check size={12} /> Setujui</button>
                  <button onClick={() => handleAction(d.id, 'rejected')} className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-500 flex items-center gap-1"><X size={12} /> Tolak</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto max-h-[60vh] overflow-y-auto custom-scrollbar">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
              <tr>{['User', 'Jumlah', 'Metode', 'Status', 'Tanggal', 'Aksi'].map(h => <th key={h} className="text-left p-2.5 text-gray-500 font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map(d => (
                <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="p-2.5"><p className="font-semibold text-gray-800 dark:text-gray-200">{d.user?.name}</p><p className="text-gray-400 text-[10px]">{d.user?.phone}</p></td>
                  <td className="p-2.5 font-bold text-gray-800 dark:text-gray-200">Rp {fmt(d.amount)}</td>
                  <td className="p-2.5 text-gray-600 dark:text-gray-400">QRIS</td>
                  <td className="p-2.5"><span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${statusBadge(d.status)}`}>{d.status}</span></td>
                  <td className="p-2.5 text-gray-400">{fmtDate(d.createdAt)}</td>
                  <td className="p-2.5">
                    {d.status === 'pending' && (
                      <div className="flex gap-1">
                        <button onClick={() => handleAction(d.id, 'completed')} className="p-1 rounded bg-green-50 dark:bg-green-950/30 text-green-600"><Check size={12} /></button>
                        <button onClick={() => handleAction(d.id, 'rejected')} className="p-1 rounded bg-red-50 dark:bg-red-950/30 text-red-600"><X size={12} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════ WITHDRAWALS ═══════════════════ */
function WithdrawalsSection({ adminId, api, showToast }: { adminId: string; api: any; showToast: any }) {
  const { data: withdrawals, loading, refresh } = useAdminFetch<any[]>('/api/admin/withdrawals', adminId, api, 'withdrawals')
  const [filter, setFilter] = useState<string>('all')

  const handleAction = async (id: string, status: 'completed' | 'rejected') => {
    const d = await api(`/api/admin/withdrawals/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, status })
    })
    if (d?.withdrawal) { showToast(`Withdrawal ${status === 'completed' ? 'disetujui' : 'ditolak'}`); refresh() }
    else showToast('Gagal update', 'err')
  }

  const filtered = filter === 'all' ? (withdrawals || []) : (withdrawals || []).filter(w => w.status === filter)

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {['all', 'pending', 'completed', 'rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}>
            {f === 'all' ? 'Semua' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <button onClick={refresh} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 ml-auto">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto max-h-[70vh] overflow-y-auto custom-scrollbar">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
              <tr>{['User', 'Jumlah', 'Bank', 'Rekening', 'Status', 'Tanggal', 'Aksi'].map(h => <th key={h} className="text-left p-2.5 text-gray-500 font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map(w => (
                <tr key={w.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="p-2.5"><p className="font-semibold text-gray-800 dark:text-gray-200">{w.user?.name}</p><p className="text-gray-400 text-[10px]">{w.user?.phone}</p></td>
                  <td className="p-2.5 font-bold text-gray-800 dark:text-gray-200">Rp {fmt(w.amount)}</td>
                  <td className="p-2.5 text-gray-600 dark:text-gray-400">{w.bankName || '-'}</td>
                  <td className="p-2.5 text-gray-600 dark:text-gray-400">{w.bankAccount || '-'}<br />{w.bankHolder || ''}</td>
                  <td className="p-2.5"><span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${statusBadge(w.status)}`}>{w.status}</span></td>
                  <td className="p-2.5 text-gray-400">{fmtDate(w.createdAt)}</td>
                  <td className="p-2.5">
                    {w.status === 'pending' && (
                      <div className="flex gap-1">
                        <button onClick={() => handleAction(w.id, 'completed')} className="p-1 rounded bg-green-50 dark:bg-green-950/30 text-green-600"><Check size={12} /></button>
                        <button onClick={() => handleAction(w.id, 'rejected')} className="p-1 rounded bg-red-50 dark:bg-red-950/30 text-red-600"><X size={12} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════ TRADES (Sinyal) ═══════════════════ */
function TradesSection({ adminId, api, showToast }: { adminId: string; api: any; showToast: any }) {
  const { data: trades, loading, refresh } = useAdminFetch<any[]>('/api/admin/trades', adminId, api, 'trades')
  const [filter, setFilter] = useState<string>('all')

  const filtered = filter === 'all' ? (trades || []) : (trades || []).filter(t => t.status === filter)

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {['all', 'active', 'won', 'lost'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}>
            {f === 'all' ? 'Semua' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <button onClick={refresh} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 ml-auto">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto max-h-[70vh] overflow-y-auto custom-scrollbar">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
              <tr>{['User', 'Saham', 'Arah', 'Jumlah', 'Profit %', 'Status', 'Mulai', 'Aksi'].map(h => <th key={h} className="text-left p-2.5 text-gray-500 font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map(t => (
                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="p-2.5"><p className="font-semibold text-gray-800 dark:text-gray-200">{t.user?.name}</p><p className="text-gray-400 text-[10px]">{t.user?.phone}</p></td>
                  <td className="p-2.5 font-mono font-bold text-gray-800 dark:text-gray-200">{t.stockCode}</td>
                  <td className="p-2.5"><span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${t.direction === 'UP' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'}`}>{t.direction}</span></td>
                  <td className="p-2.5 font-bold text-gray-800 dark:text-gray-200">Rp {fmt(t.amount)}</td>
                  <td className="p-2.5 text-gray-600 dark:text-gray-400">{t.profitPercent}%</td>
                  <td className="p-2.5"><span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${statusBadge(t.status)}`}>{t.status}</span></td>
                  <td className="p-2.5 text-gray-400">{fmtDate(t.startedAt)}</td>
                  <td className="p-2.5">
                    {t.status === 'won' && <span className="text-green-600 font-bold">+Rp {fmt(t.profit)}</span>}
                    {t.status === 'lost' && <span className="text-red-600 font-bold">-Rp {fmt(t.amount)}</span>}
                    {t.status === 'active' && <span className="text-blue-600 flex items-center gap-1"><Timer size={10} />Live</span>}
                  </td>
                </tr>
              ))}
              {(!trades || trades.length === 0) && !loading && <tr><td colSpan={8} className="p-8 text-center text-gray-400">Tidak ada data trade</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════ CONTRACTS (Kontrak Saham) ═══════════════════ */
function ContractsSection({ adminId, api, showToast }: { adminId: string; api: any; showToast: any }) {
  const { data: contracts, loading, refresh } = useAdminFetch<any[]>('/api/admin/contracts', adminId, api, 'contracts')
  const [filter, setFilter] = useState<string>('all')

  const filtered = filter === 'all' ? (contracts || []) : (contracts || []).filter(c => c.status === filter)

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {['all', 'active', 'completed', 'cancelled'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}>
            {f === 'all' ? 'Semua' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <button onClick={refresh} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 ml-auto">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto max-h-[70vh] overflow-y-auto custom-scrollbar">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
              <tr>{['User', 'Saham', 'Modal', 'Profit/Hari', 'Durasi', 'Hari Ke-', 'Diklaim', 'Status', 'Tanggal'].map(h => <th key={h} className="text-left p-2.5 text-gray-500 font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="p-2.5"><p className="font-semibold text-gray-800 dark:text-gray-200">{c.user?.name}</p><p className="text-gray-400 text-[10px]">{c.user?.phone}</p></td>
                  <td className="p-2.5 font-mono font-bold text-gray-800 dark:text-gray-200">{c.stockCode}</td>
                  <td className="p-2.5 font-bold text-gray-800 dark:text-gray-200">Rp {fmt(c.amount)}</td>
                  <td className="p-2.5 text-green-600 font-medium">Rp {fmt(c.dailyProfitAmount)}</td>
                  <td className="p-2.5 text-gray-600 dark:text-gray-400">{c.duration} hari</td>
                  <td className="p-2.5 text-gray-600 dark:text-gray-400">{c.daysElapsed}/{c.duration}</td>
                  <td className="p-2.5 text-gray-600 dark:text-gray-400">Rp {fmt(c.totalClaimed)}</td>
                  <td className="p-2.5"><span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${statusBadge(c.status)}`}>{c.status}</span></td>
                  <td className="p-2.5 text-gray-400">{fmtDate(c.createdAt)}</td>
                </tr>
              ))}
              {(!contracts || contracts.length === 0) && !loading && <tr><td colSpan={9} className="p-8 text-center text-gray-400">Tidak ada data kontrak</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════ STOCKS ═══════════════════ */
function StocksSection({ adminId, api, showToast, uploadFile }: { adminId: string; api: any; showToast: any; uploadFile: (f: File) => Promise<string | null> }) {
  const { data: stocks, loading, refresh } = useAdminFetch<any[]>('/api/admin/stocks', adminId, api, 'stocks')
  const [showForm, setShowForm] = useState(false)
  const [editStock, setEditStock] = useState<any>(null)
  const [form, setForm] = useState({ code: '', name: '', price: '', category: 'bluechip', sector: '', description: '' })
  const [logoFile, setLogoFile] = useState<File | null>(null)

  const resetForm = () => { setForm({ code: '', name: '', price: '', category: 'bluechip', sector: '', description: '' }); setLogoFile(null); setEditStock(null); setShowForm(false) }

  const handleCreate = async () => {
    let logo: string | undefined
    if (logoFile) { const url = await uploadFile(logoFile); if (!url) return; logo = url }
    const d = await api('/api/admin/stocks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adminId, ...form, price: Number(form.price), logo }) })
    if (d?.stock) { showToast('Stock ditambahkan'); resetForm(); refresh() } else showToast('Gagal tambah stock', 'err')
  }

  const handleUpdate = async () => {
    let logo: string | undefined
    if (logoFile) { const url = await uploadFile(logoFile); if (!url) return; logo = url }
    const d = await api(`/api/admin/stocks/${editStock.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adminId, name: form.name, price: Number(form.price), category: form.category, sector: form.sector, description: form.description, logo }) })
    if (d?.stock) { showToast('Stock diupdate'); resetForm(); refresh() } else showToast('Gagal update', 'err')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus stock ini?')) return
    const d = await api(`/api/admin/stocks/${id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adminId }) })
    if (d?.success) { showToast('Stock dihapus'); refresh() } else showToast('Gagal hapus', 'err')
  }

  const startEdit = (s: any) => {
    setForm({ code: s.code, name: s.name, price: String(s.price), category: s.category, sector: s.sector || '', description: s.description || '' })
    setEditStock(s); setShowForm(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={refresh} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /></button>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 flex items-center gap-1.5"><Plus size={12} /> Tambah Stock</button>
      </div>
      {showForm && (
        <div className="mb-4 bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
          <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200 mb-3">{editStock ? 'Edit Stock' : 'Tambah Stock'}</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="Code (e.g. BBCA)" disabled={!!editStock} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:border-blue-400 disabled:opacity-50" />
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Name" className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:border-blue-400" />
            <input value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="Price" type="number" className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:border-blue-400" />
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:border-blue-400">
              <option value="bluechip">Bluechip</option><option value="midcap">Midcap</option><option value="smallcap">Smallcap</option><option value="crypto">Crypto</option><option value="forex">Forex</option>
            </select>
            <input value={form.sector} onChange={e => setForm({ ...form, sector: e.target.value })} placeholder="Sector" className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:border-blue-400" />
            <input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files?.[0] || null)} className="text-xs file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:bg-blue-50 file:text-blue-600" />
          </div>
          <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" className="mt-3 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:border-blue-400" />
          <div className="flex gap-2 mt-3">
            <button onClick={resetForm} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs text-gray-600">Batal</button>
            <button onClick={editStock ? handleUpdate : handleCreate} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 flex items-center gap-1"><Save size={12} /> {editStock ? 'Update' : 'Simpan'}</button>
          </div>
        </div>
      )}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto max-h-[60vh] overflow-y-auto custom-scrollbar">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
              <tr>{['Logo', 'Code', 'Name', 'Price', 'Change', 'Category', 'Sector', 'Aksi'].map(h => <th key={h} className="text-left p-2.5 text-gray-500 font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {(stocks || []).map(s => (
                <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="p-2.5">{s.logo ? <img src={s.logo} alt="" className="w-7 h-7 rounded-lg object-cover" /> : <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[8px] font-bold text-gray-400">{s.code.slice(0,2)}</div>}</td>
                  <td className="p-2.5 font-mono font-bold text-gray-800 dark:text-gray-200">{s.code}</td>
                  <td className="p-2.5 text-gray-800 dark:text-gray-200">{s.name}</td>
                  <td className="p-2.5 text-gray-800 dark:text-gray-200">Rp {fmt(s.price)}</td>
                  <td className={`p-2.5 font-bold ${s.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>{s.changePercent >= 0 ? '+' : ''}{s.changePercent?.toFixed(2)}%</td>
                  <td className="p-2.5"><span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{s.category}</span></td>
                  <td className="p-2.5 text-gray-400">{s.sector || '-'}</td>
                  <td className="p-2.5">
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(s)} className="p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-600"><Edit3 size={12} /></button>
                      <button onClick={() => handleDelete(s.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════ INVESTMENTS ═══════════════════ */
function InvestmentsSection({ adminId, api, showToast }: { adminId: string; api: any; showToast: any }) {
  const { data: items, loading, refresh } = useAdminFetch<any[]>('/api/admin/investments', adminId, api, 'investments')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm] = useState({ name: '', category: 'potential', modal: '', dailyProfit: '', duration: '', order: '0', isActive: true })

  const resetForm = () => { setForm({ name: '', category: 'potential', modal: '', dailyProfit: '', duration: '', order: '0', isActive: true }); setEditItem(null); setShowForm(false) }

  const handleCreate = async () => {
    const d = await api('/api/admin/investments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adminId, ...form, modal: Number(form.modal), dailyProfit: Number(form.dailyProfit), duration: Number(form.duration), order: Number(form.order) }) })
    if (d?.investment) { showToast('Produk ditambahkan'); resetForm(); refresh() } else showToast('Gagal tambah', 'err')
  }

  const handleUpdate = async () => {
    const d = await api(`/api/admin/investments/${editItem.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adminId, name: form.name, category: form.category, modal: Number(form.modal), dailyProfit: Number(form.dailyProfit), duration: Number(form.duration), order: Number(form.order), isActive: form.isActive }) })
    if (d?.investment) { showToast('Produk diupdate'); resetForm(); refresh() } else showToast('Gagal update', 'err')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus produk ini?')) return
    const d = await api(`/api/admin/investments/${id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adminId }) })
    if (d?.success) { showToast('Produk dihapus'); refresh() }
  }

  const toggleActive = async (item: any) => {
    const d = await api(`/api/admin/investments/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adminId, isActive: !item.isActive }) })
    if (d?.investment) { showToast(item.isActive ? 'Dinonaktifkan' : 'Diaktifkan'); refresh() }
  }

  const startEdit = (s: any) => {
    setForm({ name: s.name, category: s.category, modal: String(s.modal), dailyProfit: String(s.dailyProfit), duration: String(s.duration), order: String(s.order), isActive: s.isActive })
    setEditItem(s); setShowForm(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={refresh} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /></button>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 flex items-center gap-1.5"><Plus size={12} /> Tambah Produk</button>
      </div>
      {showForm && (
        <div className="mb-4 bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
          <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200 mb-3">{editItem ? 'Edit Produk' : 'Tambah Produk'}</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nama produk" className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:border-blue-400" />
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:border-blue-400"><option value="potential">Potential</option><option value="dividen">Dividen</option></select>
            <input value={form.modal} onChange={e => setForm({ ...form, modal: e.target.value })} placeholder="Modal (IDR)" type="number" className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:border-blue-400" />
            <input value={form.dailyProfit} onChange={e => setForm({ ...form, dailyProfit: e.target.value })} placeholder="Profit Harian" type="number" className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:border-blue-400" />
            <input value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} placeholder="Durasi (hari)" type="number" className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:border-blue-400" />
            <input value={form.order} onChange={e => setForm({ ...form, order: e.target.value })} placeholder="Urutan" type="number" className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:border-blue-400" />
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={resetForm} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs text-gray-600">Batal</button>
            <button onClick={editItem ? handleUpdate : handleCreate} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 flex items-center gap-1"><Save size={12} /> {editItem ? 'Update' : 'Simpan'}</button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {(items || []).map(item => (
          <div key={item.id} className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${item.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-gray-100 text-gray-500'}`}>{item.isActive ? 'Active' : 'Inactive'}</span>
              <div className="flex gap-1">
                <button onClick={() => toggleActive(item)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">{item.isActive ? <EyeOff size={12} /> : <Eye size={12} />}</button>
                <button onClick={() => startEdit(item)} className="p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-600"><Edit3 size={12} /></button>
                <button onClick={() => handleDelete(item.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600"><Trash2 size={12} /></button>
              </div>
            </div>
            <h5 className="font-bold text-sm text-gray-800 dark:text-gray-200">{item.name}</h5>
            <p className="text-[10px] text-gray-500 mb-2">{item.category}</p>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <div><span className="text-gray-400 text-[10px]">Modal</span><p className="font-bold text-gray-800 dark:text-gray-200">Rp {fmt(item.modal)}</p></div>
              <div><span className="text-gray-400 text-[10px]">Profit/Hari</span><p className="font-bold text-green-600">Rp {fmt(item.dailyProfit)}</p></div>
              <div><span className="text-gray-400 text-[10px]">Durasi</span><p className="font-bold text-gray-800 dark:text-gray-200">{item.duration} hari</p></div>
              <div><span className="text-gray-400 text-[10px]">ROI</span><p className="font-bold text-blue-600">{item.roi?.toFixed(1)}%</p></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════ NEWS ═══════════════════ */
function NewsSection({ adminId, api, showToast, uploadFile }: { adminId: string; api: any; showToast: any; uploadFile: (f: File) => Promise<string | null> }) {
  const { data: news, loading, refresh } = useAdminFetch<any[]>('/api/admin/news', adminId, api, 'news')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm] = useState({ title: '', content: '', category: 'market' })
  const [imgFile, setImgFile] = useState<File | null>(null)

  const resetForm = () => { setForm({ title: '', content: '', category: 'market' }); setImgFile(null); setEditItem(null); setShowForm(false) }

  const handleCreate = async () => {
    let imageUrl: string | undefined
    if (imgFile) { const url = await uploadFile(imgFile); if (!url) return; imageUrl = url }
    const d = await api('/api/admin/news', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adminId, ...form, imageUrl }) })
    if (d?.news) { showToast('News ditambahkan'); resetForm(); refresh() } else showToast('Gagal tambah', 'err')
  }

  const handleUpdate = async () => {
    let imageUrl: string | undefined
    if (imgFile) { const url = await uploadFile(imgFile); if (!url) return; imageUrl = url }
    const d = await api(`/api/admin/news/${editItem.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adminId, ...form, imageUrl }) })
    if (d?.news) { showToast('News diupdate'); resetForm(); refresh() } else showToast('Gagal update', 'err')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus news ini?')) return
    const d = await api(`/api/admin/news/${id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adminId }) })
    if (d?.success) { showToast('News dihapus'); refresh() }
  }

  const startEdit = (n: any) => { setForm({ title: n.title, content: n.content, category: n.category }); setEditItem(n); setShowForm(true) }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={refresh} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /></button>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 flex items-center gap-1.5"><Plus size={12} /> Tambah News</button>
      </div>
      {showForm && (
        <div className="mb-4 bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
          <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200 mb-3">{editItem ? 'Edit News' : 'Tambah News'}</h4>
          <div className="space-y-3">
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Judul" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:border-blue-400" />
            <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Konten" rows={3} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:border-blue-400 resize-none" />
            <div className="flex gap-3">
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:border-blue-400">
                <option value="market">Market</option><option value="company">Company</option><option value="system">System</option><option value="education">Education</option>
              </select>
              <input type="file" accept="image/*" onChange={e => setImgFile(e.target.files?.[0] || null)} className="text-xs file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:bg-blue-50 file:text-blue-600" />
            </div>
            <div className="flex gap-2">
              <button onClick={resetForm} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs text-gray-600">Batal</button>
              <button onClick={editItem ? handleUpdate : handleCreate} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 flex items-center gap-1"><Save size={12} /> {editItem ? 'Update' : 'Simpan'}</button>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {(news || []).map(n => (
          <div key={n.id} className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800 flex gap-3">
            {n.imageUrl && <img src={n.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{n.category}</span>
                {n.isPublished && <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">Published</span>}
              </div>
              <h5 className="font-bold text-sm text-gray-800 dark:text-gray-200 truncate">{n.title}</h5>
              <p className="text-[11px] text-gray-500 line-clamp-1">{n.content}</p>
              <p className="text-[10px] text-gray-400 mt-1">{fmtDate(n.createdAt)}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => startEdit(n)} className="p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-600"><Edit3 size={12} /></button>
              <button onClick={() => handleDelete(n.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600"><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════ PROMOS ═══════════════════ */
function PromosSection({ adminId, api, showToast }: { adminId: string; api: any; showToast: any }) {
  const { data: promos, loading, refresh } = useAdminFetch<any[]>('/api/admin/promos', adminId, api, 'promos')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm] = useState({ title: '', description: '', type: 'welcome_bonus', value: '', endDate: '' })

  const resetForm = () => { setForm({ title: '', description: '', type: 'welcome_bonus', value: '', endDate: '' }); setEditItem(null); setShowForm(false) }

  const handleCreate = async () => {
    const d = await api('/api/admin/promos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adminId, ...form, value: Number(form.value), endDate: form.endDate || null }) })
    if (d?.promo) { showToast('Promo ditambahkan'); resetForm(); refresh() } else showToast('Gagal tambah', 'err')
  }

  const handleUpdate = async () => {
    const d = await api(`/api/admin/promos/${editItem.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adminId, ...form, value: Number(form.value) }) })
    if (d?.promo) { showToast('Promo diupdate'); resetForm(); refresh() } else showToast('Gagal update', 'err')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus promo ini?')) return
    const d = await api(`/api/admin/promos/${id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adminId }) })
    if (d?.success) { showToast('Promo dihapus'); refresh() }
  }

  const toggleActive = async (p: any) => {
    const d = await api(`/api/admin/promos/${p.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adminId, isActive: !p.isActive }) })
    if (d?.promo) { showToast(p.isActive ? 'Promo dinonaktifkan' : 'Promo diaktifkan'); refresh() }
  }

  const startEdit = (p: any) => {
    setForm({ title: p.title, description: p.description, type: p.type, value: String(p.value), endDate: p.endDate ? new Date(p.endDate).toISOString().slice(0, 10) : '' })
    setEditItem(p); setShowForm(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={refresh} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /></button>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 flex items-center gap-1.5"><Plus size={12} /> Tambah Promo</button>
      </div>
      {showForm && (
        <div className="mb-4 bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
          <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200 mb-3">{editItem ? 'Edit Promo' : 'Tambah Promo'}</h4>
          <div className="grid grid-cols-2 gap-3">
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Judul" className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:border-blue-400" />
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:border-blue-400">
              <option value="welcome_bonus">Welcome Bonus</option><option value="deposit_bonus">Deposit Bonus</option><option value="referral_program">Referral Program</option><option value="trading_competition">Trading Competition</option>
            </select>
            <input value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} placeholder="Value" type="number" className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:border-blue-400" />
            <input value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} type="date" className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:border-blue-400" />
          </div>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Deskripsi" rows={2} className="mt-3 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:border-blue-400 resize-none" />
          <div className="flex gap-2 mt-3">
            <button onClick={resetForm} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs text-gray-600">Batal</button>
            <button onClick={editItem ? handleUpdate : handleCreate} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 flex items-center gap-1"><Save size={12} /> {editItem ? 'Update' : 'Simpan'}</button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {(promos || []).map(p => (
          <div key={p.id} className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${p.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-gray-100 text-gray-500'}`}>{p.isActive ? 'Active' : 'Inactive'}</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">{p.type}</span>
                </div>
                <h5 className="font-bold text-sm text-gray-800 dark:text-gray-200">{p.title}</h5>
                <p className="text-[11px] text-gray-500 mt-0.5">{p.description}</p>
                <div className="flex gap-3 mt-1 text-[10px] text-gray-400"><span>Value: Rp {fmt(p.value)}</span>{p.endDate && <span>s/d {new Date(p.endDate).toLocaleDateString('id-ID')}</span>}</div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => toggleActive(p)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">{p.isActive ? <EyeOff size={12} /> : <Eye size={12} />}</button>
                <button onClick={() => startEdit(p)} className="p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-600"><Edit3 size={12} /></button>
                <button onClick={() => handleDelete(p.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600"><Trash2 size={12} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════ BANNERS ═══════════════════ */
function BannersSection({ adminId, api, showToast, uploadFile }: { adminId: string; api: any; showToast: any; uploadFile: (f: File) => Promise<string | null> }) {
  const { data: banners, loading, refresh } = useAdminFetch<any[]>('/api/admin/banners', adminId, api, 'banners')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm] = useState({ title: '', link: '', order: '0', isActive: true })
  const [imgFile, setImgFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const resetForm = () => { setForm({ title: '', link: '', order: '0', isActive: true }); setImgFile(null); setPreview(null); setEditItem(null); setShowForm(false) }

  const handleCreate = async () => {
    if (!imgFile && !editItem) { showToast('Upload gambar dulu', 'err'); return }
    let imageUrl = editItem?.imageUrl
    if (imgFile) { const url = await uploadFile(imgFile); if (!url) return; imageUrl = url }
    const d = await api('/api/admin/banners', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adminId, title: form.title, imageUrl, link: form.link, order: Number(form.order), isActive: form.isActive }) })
    if (d?.banner) { showToast('Banner ditambahkan'); resetForm(); refresh() } else showToast('Gagal tambah', 'err')
  }

  const handleUpdate = async () => {
    let imageUrl: string | undefined
    if (imgFile) { const url = await uploadFile(imgFile); if (!url) return; imageUrl = url }
    const d = await api(`/api/admin/banners/${editItem.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adminId, title: form.title, imageUrl, link: form.link, order: Number(form.order), isActive: form.isActive }) })
    if (d?.banner) { showToast('Banner diupdate'); resetForm(); refresh() } else showToast('Gagal update', 'err')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus banner ini?')) return
    const d = await api(`/api/admin/banners/${id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adminId }) })
    if (d?.success) { showToast('Banner dihapus'); refresh() }
  }

  const toggleActive = async (b: any) => {
    const d = await api(`/api/admin/banners/${b.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adminId, isActive: !b.isActive }) })
    if (d?.banner) { showToast(b.isActive ? 'Banner dinonaktifkan' : 'Banner diaktifkan'); refresh() }
  }

  const startEdit = (b: any) => { setForm({ title: b.title, link: b.link || '', order: String(b.order), isActive: b.isActive }); setPreview(b.imageUrl); setEditItem(b); setShowForm(true) }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={refresh} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /></button>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 flex items-center gap-1.5"><Plus size={12} /> Tambah Banner</button>
      </div>
      {showForm && (
        <div className="mb-4 bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
          <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200 mb-3">{editItem ? 'Edit Banner' : 'Tambah Banner'}</h4>
          <div className="grid grid-cols-2 gap-3">
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Judul banner" className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:border-blue-400" />
            <input value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} placeholder="Link (opsional)" className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:border-blue-400" />
            <input value={form.order} onChange={e => setForm({ ...form, order: e.target.value })} placeholder="Urutan" type="number" className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:border-blue-400" />
            <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; setImgFile(f || null); if (f) setPreview(URL.createObjectURL(f)) }} className="text-xs file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:bg-blue-50 file:text-blue-600" />
          </div>
          {preview && <img src={preview} alt="Preview" className="mt-3 h-24 rounded-lg object-cover border border-gray-200 dark:border-gray-700" />}
          <div className="flex gap-2 mt-3">
            <button onClick={resetForm} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs text-gray-600">Batal</button>
            <button onClick={editItem ? handleUpdate : handleCreate} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 flex items-center gap-1"><Save size={12} /> {editItem ? 'Update' : 'Simpan'}</button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {(banners || []).map(b => (
          <div key={b.id} className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
            <div className="relative aspect-[16/9] bg-gray-100 dark:bg-gray-800">
              <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
              <div className="absolute top-1.5 right-1.5 flex gap-1">
                <button onClick={() => toggleActive(b)} className={`p-1 rounded ${b.isActive ? 'bg-green-600 text-white' : 'bg-gray-500 text-white'}`}>{b.isActive ? <Eye size={10} /> : <EyeOff size={10} />}</button>
                <button onClick={() => startEdit(b)} className="p-1 rounded bg-blue-600 text-white"><Edit3 size={10} /></button>
                <button onClick={() => handleDelete(b.id)} className="p-1 rounded bg-red-600 text-white"><Trash2 size={10} /></button>
              </div>
            </div>
            <div className="p-2.5">
              <h5 className="font-bold text-xs text-gray-800 dark:text-gray-200">{b.title}</h5>
              {b.link && <p className="text-[10px] text-blue-500 truncate">{b.link}</p>}
              <p className="text-[10px] text-gray-400 mt-0.5">Order: {b.order}</p>
            </div>
          </div>
        ))}
        {(!banners || banners.length === 0) && !loading && <div className="col-span-full text-center py-8 text-gray-400 text-sm">Belum ada banner</div>}
      </div>
    </div>
  )
}

/* ═══════════════════ NOTIFICATIONS ═══════════════════ */
function NotificationsSection({ adminId, api, showToast }: { adminId: string; api: any; showToast: any }) {
  const { data: notifications, loading, refresh } = useAdminFetch<any[]>('/api/admin/notifications', adminId, api, 'notifications')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', message: '', type: 'system', targetUserId: '' })

  const handleBroadcast = async () => {
    const d = await api('/api/admin/notifications', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, title: form.title, message: form.message, type: form.type, targetUserId: form.targetUserId || undefined })
    })
    if (d?.count !== undefined) { showToast(`Notifikasi dikirim ke ${d.count} user`); setForm({ title: '', message: '', type: 'system', targetUserId: '' }); setShowForm(false); refresh() }
    else showToast('Gagal kirim', 'err')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={refresh} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /></button>
        <button onClick={() => setShowForm(true)} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 flex items-center gap-1.5"><Megaphone size={12} /> Kirim Notifikasi</button>
      </div>
      {showForm && (
        <div className="mb-4 bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
          <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200 mb-3">Kirim Notifikasi</h4>
          <div className="space-y-3">
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Judul notifikasi" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:border-blue-400" />
            <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Isi pesan" rows={3} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:border-blue-400 resize-none" />
            <div className="grid grid-cols-2 gap-3">
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:border-blue-400">
                <option value="system">System</option><option value="info">Info</option><option value="alert">Alert</option><option value="trade">Trade</option><option value="deposit">Deposit</option>
              </select>
              <input value={form.targetUserId} onChange={e => setForm({ ...form, targetUserId: e.target.value })} placeholder="User ID (kosongkan = semua)" className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:border-blue-400" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs text-gray-600">Batal</button>
              <button onClick={handleBroadcast} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 flex items-center gap-1"><Send size={12} /> Kirim</button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto max-h-[60vh] overflow-y-auto custom-scrollbar">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
              <tr>{['User', 'Judul', 'Pesan', 'Tipe', 'Dibaca', 'Tanggal'].map(h => <th key={h} className="text-left p-2.5 text-gray-500 font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {(notifications || []).slice(0, 100).map(n => (
                <tr key={n.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="p-2.5 text-gray-800 dark:text-gray-200">{n.user?.name}</td>
                  <td className="p-2.5 font-semibold text-gray-800 dark:text-gray-200 max-w-[150px] truncate">{n.title}</td>
                  <td className="p-2.5 text-gray-500 max-w-[200px] truncate">{n.message}</td>
                  <td className="p-2.5"><span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-600">{n.type}</span></td>
                  <td className="p-2.5">{n.isRead ? <Check size={12} className="text-green-600" /> : <X size={12} className="text-red-500" />}</td>
                  <td className="p-2.5 text-gray-400">{fmtDate(n.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════ QRIS PAYMENT ═══════════════════ */
function QrisSection({ adminId, api, showToast, uploadFile }: { adminId: string; api: any; showToast: any; uploadFile: (f: File) => Promise<string | null> }) {
  const [qrisImage, setQrisImage] = useState<string | null>(null)
  const [qrisFile, setQrisFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const loadQris = useRef(false)
  useEffect(() => {
    if (loadQris.current) return
    loadQris.current = true
    api(`/api/admin/settings?userId=${adminId}`).then(d => {
      if (d?.settings) {
        const map: Record<string, string> = {}
        d.settings.forEach((s: any) => { map[s.key] = s.value })
        if (map.qris_image) setQrisImage(map.qris_image)
      }
      setLoading(false)
    })
  }, [adminId, api])

  const fetchQris = useCallback(async () => {
    setLoading(true)
    const d = await api(`/api/admin/settings?userId=${adminId}`)
    if (d?.settings) {
      const map: Record<string, string> = {}
      d.settings.forEach((s: any) => { map[s.key] = s.value })
      if (map.qris_image) setQrisImage(map.qris_image)
    }
    setLoading(false)
  }, [adminId, api])

  const handleUpload = async () => {
    if (!qrisFile) { showToast('Pilih file QRIS dulu', 'err'); return }
    setUploading(true)
    const url = await uploadFile(qrisFile)
    if (!url) { setUploading(false); return }
    await api('/api/admin/settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, key: 'qris_image', value: url })
    })
    setQrisImage(url)
    setQrisFile(null)
    setUploading(false)
    showToast('QRIS image berhasil diupload!')
  }

  const handleDelete = async () => {
    if (!confirm('Hapus gambar QRIS? User tidak akan melihat QR code saat deposit.')) return
    await api('/api/admin/settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, key: 'qris_image', value: '' })
    })
    setQrisImage(null)
    showToast('QRIS image dihapus')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">QRIS Payment</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">Upload gambar QRIS yang akan ditampilkan saat user deposit. Deposit hanya via QRIS.</p>
        </div>
        <button onClick={fetchQris} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
        <div className="flex flex-col items-center">
          {/* Current QRIS Image Preview */}
          {loading ? (
            <div className="w-56 h-56 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse mb-4" />
          ) : qrisImage ? (
            <div className="mb-4">
              <div className="w-56 h-56 rounded-2xl bg-white border-2 border-gray-200 dark:border-gray-700 p-3 shadow-lg mb-3">
                <img src={qrisImage} alt="QRIS Payment" className="w-full h-full object-contain rounded-lg" />
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="px-2 py-1 rounded-full text-[9px] font-bold bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">Active</span>
                <span className="text-[10px] text-gray-500">Gambar ini ditampilkan ke user saat deposit</span>
              </div>
            </div>
          ) : (
            <div className="mb-4 w-56 h-56 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center gap-2">
              <QrCode size={48} className="text-gray-300 dark:text-gray-600" />
              <span className="text-[10px] font-bold text-gray-400">Belum ada gambar QRIS</span>
              <span className="text-[8px] text-gray-400 text-center px-4">Upload gambar QRIS agar user bisa scan saat deposit</span>
            </div>
          )}

          {/* Upload Area */}
          <div className="w-full max-w-sm mt-2">
            <label className="block mb-2 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Upload Gambar QRIS Baru</label>
            <div className="flex items-center gap-2">
              <input type="file" accept="image/*" onChange={e => setQrisFile(e.target.files?.[0] || null)}
                className="flex-1 text-xs file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-blue-50 file:text-blue-600 file:cursor-pointer" />
              <button onClick={handleUpload} disabled={!qrisFile || uploading}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 disabled:opacity-50 flex items-center gap-1.5 shrink-0">
                {uploading ? <RefreshCw size={12} className="animate-spin" /> : <Upload size={12} />}
                Upload
              </button>
            </div>
            {qrisFile && (
              <p className="text-[9px] text-gray-500 mt-1.5 text-center">File: {qrisFile.name} ({(qrisFile.size / 1024).toFixed(1)} KB)</p>
            )}
          </div>

          {/* Delete Button */}
          {qrisImage && (
            <button onClick={handleDelete}
              className="mt-4 px-4 py-2 rounded-lg border border-red-200 dark:border-red-900/30 text-red-600 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-1.5">
              <Trash2 size={12} /> Hapus Gambar QRIS
            </button>
          )}
        </div>
      </div>

      {/* QRIS Info Card */}
      <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-4 border border-blue-100 dark:border-blue-900/30">
        <div className="flex items-start gap-3">
          <QrCode size={20} className="text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm text-blue-800 dark:text-blue-300">Panduan QRIS</h4>
            <ul className="mt-1.5 space-y-1 text-[11px] text-blue-700 dark:text-blue-400">
              <li>- Upload gambar QR code yang akan ditampilkan ke user saat deposit</li>
              <li>- User scan QRIS menggunakan e-wallet atau mobile banking</li>
              <li>- Setelah user transfer, deposit akan muncul di halaman Deposit untuk di-approve</li>
              <li>- Deposit hanya melalui QRIS, metode lain tidak tersedia</li>
              <li>- Gambar harus format PNG/JPG dengan resolusi minimal 200x200px</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════ SETTINGS ═══════════════════ */
function SettingsSection({ adminId, api, showToast, uploadFile }: { adminId: string; api: any; showToast: any; uploadFile: (f: File) => Promise<string | null> }) {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [refreshing, setRefreshing] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [qrisFile, setQrisFile] = useState<File | null>(null)
  const [qrisPreview, setQrisPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [appInput, setAppInput] = useState('ZEVORIK')
  const [minDepInput, setMinDepInput] = useState('50000')
  const [minWithInput, setMinWithInput] = useState('100000')
  const [waInput, setWaInput] = useState('')
  const [maintenanceInput, setMaintenanceInput] = useState('false')
  const [winRateInput, setWinRateInput] = useState('42')
  const [upPayoutMin, setUpPayoutMin] = useState('72')
  const [upPayoutMax, setUpPayoutMax] = useState('93')
  const [downPayoutMin, setDownPayoutMin] = useState('45')
  const [downPayoutMax, setDownPayoutMax] = useState('69')
  const [inputsInitialized, setInputsInitialized] = useState(false)

  useEffect(() => {
    api(`/api/admin/settings?userId=${adminId}`).then(d => {
      if (d?.settings) {
        const map: Record<string, string> = {}
        d.settings.forEach((s: { key: string; value: string }) => { map[s.key] = s.value })
        setSettings(map)
        if (map.qris_image) setQrisPreview(map.qris_image)
        if (map.app_logo) setLogoPreview(map.app_logo)
        if (!inputsInitialized) {
          setAppInput(map.app_name || 'ZEVORIK')
          setMinDepInput(map.min_deposit || '50000')
          setMinWithInput(map.min_withdraw || '100000')
          setWaInput(map.wa_number || '')
          setMaintenanceInput(map.maintenance || 'false')
          setWinRateInput(map.win_rate || '42')
          setUpPayoutMin(map.up_payout_min || '72')
          setUpPayoutMax(map.up_payout_max || '93')
          setDownPayoutMin(map.down_payout_min || '45')
          setDownPayoutMax(map.down_payout_max || '69')
          setInputsInitialized(true)
        }
      }
      setRefreshing(false)
      setLoaded(true)
    })
  }, [adminId, api])

  const refresh = () => {
    setRefreshing(true)
    setInputsInitialized(false)
    api(`/api/admin/settings?userId=${adminId}`).then(d => {
      if (d?.settings) {
        const map: Record<string, string> = {}
        d.settings.forEach((s: { key: string; value: string }) => { map[s.key] = s.value })
        setSettings(map)
        if (map.qris_image) setQrisPreview(map.qris_image)
        if (map.app_logo) setLogoPreview(map.app_logo)
        setAppInput(map.app_name || 'ZEVORIK')
        setMinDepInput(map.min_deposit || '50000')
        setMinWithInput(map.min_withdraw || '100000')
        setWaInput(map.wa_number || '')
        setMaintenanceInput(map.maintenance || 'false')
        setWinRateInput(map.win_rate || '42')
        setUpPayoutMin(map.up_payout_min || '72')
        setUpPayoutMax(map.up_payout_max || '93')
        setDownPayoutMin(map.down_payout_min || '45')
        setDownPayoutMax(map.down_payout_max || '69')
      }
      setRefreshing(false)
    })
  }

  const saveSetting = async (key: string, value: string) => {
    const d = await api('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adminId, key, value }) })
    if (d?.setting) { showToast(`${key} disimpan`); refresh() } else showToast('Gagal simpan', 'err')
  }

  const handleQrisUpload = async () => {
    if (!qrisFile) { showToast('Pilih file QRIS dulu', 'err'); return }
    const url = await uploadFile(qrisFile)
    if (!url) return
    await saveSetting('qris_image', url)
    setQrisFile(null)
  }

  const handleLogoUpload = async () => {
    if (!logoFile) { showToast('Pilih file logo dulu', 'err'); return }
    const url = await uploadFile(logoFile)
    if (!url) return
    await saveSetting('app_logo', url)
    setLogoFile(null)
  }

  const loading = !loaded || refreshing

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Settings</h3>
        <button onClick={refresh} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /></button>
      </div>

      {/* QRIS */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 mb-3"><QrCode size={16} className="text-blue-600" /><h4 className="font-bold text-sm text-gray-800 dark:text-gray-200">QRIS Payment Image</h4></div>
        <p className="text-[11px] text-gray-500 mb-3">Upload gambar QRIS yang ditampilkan saat user deposit. Deposit hanya via QRIS.</p>
        <div className="flex items-start gap-4">
          {qrisPreview && <img src={qrisPreview} alt="QRIS" className="w-36 h-36 rounded-xl object-contain border border-gray-200 dark:border-gray-700 bg-white shrink-0" />}
          <div className="flex-1 space-y-2">
            <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; setQrisFile(f || null); if (f) setQrisPreview(URL.createObjectURL(f)) }} className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:bg-blue-50 file:text-blue-600 w-full" />
            <button onClick={handleQrisUpload} disabled={!qrisFile} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 disabled:opacity-50 flex items-center gap-1"><Upload size={12} /> Upload QRIS</button>
          </div>
        </div>
      </div>

      {/* Logo */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 mb-3"><Palette size={16} className="text-blue-600" /><h4 className="font-bold text-sm text-gray-800 dark:text-gray-200">Logo Aplikasi</h4></div>
        <div className="flex items-start gap-4">
          {logoPreview && <img src={logoPreview} alt="Logo" className="w-16 h-16 rounded-xl object-contain border border-gray-200 dark:border-gray-700 bg-white shrink-0" />}
          <div className="flex-1 space-y-2">
            <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; setLogoFile(f || null); if (f) setLogoPreview(URL.createObjectURL(f)) }} className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:bg-blue-50 file:text-blue-600 w-full" />
            <button onClick={handleLogoUpload} disabled={!logoFile} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 disabled:opacity-50 flex items-center gap-1"><Upload size={12} /> Upload Logo</button>
          </div>
        </div>
      </div>

      {/* App Name */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
        <div className="flex gap-2 items-end">
          <div className="flex-1"><label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Nama Aplikasi</label><input value={appInput} onChange={e => setAppInput(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:border-blue-400" /></div>
          <button onClick={() => saveSetting('app_name', appInput)} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 flex items-center gap-1 shrink-0"><Save size={12} /> Simpan</button>
        </div>
      </div>

      {/* Min Deposit/Withdraw */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1"><label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Minimum Deposit (IDR)</label><input value={minDepInput} onChange={e => setMinDepInput(e.target.value)} type="number" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:border-blue-400" /></div>
            <button onClick={() => saveSetting('min_deposit', minDepInput)} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 flex items-center gap-1 shrink-0"><Save size={12} /> Simpan</button>
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1"><label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Minimum Withdraw (IDR)</label><input value={minWithInput} onChange={e => setMinWithInput(e.target.value)} type="number" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:border-blue-400" /></div>
            <button onClick={() => saveSetting('min_withdraw', minWithInput)} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 flex items-center gap-1 shrink-0"><Save size={12} /> Simpan</button>
          </div>
        </div>
      </div>

      {/* WA Number */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
        <div className="flex gap-2 items-end">
          <div className="flex-1"><label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Nomor WhatsApp CS</label><input value={waInput} onChange={e => setWaInput(e.target.value)} placeholder="6281234567890" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:border-blue-400" /></div>
          <button onClick={() => saveSetting('wa_number', waInput)} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 flex items-center gap-1 shrink-0"><Save size={12} /> Simpan</button>
        </div>
      </div>

      {/* Trading Settings */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 mb-3"><Activity size={16} className="text-blue-600" /><h4 className="font-bold text-sm text-gray-800 dark:text-gray-200">Pengaturan Trading</h4></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1"><label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Win Rate (%)</label><input value={winRateInput} onChange={e => setWinRateInput(e.target.value)} type="number" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:border-blue-400" /></div>
            <button onClick={() => saveSetting('win_rate', winRateInput)} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 flex items-center gap-1 shrink-0"><Save size={12} /> Simpan</button>
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1"><label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Maintenance Mode</label><input value={maintenanceInput} onChange={e => setMaintenanceInput(e.target.value)} placeholder="true/false" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:border-blue-400" /></div>
            <button onClick={() => saveSetting('maintenance', maintenanceInput)} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 flex items-center gap-1 shrink-0"><Save size={12} /> Simpan</button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1"><label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">UP Payout Min (%)</label><input value={upPayoutMin} onChange={e => setUpPayoutMin(e.target.value)} type="number" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:border-blue-400" /></div>
            <button onClick={() => saveSetting('up_payout_min', upPayoutMin)} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 flex items-center gap-1 shrink-0"><Save size={12} /> Simpan</button>
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1"><label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">UP Payout Max (%)</label><input value={upPayoutMax} onChange={e => setUpPayoutMax(e.target.value)} type="number" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:border-blue-400" /></div>
            <button onClick={() => saveSetting('up_payout_max', upPayoutMax)} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 flex items-center gap-1 shrink-0"><Save size={12} /> Simpan</button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1"><label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">DOWN Payout Min (%)</label><input value={downPayoutMin} onChange={e => setDownPayoutMin(e.target.value)} type="number" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:border-blue-400" /></div>
            <button onClick={() => saveSetting('down_payout_min', downPayoutMin)} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 flex items-center gap-1 shrink-0"><Save size={12} /> Simpan</button>
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1"><label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">DOWN Payout Max (%)</label><input value={downPayoutMax} onChange={e => setDownPayoutMax(e.target.value)} type="number" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:border-blue-400" /></div>
            <button onClick={() => saveSetting('down_payout_max', downPayoutMax)} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 flex items-center gap-1 shrink-0"><Save size={12} /> Simpan</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── helper icon for notifications ── */
function Send({ size = 12, className = '' }: { size?: number; className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
}
