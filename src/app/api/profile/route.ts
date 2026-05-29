import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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
        referralCode: true,
        referredBy: true,
        kycStatus: true,
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
    const { userId, name, email, bankName, bankAccount, bankHolder } = body

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

    const updateData: {
      name?: string
      email?: string
      bankName?: string
      bankAccount?: string
      bankHolder?: string
    } = {}

    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (bankName !== undefined) updateData.bankName = bankName
    if (bankAccount !== undefined) updateData.bankAccount = bankAccount
    if (bankHolder !== undefined) updateData.bankHolder = bankHolder

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
        referralCode: true,
        kycStatus: true,
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
