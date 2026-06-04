import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get user's bonus list and daily check-in status
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

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const bonuses = await db.bonus.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    const totalBonusByType = bonuses.reduce((acc, b) => {
      if (!acc[b.type]) acc[b.type] = 0
      acc[b.type] += b.amount
      return acc
    }, {} as Record<string, number>)

    const totalBonus = bonuses.reduce((sum, b) => sum + b.amount, 0)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const lastCheckIn = user.lastCheckIn ? new Date(user.lastCheckIn) : null
    const canCheckIn = !lastCheckIn || lastCheckIn < today

    const tradingBonusRate = 0.001
    const claimedTradingBonus = (totalBonusByType['trading_bonus'] || 0)
    const availableTradingBonus = Math.max(0, Math.round(user.totalTrading * tradingBonusRate) - claimedTradingBonus)

    const depositBonusRate = 0.05
    const claimedDepositBonus = (totalBonusByType['deposit_bonus'] || 0)
    const availableDepositBonus = Math.max(0, Math.round(user.totalDeposit * depositBonusRate) - claimedDepositBonus)

    return NextResponse.json({
      bonuses,
      summary: {
        totalBonus,
        totalBonusByType,
        dailyCheckIn: {
          canCheckIn,
          lastCheckIn: user.lastCheckIn,
          streak: user.dailyCheckIn,
        },
        availableTradingBonus,
        availableDepositBonus,
      },
    })
  } catch (error) {
    console.error('Get bonus error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bonus data' },
      { status: 500 }
    )
  }
}

// POST - Various bonus actions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, action } = body

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'userId and action are required' },
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

    switch (action) {
      case 'daily_checkin':
        return await handleDailyCheckIn(user)
      case 'trading_bonus':
        return await handleTradingBonus(user)
      case 'deposit_bonus':
        return await handleDepositBonus(user)
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: daily_checkin, trading_bonus, or deposit_bonus' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Bonus action error:', error)
    return NextResponse.json(
      { error: 'Failed to process bonus action' },
      { status: 500 }
    )
  }
}

async function handleDailyCheckIn(user: { id: string; dailyCheckIn: number; lastCheckIn: Date | null; vipLevel: string; balance: number }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const lastCheckIn = user.lastCheckIn ? new Date(user.lastCheckIn) : null
  if (lastCheckIn && lastCheckIn >= today) {
    return NextResponse.json(
      { error: 'You have already checked in today' },
      { status: 400 }
    )
  }

  // Fixed daily bonus: 500 per check-in
  const baseBonus = 500

  const vipMultipliers: Record<string, number> = {
    Bronze: 1, Silver: 1.2, Gold: 1.5, Platinum: 2, Diamond: 3,
  }
  const multiplier = vipMultipliers[user.vipLevel] || 1
  const bonusAmount = Math.round(baseBonus * multiplier)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  let streak = 1
  if (lastCheckIn) {
    const lastDate = new Date(lastCheckIn)
    lastDate.setHours(0, 0, 0, 0)
    if (lastDate.getTime() === yesterday.getTime()) {
      streak = user.dailyCheckIn + 1
    }
  }

  // Create bonus record
  const bonus = await db.bonus.create({
    data: {
      userId: user.id,
      type: 'daily_checkin',
      amount: bonusAmount,
      description: `Bonus check-in harian (streak ${streak} hari)${multiplier > 1 ? ` x${multiplier} VIP bonus` : ''}`,
      status: 'completed',
    },
  })

  // Update user
  await db.user.update({
    where: { id: user.id },
    data: {
      dailyCheckIn: streak,
      lastCheckIn: new Date(),
      balance: user.balance + bonusAmount,
    },
  })

  // Create notification
  await db.notification.create({
    data: {
      userId: user.id,
      title: 'Check-in Berhasil! 🎯',
      message: `Anda mendapat bonus check-in Rp ${bonusAmount.toLocaleString('id-ID')}. Streak: ${streak} hari!`,
      type: 'alert',
    },
  })

  return NextResponse.json({
    bonus,
    streak,
    bonusAmount,
    multiplier,
  })
}

async function handleTradingBonus(user: { id: string; totalTrading: number; vipLevel: string; balance: number }) {
  const tradingBonusRate = 0.001

  const claimedBonuses = await db.bonus.findMany({
    where: { userId: user.id, type: 'trading_bonus' },
  })
  const claimedAmount = claimedBonuses.reduce((sum, b) => sum + b.amount, 0)
  const totalAvailable = Math.round(user.totalTrading * tradingBonusRate)
  const availableAmount = Math.max(0, totalAvailable - claimedAmount)

  if (availableAmount <= 0) {
    return NextResponse.json(
      { error: 'No trading bonus available. Keep trading to earn more!' },
      { status: 400 }
    )
  }

  const vipMultipliers: Record<string, number> = {
    Bronze: 1, Silver: 1.2, Gold: 1.5, Platinum: 2, Diamond: 3,
  }
  const multiplier = vipMultipliers[user.vipLevel] || 1
  const bonusAmount = Math.round(availableAmount * multiplier)

  const bonus = await db.bonus.create({
    data: {
      userId: user.id,
      type: 'trading_bonus',
      amount: bonusAmount,
      description: `Bonus trading 0.1% dari volume Rp ${user.totalTrading.toLocaleString('id-ID')}${multiplier > 1 ? ` x${multiplier} VIP bonus` : ''}`,
      status: 'completed',
    },
  })

  await db.user.update({
    where: { id: user.id },
    data: { balance: user.balance + bonusAmount },
  })

  await db.notification.create({
    data: {
      userId: user.id,
      title: 'Bonus Trading! 📈',
      message: `Anda mendapat bonus trading Rp ${bonusAmount.toLocaleString('id-ID')}.`,
      type: 'alert',
    },
  })

  return NextResponse.json({ bonus, bonusAmount })
}

async function handleDepositBonus(user: { id: string; totalDeposit: number; vipLevel: string; balance: number }) {
  const depositBonusRate = 0.05

  const claimedBonuses = await db.bonus.findMany({
    where: { userId: user.id, type: 'deposit_bonus' },
  })
  const claimedAmount = claimedBonuses.reduce((sum, b) => sum + b.amount, 0)
  const totalAvailable = Math.round(user.totalDeposit * depositBonusRate)
  const maxBonus = 5000000
  const availableAmount = Math.max(0, Math.min(totalAvailable, maxBonus) - claimedAmount)

  if (availableAmount <= 0) {
    return NextResponse.json(
      { error: 'No deposit bonus available. Make more deposits to earn bonus!' },
      { status: 400 }
    )
  }

  const bonus = await db.bonus.create({
    data: {
      userId: user.id,
      type: 'deposit_bonus',
      amount: availableAmount,
      description: `Bonus deposit 5% dari total deposit Rp ${user.totalDeposit.toLocaleString('id-ID')}`,
      status: 'completed',
    },
  })

  await db.user.update({
    where: { id: user.id },
    data: { balance: user.balance + availableAmount },
  })

  await db.notification.create({
    data: {
      userId: user.id,
      title: 'Bonus Deposit! 💰',
      message: `Anda mendapat bonus deposit Rp ${availableAmount.toLocaleString('id-ID')}.`,
      type: 'alert',
    },
  })

  return NextResponse.json({ bonus, bonusAmount: availableAmount })
}
