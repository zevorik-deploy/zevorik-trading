import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID wajib' }, { status: 400 })
    }

    const trades = await db.predictionTrade.findMany({
      where: { userId, status: 'active' },
      orderBy: { startedAt: 'desc' },
    })

    return NextResponse.json({ trades })
  } catch (error) {
    console.error('Get active predictions error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
