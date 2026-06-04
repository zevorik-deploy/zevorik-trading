import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, amount, bankName, bankAccount, bankHolder } = body

    if (!userId || !amount || !bankName || !bankAccount || !bankHolder) {
      return NextResponse.json(
        { error: 'userId, amount, bankName, bankAccount, and bankHolder are required' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
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

    // KYC-based minimum withdrawal
    const isKycVerified = user.kycStatus === 'verified'
    const minWithdraw = isKycVerified ? 50000 : 250000

    if (amount < minWithdraw) {
      return NextResponse.json(
        { error: `Minimum penarikan ${isKycVerified ? 'dengan KYC terverifikasi' : 'tanpa verifikasi KYC'} adalah Rp ${minWithdraw.toLocaleString('id-ID')}. Verifikasi KYC untuk minimum Rp 50.000!` },
        { status: 400 }
      )
    }

    if (user.balance < amount) {
      return NextResponse.json(
        { error: 'Saldo tidak cukup' },
        { status: 400 }
      )
    }

    // VIP withdrawal limits
    const withdrawalLimits: Record<string, number> = {
      Bronze: 50000000,
      Silver: 100000000,
      Gold: 250000000,
      Platinum: 500000000,
      Diamond: 1000000000,
    }
    const limit = withdrawalLimits[user.vipLevel] || 50000000
    if (amount > limit) {
      return NextResponse.json(
        { error: `Maximum withdrawal for ${user.vipLevel} level is Rp ${limit.toLocaleString('id-ID')}` },
        { status: 400 }
      )
    }

    // Calculate 10% admin fee
    const adminFee = Math.round(amount * 0.10)
    const netAmount = amount - adminFee

    // Create withdrawal and deduct balance
    const withdrawal = await db.withdrawal.create({
      data: {
        userId,
        amount,
        bankName,
        bankAccount,
        bankHolder,
        status: 'processing',
        note: `Biaya admin 10%: Rp ${adminFee.toLocaleString('id-ID')} | Diterima: Rp ${netAmount.toLocaleString('id-ID')}`,
      },
    })

    await db.user.update({
      where: { id: userId },
      data: { balance: user.balance - amount },
    })

    await db.notification.create({
      data: {
        userId,
        title: 'Permintaan Penarikan',
        message: `Penarikan sebesar Rp ${amount.toLocaleString('id-ID')} sedang diproses. Biaya admin 10%: Rp ${adminFee.toLocaleString('id-ID')}. Dana diterima: Rp ${netAmount.toLocaleString('id-ID')}. Transfer dalam 1x24 jam.`,
        type: 'info',
      },
    })

    return NextResponse.json({
      withdrawal,
      adminFee,
      netAmount,
    }, { status: 201 })
  } catch (error) {
    console.error('Withdrawal error:', error)
    return NextResponse.json(
      { error: 'Failed to process withdrawal' },
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

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { kycStatus: true },
    })

    const isKycVerified = user?.kycStatus === 'verified'

    const withdrawals = await db.withdrawal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      withdrawals,
      withdrawalInfo: {
        minWithdraw: isKycVerified ? 50000 : 250000,
        adminFeePercent: 10,
        isKycVerified,
      },
    })
  } catch (error) {
    console.error('Get withdrawals error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch withdrawals' },
      { status: 500 }
    )
  }
}
