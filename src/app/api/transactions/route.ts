import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const where: { userId: string; type?: string } = { userId }
    if (type) {
      where.type = type.toUpperCase()
    }

    const skip = (page - 1) * limit

    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where,
        include: { stock: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.transaction.count({ where }),
    ])

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get transactions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
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
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const stock = await db.stock.findUnique({ where: { id: stockId } })
    if (!stock) {
      return NextResponse.json({ error: 'Stock not found' }, { status: 404 })
    }

    if (type === 'BUY') {
      if (user.balance < totalWithFee) {
        return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
      }

      await db.user.update({
        where: { id: userId },
        data: {
          balance: user.balance - totalWithFee,
          totalTrading: user.totalTrading + total,
        },
      })

      const existingPortfolio = await db.portfolio.findUnique({
        where: { userId_stockId: { userId, stockId } },
      })

      if (existingPortfolio) {
        const newShares = existingPortfolio.shares + shares
        const newAvgPrice = ((existingPortfolio.shares * existingPortfolio.avgPrice) + total) / newShares
        await db.portfolio.update({
          where: { id: existingPortfolio.id },
          data: { shares: newShares, avgPrice: Math.round(newAvgPrice * 100) / 100 },
        })
      } else {
        await db.portfolio.create({
          data: { userId, stockId, shares, avgPrice: price },
        })
      }
    } else {
      const existingPortfolio = await db.portfolio.findUnique({
        where: { userId_stockId: { userId, stockId } },
      })

      if (!existingPortfolio || existingPortfolio.shares < shares) {
        return NextResponse.json({ error: 'Insufficient shares to sell' }, { status: 400 })
      }

      await db.user.update({
        where: { id: userId },
        data: {
          balance: user.balance + totalWithFee,
          totalTrading: user.totalTrading + total,
        },
      })

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

    const transaction = await db.transaction.create({
      data: {
        userId, stockId, type,
        orderType: orderType || 'market',
        shares, price, total, fee,
        status: 'completed',
      },
      include: { stock: true },
    })

    await db.notification.create({
      data: {
        userId,
        title: type === 'BUY' ? 'Pembelian Berhasil' : 'Penjualan Berhasil',
        message: `${type === 'BUY' ? 'Pembelian' : 'Penjualan'} ${shares} lot ${stock.code} @ Rp ${price.toLocaleString('id-ID')} berhasil.`,
        type: 'trade',
      },
    })

    return NextResponse.json({ transaction }, { status: 201 })
  } catch (error: unknown) {
    console.error('Transaction error:', error)
    const message = error instanceof Error ? error.message : 'Failed to process transaction'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
