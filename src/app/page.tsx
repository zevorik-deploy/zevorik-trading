'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/lib/store'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wallet, BarChart3, Briefcase, History, LogOut, RefreshCw,
  X, Bell, Home as HomeIcon, User,
  Shield, CreditCard, Target, Activity, Menu,
  Sun, Moon,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { formatRupiah, formatNumber, formatPercent, formatDateTime, type Stock } from '@/lib/trading-utils'
import { useDashboardStore, sinyalChartSimRef as sharedChartSimRef, sinyalPositionsRef as sharedPositionsRef, sinyalChartOffsetRef as sharedChartOffsetRef, sinyalChartZoomRef as sharedChartZoomRef, sparklineCache, sparklineSimRef, ihsgChartRef, liveChartRef } from '@/lib/dashboard-store'
import { ZevorikLogo } from '@/components/ZevorikLogo'
import { LoginPage } from '@/components/LoginPage'
import { HomeTab } from '@/components/dashboard/HomeTab'
import { MarketTab } from '@/components/dashboard/MarketTab'
import { PortfolioTab } from '@/components/dashboard/PortfolioTab'
import { HistoryTab } from '@/components/dashboard/HistoryTab'
import { ProfileTab } from '@/components/dashboard/ProfileTab'
import { SinyalTab } from '@/components/dashboard/SinyalTab'
import { FinanceTab } from '@/components/dashboard/FinanceTab'
import { SaldoTab } from '@/components/dashboard/SaldoTab'
import { TradeConfirmModal } from '@/components/dashboard/TradeConfirmModal'
import { StockDetailModal } from '@/components/dashboard/modals/StockDetailModal'
import { KycModal } from '@/components/dashboard/modals/KycModal'
import { CsModal } from '@/components/dashboard/modals/CsModal'
import { AboutModal } from '@/components/dashboard/modals/AboutModal'
import { HelpModal } from '@/components/dashboard/modals/HelpModal'


