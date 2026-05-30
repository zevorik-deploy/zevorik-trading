import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const watchlist = await db.watchlist.findMany({
      where: { userId },
      include: { stock: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ watchlist })
  } catch (error) {
    console.error('Get watchlist error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch watchlist' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, stockId } = body

    if (!userId || !stockId) {
      return NextResponse.json(
        { error: 'userId and stockId are required' },
        { status: 400 }
      )
    }

    // Check if already in watchlist
    const existing = await db.watchlist.findUnique({
      where: {
        userId_stockId: { userId, stockId },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Stock already in watchlist' },
        { status: 409 }
      )
    }

    const watchlist = await db.watchlist.create({
      data: { userId, stockId },
      include: { stock: true },
    })

    return NextResponse.json({ watchlist }, { status: 201 })
  } catch (error) {
    console.error('Add watchlist error:', error)
    return NextResponse.json(
      { error: 'Failed to add stock to watchlist' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, stockId } = body

    if (!userId || !stockId) {
      return NextResponse.json(
        { error: 'userId and stockId are required' },
        { status: 400 }
      )
    }

    const existing = await db.watchlist.findUnique({
      where: {
        userId_stockId: { userId, stockId },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Stock not found in watchlist' },
        { status: 404 }
      )
    }

    await db.watchlist.delete({
      where: { id: existing.id },
    })

    return NextResponse.json({ message: 'Stock removed from watchlist' })
  } catch (error) {
    console.error('Remove watchlist error:', error)
    return NextResponse.json(
      { error: 'Failed to remove stock from watchlist' },
      { status: 500 }
    )
  }
}
