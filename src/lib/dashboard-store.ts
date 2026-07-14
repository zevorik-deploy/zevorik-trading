import { create } from 'zustand'
import { useAuthStore } from '@/lib/store'
import { toast } from '@/hooks/use-toast'
import {
  formatRupiah, formatNumber, formatPercent, formatMarketCap, formatDate, formatDateTime,
  type Stock, type PortfolioItem, type Transaction, type PriceHistory, type MarketIndex,
  type NotificationItem, type DepositItem, type WithdrawalItem, type WatchlistItem, type CandleData,
  REFERENCE_TICKERS, PIE_COLORS
} from '@/lib/trading-utils'
import {
  ALL_INDICATORS, OVERLAY_KEYS, SUBCHART_KEYS,
  generateCandle, getDataForTimeframe,
  computeMA, computeBollinger, computeRSI, computeMACD, computeADX,
  computeEnvelopes, computeIchimoku, computeSAR, computeStdDev,
  computeZigZag, computeATR, computeBearsPower, computeBullsPower,
  computeCCI, computeDeMarker, computeForceIndex, computeMomentum,
  computeOsMA, computeRVI, computeStochastic, computeWilliamsR,
  computeAD, computeMFI, computeOBV, computeAO, computeAC,
  computeAlligator, computeFractals, computeGator, computeBWIMFI,
} from '@/lib/indicators'

// ============ TYPES ============

export interface SinyalPosition {
  id: string; stockId: string; stockCode: string; stockName: string;
  direction: 'NAIK' | 'TURUN'; amount: number; duration: number;
  startPrice: number; startTime: number; profitPercent: number;
  status: 'active' | 'won' | 'lost'; leverage: number; closedPL?: number;
  fee?: number; workingCapital?: number;
}

export interface SinyalResult {
  id: string; won: boolean; profit: number; stockCode: string;
  direction: 'NAIK' | 'TURUN'; amount: number; shownAt?: number;
}

export interface ChartPayoutRates {
  up: number; down: number;
  upRange: [number, number]; downRange: [number, number];
}

// ============ CONSTANTS ============

export const LOT_SIZE = 100000

export const STOCK_PAYOUT_TIERS: Record<string, { upRange: [number, number]; downRange: [number, number]; volMultiplier: number }> = {
  TSLA: { upRange: [85, 92], downRange: [48, 56], volMultiplier: 1.8 },
  NVDA: { upRange: [84, 91], downRange: [50, 58], volMultiplier: 1.7 },
  AMD:  { upRange: [83, 90], downRange: [50, 58], volMultiplier: 1.6 },
  COIN: { upRange: [86, 93], downRange: [45, 53], volMultiplier: 2.0 },
  SQ:   { upRange: [84, 91], downRange: [48, 56], volMultiplier: 1.7 },
  META: { upRange: [82, 88], downRange: [52, 60], volMultiplier: 1.4 },
  AMZN: { upRange: [81, 87], downRange: [53, 61], volMultiplier: 1.3 },
  NFLX: { upRange: [82, 89], downRange: [51, 59], volMultiplier: 1.5 },
  AVGO: { upRange: [83, 89], downRange: [52, 60], volMultiplier: 1.4 },
  INTC: { upRange: [80, 86], downRange: [54, 62], volMultiplier: 1.2 },
  TSM:  { upRange: [81, 88], downRange: [53, 61], volMultiplier: 1.3 },
  PYPL: { upRange: [80, 87], downRange: [54, 62], volMultiplier: 1.2 },
  AAPL: { upRange: [78, 84], downRange: [56, 64], volMultiplier: 1.0 },
  MSFT: { upRange: [77, 83], downRange: [57, 65], volMultiplier: 0.9 },
  GOOGL:{ upRange: [78, 84], downRange: [56, 64], volMultiplier: 1.0 },
  CRM:  { upRange: [80, 86], downRange: [54, 62], volMultiplier: 1.2 },
  ORCL: { upRange: [79, 85], downRange: [55, 63], volMultiplier: 1.1 },
  ADBE: { upRange: [80, 86], downRange: [54, 62], volMultiplier: 1.2 },
  UBER: { upRange: [81, 87], downRange: [53, 61], volMultiplier: 1.3 },
  NOW:  { upRange: [81, 87], downRange: [53, 61], volMultiplier: 1.3 },
  JPM:  { upRange: [75, 81], downRange: [58, 66], volMultiplier: 0.7 },
  V:    { upRange: [74, 80], downRange: [59, 67], volMultiplier: 0.6 },
  MA:   { upRange: [74, 80], downRange: [59, 67], volMultiplier: 0.6 },
  GS:   { upRange: [76, 82], downRange: [57, 65], volMultiplier: 0.8 },
  BAC:  { upRange: [75, 81], downRange: [58, 66], volMultiplier: 0.7 },
  PGR:  { upRange: [75, 81], downRange: [58, 66], volMultiplier: 0.7 },
  UNH:  { upRange: [76, 82], downRange: [57, 65], volMultiplier: 0.8 },
  JNJ:  { upRange: [73, 79], downRange: [60, 68], volMultiplier: 0.5 },
  PFE:  { upRange: [76, 82], downRange: [57, 65], volMultiplier: 0.8 },
  LLY:  { upRange: [78, 84], downRange: [56, 64], volMultiplier: 1.0 },
  ABBV: { upRange: [76, 82], downRange: [57, 65], volMultiplier: 0.8 },
  MRK:  { upRange: [75, 81], downRange: [58, 66], volMultiplier: 0.7 },
  WMT:  { upRange: [73, 79], downRange: [60, 68], volMultiplier: 0.5 },
  COST: { upRange: [74, 80], downRange: [59, 67], volMultiplier: 0.6 },
  NKE:  { upRange: [79, 85], downRange: [55, 63], volMultiplier: 1.1 },
  MCD:  { upRange: [73, 79], downRange: [60, 68], volMultiplier: 0.5 },
  KO:   { upRange: [72, 78], downRange: [61, 69], volMultiplier: 0.4 },
  SBUX: { upRange: [76, 82], downRange: [57, 65], volMultiplier: 0.8 },
  PEP:  { upRange: [73, 79], downRange: [60, 68], volMultiplier: 0.5 },
  XOM:  { upRange: [75, 81], downRange: [58, 66], volMultiplier: 0.7 },
  CVX:  { upRange: [75, 81], downRange: [58, 66], volMultiplier: 0.7 },
  COP:  { upRange: [76, 82], downRange: [57, 65], volMultiplier: 0.8 },
  CAT:  { upRange: [77, 83], downRange: [56, 64], volMultiplier: 0.9 },
  BA:   { upRange: [82, 88], downRange: [52, 60], volMultiplier: 1.4 },
  GE:   { upRange: [79, 85], downRange: [55, 63], volMultiplier: 1.1 },
  HON:  { upRange: [75, 81], downRange: [58, 66], volMultiplier: 0.7 },
  DE:   { upRange: [77, 83], downRange: [56, 64], volMultiplier: 0.9 },
  DIS:  { upRange: [78, 84], downRange: [56, 64], volMultiplier: 1.0 },
  CMCSA:{ upRange: [74, 80], downRange: [59, 67], volMultiplier: 0.6 },
  IBM:  { upRange: [74, 80], downRange: [59, 67], volMultiplier: 0.6 },
}

export const sinyalTimeframeSeconds: Record<string, number> = {
  '1m': 60, '2m': 120, '5m': 300, '10m': 600, '15m': 900, '30m': 1800, '1h': 3600,
}

// ============ HELPER FUNCTIONS ============

export const getStockPayoutTier = (code: string) => {
  return STOCK_PAYOUT_TIERS[code] || { upRange: [78, 84] as [number, number], downRange: [56, 64] as [number, number], volMultiplier: 1.0 }
}

