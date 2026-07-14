import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, generateToken, generateTempToken, verifyTempToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Step 2: Verify PIN with tempToken
    if (body.tempToken && body.pin) {
      const { tempToken, pin } = body

      const tempPayload = await verifyTempToken(tempToken)
      if (!tempPayload) {
        return NextResponse.json(
          { error: 'Temp token expired or invalid. Please restart login.' },
          { status: 401 }
        )
      }

      const user = await db.user.findUnique({
        where: { id: tempPayload.userId },
      })

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      const pinValid = await verifyPassword(pin, user.pin)
      if (!pinValid) {
        return NextResponse.json(
          { error: 'Invalid PIN' },
          { status: 401 }
        )
      }

      const token = await generateToken({ userId: user.id, phone: user.phone })

      return NextResponse.json({
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          balance: user.balance,
          role: user.role,
          kycStatus: user.kycStatus,
          emailVerified: user.emailVerified,
          totalDeposit: user.totalDeposit,
          totalTrading: user.totalTrading,
          bankName: user.bankName,
          bankAccount: user.bankAccount,
          bankHolder: user.bankHolder,
          avatar: user.avatar,
          createdAt: user.createdAt,
        },
        token,
      })
    }

    // Step 1: Verify identifier + password
    const { identifier, password } = body

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Identifier (email or phone) and password are required' },
        { status: 400 }
      )
    }

    // Find user by email OR phone
    const user = await db.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier },
        ],
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Generate temp token valid for 5 minutes
    const tempToken = await generateTempToken({ userId: user.id })

    return NextResponse.json({
      step: 'pin_required',
      tempToken,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    )
  }
}
