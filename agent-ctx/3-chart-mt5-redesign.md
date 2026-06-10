# Task 3 - Chart MT5 Redesign Agent

## Task: Redesign ZEVORIX Sinyal Pro Chart to Match MT5 Style

## Work Summary:
Redesigned the Sinyal Pro candlestick chart to match MT5 mobile's professional trading chart appearance. The chart now uses a pure black background, subtle grid lines, MT5-style colored price tags, and includes a SELL/BUY spread indicator in the header.

## Key Changes:

### 1. CSS Variables (globals.css)
- Both light and dark mode chart variables now force a dark chart background
- Dark mode: --zv-chart-bg: #000000, --zv-chart-bg2: #0a0e14, --zv-chart-grid: #1e293b, --zv-chart-text: #ffffff
- Light mode: Same dark values (chart is always dark like MT5 regardless of app theme)
- Chart overlay: rgba(0,0,0,0.95), panel: rgba(10,14,20,0.8)

### 2. Chart Container
- Hardcoded pure black background gradient: #000000 → #0a0e14
- Border: #1e293b
- Box shadow: always dark style (removed theme-conditional)

### 3. SVG Chart Elements
- Background rect: fill="#000000" (was "transparent")
- Grid lines: stroke="#1e293b" strokeWidth="0.3" strokeDasharray="1,4" opacity="0.7" (thinner, more subtle)
- Price labels: fill="#ffffff" (white)
- Time labels: fontSize="6" fill="#ffffff" fontWeight="600"
- Volume separator: Same subtle grid style

### 4. Candlestick Styling
- Wick strokeWidth: "0.8" (was "1")
- Body: fill={fillColor} stroke={fillColor} strokeWidth="0.3" rx="0.3" (was separate strokeColor, "0.5", "0.5")

### 5. Volume Bars
- Fill: rgba(34,197,94,0.12) / rgba(239,83,80,0.12) (more subtle, was 0.15-0.2)
- rx: "0.3" (was "0.5")

### 6. Current Price Tag (MT5 Style)
- Dashed line: strokeDasharray="3,3" (was "2,2")
- Pulsing dot: r="2"→"3.5" with 1.5s duration (was 2.5→4, 1.2s)
- Price tag rect: height="14" (was "12"), y offset -7, fontSize="6.5" (was "6")

### 7. Chart Header
- MT5-style with instrument name + timeframe + SELL/BUY spread
- Stock code in white, timeframe label in gray
- JUAL (red) / spread (gray) / BELI (green) boxes with spread value
- Header background: rgba(0,0,0,0.92)

### 8. Crosshair OHLC Tooltip
- Finds candle under cursor by computing candleIdx from SVG coordinates
- Shows O/H/L/C values at top-left of chart
- Close price colored green (bull) or red (bear)
- Background: rgba(0,0,0,0.85) with #1e293b border

### 9. MA Legend
- fill="rgba(0,0,0,0.85)" stroke="#1e293b"

## Files Modified:
- `/home/z/my-project/src/app/globals.css` - Chart CSS variables updated
- `/home/z/my-project/src/app/page.tsx` - Chart SVG rendering, header, crosshair
- `/home/z/my-project/worklog.md` - Updated with task work log

## Verification:
- Lint passes with no errors
- Dev server compiles successfully