export const getStockBaseRate = (code: string): number => {
  const rates: Record<string, number> = {
    AAPL: 5.0, NVDA: 7.0, MSFT: 5.5, GOOGL: 5.8, META: 7.0,
    AMZN: 6.5, TSLA: 7.0, AMD: 7.0, JPM: 5.0, V: 5.2,
    MA: 5.0, GS: 5.8, BAC: 5.0, PGR: 5.5, UNH: 5.2,
    JNJ: 5.0, PFE: 6.0, LLY: 7.0, ABBV: 5.8, MRK: 5.5,
    WMT: 5.0, COST: 5.2, NKE: 5.8, MCD: 5.0, KO: 5.0,
    SBUX: 5.5, PEP: 5.0, XOM: 5.2, CVX: 5.5, COP: 5.8,
    CAT: 5.5, BA: 7.0, GE: 6.2, HON: 5.2, DE: 5.5,
    DIS: 5.8, NFLX: 7.0, CMCSA: 5.0, COIN: 7.0, SQ: 7.0,
    PYPL: 6.2, AVGO: 7.0, INTC: 6.5, TSM: 7.0, CRM: 6.2,
    ORCL: 5.5, ADBE: 6.0, IBM: 5.0, NOW: 7.0, UBER: 7.0,
  }
  return Math.min(rates[code] || 5.0, 7.0)
}

export const calcContractProfit = (stock: Stock, duration: number, amount: number) => {
  const baseRate = getStockBaseRate(stock.code)
  const dailyRate = Math.min(baseRate, 7.0)
  const dailyProfitAmount = Math.round(amount * dailyRate / 100)
  const totalProfit = dailyProfitAmount * duration
  const totalReturn = amount + totalProfit
  return { dailyRate: Math.round(dailyRate * 100) / 100, dailyProfitAmount, totalProfit, totalReturn }
}

export const computeChartPayout = (
  sim: { basePrice: number; momentum: number; price: number; trend: number },
  tier: { upRange: [number, number]; downRange: [number, number]; volMultiplier: number }
): ChartPayoutRates => {
  const baseVal = sim.basePrice
  const momentumStrength = Math.abs(sim.momentum) / (baseVal * 0.005)
  const priceDistance = Math.abs(sim.price - baseVal) / baseVal
  const trendBias = sim.trend * sim.momentum > 0 ? 0.8 : 0

  const upAdjust = -momentumStrength * 3 - priceDistance * 10 * (sim.momentum > 0 ? 1 : -1) - trendBias * 2
  const downAdjust = momentumStrength * 3 + priceDistance * 10 * (sim.momentum > 0 ? 1 : -1) + trendBias * 2
  const noise = (Math.random() - 0.5) * 2

  const upRate = Math.max(tier.upRange[0], Math.min(tier.upRange[1],
    (tier.upRange[0] + tier.upRange[1]) / 2 + upAdjust + noise))
  const downRate = Math.max(tier.downRange[0], Math.min(tier.downRange[1],
    (tier.downRange[0] + tier.downRange[1]) / 2 + downAdjust - noise))

  return {
    up: Math.round(upRate * 10) / 10,
    down: Math.round(downRate * 10) / 10,
    upRange: tier.upRange,
    downRange: tier.downRange,
  }
}

export const getMarketCategory = (s: Stock): string => {
  const cat = (s.category || '').toLowerCase()
  const cryptoCodes = ['BTC', 'ETH', 'XRP', 'SOL', 'DOGE', 'ADA', 'AVAX', 'DOT', 'LINK', 'MATIC', 'BCH', 'LTC', 'XLM', 'UNI', 'AAVE', 'SHIB', 'ATOM', 'FIL', 'NEAR', 'ALGO', 'VET', 'SAND', 'MANA', 'AXS', 'THETA', 'APT', 'ARB', 'OP', 'IMX', 'INJ', 'TIA', 'SEI', 'SUI', 'PEPE', 'FTM', 'GRT', 'ENS', 'LDO', 'RPL', 'STX', 'RUNE', 'KAVA', 'DYDX', 'MINA', 'WLD', 'BONK', 'JUP', 'WIF']
  const forexCodes = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD', 'USDCHF', 'EURGBP', 'EURJPY', 'GBPJPY', 'AUDJPY', 'EURAUD', 'GBPAUD', 'EURNZD', 'GBPCAD', 'USDSGD', 'USDHKD', 'USDSEK', 'USDNOK', 'USDDKK', 'USDZAR', 'USDTRY', 'USDMXN', 'USDPLN', 'EURCHF', 'CADJPY', 'CHFJPY', 'NZDJPY', 'AUDCAD', 'AUDNZD', 'GBPNZD', 'EURCAD']
  const commodityCodes = ['GOLD', 'SILVER', 'OIL', 'NATGAS', 'COPPER', 'PLATINUM', 'PALLADIUM', 'WHEAT', 'CORN', 'SOYBEANS', 'SUGAR', 'COFFEE', 'COTTON', 'LUMBER', 'RICE', 'CACAO', 'RUBBER', 'IRON', 'ALUMINIUM', 'ZINC', 'NICKEL', 'LEAD', 'OILWTI', 'ETHANOL', 'OJ', 'OATS', 'COCOA']
  if (cat.includes('crypto') || cat.includes('kripto') || cryptoCodes.includes(s.code)) return 'crypto'
  if (cat.includes('forex') || forexCodes.includes(s.code)) return 'forex'
  if (cat.includes('commodity') || cat.includes('komoditas') || commodityCodes.includes(s.code)) return 'komoditas'
  return 'saham'
}

export const getMarketRegion = (s: Stock): string => {
  const sector = (s.sector || '').toLowerCase()
  const code = s.code.toUpperCase()
  const idxCodes = ['BBRI', 'BBCA', 'BMRI', 'TLKM', 'ASII', 'BBNI', 'UNVR', 'GOTO', 'EMTK', 'ANTM', 'BRIS', 'ICBP', 'KLBF', 'ACES', 'MAPI']
  if (idxCodes.includes(code) || sector === 'idx') return 'IDX'
  const euCodes = ['SAP', 'ASML', 'NESN', 'AZN', 'SHEL', 'BP', 'RIO', 'BHP', 'GSK', 'SNY', 'NOVN', 'ROG', 'NOVO', 'LVMH', 'MC', 'DTE', 'SIE', 'AIR', 'TTE', 'BN', 'UL']
  if (euCodes.includes(code) || sector === 'european') return 'European'
  const asiaCodes = ['BABA', 'JD', 'PDD', 'TCEHY', 'SONY', 'TM', 'HMC', 'SSNLF', 'HYMTF', 'KRX', 'MUFG', 'NTDOY', 'HDB', 'INFY', 'WIT', 'SEHK', 'SMFG', 'LI', 'XPEV', 'YMM', 'NIO', 'TSM']
  if (asiaCodes.includes(code) || sector === 'asian') return 'Asian'
  return 'US'
}

// ============ DASHBOARD STORE STATE INTERFACE ============

interface DashboardState {
  // ── Core Data ──
  stocks: Stock[]
  portfolio: PortfolioItem[]
  portfolioSummary: { totalInvested: number; totalCurrentValue: number; totalProfitLoss: number; totalProfitLossPercent: number; cashBalance: number; totalAssets: number }
  transactions: Transaction[]
  indices: MarketIndex[]
  notifications: NotificationItem[]
  watchlist: WatchlistItem[]
  deposits: DepositItem[]
  withdrawals: WithdrawalItem[]
  priceHistory: PriceHistory[]

  // ── Navigation/UI ──
  activeTab: string
  selectedStock: Stock | null
  showStockDetail: boolean
  searchQuery: string
  stockFilter: string
  refreshing: boolean
  showNotifPanel: boolean

  // ── Deposit ──
  depositAmount: string
  depositMethod: string
  depositLoading: boolean
  depositStep: 'amount' | 'qris' | 'crypto'
  financeTab: 'deposit' | 'withdraw'
  depositCategory: 'qris' | 'crypto'
  qrisImageUrl: string | null
  depositNetwork: 'TRC20' | 'BEP20' | 'ERC20'
  depositPaymentInfo: { address: string; network: string; coin: string; usdtAmount: number; rate: number; idrAmount: number; minConfirmation: number } | null
  depositCheckLoading: boolean
  depositRate: number

  // ── Withdraw ──
  withdrawAmount: string
  withdrawLoading: boolean
  withdrawCategory: 'bank' | 'ewallet' | 'crypto'
  withdrawBankMethod: string
  withdrawEwalletMethod: string
  withdrawCryptoMethod: string
  withdrawAccountNumber: string
  withdrawAccountHolder: string

  // ── Withdraw OTP ──
  withdrawOtpSent: boolean
  withdrawOtpCode: string[]
  withdrawOtpVerified: boolean
  withdrawOtpLoading: boolean
  withdrawOtpTimer: number

