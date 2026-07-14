'use client'

import { useAuthStore } from '@/lib/store'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, X, CheckCircle, Clock, XCircle, RefreshCw,
} from 'lucide-react'
import { useDashboardStore } from '@/lib/dashboard-store'

export function KycModal() {
  const { user } = useAuthStore()
  const store = useDashboardStore()
  const {
    kycForm, kycKtpFile, kycSelfieFile, kycBankFile, kycAdditionalFile,
    kycSubmitting, kycRecord,
    setShowKycModal, setKycForm, setKycKtpFile, setKycSelfieFile, setKycBankFile,
    setKycAdditionalFile, setKycSubmitting,
    handleKycSubmit,
  } = store

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

  return (
    <AnimatePresence>
      {store.showKycModal && (
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
  )
}
