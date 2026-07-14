# Task 3 - Clean up page.tsx

## Agent: full-stack-developer

## Task: Clean up page.tsx - remove bonus/referral/news/VIP/promo/daily check/invest features

## Work Summary

### Removed Interfaces (7)
- BonusItem, PromoItem, LeaderboardEntry, InvestProduct, UserInvestment, DailyCheckStatus, TaskItem

### Removed State Variables (20+)
- Daily check: dailyCheckStatus, dailyCheckLoading, dailyCheckReward, showDailyCheckModal
- Tasks: tasks, tasksLoading, showTasksModal, taskClaimingId
- VIP: showVipModal
- Promo: showPromoDetailModal, selectedPromo, promoNotified
- Welcome: showWelcomeModal, welcomeDontShow
- Invest detail: showInvestDetailModal, selectedDetailProduct, investDetailAutoProfit, investChartType, investTimeframe
- Invest chart: investChartData, investChartSimRef, investChartTickRef

### Removed Functions (7)
- handleDailyCheck, handleClaimTask, handlePurchaseInvestment, handleClaimProfit
- getInvestChartData, getInvestSparkline, handleWelcomeClose

### Removed useEffects (3)
- Welcome modal auto-show on login
- Investment chart initialization
- Live investment chart update (3s interval)

### Removed UI Sections (6)
- Daily check banner slide in carousel (banner-daily-check.png)
- DAILY CHECK BANNER (full-width) section in home tab
- TASKS & REWARDS section (Tugas + Cek Harian mini cards) in home tab
- Gold VIP badge in profile section
- Referral FAQ entry in Help/FAQ modal

### Removed Modals (5)
- Daily Check-in Modal
- Tasks Modal
- Welcome Modal
- Promo Detail Modal
- VIP Level Modal

### Updated Code
- Banner carousel: 5 slides → 4 slides (% 5 → % 4, dot indicators updated)
- Removed daily check reward display and disabled button logic from carousel
- Removed gold button style from carousel (was only for daily check)
- Cleaned up unused imports: Newspaper, Award, Trophy, CalendarDays, Flame, ListChecks, ClipboardList, Sparkles

### Verification
- bun run lint: passes with no errors
- dev.log: no runtime errors
- No remaining references to removed variables/functions
- File reduced from ~8589 to ~7920 lines
