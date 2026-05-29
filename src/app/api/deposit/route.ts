import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, amount, method, bankName } = body

    if (!userId || !amount) {
      return NextResponse.json(
        { error: 'userId and amount are required' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Auto-approve deposit: add balance and set status completed
    const deposit = await db.$transaction(async (tx) => {
      const dep = await tx.deposit.create({
        data: {
          userId,
          amount,
          method: method || 'bank_transfer',
          bankName: bankName || null,
          status: 'completed',
        },
      })

      await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: amount } },
      })

      await tx.notification.create({
        data: {
          userId,
          title: 'Deposit Berhasil',
          message: `Deposit sebesar Rp ${amount.toLocaleString('id-ID')} telah berhasil dikreditkan ke akun Anda.`,
          type: 'deposit',
        },
      })

      return dep
    })

    return NextResponse.json({ deposit }, { status: 201 })
  } catch (error) {
    console.error('Deposit error:', error)
    return NextResponse.json(
      { error: 'Failed to process deposit' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const deposits = await db.deposit.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ deposits })
  } catch (error) {
    console.error('Get deposits error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deposits' },
      { status: 500 }
    )
  }
}
