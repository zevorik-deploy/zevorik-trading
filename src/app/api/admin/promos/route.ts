import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

async function verifyAdmin(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } })
  return user?.role === 'admin'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId || !(await verifyAdmin(userId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const promos = await db.promo.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ promos })
  } catch (error) {
    console.error('Admin promos error:', error)
    return NextResponse.json({ error: 'Failed to fetch promos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { adminId, title, description, type, value, startDate, endDate } = body

    if (!adminId || !(await verifyAdmin(adminId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 })
    }

    const promo = await db.promo.create({
      data: {
        title,
        description,
        type: type || 'welcome_bonus',
        value: Number(value) || 0,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        isActive: true,
      },
    })

    return NextResponse.json({ promo }, { status: 201 })
  } catch (error) {
    console.error('Admin promo create error:', error)
    return NextResponse.json({ error: 'Failed to create promo' }, { status: 500 })
  }
}
