# Task 4-a: Extract Tab Components from Dashboard using Zustand Store

## Summary
Successfully extracted 3 tab components (SinyalTab, FinanceTab, SaldoTab) from the Dashboard component in page.tsx, using a Zustand dashboard store for state management.

## Key Files Created
- `/src/lib/dashboard-store.ts` (1178 lines) — Zustand store with all Dashboard state, actions, shared refs
- `/src/components/dashboard/SinyalTab.tsx` (1860 lines) — Trading chart tab
- `/src/components/dashboard/FinanceTab.tsx` (548 lines) — Deposit/Withdraw tab
- `/src/components/dashboard/SaldoTab.tsx` (702 lines) — MT5-style account summary tab

## Key Changes
- page.tsx reduced from 6015 to 2280 lines (62.1% reduction)
- All 70+ useState declarations replaced with useDashboardStore() destructuring
- Fetch functions, handler functions, and trading actions moved to the store
- Shared mutable refs (sinyalChartSimRef, sparklineCache, ihsgChartRef, etc.) enable cross-component state sharing
- Store uses custom persistence for UI preferences only (theme, activeTab, showBalance, etc.)

## Architecture Decisions
- Used shared mutable objects (not React useRef) for cross-component ref sharing between Dashboard and SinyalTab
- SinyalTab owns its own useEffect hooks for chart simulation and position timer
- Dashboard retains shared effects (IHSG chart, sparkline, live price simulation, data fetching)
- Remaining tabs (home, market, portfolio, history, profil) kept inline in page.tsx

## Verification
- `bun run lint` passes with no errors
- Dev server compiles and serves page successfully (HTTP 200)
