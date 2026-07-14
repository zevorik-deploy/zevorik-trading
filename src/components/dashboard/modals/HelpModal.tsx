'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  HelpCircle, X, ChevronRight, Headphones,
} from 'lucide-react'
import { useDashboardStore } from '@/lib/dashboard-store'

export function HelpModal() {
  const store = useDashboardStore()
  const { showHelpModal, setShowHelpModal, setShowCsModal } = store

  return (
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
  )
}
