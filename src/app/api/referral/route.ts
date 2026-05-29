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
      select: {
        id: true,
        name: true,
        referralCode: true,
        referredBy: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get list of users this user has referred
    const sentReferrals = await db.referral.findMany({
      where: { referrerId: userId },
      include: {
        referred: {
          select: {
            id: true,
            name: true,
            phone: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const totalBonus = sentReferrals.reduce((sum, r) => sum + r.bonusAmount, 0)

    return NextResponse.json({
      referralCode: user.referralCode,
      referredUsers: sentReferrals.map((r) => ({
        id: r.referred.id,
        name: r.referred.name,
        phone: r.referred.phone.slice(0, 6) + '****',
        bonusAmount: r.bonusAmount,
        status: r.status,
        joinedAt: r.referred.createdAt,
      })),
      totalReferrals: sentReferrals.length,
      totalBonus,
    })
  } catch (error) {
    console.error('Get referral info error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch referral info' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, code } = body

    if (!userId || !code) {
      return NextResponse.json(
        { error: 'userId and code are required' },
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

    if (user.referredBy) {
      return NextResponse.json(
        { error: 'You have already used a referral code' },
        { status: 400 }
      )
    }

    const referrer = await db.user.findUnique({
      where: { referralCode: code },
    })

    if (!referrer) {
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 404 }
      )
    }

    if (referrer.id === userId) {
      return NextResponse.json(
        { error: 'You cannot use your own referral code' },
        { status: 400 }
      )
    }

    const bonusAmount = 50000 // Rp 50,000

    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          referredBy: referrer.id,
          balance: { increment: bonusAmount },
        },
      })

      await tx.user.update({
        where: { id: referrer.id },
        data: { balance: { increment: bonusAmount } },
      })

      await tx.referral.create({
        data: {
          referrerId: referrer.id,
          referredId: userId,
          bonusAmount,
          status: 'completed',
        },
      })

      await tx.notification.create({
        data: {
          userId: referrer.id,
          title: 'Bonus Referral!',
          message: `Anda mendapat bonus referral Rp ${bonusAmount.toLocaleString('id-ID')} karena mengajak teman bergabung.`,
          type: 'alert',
        },
      })

      await tx.notification.create({
        data: {
          userId,
          title: 'Bonus Referral!',
          message: `Anda mendapat bonus referral Rp ${bonusAmount.toLocaleString('id-ID')} dari kode referral.`,
          type: 'alert',
        },
      })
    })

    return NextResponse.json({
      message: 'Referral code applied successfully',
      bonusAmount,
    })
  } catch (error) {
    console.error('Apply referral error:', error)
    return NextResponse.json(
      { error: 'Failed to apply referral code' },
      { status: 500 }
    )
  }
}
