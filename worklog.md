---
Task ID: 1
Agent: Main Agent
Task: Fix registration errors and all backend/frontend bugs for ZEVORIK trading app

Work Log:
- Identified ROOT CAUSE of registration errors: OTP invalidation bug in /api/otp/send/route.ts
- The old code set `verified: true` on unverified OTPs to "invalidate" them, which caused the register route to find WRONG OTP records that weren't actually verified by the user
- Fixed OTP send: now properly DELETE old OTPs instead of marking them verified
- Fixed OTP verify: added code format validation, specific error messages for expired/used/invalid codes
- Fixed register route: added phone normalization (Indonesian format), email validation, proper OTP cleanup after use, unique constraint error handling
- Fixed portfolio API: returns empty data instead of 404 for new users (was causing frontend errors)
- Fixed email.ts: created transporter on demand with connection timeouts and verification
- Fixed store.ts: added hydrate() function to prevent SSR/hydration mismatch
- Fixed page.tsx: proper hydration flow using queueMicrotask for mounted state
- Added contracts API stub to prevent 404 errors
- Added JWT_SECRET to .env
- Verified all APIs work: OTP send → OTP verify → Registration → Login Step 1 → Login Step 2 (PIN)
- Pushed all fixes to GitHub repository

Stage Summary:
- All backend API bugs fixed and verified via curl
- All 6 root causes identified and fixed
- Code pushed to GitHub: https://github.com/zevorik-deploy/zevorik-trading
- Deploy script updated with production build and health check
- VPS deployment requires manual SSH (sandbox cannot SSH to VPS)