// ============================================
// MAIN DASHBOARD
// ============================================
function Dashboard() {
  const { user, logout } = useAuthStore()
  const store = useDashboardStore()
  const {
    stocks, indices, notifications,
    activeTab, selectedStock, showStockDetail,
    refreshing, showNotifPanel,
    contractModal, contractAmount, contractDuration, contractLoading, contractClaimLoadingId,
    showSideMenu, showBalance, theme,
    sinyalPositions, selectedSinyalStock,
    sinyalCandles, sinyalCurrentPrice,
    ihsgChartData,
    // Setters
    setStocks, setActiveTab, setSelectedStock, setShowStockDetail,
    setRefreshing, setShowNotifPanel,
    setContractModal, setContractAmount, setContractDuration, setContractLoading,
    setContractClaimLoadingId,
    setShowSideMenu,
    setIhsgChartData,
    setSinyalCurrentPrice,
    setLiveBuyChart, setLiveSellChart, setLiveBuyPrice, setLiveSellPrice, setLiveChartActive,
    setQrisImageUrl,
    // Actions
    fetchStocks, fetchPortfolio, fetchTransactions, fetchIndices, fetchNotifications,
    fetchWatchlist, fetchDeposits, fetchWithdrawals, fetchPriceHistory, fetchKycStatus,
    refreshAll,
    handleContract, handleContractClaim,
    toggleWatchlist, markNotifRead,
    getPositionLivePL,
    toggleTheme,
  } = store

  const initialized = useRef(false)
  const stocksRef = useRef<Stock[]>([])
  const MAX_CHART_POINTS = 60

  // Keep refs in sync with store
  useEffect(() => { stocksRef.current = stocks }, [stocks])

  // Theme
  useEffect(() => { document.documentElement.className = theme }, [theme])

  // Sync sinyal positions to shared ref
  useEffect(() => { sharedPositionsRef.current = sinyalPositions }, [sinyalPositions])
  useEffect(() => { sharedChartOffsetRef.current = store.sinyalChartOffset }, [store.sinyalChartOffset])
  useEffect(() => { sharedChartZoomRef.current = store.sinyalChartZoom }, [store.sinyalChartZoom])

  // IHSG chart initialization
  useEffect(() => {
    const ihsgIdx = indices.find(idx => idx.code === 'IHSG') || indices[0]
    if (!ihsgIdx || ihsgChartRef.initialized) return
    ihsgChartRef.initialized = true
    const baseVal = ihsgIdx.value
    ihsgChartRef.baseVal = baseVal
    const isUp = ihsgIdx.changePercent >= 0
    const pts: {idx: number; value: number}[] = []
    let val = baseVal * (1 + (isUp ? -0.005 : 0.005))
    let momentum = 0
    for (let i = 0; i < 50; i++) {
      const dir = Math.random() > 0.5 ? 1 : -1
      const minStep = Math.max(1, baseVal * 0.0005)
      const stepSize = minStep * (0.8 + Math.random() * 1.2)
      const bias = (isUp ? 1 : -1) * baseVal * 0.00005
      momentum = momentum * 0.25 + dir * stepSize + bias
      val += momentum
      val += (baseVal - val) * 0.005
      pts.push({ idx: i, value: Math.round(val) })
    }
    pts.push({ idx: 50, value: baseVal })
    setIhsgChartData(pts)
    ihsgChartRef.val = baseVal
  }, [indices, setIhsgChartData])

  // IHSG live update
  useEffect(() => {
    let ihsgMomentum = 0
    const interval = setInterval(() => {
      const ref = ihsgChartRef
      if (!ref.initialized) return
      const dir = Math.random() > 0.5 ? 1 : -1
      const stepSize = ref.baseVal * (0.0004 + Math.random() * 0.001)
      ihsgMomentum = ihsgMomentum * 0.25 + dir * stepSize
      ref.val += ihsgMomentum
      ref.val += (ref.baseVal - ref.val) * 0.004
      setIhsgChartData(prev => {
        if (prev.length === 0) return prev
        const nextIdx = prev[prev.length - 1].idx + 1
        const next = [...prev, { idx: nextIdx, value: Math.round(ref.val) }]
        return next.length > 60 ? next.slice(-60) : next
      })
    }, 2500)
    return () => clearInterval(interval)
  }, [setIhsgChartData])

  // Live sparkline update
  useEffect(() => {
    const interval = setInterval(() => {
      const currentStocks = stocksRef.current
      if (currentStocks.length === 0) return
      currentStocks.forEach(s => {
        const sim = sparklineSimRef.get(s.id)
        const cached = sparklineCache.get(s.id)
        if (!sim || !cached) return
        const dir = Math.random() > 0.5 ? 1 : -1
        const minStep = Math.max(1, s.price * 0.001)
        const stepSize = minStep * (0.5 + Math.random() * 1)
        sim.momentum = sim.momentum * 0.25 + dir * stepSize
        sim.val += sim.momentum
        const reversionStrength = 0.008 + Math.abs(s.price - sim.val) / s.price * 0.08
        sim.val += (s.price - sim.val) * Math.min(reversionStrength, 0.04)
        const newPts = cached.slice(1).map((pt, idx) => ({ i: idx, p: pt.p }))
        newPts.push({ i: cached.length - 1, p: Math.round(sim.val) })
        sparklineCache.set(s.id, newPts)
      })
      setStocks(prev => [...prev])
    }, 2500)
    return () => clearInterval(interval)
  }, [setStocks])

  // Live price simulation for stock detail
  useEffect(() => {
    if (!selectedStock || !showStockDetail) {
      setLiveChartActive(false)
      return
    }
    const basePrice = selectedStock.price
    const spread = basePrice * 0.002
    let buyPrice = basePrice - spread / 2
    let sellPrice = basePrice + spread / 2
    let momentum = 0
    let phase = 0
    const initialBuy: {time: string; price: number}[] = []
    const initialSell: {time: string; price: number}[] = []
    let tempBuy = buyPrice
    let tempSell = sellPrice
    let histMomentum = 0
    for (let i = 40; i >= 1; i--) {
      const dir = Math.random() > 0.5 ? 1 : -1
      const minStep = Math.max(1, basePrice * 0.001)
      const stepSize = minStep * (0.8 + Math.random() * 1.2)
      histMomentum = histMomentum * 0.25 + dir * stepSize
      const mid = (tempBuy + tempSell) / 2 + histMomentum
      tempBuy = mid - spread / 2
      tempSell = mid + spread / 2
      tempBuy += (basePrice - tempBuy) * 0.005
      tempSell += (basePrice - tempSell) * 0.005
      const now = Date.now() - i * 2000
      const timeStr = new Date(now).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit', second: '2-digit'})
      initialBuy.push({time: timeStr, price: Math.round(tempBuy)})
      initialSell.push({time: timeStr, price: Math.round(tempSell)})
    }
    buyPrice = tempBuy
    sellPrice = tempSell
    setLiveBuyChart(initialBuy)
    setLiveSellChart(initialSell)
    setLiveBuyPrice(Math.round(buyPrice))
    setLiveSellPrice(Math.round(sellPrice))
    liveChartRef.buyPrice = buyPrice
    liveChartRef.sellPrice = sellPrice
    liveChartRef.trend = 0
    liveChartRef.momentum = 0
    liveChartRef.phase = phase
    setLiveChartActive(true)
    const interval = setInterval(() => {
      phase++
      const dir = Math.random() > 0.5 ? 1 : -1
      const minStep = Math.max(1, basePrice * 0.0008)
      const stepSize = minStep * (0.5 + Math.random() * 1)
      momentum = momentum * 0.25 + dir * stepSize
      const mid = (buyPrice + sellPrice) / 2 + momentum
      buyPrice = mid - spread / 2
      sellPrice = mid + spread / 2
      if (sellPrice <= buyPrice) sellPrice = buyPrice + spread
      buyPrice += (basePrice - buyPrice) * 0.003
      sellPrice += (basePrice - sellPrice) * 0.003
      liveChartRef.buyPrice = buyPrice
      liveChartRef.sellPrice = sellPrice
      liveChartRef.momentum = momentum
      liveChartRef.phase = phase
      const now = new Date()
      const timeStr = now.toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit', second: '2-digit'})
      setLiveBuyChart(prev => { const next = [...prev, {time: timeStr, price: Math.round(buyPrice)}]; return next.length > MAX_CHART_POINTS ? next.slice(-MAX_CHART_POINTS) : next })
      setLiveSellChart(prev => { const next = [...prev, {time: timeStr, price: Math.round(sellPrice)}]; return next.length > MAX_CHART_POINTS ? next.slice(-MAX_CHART_POINTS) : next })
      setLiveBuyPrice(Math.round(buyPrice))
      setLiveSellPrice(Math.round(sellPrice))
    }, 2000)
    return () => { clearInterval(interval); setLiveChartActive(false) }
  }, [selectedStock, showStockDetail, setLiveBuyChart, setLiveSellChart, setLiveBuyPrice, setLiveSellPrice, setLiveChartActive])

  // Background price ticker (when NOT on sinyal tab)
  useEffect(() => {
    if (activeTab === 'sinyal' || !selectedSinyalStock) return
    const activePositions = sharedPositionsRef.current.filter(p => p.status === 'active')
    if (activePositions.length === 0) return
    const tickIntervalMs = 1000
    const interval = setInterval(() => {
      if (sharedChartSimRef) {
        const sim = sharedChartSimRef
        sim.momentum += (Math.random() - 0.5) * sim.vol * 0.002
        sim.momentum *= 0.95
        sim.trend = Math.sin(sim.phase / sim.phaseLen * Math.PI * 2) * 0.4
        sim.phase += 0.02
        sim.price += sim.momentum + sim.trend * sim.vol * 0.0003 + (Math.random() - 0.5) * sim.vol * 0.0008
        if (sim.price < sim.basePrice * 0.7) sim.price = sim.basePrice * 0.7 + Math.random() * sim.vol * 0.5
        if (sim.price > sim.basePrice * 1.5) sim.price = sim.basePrice * 1.5 - Math.random() * sim.vol * 0.5
        setSinyalCurrentPrice(sim.price)
      } else if (selectedSinyalStock) {
        setSinyalCurrentPrice(prev => {
          const basePrice = selectedSinyalStock.price
          const currentPrice = prev || basePrice
          const vol = basePrice * 0.0005
          const change = (Math.random() - 0.5) * vol * 2
          return currentPrice + change
        })
      }
    }, tickIntervalMs)
    return () => clearInterval(interval)
  }, [activeTab, selectedSinyalStock, sinyalPositions, setSinyalCurrentPrice])

  // Initial data fetch
  useEffect(() => {
    if (!user) return
    if (!initialized.current) { initialized.current = true }
    fetchStocks(); fetchPortfolio(); fetchTransactions(); fetchIndices()
    fetchNotifications(); fetchWatchlist(); fetchDeposits()
    fetchWithdrawals()
    fetch('/api/qris').then(r => r.json()).then(d => { if (d?.url) setQrisImageUrl(d.url) }).catch(() => {})
  }, [user, fetchStocks, fetchPortfolio, fetchTransactions, fetchIndices, fetchNotifications, fetchWatchlist, fetchDeposits, fetchWithdrawals, setQrisImageUrl])

  // Periodic refresh
  useEffect(() => { const iv = setInterval(refreshAll, 30000); return () => clearInterval(iv) }, [refreshAll])

  // Derived values
  const unreadNotif = notifications.filter(n => !n.isRead).length

  // ============ RENDER ============
  return (
    <div className="min-h-screen flex flex-col md:pl-[72px] lg:pl-[80px]" style={{ background: 'var(--zv-bg)' }}>
      {/* Top Header */}
      <header className="sticky top-0 z-40 glass-header border-b border-[var(--zv-border)]">
        <div className="max-w-7xl mx-auto px-3 md:px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button onClick={() => setShowSideMenu(true)} className="w-9 h-9 rounded-xl bg-[var(--zv-surface)] border border-[var(--zv-border)] grid place-items-center hover:bg-[var(--zv-border)] transition-colors">
              <Menu className="w-4 h-4 text-[var(--zv-muted)]" />
            </button>
            <ZevorikLogo size={36} className="flex-shrink-0" />
            <div>
              <b className="block text-[13px] md:text-base font-black gradient-text leading-tight">ZEVORIK</b>
              <span className="block text-[7px] md:text-[8px] font-bold text-[var(--zv-muted)] uppercase tracking-[0.2em]">Investment Platform</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-px h-6 bg-[var(--zv-border)] mx-1" />
            <button onClick={toggleTheme} className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--zv-surface)] to-[var(--zv-panel)] border border-[var(--zv-border)] grid place-items-center hover:bg-[var(--zv-hover)] hover:scale-105 transition-all shadow-sm">
              {theme === 'dark' ? <Sun className="w-4 h-4 text-[var(--zv-gold)]" /> : <Moon className="w-4 h-4 text-[var(--zv-muted)]" />}
            </button>
            <button onClick={refreshAll} className="w-9 h-9 rounded-xl bg-[var(--zv-surface)] border border-[var(--zv-border)] grid place-items-center hover:bg-[var(--zv-border)] transition-colors">
              <RefreshCw className={`w-4 h-4 text-[var(--zv-muted)] ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => { setShowNotifPanel(true); markNotifRead() }} className="w-9 h-9 rounded-xl bg-[var(--zv-surface)] border border-[var(--zv-border)] grid place-items-center hover:bg-[var(--zv-border)] transition-colors relative">
              <Bell className="w-4 h-4 text-[var(--zv-muted)]" />
              {unreadNotif > 0 && <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-gradient-to-r from-red-500 to-red-600 text-[7px] text-white font-black grid place-items-center shadow-lg shadow-red-500/30">{unreadNotif > 9 ? '9+' : unreadNotif}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* Market Indices Bar */}
      {indices.length > 0 && (
        <div className="border-b border-[var(--zv-border)] overflow-x-auto" style={{ background: 'var(--zv-panel)' }}>
          <div className="max-w-7xl mx-auto flex gap-3 px-3 md:px-6 py-2">
            {indices.map(idx => (
              <div key={idx.id} className="flex-shrink-0 flex items-center gap-1.5 bg-[var(--zv-surface)] rounded-lg px-2.5 py-1 border border-[var(--zv-border)]">
                <span className="text-[8px] md:text-[10px] font-black text-[var(--zv-muted)]">{idx.code}</span>
                <span className="text-[10px] md:text-[11px] font-black text-[var(--zv-text)] tabular-nums">{formatNumber(idx.value)}</span>
                <span className={`text-[8px] md:text-[10px] font-black ${idx.changePercent >= 0 ? 'text-[#22c55e]' : 'text-[#ef5350]'}`}>{formatPercent(idx.changePercent)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 md:px-6 py-4 pb-24 md:pb-6">
        <AnimatePresence mode="wait">
          {/* ====== HOME TAB ====== */}
          {activeTab === 'home' && <HomeTab />}

          {/* ====== MARKET TAB ====== */}
          {activeTab === 'market' && <MarketTab />}

          {/* ====== PORTFOLIO TAB ====== */}
          {activeTab === 'portfolio' && <PortfolioTab />}

          {/* ====== TRADING TAB - MT5 EXACT LAYOUT ====== */}
          {activeTab === 'sinyal' && <SinyalTab />}
          {/* ====== SALDO LIVE TAB — MT5-Style Premium Dashboard ====== */}
          {activeTab === 'saldo' && <SaldoTab />}
          {/* ====== FINANCE TAB ====== */}
          {activeTab === 'finance' && <FinanceTab />}
          {/* ====== HISTORY TAB ====== */}
          {activeTab === 'history' && <HistoryTab />}

          {/* ====== PROFILE TAB ====== */}
          {activeTab === 'profil' && <ProfileTab />}

        </AnimatePresence>
      </main>

      {/* Trade Confirmation Modal */}
      <TradeConfirmModal />

      {/* Contract Modal */}
      <AnimatePresence>
        {contractModal && selectedStock && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50" onClick={() => setContractModal(false)} />
            <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25 }} className="fixed z-50 bottom-0 left-0 right-0 md:inset-0 md:bottom-auto md:left-auto md:right-auto md:top-auto md:flex md:items-center md:justify-center max-h-[85vh] md:max-h-[90vh] bg-[var(--zv-panel)] rounded-t-3xl md:rounded-3xl border border-[var(--zv-border)] overflow-y-auto custom-scrollbar md:w-[90vw] md:max-w-lg md:mx-auto md:my-auto">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[14px] font-black text-[var(--zv-text)]">Kontrak Saham</h3>
                  <button onClick={() => setContractModal(false)} className="w-8 h-8 rounded-lg grid place-items-center hover:bg-[var(--zv-surface)] text-[var(--zv-muted)] hover:text-[var(--zv-text)]"><X className="w-4 h-4" /></button>
                </div>
                <div className="mb-3 p-3 rounded-xl bg-[var(--zv-surface)] border border-[var(--zv-border)]">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#3b82f6]" />
                    <div>
                      <span className="block text-[12px] font-black text-[var(--zv-text)]">{selectedStock.code}</span>
                      <span className="block text-[9px] text-[var(--zv-muted)]">{selectedStock.name}</span>
                    </div>
                    <span className="ml-auto text-[14px] font-black text-[var(--zv-text)] tabular-nums">{formatRupiah(selectedStock.price)}</span>
                  </div>
                </div>
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-[9px] font-bold text-[var(--zv-muted)] mb-1">Jumlah Investasi (Rp)</label>
                    <input type="number" value={contractAmount} onChange={e => setContractAmount(e.target.value)} placeholder="Min. Rp 100.000" className="w-full h-10 rounded-xl bg-[var(--zv-surface)] border border-[var(--zv-border)] px-3 text-[12px] font-semibold text-[var(--zv-text)] outline-none focus:border-[#3b82f6] transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-[var(--zv-muted)] mb-1">Durasi (hari): {contractDuration}</label>
                    <input type="range" min={30} max={365} value={contractDuration} onChange={e => setContractDuration(parseInt(e.target.value))} className="w-full accent-[#3b82f6]" />
                    <div className="flex justify-between text-[7px] text-[var(--zv-muted)] mt-0.5"><span>30 hari</span><span>365 hari</span></div>
                  </div>
                </div>
                <button onClick={() => handleContract()} disabled={contractLoading} className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white text-[12px] font-bold hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
                  {contractLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                  {contractLoading ? 'Memproses...' : 'Beli Kontrak'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Stock Detail Modal */}
      <StockDetailModal />

      {/* KYC Verification Modal */}
      <KycModal />

      {/* Customer Service Modal */}
      <CsModal />

      {/* About Company Modal */}
      <AboutModal />

      {/* Help / FAQ Modal */}
      <HelpModal />

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--zv-border)] md:hidden bottom-nav-safe glass-header">
        <div className="max-w-7xl mx-auto flex">
          {[
            { key: 'home', label: 'Beranda', icon: HomeIcon },
            { key: 'market', label: 'Quote', icon: BarChart3 },
            { key: 'sinyal', label: 'Chart', icon: Activity },
            { key: 'saldo', label: 'Trade', icon: Wallet },
            { key: 'profil', label: 'Profil', icon: User },
          ].map(tab => {
            const isActive = activeTab === tab.key
            return (
              <button key={tab.key} onClick={() => {
                setActiveTab(tab.key)
              }} className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-all relative ${isActive ? 'text-[#3b82f6]' : 'text-[var(--zv-muted)] opacity-70 hover:opacity-100 hover:text-[var(--zv-text)]'}`}>
                {isActive && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[3px] rounded-b-full" style={{ background: 'linear-gradient(135deg, #3b82f6, #60a5fa)' }} />}
                <div className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${isActive ? 'bg-[#3b82f6]/10' : ''}`}>
                  <tab.icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                  <span className={`text-[9px] font-bold ${isActive ? 'text-[#3b82f6]' : ''}`}>{tab.label}</span>
                </div>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Desktop Sidebar Navigation - hidden on mobile */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 z-30 w-[72px] lg:w-[80px] border-r border-[var(--zv-border)] flex-col items-center pt-4 pb-4 gap-0.5" style={{ background: 'var(--zv-panel)' }}>
        {/* Logo */}
        <div className="flex flex-col items-center gap-1 mb-3 pb-3 border-b border-[var(--zv-border)]">
          <ZevorikLogo size={32} />
          <span className="text-[7px] font-black gradient-text tracking-wider">ZEVORIK</span>
        </div>
        {[
          { key: 'home', label: 'Beranda', icon: HomeIcon },
          { key: 'market', label: 'Quote', icon: BarChart3 },
          { key: 'sinyal', label: 'Chart', icon: Activity },
          { key: 'saldo', label: 'Trade', icon: Wallet },
          { key: 'profil', label: 'Profil', icon: User },
          { key: 'portfolio', label: 'Portofolio', icon: Briefcase },
          { key: 'finance', label: 'Keuangan', icon: CreditCard },
          { key: 'history', label: 'Riwayat', icon: History },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`w-full flex flex-col items-center gap-0.5 py-2.5 transition-all relative ${activeTab === tab.key ? 'text-[#3b82f6] bg-[var(--zv-surface)]' : 'text-[var(--zv-muted)] opacity-70 hover:opacity-100 hover:text-[#3b82f6] hover:bg-[var(--zv-surface)]'}`}>
            {activeTab === tab.key && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full" style={{ background: 'linear-gradient(180deg, #3b82f6, #60a5fa)' }} />}
            <tab.icon className="w-5 h-5" />
            <span className="text-[7px] lg:text-[8px] font-bold">{tab.label}</span>
          </button>
        ))}
        <div className="mt-auto">
          <button onClick={() => { logout(); toast({ title: 'Berhasil logout' }) }}
            className="w-full flex flex-col items-center gap-0.5 py-2.5 text-[#ef5350] hover:text-[#ff6b6b] transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="text-[7px] lg:text-[8px] font-bold">Keluar</span>
          </button>
        </div>
      </nav>

      {/* Side Menu */}
      <AnimatePresence>
        {showSideMenu && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40" onClick={() => setShowSideMenu(false)} />
            <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: 'spring', damping: 25 }} className="fixed left-0 top-0 bottom-0 z-50 w-[280px] md:w-[320px] bg-[var(--zv-panel)] border-r border-[var(--zv-border)] overflow-y-auto custom-scrollbar">
              <div className="p-5" style={{ background: 'linear-gradient(145deg, #0c1a2e 0%, #1e3a5f 54%, #2563eb 100%)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white/20 border border-white/10 grid place-items-center"><User className="w-6 h-6 text-yellow-300" /></div>
                    <div className="text-white">
                      <b className="block text-[13px] font-black">{user?.name}</b>
                      <span className="block text-[9px] text-blue-200">+62 {user?.phone}</span>
                    </div>
                  </div>
                  <button onClick={() => setShowSideMenu(false)} className="w-8 h-8 rounded-full bg-white/10 border border-white/10 grid place-items-center text-white hover:bg-white/20 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-xl p-2 bg-white/10 border border-white/15 text-center">
                    <Wallet className="w-4 h-4 text-yellow-300 mx-auto mb-0.5" />
                    <b className="block text-[9px] font-black text-white">{formatRupiah(user?.balance || 0).replace('Rp', '').trim()}</b>
                    <span className="block text-[7px] text-blue-200">Saldo</span>
                  </div>
                  <div className="flex-1 rounded-xl p-2 bg-white/10 border border-white/15 text-center">
                    <Briefcase className="w-4 h-4 text-blue-300 mx-auto mb-0.5" />
                    <b className="block text-[9px] font-black text-white">{store.portfolioSummary.totalCurrentValue > 0 ? formatRupiah(store.portfolioSummary.totalCurrentValue).replace('Rp', '').trim() : '0'}</b>
                    <span className="block text-[7px] text-blue-200">Portofolio</span>
                  </div>
                </div>
              </div>
              <div className="p-3">
                {[
                  { icon: <HomeIcon className="w-4 h-4" />, label: 'Beranda', key: 'home' },
                  { icon: <BarChart3 className="w-4 h-4" />, label: 'Pasar Global', key: 'market' },
                  { icon: <Target className="w-4 h-4" />, label: 'Trading', key: 'sinyal' },
                  { icon: <Wallet className="w-4 h-4" />, label: 'Saldo Live', key: 'saldo' },
                  { icon: <Briefcase className="w-4 h-4" />, label: 'Portofolio', key: 'portfolio' },
                  { icon: <CreditCard className="w-4 h-4" />, label: 'Keuangan', key: 'finance' },
                  { icon: <History className="w-4 h-4" />, label: 'Riwayat', key: 'history' },
                  { icon: <User className="w-4 h-4" />, label: 'Profil', key: 'profil' },
                ].map(item => (
                  <button key={item.key} onClick={() => { setActiveTab(item.key); setShowSideMenu(false) }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[11px] font-bold transition-all ${activeTab === item.key ? 'bg-[var(--zv-surface)] text-[#3b82f6] border border-[var(--zv-border)]' : 'text-[var(--zv-text)] hover:bg-[var(--zv-surface)]'}`}>
                    {item.icon}{item.label}
                  </button>
                ))}
                <div className="mt-3 pt-3 border-t border-[var(--zv-border)]">
                  <button onClick={() => { logout(); setShowSideMenu(false); toast({ title: 'Berhasil logout' }) }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[11px] font-bold text-[#ef5350] hover:bg-[var(--zv-surface)] transition-colors">
                    <LogOut className="w-4 h-4" />Keluar
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Notification Panel */}
      <AnimatePresence>
        {showNotifPanel && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40" onClick={() => setShowNotifPanel(false)} />
            <motion.div initial={{ x: 300 }} animate={{ x: 0 }} exit={{ x: 300 }} transition={{ type: 'spring', damping: 25 }} className="fixed right-0 top-0 bottom-0 z-50 w-[320px] md:w-[400px] bg-[var(--zv-panel)] border-l border-[var(--zv-border)] overflow-y-auto custom-scrollbar">
              <div className="p-4 border-b border-[var(--zv-border)] flex items-center justify-between" style={{ background: 'linear-gradient(145deg, var(--zv-surface) 0%, var(--zv-panel) 100%)' }}>
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#3b82f6]" />
                  <h3 className="text-[14px] font-black gradient-text">Notifikasi</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => markNotifRead()} className="text-[9px] font-bold text-[#3b82f6] hover:underline">Tandai dibaca</button>
                  <button onClick={() => setShowNotifPanel(false)} className="w-8 h-8 rounded-xl grid place-items-center hover:bg-[var(--zv-surface)] bg-[var(--zv-panel)] border border-[var(--zv-border)] text-[var(--zv-muted)] hover:text-[var(--zv-text)]"><X className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="p-3">
                {notifications.map(n => (
                  <div key={n.id} className={`p-3 rounded-xl mb-2 border transition-colors ${n.isRead ? 'bg-[var(--zv-panel)] border-[var(--zv-border)]' : 'bg-[var(--zv-surface)] border-[var(--zv-border)]'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-lg grid place-items-center bg-[var(--zv-surface)]">
                        {n.type === 'trade' ? <BarChart3 className="w-3 h-3 text-[#3b82f6]" /> : n.type === 'deposit' ? <Wallet className="w-3 h-3 text-[#3b82f6]" /> : <Bell className="w-3 h-3 text-[#f59e0b]" />}
                      </div>
                      <span className="flex-1 text-[9px] font-bold text-[var(--zv-text)]">{n.title}</span>
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                    </div>
                    <p className="text-[8px] text-[var(--zv-muted)] leading-relaxed">{n.message}</p>
                    <span className="block text-[7px] text-[var(--zv-muted)] mt-1">{formatDateTime(n.createdAt)}</span>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <div className="text-center py-8">
                    <Bell className="w-8 h-8 text-[var(--zv-muted)] mx-auto mb-2" />
                    <p className="text-[10px] font-bold text-[var(--zv-muted)]">Tidak ada notifikasi</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  )
}


export default function Home() {
  const { isLoggedIn, _hydrated, hydrate } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    hydrate()
    // Use microtask to avoid synchronous setState in effect
    queueMicrotask(() => setMounted(true))
  }, [hydrate])
  if (!mounted || !_hydrated) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #eff6ff 0%, #dbeafe 50%, #bfdbfe 100%)' }}>
      <div className="flex flex-col items-center gap-3">
        <ZevorikLogo size={56} />
        <span className="text-[12px] font-black text-[#1d4ed8] tracking-widest animate-pulse">LOADING...</span>
      </div>
    </div>
  )
  if (!isLoggedIn) return <LoginPage />
  return <Dashboard />
}
