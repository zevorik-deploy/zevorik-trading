import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get KYC status
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
        kycStatus: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const kycRecord = await db.kYC.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      kycStatus: user.kycStatus,
      kycRecord,
    })
  } catch (error) {
    console.error('Get KYC error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch KYC status' },
      { status: 500 }
    )
  }
}

// POST - Submit KYC (auto-approve for demo)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, fullName, idNumber, address, occupation, incomeRange } = body

    if (!userId || !fullName || !idNumber || !address || !occupation || !incomeRange) {
      return NextResponse.json(
        { error: 'userId, fullName, idNumber, address, occupation, and incomeRange are required' },
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

    if (user.kycStatus === 'verified') {
      return NextResponse.json(
        { error: 'KYC already verified' },
        { status: 400 }
      )
    }

    // Auto-approve for demo - create KYC record and update user
    const kycRecord = await db.kYC.create({
      data: {
        userId,
        fullName,
        idNumber,
        address,
        occupation,
        incomeRange,
        status: 'verified',
      },
    })

    await db.user.update({
      where: { id: userId },
      data: { kycStatus: 'verified' },
    })

    await db.notification.create({
      data: {
        userId,
        title: 'KYC Terverifikasi ✅',
        message: 'Verifikasi identitas Anda telah berhasil. Akun Anda sekarang telah terverifikasi penuh.',
        type: 'system',
      },
    })

    return NextResponse.json({
      kycRecord,
      kycStatus: 'verified',
      message: 'KYC submitted and auto-approved for demo',
    }, { status: 201 })
  } catch (error) {
    console.error('Submit KYC error:', error)
    return NextResponse.json(
      { error: 'Failed to submit KYC' },
      { status: 500 }
    )
  }
}
