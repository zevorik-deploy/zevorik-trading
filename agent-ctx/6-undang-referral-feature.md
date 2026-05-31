# Work Log: Task 6 - Undang (Referral/Invite) Feature with Tier Commission System

## Summary
Successfully integrated the "Undang" (Invite/Referral) feature with a 3-tier commission system into the Global Saham trading platform.

## Changes Made

### 1. Database Schema (`prisma/schema.prisma`)
- Added `ReferralCommission` model with fields: `id`, `referrerId`, `referredId`, `level` (1/2/3), `amount`, `sourceAmount`, `status` (pending/claimed), `createdAt`
- Added relations `commissionEarned` and `commissionGenerated` to the `User` model
- Ran `bun run db:push` to sync schema with SQLite database

### 2. API: Referral Endpoint (`src/app/api/referral/route.ts`)
- **Extended GET** to return tier-based referral data:
  - Walks 3 levels of referrals (Tier 1 = direct, Tier 2 = referrals of referrals, Tier 3 = level 3)
  - Calculates per-tier: member count, active/inactive counts, total deposit, commission earned
  - Returns `totalMembers`, `totalDeposit`, `totalCommission`, `pendingCommission`, `claimedCommission`
  - Returns `tiers[]` array and `history[]` of all commission records
  - Maintains backward compatibility with existing `referredUsers` format
- **Extended POST** to create tier commissions when a referral code is applied:
  - Creates Tier 1 commission (35%) for the direct referrer
  - Creates Tier 2 commission (5%) for the referrer's referrer (if exists)
  - Creates Tier 3 commission (3%) for the level-3 referrer (if exists)

### 3. API: Claim Endpoint (`src/app/api/referral/claim/route.ts`)
- New `POST /api/referral/claim` endpoint
- Accepts `{ userId }` body
- Finds all pending commissions for the user
- Updates all to "claimed" status
- Adds total claimed amount to user's balance
- Creates bonus record and notification

### 4. Frontend: Undang Tab (`src/app/page.tsx`)
- Added new state fields: `totalMembers`, `totalDeposit`, `totalCommission`, `pendingCommission`, `claimedCommission`, `tiers[]`, `history[]`, `claimLoading`
- Updated `fetchReferral` to parse the extended API response
- **Replaced** old referral tab (`activeTab === 'referral'`) with new Undang tab (`activeTab === 'undang'`)
- New Undang tab includes:
  - **Header**: "Undang Tim" with "ASET SAHAM" branding
  - **Hero Card**: "PROGRAM REFERAL" badge, "Komisi Hingga 40%" highlight, total commission display, claim button for pending commissions
  - **Referral Code & Link**: Code display with copy button, shareable URL with copy/share buttons
  - **Stats Cards**: Anggota (total members), Deposit (total deposited), Komisi (total commission)
  - **Tier Commission System**: 3 tier cards showing level, commission %, active/inactive counts, deposit, and commission earned
  - **Referral History**: Scrollable list of all commission records with level badges, name, date, claimed status, amounts
  - **Direct Referrals List**: Backward-compatible list of directly referred users
- Added "Undang" tab to:
  - **Bottom navigation** (replacing portfolio as 4th item)
  - **Desktop sidebar** (after Investasi)
  - **Side menu** (updated from "Referral" to "Undang" with UserPlus icon)
  - **Profile menu** (updated from "Referral" to "Undang")

## Tier Commission Structure
| Level | Commission | Description |
|-------|-----------|-------------|
| Tier 1 | 35% | Direct referrals |
| Tier 2 | 5% | Referrals of your referrals |
| Tier 3 | 3% | Third-level referrals |
| **Total** | **43%** | Maximum achievable |

## Quality Checks
- `bun run db:push` — successful
- `bun run lint` — passed with no errors
- Dev server running correctly
