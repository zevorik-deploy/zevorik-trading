import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, newPassword } = body

    if (!phone || !newPassword) {
      return NextResponse.json(
        { error: 'Phone and newPassword are required' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { phone },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Phone number not registered' },
        { status: 404 }
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
