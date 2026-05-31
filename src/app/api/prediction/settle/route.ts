import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tradeId, endPrice } = body

    if (!tradeId || !endPrice) {
      return NextResponse.json({ error: 'Trade ID dan harga akhir wajib diisi' }, { status: 400 })
    }

    const trade = await db.predictionTrade.findUnique({ where: { id: tradeId } })
    if (!trade) {
      return NextResponse.json({ error: 'Trade tidak ditemukan' }, { status: 404 })
    }

    if (trade.status !== 'active') {
      return NextResponse.json({ error: 'Trade sudah diselesaikan' }, { status: 400 })
    }

    // Determine if user won
    const priceDiff = endPrice - trade.startPrice
    let won = false
    if (trade.direction === 'UP' && priceDiff > 0) won = true
    if (trade.direction === 'DOWN' && priceDiff < 0) won = true

    // If price didn't change, it's a loss (house edge)
    const profit = won ? Math.round(trade.amount * trade.profitPercent / 100) : 0
    const returnAmount = won ? trade.amount + profit : 0

    // Update trade
    const updatedTrade = await db.predictionTrade.update({
      where: { id: tradeId },
      data: {
        endPrice,
        status: won ? 'won' : 'lost',
        profit,
        completedAt: new Date(),
      },
    })

    // If won, add amount + profit back to user balance
    if (won) {
      await db.user.update({
        where: { id: trade.userId },
        data: { balance: { increment: returnAmount } },
      })
    }

    return NextResponse.json({
      success: true,
      result: {
        id: updatedTrade.id,
        stockCode: updatedTrade.stockCode,
        stockName: updatedTrade.stockName,
        direction: updatedTrade.direction,
        amount: updatedTrade.amount,
        profitPercent: updatedTrade.profitPercent,
        startPrice: updatedTrade.startPrice,
        endPrice: updatedTrade.endPrice,
        status: updatedTrade.status,
        profit: updatedTrade.profit,
        won,
        returnAmount,
      },
    })
  } catch (error) {
    console.error('Settle prediction error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
