# Task 6: Add Dark/Light Theme Support to Trading Tab & Increase Font Sizes

## Agent: Main Agent
## Status: COMPLETED

## Summary
Added dark/light theme support to the Trading tab that follows the web's existing `theme` state. Added a theme toggle button (Sun/Moon) in the trading tab header. Replaced all hardcoded dark colors with `trTheme` references that switch between dark/light. Increased font sizes throughout the trading tab for better readability.

## Changes Made

### trTheme Object
- Added `isTrDark` boolean and `trTheme` object with 20+ color tokens at the top of the trading tab rendering
- Colors switch between dark (#131722, #0a0e17, etc.) and light (#f0f2f5, #ffffff, etc.) based on `theme` state

### Theme Toggle Button
- Added Sun/Moon icon button in header (right section, before timeframe dropdown)
- Calls existing `toggleTheme()` function
- Uses already-imported `Sun` and `Moon` icons from lucide-react

### Color Replacements (28+ instances)
- Header, Market Selector, Trading Bar, Chart Toolbar, Chart Area, Bottom Trade Status, Terminal Bar, Positions Table
- SVG chart: background, grid lines, grid text, crosshair, candle fill
- All dropdown menus (timeframe, leverage, indicators)

### Font Size Increases
- All tiny fonts (4-6px) increased to 7-10px
- Button heights increased (h-5→h-6, h-6→h-7)
- Icon sizes increased where appropriate
- SVG text sizes increased (grid labels, price badge, position labels, RSI/MACD labels)

## Files Modified
- `src/app/page.tsx` - Trading tab section (lines ~4140-5175)
- `worklog.md` - Added work record

## Verification
- `bun run lint` passes with no errors
- Dev server compiles successfully
- No changes to other tabs or trading logic
