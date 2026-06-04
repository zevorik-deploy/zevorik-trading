'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  LayoutDashboard, Users, ArrowDownToLine, ArrowUpFromLine, TrendingUp,
  Newspaper, Gift, Image, Settings, LogOut, Search, RefreshCw,
  Check, X, Plus, Trash2, Edit3, Save, Upload, Eye, EyeOff, Menu,
  DollarSign, BarChart3, Clock, AlertCircle, CheckCircle2, Shield, QrCode
} from 'lucide-react'

/* ── types ── */
interface AdminUser { id: string; name: string; phone: string; role: string }
interface Stats {
  totalUsers: number; totalBalance: number; totalDeposits: number; totalWithdrawals: number;
  activeInvestments: number; platformRevenue: number; pendingDeposits: number; pendingWithdrawals: number;
  totalNews: number; activePromos: number; totalStocks: number;
}

type Section = 'dashboard' | 'users' | 'deposits' | 'withdrawals' | 'stocks' | 'investments' | 'news' | 'promos' | 'banners' | 'settings'

const SECTIONS: { key: Section; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { key: 'users', label: 'Users', icon: <Users size={18} /> },
  { key: 'deposits', label: 'Deposits', icon: <ArrowDownToLine size={18} /> },
  { key: 'withdrawals', label: 'Withdrawals', icon: <ArrowUpFromLine size={18} /> },
  { key: 'stocks', label: 'Stocks', icon: <TrendingUp size={18} /> },
  { key: 'investments', label: 'Investments', icon: <BarChart3 size={18} /> },
  { key: 'news', label: 'News', icon: <Newspaper size={18} /> },
  { key: 'promos', label: 'Promos', icon: <Gift size={18} /> },
  { key: 'banners', label: 'Banners', icon: <Image size={18} alt="" /> },
  { key: 'settings', label: 'Settings', icon: <Settings size={18} /> },
]

function fmt(n: number) {
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
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    active: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    won: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    lost: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300',
  }
  return m[s] || 'bg-gray-100 text-gray-800'
}

