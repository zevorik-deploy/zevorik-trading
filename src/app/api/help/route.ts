import { NextResponse } from 'next/server'

const FAQ_DATA = [
  {
    id: 'faq_1',
    question: 'Bagaimana cara memulai investasi di TrendEdge?',
    answer: 'Untuk memulai investasi, Anda perlu mendaftar akun terlebih dahulu. Setelah itu, lakukan deposit dana ke akun Anda. Setelah saldo tersedia, Anda bisa langsung membeli saham yang diinginkan melalui halaman Trading.',
    category: 'getting_started',
  },
  {
    id: 'faq_2',
    question: 'Berapa minimal deposit?',
    answer: 'Minimal deposit adalah Rp 50.000 untuk semua metode pembayaran (transfer bank, e-wallet, QRIS). Tidak ada batas maksimal deposit.',
    category: 'deposit',
  },
  {
    id: 'faq_3',
    question: 'Berapa lama proses deposit?',
    answer: 'Deposit melalui transfer bank diproses secara otomatis dan langsung dikreditkan ke akun Anda. Deposit melalui e-wallet dan QRIS juga diproses secara instan.',
    category: 'deposit',
  },
  {
    id: 'faq_4',
    question: 'Berapa lama proses penarikan dana?',
    answer: 'Penarikan dana diproses dalam waktu maksimal 1x24 jam kerja. Untuk member VIP, proses penarikan lebih cepat dan diprioritaskan.',
    category: 'withdrawal',
  },
  {
    id: 'faq_5',
    question: 'Berapa biaya trading?',
    answer: 'Biaya trading adalah 0.15% dari nilai transaksi untuk member Bronze. Member Silver mendapat diskon 10%, Gold 20%, Platinum 30%, dan Diamond 50%.',
    category: 'trading',
  },
  {
    id: 'faq_6',
    question: 'Apa itu lot dalam trading saham?',
    answer: '1 lot = 100 lembar saham. Jadi jika Anda membeli 1 lot saham BBCA dengan harga Rp 9.875 per lembar, maka total yang harus dibayar adalah Rp 987.500 (100 x Rp 9.875).',
    category: 'trading',
  },
  {
    id: 'faq_7',
    question: 'Bagaimana cara menggunakan kode referral?',
    answer: 'Anda bisa memasukkan kode referral saat pendaftaran. Setelah berhasil, Anda dan teman yang mengajak akan mendapat bonus Rp 50.000. Anda juga bisa menggunakan kode referral melalui halaman Referral setelah login.',
    category: 'referral',
  },
  {
    id: 'faq_8',
    question: 'Apa itu VIP Level dan bagaimana cara menaikkannya?',
    answer: 'VIP Level ditentukan berdasarkan total deposit Anda. Bronze (0-10 juta), Silver (10-50 juta), Gold (50-200 juta), Platinum (200-500 juta), Diamond (500 juta+). Semakin tinggi level, semakin banyak benefit yang didapat.',
    category: 'vip',
  },
  {
    id: 'faq_9',
    question: 'Bagaimana cara melakukan verifikasi KYC?',
    answer: 'Kunjungi halaman Profil dan pilih menu Verifikasi KYC. Isi data diri Anda termasuk nama lengkap, nomor KTP, alamat, pekerjaan, dan rentang penghasilan. Verifikasi diproses dalam 1x24 jam.',
    category: 'kyc',
  },
  {
    id: 'faq_10',
    question: 'Apakah data saya aman?',
    answer: 'Ya, kami menggunakan enkripsi SSL/TLS untuk melindungi data Anda. Password dienkripsi menggunakan bcrypt dan tidak disimpan dalam bentuk plain text. Kami juga mematuhi regulasi perlindungan data pribadi.',
    category: 'security',
  },
  {
    id: 'faq_11',
    question: 'Bagaimana cara mendapatkan bonus harian?',
    answer: 'Kunjungi halaman Bonus dan klik tombol Check-in Harian. Anda akan mendapat bonus Rp 10.000-50.000 secara acak. Pertahankan streak check-in untuk bonus yang lebih besar.',
    category: 'bonus',
  },
  {
    id: 'faq_12',
    question: 'Apa perbedaan order Market dan Limit?',
    answer: 'Order Market dieksekusi langsung pada harga pasar saat ini. Order Limit dieksekusi hanya ketika harga mencapai level yang Anda tentukan. Order Limit cocok untuk investor yang ingin membeli/menjual pada harga tertentu.',
    category: 'trading',
  },
  {
    id: 'faq_13',
    question: 'Bagaimana cara menghubungi customer service?',
    answer: 'Anda bisa menghubungi kami melalui Live Chat yang tersedia di aplikasi, email support@globalsaham.id, atau WhatsApp di +62 812-3456-7890. Tim kami siap membantu 24/7.',
    category: 'support',
  },
  {
    id: 'faq_14',
    question: 'Apa itu watchlist dan cara menggunakannya?',
    answer: 'Watchlist adalah daftar saham favorit Anda. Anda bisa menambahkan saham ke watchlist dengan klik ikon bintang pada halaman Trading. Watchlist membantu Anda memantau pergerakan harga saham yang Anda minati.',
    category: 'trading',
  },
  {
    id: 'faq_15',
    question: 'Berapa batas penarikan untuk setiap VIP level?',
    answer: 'Batas penarikan harian: Bronze Rp 50 juta, Silver Rp 100 juta, Gold Rp 250 juta, Platinum Rp 500 juta, Diamond Rp 1 miliar. Upgrade VIP level Anda dengan melakukan deposit lebih besar.',
    category: 'vip',
  },
]

const HELP_TOPICS = [
  {
    id: 'topic_1',
    title: 'Panduan Pemula',
    description: 'Pelajari dasar-dasar investasi saham dan cara menggunakan platform TrendEdge.',
    icon: 'book',
  },
  {
    id: 'topic_2',
    title: 'Cara Deposit & Withdrawal',
    description: 'Panduan lengkap untuk melakukan deposit dan penarikan dana.',
    icon: 'wallet',
  },
  {
    id: 'topic_3',
    title: 'Memahami Trading',
    description: 'Pelajari tentang order Market, Limit, dan strategi trading dasar.',
    icon: 'trending-up',
  },
  {
    id: 'topic_4',
    title: 'Program Bonus & VIP',
    description: 'Informasi tentang bonus harian, trading bonus, deposit bonus, dan benefit VIP.',
    icon: 'gift',
  },
  {
    id: 'topic_5',
    title: 'Keamanan Akun',
    description: 'Tips menjaga keamanan akun dan data pribadi Anda.',
    icon: 'shield',
  },
]

export async function GET() {
  try {
    return NextResponse.json({
      faq: FAQ_DATA,
      topics: HELP_TOPICS,
    })
  } catch (error) {
    console.error('Get help error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch help data' },
      { status: 500 }
    )
  }
}
