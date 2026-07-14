import { CandleData } from './trading-utils'

// ============================================
// MT5 Indicator Definitions
// ============================================
export const ALL_INDICATORS = [
  // TREND
  { key: 'adx', label: 'ADX', color: '#f97316', group: 'Trend', desc: 'Directional Movement' },
  { key: 'bollinger', label: 'Bollinger Bands', color: '#8b5cf6', group: 'Trend', desc: 'BB (20,2)' },
  { key: 'envelopes', label: 'Envelopes', color: '#14b8a6', group: 'Trend', desc: 'Env (20,5%)' },
  { key: 'ichimoku', label: 'Ichimoku', color: '#eab308', group: 'Trend', desc: 'Kinko Hyo' },
  { key: 'ma5', label: 'MA 5', color: '#eab308', group: 'Trend', desc: 'Moving Average 5' },
  { key: 'ma20', label: 'MA 20', color: '#06b6d4', group: 'Trend', desc: 'Moving Average 20' },
  { key: 'sar', label: 'Parabolic SAR', color: '#22c55e', group: 'Trend', desc: 'Stop & Reverse' },
  { key: 'stddev', label: 'Std Deviation', color: '#ec4899', group: 'Trend', desc: 'Volatility' },
  { key: 'zigzag', label: 'ZigZag', color: '#a855f7', group: 'Trend', desc: 'Pattern Filter' },
  // OSCILLATOR
  { key: 'atr', label: 'ATR', color: '#f97316', group: 'Oscillator', desc: 'Avg True Range' },
  { key: 'bears', label: 'Bears Power', color: '#ef4444', group: 'Oscillator', desc: 'Seller Strength' },
  { key: 'bulls', label: 'Bulls Power', color: '#22c55e', group: 'Oscillator', desc: 'Buyer Strength' },
  { key: 'cci', label: 'CCI', color: '#06b6d4', group: 'Oscillator', desc: 'Commodity Channel' },
  { key: 'demarker', label: 'DeMarker', color: '#8b5cf6', group: 'Oscillator', desc: 'Reversal Risk' },
  { key: 'force', label: 'Force Index', color: '#3b82f6', group: 'Oscillator', desc: 'Price × Volume' },
  { key: 'macd', label: 'MACD', color: '#3b82f6', group: 'Oscillator', desc: 'MACD (12,26,9)' },
  { key: 'momentum', label: 'Momentum', color: '#f59e0b', group: 'Oscillator', desc: 'Rate of Change' },
  { key: 'osma', label: 'OsMA', color: '#6366f1', group: 'Oscillator', desc: 'MA of Oscillator' },
  { key: 'rsi', label: 'RSI', color: '#f59e0b', group: 'Oscillator', desc: 'Relative Strength' },
  { key: 'rvi', label: 'RVI', color: '#14b8a6', group: 'Oscillator', desc: 'Relative Vigor' },
  { key: 'stochastic', label: 'Stochastic', color: '#ec4899', group: 'Oscillator', desc: 'Stoch (5,3)' },
  { key: 'williamsr', label: "Williams'%R", color: '#a855f7', group: 'Oscillator', desc: 'Percent Range' },
  // VOLUME
  { key: 'ad', label: 'A/D', color: '#3b82f6', group: 'Volume', desc: 'Accumulation/Dist' },
  { key: 'mfi', label: 'MFI', color: '#8b5cf6', group: 'Volume', desc: 'Money Flow Index' },
  { key: 'obv', label: 'OBV', color: '#f59e0b', group: 'Volume', desc: 'On Balance Volume' },
  { key: 'volumes', label: 'Volumes', color: '#06b6d4', group: 'Volume', desc: 'Trade Volume' },
  // BILL WILLIAMS
  { key: 'ac', label: 'Accelerator', color: '#ef4444', group: 'Bill Williams', desc: 'AC Oscillator' },
  { key: 'alligator', label: 'Alligator', color: '#22c55e', group: 'Bill Williams', desc: 'Jaw/Teeth/Lips' },
  { key: 'ao', label: 'Awesome AO', color: '#3b82f6', group: 'Bill Williams', desc: 'AO Oscillator' },
  { key: 'fractals', label: 'Fractals', color: '#f59e0b', group: 'Bill Williams', desc: 'Peak/Valley' },
  { key: 'gator', label: 'Gator', color: '#14b8a6', group: 'Bill Williams', desc: 'Gator Oscillator' },
  { key: 'bwMFI', label: 'BW MFI', color: '#ec4899', group: 'Bill Williams', desc: 'Mkt Facilitation' },
]

