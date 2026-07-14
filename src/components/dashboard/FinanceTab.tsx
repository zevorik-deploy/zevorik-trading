'use client'

import { useRef, useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/store'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Minus, X, RefreshCw, CheckCircle, ArrowUpRight, ArrowDownRight,
  Shield, Copy, Check, Wallet, CreditCard, Clock, Info, ChevronRight,
  Building2, Gem, Download, ArrowRight, AlertCircle, Mail,
  Zap, Globe, Lock, Star, Sparkles, QrCode, ScanLine, Timer, ExternalLink,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { formatRupiah, formatNumber, formatDateTime, type DepositItem, type WithdrawalItem } from '@/lib/trading-utils'
import { useDashboardStore } from '@/lib/dashboard-store'

export function FinanceTab() {
  const { user } = useAuthStore()
  const store = useDashboardStore()
  const {
    financeTab, depositAmount, depositLoading, depositStep, depositCategory, qrisImageUrl,
    depositNetwork, depositPaymentInfo, depositCheckLoading, depositRate,
    withdrawAmount, withdrawLoading, withdrawCategory, withdrawBankMethod, withdrawEwalletMethod,
    withdrawCryptoMethod, withdrawAccountNumber, withdrawAccountHolder,
    withdrawOtpSent, withdrawOtpCode, withdrawOtpVerified, withdrawOtpLoading, withdrawOtpTimer,
    deposits, withdrawals, showBalance,
    setFinanceTab, setDepositAmount, setDepositLoading, setDepositStep, setDepositCategory,
    setDepositNetwork, setDepositPaymentInfo, setDepositCheckLoading, setDepositRate,
    setWithdrawAmount, setWithdrawLoading, setWithdrawCategory, setWithdrawBankMethod,
    setWithdrawEwalletMethod, setWithdrawCryptoMethod, setWithdrawAccountNumber,
    setWithdrawAccountHolder, setWithdrawOtpSent, setWithdrawOtpCode, setWithdrawOtpVerified,
    setWithdrawOtpLoading, setWithdrawOtpTimer,
    handleDeposit, handleCryptoDeposit, handleCheckDeposit, handleFetchDepositRate,
    handleSendWithdrawOtp, handleVerifyWithdrawOtp, handleWithdraw,
    setShowKycModal, fetchKycStatus,
  } = store

  const withdrawOtpRefs = useRef<(HTMLInputElement | null)[]>([])
  const [addressCopied, setAddressCopied] = useState(false)
  const [checkPolling, setCheckPolling] = useState(false)

  // Fetch deposit rate on mount
  useEffect(() => {
    handleFetchDepositRate()
  }, [])

  // Auto-polling for deposit check when on crypto step
  useEffect(() => {
    if (depositStep === 'crypto' && checkPolling) {
      const interval = setInterval(() => {
        handleCheckDeposit()
      }, 30000) // Check every 30 seconds
      return () => clearInterval(interval)
    }
  }, [depositStep, checkPolling])

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

  const copyAddress = () => {
    if (depositPaymentInfo?.address) {
      navigator.clipboard.writeText(depositPaymentInfo.address)
      setAddressCopied(true)
      toast({ title: 'Alamat Disalin!', description: 'Alamat deposit telah disalin ke clipboard' })
      setTimeout(() => setAddressCopied(false), 2000)
    }
  }

  const isKycVerified = user?.kycStatus === 'verified'
  const usdtAmount = depositAmount ? (parseFloat(depositAmount) / depositRate).toFixed(2) : '0.00'

  return (
    <motion.div key="finance" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
    <div className="max-w-lg mx-auto">
      {/* Finance Tabs - Premium Style */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => { setFinanceTab('deposit'); setDepositStep('amount') }} className={`flex-1 h-11 rounded-2xl text-[11px] md:text-xs font-black transition-all flex items-center justify-center gap-1.5 ${financeTab === 'deposit' ? 'bg-gradient-to-r from-[#1a3a5c] via-[#2563eb] to-[#3b82f6] text-white shadow-lg shadow-blue-500/25' : 'bg-[var(--zv-panel)] border border-[var(--zv-border)] text-[var(--zv-muted)] hover:border-[#3b82f6]/30 hover:text-[#3b82f6]'}`}>
          <ArrowDownRight className="w-3.5 h-3.5" />Deposit
        </button>
        <button onClick={() => setFinanceTab('withdraw')} className={`flex-1 h-11 rounded-2xl text-[11px] md:text-xs font-black transition-all flex items-center justify-center gap-1.5 ${financeTab === 'withdraw' ? 'bg-gradient-to-r from-[#7c2d12] via-[#d97706] to-[#f59e0b] text-white shadow-lg shadow-amber-500/25' : 'bg-[var(--zv-panel)] border border-[var(--zv-border)] text-[var(--zv-muted)] hover:border-amber-500/30 hover:text-amber-500'}`}>
          <ArrowUpRight className="w-3.5 h-3.5" />Withdraw
        </button>
      </div>

      {/* ===== DEPOSIT SECTION ===== */}
      {financeTab === 'deposit' ? (
        <>
          {/* KYC Verification Gate */}
          {!isKycVerified && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl p-5 bg-gradient-to-br from-[#1a0a2e] via-[#16213e] to-[#0f3460] border border-[#e94560]/20 mb-4 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(233,69,96,0.1),transparent_70%)]" />
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#e94560] to-[#ff6b6b] grid place-items-center mx-auto mb-3 shadow-lg shadow-red-500/30">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-sm font-black text-white mb-1">Verifikasi KYC Diperlukan</h3>
                <p className="text-[10px] text-white/60 mb-4 leading-relaxed">Untuk keamanan akun Anda, verifikasi KYC wajib dilakukan sebelum melakukan deposit. Proses verifikasi cepat dan mudah.</p>
                <button onClick={() => { setShowKycModal(true); fetchKycStatus() }}
                  className="h-11 px-8 rounded-2xl bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-white text-[11px] font-black tracking-wider uppercase flex items-center justify-center gap-2 mx-auto hover:scale-[1.02] transition-transform shadow-lg shadow-red-500/30">
                  <Lock className="w-4 h-4" />Verifikasi Sekarang
                </button>
              </div>
            </motion.div>
          )}

          {/* Balance Card - Premium */}
          <div className="rounded-2xl p-4 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] border border-[#334155] mb-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_100%_0%,rgba(59,130,246,0.15),transparent_70%)]" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-[radial-gradient(circle_at_0%_100%,rgba(245,158,11,0.1),transparent_70%)]" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2563eb] to-[#3b82f6] grid place-items-center shadow-md shadow-blue-500/20">
                    <Wallet className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Total Saldo</span>
                    <b className="block text-xl font-black text-white">{formatRupiah(user?.balance || 0)}</b>
                  </div>
                </div>
                {isKycVerified && (
                  <div className="h-6 px-2 rounded-full bg-green-500/20 border border-green-400/30 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    <span className="text-[7px] font-bold text-green-400">KYC Verified</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 text-[8px] text-white/40 font-bold">
                <span className="flex items-center gap-1"><ArrowDownRight className="w-3 h-3 text-green-400" />Deposit: {formatRupiah(user?.totalDeposit || 0)}</span>
                <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" />Rate: Rp {formatNumber(depositRate)}/USDT</span>
              </div>
            </div>
          </div>

          {isKycVerified && (
            <>
              {/* Deposit Step: Amount Selection */}
              {depositStep === 'amount' && (
                <motion.div key="deposit-amount" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }}>

                  {/* Deposit Method Toggle */}
                  <div className="flex gap-2 mb-3">
                    <button onClick={() => setDepositCategory('crypto')}
                      className={`flex-1 h-11 rounded-2xl text-[10px] font-black flex items-center justify-center gap-1.5 transition-all ${depositCategory === 'crypto' ? 'bg-gradient-to-r from-[#1a3a5c] via-[#2563eb] to-[#3b82f6] text-white shadow-lg shadow-blue-500/20' : 'bg-[var(--zv-panel)] border border-[var(--zv-border)] text-[var(--zv-muted)] hover:border-[#3b82f6]/30'}`}>
                      <Gem className="w-3.5 h-3.5" />Crypto (USDT)
                    </button>
                    <button onClick={() => setDepositCategory('qris')}
                      className={`flex-1 h-11 rounded-2xl text-[10px] font-black flex items-center justify-center gap-1.5 transition-all ${depositCategory === 'qris' ? 'bg-gradient-to-r from-[#1a3a5c] via-[#2563eb] to-[#3b82f6] text-white shadow-lg shadow-blue-500/20' : 'bg-[var(--zv-panel)] border border-[var(--zv-border)] text-[var(--zv-muted)] hover:border-[#3b82f6]/30'}`}>
                      <QrCode className="w-3.5 h-3.5" />QRIS
                    </button>
                  </div>

                  {/* Crypto Network Selection */}
                  {depositCategory === 'crypto' && (
                    <div className="rounded-2xl p-3 bg-[var(--zv-panel)] border border-[var(--zv-border)] mb-3">
                      <span className="block text-[9px] font-black text-[var(--zv-muted)] uppercase tracking-widest mb-2">Pilih Network</span>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { key: 'TRC20' as const, name: 'TRC20', coin: 'TRX', color: '#EF0027', fee: '~1 USDT', speed: '3 min', desc: 'Tron' },
                          { key: 'BEP20' as const, name: 'BEP20', coin: 'BNB', color: '#F3BA2F', fee: '~0.5 USDT', speed: '5 min', desc: 'BSC' },
                          { key: 'ERC20' as const, name: 'ERC20', coin: 'ETH', color: '#627EEA', fee: '~5 USDT', speed: '15 min', desc: 'Ethereum' },
                        ].map(net => (
                          <button key={net.key} onClick={() => setDepositNetwork(net.key)}
                            className={`rounded-xl p-2.5 border-2 transition-all text-center ${depositNetwork === net.key ? 'border-[#3b82f6] bg-[#3b82f6]/10 shadow-sm shadow-blue-500/10' : 'border-[var(--zv-border)] bg-[var(--zv-surface)] hover:border-[#3b82f6]/30'}`}>
                            <div className="w-8 h-8 rounded-full mx-auto mb-1 grid place-items-center" style={{ backgroundColor: net.color + '20' }}>
                              <Globe className="w-4 h-4" style={{ color: net.color }} />
                            </div>
                            <span className={`block text-[10px] font-black ${depositNetwork === net.key ? 'text-[#3b82f6]' : 'text-[var(--zv-text)]'}`}>{net.name}</span>
                            <span className="block text-[7px] text-[var(--zv-muted)]">{net.fee} • {net.speed}</span>
                          </button>
                        ))}
                      </div>
                      {depositNetwork === 'TRC20' && (
                        <div className="mt-2 rounded-lg p-2 bg-green-500/5 border border-green-500/10 flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-green-400" />
                          <span className="text-[8px] font-bold text-green-400">Rekomendasi: Biaya termurah & tercepat</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Amount Input */}
                  <div className="rounded-2xl p-4 bg-[var(--zv-panel)] border border-[var(--zv-border)] mb-3">
                    <label className="block mb-1.5 text-[9px] font-black text-[var(--zv-muted)] uppercase tracking-widest">Jumlah Deposit (IDR)</label>
                    <input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="Minimal Rp 100.000"
                      className="w-full h-12 rounded-2xl bg-[var(--zv-surface)] border border-[var(--zv-border)] px-4 text-[15px] font-black text-[var(--zv-text)] outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all mb-1" />

                    {/* Conversion Preview */}
                    {depositAmount && parseFloat(depositAmount) > 0 && depositCategory === 'crypto' && (
                      <div className="rounded-xl p-2.5 bg-gradient-to-r from-[#2563eb]/10 to-[#3b82f6]/10 border border-[#3b82f6]/20 mb-3 flex items-center justify-between">
                        <div>
                          <span className="text-[8px] font-bold text-[#3b82f6]">Setara dengan</span>
                          <b className="block text-sm font-black text-[#3b82f6]">{usdtAmount} USDT</b>
                        </div>
                        <div className="text-right">
                          <span className="text-[7px] font-bold text-[var(--zv-muted)]">Rate</span>
                          <span className="block text-[9px] font-bold text-[var(--zv-muted)]">Rp {formatNumber(depositRate)}/USDT</span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-4 gap-1.5 mb-3">
                      {['100000', '200000', '500000', '1000000', '2000000', '5000000', '10000000', '50000000'].map(a => (
                        <button key={a} onClick={() => setDepositAmount(a)} className="h-8 rounded-lg bg-[var(--zv-surface)] border border-[var(--zv-border)] text-[8px] md:text-[9px] font-bold text-[#3b82f6] hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-500 hover:text-white hover:border-transparent transition-all">
                          {parseFloat(a) >= 1e6 ? `${(parseFloat(a) / 1e6).toFixed(0)}jt` : `${(parseFloat(a) / 1e3).toFixed(0)}rb`}
                        </button>
                      ))}
                    </div>

                    {/* Submit Button */}
                    <button onClick={handleDeposit} disabled={depositLoading}
                      className="w-full h-12 rounded-2xl text-white text-[11px] font-black tracking-wider uppercase flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-70 shadow-lg shadow-blue-500/20"
                      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 30%, #2563eb 70%, #3b82f6 100%)' }}>
                      {depositLoading ? (
                        <div className="w-5 h-5 rounded-full border-[3px] border-white/30 border-t-white animate-spin" />
                      ) : (
                        <><Zap className="w-4 h-4" />Lanjutkan Deposit</>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Deposit Step: Crypto Payment */}
              {depositStep === 'crypto' && depositPaymentInfo && (
                <motion.div key="deposit-crypto" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                  <div className="rounded-2xl p-5 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] border border-[#334155] mb-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.1),transparent_70%)]" />
                    <div className="relative z-10">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#26A17B] to-[#2DC08D] grid place-items-center shadow-md">
                            <Gem className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <span className="block text-[10px] font-black text-white">Kirim USDT</span>
                            <span className="block text-[8px] text-white/50">via {depositPaymentInfo.network}</span>
                          </div>
                        </div>
                        <div className="h-7 px-2.5 rounded-full bg-amber-500/20 border border-amber-400/30 flex items-center gap-1 animate-pulse">
                          <Timer className="w-3 h-3 text-amber-400" />
                          <span className="text-[8px] font-bold text-amber-400">Menunggu</span>
                        </div>
                      </div>

                      {/* Amount to Send */}
                      <div className="rounded-xl p-4 bg-gradient-to-r from-[#26A17B]/20 to-[#2DC08D]/10 border border-[#26A17B]/30 mb-4 text-center">
                        <span className="text-[9px] font-bold text-[#2DC08D] uppercase tracking-widest">Jumlah yang harus dikirim</span>
                        <b className="block text-3xl font-black text-[#2DC08D] mt-1">{depositPaymentInfo.usdtAmount} USDT</b>
                        <span className="block text-[10px] font-bold text-white/40 mt-1">≈ {formatRupiah(depositPaymentInfo.idrAmount)}</span>
                      </div>

                      {/* Deposit Address */}
                      <div className="rounded-xl p-3 bg-[var(--zv-surface)] border border-[var(--zv-border)] mb-4">
                        <span className="block text-[8px] font-black text-[var(--zv-muted)] uppercase tracking-widest mb-2">Alamat Deposit USDT ({depositPaymentInfo.network})</span>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-[11px] font-bold text-[var(--zv-text)] break-all leading-relaxed select-all">{depositPaymentInfo.address}</code>
                          <button onClick={copyAddress}
                            className="shrink-0 w-10 h-10 rounded-xl bg-[#3b82f6]/10 border border-[#3b82f6]/20 grid place-items-center hover:bg-[#3b82f6]/20 transition-all">
                            {addressCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-[#3b82f6]" />}
                          </button>
                        </div>
                      </div>

                      {/* Important Notes */}
                      <div className="rounded-xl p-3 bg-amber-500/5 border border-amber-500/10 mb-4 space-y-2">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span className="text-[8px] font-bold text-amber-400 leading-relaxed">Hanya kirim USDT melalui network {depositPaymentInfo.network}. Pengiriman melalui network lain dapat menyebabkan kehilangan dana.</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span className="text-[8px] font-bold text-amber-400 leading-relaxed">Minimum konfirmasi: {depositPaymentInfo.minConfirmation} blocks. Deposit akan otomatis dikreditkan setelah dikonfirmasi.</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                          <span className="text-[8px] font-bold text-green-400 leading-relaxed">Deposit otomatis — saldo akan dikreditkan secara otomatis setelah konfirmasi blockchain.</span>
                        </div>
                      </div>

                      {/* Check Deposit Button */}
                      <button onClick={handleCheckDeposit} disabled={depositCheckLoading}
                        className="w-full h-12 rounded-2xl text-white text-[11px] font-black tracking-wider uppercase flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-70 mb-3"
                        style={{ background: 'linear-gradient(135deg, #26A17B 0%, #2DC08D 50%, #4ADE80 100%)' }}>
                        {depositCheckLoading ? (
                          <div className="w-5 h-5 rounded-full border-[3px] border-white/30 border-t-white animate-spin" />
                        ) : (
                          <><RefreshCw className="w-4 h-4" />Cek Status Deposit</>
                        )}
                      </button>

                      {/* Auto-polling toggle */}
                      <button onClick={() => setCheckPolling(!checkPolling)}
                        className={`w-full h-9 rounded-xl text-[9px] font-bold flex items-center justify-center gap-1.5 transition-all ${checkPolling ? 'bg-green-500/10 border border-green-400/30 text-green-400' : 'bg-[var(--zv-surface)] border border-[var(--zv-border)] text-[var(--zv-muted)]'}`}>
                        {checkPolling ? <><CheckCircle className="w-3.5 h-3.5" />Auto-cek aktif (setiap 30 detik)</> : <><Clock className="w-3.5 h-3.5" />Aktifkan auto-cek deposit</>}
                      </button>

                      {/* Back Button */}
                      <button onClick={() => { setDepositStep('amount'); setDepositPaymentInfo(null); setCheckPolling(false) }}
                        className="w-full h-10 rounded-xl text-[10px] font-bold text-[var(--zv-muted)] flex items-center justify-center gap-1.5 mt-2 hover:text-[var(--zv-text)] transition-colors">
                        <ArrowRight className="w-3.5 h-3.5 rotate-180" />Kembali ke form deposit
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Deposit Step: QRIS Payment */}
              {depositStep === 'qris' && depositCategory === 'qris' && (
                <motion.div key="deposit-qris" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                  <div className="rounded-2xl p-4 bg-[var(--zv-panel)] border border-[var(--zv-border)] mb-4">
                    <div className="mb-4 flex flex-col items-center py-4">
                      {qrisImageUrl ? (
                        <div className="w-48 h-48 rounded-2xl bg-white border-2 border-[var(--zv-border)] p-2 mb-3 shadow-lg">
                          <img src={qrisImageUrl} alt="QRIS Payment" className="w-full h-full object-contain rounded-lg" />
                        </div>
                      ) : (
                        <div className="w-48 h-48 rounded-2xl bg-white border-2 border-dashed border-[var(--zv-border)] p-3 mb-3 flex items-center justify-center">
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
                            <rect x="80" y="96" width="8" height="8" fill="#0c1a2e" />
                            <rect x="112" y="96" width="8" height="8" fill="#0c1a2e" />
                            <rect x="80" y="162" width="8" height="8" fill="#0c1a2e" />
                            <rect x="96" y="162" width="8" height="8" fill="#0c1a2e" />
                            <text x="100" y="195" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#0c1a2e">QRIS</text>
                          </svg>
                        </div>
                      )}
                      <div className="rounded-xl px-6 py-3 bg-gradient-to-r from-[#1a3a5c] via-[#2563eb] to-[#3b82f6] mb-3 shadow-lg shadow-blue-500/20">
                        <span className="text-[8px] font-bold text-white/80 uppercase tracking-wider block">Total Pembayaran</span>
                        <span className="text-lg font-black text-white">{formatRupiah(parseFloat(depositAmount) || 0)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setDepositStep('amount')}
                        className="flex-1 h-12 rounded-2xl text-[11px] font-black tracking-wider uppercase flex items-center justify-center gap-2 bg-[var(--zv-surface)] border border-[var(--zv-border)] text-[var(--zv-text)]">
                        Kembali
                      </button>
                      <button onClick={handleDeposit} disabled={depositLoading}
                        className="flex-[2] h-12 rounded-2xl text-white text-[11px] font-black tracking-wider uppercase flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-70"
                        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #2563eb 100%)' }}>
                        {depositLoading ? <div className="w-5 h-5 rounded-full border-[3px] border-white/30 border-t-white animate-spin" /> : <><CheckCircle className="w-4 h-4" />Sudah Bayar</>}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}

          {/* Deposit History */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] font-black text-[#3b82f6] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />Riwayat Deposit
            </h3>
            <span className="text-[8px] font-bold text-[var(--zv-muted)]">{deposits.length} transaksi</span>
          </div>
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {deposits.length === 0 ? (
              <div className="rounded-2xl p-6 bg-[var(--zv-panel)] border border-[var(--zv-border)] text-center">
                <Clock className="w-8 h-8 text-[var(--zv-muted)] mx-auto mb-2" />
                <span className="block text-[10px] font-bold text-[var(--zv-muted)]">Belum ada riwayat deposit</span>
              </div>
            ) : deposits.map(d => (
              <div key={d.id} className="rounded-2xl p-3 bg-[var(--zv-panel)] border border-[var(--zv-border)] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl grid place-items-center ${d.method === 'crypto' ? 'bg-[#26A17B]/10' : 'bg-[#3b82f6]/10'}`}>
                    {d.method === 'crypto' ? <Gem className="w-4 h-4 text-[#26A17B]" /> : <Plus className="w-4 h-4 text-[#3b82f6]" />}
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-[var(--zv-text)]">
                      {d.method === 'crypto' ? `USDT ${d.cryptoNetwork || ''}` : d.method === 'qris' ? 'QRIS' : d.bankName || 'Transfer'}
                    </span>
                    <span className="block text-[7px] text-[var(--zv-muted)]">{formatDateTime(d.createdAt)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] font-black text-[#26A17B]">+{formatRupiah(d.amount)}</span>
                  <span className={`block text-[7px] font-bold ${d.status === 'completed' ? 'text-green-400' : d.status === 'pending' ? 'text-amber-400' : 'text-red-400'}`}>
                    {d.status === 'completed' ? '✓ Selesai' : d.status === 'pending' ? '⏳ Pending' : '✗ Gagal'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* ===== WITHDRAW SECTION ===== */}

          {/* Balance Cards */}
          <div className="mb-3">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="rounded-2xl p-3 bg-gradient-to-br from-[#0f172a] to-[#1e293b] border border-[#334155]">
                <span className="text-[7px] font-bold text-white/40">Dompet Utama</span>
                <b className="block text-[14px] font-black text-white">{formatRupiah(user?.balance || 0)}</b>
                <span className="block text-[6px] font-semibold text-white/30 mt-0.5">Saldo untuk investasi</span>
              </div>
              <div className="rounded-2xl p-3 bg-gradient-to-br from-[#1a0a2e] to-[#2d1b4e] border border-[#4c1d95]/30">
                <span className="text-[7px] font-bold text-white/40">Dompet Penarikan</span>
                <b className="block text-[14px] font-black text-amber-400">{formatRupiah(0)}</b>
                <span className="block text-[6px] font-semibold text-white/30 mt-0.5">Saldo yang dapat ditarik</span>
              </div>
            </div>
            <div className="rounded-xl p-2 bg-amber-500/5 border border-amber-500/10 mb-2">
              <div className="flex items-start gap-1.5">
                <AlertCircle className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                <span className="text-[7px] font-bold text-amber-400 leading-relaxed">Biaya admin 10% berlaku untuk semua penarikan. Verifikasi KYC untuk minimum penarikan Rp 50.000.</span>
              </div>
            </div>
          </div>

          {/* Withdraw Category Tabs */}
          <div className="flex gap-1.5 mb-3">
            {[
              { key: 'bank' as const, label: 'Bank', icon: <Building2 className="w-3.5 h-3.5" /> },
              { key: 'ewallet' as const, label: 'E-Wallet', icon: <Wallet className="w-3.5 h-3.5" /> },
              { key: 'crypto' as const, label: 'Crypto', icon: <Gem className="w-3.5 h-3.5" /> },
            ].map(cat => (
              <button key={cat.key} onClick={() => setWithdrawCategory(cat.key)}
                className={`flex-1 h-9 rounded-xl text-[9px] md:text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${withdrawCategory === cat.key ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-sm shadow-amber-500/20' : 'bg-[var(--zv-panel)] border border-[var(--zv-border)] text-[var(--zv-muted)] hover:border-amber-500/30 hover:text-amber-500'}`}>
                {cat.icon}{cat.label}
              </button>
            ))}
          </div>

          {/* KYC Status Badge */}
          <div className={`rounded-xl p-2.5 mb-3 border ${isKycVerified ? 'bg-green-500/5 border-green-500/10' : 'bg-yellow-500/5 border-yellow-500/10'}`}>
            <div className="flex items-center gap-2">
              {isKycVerified ? <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" /> : <Shield className="w-3.5 h-3.5 text-yellow-500 shrink-0" />}
              <div className="flex-1">
                <p className="text-[9px] font-bold text-[var(--zv-text)]">{isKycVerified ? 'KYC Verified ✓' : 'Belum Verifikasi KYC'}</p>
                <p className="text-[8px] text-[var(--zv-muted)]">{isKycVerified ? 'Min. withdraw Rp 50.000' : 'Min. withdraw Rp 250.000 — Verifikasi KYC untuk min. Rp 50.000'}</p>
              </div>
              {!isKycVerified && (
                <button onClick={() => { setShowKycModal(true); fetchKycStatus() }} className="shrink-0 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[8px] font-bold text-amber-500 hover:bg-amber-500/20 transition-colors">
                  Verifikasi
                </button>
              )}
            </div>
          </div>

          {/* Withdraw Form */}
          <div className="rounded-2xl p-4 bg-[var(--zv-panel)] border border-[var(--zv-border)] mb-4">
            {/* Bank Method */}
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
                      className={`shrink-0 w-[64px] rounded-xl p-1.5 border-2 transition-all flex flex-col items-center justify-center gap-1 ${withdrawBankMethod === bank.code ? 'border-amber-500 bg-amber-500/10 shadow-sm shadow-amber-500/10' : 'border-[var(--zv-border)] bg-[var(--zv-surface)] hover:border-amber-500/30'}`}>
                      <div className="w-8 h-8 rounded-lg grid place-items-center text-white text-[8px] font-black" style={{ backgroundColor: bank.color }}>
                        {bank.name.slice(0, 2)}
                      </div>
                      <span className={`text-[6px] font-bold text-center leading-tight ${withdrawBankMethod === bank.code ? 'text-amber-500' : 'text-[var(--zv-muted)]'}`}>{bank.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* E-Wallet Method */}
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
                  ].map(ew => (
                    <button key={ew.code} onClick={() => setWithdrawEwalletMethod(ew.code)}
                      className={`shrink-0 w-[64px] rounded-xl p-1.5 border-2 transition-all flex flex-col items-center justify-center gap-1 ${withdrawEwalletMethod === ew.code ? 'border-amber-500 bg-amber-500/10 shadow-sm shadow-amber-500/10' : 'border-[var(--zv-border)] bg-[var(--zv-surface)] hover:border-amber-500/30'}`}>
                      <div className="w-8 h-8 rounded-lg grid place-items-center text-white text-[8px] font-black" style={{ backgroundColor: ew.color }}>
                        {ew.name.slice(0, 2)}
                      </div>
                      <span className={`text-[6px] font-bold text-center leading-tight ${withdrawEwalletMethod === ew.code ? 'text-amber-500' : 'text-[var(--zv-muted)]'}`}>{ew.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Crypto Method */}
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
                  ].map(cr => (
                    <button key={cr.code} onClick={() => setWithdrawCryptoMethod(cr.code)}
                      className={`shrink-0 w-[64px] rounded-xl p-1.5 border-2 transition-all flex flex-col items-center justify-center gap-0.5 ${withdrawCryptoMethod === cr.code ? 'border-amber-500 bg-amber-500/10 shadow-sm shadow-amber-500/10' : 'border-[var(--zv-border)] bg-[var(--zv-surface)] hover:border-amber-500/30'}`}>
                      <div className="w-7 h-7 rounded-full grid place-items-center text-white text-[7px] font-black" style={{ backgroundColor: cr.color }}>
                        {cr.name.slice(0, 2)}
                      </div>
                      <span className={`text-[7px] font-black text-center leading-tight ${withdrawCryptoMethod === cr.code ? 'text-amber-500' : 'text-[var(--zv-text)]'}`}>{cr.name}</span>
                      <span className="text-[5px] font-bold text-[var(--zv-muted)]">{cr.network}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Amount Input */}
            <label className="block mb-1.5 text-[9px] font-black text-[var(--zv-muted)] uppercase tracking-widest">Jumlah Withdraw</label>
            <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder={isKycVerified ? 'Minimal Rp 50.000' : 'Minimal Rp 250.000'}
              className="w-full h-11 rounded-2xl bg-[var(--zv-surface)] border border-[var(--zv-border)] px-4 text-[13px] font-semibold text-[var(--zv-text)] outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all mb-2" />
            <div className="grid grid-cols-4 gap-1.5 mb-3">
              {['50000', '100000', '200000', '500000', '1000000', '2000000', '5000000'].map(a => (
                <button key={a} onClick={() => setWithdrawAmount(a)} className="h-8 rounded-lg bg-[var(--zv-surface)] border border-[var(--zv-border)] text-[8px] md:text-[9px] font-bold text-amber-500 hover:bg-gradient-to-r hover:from-amber-600 hover:to-amber-500 hover:text-white hover:border-transparent transition-all">
                  {parseFloat(a) >= 1e6 ? `${(parseFloat(a) / 1e6).toFixed(0)}jt` : `${(parseFloat(a) / 1e3).toFixed(0)}rb`}
                </button>
              ))}
            </div>

            {/* Account Details */}
            {withdrawCategory === 'bank' && (
              <div className="mb-3">
                <label className="block mb-1.5 text-[9px] font-black text-[var(--zv-muted)] uppercase tracking-widest">Nomor Rekening</label>
                <input type="text" value={withdrawAccountNumber} onChange={(e) => setWithdrawAccountNumber(e.target.value)} placeholder="Masukkan nomor rekening"
                  className="w-full h-11 rounded-2xl bg-[var(--zv-surface)] border border-[var(--zv-border)] px-4 text-[13px] font-semibold text-[var(--zv-text)] outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all mb-2" />
                <label className="block mb-1.5 text-[9px] font-black text-[var(--zv-muted)] uppercase tracking-widest">Nama Pemilik Rekening</label>
                <input type="text" value={withdrawAccountHolder} onChange={(e) => setWithdrawAccountHolder(e.target.value)} placeholder="Nama sesuai rekening"
                  className="w-full h-11 rounded-2xl bg-[var(--zv-surface)] border border-[var(--zv-border)] px-4 text-[13px] font-semibold text-[var(--zv-text)] outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all" />
              </div>
            )}

            {withdrawCategory === 'ewallet' && (
              <div className="mb-3">
                <label className="block mb-1.5 text-[9px] font-black text-[var(--zv-muted)] uppercase tracking-widest">Nomor HP / Email</label>
                <input type="text" value={withdrawAccountNumber} onChange={(e) => setWithdrawAccountNumber(e.target.value)} placeholder="Masukkan nomor HP atau email e-wallet"
                  className="w-full h-11 rounded-2xl bg-[var(--zv-surface)] border border-[var(--zv-border)] px-4 text-[13px] font-semibold text-[var(--zv-text)] outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all" />
              </div>
            )}

            {withdrawCategory === 'crypto' && (
              <div className="mb-3">
                <label className="block mb-1.5 text-[9px] font-black text-[var(--zv-muted)] uppercase tracking-widest">Wallet Address</label>
                <input type="text" value={withdrawAccountNumber} onChange={(e) => setWithdrawAccountNumber(e.target.value)} placeholder="Masukkan alamat wallet crypto"
                  className="w-full h-11 rounded-2xl bg-[var(--zv-surface)] border border-[var(--zv-border)] px-4 text-[13px] font-semibold text-[var(--zv-text)] outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all" />
              </div>
            )}

            {/* OTP Verification */}
            <div className="rounded-xl p-3 bg-[var(--zv-surface)] border border-[var(--zv-border)] mb-3">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-amber-500" />
                <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Verifikasi Email</span>
                {withdrawOtpVerified && (
                  <span className="h-4 px-1.5 rounded-full bg-green-500/20 border border-green-400/30 text-[7px] font-black text-green-400 flex items-center gap-0.5">
                    <CheckCircle className="w-2.5 h-2.5" />Verified
                  </span>
                )}
              </div>
              {!withdrawOtpSent ? (
                <button onClick={() => handleSendWithdrawOtp(withdrawOtpRefs)} disabled={withdrawOtpLoading}
                  className="w-full h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold flex items-center justify-center gap-1.5 hover:bg-amber-500/20 transition-all disabled:opacity-50">
                  {withdrawOtpLoading ? <div className="w-4 h-4 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" /> : <><Mail className="w-3.5 h-3.5" />Kirim OTP ke Email</>}
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
                        className="w-9 h-10 rounded-lg bg-[var(--zv-panel)] border border-[var(--zv-border)] text-center text-[14px] font-black text-[var(--zv-text)] outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all"
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleVerifyWithdrawOtp(withdrawOtpRefs)} disabled={withdrawOtpLoading || withdrawOtpCode.join('').length !== 6}
                      className="flex-1 h-9 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-white text-[9px] font-bold flex items-center justify-center gap-1 hover:from-amber-500 hover:to-amber-400 transition-all disabled:opacity-50">
                      {withdrawOtpLoading ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <><CheckCircle className="w-3 h-3" />Verifikasi</>}
                    </button>
                    {withdrawOtpTimer > 0 ? (
                      <span className="h-9 px-3 rounded-xl bg-[var(--zv-panel)] border border-[var(--zv-border)] text-[9px] font-bold text-[var(--zv-muted)] flex items-center">({withdrawOtpTimer}s)</span>
                    ) : (
                      <button onClick={() => handleSendWithdrawOtp(withdrawOtpRefs)} disabled={withdrawOtpLoading}
                        className="h-9 px-3 rounded-xl bg-[var(--zv-panel)] border border-[var(--zv-border)] text-[9px] font-bold text-amber-500 hover:bg-amber-500/10 transition-all disabled:opacity-50">
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
              className="w-full h-12 rounded-2xl text-white text-[11px] font-black tracking-wider uppercase flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-70 shadow-lg shadow-amber-500/20"
              style={{ background: 'linear-gradient(135deg, #451a03 0%, #92400e 30%, #d97706 70%, #f59e0b 100%)' }}>
              {withdrawLoading ? (
                <div className="w-5 h-5 rounded-full border-[3px] border-white/30 border-t-white animate-spin" />
              ) : (
                <><ArrowUpRight className="w-4 h-4" />Withdraw Sekarang</>
              )}
            </button>
          </div>

          {/* Withdraw History */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] font-black text-amber-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />Riwayat Withdraw
            </h3>
            <span className="text-[8px] font-bold text-[var(--zv-muted)]">{withdrawals.length} transaksi</span>
          </div>
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {withdrawals.length === 0 ? (
              <div className="rounded-2xl p-6 bg-[var(--zv-panel)] border border-[var(--zv-border)] text-center">
                <Clock className="w-8 h-8 text-[var(--zv-muted)] mx-auto mb-2" />
                <span className="block text-[10px] font-bold text-[var(--zv-muted)]">Belum ada riwayat withdraw</span>
              </div>
            ) : withdrawals.map(w => (
              <div key={w.id} className="rounded-2xl p-3 bg-[var(--zv-panel)] border border-[var(--zv-border)] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-red-500/10 grid place-items-center"><Minus className="w-4 h-4 text-red-400" /></div>
                  <div>
                    <span className="block text-[9px] font-bold text-[var(--zv-text)]">{w.bankName || 'Transfer Bank'}</span>
                    <span className="block text-[7px] text-[var(--zv-muted)]">{formatDateTime(w.createdAt)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] font-black text-red-400">-{formatRupiah(w.amount)}</span>
                  <span className={`block text-[7px] font-bold ${w.status === 'completed' ? 'text-green-400' : w.status === 'processing' ? 'text-amber-400' : 'text-red-400'}`}>
                    {w.status === 'completed' ? '✓ Selesai' : w.status === 'processing' ? '⏳ Proses' : '✗ Gagal'}
                  </span>
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
