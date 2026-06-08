---
Task ID: 1
Agent: Main Agent
Task: Redesign Trading tab to match MT5 mobile style - cleaner, more professional

Work Log:
- Removed emojis from category tabs (🔥, 📈, ₿, 🛢, 💱) - now text only (Popular, Saham, Kripto, Komoditas, Forex)
- Redesigned category tabs to MT5-style segmented control with blue highlight
- Redesigned stock pills to be cleaner with ▲/▼ direction indicators instead of spread
- Redesigned SELL/BUY buttons to be taller (56px), bolder (17px text, 0.2em tracking), with price below
- SELL button uses MT5-style red gradient, BUY uses MT5-style green gradient
- Button colors now follow chart P/L when positions are open (brighter when profit, dimmer when loss)
- Redesigned LOT selector to be more compact with cleaner styling
- Lot quick buttons use simpler blue highlight style
- Leverage buttons use amber highlight
- Added lot value summary text inside the lot selector
- Improved chart rendering: larger chart area (200px price, 35px volume), thinner grid lines, cleaner candlesticks
- Candlesticks now use filled style (both bull and bear are filled, matching MT5)
- Volume bars use semi-transparent colors instead of opaque
- Chart header simplified: just live dot + code + name + price + change
- Timeframe selector uses simple blue highlight instead of glow effects
- Active trades overlay simplified: smaller, cleaner, BUY/SELL badge instead of gradient circles
- Terminal bar uses consistent theme variables instead of hardcoded dark colors
- Positions table uses theme variables instead of hardcoded dark colors
- Zoom controls simplified to smaller, theme-consistent style
- Result flash simplified
- No-stock-selected view uses consistent theme styling

Stage Summary:
- Trading tab now has a much cleaner, more MT5-like appearance
- All emojis removed from tabs
- SELL (red) / BUY (green) buttons are prominent and MT5-style
- Chart is cleaner with better proportions
- Terminal bar and positions table use consistent theme styling
- No lint errors
- Server running correctly on port 3000
