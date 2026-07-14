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
