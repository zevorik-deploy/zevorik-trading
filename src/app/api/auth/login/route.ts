import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, password } = body

    if (!phone || !password) {
      return NextResponse.json(
        { error: 'Phone and password are required' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { phone },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid phone number or password' },
        { status: 401 }
      )
    }

    const isValid = await verifyPassword(password, user.password)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid phone number or password' },
        { status: 401 }
      )
    }

    const token = await generateToken({ userId: user.id, phone: user.phone })

    // Calculate VIP level
    const vipLevel = calculateVIPLevel(user.totalDeposit)

    // Update VIP level if changed
    if (user.vipLevel !== vipLevel) {
      await db.user.update({
        where: { id: user.id },
        data: { vipLevel },
      })
    }

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
        vipLevel,
        totalDeposit: user.totalDeposit,
        totalTrading: user.totalTrading,
        bankName: user.bankName,
        bankAccount: user.bankAccount,
        bankHolder: user.bankHolder,
        createdAt: user.createdAt,
      },
      token,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    )
  }
}

function calculateVIPLevel(totalDeposit: number): string {
  if (totalDeposit >= 500000000) return 'Diamond'
  if (totalDeposit >= 200000000) return 'Platinum'
  if (totalDeposit >= 50000000) return 'Gold'
  if (totalDeposit >= 10000000) return 'Silver'
  return 'Bronze'
}
