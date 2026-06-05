# Task 2: Redesign Sinyal Pro to Look and Work Exactly Like Stockity

## Agent: fullstack-developer

## Summary
Completely redesigned the Sinyal Pro tab JSX to match Stockity binary options trading platform. Replaced lines 3125-3717 in `/home/z/my-project/src/app/page.tsx`.

## Changes Made

### Layout Restructure
- Top bar: Asset pills + live price + balance (dark background #0d1117)
- Full-screen dark chart area (65-70% of viewport)
- Compact trading controls at bottom (4-row layout)

### Chart Enhancements
- **Dark chart background**: #0d1117 regardless of app theme
- **Real-time price LINE overlay**: Polyline connecting close prices + live current price with SVG gradient
- **Glowing dot at current price**: Dual-circle (outer pulsing + inner white) with glow filter
- **Active trade labels on chart**: Direction arrow + countdown + amount at right edge
- **Flash overlay**: Green/red full-chart flash on trade result (0.8s)
- **Result popup**: Centered on chart instead of corner toast
- All grid lines, text, crosshair updated for dark theme

### Compact Trading Controls
- Row 1: Amount input with Rp prefix + −/+ buttons
- Row 2: Quick amount buttons (100K, 200K, 500K, 1M)
- Row 3: Duration pills (10s, 20s, 30s, 60s)
- Row 4: NAIK/TURUN buttons with payout %
- Removed Profit Preview section

### Active Positions
- Thin scrollable bar with mini cards instead of counter badge

### Preserved
- All interactive chart features (drag, zoom, crosshair, auto-scroll)
- All refs (chartContainerRef, chartDragRef, chartUserScrolledRef)
- No state variables or functions modified

## Lint: Passes clean
## Dev Server: Compiles successfully
