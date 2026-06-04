# Task 1 - Backend Agent: Demo vs Real Account Separation

## Summary
Implemented backend changes for Demo vs Real account separation system on the ZEVORIX trading platform.

## Changes Made

### 1. Prisma Schema (`/home/z/my-project/prisma/schema.prisma`)
- Added `accountType String @default("real")` to User model (between kycStatus and vipLevel fields)
- Ran `bun run db:push` successfully to apply migration

### 2. Auth Store (`/home/z/my-project/src/lib/store.ts`)
- Added `accountType?: string // 'demo' or 'real'` to User interface

### 3. Register API (`/home/z/my-project/src/app/api/auth/register/route.ts`)
- Accepts `accountType` from request body (defaults to 'real' if not 'demo')
- **Demo accounts**: balance = 100,000,000 (100M), NO welcome bonus, NO referral bonuses, role = 'investor'
- **Real accounts**: balance = 25,000 (welcome bonus only), referral bonuses enabled
- Returns `accountType` in user response object
- Demo accounts get a different welcome notification mentioning demo status

### 4. Login API (`/home/z/my-project/src/app/api/auth/login/route.ts`)
- Returns `accountType: user.accountType` in the user response object

### 5. Withdrawal API (`/home/z/my-project/src/app/api/withdrawal/route.ts`)
- Added demo account check at start of POST handler (after user lookup, before KYC check)
- Returns 403 with message: 'Akun demo tidak dapat melakukan penarikan. Gunakan akun real untuk withdraw.'

### 6. Demo Balance Request API (`/home/z/my-project/src/app/api/demo/balance/route.ts`)
- New POST endpoint accepting `{ userId, amount }`
- Validates: user exists, is demo account, amount > 0
- Max single request: Rp 1,000,000,000
- Max total balance cap: Rp 10,000,000,000
- Returns `{ success: true, newBalance }` on success

## Files NOT Modified (as instructed)
- `/home/z/my-project/src/app/page.tsx` - frontend changes deferred to another agent
- `/home/z/my-project/src/app/admin/page.tsx` - admin panel not modified

## Verification
- `bun run lint` passes with zero errors
- Dev server running without errors related to changes
- All existing API endpoints unaffected
