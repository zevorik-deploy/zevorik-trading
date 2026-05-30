import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/invest/claim - Claim daily profit
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, investmentId } = body

    if (!userId || !investmentId) {
      return NextResponse.json({ error: 'userId dan investmentId wajib diisi' }, { status: 400 })
    }

    // Get investment
    const investment = await db.investment.findUnique({
      where: { id: investmentId },
      include: { product: true },
    })

    if (!investment) {
      return NextResponse.json({ error: 'Investasi tidak ditemukan' }, { status: 404 })
    }

    if (investment.userId !== userId) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    if (investment.status !== 'active') {
      return NextResponse.json({ error: 'Investasi tidak aktif' }, { status: 400 })
    }

    // Check if can claim (at least 24 hours since last claim or creation)
    const now = new Date()
    const lastClaimOrCreation = investment.lastClaimAt || investment.createdAt
    const hoursSinceLastClaim = (now.getTime() - new Date(lastClaimOrCreation).getTime()) / (1000 * 60 * 60)

    // For demo purposes, allow claiming every 10 seconds for testing
    // In production, this would be 24 hours
    const CLAIM_INTERVAL_HOURS = 0.003 // ~10 seconds for demo

    if (hoursSinceLastClaim < CLAIM_INTERVAL_HOURS) {
      const minutesLeft = Math.ceil((CLAIM_INTERVAL_HOURS - hoursSinceLastClaim) * 60)
      return NextResponse.json({
        error: `Tunggu ${minutesLeft} menit lagi untuk klaim berikutnya`,
      }, { status: 400 })
    }

    // Check if investment is completed
    if (investment.daysElapsed >= investment.duration) {
      await db.investment.update({
        where: { id: investmentId },
        data: { status: 'completed' },
      })
      return NextResponse.json({ error: 'Investasi sudah selesai' }, { status: 400 })
    }

    // Process claim
    const result = await db.$transaction(async (tx) => {
      // Add profit to user balance (withdrawal wallet)
      await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: investment.dailyProfit } },
      })

      // Update investment record
      const newDaysElapsed = investment.daysElapsed + 1
      const newTotalClaimed = investment.totalClaimed + investment.dailyProfit
      const isCompleted = newDaysElapsed >= investment.duration

      const updated = await tx.investment.update({
        where: { id: investmentId },
        data: {
          daysElapsed: newDaysElapsed,
          totalClaimed: newTotalClaimed,
          lastClaimAt: now,
          status: isCompleted ? 'completed' : 'active',
        },
      })

      // Create notification
      await tx.notification.create({
        data: {
          userId,
          title: 'Profit Diterima',
          message: `Profit harian Rp ${investment.dailyProfit.toLocaleString('id-ID')} dari ${investment.product.name} telah dikreditkan ke saldo Anda. (${newDaysElapsed}/${investment.duration} hari)`,
          type: 'bonus',
        },
      })

      return updated
    })

    // Get updated user balance
    const updatedUser = await db.user.findUnique({ where: { id: userId } })

    return NextResponse.json({
      investment: result,
      claimedAmount: investment.dailyProfit,
      newBalance: updatedUser?.balance || 0,
    })
  } catch (error) {
    console.error('Claim profit error:', error)
    return NextResponse.json({ error: 'Gagal mengklaim profit' }, { status: 500 })
  }
}
