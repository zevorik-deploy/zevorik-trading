import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email: rawEmail, phone, newPassword, otpVerified } = body

    // Normalize email to lowercase
    const email = rawEmail ? rawEmail.trim().toLowerCase() : null

    // Support both email and phone lookup
    const identifier = email || phone

    if (!identifier || !newPassword) {
      return NextResponse.json(
        { error: 'Email/phone and newPassword are required' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // OTP verification is required
    if (!otpVerified) {
      return NextResponse.json(
        { error: 'Verifikasi OTP diperlukan untuk reset password' },
        { status: 400 }
      )
    }

    // Find user by email or phone
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
        { error: 'Akun tidak ditemukan' },
        { status: 404 }
      )
    }

    // Verify OTP was actually verified in database
    const verifiedOTP = await db.oTP.findFirst({
      where: {
        email: user.email,
        type: 'forgot_password',
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

    const hashedPassword = await hashPassword(newPassword)

    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    // Notify user
    await db.notification.create({
      data: {
        userId: user.id,
        title: 'Password Diubah',
        message: 'Password akun Anda telah berhasil diubah. Jika ini bukan Anda, segera hubungi customer service.',
        type: 'alert',
      },
    })

    return NextResponse.json({
      message: 'Password updated successfully',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}
