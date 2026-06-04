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

    const investments = await db.investmentProduct.findMany({
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ investments })
  } catch (error) {
    console.error('Admin investments error:', error)
    return NextResponse.json({ error: 'Failed to fetch investments' }, { status: 500 })
  }
}
