import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Claim task reward
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, taskId } = body

    if (!userId || !taskId) {
      return NextResponse.json({ error: 'userId and taskId are required' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const task = await db.task.findFirst({
      where: { id: taskId, userId },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    if (!task.completed) {
      return NextResponse.json({ error: 'Task not yet completed' }, { status: 400 })
    }

    if (task.claimed) {
      return NextResponse.json({ error: 'Reward already claimed' }, { status: 400 })
    }

    // Mark as claimed
    await db.task.update({
      where: { id: taskId },
      data: { claimed: true },
    })

    // Add reward to user balance
    await db.user.update({
      where: { id: userId },
      data: { balance: user.balance + task.reward },
    })

    // Create bonus record
    await db.bonus.create({
      data: {
        userId,
        type: 'task_reward',
        amount: task.reward,
        description: `Bonus tugas: ${task.title}`,
        status: 'completed',
      },
    })

    // Create notification
    await db.notification.create({
      data: {
        userId,
        title: 'Tugas Selesai! 🎯',
        message: `Bonus Rp ${task.reward.toLocaleString('id-ID')} dari tugas "${task.title}" telah ditambahkan ke saldo.`,
        type: 'alert',
      },
    })

    return NextResponse.json({
      success: true,
      reward: task.reward,
      taskTitle: task.title,
    })
  } catch (error) {
    console.error('Claim task error:', error)
    return NextResponse.json({ error: 'Failed to claim task reward' }, { status: 500 })
  }
}