  // ── Contract ──
  contractModal: boolean
  contractAmount: string
  contractDuration: number
  contractLoading: boolean
  contractClaimLoadingId: string | null

  // ── Profile ──
  profileEdit: boolean
  profileForm: { name: string; email: string; bankName: string; bankAccount: string; bankHolder: string }
  copied: boolean
  txFilter: string
  showSideMenu: boolean
  showBalance: boolean

  // ── Banner ──
  bannerIndex: number

  // ── Theme ──
  theme: 'dark' | 'light'

  // ── Extra Modals ──
  showKycModal: boolean
  kycForm: { fullName: string; idNumber: string; address: string; occupation: string; incomeRange: string }
  kycKtpFile: File | null
  kycSelfieFile: File | null
  kycBankFile: File | null
  kycAdditionalFile: File | null
  kycSubmitting: boolean
  kycRecord: any
  showCsModal: boolean
  showAboutModal: boolean
  showHelpModal: boolean

  // ── Sinyal/Trading ──
  sinyalPositions: SinyalPosition[]
  sinyalDirection: 'NAIK' | 'TURUN'
  sinyalAmount: string
  sinyalLots: string
  sinyalLeverage: number
  showConfirmTrade: boolean
  confirmTradeDir: 'NAIK' | 'TURUN'
  sinyalCategory: string
  marketSignalTab: string
  marketFavFilter: string
  marketRegionFilter: string
  favorites: Set<string>
  marketSearchQuery: string
  marketPage: number
  sinyalHistoryFilter: string
  saldoSubTab: 'posisi' | 'riwayat' | 'order'
  sinyalTerminalTab: 'trade' | 'history'
  stopLossPrice: string
  takeProfitPrice: string
  selectedSinyalStock: Stock | null
  sinyalResults: SinyalResult[]
  sinyalTimers: Record<string, number>

  // ── Sinyal Chart ──
  sinyalCandles: CandleData[]
  sinyalCurrentPrice: number
  sinyalChartTick: number
  sinyalCrosshair: { x: number; y: number; w: number; h: number } | null
  sinyalTimeframe: '1m' | '2m' | '5m' | '10m' | '15m' | '30m' | '1h'
  showTimeframeMenu: boolean
  showLeverageMenu: boolean
  chartType: 'candle' | 'line' | 'bar'
  crosshairMode: boolean
  showIndicatorMenu: boolean
  activeIndicators: { key: string; label: string; color: string }[]
  sinyalChartOffset: number
  sinyalChartZoom: number
  chartPayoutRates: ChartPayoutRates

  // ── Live Price Chart ──
  liveBuyChart: { time: string; price: number }[]
  liveSellChart: { time: string; price: number }[]
  liveBuyPrice: number
  liveSellPrice: number
  liveChartActive: boolean

  // ── IHSG Chart ──
  ihsgChartData: { idx: number; value: number }[]

  // ── Trading PL offset ──
  tradingPLOffset: number

  // ============ ACTIONS ============

  // ── Simple Setters ──
  setStocks: (v: Stock[]) => void
  setPortfolio: (v: PortfolioItem[]) => void
  setPortfolioSummary: (v: DashboardState['portfolioSummary']) => void
  setTransactions: (v: Transaction[]) => void
  setIndices: (v: MarketIndex[]) => void
  setNotifications: (v: NotificationItem[]) => void
  setWatchlist: (v: WatchlistItem[]) => void
  setDeposits: (v: DepositItem[]) => void
  setWithdrawals: (v: WithdrawalItem[]) => void
  setPriceHistory: (v: PriceHistory[]) => void

  setActiveTab: (v: string) => void
  setSelectedStock: (v: Stock | null) => void
  setShowStockDetail: (v: boolean) => void
  setSearchQuery: (v: string) => void
  setStockFilter: (v: string) => void
  setRefreshing: (v: boolean) => void
  setShowNotifPanel: (v: boolean) => void

  setDepositAmount: (v: string) => void
  setDepositMethod: (v: string) => void
  setDepositLoading: (v: boolean) => void
  setDepositStep: (v: 'amount' | 'qris' | 'crypto') => void
  setFinanceTab: (v: 'deposit' | 'withdraw') => void
  setDepositCategory: (v: 'qris' | 'crypto') => void
  setQrisImageUrl: (v: string | null) => void
  setDepositNetwork: (v: 'TRC20' | 'BEP20' | 'ERC20') => void
  setDepositPaymentInfo: (v: { address: string; network: string; coin: string; usdtAmount: number; rate: number; idrAmount: number; minConfirmation: number } | null) => void
  setDepositCheckLoading: (v: boolean) => void
  setDepositRate: (v: number) => void

  setWithdrawAmount: (v: string) => void
  setWithdrawLoading: (v: boolean) => void
  setWithdrawCategory: (v: 'bank' | 'ewallet' | 'crypto') => void
  setWithdrawBankMethod: (v: string) => void
  setWithdrawEwalletMethod: (v: string) => void
  setWithdrawCryptoMethod: (v: string) => void
  setWithdrawAccountNumber: (v: string) => void
  setWithdrawAccountHolder: (v: string) => void

  setWithdrawOtpSent: (v: boolean) => void
  setWithdrawOtpCode: (v: string[]) => void
  setWithdrawOtpVerified: (v: boolean) => void
  setWithdrawOtpLoading: (v: boolean) => void
  setWithdrawOtpTimer: (v: number) => void

  setContractModal: (v: boolean) => void
  setContractAmount: (v: string) => void
  setContractDuration: (v: number) => void
  setContractLoading: (v: boolean) => void
  setContractClaimLoadingId: (v: string | null) => void

  setProfileEdit: (v: boolean) => void
  setProfileForm: (v: DashboardState['profileForm']) => void
  setCopied: (v: boolean) => void
  setTxFilter: (v: string) => void
  setShowSideMenu: (v: boolean) => void
  setShowBalance: (v: boolean) => void

  setBannerIndex: (v: number | ((prev: number) => number)) => void
  setTheme: (v: 'dark' | 'light') => void

  setShowKycModal: (v: boolean) => void
  setKycForm: (v: DashboardState['kycForm']) => void
  setKycKtpFile: (v: File | null) => void
  setKycSelfieFile: (v: File | null) => void
  setKycBankFile: (v: File | null) => void
  setKycAdditionalFile: (v: File | null) => void
  setKycSubmitting: (v: boolean) => void
  setKycRecord: (v: any) => void
  setShowCsModal: (v: boolean) => void
  setShowAboutModal: (v: boolean) => void
  setShowHelpModal: (v: boolean) => void

  setSinyalPositions: (v: SinyalPosition[] | ((prev: SinyalPosition[]) => SinyalPosition[])) => void
  setSinyalDirection: (v: 'NAIK' | 'TURUN') => void
  setSinyalAmount: (v: string) => void
  setSinyalLots: (v: string) => void
  setSinyalLeverage: (v: number) => void
  setShowConfirmTrade: (v: boolean) => void
  setConfirmTradeDir: (v: 'NAIK' | 'TURUN') => void
  setSinyalCategory: (v: string) => void
  setMarketSignalTab: (v: string) => void
  setMarketFavFilter: (v: string) => void
  setMarketRegionFilter: (v: string) => void
  setFavorites: (v: Set<string> | ((prev: Set<string>) => Set<string>)) => void
  setMarketSearchQuery: (v: string) => void
  setMarketPage: (v: number) => void
  setSinyalHistoryFilter: (v: string) => void
  setSaldoSubTab: (v: 'posisi' | 'riwayat' | 'order') => void
  setSinyalTerminalTab: (v: 'trade' | 'history') => void
  setStopLossPrice: (v: string) => void
  setTakeProfitPrice: (v: string) => void
  setSelectedSinyalStock: (v: Stock | null) => void
  setSinyalResults: (v: SinyalResult[] | ((prev: SinyalResult[]) => SinyalResult[])) => void
  setSinyalTimers: (v: Record<string, number> | ((prev: Record<string, number>) => Record<string, number>)) => void

