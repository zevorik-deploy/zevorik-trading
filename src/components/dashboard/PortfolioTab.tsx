'use client'

import { motion } from 'framer-motion'
import { Briefcase, Package } from 'lucide-react'
import { formatRupiah, formatPercent } from '@/lib/trading-utils'
import { useDashboardStore } from '@/lib/dashboard-store'
import { getRealLogo } from '@/lib/logos.tsx'

export function PortfolioTab() {
  const store = useDashboardStore()
  const {
    portfolio, portfolioSummary,
    setActiveTab, setSelectedStock, setShowStockDetail, setContractModal, setContractAmount, setContractDuration,
    setLiveBuyChart, setLiveSellChart, setLiveBuyPrice, setLiveSellPrice,
    fetchPriceHistory,
  } = store

  const openStockDetail = (stock: Parameters<typeof setSelectedStock>[0]) => {
    setSelectedStock(stock)
    setShowStockDetail(true)
    setLiveBuyChart([])
    setLiveSellChart([])
    setLiveBuyPrice(0)
    setLiveSellPrice(0)
    fetchPriceHistory(stock.id)
  }
  const openContract = (stock: Parameters<typeof setSelectedStock>[0]) => {
    setSelectedStock(stock)
    setContractModal(true)
    setContractAmount('')
    setContractDuration(30)
    fetchPriceHistory(stock.id)
  }

  return (
    <motion.div key="portfolio" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
      {/* Portfolio Value Card */}
      <div className="rounded-2xl overflow-hidden mb-4 border border-blue-600/20" style={{ background: 'linear-gradient(145deg, #0c1a2e 0%, #1e3a5f 54%, #2563eb 100%)', boxShadow: '0 4px 24px rgba(37,99,235,0.15)' }}>
        <div className="p-4 text-white relative">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
          <span className="text-[9px] font-medium text-blue-200">Nilai Portofolio</span>
          <b className="block text-2xl font-black mt-0.5">{formatRupiah(portfolioSummary.totalCurrentValue)}</b>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] font-bold ${portfolioSummary.totalProfitLoss >= 0 ? 'text-blue-300' : 'text-red-300'}`}>
              {formatRupiah(portfolioSummary.totalProfitLoss)} ({formatPercent(portfolioSummary.totalProfitLossPercent)})
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="rounded-2xl p-2.5 bg-white/10 border border-white/15">
              <span className="text-[7px] text-blue-200">Investasi</span>
              <b className="block text-[11px] font-black mt-0.5">{formatRupiah(portfolioSummary.totalInvested)}</b>
            </div>
            <div className="rounded-2xl p-2.5 bg-white/10 border border-white/15">
              <span className="text-[7px] text-blue-200">Saldo</span>
              <b className="block text-[11px] font-black mt-0.5">{formatRupiah(portfolioSummary.cashBalance)}</b>
            </div>
          </div>
        </div>
      </div>

      {/* Holdings */}
      <h3 className="text-[11px] md:text-sm font-black text-[#3b82f6] mb-2">Saham Dimiliki</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
        {portfolio.map(p => (
          <div key={p.id} className="rounded-2xl p-3 md:p-4 bg-[var(--zv-panel)] border border-[var(--zv-border)] transition-all hover:border-[#3b82f6]/30 hover:shadow-lg hover:shadow-blue-500/5">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => openStockDetail(p.stock)}>
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer bg-[var(--zv-surface)]">{getRealLogo(p.stock.code, 36)}</div>
                <div>
                  <span className="block text-[10px] md:text-xs font-black text-[var(--zv-text)]">{p.stock.code}</span>
                  <span className="block text-[7px] md:text-[8px] text-[var(--zv-muted)]">{formatRupiah(p.currentValue)}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="block text-[10px] md:text-xs font-black text-[var(--zv-text)] tabular-nums">{formatRupiah(p.currentValue)}</span>
                <span className={`block text-[9px] md:text-[10px] font-bold ${p.profitLoss >= 0 ? 'text-[#22c55e]' : 'text-[#ef5350]'}`}>
                  {formatRupiah(p.profitLoss)} ({formatPercent(p.profitLossPercent)})
                </span>
              </div>
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => openContract(p.stock)} className="flex-1 h-7 md:h-8 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white text-[8px] md:text-[9px] font-bold flex items-center justify-center gap-1 shadow-sm shadow-blue-500/20"><Package className="w-3 h-3" />Kontrak</button>
            </div>
          </div>
        ))}
        {portfolio.length === 0 && (
          <div className="col-span-full text-center py-8">
            <Briefcase className="w-10 h-10 text-[var(--zv-muted)] mx-auto mb-2" />
            <p className="text-[11px] md:text-sm font-bold text-[var(--zv-muted)]">Belum ada saham di portofolio</p>
            <button onClick={() => setActiveTab('market')} className="mt-2 h-8 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white text-[9px] md:text-[10px] font-bold shadow-md shadow-blue-500/20">Mulai Investasi</button>
          </div>
        )}
      </div>


    </motion.div>
  )
}
