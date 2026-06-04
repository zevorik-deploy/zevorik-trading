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
    const { adminId, role, vipLevel, kycStatus, balanceAdjust } = body

    if (!adminId || !(await verifyAdmin(adminId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const updateData: any = {}
    if (role) updateData.role = role
    if (vipLevel) updateData.vipLevel = vipLevel
    if (kycStatus) updateData.kycStatus = kycStatus

    if (balanceAdjust !== undefined && balanceAdjust !== null && balanceAdjust !== '') {
      const amount = Number(balanceAdjust)
      if (isNaN(amount)) {
        return NextResponse.json({ error: 'Invalid balance adjustment' }, { status: 400 })
      }
      updateData.balance = { increment: amount }
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Admin user update error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
