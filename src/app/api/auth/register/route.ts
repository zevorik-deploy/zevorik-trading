import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, generateToken } from '@/lib/auth'

function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = 'GS'
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, password, referralCode: inputReferralCode, accountType } = body

    if (!name || !phone || !password) {
      return NextResponse.json(
        { error: 'Name, phone, and password are required' },
        { status: 400 }
      )
    }

    const isDemo = accountType === 'demo'
    const effectiveAccountType = isDemo ? 'demo' : 'real'

    const existingUser = await db.user.findUnique({ where: { phone } })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Phone number already registered' },
        { status: 409 }
      )
    }

    const hashedPassword = await hashPassword(password)

    let referralCode = generateReferralCode()
    let codeExists = await db.user.findUnique({ where: { referralCode } })
    while (codeExists) {
      referralCode = generateReferralCode()
      codeExists = await db.user.findUnique({ where: { referralCode } })
    }

    let referrerId: string | null = null
    if (inputReferralCode && !isDemo) {
      const referrer = await db.user.findUnique({
        where: { referralCode: inputReferralCode },
      })
      if (referrer) {
        referrerId = referrer.id
      }
    }

    // Demo: 100M balance, no welcome bonus
    // Real: 0 balance (user must deposit/topup)
    const welcomeBonus = 0
    const initialBalance = isDemo ? 100000000 : 0

    const user = await db.user.create({
      data: {
        name,
        username: name.toLowerCase().replace(/\s+/g, '_'),
        phone,
        password: hashedPassword,
        balance: initialBalance,
        role: isDemo ? 'investor' : 'investor',
        accountType: effectiveAccountType,
        referralCode,
        referredBy: referrerId,
        vipLevel: 'Bronze',
        totalDeposit: 0,
        totalTrading: 0,
        dailyCheckIn: 0,
      },
    })

    // No welcome bonus - balance starts at 0 for real accounts

    // Handle referral - only for real accounts (demo money isn't real)
    if (referrerId && !isDemo) {
      const bonusAmount = 50000
      await db.referral.create({
        data: {
          referrerId,
          referredId: user.id,
          bonusAmount,
          status: 'completed',
        },
      })
      await db.user.update({
        where: { id: referrerId },
        data: { balance: { increment: bonusAmount } },
      })
      await db.user.update({
        where: { id: user.id },
        data: { balance: { increment: bonusAmount } },
      })
      await db.bonus.create({
        data: {
          userId: referrerId,
          type: 'referral_bonus',
          amount: bonusAmount,
          description: `Bonus referral karena mengajak ${name} bergabung`,
          status: 'completed',
        },
      })
      await db.bonus.create({
        data: {
          userId: user.id,
          type: 'referral_bonus',
          amount: bonusAmount,
          description: 'Bonus referral dari kode referral',
          status: 'completed',
        },
      })
      await db.notification.create({
        data: {
          userId: referrerId,
          title: 'Bonus Referral!',
          message: `Anda mendapat bonus referral Rp ${bonusAmount.toLocaleString('id-ID')} karena mengajak teman bergabung.`,
          type: 'alert',
        },
      })
      await db.notification.create({
        data: {
          userId: user.id,
          title: 'Bonus Referral!',
          message: `Anda mendapat bonus referral Rp ${bonusAmount.toLocaleString('id-ID')} dari kode referral.`,
          type: 'alert',
        },
      })
    }

    // Welcome notification
    if (isDemo) {
      await db.notification.create({
        data: {
          userId: user.id,
          title: 'Selamat Datang! 🎉',
          message: `Selamat datang di ZEVORIX! Ini adalah akun demo dengan saldo Rp 100.000.000. Coba fitur trading tanpa risiko!`,
          type: 'system',
        },
      })
    } else {
      await db.notification.create({
        data: {
          userId: user.id,
          title: 'Selamat Datang! 🎉',
          message: `Selamat datang di ZEVORIX! Mulai investasi Anda dengan deposit via QRIS. Lengkapi tugas harian untuk mendapat bonus!`,
          type: 'system',
        },
      })
    }

    const token = await generateToken({ userId: user.id, phone: user.phone })

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        phone: user.phone,
        email: user.email,
        balance: user.balance,
        role: user.role,
        accountType: user.accountType,
        avatar: user.avatar,
        referralCode: user.referralCode,
        kycStatus: user.kycStatus,
        vipLevel: user.vipLevel,
        totalDeposit: user.totalDeposit,
        totalTrading: user.totalTrading,
        bankName: user.bankName,
        bankAccount: user.bankAccount,
        bankHolder: user.bankHolder,
        createdAt: user.createdAt,
      },
      token,
    }, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    )
  }
}
