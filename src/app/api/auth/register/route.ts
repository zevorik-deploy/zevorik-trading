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
    const { name, phone, password, referredBy } = body

    if (!name || !phone || !password) {
      return NextResponse.json(
        { error: 'Name, phone, and password are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { phone },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Phone number already registered' },
        { status: 409 }
      )
    }

    const hashedPassword = await hashPassword(password)

    // Generate unique referral code
    let referralCode = generateReferralCode()
    let codeExists = await db.user.findUnique({ where: { referralCode } })
    while (codeExists) {
      referralCode = generateReferralCode()
      codeExists = await db.user.findUnique({ where: { referralCode } })
    }

    // Handle referral
    let referrerId: string | null = null
    if (referredBy) {
      const referrer = await db.user.findUnique({
        where: { referralCode: referredBy },
      })
      if (referrer) {
        referrerId = referrer.id
      }
    }

    const user = await db.user.create({
      data: {
        name,
        phone,
        password: hashedPassword,
        balance: 10000000, // Default balance: Rp 10,000,000
        role: 'investor',
        referralCode,
        referredBy: referrerId,
      },
    })

    // Create referral record if user was referred
    if (referrerId) {
      const bonusAmount = 50000 // Rp 50,000 referral bonus
      await db.referral.create({
        data: {
          referrerId,
          referredId: user.id,
          bonusAmount,
          status: 'completed',
        },
      })
      // Add bonus to referrer's balance
      await db.user.update({
        where: { id: referrerId },
        data: { balance: { increment: bonusAmount } },
      })
      // Add bonus to new user's balance
      await db.user.update({
        where: { id: user.id },
        data: { balance: { increment: bonusAmount } },
      })
      // Notify referrer
      await db.notification.create({
        data: {
          userId: referrerId,
          title: 'Bonus Referral!',
          message: `Anda mendapat bonus referral Rp ${bonusAmount.toLocaleString('id-ID')} karena mengajak teman bergabung.`,
          type: 'alert',
        },
      })
      // Notify new user
      await db.notification.create({
        data: {
          userId: user.id,
          title: 'Bonus Referral!',
          message: `Anda mendapat bonus referral Rp ${bonusAmount.toLocaleString('id-ID')} dari kode referral.`,
          type: 'alert',
        },
      })
    }

    const token = await generateToken({ userId: user.id, phone: user.phone })

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        balance: user.balance,
        role: user.role,
        avatar: user.avatar,
        referralCode: user.referralCode,
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
