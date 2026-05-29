import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Auto-seed if no news exist
    const newsCount = await db.news.count()
    if (newsCount === 0) {
      await seedNews()
    }

    const where: { isPublished: boolean; category?: string } = { isPublished: true }
    if (category) {
      where.category = category
    }

    const news = await db.news.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ news })
  } catch (error) {
    console.error('Get news error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    )
  }
}

async function seedNews() {
  const newsData = [
    { title: 'IHSG Menguat di Tengah Sentimen Positif Pasar Global', content: 'Indeks Harga Saham Gabungan (IHSG) berhasil ditutup menguat pada perdagangan hari ini seiring dengan sentimen positif dari pasar global. Penguatan ini didorong oleh data ekonomi AS yang lebih baik dari ekspektasi dan optimisme terhadap pemulihan ekonomi global. Sektor perbankan dan konsumer menjadi kontributor utama penguatan indeks.', category: 'market', isPublished: true },
    { title: 'Bank Indonesia Pertahankan Suku Bunga Acuan di 6%', content: 'Bank Indonesia memutuskan untuk mempertahankan suku bunga acuan BI Rate di level 6% pada Rapat Dewan Gubernur bulanan. Keputusan ini diambil untuk menjaga stabilitas nilai tukar rupiah dan mengendalikan inflasi yang masih berada dalam target. BI akan terus memantau perkembangan ekonomi global dan domestik untuk kebijakan mendatang.', category: 'market', isPublished: true },
    { title: 'BBCA Catat Laba Bersih Rp 42,3 Triliun Sepanjang 2024', content: 'PT Bank Central Asia Tbk (BBCA) berhasil mencatatkan laba bersih sebesar Rp 42,3 triliun sepanjang tahun 2024, tumbuh 8,5% dibandingkan tahun sebelumnya. Pencapaian ini didorong oleh pertumbuhan kredit yang sehat dan peningkatan fee-based income. NIM bank ini terjaga di level 5,8% menunjukkan efisiensi yang baik dalam pengelolaan dana.', category: 'company', isPublished: true },
    { title: 'Tips Investasi Saham untuk Pemula: Mulai dari Sekarang!', content: 'Investasi saham menjadi salah satu cara yang efektif untuk membangun kekayaan jangka panjang. Bagi pemula, penting untuk memahami dasar-dasar investasi saham termasuk analisis fundamental dan teknikal. Diversifikasi portofolio, investasi secara rutin, dan tidak terpancing emosi adalah kunci sukses berinvestasi saham. Mulailah dengan modal kecil dan tingkatkan secara bertahap.', category: 'education', isPublished: true },
    { title: 'Sektor Energi Siap Berkinerja Positif di 2025', content: 'Analis memproyeksikan sektor energi akan berkinerja positif sepanjang 2025 didorong oleh kenaikan harga komoditas dan peningkatan permintaan domestik. Perusahaan-perusahaan di sektor energi terbarukan juga dinilai memiliki potensi pertumbuhan yang tinggi seiring dengan transisi energi yang terus berlangsung. Barito Renewables dan Surya Esa Perkasa menjadi sorotan investor.', category: 'market', isPublished: true },
    { title: 'Pembaruan Sistem Trading: Fitur Baru untuk Pengalaman Lebih Baik', content: 'Kami dengan bangga memperkenalkan pembaruan sistem trading terbaru kami. Fitur-fitur baru meliputi real-time market data, charting yang lebih canggih, dan sistem notifikasi yang lebih responsif. Update ini dirancang untuk memberikan pengalaman trading yang lebih baik dan efisien bagi seluruh pengguna.', category: 'system', isPublished: true },
    { title: 'Saham Teknologi Indonesia Prospektif di Era Digital', content: 'Sektor teknologi Indonesia diprediksi akan terus tumbuh seiring dengan peningkatan adopsi digital. Perusahaan-perusahaan seperti GoTo dan DCI Indonesia menunjukkan potensi pertumbuhan yang menjanjikan di tengah transformasi digital yang masif.', category: 'market', isPublished: true },
    { title: 'BBRI Luncurkan Program Pinjaman UMKM Baru', content: 'Bank Rakyat Indonesia meluncurkan program pinjaman khusus untuk UMKM dengan bunga ringan dan proses cepat. Program ini diharapkan mendorong pertumbuhan sektor usaha kecil dan menengah di Indonesia serta meningkatkan kredit produktif bank.', category: 'company', isPublished: true },
    { title: 'Rupiah Menguat di Tengah Arus Modal Asing Masuk', content: 'Mata uang rupiah menguat terhadap dolar AS seiring dengan masuknya arus modal asing ke pasar saham Indonesia. Penguatan ini juga didukung oleh stabilnya ekonomi domestik dan harga komoditas yang menguat. BI optimis rupiah akan tetap stabil.', category: 'market', isPublished: true },
    { title: 'Sektor Pertambangan Emas Berkinerja Cemerlang', content: 'Saham-saham sektor pertambangan emas menunjukkan kinerja yang cemerlang sepanjang kuartal ini. Harga emas dunia yang terus memecahkan rekor tertinggi menjadi pendorong utama kenaikan saham-saham di sektor ini. ANTM dan MDKA menjadi pilihan utama investor.', category: 'market', isPublished: true },
    { title: 'Belajar Analisis Teknikal: Fibonacci Retracement', content: 'Fibonacci Retracement adalah salah satu tools analisis teknikal yang populer digunakan trader untuk menentukan level support dan resistance. Tool ini berdasarkan deret angka Fibonacci yang ditemukan oleh matematikawan Italia Leonardo Fibonacci. Level-level kunci: 23.6%, 38.2%, 50%, 61.8%, dan 78.6%.', category: 'education', isPublished: true },
    { title: 'GOTO Umumkan Kerjasama Strategis dengan Bank Digital', content: 'GoTo Gojek Tokopedia mengumumkan kerjasama strategis dengan beberapa bank digital untuk memperluas layanan keuangan di ekosistemnya. Langkah ini diharapkan meningkatkan monetisasi dan user engagement di platform.', category: 'company', isPublished: true },
  ]

  for (const news of newsData) {
    await db.news.create({ data: news })
  }
}
