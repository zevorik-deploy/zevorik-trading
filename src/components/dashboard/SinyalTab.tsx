'use client'

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/lib/store'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, TrendingDown, ArrowRight, Search, Star,
  ChevronUp, ChevronDown, X, RefreshCw, Eye, Info, Activity,
  SlidersHorizontal, Plus, Minus, Crosshair,
  Sun, Moon, Check, ChevronRight, BarChart3, History,
  Shield, Settings, Clock, LogOut
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { formatRupiah, formatNumber, formatPercent, formatDate, formatDateTime, type Stock, type CandleData } from '@/lib/trading-utils'
import {
  ALL_INDICATORS, OVERLAY_KEYS, SUBCHART_KEYS, generateCandle,
  computeMA, computeBollinger, computeRSI, computeMACD, computeADX,
  computeEnvelopes, computeIchimoku, computeSAR, computeStdDev,
  computeZigZag, computeATR, computeBearsPower, computeBullsPower,
  computeCCI, computeDeMarker, computeForceIndex, computeMomentum,
  computeOsMA, computeRVI, computeStochastic, computeWilliamsR,
  computeAD, computeMFI, computeOBV, computeAO, computeAC,
  computeAlligator, computeFractals, computeGator, computeBWIMFI,
} from '@/lib/indicators'
import { getRealLogo } from '@/lib/logos.tsx'
import {
  useDashboardStore, LOT_SIZE, getStockPayoutTier, computeChartPayout,
  getMarketCategory, getMarketRegion, sinyalTimeframeSeconds,
  sinyalChartSimRef as sharedChartSimRef,
  sinyalPositionsRef as sharedPositionsRef,
  sinyalChartOffsetRef as sharedChartOffsetRef,
  sinyalChartZoomRef as sharedChartZoomRef,
  type SinyalPosition,
} from '@/lib/dashboard-store'

const MARKET_PAGE_SIZE = 50

