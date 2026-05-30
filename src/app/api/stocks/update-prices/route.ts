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
      // Random price change between -3% and +3% with slight upward bias
      const changePercent = (Math.random() - 0.48) * 6
      const priceChange = stock.price * (changePercent / 100)
      const newPrice = Math.max(1, Math.round((stock.price + priceChange) * 100) / 100)
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
          open: stock.open,
          high: newHigh,
          low: newLow,
          volume: stock.volume + volumeChange,
          timestamp: new Date(),
        },
      })

      updatedStocks.push(updated)
    }

    // Also update market indices
    const indices = await db.marketIndex.findMany()
    const updatedIndices = []

    for (const index of indices) {
      const indexChangePercent = (Math.random() - 0.48) * 4
      const valueChange = index.value * (indexChangePercent / 100)
      const newValue = Math.round((index.value + valueChange) * 100) / 100
      const newChange = Math.round(valueChange * 100) / 100
      const newChangePercent = Math.round(indexChangePercent * 100) / 100

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
      message: 'Prices and market indices updated successfully',
      stocksUpdated: updatedStocks.length,
      indicesUpdated: updatedIndices.length,
    })
  } catch (error) {
    console.error('Update prices error:', error)
    return NextResponse.json(
      { error: 'Failed to update prices' },
      { status: 500 }
    )
  }
}
