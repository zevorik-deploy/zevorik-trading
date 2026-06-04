import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/invest/products - Get all investment products
export async function GET() {
  try {
    // Auto-seed: always ensure we have the correct 3 packages
    const count = await db.investmentProduct.count()
    // If wrong number of products, delete and reseed
    if (count !== 3) {
      await db.investmentProduct.deleteMany({})
      const products = [
        { name: 'Paket Starter 1K', category: 'starter', modal: 1000, dailyProfit: 500, totalReturn: 15000, duration: 30, roi: 1500, order: 1 },
        { name: 'Paket Growth 6K', category: 'growth', modal: 6000, dailyProfit: 3000, totalReturn: 120000, duration: 40, roi: 2000, order: 2 },
        { name: 'Paket Premium 200K', category: 'premium', modal: 200000, dailyProfit: 100000, totalReturn: 4000000, duration: 40, roi: 2000, order: 3 },
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

    // Package prerequisites
    if (product.category === 'growth' && user.totalDeposit < 1000000) {
      return NextResponse.json({ error: 'Paket Growth 6K memerlukan total deposit minimum Rp 1.000.000. Silakan deposit terlebih dahulu.' }, { status: 400 })
    }
    if (product.category === 'premium') {
      // Check if user has purchased Starter package first
      const hasStarter = await db.investment.findFirst({
        where: { userId, status: { in: ['active', 'completed'] } },
        include: { product: { where: { category: 'starter' } } },
      })
      const starterInvestment = await db.investment.findFirst({
        where: { userId, status: { in: ['active', 'completed'] } },
      })
      // Check if any of user's investments are starter category
      const userInvestmentsWithProducts = await db.investment.findMany({
        where: { userId, status: { in: ['active', 'completed'] } },
        include: { product: true },
      })
      const hasStarterPkg = userInvestmentsWithProducts.some(inv => inv.product.category === 'starter')
      if (!hasStarterPkg) {
        return NextResponse.json({ error: 'Paket Premium 200K memerlukan pembelian Paket Starter 1K terlebih dahulu.' }, { status: 400 })
      }
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
