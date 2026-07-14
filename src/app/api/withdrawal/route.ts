import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, amount, bankName, bankAccount, bankHolder, otpVerified } = body

    if (!userId || !amount || !bankName || !bankAccount || !bankHolder) {
      return NextResponse.json(
        { error: 'userId, amount, bankName, bankAccount, and bankHolder are required' },
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

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Jumlah penarikan harus lebih dari 0' },
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

    // Maximum withdrawal per transaction
    const maxWithdraw = 500000000 // 500 million
    if (amount > maxWithdraw) {
      return NextResponse.json(
        { error: `Maximum penarikan per transaksi adalah Rp ${maxWithdraw.toLocaleString('id-ID')}` },
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
