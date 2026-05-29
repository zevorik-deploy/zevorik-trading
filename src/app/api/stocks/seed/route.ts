import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = 'GS'
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function POST() {
  try {
    // Clear existing data
    await db.stockPriceHistory.deleteMany()
    await db.transaction.deleteMany()
    await db.portfolio.deleteMany()
    await db.watchlist.deleteMany()
    await db.notification.deleteMany()
    await db.referral.deleteMany()
    await db.deposit.deleteMany()
    await db.withdrawal.deleteMany()
    await db.news.deleteMany()
    await db.marketIndex.deleteMany()
    await db.stock.deleteMany()
    await db.user.deleteMany()

    // Create demo user with referral code
    const hashedPassword = await hashPassword('demo123')
    const demoUser = await db.user.create({
      data: {
        name: 'Demo User',
        phone: '081234567890',
        password: hashedPassword,
        balance: 100000000, // Rp 100,000,000
        role: 'investor',
        referralCode: generateReferralCode(),
        email: 'demo@globalstocks.id',
        bankName: 'Bank BCA',
        bankAccount: '1234567890',
        bankHolder: 'Demo User',
      },
    })

    // Create Market Indices
    const marketIndices = [
      { code: 'IHSG', name: 'Indeks Harga Saham Gabungan', value: 7245.83, change: 23.45, changePercent: 0.32 },
      { code: 'LQ45', name: 'Indeks LQ45', value: 983.56, change: -5.12, changePercent: -0.52 },
      { code: 'JII', name: 'Jakarta Islamic Index', value: 498.72, change: 8.34, changePercent: 1.70 },
      { code: 'KOMPAS100', name: 'Indeks KOMPAS100', value: 1256.89, change: 12.67, changePercent: 1.02 },
      { code: 'IDX30', name: 'Indeks IDX30', value: 512.34, change: -3.21, changePercent: -0.62 },
    ]

    for (const index of marketIndices) {
      await db.marketIndex.create({ data: index })
    }

    // Create News entries
    const newsData = [
      {
        title: 'IHSG Menguat di Tengah Sentimen Positif Pasar Global',
        content: 'Indeks Harga Saham Gabungan (IHSG) berhasil ditutup menguat pada perdagangan hari ini seiring dengan sentimen positif dari pasar global. Penguatan ini didorong oleh data ekonomi AS yang lebih baik dari ekspektasi dan optimisme terhadap pemulihan ekonomi global. Sektor perbankan dan konsumer menjadi kontributor utama penguatan indeks.',
        category: 'market',
        isPublished: true,
      },
      {
        title: 'Bank Indonesia Pertahankan Suku Bunga Acuan di 6%',
        content: 'Bank Indonesia memutuskan untuk mempertahankan suku bunga acuan BI Rate di level 6% pada Rapat Dewan Gubernur bulanan. Keputusan ini diambil untuk menjaga stabilitas nilai tukar rupiah dan mengendalikan inflasi yang masih berada dalam target. BI akan terus memantau perkembangan ekonomi global dan domestik untuk kebijakan mendatang.',
        category: 'market',
        isPublished: true,
      },
      {
        title: 'BBCA Catat Laba Bersih Rp 42,3 Triliun Sepanjang 2024',
        content: 'PT Bank Central Asia Tbk (BBCA) berhasil mencatatkan laba bersih sebesar Rp 42,3 triliun sepanjang tahun 2024, tumbuh 8,5% dibandingkan tahun sebelumnya. Pencapaian ini didorong oleh pertumbuhan kredit yang sehat dan peningkatan fee-based income. NIM bank ini terjaga di level 5,8% menunjukkan efisiensi yang baik dalam pengelolaan dana.',
        category: 'company',
        isPublished: true,
      },
      {
        title: 'Tips Investasi Saham untuk Pemula: Mulai dari Sekarang!',
        content: 'Investasi saham menjadi salah satu cara yang efektif untuk membangun kekayaan jangka panjang. Bagi pemula, penting untuk memahami dasar-dasar investasi saham termasuk analisis fundamental dan teknikal. Diversifikasi portofolio, investasi secara rutin, dan tidak terpancing emosi adalah kunci sukses berinvestasi saham. Mulailah dengan modal kecil dan tingkatkan secara bertahap.',
        category: 'education',
        isPublished: true,
      },
      {
        title: 'Sektor Energi Siap Berkinerja Positif di 2025',
        content: 'Analis memproyeksikan sektor energi akan berkinerja positif sepanjang 2025 didorong oleh kenaikan harga komoditas dan peningkatan permintaan domestik. Perusahaan-perusahaan di sektor energi terbarukan juga dinilai memiliki potensi pertumbuhan yang tinggi seiring dengan transisi energi yang terus berlangsung. Barito Renewables dan Surya Esa Perkasa menjadi sorotan investor.',
        category: 'market',
        isPublished: true,
      },
      {
        title: 'Pembaruan Sistem Trading: Fitur Baru untuk Pengalaman Lebih Baik',
        content: 'Kami dengan bangga memperkenalkan pembaruan sistem trading terbaru kami. Fitur-fitur baru meliputi real-time market data, charting yang lebih canggih, dan sistem notifikasi yang lebih responsif. Update ini dirancang untuk memberikan pengalaman trading yang lebih baik dan efisien bagi seluruh pengguna.',
        category: 'system',
        isPublished: true,
      },
    ]

    for (const news of newsData) {
      await db.news.create({ data: news })
    }

    // Create Notifications for demo user
    const notifications = [
      { userId: demoUser.id, title: 'Selamat Datang!', message: 'Selamat datang di Global Stocks! Mulai investasi Anda sekarang.', type: 'system' },
      { userId: demoUser.id, title: 'Deposit Berhasil', message: 'Deposit sebesar Rp 100.000.000 telah berhasil dikreditkan ke akun Anda.', type: 'deposit' },
      { userId: demoUser.id, title: 'Saham BBCA Naik', message: 'Saham BBCA yang Anda miliki naik 0.77% hari ini.', type: 'trade' },
      { userId: demoUser.id, title: 'Promo Referral', message: 'Ajak teman bergabung dan dapatkan bonus referral hingga Rp 50.000 per teman!', type: 'alert' },
      { userId: demoUser.id, title: 'Laporan Mingguan', message: 'Portofolio Anda tumbuh 2.3% minggu ini. Lihat detailnya di halaman portofolio.', type: 'info' },
    ]

    for (const notif of notifications) {
      await db.notification.create({ data: notif })
    }

    // Create stock data with new fields
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
          open: stock.open,
          high: Math.max(historyPrice, stock.high),
          low: Math.min(historyPrice, stock.low),
          volume: stock.volume,
          timestamp: date,
        })
      }
      await db.stockPriceHistory.createMany({ data: historyEntries })
    }

    // Give demo user some initial portfolio
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

    return NextResponse.json({
      message: 'Database seeded successfully',
      stocksCreated: stockData.length,
      marketIndicesCreated: marketIndices.length,
      newsCreated: newsData.length,
      notificationsCreated: notifications.length,
      demoUser: { phone: '081234567890', password: 'demo123', referralCode: demoUser.referralCode },
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: 'Failed to seed database' },
      { status: 500 }
    )
  }
}
