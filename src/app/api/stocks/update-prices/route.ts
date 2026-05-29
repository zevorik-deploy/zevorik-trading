import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
    const stocks = await db.stock.findMany()

    if (stocks.length === 0) {
      return NextResponse.json(
        { error: 'No stocks found. Please seed the database first.' },
        { status: 400 }
      )
    }

    const updatedStocks = []

    for (const stock of stocks) {
      // Random price change between -3% and +3%
      const changePercent = (Math.random() - 0.48) * 6 // slight upward bias
      const priceChange = stock.price * (changePercent / 100)
      const newPrice = Math.round((stock.price + priceChange) * 100) / 100
      const newChange = Math.round(priceChange * 100) / 100
      const newChangePercent = Math.round(changePercent * 100) / 100
      const newHigh = Math.max(stock.high, newPrice)
      const newLow = stock.low === 0 ? newPrice : Math.min(stock.low, newPrice)
      const volumeChange = Math.floor(Math.random() * 500000)

      const updated = await db.stock.update({
        where: { id: stock.id },
        data: {
          price: newPrice,
          change: newChange,
          changePercent: newChangePercent,
          high: newHigh,
          low: newLow,
          volume: stock.volume + volumeChange,
        },
      })

      // Record price history
      await db.stockPriceHistory.create({
        data: {
          stockCode: stock.code,
          price: newPrice,
          timestamp: new Date(),
        },
      })

      updatedStocks.push(updated)
    }

    return NextResponse.json({
      message: 'Prices updated successfully',
      stocks: updatedStocks,
    })
  } catch (error) {
    console.error('Update prices error:', error)
    return NextResponse.json(
      { error: 'Failed to update prices' },
      { status: 500 }
    )
  }
}
