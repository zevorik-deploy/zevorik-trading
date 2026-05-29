import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const portfolios = await db.portfolio.findMany({
      where: { userId },
      include: {
        stock: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate current values and profit/loss
    const portfolioWithStats = portfolios.map((p) => {
      const currentValue = p.shares * p.stock.price
      const investedValue = p.shares * p.avgPrice
      const profitLoss = currentValue - investedValue
      const profitLossPercent = investedValue > 0
        ? (profitLoss / investedValue) * 100
        : 0

      return {
        ...p,
        currentValue,
        investedValue,
        profitLoss,
        profitLossPercent,
      }
    })

    const totalInvested = portfolioWithStats.reduce((sum, p) => sum + p.investedValue, 0)
    const totalCurrentValue = portfolioWithStats.reduce((sum, p) => sum + p.currentValue, 0)
    const totalProfitLoss = totalCurrentValue - totalInvested
    const totalProfitLossPercent = totalInvested > 0
      ? (totalProfitLoss / totalInvested) * 100
      : 0

    return NextResponse.json({
      portfolio: portfolioWithStats,
      summary: {
        totalInvested,
        totalCurrentValue,
        totalProfitLoss,
        totalProfitLossPercent,
        cashBalance: user.balance,
        totalAssets: totalCurrentValue + user.balance,
      },
    })
  } catch (error) {
    console.error('Get portfolio error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch portfolio' },
      { status: 500 }
    )
  }
}