export const OVERLAY_KEYS = ['ma5', 'ma20', 'bollinger', 'envelopes', 'ichimoku', 'sar', 'zigzag', 'alligator', 'fractals']
export const SUBCHART_KEYS = ['adx', 'atr', 'bears', 'bulls', 'cci', 'demarker', 'force', 'macd', 'momentum', 'osma', 'rsi', 'rvi', 'stochastic', 'williamsr', 'ad', 'mfi', 'obv', 'volumes', 'ac', 'ao', 'gator', 'bwMFI', 'stddev']

// ============================================
// Indicator Computation Functions
// ============================================

// Generate a single realistic OHLC candle from previous close
// Uses a structured approach: first determine the candle's direction & body,
// then add realistic wicks based on intra-candle price action simulation
export const generateCandle = (prevClose: number, baseVal: number, sim: {momentum: number; trend: number; phase: number; phaseLen: number; vol: number}, idx: number): CandleData => {
  // ── Phase Management (longer phases for realistic trends) ──
  // 0 = consolidation/ranging, 1 = trending, 2 = breakout/volatile
  sim.phaseLen -= 1
  if (sim.phaseLen <= 0) {
    const r = Math.random()
    if (r < 0.30) {
      // Consolidation — price chops sideways in a range
      sim.phase = 0
      sim.phaseLen = Math.floor(8 + Math.random() * 18) // 8-25 candles of ranging
    } else if (r < 0.82) {
      // Trending — sustained directional move (most common in real markets)
      sim.phase = 1
      sim.phaseLen = Math.floor(12 + Math.random() * 30) // 12-41 candles of trend
      // 65% continue existing trend, 35% reverse
      if (Math.random() < 0.35) sim.trend = (sim.trend === 1 ? -1 : 1) as 1 | -1
    } else {
      // Breakout — volatile expansion after consolidation
      sim.phase = 2
      sim.phaseLen = Math.floor(3 + Math.random() * 6) // 3-8 volatile candles
      sim.trend = Math.random() > 0.5 ? 1 : -1
    }
  }

  // ── Core Price Movement Engine ──
  const open = prevClose

  // Volatility scales with phase — trending markets have moderate vol,
  // consolidation has low vol, breakouts have high vol
  const baseVol = baseVal * 0.0012
  const phaseVol = sim.phase === 0 ? 0.5 : sim.phase === 1 ? 1.0 : 2.2
  const volatility = baseVol * phaseVol

  // Trend drift — the directional force
  let drift: number
  if (sim.phase === 1) {
    // Strong trend: consistent directional bias
    drift = sim.trend * baseVal * 0.0022
    // Small pullback within trend (~20% of candles pull back against trend)
    if (Math.random() < 0.18) {
      drift = -sim.trend * baseVal * 0.0008
    }
  } else if (sim.phase === 2) {
    // Breakout: strong directional move with high vol
    drift = sim.trend * baseVal * 0.0035
  } else {
    // Consolidation: very small random drift, mostly noise
    drift = (Math.random() - 0.5) * baseVal * 0.0004
  }

  // Momentum with HIGH persistence — this is key to realistic consecutive candles
  // Higher persistence (0.90) = trends continue smoothly
  sim.momentum = sim.momentum * 0.90 + drift * 0.35 + (Math.random() - 0.5) * volatility

  // Weak mean reversion — prevents price from drifting too far from base
  const meanRevert = (baseVal - prevClose) * 0.0008

  const rawClose = prevClose + sim.momentum + meanRevert
  const close = Math.round(Math.max(baseVal * 0.85, Math.min(baseVal * 1.15, rawClose)))
  const bodySize = Math.abs(close - open)
  const isBullish = close >= open

  // ── Realistic Wick Generation ──
  // Simulate intra-candle price action to generate wicks
  // In real markets: trending candles have wicks opposite to trend direction
  // Consolidation candles have balanced wicks
  let upperWick: number, lowerWick: number

  if (sim.phase === 1) {
    // Trending phase: wick mainly on the RETREAT side
    if (isBullish) {
      // Bullish trend candle: small upper wick, moderate lower wick (rejection of lows)
      upperWick = bodySize * (0.1 + Math.random() * 0.4) + baseVal * 0.00015
      lowerWick = bodySize * (0.3 + Math.random() * 0.8) + baseVal * 0.0003
    } else {
      // Bearish trend candle: moderate upper wick (rejection of highs), small lower wick
      upperWick = bodySize * (0.3 + Math.random() * 0.8) + baseVal * 0.0003
      lowerWick = bodySize * (0.1 + Math.random() * 0.4) + baseVal * 0.00015
    }
  } else if (sim.phase === 2) {
    // Breakout: longer wicks on both sides (volatility)
    upperWick = bodySize * (0.4 + Math.random() * 1.0) + baseVal * 0.0005
    lowerWick = bodySize * (0.4 + Math.random() * 1.0) + baseVal * 0.0005
  } else {
    // Consolidation: balanced wicks, often long relative to body
    upperWick = bodySize * (0.4 + Math.random() * 1.2) + baseVal * 0.0004
    lowerWick = bodySize * (0.4 + Math.random() * 1.2) + baseVal * 0.0004
  }

  // Special patterns (infrequent, like real markets)
  const patternRoll = Math.random()
  if (patternRoll < 0.04 && bodySize < baseVal * 0.0003) {
    // Doji: very small body, moderate wicks
    upperWick = baseVal * (0.0008 + Math.random() * 0.0015)
    lowerWick = baseVal * (0.0008 + Math.random() * 0.0015)
  } else if (patternRoll < 0.07 && isBullish) {
    // Hammer: long lower wick, small upper wick
    lowerWick = bodySize * (2.0 + Math.random() * 2.5) + baseVal * 0.0005
    upperWick = bodySize * (0.05 + Math.random() * 0.2)
  } else if (patternRoll < 0.10 && !isBullish) {
    // Shooting star: long upper wick, small lower wick
    upperWick = bodySize * (2.0 + Math.random() * 2.5) + baseVal * 0.0005
    lowerWick = bodySize * (0.05 + Math.random() * 0.2)
  }

  const high = Math.max(open, close) + Math.round(upperWick)
  const low = Math.min(open, close) - Math.round(lowerWick)

  // Volume correlates with phase and candle size
  const simBaseVol = sim.vol
  const volMultiplier = sim.phase === 2 ? 2.2 : sim.phase === 1 ? 1.2 : 0.6
  const bodyRatio = bodySize / baseVal
  const volume = Math.round(simBaseVol * volMultiplier * (0.6 + Math.random() * 0.8 + bodyRatio * 15))

  const now = new Date()
  now.setMinutes(now.getMinutes() - (40 - idx))
  const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0')

  return { idx, open, high, low, close, volume, time }
}

