---
Task ID: 1
Agent: Main
Task: Add AI Signal Pro separate dashboard with premium lock to Sinyal tab

Work Log:
- Added `sinyalView` state ('trading' | 'ai-pro') and `aiProUnlocked` state
- Added Trading/AI Pro toggle at top of Sinyal tab with lock icon on AI Pro button
- Separated Sinyal Pro into two views: Trading (chart + buy/sell) and AI Pro (premium dashboard)
- Removed inline AI Signal section from trading view
- Created AI Pro dashboard with: stock selector, radar scanner header, confidence ring, AI metrics, AI Deep Analysis, Signal Details, News Impact, Signal History
- Added premium lock overlay with blur effect, Rp 3.700.000 pricing, "Aktifkan AI Signal Pro" button
- When unlocked, shows "ACTIVE" badge and full interactive dashboard
- Verified with Agent Browser - all features working correctly

Stage Summary:
- Sinyal tab now has two views: Trading and AI Pro
- Trading view: chart + buy/sell (basic, free)
- AI Pro view: premium AI analysis dashboard (Rp 3.7jt, locked by default)
- Premium lock overlay with blur preview, pricing, and activate button
- All existing features preserved (chart, BELI/JUAL, positions, etc.)

## 2026-03-05: ZEVORIX Trading Platform Redesign

### Task 1: Remove AI Signal Pro Completely
- Removed 3 state variables: `aiSignalExpanded`, `sinyalView`, `aiProUnlocked`
- Removed the Trading/AI Pro view toggle from Sinyal top bar
- Removed `sinyalView === 'trading'` conditions (content now shown unconditionally)
- Removed entire AI Signal Pro Dashboard block (~424 lines of AI Pro UI code)
- Sinyal tab now only shows the clean trading view

### Task 2: Redesign Sinyal Tab - Pure MT5 Style
- Redesigned top bar to be compact and professional:
  - Row 1: Balance display (right-aligned)
  - Row 2: Category tabs (Popular, Kripto, Komoditas, Forex)
  - Row 3: Stock pills (horizontal scrollable)
- Removed unnecessary toggle clutter
- Clean, dark, professional look optimized for mobile

### Task 3: Rename "Pasar Saham" to "Pasar Global"
- Updated market tab header
- Updated bottom navigation label
- Updated side menu label

### Task 3: Fix Logos in Market Tab
- Added `getRealLogo` function with comprehensive logo mappings:
  - Stock logos via Google Favicon API (150+ stock domain mappings)
  - Crypto logos via CoinCap assets API
  - Forex flags via flagcdn.com
  - Commodity emoji icons
  - Fallback: first 2 letters with blue styling
- Replaced `getInstrumentLogo` with `getRealLogo` in:
  - Market tab instrument cards
  - Investasi tab stock cards
  - Beranda tab Top Gainers/Losers sections

### Task 3: Improve Market Tab
- Added more data to each market card:
  - Volume info
  - High/Low prices for the day
  - Market cap (for stocks, on desktop)
  - Sparkline now visible on all screens (not just desktop)
- Removed emojis from category filters (Kripto, Forex, Komoditas, Saham)
- Two-row card layout: Row 1 = Logo+Name+Price+Star, Row 2 = Sparkline+Stats

### Verification
- `bun run lint` passes (no errors)
- Dev server running correctly
- No compile errors from changes

---
Task ID: 2
Agent: Main (Verification & Polish)
Task: Verify browser rendering, fix remaining "Pasar Saham" references, confirm all tabs work

Work Log:
- Used Agent Browser to verify all 5 tabs work correctly on mobile viewport (390x844)
- Verified Pasar Global tab: real logos loading (Google Favicon API, CoinCap CDN, flagcdn), comprehensive cards with Volume/High/Low/MarketCap
- Verified Sinyal tab: pure MT5-style with chart + BELI/JUAL, no AI Pro remnants, clean layout
- Verified Investasi tab: contracts, search, categories working
- Verified Profil tab: all menu items present
- Fixed remaining "Pasar Saham" → "Pasar Global" in Beranda quick access button (line 3120: desc: 'Saham' → 'Global')
- No browser errors or console warnings
- Desktop sidebar also shows correct "Pasar" label
- `bun run lint` passes

Stage Summary:
- All 5 tabs verified working on mobile and desktop
- AI Signal Pro completely removed - no remnants found
- Pasar Global properly renamed everywhere (tab header, bottom nav, sidebar, quick access)
- Real logos loading correctly: stocks via Google Favicon, crypto via CoinCap, forex via FlagCDN
- Market cards show comprehensive data: price, change%, high, low, volume, market cap
