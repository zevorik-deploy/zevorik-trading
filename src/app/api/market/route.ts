import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Auto-seed if no indices exist
    const indexCount = await db.marketIndex.count()
    if (indexCount === 0) {
      await seedMarketIndices()
    }

    const indices = await db.marketIndex.findMany({
      orderBy: { code: 'asc' },
    })

    // Add some simulated market stats
    const marketStats = {
      totalVolume: indices.reduce((sum, idx) => sum + Math.abs(idx.value * 1000), 0),
      marketStatus: isMarketOpen() ? 'OPEN' : 'CLOSED',
      lastUpdated: new Date().toISOString(),
    }

    return NextResponse.json({ indices, marketStats })
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

function isMarketOpen(): boolean {
  const now = new Date()
  const jakartaOffset = 7 * 60 // UTC+7
  const jakartaTime = new Date(now.getTime() + (jakartaOffset + now.getTimezoneOffset()) * 60000)
  const hours = jakartaTime.getHours()
  const minutes = jakartaTime.getMinutes()
  const day = jakartaTime.getDay()

  // Market open Mon-Fri, 9:00 - 15:00
  if (day === 0 || day === 6) return false
  if (hours < 9 || hours >= 15) return false
  if (hours === 9 && minutes < 0) return false

  return true
}

async function seedMarketIndices() {
  const marketIndices = [
    { code: 'IHSG', name: 'Indeks Harga Saham Gabungan', value: 7245.83, change: 23.45, changePercent: 0.32 },
    { code: 'LQ45', name: 'Indeks LQ45', value: 983.56, change: -5.12, changePercent: -0.52 },
    { code: 'JII', name: 'Jakarta Islamic Index', value: 498.72, change: 8.34, changePercent: 1.70 },
    { code: 'KOMPAS100', name: 'Indeks KOMPAS100', value: 1256.89, change: 12.67, changePercent: 1.02 },
    { code: 'IDX30', name: 'Indeks IDX30', value: 512.34, change: -3.21, changePercent: -0.62 },
  ]

  for (const index of marketIndices) {
    await db.marketIndex.create({ data: index })
  }
}