// Helper: get data based on timeframe
export const getDataForTimeframe = (data: CandleData[], tf: string) => {
  if (data.length === 0) return data
  switch (tf) {
    case '1H': return data.slice(-10)
    case '1D': return data.slice(-25)
    case '1W': return data.slice(-40)
    case '1M': return data
    case 'ALL': return data
    default: return data
  }
}

// Compute MA line values for candle data
export const computeMA = (data: CandleData[], period: number): (number | null)[] => {
  return data.map((_, i) => {
    if (i < period - 1) return null
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) sum += data[j].close
    return sum / period
  })
}

// Bollinger Bands (20,2)
export const computeBollinger = (data: CandleData[]): { upper: (number | null)[]; middle: (number | null)[]; lower: (number | null)[] } => {
  const ma20 = computeMA(data, 20)
  const upper: (number | null)[] = []
  const lower: (number | null)[] = []
  data.forEach((_, i) => {
    if (ma20[i] === null) { upper.push(null); lower.push(null); return }
    let sumSq = 0
    for (let j = i - 19; j <= i; j++) sumSq += (data[j].close - ma20[i]!) ** 2
    const std = Math.sqrt(sumSq / 20)
    upper.push(ma20[i]! + 2 * std)
    lower.push(ma20[i]! - 2 * std)
  })
  return { upper, middle: ma20, lower }
}

