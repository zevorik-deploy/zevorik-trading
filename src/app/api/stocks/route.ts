import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Auto-seed if no stocks exist
    const stockCount = await db.stock.count()
    if (stockCount === 0) {
      await seedStocks()
    }

    const stocks = await db.stock.findMany({
      orderBy: { code: 'asc' },
    })

    return NextResponse.json({ stocks })
  } catch (error) {
    console.error('Get stocks error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stocks' },
      { status: 500 }
    )
  }
}

async function seedStocks() {
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

    // Create initial price history
    const historyEntries = []
    const basePrice = stock.price
    for (let i = 30; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(9, 0, 0, 0)
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
}
