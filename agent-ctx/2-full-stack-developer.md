# Task 2: Sinyal Tab MT5-Style Redesign

## Summary
Redesigned the entire Sinyal tab to look like a professional MT5 trading terminal with larger text, better spacing, and improved visual hierarchy.

## Key Changes
1. **Category tabs**: TradingView-style rounded-full pills with h-8, px-4, text-[11px]
2. **Stock pills**: h-8, rounded-full, text-[11px], payout text-[9px]
3. **Chart container**: rounded-2xl, minHeight 420px, deeper shadow
4. **Chart header**: Larger LIVE badge, stock code text-[14px], price text-[16px], payout text-[9px]
5. **Timeframe selector**: h-7 buttons, text-[9px], repositioned to top-12
6. **Timer display**: 44x44 SVG, text-[11px] time, text-[9px] WIB
7. **Chart SVG**: chartH 260, volH 50, all font sizes increased, grid style improved
8. **Active positions overlay**: Moved to top-right, compact with blur and spring animation
9. **Bottom panel**: space-y-3, px-2, all components enlarged
10. **BELI/JUAL buttons**: h-16, text-[15px], w-5/h-5 icons
11. **Equity summary**: text-[22px] balance, rounded-2xl
12. **Position cards**: All text 2px bigger, better spacing

## No Logic Changes
All changes are visual/styling only - no state management, API calls, or business logic was modified.
