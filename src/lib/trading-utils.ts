// ============================================
// UTILITY FUNCTIONS
// ============================================
export const formatUSD = (num: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num)

// Keep formatRupiah as alias for backward compatibility (now shows USD)
export const formatRupiah = formatUSD

export const formatNumber = (num: number): string =>
  new Intl.NumberFormat('en-US').format(num)

export const formatPercent = (num: number): string =>
  `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`

export const formatMarketCap = (num: number): string => {
  if (num >= 1e12) return `${(num / 1e12).toFixed(1)}T`
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`
  return formatNumber(num)
}

export const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

export const formatDateTime = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

// ============================================
// TYPES
// ============================================
export interface Stock {
  id: string; code: string; name: string; price: number; change: number;
  changePercent: number; high: number; low: number; open: number;
  volume: number; marketCap: number; category: string; sector?: string;
  logo?: string; description?: string; peRatio?: number; pbv?: number; dividendYield?: number; lotSize?: number;
}

export interface PortfolioItem {
  id: string; userId: string; stockId: string; shares: number; avgPrice: number;
  stock: Stock; currentValue: number; investedValue: number; profitLoss: number; profitLossPercent: number;
}

export interface Transaction {
  id: string; userId: string; stockId: string; type: string; orderType?: string;
  shares: number; price: number; total: number; fee?: number; status: string; createdAt: string;
  stock: Stock;
}

export interface PriceHistory { id: string; stockCode: string; price: number; timestamp: string }

export interface MarketIndex {
  id: string; code: string; name: string; value: number; change: number; changePercent: number;
}

export interface NotificationItem {
  id: string; userId: string; title: string; message: string; type: string; isRead: boolean; createdAt: string;
}

export interface DepositItem {
  id: string; userId: string; amount: number; method: string; bankName?: string; status: string; createdAt: string;
}

export interface WithdrawalItem {
  id: string; userId: string; amount: number; bankName?: string; bankAccount?: string; bankHolder?: string; status: string; createdAt: string;
}

export interface WatchlistItem {
  id: string; userId: string; stockId: string; stock: Stock; createdAt: string;
}

export interface CandleData {
  idx: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  time: string;
}

// ============================================
// TICKER DATA (matching reference)
// ============================================
export const REFERENCE_TICKERS = [
  { code: 'TE', change: '+1.59%', up: true },
  { code: 'IDX', change: '-2.13%', up: false },
  { code: 'IHSG', change: '+0.28%', up: true },
  { code: 'SAHAM', change: '+3.22%', up: true },
  { code: 'GOLD', change: '+4.04%', up: true },
  { code: 'BANK', change: '+3.30%', up: true },
  { code: 'ENERGY', change: '+3.77%', up: true },
  { code: 'OIL', change: '-3.48%', up: false },
  { code: 'TE', change: '+2.86%', up: true },
]

export const PIE_COLORS = ['#2563eb', '#f59e0b', '#60a5fa', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899']
