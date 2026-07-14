#!/bin/bash
# ZEVORIK Quick Deployment Script
# Run this on your VPS: bash deploy.sh
# 
# Usage: 
#   bash deploy.sh          # Normal deployment
#   bash deploy.sh --fresh  # Fresh deployment (resets database)

set -e

echo "🚀 ZEVORIK Quick Deployment"
echo "============================"

PROJECT_DIR="/root/zevorik-trading"
FRESH_DB=false

if [ "$1" = "--fresh" ]; then
  FRESH_DB=true
  echo "⚠️  Fresh deployment - database will be reset!"
fi

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

echo "🗄️ Setting up database..."
if [ "$FRESH_DB" = true ]; then
  echo "⚠️  Resetting database..."
  npx prisma db push --force-reset
else
  npx prisma db push --accept-data-loss
fi

echo "⚙️ Configuring environment..."
cat > .env << 'EOF'
DATABASE_URL=file:./db/custom.db
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=zevorik@zevorik.com
SMTP_PASS=v=Z@/B:6q
EMAIL_FROM=ZEVORIK <zevorik@zevorik.com>
JWT_SECRET=zevorik-jwt-secret-key-2024-secure
EOF

echo "🌱 Seeding stocks data..."
# Seed stocks if not exists
bun -e "
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
(async () => {
  const count = await db.stock.count();
  if (count === 0) {
    console.log('No stocks found, seeding...');
    try {
      const res = await fetch('http://localhost:3000/api/stocks/seed', { method: 'POST' });
      console.log('Stock seed result:', await res.text());
    } catch(e) {
      console.log('Stock seed will happen on first request');
    }
  } else {
    console.log('Stocks already exist:', count);
  }
  await db.\$disconnect();
})();
" || echo "Stock seeding skipped (will auto-seed on first page load)"

echo "🔄 Restarting application..."
pkill -f "next-server" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
pkill -f "bun.*dev" 2>/dev/null || true
sleep 3

# Build and start in production mode
echo "🏗️  Building application..."
bun run build 2>&1 || echo "Build failed, using dev mode instead..."

if [ -d ".next" ]; then
  echo "🚀 Starting in production mode..."
  nohup bun run start -- -p 3000 > /tmp/zevorik.log 2>&1 &
else
  echo "🚀 Starting in development mode..."
  nohup bun run dev > /tmp/zevorik.log 2>&1 &
fi

APP_PID=$!
echo "App started with PID: $APP_PID"

sleep 8
echo ""
echo "📋 Checking application status..."
if curl -s http://localhost:3000/api/stocks > /dev/null 2>&1; then
  echo "✅ Application is running and responding!"
else
  echo "⚠️  Application may still be starting. Check logs: tail -f /tmp/zevorik.log"
fi

echo ""
echo "✅ Deployment complete!"
echo "   Website: https://zevorik.com"
echo "   Logs: tail -f /tmp/zevorik.log"
echo "   Restart: cd $PROJECT_DIR && pkill -f next && nohup bun run start -- -p 3000 > /tmp/zevorik.log 2>&1 &"
echo ""
