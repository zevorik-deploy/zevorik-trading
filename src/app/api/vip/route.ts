import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const VIP_LEVELS = [
  {
    level: 'Bronze',
    minDeposit: 0,
    maxDeposit: 10000000,
    tradingFeeDiscount: 0,
    prioritySupport: false,
    exclusiveStocks: false,
    withdrawalLimit: 50000000,
    bonusMultiplier: 1,
    color: '#CD7F32',
  },
  {
    level: 'Silver',
    minDeposit: 10000000,
    maxDeposit: 50000000,
    tradingFeeDiscount: 10,
    prioritySupport: false,
    exclusiveStocks: false,
    withdrawalLimit: 100000000,
    bonusMultiplier: 1.2,
    color: '#C0C0C0',
  },
  {
    level: 'Gold',
    minDeposit: 50000000,
    maxDeposit: 200000000,
    tradingFeeDiscount: 20,
    prioritySupport: true,
    exclusiveStocks: false,
    withdrawalLimit: 250000000,
    bonusMultiplier: 1.5,
    color: '#FFD700',
  },
  {
    level: 'Platinum',
    minDeposit: 200000000,
    maxDeposit: 500000000,
    tradingFeeDiscount: 30,
    prioritySupport: true,
    exclusiveStocks: true,
    withdrawalLimit: 500000000,
    bonusMultiplier: 2,
    color: '#E5E4E2',
  },
  {
    level: 'Diamond',
    minDeposit: 500000000,
    maxDeposit: Infinity,
    tradingFeeDiscount: 50,
    prioritySupport: true,
    exclusiveStocks: true,
    withdrawalLimit: 1000000000,
    bonusMultiplier: 3,
    color: '#B9F2FF',
  },
]

function calculateVIPLevel(totalDeposit: number) {
  for (const level of VIP_LEVELS) {
    if (totalDeposit >= level.minDeposit && totalDeposit < level.maxDeposit) {
      return level.level
    }
  }
  return 'Bronze'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      // Return all VIP levels info without user context
      return NextResponse.json({
        levels: VIP_LEVELS.map(l => ({
          ...l,
          maxDeposit: l.maxDeposit === Infinity ? null : l.maxDeposit,
        })),
      })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const currentLevel = calculateVIPLevel(user.totalDeposit)
    const currentLevelInfo = VIP_LEVELS.find(l => l.level === currentLevel)!

    // Find next level
    const currentLevelIndex = VIP_LEVELS.findIndex(l => l.level === currentLevel)
    const nextLevel = currentLevelIndex < VIP_LEVELS.length - 1
      ? VIP_LEVELS[currentLevelIndex + 1]
      : null

    // Calculate progress to next level
    let progressToNext = 0
    let depositNeeded = 0
    if (nextLevel) {
      const rangeStart = currentLevelInfo.minDeposit
      const rangeEnd = nextLevel.minDeposit
      progressToNext = Math.min(100, ((user.totalDeposit - rangeStart) / (rangeEnd - rangeStart)) * 100)
      depositNeeded = Math.max(0, nextLevel.minDeposit - user.totalDeposit)
    } else {
      progressToNext = 100
    }

    // Update user VIP level if changed
    if (user.vipLevel !== currentLevel) {
      await db.user.update({
        where: { id: userId },
        data: { vipLevel: currentLevel },
      })
    }

    return NextResponse.json({
      currentLevel: {
        ...currentLevelInfo,
        maxDeposit: currentLevelInfo.maxDeposit === Infinity ? null : currentLevelInfo.maxDeposit,
      },
      nextLevel: nextLevel ? {
        ...nextLevel,
        maxDeposit: nextLevel.maxDeposit === Infinity ? null : nextLevel.maxDeposit,
      } : null,
      progressToNext: Math.round(progressToNext * 100) / 100,
      depositNeeded,
      totalDeposit: user.totalDeposit,
      levels: VIP_LEVELS.map(l => ({
        ...l,
        maxDeposit: l.maxDeposit === Infinity ? null : l.maxDeposit,
      })),
    })
  } catch (error) {
    console.error('Get VIP info error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch VIP info' },
      { status: 500 }
    )
  }
}
