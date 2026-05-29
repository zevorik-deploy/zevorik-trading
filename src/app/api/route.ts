import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    name: 'Global Saham API',
    version: '1.0.0',
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register',
        forgotPassword: 'POST /api/auth/forgot-password',
      },
      stocks: {
        list: 'GET /api/stocks',
        create: 'POST /api/stocks',
        detail: 'GET /api/stocks/[id]',
        updatePrices: 'POST /api/stocks/update-prices',
        seed: 'POST /api/stocks/seed',
      },
      portfolio: {
        get: 'GET /api/portfolio?userId=xxx',
        trade: 'POST /api/portfolio',
      },
      transactions: {
        list: 'GET /api/transactions?userId=xxx&type=BUY&page=1&limit=20',
        create: 'POST /api/transactions',
      },
      deposit: {
        list: 'GET /api/deposit?userId=xxx',
        create: 'POST /api/deposit',
      },
      withdrawal: {
        list: 'GET /api/withdrawal?userId=xxx',
        create: 'POST /api/withdrawal',
      },
      referral: {
        get: 'GET /api/referral?userId=xxx',
        use: 'POST /api/referral',
      },
      bonus: {
        get: 'GET /api/bonus?userId=xxx',
        dailyCheckin: 'POST /api/bonus (action: daily_checkin)',
        tradingBonus: 'POST /api/bonus (action: trading_bonus)',
        depositBonus: 'POST /api/bonus (action: deposit_bonus)',
      },
      vip: {
        get: 'GET /api/vip?userId=xxx',
      },
      leaderboard: {
        get: 'GET /api/leaderboard',
      },
      market: {
        indices: 'GET /api/market',
        update: 'POST /api/market',
      },
      news: {
        list: 'GET /api/news?category=market',
      },
      notifications: {
        list: 'GET /api/notifications?userId=xxx',
        markRead: 'PUT /api/notifications',
        create: 'POST /api/notifications',
      },
      watchlist: {
        list: 'GET /api/watchlist?userId=xxx',
        add: 'POST /api/watchlist',
        remove: 'DELETE /api/watchlist',
      },
      profile: {
        get: 'GET /api/profile?userId=xxx',
        update: 'PUT /api/profile',
        changePassword: 'POST /api/profile (action: change_password)',
      },
      kyc: {
        get: 'GET /api/kyc?userId=xxx',
        submit: 'POST /api/kyc',
      },
      promo: {
        list: 'GET /api/promo',
      },
      help: {
        faq: 'GET /api/help',
      },
    },
  })
}
