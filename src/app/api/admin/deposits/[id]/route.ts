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

    const deposit = await db.deposit.findUnique({ where: { id } })
    if (!deposit) {
      return NextResponse.json({ error: 'Deposit not found' }, { status: 404 })
    }

    if (deposit.status !== 'pending') {
      return NextResponse.json({ error: 'Deposit already processed' }, { status: 400 })
    }

    const updated = await db.deposit.update({
      where: { id },
      data: { status },
    })

    if (status === 'completed') {
      await db.user.update({
        where: { id: deposit.userId },
        data: { balance: { increment: deposit.amount } },
      })
      await db.notification.create({
        data: {
          userId: deposit.userId,
          title: 'Deposit Disetujui',
          message: `Deposit sebesar Rp ${deposit.amount.toLocaleString('id-ID')} telah disetujui oleh admin.`,
          type: 'deposit',
        },
      })
    } else {
      await db.notification.create({
        data: {
          userId: deposit.userId,
          title: 'Deposit Ditolak',
          message: `Deposit sebesar Rp ${deposit.amount.toLocaleString('id-ID')} telah ditolak oleh admin.`,
          type: 'alert',
        },
      })
    }

    return NextResponse.json({ deposit: updated })
  } catch (error) {
    console.error('Admin deposit update error:', error)
    return NextResponse.json({ error: 'Failed to update deposit' }, { status: 500 })
  }
}
