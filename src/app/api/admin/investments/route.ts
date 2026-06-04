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

    const investments = await db.investmentProduct.findMany({
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ investments })
  } catch (error) {
    console.error('Admin investments error:', error)
    return NextResponse.json({ error: 'Failed to fetch investments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { adminId, name, category, modal, dailyProfit, duration, roi, order, isActive } = body

    if (!adminId || !(await verifyAdmin(adminId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (!name || !category || !modal || !dailyProfit || !duration) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const m = Number(modal)
    const dp = Number(dailyProfit)
    const dur = Number(duration)
    const totalReturn = m + (dp * dur)
    const calculatedRoi = roi ? Number(roi) : ((dp * dur) / m) * 100

    const investment = await db.investmentProduct.create({
      data: {
        name,
        category,
        modal: m,
        dailyProfit: dp,
        totalReturn,
        duration: dur,
        roi: calculatedRoi,
        order: order || 0,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    })

    return NextResponse.json({ investment }, { status: 201 })
  } catch (error) {
    console.error('Admin investment create error:', error)
    return NextResponse.json({ error: 'Failed to create investment product' }, { status: 500 })
  }
}
