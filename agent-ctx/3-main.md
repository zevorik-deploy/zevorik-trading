# Task 3: Expand Stock Seed Data & Improve Quote Tab UI

## Summary
Massively expanded stock seed data from ~80 to ~230+ instruments and improved the Quote tab UI with market indices, region sub-filters, pagination, and enhanced search.

## Changes Made

### Stock Seed Data (route.ts)
- Added ~150 new instruments across 6 categories
- US Stocks: +35 (HD, BLK, C, AXP, WFC, MS, SCHW, BX, CB, TGT, LOW, TJX, etc.)
- European Stocks: +22 (SAP, ASML, NESN, AZN, SHEL, BP, RIO, NOVO, LVMH, etc.)
- Asian Stocks: +22 (BABA, JD, PDD, TCEHY, SONY, TM, SSNLF, HDB, INFY, etc.)
- IDX Indonesian: +15 (BBRI, BBCA, BMRI, TLKM, GOTO, etc.)
- Crypto: +25 (APT, ARB, OP, SUI, PEPE, WLD, BONK, WIF, etc.)
- Forex: +17 (USDSGD, USDTRY, USDMXN, CADJPY, GBPNZD, etc.)
- Commodities: +12 (CACAO, RUBBER, IRON, ALUMINIUM, NICKEL, etc.)

### Quote Tab UI (page.tsx)
- Added market indices overview (DOW, S&P500, NASDAQ, NIKKEI, FTSE, DAX, IDX, SHCOMP, HANG)
- Added region sub-filter for Saham category (US/European/Asian/IDX)
- Added getMarketRegion() helper function
- Improved search to include sector and description
- Added pagination (50 per page) with "Muat Lagi" button
- Added region badge on stock cards
- Reset page to 1 on filter changes

### Database
- Reset dev.db to trigger re-seeding with new data
- Lint passes with no errors
