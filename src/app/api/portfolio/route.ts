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

    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const portfolios = await db.portfolio.findMany({
      where: { userId },
      include: {
        stock: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const portfolioWithStats = portfolios.map((p) => {
      const currentValue = p.shares * p.stock.price
      const investedValue = p.shares * p.avgPrice
      const profitLoss = currentValue - investedValue
      const profitLossPercent = investedValue > 0
        ? (profitLoss / investedValue) * 100
        : 0

      return {
        ...p,
        currentValue,
        investedValue,
        profitLoss,
        profitLossPercent,
      }
    })

    const totalInvested = portfolioWithStats.reduce((sum, p) => sum + p.investedValue, 0)
    const totalCurrentValue = portfolioWithStats.reduce((sum, p) => sum + p.currentValue, 0)
    const totalProfitLoss = totalCurrentValue - totalInvested
    const totalProfitLossPercent = totalInvested > 0
      ? (totalProfitLoss / totalInvested) * 100
      : 0

    return NextResponse.json({
      portfolio: portfolioWithStats,
      summary: {
        totalInvested,
        totalCurrentValue,
        totalProfitLoss,
        totalProfitLossPercent,
        cashBalance: user.balance,
        totalAssets: totalCurrentValue + user.balance,
      },
    })
  } catch (error) {
    console.error('Get portfolio error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch portfolio' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, stockId, type, shares, price, orderType } = body

    if (!userId || !stockId || !type || !shares || !price) {
      return NextResponse.json(
        { error: 'userId, stockId, type, shares, and price are required' },
        { status: 400 }
      )
    }

    if (type !== 'BUY' && type !== 'SELL') {
      return NextResponse.json(
        { error: 'Type must be BUY or SELL' },
        { status: 400 }
      )
    }

    if (shares <= 0) {
      return NextResponse.json(
        { error: 'Shares must be greater than 0' },
        { status: 400 }
      )
    }

    const total = shares * price
    const fee = total * 0.0015
    const totalWithFee = type === 'BUY' ? total + fee : total - fee

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const stock = await db.stock.findUnique({ where: { id: stockId } })
    if (!stock) {
      return NextResponse.json(
        { error: 'Stock not found' },
        { status: 404 }
      )
    }

    if (type === 'BUY') {
      if (user.balance < totalWithFee) {
        return NextResponse.json(
          { error: 'Insufficient balance' },
          { status: 400 }
        )
      }

      // Deduct balance and update totalTrading
      await db.user.update({
        where: { id: userId },
        data: {
          balance: user.balance - totalWithFee,
          totalTrading: user.totalTrading + total,
        },
      })

      // Update or create portfolio entry
      const existingPortfolio = await db.portfolio.findUnique({
        where: { userId_stockId: { userId, stockId } },
      })

      if (existingPortfolio) {
        const newShares = existingPortfolio.shares + shares
        const newAvgPrice = ((existingPortfolio.shares * existingPortfolio.avgPrice) + total) / newShares
        await db.portfolio.update({
          where: { id: existingPortfolio.id },
          data: {
            shares: newShares,
            avgPrice: Math.round(newAvgPrice * 100) / 100,
          },
        })
      } else {
        await db.portfolio.create({
          data: { userId, stockId, shares, avgPrice: price },
        })
      }
    } else {
      // SELL
      const existingPortfolio = await db.portfolio.findUnique({
        where: { userId_stockId: { userId, stockId } },
      })

      if (!existingPortfolio || existingPortfolio.shares < shares) {
        return NextResponse.json(
          { error: 'Insufficient shares to sell' },
          { status: 400 }
        )
      }

      // Add balance and update totalTrading
      await db.user.update({
        where: { id: userId },
        data: {
          balance: user.balance + totalWithFee,
          totalTrading: user.totalTrading + total,
        },
      })

      // Update portfolio
      const remainingShares = existingPortfolio.shares - shares
      if (remainingShares === 0) {
        await db.portfolio.delete({ where: { id: existingPortfolio.id } })
      } else {
        await db.portfolio.update({
          where: { id: existingPortfolio.id },
          data: { shares: remainingShares },
        })
      }
    }

    // Create transaction record
    const transaction = await db.transaction.create({
      data: {
        userId,
        stockId,
        type,
        orderType: orderType || 'market',
        shares,
        price,
        total,
        fee,
        status: 'completed',
      },
      include: { stock: true },
    })

    // Create notification
    await db.notification.create({
      data: {
        userId,
        title: type === 'BUY' ? 'Pembelian Berhasil' : 'Penjualan Berhasil',
        message: `${type === 'BUY' ? 'Pembelian' : 'Penjualan'} ${shares} lot ${stock.code} @ Rp ${price.toLocaleString('id-ID')} berhasil. Total: Rp ${Math.round(totalWithFee).toLocaleString('id-ID')}`,
        type: 'trade',
      },
    })

    return NextResponse.json({ transaction }, { status: 201 })
  } catch (error: unknown) {
    console.error('Portfolio trade error:', error)
    const message = error instanceof Error ? error.message : 'Failed to process trade'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
