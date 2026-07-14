import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function POST() {
  try {
    // Clear existing data
    await db.stockPriceHistory.deleteMany()
    await db.transaction.deleteMany()
    await db.portfolio.deleteMany()
    await db.watchlist.deleteMany()
    await db.notification.deleteMany()
    await db.deposit.deleteMany()
    await db.withdrawal.deleteMany()
    await db.kYC.deleteMany()
    await db.predictionTrade.deleteMany()
    await db.marketIndex.deleteMany()
    await db.stock.deleteMany()
    await db.user.deleteMany()

    // Create admin user
    const hashedAdminPassword = await hashPassword('admin123')
    const hashedAdminPin = await hashPassword('000000')
    await db.user.create({
      data: {
        name: 'Admin ZEVORIK',
        phone: '080000000000',
        email: 'admin@zevorik.com',
        password: hashedAdminPassword,
        pin: hashedAdminPin,
        role: 'admin',
        kycStatus: 'verified',
      },
    })

    // Create test user
    const hashedPassword = await hashPassword('test123')
    const hashedPin = await hashPassword('123456')
    const testUser = await db.user.create({
      data: {
        name: 'Test User',
        phone: '081234567890',
        email: 'test@zevorik.com',
        password: hashedPassword,
        pin: hashedPin,
        balance: 10000000,
        role: 'investor',
        kycStatus: 'verified',
        emailVerified: true,
        bankName: 'Bank BCA',
        bankAccount: '1234567890',
        bankHolder: 'Test User',
        totalDeposit: 10000000,
        totalTrading: 5000000,
      },
    })

    // Create notification for test user
    await db.notification.create({
      data: {
        userId: testUser.id,
        title: 'Selamat Datang! 🎉',
        message: 'Selamat datang di ZEVORIK! Mulai trading sekarang.',
        type: 'system',
      },
    })

    // Create Market Indices
    const marketIndices = [
      { code: 'SP500', name: 'S&P 500', value: 5321.41, change: 28.73, changePercent: 0.54 },
      { code: 'NASDAQ', name: 'NASDAQ Composite', value: 16920.80, change: 145.62, changePercent: 0.87 },
      { code: 'DOW', name: 'Dow Jones Industrial', value: 39512.84, change: -42.77, changePercent: -0.11 },
      { code: 'RUSSELL', name: 'Russell 2000', value: 2067.41, change: 18.34, changePercent: 0.90 },
      { code: 'VIX', name: 'CBOE Volatility Index', value: 13.24, change: -0.87, changePercent: -6.17 },
    ]
    for (const index of marketIndices) {
      await db.marketIndex.create({ data: index })
    }

    // Create Stocks (International + Crypto)
    const stocks = [
      { code: 'AAPL', name: 'Apple Inc.', price: 198.50, change: 2.35, changePercent: 1.20, high: 200.10, low: 196.80, open: 197.20, volume: 52340000, marketCap: 3100000000000, category: 'tech', sector: 'Teknologi', peRatio: 32.5, pbv: 45.2, dividendYield: 0.5, lotSize: 1 },
      { code: 'MSFT', name: 'Microsoft Corp.', price: 442.30, change: 5.80, changePercent: 1.33, high: 445.00, low: 437.50, open: 438.00, volume: 22150000, marketCap: 3290000000000, category: 'tech', sector: 'Teknologi', peRatio: 37.8, pbv: 12.5, dividendYield: 0.7, lotSize: 1 },
      { code: 'NVDA', name: 'NVIDIA Corp.', price: 131.88, change: 4.12, changePercent: 3.22, high: 133.50, low: 128.00, open: 129.00, volume: 312000000, marketCap: 3250000000000, category: 'tech', sector: 'Semikonduktor', peRatio: 68.5, pbv: 52.3, dividendYield: 0.03, lotSize: 1 },
      { code: 'GOOGL', name: 'Alphabet Inc.', price: 178.35, change: -1.25, changePercent: -0.70, high: 180.50, low: 177.20, open: 179.80, volume: 18600000, marketCap: 2200000000000, category: 'tech', sector: 'Teknologi', peRatio: 26.3, pbv: 7.1, dividendYield: 0.5, lotSize: 1 },
      { code: 'AMZN', name: 'Amazon.com Inc.', price: 186.50, change: 3.20, changePercent: 1.75, high: 188.00, low: 183.50, open: 184.00, volume: 45800000, marketCap: 1940000000000, category: 'tech', sector: 'E-Commerce', peRatio: 62.1, pbv: 8.9, dividendYield: 0.0, lotSize: 1 },
      { code: 'META', name: 'Meta Platforms', price: 502.30, change: 8.50, changePercent: 1.72, high: 505.00, low: 494.00, open: 495.00, volume: 15200000, marketCap: 1280000000000, category: 'tech', sector: 'Media Sosial', peRatio: 28.5, pbv: 7.8, dividendYield: 0.4, lotSize: 1 },
      { code: 'TSLA', name: 'Tesla Inc.', price: 248.50, change: -5.30, changePercent: -2.09, high: 254.00, low: 246.50, open: 253.00, volume: 98500000, marketCap: 790000000000, category: 'tech', sector: 'Otomotif', peRatio: 78.2, pbv: 11.3, dividendYield: 0.0, lotSize: 1 },
      { code: 'JPM', name: 'JPMorgan Chase', price: 205.80, change: 1.90, changePercent: 0.93, high: 207.00, low: 203.50, open: 204.00, volume: 8200000, marketCap: 592000000000, category: 'banking', sector: 'Keuangan', peRatio: 12.1, pbv: 1.8, dividendYield: 2.3, lotSize: 1 },
      { code: 'V', name: 'Visa Inc.', price: 281.50, change: 3.10, changePercent: 1.11, high: 283.00, low: 278.50, open: 279.00, volume: 6500000, marketCap: 575000000000, category: 'banking', sector: 'Keuangan', peRatio: 31.2, pbv: 13.5, dividendYield: 0.7, lotSize: 1 },
      { code: 'XOM', name: 'Exxon Mobil', price: 112.35, change: -0.85, changePercent: -0.75, high: 113.50, low: 111.80, open: 113.00, volume: 14500000, marketCap: 450000000000, category: 'energy', sector: 'Energi', peRatio: 13.5, pbv: 2.1, dividendYield: 3.5, lotSize: 1 },
      { code: 'BTC', name: 'Bitcoin', price: 67250.00, change: 1250.00, changePercent: 1.89, high: 68000.00, low: 66000.00, open: 66800.00, volume: 35000000, marketCap: 1320000000000, category: 'crypto', sector: 'Cryptocurrency', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'ETH', name: 'Ethereum', price: 3450.00, change: 85.00, changePercent: 2.53, high: 3520.00, low: 3380.00, open: 3400.00, volume: 18000000, marketCap: 415000000000, category: 'crypto', sector: 'Cryptocurrency', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
    ]

    for (const stock of stocks) {
      const created = await db.stock.create({ data: stock })
      // Create price history for each stock
      const now = Date.now()
      for (let i = 0; i < 50; i++) {
        const randomChange = (Math.random() - 0.5) * stock.price * 0.02
        const histPrice = stock.price + randomChange * (50 - i) / 50
        await db.stockPriceHistory.create({
          data: {
            stockCode: stock.code,
            price: Math.round(histPrice * 100) / 100,
            open: Math.round((histPrice - randomChange * 0.3) * 100) / 100,
            high: Math.round((histPrice + Math.abs(randomChange) * 0.5) * 100) / 100,
            low: Math.round((histPrice - Math.abs(randomChange) * 0.5) * 100) / 100,
            volume: Math.floor(Math.random() * 10000000),
            timestamp: new Date(now - i * 60000),
          },
        })
      }
    }

    return NextResponse.json({ message: 'Database seeded successfully', stocksCreated: stocks.length, testUser: { phone: '081234567890', password: 'test123', pin: '123456' } }, { status: 201 })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 })
  }
}
