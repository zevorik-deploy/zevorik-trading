'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Headphones, X, MessageCircle, Mail, Phone, MessageSquare, ChevronRight,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { useDashboardStore } from '@/lib/dashboard-store'

export function CsModal() {
  const store = useDashboardStore()
  const { showCsModal, setShowCsModal } = store

  return (
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
  )
}
