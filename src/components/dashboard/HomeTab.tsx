'use client'

import { useRef } from 'react'
import { useAuthStore } from '@/lib/store'
import { motion } from 'framer-motion'
import {
  TrendingUp, TrendingDown, Eye, EyeOff, ArrowRight,
  Wallet, BarChart3, Briefcase, History,
  ChevronRight, Star, Plus, Minus, CreditCard, CheckCircle,
  Lock, Users, Target, Shield, Zap, ArrowDownRight, ArrowUpRight,
} from 'lucide-react'
import { formatRupiah, formatNumber, formatPercent, formatMarketCap, formatDateTime, PIE_COLORS } from '@/lib/trading-utils'
import { useDashboardStore, type SinyalPosition } from '@/lib/dashboard-store'
import { getRealLogo } from '@/lib/logos.tsx'
import { ZevorikLogo } from '@/components/ZevorikLogo'
import {
  AreaChart, Area, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell,
} from 'recharts'

export function HomeTab() {
  const { user } = useAuthStore()
  const store = useDashboardStore()
  const {
    stocks, portfolio, portfolioSummary, transactions, watchlist, sinyalPositions,
    showBalance, bannerIndex,
    setBannerIndex, setShowBalance, setActiveTab,
    setSelectedStock, setShowStockDetail, setContractModal, setContractAmount, setContractDuration,
    fetchPriceHistory,
    setLiveBuyChart, setLiveSellChart, setLiveBuyPrice, setLiveSellPrice,
    setSelectedSinyalStock,
    getPositionLivePL,
  } = store

  const bannerTimerRef = useRef<NodeJS.Timeout | null>(null)
  const bannerTouchStartX = useRef(0)
  const bannerTouchEndX = useRef(0)

  // Computed values
  const liveEquity = (user?.balance || 0) + sinyalPositions.filter(p => p.status === 'active').reduce((s, p) => s + getPositionLivePL(p), 0)
  const portfolioPieData = portfolio.map((p, i) => ({ name: p.stock.code, value: p.currentValue, color: PIE_COLORS[i % PIE_COLORS.length] }))
  const topGainers = [...stocks].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5)
  const topLosers = [...stocks].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5)

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
    <motion.div key="home" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>

      {/* ══════════ PREMIUM BANNER CAROUSEL ══════════ */}
      <div
        className="relative rounded-2xl overflow-hidden mb-5"
        style={{ boxShadow: '0 8px 40px rgba(37,99,235,0.25)' }}
        onTouchStart={(e) => { bannerTouchStartX.current = e.touches[0].clientX }}
        onTouchEnd={(e) => {
          bannerTouchEndX.current = e.changedTouches[0].clientX
          const diff = bannerTouchStartX.current - bannerTouchEndX.current
          if (Math.abs(diff) > 50) {
            if (diff > 0) setBannerIndex(prev => (prev + 1) % 3)
            else setBannerIndex(prev => (prev - 1 + 3) % 3)
            if (bannerTimerRef.current) clearInterval(bannerTimerRef.current)
            bannerTimerRef.current = setInterval(() => setBannerIndex(prev => (prev + 1) % 3), 4000)
          }
        }}
      >
        {/* Slides */}
        <div className="relative w-full h-48 md:h-64">
          {[
            {
              img: '/banner-beranda-hero.png',
              overlay: 'linear-gradient(135deg, rgba(12,26,46,0.92) 0%, rgba(30,58,95,0.75) 35%, rgba(37,99,235,0.35) 100%)',
              badge: null,
              title: 'Investasi Cerdas,',
              titleAccent: 'Profit Maksimal',
              desc: 'Platform saham digital terpercaya dengan profit harian hingga 7% & sinyal trading real-time.',
              btns: [
                { label: 'Mulai Investasi', icon: <BarChart3 className="w-3.5 h-3.5" />, action: () => setActiveTab('market'), style: 'primary' as const },
                { label: 'Trading', icon: <Target className="w-3.5 h-3.5" />, action: () => setActiveTab('sinyal'), style: 'ghost' as const },
              ],
              live: true,
            },
            {
              img: '/banner-sinyal-pro.png',
              overlay: 'linear-gradient(135deg, rgba(8,15,30,0.93) 0%, rgba(6,182,212,0.55) 100%)',
              badge: { icon: <Target className="w-4 h-4 text-cyan-300" />, text: 'SINYAL PRO' },
              title: 'Trading Cerdas',
              titleAccent: 'Payout 93%',
              desc: 'Prediksi arah harga saham real-time dengan candlestick chart profesional.',
              btns: [
                { label: 'Mulai Trading', icon: <ArrowRight className="w-3 h-3" />, action: () => setActiveTab('sinyal'), style: 'primary' as const },
              ],
              live: true,
            },
            {
              img: '/banner-investasi-promo.png',
              overlay: 'linear-gradient(135deg, rgba(15,23,42,0.92) 0%, rgba(180,83,9,0.5) 100%)',
              badge: { icon: <Shield className="w-4 h-4 text-amber-300" />, text: 'INVESTASI PRO' },
              title: 'Profit Harian',
              titleAccent: 'Hingga 7%',
              desc: 'Kontrak saham premium dengan profit otomatis setiap 00:00 WIB.',
              btns: [
                { label: 'Mulai Investasi', icon: <ArrowRight className="w-3 h-3" />, action: () => setActiveTab('market'), style: 'primary' as const },
              ],
              live: false,
            },
          ].map((slide, i) => (
            <div
              key={i}
              className="absolute inset-0 transition-all duration-700 ease-in-out"
              style={{ opacity: bannerIndex === i ? 1 : 0, transform: bannerIndex === i ? 'scale(1)' : 'scale(1.05)' }}
            >
              <img src={slide.img} alt={slide.titleAccent} className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: slide.overlay }} />
              <div className="absolute inset-0 flex flex-col justify-center px-5 py-4">
                {/* Live badge */}
                {slide.live && (
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 h-5 px-2.5 rounded-full bg-green-500/20 border border-green-400/30 backdrop-blur-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[7px] font-black text-green-300 tracking-wider">LIVE</span>
                  </div>
                )}
                {/* Badge */}
                {slide.badge && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-white/15 border border-white/10 grid place-items-center backdrop-blur-sm">{slide.badge.icon}</div>
                    <span className="text-[9px] font-black tracking-[0.15em] uppercase text-white/90">{slide.badge.text}</span>
                  </div>
                )}
                {/* Zevorix brand on first slide */}
                {i === 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    <ZevorikLogo size={28} />
                    <span className="text-[8px] font-black tracking-[0.2em] uppercase text-blue-300/80">ZEVORIK</span>
                  </div>
                )}
                <h2 className="text-[17px] md:text-[22px] font-black text-white leading-tight mb-1 drop-shadow-lg">{slide.title}<br /><span className="gradient-text">{slide.titleAccent}</span></h2>
                <p className="text-[9px] md:text-[11px] text-white/70 font-medium mb-3 max-w-[260px] leading-relaxed">{slide.desc}</p>
                {slide.btns.length > 0 && (
                  <div className="flex items-center gap-2">
                    {slide.btns.map((btn, bi) => (
                      <button
                        key={bi}
                        onClick={btn.action}
                        className={`h-8 px-4 rounded-xl text-[9px] font-bold flex items-center gap-1.5 transition-all active:scale-[0.96] ${
                          btn.style === 'primary' ? 'bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white hover:from-[#60a5fa] hover:to-[#3b82f6] shadow-lg shadow-blue-500/30' :
                          'bg-white/10 border border-white/20 text-white hover:bg-white/20 backdrop-blur-sm'
                        }`}
                      >
                        {btn.icon}{btn.label}
                      </button>
                    ))}
                  </div>
                )}

              </div>
            </div>
          ))}
        </div>
        {/* Dot Indicators */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {[0,1,2].map(i => (
            <button
              key={i}
              onClick={() => { setBannerIndex(i); if (bannerTimerRef.current) clearInterval(bannerTimerRef.current); bannerTimerRef.current = setInterval(() => setBannerIndex(prev => (prev + 1) % 3), 4000) }}
              className="transition-all duration-300 rounded-full"
              style={{
                width: bannerIndex === i ? 24 : 8,
                height: 8,
                background: bannerIndex === i ? 'linear-gradient(90deg, #3b82f6, #06b6d4)' : 'rgba(255,255,255,0.5)',
                boxShadow: bannerIndex === i ? '0 0 8px rgba(59,130,246,0.5)' : 'none',
              }}
            />
          ))}
        </div>
      </div>

      {/* ══════════ PREMIUM WALLET CARD ══════════ */}
      <div className="relative rounded-2xl overflow-hidden mb-5 border border-blue-500/20" style={{ background: 'linear-gradient(145deg, #0c1a2e 0%, #1e3a5f 40%, #2563eb 100%)', boxShadow: '0 6px 32px rgba(37,99,235,0.22)' }}>
        {/* Decorative dots */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-cyan-400/8 blur-3xl" />
        <div className="relative p-4 text-white">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 grid place-items-center backdrop-blur-sm">
                <Wallet className="w-5 h-5 text-yellow-300" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black tracking-wider block">RINGKASAN SALDO</span>
                </div>
                <span className="text-[7px] font-bold text-blue-300/70">Selamat datang, {user?.name?.split(' ')[0]}</span>
              </div>
            </div>
            <button onClick={() => setShowBalance(!showBalance)} className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 grid place-items-center text-white/60 hover:text-white hover:bg-white/20 transition-all">
              {showBalance ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Main Balance — includes live P&L from active trading positions */}
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-bold text-blue-200/60 uppercase tracking-widest">Total Saldo</span>
              {sinyalPositions.filter(p => p.status === 'active').length > 0 && (
                <div className="h-4 px-2 rounded-full bg-red-400/20 border border-red-400/30 flex items-center gap-1 animate-pulse">
                  <Zap className="w-2.5 h-2.5 text-red-300" />
                  <span className="text-[7px] font-black text-red-300 tracking-wide">LIVE</span>
                </div>
              )}
            </div>
            <b className={`block text-[24px] md:text-[28px] font-black tracking-tight transition-colors duration-300 ${
              sinyalPositions.filter(p => p.status === 'active').length > 0
                ? (() => {
                    const totalPL = sinyalPositions.filter(p => p.status === 'active').reduce((s, p) => s + getPositionLivePL(p), 0)
                    return totalPL > 0 ? 'text-green-400' : totalPL < 0 ? 'text-red-400' : ''
                  })()
                : ''
            }`}>{showBalance ? formatRupiah(liveEquity) : '••••••••••'}</b>
            {sinyalPositions.filter(p => p.status === 'active').length > 0 && (() => {
              const totalPL = sinyalPositions.filter(p => p.status === 'active').reduce((s, p) => s + getPositionLivePL(p), 0)
              return (
                <div className="flex items-center gap-3 mt-0.5">
                  <span className={`text-[8px] font-bold ${totalPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    P&L: {totalPL >= 0 ? '+' : ''}{formatRupiah(totalPL)}
                  </span>
                </div>
              )
            })()}
          </div>

          {/* Dual Wallets — Dompet Utama shows live balance */}
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            <div className="rounded-xl p-3 bg-white/8 border border-white/12 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-5 h-5 rounded-lg bg-yellow-400/20 grid place-items-center"><Wallet className="w-3 h-3 text-yellow-300" /></div>
                <span className="text-[7px] font-black text-blue-200/80 uppercase tracking-wider">Dompet Utama</span>
                {sinyalPositions.filter(p => p.status === 'active').length > 0 && (
                  <Zap className="w-2.5 h-2.5 text-red-400 animate-pulse" />
                )}
              </div>
              <b className={`block text-[14px] font-black ${sinyalPositions.filter(p => p.status === 'active').length > 0 ? (() => {
                const totalPL = sinyalPositions.filter(p => p.status === 'active').reduce((s, p) => s + getPositionLivePL(p), 0)
                return totalPL < 0 ? 'text-red-400' : totalPL > 0 ? 'text-green-400' : ''
              })() : ''}`}>{showBalance ? formatRupiah(liveEquity) : '••••••'}</b>
              <span className="block text-[6px] font-semibold text-blue-200/40 mt-0.5">Deposit & trading{sinyalPositions.filter(p => p.status === 'active').length > 0 ? ' (ikut grafik)' : ''}</span>
            </div>
            <div className="rounded-xl p-3 bg-white/8 border border-white/12 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-5 h-5 rounded-lg bg-blue-400/20 grid place-items-center"><CreditCard className="w-3 h-3 text-blue-300" /></div>
                <span className="text-[7px] font-black text-blue-200/80 uppercase tracking-wider">Penarikan</span>
              </div>
              <b className="block text-[14px] font-black">{showBalance ? formatRupiah(0) : '••••••'}</b>
              <span className="block text-[6px] font-semibold text-blue-200/40 mt-0.5">Dapat ditarik</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <>
              <button onClick={() => setActiveTab('finance')} className="h-10 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 text-[9px] font-bold hover:from-yellow-300 hover:to-amber-400 transition-all flex items-center justify-center gap-1 shadow-lg shadow-yellow-500/25 active:scale-[0.97]">
                <Plus className="w-3.5 h-3.5" />Deposit
              </button>
              <button onClick={() => setActiveTab('finance')} className="h-10 rounded-xl bg-white/12 border border-white/20 text-white text-[9px] font-bold hover:bg-white/20 transition-all flex items-center justify-center gap-1 backdrop-blur-sm active:scale-[0.97]">
                <Minus className="w-3.5 h-3.5" />Tarik
              </button>
              <button onClick={() => setActiveTab('market')} className="h-10 rounded-xl bg-white/12 border border-white/20 text-white text-[9px] font-bold hover:bg-white/20 transition-all flex items-center justify-center gap-1 backdrop-blur-sm active:scale-[0.97]">
                <BarChart3 className="w-3.5 h-3.5" />Pasar
              </button>
            </>
          </div>
        </div>
      </div>

      {/* ══════════ QUICK ACCESS MENU ══════════ */}
      <div className="mb-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, #3b82f6, #06b6d4)' }} />
          <h3 className="text-[12px] md:text-sm font-black gradient-text">Akses Cepat</h3>
        </div>
        <div className="grid grid-cols-4 gap-2.5">
          {[
            { icon: <Target className="w-5 h-5" />, label: 'Trading', desc: 'Real MT5', action: () => setActiveTab('sinyal'), iconBg: 'bg-blue-500/15', iconColor: 'text-blue-400', glow: 'rgba(59,130,246,0.08)' },
            { icon: <BarChart3 className="w-5 h-5" />, label: 'Pasar', desc: 'Global', action: () => setActiveTab('market'), iconBg: 'bg-cyan-500/15', iconColor: 'text-cyan-400', glow: 'rgba(6,182,212,0.08)' },
            { icon: <Briefcase className="w-5 h-5" />, label: 'Portofolio', desc: 'Saham', action: () => setActiveTab('portfolio'), iconBg: 'bg-amber-500/15', iconColor: 'text-amber-400', glow: 'rgba(245,158,11,0.08)' },
            { icon: <CreditCard className="w-5 h-5" />, label: 'Keuangan', desc: 'Deposit', action: () => setActiveTab('finance'), iconBg: 'bg-violet-500/15', iconColor: 'text-violet-400', glow: 'rgba(139,92,246,0.08)' },
          ].map((a, i) => (
            <button key={i} onClick={a.action} className="stock-card flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl bg-[var(--zv-surface)] border border-[var(--zv-border)] hover:border-[#3b82f6]/30 hover:shadow-lg transition-all active:scale-[0.96]" style={{ boxShadow: `0 4px 20px ${a.glow}` }}>
              <div className={`w-11 h-11 rounded-xl ${a.iconBg} grid place-items-center ${a.iconColor}`}>{a.icon}</div>
              <span className="text-[8px] md:text-[9px] font-black text-[var(--zv-text)]">{a.label}</span>
              <span className="text-[6px] font-bold text-[var(--zv-muted)]">{a.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ══════════ PORTFOLIO OVERVIEW ══════════ */}
      <div className="rounded-2xl overflow-hidden mb-5 border border-[var(--zv-border)] relative" style={{ background: 'var(--zv-panel)', boxShadow: '0 4px 20px rgba(37,99,235,0.1)' }}>
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #3b82f6, #06b6d4, transparent)' }} />
        <div className="p-4">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, #3b82f6, #06b6d4)' }} />
              <h3 className="text-[12px] font-black gradient-text">Portofolio & Investasi</h3>
            </div>
            <button onClick={() => setActiveTab('portfolio')} className="text-[8px] font-bold text-[#3b82f6] hover:underline flex items-center gap-0.5">Selengkapnya <ChevronRight className="w-3 h-3" /></button>
          </div>

          {/* Portfolio Stats Row */}
          <div className="grid grid-cols-3 gap-2.5 mb-3">
            <div className="rounded-xl p-2.5 bg-[var(--zv-surface)] border border-[var(--zv-border)]" style={{ boxShadow: '0 2px 8px rgba(37,99,235,0.05)' }}>
              <span className="text-[7px] font-bold text-[var(--zv-muted)] uppercase tracking-wider">Investasi</span>
              <b className="block text-[11px] font-black text-[#3b82f6]">{showBalance ? formatRupiah(portfolioSummary.totalCurrentValue) : '••••'}</b>
            </div>
            <div className="rounded-xl p-2.5 bg-[var(--zv-surface)] border border-[var(--zv-border)]" style={{ boxShadow: '0 2px 8px rgba(37,99,235,0.05)' }}>
              <span className="text-[7px] font-bold text-[var(--zv-muted)] uppercase tracking-wider">Profit/Loss</span>
              <b className={`block text-[11px] font-black ${portfolioSummary.totalProfitLoss >= 0 ? 'text-[#22c55e]' : 'text-[#ef5350]'}`}>
                {showBalance ? formatRupiah(Math.abs(portfolioSummary.totalProfitLoss)) : '••••'}
              </b>
            </div>
            <div className="rounded-xl p-2.5 bg-[var(--zv-surface)] border border-[var(--zv-border)]" style={{ boxShadow: '0 2px 8px rgba(37,99,235,0.05)' }}>
              <span className="text-[7px] font-bold text-[var(--zv-muted)] uppercase tracking-wider">Return</span>
              <b className={`block text-[11px] font-black ${portfolioSummary.totalProfitLossPercent >= 0 ? 'text-[#22c55e]' : 'text-[#ef5350]'}`}>
                {portfolioSummary.totalProfitLossPercent >= 0 ? '+' : ''}{portfolioSummary.totalProfitLossPercent.toFixed(1)}%
              </b>
            </div>
          </div>

          {/* Portfolio Chart */}
          {portfolio.length > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--zv-surface)] border border-[var(--zv-border)]" style={{ boxShadow: '0 2px 10px rgba(37,99,235,0.05)' }}>
              <div className="w-20 h-20 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart><Pie data={portfolioPieData} innerRadius={20} outerRadius={35} paddingAngle={2} dataKey="value">
                    {portfolioPieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie></RePieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1.5 max-h-20 overflow-y-auto custom-scrollbar">
                {portfolio.slice(0, 4).map(p => (
                  <div key={p.id} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: portfolioPieData.find(d => d.name === p.stock.code)?.color }} />
                    <span className="text-[8px] font-black text-[#3b82f6] flex-shrink-0">{p.stock.code}</span>
                    <span className="flex-1" />
                    <span className={`text-[8px] font-black ${p.profitLoss >= 0 ? 'text-[#22c55e]' : 'text-[#ef5350]'}`}>{formatPercent(p.profitLossPercent)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════ TOP MOVERS ══════════ */}
      {stocks.length > 0 && (
        <div className="rounded-2xl p-4 bg-[var(--zv-panel)] border border-[var(--zv-border)] mb-5 relative" style={{ boxShadow: '0 4px 20px rgba(37,99,235,0.1)' }}>
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, #22c55e, transparent, #ef5350)' }} />
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, #22c55e, #ef5350)' }} />
              <h3 className="text-[12px] font-black gradient-text">Top Movers</h3>
            </div>
            <button onClick={() => setActiveTab('market')} className="text-[8px] font-bold text-[#3b82f6] hover:underline flex items-center gap-0.5">Lihat Semua <ChevronRight className="w-3 h-3" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* Gainers */}
            <div className="rounded-xl p-3 bg-[var(--zv-surface)] border border-[var(--zv-border)]" style={{ boxShadow: '0 2px 8px rgba(34,197,94,0.05)' }}>
              <div className="flex items-center gap-1.5 mb-2.5">
                <div className="w-6 h-6 rounded-lg bg-green-500/15 grid place-items-center"><TrendingUp className="w-3.5 h-3.5 text-[#22c55e]" /></div>
                <span className="text-[8px] font-black text-[#22c55e] uppercase tracking-wider">Gainers</span>
              </div>
              <div className="space-y-2">
                {topGainers.slice(0, 3).map(s => (
                  <button key={s.id} onClick={() => openStockDetail(s)} className="w-full flex items-center justify-between py-1 hover:bg-[var(--zv-hover)] rounded-lg px-1.5 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="flex-shrink-0">
                        {getRealLogo(s.code, 28)}
                      </div>
                      <span className="text-[9px] font-bold text-[var(--zv-text)]">{s.code}</span>
                    </div>
                    <span className="text-[8px] font-black text-[#22c55e] bg-green-500/10 px-2 py-0.5 rounded-md">+{s.changePercent.toFixed(2)}%</span>
                  </button>
                ))}
              </div>
            </div>
            {/* Losers */}
            <div className="rounded-xl p-3 bg-[var(--zv-surface)] border border-[var(--zv-border)]" style={{ boxShadow: '0 2px 8px rgba(239,83,80,0.05)' }}>
              <div className="flex items-center gap-1.5 mb-2.5">
                <div className="w-6 h-6 rounded-lg bg-red-500/15 grid place-items-center"><TrendingDown className="w-3.5 h-3.5 text-[#ef5350]" /></div>
                <span className="text-[8px] font-black text-[#ef5350] uppercase tracking-wider">Losers</span>
              </div>
              <div className="space-y-2">
                {topLosers.slice(0, 3).map(s => (
                  <button key={s.id} onClick={() => openStockDetail(s)} className="w-full flex items-center justify-between py-1 hover:bg-[var(--zv-hover)] rounded-lg px-1.5 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="flex-shrink-0">
                        {getRealLogo(s.code, 28)}
                      </div>
                      <span className="text-[9px] font-bold text-[var(--zv-text)]">{s.code}</span>
                    </div>
                    <span className="text-[8px] font-black text-[#ef5350] bg-red-500/10 px-2 py-0.5 rounded-md">{s.changePercent.toFixed(2)}%</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ WATCHLIST ══════════ */}
      {watchlist.length > 0 && (
        <div className="rounded-2xl p-4 bg-[var(--zv-panel)] border border-[var(--zv-border)] mb-5 relative" style={{ boxShadow: '0 4px 20px rgba(37,99,235,0.1)' }}>
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #f59e0b, transparent)' }} />
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-[#f59e0b]" />
              <h3 className="text-[12px] font-black gradient-text">Watchlist</h3>
            </div>
            <Star className="w-4 h-4 text-[#f59e0b]" />
          </div>
          <div className="space-y-1.5">
            {watchlist.slice(0, 4).map(w => (
              <button key={w.id} onClick={() => openStockDetail(w.stock)} className="w-full flex items-center justify-between py-2 px-2 hover:bg-[var(--zv-hover)] rounded-xl transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-[var(--zv-surface)] flex items-center justify-center border border-[var(--zv-border)]">{getRealLogo(w.stock.code, 32)}</div>
                  <div className="text-left">
                    <span className="block text-[9px] font-bold text-[var(--zv-text)]">{w.stock.code}</span>
                    <span className="block text-[7px] text-[var(--zv-muted)]">{w.stock.name.slice(0, 15)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-[9px] font-black text-[var(--zv-text)] tabular-nums">{formatRupiah(w.stock.price)}</span>
                  <span className={`block text-[8px] font-black ${w.stock.changePercent >= 0 ? 'text-[#22c55e]' : 'text-[#ef5350]'}`}>{formatPercent(w.stock.changePercent)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ══════════ RECENT TRANSACTIONS ══════════ */}
      {transactions.length > 0 && (
        <div className="rounded-2xl p-4 bg-[var(--zv-panel)] border border-[var(--zv-border)] mb-5 relative" style={{ boxShadow: '0 4px 20px rgba(37,99,235,0.1)' }}>
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)' }} />
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-[#3b82f6]" />
              <h3 className="text-[12px] font-black gradient-text">Transaksi Terakhir</h3>
            </div>
            <button onClick={() => setActiveTab('history')} className="text-[8px] font-bold text-[#3b82f6] hover:underline flex items-center gap-0.5">Semua <ChevronRight className="w-3 h-3" /></button>
          </div>
          <div className="space-y-2">
            {transactions.slice(0, 3).map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-2 px-2 rounded-xl hover:bg-[var(--zv-hover)] transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl grid place-items-center ${tx.type === 'BUY' ? 'bg-blue-500/10 border border-blue-500/15' : 'bg-red-500/10 border border-red-500/15'}`}>
                    {tx.type === 'BUY' ? <ArrowDownRight className="w-4 h-4 text-[#3b82f6]" /> : <ArrowUpRight className="w-4 h-4 text-[#ef5350]" />}
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-[var(--zv-text)]">{tx.type === 'BUY' ? 'Buy' : 'Sell'} {tx.stock.code}</span>
                    <span className="block text-[7px] text-[var(--zv-muted)]">{formatDateTime(tx.createdAt)}</span>
                  </div>
                </div>
                <span className={`text-[10px] font-black ${tx.type === 'BUY' ? 'text-[#ef5350]' : 'text-[#22c55e]'}`}>
                  {tx.type === 'BUY' ? '-' : '+'}{formatRupiah(tx.total)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════ TRUST BADGES ══════════ */}
      <div className="rounded-2xl p-4 bg-[var(--zv-panel)] border border-[var(--zv-border)] relative" style={{ boxShadow: '0 4px 20px rgba(37,99,235,0.1)' }}>
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, #3b82f6, #06b6d4, #22c55e, #f59e0b)' }} />
        <div className="flex items-center justify-center gap-5 mb-3.5">
          {[
            { icon: <Shield className="w-4.5 h-4.5" />, label: 'Aman', color: 'blue', bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-[#3b82f6]' },
            { icon: <CheckCircle className="w-4.5 h-4.5" />, label: 'Berlisensi', color: 'amber', bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-500' },
            { icon: <Lock className="w-4.5 h-4.5" />, label: 'Terenkripsi', color: 'cyan', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-500' },
            { icon: <Users className="w-4.5 h-4.5" />, label: '125K++', color: 'green', bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-500' },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className={`w-10 h-10 rounded-xl ${item.bg} border ${item.border} grid place-items-center ${item.text}`}>
                {item.icon}
              </div>
              <span className={`text-[7px] font-black ${item.text}`}>{item.label}</span>
            </div>
          ))}
        </div>
        <p className="text-center text-[7px] font-black text-[var(--zv-muted)] tracking-wider uppercase">ZEVORIK • Aset Saham Terdaftar & Diawasi • V2.0</p>
      </div>

    </motion.div>
  )
}
