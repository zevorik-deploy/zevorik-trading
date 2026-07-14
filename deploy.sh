#!/bin/bash
# ZEVORIK Deployment Script
# Run this on your VPS: bash deploy.sh

set -e

echo "🚀 ZEVORIK Deployment Script"
echo "============================="

PROJECT_DIR="/root/zevorik-trading"

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
  echo "📦 Cloning repository..."
  git clone https://github.com/zevorik-deploy/zevorik-trading.git $PROJECT_DIR
  cd $PROJECT_DIR
else
  echo "📥 Pulling latest code..."
  cd $PROJECT_DIR
  git pull origin main
fi

# Install dependencies
echo "📦 Installing dependencies..."
bun install

# Update database schema
echo "🗄️ Updating database schema..."
bun run db:push

# Configure environment if .env doesn't exist or needs update
if [ ! -f .env ] || ! grep -q "smtp.hostinger.com" .env; then
  echo "⚙️ Configuring environment..."
  cat > .env << 'ENVEOF'
DATABASE_URL=file:/home/z/my-project/db/custom.db

# SMTP Email Configuration (Hostinger)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=zevorik@zevorik.com
SMTP_PASS=CHANGE_THIS_TO_YOUR_EMAIL_PASSWORD
EMAIL_FROM=ZEVORIK <zevorik@zevorik.com>
ENVEOF
  echo "⚠️  IMPORTANT: Edit .env and set SMTP_PASS to your email password!"
  echo "   Run: nano $PROJECT_DIR/.env"
fi

# Restart the application
echo "🔄 Restarting application..."
if command -v pm2 &> /dev/null; then
  pm2 restart zevorik 2>/dev/null || pm2 start "bun run dev" --name zevorik
  pm2 save
else
  echo "⚠️  pm2 not found. Install it with: npm install -g pm2"
  echo "   Then run: cd $PROJECT_DIR && pm2 start 'bun run dev' --name zevorik"
fi

echo ""
echo "✅ Deployment complete!"
echo "   Website: https://zevorik.com"
echo ""
echo "⚠️  Don't forget to set SMTP_PASS in .env if not done already!"
