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
    { code: 'BBCA', name: 'Bank Central Asia Tbk', price: 9875, change: 75, changePercent: 0.77, open: 9800, high: 9950, low: 9800, volume: 15234500, marketCap: 1218000000000000, category: 'bluechip', sector: 'Perbankan', description: 'Bank swasta terbesar di Indonesia dengan jaringan luas dan kinerja keuangan yang konsisten.', peRatio: 22.5, pbv: 4.2, dividendYield: 2.1, lotSize: 100 },
    { code: 'BBRI', name: 'Bank Rakyat Indonesia Tbk', price: 5825, change: -25, changePercent: -0.43, open: 5850, high: 5900, low: 5800, volume: 23456700, marketCap: 876000000000000, category: 'bluechip', sector: 'Perbankan', description: 'Bank BUMN terbesar dengan fokus pada UMKM dan jaringan terluas di Indonesia.', peRatio: 12.8, pbv: 2.1, dividendYield: 5.3, lotSize: 100 },
    { code: 'TLKM', name: 'Telkom Indonesia Tbk', price: 3940, change: 40, changePercent: 1.02, open: 3900, high: 3980, low: 3900, volume: 18765400, marketCap: 389000000000000, category: 'bluechip', sector: 'Telekomunikasi', description: 'Perusahaan telekomunikasi terbesar di Indonesia dengan layanan IndiHome dan Telkomsel.', peRatio: 15.3, pbv: 2.8, dividendYield: 4.5, lotSize: 100 },
    { code: 'ASII', name: 'Astra International Tbk', price: 5350, change: -50, changePercent: -0.93, open: 5400, high: 5450, low: 5300, volume: 9876500, marketCap: 216000000000000, category: 'bluechip', sector: 'Otomotif', description: 'Konglomerasi terbesar di Indonesia dengan bisnis otomotif, pertambangan, dan agribisnis.', peRatio: 10.5, pbv: 1.8, dividendYield: 4.8, lotSize: 100 },
    { code: 'BMRI', name: 'Bank Mandiri Tbk', price: 6250, change: 100, changePercent: 1.63, open: 6150, high: 6300, low: 6150, volume: 12345600, marketCap: 583000000000000, category: 'bluechip', sector: 'Perbankan', description: 'Bank BUMN dengan aset terbesar di Indonesia, fokus pada korporasi dan wholesale banking.', peRatio: 11.2, pbv: 1.9, dividendYield: 4.1, lotSize: 100 },
    { code: 'UNVR', name: 'Unilever Indonesia Tbk', price: 2870, change: -30, changePercent: -1.03, open: 2900, high: 2920, low: 2850, volume: 5678900, marketCap: 109000000000000, category: 'bluechip', sector: 'Konsumer', description: 'Perusahaan consumer goods multinasional dengan brand-brand terkenal di Indonesia.', peRatio: 25.7, pbv: 8.5, dividendYield: 3.2, lotSize: 100 },
    { code: 'GOTO', name: 'GoTo Gojek Tokopedia Tbk', price: 74, change: 2, changePercent: 2.78, open: 72, high: 76, low: 72, volume: 45678900, marketCap: 87000000000000, category: 'tech', sector: 'Teknologi', description: 'Perusahaan teknologi terbesar di Indonesia dengan ekosistem on-demand dan e-commerce.', peRatio: -45.2, pbv: 3.5, dividendYield: 0, lotSize: 100 },
    { code: 'BUKA', name: 'Bukalapak.com Tbk', price: 106, change: -1, changePercent: -0.94, open: 107, high: 108, low: 104, volume: 12345600, marketCap: 10600000000000, category: 'tech', sector: 'Teknologi', description: 'Platform e-commerce Indonesia yang fokus pada pemberdayaan UMKM dan mitra retail.', peRatio: -28.3, pbv: 2.1, dividendYield: 0, lotSize: 100 },
    { code: 'ARTO', name: 'Bank Jago Tbk', price: 478, change: 12, changePercent: 2.57, open: 466, high: 485, low: 466, volume: 8765400, marketCap: 52600000000000, category: 'banking', sector: 'Perbankan', description: 'Bank digital terdepan di Indonesia dengan pendekatan berbasis teknologi dan ekosistem digital.', peRatio: 35.6, pbv: 5.2, dividendYield: 0.5, lotSize: 100 },
    { code: 'BREN', name: 'Barito Renewables Energy Tbk', price: 1260, change: -40, changePercent: -3.08, open: 1300, high: 1310, low: 1240, volume: 6543200, marketCap: 168000000000000, category: 'energy', sector: 'Energi', description: 'Perusahaan energi terbarukan terbesar di Indonesia dengan fokus pada geothermal dan hidro.', peRatio: 42.1, pbv: 6.8, dividendYield: 0.8, lotSize: 100 },
    { code: 'EMTK', name: 'Elang Mahkota Teknologi Tbk', price: 446, change: 6, changePercent: 1.36, open: 440, high: 452, low: 440, volume: 4321000, marketCap: 26700000000000, category: 'media', sector: 'Media', description: 'Grup media terbesar di Indonesia dengan Surya Citra Media dan jaringan televisi luas.', peRatio: 14.2, pbv: 2.3, dividendYield: 3.5, lotSize: 100 },
    { code: 'ICBP', name: 'Indofood CBP Sukses Makmur Tbk', price: 11350, change: 150, changePercent: 1.34, open: 11200, high: 11450, low: 11200, volume: 3456700, marketCap: 131000000000000, category: 'consumer', sector: 'Konsumer', description: 'Produsen makanan dan minuman terbesar di Indonesia dengan brand Indomie dan lainnya.', peRatio: 18.9, pbv: 5.6, dividendYield: 2.8, lotSize: 100 },
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
        open: stock.open,
        high: Math.max(historyPrice, stock.high),
        low: Math.min(historyPrice, stock.low),
        volume: stock.volume,
        timestamp: date,
      })
    }
    await db.stockPriceHistory.createMany({ data: historyEntries })
  }
}
