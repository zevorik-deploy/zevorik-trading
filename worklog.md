# Worklog - ZEVORIK Trading App

---
Task ID: 1
Agent: Main Agent
Task: Complete rewrite of ZEVORIK trading app - remove old features, add new auth flow, rebrand to ZEVORIK

Work Log:
- Read and analyzed existing codebase (11K line page.tsx, prisma schema, API routes, store)
- Rewrote page.tsx from scratch (10K lines → 1K lines, clean implementation)
- Updated Prisma schema: removed News, Bonus, Promo, Referral, ReferralCommission, DailyCheck, Task, Investment, InvestmentProduct, StockContract, Leaderboard models
- Added `email` as unique required field and `pin` field to User model
- Rewrote /api/auth/login: 2-step login (email/phone + password → PIN verification)
- Rewrote /api/auth/register: name, email, phone, password, 6-digit PIN
- Updated /api/deposit: removed demo check and bonus logic
- Updated /api/withdrawal: removed demo check
- Updated /api/profile: added change_pin action
- Updated /src/lib/store.ts: added pendingUserId, tempToken, setPendingAuth, clearPendingAuth
- Updated /api/admin/seed-admin: admin@zevorik.com / 081234567890 / admin123 / PIN 000000
- Deleted all unused API route directories (news, bonus, promo, referral, daily-check, tasks, invest, investments, contracts, demo, leaderboard, guess, vip)
- Renamed all branding from ZEVORIX to ZEVORIK (page.tsx, layout.tsx, admin/page.tsx, logo file)
- Updated admin page: removed contracts, investments, news, promos sections
- Cleaned up next.config.ts: added .space-z.ai to allowedDevOrigins
- Pushed all changes to GitHub: https://github.com/zevorik-deploy/zevorik-trading

Stage Summary:
- Page serves correctly with new login (2-step PIN) and registration (email+phone+PIN)
- Removed: news, bonus, referral, investasi, demo account, leaderboard, daily check, tasks, VIP, promo
- Kept: home, market, trading (binary prediction), finance (deposit/withdraw), profile, history, KYC
- Branding changed to ZEVORIK throughout
- Code pushed to GitHub - needs manual deploy to VPS zevorik.com

## Task 4: Update Zustand auth store for 2-step PIN verification flow

**File edited:** `src/lib/store.ts`

### Changes made:
1. **Updated `User` interface** — Removed `withdrawalBalance`, `referralCode`, `accountType`. Made `email` required (was optional). Added `totalTrading` field.
2. **Added new state fields:** `pendingUserId: string | null` and `tempToken: string | null` — initialized to `null`.
3. **Added new actions:**
   - `setPendingLogin(userId, tempToken)` — stores pending login state after step 1 (password verified)
   - `clearPendingLogin()` — clears pending state
4. **Updated `persistState`** — Only persists `user`, `token`, `isLoggedIn`. Does NOT persist `pendingUserId`/`tempToken` as they are temporary session data.
5. **Updated `login` action** — Also clears `pendingUserId` and `tempToken` on successful full login.
6. **Updated `logout` action** — Also clears `pendingUserId` and `tempToken` on logout.
7. **Kept `PERSIST_KEY`** as `'zv-auth-storage'`.

**Lint:** Passed with no errors.

---

## Task 3: Update auth API routes for 2-step login and new registration

**Agent:** Auth API Agent

### Changes made:

#### 1. `/src/lib/auth.ts` — Added generateTempToken and verifyTempToken
- Added `generateTempToken(payload: { userId: string })` — creates a JWT with 5-minute expiry
- Added `verifyTempToken(token: string)` — verifies the temp token, returns `{ userId }` or null
- Existing `hashPassword`, `verifyPassword`, `generateToken`, `verifyToken` remain unchanged

#### 2. `/src/app/api/auth/login/route.ts` — Rewritten for 2-step login
- **Step 1:** Accept `identifier` (email or phone) + `password`
  - Finds user by email OR phone using `findFirst` with `OR` clause
  - Verifies password with `verifyPassword`
  - If valid, returns `{ step: "pin_required", tempToken: <jwt with userId, exp 5min> }`
  - Does NOT return full user data
- **Step 2:** Accept `tempToken` + `pin` (6-digit)
  - Verifies tempToken with `verifyTempToken`
  - Verifies PIN matches user's hashed pin with `verifyPassword`
  - If valid, returns full user data + real auth token
  - User data includes: id, name, phone, email, balance, role, kycStatus, totalDeposit, totalTrading, bankName, bankAccount, bankHolder, avatar, createdAt
  - Removed: username, accountType, referralCode, vipLevel, dailyCheckIn
- Removed `calculateVIPLevel` function entirely

#### 3. `/src/app/api/auth/register/route.ts` — Rewritten
- Required fields: name, email, phone, password, pin (6-digit)
- Validates all fields present, validates PIN is exactly 6 digits
- Checks email uniqueness and phone uniqueness separately
- Hashes both password and pin with bcrypt via `hashPassword`
- Creates user with: name, phone, email, password, pin, balance: 0, role: "investor", kycStatus: "pending"
- Removed: demo account logic, referral code, welcome bonus, VIP level, username, accountType, dailyCheckIn
- Changed "ZEVORIX" to "ZEVORIK" in welcome notification
- Returns same response format as login step 2 (user data + token)

#### 4. Deleted unused API route directories
- `/src/app/api/portfolio/` — deleted
- `/src/app/api/admin/news/` — deleted
- `/src/app/api/admin/promos/` — deleted
- `/src/app/api/admin/contracts/` — deleted
- `/src/app/api/admin/investments/` — deleted

**Lint:** Passed with no errors.
