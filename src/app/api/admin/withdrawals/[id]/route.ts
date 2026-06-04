import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

async function verifyAdmin(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } })
  return user?.role === 'admin'
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { adminId, status } = body

    if (!adminId || !(await verifyAdmin(adminId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (!['completed', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const withdrawal = await db.withdrawal.findUnique({ where: { id } })
    if (!withdrawal) {
      return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 })
    }

    if (withdrawal.status !== 'pending') {
      return NextResponse.json({ error: 'Withdrawal already processed' }, { status: 400 })
    }

    const updated = await db.withdrawal.update({
      where: { id },
      data: { status },
    })

    if (status === 'rejected') {
      await db.user.update({
        where: { id: withdrawal.userId },
        data: { balance: { increment: withdrawal.amount } },
      })
      await db.notification.create({
        data: {
          userId: withdrawal.userId,
          title: 'Withdrawal Ditolak',
          message: `Withdrawal sebesar Rp ${withdrawal.amount.toLocaleString('id-ID')} telah ditolak. Dana dikembalikan ke saldo Anda.`,
          type: 'alert',
        },
      })
    } else {
      await db.notification.create({
        data: {
          userId: withdrawal.userId,
          title: 'Withdrawal Disetujui',
          message: `Withdrawal sebesar Rp ${withdrawal.amount.toLocaleString('id-ID')} telah disetujui dan sedang diproses.`,
          type: 'deposit',
        },
      })
    }

    return NextResponse.json({ withdrawal: updated })
  } catch (error) {
    console.error('Admin withdrawal update error:', error)
    return NextResponse.json({ error: 'Failed to update withdrawal' }, { status: 500 })
  }
}