  setSinyalCandles: (v: CandleData[] | ((prev: CandleData[]) => CandleData[])) => void
  setSinyalCurrentPrice: (v: number | ((prev: number) => number)) => void
  setSinyalChartTick: (v: number) => void
  setSinyalCrosshair: (v: { x: number; y: number; w: number; h: number } | null) => void
  setSinyalTimeframe: (v: '1m' | '2m' | '5m' | '10m' | '15m' | '30m' | '1h') => void
  setShowTimeframeMenu: (v: boolean) => void
  setShowLeverageMenu: (v: boolean) => void
  setChartType: (v: 'candle' | 'line' | 'bar') => void
  setCrosshairMode: (v: boolean) => void
  setShowIndicatorMenu: (v: boolean) => void
  setActiveIndicators: (v: { key: string; label: string; color: string }[] | ((prev: { key: string; label: string; color: string }[]) => { key: string; label: string; color: string }[])) => void
  setSinyalChartOffset: (v: number) => void
  setSinyalChartZoom: (v: number) => void
  setChartPayoutRates: (v: ChartPayoutRates) => void

  setLiveBuyChart: (v: { time: string; price: number }[] | ((prev: { time: string; price: number }[]) => { time: string; price: number }[])) => void
  setLiveSellChart: (v: { time: string; price: number }[] | ((prev: { time: string; price: number }[]) => { time: string; price: number }[])) => void
  setLiveBuyPrice: (v: number) => void
  setLiveSellPrice: (v: number) => void
  setLiveChartActive: (v: boolean) => void

  setIhsgChartData: (v: { idx: number; value: number }[] | ((prev: { idx: number; value: number }[]) => { idx: number; value: number }[])) => void
  setTradingPLOffset: (v: number | ((prev: number) => number)) => void

  // ── Action Functions ──
  fetchStocks: () => Promise<void>
  fetchPortfolio: () => Promise<void>
  fetchTransactions: () => Promise<void>
  fetchIndices: () => Promise<void>
  fetchNotifications: () => Promise<void>
  fetchWatchlist: () => Promise<void>
  fetchDeposits: () => Promise<void>
  fetchWithdrawals: () => Promise<void>
  fetchPriceHistory: (stockId: string) => Promise<void>
  fetchKycStatus: () => Promise<void>

  refreshAll: () => Promise<void>

  handleDeposit: () => Promise<void>
  handleCryptoDeposit: () => Promise<void>
  handleCheckDeposit: () => Promise<void>
  handleFetchDepositRate: () => Promise<void>
  handleSendWithdrawOtp: (withdrawOtpRefs: React.MutableRefObject<(HTMLInputElement | null)[]>) => Promise<void>
  handleVerifyWithdrawOtp: (withdrawOtpRefs: React.MutableRefObject<(HTMLInputElement | null)[]>) => Promise<void>
  handleWithdraw: () => Promise<void>

  handleContract: () => Promise<void>
  handleContractClaim: (contractId: string) => Promise<void>
  handleProfileSave: () => Promise<void>
  handleKycSubmit: (withdrawOtpRefs?: React.MutableRefObject<(HTMLInputElement | null)[]>) => Promise<void>

  toggleWatchlist: (stockId: string) => Promise<void>
  markNotifRead: (notifId?: string) => Promise<void>
  toggleFavorite: (code: string) => void

  openSinyalPosition: (overrideDirection?: 'NAIK' | 'TURUN') => void
  closeSinyalPosition: (posId: string, sinyalCurrentPrice: number, sinyalChartSimRefValue: any) => void
  getPositionLivePL: (pos: SinyalPosition, sinyalCurrentPrice: number, sinyalChartSimRefValue: any) => number
  calcSinyalProfit: (amount: number, _duration: number, direction: 'NAIK' | 'TURUN') => number

  toggleTheme: () => void
}

// ============ PERSIST HELPERS ============

const DASHBOARD_PERSIST_KEY = 'zv-dashboard-storage'

const loadPersistedDashboard = () => {
  if (typeof window === 'undefined') return null
  try {
    const saved = localStorage.getItem(DASHBOARD_PERSIST_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      return parsed.state || null
    }
  } catch {
    try { localStorage.removeItem(DASHBOARD_PERSIST_KEY) } catch {}
  }
  return null
}

const persistDashboardState = (state: Partial<DashboardState>) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(DASHBOARD_PERSIST_KEY, JSON.stringify({
      state: {
        theme: state.theme,
        activeTab: state.activeTab,
        showBalance: state.showBalance,
        sinyalTimeframe: state.sinyalTimeframe,
        sinyalLeverage: state.sinyalLeverage,
        chartType: state.chartType,
        activeIndicators: state.activeIndicators,
        favorites: state.favorites ? Array.from(state.favorites) : [],
      },
    }))
  } catch {}
}

// ============ STORE CREATION ============

const persisted = loadPersistedDashboard()

// ============ SHARED MUTABLE REFS (accessible by multiple components) ============

export const sinyalChartSimRef =<{
  price: number; basePrice: number; momentum: number; trend: number;
  phase: number; phaseLen: number; vol: number;
  currentCandle: { open: number; high: number; low: number; close: number; volume: number; tickCount: number; maxTicks: number };
} | null>(null)

export const sinyalPositionsRef = { current: [] as SinyalPosition[] }

export const sinyalChartOffsetRef = { current: 0 }
export const sinyalChartZoomRef = { current: 40 }

export const sparklineCache = new Map<string, { i: number; p: number }[]>()
export const sparklineSimRef = new Map<string, { val: number; prevD: number; trend: number; momentum: number }>()
export const ihsgChartRef = { val: 0, baseVal: 0, initialized: false }
export const liveChartRef = { buyPrice: 0, sellPrice: 0, trend: 0, momentum: 0, phase: 0 }

