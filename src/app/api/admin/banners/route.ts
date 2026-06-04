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

    const banners = await db.banner.findMany({
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ banners })
  } catch (error) {
    console.error('Admin banners error:', error)
    return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { adminId, title, imageUrl, link, order, isActive } = body

    if (!adminId || !(await verifyAdmin(adminId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (!title || !imageUrl) {
      return NextResponse.json({ error: 'Title and image are required' }, { status: 400 })
    }

    const banner = await db.banner.create({
      data: {
        title,
        imageUrl,
        link: link || null,
        order: order || 0,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    })

    return NextResponse.json({ banner }, { status: 201 })
  } catch (error) {
    console.error('Admin banner create error:', error)
    return NextResponse.json({ error: 'Failed to create banner' }, { status: 500 })
  }
}