// RSI (14)
export const computeRSI = (data: CandleData[], period = 14): (number | null)[] => {
  const result: (number | null)[] = []
  if (data.length < period + 1) return data.map(() => null)
  let avgGain = 0, avgLoss = 0
  for (let i = 1; i <= period; i++) {
    const change = data[i].close - data[i - 1].close
    if (change > 0) avgGain += change; else avgLoss += Math.abs(change)
  }
  avgGain /= period; avgLoss /= period
  for (let i = 0; i < period; i++) result.push(null)
  result.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss))
  for (let i = period + 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close
    avgGain = (avgGain * (period - 1) + (change > 0 ? change : 0)) / period
    avgLoss = (avgLoss * (period - 1) + (change < 0 ? Math.abs(change) : 0)) / period
    result.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss))
  }
  return result
}

// MACD (12,26,9)
export const computeMACD = (data: CandleData[]): { macd: (number | null)[]; signal: (number | null)[]; histogram: (number | null)[] } => {
  const ema = (arr: number[], p: number): number[] => {
    const k = 2 / (p + 1)
    const res: number[] = [arr[0]]
    for (let i = 1; i < arr.length; i++) res.push(arr[i] * k + res[i - 1] * (1 - k))
    return res
  }
  const closes = data.map(d => d.close)
  const ema12 = ema(closes, 12)
  const ema26 = ema(closes, 26)
  const macdLine = ema12.map((v, i) => i >= 25 ? v - ema26[i] : 0)
  const signalLine = ema(macdLine.slice(25), 9)
  const macd: (number | null)[] = macdLine.map((v, i) => i >= 25 ? v : null)
  const signal: (number | null)[] = macdLine.map((_, i) => i >= 25 ? (signalLine[i - 25] ?? null) : null)
  const histogram: (number | null)[] = macd.map((v, i) => v !== null && signal[i] !== null ? v - signal[i]! : null)
  return { macd, signal, histogram }
}

// ── TREND INDICATORS ──

// ADX (Average Directional Movement Index) - period 14
export const computeADX = (data: CandleData[], period = 14) => {
  if (data.length < period * 2) return { adx: data.map(() => null) as (number | null)[], plusDI: data.map(() => null) as (number | null)[], minusDI: data.map(() => null) as (number | null)[] }
  const plusDM: number[] = [], minusDM: number[] = [], tr: number[] = []
  for (let i = 1; i < data.length; i++) {
    const highDiff = data[i].high - data[i-1].high
    const lowDiff = data[i-1].low - data[i].low
    plusDM.push(highDiff > lowDiff && highDiff > 0 ? highDiff : 0)
    minusDM.push(lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0)
    tr.push(Math.max(data[i].high - data[i].low, Math.abs(data[i].high - data[i-1].close), Math.abs(data[i].low - data[i-1].close)))
  }
  const smooth = (arr: number[], p: number) => {
    const res: number[] = [arr.slice(0, p).reduce((a,b) => a+b, 0)]
    for (let i = p; i < arr.length; i++) res.push(res[i-p] - res[i-p]/p + arr[i])
    return res
  }
  const smoothTR = smooth(tr, period), smoothPDM = smooth(plusDM, period), smoothMDM = smooth(minusDM, period)
  const plusDI = smoothPDM.map((v, i) => smoothTR[i] > 0 ? (v / smoothTR[i]) * 100 : 0)
  const minusDI = smoothMDM.map((v, i) => smoothTR[i] > 0 ? (v / smoothTR[i]) * 100 : 0)
  const dx = plusDI.map((v, i) => v + minusDI[i] > 0 ? Math.abs(v - minusDI[i]) / (v + minusDI[i]) * 100 : 0)
  const adx: (number | null)[] = [null]
  let adxVal = dx.slice(0, period).reduce((a,b) => a+b, 0) / period
  adx.push(adxVal)
  for (let i = period; i < dx.length; i++) {
    adxVal = (adxVal * (period - 1) + dx[i]) / period
    adx.push(adxVal)
  }
  while (adx.length < data.length) adx.unshift(null)
  while (plusDI.length < data.length) plusDI.unshift(0)
  while (minusDI.length < data.length) minusDI.unshift(0)
  return { adx, plusDI: plusDI.map(v => v as number | null), minusDI: minusDI.map(v => v as number | null) }
}

