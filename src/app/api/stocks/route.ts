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
    const { code, name, price, category, sector, description, logo } = body

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
        logo: logo || `/stocks/${code}.png`,
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
    // Technology Giants
    { code: 'AAPL', name: 'Apple Inc.', price: 175000, change: 3200, changePercent: 1.86, open: 172000, high: 176500, low: 171500, volume: 52345600, marketCap: 2710000000000000, category: 'bluechip', sector: 'Technology', logo: '/stocks/AAPL.png', description: 'Tech giant known for iPhone, Mac, iPad, and services. Largest company by market cap.', peRatio: 29.8, pbv: 45.2, dividendYield: 0.6, lotSize: 1 },
    { code: 'NVDA', name: 'NVIDIA Corporation', price: 890000, change: 28500, changePercent: 3.31, open: 862000, high: 895000, low: 858000, volume: 41234500, marketCap: 2180000000000000, category: 'bluechip', sector: 'Technology', logo: '/stocks/NVDA.png', description: 'Leading AI chipmaker and GPU manufacturer.', peRatio: 65.2, pbv: 52.8, dividendYield: 0.03, lotSize: 1 },
    { code: 'MSFT', name: 'Microsoft Corporation', price: 415000, change: 8500, changePercent: 2.09, open: 407000, high: 418000, low: 406000, volume: 22345600, marketCap: 3080000000000000, category: 'bluechip', sector: 'Technology', logo: '/stocks/MSFT.png', description: 'Cloud computing leader with Azure.', peRatio: 36.5, pbv: 12.8, dividendYield: 0.8, lotSize: 1 },
    { code: 'GOOGL', name: 'Alphabet Inc.', price: 155000, change: -2800, changePercent: -1.77, open: 158000, high: 159000, low: 154000, volume: 25345600, marketCap: 1920000000000000, category: 'bluechip', sector: 'Technology', logo: '/stocks/GOOGL.png', description: 'Parent company of Google and YouTube.', peRatio: 24.2, pbv: 7.1, dividendYield: 0.5, lotSize: 1 },
    { code: 'META', name: 'Meta Platforms Inc.', price: 505000, change: 12400, changePercent: 2.52, open: 493000, high: 508000, low: 491000, volume: 17345600, marketCap: 1280000000000000, category: 'bluechip', sector: 'Technology', logo: '/stocks/META.png', description: 'Social media giant owning Facebook, Instagram, WhatsApp.', peRatio: 26.8, pbv: 8.5, dividendYield: 0.4, lotSize: 1 },
    { code: 'AMZN', name: 'Amazon.com Inc.', price: 185000, change: 4100, changePercent: 2.27, open: 181000, high: 187000, low: 180000, volume: 32345600, marketCap: 1920000000000000, category: 'bluechip', sector: 'Technology', logo: '/stocks/AMZN.png', description: 'E-commerce and cloud computing giant.', peRatio: 58.3, pbv: 9.2, dividendYield: 0.0, lotSize: 1 },
    { code: 'TSLA', name: 'Tesla Inc.', price: 245000, change: -7800, changePercent: -3.09, open: 253000, high: 254000, low: 242000, volume: 82345600, marketCap: 780000000000000, category: 'bluechip', sector: 'Automotive', logo: '/stocks/TSLA.png', description: 'Electric vehicle pioneer and clean energy company.', peRatio: 72.5, pbv: 15.8, dividendYield: 0.0, lotSize: 1 },
    { code: 'AMD', name: 'Advanced Micro Devices Inc.', price: 168000, change: 5200, changePercent: 3.19, open: 163000, high: 170000, low: 162000, volume: 45345600, marketCap: 272000000000000, category: 'tech', sector: 'Technology', logo: '/stocks/AMD.png', description: 'Semiconductor company competing in AI chips and CPUs.', peRatio: 45.2, pbv: 5.8, dividendYield: 0.0, lotSize: 1 },
    // Finance
    { code: 'JPM', name: 'JPMorgan Chase & Co.', price: 198000, change: 3600, changePercent: 1.85, open: 195000, high: 200000, low: 194000, volume: 9345600, marketCap: 572000000000000, category: 'bluechip', sector: 'Finance', logo: '/stocks/JPM.png', description: 'Largest bank in the US by assets.', peRatio: 12.1, pbv: 1.9, dividendYield: 2.3, lotSize: 1 },
    { code: 'V', name: 'Visa Inc.', price: 280000, change: 4100, changePercent: 1.49, open: 276000, high: 282000, low: 275000, volume: 7345600, marketCap: 560000000000000, category: 'bluechip', sector: 'Finance', logo: '/stocks/V.png', description: 'Global payments technology company.', peRatio: 30.5, pbv: 13.2, dividendYield: 0.8, lotSize: 1 },
    { code: 'MA', name: 'Mastercard Inc.', price: 465000, change: 8200, changePercent: 1.80, open: 457000, high: 468000, low: 456000, volume: 4345600, marketCap: 432000000000000, category: 'bluechip', sector: 'Finance', logo: '/stocks/MA.png', description: 'Global technology company in the payments industry.', peRatio: 35.2, pbv: 55.8, dividendYield: 0.6, lotSize: 1 },
    { code: 'GS', name: 'Goldman Sachs Group Inc.', price: 485000, change: -8200, changePercent: -1.66, open: 494000, high: 496000, low: 482000, volume: 3345600, marketCap: 165000000000000, category: 'banking', sector: 'Finance', logo: '/stocks/GS.png', description: 'Premier global investment banking firm.', peRatio: 15.8, pbv: 1.5, dividendYield: 2.6, lotSize: 1 },
    { code: 'BAC', name: 'Bank of America Corp.', price: 142000, change: 2800, changePercent: 2.01, open: 139500, high: 143000, low: 139000, volume: 14345600, marketCap: 352000000000000, category: 'banking', sector: 'Finance', logo: '/stocks/BAC.png', description: 'One of the largest banks in the US.', peRatio: 11.8, pbv: 1.2, dividendYield: 2.6, lotSize: 1 },
    { code: 'PGR', name: 'Progressive Corp.', price: 245000, change: 5200, changePercent: 2.17, open: 240000, high: 247000, low: 239000, volume: 2345600, marketCap: 144000000000000, category: 'banking', sector: 'Finance', logo: '/stocks/PGR.png', description: 'Major insurance company.', peRatio: 16.5, pbv: 3.8, dividendYield: 1.2, lotSize: 1 },
    // Healthcare
    { code: 'UNH', name: 'UnitedHealth Group', price: 525000, change: 9800, changePercent: 1.90, open: 516000, high: 528000, low: 515000, volume: 4345600, marketCap: 485000000000000, category: 'healthcare', sector: 'Healthcare', logo: '/stocks/UNH.png', description: 'Largest health insurer in the US.', peRatio: 22.1, pbv: 6.8, dividendYield: 1.4, lotSize: 1 },
    { code: 'JNJ', name: 'Johnson & Johnson', price: 162000, change: -1500, changePercent: -0.92, open: 164000, high: 165000, low: 161000, volume: 8345600, marketCap: 390000000000000, category: 'healthcare', sector: 'Healthcare', logo: '/stocks/JNJ.png', description: 'Diversified healthcare giant.', peRatio: 16.8, pbv: 5.2, dividendYield: 3.1, lotSize: 1 },
    { code: 'PFE', name: 'Pfizer Inc.', price: 28500, change: 680, changePercent: 2.44, open: 27900, high: 29000, low: 27800, volume: 32345600, marketCap: 161000000000000, category: 'healthcare', sector: 'Healthcare', logo: '/stocks/PFE.png', description: 'Global pharmaceutical company.', peRatio: 42.5, pbv: 1.8, dividendYield: 5.8, lotSize: 1 },
    { code: 'LLY', name: 'Eli Lilly and Company', price: 785000, change: 18500, changePercent: 2.42, open: 767000, high: 790000, low: 765000, volume: 4345600, marketCap: 742000000000000, category: 'healthcare', sector: 'Healthcare', logo: '/stocks/LLY.png', description: 'Global pharmaceutical leader in diabetes and oncology.', peRatio: 118.5, pbv: 52.8, dividendYield: 0.8, lotSize: 1 },
    { code: 'ABBV', name: 'AbbVie Inc.', price: 175000, change: 3100, changePercent: 1.80, open: 172000, high: 176000, low: 171500, volume: 6345600, marketCap: 310000000000000, category: 'healthcare', sector: 'Healthcare', logo: '/stocks/ABBV.png', description: 'Biopharmaceutical company known for Humira.', peRatio: 18.2, pbv: 5.8, dividendYield: 3.5, lotSize: 1 },
    { code: 'MRK', name: 'Merck & Co. Inc.', price: 125000, change: -1800, changePercent: -1.42, open: 127000, high: 128000, low: 124000, volume: 9345600, marketCap: 317000000000000, category: 'healthcare', sector: 'Healthcare', logo: '/stocks/MRK.png', description: 'Global pharmaceutical company. Keytruda is the top-selling oncology drug.', peRatio: 14.5, pbv: 4.2, dividendYield: 2.8, lotSize: 1 },
    // Consumer
    { code: 'WMT', name: 'Walmart Inc.', price: 168000, change: 2800, changePercent: 1.69, open: 165500, high: 169000, low: 165000, volume: 9345600, marketCap: 453000000000000, category: 'consumer', sector: 'Retail', logo: '/stocks/WMT.png', description: 'Worlds largest retailer.', peRatio: 28.5, pbv: 7.2, dividendYield: 1.2, lotSize: 1 },
    { code: 'COST', name: 'Costco Wholesale Corp.', price: 825000, change: 15200, changePercent: 1.88, open: 810000, high: 830000, low: 808000, volume: 2345600, marketCap: 366000000000000, category: 'consumer', sector: 'Retail', logo: '/stocks/COST.png', description: 'Membership warehouse club operator.', peRatio: 52.3, pbv: 18.5, dividendYield: 0.5, lotSize: 1 },
    { code: 'NKE', name: 'Nike Inc.', price: 98000, change: -2100, changePercent: -2.10, open: 100500, high: 101000, low: 97000, volume: 11345600, marketCap: 147000000000000, category: 'consumer', sector: 'Consumer', logo: '/stocks/NKE.png', description: 'Global leader in athletic footwear and apparel.', peRatio: 25.8, pbv: 10.2, dividendYield: 1.5, lotSize: 1 },
    { code: 'MCD', name: 'McDonalds Corp.', price: 295000, change: 4100, changePercent: 1.41, open: 291000, high: 297000, low: 290000, volume: 5345600, marketCap: 212000000000000, category: 'consumer', sector: 'Consumer', logo: '/stocks/MCD.png', description: 'Worlds largest fast-food restaurant chain.', peRatio: 24.2, pbv: 45.8, dividendYield: 2.3, lotSize: 1 },
    { code: 'KO', name: 'Coca-Cola Company', price: 62000, change: 850, changePercent: 1.39, open: 61200, high: 62500, low: 61000, volume: 12345600, marketCap: 268000000000000, category: 'consumer', sector: 'Consumer', logo: '/stocks/KO.png', description: 'Worlds largest non-alcoholic beverage company.', peRatio: 24.8, pbv: 11.2, dividendYield: 3.1, lotSize: 1 },
    { code: 'SBUX', name: 'Starbucks Corp.', price: 95000, change: -1200, changePercent: -1.25, open: 96500, high: 97000, low: 94000, volume: 8345600, marketCap: 108000000000000, category: 'consumer', sector: 'Consumer', logo: '/stocks/SBUX.png', description: 'Global coffeehouse chain with 38,000+ stores worldwide.', peRatio: 25.2, pbv: 15.8, dividendYield: 2.5, lotSize: 1 },
    { code: 'PEP', name: 'PepsiCo Inc.', price: 175000, change: 2100, changePercent: 1.22, open: 173000, high: 176000, low: 172500, volume: 5345600, marketCap: 241000000000000, category: 'consumer', sector: 'Consumer', logo: '/stocks/PEP.png', description: 'Global food and beverage company.', peRatio: 22.5, pbv: 8.8, dividendYield: 3.0, lotSize: 1 },
    // Energy
    { code: 'XOM', name: 'Exxon Mobil Corp.', price: 112000, change: 1800, changePercent: 1.63, open: 110500, high: 113000, low: 110000, volume: 17345600, marketCap: 455000000000000, category: 'energy', sector: 'Energy', logo: '/stocks/XOM.png', description: 'One of the worlds largest integrated oil and gas companies.', peRatio: 13.2, pbv: 2.1, dividendYield: 3.5, lotSize: 1 },
    { code: 'CVX', name: 'Chevron Corp.', price: 158000, change: -2200, changePercent: -1.37, open: 160500, high: 161000, low: 157000, volume: 9345600, marketCap: 288000000000000, category: 'energy', sector: 'Energy', logo: '/stocks/CVX.png', description: 'Integrated energy company globally.', peRatio: 14.5, pbv: 1.8, dividendYield: 4.0, lotSize: 1 },
    { code: 'COP', name: 'ConocoPhillips', price: 118000, change: 2400, changePercent: 2.07, open: 116000, high: 119000, low: 115500, volume: 6345600, marketCap: 138000000000000, category: 'energy', sector: 'Energy', logo: '/stocks/COP.png', description: 'Independent exploration and production company.', peRatio: 12.8, pbv: 2.2, dividendYield: 2.8, lotSize: 1 },
    // Industrials
    { code: 'CAT', name: 'Caterpillar Inc.', price: 345000, change: 7500, changePercent: 2.22, open: 338000, high: 348000, low: 337000, volume: 3345600, marketCap: 168000000000000, category: 'infrastructure', sector: 'Industrials', logo: '/stocks/CAT.png', description: 'Worlds leading manufacturer of construction and mining equipment.', peRatio: 17.2, pbv: 9.5, dividendYield: 1.6, lotSize: 1 },
    { code: 'BA', name: 'Boeing Co.', price: 178000, change: -5600, changePercent: -3.05, open: 184000, high: 185000, low: 176000, volume: 8345600, marketCap: 108000000000000, category: 'infrastructure', sector: 'Industrials', logo: '/stocks/BA.png', description: 'Aerospace company manufacturing commercial jetliners.', peRatio: -18.5, pbv: 8.2, dividendYield: 0.0, lotSize: 1 },
    { code: 'GE', name: 'GE Aerospace', price: 168000, change: 3200, changePercent: 1.94, open: 165000, high: 170000, low: 164000, volume: 6345600, marketCap: 183000000000000, category: 'infrastructure', sector: 'Industrials', logo: '/stocks/GE.png', description: 'Global aerospace leader in jet engine manufacturing.', peRatio: 32.5, pbv: 8.8, dividendYield: 0.8, lotSize: 1 },
    { code: 'HON', name: 'Honeywell International', price: 205000, change: 3800, changePercent: 1.89, open: 201500, high: 207000, low: 201000, volume: 4345600, marketCap: 135000000000000, category: 'infrastructure', sector: 'Industrials', logo: '/stocks/HON.png', description: 'Diversified technology and manufacturing leader.', peRatio: 23.5, pbv: 6.2, dividendYield: 2.0, lotSize: 1 },
    { code: 'DE', name: 'Deere & Company', price: 385000, change: -4200, changePercent: -1.08, open: 390000, high: 391000, low: 382000, volume: 2345600, marketCap: 108000000000000, category: 'infrastructure', sector: 'Industrials', logo: '/stocks/DE.png', description: 'Worlds leading manufacturer of agricultural machinery.', peRatio: 18.8, pbv: 7.5, dividendYield: 1.5, lotSize: 1 },
    // Entertainment
    { code: 'DIS', name: 'Walt Disney Co.', price: 112000, change: 2800, changePercent: 2.56, open: 109500, high: 113000, low: 109000, volume: 12345600, marketCap: 205000000000000, category: 'media', sector: 'Entertainment', logo: '/stocks/DIS.png', description: 'Global entertainment conglomerate with Disney+, parks, studios.', peRatio: 72.8, pbv: 2.1, dividendYield: 0.8, lotSize: 1 },
    { code: 'NFLX', name: 'Netflix Inc.', price: 625000, change: 15800, changePercent: 2.59, open: 610000, high: 630000, low: 608000, volume: 5345600, marketCap: 270000000000000, category: 'media', sector: 'Entertainment', logo: '/stocks/NFLX.png', description: 'Global streaming entertainment service.', peRatio: 42.5, pbv: 15.2, dividendYield: 0.0, lotSize: 1 },
    { code: 'CMCSA', name: 'Comcast Corp.', price: 42000, change: -580, changePercent: -1.36, open: 42800, high: 43000, low: 41800, volume: 14345600, marketCap: 162000000000000, category: 'media', sector: 'Entertainment', logo: '/stocks/CMCSA.png', description: 'Media and telecommunications conglomerate.', peRatio: 10.2, pbv: 1.8, dividendYield: 3.5, lotSize: 1 },
    // Fintech
    { code: 'COIN', name: 'Coinbase Global Inc.', price: 225000, change: -8500, changePercent: -3.64, open: 234000, high: 236000, low: 222000, volume: 14345600, marketCap: 56000000000000, category: 'tech', sector: 'Crypto', logo: '/stocks/COIN.png', description: 'Largest US cryptocurrency exchange platform.', peRatio: 28.2, pbv: 5.8, dividendYield: 0.0, lotSize: 1 },
    { code: 'SQ', name: 'Block Inc.', price: 78000, change: 2100, changePercent: 2.77, open: 76000, high: 79000, low: 75500, volume: 9345600, marketCap: 48000000000000, category: 'tech', sector: 'Fintech', logo: '/stocks/SQ.png', description: 'Financial technology company behind Square and Cash App.', peRatio: 55.2, pbv: 3.2, dividendYield: 0.0, lotSize: 1 },
    { code: 'PYPL', name: 'PayPal Holdings Inc.', price: 85000, change: 1800, changePercent: 2.16, open: 83200, high: 86000, low: 83000, volume: 11345600, marketCap: 92000000000000, category: 'tech', sector: 'Fintech', logo: '/stocks/PYPL.png', description: 'Global digital payments platform.', peRatio: 16.8, pbv: 4.5, dividendYield: 0.0, lotSize: 1 },
    // Semiconductors
    { code: 'AVGO', name: 'Broadcom Inc.', price: 1350000, change: 32500, changePercent: 2.47, open: 1318000, high: 1360000, low: 1310000, volume: 3345600, marketCap: 625000000000000, category: 'tech', sector: 'Semiconductor', logo: '/stocks/AVGO.png', description: 'Global technology leader in semiconductor solutions.', peRatio: 62.8, pbv: 8.5, dividendYield: 1.5, lotSize: 1 },
    { code: 'INTC', name: 'Intel Corporation', price: 32000, change: -680, changePercent: -2.08, open: 32800, high: 33000, low: 31500, volume: 42345600, marketCap: 135000000000000, category: 'tech', sector: 'Semiconductor', logo: '/stocks/INTC.png', description: 'Legacy chipmaker investing in foundry and AI chips.', peRatio: 85.2, pbv: 1.2, dividendYield: 1.2, lotSize: 1 },
    { code: 'TSM', name: 'Taiwan Semiconductor', price: 168000, change: 4800, changePercent: 2.94, open: 163500, high: 170000, low: 163000, volume: 18345600, marketCap: 870000000000000, category: 'tech', sector: 'Semiconductor', logo: '/stocks/TSM.png', description: 'Worlds largest dedicated independent semiconductor foundry.', peRatio: 25.8, pbv: 6.5, dividendYield: 1.5, lotSize: 1 },
    // Enterprise Software
    { code: 'CRM', name: 'Salesforce Inc.', price: 275000, change: 6200, changePercent: 2.31, open: 269000, high: 277000, low: 268000, volume: 5345600, marketCap: 265000000000000, category: 'tech', sector: 'Technology', logo: '/stocks/CRM.png', description: 'Global leader in CRM software and cloud computing.', peRatio: 45.2, pbv: 5.8, dividendYield: 0.6, lotSize: 1 },
    { code: 'ORCL', name: 'Oracle Corporation', price: 145000, change: 3800, changePercent: 2.69, open: 141500, high: 146500, low: 141000, volume: 9345600, marketCap: 402000000000000, category: 'tech', sector: 'Technology', logo: '/stocks/ORCL.png', description: 'Enterprise software giant with database and cloud applications.', peRatio: 35.2, pbv: 28.5, dividendYield: 1.2, lotSize: 1 },
    { code: 'ADBE', name: 'Adobe Inc.', price: 485000, change: -9800, changePercent: -1.98, open: 495000, high: 497000, low: 482000, volume: 4345600, marketCap: 215000000000000, category: 'tech', sector: 'Technology', logo: '/stocks/ADBE.png', description: 'Creative software leader with Photoshop, Illustrator, and Acrobat.', peRatio: 32.5, pbv: 12.8, dividendYield: 0.3, lotSize: 1 },
    { code: 'IBM', name: 'IBM Corporation', price: 195000, change: 2500, changePercent: 1.30, open: 193000, high: 197000, low: 192500, volume: 5345600, marketCap: 178000000000000, category: 'tech', sector: 'Technology', logo: '/stocks/IBM.png', description: 'Technology pioneer in hybrid cloud, AI, and quantum computing.', peRatio: 22.8, pbv: 7.5, dividendYield: 3.2, lotSize: 1 },
    { code: 'NOW', name: 'ServiceNow Inc.', price: 785000, change: 12500, changePercent: 1.62, open: 773000, high: 790000, low: 771000, volume: 2345600, marketCap: 162000000000000, category: 'tech', sector: 'Technology', logo: '/stocks/NOW.png', description: 'Enterprise cloud platform for digital workflows.', peRatio: 82.5, pbv: 22.8, dividendYield: 0.0, lotSize: 1 },
    // Ride-sharing
    { code: 'UBER', name: 'Uber Technologies Inc.', price: 72000, change: 1500, changePercent: 2.13, open: 70500, high: 73000, low: 70200, volume: 18345600, marketCap: 152000000000000, category: 'tech', sector: 'Technology', logo: '/stocks/UBER.png', description: 'Global ride-sharing and food delivery platform.', peRatio: 42.8, pbv: 8.5, dividendYield: 0.0, lotSize: 1 },
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
      { code: 'SP500', name: 'S&P 500', value: 5321.41, change: 28.73, changePercent: 0.54 },
      { code: 'NASDAQ', name: 'NASDAQ Composite', value: 16920.80, change: 145.62, changePercent: 0.87 },
      { code: 'DOW', name: 'Dow Jones Industrial', value: 39512.84, change: -42.77, changePercent: -0.11 },
      { code: 'RUSSELL', name: 'Russell 2000', value: 2067.41, change: 18.34, changePercent: 0.90 },
      { code: 'VIX', name: 'CBOE Volatility Index', value: 13.24, change: -0.87, changePercent: -6.17 },
    ]
    for (const index of marketIndices) {
      await db.marketIndex.create({ data: index })
    }
  }

  // Seed news if empty
  const newsCount = await db.news.count()
  if (newsCount === 0) {
    const newsData = [
      { title: 'NVIDIA Surges to New All-Time High on AI Chip Demand', content: 'NVIDIA shares soared to a record high after the company reported exceptional demand for its AI accelerator chips.', category: 'market', isPublished: true },
      { title: 'Fed Holds Interest Rates Steady', content: 'The Federal Reserve kept interest rates unchanged but hinted at a potential rate cut.', category: 'market', isPublished: true },
      { title: 'Apple Announces Revolutionary AI Features', content: 'Apple introduced groundbreaking AI-powered features across its product lineup.', category: 'company', isPublished: true },
      { title: 'TrendEdge Platform Upgrade: New Features Released', content: 'We are proud to announce the latest upgrade with advanced charting tools and real-time signals.', category: 'system', isPublished: true },
    ]
    for (const news of newsData) {
      await db.news.create({ data: news })
    }
  }
}
