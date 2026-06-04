---
Task ID: 1
Agent: Main Agent
Task: Implement ZEVORIX platform updates - starting balance 0, 3 investment packages, daily bonus 500, task rewards 1K-100K

Work Log:
- Read current project state: page.tsx (7715 lines), admin page, all API routes
- Updated register route: balance starts at 0 for real accounts (removed 25K welcome bonus)
- Updated investment products: replaced 17 products with 3 packages (Starter 1K, Growth 6K, Premium 200K)
- Added package prerequisites: Growth requires min deposit 1J, Premium requires buying Starter first
- Updated daily check-in: fixed 500 bonus per check (was random 1K-10K)
- Updated task rewards: 1K-100K range (first_invest=1K, top_up=5K, verify=10K, check_7=10K, invite_3=50K, invest_3=100K)
- Updated bonus system daily check-in to 500 base
- Updated frontend: investment section with new 3-package design, category tabs (Starter/Growth/Premium)
- Updated category display text in portfolio and modal sections
- Updated registration info text for real accounts (saldo awal Rp 0)
- Updated invest header text and stats
- Reset database with new schema
- Verified all features with Agent Browser

Stage Summary:
- Real accounts now start with Rp 0 balance (no welcome bonus)
- 3 investment packages: Starter 1K, Growth 6K (min deposit 1J), Premium 200K (requires Starter)
- Daily check-in bonus: Rp 500 (fixed)
- Task rewards: 1K to 100K range
- Demo accounts: 100M starting balance, can request more, cannot withdraw
- Deposit flow: Select amount → Continue → QRIS appears (minimum 100K)
- Withdrawal: Scrollable bank/e-wallet/crypto selection
- KYC verification: verified=50K min withdraw, unverified=250K min, 10% admin fee
- All features verified working via Agent Browser
