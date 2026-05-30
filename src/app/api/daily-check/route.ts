import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get daily check-in status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Check if already checked in today
    const todayCheck = await db.dailyCheck.findUnique({
      where: { userId_checkDate: { userId, checkDate: today } },
    })

    const canCheckToday = !todayCheck

    // Calculate current streak from DailyCheck table
    let streak = 0
    const lastChecks = await db.dailyCheck.findMany({
      where: { userId },
      orderBy: { checkDate: 'desc' },
      take: 30,
    })

    if (lastChecks.length > 0) {
      // Check if the most recent check is today or yesterday
      const lastCheckDate = new Date(lastChecks[0].checkDate)
      lastCheckDate.setHours(0, 0, 0, 0)
      const todayCopy = new Date(today)

      if (lastCheckDate.getTime() === todayCopy.getTime() || lastCheckDate.getTime() === todayCopy.getTime() - 86400000) {
        streak = lastChecks[0].streak
      } else {
        streak = 0
      }
    }

    // Get today's reward if checked in
    const todayReward = todayCheck?.reward || 0

    return NextResponse.json({
      streak,
      lastCheckDate: user.lastCheckIn,
      canCheckToday,
      todayReward,
      todayCheck,
    })
  } catch (error) {
    console.error('Get daily check error:', error)
    return NextResponse.json({ error: 'Failed to fetch daily check data' }, { status: 500 })
  }
}

// POST - Daily check-in
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Check if already checked in today
    const existingCheck = await db.dailyCheck.findUnique({
      where: { userId_checkDate: { userId, checkDate: today } },
    })

    if (existingCheck) {
      return NextResponse.json({
        alreadyChecked: true,
        reward: existingCheck.reward,
        streak: existingCheck.streak,
      })
    }

    // Calculate streak
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const yesterdayCheck = await db.dailyCheck.findUnique({
      where: { userId_checkDate: { userId, checkDate: yesterday } },
    })

    let streak = 1
    if (yesterdayCheck) {
      streak = yesterdayCheck.streak + 1
    }

    // Random reward between Rp 1,000 - Rp 10,000
    const reward = Math.floor(Math.random() * 9000) + 1000
    // Round to nearest 500
    const roundedReward = Math.round(reward / 500) * 500

    // Create daily check record
    const dailyCheck = await db.dailyCheck.create({
      data: {
        userId,
        checkDate: today,
        reward: roundedReward,
        streak,
      },
    })

    // Update user balance and check-in info
    await db.user.update({
      where: { id: userId },
      data: {
        balance: user.balance + roundedReward,
        dailyCheckIn: streak,
        lastCheckIn: new Date(),
      },
    })

    // Create bonus record for tracking
    await db.bonus.create({
      data: {
        userId,
        type: 'daily_checkin',
        amount: roundedReward,
        description: `Cek Harian - Streak ${streak} hari`,
        status: 'completed',
      },
    })

    // Create notification
    await db.notification.create({
      data: {
        userId,
        title: 'Cek Harian Berhasil! 🔥',
        message: `Bonus Rp ${roundedReward.toLocaleString('id-ID')} telah ditambahkan ke saldo. Streak: ${streak} hari!`,
        type: 'alert',
      },
    })

    // Update task progress for "check_7" if applicable
    const check7Task = await db.task.findFirst({
      where: { userId, taskType: 'check_7', claimed: false },
    })
    if (check7Task) {
      const newProgress = Math.min(streak, check7Task.target)
      await db.task.update({
        where: { id: check7Task.id },
        data: {
          progress: newProgress,
          completed: newProgress >= check7Task.target,
        },
      })
    }

    return NextResponse.json({
      alreadyChecked: false,
      reward: roundedReward,
      streak,
    })
  } catch (error) {
    console.error('Daily check-in error:', error)
    return NextResponse.json({ error: 'Failed to process daily check-in' }, { status: 500 })
  }
}
