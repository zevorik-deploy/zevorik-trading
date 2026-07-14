import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code, type } = body

    if (!email || !code || !type) {
      return NextResponse.json(
        { error: 'Email, code, and type are required' },
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
      return NextResponse.json(
        { error: 'Kode OTP tidak valid atau sudah kadaluarsa' },
        { status: 400 }
      )
    }

    // Mark OTP as verified
    await db.oTP.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    })

    // For registration, also mark email as verified on the user
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
      { error: 'Gagal memverifikasi OTP' },
      { status: 500 }
    )
  }
}