// Envelopes (20, 0.05)
export const computeEnvelopes = (data: CandleData[], period = 20, pct = 0.05) => {
  const ma = computeMA(data, period)
  return {
    upper: ma.map(v => v !== null ? v * (1 + pct) : null),
    middle: ma,
    lower: ma.map(v => v !== null ? v * (1 - pct) : null),
  }
}

// Ichimoku Kinko Hyo (9, 26, 52)
export const computeIchimoku = (data: CandleData[]) => {
  const periodHigh = (d: CandleData[], start: number, len: number) => {
    let h = -Infinity
    for (let i = Math.max(0, start); i <= Math.min(d.length-1, start+len-1); i++) h = Math.max(h, d[i].high)
    return h
  }
  const periodLow = (d: CandleData[], start: number, len: number) => {
    let l = Infinity
    for (let i = Math.max(0, start); i <= Math.min(d.length-1, start+len-1); i++) l = Math.min(l, d[i].low)
    return l
  }
  const tenkan = data.map((_, i) => i < 8 ? null : (periodHigh(data, i-8, 9) + periodLow(data, i-8, 9)) / 2)
  const kijun = data.map((_, i) => i < 25 ? null : (periodHigh(data, i-25, 26) + periodLow(data, i-25, 26)) / 2)
  const senkouA = data.map((_, i) => i < 25 ? null : (tenkan[i] !== null && kijun[i] !== null ? (tenkan[i]! + kijun[i]!) / 2 : null))
  const senkouB = data.map((_, i) => i < 51 ? null : (periodHigh(data, i-51, 52) + periodLow(data, i-51, 52)) / 2)
  const chikou = data.map((_, i) => i + 26 < data.length ? data[i+26].close : null)
  return { tenkan, kijun, senkouA, senkouB, chikou }
}

// Parabolic SAR
export const computeSAR = (data: CandleData[], step = 0.02, max = 0.2) => {
  if (data.length < 2) return data.map(() => null)
  const result: (number | null)[] = [null]
  let isLong = data[1].close > data[0].close
  let af = step
  let ep = isLong ? data[0].high : data[0].low
  let sar = isLong ? data[0].low : data[0].high
  for (let i = 1; i < data.length; i++) {
    sar = sar + af * (ep - sar)
    if (isLong) {
      if (i >= 2) sar = Math.min(sar, data[i-1].low, data[i-2].low)
      if (data[i].low < sar) { isLong = false; sar = ep; ep = data[i].low; af = step }
      else { if (data[i].high > ep) { ep = data[i].high; af = Math.min(af + step, max) } }
    } else {
      if (i >= 2) sar = Math.max(sar, data[i-1].high, data[i-2].high)
      if (data[i].high > sar) { isLong = true; sar = ep; ep = data[i].high; af = step }
      else { if (data[i].low < ep) { ep = data[i].low; af = Math.min(af + step, max) } }
    }
    result.push(sar)
  }
  return result
}

// Standard Deviation
export const computeStdDev = (data: CandleData[], period = 20) => {
  const ma = computeMA(data, period)
  return data.map((_, i) => {
    if (ma[i] === null) return null
    let sumSq = 0
    for (let j = i - period + 1; j <= i; j++) sumSq += (data[j].close - ma[i]!) ** 2
    return Math.sqrt(sumSq / period)
  })
}

