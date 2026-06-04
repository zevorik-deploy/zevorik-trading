import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, amount } = body

    if (!userId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.accountType !== 'demo') {
      return NextResponse.json({ error: 'Hanya akun demo yang dapat menggunakan fitur ini' }, { status: 403 })
    }

    // Max single request: 1 billion, max total balance: 10 billion
    if (amount > 1000000000) {
      return NextResponse.json({ error: 'Maksimal request Rp 1.000.000.000 per kali' }, { status: 400 })
    }

    if (user.balance + amount > 10000000000) {
      return NextResponse.json({ error: 'Total saldo demo maksimal Rp 10.000.000.000' }, { status: 400 })
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { balance: { increment: amount } },
    })

    return NextResponse.json({
      success: true,
      newBalance: updatedUser.balance,
    })
  } catch (error) {
    console.error('Demo balance error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
