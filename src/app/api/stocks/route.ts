import { NextRequest, NextResponse } from 'next/server'
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, name, price, category, sector, description } = body

    if (!code || !name || !price) {
      return NextResponse.json(
        { error: 'code, name, and price are required' },
        { status: 400 }
      )
    }

    const existing = await db.stock.findUnique({ where: { code } })
    if (existing) {
      return NextResponse.json(
        { error: 'Stock code already exists' },
        { status: 409 }
      )
    }

    const stock = await db.stock.create({
      data: {
        code,
        name,
        price,
        category: category || 'bluechip',
        sector: sector || null,
        description: description || null,
        open: price,
        high: price,
        low: price,
      },
    })

    return NextResponse.json({ stock }, { status: 201 })
  } catch (error) {
    console.error('Create stock error:', error)
    return NextResponse.json(
      { error: 'Failed to create stock' },
      { status: 500 }
    )
  }
}

async function seedStocks() {
  const stockData = [
    // Banking
    { code: 'BBCA', name: 'Bank Central Asia Tbk', price: 9875, change: 75, changePercent: 0.77, open: 9800, high: 9950, low: 9800, volume: 15234500, marketCap: 1218000000000000, category: 'bluechip', sector: 'Perbankan', description: 'Bank swasta terbesar di Indonesia dengan jaringan luas dan kinerja keuangan yang konsisten.', peRatio: 22.5, pbv: 4.2, dividendYield: 2.1, lotSize: 100 },
    { code: 'BBRI', name: 'Bank Rakyat Indonesia Tbk', price: 5825, change: -25, changePercent: -0.43, open: 5850, high: 5900, low: 5800, volume: 23456700, marketCap: 876000000000000, category: 'bluechip', sector: 'Perbankan', description: 'Bank BUMN terbesar dengan fokus pada UMKM dan jaringan terluas di Indonesia.', peRatio: 12.8, pbv: 2.1, dividendYield: 5.3, lotSize: 100 },
    { code: 'BMRI', name: 'Bank Mandiri Tbk', price: 6250, change: 100, changePercent: 1.63, open: 6150, high: 6300, low: 6150, volume: 12345600, marketCap: 583000000000000, category: 'bluechip', sector: 'Perbankan', description: 'Bank BUMN dengan aset terbesar di Indonesia, fokus pada korporasi dan wholesale banking.', peRatio: 11.2, pbv: 1.9, dividendYield: 4.1, lotSize: 100 },
    { code: 'BBNI', name: 'Bank Negara Indonesia Tbk', price: 4850, change: 50, changePercent: 1.04, open: 4800, high: 4900, low: 4780, volume: 8765400, marketCap: 243000000000000, category: 'banking', sector: 'Perbankan', description: 'Bank BUMN dengan fokus pada perdagangan internasional dan korporasi.', peRatio: 10.8, pbv: 1.7, dividendYield: 4.5, lotSize: 100 },
    { code: 'ARTO', name: 'Bank Jago Tbk', price: 478, change: 12, changePercent: 2.57, open: 466, high: 485, low: 466, volume: 8765400, marketCap: 52600000000000, category: 'banking', sector: 'Perbankan', description: 'Bank digital terdepan di Indonesia dengan pendekatan berbasis teknologi dan ekosistem digital.', peRatio: 35.6, pbv: 5.2, dividendYield: 0.5, lotSize: 100 },
    { code: 'BBTN', name: 'Bank Tabungan Negara Tbk', price: 1425, change: -15, changePercent: -1.04, open: 1440, high: 1445, low: 1415, volume: 15678000, marketCap: 135000000000000, category: 'banking', sector: 'Perbankan', description: 'Bank BUMN yang fokus pada pembiayaan perumahan dan tabungan.', peRatio: 9.5, pbv: 1.4, dividendYield: 3.8, lotSize: 100 },
    { code: 'BRIS', name: 'Bank Syariah Indonesia Tbk', price: 2560, change: 40, changePercent: 1.59, open: 2520, high: 2580, low: 2510, volume: 6543200, marketCap: 107000000000000, category: 'banking', sector: 'Perbankan', description: 'Bank syariah terbesar di Indonesia dengan jaringan luas dan produk inovatif.', peRatio: 18.2, pbv: 3.1, dividendYield: 2.5, lotSize: 100 },

    // Telekomunikasi & Tech
    { code: 'TLKM', name: 'Telkom Indonesia Tbk', price: 3940, change: 40, changePercent: 1.02, open: 3900, high: 3980, low: 3900, volume: 18765400, marketCap: 389000000000000, category: 'bluechip', sector: 'Telekomunikasi', description: 'Perusahaan telekomunikasi terbesar di Indonesia dengan layanan IndiHome dan Telkomsel.', peRatio: 15.3, pbv: 2.8, dividendYield: 4.5, lotSize: 100 },
    { code: 'GOTO', name: 'GoTo Gojek Tokopedia Tbk', price: 74, change: 2, changePercent: 2.78, open: 72, high: 76, low: 72, volume: 45678900, marketCap: 87000000000000, category: 'tech', sector: 'Teknologi', description: 'Perusahaan teknologi terbesar di Indonesia dengan ekosistem on-demand dan e-commerce.', peRatio: -45.2, pbv: 3.5, dividendYield: 0, lotSize: 100 },
    { code: 'BUKA', name: 'Bukalapak.com Tbk', price: 106, change: -1, changePercent: -0.94, open: 107, high: 108, low: 104, volume: 12345600, marketCap: 10600000000000, category: 'tech', sector: 'Teknologi', description: 'Platform e-commerce Indonesia yang fokus pada pemberdayaan UMKM dan mitra retail.', peRatio: -28.3, pbv: 2.1, dividendYield: 0, lotSize: 100 },
    { code: 'EMTK', name: 'Elang Mahkota Teknologi Tbk', price: 446, change: 6, changePercent: 1.36, open: 440, high: 452, low: 440, volume: 4321000, marketCap: 26700000000000, category: 'media', sector: 'Media', description: 'Grup media terbesar di Indonesia dengan Surya Citra Media dan jaringan televisi luas.', peRatio: 14.2, pbv: 2.3, dividendYield: 3.5, lotSize: 100 },
    { code: 'DCRU', name: 'DCI Indonesia Tbk', price: 385, change: 15, changePercent: 4.05, open: 370, high: 390, low: 368, volume: 5678000, marketCap: 42000000000000, category: 'tech', sector: 'Teknologi', description: 'Penyedia layanan data center terbesar di Indonesia dengan koneksi internet berkualitas tinggi.', peRatio: 28.5, pbv: 4.1, dividendYield: 1.2, lotSize: 100 },

    // Konsumer
    { code: 'ICBP', name: 'Indofood CBP Sukses Makmur Tbk', price: 11350, change: 150, changePercent: 1.34, open: 11200, high: 11450, low: 11200, volume: 3456700, marketCap: 131000000000000, category: 'consumer', sector: 'Konsumer', description: 'Produsen makanan dan minuman terbesar di Indonesia dengan brand Indomie dan lainnya.', peRatio: 18.9, pbv: 5.6, dividendYield: 2.8, lotSize: 100 },
    { code: 'UNVR', name: 'Unilever Indonesia Tbk', price: 2870, change: -30, changePercent: -1.03, open: 2900, high: 2920, low: 2850, volume: 5678900, marketCap: 109000000000000, category: 'consumer', sector: 'Konsumer', description: 'Perusahaan consumer goods multinasional dengan brand-brand terkenal di Indonesia.', peRatio: 25.7, pbv: 8.5, dividendYield: 3.2, lotSize: 100 },
    { code: 'INDF', name: 'Indofood Sukses Makmur Tbk', price: 6850, change: 75, changePercent: 1.11, open: 6775, high: 6925, low: 6750, volume: 4567800, marketCap: 82600000000000, category: 'consumer', sector: 'Konsumer', description: 'Konglomerasi makanan terbesar di Indonesia dengan produk Indomie, Bogasari, dan agribisnis.', peRatio: 14.2, pbv: 3.5, dividendYield: 3.8, lotSize: 100 },
    { code: 'ACES', name: 'Aspirasi Hidup Indonesia Tbk', price: 670, change: -8, changePercent: -1.18, open: 678, high: 685, low: 665, volume: 5678000, marketCap: 24000000000000, category: 'consumer', sector: 'Retail', description: 'Ritel peralatan rumah tangga dan gaya hidup terbesar dengan jaringan Ace Hardware.', peRatio: 20.3, pbv: 4.8, dividendYield: 2.1, lotSize: 100 },
    { code: 'ERAA', name: 'Erajaya Swasembada Tbk', price: 488, change: 12, changePercent: 2.52, open: 476, high: 495, low: 475, volume: 8765000, marketCap: 18500000000000, category: 'consumer', sector: 'Retail', description: 'Distributor dan retailer gadget terbesar di Indonesia dengan brand Erafone dan lainnya.', peRatio: 8.5, pbv: 1.9, dividendYield: 5.2, lotSize: 100 },

    // Otomotif & Industri
    { code: 'ASII', name: 'Astra International Tbk', price: 5350, change: -50, changePercent: -0.93, open: 5400, high: 5450, low: 5300, volume: 9876500, marketCap: 216000000000000, category: 'bluechip', sector: 'Otomotif', description: 'Konglomerasi terbesar di Indonesia dengan bisnis otomotif, pertambangan, dan agribisnis.', peRatio: 10.5, pbv: 1.8, dividendYield: 4.8, lotSize: 100 },
    { code: 'AUTO', name: 'Astra Otoparts Tbk', price: 1620, change: 25, changePercent: 1.57, open: 1595, high: 1640, low: 1590, volume: 3456000, marketCap: 19400000000000, category: 'consumer', sector: 'Otomotif', description: 'Produsen dan distributor suku cadang otomotif terbesar di Indonesia.', peRatio: 12.3, pbv: 2.1, dividendYield: 4.2, lotSize: 100 },

    // Energi & Mining
    { code: 'BREN', name: 'Barito Renewables Energy Tbk', price: 1260, change: -40, changePercent: -3.08, open: 1300, high: 1310, low: 1240, volume: 6543200, marketCap: 168000000000000, category: 'energy', sector: 'Energi', description: 'Perusahaan energi terbaruan terbesar di Indonesia dengan fokus pada geothermal dan hidro.', peRatio: 42.1, pbv: 6.8, dividendYield: 0.8, lotSize: 100 },
    { code: 'ADRO', name: 'Adaro Energy Indonesia Tbk', price: 2890, change: 45, changePercent: 1.58, open: 2845, high: 2920, low: 2830, volume: 7890000, marketCap: 95400000000000, category: 'mining', sector: 'Pertambangan', description: 'Produsen batu bara termal terbesar kedua di Indonesia dengan operasi di Kalimantan.', peRatio: 6.8, pbv: 1.9, dividendYield: 8.5, lotSize: 100 },
    { code: 'PTBA', name: 'Bukit Asam Tbk', price: 2650, change: -35, changePercent: -1.30, open: 2685, high: 2700, low: 2630, volume: 4567000, marketCap: 32500000000000, category: 'mining', sector: 'Pertambangan', description: 'Perusahaan tambang batu bara BUMN dengan cadangan terbesar di Sumatera.', peRatio: 5.2, pbv: 1.3, dividendYield: 10.2, lotSize: 100 },
    { code: 'MDKA', name: 'Merdeka Copper Gold Tbk', price: 5850, change: 100, changePercent: 1.74, open: 5750, high: 5900, low: 5720, volume: 3456000, marketCap: 64200000000000, category: 'mining', sector: 'Pertambangan', description: 'Perusahaan pertambangan emas dan tembaga dengan operasi di Indonesia Timur.', peRatio: 15.8, pbv: 2.5, dividendYield: 1.5, lotSize: 100 },
    { code: 'ANTM', name: 'Aneka Tambang Tbk', price: 1685, change: 20, changePercent: 1.20, open: 1665, high: 1700, low: 1655, volume: 6789000, marketCap: 40500000000000, category: 'mining', sector: 'Pertambangan', description: 'Perusahaan tambang BUMN dengan produk emas, nikel, dan bauksit.', peRatio: 8.9, pbv: 1.6, dividendYield: 3.5, lotSize: 100 },

    // Properti & Infrastruktur
    { code: 'BSDE', name: 'Bumi Serpong Damai Tbk', price: 1080, change: 15, changePercent: 1.41, open: 1065, high: 1090, low: 1060, volume: 9876000, marketCap: 26800000000000, category: 'property', sector: 'Properti', description: 'Pengembang properti terbesar di Indonesia dengan proyek BSD City.', peRatio: 12.5, pbv: 1.2, dividendYield: 3.2, lotSize: 100 },
    { code: 'CTRA', name: 'Ciputra Development Tbk', price: 1150, change: -10, changePercent: -0.86, open: 1160, high: 1165, low: 1145, volume: 5678000, marketCap: 23400000000000, category: 'property', sector: 'Properti', description: 'Pengembang properti terkemuka dengan proyek CitraLand di berbagai kota.', peRatio: 10.8, pbv: 1.0, dividendYield: 4.5, lotSize: 100 },
    { code: 'WIKA', name: 'Wijaya Karya Tbk', price: 580, change: 8, changePercent: 1.40, open: 572, high: 585, low: 570, volume: 12345000, marketCap: 17800000000000, category: 'infrastructure', sector: 'Infrastruktur', description: 'Perusahaan konstruksi BUMN terkemuka dengan proyek infrastruktur besar.', peRatio: 15.2, pbv: 1.4, dividendYield: 2.8, lotSize: 100 },
    { code: 'UNTR', name: 'United Tractors Tbk', price: 27500, change: 350, changePercent: 1.29, open: 27150, high: 27800, low: 27000, volume: 2345000, marketCap: 93500000000000, category: 'infrastructure', sector: 'Infrastruktur', description: 'Distributor alat berat terbesar dengan bisnis pertambangan dan konstruksi.', peRatio: 7.5, pbv: 1.8, dividendYield: 6.2, lotSize: 100 },

    // Healthcare
    { code: 'KLBF', name: 'Kalbe Farma Tbk', price: 1675, change: 25, changePercent: 1.52, open: 1650, high: 1685, low: 1645, volume: 8765000, marketCap: 71500000000000, category: 'healthcare', sector: 'Kesehatan', description: 'Perusahaan farmasi terbesar di Indonesia dengan produk obat dan suplemen kesehatan.', peRatio: 18.5, pbv: 4.2, dividendYield: 2.5, lotSize: 100 },
    { code: 'SIDO', name: 'Industri Jamu dan Farmasi Sido Muncul Tbk', price: 780, change: -5, changePercent: -0.64, open: 785, high: 790, low: 775, volume: 3456000, marketCap: 18700000000000, category: 'healthcare', sector: 'Kesehatan', description: 'Produsen jamu dan herbal terbesar di Indonesia dengan brand Tolak Angin.', peRatio: 22.1, pbv: 5.8, dividendYield: 3.2, lotSize: 100 },
    { code: 'HEAL', name: 'Medikaloka Hermipro Tbk', price: 156, change: 4, changePercent: 2.63, open: 152, high: 158, low: 151, volume: 5678000, marketCap: 8900000000000, category: 'healthcare', sector: 'Kesehatan', description: 'Operator rumah sakit dan klinik dengan jaringan Hermina di seluruh Indonesia.', peRatio: 32.5, pbv: 3.8, dividendYield: 0.8, lotSize: 100 },

    // Infrastruktur & Utilitas
    { code: 'TOWR', name: 'Sarana Menara Nusantara Tbk', price: 875, change: 18, changePercent: 2.10, open: 857, high: 885, low: 855, volume: 6543000, marketCap: 46700000000000, category: 'infrastructure', sector: 'Infrastruktur', description: 'Operator menara telekomunikasi terbesar di Indonesia dengan jaringan luas.', peRatio: 16.8, pbv: 3.2, dividendYield: 2.8, lotSize: 100 },
    { code: 'PGAS', name: 'Perusahaan Gas Negara Tbk', price: 2590, change: -30, changePercent: -1.15, open: 2620, high: 2635, low: 2575, volume: 5678000, marketCap: 61200000000000, category: 'energy', sector: 'Energi', description: 'Perusahaan gas BUMN terbesar yang mendistribusikan gas alam di Indonesia.', peRatio: 8.5, pbv: 1.5, dividendYield: 6.8, lotSize: 100 },
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

  // Seed market indices if empty
  const indexCount = await db.marketIndex.count()
  if (indexCount === 0) {
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
  }

  // Seed news if empty
  const newsCount = await db.news.count()
  if (newsCount === 0) {
    const newsData = [
      { title: 'IHSG Menguat di Tengah Sentimen Positif Pasar Global', content: 'Indeks Harga Saham Gabungan (IHSG) berhasil ditutup menguat pada perdagangan hari ini seiring dengan sentimen positif dari pasar global. Penguatan ini didorong oleh data ekonomi AS yang lebih baik dari ekspektasi dan optimisme terhadap pemulihan ekonomi global. Sektor perbankan dan konsumer menjadi kontributor utama penguatan indeks.', category: 'market', isPublished: true },
      { title: 'Bank Indonesia Pertahankan Suku Bunga Acuan di 6%', content: 'Bank Indonesia memutuskan untuk mempertahankan suku bunga acuan BI Rate di level 6% pada Rapat Dewan Gubernur bulanan. Keputusan ini diambil untuk menjaga stabilitas nilai tukar rupiah dan mengendalikan inflasi yang masih berada dalam target. BI akan terus memantau perkembangan ekonomi global dan domestik untuk kebijakan mendatang.', category: 'market', isPublished: true },
      { title: 'BBCA Catat Laba Bersih Rp 42,3 Triliun Sepanjang 2024', content: 'PT Bank Central Asia Tbk (BBCA) berhasil mencatatkan laba bersih sebesar Rp 42,3 triliun sepanjang tahun 2024, tumbuh 8,5% dibandingkan tahun sebelumnya. Pencapaian ini didorong oleh pertumbuhan kredit yang sehat dan peningkatan fee-based income.', category: 'company', isPublished: true },
      { title: 'Tips Investasi Saham untuk Pemula: Mulai dari Sekarang!', content: 'Investasi saham menjadi salah satu cara yang efektif untuk membangun kekayaan jangka panjang. Bagi pemula, penting untuk memahami dasar-dasar investasi saham termasuk analisis fundamental dan teknikal. Diversifikasi portofolio, investasi secara rutin, dan tidak terpancing emosi adalah kunci sukses berinvestasi saham.', category: 'education', isPublished: true },
      { title: 'Sektor Energi Siap Berkinerja Positif di 2025', content: 'Analis memproyeksikan sektor energi akan berkinerja positif sepanjang 2025 didorong oleh kenaikan harga komoditas dan peningkatan permintaan domestik. Perusahaan-perusahaan di sektor energi terbarukan juga dinilai memiliki potensi pertumbuhan yang tinggi.', category: 'market', isPublished: true },
      { title: 'Pembaruan Sistem Trading: Fitur Baru untuk Pengalaman Lebih Baik', content: 'Kami dengan bangga memperkenalkan pembaruan sistem trading terbaru kami. Fitur-fitur baru meliputi real-time market data, charting yang lebih canggih, dan sistem notifikasi yang lebih responsif.', category: 'system', isPublished: true },
      { title: 'Saham Teknologi Indonesia Prospektif di Era Digital', content: 'Sektor teknologi Indonesia diprediksi akan terus tumbuh seiring dengan peningkatan adopsi digital. Perusahaan-perusahaan seperti GoTo dan DCI Indonesia menunjukkan potensi pertumbuhan yang menjanjikan.', category: 'market', isPublished: true },
      { title: 'BBRI Luncurkan Program Pinjaman UMKM Baru', content: 'Bank Rakyat Indonesia meluncurkan program pinjaman khusus untuk UMKM dengan bunga ringan dan proses cepat. Program ini diharapkan mendorong pertumbuhan sektor usaha kecil dan menengah di Indonesia.', category: 'company', isPublished: true },
      { title: 'Rupiah Menguat di Tengah Arus Modal Asing Masuk', content: 'Mata uang rupiah menguat terhadap dolar AS seiring dengan masuknya arus modal asing ke pasar saham Indonesia. Penguatan ini juga didukung oleh stabilnya ekonomi domestik dan harga komoditas yang menguat.', category: 'market', isPublished: true },
      { title: 'Sektor Pertambangan Emas Berkinerja Cemerlang', content: 'Saham-saham sektor pertambangan emas menunjukkan kinerja yang cemerlang sepanjang kuartal ini. Harga emas dunia yang terus memecahkan rekor tertinggi menjadi pendorong utama kenaikan saham-saham di sektor ini.', category: 'market', isPublished: true },
      { title: 'Belajar Analisis Teknikal: Fibonacci Retracement', content: 'Fibonacci Retracement adalah salah satu tools analisis teknikal yang populer digunakan trader untuk menentukan level support dan resistance. Tool ini berdasarkan deret angka Fibonacci yang ditemukan oleh matematikawan Italia Leonardo Fibonacci.', category: 'education', isPublished: true },
      { title: 'GOTO Umumkan Kerjasama Strategis dengan Bank Digital', content: 'GoTo Gojek Tokopedia mengumumkan kerjasama strategis dengan beberapa bank digital untuk memperluas layanan keuangan di ekosistemnya. Langkah ini diharapkan meningkatkan monetisasi dan user engagement.', category: 'company', isPublished: true },
    ]
    for (const news of newsData) {
      await db.news.create({ data: news })
    }
  }

  // Seed promos if empty
  const promoCount = await db.promo.count()
  if (promoCount === 0) {
    const promoData = [
      { title: 'Bonus Selamat Datang', description: 'Dapatkan bonus Rp 25.000 untuk member baru yang mendaftar di TrendEdge. Bonus langsung dikreditkan ke saldo akun Anda.', type: 'welcome_bonus', value: 25000, isActive: true },
      { title: 'Bonus Deposit 5%', description: 'Nikmati bonus 5% untuk setiap deposit minimal Rp 1.000.000. Maksimal bonus Rp 500.000 per deposit.', type: 'deposit_bonus', value: 5, isActive: true },
      { title: 'Program Referral', description: 'Ajak teman bergabung dan dapatkan bonus Rp 50.000 untuk setiap teman yang mendaftar menggunakan kode referral Anda. Teman juga mendapat bonus yang sama!', type: 'referral_program', value: 50000, isActive: true },
      { title: 'Kompetisi Trading Bulanan', description: 'Ikuti kompetisi trading bulanan dan menangkan hadiah total Rp 10.000.000! 10 trader dengan profit tertinggi akan mendapat hadiah.', type: 'trading_competition', value: 10000000, isActive: true },
      { title: 'Bonus Trading 0.1%', description: 'Dapatkan bonus 0.1% dari total volume trading Anda. Bonus bisa di-claim setiap hari Senin.', type: 'trading_bonus', value: 0.1, isActive: true },
    ]
    for (const promo of promoData) {
      await db.promo.create({ data: promo })
    }
  }
}