// ZigZag (deviation 5%)
export const computeZigZag = (data: CandleData[], deviation = 5) => {
  if (data.length < 3) return data.map(() => null)
  const points: { idx: number; price: number; isHigh: boolean }[] = []
  let lastHigh = { idx: 0, price: data[0].high }, lastLow = { idx: 0, price: data[0].low }
  let isUp = true
  for (let i = 1; i < data.length; i++) {
    const changeFromHigh = ((data[i].high - lastHigh.price) / lastHigh.price) * 100
    const changeFromLow = ((data[i].low - lastLow.price) / lastLow.price) * 100
    if (isUp) {
      if (changeFromHigh > 0) lastHigh = { idx: i, price: data[i].high }
      if (changeFromLow < -deviation) {
        points.push({ idx: lastHigh.idx, price: lastHigh.price, isHigh: true })
        lastLow = { idx: i, price: data[i].low }
        isUp = false
      }
    } else {
      if (changeFromLow < 0) lastLow = { idx: i, price: data[i].low }
      if (changeFromHigh > deviation) {
        points.push({ idx: lastLow.idx, price: lastLow.price, isHigh: false })
        lastHigh = { idx: i, price: data[i].high }
        isUp = true
      }
    }
  }
  const result: (number | null)[] = data.map(() => null)
  points.forEach(p => { result[p.idx] = p.price })
  return result
}

// ── OSCILLATOR INDICATORS ──

// ATR (Average True Range) - period 14
export const computeATR = (data: CandleData[], period = 14) => {
  if (data.length < 2) return data.map(() => null)
  const tr: number[] = [data[0].high - data[0].low]
  for (let i = 1; i < data.length; i++) {
    tr.push(Math.max(data[i].high - data[i].low, Math.abs(data[i].high - data[i-1].close), Math.abs(data[i].low - data[i-1].close)))
  }
  const result: (number | null)[] = []
  for (let i = 0; i < period - 1; i++) result.push(null)
  let atr = tr.slice(0, period).reduce((a,b) => a+b, 0) / period
  result.push(atr)
  for (let i = period; i < tr.length; i++) {
    atr = (atr * (period - 1) + tr[i]) / period
    result.push(atr)
  }
  return result
}

// Bears Power
export const computeBearsPower = (data: CandleData[], period = 13) => {
  const ma = computeMA(data, period)
  return data.map((d, i) => ma[i] !== null ? d.low - ma[i]! : null)
}

// Bulls Power
export const computeBullsPower = (data: CandleData[], period = 13) => {
  const ma = computeMA(data, period)
  return data.map((d, i) => ma[i] !== null ? d.high - ma[i]! : null)
}

// CCI (Commodity Channel Index) - period 14
export const computeCCI = (data: CandleData[], period = 14) => {
  const tp = data.map(d => (d.high + d.low + d.close) / 3)
  const result: (number | null)[] = []
  for (let i = 0; i < period - 1; i++) result.push(null)
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) sum += tp[j]
    const mean = sum / period
    let meanDev = 0
    for (let j = i - period + 1; j <= i; j++) meanDev += Math.abs(tp[j] - mean)
    meanDev /= period
    result.push(meanDev > 0 ? (tp[i] - mean) / (0.015 * meanDev) : 0)
  }
  return result
}

// DeMarker
export const computeDeMarker = (data: CandleData[], period = 14) => {
  if (data.length < 2) return data.map(() => null)
  const dMax: number[] = [0], dMin: number[] = [0]
  for (let i = 1; i < data.length; i++) {
    dMax.push(data[i].high > data[i-1].high ? data[i].high - data[i-1].high : 0)
    dMin.push(data[i].low < data[i-1].low ? data[i-1].low - data[i].low : 0)
  }
  const result: (number | null)[] = []
  for (let i = 0; i < period; i++) result.push(null)
  for (let i = period; i < data.length; i++) {
    const maxSum = dMax.slice(i-period+1, i+1).reduce((a,b) => a+b, 0)
    const minSum = dMin.slice(i-period+1, i+1).reduce((a,b) => a+b, 0)
    result.push(maxSum + minSum > 0 ? maxSum / (maxSum + minSum) : 0.5)
  }
  return result
}

