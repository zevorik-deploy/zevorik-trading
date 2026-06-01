# Task 3: Replace Buy/Sell Trading with Contract-Based Investment System

## Agent: Main Agent
## Status: COMPLETED
## Date: 2025-01-01

## Summary
Successfully replaced the buy/sell (Beli/Jual) trading feature in Pasar Saham with a contract-based investment system. All targeted edits were made to `/home/z/my-project/src/app/page.tsx` without overwriting the entire file.

## Changes Made

### 1. Added StockContract Interface (after line 130)
- Added `StockContract` interface with all required fields for contract management

### 2. Replaced Trade State Variables (lines 610-614)
- Replaced: `tradeModal`, `tradeShares`, `tradePrice`, `tradeOrderType`, `tradeLoading`
- With: `contractModal`, `contractAmount`, `contractDuration`, `contractLoading`, `userContracts`

### 3. Added Contract-Related State (after line 663)
- Added `contractClaimLoadingId` state for tracking claim button loading state

### 4. Added Helper Functions (after calcSinyalProfit)
- `getStockBaseRate(code)`: Returns base daily profit rate per stock (5-12%)
- `calcContractProfit(stock, duration, amount)`: Calculates daily rate, daily profit, total profit, and total return based on stock rate, duration multiplier, and amount multiplier

### 5. Added fetchContracts Function (after fetchTasks)
- Fetches user's stock contracts from `/api/contracts?userId=xxx`
- Added to initial fetch useEffect

### 6. Replaced openTrade with openContract
- Simplified function that opens contract modal instead of buy/sell modal

### 7. Replaced handleTrade with handleContract + handleContractClaim
- `handleContract`: Creates a new contract via POST /api/contracts
- `handleContractClaim`: Claims daily profit via PUT /api/contracts

### 8. Updated Market Tab Stock Cards
- Replaced Beli/Jual buttons with single "Kontrak" button with Package icon
- Replaced buy/sell price display with contract rate info (Rate, Duration range, Volume)
- Removed unused `buyPrice` and `sellPrice` local variables

### 9. Updated Stock Detail Modal
- Replaced Live Buy/Sell Prices section with Contract Profit Preview
- Replaced Live Buy/Sell Price Charts with contract info (rate, min/max duration, example profit)
- Replaced Buy/Sell Buttons with single "Beli Kontrak" button

### 10. Replaced Trade Modal with Contract Modal
- Duration selection grid (30, 60, 90, 120, 180, 365 days)
- Amount input with quick amount buttons
- Profit summary with daily rate, daily profit, total profit, total return
- Balance check warning
- Submit button with loading state

### 11. Updated Portfolio Section
- Replaced Beli/Jual buttons with "Kontrak" button
- Added "Kontrak Saham Aktif" section showing active contracts with:
  - Contract info (stock code, duration, daily rate)
  - Progress bar (days elapsed / duration)
  - Claim status and claim button
  - Total claimed vs total profit display

### 12. Updated Live Chart Effect Conditions
- Changed `tradeModal` references to `contractModal` in effect condition and dependency array

## Verification
- Lint check passed with no errors
- All `openTrade`, `tradeModal`, `tradeShares`, `tradePrice`, `tradeOrderType`, `tradeLoading` references removed
- API endpoint at `/api/contracts` verified (GET, POST, PUT)
- Prisma schema `StockContract` model verified
- Existing features (Login, Sinyal Pro, Investasi, Finance, etc.) remain untouched

## Files Modified
- `/home/z/my-project/src/app/page.tsx` - Targeted edits only, not overwritten
