#!/bin/bash
# ============================================
# ZEVORIK VPS DEPLOYMENT SCRIPT
# ============================================
# Run this script on your VPS (31.97.67.131) as root:
#   bash deploy-vps.sh
# ============================================

set -e

echo "🚀 Starting ZEVORIK deployment..."

export BUN_INSTALL="/root/.bun"
export PATH="$BUN_INSTALL/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH"

# Navigate to project
cd /root/zevorik-trading 2>/dev/null || {
  echo "📁 Cloning repository..."
  cd /root
  git clone https://github.com/zevorik-deploy/zevorik-trading.git
  cd zevorik-trading
}

# Kill any existing Next.js server
echo "🛑 Stopping existing server..."
fuser -k 3000/tcp 2>/dev/null || true
sleep 2

# Pull latest code
echo "📥 Pulling latest code..."
git fetch --all
git reset --hard origin/main

# Clean build cache
echo "🧹 Cleaning build cache..."
rm -rf .next

# Install dependencies
echo "📦 Installing dependencies..."
$BUN_INSTALL/bin/bun install

# Write .env file with ALL configuration
echo "⚙️ Writing environment configuration..."
cat > .env << 'ENVEOF'
DATABASE_URL=file:./db/custom.db
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=zevorik@zevorik.com
SMTP_PASS=v=Z@/B:6q
EMAIL_FROM=ZEVORIK <zevorik@zevorik.com>
JWT_SECRET=zevorik-jwt-secret-key-2024-secure
BINANCE_API_KEY=O4diHDLBU5i4wXYjJ8M8Y9MF2HM0I5IcotLW3xwbQiGVX88YKVs3uRMTnyzwkspM
BINANCE_SECRET_KEY=TZ7hv85x79ibvwRXEuFxwcuxNql2YZ73hfObDpUvhfadOx9bKsOuniZSXpp0NjFx
ENVEOF

# Push database schema
echo "🗄️ Updating database schema..."
$BUN_INSTALL/bin/bunx prisma db push --accept-data-loss
$BUN_INSTALL/bin/bunx prisma generate

# Build for production
echo "🔨 Building production..."
$BUN_INSTALL/bin/bun run build

# Start production server
echo "🚀 Starting production server..."
nohup $BUN_INSTALL/bin/bun .next/standalone/server.js > /tmp/zevorik.log 2>&1 &
sleep 5

# Verify
if curl -s http://localhost:3000/api/stocks > /dev/null 2>&1; then
  echo "✅ ZEVORIK is running at https://zevorik.com!"
  echo "📊 API Status: OK"
else
  echo "⏳ Server is starting... Check: cat /tmp/zevorik.log"
fi

echo ""
echo "================================"
echo "  DEPLOYMENT COMPLETE!"
echo "================================"
echo "  Deposit: USDT via Binance (min 100 USDT)"
echo "  Withdraw: Profit-based penalty system"
echo "  - Profit ≥ 100%: admin 5% only"
echo "  - Profit < 100%: penalty 50% + admin 5% = 55%"
echo "================================"
