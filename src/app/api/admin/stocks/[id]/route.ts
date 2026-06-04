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
    const { adminId, name, price, category, sector, logo, description } = body

    if (!adminId || !(await verifyAdmin(adminId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const stock = await db.stock.findUnique({ where: { id } })
    if (!stock) {
      return NextResponse.json({ error: 'Stock not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (name) updateData.name = name
    if (price !== undefined && price !== null) {
      const newPrice = Number(price)
      if (isNaN(newPrice) || newPrice <= 0) {
        return NextResponse.json({ error: 'Invalid price' }, { status: 400 })
      }
      updateData.price = newPrice
      updateData.change = newPrice - stock.price
      updateData.changePercent = stock.price > 0 ? ((newPrice - stock.price) / stock.price) * 100 : 0
      if (newPrice > stock.high) updateData.high = newPrice
      if (newPrice < stock.low || stock.low === 0) updateData.low = newPrice
    }
    if (category) updateData.category = category
    if (sector !== undefined) updateData.sector = sector
    if (logo !== undefined) updateData.logo = logo
    if (description !== undefined) updateData.description = description

    const updated = await db.stock.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ stock: updated })
  } catch (error) {
    console.error('Admin stock update error:', error)
    return NextResponse.json({ error: 'Failed to update stock' }, { status: 500 })
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

    await db.stock.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin stock delete error:', error)
    return NextResponse.json({ error: 'Failed to delete stock' }, { status: 500 })
  }
}
