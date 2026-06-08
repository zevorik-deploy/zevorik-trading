# Task 3: MT5 Layout Agent

## Task
Completely rewrite the Sinyal (Trading) tab layout in `/home/z/my-project/src/app/page.tsx` to match MT5 EXACTLY.

## What Was Done
- Replaced the entire sinyal tab block (lines 4072-4839, 768 lines) with a new MT5-exact layout (741 lines)
- Key change: Outer container uses `height: calc(100vh - 140px)` with `overflow-hidden` instead of `minHeight`, enabling flex-1 chart to fill ~65-70% of viewport
- Chart background hardcoded to `#0a0e17` (always dark, like real MT5)
- All SVG text colors use `rgba()` instead of CSS variables for dark background compatibility
- All sections made more compact to maximize chart space
- No state variables, callbacks, trading logic, or SVG rendering math was changed

## Files Modified
- `/home/z/my-project/src/app/page.tsx` — Lines 4072-4811 (sinyal tab block)
- `/home/z/my-project/worklog.md` — Appended task 3 work record

## Verification
- Lint passes (no errors, just BABEL size warning)
- Dev server running correctly, no compile errors
- All interaction handlers preserved (mouse, touch, wheel, pinch)
- All SVG chart rendering preserved (viewBox, yScale, candlesticks, MA lines, etc.)
