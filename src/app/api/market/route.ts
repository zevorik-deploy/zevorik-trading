import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const indices = await db.marketIndex.findMany({
      orderBy: { code: 'asc' },
    })

    return NextResponse.json({ indices })
  } catch (error) {
    console.error('Get market indices error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch market indices' },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const indices = await db.marketIndex.findMany()

    if (indices.length === 0) {
      return NextResponse.json(
        { error: 'No market indices found. Please seed the database first.' },
        { status: 400 }
      )
    }

    const updatedIndices = []

    for (const index of indices) {
      // Random change between -2% and +2%
      const changePercent = (Math.random() - 0.48) * 4
      const valueChange = index.value * (changePercent / 100)
      const newValue = Math.round((index.value + valueChange) * 100) / 100
      const newChange = Math.round(valueChange * 100) / 100
      const newChangePercent = Math.round(changePercent * 100) / 100

      const updated = await db.marketIndex.update({
        where: { id: index.id },
        data: {
          value: newValue,
          change: newChange,
          changePercent: newChangePercent,
        },
      })

      updatedIndices.push(updated)
    }

    return NextResponse.json({
      message: 'Market indices updated successfully',
      indices: updatedIndices,
    })
  } catch (error) {
    console.error('Update market indices error:', error)
    return NextResponse.json(
      { error: 'Failed to update market indices' },
      { status: 500 }
    )
  }
}
