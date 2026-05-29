import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, stockId, type, shares, price } = body

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

    // Use a transaction to ensure data consistency
    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
      })

      if (!user) {
        throw new Error('User not found')
      }

      const stock = await tx.stock.findUnique({
        where: { id: stockId },
      })

      if (!stock) {
        throw new Error('Stock not found')
      }

      if (type === 'BUY') {
        // Check if user has enough balance
        if (user.balance < total) {
          throw new Error('Insufficient balance')
        }

        // Deduct balance
        await tx.user.update({
          where: { id: userId },
          data: { balance: user.balance - total },
        })

        // Update or create portfolio entry
        const existingPortfolio = await tx.portfolio.findUnique({
          where: {
            userId_stockId: { userId, stockId },
          },
        })

        if (existingPortfolio) {
          const newShares = existingPortfolio.shares + shares
          const newAvgPrice = ((existingPortfolio.shares * existingPortfolio.avgPrice) + total) / newShares
          await tx.portfolio.update({
            where: { id: existingPortfolio.id },
            data: {
              shares: newShares,
              avgPrice: Math.round(newAvgPrice * 100) / 100,
            },
          })
        } else {
          await tx.portfolio.create({
            data: {
              userId,
              stockId,
              shares,
              avgPrice: price,
            },
          })
        }
      } else {
        // SELL
        const existingPortfolio = await tx.portfolio.findUnique({
          where: {
            userId_stockId: { userId, stockId },
          },
        })

        if (!existingPortfolio || existingPortfolio.shares < shares) {
          throw new Error('Insufficient shares to sell')
        }

        // Add balance
        await tx.user.update({
          where: { id: userId },
          data: { balance: user.balance + total },
        })

        // Update portfolio
        const remainingShares = existingPortfolio.shares - shares
        if (remainingShares === 0) {
          await tx.portfolio.delete({
            where: { id: existingPortfolio.id },
          })
        } else {
          await tx.portfolio.update({
            where: { id: existingPortfolio.id },
            data: { shares: remainingShares },
          })
        }
      }

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId,
          stockId,
          type,
          shares,
          price,
          total,
          status: 'completed',
        },
        include: {
          stock: true,
        },
      })

      return transaction
    })

    return NextResponse.json({ transaction: result }, { status: 201 })
  } catch (error: unknown) {
    console.error('Transaction error:', error)
    const message = error instanceof Error ? error.message : 'Failed to process transaction'
    const status = message === 'User not found' || message === 'Stock not found'
      ? 404
      : message === 'Insufficient balance' || message === 'Insufficient shares to sell'
        ? 400
        : 500
    return NextResponse.json({ error: message }, { status })
  }
}

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

    const transactions = await db.transaction.findMany({
      where: { userId },
      include: {
        stock: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error('Get transactions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}
