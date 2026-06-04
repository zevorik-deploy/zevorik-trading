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
    const { adminId, name, category, modal, dailyProfit, duration, roi, order, isActive } = body

    if (!adminId || !(await verifyAdmin(adminId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const updateData: Record<string, unknown> = {}
    if (name) updateData.name = name
    if (category) updateData.category = category
    if (modal !== undefined) updateData.modal = Number(modal)
    if (dailyProfit !== undefined) updateData.dailyProfit = Number(dailyProfit)
    if (duration !== undefined) updateData.duration = Number(duration)
    if (roi !== undefined) updateData.roi = Number(roi)
    if (order !== undefined) updateData.order = Number(order)
    if (isActive !== undefined) updateData.isActive = Boolean(isActive)

    const product = await db.investmentProduct.findUnique({ where: { id } })
    if (product && modal !== undefined && dailyProfit !== undefined && duration !== undefined) {
      const m = Number(modal)
      const dp = Number(dailyProfit)
      const dur = Number(duration)
      updateData.totalReturn = m + (dp * dur)
    }

    const investment = await db.investmentProduct.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ investment })
  } catch (error) {
    console.error('Admin investment update error:', error)
    return NextResponse.json({ error: 'Failed to update investment' }, { status: 500 })
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

    await db.investmentProduct.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin investment delete error:', error)
    return NextResponse.json({ error: 'Failed to delete investment' }, { status: 500 })
  }
}
