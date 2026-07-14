// ============================================
// Binance API Client with HMAC-SHA256 Signing
// ============================================
import crypto from 'crypto'

const BINANCE_BASE = 'https://api.binance.com'

function getApiKey(): string {
  return process.env.BINANCE_API_KEY || ''
}

function getSecretKey(): string {
  return process.env.BINANCE_SECRET_KEY || ''
}

function sign(queryString: string): string {
  return crypto.createHmac('sha256', getSecretKey()).update(queryString).digest('hex')
}

function getTimestamp(): number {
  return Date.now()
}

async function binanceRequest(method: string, endpoint: string, params: Record<string, string | number> = {}) {
  const queryParams: Record<string, string> = {}
  for (const [k, v] of Object.entries(params)) {
    queryParams[k] = String(v)
  }
  queryParams['timestamp'] = String(getTimestamp())

  const queryString = new URLSearchParams(queryParams).toString()
  const signature = sign(queryString)
  const url = `${BINANCE_BASE}${endpoint}?${queryString}&signature=${signature}`

  const response = await fetch(url, {
    method,
    headers: {
      'X-MBX-APIKEY': getApiKey(),
      'Content-Type': 'application/json',
    },
  })

  const data = await response.json()
  if (data.code && data.code < 0) {
    throw new Error(data.msg || 'Binance API error')
  }
  return data
}

// ============================================
// Deposit Address
// ============================================
export interface BinanceDepositAddress {
  address: string
  coin: string
  tag: string
  url: string
}

/**
 * Get deposit address for a coin on a specific network
 * Networks: TRC20, BEP20, ERC20, etc.
 */
export async function getDepositAddress(coin: string = 'USDT', network: string = 'TRC20'): Promise<BinanceDepositAddress> {
  try {
    const result = await binanceRequest('GET', '/sapi/v1/capital/deposit/address', {
      coin,
      network,
    })
    return result as BinanceDepositAddress
  } catch (error) {
    console.error('Get deposit address error:', error)
    throw error
  }
}

// ============================================
// Deposit History
// ============================================
export interface BinanceDepositRecord {
  amount: string
  coin: string
  network: string
  status: number // 0:pending, 6:credited but cannot withdraw, 1:success
  address: string
  addressTag: string
  txId: string
  insertTime: number
  transferType: number
  confirmTimes: string
}

/**
 * Get deposit history from Binance
 * Can filter by coin and time range
 */
export async function getDepositHistory(
  coin: string = 'USDT',
  startTime?: number,
  endTime?: number
): Promise<BinanceDepositRecord[]> {
  try {
    const params: Record<string, string | number> = { coin }
    if (startTime) params.startTime = startTime
    if (endTime) params.endTime = endTime

    const result = await binanceRequest('GET', '/sapi/v1/capital/deposit/hisrec', params)
    return result as BinanceDepositRecord[]
  } catch (error) {
    console.error('Get deposit history error:', error)
    throw error
  }
}

// ============================================
// Ticker Price (for IDR/USDT conversion)
// ============================================
export interface BinanceTickerPrice {
  symbol: string
  price: string
}

/**
 * Get current USDT price (for conversion rate)
 */
export async function getUsdtPrice(): Promise<number> {
  try {
    const response = await fetch(`${BINANCE_BASE}/api/v3/ticker/price?symbol=USDTIDRT`)
    if (response.ok) {
      const data = await response.json()
      return parseFloat(data.price) || 16000 // fallback rate
    }
    // Fallback: try USDTBIDR
    const response2 = await fetch(`${BINANCE_BASE}/api/v3/ticker/price?symbol=USDTBIDR`)
    if (response2.ok) {
      const data2 = await response2.json()
      return parseFloat(data2.price) || 16000
    }
    return 16000 // fallback rate ~16,000 IDR per USDT
  } catch {
    return 16000 // fallback rate
  }
}

// ============================================
// Account Status
// ============================================
export async function getAccountStatus(): Promise<{ success: boolean; msg?: string }> {
  try {
    const result = await binanceRequest('GET', '/sapi/v1/account/status')
    return { success: true, msg: result.msg || 'OK' }
  } catch (error) {
    return { success: false, msg: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// ============================================
// Utility: Convert IDR to USDT
// ============================================
// Cache the rate for 5 minutes
let cachedRate: number = 0
let cachedRateTime: number = 0

export async function getIdrToUsdtRate(): Promise<number> {
  const now = Date.now()
  if (cachedRate && now - cachedRateTime < 5 * 60 * 1000) {
    return cachedRate
  }
  const rate = await getUsdtPrice()
  cachedRate = rate
  cachedRateTime = now
  return rate
}

export async function convertIdrToUsdt(idrAmount: number): Promise<{ usdtAmount: number; rate: number }> {
  const rate = await getIdrToUsdtRate()
  const usdtAmount = Number((idrAmount / rate).toFixed(2))
  return { usdtAmount, rate }
}

export async function convertUsdtToIdr(usdtAmount: number): Promise<{ idrAmount: number; rate: number }> {
  const rate = await getIdrToUsdtRate()
  const idrAmount = Math.round(usdtAmount * rate)
  return { idrAmount, rate }
}
