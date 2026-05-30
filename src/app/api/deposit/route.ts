import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, amount, method, bankName } = body

    if (!userId || !amount) {
      return NextResponse.json(
        { error: 'userId and amount are required' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      )
    }

    const validMethods = ['bank_transfer', 'e_wallet', 'qris']
    if (method && !validMethods.includes(method)) {
      return NextResponse.json(
        { error: 'Method must be bank_transfer, e_wallet, or qris' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Calculate deposit bonus
    const depositBonusThreshold = 1000000
    let bonusAmount = 0
    if (amount >= depositBonusThreshold) {
      bonusAmount = Math.min(Math.round(amount * 0.05), 500000)
    }

    // Calculate new VIP level
    const newTotalDeposit = user.totalDeposit + amount
    let vipLevel = 'Bronze'
    if (newTotalDeposit >= 500000000) vipLevel = 'Diamond'
    else if (newTotalDeposit >= 200000000) vipLevel = 'Platinum'
    else if (newTotalDeposit >= 50000000) vipLevel = 'Gold'
    else if (newTotalDeposit >= 10000000) vipLevel = 'Silver'

    // Auto-approve deposit
    const deposit = await db.deposit.create({
      data: {
        userId,
        amount,
        method: method || 'bank_transfer',
        bankName: bankName || null,
        status: 'completed',
      },
    })

    // Update user balance and total deposit in one call
    await db.user.update({
      where: { id: userId },
      data: {
        balance: { increment: amount + bonusAmount },
        totalDeposit: newTotalDeposit,
        vipLevel,
      },
    })

    // Create deposit bonus if applicable
    if (bonusAmount > 0) {
      await db.bonus.create({
        data: {
          userId,
          type: 'deposit_bonus',
          amount: bonusAmount,
          description: `Bonus deposit 5% dari deposit Rp ${amount.toLocaleString('id-ID')}`,
          status: 'completed',
        },
      })
    }

    // Create notification
    await db.notification.create({
      data: {
        userId,
        title: 'Deposit Berhasil',
        message: `Deposit sebesar Rp ${amount.toLocaleString('id-ID')} telah berhasil dikreditkan ke akun Anda.${bonusAmount > 0 ? ` Bonus deposit 5% sebesar Rp ${bonusAmount.toLocaleString('id-ID')} telah ditambahkan!` : ''}`,
        type: 'deposit',
      },
    })

    return NextResponse.json({ deposit }, { status: 201 })
  } catch (error) {
    console.error('Deposit error:', error)
    return NextResponse.json(
      { error: 'Failed to process deposit' },
      { status: 500 }
    )
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

    const deposits = await db.deposit.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ deposits })
  } catch (error) {
    console.error('Get deposits error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deposits' },
      { status: 500 }
    )
  }
}
