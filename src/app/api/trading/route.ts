import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Use Portfolio model instead of non-existent TradeLot
    const portfolios = await db.portfolio.findMany({
      where: { userId },
      include: { stock: true },
      orderBy: { createdAt: 'desc' },
    })

    const lots = portfolios.map(p => ({
      id: p.id,
      userId: p.userId,
      stockCode: p.stock.code,
      stockName: p.stock.name,
      lots: p.shares,
      buyPrice: p.avgPrice,
      currentPrice: p.stock.price,
      totalInvested: p.shares * p.avgPrice,
      currentValue: p.shares * p.stock.price,
      status: 'active' as const,
      createdAt: p.createdAt,
    }))

    const totalInvested = lots.reduce((sum, l) => sum + l.totalInvested, 0)
    const currentValue = lots.reduce((sum, l) => sum + l.currentValue, 0)
    const totalPL = currentValue - totalInvested

    return NextResponse.json({
      lots,
      summary: { totalInvested, currentValue, totalPL, count: lots.length },
    })
  } catch (error) {
    console.error('Get trading lots error:', error)
    return NextResponse.json({ error: 'Failed to fetch trading lots' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, stockCode, stockName, lots, price, amount } = body

    if (!userId || !stockCode || !stockName || !price) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    // Support amount-based or lot-based buying
    let totalCost: number
    let effectiveLots: number
    if (amount && amount >= 100000) {
      totalCost = amount
      effectiveLots = Math.max(1, Math.round(amount / price))
    } else if (lots && lots > 0) {
      effectiveLots = lots
      totalCost = lots * price
    } else {
      return NextResponse.json({ error: 'Minimum investasi Rp 100.000' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.balance < totalCost) {
      return NextResponse.json({ error: 'Saldo tidak mencukupi' }, { status: 400 })
    }

    // Find the stock by code
    const stock = await db.stock.findUnique({ where: { code: stockCode } })
    if (!stock) {
      return NextResponse.json({ error: 'Stock not found' }, { status: 404 })
    }

    // Deduct balance
    await db.user.update({
      where: { id: userId },
      data: {
        balance: user.balance - totalCost,
        totalTrading: user.totalTrading + totalCost,
      },
    })

    // Check if user already has a portfolio entry for this stock
    const existingPortfolio = await db.portfolio.findUnique({
      where: { userId_stockId: { userId, stockId: stock.id } },
    })

    let lot
    if (existingPortfolio) {
      // Merge: average buy price
      const newTotalLots = existingPortfolio.shares + effectiveLots
      const newTotalInvested = existingPortfolio.shares * existingPortfolio.avgPrice + totalCost
      const newAvgPrice = newTotalInvested / newTotalLots

      lot = await db.portfolio.update({
        where: { id: existingPortfolio.id },
        data: {
          shares: newTotalLots,
          avgPrice: Math.round(newAvgPrice * 100) / 100,
        },
      })
    } else {
      lot = await db.portfolio.create({
        data: {
          userId,
          stockId: stock.id,
          shares: effectiveLots,
          avgPrice: price,
        },
      })
    }

    // Create transaction record
    await db.transaction.create({
      data: {
        userId,
        stockId: stock.id,
        type: 'BUY',
        orderType: 'market',
        shares: effectiveLots,
        price,
        total: totalCost,
        fee: totalCost * 0.0015,
        status: 'completed',
      },
    })

    // Create notification
    await db.notification.create({
      data: {
        userId,
        title: 'Pembelian Saham Berhasil',
        message: `Investasi ${totalCost.toLocaleString('id-ID')} IDR di ${stockCode} @ ${price.toLocaleString('id-ID')} IDR`,
        type: 'trade',
      },
    })

    const updatedUser = await db.user.findUnique({ where: { id: userId } })

    return NextResponse.json({
      lot,
      newBalance: updatedUser?.balance || 0,
    }, { status: 201 })
  } catch (error: unknown) {
    console.error('Buy trading lot error:', error)
    const message = error instanceof Error ? error.message : 'Failed to process trade'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, lotId, lotsToSell, currentPrice } = body

    if (!userId || !lotId || !lotsToSell || !currentPrice) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (lotsToSell <= 0) {
      return NextResponse.json({ error: 'Lots to sell must be greater than 0' }, { status: 400 })
    }

    // Use Portfolio model instead of TradeLot
    const portfolioItem = await db.portfolio.findUnique({ where: { id: lotId } })
    if (!portfolioItem || portfolioItem.userId !== userId) {
      return NextResponse.json({ error: 'Portfolio item not found' }, { status: 404 })
    }

    if (lotsToSell > portfolioItem.shares) {
      return NextResponse.json({ error: 'Insufficient shares to sell' }, { status: 400 })
    }

    const receivedAmount = lotsToSell * currentPrice

    // Add balance
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    await db.user.update({
      where: { id: userId },
      data: { balance: user.balance + receivedAmount },
    })

    let updatedLot
    const remainingShares = portfolioItem.shares - lotsToSell

    if (remainingShares === 0) {
      // Delete the portfolio entry
      await db.portfolio.delete({ where: { id: lotId } })
      updatedLot = { id: lotId, status: 'sold', currentValue: 0 }
    } else {
      // Reduce shares
      updatedLot = await db.portfolio.update({
        where: { id: lotId },
        data: {
          shares: remainingShares,
        },
      })
    }

    // Create transaction record
    await db.transaction.create({
      data: {
        userId,
        stockId: portfolioItem.stockId,
        type: 'SELL',
        orderType: 'market',
        shares: lotsToSell,
        price: currentPrice,
        total: receivedAmount,
        fee: receivedAmount * 0.0015,
        status: 'completed',
      },
    })

    // Create notification
    await db.notification.create({
      data: {
        userId,
        title: 'Penjualan Saham Berhasil',
        message: `Jual ${lotsToSell} lot @ ${currentPrice.toLocaleString('id-ID')} IDR. Diterima: ${receivedAmount.toLocaleString('id-ID')} IDR`,
        type: 'trade',
      },
    })

    const updatedUser = await db.user.findUnique({ where: { id: userId } })

    return NextResponse.json({
      lot: updatedLot,
      newBalance: updatedUser?.balance || 0,
      receivedAmount,
    })
  } catch (error: unknown) {
    console.error('Sell trading lot error:', error)
    const message = error instanceof Error ? error.message : 'Failed to process sell'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
