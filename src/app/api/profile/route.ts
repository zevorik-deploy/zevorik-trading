import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, verifyPassword } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        avatar: true,
        role: true,
        balance: true,
        kycStatus: true,
        emailVerified: true,
        totalDeposit: true,
        totalTrading: true,
        bankName: true,
        bankAccount: true,
        bankHolder: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, email, bankName, bankAccount, bankHolder, avatar } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (bankName !== undefined) updateData.bankName = bankName
    if (bankAccount !== undefined) updateData.bankAccount = bankAccount
    if (bankHolder !== undefined) updateData.bankHolder = bankHolder
    if (avatar !== undefined) updateData.avatar = avatar

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        avatar: true,
        role: true,
        balance: true,
        kycStatus: true,
        emailVerified: true,
        totalDeposit: true,
        totalTrading: true,
        bankName: true,
        bankAccount: true,
        bankHolder: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, action, currentPassword, newPassword } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    if (action === 'change_password') {
      if (!currentPassword || !newPassword) {
        return NextResponse.json(
          { error: 'currentPassword and newPassword are required' },
          { status: 400 }
        )
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'New password must be at least 6 characters' },
          { status: 400 }
        )
      }

      const user = await db.user.findUnique({ where: { id: userId } })
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      const isValid = await verifyPassword(currentPassword, user.password)
      if (!isValid) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 401 }
        )
      }

      const hashedPassword = await hashPassword(newPassword)
      await db.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      })

      await db.notification.create({
        data: {
          userId,
          title: 'Password Diubah',
          message: 'Password akun Anda telah berhasil diubah.',
          type: 'alert',
        },
      })

      return NextResponse.json({ message: 'Password changed successfully' })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use: change_password' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Profile action error:', error)
    return NextResponse.json(
      { error: 'Failed to process profile action' },
      { status: 500 }
    )
  }
}
