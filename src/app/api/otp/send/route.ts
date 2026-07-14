import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendEmail, generateOTPCode, otpEmailTemplate } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, type } = body // type: 'register' | 'withdrawal' | 'forgot_password'

    if (!email || !type) {
      return NextResponse.json(
        { error: 'Email and type are required' },
        { status: 400 }
      )
    }

    // For registration, check if email already registered
    if (type === 'register') {
      const existingUser = await db.user.findUnique({ where: { email } })
      if (existingUser) {
        return NextResponse.json(
          { error: 'Email sudah terdaftar. Silakan login.' },
          { status: 409 }
        )
      }
    }

    // For withdrawal, verify user exists
    if (type === 'withdrawal') {
      const user = await db.user.findUnique({ where: { email } })
      if (!user) {
        return NextResponse.json(
          { error: 'User tidak ditemukan' },
          { status: 404 }
        )
      }
    }

    // Invalidate previous OTPs for this email+type
    await db.oTP.updateMany({
      where: { email, type, verified: false },
      data: { verified: true },
    })

    // Generate new OTP
    const code = generateOTPCode()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Get userId for withdrawal type
    let userId: string | null = null
    if (type === 'withdrawal') {
      const user = await db.user.findUnique({ where: { email } })
      userId = user?.id || null
    }

    // Store OTP in database
    await db.oTP.create({
      data: {
        email,
        code,
        type,
        expiresAt,
        userId,
      },
    })

    // Send email
    const emailSent = await sendEmail({
      to: email,
      subject: `ZEVORIK - Kode Verifikasi ${type === 'register' ? 'Pendaftaran' : type === 'withdrawal' ? 'Penarikan' : 'Reset Password'}`,
      html: otpEmailTemplate(code, type),
    })

    if (!emailSent) {
      console.log(`OTP for ${email} (${type}): ${code}`)
      return NextResponse.json({
        success: true,
        message: 'Kode OTP telah dikirim ke email Anda',
        ...(process.env.NODE_ENV !== 'production' ? { devCode: code } : {}),
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Kode OTP telah dikirim ke email Anda',
    })
  } catch (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json(
      { error: 'Gagal mengirim OTP' },
      { status: 500 }
    )
  }
}
