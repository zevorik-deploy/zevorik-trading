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

    const deposits = await db.deposit.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: { select: { name: true, phone: true } },
      },
    })

    return NextResponse.json({ deposits })
  } catch (error) {
    console.error('Admin deposits error:', error)
    return NextResponse.json({ error: 'Failed to fetch deposits' }, { status: 500 })
  }
}