export function SinyalTab() {
  const { user } = useAuthStore()
  const store = useDashboardStore()
  const {
    stocks, sinyalPositions, sinyalDirection, sinyalAmount, sinyalLots, sinyalLeverage,
    showConfirmTrade, confirmTradeDir, sinyalCategory, marketSignalTab,
    marketFavFilter, marketRegionFilter, favorites, marketSearchQuery, marketPage,
    sinyalHistoryFilter, sinyalTerminalTab, stopLossPrice, takeProfitPrice,
    selectedSinyalStock, sinyalResults, sinyalTimers,
    sinyalCandles, sinyalCurrentPrice, sinyalChartTick, sinyalCrosshair,
    sinyalTimeframe, showTimeframeMenu, showLeverageMenu,
    chartType, crosshairMode, showIndicatorMenu, activeIndicators,
    sinyalChartOffset, sinyalChartZoom, chartPayoutRates,
    theme, activeTab,
    setSinyalDirection, setSinyalAmount, setSinyalLots, setSinyalLeverage,
    setShowConfirmTrade, setConfirmTradeDir, setSinyalCategory, setMarketSignalTab,
    setMarketFavFilter, setMarketRegionFilter, setMarketSearchQuery, setMarketPage,
    setSinyalHistoryFilter, setSinyalTerminalTab, setStopLossPrice, setTakeProfitPrice,
    setSelectedSinyalStock, setSinyalResults,
    setSinyalCandles, setSinyalCurrentPrice, setSinyalChartTick, setSinyalCrosshair,
    setSinyalTimeframe, setShowTimeframeMenu, setShowLeverageMenu,
    setChartType, setCrosshairMode, setShowIndicatorMenu, setActiveIndicators,
    setSinyalChartOffset, setSinyalChartZoom, setChartPayoutRates,
    setSinyalPositions, setSinyalTimers,
    openSinyalPosition, closeSinyalPosition, calcSinyalProfit, toggleFavorite,
    setTradingPLOffset,
  } = store

  const sinyalAmountFromLots = Math.round(parseFloat(sinyalLots || '0') * LOT_SIZE)

  // ── Refs for chart interaction (use shared mutable objects from store) ──
  const sinyalChartSimRef = sharedChartSimRef
  useEffect(() => { sharedPositionsRef.current = sinyalPositions }, [sinyalPositions])
  useEffect(() => { sharedChartOffsetRef.current = sinyalChartOffset }, [sinyalChartOffset])
  useEffect(() => { sharedChartZoomRef.current = sinyalChartZoom }, [sinyalChartZoom])
  const sinyalDragRef = useRef<{ startX: number; startOffset: number; dragging: boolean }>({ startX: 0, startOffset: 0, dragging: false })
  const sinyalPinchRef = useRef<{ startDist: number; startZoom: number } | null>(null)

  // ── Auto-select first stock when entering sinyal tab ──
  useEffect(() => {
    if (activeTab === 'sinyal' && !selectedSinyalStock && stocks.length > 0) {
      setSelectedSinyalStock(stocks[0])
    }
  }, [activeTab, selectedSinyalStock, stocks, setSelectedSinyalStock])

  // ── Sinyal Pro live candlestick chart ──
  useEffect(() => {
    if (activeTab !== 'sinyal' || !selectedSinyalStock) return
    setSinyalChartOffset(0)

    const tfSeconds = sinyalTimeframeSeconds[sinyalTimeframe] || 60
    const tickIntervalMs = 1000
    const maxTicks = tfSeconds

    if (sinyalChartSimRef.current === null) {
      const basePrice = selectedSinyalStock.price
      const stockTier = getStockPayoutTier(selectedSinyalStock.code)
      const volMult = stockTier.volMultiplier
      const vol = Math.round((30000 + Math.random() * 70000) * volMult)
      const stockSeed = selectedSinyalStock.code.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
      const initialTrend = stockSeed % 2 === 0 ? 1 : -1

      const histCount = 60
      const histCandles: CandleData[] = []
      const histStartOffset = (stockSeed % 7 - 3) / 100
      let prevClose = Math.round(basePrice * (0.97 + histStartOffset + Math.random() * 0.04))
      const histSim = { momentum: 0, trend: initialTrend, phase: 1, phaseLen: 5, vol }
      const now = new Date()
      for (let i = 0; i < histCount; i++) {
        const candle = generateCandle(prevClose, basePrice, histSim, i)
        const candleTime = new Date(now.getTime() - (histCount - i) * tfSeconds * 1000)
        const timeLabel = candleTime.getHours().toString().padStart(2, '0') + ':' + candleTime.getMinutes().toString().padStart(2, '0')
        histCandles.push({ ...candle, time: timeLabel })
        prevClose = candle.close
      }

      const sim = {
        price: prevClose,
        basePrice,
        momentum: histSim.momentum,
        trend: histSim.trend,
        phase: histSim.phase,
        phaseLen: histSim.phaseLen,
        vol,
        currentCandle: {
          open: prevClose, high: prevClose, low: prevClose, close: prevClose,
          volume: 0, tickCount: 0, maxTicks,
        },
      }

      setSinyalCandles(histCandles)
      setSinyalCurrentPrice(prevClose)
      sinyalChartSimRef.current = sim

      const initialPayout = computeChartPayout(sim, stockTier)
      setChartPayoutRates(initialPayout)
    } else {
      sinyalChartSimRef.current.currentCandle.maxTicks = maxTicks
    }

    const interval = setInterval(() => {
      const sim = sinyalChartSimRef.current
      if (!sim) return

      const cc = sim.currentCandle
      cc.tickCount++

      const baseVal = sim.basePrice
      const stockTier = getStockPayoutTier(selectedSinyalStock.code)
      const volMult = stockTier.volMultiplier
      const tfScale = Math.sqrt(tfSeconds / 60)

      const tickVol = baseVal * 0.0003 * volMult * tfScale
      const noise = (Math.random() - 0.5) * tickVol
      const trendDrift = sim.trend * baseVal * 0.00008 * tfScale
      sim.momentum = sim.momentum * 0.92 + trendDrift * 0.3 + noise
      const meanRevert = (sim.basePrice - sim.price) * 0.0003
      sim.price = Math.round(Math.max(baseVal * 0.85, Math.min(baseVal * 1.15, sim.price + sim.momentum + meanRevert)))

      cc.close = sim.price
      cc.high = Math.max(cc.high, cc.close)
      cc.low = Math.min(cc.low, cc.close)
      cc.volume += Math.round(Math.random() * 500 + 200)

      setSinyalCurrentPrice(sim.price)

      const chartPayout = computeChartPayout(sim, stockTier)
      setChartPayoutRates(chartPayout)

      if (cc.tickCount >= cc.maxTicks) {
        const now = new Date()
        const completedCandle: CandleData = {
          idx: 0, open: cc.open, high: cc.high, low: cc.low, close: cc.close, volume: cc.volume,
          time: now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0'),
        }
        setSinyalCandles(prev => [...prev, completedCandle])
        cc.open = cc.close; cc.high = cc.close; cc.low = cc.close; cc.volume = 0; cc.tickCount = 0; cc.maxTicks = maxTicks
        sim.trend = Math.random() < 0.22 ? -sim.trend as 1 | -1 : sim.trend
      }
    }, tickIntervalMs)

    return () => clearInterval(interval)
  }, [activeTab, selectedSinyalStock, sinyalTimeframe, setSinyalChartOffset, setSinyalCandles, setSinyalCurrentPrice, setChartPayoutRates])

  // ── Position timer tracking ──
  useEffect(() => {
    const activePositions = sinyalPositions.filter(p => p.status === 'active')
    if (activePositions.length === 0) return

    const interval = setInterval(() => {
      const now = Date.now()
      const currentPositions = sinyalPositionsRef.current.filter(p => p.status === 'active')
      const newTimers: Record<string, number> = {}
      for (const pos of currentPositions) {
        const elapsed = Math.floor((now - pos.startTime) / 1000)
        newTimers[pos.id] = elapsed
      }
      setSinyalTimers(prev => ({ ...prev, ...newTimers }))
    }, 500)

    return () => clearInterval(interval)
  }, [sinyalPositions, setSinyalTimers])

  // Helper: getPositionLivePL with current ref values
  const getPositionLivePL = (pos: SinyalPosition) => {
    return store.getPositionLivePL(pos, sinyalCurrentPrice, sinyalChartSimRef.current)
  }


  // ── Computed values for MT5 terminal ──
  // ── Computed values for MT5 terminal ──
  const activePos = sinyalPositions.filter(p => p.status === 'active')
  const totalBalance = (user?.balance || 0)
  const totalLivePL = activePos.reduce((s, p) => s + getPositionLivePL(p), 0)
  // MT5-style: Equity = Balance + Floating P/L (follows chart in real-time)
  const equity = totalBalance + totalLivePL
  const usedMargin = activePos.reduce((s, p) => s + p.amount, 0)
  const freeMargin = equity - usedMargin
  const marginLevel = usedMargin > 0 ? (equity / usedMargin) * 100 : 0

  // ── Bid/Ask spread ──
  const spreadPercent = selectedSinyalStock ? (
    (selectedSinyalStock.category?.toLowerCase().includes('crypto') || selectedSinyalStock.category?.toLowerCase().includes('kripto')) ? 0.05 :
    selectedSinyalStock.category?.toLowerCase().includes('forex') ? 0.01 :
    0.03
  ) : 0.03
  const bidPrice = (sinyalCurrentPrice || selectedSinyalStock?.price || 0) * (1 - spreadPercent / 100)
  const askPrice = (sinyalCurrentPrice || selectedSinyalStock?.price || 0) * (1 + spreadPercent / 100)
  const spreadValue = askPrice - bidPrice

  // ── Price formatting for chart ──
  const fmtChartPrice = (p: number) => {
    if (p >= 1e6) return `${(p / 1e6).toFixed(2)}M`
    if (p >= 1e3) return `${(p / 1e3).toFixed(1)}K`
    return p.toFixed(2)
  }
  const fmtPrice5 = (p: number) => {
    if (p >= 1e6) return `${(p / 1e6).toFixed(3)}M`
    if (p >= 1e4) return `${(p / 1e3).toFixed(2)}K`
    if (p >= 1e3) return `${(p / 1e3).toFixed(3)}K`
    return p.toFixed(5)
  }

  // ── Theme config for trading tab ──
  const isTrDark = theme === 'dark'
  const trTheme = {
    bg: isTrDark ? '#131722' : '#f0f2f5',
    bgDeep: isTrDark ? '#0a0e17' : '#ffffff',
    bgPanel: isTrDark ? '#1e222d' : '#ffffff',
    bgCard: isTrDark ? '#0c0f18' : '#e8eaed',
    border: isTrDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)',
    borderSubtle: isTrDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)',
    text: isTrDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.87)',
    textSecondary: isTrDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.54)',
    textMuted: isTrDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.35)',
    textFaint: isTrDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.22)',
    gridLine: isTrDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)',
    gridText: isTrDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)',
    chartBg: isTrDark ? '#0a0e17' : '#ffffff',
    inputBg: isTrDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
    inputBorder: isTrDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)',
    green: '#26a69a',
    red: '#ef5350',
    pillInactive: isTrDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)',
    pillActiveBg: isTrDark ? 'rgba(29,78,216,0.25)' : 'rgba(29,78,216,0.12)',
    pillActiveBorder: isTrDark ? 'rgba(29,78,216,0.4)' : 'rgba(29,78,216,0.3)',
    btnBg: isTrDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    btnBorder: isTrDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.10)',
    btnText: isTrDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
    btnTextMuted: isTrDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)',
  }


  return (
    <motion.div key="sinyal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
      className="flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 140px)' }}>

      {/* ══ 1. HEADER — Super Clean Single Row ══ */}
      <div className="flex-shrink-0" style={{ background: trTheme.bg, borderBottom: '1px solid ' + trTheme.border }}>
        {selectedSinyalStock ? (
          <div className="flex items-center justify-between px-3 py-2">
            {/* Left: Symbol + Price */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[14px] font-black" style={{ color: trTheme.text }}>{selectedSinyalStock.code}</span>
                <span className="text-[9px] font-bold" style={{ color: trTheme.textMuted }}>/</span>
                <span className="text-[9px] font-bold" style={{ color: trTheme.textSecondary }}>{selectedSinyalStock.name?.slice(0, 16)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {(() => {
                  const sim = sinyalChartSimRef.current
                  const openPrice = sim?.currentCandle.open || selectedSinyalStock.price
                  const curPrice = sinyalCurrentPrice || selectedSinyalStock.price
                  const priceChange = curPrice - openPrice
                  const changePercent = openPrice > 0 ? (priceChange / openPrice) * 100 : 0
                  const isPriceUp = priceChange >= 0
                  return (
                    <>
                      <span className="text-[15px] font-black tabular-nums" style={{ color: isPriceUp ? '#22c55e' : '#ef5350' }}>{formatRupiah(curPrice)}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isPriceUp ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>
                        {isPriceUp ? '▲' : '▼'} {isPriceUp ? '+' : ''}{changePercent.toFixed(2)}%
                      </span>
                    </>
                  )
                })()}
                {/* Candle countdown */}
                {(() => {
                  const sim = sinyalChartSimRef.current
                  if (!sim) return null
                  const cc = sim.currentCandle
                  const totalSecs = cc.maxTicks
                  const elapsed = cc.tickCount
                  const remaining = totalSecs - elapsed
                  const progress = totalSecs > 0 ? elapsed / totalSecs : 0
                  const isLow = remaining <= 5 && remaining > 0
                  const radius = 9
                  const circumference = 2 * Math.PI * radius
                  const strokeDash = circumference * progress
                  return (
                    <div className="flex items-center gap-0.5 ml-1">
                      <svg width="22" height="22" className="flex-shrink-0">
                        <circle cx="11" cy="11" r={radius} fill="none" stroke={trTheme.borderSubtle} strokeWidth="1.5" />
                        <circle cx="11" cy="11" r={radius} fill="none" stroke={isLow ? '#f59e0b' : '#3b82f6'} strokeWidth="1.5"
                          strokeDasharray={`${strokeDash} ${circumference}`} strokeDashoffset="0"
                          strokeLinecap="round" transform="rotate(-90 11 11)"
                          style={{ transition: 'stroke-dasharray 0.8s linear' }} />
                        <text x="11" y="13" textAnchor="middle" fontSize="6" fontWeight="900" fill={isLow ? '#f59e0b' : trTheme.textSecondary} fontFamily="monospace">
                          {remaining > 60 ? `${Math.ceil(remaining/60)}m` : `${remaining}`}
                        </text>
                      </svg>
                    </div>
                  )
                })()}
              </div>
            </div>
            {/* Right: Timeframe Dropdown + Zoom + Theme Toggle */}
            <div className="flex items-center gap-1.5">
              {/* Theme Toggle */}
              <button onClick={toggleTheme} className="h-6 w-6 rounded-md flex items-center justify-center transition-all hover:scale-105"
                style={{ background: trTheme.inputBg, border: '1px solid ' + trTheme.inputBorder }}
                title={isTrDark ? 'Light mode' : 'Dark mode'}>
                {isTrDark ? <Sun className="w-3 h-3" style={{ color: '#eab308' }} /> : <Moon className="w-3 h-3" style={{ color: trTheme.textSecondary }} />}
              </button>
              {/* Timeframe Dropdown — MT5 Style */}
              <div className="relative">
                <button onClick={() => { setShowTimeframeMenu(prev => !prev); setShowLeverageMenu(false) }}
                  className="h-7 px-2 rounded-md flex items-center gap-1 transition-all"
                  style={{ background: showTimeframeMenu ? trTheme.pillActiveBg : trTheme.btnBg, border: `1px solid ${showTimeframeMenu ? trTheme.pillActiveBorder : trTheme.btnBorder}` }}>
                  <span className="text-[10px] font-black uppercase" style={{ color: trTheme.btnText }}>{sinyalTimeframe}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showTimeframeMenu ? 'rotate-180' : ''}`} style={{ color: trTheme.btnTextMuted }} />
                </button>
                {showTimeframeMenu && (
                  <div className="absolute right-0 top-8 z-50 rounded-lg overflow-hidden py-0.5"
                    style={{ background: trTheme.bgPanel, border: '1px solid ' + trTheme.border, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', minWidth: '64px' }}>
                    {(['1m', '2m', '5m', '10m', '15m', '30m', '1h'] as const).map(tf => (
                      <button key={tf} onClick={() => { setSinyalTimeframe(tf); sinyalChartSimRef.current = null; setSinyalCandles([]); setSinyalCurrentPrice(0); setSinyalChartOffset(0); setShowTimeframeMenu(false) }}
                        className={`w-full px-3 py-1.5 text-[10px] font-bold text-left transition-colors ${
                          sinyalTimeframe === tf ? 'text-blue-400 bg-blue-500/10' : 'hover:bg-black/5'
                        }`}
                        style={{ color: sinyalTimeframe === tf ? undefined : trTheme.textSecondary }}>
                        {tf}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Zoom */}
              <div className="flex items-center gap-0.5 rounded-md p-0.5" style={{ background: trTheme.inputBg }}>
                <button onClick={() => setSinyalChartZoom(prev => Math.max(8, prev - (prev > 60 ? 8 : prev > 30 ? 4 : 2)))}
                  className="h-6 w-6 rounded flex items-center justify-center text-[11px] font-bold transition-colors hover:opacity-80" style={{ color: trTheme.btnTextMuted }}>−</button>
                <button onClick={() => setSinyalChartZoom(prev => Math.min(120, prev + (prev > 60 ? 8 : prev > 30 ? 4 : 2)))}
                  className="h-6 w-6 rounded flex items-center justify-center text-[11px] font-bold transition-colors hover:opacity-80" style={{ color: trTheme.btnTextMuted }}>+</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center px-3 py-2">
            <span className="text-[10px] font-bold" style={{ color: trTheme.textMuted }}>Pilih instrumen untuk mulai trading</span>
          </div>
        )}
        {/* ══ Market Selector — Scrollable MT5 Style ══ */}
        <div className="flex-shrink-0" style={{ background: trTheme.bg, borderBottom: '1px solid ' + trTheme.border }}>
          {/* Category tabs — clean horizontal */}
          <div className="flex items-center px-2 pt-1.5 gap-0.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {[
              { key: 'popular', label: 'Popular' },
              { key: 'saham', label: 'Saham' },
              { key: 'crypto', label: 'Kripto' },
              { key: 'komoditas', label: 'Komoditas' },
              { key: 'forex', label: 'Forex' },
            ].map(cat => (
              <button key={cat.key} onClick={() => setSinyalCategory(cat.key)}
                className={`flex-shrink-0 h-7 px-2.5 rounded-md text-[9px] font-bold transition-all ${
                  sinyalCategory === cat.key
                    ? 'bg-[#1d4ed8]/20 text-blue-400 border border-blue-500/20'
                    : 'border border-transparent'
                }`}
                style={sinyalCategory !== cat.key ? { color: trTheme.textMuted } : undefined}>
                {cat.label}
              </button>
            ))}
          </div>
          {/* Stock pills — scrollable row with smooth scroll */}
          <div className="flex items-center gap-1 px-2 pb-1.5 pt-1 overflow-x-auto" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
            {stocks.filter(s => {
              const cat = s.category?.toLowerCase() || ''
              if (sinyalCategory === 'popular') return true
              if (sinyalCategory === 'saham') return !cat.includes('crypto') && !cat.includes('kripto') && !cat.includes('forex') && !cat.includes('commodity') && !cat.includes('komoditas') && !['BTC', 'ETH', 'XRP', 'SOL', 'DOGE', 'ADA', 'AVAX', 'DOT', 'MATIC', 'LINK', 'BCH', 'LTC', 'XLM', 'UNI', 'AAVE', 'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD', 'USDCHF', 'GOLD', 'SILVER', 'OIL', 'NATGAS', 'COPPER'].includes(s.code)
              if (sinyalCategory === 'crypto') return cat.includes('crypto') || cat.includes('kripto') || ['BTC', 'ETH', 'XRP', 'SOL', 'DOGE', 'ADA', 'AVAX', 'DOT', 'MATIC', 'LINK', 'BCH', 'LTC', 'XLM', 'UNI', 'AAVE'].includes(s.code)
              if (sinyalCategory === 'komoditas') return cat.includes('commodity') || cat.includes('komoditas') || ['XOM', 'CVX', 'COP', 'GOLD', 'SILVER', 'OIL', 'NATGAS', 'COPPER'].includes(s.code)
              if (sinyalCategory === 'forex') return cat.includes('forex') || ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD', 'USDCHF'].includes(s.code)
              return true
            }).slice(0, 30).map(s => {
              const isSelected = selectedSinyalStock?.id === s.id
              const isUp = s.change >= 0
              return (
                <button key={s.id} onClick={() => { setSelectedSinyalStock(s); setSinyalLots('0.01'); setSinyalAmount(''); setSinyalDirection('NAIK'); setSinyalResults([]); setSinyalCandles([]); setSinyalCurrentPrice(0); setSinyalChartTick(0); setSinyalChartOffset(0); sinyalChartSimRef.current = null }}
                  className={`flex-shrink-0 h-7 px-2.5 rounded-md text-[9px] font-bold flex items-center gap-1 transition-all ${
                    isSelected
                      ? 'bg-[#1d4ed8] text-white shadow-sm shadow-blue-500/20'
                      : isUp
                        ? 'text-green-400/60 hover:text-green-400/90 hover:bg-green-500/5'
                        : 'text-red-400/60 hover:text-red-400/90 hover:bg-red-500/5'
                  }`}
                  style={!isSelected ? { border: '1px solid ' + trTheme.borderSubtle } : undefined}>
                  <span>{s.code}</span>
                  <span className={`text-[7px] ${isSelected ? 'text-white/60' : ''}`}>{isUp ? '▲' : '▼'}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ══ 2. QUICK BUY/SELL BAR — Chart Only (Full trading in Trade tab) ══ */}
      {selectedSinyalStock && (() => {
        const buyPL = activePos.filter(p => p.direction === 'NAIK').reduce((s, p) => s + getPositionLivePL(p), 0)
        const sellPL = activePos.filter(p => p.direction === 'TURUN').reduce((s, p) => s + getPositionLivePL(p), 0)
        const hasBuyPos = activePos.some(p => p.direction === 'NAIK')
        const hasSellPos = activePos.some(p => p.direction === 'TURUN')
        return (
      <div className="flex-shrink-0" style={{ background: trTheme.bgPanel, borderBottom: '1px solid ' + trTheme.border }}>
        <div className="flex items-center gap-1.5 px-2 py-1.5">
          {/* SELL Button */}
          <button
            onClick={() => {
              if (sinyalAmountFromLots < 1000) {
                toast({ title: 'Minimum 0.01 Lot (Rp 1.000)', variant: 'destructive' }); return
              }
              if (sinyalAmountFromLots > freeMargin) {
                toast({ title: 'Free Margin tidak cukup', variant: 'destructive' }); return
              }
              setConfirmTradeDir('TURUN')
              setShowConfirmTrade(true)
            }}
            className="flex-1 relative rounded-lg flex items-center justify-center gap-1.5 transition-all overflow-hidden active:scale-[0.97] h-[40px]"
            style={(() => {
              let bg: string
              if (hasSellPos) {
                bg = sellPL > 0
                  ? 'linear-gradient(135deg, #f87171, #ef4444, #dc2626)'
                  : 'linear-gradient(135deg, #b91c1c, #991b1b)'
              } else {
                bg = 'linear-gradient(135deg, #ef5350, #dc2626, #b91c1c)'
              }
              return { background: bg, boxShadow: '0 2px 12px rgba(239,68,68,0.3)' }
            })()}>
            <TrendingDown className="w-4 h-4 text-white/90" />
            <span className="text-[13px] font-black tracking-[0.15em] text-white">SELL</span>
            <span className="text-[8px] font-bold tabular-nums text-white/50">{sinyalCurrentPrice > 0 ? fmtPrice5(bidPrice) : '—'}</span>
          </button>

          {/* Lot Selector with -/+ buttons side by side */}
          <div className="flex items-center rounded-lg overflow-hidden h-[40px]" style={{ background: trTheme.inputBg, border: '1px solid ' + trTheme.inputBorder }}>
            <button onClick={() => { const cur = parseFloat(sinyalLots || '0'); const next = Math.max(0.01, cur - 0.01); setSinyalLots(next.toFixed(2)); setSinyalAmount(String(Math.round(next * LOT_SIZE))) }}
              className="h-full w-8 flex items-center justify-center transition-colors hover:bg-red-500/20 active:bg-red-500/30" style={{ borderRight: '1px solid ' + trTheme.borderSubtle }}>
              <Minus className="w-3 h-3" style={{ color: '#f87171' }} strokeWidth={2.5} />
            </button>
            <div className="flex flex-col items-center justify-center px-2 min-w-[42px]">
              <span className="text-[12px] font-black tabular-nums leading-none" style={{ color: trTheme.text }}>{sinyalLots}</span>
              <span className="text-[5px] font-bold leading-none mt-0.5" style={{ color: 'rgba(251,191,36,0.6)' }}>LOT</span>
            </div>
            <button onClick={() => { const cur = parseFloat(sinyalLots || '0'); const next = Math.max(0.01, cur + 0.01); setSinyalLots(next.toFixed(2)); setSinyalAmount(String(Math.round(next * LOT_SIZE))) }}
              className="h-full w-8 flex items-center justify-center transition-colors hover:bg-green-500/20 active:bg-green-500/30" style={{ borderLeft: '1px solid ' + trTheme.borderSubtle }}>
              <Plus className="w-3 h-3" style={{ color: '#4ade80' }} strokeWidth={2.5} />
            </button>
          </div>

          {/* BUY Button */}
          <button
            onClick={() => {
              if (sinyalAmountFromLots < 1000) {
                toast({ title: 'Minimum 0.01 Lot (Rp 1.000)', variant: 'destructive' }); return
              }
              if (sinyalAmountFromLots > freeMargin) {
                toast({ title: 'Free Margin tidak cukup', variant: 'destructive' }); return
              }
              setConfirmTradeDir('NAIK')
              setShowConfirmTrade(true)
            }}
            className="flex-1 relative rounded-lg flex items-center justify-center gap-1.5 transition-all overflow-hidden active:scale-[0.97] h-[40px]"
            style={(() => {
              let bg: string
              if (hasBuyPos) {
                bg = buyPL > 0
                  ? 'linear-gradient(135deg, #4ade80, #22c55e, #16a34a)'
                  : 'linear-gradient(135deg, #166534, #14532d)'
              } else {
                bg = 'linear-gradient(135deg, #22c55e, #16a34a, #15803d)'
              }
              return { background: bg, boxShadow: '0 2px 12px rgba(34,197,94,0.3)' }
            })()}>
            <TrendingUp className="w-4 h-4 text-white/90" />
            <span className="text-[13px] font-black tracking-[0.15em] text-white">BUY</span>
            <span className="text-[8px] font-bold tabular-nums text-white/50">{sinyalCurrentPrice > 0 ? fmtPrice5(askPrice) : '—'}</span>
          </button>
        </div>
      </div>
        )
      })()}

      {/* ══ 2.5 CHART TOOLBAR — MT5 Style ══ */}
      {selectedSinyalStock && (
      <div className="flex-shrink-0 flex items-center gap-1 px-2 py-1" style={{ background: trTheme.bgDeep, borderBottom: '1px solid ' + trTheme.borderSubtle }}>
        {/* Chart Type Buttons */}
        <div className="flex items-center gap-0.5 mr-1">
          {([
            { type: 'candle' as const, label: '🕯', tip: 'Candlestick' },
            { type: 'line' as const, label: '📈', tip: 'Line' },
            { type: 'bar' as const, label: '📊', tip: 'Bar' },
          ]).map(ct => (
            <button key={ct.type} onClick={() => setChartType(ct.type)} title={ct.tip}
              className={`h-6 w-7 rounded flex items-center justify-center text-[11px] transition-all ${
                chartType === ct.type
                  ? 'bg-black/10 text-white'
                  : ''
              }`}
              style={chartType !== ct.type ? { color: trTheme.textMuted } : undefined}>
              {ct.label}
            </button>
          ))}
        </div>
        <div className="w-px h-4" style={{ background: trTheme.borderSubtle }} />
        {/* Crosshair Toggle */}
        <button onClick={() => setCrosshairMode(prev => !prev)} title="Crosshair"
          className={`h-6 w-7 rounded flex items-center justify-center transition-all ${
            crosshairMode ? 'bg-blue-500/20 text-blue-400' : ''
          }`}
          style={!crosshairMode ? { color: trTheme.textMuted } : undefined}>
          <Crosshair className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4" style={{ background: trTheme.borderSubtle }} />
        {/* Indicators Button */}
        <div className="relative">
          <button onClick={() => { setShowIndicatorMenu(prev => !prev); setShowTimeframeMenu(false); setShowLeverageMenu(false) }} title="Indicators"
            className={`h-6 px-2 rounded flex items-center gap-0.5 transition-all ${
              showIndicatorMenu ? 'bg-purple-500/20 text-purple-400' : activeIndicators.length > 0 ? 'text-purple-400/70' : ''
            }`}
            style={!showIndicatorMenu && activeIndicators.length === 0 ? { color: trTheme.textMuted } : undefined}>
            <Activity className="w-3.5 h-3.5" />
            <span className="text-[8px] font-bold">{activeIndicators.length > 0 ? activeIndicators.length : ''}</span>
          </button>
          {showIndicatorMenu && (
            <div className="absolute left-0 top-8 z-50 rounded-lg overflow-hidden py-1"
              style={{ background: trTheme.bgPanel, border: '1px solid ' + trTheme.border, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', minWidth: '190px', maxHeight: '320px', overflowY: 'auto' }}>
              {['Trend', 'Oscillator', 'Volume', 'Bill Williams'].map(group => {
                const groupIndicators = ALL_INDICATORS.filter(ind => ind.group === group)
                return (
                  <div key={group}>
                    <div className="px-2 py-0.5 text-[7px] font-bold uppercase tracking-widest flex items-center gap-1" style={{ color: trTheme.textFaint, borderTop: group === 'Trend' ? 'none' : `1px solid ${trTheme.borderSubtle}`, marginTop: group === 'Trend' ? 0 : 2, paddingTop: group === 'Trend' ? undefined : 4 }}>
                      <span>{group === 'Trend' ? '📊' : group === 'Oscillator' ? '📈' : group === 'Volume' ? '📦' : '🐊'}</span>
                      <span>{group}</span>
                    </div>
                    {groupIndicators.map(ind => {
                      const isActive = activeIndicators.some(a => a.key === ind.key)
                      return (
                        <button key={ind.key} onClick={() => {
                          setActiveIndicators(prev => {
                            if (isActive) return prev.filter(a => a.key !== ind.key)
                            return [...prev, { key: ind.key, label: ind.label, color: ind.color }]
                          })
                        }}
                          className={`w-full px-2 py-1 text-[9px] font-bold text-left flex items-center gap-1.5 transition-colors ${
                            isActive ? 'bg-black/5' : 'hover:bg-black/5'
                          }`}
                          style={{ color: isActive ? trTheme.text : trTheme.textSecondary }}>
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: isActive ? ind.color : trTheme.inputBg, border: `1px solid ${isActive ? ind.color : trTheme.inputBorder}` }} />
                          <span className="flex-1">{ind.label}</span>
                          <span className="text-[6px]" style={{ color: trTheme.textFaint }}>{ind.desc}</span>
                          {isActive && <Check className="w-2 h-2 text-green-400" />}
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <div className="w-px h-4" style={{ background: trTheme.borderSubtle }} />
        {/* Active indicator pills */}
        <div className="flex items-center gap-0.5 overflow-x-auto flex-1" style={{ scrollbarWidth: 'none' }}>
          {activeIndicators.map(ind => (
            <span key={ind.key} className="flex-shrink-0 h-5 px-1.5 rounded text-[7px] font-bold flex items-center gap-0.5" style={{ background: `${ind.color}15`, color: ind.color, border: `0.5px solid ${ind.color}30` }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: ind.color }} />
              {ind.label}
            </span>
          ))}
        </div>
      </div>
      )}

      {/* ══ 3. CHART AREA — MT5 Professional Chart (flex-1 fills remaining space) ══ */}
      <div className="flex-1 min-h-0 flex flex-col">
          {selectedSinyalStock && (
            <div className="relative flex-1 min-h-0 overflow-hidden" style={{ background: trTheme.chartBg }}>
              {/* Active Trades Overlay — Premium Glass Badges */}
              {sinyalPositions.filter(p => p.status === 'active').length > 0 && (
                <div className="absolute top-1.5 left-1.5 z-10 flex flex-col gap-1 max-w-[140px]">
                  {sinyalPositions.filter(p => p.status === 'active').map(ap => {
                    const isUp = ap.direction === 'NAIK'
                    const livePL = getPositionLivePL(ap)
                    return (
                      <div key={ap.id}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
                        style={{
                          backdropFilter: 'blur(12px)',
                          background: isUp ? 'rgba(34,197,94,0.06)' : 'rgba(239,83,80,0.06)',
                          border: `1px solid ${isUp ? 'rgba(34,197,94,0.12)' : 'rgba(239,83,80,0.12)'}`,
                          boxShadow: `0 2px 8px ${isUp ? 'rgba(34,197,94,0.08)' : 'rgba(239,83,80,0.08)'}`
                        }}>
                        <div className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-md"
                          style={{ background: isUp ? 'linear-gradient(135deg, #4ade80, #22c55e)' : 'linear-gradient(135deg, #f87171, #ef5350)' }}>
                          <span className="text-[6px] font-black text-white">{isUp ? 'B' : 'S'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`text-[8px] font-black ${isUp ? 'text-green-400' : 'text-red-400'}`}>{isUp ? 'BUY' : 'SELL'}</span>
                          <span className={`text-[8px] font-black ${livePL >= 0 ? 'text-green-400' : 'text-red-400'} ml-0.5`}>
                            {livePL >= 0 ? '+' : ''}{formatRupiah(livePL)}
                          </span>
                        </div>
                        <button onClick={() => closeSinyalPosition(ap.id)}
                          className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 hover:scale-110 transition-transform"
                          style={{ background: 'rgba(239,83,80,0.3)' }}
                          title="Tutup posisi">
                          <X className="w-2.5 h-2.5 text-white" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* ── CANDLESTICK CHART SVG ── */}
              <div className="w-full h-full"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  setSinyalCrosshair({ x: e.clientX - rect.left, y: e.clientY - rect.top, w: rect.width, h: rect.height })
                  if (sinyalDragRef.current.dragging) {
                    const dx = e.clientX - sinyalDragRef.current.startX
                    const candlesPerPx = 3 / rect.width
                    const offsetDelta = Math.round(dx * candlesPerPx)
                    const newOffset = Math.max(0, sinyalDragRef.current.startOffset + offsetDelta)
                    setSinyalChartOffset(newOffset)
                  }
                }}
                onMouseDown={(e) => {
                  sinyalDragRef.current = { startX: e.clientX, startOffset: sinyalChartOffsetRef.current, dragging: true }
                  e.preventDefault()
                }}
                onMouseUp={() => { sinyalDragRef.current.dragging = false }}
                onMouseLeave={() => { setSinyalCrosshair(null); sinyalDragRef.current.dragging = false }}
                onWheel={(e) => {
                  e.preventDefault()
                  if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                    const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY
                    const direction = delta > 0 ? -1 : 1
                    setSinyalChartOffset(prev => Math.max(0, prev + direction * 2))
                  } else {
                    const zoomDelta = e.deltaY > 0 ? 1 : -1
                    const step = sinyalChartZoomRef.current > 60 ? 4 : sinyalChartZoomRef.current > 30 ? 2 : 1
                    setSinyalChartZoom(prev => Math.max(8, Math.min(120, prev + zoomDelta * step)))
                  }
                }}
                onDoubleClick={() => { setSinyalChartZoom(40); setSinyalChartOffset(0) }}
                onTouchStart={(e) => {
                  if (e.touches.length === 1) {
                    sinyalDragRef.current = { startX: e.touches[0].clientX, startOffset: sinyalChartOffsetRef.current, dragging: true }
                  } else if (e.touches.length === 2) {
                    sinyalDragRef.current.dragging = false
                    const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY)
                    sinyalPinchRef.current = { startDist: dist, startZoom: sinyalChartZoomRef.current }
                  }
                }}
                onTouchMove={(e) => {
                  if (e.touches.length === 1 && sinyalDragRef.current.dragging) {
                    const dx = e.touches[0].clientX - sinyalDragRef.current.startX
                    const candlesPerPx = 3 / (e.currentTarget.getBoundingClientRect().width || 300)
                    const offsetDelta = Math.round(dx * candlesPerPx)
                    setSinyalChartOffset(Math.max(0, sinyalDragRef.current.startOffset + offsetDelta))
                  } else if (e.touches.length === 2 && sinyalPinchRef.current) {
                    e.preventDefault()
                    const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY)
                    const scale = sinyalPinchRef.current.startDist / dist
                    const newZoom = Math.max(8, Math.min(120, Math.round(sinyalPinchRef.current.startZoom * scale)))
                    setSinyalChartZoom(newZoom)
                  }
                }}
                onTouchEnd={() => {
                  sinyalDragRef.current.dragging = false
                  sinyalPinchRef.current = null
                }}
                style={{ cursor: sinyalDragRef.current?.dragging ? 'grabbing' : 'grab' }}>
                {(() => {
                  const allCandles = [...sinyalCandles]
                  const sim = sinyalChartSimRef.current
                  if (sim) {
                    const cc = sim.currentCandle
                    if (cc.tickCount > 0) {
                      allCandles.push({
                        idx: allCandles.length, open: cc.open, high: cc.high, low: cc.low, close: cc.close, volume: cc.volume,
                        time: new Date().getHours().toString().padStart(2, '0') + ':' + new Date().getMinutes().toString().padStart(2, '0'),
                      })
                    }
                  }
                  if (allCandles.length < 2) return <div className="flex items-center justify-center h-full text-[10px]" style={{ color: trTheme.textMuted }}>Memuat grafik...</div>

                  const allHighs = allCandles.map(c => c.high)
                  const allLows = allCandles.map(c => c.low)
                  const minP = Math.min(...allLows)
                  const maxP = Math.max(...allHighs)
                  const rangeP = maxP - minP || 1
                  const paddedMin = minP - rangeP * 0.08
                  const paddedMax = maxP + rangeP * 0.08
                  const paddedRange = paddedMax - paddedMin

                  const W = 600
                  const padR = 54
                  const padL = 1
                  const padT = 14
                  const padB = 0
                  const volH = 24
                  const timeAxisH = 12
                  const priceAreaH = 340 - padT - padB
                  const chartH = priceAreaH + padT + padB
                  const activeSubCharts = activeIndicators.filter(a => SUBCHART_KEYS.includes(a.key))
                  const visibleSubCharts = activeSubCharts.slice(0, 3)
                  const subChartH = visibleSubCharts.length * 44
                  const H = chartH + volH + timeAxisH + subChartH
                  const chartW = W - padR - padL

                  const yScale = (price: number) => padT + ((paddedMax - price) / paddedRange) * priceAreaH

                  const maxVisible = sinyalChartZoom
                  const totalCandles = allCandles.length
                  const endIdx = totalCandles - sinyalChartOffset
                  const startIdx = Math.max(0, endIdx - maxVisible)
                  const visibleCandles = allCandles.slice(startIdx, endIdx)
                  const candleCount = visibleCandles.length
                  if (candleCount === 0) return <div className="flex items-center justify-center h-full text-[10px]" style={{ color: trTheme.textMuted }}>Geser kembali...</div>
                  const candleSpacing = chartW / candleCount
                  const candleBodyW = Math.max(1.5, Math.min(candleSpacing * 0.65, 14))

                  const maxVol = Math.max(...visibleCandles.map(c => c.volume), 1)

                  const lastCandle = visibleCandles[candleCount - 1]
                  const lastPrice = lastCandle.close
                  const yLast = yScale(lastPrice)
                  const isUp = lastCandle.close >= lastCandle.open
                  const priceColor = isUp ? '#26a69a' : '#ef5350'

                  const activePositions = sinyalPositions.filter(p => p.status === 'active')

                  const gridLevels = 6
                  const gridPriceStep = paddedRange / gridLevels

                  return (
                    <svg className="w-full h-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ fontFamily: 'monospace' }}>
                      <defs>
                        <linearGradient id="priceBadgeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={priceColor} stopOpacity="1" />
                          <stop offset="100%" stopColor={priceColor} stopOpacity="0.85" />
                        </linearGradient>
                        <filter id="glowDot" x="-100%" y="-100%" width="300%" height="300%">
                          <feGaussianBlur stdDeviation="2" result="blur" />
                          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                      </defs>

                      {/* ── Chart Background ── */}
                      <defs>
                        <linearGradient id="chartBgGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={isTrDark ? '#0d1117' : '#fafbfc'} />
                          <stop offset="50%" stopColor={isTrDark ? '#0a0e17' : '#ffffff'} />
                          <stop offset="100%" stopColor={isTrDark ? '#080c14' : '#f5f6f8'} />
                        </linearGradient>
                      </defs>
                      <rect x={padL} y={padT} width={chartW} height={priceAreaH} fill="url(#chartBgGrad)" />

                      {/* ── Horizontal grid lines — MT5 subtle dotted ── */}
                      {Array.from({ length: gridLevels + 1 }).map((_, gi) => {
                        const gy = padT + (gi / gridLevels) * priceAreaH
                        const priceLabel = paddedMax - gridPriceStep * gi
                        return (
                          <g key={`hg-${gi}`}>
                            <line x1={padL} y1={gy} x2={padL + chartW} y2={gy}
                              stroke={trTheme.gridLine} strokeWidth="0.3" strokeDasharray="1,3" />
                            <text x={padL + chartW + 3} y={gy + 2.5} fontSize="7" fill={trTheme.gridText} fontFamily="monospace" fontWeight="600" textAnchor="start">{fmtChartPrice(priceLabel)}</text>
                          </g>
                        )
                      })}

                      {/* ── Vertical grid lines with time labels ── */}
                      {(() => {
                        const step = Math.max(1, Math.floor(candleCount / 5))
                        const items: JSX.Element[] = []
                        visibleCandles.forEach((c, i) => {
                          if (i % step !== 0 && i !== candleCount - 1) return
                          const vx = padL + (i + 0.5) * candleSpacing
                          items.push(
                            <g key={`vg-${i}`}>
                              <line x1={vx} y1={padT} x2={vx} y2={padT + priceAreaH}
                                stroke={trTheme.gridLine} strokeWidth="0.3" strokeDasharray="1,3" />
                              <text x={vx} y={chartH + volH + 8} fontSize="5.5" fill={trTheme.gridText} textAnchor="middle" fontFamily="monospace" fontWeight="600">{c.time}</text>
                            </g>
                          )
                        })
                        return items
                      })()}

                      {/* ── Price/Volume separator ── */}
                      <line x1={padL} y1={chartH} x2={padL + chartW} y2={chartH} stroke={trTheme.border} strokeWidth="0.3" />

                      {/* Volume bars — MT5 style thin */}
                      {visibleCandles.map((c, i) => {
                        const x = padL + i * candleSpacing + (candleSpacing - candleBodyW * 0.4) / 2
                        const volBarH = (c.volume / maxVol) * (volH - 4)
                        const isBull = c.close >= c.open
                        return (
                          <rect key={`vol-${i}`} x={x} y={chartH + volH - volBarH - 1} width={candleBodyW * 0.4} height={Math.max(0.3, volBarH)}
                            fill={isBull ? 'rgba(38,166,154,0.30)' : 'rgba(239,83,80,0.30)'} />
                        )
                      })}

                      {/* ── Chart Type Rendering ── */}
                      {chartType === 'candle' && visibleCandles.map((c, i) => {
                        const cx = padL + (i + 0.5) * candleSpacing
                        const isBull = c.close >= c.open
                        const bodyTop = yScale(Math.max(c.open, c.close))
                        const bodyBot = yScale(Math.min(c.open, c.close))
                        const bodyH = Math.max(0.6, bodyBot - bodyTop)
                        const wickTop = yScale(c.high)
                        const wickBot = yScale(c.low)
                        const wickW = candleBodyW > 6 ? 1 : 0.7
                        const bullColor = '#26a69a'
                        const bearColor = '#ef5350'
                        const fillColor = isBull ? bullColor : bearColor
                        const strokeColor = isBull ? '#2bbd8e' : '#f87171'
                        return (
                          <g key={`candle-${i}`}>
                            {/* Upper wick */}
                            <line x1={cx} y1={wickTop} x2={cx} y2={bodyTop} stroke={fillColor} strokeWidth={wickW} strokeLinecap="round" />
                            {/* Lower wick */}
                            <line x1={cx} y1={bodyBot} x2={cx} y2={wickBot} stroke={fillColor} strokeWidth={wickW} strokeLinecap="round" />
                            {/* Candle body — solid filled */}
                            <rect x={cx - candleBodyW / 2} y={bodyTop} width={candleBodyW} height={bodyH}
                              fill={fillColor} stroke={strokeColor} strokeWidth={candleBodyW > 4 ? 0.4 : 0.2} rx={candleBodyW > 8 ? 0.8 : candleBodyW > 5 ? 0.4 : 0} />
                            {/* Subtle inner glow for 3D effect */}
                            {candleBodyW > 5 && bodyH > 2 && (
                              <rect x={cx - candleBodyW / 2 + 0.5} y={bodyTop + 0.5} width={candleBodyW - 1} height={Math.max(0.3, bodyH * 0.3)}
                                fill={isBull ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.08)'} rx="0.3" />
                            )}
                          </g>
                        )
                      })}

                      {/* Continuous Price Line - smooth spline */}
                      {chartType === 'candle' && (() => {
                        const pts: { x: number; y: number }[] = []
                        visibleCandles.forEach((c, i) => {
                          pts.push({ x: padL + (i + 0.5) * candleSpacing, y: yScale(c.close) })
                        })
                        if (pts.length < 2) return null
                        let pathD = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`
                        for (let j = 1; j < pts.length; j++) {
                          const prev = pts[j - 1]
                          const curr = pts[j]
                          const cpx = (prev.x + curr.x) / 2
                          pathD += ` C${cpx.toFixed(1)},${prev.y.toFixed(1)} ${cpx.toFixed(1)},${curr.y.toFixed(1)} ${curr.x.toFixed(1)},${curr.y.toFixed(1)}`
                        }
                        const lineColor = isUp ? 'rgba(38,166,154,' : 'rgba(239,83,80,'
                        return <g>
                          <path d={pathD} fill="none" stroke={lineColor + '0.12)'} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
                          <path d={pathD} fill="none" stroke={lineColor + '0.35)'} strokeWidth="0.7" strokeLinejoin="round" strokeLinecap="round" />
                        </g>
                      })()}
                      {/* Line Chart */}
                      {chartType === 'line' && (() => {
                        const pts: { x: number; y: number }[] = []
                        visibleCandles.forEach((c, i) => {
                          pts.push({ x: padL + (i + 0.5) * candleSpacing, y: yScale(c.close) })
                        })
                        if (pts.length < 2) return null
                        const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
                        const areaD = pathD + ` L${pts[pts.length - 1].x.toFixed(1)},${(padT + priceAreaH).toFixed(1)} L${pts[0].x.toFixed(1)},${(padT + priceAreaH).toFixed(1)} Z`
                        return (
                          <g>
                            <defs>
                              <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={priceColor} stopOpacity="0.15" />
                                <stop offset="100%" stopColor={priceColor} stopOpacity="0" />
                              </linearGradient>
                            </defs>
                            <path d={areaD} fill="url(#lineAreaGrad)" />
                            <path d={pathD} fill="none" stroke={priceColor} strokeWidth="1" strokeLinejoin="round" strokeLinecap="round" opacity="0.9" />
                          </g>
                        )
                      })()}

                      {/* Bar Chart (OHLC bars) */}
                      {chartType === 'bar' && visibleCandles.map((c, i) => {
                        const cx = padL + (i + 0.5) * candleSpacing
                        const isBull = c.close >= c.open
                        const color = isBull ? '#26a69a' : '#ef5350'
                        const wickTop = yScale(c.high)
                        const wickBot = yScale(c.low)
                        const openY = yScale(c.open)
                        const closeY = yScale(c.close)
                        const barHalf = Math.max(1, candleBodyW * 0.35)
                        return (
                          <g key={`bar-${i}`}>
                            <line x1={cx} y1={wickTop} x2={cx} y2={wickBot} stroke={color} strokeWidth="0.6" />
                            <line x1={cx - barHalf} y1={openY} x2={cx} y2={openY} stroke={color} strokeWidth="0.8" />
                            <line x1={cx} y1={closeY} x2={cx + barHalf} y2={closeY} stroke={color} strokeWidth="0.8" />
                          </g>
                        )
                      })}

                      {/* ── Indicator Overlays ── */}
                      {/* MA5 */}
                      {activeIndicators.some(a => a.key === 'ma5') && (() => {
                        const ma5 = computeMA(visibleCandles, 5)
                        const pts: { x: number; y: number }[] = []
                        ma5.forEach((v, i) => { if (v !== null) pts.push({ x: padL + (i + 0.5) * candleSpacing, y: yScale(v) }) })
                        if (pts.length < 2) return null
                        const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
                        return <path d={pathD} fill="none" stroke="#eab308" strokeWidth="0.5" opacity="0.45" strokeLinejoin="round" strokeLinecap="round" />
                      })()}
                      {/* MA20 */}
                      {activeIndicators.some(a => a.key === 'ma20') && (() => {
                        const ma20 = computeMA(visibleCandles, 20)
                        const pts: { x: number; y: number }[] = []
                        ma20.forEach((v, i) => { if (v !== null) pts.push({ x: padL + (i + 0.5) * candleSpacing, y: yScale(v) }) })
                        if (pts.length < 2) return null
                        const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
                        return <path d={pathD} fill="none" stroke="#06b6d4" strokeWidth="0.5" opacity="0.35" strokeLinejoin="round" strokeLinecap="round" />
                      })()}

                      {/* Bollinger Bands */}
                      {activeIndicators.some(a => a.key === 'bollinger') && (() => {
                        const bb = computeBollinger(visibleCandles)
                        const upperPts: { x: number; y: number }[] = []
                        const lowerPts: { x: number; y: number }[] = []
                        bb.upper.forEach((v, i) => { if (v !== null) upperPts.push({ x: padL + (i + 0.5) * candleSpacing, y: yScale(v) }) })
                        bb.lower.forEach((v, i) => { if (v !== null) lowerPts.push({ x: padL + (i + 0.5) * candleSpacing, y: yScale(v) }) })
                        if (upperPts.length < 2 || lowerPts.length < 2) return null
                        const upperPath = upperPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
                        const lowerPath = lowerPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
                        const fillPath = upperPath + ' ' + lowerPts.slice().reverse().map((p, i) => `${i === 0 ? 'L' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z'
                        return (
                          <g>
                            <path d={fillPath} fill="rgba(139,92,246,0.04)" />
                            <path d={upperPath} fill="none" stroke="#8b5cf6" strokeWidth="0.4" opacity="0.5" strokeLinejoin="round" />
                            <path d={lowerPath} fill="none" stroke="#8b5cf6" strokeWidth="0.4" opacity="0.5" strokeLinejoin="round" />
                          </g>
                        )
                      })()}

                      {/* Envelopes */}
                      {activeIndicators.some(a => a.key === 'envelopes') && (() => {
                        const env = computeEnvelopes(visibleCandles)
                        const upperPts: { x: number; y: number }[] = []
                        const lowerPts: { x: number; y: number }[] = []
                        env.upper.forEach((v, i) => { if (v !== null) upperPts.push({ x: padL + (i + 0.5) * candleSpacing, y: yScale(v) }) })
                        env.lower.forEach((v, i) => { if (v !== null) lowerPts.push({ x: padL + (i + 0.5) * candleSpacing, y: yScale(v) }) })
                        if (upperPts.length < 2 || lowerPts.length < 2) return null
                        const upperPath = upperPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
                        const lowerPath = lowerPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
                        const fillPath = upperPath + ' ' + lowerPts.slice().reverse().map(p => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z'
                        return (
                          <g>
                            <path d={fillPath} fill="rgba(20,184,166,0.03)" />
                            <path d={upperPath} fill="none" stroke="#14b8a6" strokeWidth="0.4" opacity="0.45" strokeLinejoin="round" />
                            <path d={lowerPath} fill="none" stroke="#14b8a6" strokeWidth="0.4" opacity="0.45" strokeLinejoin="round" />
                          </g>
                        )
                      })()}

                      {/* Ichimoku Kinko Hyo */}
                      {activeIndicators.some(a => a.key === 'ichimoku') && (() => {
                        const ich = computeIchimoku(visibleCandles)
                        const mkPts = (arr: (number | null)[]) => { const pts: { x: number; y: number }[] = []; arr.forEach((v, i) => { if (v !== null) pts.push({ x: padL + (i + 0.5) * candleSpacing, y: yScale(v) }) }); return pts }
                        const mkPath = (pts: { x: number; y: number }[]) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
                        const tenkanPts = mkPts(ich.tenkan)
                        const kijunPts = mkPts(ich.kijun)
                        const senkouAPts = mkPts(ich.senkouA)
                        const senkouBPts = mkPts(ich.senkouB)
                        const chikouPts = mkPts(ich.chikou)
                        // Cloud fill
                        let cloudFill: JSX.Element | null = null
                        if (senkouAPts.length >= 2 && senkouBPts.length >= 2) {
                          const aPath = mkPath(senkouAPts)
                          const bPath = mkPath(senkouBPts)
                          const fillD = aPath + ' ' + senkouBPts.slice().reverse().map(p => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z'
                          cloudFill = <path d={fillD} fill="rgba(234,179,8,0.04)" />
                        }
                        return (
                          <g>
                            {cloudFill}
                            {tenkanPts.length >= 2 && <path d={mkPath(tenkanPts)} fill="none" stroke="#eab308" strokeWidth="0.4" opacity="0.5" strokeLinejoin="round" />}
                            {kijunPts.length >= 2 && <path d={mkPath(kijunPts)} fill="none" stroke="#3b82f6" strokeWidth="0.4" opacity="0.5" strokeLinejoin="round" />}
                            {senkouAPts.length >= 2 && <path d={mkPath(senkouAPts)} fill="none" stroke="#22c55e" strokeWidth="0.3" opacity="0.35" strokeLinejoin="round" strokeDasharray="2,1" />}
                            {senkouBPts.length >= 2 && <path d={mkPath(senkouBPts)} fill="none" stroke="#ef4444" strokeWidth="0.3" opacity="0.35" strokeLinejoin="round" strokeDasharray="2,1" />}
                            {chikouPts.length >= 2 && <path d={mkPath(chikouPts)} fill="none" stroke="#a855f7" strokeWidth="0.3" opacity="0.3" strokeLinejoin="round" />}
                          </g>
                        )
                      })()}

                      {/* Parabolic SAR */}
                      {activeIndicators.some(a => a.key === 'sar') && (() => {
                        const sarData = computeSAR(visibleCandles)
                        return (
                          <g>
                            {sarData.map((v, i) => {
                              if (v === null) return null
                              const cx = padL + (i + 0.5) * candleSpacing
                              const cy = yScale(v)
                              const isAbove = v > visibleCandles[i].close
                              return <circle key={`sar-${i}`} cx={cx} cy={cy} r={candleSpacing > 4 ? 1.2 : 0.8} fill={isAbove ? 'rgba(239,83,80,0.5)' : 'rgba(34,197,94,0.5)'} />
                            })}
                          </g>
                        )
                      })()}

                      {/* ZigZag */}
                      {activeIndicators.some(a => a.key === 'zigzag') && (() => {
                        const zzData = computeZigZag(visibleCandles)
                        const pts: { x: number; y: number }[] = []
                        zzData.forEach((v, i) => { if (v !== null) pts.push({ x: padL + (i + 0.5) * candleSpacing, y: yScale(v) }) })
                        if (pts.length < 2) return null
                        const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
                        return <path d={pathD} fill="none" stroke="#a855f7" strokeWidth="0.6" opacity="0.5" strokeLinejoin="round" strokeLinecap="round" />
                      })()}

                      {/* Alligator */}
                      {activeIndicators.some(a => a.key === 'alligator') && (() => {
                        const alg = computeAlligator(visibleCandles)
                        const mkPts = (arr: (number | null)[]) => { const pts: { x: number; y: number }[] = []; arr.forEach((v, i) => { if (v !== null) pts.push({ x: padL + (i + 0.5) * candleSpacing, y: yScale(v) }) }); return pts }
                        const mkPath = (pts: { x: number; y: number }[]) => pts.length >= 2 ? pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') : ''
                        const jawPts = mkPts(alg.jaw)
                        const teethPts = mkPts(alg.teeth)
                        const lipsPts = mkPts(alg.lips)
                        return (
                          <g>
                            {jawPts.length >= 2 && <path d={mkPath(jawPts)} fill="none" stroke="#3b82f6" strokeWidth="0.5" opacity="0.4" strokeLinejoin="round" />}
                            {teethPts.length >= 2 && <path d={mkPath(teethPts)} fill="none" stroke="#ef4444" strokeWidth="0.5" opacity="0.4" strokeLinejoin="round" />}
                            {lipsPts.length >= 2 && <path d={mkPath(lipsPts)} fill="none" stroke="#22c55e" strokeWidth="0.5" opacity="0.4" strokeLinejoin="round" />}
                          </g>
                        )
                      })()}

                      {/* Fractals */}
                      {activeIndicators.some(a => a.key === 'fractals') && (() => {
                        const frac = computeFractals(visibleCandles)
                        return (
                          <g>
                            {frac.up.map((v, i) => {
                              if (!v) return null
                              const cx = padL + (i + 0.5) * candleSpacing
                              const cy = yScale(visibleCandles[i].high) - 3
                              return <polygon key={`frac-up-${i}`} points={`${cx},${cy} ${cx-1.5},${cy-2.5} ${cx+1.5},${cy-2.5}`} fill="rgba(239,83,80,0.5)" />
                            })}
                            {frac.down.map((v, i) => {
                              if (!v) return null
                              const cx = padL + (i + 0.5) * candleSpacing
                              const cy = yScale(visibleCandles[i].low) + 3
                              return <polygon key={`frac-dn-${i}`} points={`${cx},${cy} ${cx-1.5},${cy+2.5} ${cx+1.5},${cy+2.5}`} fill="rgba(34,197,94,0.5)" />
                            })}
                          </g>
                        )
                      })()}

                      {/* ── Sub-chart Indicators (dynamic, max 3) ── */}
                      {visibleSubCharts.map((subInd, subIdx) => {
                        const subY = padT + priceAreaH + volH + timeAxisH + subIdx * 44 + 2
                        const subH = 40
                        const subPad = 2
                        const xOf = (i: number) => padL + (i + 0.5) * candleSpacing
                        const indColor = subInd.color
                        const indKey = subInd.key
                        const indLabel = subInd.label

                        // Helper: make line path from array
                        const mkLine = (arr: (number | null)[], yFn: (v: number) => number) => {
                          const pts: { x: number; y: number }[] = []
                          arr.forEach((v, i) => { if (v !== null) pts.push({ x: xOf(i), y: yFn(v) }) })
                          return pts.length >= 2 ? pts.map((p, j) => `${j === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') : null
                        }

                        // Helper: auto-scale from array
                        const autoScale = (arr: (number | null)[], pad = 2) => {
                          const vals = arr.filter((v): v is number => v !== null)
                          if (vals.length === 0) return { min: -1, max: 1, yFn: (v: number) => subY + subH / 2 }
                          const mn = Math.min(...vals), mx = Math.max(...vals)
                          const range = mx - mn || 1
                          const scaledMin = mn - range * 0.05, scaledMax = mx + range * 0.05
                          const scaledRange = scaledMax - scaledMin
                          return { min: scaledMin, max: scaledMax, yFn: (v: number) => subY + subPad + ((scaledMax - v) / scaledRange) * (subH - subPad * 2) }
                        }

                        // Helper: fixed range scale
                        const fixedScale = (lo: number, hi: number) => {
                          const range = hi - lo
                          return (v: number) => subY + subPad + ((hi - v) / range) * (subH - subPad * 2)
                        }

                        // Helper: zero-centered auto-scale
                        const zeroScale = (arr: (number | null)[]) => {
                          const vals = arr.filter((v): v is number => v !== null)
                          const maxAbs = Math.max(...vals.map(Math.abs), 0.001)
                          return (v: number) => subY + subH / 2 - (v / maxAbs) * (subH / 2 - subPad)
                        }

                        // Background & label for every sub-chart
                        const bgRect = <rect x={padL} y={subY} width={chartW} height={subH} fill={`${indColor}03`} rx="1" />
                        const labelText = <text x={padL + 2} y={subY + 5} fontSize="4.5" fill={`${indColor}80`} fontFamily="monospace" fontWeight="700">{indLabel}</text>

                        switch (indKey) {
                          case 'rsi': {
                            const data = computeRSI(visibleCandles)
                            const yFn = fixedScale(0, 100)
                            const line = mkLine(data, yFn)
                            return (
                              <g key={indKey}>
                                {bgRect}{labelText}
                                <line x1={padL} y1={yFn(70)} x2={padL + chartW} y2={yFn(70)} stroke="rgba(239,83,80,0.2)" strokeWidth="0.3" strokeDasharray="2,2" />
                                <line x1={padL} y1={yFn(30)} x2={padL + chartW} y2={yFn(30)} stroke="rgba(34,197,94,0.2)" strokeWidth="0.3" strokeDasharray="2,2" />
                                <line x1={padL} y1={yFn(50)} x2={padL + chartW} y2={yFn(50)} stroke={trTheme.gridLine} strokeWidth="0.2" />
                                <text x={padL + chartW + 2} y={yFn(70) + 2} fontSize="4" fill="rgba(239,83,80,0.35)" fontFamily="monospace">70</text>
                                <text x={padL + chartW + 2} y={yFn(30) + 2} fontSize="4" fill="rgba(34,197,94,0.35)" fontFamily="monospace">30</text>
                                {line && <path d={line} fill="none" stroke={indColor} strokeWidth="0.5" opacity="0.7" strokeLinejoin="round" />}
                              </g>
                            )
                          }
                          case 'macd': {
                            const data = computeMACD(visibleCandles)
                            const yFn = zeroScale([...data.macd, ...data.signal].filter((v): v is number => v !== null))
                            const macdLine = mkLine(data.macd, yFn)
                            const sigLine = mkLine(data.signal, yFn)
                            return (
                              <g key={indKey}>
                                {bgRect}{labelText}
                                <line x1={padL} y1={subY + subH / 2} x2={padL + chartW} y2={subY + subH / 2} stroke={trTheme.border} strokeWidth="0.3" />
                                {data.histogram.map((v, i) => {
                                  if (v === null) return null
                                  const x = padL + i * candleSpacing + candleSpacing * 0.15
                                  const w = candleSpacing * 0.7
                                  const y0 = subY + subH / 2
                                  const y1 = yFn(v)
                                  return <rect key={`macd-h-${i}`} x={x} y={Math.min(y0, y1)} width={Math.max(0.3, w)} height={Math.abs(y1 - y0)} fill={v >= 0 ? 'rgba(34,197,94,0.3)' : 'rgba(239,83,80,0.3)'} rx="0.3" />
                                })}
                                {macdLine && <path d={macdLine} fill="none" stroke="#3b82f6" strokeWidth="0.5" opacity="0.7" strokeLinejoin="round" />}
                                {sigLine && <path d={sigLine} fill="none" stroke="#ef5350" strokeWidth="0.4" opacity="0.5" strokeLinejoin="round" />}
                              </g>
                            )
                          }
                          case 'adx': {
                            const data = computeADX(visibleCandles)
                            const yFn = fixedScale(0, 100)
                            const adxLine = mkLine(data.adx, yFn)
                            const pdiLine = mkLine(data.plusDI, yFn)
                            const mdiLine = mkLine(data.minusDI, yFn)
                            return (
                              <g key={indKey}>
                                {bgRect}{labelText}
                                <line x1={padL} y1={yFn(25)} x2={padL + chartW} y2={yFn(25)} stroke={trTheme.gridLine} strokeWidth="0.2" strokeDasharray="2,2" />
                                <text x={padL + chartW + 2} y={yFn(25) + 2} fontSize="4" fill={`${indColor}40`} fontFamily="monospace">25</text>
                                {adxLine && <path d={adxLine} fill="none" stroke={indColor} strokeWidth="0.6" opacity="0.7" strokeLinejoin="round" />}
                                {pdiLine && <path d={pdiLine} fill="none" stroke="#22c55e" strokeWidth="0.4" opacity="0.5" strokeLinejoin="round" />}
                                {mdiLine && <path d={mdiLine} fill="none" stroke="#ef4444" strokeWidth="0.4" opacity="0.5" strokeLinejoin="round" />}
                              </g>
                            )
                          }
                          case 'atr': {
                            const data = computeATR(visibleCandles)
                            const { yFn } = autoScale(data)
                            const line = mkLine(data, yFn)
                            return (
                              <g key={indKey}>
                                {bgRect}{labelText}
                                {line && <path d={line} fill="none" stroke={indColor} strokeWidth="0.5" opacity="0.7" strokeLinejoin="round" />}
                              </g>
                            )
                          }
                          case 'bears': {
                            const data = computeBearsPower(visibleCandles)
                            const yFn = zeroScale(data)
                            const line = mkLine(data, yFn)
                            return (
                              <g key={indKey}>
                                {bgRect}{labelText}
                                <line x1={padL} y1={subY + subH / 2} x2={padL + chartW} y2={subY + subH / 2} stroke={trTheme.border} strokeWidth="0.3" />
                                {line && <path d={line} fill="none" stroke={indColor} strokeWidth="0.5" opacity="0.7" strokeLinejoin="round" />}
                              </g>
                            )
                          }
                          case 'bulls': {
                            const data = computeBullsPower(visibleCandles)
                            const yFn = zeroScale(data)
                            const line = mkLine(data, yFn)
                            return (
                              <g key={indKey}>
                                {bgRect}{labelText}
                                <line x1={padL} y1={subY + subH / 2} x2={padL + chartW} y2={subY + subH / 2} stroke={trTheme.border} strokeWidth="0.3" />
                                {line && <path d={line} fill="none" stroke={indColor} strokeWidth="0.5" opacity="0.7" strokeLinejoin="round" />}
                              </g>
                            )
                          }
                          case 'cci': {
                            const data = computeCCI(visibleCandles)
                            const yFn = zeroScale(data)
                            const line = mkLine(data, yFn)
                            return (
                              <g key={indKey}>
                                {bgRect}{labelText}
                                <line x1={padL} y1={subY + subH / 2} x2={padL + chartW} y2={subY + subH / 2} stroke={trTheme.border} strokeWidth="0.3" />
                                <line x1={padL} y1={yFn(100)} x2={padL + chartW} y2={yFn(100)} stroke="rgba(239,83,80,0.15)" strokeWidth="0.3" strokeDasharray="2,2" />
                                <line x1={padL} y1={yFn(-100)} x2={padL + chartW} y2={yFn(-100)} stroke="rgba(34,197,94,0.15)" strokeWidth="0.3" strokeDasharray="2,2" />
                                {line && <path d={line} fill="none" stroke={indColor} strokeWidth="0.5" opacity="0.7" strokeLinejoin="round" />}
                              </g>
                            )
                          }
                          case 'demarker': {
                            const data = computeDeMarker(visibleCandles)
                            const yFn = fixedScale(0, 1)
                            const line = mkLine(data, yFn)
                            return (
                              <g key={indKey}>
                                {bgRect}{labelText}
                                <line x1={padL} y1={yFn(0.7)} x2={padL + chartW} y2={yFn(0.7)} stroke="rgba(239,83,80,0.2)" strokeWidth="0.3" strokeDasharray="2,2" />
                                <line x1={padL} y1={yFn(0.3)} x2={padL + chartW} y2={yFn(0.3)} stroke="rgba(34,197,94,0.2)" strokeWidth="0.3" strokeDasharray="2,2" />
                                <line x1={padL} y1={yFn(0.5)} x2={padL + chartW} y2={yFn(0.5)} stroke={trTheme.gridLine} strokeWidth="0.2" />
                                {line && <path d={line} fill="none" stroke={indColor} strokeWidth="0.5" opacity="0.7" strokeLinejoin="round" />}
                              </g>
                            )
                          }
                          case 'force': {
                            const data = computeForceIndex(visibleCandles)
                            const yFn = zeroScale(data)
                            const line = mkLine(data, yFn)
                            return (
                              <g key={indKey}>
                                {bgRect}{labelText}
                                <line x1={padL} y1={subY + subH / 2} x2={padL + chartW} y2={subY + subH / 2} stroke={trTheme.border} strokeWidth="0.3" />
                                {line && <path d={line} fill="none" stroke={indColor} strokeWidth="0.5" opacity="0.7" strokeLinejoin="round" />}
                              </g>
                            )
                          }
                          case 'momentum': {
                            const data = computeMomentum(visibleCandles)
                            const yFn = zeroScale(data)
                            const line = mkLine(data, yFn)
                            return (
                              <g key={indKey}>
                                {bgRect}{labelText}
                                <line x1={padL} y1={subY + subH / 2} x2={padL + chartW} y2={subY + subH / 2} stroke={trTheme.border} strokeWidth="0.3" />
                                {line && <path d={line} fill="none" stroke={indColor} strokeWidth="0.5" opacity="0.7" strokeLinejoin="round" />}
                              </g>
                            )
                          }
                          case 'osma': {
                            const data = computeOsMA(visibleCandles)
                            const yFn = zeroScale(data)
                            return (
                              <g key={indKey}>
                                {bgRect}{labelText}
                                <line x1={padL} y1={subY + subH / 2} x2={padL + chartW} y2={subY + subH / 2} stroke={trTheme.border} strokeWidth="0.3" />
                                {data.map((v, i) => {
                                  if (v === null) return null
                                  const x = padL + i * candleSpacing + candleSpacing * 0.15
                                  const w = candleSpacing * 0.7
                                  const y0 = subY + subH / 2
                                  const y1 = yFn(v)
                                  return <rect key={`osma-h-${i}`} x={x} y={Math.min(y0, y1)} width={Math.max(0.3, w)} height={Math.abs(y1 - y0)} fill={v >= 0 ? 'rgba(34,197,94,0.3)' : 'rgba(239,83,80,0.3)'} rx="0.3" />
                                })}
                              </g>
                            )
                          }
                          case 'rvi': {
                            const data = computeRVI(visibleCandles)
                            const yFn = zeroScale([...data.rvi, ...data.signal].filter((v): v is number => v !== null))
                            const rviLine = mkLine(data.rvi, yFn)
                            const sigLine = mkLine(data.signal, yFn)
                            return (
                              <g key={indKey}>
                                {bgRect}{labelText}
                                <line x1={padL} y1={subY + subH / 2} x2={padL + chartW} y2={subY + subH / 2} stroke={trTheme.border} strokeWidth="0.3" />
                                {rviLine && <path d={rviLine} fill="none" stroke={indColor} strokeWidth="0.5" opacity="0.7" strokeLinejoin="round" />}
                                {sigLine && <path d={sigLine} fill="none" stroke="#ef5350" strokeWidth="0.4" opacity="0.5" strokeLinejoin="round" />}
                              </g>
                            )
                          }
                          case 'stochastic': {
                            const data = computeStochastic(visibleCandles)
                            const yFn = fixedScale(0, 100)
                            const kLine = mkLine(data.k, yFn)
                            const dLine = mkLine(data.d, yFn)
                            return (
                              <g key={indKey}>
                                {bgRect}{labelText}
                                <line x1={padL} y1={yFn(80)} x2={padL + chartW} y2={yFn(80)} stroke="rgba(239,83,80,0.2)" strokeWidth="0.3" strokeDasharray="2,2" />
                                <line x1={padL} y1={yFn(20)} x2={padL + chartW} y2={yFn(20)} stroke="rgba(34,197,94,0.2)" strokeWidth="0.3" strokeDasharray="2,2" />
                                <line x1={padL} y1={yFn(50)} x2={padL + chartW} y2={yFn(50)} stroke={trTheme.gridLine} strokeWidth="0.2" />
                                {kLine && <path d={kLine} fill="none" stroke={indColor} strokeWidth="0.5" opacity="0.7" strokeLinejoin="round" />}
                                {dLine && <path d={dLine} fill="none" stroke="#3b82f6" strokeWidth="0.4" opacity="0.5" strokeLinejoin="round" />}
                              </g>
                            )
                          }
                          case 'williamsr': {
                            const data = computeWilliamsR(visibleCandles)
                            const yFn = fixedScale(-100, 0)
                            const line = mkLine(data, yFn)
                            return (
                              <g key={indKey}>
                                {bgRect}{labelText}
                                <line x1={padL} y1={yFn(-20)} x2={padL + chartW} y2={yFn(-20)} stroke="rgba(239,83,80,0.2)" strokeWidth="0.3" strokeDasharray="2,2" />
                                <line x1={padL} y1={yFn(-80)} x2={padL + chartW} y2={yFn(-80)} stroke="rgba(34,197,94,0.2)" strokeWidth="0.3" strokeDasharray="2,2" />
                                <line x1={padL} y1={yFn(-50)} x2={padL + chartW} y2={yFn(-50)} stroke={trTheme.gridLine} strokeWidth="0.2" />
                                {line && <path d={line} fill="none" stroke={indColor} strokeWidth="0.5" opacity="0.7" strokeLinejoin="round" />}
                              </g>
                            )
                          }
                          case 'ad': {
                            const data = computeAD(visibleCandles)
                            const dataNullable: (number | null)[] = data
                            const { yFn } = autoScale(dataNullable)
                            const line = mkLine(dataNullable, yFn)
                            return (
                              <g key={indKey}>
                                {bgRect}{labelText}
                                {line && <path d={line} fill="none" stroke={indColor} strokeWidth="0.5" opacity="0.7" strokeLinejoin="round" />}
                              </g>
                            )
                          }
                          case 'mfi': {
                            const data = computeMFI(visibleCandles)
                            const yFn = fixedScale(0, 100)
                            const line = mkLine(data, yFn)
                            return (
                              <g key={indKey}>
                                {bgRect}{labelText}
                                <line x1={padL} y1={yFn(80)} x2={padL + chartW} y2={yFn(80)} stroke="rgba(239,83,80,0.2)" strokeWidth="0.3" strokeDasharray="2,2" />
                                <line x1={padL} y1={yFn(20)} x2={padL + chartW} y2={yFn(20)} stroke="rgba(34,197,94,0.2)" strokeWidth="0.3" strokeDasharray="2,2" />
                                {line && <path d={line} fill="none" stroke={indColor} strokeWidth="0.5" opacity="0.7" strokeLinejoin="round" />}
                              </g>
                            )
                          }
                          case 'obv': {
                            const data = computeOBV(visibleCandles)
                            const dataNullable: (number | null)[] = data
                            const { yFn } = autoScale(dataNullable)
                            const line = mkLine(dataNullable, yFn)
                            return (
                              <g key={indKey}>
                                {bgRect}{labelText}
                                {line && <path d={line} fill="none" stroke={indColor} strokeWidth="0.5" opacity="0.7" strokeLinejoin="round" />}
                              </g>
                            )
                          }
                          case 'volumes': {
                            const data = visibleCandles.map(c => c.volume)
                            const { yFn } = autoScale(data.map(v => v as number | null), 2)
                            return (
                              <g key={indKey}>
                                {bgRect}{labelText}
                                {data.map((v, i) => {
                                  const x = padL + i * candleSpacing + candleSpacing * 0.1
                                  const w = candleSpacing * 0.8
                                  const y1 = yFn(v)
                                  const y0 = yFn(0)
                                  const isBull = visibleCandles[i].close >= visibleCandles[i].open
                                  return <rect key={`vol-h-${i}`} x={x} y={Math.min(y0, y1)} width={Math.max(0.3, w)} height={Math.abs(y1 - y0)} fill={isBull ? 'rgba(34,197,94,0.25)' : 'rgba(239,83,80,0.25)'} rx="0.3" />
                                })}
                              </g>
                            )
                          }
                          case 'ac': {
                            const data = computeAC(visibleCandles)
                            const yFn = zeroScale(data)
                            return (
                              <g key={indKey}>
                                {bgRect}{labelText}
                                <line x1={padL} y1={subY + subH / 2} x2={padL + chartW} y2={subY + subH / 2} stroke={trTheme.border} strokeWidth="0.3" />
                                {data.map((v, i) => {
                                  if (v === null) return null
                                  const x = padL + i * candleSpacing + candleSpacing * 0.1
                                  const w = candleSpacing * 0.8
                                  const y0 = subY + subH / 2
                                  const y1 = yFn(v)
                                  const prev = i > 0 && data[i-1] !== null ? data[i-1]! : 0
                                  const barColor = v > prev ? 'rgba(34,197,94,0.35)' : 'rgba(239,83,80,0.35)'
                                  return <rect key={`ac-h-${i}`} x={x} y={Math.min(y0, y1)} width={Math.max(0.3, w)} height={Math.abs(y1 - y0)} fill={barColor} rx="0.3" />
                                })}
                              </g>
                            )
                          }
                          case 'ao': {
                            const data = computeAO(visibleCandles)
                            const yFn = zeroScale(data)
                            return (
                              <g key={indKey}>
                                {bgRect}{labelText}
                                <line x1={padL} y1={subY + subH / 2} x2={padL + chartW} y2={subY + subH / 2} stroke={trTheme.border} strokeWidth="0.3" />
                                {data.map((v, i) => {
                                  if (v === null) return null
                                  const x = padL + i * candleSpacing + candleSpacing * 0.1
                                  const w = candleSpacing * 0.8
                                  const y0 = subY + subH / 2
                                  const y1 = yFn(v)
                                  const prev = i > 0 && data[i-1] !== null ? data[i-1]! : 0
                                  const barColor = v > prev ? 'rgba(34,197,94,0.35)' : 'rgba(239,83,80,0.35)'
                                  return <rect key={`ao-h-${i}`} x={x} y={Math.min(y0, y1)} width={Math.max(0.3, w)} height={Math.abs(y1 - y0)} fill={barColor} rx="0.3" />
                                })}
                              </g>
                            )
                          }
                          case 'gator': {
                            const data = computeGator(visibleCandles)
                            const allVals = [...data.upper, ...data.lower].filter((v): v is number => v !== null)
                            const maxAbs = Math.max(...allVals.map(Math.abs), 0.001)
                            const yFn = (v: number) => subY + subH / 2 - (v / maxAbs) * (subH / 2 - subPad)
                            return (
                              <g key={indKey}>
                                {bgRect}{labelText}
                                <line x1={padL} y1={subY + subH / 2} x2={padL + chartW} y2={subY + subH / 2} stroke={trTheme.border} strokeWidth="0.3" />
                                {data.upper.map((v, i) => {
                                  if (v === null) return null
                                  const x = padL + i * candleSpacing + candleSpacing * 0.1
                                  const w = candleSpacing * 0.8
                                  const y0 = yFn(0)
                                  const y1 = yFn(v)
                                  const prev = i > 0 && data.upper[i-1] !== null ? data.upper[i-1]! : 0
                                  const barColor = v > prev ? 'rgba(34,197,94,0.35)' : 'rgba(34,197,94,0.2)'
                                  return <rect key={`gator-u-${i}`} x={x} y={Math.min(y0, y1)} width={Math.max(0.3, w)} height={Math.abs(y1 - y0)} fill={barColor} rx="0.3" />
                                })}
                                {data.lower.map((v, i) => {
                                  if (v === null) return null
                                  const x = padL + i * candleSpacing + candleSpacing * 0.1
                                  const w = candleSpacing * 0.8
                                  const y0 = yFn(0)
                                  const y1 = yFn(v)
                                  const prev = i > 0 && data.lower[i-1] !== null ? data.lower[i-1]! : 0
                                  const barColor = v < prev ? 'rgba(239,83,80,0.35)' : 'rgba(239,83,80,0.2)'
                                  return <rect key={`gator-l-${i}`} x={x} y={Math.min(y0, y1)} width={Math.max(0.3, w)} height={Math.abs(y1 - y0)} fill={barColor} rx="0.3" />
                                })}
                              </g>
                            )
                          }
                          case 'bwMFI': {
                            const data = computeBWIMFI(visibleCandles)
                            const dataN: (number | null)[] = data
                            const { yFn } = autoScale(dataN)
                            const line = mkLine(dataN, yFn)
                            return (
                              <g key={indKey}>
                                {bgRect}{labelText}
                                {line && <path d={line} fill="none" stroke={indColor} strokeWidth="0.5" opacity="0.7" strokeLinejoin="round" />}
                              </g>
                            )
                          }
                          case 'stddev': {
                            const data = computeStdDev(visibleCandles)
                            const { yFn } = autoScale(data)
                            const line = mkLine(data, yFn)
                            return (
                              <g key={indKey}>
                                {bgRect}{labelText}
                                {line && <path d={line} fill="none" stroke={indColor} strokeWidth="0.5" opacity="0.7" strokeLinejoin="round" />}
                              </g>
                            )
                          }
                          default:
                            return null
                        }
                      })}

                      {/* Indicator Legend — top area */}
                      <g opacity="0.55">
                        {activeIndicators.map((ind, idx) => (
                          <g key={`legend-${ind.key}`}>
                            <line x1={padL + 4 + idx * 32} y1={padT - 5} x2={padL + 12 + idx * 32} y2={padT - 5} stroke={ind.color} strokeWidth="0.7" />
                            <text x={padL + 14 + idx * 32} y={padT - 3} fontSize="5.5" fill={ind.color} fontFamily="monospace" fontWeight="700">{ind.label}</text>
                          </g>
                        ))}
                      </g>

                      {/* Position entry lines — MT5 order lines */}
                      {activePositions.map(pos => {
                        const entryY = yScale(pos.startPrice)
                        const isPosBuy = pos.direction === 'NAIK'
                        const lineColor = isPosBuy ? '#2962ff' : '#ef5350'
                        const livePL = getPositionLivePL(pos)
                        const lotSize = (pos.amount / LOT_SIZE).toFixed(2)
                        const plStr = livePL >= 0 ? `+${formatRupiah(livePL)}` : formatRupiah(livePL)
                        const labelText = `${isPosBuy ? 'BUY' : 'SELL'} ${lotSize}, ${plStr}`
                        const labelW = labelText.length * 3.2 + 6
                        return (
                          <g key={`pos-line-${pos.id}`}>
                            <line x1={padL} y1={entryY} x2={padL + chartW} y2={entryY}
                              stroke={lineColor} strokeWidth="0.5" strokeDasharray="3,2" opacity="0.45" />
                            <rect x={padL + 3} y={entryY - 4.5} width={labelW} height="9" rx="1" fill={lineColor} opacity="0.9" />
                            <text x={padL + 3 + labelW / 2} y={entryY + 2} fontSize="5" fill="white" textAnchor="middle" fontWeight="bold" fontFamily="monospace">{labelText}</text>
                          </g>
                        )
                      })}

                      {/* Current price line — solid with glow */}
                      <line x1={padL} y1={yLast} x2={padL + chartW} y2={yLast}
                        stroke={priceColor} strokeWidth="0.5" strokeDasharray="4,2" opacity="0.55" />
                      {/* Subtle glow under price line */}
                      <line x1={padL} y1={yLast} x2={padL + chartW} y2={yLast}
                        stroke={priceColor} strokeWidth="3" opacity="0.06" />

                      {/* Current price dot — glowing */}
                      <circle cx={padL + chartW} cy={yLast} r="2" fill={priceColor} filter="url(#glowDot)">
                        <animate attributeName="r" values="2;3;2" dur="2s" repeatCount="indefinite" />
                      </circle>

                      {/* Current price badge — right edge MT5 style */}
                      <rect x={padL + chartW + 0.5} y={yLast - 6} width={padR - 1} height="12" rx="1.5" fill="url(#priceBadgeGrad)" />
                      <text x={padL + chartW + padR / 2} y={yLast + 3} fontSize="6.5" fill="white" textAnchor="middle" fontWeight="800" fontFamily="monospace">{fmtChartPrice(lastPrice)}</text>

                      {/* Crosshair — Premium MT5 Style with candle snapping */}
                      {sinyalCrosshair && (() => {
                        const rawSvgX = (sinyalCrosshair.x / sinyalCrosshair.w) * W
                        const svgY = (sinyalCrosshair.y / sinyalCrosshair.h) * H
                        // Snap vertical line to nearest candle center
                        const rawCandleIdx = (rawSvgX - padL) / candleSpacing - 0.5
                        const snappedIdx = Math.max(0, Math.min(visibleCandles.length - 1, Math.round(rawCandleIdx)))
                        const svgX = padL + (snappedIdx + 0.5) * candleSpacing
                        const crossPrice = paddedMax - ((svgY - padT) / priceAreaH) * paddedRange
                        const hoveredCandle = snappedIdx >= 0 && snappedIdx < visibleCandles.length ? visibleCandles[snappedIdx] : null
                        const timeLabel = hoveredCandle ? hoveredCandle.time : ''
                        const crosshairColor = isTrDark ? 'rgba(160,175,195,0.6)' : 'rgba(60,60,60,0.5)'
                        const crosshairDotColor = isUp ? '#26a69a' : '#ef5350'
                        return (
                          <g>
                            {/* Vertical crosshair line — snapped to candle center */}
                            <line x1={svgX} y1={padT} x2={svgX} y2={chartH + volH + timeAxisH}
                              stroke={crosshairColor} strokeWidth="0.5" strokeDasharray="3,2" />
                            {/* Horizontal crosshair line */}
                            <line x1={padL} y1={svgY} x2={padL + chartW} y2={svgY}
                              stroke={crosshairColor} strokeWidth="0.5" strokeDasharray="3,2" />
                            {/* Crosshair center dot */}
                            {svgY > padT && svgY < padT + priceAreaH && svgX > padL && svgX < padL + chartW && (
                              <>
                                <circle cx={svgX} cy={svgY} r="3" fill={crosshairDotColor} opacity="0.15" />
                                <circle cx={svgX} cy={svgY} r="1.8" fill={crosshairDotColor} opacity="0.8" />
                                <circle cx={svgX} cy={svgY} r="0.6" fill="#ffffff" opacity="0.9" />
                              </>
                            )}
                            {/* Price label on right axis */}
                            {svgY > padT && svgY < padT + priceAreaH && (
                              <>
                                <rect x={padL + chartW + 0.5} y={svgY - 6.5} width={padR - 1} height="13" rx="2"
                                  fill={crosshairDotColor} stroke="none" />
                                <text x={padL + chartW + padR / 2} y={svgY + 3} fontSize="7" fill="#ffffff" textAnchor="middle" fontFamily="monospace" fontWeight="800">{fmtChartPrice(crossPrice)}</text>
                              </>
                            )}
                            {/* Time label on bottom axis — snapped to candle */}
                            {svgX > padL && svgX < padL + chartW && timeLabel && (
                              <>
                                <rect x={svgX - 16} y={chartH + volH + 0.5} width="32" height="12" rx="2"
                                  fill={isTrDark ? 'rgba(20,28,50,0.95)' : 'rgba(240,242,245,0.95)'} stroke={isTrDark ? 'rgba(148,163,184,0.25)' : 'rgba(0,0,0,0.12)'} strokeWidth="0.3" />
                                <text x={svgX} y={chartH + volH + 9} fontSize="6.5" fill={isTrDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.75)'} textAnchor="middle" fontFamily="monospace" fontWeight="700">{timeLabel}</text>
                              </>
                            )}
                            {/* OHLC data tooltip — top-left corner of chart */}
                            {hoveredCandle && svgX > padL && svgX < padL + chartW && (
                              <g>
                                <rect x={padL + 3} y={padT + 2} width="62" height="32" rx="2"
                                  fill={isTrDark ? 'rgba(10,14,23,0.92)' : 'rgba(255,255,255,0.92)'} stroke={isTrDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'} strokeWidth="0.3" />
                                <text x={padL + 6} y={padT + 9} fontSize="5" fill={isTrDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'} fontFamily="monospace" fontWeight="600">O <tspan fill={isTrDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)'}>{fmtChartPrice(hoveredCandle.open)}</tspan>  H <tspan fill={hoveredCandle.high >= hoveredCandle.open ? '#26a69a' : '#ef5350'}>{fmtChartPrice(hoveredCandle.high)}</tspan></text>
                                <text x={padL + 6} y={padT + 17} fontSize="5" fill={isTrDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'} fontFamily="monospace" fontWeight="600">L <tspan fill={hoveredCandle.low < hoveredCandle.open ? '#ef5350' : '#26a69a'}>{fmtChartPrice(hoveredCandle.low)}</tspan>  C <tspan fill={hoveredCandle.close >= hoveredCandle.open ? '#26a69a' : '#ef5350'}>{fmtChartPrice(hoveredCandle.close)}</tspan></text>
                                <text x={padL + 6} y={padT + 25} fontSize="4.5" fill={isTrDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)'} fontFamily="monospace" fontWeight="600">Vol {formatNumber(hoveredCandle.volume)}</text>
                              </g>
                            )}
                          </g>
                        )
                      })()}
                    </svg>
                  )
                })()}
              </div>

              {/* Scroll to latest */}
              {sinyalChartOffset > 0 && (
                <button
                  onClick={() => setSinyalChartOffset(0)}
                  className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 h-7 px-3 rounded-full text-[8px] font-bold flex items-center gap-0.5 hover:bg-[#1d4ed8] transition-colors"
                  style={{ background: 'rgba(29,78,216,0.6)', backdropFilter: 'blur(4px)', color: 'white' }}>
                  <ChevronRight className="w-2.5 h-2.5 rotate-180" />
                  Terbaru
                </button>
              )}

              {/* Result flash */}
              {sinyalResults.length > 0 && (() => {
                const latest = sinyalResults[sinyalResults.length - 1]
                if (!latest || !latest.shownAt || Date.now() - latest.shownAt > 1000) return null
                const won = latest.won
                return (
                  <motion.div key={latest.id} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="absolute top-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                    <div className={'flex items-center gap-1 px-2 py-0.5 rounded-full ' + (won ? 'border border-green-500/20 bg-green-500/10' : 'border border-red-500/20 bg-red-500/10')} style={{ backdropFilter: 'blur(8px)' }}>
                      <span className={'text-[8px] font-black ' + (won ? 'text-green-400' : 'text-red-400')}>{won ? 'BENAR' : 'SALAH'}</span>
                      <span className={'text-[7px] font-bold ' + (won ? 'text-green-300' : 'text-red-300')}>{won ? '+' : '-'}{formatRupiah(Math.abs(latest.profit))}</span>
                    </div>
                  </motion.div>
                )
              })()}
            </div>
          )}
          {!selectedSinyalStock && (
            <div className="flex-1 flex items-center justify-center" style={{ background: trTheme.chartBg }}>
              <div className="text-center">
                <BarChart3 className="w-10 h-10 mx-auto mb-2" style={{ color: trTheme.textMuted }} />
                <p className="text-[10px] font-bold" style={{ color: trTheme.textMuted }}>Pilih instrumen untuk mulai trading</p>
              </div>
            </div>
          )}
        </div>

      {/* ══ 4. BOTTOM TRADE STATUS BAR — Premium Glass Badges ══ */}
      {activePos.length > 0 && (
        <div className="flex-shrink-0 flex items-center gap-1.5 px-2 py-1 overflow-x-auto" style={{ background: trTheme.bgCard, borderTop: '1px solid ' + trTheme.borderSubtle, scrollbarWidth: 'none' }}>
          {activePos.slice(0, 3).map(pos => {
            const livePL = getPositionLivePL(pos)
            const isUp = pos.direction === 'NAIK'
            return (
              <div key={pos.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg flex-shrink-0" style={{ background: isUp ? 'rgba(34,197,94,0.04)' : 'rgba(239,83,80,0.04)', border: `1px solid ${isUp ? 'rgba(34,197,94,0.10)' : 'rgba(239,83,80,0.10)'}` }}>
                <span className="text-[8px] font-black" style={{ color: trTheme.textSecondary }}>{pos.stockCode}</span>
                <span className={`px-1 py-0.5 rounded text-[7px] font-black text-white ${isUp ? 'bg-green-600/80' : 'bg-red-600/80'}`}>{isUp ? 'BUY' : 'SELL'}</span>
                <span className="text-[7px] font-bold tabular-nums" style={{ color: trTheme.textMuted }}>{(pos.amount / LOT_SIZE).toFixed(2)}</span>
                <span className={`text-[8px] font-black tabular-nums ${livePL >= 0 ? 'text-green-400' : 'text-red-400'}`}>{livePL >= 0 ? '+' : ''}{formatRupiah(livePL)}</span>
                <button onClick={() => closeSinyalPosition(pos.id)} className="w-5 h-5 rounded flex items-center justify-center hover:scale-110 transition-transform" style={{ background: 'rgba(239,83,80,0.35)' }}>
                  <X className="w-2 h-2 text-white" />
                </button>
              </div>
            )
          })}
          {activePos.length > 3 && (
            <span className="text-[7px] font-bold flex-shrink-0" style={{ color: trTheme.textMuted }}>+{activePos.length - 3} lagi</span>
          )}
        </div>
      )}

      {/* ══ 5. TERMINAL BAR — Premium MT5 Strip ══ */}
      <div className="flex-shrink-0" style={{ background: trTheme.bg, borderTop: '1px solid ' + trTheme.borderSubtle }}>
        <div className="flex items-center px-2 py-1.5 gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {[
            { label: 'Balance', value: formatRupiah(totalBalance), color: trTheme.text },
            { label: 'Equity', value: formatRupiah(equity), color: equity >= totalBalance ? '#4ade80' : '#f87171' },
            { label: 'Margin', value: formatRupiah(usedMargin), color: '#fbbf24' },
            { label: 'Free Mrg', value: formatRupiah(freeMargin), color: freeMargin >= 0 ? '#22d3ee' : '#f87171' },
            { label: 'P&L', value: `${totalLivePL >= 0 ? '+' : ''}${formatRupiah(totalLivePL)}`, color: totalLivePL >= 0 ? '#4ade80' : '#f87171' },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center justify-center px-3 py-1 flex-shrink-0 rounded-lg" style={{ background: trTheme.inputBg, border: '1px solid ' + trTheme.borderSubtle, minWidth: '68px' }}>
              <span className="text-[7px] font-bold uppercase tracking-[0.15em]" style={{ color: trTheme.textMuted }}>{item.label}</span>
              <span className="text-[9px] font-black tabular-nums mt-0.5" style={{ color: item.color }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══ 6. TERMINAL PANEL — Trade / History Tabs (MT5 Style) ══ */}
      <div className="flex-shrink-0" style={{ background: trTheme.bgCard }}>
        {/* Terminal Tab Header */}
        <div className="flex items-center border-b" style={{ borderColor: trTheme.borderSubtle }}>
          {(['trade', 'history'] as const).map(tab => (
            <button key={tab} onClick={() => setSinyalTerminalTab(tab)}
              className={`px-4 py-1.5 text-[8px] font-black uppercase tracking-[0.15em] transition-all relative ${
                sinyalTerminalTab === tab ? '' : ''
              }`}
              style={{
                color: sinyalTerminalTab === tab ? '#3b82f6' : trTheme.textMuted,
                borderBottom: sinyalTerminalTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
              }}>
              {tab === 'trade' ? `Trade (${activePos.length})` : `History (${sinyalPositions.filter(p => p.status === 'won' || p.status === 'lost').length})`}
            </button>
          ))}
        </div>

        {/* Trade Tab — Active Positions */}
        {sinyalTerminalTab === 'trade' && (
          <>
            {activePos.length > 0 ? (
              <>
                <div className="grid grid-cols-12 gap-0 px-3 py-1 text-[7px] font-black uppercase tracking-[0.15em]" style={{ color: trTheme.textMuted, borderBottom: '1px solid ' + trTheme.borderSubtle }}>
                  <div className="col-span-2">Symbol</div>
                  <div className="col-span-1">Type</div>
                  <div className="col-span-1">Vol</div>
                  <div className="col-span-2">Entry</div>
                  <div className="col-span-2">Current</div>
                  <div className="col-span-3">P&L</div>
                  <div className="col-span-1"></div>
                </div>
                <div className="max-h-24 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                  {activePos.map((pos, idx) => {
                    const livePL = getPositionLivePL(pos)
                    const currentPrice = sinyalCurrentPrice || sinyalChartSimRef.current?.price || pos.startPrice
                    const isUp = pos.direction === 'NAIK'
                    return (
                      <div key={pos.id} className={`grid grid-cols-12 gap-0 px-3 py-1 items-center text-[8px] font-bold transition-colors`} style={idx % 2 === 0 ? { background: trTheme.inputBg } : undefined}>
                        <div className="col-span-2 font-black" style={{ color: trTheme.text }}>{pos.stockCode}</div>
                        <div className="col-span-1">
                          <span className="px-1 py-0.5 rounded text-[6px] font-black text-white"
                            style={isUp
                              ? { background: 'linear-gradient(135deg, #4ade80, #22c55e)' }
                              : { background: 'linear-gradient(135deg, #f87171, #ef5350)' }}>
                            {isUp ? 'BUY' : 'SELL'}
                          </span>
                        </div>
                        <div className="col-span-1 tabular-nums" style={{ color: trTheme.textMuted }}>{(pos.amount / LOT_SIZE).toFixed(2)}</div>
                        <div className="col-span-2 tabular-nums" style={{ color: trTheme.textMuted }}>{formatNumber(pos.startPrice)}</div>
                        <div className="col-span-2 tabular-nums" style={{ color: trTheme.textSecondary }}>{formatNumber(currentPrice)}</div>
                        <div className={`col-span-3 font-black tabular-nums ${livePL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {livePL >= 0 ? '+' : ''}{formatRupiah(livePL)}
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <button onClick={() => closeSinyalPosition(pos.id)}
                            className="h-5 w-5 rounded flex items-center justify-center transition-all hover:scale-110 active:scale-90"
                            style={{ background: 'linear-gradient(135deg, #f87171, #ef5350)', boxShadow: '0 1px 4px rgba(239,83,80,0.3)' }}
                            title="Tutup posisi">
                            <X className="w-2.5 h-2.5 text-white" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="flex items-center justify-between px-2 py-0.5" style={{ borderTop: '1px solid ' + trTheme.borderSubtle }}>
                  <span className="text-[7px] font-bold" style={{ color: trTheme.textMuted }}>{activePos.length} posisi aktif</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[7px] font-bold" style={{ color: trTheme.textMuted }}>Total P&L:</span>
                    <span className={`text-[8px] font-black tabular-nums ${totalLivePL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {totalLivePL >= 0 ? '+' : ''}{formatRupiah(totalLivePL)}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="px-4 py-3 text-center">
                <p className="text-[8px] font-bold" style={{ color: trTheme.textMuted }}>No open positions</p>
              </div>
            )}
          </>
        )}

        {/* History Tab — Closed Positions (Riwayat) */}
        {sinyalTerminalTab === 'history' && (() => {
          const closedPos = sinyalPositions.filter(p => p.status === 'won' || p.status === 'lost')
          const wonCount = closedPos.filter(p => p.status === 'won').length
          const lostCount = closedPos.filter(p => p.status === 'lost').length
          const totalProfitPL = closedPos.filter(p => p.status === 'won').reduce((s, p) => s + (p.closedPL || 0), 0)
          const totalLossPL = closedPos.filter(p => p.status === 'lost').reduce((s, p) => s + (p.closedPL || 0), 0)
          const netPL = totalProfitPL + totalLossPL
          return (
            <>
              {/* Summary bar */}
              <div className="flex items-center justify-between px-3 py-1.5" style={{ borderBottom: '1px solid ' + trTheme.borderSubtle }}>
                <div className="flex items-center gap-3">
                  <span className="text-[7px] font-black text-green-400">{wonCount} Win</span>
                  <span className="text-[7px] font-black text-red-400">{lostCount} Loss</span>
                </div>
                <span className={`text-[8px] font-black tabular-nums ${netPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  Net: {netPL >= 0 ? '+' : ''}{formatRupiah(netPL)}
                </span>
              </div>
              {/* Filter buttons */}
              <div className="flex items-center gap-1 px-2 py-1" style={{ borderBottom: '1px solid ' + trTheme.borderSubtle }}>
                {['Semua', 'Profit', 'Loss'].map(filter => (
                  <button key={filter} onClick={() => setSinyalHistoryFilter(filter)}
                    className={`h-5 px-2 rounded text-[7px] font-bold transition-all border ${
                      sinyalHistoryFilter === filter
                        ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                        : 'text-[var(--zv-muted)] border-[var(--zv-border)] hover:text-[var(--zv-text)]'
                    }`}>
                    {filter}
                  </button>
                ))}
              </div>
              {closedPos.length === 0 ? (
                <div className="px-4 py-4 text-center">
                  <History className="w-5 h-5 mx-auto mb-1.5" style={{ color: trTheme.textMuted }} />
                  <p className="text-[8px] font-bold" style={{ color: trTheme.textMuted }}>Belum ada riwayat trading</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-12 gap-0 px-3 py-1 text-[7px] font-black uppercase tracking-[0.15em]" style={{ color: trTheme.textMuted, borderBottom: '1px solid ' + trTheme.borderSubtle }}>
                    <div className="col-span-2">Symbol</div>
                    <div className="col-span-1">Type</div>
                    <div className="col-span-1">Vol</div>
                    <div className="col-span-2">Entry</div>
                    <div className="col-span-2">Close</div>
                    <div className="col-span-3">P&L</div>
                    <div className="col-span-1">Tm</div>
                  </div>
                  <div className="max-h-32 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                    {closedPos.slice().reverse().filter(cp => {
                      if (sinyalHistoryFilter === 'Profit') return cp.status === 'won'
                      if (sinyalHistoryFilter === 'Loss') return cp.status === 'lost'
                      return true
                    }).map((cp, idx) => {
                      const isWon = cp.status === 'won'
                      const isUp = cp.direction === 'NAIK'
                      const plAmt = cp.closedPL !== undefined ? cp.closedPL : (isWon ? Math.round(cp.amount * cp.profitPercent / 100) : -cp.amount)
                      const tradeDate = new Date(cp.startTime)
                      const dateStr = `${tradeDate.getHours().toString().padStart(2, '0')}:${tradeDate.getMinutes().toString().padStart(2, '0')}`
                      return (
                        <div key={cp.id} className="grid grid-cols-12 gap-0 px-3 py-1 items-center text-[7px] font-bold transition-colors"
                          style={idx % 2 === 0 ? { background: trTheme.inputBg } : undefined}>
                          <div className="col-span-2 font-black" style={{ color: trTheme.text }}>{cp.stockCode}</div>
                          <div className="col-span-1">
                            <span className="px-0.5 py-0.5 rounded text-[5px] font-black text-white"
                              style={isUp
                                ? { background: 'linear-gradient(135deg, #4ade80, #22c55e)' }
                                : { background: 'linear-gradient(135deg, #f87171, #ef5350)' }}>
                              {isUp ? 'BUY' : 'SELL'}
                            </span>
                          </div>
                          <div className="col-span-1 tabular-nums" style={{ color: trTheme.textMuted }}>{(cp.amount / LOT_SIZE).toFixed(2)}</div>
                          <div className="col-span-2 tabular-nums" style={{ color: trTheme.textMuted }}>{formatNumber(cp.startPrice)}</div>
                          <div className="col-span-2 tabular-nums" style={{ color: trTheme.textSecondary }}>—</div>
                          <div className={`col-span-3 font-black tabular-nums ${isWon ? 'text-green-400' : 'text-red-400'}`}>
                            {isWon ? '+' : ''}{formatRupiah(plAmt)}
                          </div>
                          <div className="col-span-1 tabular-nums" style={{ color: trTheme.textMuted }}>{dateStr}</div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </>
          )
        })()}
      </div>

    </motion.div>

  )
}
