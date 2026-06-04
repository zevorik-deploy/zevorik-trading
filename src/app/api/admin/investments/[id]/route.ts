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
    const { adminId, name, modal, dailyProfit, duration, roi, isActive } = body

    if (!adminId || !(await verifyAdmin(adminId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const updateData: any = {}
    if (name) updateData.name = name
    if (modal !== undefined) updateData.modal = Number(modal)
    if (dailyProfit !== undefined) updateData.dailyProfit = Number(dailyProfit)
    if (duration !== undefined) updateData.duration = Number(duration)
    if (roi !== undefined) updateData.roi = Number(roi)
    if (isActive !== undefined) updateData.isActive = Boolean(isActive)

    if (modal !== undefined && dailyProfit !== undefined && duration !== undefined) {
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
