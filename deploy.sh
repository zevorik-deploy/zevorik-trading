#!/bin/bash
# ZEVORIK Quick Deployment Script
# Run this on your VPS: bash deploy.sh

set -e

echo "🚀 ZEVORIK Quick Deployment"
echo "============================"

PROJECT_DIR="/root/zevorik-trading"

if [ ! -d "$PROJECT_DIR" ]; then
  echo "📦 Cloning repository..."
  git clone https://github.com/zevorik-deploy/zevorik-trading.git $PROJECT_DIR
fi

cd $PROJECT_DIR

echo "📥 Pulling latest code..."
git fetch --all
git reset --hard origin/main

echo "📦 Installing dependencies..."
bun install

echo "🗄️ Pushing database schema..."
npx prisma db push --accept-data-loss

echo "⚙️ Configuring environment..."
cat > .env << 'EOF'
DATABASE_URL=file:./db/custom.db
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=zevorik@zevorik.com
SMTP_PASS=v=Z@/B:6q
EMAIL_FROM=ZEVORIK <zevorik@zevorik.com>
EOF

echo "🔄 Restarting application..."
pkill -f "next-server" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
pkill -f "bun.*dev" 2>/dev/null || true
sleep 2
nohup bun run dev > /tmp/zevorik.log 2>&1 &
echo "App started with PID: $!"

sleep 5
echo ""
echo "✅ Deployment complete!"
echo "   Website: https://zevorik.com"
echo ""
