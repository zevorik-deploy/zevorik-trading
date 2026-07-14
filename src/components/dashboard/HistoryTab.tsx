'use client'

import { motion } from 'framer-motion'
import { Target, CheckCircle, X, ArrowDownRight, ArrowUpRight, History } from 'lucide-react'
import { formatRupiah, formatNumber, formatDateTime } from '@/lib/trading-utils'
import { useDashboardStore } from '@/lib/dashboard-store'

export function HistoryTab() {
  const store = useDashboardStore()
  const {
    sinyalPositions, transactions, txFilter,
    setTxFilter,
  } = store

  const filteredTransactions = transactions.filter(t => txFilter === 'all' || t.type === txFilter)

  return (
    <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
      <h2 className="text-[14px] md:text-lg font-black text-[#3b82f6] mb-3">Riwayat</h2>

      {/* ── Sinyal Pro Trade History ── */}
      {sinyalPositions.filter(p => p.status !== 'active').length > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Target className="w-4 h-4 text-purple-500" />
              <h3 className="text-[12px] font-black text-[var(--zv-text)]">Trading</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-bold text-green-400">{sinyalPositions.filter(p => p.status === 'won').length} Menang</span>
              <span className="text-[8px] text-[var(--zv-muted)]">•</span>
              <span className="text-[8px] font-bold text-red-400">{sinyalPositions.filter(p => p.status === 'lost').length} Kalah</span>
              <span className="text-[8px] text-[var(--zv-muted)]">•</span>
              <span className="text-[8px] font-bold text-[var(--zv-muted)]">Win Rate {(() => {
                const total = sinyalPositions.filter(p => p.status !== 'active').length
                const wins = sinyalPositions.filter(p => p.status === 'won').length
                return total > 0 ? `${Math.round(wins / total * 100)}%` : '0%'
              })()}</span>
            </div>
          </div>
          <div className="space-y-1.5 max-h-80 overflow-y-auto custom-scrollbar">
            {sinyalPositions.filter(p => p.status !== 'active').slice().reverse().map(pos => {
              const isWon = pos.status === 'won'
              const plAmt = pos.closedPL !== undefined ? pos.closedPL : (isWon ? Math.round(pos.amount * pos.profitPercent / 100) : -pos.amount)
              return (
                <div key={pos.id} className={`rounded-xl p-2.5 border ${isWon ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg grid place-items-center ${isWon ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                        {isWon ? <CheckCircle className="w-4 h-4 text-green-400" /> : <X className="w-4 h-4 text-red-400" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black text-[var(--zv-text)]">{pos.stockCode}</span>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${pos.direction === 'NAIK' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{pos.direction === 'NAIK' ? 'Buy' : 'Sell'}</span>
                        </div>
                        <span className="text-[7px] text-[var(--zv-muted)]">{formatRupiah(pos.amount)} • Entry {formatNumber(pos.startPrice)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`block text-[11px] font-black ${isWon ? 'text-green-400' : 'text-red-400'}`}>
                        {isWon ? '+' : ''}{formatRupiah(plAmt)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Divider ── */}
      {sinyalPositions.filter(p => p.status !== 'active').length > 0 && filteredTransactions.length > 0 && (
        <div className="border-t border-[var(--zv-border)] my-4" />
      )}

      {/* ── Transaction History ── */}
      <div>
        <h3 className="text-[12px] font-black text-[var(--zv-text)] mb-2">Transaksi Saham</h3>

        {/* Filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3">
          {[{ key: 'all', label: 'Semua' }, { key: 'BUY', label: 'Buy' }, { key: 'SELL', label: 'Sell' }, { key: 'DEPOSIT', label: 'Deposit' }, { key: 'WITHDRAW', label: 'Withdraw' }].map(f => (
            <button key={f.key} onClick={() => setTxFilter(f.key)}
              className={`flex-shrink-0 h-7 px-3 rounded-full text-[9px] font-bold transition-all ${txFilter === f.key ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm' : 'bg-[var(--zv-panel)] border border-[var(--zv-border)] text-[var(--zv-muted)] hover:border-[#3b82f6]/30 hover:text-[#3b82f6]'}`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Transaction List */}
        <div className="space-y-1.5">
          {filteredTransactions.map(tx => (
            <div key={tx.id} className="rounded-2xl p-3 bg-[var(--zv-panel)] border border-[var(--zv-border)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-9 h-9 rounded-xl grid place-items-center ${tx.type === 'BUY' ? 'bg-[var(--zv-surface)]' : 'bg-[var(--zv-surface)]'}`}>
                    {tx.type === 'BUY' ? <ArrowDownRight className="w-4 h-4 text-[#3b82f6]" /> : <ArrowUpRight className="w-4 h-4 text-[#ef5350]" />}
                  </div>
                  <div>
                    <span className="block text-[10px] font-black text-[var(--zv-text)]">
                      {tx.type === 'BUY' ? 'Buy' : 'Sell'} {tx.stock?.code || 'N/A'}
                    </span>
                    <span className="block text-[7px] text-[var(--zv-muted)]">{formatRupiah(tx.total)} {tx.orderType ? `(${tx.orderType})` : ''}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`block text-[10px] font-black ${tx.type === 'BUY' ? 'text-[#ef5350]' : 'text-[#3b82f6]'}`}>
                    {tx.type === 'BUY' ? '-' : '+'}{formatRupiah(tx.total)}
                  </span>
                  <div className="flex items-center gap-1 justify-end">
                    <span className={`w-1.5 h-1.5 rounded-full ${tx.status === 'completed' ? 'bg-[#3b82f6]' : tx.status === 'pending' ? 'bg-[#f59e0b]' : 'bg-[#ef5350]'}`} />
                    <span className="text-[7px] font-bold text-[var(--zv-muted)]">{tx.status}</span>
                  </div>
                  <span className="block text-[7px] text-[var(--zv-muted)]">{formatDateTime(tx.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
          {filteredTransactions.length === 0 && (
            <div className="text-center py-8">
              <History className="w-10 h-10 text-[var(--zv-muted)] mx-auto mb-2" />
              <p className="text-[11px] font-bold text-[var(--zv-muted)]">Belum ada transaksi</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
