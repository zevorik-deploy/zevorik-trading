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
    const { adminId, role, kycStatus, balanceAdjust, name, phone, email, bankName, bankAccount, bankHolder } = body

    if (!adminId || !(await verifyAdmin(adminId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const updateData: Record<string, unknown> = {}
    if (role) updateData.role = role
    if (kycStatus) updateData.kycStatus = kycStatus
    if (name) updateData.name = name
    if (phone) updateData.phone = phone
    if (email !== undefined) updateData.email = email || null
    if (bankName !== undefined) updateData.bankName = bankName || null
    if (bankAccount !== undefined) updateData.bankAccount = bankAccount || null
    if (bankHolder !== undefined) updateData.bankHolder = bankHolder || null

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { adminId } = body

    if (!adminId || !(await verifyAdmin(adminId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Don't allow deleting admin users
    const targetUser = await db.user.findUnique({ where: { id } })
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    if (targetUser.role === 'admin') {
      return NextResponse.json({ error: 'Cannot delete admin user' }, { status: 403 })
    }

    // Delete related records first
    await db.notification.deleteMany({ where: { userId: id } })
    await db.kYC.deleteMany({ where: { userId: id } })
    await db.oTP.deleteMany({ where: { userId: id } })
    await db.predictionTrade.deleteMany({ where: { userId: id } })
    await db.watchlist.deleteMany({ where: { userId: id } })
    await db.transaction.deleteMany({ where: { userId: id } })
    await db.portfolio.deleteMany({ where: { userId: id } })
    await db.deposit.deleteMany({ where: { userId: id } })
    await db.withdrawal.deleteMany({ where: { userId: id } })
    await db.user.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin user delete error:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
