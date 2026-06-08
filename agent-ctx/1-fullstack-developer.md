# Task 1 - Full-stack Developer Work Record

## Task: Remove 10% fee system, rename JUAL/BELI to SELL/BUY, dynamic button colors

## Changes Made

### 1. Removed 10% Fee System
- **openSinyalPosition** (was line ~1828-1854): Removed `fee`, `workingCapital` variables. Balance no longer deducted on open. Position object no longer includes `fee` and `workingCapital`.
- **closeSinyalPosition** (was line ~1861-1901): Uses `pos.amount` directly. Removed `feeLost`. `tradingPLOffsetRef.current += cappedPL` (not `cappedPL - feeLost`).
- **getPositionLivePL** (was line ~1909-1925): Uses `pos.amount * (lev / 100)`. Cap at `-pos.amount`.
- **liveModal** (was line ~1951-1957): `totalMargin = activePos.reduce((s, p) => s + p.amount, 0)`.
- **fetchPortfolio** (was line ~2185): Removed `activeFeeDeductions`. `adjustedBalance = d.summary.cashBalance + tradingPLOffsetRef.current`.
- **Type definition** (line 869): `fee` and `workingCapital` now optional.
- All `workingCapital` references replaced with `pos.amount` or `ap.amount`.
- All `usedMargin` calculations use `p.amount` instead of `p.workingCapital || Math.round(p.amount * 0.9)`.
- Home page: Removed `totalFee` calculation and fee display.
- Saldo position card: `modalLive = ap.amount + livePL`.
- Closed position display: Removed `feeAmt`, `netAmt`.
- Trade history profil tab: Removed `feeLost`.

### 2. Fee Breakdown → Position Breakdown
- Removed "Fee 10%", "Modal Kerja" rows.
- Now shows: "Lot Amount" + "Leverage" = "Effective Position".
- P/L per 1% uses full amount (no 0.90 factor).

### 3. Confirm Trade Modal Updated
- Removed "Fee 10% (Potong Langsung)" and "Modal Kerja" rows.
- "Effective Position" uses `sinyalAmountFromLots * (sinyalLeverage / 100)` directly.
- Replaced red fee warning with blue info box.
- "CONFIRM BUY/SELL" instead of "KONFIRMASI BELI/JUAL".

### 4. JUAL → SELL, BELI → BUY Throughout
- All buttons, badges, labels, toasts, modals updated.

### 5. Dynamic BUY/SELL Button Colors
- Uses last candle from `sinyalCandles` to determine chart direction.
- BUY glows vibrant green when price is up, dims when price is down.
- SELL glows vibrant red when price is down, dims when price is up.
- Pulse glow animation only on the active direction.

## Verification
- `bun run lint` passes
- Dev server running, all APIs 200
