import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const TASK_DEFINITIONS = [
  {
    taskType: 'first_invest',
    title: 'Investasi Pertama',
    description: 'Buat investasi pertamamu',
    reward: 1000,
    target: 1,
  },
  {
    taskType: 'top_up',
    title: 'Top Up Saldo',
    description: 'Deposit minimum Rp 100.000 via QRIS',
    reward: 5000,
    target: 1,
  },
  {
    taskType: 'invite_3',
    title: 'Ajak 3 Teman',
    description: 'Undang 3 teman melalui referral',
    reward: 50000,
    target: 3,
  },
  {
    taskType: 'verify',
    title: 'Verifikasi KYC',
    description: 'Lengkapi verifikasi identitas KYC',
    reward: 10000,
    target: 1,
  },
  {
    taskType: 'invest_3',
    title: 'Investasi 3 Paket',
    description: 'Investasi di 3 paket berbeda',
    reward: 100000,
    target: 3,
  },
  {
    taskType: 'check_7',
    title: 'Cek Harian 7 Hari',
    description: 'Check-in 7 hari berturut-turut',
    reward: 10000,
    target: 7,
  },
]

// GET - Get task list with progress
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

    // Ensure tasks exist for user
    const existingTasks = await db.task.findMany({ where: { userId } })
    const existingTypes = new Set(existingTasks.map(t => t.taskType))

    // Create missing tasks
    for (const def of TASK_DEFINITIONS) {
      if (!existingTypes.has(def.taskType)) {
        let progress = 0
        let completed = false

        // Calculate initial progress based on existing user data
        if (def.taskType === 'first_invest') {
          const investCount = await db.investment.count({ where: { userId, status: 'active' } })
          progress = Math.min(investCount, def.target)
          completed = progress >= def.target
        } else if (def.taskType === 'top_up') {
          const depositCount = await db.deposit.count({
            where: { userId, status: 'completed', amount: { gte: 50000 } },
          })
          progress = Math.min(depositCount, def.target)
          completed = progress >= def.target
        } else if (def.taskType === 'invite_3') {
          const referralCount = await db.referral.count({ where: { referrerId: userId } })
          progress = Math.min(referralCount, def.target)
          completed = progress >= def.target
        } else if (def.taskType === 'verify') {
          progress = user.kycStatus === 'verified' ? 1 : 0
          completed = progress >= def.target
        } else if (def.taskType === 'invest_3') {
          const uniqueProducts = await db.investment.findMany({
            where: { userId, status: 'active' },
            select: { productId: true },
            distinct: ['productId'],
          })
          progress = Math.min(uniqueProducts.length, def.target)
          completed = progress >= def.target
        } else if (def.taskType === 'check_7') {
          progress = Math.min(user.dailyCheckIn, def.target)
          completed = progress >= def.target
        }

        await db.task.create({
          data: {
            userId,
            taskType: def.taskType,
            title: def.title,
            description: def.description,
            reward: def.reward,
            target: def.target,
            progress,
            completed,
          },
        })
      }
    }

    // Also update existing tasks that might have changed progress
    const allTasks = await db.task.findMany({ where: { userId } })
    for (const task of allTasks) {
      if (task.claimed) continue // Don't update claimed tasks

      let newProgress = task.progress
      let newCompleted = task.completed

      if (task.taskType === 'first_invest') {
        const investCount = await db.investment.count({ where: { userId, status: 'active' } })
        newProgress = Math.min(investCount, task.target)
        newCompleted = newProgress >= task.target
      } else if (task.taskType === 'top_up') {
        const depositCount = await db.deposit.count({
          where: { userId, status: 'completed', amount: { gte: 50000 } },
        })
        newProgress = Math.min(depositCount, task.target)
        newCompleted = newProgress >= task.target
      } else if (task.taskType === 'invite_3') {
        const referralCount = await db.referral.count({ where: { referrerId: userId } })
        newProgress = Math.min(referralCount, task.target)
        newCompleted = newProgress >= task.target
      } else if (task.taskType === 'verify') {
        newProgress = user.kycStatus === 'verified' ? 1 : 0
        newCompleted = newProgress >= task.target
      } else if (task.taskType === 'invest_3') {
        const uniqueProducts = await db.investment.findMany({
          where: { userId, status: 'active' },
          select: { productId: true },
          distinct: ['productId'],
        })
        newProgress = Math.min(uniqueProducts.length, task.target)
        newCompleted = newProgress >= task.target
      } else if (task.taskType === 'check_7') {
        newProgress = Math.min(user.dailyCheckIn, task.target)
        newCompleted = newProgress >= task.target
      }

      if (newProgress !== task.progress || newCompleted !== task.completed) {
        await db.task.update({
          where: { id: task.id },
          data: { progress: newProgress, completed: newCompleted },
        })
      }
    }

    // Fetch final task list
    const tasks = await db.task.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({
      tasks: tasks.map(t => ({
        id: t.id,
        taskType: t.taskType,
        title: t.title,
        description: t.description,
        reward: t.reward,
        progress: t.progress,
        target: t.target,
        completed: t.completed,
        claimed: t.claimed,
      })),
    })
  } catch (error) {
    console.error('Get tasks error:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}
