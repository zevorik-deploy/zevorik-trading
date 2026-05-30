import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/invest/products - Get all investment products
export async function GET() {
  try {
    // Auto-seed if no products exist
    const count = await db.investmentProduct.count()
    if (count === 0) {
      const products = [
        { name: 'Potential I', category: 'potential', modal: 50000, dailyProfit: 17500, totalReturn: 700000, duration: 40, roi: 1400, order: 1 },
        { name: 'Potential II', category: 'potential', modal: 150000, dailyProfit: 55500, totalReturn: 2220000, duration: 40, roi: 1480, order: 2 },
        { name: 'Potential III', category: 'potential', modal: 400000, dailyProfit: 155000, totalReturn: 6200000, duration: 40, roi: 1550, order: 3 },
        { name: 'Potential IV', category: 'potential', modal: 1000000, dailyProfit: 395000, totalReturn: 15800000, duration: 40, roi: 1580, order: 4 },
        { name: 'Potential V', category: 'potential', modal: 2500000, dailyProfit: 1000000, totalReturn: 40000000, duration: 40, roi: 1600, order: 5 },
        { name: 'Potential VI', category: 'potential', modal: 5000000, dailyProfit: 2000000, totalReturn: 80000000, duration: 40, roi: 1600, order: 6 },
        { name: 'Potential VII', category: 'potential', modal: 12500000, dailyProfit: 5000000, totalReturn: 200000000, duration: 40, roi: 1600, order: 7 },
        { name: 'Potential VIII', category: 'potential', modal: 30000000, dailyProfit: 12000000, totalReturn: 480000000, duration: 40, roi: 1600, order: 8 },
        { name: 'Potential Extra', category: 'potential', modal: 50000000, dailyProfit: 2000000, totalReturn: 200000000, duration: 100, roi: 400, order: 9 },
        { name: 'Dividen I', category: 'dividen', modal: 30000, dailyProfit: 45000, totalReturn: 45000, duration: 1, roi: 150, order: 10 },
        { name: 'Dividen II', category: 'dividen', modal: 250000, dailyProfit: 150000, totalReturn: 450000, duration: 3, roi: 180, order: 11 },
        { name: 'Dividen III', category: 'dividen', modal: 500000, dailyProfit: 335000, totalReturn: 1005000, duration: 3, roi: 201, order: 12 },
        { name: 'Dividen IV', category: 'dividen', modal: 1000000, dailyProfit: 700000, totalReturn: 2100000, duration: 3, roi: 210, order: 13 },
        { name: 'Dividen V', category: 'dividen', modal: 2000000, dailyProfit: 1400000, totalReturn: 4200000, duration: 3, roi: 210, order: 14 },
        { name: 'Dividen VI', category: 'dividen', modal: 5000000, dailyProfit: 3500000, totalReturn: 10500000, duration: 3, roi: 210, order: 15 },
        { name: 'Dividen VII', category: 'dividen', modal: 10000000, dailyProfit: 7000000, totalReturn: 21000000, duration: 3, roi: 210, order: 16 },
        { name: 'Dividen VIII', category: 'dividen', modal: 30000000, dailyProfit: 21000000, totalReturn: 63000000, duration: 3, roi: 210, order: 17 },
      ]
      await db.investmentProduct.createMany({ data: products })
    }

    const products = await db.investmentProduct.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Get investment products error:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

// POST /api/invest - Purchase investment product
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, productId } = body

    if (!userId || !productId) {
      return NextResponse.json({ error: 'userId dan productId wajib diisi' }, { status: 400 })
    }

    // Get product
    const product = await db.investmentProduct.findUnique({ where: { id: productId } })
    if (!product) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })
    }
    if (!product.isActive) {
      return NextResponse.json({ error: 'Produk tidak tersedia' }, { status: 400 })
    }

    // Get user
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    // Check balance
    if (user.balance < product.modal) {
      return NextResponse.json({ error: 'Saldo tidak mencukupi' }, { status: 400 })
    }

    // Deduct balance and create investment in a transaction
    const investment = await db.$transaction(async (tx) => {
      // Deduct user balance
      await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: product.modal } },
      })

      // Create investment record
      const inv = await tx.investment.create({
        data: {
          userId,
          productId,
          amount: product.modal,
          dailyProfit: product.dailyProfit,
          totalReturn: product.totalReturn,
          duration: product.duration,
          status: 'active',
        },
      })

      // Create notification
      await tx.notification.create({
        data: {
          userId,
          title: 'Investasi Berhasil',
          message: `Anda berhasil membeli ${product.name} senilai Rp ${product.modal.toLocaleString('id-ID')}. Profit harian: Rp ${product.dailyProfit.toLocaleString('id-ID')}`,
          type: 'trade',
        },
      })

      return inv
    })

    return NextResponse.json({ investment, newBalance: (user.balance - product.modal) })
  } catch (error) {
    console.error('Purchase investment error:', error)
    return NextResponse.json({ error: 'Gagal memproses investasi' }, { status: 500 })
  }
}
