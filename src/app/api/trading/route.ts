import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const lots = await db.tradeLot.findMany({
      where: { userId, status: 'active' },
      orderBy: { createdAt: 'desc' },
    })

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
      // Amount-based: totalCost = amount, lots = amount / price
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

    // Deduct balance
    await db.user.update({
      where: { id: userId },
      data: {
        balance: user.balance - totalCost,
        totalTrading: user.totalTrading + totalCost,
      },
    })

    // Check if user already has active lots for this stock
    const existingLot = await db.tradeLot.findFirst({
      where: { userId, stockCode, status: 'active' },
    })

    let lot
    if (existingLot) {
      // Merge: average buy price
      const newTotalLots = existingLot.lots + effectiveLots
      const newTotalInvested = existingLot.totalInvested + totalCost
      const newAvgPrice = newTotalInvested / newTotalLots
      const newCurrentValue = newTotalLots * price

      lot = await db.tradeLot.update({
        where: { id: existingLot.id },
        data: {
          lots: newTotalLots,
          buyPrice: Math.round(newAvgPrice),
          totalInvested: newTotalInvested,
          currentValue: newCurrentValue,
          currentPrice: price,
        },
      })
    } else {
      lot = await db.tradeLot.create({
        data: {
          userId,
          stockCode,
          stockName,
          lots: effectiveLots,
          buyPrice: price,
          currentPrice: price,
          totalInvested: totalCost,
          currentValue: totalCost,
          status: 'active',
        },
      })
    }

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

    const lot = await db.tradeLot.findUnique({ where: { id: lotId } })
    if (!lot || lot.userId !== userId || lot.status !== 'active') {
      return NextResponse.json({ error: 'Trade lot not found' }, { status: 404 })
    }

    if (lotsToSell > lot.lots) {
      return NextResponse.json({ error: 'Insufficient lots to sell' }, { status: 400 })
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
    const remainingLots = lot.lots - lotsToSell

    if (remainingLots === 0) {
      // Mark as sold
      updatedLot = await db.tradeLot.update({
        where: { id: lotId },
        data: {
          status: 'sold',
          soldAt: new Date(),
          currentPrice,
          currentValue: 0,
        },
      })
    } else {
      // Reduce lots
      const newInvested = Math.round(lot.totalInvested * (remainingLots / lot.lots))
      const newValue = remainingLots * currentPrice
      updatedLot = await db.tradeLot.update({
        where: { id: lotId },
        data: {
          lots: remainingLots,
          totalInvested: newInvested,
          currentValue: newValue,
          currentPrice,
        },
      })
    }

    // Create notification
    await db.notification.create({
      data: {
        userId,
        title: 'Penjualan Saham Berhasil',
        message: `Jual ${lotsToSell} lot ${lot.stockCode} @ ${currentPrice.toLocaleString('id-ID')} IDR. Diterima: ${receivedAmount.toLocaleString('id-ID')} IDR`,
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
