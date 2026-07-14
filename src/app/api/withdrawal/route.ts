import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, amount, bankName, bankAccount, bankHolder, otpVerified } = body

    if (!userId || !amount || !bankName || !bankAccount || !bankHolder) {
      return NextResponse.json(
        { error: 'userId, amount, bankName, bankAccount, dan bankHolder are required' },
        { status: 400 }
      )
    }

    // Require OTP verification for withdrawal
    if (!otpVerified) {
      return NextResponse.json(
        { error: 'Verifikasi OTP diperlukan untuk penarikan dana' },
        { status: 400 }
      )
    }

    const withdrawAmount = parseFloat(amount)
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return NextResponse.json(
        { error: 'Jumlah penarikan harus lebih dari 0' },
        { status: 400 }
      )
    }

    // Minimum withdrawal 10 USDT
    if (withdrawAmount < 10) {
      return NextResponse.json(
        { error: 'Minimum penarikan 10 USDT' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    // Verify OTP was actually verified
    const verifiedOTP = await db.oTP.findFirst({
      where: {
        email: user.email,
        type: 'withdrawal',
        verified: true,
        expiresAt: { gt: new Date(Date.now() - 10 * 60 * 1000) },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!verifiedOTP) {
      return NextResponse.json(
        { error: 'Verifikasi OTP tidak valid atau sudah kadaluarsa' },
        { status: 400 }
      )
    }

    // KYC required for withdrawal
    if (user.kycStatus !== 'verified') {
      return NextResponse.json(
        { error: 'Verifikasi KYC diperlukan untuk melakukan penarikan' },
        { status: 403 }
      )
    }

    if (user.balance < withdrawAmount) {
      return NextResponse.json(
        { error: 'Saldo tidak cukup' },
        { status: 400 }
      )
    }

    // =============================================
    // PROFIT-BASED WITHDRAWAL PENALTY SYSTEM
    // =============================================
    const totalDeposit = user.totalDeposit || 0
    const profit = user.balance - totalDeposit
    const profitPercent = totalDeposit > 0 ? (profit / totalDeposit) * 100 : 0
    const isProfit100Percent = profitPercent >= 100

    let penalty = 0
    let adminFee = 0
    let netAmount = 0
    let feeDescription = ''

    if (isProfit100Percent) {
      // Profit >= 100% of modal: only 5% admin fee
      adminFee = Math.round(withdrawAmount * 0.05 * 100) / 100
      penalty = 0
      netAmount = withdrawAmount - adminFee
      feeDescription = `Profit ≥ 100% dari modal. Biaya admin 5%: ${adminFee} USDT. Diterima: ${netAmount} USDT`
    } else {
      // Profit < 100% of modal: 50% penalty + 5% admin fee = 55% total deduction
      penalty = Math.round(withdrawAmount * 0.50 * 100) / 100
      const remainingAfterPenalty = withdrawAmount - penalty
      adminFee = Math.round(remainingAfterPenalty * 0.05 * 100) / 100
      netAmount = remainingAfterPenalty - adminFee
      feeDescription = `Profit < 100% dari modal (${profitPercent.toFixed(1)}%). Penalty 50%: ${penalty} USDT. Biaya admin 5%: ${adminFee} USDT. Total potongan: ${penalty + adminFee} USDT. Diterima: ${netAmount} USDT`
    }

    // Create withdrawal
    const withdrawal = await db.withdrawal.create({
      data: {
        userId,
        amount: withdrawAmount,
        bankName,
        bankAccount,
        bankHolder,
        status: 'processing',
        note: feeDescription,
      },
    })

    // Deduct balance
    await db.user.update({
      where: { id: userId },
      data: { balance: user.balance - withdrawAmount },
    })

    await db.notification.create({
      data: {
        userId,
        title: 'Permintaan Penarikan',
        message: isProfit100Percent
          ? `Penarikan ${withdrawAmount} USDT sedang diproses. Biaya admin 5%: ${adminFee} USDT. Dana diterima: ${netAmount} USDT. Transfer dalam 1x24 jam.`
          : `Penarikan ${withdrawAmount} USDT sedang diproses. Profit Anda ${profitPercent.toFixed(1)}% dari modal (< 100%). Penalty 50%: ${penalty} USDT + Admin 5%: ${adminFee} USDT. Dana diterima: ${netAmount} USDT. Transfer dalam 1x24 jam.`,
        type: 'info',
      },
    })

    return NextResponse.json({
      withdrawal,
      penalty,
      adminFee,
      netAmount,
      isProfit100Percent,
      profitPercent: Math.round(profitPercent * 100) / 100,
      totalDeduction: penalty + adminFee,
      deductionPercent: isProfit100Percent ? 5 : 55,
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
      select: { kycStatus: true, balance: true, totalDeposit: true, email: true },
    })

    const isKycVerified = user?.kycStatus === 'verified'
    const totalDeposit = user?.totalDeposit || 0
    const balance = user?.balance || 0
    const profit = balance - totalDeposit
    const profitPercent = totalDeposit > 0 ? (profit / totalDeposit) * 100 : 0

    const withdrawals = await db.withdrawal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      withdrawals,
      withdrawalInfo: {
        minWithdraw: 10,
        isKycVerified,
        balance,
        totalDeposit,
        profit,
        profitPercent: Math.round(profitPercent * 100) / 100,
        isProfit100Percent: profitPercent >= 100,
        feeIfProfit100: 5,       // 5% admin only
        feeIfProfitLess100: 55,  // 50% penalty + 5% admin
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
