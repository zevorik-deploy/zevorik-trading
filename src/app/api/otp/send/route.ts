import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendEmail, generateOTPCode, otpEmailTemplate } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email: rawEmail, type } = body // type: 'register' | 'withdrawal' | 'forgot_password'

    // Normalize email to lowercase
    const email = (rawEmail || '').trim().toLowerCase()

    if (!email || !type) {
      return NextResponse.json(
        { error: 'Email dan tipe verifikasi wajib diisi' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Format email tidak valid' },
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

    // Rate limiting: check if an OTP was recently created (within 60 seconds) BEFORE deleting
    const recentOTP = await db.oTP.findFirst({
      where: {
        email,
        type,
        createdAt: { gt: new Date(Date.now() - 60 * 1000) },
      },
    })
    if (recentOTP) {
      return NextResponse.json(
        { error: 'Tunggu 60 detik sebelum meminta OTP baru' },
        { status: 429 }
      )
    }

    // Delete ALL previous OTPs for this email+type (clean up properly)
    await db.oTP.deleteMany({
      where: { email, type },
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
    let emailSent = false
    try {
      emailSent = await sendEmail({
        to: email,
        subject: `ZEVORIK - Kode Verifikasi ${type === 'register' ? 'Pendaftaran' : type === 'withdrawal' ? 'Penarikan' : 'Reset Password'}`,
        html: otpEmailTemplate(code, type),
      })
    } catch (emailError) {
      console.error('Email send error:', emailError)
      emailSent = false
    }

    if (!emailSent) {
      // In development, return the code for testing
      console.log(`[DEV] OTP for ${email} (${type}): ${code}`)
      return NextResponse.json({
        success: true,
        message: 'Kode OTP telah dikirim ke email Anda',
        // Include dev code only in development for debugging
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
      { error: 'Gagal mengirim OTP. Silakan coba lagi.' },
      { status: 500 }
    )
  }
}
