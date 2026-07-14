import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      // Return empty portfolio for non-existent user instead of 404
      // This prevents frontend errors for stale sessions
      return NextResponse.json({
        portfolio: [],
        summary: {
          totalInvested: 0,
          totalCurrentValue: 0,
          totalProfitLoss: 0,
          totalProfitLossPercent: 0,
          cashBalance: 0,
          totalAssets: 0,
          holdingsCount: 0,
        }
      })
    }

    // Get portfolio items with stock data
    const portfolioItems = await db.portfolio.findMany({
      where: { userId },
      include: { stock: true },
    })

    // Calculate portfolio values
    const portfolio = portfolioItems.map(item => {
      const currentValue = item.shares * item.stock.price
      const investedValue = item.shares * item.avgPrice
      const profitLoss = currentValue - investedValue
      const profitLossPercent = investedValue > 0 ? (profitLoss / investedValue) * 100 : 0

      return {
        id: item.id,
        userId: item.userId,
        stockId: item.stockId,
        shares: item.shares,
        avgPrice: item.avgPrice,
        stock: item.stock,
        currentValue,
        investedValue,
        profitLoss,
        profitLossPercent,
      }
    })

    const totalInvested = portfolio.reduce((sum, p) => sum + p.investedValue, 0)
    const totalCurrentValue = portfolio.reduce((sum, p) => sum + p.currentValue, 0)
    const totalProfitLoss = totalCurrentValue - totalInvested
    const totalProfitLossPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0

    const summary = {
      totalInvested,
      totalCurrentValue,
      totalProfitLoss,
      totalProfitLossPercent,
      cashBalance: user.balance,
      totalAssets: user.balance + totalCurrentValue,
      holdingsCount: portfolio.length,
    }

    return NextResponse.json({ portfolio, summary })
  } catch (error) {
    console.error('Get portfolio error:', error)
    // Return empty data on error instead of 500
    return NextResponse.json({
      portfolio: [],
      summary: {
        totalInvested: 0,
        totalCurrentValue: 0,
        totalProfitLoss: 0,
        totalProfitLossPercent: 0,
        cashBalance: 0,
        totalAssets: 0,
        holdingsCount: 0,
      }
    })
  }
}
