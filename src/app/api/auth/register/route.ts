import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, password, pin, otpVerified } = body

    // Validate all required fields
    if (!name || !email || !phone || !password || !pin) {
      return NextResponse.json(
        { error: 'Name, email, phone, password, and PIN are required' },
        { status: 400 }
      )
    }

    // Validate OTP was verified
    if (!otpVerified) {
      return NextResponse.json(
        { error: 'Email belum diverifikasi. Silakan verifikasi OTP terlebih dahulu.' },
        { status: 400 }
      )
    }

    // Double check that OTP was actually verified in our database
    const verifiedOTP = await db.oTP.findFirst({
      where: {
        email,
        type: 'register',
        verified: true,
        expiresAt: { gt: new Date(Date.now() - 10 * 60 * 1000) }, // within 10 minutes
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!verifiedOTP) {
      return NextResponse.json(
        { error: 'Verifikasi OTP tidak valid atau sudah kadaluarsa. Silakan coba lagi.' },
        { status: 400 }
      )
    }

    // Validate PIN is 6 digits
    if (!/^\d{6}$/.test(pin)) {
      return NextResponse.json(
        { error: 'PIN must be exactly 6 digits' },
        { status: 400 }
      )
    }

    // Check email uniqueness
    const existingEmail = await db.user.findUnique({ where: { email } })
    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar' },
        { status: 409 }
      )
    }

    // Check phone uniqueness
    const existingPhone = await db.user.findUnique({ where: { phone } })
    if (existingPhone) {
      return NextResponse.json(
        { error: 'Nomor telepon sudah terdaftar' },
        { status: 409 }
      )
    }

    // Hash password and pin
    const hashedPassword = await hashPassword(password)
    const hashedPin = await hashPassword(pin)

    // Create user with emailVerified = true since OTP was verified
    const user = await db.user.create({
      data: {
        name,
        phone,
        email,
        password: hashedPassword,
        pin: hashedPin,
        balance: 0,
        role: 'investor',
        kycStatus: 'pending',
        emailVerified: true,
      },
    })

    // Welcome notification
    await db.notification.create({
      data: {
        userId: user.id,
        title: 'Selamat Datang! 🎉',
        message: `Selamat datang di ZEVORIK! Mulai investasi Anda dengan deposit. Lengkapi KYC untuk akses penuh!`,
        type: 'system',
      },
    })

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
    }, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    )
  }
}
