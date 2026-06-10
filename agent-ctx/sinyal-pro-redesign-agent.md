# Sinyal Pro Trading Terminal Redesign

## Task ID: sinyal-pro-redesign
## Agent: main
## Date: 2024-03-04

## Summary
Redesigned the Sinyal Pro trading terminal in the ZEVORIX stock trading app to have a full-screen chart with minimal floating overlays, replacing the previous layout with a bulky bottom panel.

## Changes Made

### 1. Container Layout (Line ~3947)
- Changed from `minHeight: 'calc(100vh - 140px)'` to `height: 'calc(100vh - 140px)', overflow: 'hidden'`
- This makes the tab fill the screen exactly, preventing overflow

### 2. Stock Selector (Lines ~3949-4006)
- **Before**: Bulky 2-column grid with stock cards showing name, price, change, payout
- **After**: Thin horizontal scrollable bar with compact stock chips showing code, change%, payout%
- Category tabs moved inline with the header
- Balance chip moved to the same row
- Saved ~40px of vertical space

### 3. Chart Area (Line ~4009-4714)
- **Before**: Chart with `minHeight: '400px'` and rounded border
- **After**: Chart with `flex-1` fills remaining screen space, no border
- Added `pt-16 pb-40` padding to SVG wrapper to account for header overlay and bottom trading overlay
- Added fallback placeholder when no stock selected

### 4. Day/Night Toggle
- Added to inline chart header (line ~4046-4052)
- Added to fullscreen chart header (line ~6581-6587)
- Uses existing `theme` state and `toggleTheme` function
- Shows Sun icon (amber) in dark mode, Moon icon (blue) in light mode

### 5. Floating Trading Overlay (Lines ~4518-4651)
- Replaced the bulky bottom panel with a compact floating overlay at the bottom of the chart
- **Equity chip**: Shows live balance, P&L, available balance in a thin bar
- **Amount/leverage toolbar**: Compact inline row with amount input, preset buttons, leverage buttons, auto-close toggle
- **Auto-close duration pills**: Shown when auto-close is enabled
- **Fee breakdown**: Shown when amount is entered
- **BELI/JUAL buttons**: Floating at the very bottom with safe-area-inset padding

### 6. Position Management Floating Panel (Lines ~4653-4713)
- Compact floating panel in the top-right corner of the chart
- Shows active positions with direction, stock code, leverage, P&L, timer, and close button
- Shows closed positions summary with count and total P&L

### 7. Old Bottom Panel Removal
- Removed the entire old bottom panel section (previously ~410 lines)
- This included: Investment Amount, Leverage Selector, Fee Breakdown, Auto-Close, BELI/JUAL, Equity Summary, Position Management

### 8. Candle Rendering Improvements
- **Candle spacing**: 14 → 18 pixels (both inline and fullscreen)
- **Candle body width**: 8 → 11 pixels (both inline and fullscreen)
- **Wick width**: 0.8 → 1.0 pixels (both inline and fullscreen)
- **Inline chart SVG height**: chartH 180→300, volH 40→60
- **Fullscreen chart SVG height**: chartH 400→500, volH 80→100

### 9. Placeholder for No Stock Selected (Lines ~4715-4724)
- Added a centered placeholder with BarChart3 icon and instructional text
- Uses chart theme variables for consistent styling

## Files Modified
- `/home/z/my-project/src/app/page.tsx` - Main application file

## No Issues Encountered
- All existing state variables and functions preserved
- Lint passes cleanly
- Dev server runs without errors
