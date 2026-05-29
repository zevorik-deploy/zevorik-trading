import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function POST() {
  try {
    // Clear existing data
    await db.stockPriceHistory.deleteMany()
    await db.transaction.deleteMany()
    await db.portfolio.deleteMany()
    await db.stock.deleteMany()

    // Create demo user (delete if exists first)
    await db.user.deleteMany({ where: { phone: '081234567890' } })

    const hashedPassword = await hashPassword('demo123')
    await db.user.create({
      data: {
        name: 'Demo User',
        phone: '081234567890',
        password: hashedPassword,
        balance: 100000000, // Rp 100,000,000
        role: 'investor',
      },
    })

    // Create stock data
    const stockData = [
      { code: 'BBCA', name: 'Bank Central Asia Tbk', price: 9875, change: 75, changePercent: 0.77, high: 9950, low: 9800, volume: 15234500, marketCap: 1218000000000000, category: 'bluechip' },
      { code: 'BBRI', name: 'Bank Rakyat Indonesia Tbk', price: 5825, change: -25, changePercent: -0.43, high: 5900, low: 5800, volume: 23456700, marketCap: 876000000000000, category: 'bluechip' },
      { code: 'TLKM', name: 'Telkom Indonesia Tbk', price: 3940, change: 40, changePercent: 1.02, high: 3980, low: 3900, volume: 18765400, marketCap: 389000000000000, category: 'bluechip' },
      { code: 'ASII', name: 'Astra International Tbk', price: 5350, change: -50, changePercent: -0.93, high: 5450, low: 5300, volume: 9876500, marketCap: 216000000000000, category: 'bluechip' },
      { code: 'BMRI', name: 'Bank Mandiri Tbk', price: 6250, change: 100, changePercent: 1.63, high: 6300, low: 6150, volume: 12345600, marketCap: 583000000000000, category: 'bluechip' },
      { code: 'UNVR', name: 'Unilever Indonesia Tbk', price: 2870, change: -30, changePercent: -1.03, high: 2920, low: 2850, volume: 5678900, marketCap: 109000000000000, category: 'bluechip' },
      { code: 'GOTO', name: 'GoTo Gojek Tokopedia Tbk', price: 74, change: 2, changePercent: 2.78, high: 76, low: 72, volume: 45678900, marketCap: 87000000000000, category: 'tech' },
      { code: 'BUKA', name: 'Bukalapak.com Tbk', price: 106, change: -1, changePercent: -0.94, high: 108, low: 104, volume: 12345600, marketCap: 10600000000000, category: 'tech' },
      { code: 'ARTO', name: 'Bank Jago Tbk', price: 478, change: 12, changePercent: 2.57, high: 485, low: 466, volume: 8765400, marketCap: 52600000000000, category: 'banking' },
      { code: 'BREN', name: 'Barito Renewables Energy Tbk', price: 1260, change: -40, changePercent: -3.08, high: 1310, low: 1240, volume: 6543200, marketCap: 168000000000000, category: 'energy' },
      { code: 'EMTK', name: 'Elang Mahkota Teknologi Tbk', price: 446, change: 6, changePercent: 1.36, high: 452, low: 440, volume: 4321000, marketCap: 26700000000000, category: 'media' },
      { code: 'ICBP', name: 'Indofood CBP Sukses Makmur Tbk', price: 11350, change: 150, changePercent: 1.34, high: 11450, low: 11200, volume: 3456700, marketCap: 131000000000000, category: 'consumer' },
    ]

    for (const stock of stockData) {
      await db.stock.create({ data: stock })

      // Generate 60 days of price history
      const historyEntries = []
      const basePrice = stock.price
      for (let i = 60; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        date.setHours(9 + Math.floor(Math.random() * 7), Math.floor(Math.random() * 60), 0, 0)
        const randomChange = (Math.random() - 0.5) * 0.04
        const historyPrice = Math.round(basePrice * (1 + randomChange))
        historyEntries.push({
          stockCode: stock.code,
          price: historyPrice,
          timestamp: date,
        })
      }
      await db.stockPriceHistory.createMany({ data: historyEntries })
    }

    // Give demo user some initial portfolio
    const demoUser = await db.user.findUnique({ where: { phone: '081234567890' } })
    if (demoUser) {
      const bbca = await db.stock.findUnique({ where: { code: 'BBCA' } })
      const tlkm = await db.stock.findUnique({ where: { code: 'TLKM' } })
      const bbri = await db.stock.findUnique({ where: { code: 'BBRI' } })

      if (bbca) {
        await db.portfolio.create({
          data: {
            userId: demoUser.id,
            stockId: bbca.id,
            shares: 100,
            avgPrice: 9750,
          },
        })
        await db.transaction.create({
          data: {
            userId: demoUser.id,
            stockId: bbca.id,
            type: 'BUY',
            shares: 100,
            price: 9750,
            total: 975000,
            status: 'completed',
          },
        })
      }

      if (tlkm) {
        await db.portfolio.create({
          data: {
            userId: demoUser.id,
            stockId: tlkm.id,
            shares: 500,
            avgPrice: 3850,
          },
        })
        await db.transaction.create({
          data: {
            userId: demoUser.id,
            stockId: tlkm.id,
            type: 'BUY',
            shares: 500,
            price: 3850,
            total: 1925000,
            status: 'completed',
          },
        })
      }

      if (bbri) {
        await db.portfolio.create({
          data: {
            userId: demoUser.id,
            stockId: bbri.id,
            shares: 200,
            avgPrice: 5750,
          },
        })
        await db.transaction.create({
          data: {
            userId: demoUser.id,
            stockId: bbri.id,
            type: 'BUY',
            shares: 200,
            price: 5750,
            total: 1150000,
            status: 'completed',
          },
        })
      }
    }

    return NextResponse.json({
      message: 'Database seeded successfully',
      stocksCreated: stockData.length,
      demoUser: { phone: '081234567890', password: 'demo123' },
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: 'Failed to seed database' },
      { status: 500 }
    )
  }
}
