'use client'

import { useAuthStore } from '@/lib/store'
import { motion } from 'framer-motion'
import {
  User, Briefcase, Wallet, History, Settings, Shield, HelpCircle,
  CheckCircle, LogOut, ChevronRight,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { formatRupiah } from '@/lib/trading-utils'
import { useDashboardStore } from '@/lib/dashboard-store'

export function ProfileTab() {
  const { user, logout } = useAuthStore()
  const store = useDashboardStore()
  const {
    profileEdit, profileForm,
    setProfileEdit, setProfileForm, setShowKycModal, setShowHelpModal, setActiveTab,
    handleProfileSave, fetchKycStatus,
  } = store

  return (
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
  )
}
