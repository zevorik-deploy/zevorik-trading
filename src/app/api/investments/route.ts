import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/investments?userId=xxx - Get user's active investments
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId wajib diisi' }, { status: 400 })
    }

    const investments = await db.investment.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    })

    const activeInvestments = investments.filter(i => i.status === 'active')
    const completedInvestments = investments.filter(i => i.status === 'completed')

    const totalInvested = activeInvestments.reduce((sum, i) => sum + i.amount, 0)
    const totalProfitClaimed = investments.reduce((sum, i) => sum + i.totalClaimed, 0)
    const totalExpectedReturn = activeInvestments.reduce((sum, i) => sum + i.totalReturn, 0)

    return NextResponse.json({
      investments,
      activeInvestments,
      completedInvestments,
      summary: {
        totalInvested,
        totalProfitClaimed,
        totalExpectedReturn,
        activeCount: activeInvestments.length,
        completedCount: completedInvestments.length,
      },
    })
  } catch (error) {
    console.error('Get investments error:', error)
    return NextResponse.json({ error: 'Gagal mengambil data investasi' }, { status: 500 })
  }
}
