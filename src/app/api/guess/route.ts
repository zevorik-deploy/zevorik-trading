import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/guess - Place a guess (predict up/down)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, direction, amount, stockCode } = body

    if (!userId || !direction || !amount || !stockCode) {
      return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 })
    }

    if (!['up', 'down'].includes(direction)) {
      return NextResponse.json({ error: 'Arah harus up atau down' }, { status: 400 })
    }

    if (amount < 100000) {
      return NextResponse.json({ error: 'Minimum prediksi Rp 100.000' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    if (user.balance < amount) {
      return NextResponse.json({ error: 'Saldo tidak mencukupi' }, { status: 400 })
    }

    // Deduct balance
    await db.user.update({
      where: { id: userId },
      data: { balance: { decrement: amount } },
    })

    // Create guess record with 15s resolve time
    const now = new Date()
    const resolveAt = new Date(now.getTime() + 15000) // 15 seconds

    const guess = await db.guess.create({
      data: {
        userId,
        stockCode,
        direction,
        amount,
        status: 'pending',
        resolveAt,
      },
    })

    // Create notification
    await db.notification.create({
      data: {
        userId,
        title: 'Prediksi Dibuat',
        message: `Prediksi ${direction === 'up' ? 'NAIK ▲' : 'TURUN ▼'} ${amount.toLocaleString('id-ID')} IDR di ${stockCode}.`,
        type: 'trade',
      },
    })

    const updatedUser = await db.user.findUnique({ where: { id: userId } })

    return NextResponse.json({
      guess,
      newBalance: updatedUser?.balance || 0,
      resolveAt: resolveAt.toISOString(),
    }, { status: 201 })
  } catch (error: unknown) {
    console.error('Create guess error:', error)
    const message = error instanceof Error ? error.message : 'Failed to create guess'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PUT /api/guess - Resolve a guess (check result)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { guessId, currentPrice, startPrice, profitPercent } = body

    if (!guessId || currentPrice === undefined || startPrice === undefined) {
      return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 })
    }

    const guess = await db.guess.findUnique({ where: { id: guessId } })
    if (!guess || guess.status !== 'pending') {
      return NextResponse.json({ error: 'Prediksi tidak valid' }, { status: 400 })
    }

    const actualDirection = currentPrice >= startPrice ? 'up' : 'down'
    const won = guess.direction === actualDirection

    // Payout based on profitPercent (default 10% if not provided)
    const pct = profitPercent || 10
    const payout = won ? Math.round(guess.amount * (1 + pct / 100)) : 0

    // Update guess record
    await db.guess.update({
      where: { id: guessId },
      data: {
        status: won ? 'won' : 'lost',
        result: actualDirection,
        payout,
        resolvedAt: new Date(),
      },
    })

    // If won, add payout to balance
    if (won && payout > 0) {
      await db.user.update({
        where: { id: guess.userId },
        data: { balance: { increment: payout } },
      })

      await db.notification.create({
        data: {
          userId: guess.userId,
          title: '🎉 Prediksi Benar!',
          message: `Selamat! Prediksi ${guess.direction === 'up' ? 'NAIK' : 'TURUN'} benar. +${payout.toLocaleString('id-ID')} IDR dikreditkan!`,
          type: 'bonus',
        },
      })
    } else {
      await db.notification.create({
        data: {
          userId: guess.userId,
          title: 'Prediksi Salah',
          message: `Prediksi ${guess.direction === 'up' ? 'NAIK' : 'TURUN'} salah. Pasar bergerak ${actualDirection === 'up' ? 'naik' : 'turun'}. Coba lagi!`,
          type: 'trade',
        },
      })
    }

    const updatedUser = await db.user.findUnique({ where: { id: guess.userId } })

    return NextResponse.json({
      won,
      actualDirection,
      payout,
      newBalance: updatedUser?.balance || 0,
    })
  } catch (error: unknown) {
    console.error('Resolve guess error:', error)
    const message = error instanceof Error ? error.message : 'Failed to resolve guess'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// GET /api/guess?userId=xxx - Get user's guess history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId wajib diisi' }, { status: 400 })
    }

    const guesses = await db.guess.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const totalGuesses = guesses.length
    const totalWon = guesses.filter(g => g.status === 'won').length
    const totalLost = guesses.filter(g => g.status === 'lost').length
    const totalPayout = guesses.filter(g => g.status === 'won').reduce((sum, g) => sum + (g.payout || 0), 0)
    const totalWagered = guesses.reduce((sum, g) => sum + g.amount, 0)

    return NextResponse.json({
      guesses,
      stats: {
        totalGuesses,
        totalWon,
        totalLost,
        winRate: totalGuesses > 0 ? ((totalWon / totalGuesses) * 100).toFixed(1) : '0',
        totalPayout,
        totalWagered,
        netProfit: totalPayout - totalWagered,
      },
    })
  } catch (error: unknown) {
    console.error('Get guesses error:', error)
    return NextResponse.json({ error: 'Failed to fetch guesses' }, { status: 500 })
  }
}
