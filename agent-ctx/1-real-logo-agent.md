# Task 1 - Real Logo Agent

## Task
Replace SVG path-based logo approximations with real company logos from CDN services.

## What was done
- Completely rewrote `getInstrumentLogo` function in `src/app/page.tsx`
- Removed ~1100 lines of SVG path-based logo code (renderBrandIcon, renderShape, SVG defs/return)
- Replaced with ~510 lines of real logo URL mappings and image-based rendering

## Implementation details

### Stock logos
- 100+ stock tickers mapped to `https://cdn.brandfetch.io/{domain}?size=80`
- Covers: Tech, Finance, Healthcare, Consumer, Real Estate, Energy, Industrial, Media, Telecom, Retail, Transportation, Cybersecurity, and International stocks

### Crypto logos
- 46 crypto tickers mapped to `https://assets.coincap.io/assets/icons/{symbol}@2x.png`
- All lowercase symbols as required by CoinCap API

### Forex logos
- 17 currencies mapped to country codes
- Renders two country flag images side by side from `https://flagcdn.com/w40/{cc}.png`
- Currency pair parsing: EURUSD → eu flag + us flag

### Commodity logos
- 22 commodities mapped to emoji + chemical symbol (Au, Ag, Cu, etc.)
- Premium styled background with gradient and highlight overlay

### Fallback mechanism
- All `<img>` tags have `onError` handler that hides the image
- Colored background div with ticker text visible as placeholder/fallback
- `specialColors` map preserved for all 250 instruments

## Verification
- `bun run lint` passes with no errors
- Dev server running without errors
- Function signature unchanged: `getInstrumentLogo(code: string, size: number = 40)`
- All 10 call sites still work correctly
