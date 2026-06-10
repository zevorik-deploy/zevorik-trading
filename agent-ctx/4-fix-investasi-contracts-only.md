# Task 4: Fix Investasi Tab - Contracts Only

## Task Description
Fix the Investasi tab so it is for **CONTRACTS ONLY** — users cannot trade from Investasi. They must go to Pasar Saham to trade. Replace the stock grid with contract product tiers and show active contracts.

## Work Log

### 1. Updated Invest API (`/api/invest/route.ts`)
- Replaced 3 old investment products (Starter 1K, Growth 6K, Premium 200K) with 5 new contract tiers
- New tiers: Starter (100K, 0.5%/day, 30d, ROI 15%), Silver (500K, 0.8%/day, 60d, ROI 48%), Gold (1M, 1.0%/day, 90d, ROI 90%), Platinum (5M, 1.5%/day, 120d, ROI 180%), Diamond (10M, 2.0%/day, 180d, ROI 360%)
- Updated auto-seed count check from 3 to 5 products
- Removed package prerequisites (growth deposit requirement, premium starter requirement) since all tiers are standalone
- Verified API returns all 5 products correctly via curl test

### 2. Replaced Investasi Tab Content (`page.tsx` lines ~3665-3890)
**Removed:**
- Search bar (redundant with Pasar Saham)
- Category filter pills (redundant with Pasar Saham)
- Stock list grid with sparkline charts, volume bars, star/favorite buttons
- Top Gainer/Loser/Most Active quick stats from IHSG section

**Kept:**
- IHSG chart header (with updated title "Kontrak Investasi" and "PROFIT/HARI" badge)

**Added:**
- **Active Contracts Section**: Shows user's active stock contracts (from `userContracts`) and investment contracts (from `userInvestments`) with progress bars and claim buttons, scrollable (max-h-64), tier-colored icons
- **Contract Products Section**: 5 tier cards (Starter/Silver/Gold/Platinum/Diamond) each with:
  - Gradient header bar with tier icon (🥉🥈🥇💎👑), name, daily rate, duration, ROI percentage
  - Body with 3-column stats: Modal Min, Profit/Hari, Total Kembali
  - Profit breakdown box: Rate Harian, Durasi, Total Profit
  - Balance warning if insufficient funds
  - "Beli Kontrak" button that maps to `investProducts` via category and opens the existing invest modal
- **Info Box**: "Tentang Kontrak Investasi" with Clock/Shield/TrendingUp icons explaining profit timing, capital safety, tier scaling
- **CTA Card**: "Ingin Trading Saham?" directing users to Pasar Saham tab

### 3. Updated Invest Modal Category Display
- Changed category label from "Aset Saham • Paket Starter/Growth/Premium" to "Kontrak Investasi • Starter/Silver/Gold/Platinum/Diamond"
- Updated `investCategory` state type from `'starter' | 'growth' | 'premium'` to `'starter' | 'silver' | 'gold' | 'platinum' | 'diamond'`
- Updated portfolio tab investment display to show all 5 tier categories

### 4. Verification
- `bun run db:push` completed successfully (auto-seed updated products)
- `bun run lint` passed with 0 errors
- Dev server running correctly
- API `/api/invest` verified returning 5 contract tier products

## Stage Summary
- Investasi tab is now **CONTRACTS ONLY** — no trading functionality, no stock cards, no search/filter
- 5 contract tiers: Starter → Silver → Gold → Platinum → Diamond (100K to 10M, 0.5%-2.0%/day, 15%-360% ROI)
- Users are directed to Pasar Saham for stock trading and stock-specific contracts
- Existing contract and investment claim flows remain functional
- All styling uses ZEVORIX CSS variables (var(--zv-*)) for theme consistency
