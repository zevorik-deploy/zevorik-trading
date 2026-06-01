import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Profit calculation: longer duration = higher profit percent, max 40%
function calculateProfitPercent(durationSeconds: number): number {
  return Math.min(40, Math.round((3 + durationSeconds * 0.155) * 10) / 10)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, stockCode, stockName, direction, amount, duration, startPrice, isAuto } = body

    if (!userId || !stockCode || !direction || !amount || !duration || !startPrice) {
      return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 })
    }

    if (!['UP', 'DOWN'].includes(direction)) {
      return NextResponse.json({ error: 'Arah prediksi harus UP atau DOWN' }, { status: 400 })
    }

    if (amount < 100000) {
      return NextResponse.json({ error: 'Minimal prediksi Rp 100.000' }, { status: 400 })
    }

    if (duration < 10 || duration > 300) {
      return NextResponse.json({ error: 'Durasi antara 10-300 detik' }, { status: 400 })
    }

    // Check user balance
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    if (user.balance < amount) {
      return NextResponse.json({ error: 'Saldo tidak mencukupi' }, { status: 400 })
    }

    const profitPercent = calculateProfitPercent(duration)

    // Deduct balance
    await db.user.update({
      where: { id: userId },
      data: { balance: { decrement: amount } },
    })

    // Create prediction trade
    const trade = await db.predictionTrade.create({
      data: {
        userId,
        stockCode,
        stockName: stockName || stockCode,
        direction,
        amount,
        duration,
        profitPercent,
        startPrice,
        isAuto: isAuto || false,
        status: 'active',
        startedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      trade: {
        id: trade.id,
        stockCode: trade.stockCode,
        stockName: trade.stockName,
        direction: trade.direction,
        amount: trade.amount,
        duration: trade.duration,
        profitPercent: trade.profitPercent,
        startPrice: trade.startPrice,
        isAuto: trade.isAuto,
        status: trade.status,
        startedAt: trade.startedAt,
      },
    })
  } catch (error) {
    console.error('Create prediction error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
