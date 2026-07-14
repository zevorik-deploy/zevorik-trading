# Task 3 - Auth API Agent

## Task: Update auth API routes for 2-step login and new registration

### Summary of Completed Work

All 4 subtasks completed successfully:

1. **`/src/lib/auth.ts`** — Added `generateTempToken` (5-min JWT) and `verifyTempToken` functions. Existing functions unchanged.

2. **`/src/app/api/auth/login/route.ts`** — Rewritten for 2-step login:
   - Step 1: `identifier` (email or phone) + `password` → returns `{ step: "pin_required", tempToken }`
   - Step 2: `tempToken` + `pin` → returns full user data + auth token
   - User data cleaned to: id, name, phone, email, balance, role, kycStatus, totalDeposit, totalTrading, bankName, bankAccount, bankHolder, avatar, createdAt

3. **`/src/app/api/auth/register/route.ts`** — Rewritten:
   - Required: name, email, phone, password, pin (6-digit)
   - Both password and pin hashed with bcrypt
   - Creates user with balance: 0, role: "investor", kycStatus: "pending"
   - No demo account, no referral, no bonus, no VIP
   - Changed "ZEVORIX" → "ZEVORIK" in welcome notification

4. **Deleted unused directories:**
   - `/src/app/api/portfolio/`
   - `/src/app/api/admin/news/`
   - `/src/app/api/admin/promos/`
   - `/src/app/api/admin/contracts/`
   - `/src/app/api/admin/investments/`

### Lint: Passed ✅