export default function AdminDashboard() {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [section, setSection] = useState<Section>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loginPhone, setLoginPhone] = useState('')
  const [loginPass, setLoginPass] = useState('')
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

  /* ── LOGIN SCREEN ── */
  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4">
              <Shield className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-white">ZEVORIX</h1>
            <p className="text-blue-300 mt-1">Admin Panel</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
            {loginErr && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-300 text-sm flex items-center gap-2">
                <AlertCircle size={16} /> {loginErr}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="text-sm text-blue-200 mb-1 block">Nomor HP</label>
                <input type="text" value={loginPhone} onChange={e => setLoginPhone(e.target.value)}
                  placeholder="080000000000"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400" />
              </div>
              <div>
                <label className="text-sm text-blue-200 mb-1 block">Password</label>
                <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)}
                  placeholder="admin123"
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400" />
              </div>
              <button onClick={handleLogin} disabled={loading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <RefreshCw size={18} className="animate-spin" /> : <LogOut size={18} className="rotate-180" />}
                Masuk
              </button>
            </div>
            <p className="text-center text-white/30 text-xs mt-6">Default: 080000000000 / admin123</p>
          </div>
        </div>
      </div>
    )
  }

  /* ── MAIN DASHBOARD ── */
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

      <aside className={`${sidebarOpen ? 'w-60' : 'w-16'} transition-all duration-300 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col shrink-0`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
          {sidebarOpen && <span className="text-xl font-bold text-blue-600">ZEVORIX</span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
            <Menu size={18} />
          </button>
        </div>
        <nav className="flex-1 py-2 overflow-y-auto">
          {SECTIONS.map(s => (
            <button key={s.key} onClick={() => setSection(s.key)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition ${
                section === s.key
                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}>
              {s.icon}
              {sidebarOpen && <span>{s.label}</span>}
            </button>
          ))}
        </nav>
        <div className="border-t border-gray-200 dark:border-gray-800 p-3">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition">
            <LogOut size={18} />
            {sidebarOpen && <span>Keluar</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 capitalize">{section}</h2>
          <span className="text-sm text-gray-500">Admin: {admin.name}</span>
        </header>
        <div className="p-6">
          {section === 'dashboard' && <DashboardSection adminId={admin.id} api={api} />}
          {section === 'users' && <UsersSection adminId={admin.id} api={api} showToast={showToast} />}
          {section === 'deposits' && <DepositsSection adminId={admin.id} api={api} showToast={showToast} />}
          {section === 'withdrawals' && <WithdrawalsSection adminId={admin.id} api={api} showToast={showToast} />}
          {section === 'stocks' && <StocksSection adminId={admin.id} api={api} showToast={showToast} uploadFile={uploadFile} />}
          {section === 'investments' && <InvestmentsSection adminId={admin.id} api={api} showToast={showToast} />}
          {section === 'news' && <NewsSection adminId={admin.id} api={api} showToast={showToast} uploadFile={uploadFile} />}
          {section === 'promos' && <PromosSection adminId={admin.id} api={api} showToast={showToast} />}
          {section === 'banners' && <BannersSection adminId={admin.id} api={api} showToast={showToast} uploadFile={uploadFile} />}
          {section === 'settings' && <SettingsSection adminId={admin.id} api={api} showToast={showToast} uploadFile={uploadFile} />}
        </div>
      </main>
    </div>
  )
}

/* ── reusable fetch hook that avoids synchronous setState in effect ── */
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
  const { data: stats, loading, refresh } = useAdminFetch<Stats>('/api/admin/dashboard', adminId, api, 'stats')

  const cards = stats ? [
    { label: 'Total Users', value: fmt(stats.totalUsers), icon: <Users size={20} />, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' },
    { label: 'Total Balance', value: 'Rp ' + fmt(stats.totalBalance), icon: <DollarSign size={20} />, color: 'text-green-600 bg-green-50 dark:bg-green-950/40' },
    { label: 'Total Deposits', value: 'Rp ' + fmt(stats.totalDeposits), icon: <ArrowDownToLine size={20} />, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
    { label: 'Total Withdrawals', value: 'Rp ' + fmt(stats.totalWithdrawals), icon: <ArrowUpFromLine size={20} />, color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/40' },
    { label: 'Platform Revenue', value: 'Rp ' + fmt(stats.platformRevenue), icon: <BarChart3 size={20} />, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40' },
    { label: 'Active Investments', value: fmt(stats.activeInvestments), icon: <TrendingUp size={20} />, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40' },
    { label: 'Pending Deposits', value: fmt(stats.pendingDeposits), icon: <Clock size={20} />, color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/40' },
    { label: 'Pending Withdrawals', value: fmt(stats.pendingWithdrawals), icon: <AlertCircle size={20} />, color: 'text-red-600 bg-red-50 dark:bg-red-950/40' },
    { label: 'Total Stocks', value: fmt(stats.totalStocks), icon: <TrendingUp size={20} />, color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40' },
    { label: 'Total News', value: fmt(stats.totalNews), icon: <Newspaper size={20} />, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40' },
    { label: 'Active Promos', value: fmt(stats.activePromos), icon: <Gift size={20} />, color: 'text-pink-600 bg-pink-50 dark:bg-pink-950/40' },
  ] : []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Overview</h3>
        <button onClick={refresh} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        )) : cards.map((c, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.color}`}>{c.icon}</div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{c.label}</p>
                <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{c.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════ USERS ═══════════════════ */
function UsersSection({ adminId, api, showToast }: { adminId: string; api: any; showToast: any }) {
  const { data: users, setData: setUsers, loading, refresh } = useAdminFetch<any[]>('/api/admin/users', adminId, api, 'users')
  const [search, setSearch] = useState('')
  const [editUser, setEditUser] = useState<any>(null)
  const [balAdj, setBalAdj] = useState('')

  const doSearch = () => {
    api(`/api/admin/users?userId=${adminId}${search ? `&search=${search}` : ''}`).then(d => {
      if (d?.users) setUsers(d.users)
    })
  }

  const handleEdit = async () => {
    if (!editUser) return
    const body: Record<string, unknown> = { adminId }
    if (balAdj) body.balanceAdjust = Number(balAdj)
    const d = await api(`/api/admin/users/${editUser.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    })
    if (d?.user) { showToast('User updated'); setEditUser(null); setBalAdj(''); refresh() }
    else showToast('Gagal update', 'err')
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()}
            placeholder="Cari nama/HP/email..." className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-400" />
        </div>
        <button onClick={refresh} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
              <tr>
                <th className="text-left p-3 text-gray-500 font-medium">Nama</th>
                <th className="text-left p-3 text-gray-500 font-medium">HP</th>
                <th className="text-left p-3 text-gray-500 font-medium">Balance</th>
                <th className="text-left p-3 text-gray-500 font-medium">Role</th>
                <th className="text-left p-3 text-gray-500 font-medium">VIP</th>
                <th className="text-left p-3 text-gray-500 font-medium">KYC</th>
                <th className="text-left p-3 text-gray-500 font-medium">Deposit</th>
                <th className="text-left p-3 text-gray-500 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {(users || []).map(u => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="p-3 font-medium text-gray-800 dark:text-gray-200">{u.name}</td>
                  <td className="p-3 text-gray-600 dark:text-gray-400">{u.phone}</td>
                  <td className="p-3 text-gray-800 dark:text-gray-200">Rp {fmt(u.balance)}</td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(u.role === 'admin' ? 'active' : 'pending')}`}>{u.role}</span></td>
                  <td className="p-3 text-xs text-gray-600 dark:text-gray-400">{u.vipLevel}</td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(u.kycStatus)}`}>{u.kycStatus}</span></td>
                  <td className="p-3 text-gray-600 dark:text-gray-400">Rp {fmt(u.totalDeposit)}</td>
                  <td className="p-3">
                    <button onClick={() => { setEditUser(u); setBalAdj('') }}
                      className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-600"><Edit3 size={14} /></button>
                  </td>
                </tr>
              ))}
              {(!users || users.length === 0) && !loading && (
                <tr><td colSpan={8} className="p-8 text-center text-gray-400">Tidak ada data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {editUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditUser(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-200">Edit User: {editUser.name}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Saldo saat ini: Rp {fmt(editUser.balance)}</label>
                <input value={balAdj} onChange={e => setBalAdj(e.target.value)} type="number" placeholder="Tambah/kurangi saldo (+/-)"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-400" />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setEditUser(null)} className="flex-1 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600">Batal</button>
              <button onClick={handleEdit} className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500">Simpan</button>
            </div>
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
      <div className="flex items-center gap-4 mb-4">
        <div className="flex gap-2">
          {['all', 'pending', 'completed', 'rejected'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}>
              {f === 'all' ? `Semua (${(deposits || []).length})` : f === 'pending' ? `Pending (${pending.length})` : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button onClick={refresh} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 ml-auto">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {pending.length > 0 && (
        <div className="mb-6 bg-yellow-50 dark:bg-yellow-950/30 rounded-xl p-4 border border-yellow-200 dark:border-yellow-900">
          <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-3 flex items-center gap-2">
            <Clock size={16} /> Deposit Menunggu ({pending.length})
          </h4>
          <div className="space-y-3">
            {pending.map(d => (
              <div key={d.id} className="bg-white dark:bg-gray-900 rounded-lg p-4 flex items-center justify-between border border-yellow-100 dark:border-gray-800">
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{d.user?.name} <span className="text-gray-400 text-xs">({d.user?.phone})</span></p>
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-200">Rp {fmt(d.amount)}</p>
                  <p className="text-xs text-gray-500">{fmtDate(d.createdAt)} - {d.method}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAction(d.id, 'completed')}
                    className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-500 flex items-center gap-1">
                    <Check size={14} /> Setujui
                  </button>
                  <button onClick={() => handleAction(d.id, 'rejected')}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-500 flex items-center gap-1">
                    <X size={14} /> Tolak
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
              <tr>
                <th className="text-left p-3 text-gray-500 font-medium">User</th>
                <th className="text-left p-3 text-gray-500 font-medium">Jumlah</th>
                <th className="text-left p-3 text-gray-500 font-medium">Metode</th>
                <th className="text-left p-3 text-gray-500 font-medium">Status</th>
                <th className="text-left p-3 text-gray-500 font-medium">Tanggal</th>
                <th className="text-left p-3 text-gray-500 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map(d => (
                <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="p-3 text-gray-800 dark:text-gray-200">{d.user?.name}<br /><span className="text-xs text-gray-400">{d.user?.phone}</span></td>
                  <td className="p-3 font-semibold text-gray-800 dark:text-gray-200">Rp {fmt(d.amount)}</td>
                  <td className="p-3 text-gray-600 dark:text-gray-400">{d.method}</td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(d.status)}`}>{d.status}</span></td>
                  <td className="p-3 text-gray-500 text-xs">{fmtDate(d.createdAt)}</td>
                  <td className="p-3">
                    {d.status === 'pending' && (
                      <div className="flex gap-1">
                        <button onClick={() => handleAction(d.id, 'completed')} className="p-1.5 rounded-lg bg-green-50 dark:bg-green-950/30 text-green-600 hover:bg-green-100"><Check size={14} /></button>
                        <button onClick={() => handleAction(d.id, 'rejected')} className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 hover:bg-red-100"><X size={14} /></button>
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
      <div className="flex items-center gap-4 mb-4">
        <div className="flex gap-2">
          {['all', 'pending', 'completed', 'rejected'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}>
              {f === 'all' ? 'Semua' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button onClick={refresh} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 ml-auto">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
              <tr>
                <th className="text-left p-3 text-gray-500 font-medium">User</th>
                <th className="text-left p-3 text-gray-500 font-medium">Jumlah</th>
                <th className="text-left p-3 text-gray-500 font-medium">Bank</th>
                <th className="text-left p-3 text-gray-500 font-medium">Rekening</th>
                <th className="text-left p-3 text-gray-500 font-medium">Status</th>
                <th className="text-left p-3 text-gray-500 font-medium">Tanggal</th>
                <th className="text-left p-3 text-gray-500 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map(w => (
                <tr key={w.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="p-3 text-gray-800 dark:text-gray-200">{w.user?.name}<br /><span className="text-xs text-gray-400">{w.user?.phone}</span></td>
                  <td className="p-3 font-semibold text-gray-800 dark:text-gray-200">Rp {fmt(w.amount)}</td>
                  <td className="p-3 text-gray-600 dark:text-gray-400">{w.bankName || '-'}</td>
                  <td className="p-3 text-gray-600 dark:text-gray-400">{w.bankAccount || '-'}<br />{w.bankHolder || ''}</td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(w.status)}`}>{w.status}</span></td>
                  <td className="p-3 text-gray-500 text-xs">{fmtDate(w.createdAt)}</td>
                  <td className="p-3">
                    {w.status === 'pending' && (
                      <div className="flex gap-1">
                        <button onClick={() => handleAction(w.id, 'completed')} className="p-1.5 rounded-lg bg-green-50 dark:bg-green-950/30 text-green-600 hover:bg-green-100"><Check size={14} /></button>
                        <button onClick={() => handleAction(w.id, 'rejected')} className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 hover:bg-red-100"><X size={14} /></button>
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

/* ═══════════════════ STOCKS ═══════════════════ */
function StocksSection({ adminId, api, showToast, uploadFile }: { adminId: string; api: any; showToast: any; uploadFile: (f: File) => Promise<string | null> }) {
  const { data: stocks, loading, refresh } = useAdminFetch<any[]>('/api/admin/stocks', adminId, api, 'stocks')
  const [showForm, setShowForm] = useState(false)
  const [editStock, setEditStock] = useState<any>(null)
  const [form, setForm] = useState({ code: '', name: '', price: '', category: 'bluechip', sector: '', description: '' })
  const [logoFile, setLogoFile] = useState<File | null>(null)

  const resetForm = () => {
    setForm({ code: '', name: '', price: '', category: 'bluechip', sector: '', description: '' })
    setLogoFile(null); setEditStock(null); setShowForm(false)
  }

  const handleCreate = async () => {
    let logo: string | undefined
    if (logoFile) { const url = await uploadFile(logoFile); if (!url) return; logo = url }
    const d = await api('/api/admin/stocks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, ...form, price: Number(form.price), logo })
    })
    if (d?.stock) { showToast('Stock ditambahkan'); resetForm(); refresh() }
    else showToast('Gagal tambah stock', 'err')
  }

  const handleUpdate = async () => {
    let logo: string | undefined
    if (logoFile) { const url = await uploadFile(logoFile); if (!url) return; logo = url }
    const d = await api(`/api/admin/stocks/${editStock.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, name: form.name, price: Number(form.price), category: form.category, sector: form.sector, description: form.description, logo })
    })
    if (d?.stock) { showToast('Stock diupdate'); resetForm(); refresh() }
    else showToast('Gagal update', 'err')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus stock ini?')) return
    const d = await api(`/api/admin/stocks/${id}`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId })
    })
    if (d?.success) { showToast('Stock dihapus'); refresh() }
    else showToast('Gagal hapus', 'err')
  }

  const startEdit = (s: any) => {
    setForm({ code: s.code, name: s.name, price: String(s.price), category: s.category, sector: s.sector || '', description: s.description || '' })
    setEditStock(s); setShowForm(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={refresh} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 flex items-center gap-2">
          <Plus size={14} /> Tambah Stock
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-100 dark:border-gray-800">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">{editStock ? 'Edit Stock' : 'Tambah Stock'}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="Code (e.g. BBCA)" disabled={!!editStock}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-400 disabled:opacity-50" />
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Name"
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-400" />
            <input value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="Price" type="number"
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-400" />
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-400">
              <option value="bluechip">Bluechip</option>
              <option value="midcap">Midcap</option>
              <option value="smallcap">Smallcap</option>
              <option value="crypto">Crypto</option>
              <option value="forex">Forex</option>
            </select>
            <input value={form.sector} onChange={e => setForm({ ...form, sector: e.target.value })} placeholder="Sector"
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-400" />
            <div className="flex items-center gap-2">
              <input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files?.[0] || null)}
                className="text-sm file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-blue-50 file:text-blue-600" />
            </div>
          </div>
          <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description"
            className="mt-4 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-400" />
          <div className="flex gap-2 mt-4">
            <button onClick={resetForm} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600">Batal</button>
            <button onClick={editStock ? handleUpdate : handleCreate}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 flex items-center gap-2">
              <Save size={14} /> {editStock ? 'Update' : 'Simpan'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
              <tr>
                <th className="text-left p-3 text-gray-500 font-medium">Code</th>
                <th className="text-left p-3 text-gray-500 font-medium">Name</th>
                <th className="text-left p-3 text-gray-500 font-medium">Price</th>
                <th className="text-left p-3 text-gray-500 font-medium">Change</th>
                <th className="text-left p-3 text-gray-500 font-medium">Category</th>
                <th className="text-left p-3 text-gray-500 font-medium">Sector</th>
                <th className="text-left p-3 text-gray-500 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {(stocks || []).map(s => (
                <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="p-3 font-mono font-semibold text-gray-800 dark:text-gray-200">{s.code}</td>
                  <td className="p-3 text-gray-800 dark:text-gray-200">{s.name}</td>
                  <td className="p-3 text-gray-800 dark:text-gray-200">Rp {fmt(s.price)}</td>
                  <td className={`p-3 text-sm font-medium ${s.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {s.changePercent >= 0 ? '+' : ''}{s.changePercent.toFixed(2)}%
                  </td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{s.category}</span></td>
                  <td className="p-3 text-gray-500 text-xs">{s.sector || '-'}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(s)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-600"><Edit3 size={14} /></button>
                      <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600"><Trash2 size={14} /></button>
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

  const resetForm = () => {
    setForm({ name: '', category: 'potential', modal: '', dailyProfit: '', duration: '', order: '0', isActive: true })
    setEditItem(null); setShowForm(false)
  }

  const handleCreate = async () => {
    const d = await api('/api/admin/investments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, ...form, modal: Number(form.modal), dailyProfit: Number(form.dailyProfit), duration: Number(form.duration), order: Number(form.order) })
    })
    if (d?.investment) { showToast('Produk investasi ditambahkan'); resetForm(); refresh() }
    else showToast('Gagal tambah', 'err')
  }

  const handleUpdate = async () => {
    const d = await api(`/api/admin/investments/${editItem.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, name: form.name, category: form.category, modal: Number(form.modal), dailyProfit: Number(form.dailyProfit), duration: Number(form.duration), order: Number(form.order), isActive: form.isActive })
    })
    if (d?.investment) { showToast('Produk diupdate'); resetForm(); refresh() }
    else showToast('Gagal update', 'err')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus produk ini?')) return
    const d = await api(`/api/admin/investments/${id}`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId })
    })
    if (d?.success) { showToast('Produk dihapus'); refresh() }
    else showToast('Gagal hapus', 'err')
  }

  const toggleActive = async (item: any) => {
    const d = await api(`/api/admin/investments/${item.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, isActive: !item.isActive })
    })
    if (d?.investment) { showToast(item.isActive ? 'Dinonaktifkan' : 'Diaktifkan'); refresh() }
  }

  const startEdit = (s: any) => {
    setForm({ name: s.name, category: s.category, modal: String(s.modal), dailyProfit: String(s.dailyProfit), duration: String(s.duration), order: String(s.order), isActive: s.isActive })
    setEditItem(s); setShowForm(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={refresh} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 flex items-center gap-2">
          <Plus size={14} /> Tambah Produk
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-100 dark:border-gray-800">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">{editItem ? 'Edit Produk' : 'Tambah Produk'}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nama produk"
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-400" />
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-400">
              <option value="potential">Potential</option>
              <option value="dividen">Dividen</option>
            </select>
            <input value={form.modal} onChange={e => setForm({ ...form, modal: e.target.value })} placeholder="Modal (IDR)" type="number"
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-400" />
            <input value={form.dailyProfit} onChange={e => setForm({ ...form, dailyProfit: e.target.value })} placeholder="Profit Harian (IDR)" type="number"
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-400" />
            <input value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} placeholder="Durasi (hari)" type="number"
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-400" />
            <input value={form.order} onChange={e => setForm({ ...form, order: e.target.value })} placeholder="Urutan" type="number"
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-400" />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={resetForm} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600">Batal</button>
            <button onClick={editItem ? handleUpdate : handleCreate}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 flex items-center gap-2">
              <Save size={14} /> {editItem ? 'Update' : 'Simpan'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(items || []).map(item => (
          <div key={item.id} className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-gray-100 text-gray-500'}`}>
                {item.isActive ? 'Active' : 'Inactive'}
              </span>
              <div className="flex gap-1">
                <button onClick={() => toggleActive(item)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
                  {item.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button onClick={() => startEdit(item)} className="p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-600"><Edit3 size={14} /></button>
                <button onClick={() => handleDelete(item.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600"><Trash2 size={14} /></button>
              </div>
            </div>
            <h5 className="font-semibold text-gray-800 dark:text-gray-200">{item.name}</h5>
            <p className="text-xs text-gray-500 mb-3">{item.category}</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-400 text-xs">Modal</span><p className="font-medium text-gray-800 dark:text-gray-200">Rp {fmt(item.modal)}</p></div>
              <div><span className="text-gray-400 text-xs">Profit/Hari</span><p className="font-medium text-green-600">Rp {fmt(item.dailyProfit)}</p></div>
              <div><span className="text-gray-400 text-xs">Durasi</span><p className="font-medium text-gray-800 dark:text-gray-200">{item.duration} hari</p></div>
              <div><span className="text-gray-400 text-xs">ROI</span><p className="font-medium text-blue-600">{item.roi.toFixed(1)}%</p></div>
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
    const d = await api('/api/admin/news', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, ...form, imageUrl })
    })
    if (d?.news) { showToast('News ditambahkan'); resetForm(); refresh() }
    else showToast('Gagal tambah', 'err')
  }

  const handleUpdate = async () => {
    let imageUrl: string | undefined
    if (imgFile) { const url = await uploadFile(imgFile); if (!url) return; imageUrl = url }
    const d = await api(`/api/admin/news/${editItem.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, ...form, imageUrl })
    })
    if (d?.news) { showToast('News diupdate'); resetForm(); refresh() }
    else showToast('Gagal update', 'err')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus news ini?')) return
    const d = await api(`/api/admin/news/${id}`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId })
    })
    if (d?.success) { showToast('News dihapus'); refresh() }
  }

  const startEdit = (n: any) => {
    setForm({ title: n.title, content: n.content, category: n.category })
    setEditItem(n); setShowForm(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={refresh} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 flex items-center gap-2">
          <Plus size={14} /> Tambah News
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-100 dark:border-gray-800">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">{editItem ? 'Edit News' : 'Tambah News'}</h4>
          <div className="space-y-4">
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Judul"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-400" />
            <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Konten" rows={4}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-400 resize-none" />
            <div className="flex gap-4">
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-400">
                <option value="market">Market</option>
                <option value="company">Company</option>
                <option value="system">System</option>
                <option value="education">Education</option>
              </select>
              <input type="file" accept="image/*" onChange={e => setImgFile(e.target.files?.[0] || null)}
                className="text-sm file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-blue-50 file:text-blue-600" />
            </div>
            <div className="flex gap-2">
              <button onClick={resetForm} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600">Batal</button>
              <button onClick={editItem ? handleUpdate : handleCreate}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 flex items-center gap-2">
                <Save size={14} /> {editItem ? 'Update' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {(news || []).map(n => (
          <div key={n.id} className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800 flex gap-4">
            {n.imageUrl && <img src={n.imageUrl} alt="" className="w-20 h-20 rounded-lg object-cover shrink-0" />}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{n.category}</span>
                {n.isPublished && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">Published</span>}
              </div>
              <h5 className="font-semibold text-gray-800 dark:text-gray-200 truncate">{n.title}</h5>
              <p className="text-sm text-gray-500 line-clamp-2 mt-1">{n.content}</p>
              <p className="text-xs text-gray-400 mt-2">{fmtDate(n.createdAt)}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => startEdit(n)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-600"><Edit3 size={14} /></button>
              <button onClick={() => handleDelete(n.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600"><Trash2 size={14} /></button>
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
    const d = await api('/api/admin/promos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, ...form, value: Number(form.value), endDate: form.endDate || null })
    })
    if (d?.promo) { showToast('Promo ditambahkan'); resetForm(); refresh() }
    else showToast('Gagal tambah', 'err')
  }

  const handleUpdate = async () => {
    const d = await api(`/api/admin/promos/${editItem.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, ...form, value: Number(form.value) })
    })
    if (d?.promo) { showToast('Promo diupdate'); resetForm(); refresh() }
    else showToast('Gagal update', 'err')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus promo ini?')) return
    const d = await api(`/api/admin/promos/${id}`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId })
    })
    if (d?.success) { showToast('Promo dihapus'); refresh() }
  }

  const toggleActive = async (p: any) => {
    const d = await api(`/api/admin/promos/${p.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, isActive: !p.isActive })
    })
    if (d?.promo) { showToast(p.isActive ? 'Promo dinonaktifkan' : 'Promo diaktifkan'); refresh() }
  }

  const startEdit = (p: any) => {
    setForm({ title: p.title, description: p.description, type: p.type, value: String(p.value), endDate: p.endDate ? new Date(p.endDate).toISOString().slice(0, 10) : '' })
    setEditItem(p); setShowForm(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={refresh} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 flex items-center gap-2">
          <Plus size={14} /> Tambah Promo
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-100 dark:border-gray-800">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">{editItem ? 'Edit Promo' : 'Tambah Promo'}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Judul"
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-400" />
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-400">
              <option value="welcome_bonus">Welcome Bonus</option>
              <option value="deposit_bonus">Deposit Bonus</option>
              <option value="referral_program">Referral Program</option>
              <option value="trading_competition">Trading Competition</option>
            </select>
            <input value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} placeholder="Value" type="number"
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-400" />
            <input value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} placeholder="End date" type="date"
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-400" />
          </div>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Deskripsi" rows={3}
            className="mt-4 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-400 resize-none" />
          <div className="flex gap-2 mt-4">
            <button onClick={resetForm} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600">Batal</button>
            <button onClick={editItem ? handleUpdate : handleCreate}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 flex items-center gap-2">
              <Save size={14} /> {editItem ? 'Update' : 'Simpan'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {(promos || []).map(p => (
          <div key={p.id} className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-gray-100 text-gray-500'}`}>
                    {p.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">{p.type}</span>
                </div>
                <h5 className="font-semibold text-gray-800 dark:text-gray-200">{p.title}</h5>
                <p className="text-sm text-gray-500 mt-1">{p.description}</p>
                <div className="flex gap-4 mt-2 text-xs text-gray-400">
                  <span>Value: Rp {fmt(p.value)}</span>
                  {p.endDate && <span>s/d {new Date(p.endDate).toLocaleDateString('id-ID')}</span>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => toggleActive(p)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
                  {p.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button onClick={() => startEdit(p)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-600"><Edit3 size={14} /></button>
                <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600"><Trash2 size={14} /></button>
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
    const d = await api('/api/admin/banners', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, title: form.title, imageUrl, link: form.link, order: Number(form.order), isActive: form.isActive })
    })
    if (d?.banner) { showToast('Banner ditambahkan'); resetForm(); refresh() }
    else showToast('Gagal tambah', 'err')
  }

  const handleUpdate = async () => {
    let imageUrl: string | undefined
    if (imgFile) { const url = await uploadFile(imgFile); if (!url) return; imageUrl = url }
    const d = await api(`/api/admin/banners/${editItem.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, title: form.title, imageUrl, link: form.link, order: Number(form.order), isActive: form.isActive })
    })
    if (d?.banner) { showToast('Banner diupdate'); resetForm(); refresh() }
    else showToast('Gagal update', 'err')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus banner ini?')) return
    const d = await api(`/api/admin/banners/${id}`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId })
    })
    if (d?.success) { showToast('Banner dihapus'); refresh() }
  }

  const toggleActive = async (b: any) => {
    const d = await api(`/api/admin/banners/${b.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, isActive: !b.isActive })
    })
    if (d?.banner) { showToast(b.isActive ? 'Banner dinonaktifkan' : 'Banner diaktifkan'); refresh() }
  }

  const startEdit = (b: any) => {
    setForm({ title: b.title, link: b.link || '', order: String(b.order), isActive: b.isActive })
    setPreview(b.imageUrl); setEditItem(b); setShowForm(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={refresh} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 flex items-center gap-2">
          <Plus size={14} /> Tambah Banner
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-100 dark:border-gray-800">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">{editItem ? 'Edit Banner' : 'Tambah Banner'}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Judul banner"
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-400" />
            <input value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} placeholder="Link (opsional)"
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-400" />
            <input value={form.order} onChange={e => setForm({ ...form, order: e.target.value })} placeholder="Urutan" type="number"
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-400" />
            <div>
              <input type="file" accept="image/*" onChange={e => {
                const f = e.target.files?.[0]
                setImgFile(f || null)
                if (f) setPreview(URL.createObjectURL(f))
              }} className="text-sm file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-blue-50 file:text-blue-600" />
            </div>
          </div>
          {preview && (
            <div className="mt-4">
              <img src={preview} alt="Preview" className="h-32 rounded-lg object-cover border border-gray-200 dark:border-gray-700" />
            </div>
          )}
          <div className="flex gap-2 mt-4">
            <button onClick={resetForm} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600">Batal</button>
            <button onClick={editItem ? handleUpdate : handleCreate}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 flex items-center gap-2">
              <Save size={14} /> {editItem ? 'Update' : 'Simpan'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(banners || []).map(b => (
          <div key={b.id} className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
            <div className="relative aspect-[16/9] bg-gray-100 dark:bg-gray-800">
              <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
              <div className="absolute top-2 right-2 flex gap-1">
                <button onClick={() => toggleActive(b)}
                  className={`p-1.5 rounded-lg ${b.isActive ? 'bg-green-600 text-white' : 'bg-gray-500 text-white'}`}>
                  {b.isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
                <button onClick={() => startEdit(b)} className="p-1.5 rounded-lg bg-blue-600 text-white"><Edit3 size={12} /></button>
                <button onClick={() => handleDelete(b.id)} className="p-1.5 rounded-lg bg-red-600 text-white"><Trash2 size={12} /></button>
              </div>
            </div>
            <div className="p-3">
              <h5 className="font-semibold text-sm text-gray-800 dark:text-gray-200">{b.title}</h5>
              {b.link && <p className="text-xs text-blue-500 truncate mt-0.5">{b.link}</p>}
              <p className="text-xs text-gray-400 mt-1">Order: {b.order}</p>
            </div>
          </div>
        ))}
        {(!banners || banners.length === 0) && !loading && (
          <div className="col-span-full text-center py-12 text-gray-400">Belum ada banner</div>
        )}
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

  const doFetch = useCallback(() => {
    setRefreshing(true)
    api(`/api/admin/settings?userId=${adminId}`).then(d => {
      if (d?.settings) {
        const map: Record<string, string> = {}
        d.settings.forEach((s: { key: string; value: string }) => { map[s.key] = s.value })
        setSettings(map)
        if (map.qris_image) setQrisPreview(map.qris_image)
      }
      setRefreshing(false)
      setLoaded(true)
    })
  }, [adminId, api])

  // Initial load - no synchronous setState
  useEffect(() => {
    api(`/api/admin/settings?userId=${adminId}`).then(d => {
      if (d?.settings) {
        const map: Record<string, string> = {}
        d.settings.forEach((s: { key: string; value: string }) => { map[s.key] = s.value })
        setSettings(map)
        if (map.qris_image) setQrisPreview(map.qris_image)
      }
      setRefreshing(false)
      setLoaded(true)
    })
  }, [adminId, api])

  const refresh = doFetch

  const saveSetting = async (key: string, value: string) => {
    const d = await api('/api/admin/settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, key, value })
    })
    if (d?.setting) { showToast(`${key} disimpan`); refresh() }
    else showToast('Gagal simpan', 'err')
  }

  const handleQrisUpload = async () => {
    if (!qrisFile) { showToast('Pilih file QRIS dulu', 'err'); return }
    const url = await uploadFile(qrisFile)
    if (!url) return
    await saveSetting('qris_image', url)
    setQrisFile(null)
  }

  const loading = !loaded || refreshing

  // Input states initialized from settings
  const [appInput, setAppInput] = useState('')
  const [minDepInput, setMinDepInput] = useState('')
  const [minWithInput, setMinWithInput] = useState('')
  const [waInput, setWaInput] = useState('')
  const [inputsInitialized, setInputsInitialized] = useState(false)

  // Initialize inputs once when settings are loaded
  if (loaded && !inputsInitialized) {
    setAppInput(settings.app_name || 'ZEVORIX')
    setMinDepInput(settings.min_deposit || '50000')
    setMinWithInput(settings.min_withdraw || '100000')
    setWaInput(settings.wa_number || '')
    setInputsInitialized(true)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Settings</h3>
        <button onClick={refresh} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <QrCode size={20} className="text-blue-600" />
          <h4 className="font-semibold text-gray-800 dark:text-gray-200">QRIS Payment Image</h4>
        </div>
        <p className="text-sm text-gray-500 mb-4">Upload gambar QRIS yang akan ditampilkan saat user deposit. Deposit hanya via QRIS.</p>
        {qrisPreview && (
          <div className="mb-4">
            <img src={qrisPreview} alt="QRIS" className="w-48 h-48 rounded-xl object-contain border border-gray-200 dark:border-gray-700 bg-white" />
          </div>
        )}
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <input type="file" accept="image/*" onChange={e => {
              const f = e.target.files?.[0]
              setQrisFile(f || null)
              if (f) setQrisPreview(URL.createObjectURL(f))
            }} className="text-sm file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-blue-50 file:text-blue-600" />
          </div>
          <button onClick={handleQrisUpload} disabled={!qrisFile}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 disabled:opacity-50 flex items-center gap-2">
            <Upload size={14} /> Upload QRIS
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-100 dark:border-gray-800">
        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Nama Aplikasi</h4>
        <div className="flex gap-3">
          <input value={appInput} onChange={e => setAppInput(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-400" />
          <button onClick={() => saveSetting('app_name', appInput)}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 flex items-center gap-2">
            <Save size={14} /> Simpan
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-100 dark:border-gray-800">
        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Minimum Deposit (IDR)</h4>
        <div className="flex gap-3">
          <input value={minDepInput} onChange={e => setMinDepInput(e.target.value)} type="number"
            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-400" />
          <button onClick={() => saveSetting('min_deposit', minDepInput)}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 flex items-center gap-2">
            <Save size={14} /> Simpan
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-100 dark:border-gray-800">
        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Minimum Withdraw (IDR)</h4>
        <div className="flex gap-3">
          <input value={minWithInput} onChange={e => setMinWithInput(e.target.value)} type="number"
            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-400" />
          <button onClick={() => saveSetting('min_withdraw', minWithInput)}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 flex items-center gap-2">
            <Save size={14} /> Simpan
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-100 dark:border-gray-800">
        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Nomor WhatsApp CS</h4>
        <div className="flex gap-3">
          <input value={waInput} onChange={e => setWaInput(e.target.value)} placeholder="6281234567890"
            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-blue-400" />
          <button onClick={() => saveSetting('wa_number', waInput)}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 flex items-center gap-2">
            <Save size={14} /> Simpan
          </button>
        </div>
      </div>
    </div>
  )
}
