# Task 3: Restructure UI Tabs - Work Record

## Changes Made

### 1. Replaced "investasi" tab (lines ~3496-3977)
- Old content: Investment packages (Starter, Growth, Premium) with stats
- New content: "Pasar Saham Kontrak" header + IHSG Market Overview + Search + Category Filters + Stock Grid with sparklines & Kontrak buttons + Collapsible investment packages section at bottom

### 2. Replaced "market" tab (lines ~3106-3293)
- Old content: IHSG chart + stock grid with sparklines & Kontrak buttons
- New content: MT5-web style signal market page with:
  - Header: "Pasar Saham" / "Sinyal • Live Trading"
  - Live market stats (IHSG, top gainer/loser)
  - Category tabs: Saham, Kripto, Komoditas, Forex
  - Stock signal table with BELI/JUAL indicators, payout rates
  - Click to switch to sinyal tab with stock selected

### 3. New state variables
- `showInvestCollapse` - controls collapsible investment packages section
- `marketSearchQuery` - independent search for market tab

### 4. Gradient ID uniqueness
- `ihsgGradInvest` for investasi tab IHSG chart
- `sparkGradInv-*` for investasi tab sparklines

### 5. Navigation labels unchanged (as per spec)
- Bottom nav: Pasar | Sinyal | Investasi
- Desktop sidebar: Pasar | Sinyal | Investasi
- Side menu: Pasar Saham | Sinyal Pro | Investasi
