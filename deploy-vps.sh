#!/bin/bash
# ============================================
# ZEVORIK Deployment Script
# Run this on your Hostinger VPS (31.97.67.131)
# ============================================

set -e

echo "🚀 Deploying ZEVORIK to VPS..."
echo ""

# Navigate to project directory
cd /root/zevorik-trading 2>/dev/null || {
  echo "📥 Cloning repository..."
  cd /root
  git clone https://github.com/zevorik-deploy/zevorik-trading.git
  cd zevorik-trading
}

echo "📥 Pulling latest code..."
git pull origin main --force

echo "📦 Installing dependencies..."
bun install

echo "🗄️ Pushing database schema..."
bunx prisma db push --force-reset

echo "🌱 Seeding admin user..."
curl -X POST http://localhost:3000/api/admin/seed-admin 2>/dev/null || true

echo "🔨 Building..."
bun run build

echo "🔄 Restarting service..."
# Kill existing process
pkill -f "next start" 2>/dev/null || true
sleep 2

# Start production server
nohup bun run start -- -p 3000 > /root/zevorik-trading/production.log 2>&1 &

echo ""
echo "✅ Deployment complete!"
echo "🌐 Visit: https://zevorik.com"
echo ""
echo "Admin credentials:"
echo "  Email: admin@zevorik.com"
echo "  Phone: 081234567890"
echo "  Password: admin123"
echo "  PIN: 000000"
