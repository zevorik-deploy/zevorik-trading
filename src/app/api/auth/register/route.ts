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
    const { name, phone, password, referralCode: inputReferralCode } = body

    if (!name || !phone || !password) {
      return NextResponse.json(
        { error: 'Name, phone, and password are required' },
        { status: 400 }
      )
    }

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
    if (inputReferralCode) {
      const referrer = await db.user.findUnique({
        where: { referralCode: inputReferralCode },
      })
      if (referrer) {
        referrerId = referrer.id
      }
    }

    // Give welcome bonus
    const welcomeBonus = 25000

    const user = await db.user.create({
      data: {
        name,
        username: name.toLowerCase().replace(/\s+/g, '_'),
        phone,
        password: hashedPassword,
        balance: 100000000 + welcomeBonus, // Default balance + welcome bonus
        role: 'investor',
        referralCode,
        referredBy: referrerId,
        vipLevel: 'Bronze',
        totalDeposit: 0,
        totalTrading: 0,
        dailyCheckIn: 0,
      },
    })

    // Create welcome bonus
    await db.bonus.create({
      data: {
        userId: user.id,
        type: 'welcome_bonus',
        amount: welcomeBonus,
        description: 'Bonus selamat datang untuk member baru',
        status: 'completed',
      },
    })

    // Handle referral
    if (referrerId) {
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
    await db.notification.create({
      data: {
        userId: user.id,
        title: 'Selamat Datang! 🎉',
        message: `Selamat datang di Global Saham! Anda mendapat bonus selamat datang Rp ${welcomeBonus.toLocaleString('id-ID')}. Mulai investasi Anda sekarang!`,
        type: 'system',
      },
    })

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
