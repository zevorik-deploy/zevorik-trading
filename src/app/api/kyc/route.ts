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

    // Calculate withdrawal limits based on KYC status
    const isVerified = user.kycStatus === 'verified'
    const minWithdraw = isVerified ? 50000 : 250000
    const adminFeePercent = 10

    return NextResponse.json({
      kycStatus: user.kycStatus,
      kycRecord,
      withdrawalInfo: {
        minWithdraw,
        adminFeePercent,
        isVerified,
      },
    })
  } catch (error) {
    console.error('Get KYC error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch KYC status' },
      { status: 500 }
    )
  }
}

// POST - Submit KYC (pending, admin must approve)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, fullName, idNumber, address, occupation, incomeRange, ktpImage, selfieImage, bankStatement, additionalDoc } = body

    if (!userId || !fullName || !idNumber || !address || !occupation || !incomeRange) {
      return NextResponse.json(
        { error: 'Semua field wajib diisi' },
        { status: 400 }
      )
    }

    if (!ktpImage) {
      return NextResponse.json(
        { error: 'Foto KTP wajib diupload' },
        { status: 400 }
      )
    }

    if (!selfieImage) {
      return NextResponse.json(
        { error: 'Foto selfie dengan KTP wajib diupload' },
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
        { error: 'KYC sudah terverifikasi' },
        { status: 400 }
      )
    }

    // Check if there's already a pending KYC
    const existingPending = await db.kYC.findFirst({
      where: { userId, status: 'pending' },
    })
    if (existingPending) {
      return NextResponse.json(
        { error: 'Anda sudah memiliki pengajuan KYC yang sedang diproses' },
        { status: 400 }
      )
    }

    // Create KYC record as pending - admin must approve
    const kycRecord = await db.kYC.create({
      data: {
        userId,
        fullName,
        idNumber,
        address,
        occupation,
        incomeRange,
        ktpImage,
        selfieImage,
        bankStatement: bankStatement || null,
        additionalDoc: additionalDoc || null,
        status: 'pending',
      },
    })

    // Update user KYC status to pending (was not verified)
    await db.user.update({
      where: { id: userId },
      data: { kycStatus: 'pending' },
    })

    await db.notification.create({
      data: {
        userId,
        title: 'KYC Diajukan 📋',
        message: 'Pengajuan verifikasi identitas Anda telah dikirim. Proses verifikasi membutuhkan 1-3 hari kerja. Keuntungan KYC: minimum withdrawal hanya Rp 50.000!',
        type: 'system',
      },
    })

    return NextResponse.json({
      kycRecord,
      kycStatus: 'pending',
      message: 'KYC berhasil diajukan. Tunggu verifikasi admin 1-3 hari kerja.',
    }, { status: 201 })
  } catch (error) {
    console.error('Submit KYC error:', error)
    return NextResponse.json(
      { error: 'Failed to submit KYC' },
      { status: 500 }
    )
  }
}