export const useDashboardStore = create<DashboardState>((set, get) => ({
  // ── Core Data ──
  stocks: [],
  portfolio: [],
  portfolioSummary: { totalInvested: 0, totalCurrentValue: 0, totalProfitLoss: 0, totalProfitLossPercent: 0, cashBalance: 0, totalAssets: 0 },
  transactions: [],
  indices: [],
  notifications: [],
  watchlist: [],
  deposits: [],
  withdrawals: [],
  priceHistory: [],

  // ── Navigation/UI ──
  activeTab: persisted?.activeTab || 'home',
  selectedStock: null,
  showStockDetail: false,
  searchQuery: '',
  stockFilter: 'all',
  refreshing: false,
  showNotifPanel: false,

  // ── Deposit ──
  depositAmount: '',
  depositMethod: 'bank_transfer',
  depositLoading: false,
  depositStep: 'amount',
  financeTab: 'deposit',
  depositCategory: 'crypto',
  qrisImageUrl: null,
  depositNetwork: 'TRC20',
  depositPaymentInfo: null,
  depositCheckLoading: false,
  depositRate: 16000,

  // ── Withdraw ──
  withdrawAmount: '',
  withdrawLoading: false,
  withdrawCategory: 'bank',
  withdrawBankMethod: 'BCA',
  withdrawEwalletMethod: 'GOPAY',
  withdrawCryptoMethod: 'USDT_TRC20',
  withdrawAccountNumber: '',
  withdrawAccountHolder: '',

  // ── Withdraw OTP ──
  withdrawOtpSent: false,
  withdrawOtpCode: ['', '', '', '', '', ''],
  withdrawOtpVerified: false,
  withdrawOtpLoading: false,
  withdrawOtpTimer: 0,

  // ── Contract ──
  contractModal: false,
  contractAmount: '',
  contractDuration: 30,
  contractLoading: false,
  contractClaimLoadingId: null,

  // ── Profile ──
  profileEdit: false,
  profileForm: { name: '', email: '', bankName: '', bankAccount: '', bankHolder: '' },
  copied: false,
  txFilter: 'all',
  showSideMenu: false,
  showBalance: persisted?.showBalance ?? true,

  // ── Banner ──
  bannerIndex: 0,

  // ── Theme ──
  theme: persisted?.theme || (typeof window !== 'undefined' && localStorage.getItem('zv-theme') === 'light' ? 'light' : 'dark'),

  // ── Extra Modals ──
  showKycModal: false,
  kycForm: { fullName: '', idNumber: '', address: '', occupation: '', incomeRange: '' },
  kycKtpFile: null,
  kycSelfieFile: null,
  kycBankFile: null,
  kycAdditionalFile: null,
  kycSubmitting: false,
  kycRecord: null,
  showCsModal: false,
  showAboutModal: false,
  showHelpModal: false,

  // ── Sinyal/Trading ──
  sinyalPositions: [],
  sinyalDirection: 'NAIK',
  sinyalAmount: '',
  sinyalLots: '0.10',
  sinyalLeverage: persisted?.sinyalLeverage || 1000,
  showConfirmTrade: false,
  confirmTradeDir: 'NAIK',
  sinyalCategory: 'popular',
  marketSignalTab: 'favorit',
  marketFavFilter: 'semua',
  marketRegionFilter: 'semua',
  favorites: persisted?.favorites ? new Set(persisted.favorites) : new Set(),
  marketSearchQuery: '',
  marketPage: 1,
  sinyalHistoryFilter: 'Semua',
  saldoSubTab: 'posisi',
  sinyalTerminalTab: 'trade',
  stopLossPrice: '',
  takeProfitPrice: '',
  selectedSinyalStock: null,
  sinyalResults: [],
  sinyalTimers: {},

  // ── Sinyal Chart ──
  sinyalCandles: [],
  sinyalCurrentPrice: 0,
  sinyalChartTick: 0,
  sinyalCrosshair: null,
  sinyalTimeframe: persisted?.sinyalTimeframe || '1m',
  showTimeframeMenu: false,
  showLeverageMenu: false,
  chartType: persisted?.chartType || 'candle',
  crosshairMode: false,
  showIndicatorMenu: false,
  activeIndicators: persisted?.activeIndicators || [
    { key: 'ma5', label: 'MA5', color: '#eab308' },
    { key: 'ma20', label: 'MA20', color: '#06b6d4' },
  ],
  sinyalChartOffset: 0,
  sinyalChartZoom: 40,
  chartPayoutRates: { up: 82, down: 58, upRange: [78, 84], downRange: [56, 64] },

  // ── Live Price Chart ──
  liveBuyChart: [],
  liveSellChart: [],
  liveBuyPrice: 0,
  liveSellPrice: 0,
  liveChartActive: false,

  // ── IHSG Chart ──
  ihsgChartData: [],

  // ── Trading PL offset ──
  tradingPLOffset: 0,

  // ============ SIMPLE SETTERS ============

  setStocks: (v) => set({ stocks: v }),
  setPortfolio: (v) => set({ portfolio: v }),
  setPortfolioSummary: (v) => set({ portfolioSummary: v }),
  setTransactions: (v) => set({ transactions: v }),
  setIndices: (v) => set({ indices: v }),
  setNotifications: (v) => set({ notifications: v }),
  setWatchlist: (v) => set({ watchlist: v }),
  setDeposits: (v) => set({ deposits: v }),
  setWithdrawals: (v) => set({ withdrawals: v }),
  setPriceHistory: (v) => set({ priceHistory: v }),

  setActiveTab: (v) => { set({ activeTab: v }); persistDashboardState({ ...get(), activeTab: v } as Partial<DashboardState>) },
  setSelectedStock: (v) => set({ selectedStock: v }),
  setShowStockDetail: (v) => set({ showStockDetail: v }),
  setSearchQuery: (v) => set({ searchQuery: v }),
  setStockFilter: (v) => set({ stockFilter: v }),
  setRefreshing: (v) => set({ refreshing: v }),
  setShowNotifPanel: (v) => set({ showNotifPanel: v }),

  setDepositAmount: (v) => set({ depositAmount: v }),
  setDepositMethod: (v) => set({ depositMethod: v }),
  setDepositLoading: (v) => set({ depositLoading: v }),
  setDepositStep: (v) => set({ depositStep: v }),
  setFinanceTab: (v) => set({ financeTab: v }),
  setDepositCategory: (v) => set({ depositCategory: v }),
  setQrisImageUrl: (v) => set({ qrisImageUrl: v }),
  setDepositNetwork: (v) => set({ depositNetwork: v }),
  setDepositPaymentInfo: (v) => set({ depositPaymentInfo: v }),
  setDepositCheckLoading: (v) => set({ depositCheckLoading: v }),
  setDepositRate: (v) => set({ depositRate: v }),

  setWithdrawAmount: (v) => set({ withdrawAmount: v }),
  setWithdrawLoading: (v) => set({ withdrawLoading: v }),
  setWithdrawCategory: (v) => set({ withdrawCategory: v }),
  setWithdrawBankMethod: (v) => set({ withdrawBankMethod: v }),
  setWithdrawEwalletMethod: (v) => set({ withdrawEwalletMethod: v }),
  setWithdrawCryptoMethod: (v) => set({ withdrawCryptoMethod: v }),
  setWithdrawAccountNumber: (v) => set({ withdrawAccountNumber: v }),
  setWithdrawAccountHolder: (v) => set({ withdrawAccountHolder: v }),

  setWithdrawOtpSent: (v) => set({ withdrawOtpSent: v }),
  setWithdrawOtpCode: (v) => set({ withdrawOtpCode: v }),
  setWithdrawOtpVerified: (v) => set({ withdrawOtpVerified: v }),
  setWithdrawOtpLoading: (v) => set({ withdrawOtpLoading: v }),
  setWithdrawOtpTimer: (v) => set({ withdrawOtpTimer: v }),

  setContractModal: (v) => set({ contractModal: v }),
  setContractAmount: (v) => set({ contractAmount: v }),
  setContractDuration: (v) => set({ contractDuration: v }),
  setContractLoading: (v) => set({ contractLoading: v }),
  setContractClaimLoadingId: (v) => set({ contractClaimLoadingId: v }),

  setProfileEdit: (v) => set({ profileEdit: v }),
  setProfileForm: (v) => set({ profileForm: v }),
  setCopied: (v) => set({ copied: v }),
  setTxFilter: (v) => set({ txFilter: v }),
  setShowSideMenu: (v) => set({ showSideMenu: v }),
  setShowBalance: (v) => { set({ showBalance: v }); persistDashboardState({ ...get(), showBalance: v } as Partial<DashboardState>) },

  setBannerIndex: (v) => set({ bannerIndex: typeof v === 'function' ? v(get().bannerIndex) : v }),
  setTheme: (v) => { set({ theme: v }); persistDashboardState({ ...get(), theme: v } as Partial<DashboardState>) },

  setShowKycModal: (v) => set({ showKycModal: v }),
  setKycForm: (v) => set({ kycForm: v }),
  setKycKtpFile: (v) => set({ kycKtpFile: v }),
  setKycSelfieFile: (v) => set({ kycSelfieFile: v }),
  setKycBankFile: (v) => set({ kycBankFile: v }),
  setKycAdditionalFile: (v) => set({ kycAdditionalFile: v }),
  setKycSubmitting: (v) => set({ kycSubmitting: v }),
  setKycRecord: (v) => set({ kycRecord: v }),
  setShowCsModal: (v) => set({ showCsModal: v }),
  setShowAboutModal: (v) => set({ showAboutModal: v }),
  setShowHelpModal: (v) => set({ showHelpModal: v }),

  setSinyalPositions: (v) => set({ sinyalPositions: typeof v === 'function' ? v(get().sinyalPositions) : v }),
  setSinyalDirection: (v) => set({ sinyalDirection: v }),
  setSinyalAmount: (v) => set({ sinyalAmount: v }),
  setSinyalLots: (v) => set({ sinyalLots: v }),
  setSinyalLeverage: (v) => { set({ sinyalLeverage: v }); persistDashboardState({ ...get(), sinyalLeverage: v } as Partial<DashboardState>) },
  setShowConfirmTrade: (v) => set({ showConfirmTrade: v }),
  setConfirmTradeDir: (v) => set({ confirmTradeDir: v }),
  setSinyalCategory: (v) => set({ sinyalCategory: v }),
  setMarketSignalTab: (v) => set({ marketSignalTab: v }),
  setMarketFavFilter: (v) => set({ marketFavFilter: v }),
  setMarketRegionFilter: (v) => set({ marketRegionFilter: v }),
  setFavorites: (v) => {
    const newFav = typeof v === 'function' ? v(get().favorites) : v
    set({ favorites: newFav })
    persistDashboardState({ ...get(), favorites: newFav } as Partial<DashboardState>)
  },
  setMarketSearchQuery: (v) => set({ marketSearchQuery: v }),
  setMarketPage: (v) => set({ marketPage: v }),
  setSinyalHistoryFilter: (v) => set({ sinyalHistoryFilter: v }),
  setSaldoSubTab: (v) => set({ saldoSubTab: v }),
  setSinyalTerminalTab: (v) => set({ sinyalTerminalTab: v }),
  setStopLossPrice: (v) => set({ stopLossPrice: v }),
  setTakeProfitPrice: (v) => set({ takeProfitPrice: v }),
  setSelectedSinyalStock: (v) => set({ selectedSinyalStock: v }),
  setSinyalResults: (v) => set({ sinyalResults: typeof v === 'function' ? v(get().sinyalResults) : v }),
  setSinyalTimers: (v) => set({ sinyalTimers: typeof v === 'function' ? v(get().sinyalTimers) : v }),

  setSinyalCandles: (v) => set({ sinyalCandles: typeof v === 'function' ? v(get().sinyalCandles) : v }),
  setSinyalCurrentPrice: (v) => set({ sinyalCurrentPrice: typeof v === 'function' ? v(get().sinyalCurrentPrice) : v }),
  setSinyalChartTick: (v) => set({ sinyalChartTick: v }),
  setSinyalCrosshair: (v) => set({ sinyalCrosshair: v }),
  setSinyalTimeframe: (v) => { set({ sinyalTimeframe: v }); persistDashboardState({ ...get(), sinyalTimeframe: v } as Partial<DashboardState>) },
  setShowTimeframeMenu: (v) => set({ showTimeframeMenu: v }),
  setShowLeverageMenu: (v) => set({ showLeverageMenu: v }),
  setChartType: (v) => { set({ chartType: v }); persistDashboardState({ ...get(), chartType: v } as Partial<DashboardState>) },
  setCrosshairMode: (v) => set({ crosshairMode: v }),
  setShowIndicatorMenu: (v) => set({ showIndicatorMenu: v }),
  setActiveIndicators: (v) => {
    const newInd = typeof v === 'function' ? v(get().activeIndicators) : v
    set({ activeIndicators: newInd })
    persistDashboardState({ ...get(), activeIndicators: newInd } as Partial<DashboardState>)
  },
  setSinyalChartOffset: (v) => set({ sinyalChartOffset: v }),
  setSinyalChartZoom: (v) => set({ sinyalChartZoom: v }),
  setChartPayoutRates: (v) => set({ chartPayoutRates: v }),

  setLiveBuyChart: (v) => set({ liveBuyChart: typeof v === 'function' ? v(get().liveBuyChart) : v }),
  setLiveSellChart: (v) => set({ liveSellChart: typeof v === 'function' ? v(get().liveSellChart) : v }),
  setLiveBuyPrice: (v) => set({ liveBuyPrice: v }),
  setLiveSellPrice: (v) => set({ liveSellPrice: v }),
  setLiveChartActive: (v) => set({ liveChartActive: v }),

  setIhsgChartData: (v) => set({ ihsgChartData: typeof v === 'function' ? v(get().ihsgChartData) : v }),
  setTradingPLOffset: (v) => set({ tradingPLOffset: typeof v === 'function' ? v(get().tradingPLOffset) : v }),

  // ============ ACTION FUNCTIONS ============

  fetchStocks: async () => {
    try { const r = await fetch('/api/stocks'); const d = await r.json(); if (d.stocks) set({ stocks: d.stocks }) } catch {}
  },

  fetchPortfolio: async () => {
    const user = useAuthStore.getState().user
    if (!user) return
    try {
      const r = await fetch(`/api/portfolio?userId=${user.id}`)
      const d = await r.json()
      if (d.portfolio) {
        set({ portfolio: d.portfolio, portfolioSummary: d.summary })
        const tradingPLOffset = get().tradingPLOffset
        const adjustedBalance = d.summary.cashBalance + tradingPLOffset
        useAuthStore.getState().updateBalance(adjustedBalance)
      }
    } catch {}
  },

  fetchTransactions: async () => {
    const user = useAuthStore.getState().user
    if (!user) return
    try { const r = await fetch(`/api/transactions?userId=${user.id}`); const d = await r.json(); if (d.transactions) set({ transactions: d.transactions }) } catch {}
  },

  fetchIndices: async () => {
    try { const r = await fetch('/api/market'); const d = await r.json(); if (d.indices) set({ indices: d.indices }) } catch {}
  },

  fetchNotifications: async () => {
    const user = useAuthStore.getState().user
    if (!user) return
    try { const r = await fetch(`/api/notifications?userId=${user.id}`); const d = await r.json(); if (d.notifications) set({ notifications: d.notifications }) } catch {}
  },

  fetchWatchlist: async () => {
    const user = useAuthStore.getState().user
    if (!user) return
    try { const r = await fetch(`/api/watchlist?userId=${user.id}`); const d = await r.json(); if (d.watchlist) set({ watchlist: d.watchlist }) } catch {}
  },

  fetchDeposits: async () => {
    const user = useAuthStore.getState().user
    if (!user) return
    try { const r = await fetch(`/api/deposit?userId=${user.id}`); const d = await r.json(); if (d.deposits) set({ deposits: d.deposits }) } catch {}
  },

  fetchWithdrawals: async () => {
    const user = useAuthStore.getState().user
    if (!user) return
    try { const r = await fetch(`/api/withdrawal?userId=${user.id}`); const d = await r.json(); if (d.withdrawals) set({ withdrawals: d.withdrawals }) } catch {}
  },

  fetchPriceHistory: async (stockId: string) => {
    try { const r = await fetch(`/api/stocks/${stockId}`); const d = await r.json(); if (d.priceHistory) set({ priceHistory: d.priceHistory }) } catch {}
  },

  fetchKycStatus: async () => {
    const user = useAuthStore.getState().user
    if (!user) return
    try {
      const r = await fetch(`/api/kyc?userId=${user.id}`)
      const d = await r.json()
      if (d.kycRecord) set({ kycRecord: d.kycRecord })
      if (d.kycStatus) useAuthStore.getState().updateUser({ kycStatus: d.kycStatus })
    } catch {}
  },

  refreshAll: async () => {
    set({ refreshing: true })
    try { await fetch('/api/stocks/update-prices', { method: 'POST' }) } catch {}
    const s = get()
    await Promise.all([s.fetchStocks(), s.fetchPortfolio(), s.fetchIndices()])
    set({ refreshing: false })
  },

  handleDeposit: async () => {
    // All deposits are now crypto (USDT)
    get().handleCryptoDeposit()
  },

  handleCryptoDeposit: async () => {
    const user = useAuthStore.getState().user
    const { depositAmount, depositNetwork } = get()
    if (!user || !depositAmount) return
    const amount = parseFloat(depositAmount)
    if (amount < 100) { toast({ title: 'Minimum deposit 100 USDT', variant: 'destructive' }); return }

    // Check KYC first
    if (user.kycStatus !== 'verified') {
      toast({ title: 'KYC Diperlukan', description: 'Verifikasi KYC terlebih dahulu untuk deposit', variant: 'destructive' })
      set({ showKycModal: true })
      return
    }

    set({ depositLoading: true })
    try {
      const res = await fetch('/api/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, amount, method: 'crypto', network: depositNetwork }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.kycRequired) {
          toast({ title: 'KYC Diperlukan', description: data.error, variant: 'destructive' })
          set({ showKycModal: true })
        } else {
          throw new Error(data.error)
        }
        return
      }
      set({
        depositPaymentInfo: data.paymentInfo,
        depositStep: 'crypto',
      })
      toast({ title: 'Alamat Deposit Siap!', description: `Kirim ${data.paymentInfo.usdtAmount} USDT via ${depositNetwork}` })
    } catch (err: unknown) {
      toast({ title: 'Gagal', description: err instanceof Error ? err.message : 'Error', variant: 'destructive' })
    } finally { set({ depositLoading: false }) }
  },

  handleCheckDeposit: async () => {
    const user = useAuthStore.getState().user
    if (!user) return
    set({ depositCheckLoading: true })
    try {
      const res = await fetch('/api/deposit/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.creditedCount > 0) {
        toast({ title: 'Deposit Dikonfirmasi! ✓', description: `${data.creditedCount} deposit berhasil dikreditkan ke saldo Anda` })
        set({ depositStep: 'amount', depositAmount: '', depositPaymentInfo: null })
        const s = get()
        s.fetchPortfolio(); s.fetchDeposits(); s.fetchNotifications()
        // Update user balance in auth store
        useAuthStore.getState().refreshUser()
      } else {
        toast({ title: 'Menunggu Konfirmasi', description: data.message || 'Belum ada deposit yang dikonfirmasi. Silakan tunggu.' })
      }
    } catch (err: unknown) {
      toast({ title: 'Gagal', description: err instanceof Error ? err.message : 'Gagal mengecek deposit', variant: 'destructive' })
    } finally { set({ depositCheckLoading: false }) }
  },

  handleFetchDepositRate: async () => {
    try {
      const res = await fetch('/api/deposit/rate')
      const data = await res.json()
      if (data.rate) set({ depositRate: data.rate })
    } catch {}
  },

  handleSendWithdrawOtp: async (withdrawOtpRefs) => {
    const user = useAuthStore.getState().user
    if (!user?.email) { toast({ title: 'Error', description: 'Email tidak ditemukan', variant: 'destructive' }); return }
    set({ withdrawOtpLoading: true })
    try {
      const res = await fetch('/api/otp/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email, type: 'withdrawal' }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      set({ withdrawOtpSent: true, withdrawOtpTimer: 60 })
      toast({ title: 'OTP Terkirim!', description: `Kode verifikasi dikirim ke ${user.email.replace(/(.{1})(.*)(@.*)/, '$1***$3')}` })
      setTimeout(() => withdrawOtpRefs.current[0]?.focus(), 100)
    } catch (err: unknown) {
      toast({ title: 'Gagal', description: err instanceof Error ? err.message : 'Gagal mengirim OTP', variant: 'destructive' })
    } finally { set({ withdrawOtpLoading: false }) }
  },

  handleVerifyWithdrawOtp: async (withdrawOtpRefs) => {
    const user = useAuthStore.getState().user
    const { withdrawOtpCode } = get()
    if (!user?.email) return
    const code = withdrawOtpCode.join('')
    if (code.length !== 6) { toast({ title: 'Error', description: 'Masukkan 6 digit kode OTP', variant: 'destructive' }); return }
    set({ withdrawOtpLoading: true })
    try {
      const res = await fetch('/api/otp/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email, code, type: 'withdrawal' }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      set({ withdrawOtpVerified: true })
      toast({ title: 'OTP Terverifikasi!', description: 'Anda dapat melanjutkan withdrawal' })
    } catch (err: unknown) {
      toast({ title: 'Verifikasi Gagal', description: err instanceof Error ? err.message : 'Kode OTP salah', variant: 'destructive' })
      set({ withdrawOtpCode: ['', '', '', '', '', ''] })
      setTimeout(() => withdrawOtpRefs.current[0]?.focus(), 100)
    } finally { set({ withdrawOtpLoading: false }) }
  },

  handleWithdraw: async () => {
    const user = useAuthStore.getState().user
    const { withdrawAmount, withdrawOtpVerified, withdrawCategory, withdrawBankMethod, withdrawEwalletMethod, withdrawCryptoMethod, withdrawAccountNumber, withdrawAccountHolder } = get()
    if (!user || !withdrawAmount) return
    if (!withdrawOtpVerified) { toast({ title: 'Verifikasi OTP Terlebih Dahulu', description: 'Kirim dan verifikasi OTP sebelum withdrawal', variant: 'destructive' }); return }
    const amount = parseFloat(withdrawAmount)
    if (amount < 10) { toast({ title: 'Minimum Withdraw 10 USDT', variant: 'destructive' }); return }
    if (amount > (user?.balance || 0)) { toast({ title: 'Saldo tidak cukup', variant: 'destructive' }); return }
    if (withdrawCategory !== 'crypto' && !withdrawAccountNumber) { toast({ title: 'Isi nomor rekening / HP terlebih dahulu', variant: 'destructive' }); return }
    if (withdrawCategory === 'bank' && !withdrawAccountHolder) { toast({ title: 'Isi nama pemilik rekening', variant: 'destructive' }); return }
    set({ withdrawLoading: true })
    try {
      const methodName = withdrawCategory === 'bank' ? withdrawBankMethod : withdrawCategory === 'ewallet' ? withdrawEwalletMethod : withdrawCryptoMethod
      const res = await fetch('/api/withdrawal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, amount, bankName: methodName, bankAccount: withdrawAccountNumber || user.bankAccount || '0000000', bankHolder: withdrawAccountHolder || user.name, otpVerified: true }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const isProfit100 = data.isProfit100Percent
      const penalty = data.penalty || 0
      const adminFee = data.adminFee || 0
      const netAmount = data.netAmount || 0
      if (isProfit100) {
        toast({ title: 'Withdraw Diproses!', description: `${formatRupiah(amount)} USDT — Admin 5%: ${formatRupiah(adminFee)} — Diterima: ${formatRupiah(netAmount)} USDT` })
      } else {
        toast({ title: 'Withdraw Diproses!', description: `${formatRupiah(amount)} USDT — Penalty 50%: ${formatRupiah(penalty)} — Admin 5%: ${formatRupiah(adminFee)} — Diterima: ${formatRupiah(netAmount)} USDT` })
      }
      set({ withdrawAmount: '', withdrawAccountNumber: '', withdrawAccountHolder: '', withdrawOtpVerified: false, withdrawOtpSent: false, withdrawOtpCode: ['', '', '', '', '', ''] })
      const s = get()
      s.fetchPortfolio(); s.fetchWithdrawals()
      useAuthStore.getState().refreshUser()
    } catch (err: unknown) { toast({ title: 'Gagal', description: err instanceof Error ? err.message : 'Error', variant: 'destructive' }) }
    finally { set({ withdrawLoading: false }) }
  },

  handleContract: async () => {
    const user = useAuthStore.getState().user
    const { selectedStock, contractAmount, contractDuration } = get()
    if (!user || !selectedStock || !contractAmount) return
    const amount = parseInt(contractAmount)
    if (amount < 100000) { toast({ title: 'Minimum investasi Rp 100.000', variant: 'destructive' }); return }
    if (amount > (user?.balance || 0)) { toast({ title: 'Saldo tidak cukup', variant: 'destructive' }); return }
    if (contractDuration < 30) { toast({ title: 'Durasi minimal 30 hari', variant: 'destructive' }); return }
    set({ contractLoading: true })
    try {
      const profit = calcContractProfit(selectedStock, contractDuration, amount)
      const res = await fetch('/api/contracts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id, stockId: selectedStock.id, amount, duration: contractDuration,
          dailyProfitRate: profit.dailyRate, dailyProfitAmount: profit.dailyProfitAmount,
          totalProfit: profit.totalProfit, totalReturn: profit.totalReturn,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      useAuthStore.getState().updateBalance(data.newBalance)
      toast({ title: 'Kontrak Berhasil Dibeli!', description: `Kontrak ${selectedStock.code} • ${contractDuration} hari • Profit ${profit.dailyRate}%/hari` })
      set({ contractModal: false, contractAmount: '', contractDuration: 30 })
    } catch (err: unknown) {
      toast({ title: 'Gagal', description: err instanceof Error ? err.message : 'Error', variant: 'destructive' })
    } finally { set({ contractLoading: false }) }
  },

  handleContractClaim: async (contractId: string) => {
    const user = useAuthStore.getState().user
    if (!user) return
    set({ contractClaimLoadingId: contractId })
    try {
      const res = await fetch('/api/contracts', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contractId, action: 'claim' }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.claimedAmount) {
        useAuthStore.getState().updateBalance((user?.balance || 0) + data.claimedAmount)
        toast({ title: data.isCompleted ? 'Kontrak Selesai!' : 'Profit Diterima!', description: `+${formatRupiah(data.claimedAmount)} dari kontrak` })
      }
    } catch (err: unknown) {
      toast({ title: 'Gagal', description: err instanceof Error ? err.message : 'Error', variant: 'destructive' })
    } finally { set({ contractClaimLoadingId: null }) }
  },

  handleProfileSave: async () => {
    const user = useAuthStore.getState().user
    const { profileForm } = get()
    if (!user) return
    try {
      const res = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, ...profileForm }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      useAuthStore.getState().updateUser(data.user)
      set({ profileEdit: false })
      toast({ title: 'Profil Diperbarui!' })
    } catch (err: unknown) { toast({ title: 'Gagal', description: err instanceof Error ? err.message : 'Error', variant: 'destructive' }) }
  },

  handleKycSubmit: async () => {
    const user = useAuthStore.getState().user
    const { kycForm, kycKtpFile, kycSelfieFile, kycBankFile, kycAdditionalFile } = get()
    if (!user) return
    if (!kycForm.fullName || !kycForm.idNumber || !kycForm.address || !kycForm.occupation || !kycForm.incomeRange) {
      toast({ title: 'Lengkapi Data', description: 'Semua field wajib diisi', variant: 'destructive' }); return
    }
    if (!kycKtpFile) { toast({ title: 'Upload KTP', description: 'Foto KTP wajib diupload', variant: 'destructive' }); return }
    if (!kycSelfieFile) { toast({ title: 'Upload Selfie', description: 'Foto selfie dengan KTP wajib diupload', variant: 'destructive' }); return }
    set({ kycSubmitting: true })
    try {
      const uploadFile = async (file: File): Promise<string | null> => {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('userId', user.id)
        try { const r = await fetch('/api/upload', { method: 'POST', body: fd }); const d = await r.json(); return d.url || null } catch { return null }
      }
      const ktpUrl = await uploadFile(kycKtpFile)
      if (!ktpUrl) { toast({ title: 'Gagal Upload', description: 'Gagal upload foto KTP', variant: 'destructive' }); set({ kycSubmitting: false }); return }
      const selfieUrl = await uploadFile(kycSelfieFile)
      if (!selfieUrl) { toast({ title: 'Gagal Upload', description: 'Gagal upload foto selfie', variant: 'destructive' }); set({ kycSubmitting: false }); return }
      let bankUrl: string | null = null
      if (kycBankFile) { bankUrl = await uploadFile(kycBankFile) }
      let additionalUrl: string | null = null
      if (kycAdditionalFile) { additionalUrl = await uploadFile(kycAdditionalFile) }

      const res = await fetch('/api/kyc', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, ...kycForm, ktpImage: ktpUrl, selfieImage: selfieUrl, bankStatement: bankUrl, additionalDoc: additionalUrl })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      useAuthStore.getState().updateUser({ kycStatus: 'pending' })
      set({ kycRecord: data.kycRecord })
      toast({ title: 'KYC Diajukan! 📋', description: 'Proses verifikasi 1-3 hari kerja. Setelah verified, minimum withdraw hanya Rp 50.000!' })
    } catch (err: unknown) {
      toast({ title: 'Gagal', description: err instanceof Error ? err.message : 'Gagal mengajukan KYC', variant: 'destructive' })
    } finally { set({ kycSubmitting: false }) }
  },

  toggleWatchlist: async (stockId: string) => {
    const user = useAuthStore.getState().user
    const { watchlist } = get()
    if (!user) return
    const exists = watchlist.some(w => w.stockId === stockId)
    try {
      if (exists) {
        await fetch('/api/watchlist', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, stockId }) })
      } else {
        await fetch('/api/watchlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, stockId }) })
      }
      get().fetchWatchlist()
    } catch {}
  },

  markNotifRead: async (notifId?: string) => {
    const user = useAuthStore.getState().user
    if (!user) return
    try {
      await fetch('/api/notifications', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, notificationId: notifId, markAll: !notifId }) })
      get().fetchNotifications()
    } catch {}
  },

  toggleFavorite: (code: string) => {
    const { favorites } = get()
    const next = new Set(favorites)
    if (next.has(code)) next.delete(code)
    else next.add(code)
    set({ favorites: next })
    persistDashboardState({ ...get(), favorites: next } as Partial<DashboardState>)
  },

  openSinyalPosition: (overrideDirection?: 'NAIK' | 'TURUN') => {
    const { selectedSinyalStock, sinyalAmount, sinyalLots, sinyalDirection, sinyalCurrentPrice, sinyalLeverage } = get()
    const user = useAuthStore.getState().user
    if (!selectedSinyalStock) return
    const sinyalAmountFromLots = Math.round(parseFloat(sinyalLots || '0') * LOT_SIZE)
    const amount = sinyalAmountFromLots || parseInt(sinyalAmount) || 0
    if (amount < 1000) { toast({ title: 'Minimum 0.01 Lot (Rp 1.000)', variant: 'destructive' }); return }
    const totalBalance = (user?.balance || 0)
    if (amount > totalBalance) { toast({ title: 'Saldo tidak cukup', description: `Saldo: ${formatRupiah(totalBalance)}`, variant: 'destructive' }); return }
    const dir = overrideDirection || sinyalDirection
    const posId = `sinyal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const newPosition: SinyalPosition = {
      id: posId, stockId: selectedSinyalStock.id, stockCode: selectedSinyalStock.code, stockName: selectedSinyalStock.name,
      direction: dir, amount, duration: 0, startPrice: sinyalCurrentPrice || selectedSinyalStock.price,
      startTime: Date.now(), profitPercent: 0, status: 'active', leverage: sinyalLeverage,
    }
    set(state => ({ sinyalPositions: [...state.sinyalPositions, newPosition], sinyalTimers: { ...state.sinyalTimers, [posId]: 0 } }))
    const lotsLabel = sinyalLots || (amount / LOT_SIZE).toFixed(2)
    toast({ title: 'Posisi Dibuka! 🎯', description: `${dir === 'NAIK' ? 'Buy' : 'Sell'} ${selectedSinyalStock.code} • ${lotsLabel} Lot (${formatRupiah(amount)}) • Tutup manual` })
  },

  closeSinyalPosition: (posId: string, sinyalCurrentPrice: number, sinyalChartSimRefValue: any) => {
    const { sinyalPositions } = get()
    const pos = sinyalPositions.find(p => p.id === posId)
    if (!pos || pos.status !== 'active') return

    const currentPrice = sinyalCurrentPrice || sinyalChartSimRefValue?.price || pos.startPrice
    const lev = pos.leverage || 1000
    const effectivePositionValue = pos.amount * (lev / 100)
    const priceDiff = currentPrice - pos.startPrice
    const directionMultiplier = pos.direction === 'NAIK' ? 1 : -1
    const plAmount = Math.round(effectivePositionValue * (priceDiff / pos.startPrice) * directionMultiplier)
    const cappedPL = Math.max(-pos.amount, plAmount)
    const isProfit = cappedPL >= 0

    set(state => ({
      sinyalPositions: state.sinyalPositions.map(p =>
        p.id === posId ? { ...p, status: isProfit ? 'won' as const : 'lost' as const, closedPL: cappedPL } : p
      ),
      sinyalResults: [...state.sinyalResults, {
        id: posId, won: isProfit, profit: cappedPL, stockCode: pos.stockCode, direction: pos.direction, amount: pos.amount, shownAt: Date.now(),
      }],
    }))

    setTimeout(() => {
      set(state => ({ sinyalResults: state.sinyalResults.filter(r => r.id !== posId) }))
    }, 1200)

    // Update trading PL offset
    set(state => ({ tradingPLOffset: state.tradingPLOffset + cappedPL }))

    // Update balance
    const user = useAuthStore.getState().user
    useAuthStore.getState().updateBalance((user?.balance || 0) + cappedPL)

    const plLabel = cappedPL >= 0 ? `+${formatRupiah(cappedPL)}` : formatRupiah(cappedPL)
    toast({ title: isProfit ? 'Posisi Ditutup — Untung! 🎉' : 'Posisi Ditutup — Rugi 📉', description: `${pos.direction === 'NAIK' ? 'Buy' : 'Sell'} ${pos.stockCode} • P&L ${plLabel} • 1:${lev}` })
  },

  getPositionLivePL: (pos: SinyalPosition, sinyalCurrentPrice: number, sinyalChartSimRefValue: any) => {
    if (pos.status !== 'active') return 0
    const currentPrice = sinyalCurrentPrice || sinyalChartSimRefValue?.price || pos.startPrice
    const lev = pos.leverage || 1000
    const effectivePositionValue = pos.amount * (lev / 100)
    const priceDiff = currentPrice - pos.startPrice
    const directionMultiplier = pos.direction === 'NAIK' ? 1 : -1
    const plAmount = Math.round(effectivePositionValue * (priceDiff / pos.startPrice) * directionMultiplier)
    return Math.max(-pos.amount, plAmount)
  },

  calcSinyalProfit: (amount: number, _duration: number, direction: 'NAIK' | 'TURUN') => {
    const { chartPayoutRates } = get()
    return direction === 'NAIK' ? chartPayoutRates.up : chartPayoutRates.down
  },

  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark'
    set({ theme: newTheme })
    if (typeof document !== 'undefined') document.documentElement.className = newTheme
    if (typeof window !== 'undefined') localStorage.setItem('zv-theme', newTheme)
    persistDashboardState({ ...get(), theme: newTheme } as Partial<DashboardState>)
  },
}))
