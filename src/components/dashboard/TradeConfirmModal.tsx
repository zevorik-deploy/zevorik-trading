'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, TrendingDown, Info } from 'lucide-react'
import { formatRupiah } from '@/lib/trading-utils'
import { useDashboardStore, LOT_SIZE } from '@/lib/dashboard-store'

export function TradeConfirmModal() {
  const store = useDashboardStore()
  const {
    showConfirmTrade, confirmTradeDir, selectedSinyalStock, sinyalLots, sinyalLeverage, sinyalAmount,
    setShowConfirmTrade,
    openSinyalPosition,
  } = store

  const sinyalAmountFromLots = Math.round(parseFloat(sinyalLots || '0') * LOT_SIZE)

  return (
    <AnimatePresence>
      {showConfirmTrade && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowConfirmTrade(false)} />
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto">
            <div className="rounded-t-3xl bg-[var(--zv-panel)] border-t border-[var(--zv-border)] p-5" style={{ boxShadow: '0 -10px 40px rgba(0,0,0,0.3)' }}>
              <div className="w-10 h-1 rounded-full bg-[var(--zv-border)] mx-auto mb-4" />
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${confirmTradeDir === 'NAIK' ? 'bg-green-500/15' : 'bg-red-500/15'}`}>
                  {confirmTradeDir === 'NAIK' ? <TrendingUp className="w-6 h-6 text-green-500" /> : <TrendingDown className="w-6 h-6 text-red-500" />}
                </div>
                <div>
                  <span className={`text-[10px] font-black ${confirmTradeDir === 'NAIK' ? 'text-green-500' : 'text-red-500'}`}>
                    {confirmTradeDir === 'NAIK' ? 'BUY' : 'SELL'} {selectedSinyalStock?.code}
                  </span>
                  <span className="block text-[8px] text-[var(--zv-muted)]">
                    {confirmTradeDir === 'NAIK' ? 'Memprediksi kenaikan harga' : 'Memprediksi penurunan harga'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between py-2 border-b border-[var(--zv-border)]">
                  <span className="text-[10px] text-[var(--zv-muted)] font-bold">Lot</span>
                  <span className="text-[10px] font-black text-[#3b82f6]">{sinyalLots} Lot ({formatRupiah(sinyalAmountFromLots)})</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[var(--zv-border)]">
                  <span className="text-[10px] text-[var(--zv-muted)] font-bold">Leverage</span>
                  <span className="text-[10px] font-black text-amber-400">1:{sinyalLeverage}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[var(--zv-border)]">
                  <span className="text-[10px] text-[var(--zv-muted)] font-bold">Effective Position</span>
                  <span className="text-[10px] font-black text-[var(--zv-text)]">{formatRupiah(sinyalAmountFromLots * (sinyalLeverage / 100))}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[var(--zv-border)]">
                  <span className="text-[10px] text-[var(--zv-muted)] font-bold">Profit/Loss per 1%</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-green-400">+{formatRupiah(Math.round(sinyalAmountFromLots * (sinyalLeverage / 100) * 0.01))}</span>
                    <span className="text-[9px] text-[var(--zv-muted)]">/</span>
                    <span className="text-[9px] font-bold text-red-400">-{formatRupiah(Math.round(sinyalAmountFromLots * (sinyalLeverage / 100) * 0.01))}</span>
                  </div>
                </div>
                <div className="flex justify-between py-2 border-b border-[var(--zv-border)]">
                  <span className="text-[10px] text-[var(--zv-muted)] font-bold">Tutup Posisi</span>
                  <span className="text-[10px] font-black text-green-400">Manual (Anda tentukan)</span>
                </div>
                <div className="rounded-lg p-2 bg-blue-500/8 border border-blue-500/15">
                  <div className="flex items-center gap-1.5">
                    <Info className="w-3 h-3 text-blue-400" />
                    <span className="text-[8px] font-bold text-blue-400">Posisi terbuka sampai Anda tutup manual. Saldo ikut pergerakan grafik real-time seperti MT5!</span>
                  </div>
                </div>
              </div>

              <button onClick={() => {
                openSinyalPosition(confirmTradeDir)
                setShowConfirmTrade(false)
              }}
                className="relative w-full h-14 rounded-xl text-white text-[13px] font-black tracking-wide flex items-center justify-center gap-2 transition-all active:scale-[0.96] overflow-hidden"
                style={confirmTradeDir === 'NAIK'
                  ? { background: 'linear-gradient(180deg, #4ade80 0%, #22c55e 30%, #16a34a 70%, #166534 100%)', boxShadow: '0 6px 28px rgba(34,197,94,0.45), 0 2px 8px rgba(34,197,94,0.3), inset 0 1px 0 rgba(255,255,255,0.2)' }
                  : { background: 'linear-gradient(180deg, #f87171 0%, #ef5350 30%, #dc2626 70%, #991b1b 100%)', boxShadow: '0 6px 28px rgba(239,83,80,0.45), 0 2px 8px rgba(239,83,80,0.3), inset 0 1px 0 rgba(255,255,255,0.2)' }
                }>
                <div className="absolute inset-x-0 top-0 h-1/3" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%)' }} />
                {confirmTradeDir === 'NAIK' ? <TrendingUp className="w-5 h-5 relative drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" /> : <TrendingDown className="w-5 h-5 relative drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" />}
                <span className="relative drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)]">CONFIRM {confirmTradeDir === 'NAIK' ? 'BUY' : 'SELL'}</span>
              </button>
              <button onClick={() => setShowConfirmTrade(false)} className="w-full h-10 mt-2 rounded-xl bg-[var(--zv-surface)] border border-[var(--zv-border)] text-[10px] font-bold text-[var(--zv-muted)] hover:text-[var(--zv-text)] transition-all">
                Batal
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
