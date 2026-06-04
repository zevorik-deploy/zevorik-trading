import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

async function verifyAdmin(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } })
  return user?.role === 'admin'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId || !(await verifyAdmin(userId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const stocks = await db.stock.findMany({
      orderBy: { code: 'asc' },
    })

    return NextResponse.json({ stocks })
  } catch (error) {
    console.error('Admin stocks error:', error)
    return NextResponse.json({ error: 'Failed to fetch stocks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { adminId, code, name, price, category, sector, logo, description } = body

    if (!adminId || !(await verifyAdmin(adminId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (!code || !name || !price) {
      return NextResponse.json({ error: 'Code, name, and price are required' }, { status: 400 })
    }

    const p = Number(price)
    const stock = await db.stock.create({
      data: {
        code,
        name,
        price: p,
        open: p,
        high: p,
        low: p,
        category: category || 'bluechip',
        sector: sector || null,
        logo: logo || null,
        description: description || null,
      },
    })

    return NextResponse.json({ stock }, { status: 201 })
  } catch (error) {
    console.error('Admin stock create error:', error)
    return NextResponse.json({ error: 'Failed to create stock' }, { status: 500 })
  }
}
