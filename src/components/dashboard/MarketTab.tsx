'use client'

import { useCallback } from 'react'
import { useAuthStore } from '@/lib/store'
import { motion } from 'framer-motion'
import {
  TrendingUp, TrendingDown, Wallet, Search, Star, X, BarChart3,
} from 'lucide-react'
import { formatRupiah, formatMarketCap, type Stock } from '@/lib/trading-utils'
import { useDashboardStore, getMarketCategory, getMarketRegion, sparklineCache, sparklineSimRef } from '@/lib/dashboard-store'
import { getRealLogo } from '@/lib/logos.tsx'
import {
  AreaChart, Area, ResponsiveContainer,
} from 'recharts'

const MARKET_PAGE_SIZE = 50

export function MarketTab() {
  const { user } = useAuthStore()
  const store = useDashboardStore()
  const {
    stocks, marketSearchQuery, marketSignalTab, marketFavFilter, marketRegionFilter, favorites, marketPage,
    setMarketSearchQuery, setMarketSignalTab, setMarketFavFilter, setMarketRegionFilter, setMarketPage,
    setSelectedSinyalStock, setActiveTab,
    toggleFavorite,
  } = store

  // Sparkline data generator
  const getSparklineData = useCallback((stock: Stock) => {
    if (sparklineCache.has(stock.id)) return sparklineCache.get(stock.id)!
    const pts: {i: number; p: number}[] = []
    const mainDir = stock.changePercent >= 0 ? 1 : -1
    let p = stock.open
    let momentum = 0
    for (let i = 0; i < 25; i++) {
      const dir = Math.random() > 0.5 ? 1 : -1
      const minStep = Math.max(1, stock.price * 0.0015)
      const stepSize = minStep * (0.8 + Math.random() * 1.2)
      const bias = mainDir * stock.price * 0.0003
      momentum = momentum * 0.25 + dir * stepSize + bias
      p += momentum
      const reversionStrength = 0.01 + Math.abs(stock.price - p) / stock.price * 0.1
      p += (stock.price - p) * Math.min(reversionStrength, 0.05)
      pts.push({ i, p: Math.round(p) })
    }
    pts.push({ i: 25, p: Math.round(stock.price) })
    sparklineCache.set(stock.id, pts)
    sparklineSimRef.set(stock.id, { val: stock.price, prevD: momentum * 0.25, trend: mainDir * stock.price * 0.0003, momentum: 0 })
    return pts
  }, [])

  return (
    <motion.div key="market" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>

      {/* Header - Dark Trading App Style */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[16px] font-black text-[var(--zv-text)]">Quote</h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[var(--zv-surface)] border border-[var(--zv-border)]">
              <Wallet className="w-3.5 h-3.5 text-[#f59e0b]" />
              <span className="text-[10px] font-black text-[#f59e0b]">{formatRupiah(user?.balance || 0)}</span>
            </div>
            <button onClick={() => setMarketSearchQuery('')} className="w-8 h-8 rounded-lg bg-[var(--zv-surface)] border border-[var(--zv-border)] grid place-items-center hover:bg-[var(--zv-hover)] transition-colors">
              <Search className="w-4 h-4 text-[var(--zv-muted)]" />
            </button>
          </div>
        </div>

        {/* Market Indices Overview */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-2" style={{ scrollbarWidth: 'none' }}>
          {(() => {
            const indices = [
              { name: 'DOW', value: 42512.84, change: -42.77, changePct: -0.11 },
              { name: 'S&P 500', value: 5921.41, change: 28.73, changePct: 0.49 },
              { name: 'NASDAQ', value: 18920.80, change: 145.62, changePct: 0.78 },
              { name: 'NIKKEI', value: 38456.12, change: -312.45, changePct: -0.81 },
              { name: 'FTSE', value: 8245.63, change: 18.34, changePct: 0.22 },
              { name: 'DAX', value: 18452.78, change: 85.12, changePct: 0.46 },
              { name: 'IDX', value: 7245.18, change: 32.56, changePct: 0.45 },
              { name: 'SHCOMP', value: 3312.56, change: -18.32, changePct: -0.55 },
              { name: 'HANG', value: 18456.32, change: 125.78, changePct: 0.69 },
            ]
            return indices.map(idx => {
              const isUp = idx.changePct >= 0
              return (
                <div key={idx.name} className="flex-shrink-0 min-w-[100px] px-2.5 py-1.5 rounded-lg bg-[var(--zv-surface)] border border-[var(--zv-border)]">
                  <span className="block text-[8px] font-bold text-[var(--zv-muted)]">{idx.name}</span>
                  <span className="block text-[10px] font-black text-[var(--zv-text)] tabular-nums">{idx.value.toLocaleString()}</span>
                  <span className={`text-[8px] font-bold ${isUp ? 'text-[#22c55e]' : 'text-[#ef5350]'}`}>
                    {isUp ? '+' : ''}{idx.changePct.toFixed(2)}%
                  </span>
                </div>
              )
            })
          })()}
        </div>

        {/* Category Tabs - Favorit / Paling Ditraded / Top Movers */}
        <div className="flex gap-1 mb-2">
          {[
            { key: 'favorit', label: 'Favorit' },
            { key: 'populer', label: 'Paling Ditraded' },
            { key: 'top', label: 'Top Movers' },
          ].map(tab => (
            <button key={tab.key} onClick={() => { setMarketSignalTab(tab.key); setMarketPage(1) }}
              className={`flex-shrink-0 h-8 px-3 rounded-lg text-[10px] font-bold transition-all ${
                marketSignalTab === tab.key
                  ? 'bg-[#3b82f6] text-white'
                  : 'bg-[var(--zv-surface)] text-[var(--zv-muted)] hover:text-[var(--zv-text)]'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Market Type Filter */}
        <div className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {(() => {
            const counts: Record<string, number> = { semua: stocks.length, crypto: 0, forex: 0, komoditas: 0, saham: 0 }
            stocks.forEach(s => { const c = getMarketCategory(s); if (counts[c] !== undefined) counts[c]++ })
            return [
              { key: 'semua', label: 'Semua' },
              { key: 'crypto', label: 'Kripto' },
              { key: 'forex', label: 'Forex' },
              { key: 'komoditas', label: 'Komoditas' },
              { key: 'saham', label: 'Saham' },
            ].map(cat => (
              <button key={cat.key} onClick={() => { setMarketFavFilter(cat.key); setMarketRegionFilter('semua'); setMarketPage(1) }}
                className={`flex-shrink-0 h-7 px-3 rounded-full text-[9px] font-bold transition-all ${
                  marketFavFilter === cat.key
                    ? 'bg-[var(--zv-text)] text-[var(--zv-background)]'
                    : 'bg-[var(--zv-surface)] text-[var(--zv-muted)] hover:text-[var(--zv-text)] border border-[var(--zv-border)]'
                }`}>
                {cat.label} <span className="opacity-60">{counts[cat.key] || 0}</span>
              </button>
            ))
          })()}
        </div>

        {/* Region Filter (only visible when Saham is selected) */}
        {marketFavFilter === 'saham' && (
          <div className="flex gap-1 overflow-x-auto pb-1 mt-1.5" style={{ scrollbarWidth: 'none' }}>
            {(() => {
              const regionCounts: Record<string, number> = { semua: 0, US: 0, European: 0, Asian: 0, IDX: 0 }
              stocks.forEach(s => {
                if (getMarketCategory(s) === 'saham') {
                  regionCounts.semua++
                  const r = getMarketRegion(s)
                  if (regionCounts[r] !== undefined) regionCounts[r]++
                }
              })
              return [
                { key: 'semua', label: 'Semua Region' },
                { key: 'US', label: '🇺🇸 US' },
                { key: 'European', label: '🇪🇺 Europe' },
                { key: 'Asian', label: '🌏 Asia' },
                { key: 'IDX', label: '🇮🇩 IDX' },
              ].map(region => (
                <button key={region.key} onClick={() => { setMarketRegionFilter(region.key); setMarketPage(1) }}
                  className={`flex-shrink-0 h-6 px-2.5 rounded-full text-[8px] font-bold transition-all ${
                    marketRegionFilter === region.key
                      ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40'
                      : 'bg-[var(--zv-surface)] text-[var(--zv-muted)] hover:text-[var(--zv-text)] border border-[var(--zv-border)]'
                  }`}>
                  {region.label} <span className="opacity-60">{regionCounts[region.key] || 0}</span>
                </button>
              ))
            })()}
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--zv-muted)]" />
        <input
          type="text"
          value={marketSearchQuery}
          onChange={(e) => { setMarketSearchQuery(e.target.value); setMarketPage(1) }}
          placeholder="Cari kode, nama, atau sektor..."
          className="w-full h-9 pl-9 pr-3 rounded-xl bg-[var(--zv-surface)] border border-[var(--zv-border)] text-[11px] text-[var(--zv-text)] placeholder:text-[var(--zv-muted)] focus:outline-none focus:border-[#3b82f6]/50 transition-colors"
        />
        {marketSearchQuery && (
          <button onClick={() => { setMarketSearchQuery(''); setMarketPage(1) }} className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[var(--zv-border)] grid place-items-center">
            <X className="w-3 h-3 text-[var(--zv-muted)]" />
          </button>
        )}
      </div>

      {/* Instrument List - Vertical Cards */}
      {(() => {
        // Filter by search (now includes sector)
        let filteredMarketStocks = stocks.filter(s => {
          const q = marketSearchQuery.toLowerCase()
          if (q && !s.code.toLowerCase().includes(q) && !s.name.toLowerCase().includes(q) && !(s.sector || '').toLowerCase().includes(q) && !(s.description || '').toLowerCase().includes(q)) return false
          return true
        })

        // Filter by market category
        if (marketFavFilter !== 'semua') {
          filteredMarketStocks = filteredMarketStocks.filter(s => getMarketCategory(s) === marketFavFilter)
        }

        // Filter by region (only for saham)
        if (marketFavFilter === 'saham' && marketRegionFilter !== 'semua') {
          filteredMarketStocks = filteredMarketStocks.filter(s => getMarketRegion(s) === marketRegionFilter)
        }

        // Filter/sort by tab
        if (marketSignalTab === 'favorit') {
          if (favorites.size === 0) {
            // Show all when no favorites yet
          } else {
            filteredMarketStocks = filteredMarketStocks.filter(s => favorites.has(s.code))
          }
        } else if (marketSignalTab === 'populer') {
          filteredMarketStocks = [...filteredMarketStocks].sort((a, b) => b.volume - a.volume)
        } else if (marketSignalTab === 'top') {
          filteredMarketStocks = [...filteredMarketStocks].sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
        }

        // Pagination
        const totalItems = filteredMarketStocks.length
        const totalPages = Math.ceil(totalItems / MARKET_PAGE_SIZE)
        const paginatedStocks = filteredMarketStocks.slice(0, marketPage * MARKET_PAGE_SIZE)
        const hasMore = marketPage < totalPages

        const formatPrice = (s: Stock) => {
          const mcat = getMarketCategory(s)
          if (mcat === 'forex') return s.price.toFixed(4)
          if (mcat === 'crypto') {
            if (s.price >= 1000000) return formatRupiah(s.price)
            return '$' + s.price.toLocaleString()
          }
          return formatRupiah(s.price)
        }

        return (
          <div className="space-y-1.5">
            {/* Results count */}
            <div className="flex items-center justify-between px-1 mb-1">
              <span className="text-[9px] font-bold text-[var(--zv-muted)]">{filteredMarketStocks.length} instrumen</span>
              {marketSignalTab === 'favorit' && favorites.size > 0 && (
                <span className="text-[9px] font-bold text-[#f59e0b]">{favorites.size} favorit</span>
              )}
            </div>

            <div className="max-h-[calc(100vh-320px)] overflow-y-auto space-y-1.5 pr-0.5" style={{ scrollbarWidth: 'thin' }}>
              {paginatedStocks.map(s => {
                const isUp = s.changePercent >= 0
                const sparkData = getSparklineData(s)
                const sparkColor = isUp ? '#22c55e' : '#ef5350'
                const mcat = getMarketCategory(s)
                const isFav = favorites.has(s.code)

                return (
                  <div key={s.id}
                    className="w-full p-2.5 rounded-xl bg-[var(--zv-panel)] border border-[var(--zv-border)] hover:border-[#3b82f6]/30 hover:bg-[var(--zv-hover)] transition-all active:scale-[0.99] cursor-pointer group"
                    onClick={() => { setSelectedSinyalStock(s); setActiveTab('sinyal') }}>
                    
                    {/* Row 1: Logo + Name + Price + Star */}
                    <div className="flex items-center gap-2.5">
                      {/* Logo */}
                      <div className="flex-shrink-0" onClick={(e) => { e.stopPropagation() }}>
                        {getRealLogo(s.code, 36)}
                      </div>

                      {/* Name + Category */}
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[12px] font-black text-[var(--zv-text)]">{s.code}</span>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                            mcat === 'crypto' ? 'bg-orange-500/10 text-orange-400' :
                            mcat === 'forex' ? 'bg-blue-500/10 text-blue-400' :
                            mcat === 'komoditas' ? 'bg-amber-500/10 text-amber-400' :
                            'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {mcat === 'crypto' ? 'KRIPTO' : mcat === 'forex' ? 'FOREX' : mcat === 'komoditas' ? 'KOMODITAS' : 'SAHAM'}
                          </span>
                          {mcat === 'saham' && (
                            <span className="text-[7px] font-bold px-1 py-0.5 rounded bg-[var(--zv-surface)] text-[var(--zv-muted)]">
                              {getMarketRegion(s)}
                            </span>
                          )}
                        </div>
                        <span className="block text-[9px] text-[var(--zv-muted)] truncate">{s.name}</span>
                      </div>

                      {/* Price + Change */}
                      <div className="flex-shrink-0 text-right">
                        <span className="block text-[12px] font-black text-[var(--zv-text)] tabular-nums">{formatPrice(s)}</span>
                        <span className={`flex items-center justify-end gap-0.5 text-[10px] font-bold ${isUp ? 'text-[#22c55e]' : 'text-[#ef5350]'}`}>
                          {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {isUp ? '+' : ''}{s.changePercent.toFixed(2)}%
                        </span>
                      </div>

                      {/* Favorite star */}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(s.code) }}
                        className="flex-shrink-0 w-7 h-7 rounded-lg grid place-items-center hover:bg-[var(--zv-surface)] transition-colors"
                      >
                        <Star className={`w-3.5 h-3.5 transition-colors ${isFav ? 'fill-[#f59e0b] text-[#f59e0b]' : 'text-[var(--zv-muted)] group-hover:text-[#f59e0b]'}`} />
                      </button>
                    </div>

                    {/* Row 2: Sparkline + Stats */}
                    <div className="flex items-center gap-2 mt-1.5 pl-[44px]">
                      {/* Mini Sparkline - visible on all screens */}
                      <div className="flex-shrink-0 w-20 h-7">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={sparkData.slice(-15)} margin={{ top: 1, right: 0, bottom: 1, left: 0 }}>
                            <defs>
                              <linearGradient id={`ml-${s.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor={sparkColor} stopOpacity="0.3" />
                                <stop offset="100%" stopColor={sparkColor} stopOpacity="0" />
                              </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="p" stroke={sparkColor} fill={`url(#ml-${s.id})`} strokeWidth={1.5} dot={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Stats */}
                      <div className="flex-1 flex items-center gap-3 text-[8px]">
                        <div>
                          <span className="text-[var(--zv-muted)]">H </span>
                          <span className="font-bold text-[#22c55e]">{mcat === 'forex' ? s.high.toFixed(4) : mcat === 'crypto' && s.price < 1000000 ? '$' + s.high.toLocaleString() : formatRupiah(s.high)}</span>
                        </div>
                        <div>
                          <span className="text-[var(--zv-muted)]">L </span>
                          <span className="font-bold text-[#ef5350]">{mcat === 'forex' ? s.low.toFixed(4) : mcat === 'crypto' && s.price < 1000000 ? '$' + s.low.toLocaleString() : formatRupiah(s.low)}</span>
                        </div>
                        <div>
                          <span className="text-[var(--zv-muted)]">Vol </span>
                          <span className="font-bold text-[var(--zv-text)]">{formatMarketCap(s.volume)}</span>
                        </div>
                        {s.marketCap > 0 && mcat === 'saham' && (
                          <div className="hidden sm:block">
                            <span className="text-[var(--zv-muted)]">MCap </span>
                            <span className="font-bold text-[var(--zv-text)]">${formatMarketCap(s.marketCap)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {filteredMarketStocks.length === 0 && (
              <div className="text-center py-8">
                <BarChart3 className="w-10 h-10 text-[var(--zv-muted)] mx-auto mb-2" />
                <p className="text-[11px] font-bold text-[var(--zv-muted)]">Tidak ada instrumen ditemukan</p>
                {marketSignalTab === 'favorit' && favorites.size === 0 && (
                  <p className="text-[9px] text-[var(--zv-muted)] mt-1">Tap ⭐ untuk menambahkan favorit</p>
                )}
              </div>
            )}

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center pt-3 pb-2">
                <button
                  onClick={() => setMarketPage(p => p + 1)}
                  className="h-9 px-6 rounded-xl bg-[var(--zv-surface)] border border-[var(--zv-border)] text-[10px] font-bold text-[var(--zv-muted)] hover:text-[var(--zv-text)] hover:border-[#3b82f6]/30 transition-all"
                >
                  Muat Lagi ({totalItems - paginatedStocks.length} tersisa)
                </button>
              </div>
            )}

            {/* Results summary */}
            {totalItems > 0 && (
              <div className="text-center pt-1 pb-2">
                <span className="text-[8px] text-[var(--zv-muted)]">
                  Menampilkan {paginatedStocks.length} dari {totalItems} instrumen
                </span>
              </div>
            )}
          </div>
        )
      })()}
    </motion.div>
  )
}
