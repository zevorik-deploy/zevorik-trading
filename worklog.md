---
Task ID: 1
Agent: Main
Task: Restore original Global Saham features and fix broken TrendEdge rewrite

Work Log:
- Found original page.tsx in git commit d126c6d (5619 lines)
- Restored original page.tsx from git (was replaced with 1130-line TrendEdge rewrite)
- Verified all features restored: Beranda, Pasar Saham, Sinyal Pro, Investasi, Finance, Portfolio, Riwayat, Undang, Bonus, Leaderboard, Profile
- Verified Sinyal Pro prediction feature present with: direction selector, amount input (min 100K), duration selector, AUTO mode, profit calculator (max 40%), sparkline charts
- Verified Premium tab removed from Investasi (only 'potential' and 'dividen' categories)
- Verified Trading uses free amount in Rupiah (not lot-based, min 100K)
- ESLint passes clean
- Dev server running, GET / 200 OK

Stage Summary:
- All original Global Saham features restored successfully
- Sinyal Pro prediction feature intact and working
- No Premium tab in Investasi
- Trading uses free amount (Rupiah) instead of lots