// Force Index
export const computeForceIndex = (data: CandleData[], period = 13) => {
  const fi: number[] = [0]
  for (let i = 1; i < data.length; i++) fi.push((data[i].close - data[i-1].close) * data[i].volume)
  const result: (number | null)[] = []
  for (let i = 0; i < period - 1; i++) result.push(null)
  for (let i = period - 1; i < fi.length; i++) {
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) sum += fi[j]
    result.push(sum / period)
  }
  return result
}

// Momentum
export const computeMomentum = (data: CandleData[], period = 14) => {
  return data.map((_, i) => i < period ? null : data[i].close - data[i-period].close)
}

// OsMA (Moving Average of Oscillator)
export const computeOsMA = (data: CandleData[]) => {
  const macdData = computeMACD(data)
  return macdData.histogram
}

// Relative Vigor Index
export const computeRVI = (data: CandleData[], period = 10) => {
  if (data.length < period + 3) return { rvi: data.map(() => null) as (number | null)[], signal: data.map(() => null) as (number | null)[] }
  const co: number[] = data.map(d => d.close - d.open)
  const hl: number[] = data.map(d => d.high - d.low)
  const rvi: (number | null)[] = data.map(() => null)
  const signal: (number | null)[] = data.map(() => null)
  for (let i = period + 3; i < data.length; i++) {
    let numSum = 0, denSum = 0
    for (let j = i - period + 1; j <= i; j++) {
      if (j >= 1 && j < co.length - 1) {
        numSum += (co[j-1] + 2*co[j] + co[Math.min(j+1, co.length-1)]) / 4
        denSum += (hl[j-1] + 2*hl[j] + hl[Math.min(j+1, hl.length-1)]) / 4
      }
    }
    rvi[i] = denSum > 0 ? numSum / denSum : 0
  }
  for (let i = period + 6; i < data.length; i++) {
    if (rvi[i-3] !== null && rvi[i-2] !== null && rvi[i-1] !== null && rvi[i] !== null) {
      signal[i] = (rvi[i-3]! + 2*rvi[i-2]! + 2*rvi[i-1]! + rvi[i]!) / 6
    }
  }
  return { rvi, signal }
}

// Stochastic Oscillator (5,3,3)
export const computeStochastic = (data: CandleData[], kPeriod = 5, dPeriod = 3) => {
  const k: (number | null)[] = []
  for (let i = 0; i < data.length; i++) {
    if (i < kPeriod - 1) { k.push(null); continue }
    let highest = -Infinity, lowest = Infinity
    for (let j = i - kPeriod + 1; j <= i; j++) { highest = Math.max(highest, data[j].high); lowest = Math.min(lowest, data[j].low) }
    k.push(highest - lowest > 0 ? ((data[i].close - lowest) / (highest - lowest)) * 100 : 50)
  }
  const d: (number | null)[] = []
  for (let i = 0; i < data.length; i++) {
    if (i < kPeriod + dPeriod - 2 || k[i] === null) { d.push(null); continue }
    let sum = 0, count = 0
    for (let j = i - dPeriod + 1; j <= i; j++) { if (k[j] !== null) { sum += k[j]!; count++ } }
    d.push(count > 0 ? sum / count : null)
  }
  return { k, d }
}

// Williams' Percent Range (14)
export const computeWilliamsR = (data: CandleData[], period = 14) => {
  return data.map((_, i) => {
    if (i < period - 1) return null
    let highest = -Infinity, lowest = Infinity
    for (let j = i - period + 1; j <= i; j++) { highest = Math.max(highest, data[j].high); lowest = Math.min(lowest, data[j].low) }
    return highest - lowest > 0 ? ((highest - data[i].close) / (highest - lowest)) * -100 : -50
  })
}

// ── VOLUME INDICATORS ──

// Accumulation/Distribution
export const computeAD = (data: CandleData[]) => {
  const result: number[] = [0]
  for (let i = 1; i < data.length; i++) {
    const clv = data[i].high - data[i].low > 0 ? ((data[i].close - data[i].low) - (data[i].high - data[i].close)) / (data[i].high - data[i].low) : 0
    result.push(result[i-1] + clv * data[i].volume)
  }
  return result
}

