'use client'

import { useRef } from 'react'
import { useAuthStore } from '@/lib/store'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Minus, X, RefreshCw, CheckCircle, ArrowUpRight, ArrowDownRight,
  Shield, Copy, Check, Wallet, CreditCard, Clock, Info, ChevronRight,
  Building2, Gem, Download, ArrowRight, AlertCircle, Mail
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { formatRupiah, formatNumber, formatDateTime, type DepositItem, type WithdrawalItem } from '@/lib/trading-utils'
import { useDashboardStore } from '@/lib/dashboard-store'

export function FinanceTab() {
  const { user } = useAuthStore()
  const store = useDashboardStore()
  const {
    financeTab, depositAmount, depositLoading, depositStep, depositCategory, qrisImageUrl,
    withdrawAmount, withdrawLoading, withdrawCategory, withdrawBankMethod, withdrawEwalletMethod,
    withdrawCryptoMethod, withdrawAccountNumber, withdrawAccountHolder,
    withdrawOtpSent, withdrawOtpCode, withdrawOtpVerified, withdrawOtpLoading, withdrawOtpTimer,
    deposits, withdrawals, showBalance,
    setFinanceTab, setDepositAmount, setDepositLoading, setDepositStep, setDepositCategory,
    setWithdrawAmount, setWithdrawLoading, setWithdrawCategory, setWithdrawBankMethod,
    setWithdrawEwalletMethod, setWithdrawCryptoMethod, setWithdrawAccountNumber,
    setWithdrawAccountHolder, setWithdrawOtpSent, setWithdrawOtpCode, setWithdrawOtpVerified,
    setWithdrawOtpLoading, setWithdrawOtpTimer,
    handleDeposit, handleSendWithdrawOtp, handleVerifyWithdrawOtp, handleWithdraw,
  } = store

  const withdrawOtpRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newOtp = [...withdrawOtpCode]
    newOtp[index] = value
    setWithdrawOtpCode(newOtp)
    if (value && index < 5) {
      withdrawOtpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !withdrawOtpCode[index] && index > 0) {
      withdrawOtpRefs.current[index - 1]?.focus()
    }
  }


  return (
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

  )

}
