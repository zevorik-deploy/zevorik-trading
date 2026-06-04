import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

async function verifyAdmin(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } })
  return user?.role === 'admin'
}

// GET - list all notifications (with user info)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId || !(await verifyAdmin(userId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const notifications = await db.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: { select: { id: true, name: true, phone: true } }
      }
    })

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error('Admin notifications error:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

// POST - broadcast notification to all users or specific user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { adminId, title, message, type, targetUserId } = body

    if (!adminId || !(await verifyAdmin(adminId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 })
    }

    if (targetUserId) {
      // Send to specific user
      const notification = await db.notification.create({
        data: {
          userId: targetUserId,
          title,
          message,
          type: type || 'system',
        }
      })
      return NextResponse.json({ notification, count: 1 })
    }

    // Broadcast to all non-admin users
    const users = await db.user.findMany({
      where: { role: { not: 'admin' } },
      select: { id: true }
    })

    const notifications = await db.notification.createMany({
      data: users.map(u => ({
        userId: u.id,
        title,
        message,
        type: type || 'system',
      }))
    })

    return NextResponse.json({ count: notifications.count })
  } catch (error) {
    console.error('Admin notification broadcast error:', error)
    return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 })
  }
}
