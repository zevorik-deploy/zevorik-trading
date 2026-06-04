---
Task ID: 1
Agent: main
Task: Create separate admin dashboard at /admin with full control

Work Log:
- Updated Prisma schema with Banner and AdminSetting models
- Created admin login API at /api/admin/login
- Created admin upload API at /api/admin/upload for image uploads
- Created admin banners CRUD API at /api/admin/banners
- Created admin settings API at /api/admin/settings
- Updated stocks API to support POST (create) and DELETE
- Updated investments API to support POST (create) and DELETE
- Built complete admin dashboard page at src/app/admin/page.tsx (~1400 lines)
- Admin dashboard has own login, sidebar navigation, and 10 control sections
- Removed AdminDashboard component and admin tab from user page.tsx
- Removed adminViewingUserMode references from user Dashboard component
- Admin credentials: 080000000000 / admin123
- Verified admin dashboard works via agent-browser testing

Stage Summary:
- Admin panel is now completely separate at /admin route
- Has its own login screen (dark blue gradient design)
- Sidebar with 10 sections: Dashboard, Users, Deposits, Withdrawals, Stocks, Investments, News, Promos, Banners, Settings
- Settings page includes QRIS image upload for deposits
- Banner management with image upload and preview
- Full CRUD for all entities (stocks, investments, news, promos, banners)
- User page.tsx no longer contains any admin code
- Lint passes with zero errors
