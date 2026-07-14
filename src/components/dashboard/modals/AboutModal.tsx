'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, X, Shield, CheckCircle,
} from 'lucide-react'
import { useDashboardStore } from '@/lib/dashboard-store'
import { ZevorikLogo } from '@/components/ZevorikLogo'

export function AboutModal() {
  const store = useDashboardStore()
  const { showAboutModal, setShowAboutModal } = store

  return (
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
  )
}
