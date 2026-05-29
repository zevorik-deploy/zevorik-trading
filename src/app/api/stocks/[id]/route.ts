import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const stock = await db.stock.findUnique({
      where: { id },
    })

    if (!stock) {
      return NextResponse.json(
        { error: 'Stock not found' },
        { status: 404 }
      )
    }

    // Get price history (last 90 days)
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const priceHistory = await db.stockPriceHistory.findMany({
      where: {
        stockCode: stock.code,
        timestamp: { gte: ninetyDaysAgo },
      },
      orderBy: { timestamp: 'asc' },
    })

    // Get recent 30 data points for summary
    const recentHistory = priceHistory.slice(-30)

    return NextResponse.json({
      stock,
      priceHistory,
      recentHistory,
    })
  } catch (error) {
    console.error('Get stock detail error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock detail' },
      { status: 500 }
    )
  }
}
