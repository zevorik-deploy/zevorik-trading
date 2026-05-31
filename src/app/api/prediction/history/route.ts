import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!userId) {
      return NextResponse.json({ error: 'User ID wajib' }, { status: 400 })
    }

    const trades = await db.predictionTrade.findMany({
      where: { userId, status: { in: ['won', 'lost'] } },
      orderBy: { completedAt: 'desc' },
      take: limit,
    })

    const totalProfit = trades.filter(t => t.status === 'won').reduce((sum, t) => sum + t.profit, 0)
    const totalLoss = trades.filter(t => t.status === 'lost').reduce((sum, t) => sum + t.amount, 0)
    const winRate = trades.length > 0 ? (trades.filter(t => t.status === 'won').length / trades.length) * 100 : 0

    return NextResponse.json({
      trades,
      stats: {
        totalTrades: trades.length,
        totalProfit,
        totalLoss,
        winRate: Math.round(winRate * 10) / 10,
        netProfit: totalProfit - totalLoss,
      },
    })
  } catch (error) {
    console.error('Get prediction history error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
