---
Task ID: 1
Agent: Main Agent
Task: Complete all changes - remove demo, add OTP, fix APIs

Work Log:
- Verified all demo account code already removed from page.tsx (no accountType, demoRequestAmount, etc.)
- Verified OTP verification already implemented for registration (authMode: 'otp')
- Verified OTP verification already implemented for withdrawal (withdrawOtpSent, withdrawOtpVerified)
- Added OTP model to Prisma schema + emailVerified field to User model
- Ran db:push to update database
- Created /src/lib/email.ts with nodemailer SMTP support and OTP email template
- Created /src/app/api/otp/send/route.ts - sends OTP to email
- Created /src/app/api/otp/verify/route.ts - verifies OTP code
- Updated /src/app/api/auth/register/route.ts - requires otpVerified before registration
- Updated /src/app/api/auth/login/route.ts - includes emailVerified in response
- Updated /src/app/api/auth/forgot-password/route.ts - requires OTP verification
- Updated /src/app/api/withdrawal/route.ts - requires OTP, removed vipLevel/demo refs
- Updated /src/app/api/deposit/route.ts - removed demo/bonus/vipLevel refs
- Updated /src/app/api/profile/route.ts - removed stale fields (username, vipLevel, referralCode, etc.)
- Updated /src/app/api/admin/users/[id]/route.ts - removed vipLevel, stale deleteMany calls
- Updated /src/app/api/admin/users/route.ts - replaced vipLevel with emailVerified
- Updated /src/app/api/stocks/seed/route.ts - renamed demo user to test user
- Updated /src/app/api/help/route.ts - removed demo reference
- Added SMTP config to .env file
- Ran lint check - passes with no errors
- Verified site compiles and serves HTML with ZEVORIK branding

Stage Summary:
- All demo/akunDemo/accountType code permanently removed
- OTP email verification added for: registration, withdrawal, forgot password
- All API routes cleaned up (no more vipLevel, accountType, referralCode, bonus, etc.)
- Prisma schema has OTP model and emailVerified field
- Email sending via nodemailer SMTP (needs SMTP_USER/SMTP_PASS configured)
- Lint passes, site compiles and serves

---
Task ID: 3
Agent: full-stack-developer
Task: Clean up page.tsx - remove bonus/referral/news/VIP/promo/daily check/invest features

Work Log:
- Read full page.tsx (~8589 lines) in chunks to understand complete structure
- Removed 7 interfaces: BonusItem, PromoItem, LeaderboardEntry, InvestProduct, UserInvestment, DailyCheckStatus, TaskItem
- Removed daily check & tasks state variables: dailyCheckStatus, dailyCheckLoading, dailyCheckReward, showDailyCheckModal, tasks, tasksLoading, showTasksModal, taskClaimingId
- Removed extra modal state variables: showVipModal, showPromoDetailModal, selectedPromo, promoNotified
- Removed welcome modal state: showWelcomeModal, welcomeDontShow
- Removed invest detail modal state: showInvestDetailModal, selectedDetailProduct, investDetailAutoProfit, investChartType, investTimeframe
- Removed invest chart data state: investChartData, investChartSimRef, investChartTickRef
- Removed functions: handleDailyCheck, handleClaimTask, handlePurchaseInvestment, handleClaimProfit, getInvestChartData, getInvestSparkline, handleWelcomeClose
- Removed welcome modal useEffect (showed on user login)
- Removed invest chart initialization useEffect and live update useEffect
- Removed daily check banner slide from carousel (banner-daily-check.png slide)
- Updated banner carousel from 5 slides to 4 slides (% 5 → % 4)
- Removed daily check reward display and disabled button logic from carousel
- Removed gold button style from carousel (was only for daily check)
- Removed DAILY CHECK BANNER (full-width) section from home tab
- Removed TASKS & REWARDS section (Tugas + Cek Harian mini cards) from home tab
- Removed Gold VIP badge from profile section
- Removed referral FAQ entry from Help/FAQ modal
- Removed 5 modals: Daily Check-in Modal, Tasks Modal, Welcome Modal, Promo Detail Modal, VIP Level Modal
- Cleaned up unused imports: Newspaper, Award, Trophy, CalendarDays, Flame, ListChecks, ClipboardList, Sparkles
- Ran bun run lint - passes with no errors
- Checked dev.log - no runtime errors related to changes
- Verified no remaining references to removed variables/functions in codebase

Stage Summary:
- All bonus/daily check-in/task/referral/VIP/promo/invest product/leaderboard/welcome modal code permanently removed from page.tsx
- File reduced from ~8589 lines to ~7920 lines
- Home tab now shows: Banner carousel (4 slides), Wallet card, Quick Access menu, Portfolio overview, Top Movers, Watchlist, Recent Transactions, Trust Badges
- Authentication (login/register/PIN/OTP) preserved intact
- All critical features preserved: Market/Quote, Trading/Sinyal, Portfolio, Finance (deposit/withdrawal with OTP), History, Profile, Saldo
- No new TypeScript errors introduced (pre-existing errors in other files remain)
- Lint passes, dev server runs successfully