// Money Flow Index (14)
export const computeMFI = (data: CandleData[], period = 14) => {
  const tp = data.map(d => (d.high + d.low + d.close) / 3)
  const mf = tp.map((v, i) => v * data[i].volume)
  const result: (number | null)[] = data.map(() => null)
  for (let i = period; i < data.length; i++) {
    let posFlow = 0, negFlow = 0
    for (let j = i - period + 1; j <= i; j++) {
      if (tp[j] > tp[j-1]) posFlow += mf[j]; else negFlow += mf[j]
    }
    result[i] = negFlow > 0 ? 100 - 100 / (1 + posFlow / negFlow) : 100
  }
  return result
}

// On Balance Volume
export const computeOBV = (data: CandleData[]) => {
  const result: number[] = [0]
  for (let i = 1; i < data.length; i++) {
    if (data[i].close > data[i-1].close) result.push(result[i-1] + data[i].volume)
    else if (data[i].close < data[i-1].close) result.push(result[i-1] - data[i].volume)
    else result.push(result[i-1])
  }
  return result
}

// ── BILL WILLIAMS INDICATORS ──

// Awesome Oscillator
export const computeAO = (data: CandleData[]) => {
  const midpoint = data.map(d => (d.high + d.low) / 2)
  const sma5: (number | null)[] = [], sma34: (number | null)[] = []
  for (let i = 0; i < data.length; i++) {
    if (i < 4) { sma5.push(null) } else { let s = 0; for (let j = i-4; j <= i; j++) s += midpoint[j]; sma5.push(s/5) }
    if (i < 33) { sma34.push(null) } else { let s = 0; for (let j = i-33; j <= i; j++) s += midpoint[j]; sma34.push(s/34) }
  }
  return sma5.map((v, i) => v !== null && sma34[i] !== null ? v! - sma34[i]! : null)
}

// Accelerator Oscillator
export const computeAC = (data: CandleData[]) => {
  const ao = computeAO(data)
  const result: (number | null)[] = []
  for (let i = 0; i < data.length; i++) {
    if (i < 4 || ao[i] === null) { result.push(null); continue }
    let sum = 0, count = 0
    for (let j = i - 4; j <= i; j++) { if (ao[j] !== null) { sum += ao[j]!; count++ } }
    result.push(count > 0 ? ao[i]! - sum / count : null)
  }
  return result
}

// Alligator (Jaw 13, Teeth 8, Lips 5)
export const computeAlligator = (data: CandleData[]) => {
  const jaw = computeMA(data, 13).map((v, i) => i < 8 ? null : v)
  const teeth = computeMA(data, 8).map((v, i) => i < 5 ? null : v)
  const lips = computeMA(data, 5).map((v, i) => i < 3 ? null : v)
  return { jaw, teeth, lips }
}

// Fractals
export const computeFractals = (data: CandleData[]) => {
  const up: (boolean | null)[] = data.map(() => null)
  const down: (boolean | null)[] = data.map(() => null)
  for (let i = 2; i < data.length - 2; i++) {
    if (data[i].high > data[i-1].high && data[i].high > data[i-2].high && data[i].high > data[i+1].high && data[i].high > data[i+2].high) up[i] = true
    if (data[i].low < data[i-1].low && data[i].low < data[i-2].low && data[i].low < data[i+1].low && data[i].low < data[i+2].low) down[i] = true
  }
  return { up, down }
}

// Gator Oscillator
export const computeGator = (data: CandleData[]) => {
  const { jaw, teeth, lips } = computeAlligator(data)
  const upper: (number | null)[] = jaw.map((v, i) => v !== null && teeth[i] !== null ? Math.abs(v! - teeth[i]!) : null)
  const lower: (number | null)[] = teeth.map((v, i) => v !== null && lips[i] !== null ? -Math.abs(v! - lips[i]!) : null)
  return { upper, lower }
}

// Market Facilitation Index
export const computeBWIMFI = (data: CandleData[]) => {
  return data.map(d => d.high - d.low > 0 ? (d.high - d.low) / d.volume : 0)
}
