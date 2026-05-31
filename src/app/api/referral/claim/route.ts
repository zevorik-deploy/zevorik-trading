import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get all pending commissions for this user
    const pendingCommissions = await db.referralCommission.findMany({
      where: {
        referrerId: userId,
        status: 'pending',
      },
    })

    if (pendingCommissions.length === 0) {
      return NextResponse.json(
        { error: 'No pending commissions to claim' },
        { status: 400 }
      )
    }

    const totalClaimAmount = pendingCommissions.reduce((sum, c) => sum + c.amount, 0)

    // Update all pending commissions to claimed
    await db.referralCommission.updateMany({
      where: {
        referrerId: userId,
        status: 'pending',
      },
      data: {
        status: 'claimed',
      },
    })

    // Add commission to user's balance
    await db.user.update({
      where: { id: userId },
      data: {
        balance: { increment: totalClaimAmount },
      },
    })

    // Create bonus record
    await db.bonus.create({
      data: {
        userId,
        type: 'referral_bonus',
        amount: totalClaimAmount,
        description: `Klaim komisi referal Rp ${totalClaimAmount.toLocaleString('id-ID')}`,
        status: 'completed',
      },
    })

    // Create notification
    await db.notification.create({
      data: {
        userId,
        title: 'Komisi Diklaim!',
        message: `Anda telah mengklaim komisi referal sebesar Rp ${totalClaimAmount.toLocaleString('id-ID')} ke saldo akun Anda.`,
        type: 'alert',
      },
    })

    return NextResponse.json({
      message: 'Commission claimed successfully',
      claimedAmount: totalClaimAmount,
      claimedCount: pendingCommissions.length,
      newBalance: user.balance + totalClaimAmount,
    })
  } catch (error) {
    console.error('Claim commission error:', error)
    return NextResponse.json(
      { error: 'Failed to claim commission' },
      { status: 500 }
    )
  }
}
