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
    const { adminId, title, imageUrl, link, order, isActive } = body

    if (!adminId || !(await verifyAdmin(adminId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl
    if (link !== undefined) updateData.link = link
    if (order !== undefined) updateData.order = Number(order)
    if (isActive !== undefined) updateData.isActive = Boolean(isActive)

    const banner = await db.banner.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ banner })
  } catch (error) {
    console.error('Admin banner update error:', error)
    return NextResponse.json({ error: 'Failed to update banner' }, { status: 500 })
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

    await db.banner.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin banner delete error:', error)
    return NextResponse.json({ error: 'Failed to delete banner' }, { status: 500 })
  }
}
