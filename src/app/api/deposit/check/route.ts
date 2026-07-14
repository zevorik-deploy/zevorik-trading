import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getDepositHistory } from '@/lib/binance'

/**
 * Check pending crypto deposits and auto-credit confirmed ones.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId wajib diisi' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    // Get all pending crypto deposits for this user
    const pendingDeposits = await db.deposit.findMany({
      where: {
        userId,
        method: 'crypto',
        status: 'pending',
      },
      orderBy: { createdAt: 'desc' },
    })

    if (pendingDeposits.length === 0) {
      return NextResponse.json({
        message: 'Tidak ada deposit pending',
        creditedCount: 0,
        pendingCount: 0,
      })
    }

    // Check Binance deposit history
    const startTime = Date.now() - 24 * 60 * 60 * 1000
    let binanceDeposits: any[] = []

    try {
      binanceDeposits = await getDepositHistory('USDT', startTime)
    } catch (err) {
      console.error('Failed to fetch Binance deposit history:', err)
      return NextResponse.json({
        message: 'Gagal mengecek deposit Binance. Coba lagi nanti.',
        creditedCount: 0,
        pendingCount: pendingDeposits.length,
        error: true,
      })
    }

    let creditedCount = 0
    const results: any[] = []

    for (const deposit of pendingDeposits) {
      const matchingBinanceDeposit = binanceDeposits.find((bd: any) => {
        const bdAmount = parseFloat(bd.amount)
        const depositAmount = deposit.cryptoAmount

        // Match network
        const networkMatch = !bd.network ||
          bd.network.toUpperCase() === (deposit.cryptoNetwork || '').toUpperCase()

        // Match amount with 2% tolerance
        const amountMatch = Math.abs(bdAmount - depositAmount) / depositAmount < 0.02

        // Binance status: 1 = success/confirmed
        const statusConfirmed = bd.status === 1

        return networkMatch && amountMatch && statusConfirmed
      })

      if (matchingBinanceDeposit) {
        const creditAmount = deposit.amount // The original USDT amount

        await db.deposit.update({
          where: { id: deposit.id },
          data: {
            status: 'completed',
            cryptoTxId: matchingBinanceDeposit.txId,
            note: `Deposit USDT ${matchingBinanceDeposit.amount} via ${deposit.cryptoNetwork} dikonfirmasi. TxID: ${matchingBinanceDeposit.txId}`,
          },
        })

        const newTotalDeposit = user.totalDeposit + creditAmount
        await db.user.update({
          where: { id: userId },
          data: {
            balance: { increment: creditAmount },
            totalDeposit: newTotalDeposit,
          },
        })

        await db.notification.create({
          data: {
            userId,
            title: 'Deposit Berhasil! ✓',
            message: `Deposit Anda sebesar ${creditAmount} USDT telah dikonfirmasi dan dikreditkan ke saldo Anda.`,
            type: 'deposit',
          },
        })

        creditedCount++
        results.push({
          depositId: deposit.id,
          status: 'credited',
          amount: creditAmount,
          cryptoAmount: matchingBinanceDeposit.amount,
          txId: matchingBinanceDeposit.txId,
        })
      }
    }

    return NextResponse.json({
      message: creditedCount > 0
        ? `${creditedCount} deposit berhasil dikreditkan!`
        : 'Belum ada deposit yang dikonfirmasi. Silakan tunggu konfirmasi blockchain.',
      creditedCount,
      pendingCount: pendingDeposits.length - creditedCount,
      results,
    })
  } catch (error) {
    console.error('Deposit check error:', error)
    return NextResponse.json(
      { error: 'Gagal mengecek deposit' },
      { status: 500 }
    )
  }
}

/**
 * GET: Check deposit eligibility and get withdrawal info
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId wajib diisi' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { kycStatus: true, balance: true, totalDeposit: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    const profit = user.balance - user.totalDeposit
    const profitPercent = user.totalDeposit > 0 ? (profit / user.totalDeposit) * 100 : 0

    return NextResponse.json({
      kycStatus: user.kycStatus,
      canDeposit: user.kycStatus === 'verified',
      balance: user.balance,
      totalDeposit: user.totalDeposit,
      profit,
      profitPercent: Math.round(profitPercent * 100) / 100,
      canWithdrawFreely: profitPercent >= 100,
    })
  } catch (error) {
    console.error('Deposit eligibility check error:', error)
    return NextResponse.json(
      { error: 'Gagal mengecek status' },
      { status: 500 }
    )
  }
}
