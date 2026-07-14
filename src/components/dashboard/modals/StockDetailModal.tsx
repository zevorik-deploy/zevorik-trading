'use client'

import { useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, TrendingDown, X, Star, Zap, Package,
} from 'lucide-react'
import { formatRupiah, formatNumber, formatPercent, formatMarketCap, type Stock } from '@/lib/trading-utils'
import { useDashboardStore, getStockBaseRate, calcContractProfit, sparklineCache } from '@/lib/dashboard-store'
import { getRealLogo } from '@/lib/logos.tsx'

export function StockDetailModal() {
  const store = useDashboardStore()
  const {
    selectedStock, showStockDetail, priceHistory, watchlist,
    liveBuyChart, liveSellChart, liveBuyPrice, liveSellPrice, liveChartActive,
    setShowStockDetail, setContractModal,
    toggleWatchlist,
  } = store

  const computeYDomain = useCallback((data: {price: number}[], paddingPercent = 0.08): [number, number] => {
    if (data.length === 0) return [0, 100]
    const prices = data.map(d => d.price)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const range = max - min || 1
    const pad = range * paddingPercent
    return [Math.floor(min - pad), Math.ceil(max + pad)]
  }, [])

  const isWatched = (stockId: string) => watchlist.some(w => w.stockId === stockId)

  return (
    <AnimatePresence>
      {showStockDetail && selectedStock && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40" onClick={() => setShowStockDetail(false)} />
          <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25 }} className="fixed z-50 bottom-0 left-0 right-0 md:inset-0 md:bottom-auto md:left-auto md:right-auto md:top-auto md:flex md:items-center md:justify-center max-h-[85vh] md:max-h-[90vh] bg-[var(--zv-panel)] rounded-t-3xl md:rounded-3xl border border-[var(--zv-border)] overflow-y-auto custom-scrollbar md:w-[90vw] md:max-w-2xl md:mx-auto md:my-auto">
            <div className="sticky top-0 bg-[var(--zv-panel)] p-4 border-b border-[var(--zv-border)] flex items-center justify-between rounded-t-3xl">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-[var(--zv-surface)] flex items-center justify-center">{getRealLogo(selectedStock.code, 40)}</div>
                <div>
                  <span className="block text-[12px] font-black text-[var(--zv-text)]">{selectedStock.code}</span>
                  <span className="block text-[8px] text-[var(--zv-muted)]">{selectedStock.name}</span>
                </div>
              </div>
              <button onClick={() => setShowStockDetail(false)} className="w-8 h-8 rounded-lg grid place-items-center hover:bg-[var(--zv-surface)] text-[var(--zv-muted)] hover:text-[var(--zv-text)]"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-4">
              {/* Price */}
              <div className="mb-3">
                <span className="block text-2xl font-black text-[var(--zv-text)] tabular-nums">{formatRupiah(selectedStock.price)}</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[11px] font-bold ${selectedStock.changePercent >= 0 ? 'text-[#22c55e]' : 'text-[#ef5350]'}`}>
                    {selectedStock.changePercent >= 0 ? <TrendingUp className="w-3.5 h-3.5 inline" /> : <TrendingDown className="w-3.5 h-3.5 inline" />}
                    {' '}{formatRupiah(selectedStock.change)} ({formatPercent(selectedStock.changePercent)})
                  </span>
                </div>
              </div>
                {/* Contract Profit Preview */}
                <div className="mb-3 rounded-xl p-3 border border-[var(--zv-border)] bg-[var(--zv-surface)]">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Package className="w-4 h-4 text-[#3b82f6]" />
                    <span className="text-[10px] font-black text-[#3b82f6] uppercase tracking-wider">Info Kontrak</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg p-2 bg-[var(--zv-panel)] border border-[var(--zv-border)] text-center">
                      <span className="block text-[7px] font-bold text-[var(--zv-muted)]">Rate Dasar</span>
                      <span className="block text-[12px] font-black text-[#22c55e]">{getStockBaseRate(selectedStock.code)}%</span>
                      <span className="block text-[6px] text-[var(--zv-muted)]">per hari</span>
                    </div>
                    <div className="rounded-lg p-2 bg-[var(--zv-panel)] border border-[var(--zv-border)] text-center">
                      <span className="block text-[7px] font-bold text-[var(--zv-muted)]">Min. Durasi</span>
                      <span className="block text-[12px] font-black text-[#3b82f6]">30</span>
                      <span className="block text-[6px] text-[var(--zv-muted)]">hari</span>
                    </div>
                    <div className="rounded-lg p-2 bg-[var(--zv-panel)] border border-[var(--zv-border)] text-center">
                      <span className="block text-[7px] font-bold text-[var(--zv-muted)]">Max. Durasi</span>
                      <span className="block text-[12px] font-black text-[#3b82f6]">365</span>
                      <span className="block text-[6px] text-[var(--zv-muted)]">hari</span>
                    </div>
                  </div>
                  <div className="mt-2 rounded-lg p-2 bg-[var(--zv-panel)] border border-[var(--zv-border)]">
                    <div className="flex items-center gap-1 mb-1">
                      <Zap className="w-3 h-3 text-[#f59e0b]" />
                      <span className="text-[7px] font-bold text-[var(--zv-muted)]">Contoh: Rp 1.000.000 × 30 hari</span>
                    </div>
                    {(() => {
                      const exampleProfit = calcContractProfit(selectedStock, 30, 1000000)
                      return (
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] text-[var(--zv-muted)]">Profit/hari: <b className="text-[#22c55e]">{formatRupiah(exampleProfit.dailyProfitAmount)}</b></span>
                          <span className="text-[8px] text-[var(--zv-muted)]">Total: <b className="text-[#22c55e]">{formatRupiah(exampleProfit.totalReturn)}</b></span>
                        </div>
                      )
                    })()}
                  </div>
                </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[
                  { label: 'Open', value: formatRupiah(selectedStock.open) },
                  { label: 'High', value: formatRupiah(selectedStock.high) },
                  { label: 'Low', value: formatRupiah(selectedStock.low) },
                  { label: 'Volume', value: formatNumber(selectedStock.volume) },
                ].map((s, i) => (
                  <div key={i} className="rounded-xl p-2 bg-[var(--zv-surface)] text-center">
                    <span className="block text-[7px] font-bold text-[var(--zv-muted)]">{s.label}</span>
                    <span className="block text-[8px] font-black text-[var(--zv-text)] tabular-nums">{s.value}</span>
                  </div>
                ))}
              </div>

              {/* Fundamentals */}
              <div className="rounded-xl p-3 bg-[var(--zv-surface)] mb-3">
                <h4 className="text-[9px] font-black text-[#3b82f6] mb-1.5">Data Fundamental</h4>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: 'Market Cap', value: formatMarketCap(selectedStock.marketCap) },
                    { label: 'P/E Ratio', value: selectedStock.peRatio?.toFixed(1) || '-' },
                    { label: 'PBV', value: selectedStock.pbv?.toFixed(2) || '-' },
                    { label: 'Div. Yield', value: selectedStock.dividendYield ? `${selectedStock.dividendYield.toFixed(2)}%` : '-' },
                  ].map((f, i) => (
                    <div key={i} className="flex items-center justify-between py-0.5">
                      <span className="text-[8px] text-[var(--zv-muted)]">{f.label}</span>
                      <span className="text-[8px] font-bold text-[var(--zv-text)]">{f.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contract Button */}
              <button onClick={() => { setContractModal(true); setShowStockDetail(false) }} className="w-full h-12 rounded-xl bg-[#3b82f6] text-white text-[12px] font-bold hover:bg-[#2e9e93] transition-colors flex items-center justify-center gap-2">
                <Package className="w-5 h-5" />Buy Contract {selectedStock.code}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
