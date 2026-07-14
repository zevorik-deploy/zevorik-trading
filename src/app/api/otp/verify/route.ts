import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email: rawEmail, code, type } = body

    // Normalize email to lowercase
    const email = (rawEmail || '').trim().toLowerCase()

    if (!email || !code || !type) {
      return NextResponse.json(
        { error: 'Email, kode OTP, dan tipe wajib diisi' },
        { status: 400 }
      )
    }

    // Validate OTP code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: 'Kode OTP harus 6 digit angka' },
        { status: 400 }
      )
    }

    // Find the most recent valid OTP
    const otpRecord = await db.oTP.findFirst({
      where: {
        email,
        type,
        code,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!otpRecord) {
      // Check if OTP exists but already verified or expired
      const anyOTP = await db.oTP.findFirst({
        where: { email, type, code },
        orderBy: { createdAt: 'desc' },
      })

      if (anyOTP) {
        if (anyOTP.verified) {
          return NextResponse.json(
            { error: 'Kode OTP sudah digunakan. Silakan minta kode baru.' },
            { status: 400 }
          )
        }
        if (anyOTP.expiresAt <= new Date()) {
          return NextResponse.json(
            { error: 'Kode OTP sudah kadaluarsa. Silakan minta kode baru.' },
            { status: 400 }
          )
        }
      }

      return NextResponse.json(
        { error: 'Kode OTP tidak valid. Silakan periksa dan coba lagi.' },
        { status: 400 }
      )
    }

    // Mark OTP as verified
    await db.oTP.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    })

    // For registration, also mark email as verified on the user (if user already exists somehow)
    if (type === 'register') {
      const user = await db.user.findUnique({ where: { email } })
      if (user) {
        await db.user.update({
          where: { id: user.id },
          data: { emailVerified: true },
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'OTP berhasil diverifikasi',
    })
  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { error: 'Gagal memverifikasi OTP. Silakan coba lagi.' },
      { status: 500 }
    )
  }
}
