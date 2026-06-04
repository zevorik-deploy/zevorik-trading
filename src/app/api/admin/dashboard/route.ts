import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

async function verifyAdmin(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } })
  return user?.role === 'admin'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    if (!userId || !(await verifyAdmin(userId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const [
      totalUsers,
      balanceAgg,
      depositAgg,
      withdrawalAgg,
      activeInvestments,
      pendingDeposits,
      pendingWithdrawals,
      totalNews,
      activePromos,
      totalStocks,
    ] = await Promise.all([
      db.user.count(),
      db.user.aggregate({ _sum: { balance: true } }),
      db.deposit.aggregate({ _sum: { amount: true } }),
      db.withdrawal.aggregate({ _sum: { amount: true } }),
      db.investment.count({ where: { status: 'active' } }),
      db.deposit.count({ where: { status: 'pending' } }),
      db.withdrawal.count({ where: { status: 'pending' } }),
      db.news.count(),
      db.promo.count({ where: { isActive: true } }),
      db.stock.count(),
    ])

    const totalBalance = balanceAgg._sum.balance || 0
    const totalDeposits = depositAgg._sum.amount || 0
    const totalWithdrawals = withdrawalAgg._sum.amount || 0
    const platformRevenue = totalDeposits - totalWithdrawals

    return NextResponse.json({
      stats: {
        totalUsers,
        totalBalance,
        totalDeposits,
        totalWithdrawals,
        activeInvestments,
        platformRevenue,
        pendingDeposits,
        pendingWithdrawals,
        totalNews,
        activePromos,
        totalStocks,
      },
    })
  } catch (error) {
    console.error('Admin dashboard error:', error)
    return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 })
  }
}
