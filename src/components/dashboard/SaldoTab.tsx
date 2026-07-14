'use client'

import { useAuthStore } from '@/lib/store'
import { motion } from 'framer-motion'
import {
  TrendingUp, TrendingDown, Eye, EyeOff, Wallet, BarChart3,
  CheckCircle, XCircle, RefreshCw, Clock, ArrowUpRight, ArrowDownRight,
  Shield, Copy, Check, Info, ChevronRight, Activity, Target,
  PieChart, SlidersHorizontal, DollarSign, CreditCard, Zap,
  AlertCircle, Plus, Minus, X, Package, ChevronDown, History
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { formatRupiah, formatNumber, formatPercent, formatDateTime } from '@/lib/trading-utils'
import { useDashboardStore, type SinyalPosition, LOT_SIZE } from '@/lib/dashboard-store'

export function SaldoTab() {
  const { user } = useAuthStore()
  const store = useDashboardStore()
  const {
    sinyalPositions, sinyalCurrentPrice, selectedSinyalStock, sinyalLeverage,
    saldoSubTab, sinyalTerminalTab, sinyalHistoryFilter, sinyalTimers,
    showBalance, chartPayoutRates,
    setSaldoSubTab, setSinyalTerminalTab, setSinyalHistoryFilter,
    setShowBalance, closeSinyalPosition,
  } = store

  // Helper: getPositionLivePL with current ref values
  const getPositionLivePL = (pos: SinyalPosition) => {
    return store.getPositionLivePL(pos, sinyalCurrentPrice, null)
  }


  return (
    <motion.div key="saldo" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
      className="flex flex-col gap-3" style={{ minHeight: 'calc(100vh - 140px)' }}>

      {(() => {
        const activePos = sinyalPositions.filter(p => p.status === 'active')
        const closedPos = sinyalPositions.filter(p => p.status === 'won' || p.status === 'lost')
        const totalLivePL = activePos.reduce((s, p) => s + getPositionLivePL(p), 0)
        const totalBalance = (user?.balance || 0)
        // MT5-style: Equity = Balance + Floating P/L (follows chart in real-time)
        const equity = totalBalance + totalLivePL
        const usedMargin = activePos.reduce((s, p) => s + p.amount, 0)
        const freeMargin = equity - usedMargin
        const marginLevel = usedMargin > 0 ? (equity / usedMargin) * 100 : 0
        const wonCount = closedPos.filter(p => p.status === 'won').length
        const lostCount = closedPos.filter(p => p.status === 'lost').length
        const totalTrades = closedPos.length
        const winRate = totalTrades > 0 ? (wonCount / totalTrades) * 100 : 0
        const totalProfitPL = closedPos.filter(p => p.status === 'won').reduce((s, p) => s + (p.closedPL || 0), 0)
        const totalLossPL = closedPos.filter(p => p.status === 'lost').reduce((s, p) => s + (p.closedPL || 0), 0)
        const netPL = totalProfitPL + totalLossPL
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
        const todayPL = closedPos.filter(p => p.startTime >= todayStart.getTime()).reduce((s, p) => s + (p.closedPL || 0), 0)
        const marginLevelColor = marginLevel > 200 ? '#22c55e' : marginLevel > 100 ? '#f59e0b' : marginLevel > 50 ? '#ef5350' : '#dc2626'
        const marginLevelBg = marginLevel > 200 ? 'bg-green-500' : marginLevel > 100 ? 'bg-amber-500' : 'bg-red-500'
        const freeMarginColor = freeMargin >= 0 ? (freeMargin > totalBalance * 0.3 ? 'text-green-400' : 'text-cyan-400') : 'text-red-400'

        return (
          <>
      {/* ════════ ACCOUNT SUMMARY CARD — Premium MT5 Dark ════════ */}
      <div className="relative rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(145deg, #080f1e 0%, #0c1a2e 25%, #162544 55%, #1e3a5f 100%)' }}>
        {/* Subtle top highlight */}
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(59,130,246,0.3) 50%, transparent 90%)' }} />
        {/* Subtle glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }} />

        <div className="relative px-4 pt-4 pb-3">
          {/* Top row: Account badge + Refresh */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-blue-400" />
              <span className="text-[10px] font-black text-blue-300/80 uppercase tracking-widest">ZEVORIK Terminal</span>
            </div>
            <div className="flex items-center gap-2">
              {activePos.length > 0 && (
                <span className="flex items-center gap-1 h-5 px-2 rounded-full bg-green-500/15 border border-green-500/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[7px] font-black text-green-400">LIVE</span>
                </span>
              )}
              <span className="h-5 px-2.5 rounded-full text-[7px] font-black flex items-center gap-1 border bg-green-500/15 border-green-500/30 text-green-400">
                <span className="w-1 h-1 rounded-full bg-green-400" />
                REAL
              </span>
              <button onClick={() => { fetchPortfolio(); fetchTransactions(); }} className="h-6 w-6 rounded-lg bg-white/5 border border-white/10 grid place-items-center hover:border-blue-500/30 hover:bg-white/10 transition-all">
                <RefreshCw className="w-3 h-3 text-blue-300/60" />
              </button>
            </div>
          </div>

          {/* Balance — Big & Prominent */}
          <div className="mb-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <DollarSign className="w-3 h-3 text-blue-300/50" />
              <span className="text-[8px] font-bold text-blue-300/50 uppercase tracking-widest">Balance</span>
            </div>
            <b className={`block text-[26px] font-black transition-colors duration-500 leading-tight text-white`}
              style={{ textShadow: totalLivePL !== 0 ? `0 0 20px ${totalLivePL > 0 ? 'rgba(34,197,94,0.2)' : 'rgba(239,83,80,0.2)'}` : 'none' }}>
              {formatRupiah(totalBalance)}
            </b>
          </div>

          {/* Equity + Floating P&L — Always show Equity (MT5: Equity = Balance when no positions) */}
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <BarChart3 className="w-3 h-3 text-blue-300/50" />
                <span className="text-[8px] font-bold text-blue-300/50 uppercase tracking-widest">Equity</span>
                {activePos.length > 0 && (
                  <span className="flex items-center gap-0.5 ml-1">
                    <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[6px] font-black text-green-400">LIVE</span>
                  </span>
                )}
              </div>
              <div className={`text-[18px] font-black transition-colors duration-500 ${totalLivePL > 0 ? 'text-green-400' : totalLivePL < 0 ? 'text-red-400' : 'text-blue-100'}`}>
                {formatRupiah(equity)}
              </div>
            </div>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${totalLivePL >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
              {totalLivePL >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-green-400" /> : <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
              <div>
                <div className="text-[7px] font-bold text-blue-300/50 uppercase">Floating P&L</div>
                <div className={`text-[13px] font-black ${totalLivePL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {activePos.length > 0 ? `${totalLivePL >= 0 ? '+' : ''}${formatRupiah(totalLivePL)}` : 'Rp0'}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ════════ MT5 Terminal Stats Grid — 2x3 ════════ */}
        <div className="grid grid-cols-3 gap-px bg-white/[0.03] border-t border-white/[0.06]">
          {/* Saldo */}
          <div className="px-3 py-2.5" style={{ background: 'linear-gradient(135deg, rgba(8,15,30,0.95), rgba(12,26,46,0.95))' }}>
            <div className="flex items-center gap-1 mb-1">
              <Wallet className="w-2.5 h-2.5 text-blue-400/50" />
              <span className="text-[6px] font-bold text-blue-300/40 uppercase tracking-wider">Saldo</span>
            </div>
            <div className="text-[11px] font-black text-white">{formatRupiah(totalBalance)}</div>
          </div>
          {/* Equity */}
          <div className="px-3 py-2.5" style={{ background: 'linear-gradient(135deg, rgba(8,15,30,0.95), rgba(12,26,46,0.95))' }}>
            <div className="flex items-center gap-1 mb-1">
              <BarChart3 className="w-2.5 h-2.5 text-blue-400/50" />
              <span className="text-[6px] font-bold text-blue-300/40 uppercase tracking-wider">Equity</span>
            </div>
            <div className={`text-[11px] font-black ${totalLivePL > 0 ? 'text-green-400' : totalLivePL < 0 ? 'text-red-400' : 'text-white'}`}>{formatRupiah(equity)}</div>
          </div>
          {/* Margin (Used) */}
          <div className="px-3 py-2.5" style={{ background: 'linear-gradient(135deg, rgba(8,15,30,0.95), rgba(12,26,46,0.95))' }}>
            <div className="flex items-center gap-1 mb-1">
              <Shield className="w-2.5 h-2.5 text-amber-400/50" />
              <span className="text-[6px] font-bold text-amber-300/40 uppercase tracking-wider">Margin</span>
            </div>
            <div className="text-[11px] font-black text-amber-400">{usedMargin > 0 ? formatRupiah(usedMargin) : 'Rp0'}</div>
          </div>
          {/* Free Margin */}
          <div className="px-3 py-2.5" style={{ background: 'linear-gradient(135deg, rgba(8,15,30,0.95), rgba(12,26,46,0.95))' }}>
            <div className="flex items-center gap-1 mb-1">
              <CreditCard className="w-2.5 h-2.5 text-blue-400/50" />
              <span className="text-[6px] font-bold text-blue-300/40 uppercase tracking-wider">Mrg Bebas</span>
            </div>
            <div className={`text-[11px] font-black ${freeMarginColor}`}>{formatRupiah(freeMargin)}</div>
          </div>
          {/* Margin Level */}
          <div className="px-3 py-2.5" style={{ background: 'linear-gradient(135deg, rgba(8,15,30,0.95), rgba(12,26,46,0.95))' }}>
            <div className="flex items-center gap-1 mb-1">
              <Zap className="w-2.5 h-2.5 text-blue-400/50" />
              <span className="text-[6px] font-bold text-blue-300/40 uppercase tracking-wider">Level Mrg</span>
            </div>
            <div className={`text-[11px] font-black`} style={{ color: activePos.length > 0 ? marginLevelColor : 'rgba(255,255,255,0.5)' }}>
              {usedMargin > 0 ? `${formatNumber(Math.round(marginLevel * 100) / 100)}%` : '—'}
            </div>
            {usedMargin > 0 && (
              <div className="w-full h-1 rounded-full bg-white/10 mt-1">
                <div className={`h-full rounded-full transition-all duration-700 ${marginLevelBg}`} style={{ width: `${Math.min(100, Math.max(0, marginLevel))}%` }} />
              </div>
            )}
          </div>
          {/* Modal Live */}
          <div className="px-3 py-2.5" style={{ background: 'linear-gradient(135deg, rgba(8,15,30,0.95), rgba(12,26,46,0.95))' }}>
            <div className="flex items-center gap-1 mb-1">
              <Target className="w-2.5 h-2.5 text-blue-400/50" />
              <span className="text-[6px] font-bold text-blue-300/40 uppercase tracking-wider">Modal Live</span>
            </div>
            <div className={`text-[11px] font-black ${liveModal > 0 ? (totalLivePL >= 0 ? 'text-green-400' : 'text-red-400') : 'text-white/50'}`}>
              {liveModal > 0 ? formatRupiah(liveModal) : '—'}
            </div>
          </div>
        </div>

        {/* Margin Level Warning Bar */}
        {activePos.length > 0 && marginLevel > 0 && marginLevel < 100 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="px-4 py-2 border-t border-white/[0.06] flex items-center gap-2"
            style={{ background: marginLevel < 50 ? 'rgba(220,38,38,0.15)' : 'rgba(245,158,11,0.1)' }}>
            <AlertCircle className={`w-3.5 h-3.5 ${marginLevel < 50 ? 'text-red-400 animate-pulse' : 'text-amber-400'}`} />
            <span className={`text-[8px] font-black uppercase ${marginLevel < 50 ? 'text-red-400' : 'text-amber-400'}`}>
              {marginLevel < 50 ? '⚠️ STOP OUT RISK! Modal hampir habis' : '⚠️ MARGIN CALL — Level Margin di bawah 100%'}
            </span>
          </motion.div>
        )}
      </div>

      {/* ════════ TRADING PERFORMANCE ════════ */}
      <div className="rounded-2xl overflow-hidden border border-[var(--zv-border)] bg-[var(--zv-surface)]">
        <div className="px-4 py-2.5 border-b border-[var(--zv-border)] flex items-center gap-2">
          <PieChart className="w-3.5 h-3.5 text-[#3b82f6]" />
          <span className="text-[9px] font-black text-[var(--zv-text)] uppercase tracking-wider">Performa Trading</span>
        </div>
        <div className="grid grid-cols-4 gap-px bg-[var(--zv-border)]/30">
          {/* Total Trades */}
          <div className="p-3 bg-[var(--zv-surface)] text-center">
            <div className="text-[7px] font-bold text-[var(--zv-muted)] uppercase mb-1">Trade</div>
            <div className="text-[16px] font-black text-[var(--zv-text)]">{totalTrades}</div>
          </div>
          {/* Win Rate */}
          <div className="p-3 bg-[var(--zv-surface)] text-center">
            <div className="text-[7px] font-bold text-[var(--zv-muted)] uppercase mb-1">Win Rate</div>
            <div className="relative mx-auto w-10 h-10">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="var(--zv-border)" strokeWidth="3" />
                <circle cx="18" cy="18" r="14" fill="none" stroke={winRate >= 50 ? '#22c55e' : '#ef5350'} strokeWidth="3"
                  strokeDasharray={`${winRate * 0.88} 88`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.8s ease' }} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-[8px] font-black ${winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>{winRate.toFixed(0)}%</span>
              </div>
            </div>
          </div>
          {/* Net P&L */}
          <div className="p-3 bg-[var(--zv-surface)] text-center">
            <div className="text-[7px] font-bold text-[var(--zv-muted)] uppercase mb-1">Total P&L</div>
            <div className={`text-[12px] font-black ${netPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {netPL >= 0 ? '+' : ''}{formatRupiah(netPL)}
            </div>
          </div>
          {/* Today P&L */}
          <div className="p-3 bg-[var(--zv-surface)] text-center">
            <div className="text-[7px] font-bold text-[var(--zv-muted)] uppercase mb-1">Hari Ini</div>
            <div className={`text-[12px] font-black ${todayPL >= 0 ? 'text-green-400' : todayPL < 0 ? 'text-red-400' : 'text-[var(--zv-muted)]'}`}>
              {todayPL !== 0 ? `${todayPL >= 0 ? '+' : ''}${formatRupiah(todayPL)}` : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* ════════ QUICK ACTION BUTTONS ════════ */}
      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => setActiveTab('sinyal')}
          className="h-10 rounded-xl flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#1d4ed8] to-[#3b82f6] text-white text-[9px] font-bold shadow-md shadow-blue-500/20 active:scale-[0.97] transition-transform border border-blue-400/20">
          <TrendingUp className="w-3.5 h-3.5" />
          Mulai Trading
        </button>
        <button onClick={() => setActiveTab('finance')}
          className="h-10 rounded-xl flex items-center justify-center gap-1.5 bg-[var(--zv-surface)] border border-[var(--zv-border)] text-[9px] font-bold text-green-400 hover:border-green-500/30 transition-all active:scale-[0.97]">
          <Plus className="w-3.5 h-3.5" />
          Deposit
        </button>
        <button onClick={() => setActiveTab('finance')}
          className="h-10 rounded-xl flex items-center justify-center gap-1.5 bg-[var(--zv-surface)] border border-[var(--zv-border)] text-[9px] font-bold text-red-400 hover:border-red-500/30 transition-all active:scale-[0.97]">
          <Minus className="w-3.5 h-3.5" />
          Withdraw
        </button>
      </div>

      {/* ════════ SUB-TAB: ORDER / POSISI / RIWAYAT ════════ */}
      <div className="flex gap-1">
        {(['order', 'posisi', 'riwayat'] as const).map(sub => (
          <button key={sub} onClick={() => setSaldoSubTab(sub)}
            className={`flex-1 h-9 rounded-xl text-[10px] font-bold transition-all border ${
              saldoSubTab === sub
                ? 'bg-gradient-to-r from-[#1e3a5f] to-[#1d4ed8] text-white border-[#3b82f6] shadow-md shadow-blue-500/20'
                : 'bg-[var(--zv-surface)] text-[var(--zv-muted)] border-[var(--zv-border)] hover:border-[#3b82f6]/30 hover:text-[var(--zv-text)]'
            }`}>
            {sub === 'order' ? '📋 Order' : sub === 'posisi' ? `Posisi (${activePos.length})` : `Riwayat (${closedPos.length})`}
          </button>
        ))}
      </div>

      {/* ════════ ORDER FORM — Full Trading Panel ════════ */}
      {saldoSubTab === 'order' && (
        <div className="rounded-2xl overflow-hidden border border-[var(--zv-border)]" style={{ background: 'linear-gradient(145deg, #080f1e 0%, #0c1a2e 25%, #162544 55%, #1e3a5f 100%)' }}>
          {/* Header */}
          <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-400" />
              <span className="text-[10px] font-black text-blue-300/80 uppercase tracking-widest">Open Position</span>
            </div>
            {selectedSinyalStock && (
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-black text-white">{selectedSinyalStock.code}</span>
                <span className={`text-[10px] font-bold ${selectedSinyalStock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatRupiah(sinyalCurrentPrice || selectedSinyalStock.price)}
                </span>
              </div>
            )}
          </div>

          <div className="p-4 space-y-3">
            {/* Instrument Selector */}
            <div>
              <label className="flex items-center gap-1.5 mb-1.5 text-[8px] font-bold text-blue-300/50 uppercase tracking-widest">
                <BarChart3 className="w-3 h-3" /> Instrument
              </label>
              {!selectedSinyalStock ? (
                <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                  {stocks.slice(0, 12).map(s => (
                    <button key={s.id} onClick={() => { setSelectedSinyalStock(s); setSinyalLots('0.01'); setSinyalAmount(''); setSinyalCandles([]); setSinyalCurrentPrice(0); sinyalChartSimRef.current = null }}
                      className="flex-shrink-0 h-8 px-3 rounded-lg text-[9px] font-bold border border-white/10 text-white/60 hover:border-blue-500/40 hover:text-blue-300 transition-all"
                      style={{ background: 'rgba(255,255,255,0.04)' }}>
                      {s.code}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-10 rounded-xl flex items-center justify-between px-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-black text-white">{selectedSinyalStock.code}</span>
                      <span className="text-[8px] text-blue-300/50">{selectedSinyalStock.name?.slice(0, 14)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-black tabular-nums" style={{ color: sinyalCurrentPrice >= (selectedSinyalStock.price) ? '#4ade80' : '#f87171' }}>
                        {formatRupiah(sinyalCurrentPrice || selectedSinyalStock.price)}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedSinyalStock(null)} className="h-10 w-10 rounded-xl grid place-items-center border border-white/10 text-white/40 hover:text-red-400 hover:border-red-500/30 transition-all" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Lot & Leverage Row */}
            <div className="grid grid-cols-2 gap-2">
              {/* Lot Size */}
              <div>
                <label className="flex items-center gap-1 mb-1 text-[8px] font-bold text-blue-300/50 uppercase tracking-widest">
                  <Package className="w-2.5 h-2.5" /> Lot Size
                </label>
                <div className="flex items-center rounded-xl overflow-hidden h-10" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <button onClick={() => { const cur = parseFloat(sinyalLots || '0'); const next = Math.max(0.01, cur - 0.01); setSinyalLots(next.toFixed(2)); setSinyalAmount(String(Math.round(next * LOT_SIZE))) }}
                    className="h-full w-10 flex items-center justify-center hover:bg-red-500/15 transition-all">
                    <Minus className="w-3 h-3 text-red-400/70" strokeWidth={2.5} />
                  </button>
                  <div className="flex-1 flex flex-col items-center justify-center" style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-[15px] font-black tabular-nums text-white leading-none">{sinyalLots}</span>
                    <span className="text-[6px] font-bold text-blue-300/40 uppercase tracking-widest mt-0.5">LOT</span>
                  </div>
                  <button onClick={() => { const cur = parseFloat(sinyalLots || '0'); const next = cur + 0.01; setSinyalLots(next.toFixed(2)); setSinyalAmount(String(Math.round(next * LOT_SIZE))) }}
                    className="h-full w-10 flex items-center justify-center hover:bg-green-500/15 transition-all">
                    <Plus className="w-3 h-3 text-green-400/70" strokeWidth={2.5} />
                  </button>
                </div>
                <div className="text-[7px] font-bold text-amber-400/50 mt-0.5 text-center">{formatRupiah(sinyalAmountFromLots)}</div>
              </div>
              {/* Leverage */}
              <div>
                <label className="flex items-center gap-1 mb-1 text-[8px] font-bold text-blue-300/50 uppercase tracking-widest">
                  <Zap className="w-2.5 h-2.5" /> Leverage
                </label>
                <div className="relative">
                  <button onClick={() => { setShowLeverageMenu(prev => !prev); setShowTimeframeMenu(false) }}
                    className="w-full h-10 rounded-xl flex items-center justify-between px-3 transition-all"
                    style={{ background: showLeverageMenu ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.05)', border: `1px solid ${showLeverageMenu ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.08)'}` }}>
                    <span className="text-[14px] font-black text-amber-400">1:{sinyalLeverage}</span>
                    <ChevronDown className={`w-3 h-3 text-amber-400/50 transition-transform ${showLeverageMenu ? 'rotate-180' : ''}`} />
                  </button>
                  {showLeverageMenu && (
                    <div className="absolute left-0 right-0 top-11 z-50 rounded-xl overflow-hidden py-0.5"
                      style={{ background: '#0c1a2e', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
                      {[100, 200, 300, 500, 1000].map(lev => (
                        <button key={lev} onClick={() => { setSinyalLeverage(lev); setShowLeverageMenu(false) }}
                          className={`w-full px-3 py-2 text-[11px] font-bold text-left transition-colors flex items-center justify-between ${
                            sinyalLeverage === lev ? 'text-amber-400 bg-amber-500/10' : 'text-white/60 hover:bg-white/5'
                          }`}>
                          <span>1:{lev}</span>
                          {sinyalLeverage === lev && <CheckCircle className="w-3 h-3 text-amber-400" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-[7px] font-bold text-blue-300/30 mt-0.5 text-center">Multiplier</div>
              </div>
            </div>

            {/* Stop Loss & Take Profit */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="flex items-center gap-1 mb-1 text-[8px] font-bold text-red-300/50 uppercase tracking-widest">
                  <AlertCircle className="w-2.5 h-2.5" /> Stop Loss
                </label>
                <div className="relative">
                  <input type="number" value={stopLossPrice} onChange={(e) => setStopLossPrice(e.target.value)} placeholder="Opsional"
                    className="w-full h-10 rounded-xl px-3 pr-10 text-[12px] font-bold text-red-300 placeholder:text-red-300/20 outline-none transition-all focus:border-red-500/30"
                    style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }} />
                  {stopLossPrice && (
                    <button onClick={() => setStopLossPrice('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                      <X className="w-3 h-3 text-red-400/40" />
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="flex items-center gap-1 mb-1 text-[8px] font-bold text-green-300/50 uppercase tracking-widest">
                  <Target className="w-2.5 h-2.5" /> Take Profit
                </label>
                <div className="relative">
                  <input type="number" value={takeProfitPrice} onChange={(e) => setTakeProfitPrice(e.target.value)} placeholder="Opsional"
                    className="w-full h-10 rounded-xl px-3 pr-10 text-[12px] font-bold text-green-300 placeholder:text-green-300/20 outline-none transition-all focus:border-green-500/30"
                    style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.12)' }} />
                  {takeProfitPrice && (
                    <button onClick={() => setTakeProfitPrice('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                      <X className="w-3 h-3 text-green-400/40" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Spread Info */}
            {selectedSinyalStock && (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-3">
                  <div>
                    <div className="text-[6px] font-bold text-blue-300/30 uppercase">Bid</div>
                    <div className="text-[10px] font-black text-red-400 tabular-nums">{sinyalCurrentPrice > 0 ? fmtPrice5(bidPrice) : '—'}</div>
                  </div>
                  <div className="text-[7px] font-bold text-blue-300/20">|</div>
                  <div>
                    <div className="text-[6px] font-bold text-blue-300/30 uppercase">Ask</div>
                    <div className="text-[10px] font-black text-green-400 tabular-nums">{sinyalCurrentPrice > 0 ? fmtPrice5(askPrice) : '—'}</div>
                  </div>
                  <div className="text-[7px] font-bold text-blue-300/20">|</div>
                  <div>
                    <div className="text-[6px] font-bold text-blue-300/30 uppercase">Spread</div>
                    <div className="text-[10px] font-black text-amber-400/70 tabular-nums">{sinyalCurrentPrice > 0 ? spreadValue.toFixed(1) : '—'}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[6px] font-bold text-blue-300/30 uppercase">Free Margin</div>
                  <div className={`text-[10px] font-black tabular-nums ${freeMargin >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>{formatRupiah(freeMargin)}</div>
                </div>
              </div>
            )}

            {/* BUY / SELL Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  if (!selectedSinyalStock) { toast({ title: 'Pilih instrument', variant: 'destructive' }); return }
                  if (sinyalAmountFromLots < 1000) { toast({ title: 'Minimum 0.01 Lot (Rp 1.000)', variant: 'destructive' }); return }
                  if (sinyalAmountFromLots > freeMargin) { toast({ title: 'Free Margin tidak cukup', variant: 'destructive' }); return }
                  setConfirmTradeDir('TURUN')
                  setShowConfirmTrade(true)
                }}
                className="relative rounded-xl flex flex-col items-center justify-center transition-all overflow-hidden active:scale-[0.97] h-[56px]"
                style={{ background: 'linear-gradient(135deg, #ef5350, #dc2626, #b91c1c)', boxShadow: '0 4px 20px rgba(239,68,68,0.4)' }}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                <div className="relative flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-white/80" />
                  <span className="text-[18px] font-black tracking-[0.25em] text-white">SELL</span>
                </div>
                <span className="text-[9px] font-bold tabular-nums text-white/50 mt-0.5 relative">{sinyalCurrentPrice > 0 ? fmtPrice5(bidPrice) : '—'}</span>
              </button>
              <button
                onClick={() => {
                  if (!selectedSinyalStock) { toast({ title: 'Pilih instrument', variant: 'destructive' }); return }
                  if (sinyalAmountFromLots < 1000) { toast({ title: 'Minimum 0.01 Lot (Rp 1.000)', variant: 'destructive' }); return }
                  if (sinyalAmountFromLots > freeMargin) { toast({ title: 'Free Margin tidak cukup', variant: 'destructive' }); return }
                  setConfirmTradeDir('NAIK')
                  setShowConfirmTrade(true)
                }}
                className="relative rounded-xl flex flex-col items-center justify-center transition-all overflow-hidden active:scale-[0.97] h-[56px]"
                style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a, #15803d)', boxShadow: '0 4px 20px rgba(34,197,94,0.4)' }}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                <div className="relative flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-white/80" />
                  <span className="text-[18px] font-black tracking-[0.25em] text-white">BUY</span>
                </div>
                <span className="text-[9px] font-bold tabular-nums text-white/50 mt-0.5 relative">{sinyalCurrentPrice > 0 ? fmtPrice5(askPrice) : '—'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════ ACTIVE POSITIONS — Premium MT5 Cards ════════ */}
      {saldoSubTab === 'posisi' && (
        <>
          {activePos.length === 0 ? (
            <div className="rounded-2xl p-8 bg-[var(--zv-surface)] border border-[var(--zv-border)] text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="w-7 h-7 text-blue-400/40" />
              </div>
              <p className="text-[12px] font-bold text-[var(--zv-text)] mb-1">Belum Ada Posisi Aktif</p>
              <p className="text-[9px] text-[var(--zv-muted)] mb-3">Buka posisi di tab Trade untuk mulai trading</p>
              <button onClick={() => setActiveTab('sinyal')} className="h-10 px-8 rounded-xl bg-gradient-to-r from-[#1d4ed8] to-[#3b82f6] text-white text-[11px] font-bold shadow-lg shadow-blue-500/25 active:scale-[0.97] transition-transform">
                Mulai Trading →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Total Floating P&L Summary Bar */}
              <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl border ${totalLivePL >= 0 ? 'bg-green-500/8 border-green-500/15' : 'bg-red-500/8 border-red-500/15'}`}>
                <div className="flex items-center gap-2">
                  <Zap className={`w-4 h-4 ${totalLivePL >= 0 ? 'text-green-400' : 'text-red-400'} animate-pulse`} />
                  <span className="text-[9px] font-black text-[var(--zv-muted)] uppercase">Total Floating P&L</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[14px] font-black ${totalLivePL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {totalLivePL >= 0 ? '+' : ''}{formatRupiah(totalLivePL)}
                  </span>
                  {activePos.length > 1 && (
                    <button onClick={() => activePos.forEach(p => closeSinyalPosition(p.id))}
                      className="relative h-7 px-3 rounded-lg overflow-hidden text-[7px] font-black text-white transition-all active:scale-[0.95]"
                      style={{ background: 'linear-gradient(180deg, #f87171 0%, #ef5350 50%, #dc2626 100%)', boxShadow: '0 2px 8px rgba(239,83,80,0.3)' }}>
                      CLOSE ALL
                    </button>
                  )}
                </div>
              </div>

              {/* Position Cards */}
              {activePos.map(ap => {
                const isUp = ap.direction === 'NAIK'
                const livePL = getPositionLivePL(ap)
                const currentPrice = sinyalCurrentPrice || sinyalChartSimRef.current?.price || ap.startPrice
                const lots = (ap.amount / LOT_SIZE).toFixed(2)
                const elapsed = sinyalTimers[ap.id] ?? 0
                const mins = Math.floor(elapsed / 60)
                const secs = elapsed % 60
                const elapsedLabel = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
                const modalLive = ap.amount + livePL
                return (
                  <motion.div key={ap.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl overflow-hidden border"
                    style={{ borderColor: isUp ? 'rgba(34,197,94,0.2)' : 'rgba(239,83,80,0.2)', background: 'var(--zv-surface)' }}>
                    {/* Gradient border top */}
                    <div className={`h-0.5 ${isUp ? 'bg-gradient-to-r from-green-500 via-green-400 to-green-500' : 'bg-gradient-to-r from-red-500 via-red-400 to-red-500'}`} />
                    <div className="px-3.5 py-3">
                      {/* Row 1: Stock + Direction + Leverage */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-black text-[var(--zv-text)]">{ap.stockCode}</span>
                          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[8px] font-black text-white ${isUp ? '' : ''}`}
                            style={isUp
                              ? { background: 'linear-gradient(180deg, #4ade80, #22c55e)', boxShadow: '0 2px 6px rgba(34,197,94,0.3)' }
                              : { background: 'linear-gradient(180deg, #f87171, #ef5350)', boxShadow: '0 2px 6px rgba(239,83,80,0.3)' }}>
                            {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                            {isUp ? 'BUY' : 'SELL'}
                          </span>
                          <span className="text-[8px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/15">1:{ap.leverage || 1000}</span>
                        </div>
                        <button onClick={() => closeSinyalPosition(ap.id)}
                          className="relative h-7 px-3 rounded-lg overflow-hidden text-[8px] font-black text-white transition-all active:scale-[0.95]"
                          style={{ background: 'linear-gradient(180deg, #f87171 0%, #ef5350 50%, #dc2626 100%)', boxShadow: '0 2px 8px rgba(239,83,80,0.3)' }}>
                          ✕ Tutup
                        </button>
                      </div>
                      {/* Row 2: Stats Grid */}
                      <div className="grid grid-cols-4 gap-2 mb-2">
                        <div>
                          <div className="text-[6px] font-bold text-[var(--zv-muted)] uppercase">Lot</div>
                          <div className="text-[10px] font-black text-[var(--zv-text)]">{lots}</div>
                        </div>
                        <div>
                          <div className="text-[6px] font-bold text-[var(--zv-muted)] uppercase">Entry</div>
                          <div className="text-[10px] font-black text-[var(--zv-text)]">{formatNumber(ap.startPrice)}</div>
                        </div>
                        <div>
                          <div className="text-[6px] font-bold text-[var(--zv-muted)] uppercase">Current</div>
                          <div className={`text-[10px] font-black ${livePL >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatNumber(currentPrice)}</div>
                        </div>
                        <div>
                          <div className="text-[6px] font-bold text-[var(--zv-muted)] uppercase">Modal Live</div>
                          <div className={`text-[10px] font-black ${modalLive >= ap.amount ? 'text-green-400' : 'text-red-400'}`}>{formatRupiah(modalLive)}</div>
                        </div>
                      </div>
                      {/* Row 3: P&L + Elapsed Time */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {/* Elapsed time */}
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-blue-400" />
                            <span className="text-[8px] font-black text-blue-400 tabular-nums">{elapsedLabel}</span>
                            <span className="text-[7px] font-bold text-[var(--zv-muted)]">terbuka</span>
                          </div>
                        </div>
                        {/* P&L */}
                        <div className={`text-[14px] font-black ${livePL >= 0 ? 'text-green-400' : 'text-red-400'}`}
                          style={{ textShadow: `0 0 12px ${livePL >= 0 ? 'rgba(34,197,94,0.2)' : 'rgba(239,83,80,0.2)'}` }}>
                          {livePL >= 0 ? '+' : ''}{formatRupiah(livePL)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ════════ CLOSED POSITIONS HISTORY ════════ */}
      {saldoSubTab === 'riwayat' && (
        <>
          {closedPos.length === 0 ? (
            <div className="rounded-2xl p-8 bg-[var(--zv-surface)] border border-[var(--zv-border)] text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center mx-auto mb-3">
                <History className="w-7 h-7 text-blue-400/40" />
              </div>
              <p className="text-[12px] font-bold text-[var(--zv-text)] mb-1">Belum Ada Riwayat</p>
              <p className="text-[9px] text-[var(--zv-muted)]">Riwayat trading akan muncul setelah posisi ditutup</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Summary bar */}
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[var(--zv-surface)] border border-[var(--zv-border)]">
                <div className="flex items-center gap-3">
                  <span className="text-[8px] font-bold text-green-400">{wonCount} Win</span>
                  <span className="text-[8px] font-bold text-red-400">{lostCount} Loss</span>
                </div>
                <span className={`text-[10px] font-black ${netPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  Net: {netPL >= 0 ? '+' : ''}{formatRupiah(netPL)}
                </span>
              </div>
              {/* Filter buttons */}
              <div className="flex gap-1">
                {['Semua', 'Profit', 'Loss'].map(filter => (
                  <button key={filter} onClick={() => setSinyalHistoryFilter(filter)}
                    className={`h-7 px-3 rounded-lg text-[8px] font-bold transition-all border ${
                      sinyalHistoryFilter === filter
                        ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                        : 'text-[var(--zv-muted)] border-[var(--zv-border)] bg-[var(--zv-surface)] hover:text-[var(--zv-text)]'
                    }`}>
                    {filter}
                  </button>
                ))}
              </div>
              <div className="max-h-96 overflow-y-auto space-y-1.5 pr-0.5" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(59,130,246,0.2) transparent' }}>
                {closedPos.slice(-30).reverse().filter(cp => {
                  if (sinyalHistoryFilter === 'Profit') return cp.status === 'won'
                  if (sinyalHistoryFilter === 'Loss') return cp.status === 'lost'
                  return true
                }).map(cp => {
                  const isWon = cp.status === 'won'
                  const isUp = cp.direction === 'NAIK'
                  const plAmt = cp.closedPL !== undefined ? cp.closedPL : (isWon ? Math.round(cp.amount * cp.profitPercent / 100) : -cp.amount)
                  const lots = (cp.amount / LOT_SIZE).toFixed(2)
                  const tradeDate = new Date(cp.startTime)
                  const dateStr = `${tradeDate.getDate()}/${tradeDate.getMonth() + 1} ${tradeDate.getHours().toString().padStart(2, '0')}:${tradeDate.getMinutes().toString().padStart(2, '0')}`
                  return (
                    <div key={cp.id} className={`rounded-xl overflow-hidden border ${isWon ? 'border-green-500/15' : 'border-red-500/15'}`} style={{ background: 'var(--zv-surface)' }}>
                      <div className={`h-0.5 ${isWon ? 'bg-gradient-to-r from-green-500 via-green-400 to-green-500' : 'bg-gradient-to-r from-red-500 via-red-400 to-red-500'}`} />
                      <div className="px-3 py-2.5">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            {isWon ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                            <span className="text-[11px] font-black text-[var(--zv-text)]">{cp.stockCode}</span>
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${isUp ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{isUp ? 'Buy' : 'Sell'}</span>
                            <span className="text-[7px] font-bold text-amber-400">{lots} lot</span>
                            <span className="text-[7px] font-bold text-[var(--zv-muted)]">1:{cp.leverage || 1000}</span>
                          </div>
                          <span className="text-[7px] font-bold text-[var(--zv-muted)]">{dateStr}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-[7px] text-[var(--zv-muted)]">
                            Vol {formatRupiah(cp.amount)}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className={`text-[11px] font-black ${isWon ? 'text-green-400' : 'text-red-400'}`}>
                                {isWon ? '+' : ''}{formatRupiah(plAmt)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
          </>
        )
      })()}
    </motion.div>

  )

}
