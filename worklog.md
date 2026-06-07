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
