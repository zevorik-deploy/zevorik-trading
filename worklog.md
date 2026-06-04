---
Task ID: 1
Agent: Main Agent
Task: Implement Demo vs Real account separation system

Work Log:
- Added `accountType` field to Prisma User schema (default: "real")
- Updated auth store with `accountType?: string` in User interface
- Updated Register API to accept accountType parameter:
  - Demo accounts: 100M starting balance, no welcome bonus, no referral bonuses
  - Real accounts: welcome bonus only (25K), must deposit for more
- Updated Login API to return accountType in user response
- Updated Withdrawal API to block demo accounts (403 error)
- Updated Deposit API to block demo accounts (403 error)
- Created Demo Balance Request API at /api/demo/balance
- Added account type selector (Demo/Real) on register page with beautiful UI
- Added DEMO badge on dashboard header, balance card, and profile
- Added demo balance request feature on home tab and finance tab
- Disabled withdraw button for demo accounts (greyed out, cursor-not-allowed)
- Finance tab shows "Saldo Demo" instead of "Deposit" for demo accounts
- Added frontend checks in handleDeposit and handleWithdraw for demo accounts
- Updated demo account quick-login on login page (amber themed)
- Fixed register API operator precedence bug (0 + welcomeBonus)

Stage Summary:
- Demo vs Real account system fully implemented (backend + frontend)
- Demo accounts get 100M virtual balance, can request more, cannot deposit/withdraw
- Real accounts start with 25K welcome bonus, must deposit via QRIS, can withdraw
- All APIs properly validate accountType
- Lint passes
- Note: Agent Browser unavailable due to no X11/display; server works but OOM kills frequently due to 520KB page.tsx
