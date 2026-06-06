import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = 'TE'
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function POST() {
  try {
    // Clear existing data
    await db.leaderboard.deleteMany()
    await db.bonus.deleteMany()
    await db.kYC.deleteMany()
    await db.promo.deleteMany()
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
        username: 'demo_user',
        phone: '081234567890',
        password: hashedPassword,
        balance: 100000000, // Rp 100,000,000
        role: 'investor',
        referralCode: generateReferralCode(),
        email: 'demo@trendedge.io',
        bankName: 'Bank BCA',
        bankAccount: '1234567890',
        bankHolder: 'Demo User',
        vipLevel: 'Gold',
        totalDeposit: 100000000,
        totalTrading: 50000000,
        dailyCheckIn: 3,
        lastCheckIn: new Date(),
        kycStatus: 'verified',
      },
    })

    // Create welcome bonus for demo user
    await db.bonus.create({
      data: {
        userId: demoUser.id,
        type: 'welcome_bonus',
        amount: 25000,
        description: 'Bonus selamat datang untuk member baru',
        status: 'completed',
      },
    })

    // Create KYC record for demo user
    await db.kYC.create({
      data: {
        userId: demoUser.id,
        fullName: 'Demo User',
        idNumber: '3201234567890001',
        address: 'Jl. Sudirman No. 123, Jakarta Selatan',
        occupation: 'Wiraswasta',
        incomeRange: '50_100_juta',
        status: 'verified',
      },
    })

    // Create Market Indices (International)
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

    // Create News entries (International Market)
    const newsData = [
      { title: 'NVIDIA Surges to New All-Time High on AI Chip Demand', content: 'NVIDIA shares soared to a record high after the company reported exceptional demand for its AI accelerator chips, with data center revenue more than doubling year-over-year.', category: 'market', isPublished: true },
      { title: 'Fed Holds Interest Rates Steady, Signals Possible Cut Later This Year', content: 'The Federal Reserve kept interest rates unchanged at its latest meeting but hinted at a potential rate cut in the coming months as inflation shows signs of cooling.', category: 'market', isPublished: true },
      { title: 'Apple Announces Revolutionary AI Features at WWDC 2025', content: 'Apple introduced a suite of groundbreaking AI-powered features across its product lineup, sending shares higher as analysts predict strong upgrade cycle.', category: 'company', isPublished: true },
      { title: 'Top Global Stock Picks for 2025: Analysts Reveal Favorites', content: 'Leading Wall Street analysts share their top stock picks for 2025, highlighting opportunities in AI, renewable energy, and semiconductor sectors.', category: 'education', isPublished: true },
      { title: 'Tesla Deliveries Beat Expectations, Stock Rallies 8%', content: 'Tesla reported quarterly deliveries that exceeded analyst expectations, driven by strong demand for Model Y and the launch of new markets.', category: 'market', isPublished: true },
      { title: 'TrendEdge Trading Platform Upgrade: New Features Released', content: 'We are proud to announce the latest upgrade to our trading platform. New features include advanced charting tools, real-time market signals, and improved order execution.', category: 'system', isPublished: true },
      { title: 'Microsoft Cloud Revenue Hits $35 Billion, Azure Growth Accelerates', content: 'Microsoft reported strong quarterly results with Azure cloud revenue growing 31%, outpacing competitors and driving overall company growth.', category: 'company', isPublished: true },
      { title: 'Amazon Web Services Launches Next-Gen AI Infrastructure', content: 'AWS unveiled its most powerful AI computing infrastructure yet, featuring custom-designed chips that promise 40% better performance per dollar.', category: 'company', isPublished: true },
      { title: 'Gold Prices Reach Record High Amid Global Uncertainty', content: 'Gold prices surged to new all-time highs as investors seek safe-haven assets amid geopolitical tensions and central bank buying programs.', category: 'market', isPublished: true },
      { title: 'Semiconductor Sector Outlook Remains Bullish for 2025', content: 'Industry experts project continued growth in the semiconductor sector, driven by AI chip demand and automotive electrification trends.', category: 'market', isPublished: true },
      { title: 'Technical Analysis Guide: Understanding Moving Averages', content: 'Learn how to use moving averages (MA7, MA25, MA99) to identify market trends and make better trading decisions.', category: 'education', isPublished: true },
      { title: 'Meta Platforms Reports Strong Advertising Revenue Growth', content: 'Meta Platforms exceeded expectations with 24% growth in advertising revenue, boosted by AI-powered ad targeting and Reels monetization.', category: 'company', isPublished: true },
    ]

    for (const news of newsData) {
      await db.news.create({ data: news })
    }

    // Create Promos
    const promoData = [
      { title: 'Bonus Selamat Datang', description: 'Dapatkan bonus Rp 25.000 untuk member baru yang mendaftar di TrendEdge. Bonus langsung dikreditkan ke saldo akun Anda.', type: 'welcome_bonus', value: 25000, isActive: true },
      { title: 'Bonus Deposit 5%', description: 'Nikmati bonus 5% untuk setiap deposit minimal Rp 1.000.000. Maksimal bonus Rp 500.000 per deposit.', type: 'deposit_bonus', value: 5, isActive: true },
      { title: 'Program Referral', description: 'Ajak teman bergabung dan dapatkan bonus Rp 50.000 untuk setiap teman yang mendaftar menggunakan kode referral Anda.', type: 'referral_program', value: 50000, isActive: true },
      { title: 'Kompetisi Trading Bulanan', description: 'Ikuti kompetisi trading bulanan dan menangkan hadiah total Rp 10.000.000!', type: 'trading_competition', value: 10000000, isActive: true },
      { title: 'Bonus Trading 0.1%', description: 'Dapatkan bonus 0.1% dari total volume trading Anda. Bonus bisa di-claim setiap hari.', type: 'trading_bonus', value: 0.1, isActive: true },
    ]

    for (const promo of promoData) {
      await db.promo.create({ data: promo })
    }

    // Create Notifications for demo user
    const notifications = [
      { userId: demoUser.id, title: 'Selamat Datang! 🎉', message: 'Selamat datang di TrendEdge! Anda mendapat bonus selamat datang Rp 25.000. Mulai investasi Anda sekarang!', type: 'system' },
      { userId: demoUser.id, title: 'Deposit Berhasil', message: 'Deposit sebesar Rp 100.000.000 telah berhasil dikreditkan ke akun Anda.', type: 'deposit' },
      { userId: demoUser.id, title: 'KYC Terverifikasi ✅', message: 'Verifikasi identitas Anda telah berhasil. Akun Anda sekarang telah terverifikasi penuh.', type: 'system' },
      { userId: demoUser.id, title: 'Promo Referral', message: 'Ajak teman bergabung dan dapatkan bonus referral hingga Rp 50.000 per teman!', type: 'alert' },
      { userId: demoUser.id, title: 'Laporan Mingguan', message: 'Portofolio Anda tumbuh 2.3% minggu ini. Lihat detailnya di halaman portofolio.', type: 'info' },
    ]

    for (const notif of notifications) {
      await db.notification.create({ data: notif })
    }

    // Create stock data — 250 INTERNATIONAL / GLOBAL stocks (prices in IDR equivalent)
    const stockData = [
      // ===== Technology Giants =====
      { code: 'AAPL', name: 'Apple Inc.', price: 175000, change: 3200, changePercent: 1.86, open: 172000, high: 176500, low: 171500, volume: 52345600, marketCap: 2710000000000000, category: 'bluechip', sector: 'Technology', logo: '/stocks/AAPL.png', description: 'Tech giant known for iPhone, Mac, iPad, and services. Largest company by market cap with growing AI and AR initiatives.', peRatio: 29.8, pbv: 45.2, dividendYield: 0.6, lotSize: 1 },
      { code: 'NVDA', name: 'NVIDIA Corporation', price: 890000, change: 28500, changePercent: 3.31, open: 862000, high: 895000, low: 858000, volume: 41234500, marketCap: 2180000000000000, category: 'bluechip', sector: 'Technology', logo: '/stocks/NVDA.png', description: 'Leading AI chipmaker and GPU manufacturer. Dominant in data center AI training and inference hardware.', peRatio: 65.2, pbv: 52.8, dividendYield: 0.03, lotSize: 1 },
      { code: 'MSFT', name: 'Microsoft Corporation', price: 415000, change: 8500, changePercent: 2.09, open: 407000, high: 418000, low: 406000, volume: 22345600, marketCap: 3080000000000000, category: 'bluechip', sector: 'Technology', logo: '/stocks/MSFT.png', description: 'Cloud computing leader with Azure. Dominant in enterprise software, AI integration via OpenAI partnership.', peRatio: 36.5, pbv: 12.8, dividendYield: 0.8, lotSize: 1 },
      { code: 'GOOGL', name: 'Alphabet Inc.', price: 155000, change: -2800, changePercent: -1.77, open: 158000, high: 159000, low: 154000, volume: 25345600, marketCap: 1920000000000000, category: 'bluechip', sector: 'Technology', logo: '/stocks/GOOGL.png', description: 'Parent company of Google, YouTube, and Waymo. Leader in search, digital advertising, and cloud computing.', peRatio: 24.2, pbv: 7.1, dividendYield: 0.5, lotSize: 1 },
      { code: 'META', name: 'Meta Platforms Inc.', price: 505000, change: 12400, changePercent: 2.52, open: 493000, high: 508000, low: 491000, volume: 17345600, marketCap: 1280000000000000, category: 'bluechip', sector: 'Technology', logo: '/stocks/META.png', description: 'Social media giant owning Facebook, Instagram, WhatsApp. Investing heavily in AI and metaverse technologies.', peRatio: 26.8, pbv: 8.5, dividendYield: 0.4, lotSize: 1 },
      { code: 'AMZN', name: 'Amazon.com Inc.', price: 185000, change: 4100, changePercent: 2.27, open: 181000, high: 187000, low: 180000, volume: 32345600, marketCap: 1920000000000000, category: 'bluechip', sector: 'Technology', logo: '/stocks/AMZN.png', description: 'E-commerce and cloud computing giant. AWS is the largest cloud provider globally with growing AI services.', peRatio: 58.3, pbv: 9.2, dividendYield: 0.0, lotSize: 1 },
      { code: 'TSLA', name: 'Tesla Inc.', price: 245000, change: -7800, changePercent: -3.09, open: 253000, high: 254000, low: 242000, volume: 82345600, marketCap: 780000000000000, category: 'bluechip', sector: 'Automotive', logo: '/stocks/TSLA.png', description: 'Electric vehicle pioneer and clean energy company. Leading EV manufacturer with expanding FSD and energy storage business.', peRatio: 72.5, pbv: 15.8, dividendYield: 0.0, lotSize: 1 },
      { code: 'AMD', name: 'Advanced Micro Devices Inc.', price: 168000, change: 5200, changePercent: 3.19, open: 163000, high: 170000, low: 162000, volume: 45345600, marketCap: 272000000000000, category: 'tech', sector: 'Technology', logo: '/stocks/AMD.png', description: 'Semiconductor company competing with NVIDIA in AI chips and Intel in CPUs. Growing data center market share.', peRatio: 45.2, pbv: 5.8, dividendYield: 0.0, lotSize: 1 },

      // ===== Finance =====
      { code: 'JPM', name: 'JPMorgan Chase & Co.', price: 198000, change: 3600, changePercent: 1.85, open: 195000, high: 200000, low: 194000, volume: 9345600, marketCap: 572000000000000, category: 'bluechip', sector: 'Finance', logo: '/stocks/JPM.png', description: 'Largest bank in the US by assets. Investment banking leader with strong consumer banking franchise.', peRatio: 12.1, pbv: 1.9, dividendYield: 2.3, lotSize: 1 },
      { code: 'V', name: 'Visa Inc.', price: 280000, change: 4100, changePercent: 1.49, open: 276000, high: 282000, low: 275000, volume: 7345600, marketCap: 560000000000000, category: 'bluechip', sector: 'Finance', logo: '/stocks/V.png', description: 'Global payments technology company. Dominant in electronic funds transfers worldwide.', peRatio: 30.5, pbv: 13.2, dividendYield: 0.8, lotSize: 1 },
      { code: 'MA', name: 'Mastercard Inc.', price: 465000, change: 8200, changePercent: 1.80, open: 457000, high: 468000, low: 456000, volume: 4345600, marketCap: 432000000000000, category: 'bluechip', sector: 'Finance', logo: '/stocks/MA.png', description: 'Global technology company in the payments industry. Processes electronic payments worldwide.', peRatio: 35.2, pbv: 55.8, dividendYield: 0.6, lotSize: 1 },
      { code: 'GS', name: 'Goldman Sachs Group Inc.', price: 485000, change: -8200, changePercent: -1.66, open: 494000, high: 496000, low: 482000, volume: 3345600, marketCap: 165000000000000, category: 'banking', sector: 'Finance', logo: '/stocks/GS.png', description: 'Premier global investment banking and securities firm. Leader in M&A advisory and trading.', peRatio: 15.8, pbv: 1.5, dividendYield: 2.6, lotSize: 1 },
      { code: 'BAC', name: 'Bank of America Corp.', price: 142000, change: 2800, changePercent: 2.01, open: 139500, high: 143000, low: 139000, volume: 14345600, marketCap: 352000000000000, category: 'banking', sector: 'Finance', logo: '/stocks/BAC.png', description: 'One of the largest banks in the US offering consumer banking, wealth management, and corporate banking services.', peRatio: 11.8, pbv: 1.2, dividendYield: 2.6, lotSize: 1 },
      { code: 'PGR', name: 'Progressive Corp.', price: 245000, change: 5200, changePercent: 2.17, open: 240000, high: 247000, low: 239000, volume: 2345600, marketCap: 144000000000000, category: 'banking', sector: 'Finance', logo: '/stocks/PGR.png', description: 'Major insurance company providing auto, home, and commercial insurance across the United States.', peRatio: 16.5, pbv: 3.8, dividendYield: 1.2, lotSize: 1 },

      // ===== Healthcare =====
      { code: 'UNH', name: 'UnitedHealth Group', price: 525000, change: 9800, changePercent: 1.90, open: 516000, high: 528000, low: 515000, volume: 4345600, marketCap: 485000000000000, category: 'healthcare', sector: 'Healthcare', logo: '/stocks/UNH.png', description: 'Largest health insurer in the US. Combines insurance with healthcare services through Optum.', peRatio: 22.1, pbv: 6.8, dividendYield: 1.4, lotSize: 1 },
      { code: 'JNJ', name: 'Johnson & Johnson', price: 162000, change: -1500, changePercent: -0.92, open: 164000, high: 165000, low: 161000, volume: 8345600, marketCap: 390000000000000, category: 'healthcare', sector: 'Healthcare', logo: '/stocks/JNJ.png', description: 'Diversified healthcare giant with pharmaceutical, medical devices, and consumer health divisions.', peRatio: 16.8, pbv: 5.2, dividendYield: 3.1, lotSize: 1 },
      { code: 'PFE', name: 'Pfizer Inc.', price: 28500, change: 680, changePercent: 2.44, open: 27900, high: 29000, low: 27800, volume: 32345600, marketCap: 161000000000000, category: 'healthcare', sector: 'Healthcare', logo: '/stocks/PFE.png', description: 'Global pharmaceutical company. Known for vaccines, oncology, and rare disease treatments.', peRatio: 42.5, pbv: 1.8, dividendYield: 5.8, lotSize: 1 },
      { code: 'LLY', name: 'Eli Lilly and Company', price: 785000, change: 18500, changePercent: 2.42, open: 767000, high: 790000, low: 765000, volume: 4345600, marketCap: 742000000000000, category: 'healthcare', sector: 'Healthcare', logo: '/stocks/LLY.png', description: 'Global pharmaceutical leader in diabetes, oncology, and immunology. Mounjaro and Zepbound driving growth.', peRatio: 118.5, pbv: 52.8, dividendYield: 0.8, lotSize: 1 },
      { code: 'ABBV', name: 'AbbVie Inc.', price: 175000, change: 3100, changePercent: 1.80, open: 172000, high: 176000, low: 171500, volume: 6345600, marketCap: 310000000000000, category: 'healthcare', sector: 'Healthcare', logo: '/stocks/ABBV.png', description: 'Biopharmaceutical company known for Humira, Skyrizi, and Rinvoq. Strong immunology and oncology pipeline.', peRatio: 18.2, pbv: 5.8, dividendYield: 3.5, lotSize: 1 },
      { code: 'MRK', name: 'Merck & Co. Inc.', price: 125000, change: -1800, changePercent: -1.42, open: 127000, high: 128000, low: 124000, volume: 9345600, marketCap: 317000000000000, category: 'healthcare', sector: 'Healthcare', logo: '/stocks/MRK.png', description: 'Global pharmaceutical company. Keytruda is the top-selling oncology drug worldwide with expanding indications.', peRatio: 14.5, pbv: 4.2, dividendYield: 2.8, lotSize: 1 },

      // ===== Consumer =====
      { code: 'WMT', name: 'Walmart Inc.', price: 168000, change: 2800, changePercent: 1.69, open: 165500, high: 169000, low: 165000, volume: 9345600, marketCap: 453000000000000, category: 'consumer', sector: 'Retail', logo: '/stocks/WMT.png', description: 'Worlds largest retailer with expanding e-commerce and grocery delivery business.', peRatio: 28.5, pbv: 7.2, dividendYield: 1.2, lotSize: 1 },
      { code: 'COST', name: 'Costco Wholesale Corp.', price: 825000, change: 15200, changePercent: 1.88, open: 810000, high: 830000, low: 808000, volume: 2345600, marketCap: 366000000000000, category: 'consumer', sector: 'Retail', logo: '/stocks/COST.png', description: 'Membership warehouse club operator with loyal customer base and consistent growth.', peRatio: 52.3, pbv: 18.5, dividendYield: 0.5, lotSize: 1 },
      { code: 'NKE', name: 'Nike Inc.', price: 98000, change: -2100, changePercent: -2.10, open: 100500, high: 101000, low: 97000, volume: 11345600, marketCap: 147000000000000, category: 'consumer', sector: 'Consumer', logo: '/stocks/NKE.png', description: 'Global leader in athletic footwear, apparel, and equipment. Strong brand portfolio worldwide.', peRatio: 25.8, pbv: 10.2, dividendYield: 1.5, lotSize: 1 },
      { code: 'MCD', name: 'McDonalds Corp.', price: 295000, change: 4100, changePercent: 1.41, open: 291000, high: 297000, low: 290000, volume: 5345600, marketCap: 212000000000000, category: 'consumer', sector: 'Consumer', logo: '/stocks/MCD.png', description: 'Worlds largest fast-food restaurant chain with global brand recognition and franchise model.', peRatio: 24.2, pbv: 45.8, dividendYield: 2.3, lotSize: 1 },
      { code: 'KO', name: 'Coca-Cola Company', price: 62000, change: 850, changePercent: 1.39, open: 61200, high: 62500, low: 61000, volume: 12345600, marketCap: 268000000000000, category: 'consumer', sector: 'Consumer', logo: '/stocks/KO.png', description: 'Worlds largest non-alcoholic beverage company. Iconic brand portfolio with global distribution network.', peRatio: 24.8, pbv: 11.2, dividendYield: 3.1, lotSize: 1 },
      { code: 'SBUX', name: 'Starbucks Corp.', price: 95000, change: -1200, changePercent: -1.25, open: 96500, high: 97000, low: 94000, volume: 8345600, marketCap: 108000000000000, category: 'consumer', sector: 'Consumer', logo: '/stocks/SBUX.png', description: 'Global coffeehouse chain with 38,000+ stores worldwide. Expanding digital ordering and delivery.', peRatio: 25.2, pbv: 15.8, dividendYield: 2.5, lotSize: 1 },
      { code: 'PEP', name: 'PepsiCo Inc.', price: 175000, change: 2100, changePercent: 1.22, open: 173000, high: 176000, low: 172500, volume: 5345600, marketCap: 241000000000000, category: 'consumer', sector: 'Consumer', logo: '/stocks/PEP.png', description: 'Global food and beverage company with brands like Pepsi, Gatorade, Lay, and Quaker.', peRatio: 22.5, pbv: 8.8, dividendYield: 3.0, lotSize: 1 },

      // ===== Energy =====
      { code: 'XOM', name: 'Exxon Mobil Corp.', price: 112000, change: 1800, changePercent: 1.63, open: 110500, high: 113000, low: 110000, volume: 17345600, marketCap: 455000000000000, category: 'energy', sector: 'Energy', logo: '/stocks/XOM.png', description: 'One of the worlds largest integrated oil and gas companies. Expanding into low-carbon solutions.', peRatio: 13.2, pbv: 2.1, dividendYield: 3.5, lotSize: 1 },
      { code: 'CVX', name: 'Chevron Corp.', price: 158000, change: -2200, changePercent: -1.37, open: 160500, high: 161000, low: 157000, volume: 9345600, marketCap: 288000000000000, category: 'energy', sector: 'Energy', logo: '/stocks/CVX.png', description: 'Integrated energy company with upstream, midstream, and downstream operations globally.', peRatio: 14.5, pbv: 1.8, dividendYield: 4.0, lotSize: 1 },
      { code: 'COP', name: 'ConocoPhillips', price: 118000, change: 2400, changePercent: 2.07, open: 116000, high: 119000, low: 115500, volume: 6345600, marketCap: 138000000000000, category: 'energy', sector: 'Energy', logo: '/stocks/COP.png', description: 'Independent exploration and production company. One of the largest independent E&P companies globally.', peRatio: 12.8, pbv: 2.2, dividendYield: 2.8, lotSize: 1 },

      // ===== Industrials =====
      { code: 'CAT', name: 'Caterpillar Inc.', price: 345000, change: 7500, changePercent: 2.22, open: 338000, high: 348000, low: 337000, volume: 3345600, marketCap: 168000000000000, category: 'infrastructure', sector: 'Industrials', logo: '/stocks/CAT.png', description: 'Worlds leading manufacturer of construction and mining equipment, diesel and natural gas engines.', peRatio: 17.2, pbv: 9.5, dividendYield: 1.6, lotSize: 1 },
      { code: 'BA', name: 'Boeing Co.', price: 178000, change: -5600, changePercent: -3.05, open: 184000, high: 185000, low: 176000, volume: 8345600, marketCap: 108000000000000, category: 'infrastructure', sector: 'Industrials', logo: '/stocks/BA.png', description: 'Aerospace company manufacturing commercial jetliners and defense, space and security systems.', peRatio: -18.5, pbv: 8.2, dividendYield: 0.0, lotSize: 1 },
      { code: 'GE', name: 'GE Aerospace', price: 168000, change: 3200, changePercent: 1.94, open: 165000, high: 170000, low: 164000, volume: 6345600, marketCap: 183000000000000, category: 'infrastructure', sector: 'Industrials', logo: '/stocks/GE.png', description: 'Global aerospace leader in jet engine manufacturing. Spun off from former GE conglomerate.', peRatio: 32.5, pbv: 8.8, dividendYield: 0.8, lotSize: 1 },
      { code: 'HON', name: 'Honeywell International', price: 205000, change: 3800, changePercent: 1.89, open: 201500, high: 207000, low: 201000, volume: 4345600, marketCap: 135000000000000, category: 'infrastructure', sector: 'Industrials', logo: '/stocks/HON.png', description: 'Diversified technology and manufacturing leader in aerospace, building technologies, and safety solutions.', peRatio: 23.5, pbv: 6.2, dividendYield: 2.0, lotSize: 1 },
      { code: 'DE', name: 'Deere & Company', price: 385000, change: -4200, changePercent: -1.08, open: 390000, high: 391000, low: 382000, volume: 2345600, marketCap: 108000000000000, category: 'infrastructure', sector: 'Industrials', logo: '/stocks/DE.png', description: 'Worlds leading manufacturer of agricultural, construction, and forestry machinery with precision ag technology.', peRatio: 18.8, pbv: 7.5, dividendYield: 1.5, lotSize: 1 },

      // ===== Entertainment & Media =====
      { code: 'DIS', name: 'Walt Disney Co.', price: 112000, change: 2800, changePercent: 2.56, open: 109500, high: 113000, low: 109000, volume: 12345600, marketCap: 205000000000000, category: 'media', sector: 'Entertainment', logo: '/stocks/DIS.png', description: 'Global entertainment conglomerate with Disney+, parks, studios, and ESPN streaming.', peRatio: 72.8, pbv: 2.1, dividendYield: 0.8, lotSize: 1 },
      { code: 'NFLX', name: 'Netflix Inc.', price: 625000, change: 15800, changePercent: 2.59, open: 610000, high: 630000, low: 608000, volume: 5345600, marketCap: 270000000000000, category: 'media', sector: 'Entertainment', logo: '/stocks/NFLX.png', description: 'Global streaming entertainment service with 260M+ subscribers. Expanding into gaming and live events.', peRatio: 42.5, pbv: 15.2, dividendYield: 0.0, lotSize: 1 },
      { code: 'CMCSA', name: 'Comcast Corp.', price: 42000, change: -580, changePercent: -1.36, open: 42800, high: 43000, low: 41800, volume: 14345600, marketCap: 162000000000000, category: 'media', sector: 'Entertainment', logo: '/stocks/CMCSA.png', description: 'Media and telecommunications conglomerate. Owns NBCUniversal, Sky, and Xfinity broadband services.', peRatio: 10.2, pbv: 1.8, dividendYield: 3.5, lotSize: 1 },

      // ===== Fintech & Crypto =====
      { code: 'COIN', name: 'Coinbase Global Inc.', price: 225000, change: -8500, changePercent: -3.64, open: 234000, high: 236000, low: 222000, volume: 14345600, marketCap: 56000000000000, category: 'tech', sector: 'Crypto', logo: '/stocks/COIN.png', description: 'Largest US cryptocurrency exchange platform. Growing institutional and retail crypto trading.', peRatio: 28.2, pbv: 5.8, dividendYield: 0.0, lotSize: 1 },
      { code: 'SQ', name: 'Block Inc.', price: 78000, change: 2100, changePercent: 2.77, open: 76000, high: 79000, low: 75500, volume: 9345600, marketCap: 48000000000000, category: 'tech', sector: 'Fintech', logo: '/stocks/SQ.png', description: 'Financial technology company behind Square, Cash App, and Afterpay. Innovating in Bitcoin and payments.', peRatio: 55.2, pbv: 3.2, dividendYield: 0.0, lotSize: 1 },
      { code: 'PYPL', name: 'PayPal Holdings Inc.', price: 85000, change: 1800, changePercent: 2.16, open: 83200, high: 86000, low: 83000, volume: 11345600, marketCap: 92000000000000, category: 'tech', sector: 'Fintech', logo: '/stocks/PYPL.png', description: 'Global digital payments platform with 400M+ active accounts. Leader in online payment processing.', peRatio: 16.8, pbv: 4.5, dividendYield: 0.0, lotSize: 1 },

      // ===== Semiconductors =====
      { code: 'AVGO', name: 'Broadcom Inc.', price: 1350000, change: 32500, changePercent: 2.47, open: 1318000, high: 1360000, low: 1310000, volume: 3345600, marketCap: 625000000000000, category: 'tech', sector: 'Semiconductor', logo: '/stocks/AVGO.png', description: 'Global technology leader in semiconductor and infrastructure software solutions for data centers.', peRatio: 62.8, pbv: 8.5, dividendYield: 1.5, lotSize: 1 },
      { code: 'INTC', name: 'Intel Corporation', price: 32000, change: -680, changePercent: -2.08, open: 32800, high: 33000, low: 31500, volume: 42345600, marketCap: 135000000000000, category: 'tech', sector: 'Semiconductor', logo: '/stocks/INTC.png', description: 'Legacy chipmaker investing heavily in foundry business and AI accelerator chips for turnaround.', peRatio: 85.2, pbv: 1.2, dividendYield: 1.2, lotSize: 1 },
      { code: 'TSM', name: 'Taiwan Semiconductor', price: 168000, change: 4800, changePercent: 2.94, open: 163500, high: 170000, low: 163000, volume: 18345600, marketCap: 870000000000000, category: 'tech', sector: 'Semiconductor', logo: '/stocks/TSM.png', description: 'Worlds largest dedicated independent semiconductor foundry. Manufactures chips for Apple, NVIDIA, AMD.', peRatio: 25.8, pbv: 6.5, dividendYield: 1.5, lotSize: 1 },

      // ===== Enterprise Software =====
      { code: 'CRM', name: 'Salesforce Inc.', price: 275000, change: 6200, changePercent: 2.31, open: 269000, high: 277000, low: 268000, volume: 5345600, marketCap: 265000000000000, category: 'tech', sector: 'Technology', logo: '/stocks/CRM.png', description: 'Global leader in CRM software and cloud computing. AI-powered Einstein platform driving growth.', peRatio: 45.2, pbv: 5.8, dividendYield: 0.6, lotSize: 1 },
      { code: 'ORCL', name: 'Oracle Corporation', price: 145000, change: 3800, changePercent: 2.69, open: 141500, high: 146500, low: 141000, volume: 9345600, marketCap: 402000000000000, category: 'tech', sector: 'Technology', logo: '/stocks/ORCL.png', description: 'Enterprise software giant with database, cloud applications, and Java. Expanding cloud infrastructure.', peRatio: 35.2, pbv: 28.5, dividendYield: 1.2, lotSize: 1 },
      { code: 'ADBE', name: 'Adobe Inc.', price: 485000, change: -9800, changePercent: -1.98, open: 495000, high: 497000, low: 482000, volume: 4345600, marketCap: 215000000000000, category: 'tech', sector: 'Technology', logo: '/stocks/ADBE.png', description: 'Creative software leader with Photoshop, Illustrator, and Acrobat. Firefly AI integration driving growth.', peRatio: 32.5, pbv: 12.8, dividendYield: 0.3, lotSize: 1 },
      { code: 'IBM', name: 'IBM Corporation', price: 195000, change: 2500, changePercent: 1.30, open: 193000, high: 197000, low: 192500, volume: 5345600, marketCap: 178000000000000, category: 'tech', sector: 'Technology', logo: '/stocks/IBM.png', description: 'Technology pioneer in hybrid cloud, AI (watsonx), and quantum computing. Consulting and infrastructure services.', peRatio: 22.8, pbv: 7.5, dividendYield: 3.2, lotSize: 1 },
      { code: 'NOW', name: 'ServiceNow Inc.', price: 785000, change: 12500, changePercent: 1.62, open: 773000, high: 790000, low: 771000, volume: 2345600, marketCap: 162000000000000, category: 'tech', sector: 'Technology', logo: '/stocks/NOW.png', description: 'Enterprise cloud platform for digital workflows. AI-powered Now Assist driving enterprise adoption.', peRatio: 82.5, pbv: 22.8, dividendYield: 0.0, lotSize: 1 },

      // ===== Ride-sharing & Mobility =====
      { code: 'UBER', name: 'Uber Technologies Inc.', price: 72000, change: 1500, changePercent: 2.13, open: 70500, high: 73000, low: 70200, volume: 18345600, marketCap: 152000000000000, category: 'tech', sector: 'Technology', logo: '/stocks/UBER.png', description: 'Global ride-sharing and food delivery platform. Expanding into freight and autonomous vehicles.', peRatio: 42.8, pbv: 8.5, dividendYield: 0.0, lotSize: 1 },

      // ===== Cryptocurrency =====
      { code: 'BTC', name: 'Bitcoin', price: 107500000, change: 2150000, changePercent: 2.04, open: 105500000, high: 108800000, low: 104200000, volume: 32456700, marketCap: 2100000000000000, category: 'crypto', sector: 'Cryptocurrency', description: 'The original and largest cryptocurrency by market cap. Digital gold and store of value.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'ETH', name: 'Ethereum', price: 38500000, change: -780000, changePercent: -1.99, open: 39300000, high: 39500000, low: 38100000, volume: 18345600, marketCap: 462000000000000, category: 'crypto', sector: 'Cryptocurrency', description: 'Leading smart contract platform. Powers DeFi, NFTs, and thousands of dApps.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'XRP', name: 'Ripple (XRP)', price: 345000, change: 8500, changePercent: 2.53, open: 337000, high: 348000, low: 332000, volume: 42345600, marketCap: 34500000000000, category: 'crypto', sector: 'Cryptocurrency', description: 'Payment protocol for fast cross-border transfers. Used by banks and financial institutions.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'SOL', name: 'Solana', price: 24500000, change: 1200000, changePercent: 5.15, open: 23300000, high: 24800000, low: 23000000, volume: 28345600, marketCap: 108000000000000, category: 'crypto', sector: 'Cryptocurrency', description: 'High-performance blockchain with fast transactions and low fees. Growing DeFi and NFT ecosystem.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'DOGE', name: 'Dogecoin', price: 2580, change: -120, changePercent: -4.44, open: 2700, high: 2750, low: 2520, volume: 58345600, marketCap: 36800000000000, category: 'crypto', sector: 'Cryptocurrency', description: 'Meme cryptocurrency with strong community. Used for tipping and micro-transactions.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'ADA', name: 'Cardano', price: 72000, change: 1800, changePercent: 2.56, open: 70200, high: 73500, low: 69500, volume: 15345600, marketCap: 25200000000000, category: 'crypto', sector: 'Cryptocurrency', description: 'Proof-of-stake blockchain focused on sustainability and peer-reviewed research.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'AVAX', name: 'Avalanche', price: 5250000, change: 280000, changePercent: 5.63, open: 4970000, high: 5350000, low: 4900000, volume: 9345600, marketCap: 21000000000000, category: 'crypto', sector: 'Cryptocurrency', description: 'High-speed smart contract platform for DeFi and enterprise applications.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'DOT', name: 'Polkadot', price: 1050000, change: 42000, changePercent: 4.17, open: 1010000, high: 1080000, low: 995000, volume: 7345600, marketCap: 14500000000000, category: 'crypto', sector: 'Cryptocurrency', description: 'Multi-chain protocol enabling cross-chain communication and interoperability.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'LINK', name: 'Chainlink', price: 2450000, change: 98000, changePercent: 4.17, open: 2350000, high: 2500000, low: 2320000, volume: 11345600, marketCap: 15200000000000, category: 'crypto', sector: 'Cryptocurrency', description: 'Decentralized oracle network connecting smart contracts with real-world data.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'MATIC', name: 'Polygon', price: 98500, change: 3200, changePercent: 3.36, open: 95300, high: 100000, low: 94000, volume: 18345600, marketCap: 9200000000000, category: 'crypto', sector: 'Cryptocurrency', description: 'Ethereum scaling solution providing faster and cheaper transactions.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'BCH', name: 'Bitcoin Cash', price: 6850000, change: -180000, changePercent: -2.56, open: 7030000, high: 7100000, low: 6780000, volume: 5345600, marketCap: 13500000000000, category: 'crypto', sector: 'Cryptocurrency', description: 'Fork of Bitcoin with larger block size for faster and cheaper transactions.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'LTC', name: 'Litecoin', price: 1250000, change: 45000, changePercent: 3.73, open: 1205000, high: 1280000, low: 1190000, volume: 8345600, marketCap: 9300000000000, category: 'crypto', sector: 'Cryptocurrency', description: 'Peer-to-peer cryptocurrency with faster transaction confirmation than Bitcoin.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'XLM', name: 'Stellar', price: 18500, change: 520, changePercent: 2.89, open: 18000, high: 18900, low: 17800, volume: 14345600, marketCap: 5500000000000, category: 'crypto', sector: 'Cryptocurrency', description: 'Open network for storing and moving money. Fast cross-border payment protocol.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'UNI', name: 'Uniswap', price: 1550000, change: 62000, changePercent: 4.17, open: 1490000, high: 1580000, low: 1470000, volume: 6345600, marketCap: 9300000000000, category: 'crypto', sector: 'Cryptocurrency', description: 'Leading decentralized exchange protocol on Ethereum for swapping tokens.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'AAVE', name: 'Aave', price: 13500000, change: 480000, changePercent: 3.69, open: 13000000, high: 13700000, low: 12800000, volume: 4345600, marketCap: 10100000000000, category: 'crypto', sector: 'Cryptocurrency', description: 'Decentralized lending and borrowing protocol. Leader in DeFi innovation.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },

      // ===== Forex Pairs =====
      { code: 'EURUSD', name: 'Euro / US Dollar', price: 10845, change: 12, changePercent: 0.11, open: 10833, high: 10872, low: 10815, volume: 850000000, marketCap: 0, category: 'forex', sector: 'Forex', description: 'Most traded currency pair globally. European Central Bank vs Federal Reserve monetary policy.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'GBPUSD', name: 'British Pound / US Dollar', price: 12685, change: -32, changePercent: -0.25, open: 12717, high: 12745, low: 12652, volume: 420000000, marketCap: 0, category: 'forex', sector: 'Forex', description: 'Cable pair. Bank of England vs Federal Reserve interest rate differentials.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'USDJPY', name: 'US Dollar / Japanese Yen', price: 14985, change: 85, changePercent: 0.57, open: 14900, high: 15020, low: 14875, volume: 580000000, marketCap: 0, category: 'forex', sector: 'Forex', description: 'Major pair reflecting Bank of Japan ultra-loose policy vs Fed tightening.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'AUDUSD', name: 'Australian Dollar / US Dollar', price: 6542, change: 28, changePercent: 0.43, open: 6514, high: 6575, low: 6498, volume: 280000000, marketCap: 0, category: 'forex', sector: 'Forex', description: 'Commodity currency pair. Correlated with iron ore prices and China demand.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'USDCAD', name: 'US Dollar / Canadian Dollar', price: 13652, change: -18, changePercent: -0.13, open: 13670, high: 13695, low: 13625, volume: 250000000, marketCap: 0, category: 'forex', sector: 'Forex', description: 'Loonie pair. Influenced by oil prices and Bank of Canada policy.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'NZDUSD', name: 'New Zealand Dollar / US Dollar', price: 6125, change: 15, changePercent: 0.25, open: 6110, high: 6148, low: 6092, volume: 120000000, marketCap: 0, category: 'forex', sector: 'Forex', description: 'Kiwi pair. Influenced by dairy prices and RBNZ monetary policy.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'USDCHF', name: 'US Dollar / Swiss Franc', price: 8845, change: 22, changePercent: 0.25, open: 8823, high: 8872, low: 8805, volume: 180000000, marketCap: 0, category: 'forex', sector: 'Forex', description: 'Safe haven currency pair. Swiss National Bank vs Federal Reserve policy.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },

      // ===== Commodities =====
      { code: 'GOLD', name: 'Gold (XAU)', price: 36750000, change: 525000, changePercent: 1.45, open: 36225000, high: 36950000, low: 36100000, volume: 245000000, marketCap: 0, category: 'commodity', sector: 'Commodity', description: 'Precious metal and safe-haven asset. Central bank reserves and inflation hedge.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'SILVER', name: 'Silver (XAG)', price: 465000, change: -8500, changePercent: -1.80, open: 473500, high: 478000, low: 461000, volume: 165000000, marketCap: 0, category: 'commodity', sector: 'Commodity', description: 'Industrial precious metal. Used in electronics, solar panels, and jewelry.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'OIL', name: 'Crude Oil (WTI)', price: 1125000, change: 28000, changePercent: 2.55, open: 1097000, high: 1135000, low: 1088000, volume: 520000000, marketCap: 0, category: 'commodity', sector: 'Commodity', description: 'West Texas Intermediate crude oil. Key global energy benchmark.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'NATGAS', name: 'Natural Gas', price: 38500, change: -1200, changePercent: -3.03, open: 39700, high: 40200, low: 38100, volume: 180000000, marketCap: 0, category: 'commodity', sector: 'Commodity', description: 'Henry Hub natural gas. Seasonal demand and storage level driven pricing.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'COPPER', name: 'Copper', price: 1425000, change: 28500, changePercent: 2.04, open: 1396500, high: 1435000, low: 1390000, volume: 185000000, marketCap: 0, category: 'commodity', sector: 'Commodity', description: 'Industrial metal key for construction, electronics, and green energy transition.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },

      // ===== Additional Crypto =====
      { code: 'SHIB', name: 'Shiba Inu', price: 185, change: -8, changePercent: -4.14, open: 193, high: 198, low: 180, volume: 62345600, marketCap: 10800000000000, category: 'crypto', sector: 'Cryptocurrency', description: 'Meme token with growing ecosystem including ShibaSwap and Shibarium L2.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'ATOM', name: 'Cosmos', price: 1420000, change: 38000, changePercent: 2.75, open: 1380000, high: 1440000, low: 1370000, volume: 8345600, marketCap: 5500000000000, category: 'crypto', sector: 'Cryptocurrency', description: 'Interoperability blockchain connecting multiple chains via IBC protocol.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'FIL', name: 'Filecoin', price: 8850000, change: 320000, changePercent: 3.75, open: 8530000, high: 9000000, low: 8400000, volume: 5345600, marketCap: 5200000000000, category: 'crypto', sector: 'Cryptocurrency', description: 'Decentralized storage network for storing data at lower cost than cloud.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'NEAR', name: 'NEAR Protocol', price: 10250000, change: 450000, changePercent: 4.59, open: 9800000, high: 10500000, low: 9700000, volume: 7345600, marketCap: 11500000000000, category: 'crypto', sector: 'Cryptocurrency', description: 'Sharded proof-of-stake blockchain for developer-friendly dApps.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'ALGO', name: 'Algorand', price: 28500, change: 850, changePercent: 3.07, open: 27650, high: 29000, low: 27200, volume: 9345600, marketCap: 2300000000000, category: 'crypto', sector: 'Cryptocurrency', description: 'Pure proof-of-stake blockchain for fast, secure, and scalable transactions.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'VET', name: 'VeChain', price: 4500, change: 120, changePercent: 2.74, open: 4380, high: 4600, low: 4300, volume: 11345600, marketCap: 3200000000000, category: 'crypto', sector: 'Cryptocurrency', description: 'Enterprise blockchain for supply chain management and business processes.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'SAND', name: 'The Sandbox', price: 68500, change: -2800, changePercent: -3.93, open: 71300, high: 72000, low: 67000, volume: 8345600, marketCap: 1700000000000, category: 'crypto', sector: 'Cryptocurrency', description: 'Metaverse gaming platform where players build and monetize virtual experiences.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'MANA', name: 'Decentraland', price: 72000, change: 1800, changePercent: 2.56, open: 70200, high: 73500, low: 69500, volume: 7345600, marketCap: 1500000000000, category: 'crypto', sector: 'Cryptocurrency', description: 'Virtual reality platform on Ethereum for creating and exploring 3D worlds.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'AXS', name: 'Axie Infinity', price: 1250000, change: -35000, changePercent: -2.72, open: 1285000, high: 1300000, low: 1230000, volume: 5345600, marketCap: 2000000000000, category: 'crypto', sector: 'Cryptocurrency', description: 'Play-to-earn gaming platform with NFT-based creatures called Axies.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'THETA', name: 'Theta Network', price: 3250000, change: 125000, changePercent: 4.00, open: 3125000, high: 3300000, low: 3080000, volume: 4345600, marketCap: 3200000000000, category: 'crypto', sector: 'Cryptocurrency', description: 'Decentralized video streaming network powered by users sharing bandwidth.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'APT', name: 'Aptos', price: 14250000, change: 580000, changePercent: 4.24, open: 13670000, high: 14500000, low: 13400000, volume: 6345600, marketCap: 7300000000000, category: 'crypto', sector: 'Cryptocurrency', description: 'Layer-1 blockchain with Move language for safe and scalable smart contracts.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'ARB', name: 'Arbitrum', price: 1650000, change: 52000, changePercent: 3.25, open: 1598000, high: 1680000, low: 1570000, volume: 9345600, marketCap: 11200000000000, category: 'crypto', sector: 'Cryptocurrency', description: 'Leading Ethereum L2 rollup for faster and cheaper transactions.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'OP', name: 'Optimism', price: 3850000, change: -120000, changePercent: -3.02, open: 3970000, high: 4000000, low: 3820000, volume: 5345600, marketCap: 4800000000000, category: 'crypto', sector: 'Cryptocurrency', description: 'Optimistic rollup scaling Ethereum with the OP Stack ecosystem.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'IMX', name: 'Immutable X', price: 3450000, change: 98000, changePercent: 2.92, open: 3352000, high: 3500000, low: 3320000, volume: 4345600, marketCap: 5500000000000, category: 'crypto', sector: 'Cryptocurrency', description: 'Layer-2 for NFTs on Ethereum with zero gas fees and carbon neutrality.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'INJ', name: 'Injective', price: 42500000, change: 1800000, changePercent: 4.42, open: 40700000, high: 43000000, low: 40200000, volume: 3345600, marketCap: 4200000000000, category: 'crypto', sector: 'Cryptocurrency', description: 'DeFi-focused blockchain for cross-chain derivatives and borderless finance.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'TIA', name: 'Celestia', price: 18250000, change: -620000, changePercent: -3.29, open: 18870000, high: 19000000, low: 18100000, volume: 4345600, marketCap: 3500000000000, category: 'crypto', sector: 'Cryptocurrency', description: 'Modular blockchain for data availability enabling sovereign rollups.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'SEI', name: 'Sei Network', price: 850000, change: 28000, changePercent: 3.41, open: 822000, high: 865000, low: 815000, volume: 7345600, marketCap: 2800000000000, category: 'crypto', sector: 'Cryptocurrency', description: 'Fastest Layer-1 blockchain optimized for trading with parallelized execution.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'SUI', name: 'Sui', price: 22500000, change: 950000, changePercent: 4.41, open: 21550000, high: 22800000, low: 21300000, volume: 8345600, marketCap: 7500000000000, category: 'crypto', sector: 'Cryptocurrency', description: 'Layer-1 with Move language and object-centric model for fast transactions.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'PEPE', name: 'Pepe', price: 185, change: 12, changePercent: 6.94, open: 173, high: 190, low: 168, volume: 82345600, marketCap: 7800000000000, category: 'crypto', sector: 'Cryptocurrency', description: 'Popular meme token inspired by Pepe the Frog internet meme.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'FTM', name: 'Fantom', price: 985000, change: 32000, changePercent: 3.36, open: 953000, high: 1000000, low: 940000, volume: 6345600, marketCap: 2800000000000, category: 'crypto', sector: 'Cryptocurrency', description: 'High-speed DAG-based smart contract platform for DeFi applications.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'GRT', name: 'The Graph', price: 38500, change: 1200, changePercent: 3.22, open: 37300, high: 39200, low: 36800, volume: 9345600, marketCap: 3800000000000, category: 'crypto', sector: 'Cryptocurrency', description: 'Indexing protocol for querying blockchain data via subgraphs.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'ENS', name: 'Ethereum Name Service', price: 18500000, change: -450000, changePercent: -2.37, open: 18950000, high: 19100000, low: 18300000, volume: 2345600, marketCap: 600000000000, category: 'crypto', sector: 'Cryptocurrency', description: 'Decentralized naming system for Ethereum wallet addresses and domains.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'LDO', name: 'Lido DAO', price: 3650000, change: 98000, changePercent: 2.76, open: 3552000, high: 3700000, low: 3520000, volume: 5345600, marketCap: 3200000000000, category: 'crypto', sector: 'Cryptocurrency', description: 'Liquid staking solution for Ethereum enabling stETH token trading.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'RPL', name: 'Rocket Pool', price: 4850000, change: -180000, changePercent: -3.57, open: 5030000, high: 5080000, low: 4800000, volume: 2345600, marketCap: 1100000000000, category: 'crypto', sector: 'Cryptocurrency', description: 'Decentralized Ethereum staking protocol with node operator network.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'STX', name: 'Stacks', price: 4850000, change: 185000, changePercent: 3.96, open: 4665000, high: 4900000, low: 4620000, volume: 6345600, marketCap: 7200000000000, category: 'crypto', sector: 'Cryptocurrency', description: 'Bitcoin layer for smart contracts and decentralized applications.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },

      // ===== Additional Forex =====
      { code: 'EURGBP', name: 'Euro / British Pound', price: 8548, change: -15, changePercent: -0.18, open: 8563, high: 8572, low: 8535, volume: 320000000, marketCap: 0, category: 'forex', sector: 'Forex', description: 'Cross pair of two major European currencies. ECB vs BoE policy.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'EURJPY', name: 'Euro / Japanese Yen', price: 16245, change: 85, changePercent: 0.53, open: 16160, high: 16280, low: 16125, volume: 380000000, marketCap: 0, category: 'forex', sector: 'Forex', description: 'Major cross pair. Eurozone vs Bank of Japan monetary policy divergence.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'GBPJPY', name: 'British Pound / Japanese Yen', price: 19005, change: -42, changePercent: -0.22, open: 19047, high: 19082, low: 18965, volume: 250000000, marketCap: 0, category: 'forex', sector: 'Forex', description: 'Volatile cross pair. BoE rate decisions vs BoJ ultra-loose policy.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'AUDJPY', name: 'Australian Dollar / Japanese Yen', price: 9795, change: 35, changePercent: 0.36, open: 9760, high: 9825, low: 9740, volume: 180000000, marketCap: 0, category: 'forex', sector: 'Forex', description: 'Carry trade pair. RBA vs BoJ interest rate differential.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'EURAUD', name: 'Euro / Australian Dollar', price: 16582, change: -45, changePercent: -0.27, open: 16627, high: 16655, low: 16550, volume: 120000000, marketCap: 0, category: 'forex', sector: 'Forex', description: 'Cross pair. ECB vs RBA monetary policy and commodity price influence.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'GBPAUD', name: 'British Pound / Australian Dollar', price: 19405, change: 62, changePercent: 0.32, open: 19343, high: 19450, low: 19310, volume: 85000000, marketCap: 0, category: 'forex', sector: 'Forex', description: 'Cross pair influenced by UK and Australian economic data.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'EURNZD', name: 'Euro / New Zealand Dollar', price: 17725, change: 28, changePercent: 0.16, open: 17697, high: 17755, low: 17672, volume: 75000000, marketCap: 0, category: 'forex', sector: 'Forex', description: 'Cross pair. ECB vs RBNZ rate policy and dairy export influence.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'GBPCAD', name: 'British Pound / Canadian Dollar', price: 17285, change: -38, changePercent: -0.22, open: 17323, high: 17355, low: 17250, volume: 95000000, marketCap: 0, category: 'forex', sector: 'Forex', description: 'Cross pair. BoE vs BoC policy with oil price correlation.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'USDSGD', name: 'US Dollar / Singapore Dollar', price: 13425, change: 8, changePercent: 0.06, open: 13417, high: 13438, low: 13410, volume: 85000000, marketCap: 0, category: 'forex', sector: 'Forex', description: 'Asian pair. MAS manages SGD within a policy band against a basket.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'USDHKD', name: 'US Dollar / Hong Kong Dollar', price: 7815, change: 1, changePercent: 0.01, open: 7814, high: 7816, low: 7814, volume: 65000000, marketCap: 0, category: 'forex', sector: 'Forex', description: 'Pegged pair. HKD linked to USD at around 7.80 per HKMA peg system.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'USDSEK', name: 'US Dollar / Swedish Krona', price: 10625, change: -52, changePercent: -0.49, open: 10677, high: 10695, low: 10610, volume: 75000000, marketCap: 0, category: 'forex', sector: 'Forex', description: 'Scandinavian pair. Riksbank vs Fed policy and EUR/SEK correlation.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'USDNOK', name: 'US Dollar / Norwegian Krone', price: 10845, change: 35, changePercent: 0.32, open: 10810, high: 10872, low: 10795, volume: 70000000, marketCap: 0, category: 'forex', sector: 'Forex', description: 'Oil-influenced pair. Norges Bank policy and North Sea oil revenue.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'USDDKK', name: 'US Dollar / Danish Krone', price: 6875, change: 12, changePercent: 0.17, open: 6863, high: 6882, low: 6855, volume: 45000000, marketCap: 0, category: 'forex', sector: 'Forex', description: 'European pegged pair. DKK pegged to EUR within ERM II band.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'USDZAR', name: 'US Dollar / South African Rand', price: 18525, change: 185, changePercent: 1.01, open: 18340, high: 18580, low: 18300, volume: 95000000, marketCap: 0, category: 'forex', sector: 'Forex', description: 'Emerging market pair. SARB policy, commodity prices, and political risk.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'USDTRY', name: 'US Dollar / Turkish Lira', price: 325000, change: 2500, changePercent: 0.77, open: 322500, high: 326000, low: 321500, volume: 85000000, marketCap: 0, category: 'forex', sector: 'Forex', description: 'High-yield emerging pair. CBRT policy and inflation dynamics.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'USDMXN', name: 'US Dollar / Mexican Peso', price: 16850, change: -120, changePercent: -0.71, open: 16970, high: 17000, low: 16820, volume: 110000000, marketCap: 0, category: 'forex', sector: 'Forex', description: 'High-yield pair. Banxico policy and US-Mexico trade dynamics.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'USDPLN', name: 'US Dollar / Polish Zloty', price: 3985, change: 18, changePercent: 0.45, open: 3967, high: 3995, low: 3955, volume: 55000000, marketCap: 0, category: 'forex', sector: 'Forex', description: 'CEE pair. NBP policy and EU convergence dynamics.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'EURCHF', name: 'Euro / Swiss Franc', price: 9585, change: -8, changePercent: -0.08, open: 9593, high: 9602, low: 9575, volume: 150000000, marketCap: 0, category: 'forex', sector: 'Forex', description: 'European cross pair. SNB vs ECB policy and safe haven flows.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },

      // ===== Additional Commodities =====
      { code: 'PLATINUM', name: 'Platinum (XPT)', price: 15500000, change: -320000, changePercent: -2.02, open: 15820000, high: 15850000, low: 15450000, volume: 85000000, marketCap: 0, category: 'commodity', sector: 'Commodity', description: 'Precious metal used in catalytic converters, jewelry, and fuel cells.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'PALLADIUM', name: 'Palladium (XPD)', price: 17250000, change: 480000, changePercent: 2.86, open: 16770000, high: 17300000, low: 16700000, volume: 65000000, marketCap: 0, category: 'commodity', sector: 'Commodity', description: 'Precious metal critical for automotive catalytic converters.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'WHEAT', name: 'Wheat', price: 385000, change: 8500, changePercent: 2.26, open: 376500, high: 387000, low: 374000, volume: 120000000, marketCap: 0, category: 'commodity', sector: 'Commodity', description: 'Global food staple. Weather, export policy, and demand driven pricing.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'CORN', name: 'Corn', price: 285000, change: -5800, changePercent: -1.99, open: 290800, high: 291500, low: 283000, volume: 135000000, marketCap: 0, category: 'commodity', sector: 'Commodity', description: 'Key agricultural commodity for food, feed, and ethanol production.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'SOYBEANS', name: 'Soybeans', price: 445000, change: 12000, changePercent: 2.77, open: 433000, high: 448000, low: 431000, volume: 95000000, marketCap: 0, category: 'commodity', sector: 'Commodity', description: 'Major oilseed crop for animal feed, cooking oil, and biodiesel.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'SUGAR', name: 'Sugar #11', price: 48500, change: -1200, changePercent: -2.41, open: 49700, high: 50000, low: 48200, volume: 105000000, marketCap: 0, category: 'commodity', sector: 'Commodity', description: 'Global soft commodity. Brazil and India production drive pricing.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'COFFEE', name: 'Coffee (Arabica)', price: 685000, change: 18500, changePercent: 2.78, open: 666500, high: 690000, low: 663000, volume: 85000000, marketCap: 0, category: 'commodity', sector: 'Commodity', description: 'Global beverage commodity. Brazil weather and inventory driven.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'COTTON', name: 'Cotton #2', price: 125000, change: -2800, changePercent: -2.19, open: 127800, high: 128500, low: 124000, volume: 75000000, marketCap: 0, category: 'commodity', sector: 'Commodity', description: 'Textile commodity. Weather, demand from apparel, and inventory drive price.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'LUMBER', name: 'Lumber', price: 850000, change: 22000, changePercent: 2.65, open: 828000, high: 855000, low: 823000, volume: 45000000, marketCap: 0, category: 'commodity', sector: 'Commodity', description: 'Construction commodity. Housing starts and seasonal demand drive pricing.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'RICE', name: 'Rough Rice', price: 285000, change: 5200, changePercent: 1.86, open: 279800, high: 287000, low: 278000, volume: 35000000, marketCap: 0, category: 'commodity', sector: 'Commodity', description: 'Staple food commodity. Asian production and export policy influence price.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'CACAO', name: 'Cocoa', price: 1450000, change: 38000, changePercent: 2.69, open: 1412000, high: 1460000, low: 1405000, volume: 55000000, marketCap: 0, category: 'commodity', sector: 'Commodity', description: 'Chocolate commodity. West African weather and supply constraints drive price.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'RUBBER', name: 'Rubber (TSR20)', price: 235000, change: -4200, changePercent: -1.76, open: 239200, high: 240000, low: 233500, volume: 42000000, marketCap: 0, category: 'commodity', sector: 'Commodity', description: 'Industrial commodity for tires. Thai and Malaysian production key.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },
      { code: 'IRON', name: 'Iron Ore', price: 185000, change: 5200, changePercent: 2.89, open: 179800, high: 186500, low: 178500, volume: 95000000, marketCap: 0, category: 'commodity', sector: 'Commodity', description: 'Steel-making commodity. China demand and Australian/Brazilian supply key.', peRatio: 0, pbv: 0, dividendYield: 0, lotSize: 1 },

      // ===== More Healthcare =====
      { code: 'ABT', name: 'Abbott Laboratories', price: 172000, change: 3200, changePercent: 1.89, open: 168800, high: 173000, low: 168000, volume: 5345600, marketCap: 298000000000000, category: 'healthcare', sector: 'Healthcare', logo: '/stocks/ABT.png', description: 'Diversified healthcare company with diagnostics, medical devices, and nutrition.', peRatio: 25.8, pbv: 5.2, dividendYield: 1.6, lotSize: 1 },
      { code: 'TMO', name: 'Thermo Fisher Scientific', price: 855000, change: 12800, changePercent: 1.52, open: 842200, high: 858000, low: 840000, volume: 2345600, marketCap: 325000000000000, category: 'healthcare', sector: 'Healthcare', logo: '/stocks/TMO.png', description: 'Leading life sciences tools and services company. Analytical instruments and reagents.', peRatio: 35.2, pbv: 6.8, dividendYield: 0.3, lotSize: 1 },
      { code: 'DHR', name: 'Danaher Corporation', price: 385000, change: -5200, changePercent: -1.33, open: 390200, high: 391000, low: 383000, volume: 3345600, marketCap: 285000000000000, category: 'healthcare', sector: 'Healthcare', logo: '/stocks/DHR.png', description: 'Life sciences and diagnostics conglomerate. Strong bioprocessing and Cepheid platforms.', peRatio: 42.5, pbv: 5.8, dividendYield: 0.4, lotSize: 1 },
      { code: 'ISRG', name: 'Intuitive Surgical', price: 645000, change: 15200, changePercent: 2.41, open: 629800, high: 648000, low: 628000, volume: 2345600, marketCap: 228000000000000, category: 'healthcare', sector: 'Healthcare', logo: '/stocks/ISRG.png', description: 'Robotic surgery pioneer with da Vinci surgical systems. Expanding Ion lung platform.', peRatio: 65.2, pbv: 8.5, dividendYield: 0.0, lotSize: 1 },
      { code: 'SYK', name: 'Stryker Corporation', price: 525000, change: 8200, changePercent: 1.59, open: 516800, high: 528000, low: 515000, volume: 1345600, marketCap: 200000000000000, category: 'healthcare', sector: 'Healthcare', logo: '/stocks/SYK.png', description: 'Medical technology leader in orthopedics, surgical, and neurotechnology.', peRatio: 32.8, pbv: 6.2, dividendYield: 1.0, lotSize: 1 },
      { code: 'BSX', name: 'Boston Scientific', price: 115000, change: 2800, changePercent: 2.49, open: 112200, high: 116000, low: 111500, volume: 7345600, marketCap: 170000000000000, category: 'healthcare', sector: 'Healthcare', logo: '/stocks/BSX.png', description: 'Medical device innovator in interventional cardiology and endoscopy.', peRatio: 55.2, pbv: 5.8, dividendYield: 0.0, lotSize: 1 },
      { code: 'EW', name: 'Edwards Lifesciences', price: 125000, change: -3500, changePercent: -2.72, open: 128500, high: 129000, low: 124000, volume: 4345600, marketCap: 75000000000000, category: 'healthcare', sector: 'Healthcare', logo: '/stocks/EW.png', description: 'Heart valve replacement leader. Transcatheter aortic valve replacement pioneer.', peRatio: 28.5, pbv: 6.8, dividendYield: 0.0, lotSize: 1 },
      { code: 'GILD', name: 'Gilead Sciences', price: 112000, change: 1800, changePercent: 1.63, open: 110200, high: 113000, low: 109500, volume: 8345600, marketCap: 140000000000000, category: 'healthcare', sector: 'Healthcare', logo: '/stocks/GILD.png', description: 'Biopharmaceutical leader in HIV, hepatitis, and oncology treatments.', peRatio: 12.5, pbv: 4.2, dividendYield: 3.8, lotSize: 1 },
      { code: 'AMGN', name: 'Amgen Inc.', price: 435000, change: 6200, changePercent: 1.45, open: 428800, high: 438000, low: 427000, volume: 3345600, marketCap: 232000000000000, category: 'healthcare', sector: 'Healthcare', logo: '/stocks/AMGN.png', description: 'Biotechnology pioneer with treatments for osteoporosis, cancer, and kidney disease.', peRatio: 22.5, pbv: 18.2, dividendYield: 3.0, lotSize: 1 },
      { code: 'BIIB', name: 'Biogen Inc.', price: 385000, change: -8200, changePercent: -2.09, open: 393200, high: 395000, low: 383000, volume: 2345600, marketCap: 56000000000000, category: 'healthcare', sector: 'Healthcare', logo: '/stocks/BIIB.png', description: 'Neuroscience company focused on MS, Alzheimer, and rare disease therapies.', peRatio: 15.2, pbv: 3.5, dividendYield: 0.0, lotSize: 1 },
      { code: 'REGN', name: 'Regeneron Pharmaceuticals', price: 1450000, change: 28000, changePercent: 1.97, open: 1422000, high: 1460000, low: 1415000, volume: 1345600, marketCap: 155000000000000, category: 'healthcare', sector: 'Healthcare', logo: '/stocks/REGN.png', description: 'Biotechnology leader with Eylea and Dupixent for eye and inflammatory diseases.', peRatio: 25.8, pbv: 5.2, dividendYield: 0.0, lotSize: 1 },
      { code: 'MRNA', name: 'Moderna Inc.', price: 125000, change: -3800, changePercent: -2.95, open: 128800, high: 130000, low: 124000, volume: 5345600, marketCap: 48000000000000, category: 'healthcare', sector: 'Healthcare', logo: '/stocks/MRNA.png', description: 'mRNA vaccine pioneer. Expanding pipeline beyond COVID into cancer and rare diseases.', peRatio: -15.2, pbv: 2.8, dividendYield: 0.0, lotSize: 1 },
      { code: 'VRTX', name: 'Vertex Pharmaceuticals', price: 685000, change: 12000, changePercent: 1.78, open: 673000, high: 688000, low: 671000, volume: 1345600, marketCap: 175000000000000, category: 'healthcare', sector: 'Healthcare', logo: '/stocks/VRTX.png', description: 'Cystic fibrosis drug leader. Expanding into pain, sickle cell, and gene editing.', peRatio: 28.5, pbv: 8.2, dividendYield: 0.0, lotSize: 1 },
      { code: 'CVS', name: 'CVS Health', price: 98000, change: 2100, changePercent: 2.19, open: 95900, high: 99000, low: 95000, volume: 9345600, marketCap: 125000000000000, category: 'healthcare', sector: 'Healthcare', logo: '/stocks/CVS.png', description: 'Healthcare company combining pharmacy, insurance, and retail clinic services.', peRatio: 11.2, pbv: 1.8, dividendYield: 3.5, lotSize: 1 },
      { code: 'CI', name: 'Cigna Group', price: 525000, change: -8500, changePercent: -1.59, open: 533500, high: 535000, low: 522000, volume: 2345600, marketCap: 158000000000000, category: 'healthcare', sector: 'Healthcare', logo: '/stocks/CI.png', description: 'Global health services company with insurance and pharmacy benefit management.', peRatio: 18.5, pbv: 3.2, dividendYield: 1.8, lotSize: 1 },
      { code: 'HUM', name: 'Humana Inc.', price: 445000, change: 9200, changePercent: 2.11, open: 435800, high: 448000, low: 434000, volume: 1345600, marketCap: 54000000000000, category: 'healthcare', sector: 'Healthcare', logo: '/stocks/HUM.png', description: 'Medicare Advantage specialist with growing healthcare services.', peRatio: 22.8, pbv: 4.5, dividendYield: 1.2, lotSize: 1 },
      { code: 'CNC', name: 'Centene Corp.', price: 115000, change: 1800, changePercent: 1.59, open: 113200, high: 116000, low: 112500, volume: 3345600, marketCap: 62000000000000, category: 'healthcare', sector: 'Healthcare', logo: '/stocks/CNC.png', description: 'Government-sponsored healthcare programs specialist. Medicaid and Marketplace leader.', peRatio: 15.8, pbv: 2.1, dividendYield: 0.0, lotSize: 1 },

      // ===== More Consumer/FMCG =====
      { code: 'PG', name: 'Procter & Gamble', price: 245000, change: 3200, changePercent: 1.32, open: 241800, high: 246000, low: 241000, volume: 7345600, marketCap: 578000000000000, category: 'consumer', sector: 'Consumer', logo: '/stocks/PG.png', description: 'Global consumer goods giant with brands like Tide, Pampers, and Gillette.', peRatio: 26.5, pbv: 7.8, dividendYield: 2.4, lotSize: 1 },
      { code: 'CL', name: 'Colgate-Palmolive', price: 125000, change: -1800, changePercent: -1.42, open: 126800, high: 127000, low: 124000, volume: 5345600, marketCap: 102000000000000, category: 'consumer', sector: 'Consumer', logo: '/stocks/CL.png', description: 'Global oral care and household products leader. Colgate brand dominance.', peRatio: 28.2, pbv: 28.5, dividendYield: 2.2, lotSize: 1 },
      { code: 'EL', name: 'Estee Lauder Companies', price: 215000, change: -5800, changePercent: -2.62, open: 220800, high: 221000, low: 213000, volume: 3345600, marketCap: 77000000000000, category: 'consumer', sector: 'Consumer', logo: '/stocks/EL.png', description: 'Global prestige beauty company with skincare, makeup, and fragrance brands.', peRatio: 42.5, pbv: 8.5, dividendYield: 1.2, lotSize: 1 },
      { code: 'PM', name: 'Philip Morris International', price: 175000, change: 2800, changePercent: 1.63, open: 172200, high: 176000, low: 171500, volume: 5345600, marketCap: 272000000000000, category: 'consumer', sector: 'Consumer', logo: '/stocks/PM.png', description: 'International tobacco company. Transitioning to smoke-free with IQOS.', peRatio: 18.5, pbv: 0, dividendYield: 5.2, lotSize: 1 },
      { code: 'MO', name: 'Altria Group', price: 65000, change: 850, changePercent: 1.32, open: 64150, high: 65500, low: 63800, volume: 8345600, marketCap: 115000000000000, category: 'consumer', sector: 'Consumer', logo: '/stocks/MO.png', description: 'US tobacco company with Marlboro rights. High dividend yield stock.', peRatio: 9.8, pbv: 0, dividendYield: 8.5, lotSize: 1 },

      // ===== More Defense/Aerospace =====
      { code: 'LMT', name: 'Lockheed Martin', price: 725000, change: 8500, changePercent: 1.19, open: 716500, high: 728000, low: 714000, volume: 1345600, marketCap: 172000000000000, category: 'defense', sector: 'Defense', logo: '/stocks/LMT.png', description: 'Aerospace and defense contractor. F-35 fighter jet and missile systems leader.', peRatio: 17.2, pbv: 18.5, dividendYield: 2.6, lotSize: 1 },
      { code: 'NOC', name: 'Northrop Grumman', price: 685000, change: -12000, changePercent: -1.72, open: 697000, high: 698000, low: 682000, volume: 1345600, marketCap: 102000000000000, category: 'defense', sector: 'Defense', logo: '/stocks/NOC.png', description: 'Defense technology company. B-21 bomber and space systems specialist.', peRatio: 15.8, pbv: 5.2, dividendYield: 1.6, lotSize: 1 },
      { code: 'RTX', name: 'RTX Corporation', price: 165000, change: 3800, changePercent: 2.36, open: 161200, high: 166000, low: 160500, volume: 6345600, marketCap: 122000000000000, category: 'defense', sector: 'Defense', logo: '/stocks/RTX.png', description: 'Aerospace and defense conglomerate. Pratt & Whitney engines and Collins Aerospace.', peRatio: 22.5, pbv: 3.8, dividendYield: 2.2, lotSize: 1 },
      { code: 'GD', name: 'General Dynamics', price: 445000, change: 5200, changePercent: 1.18, open: 439800, high: 447000, low: 438000, volume: 1345600, marketCap: 81000000000000, category: 'defense', sector: 'Defense', logo: '/stocks/GD.png', description: 'Aerospace and defense company. Gulfstream jets and military vehicles.', peRatio: 18.2, pbv: 5.8, dividendYield: 2.0, lotSize: 1 },

      // ===== More Energy =====
      { code: 'SLB', name: 'Schlumberger', price: 75000, change: 1200, changePercent: 1.63, open: 73800, high: 76000, low: 73200, volume: 9345600, marketCap: 106000000000000, category: 'energy', sector: 'Energy', logo: '/stocks/SLB.png', description: 'Worlds largest oilfield services company. Digital solutions for energy industry.', peRatio: 18.5, pbv: 4.2, dividendYield: 1.5, lotSize: 1 },
      { code: 'FANG', name: 'Diamondback Energy', price: 285000, change: 6200, changePercent: 2.22, open: 278800, high: 287000, low: 277000, volume: 2345600, marketCap: 51000000000000, category: 'energy', sector: 'Energy', logo: '/stocks/FANG.png', description: 'Permian Basin focused E&P company. Pure-play on Texas oil production.', peRatio: 10.5, pbv: 2.8, dividendYield: 3.2, lotSize: 1 },
      { code: 'MPC', name: 'Marathon Petroleum', price: 255000, change: -5200, changePercent: -2.00, open: 260200, high: 261000, low: 253000, volume: 3345600, marketCap: 92000000000000, category: 'energy', sector: 'Energy', logo: '/stocks/MPC.png', description: 'Largest US refiner by capacity. Speedway retail and midstream operations.', peRatio: 8.5, pbv: 2.2, dividendYield: 2.0, lotSize: 1 },
      { code: 'PSX', name: 'Phillips 66', price: 215000, change: 3200, changePercent: 1.51, open: 211800, high: 217000, low: 211000, volume: 2345600, marketCap: 88000000000000, category: 'energy', sector: 'Energy', logo: '/stocks/PSX.png', description: 'Diversified energy manufacturing company. Refining, midstream, and chemicals.', peRatio: 12.2, pbv: 2.5, dividendYield: 3.2, lotSize: 1 },
      { code: 'OXY', name: 'Occidental Petroleum', price: 95000, change: -1800, changePercent: -1.86, open: 96800, high: 97000, low: 94000, volume: 5345600, marketCap: 87000000000000, category: 'energy', sector: 'Energy', logo: '/stocks/OXY.png', description: 'Integrated oil company with Permian Basin focus and carbon capture initiatives.', peRatio: 14.2, pbv: 2.8, dividendYield: 1.2, lotSize: 1 },
      { code: 'EOG', name: 'EOG Resources', price: 195000, change: 4200, changePercent: 2.20, open: 190800, high: 197000, low: 190000, volume: 2345600, marketCap: 110000000000000, category: 'energy', sector: 'Energy', logo: '/stocks/EOG.png', description: 'Premium crude oil and natural gas exploration company. Returns-focused strategy.', peRatio: 11.5, pbv: 3.2, dividendYield: 2.8, lotSize: 1 },

      // ===== More Tech/Growth =====
      { code: 'SNAP', name: 'Snap Inc.', price: 18500, change: -680, changePercent: -3.55, open: 19180, high: 19300, low: 18300, volume: 18345600, marketCap: 28000000000000, category: 'tech', sector: 'Technology', logo: '/stocks/SNAP.png', description: 'Social media company behind Snapchat. AR advertising and camera platform.', peRatio: -25.2, pbv: 4.8, dividendYield: 0.0, lotSize: 1 },
      { code: 'PINS', name: 'Pinterest Inc.', price: 58000, change: 1200, changePercent: 2.11, open: 56800, high: 58500, low: 56500, volume: 9345600, marketCap: 40000000000000, category: 'tech', sector: 'Technology', logo: '/stocks/PINS.png', description: 'Visual discovery and shopping platform. Growing e-commerce integration.', peRatio: 28.5, pbv: 5.2, dividendYield: 0.0, lotSize: 1 },
      { code: 'RIVN', name: 'Rivian Automotive', price: 25000, change: 850, changePercent: 3.52, open: 24150, high: 25200, low: 24000, volume: 14345600, marketCap: 25000000000000, category: 'tech', sector: 'Automotive', logo: '/stocks/RIVN.png', description: 'Electric vehicle maker focused on trucks and SUVs. Amazon delivery van partner.', peRatio: -8.5, pbv: 2.8, dividendYield: 0.0, lotSize: 1 },
      { code: 'LCID', name: 'Lucid Group', price: 5000, change: -180, changePercent: -3.47, open: 5180, high: 5200, low: 4900, volume: 18345600, marketCap: 12000000000000, category: 'tech', sector: 'Automotive', logo: '/stocks/LCID.png', description: 'Luxury electric vehicle manufacturer. Premium EV sedan with extended range.', peRatio: -5.2, pbv: 3.5, dividendYield: 0.0, lotSize: 1 },
      { code: 'NIO', name: 'NIO Inc.', price: 8000, change: 320, changePercent: 4.17, open: 7680, high: 8100, low: 7600, volume: 22345600, marketCap: 18000000000000, category: 'tech', sector: 'Automotive', logo: '/stocks/NIO.png', description: 'Chinese premium EV maker with battery swap technology and autonomous driving.', peRatio: -12.5, pbv: 4.2, dividendYield: 0.0, lotSize: 1 },
      { code: 'PLTR', name: 'Palantir Technologies', price: 35000, change: 1200, changePercent: 3.55, open: 33800, high: 35200, low: 33500, volume: 22345600, marketCap: 78000000000000, category: 'tech', sector: 'Technology', logo: '/stocks/PLTR.png', description: 'Data analytics and AI platform for government and enterprise. Gotham and Foundry.', peRatio: 85.2, pbv: 18.5, dividendYield: 0.0, lotSize: 1 },
      { code: 'DKNG', name: 'DraftKings Inc.', price: 65000, change: -1800, changePercent: -2.69, open: 66800, high: 67000, low: 64500, volume: 8345600, marketCap: 32000000000000, category: 'tech', sector: 'Technology', logo: '/stocks/DKNG.png', description: 'Online sports betting and daily fantasy sports platform. Growing US market share.', peRatio: -35.2, pbv: 5.8, dividendYield: 0.0, lotSize: 1 },
      { code: 'RBLX', name: 'Roblox Corporation', price: 78000, change: 2800, changePercent: 3.72, open: 75200, high: 78500, low: 74800, volume: 7345600, marketCap: 48000000000000, category: 'tech', sector: 'Technology', logo: '/stocks/RBLX.png', description: 'Gaming platform and creation system. User-generated 3D experiences and virtual economy.', peRatio: -42.5, pbv: 12.8, dividendYield: 0.0, lotSize: 1 },
      { code: 'SHOP', name: 'Shopify Inc.', price: 115000, change: -2800, changePercent: -2.37, open: 117800, high: 118500, low: 114000, volume: 5345600, marketCap: 148000000000000, category: 'tech', sector: 'Technology', logo: '/stocks/SHOP.png', description: 'E-commerce platform empowering merchants worldwide. Growing payments and logistics.', peRatio: 62.5, pbv: 8.5, dividendYield: 0.0, lotSize: 1 },
      { code: 'SE', name: 'Sea Limited', price: 95000, change: 3200, changePercent: 3.48, open: 91800, high: 96000, low: 91000, volume: 5345600, marketCap: 55000000000000, category: 'tech', sector: 'Technology', logo: '/stocks/SE.png', description: 'Southeast Asian tech conglomerate. Shopee e-commerce, Garena gaming, SeaMoney fintech.', peRatio: -18.5, pbv: 5.2, dividendYield: 0.0, lotSize: 1 },
      { code: 'GRAB', name: 'Grab Holdings', price: 65000, change: 1500, changePercent: 2.36, open: 63500, high: 65500, low: 63000, volume: 9345600, marketCap: 25000000000000, category: 'tech', sector: 'Technology', logo: '/stocks/GRAB.png', description: 'Southeast Asias leading superapp. Ride-hailing, food delivery, and financial services.', peRatio: -45.2, pbv: 4.8, dividendYield: 0.0, lotSize: 1 },
      { code: 'HOOD', name: 'Robinhood Markets', price: 32000, change: 980, changePercent: 3.16, open: 31020, high: 32500, low: 30800, volume: 11345600, marketCap: 28000000000000, category: 'tech', sector: 'Technology', logo: '/stocks/HOOD.png', description: 'Commission-free trading platform. Democratizing finance for retail investors.', peRatio: 55.8, pbv: 3.2, dividendYield: 0.0, lotSize: 1 },
      { code: 'ROKU', name: 'Roku Inc.', price: 115000, change: -3200, changePercent: -2.71, open: 118200, high: 119000, low: 114000, volume: 4345600, marketCap: 16000000000000, category: 'tech', sector: 'Technology', logo: '/stocks/ROKU.png', description: 'Streaming platform and connected TV devices. Ad-supported Roku Channel growing.', peRatio: -25.8, pbv: 3.5, dividendYield: 0.0, lotSize: 1 },
      { code: 'ZM', name: 'Zoom Video Communications', price: 98000, change: -1500, changePercent: -1.51, open: 99500, high: 100000, low: 97000, volume: 3345600, marketCap: 29000000000000, category: 'tech', sector: 'Technology', logo: '/stocks/ZM.png', description: 'Video communications platform. Enterprise and AI companion features driving growth.', peRatio: 28.5, pbv: 4.2, dividendYield: 0.0, lotSize: 1 },
      { code: 'TEAM', name: 'Atlassian Corporation', price: 295000, change: 6800, changePercent: 2.36, open: 288200, high: 298000, low: 287000, volume: 2345600, marketCap: 76000000000000, category: 'tech', sector: 'Technology', logo: '/stocks/TEAM.png', description: 'Collaboration software maker. Jira, Confluence, and Trello for team productivity.', peRatio: 85.2, pbv: 18.5, dividendYield: 0.0, lotSize: 1 },

      // ===== More Cybersecurity/Software =====
      { code: 'CRWD', name: 'CrowdStrike', price: 485000, change: 12500, changePercent: 2.65, open: 472500, high: 488000, low: 471000, volume: 3345600, marketCap: 118000000000000, category: 'tech', sector: 'Cybersecurity', logo: '/stocks/CRWD.png', description: 'Cloud-native endpoint security leader. Falcon platform for threat detection.', peRatio: 85.2, pbv: 22.5, dividendYield: 0.0, lotSize: 1 },
      { code: 'PANW', name: 'Palo Alto Networks', price: 485000, change: -8500, changePercent: -1.72, open: 493500, high: 495000, low: 482000, volume: 2345600, marketCap: 158000000000000, category: 'tech', sector: 'Cybersecurity', logo: '/stocks/PANW.png', description: 'Enterprise cybersecurity leader. Next-gen firewall and cloud security platform.', peRatio: 52.8, pbv: 18.2, dividendYield: 0.0, lotSize: 1 },
      { code: 'MNDY', name: 'Monday.com', price: 345000, change: 8200, changePercent: 2.44, open: 336800, high: 348000, low: 335000, volume: 1345600, marketCap: 16500000000000, category: 'tech', sector: 'Technology', logo: '/stocks/MNDY.png', description: 'Work management platform. Project planning and team collaboration SaaS.', peRatio: 125.5, pbv: 22.8, dividendYield: 0.0, lotSize: 1 },
      { code: 'DDOG', name: 'Datadog', price: 185000, change: 4200, changePercent: 2.32, open: 180800, high: 187000, low: 180000, volume: 3345600, marketCap: 60000000000000, category: 'tech', sector: 'Technology', logo: '/stocks/DDOG.png', description: 'Cloud monitoring and analytics platform. Observability for modern infrastructure.', peRatio: 72.5, pbv: 15.8, dividendYield: 0.0, lotSize: 1 },
      { code: 'NET', name: 'Cloudflare', price: 125000, change: -2800, changePercent: -2.19, open: 127800, high: 128500, low: 124000, volume: 5345600, marketCap: 42000000000000, category: 'tech', sector: 'Technology', logo: '/stocks/NET.png', description: 'Web infrastructure and security company. CDN, DDoS protection, and edge computing.', peRatio: -180.5, pbv: 18.2, dividendYield: 0.0, lotSize: 1 },
      { code: 'MDB', name: 'MongoDB', price: 525000, change: 12500, changePercent: 2.44, open: 512500, high: 528000, low: 510000, volume: 2345600, marketCap: 38000000000000, category: 'tech', sector: 'Technology', logo: '/stocks/MDB.png', description: 'Document database platform for modern applications. Atlas cloud database growing fast.', peRatio: -120.2, pbv: 12.8, dividendYield: 0.0, lotSize: 1 },
      { code: 'HUBS', name: 'HubSpot', price: 855000, change: -12000, changePercent: -1.38, open: 867000, high: 868000, low: 850000, volume: 1345600, marketCap: 42000000000000, category: 'tech', sector: 'Technology', logo: '/stocks/HUBS.png', description: 'CRM platform for SMBs. Marketing, sales, and service hub solutions.', peRatio: 95.2, pbv: 8.5, dividendYield: 0.0, lotSize: 1 },
      { code: 'TWLO', name: 'Twilio', price: 98000, change: 2800, changePercent: 2.94, open: 95200, high: 99000, low: 94500, volume: 4345600, marketCap: 17000000000000, category: 'tech', sector: 'Technology', logo: '/stocks/TWLO.png', description: 'Cloud communications platform. APIs for messaging, voice, and video.', peRatio: -28.5, pbv: 3.2, dividendYield: 0.0, lotSize: 1 },
      { code: 'OKTA', name: 'Okta Inc.', price: 155000, change: 3500, changePercent: 2.31, open: 151500, high: 157000, low: 150500, volume: 2345600, marketCap: 24000000000000, category: 'tech', sector: 'Technology', logo: '/stocks/OKTA.png', description: 'Identity and access management leader. Cloud SSO and MFA for enterprises.', peRatio: -45.2, pbv: 3.8, dividendYield: 0.0, lotSize: 1 },
      { code: 'ZS', name: 'Zscaler', price: 285000, change: 5200, changePercent: 1.86, open: 279800, high: 287000, low: 278000, volume: 2345600, marketCap: 42000000000000, category: 'tech', sector: 'Cybersecurity', logo: '/stocks/ZS.png', description: 'Cloud security platform for zero-trust architecture. Secure web gateway leader.', peRatio: -120.5, pbv: 18.2, dividendYield: 0.0, lotSize: 1 },
      { code: 'PATH', name: 'UiPath Inc.', price: 22000, change: -580, changePercent: -2.57, open: 22580, high: 22700, low: 21800, volume: 5345600, marketCap: 12000000000000, category: 'tech', sector: 'Technology', logo: '/stocks/PATH.png', description: 'Robotic process automation platform. Enterprise AI-powered automation solutions.', peRatio: -85.2, pbv: 4.5, dividendYield: 0.0, lotSize: 1 },
      { code: 'AI', name: 'C3.ai', price: 48000, change: 2200, changePercent: 4.80, open: 45800, high: 48500, low: 45500, volume: 7345600, marketCap: 6000000000000, category: 'tech', sector: 'Technology', logo: '/stocks/AI.png', description: 'Enterprise AI software platform. Predictive maintenance and smart analytics.', peRatio: -42.5, pbv: 5.2, dividendYield: 0.0, lotSize: 1 },
      { code: 'SOUN', name: 'SoundHound AI', price: 8500, change: 520, changePercent: 6.52, open: 7980, high: 8600, low: 7900, volume: 14345600, marketCap: 3500000000000, category: 'tech', sector: 'Technology', logo: '/stocks/SOUN.png', description: 'Voice AI and conversational intelligence platform. Automotive and restaurant solutions.', peRatio: -25.8, pbv: 8.5, dividendYield: 0.0, lotSize: 1 },

      // ===== More Financials =====
      { code: 'BRK.B', name: 'Berkshire Hathaway', price: 625000, change: 8500, changePercent: 1.38, open: 616500, high: 628000, low: 615000, volume: 3345600, marketCap: 890000000000000, category: 'bluechip', sector: 'Finance', logo: '/stocks/BRK.B.png', description: 'Warren Buffetts conglomerate. Insurance, railroads, utilities, and equity portfolio.', peRatio: 8.5, pbv: 1.5, dividendYield: 0.0, lotSize: 1 },
      { code: 'SCHW', name: 'Charles Schwab', price: 105000, change: 2800, changePercent: 2.74, open: 102200, high: 106000, low: 101500, volume: 8345600, marketCap: 188000000000000, category: 'banking', sector: 'Finance', logo: '/stocks/SCHW.png', description: 'Largest retail brokerage firm. Banking, trading, and wealth management services.', peRatio: 22.5, pbv: 2.8, dividendYield: 1.5, lotSize: 1 },
      { code: 'BLK', name: 'BlackRock Inc.', price: 1250000, change: 25000, changePercent: 2.04, open: 1225000, high: 1255000, low: 1220000, volume: 1345600, marketCap: 190000000000000, category: 'banking', sector: 'Finance', logo: '/stocks/BLK.png', description: 'Worlds largest asset manager. iShares ETFs and Aladdin risk management platform.', peRatio: 22.8, pbv: 3.2, dividendYield: 2.2, lotSize: 1 },
      { code: 'AXP', name: 'American Express', price: 345000, change: 5200, changePercent: 1.53, open: 339800, high: 347000, low: 338000, volume: 3345600, marketCap: 250000000000000, category: 'bluechip', sector: 'Finance', logo: '/stocks/AXP.png', description: 'Global payments and travel services company. Premium card portfolio with high spenders.', peRatio: 18.5, pbv: 6.2, dividendYield: 1.2, lotSize: 1 },
      { code: 'C', name: 'Citigroup', price: 85000, change: -1200, changePercent: -1.39, open: 86200, high: 86500, low: 84000, volume: 12345600, marketCap: 162000000000000, category: 'banking', sector: 'Finance', logo: '/stocks/C.png', description: 'Global banking giant with restructuring underway. Consumer and institutional banking.', peRatio: 10.8, pbv: 0.6, dividendYield: 3.2, lotSize: 1 },
      { code: 'WFC', name: 'Wells Fargo', price: 85000, change: 1800, changePercent: 2.16, open: 83200, high: 85500, low: 82800, volume: 14345600, marketCap: 288000000000000, category: 'banking', sector: 'Finance', logo: '/stocks/WFC.png', description: 'Major US bank focused on consumer and commercial banking. Turnaround story.', peRatio: 12.5, pbv: 1.2, dividendYield: 2.8, lotSize: 1 },
      { code: 'MS', name: 'Morgan Stanley', price: 135000, change: 2200, changePercent: 1.66, open: 132800, high: 136000, low: 132000, volume: 5345600, marketCap: 220000000000000, category: 'banking', sector: 'Finance', logo: '/stocks/MS.png', description: 'Investment bank and wealth management firm. E*TRADE and Eaton Vance acquisitions.', peRatio: 16.2, pbv: 1.8, dividendYield: 3.5, lotSize: 1 },

      // ===== More REITs =====
      { code: 'SPG', name: 'Simon Property Group', price: 245000, change: 3800, changePercent: 1.58, open: 241200, high: 247000, low: 240000, volume: 2345600, marketCap: 78000000000000, category: 'realestate', sector: 'REITs', logo: '/stocks/SPG.png', description: 'Largest US mall REIT. Premium outlet and shopping center operator.', peRatio: 18.5, pbv: 12.2, dividendYield: 4.5, lotSize: 1 },
      { code: 'PLD', name: 'Prologis', price: 195000, change: -2800, changePercent: -1.41, open: 197800, high: 198500, low: 194000, volume: 3345600, marketCap: 180000000000000, category: 'realestate', sector: 'REITs', logo: '/stocks/PLD.png', description: 'Global logistics REIT. E-commerce warehouse and distribution center leader.', peRatio: 62.5, pbv: 2.8, dividendYield: 2.8, lotSize: 1 },
      { code: 'AMT', name: 'American Tower', price: 285000, change: 5200, changePercent: 1.86, open: 279800, high: 287000, low: 278000, volume: 2345600, marketCap: 132000000000000, category: 'realestate', sector: 'REITs', logo: '/stocks/AMT.png', description: 'Global cell tower REIT. 5G infrastructure and data center expansion.', peRatio: 45.2, pbv: 5.8, dividendYield: 3.2, lotSize: 1 },
      { code: 'EQIX', name: 'Equinix', price: 1250000, change: 18000, changePercent: 1.46, open: 1232000, high: 1255000, low: 1230000, volume: 1345600, marketCap: 120000000000000, category: 'realestate', sector: 'REITs', logo: '/stocks/EQIX.png', description: 'Digital infrastructure REIT. Global data center platform for cloud and AI.', peRatio: 72.5, pbv: 6.8, dividendYield: 1.8, lotSize: 1 },
      { code: 'O', name: 'Realty Income', price: 85000, change: 1200, changePercent: 1.43, open: 83800, high: 85500, low: 83200, volume: 5345600, marketCap: 59000000000000, category: 'realestate', sector: 'REITs', logo: '/stocks/O.png', description: 'Monthly dividend REIT. Net lease properties across retail and industrial sectors.', peRatio: 52.8, pbv: 1.8, dividendYield: 5.2, lotSize: 1 },
      { code: 'PSA', name: 'Public Storage', price: 445000, change: -5200, changePercent: -1.15, open: 450200, high: 451000, low: 442000, volume: 1345600, marketCap: 78000000000000, category: 'realestate', sector: 'REITs', logo: '/stocks/PSA.png', description: 'Self-storage REIT. Largest self-storage company in the US.', peRatio: 35.2, pbv: 8.5, dividendYield: 3.8, lotSize: 1 },
      { code: 'CCI', name: 'Crown Castle', price: 155000, change: -2800, changePercent: -1.77, open: 157800, high: 158500, low: 154000, volume: 3345600, marketCap: 67000000000000, category: 'realestate', sector: 'REITs', logo: '/stocks/CCI.png', description: 'Cell tower and fiber REIT. US communications infrastructure provider.', peRatio: 38.5, pbv: 3.2, dividendYield: 5.8, lotSize: 1 },
      { code: 'DLR', name: 'Digital Realty', price: 215000, change: 3800, changePercent: 1.80, open: 211200, high: 217000, low: 210000, volume: 2345600, marketCap: 63000000000000, category: 'realestate', sector: 'REITs', logo: '/stocks/DLR.png', description: 'Data center REIT. Global colocation and interconnection solutions.', peRatio: 45.2, pbv: 3.8, dividendYield: 2.8, lotSize: 1 },
      { code: 'VICI', name: 'VICI Properties', price: 48000, change: 680, changePercent: 1.44, open: 47320, high: 48200, low: 47100, volume: 5345600, marketCap: 48000000000000, category: 'realestate', sector: 'REITs', logo: '/stocks/VICI.png', description: 'Experiential net lease REIT. Caesars and MGM casino properties.', peRatio: 22.8, pbv: 1.5, dividendYield: 5.0, lotSize: 1 },

      // ===== More Media =====
      { code: 'WBD', name: 'Warner Bros. Discovery', price: 15000, change: 480, changePercent: 3.31, open: 14520, high: 15200, low: 14400, volume: 14345600, marketCap: 37000000000000, category: 'media', sector: 'Entertainment', logo: '/stocks/WBD.png', description: 'Media conglomerate with HBO Max, Discovery+, and Warner Bros. studios.', peRatio: -12.5, pbv: 0.8, dividendYield: 0.0, lotSize: 1 },
      { code: 'PARA', name: 'Paramount Global', price: 18500, change: -520, changePercent: -2.73, open: 19020, high: 19200, low: 18300, volume: 9345600, marketCap: 12000000000000, category: 'media', sector: 'Entertainment', logo: '/stocks/PARA.png', description: 'Media company with Paramount+, CBS, and film studio operations.', peRatio: -8.5, pbv: 0.5, dividendYield: 1.2, lotSize: 1 },
      { code: 'FOX', name: 'Fox Corporation', price: 68500, change: 1200, changePercent: 1.78, open: 67300, high: 69000, low: 67000, volume: 2345600, marketCap: 19000000000000, category: 'media', sector: 'Entertainment', logo: '/stocks/FOX.png', description: 'Media company with Fox News, Fox Sports, and broadcast network.', peRatio: 15.2, pbv: 2.5, dividendYield: 1.2, lotSize: 1 },

      // ===== More Telecom =====
      { code: 'T', name: 'AT&T Inc.', price: 28000, change: 520, changePercent: 1.89, open: 27480, high: 28200, low: 27300, volume: 22345600, marketCap: 200000000000000, category: 'telecom', sector: 'Telecom', logo: '/stocks/T.png', description: 'Telecommunications giant. Wireless, fiber broadband, and HBO Max streaming.', peRatio: 9.5, pbv: 1.2, dividendYield: 5.8, lotSize: 1 },
      { code: 'VZ', name: 'Verizon Communications', price: 65000, change: -850, changePercent: -1.29, open: 65850, high: 66000, low: 64800, volume: 11345600, marketCap: 272000000000000, category: 'telecom', sector: 'Telecom', logo: '/stocks/VZ.png', description: 'Largest US wireless carrier. 5G network leader and Fios broadband.', peRatio: 8.2, pbv: 1.8, dividendYield: 6.5, lotSize: 1 },
      { code: 'TMUS', name: 'T-Mobile US', price: 345000, change: 6200, changePercent: 1.83, open: 338800, high: 347000, low: 337000, volume: 2345600, marketCap: 400000000000000, category: 'telecom', sector: 'Telecom', logo: '/stocks/TMUS.png', description: 'Fastest growing US wireless carrier. 5G Ultra Capacity leadership.', peRatio: 22.5, pbv: 2.2, dividendYield: 1.5, lotSize: 1 },

      // ===== More Retail/Home =====
      { code: 'TGT', name: 'Target Corp.', price: 215000, change: -5200, changePercent: -2.36, open: 220200, high: 221000, low: 213000, volume: 5345600, marketCap: 99000000000000, category: 'consumer', sector: 'Retail', logo: '/stocks/TGT.png', description: 'General merchandise retailer. Target+ digital marketplace and same-day services.', peRatio: 18.5, pbv: 8.2, dividendYield: 3.2, lotSize: 1 },
      { code: 'LOW', name: 'Lowes Companies', price: 345000, change: 5800, changePercent: 1.71, open: 339200, high: 347000, low: 338000, volume: 3345600, marketCap: 198000000000000, category: 'consumer', sector: 'Retail', logo: '/stocks/LOW.png', description: 'Home improvement retailer. Pro customer focus and digital transformation.', peRatio: 22.8, pbv: 0, dividendYield: 1.8, lotSize: 1 },
      { code: 'HD', name: 'Home Depot', price: 525000, change: 8200, changePercent: 1.59, open: 516800, high: 528000, low: 515000, volume: 3345600, marketCap: 525000000000000, category: 'consumer', sector: 'Retail', logo: '/stocks/HD.png', description: 'Largest home improvement retailer. Pro and DIY customer base with strong e-commerce.', peRatio: 25.2, pbv: 0, dividendYield: 2.2, lotSize: 1 },
      { code: 'DLTR', name: 'Dollar Tree', price: 115000, change: 2800, changePercent: 2.49, open: 112200, high: 116000, low: 111500, volume: 3345600, marketCap: 25000000000000, category: 'consumer', sector: 'Retail', logo: '/stocks/DLTR.png', description: 'Discount variety store chain. Multi-price-point strategy expanding margins.', peRatio: 28.5, pbv: 5.2, dividendYield: 0.0, lotSize: 1 },
      { code: 'TJX', name: 'TJX Companies', price: 165000, change: 2200, changePercent: 1.35, open: 162800, high: 166000, low: 162000, volume: 3345600, marketCap: 190000000000000, category: 'consumer', sector: 'Retail', logo: '/stocks/TJX.png', description: 'Off-price retail leader. TJ Maxx, Marshalls, and HomeGoods brands.', peRatio: 25.8, pbv: 12.5, dividendYield: 1.5, lotSize: 1 },

      // ===== More Transportation =====
      { code: 'UPS', name: 'United Parcel Service', price: 195000, change: -3200, changePercent: -1.61, open: 198200, high: 199000, low: 194000, volume: 4345600, marketCap: 165000000000000, category: 'infrastructure', sector: 'Logistics', logo: '/stocks/UPS.png', description: 'Global logistics and package delivery leader. E-commerce fulfillment specialist.', peRatio: 18.2, pbv: 12.8, dividendYield: 4.2, lotSize: 1 },
      { code: 'FDX', name: 'FedEx Corporation', price: 385000, change: 8500, changePercent: 2.26, open: 376500, high: 388000, low: 375000, volume: 2345600, marketCap: 95000000000000, category: 'infrastructure', sector: 'Logistics', logo: '/stocks/FDX.png', description: 'Global shipping and logistics company. Express, Ground, and Freight segments.', peRatio: 15.8, pbv: 3.2, dividendYield: 1.8, lotSize: 1 },
      { code: 'DAL', name: 'Delta Air Lines', price: 75000, change: 1800, changePercent: 2.46, open: 73200, high: 76000, low: 72800, volume: 7345600, marketCap: 48000000000000, category: 'infrastructure', sector: 'Airlines', logo: '/stocks/DAL.png', description: 'Premium US airline. Strong loyalty program and international route network.', peRatio: 8.5, pbv: 0, dividendYield: 0.0, lotSize: 1 },
    ]

    // Batch create all stocks - insert in chunks of 50 to avoid issues
    let stocksCreated = 0
    for (let i = 0; i < stockData.length; i += 50) {
      try {
        const result = await db.stock.createMany({ data: stockData.slice(i, i + 50) })
        stocksCreated += result.count
      } catch (batchErr) {
        // Fallback: insert one by one for this batch
        for (const stock of stockData.slice(i, i + 50)) {
          try {
            await db.stock.create({ data: stock })
            stocksCreated++
          } catch (e) {
            // Skip duplicates or invalid entries
          }
        }
      }
    }

    // Generate price history in batches (only for first 80 stocks to save time)
    const historyBatch = []
    for (const stock of stockData.slice(0, 80)) {
      const basePrice = stock.price
      for (let i = 60; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        date.setHours(9 + Math.floor(Math.random() * 7), Math.floor(Math.random() * 60), 0, 0)
        const randomChange = (Math.random() - 0.5) * 0.04
        const historyPrice = Math.round(basePrice * (1 + randomChange))
        historyBatch.push({
          stockCode: stock.code,
          price: historyPrice,
          open: stock.open,
          high: Math.max(historyPrice, stock.high),
          low: Math.min(historyPrice, stock.low),
          volume: stock.volume,
          timestamp: date,
        })
      }
    }
    // Insert in chunks of 500
    for (let i = 0; i < historyBatch.length; i += 500) {
      await db.stockPriceHistory.createMany({ data: historyBatch.slice(i, i + 500) })
    }

    // Give demo user some initial portfolio
    const aapl = await db.stock.findUnique({ where: { code: 'AAPL' } })
    const nvda = await db.stock.findUnique({ where: { code: 'NVDA' } })
    const msft = await db.stock.findUnique({ where: { code: 'MSFT' } })

    if (aapl) {
      await db.portfolio.create({
        data: { userId: demoUser.id, stockId: aapl.id, shares: 10, avgPrice: 170000 },
      })
      await db.transaction.create({
        data: { userId: demoUser.id, stockId: aapl.id, type: 'BUY', shares: 10, price: 170000, total: 1700000, fee: 2550, status: 'completed' },
      })
    }

    if (nvda) {
      await db.portfolio.create({
        data: { userId: demoUser.id, stockId: nvda.id, shares: 5, avgPrice: 850000 },
      })
      await db.transaction.create({
        data: { userId: demoUser.id, stockId: nvda.id, type: 'BUY', shares: 5, price: 850000, total: 4250000, fee: 6375, status: 'completed' },
      })
    }

    if (msft) {
      await db.portfolio.create({
        data: { userId: demoUser.id, stockId: msft.id, shares: 8, avgPrice: 400000 },
      })
      await db.transaction.create({
        data: { userId: demoUser.id, stockId: msft.id, type: 'BUY', shares: 8, price: 400000, total: 3200000, fee: 4800, status: 'completed' },
      })
    }

    return NextResponse.json({
      message: 'Database seeded successfully',
      stocksCreated: stockData.length,
      marketIndicesCreated: marketIndices.length,
      newsCreated: newsData.length,
      promosCreated: promoData.length,
      notificationsCreated: notifications.length,
      demoUser: { phone: '081234567890', password: 'demo123', referralCode: demoUser.referralCode, vipLevel: 'Gold' },
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: 'Failed to seed database' },
      { status: 500 }
    )
  }
}
