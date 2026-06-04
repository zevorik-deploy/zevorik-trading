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
    const { adminId, title, description, type, value, isActive } = body

    if (!adminId || !(await verifyAdmin(adminId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const updateData: any = {}
    if (title) updateData.title = title
    if (description) updateData.description = description
    if (type) updateData.type = type
    if (value !== undefined) updateData.value = Number(value)
    if (isActive !== undefined) updateData.isActive = Boolean(isActive)

    const promo = await db.promo.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ promo })
  } catch (error) {
    console.error('Admin promo update error:', error)
    return NextResponse.json({ error: 'Failed to update promo' }, { status: 500 })
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

    await db.promo.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin promo delete error:', error)
    return NextResponse.json({ error: 'Failed to delete promo' }, { status: 500 })
  }
}
