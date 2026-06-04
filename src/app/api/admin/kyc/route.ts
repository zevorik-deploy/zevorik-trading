import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

async function verifyAdmin(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } })
  return user?.role === 'admin'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId || !(await verifyAdmin(userId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const kycRecords = await db.kYC.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, phone: true, email: true, kycStatus: true } }
      }
    })

    return NextResponse.json({ kycRecords })
  } catch (error) {
    console.error('Admin KYC error:', error)
    return NextResponse.json({ error: 'Failed to fetch KYC records' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { adminId, kycId, status, rejectReason } = body

    if (!adminId || !(await verifyAdmin(adminId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (!kycId || !status) {
      return NextResponse.json({ error: 'KYC ID and status required' }, { status: 400 })
    }

    if (!['verified', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Status must be verified or rejected' }, { status: 400 })
    }

    if (status === 'rejected' && !rejectReason) {
      return NextResponse.json({ error: 'Alasan penolakan wajib diisi' }, { status: 400 })
    }

    // Update KYC record
    const kyc = await db.kYC.update({
      where: { id: kycId },
      data: {
        status,
        rejectReason: status === 'rejected' ? rejectReason : null,
        reviewedAt: new Date(),
      }
    })

    // Also update user's kycStatus
    await db.user.update({
      where: { id: kyc.userId },
      data: { kycStatus: status }
    })

    // Send notification to user
    if (status === 'verified') {
      await db.notification.create({
        data: {
          userId: kyc.userId,
          title: 'KYC Terverifikasi ✅',
          message: 'Selamat! Verifikasi identitas Anda telah disetujui. Minimum penarikan Anda sekarang hanya Rp 50.000!',
          type: 'system',
        },
      })
    } else {
      await db.notification.create({
        data: {
          userId: kyc.userId,
          title: 'KYC Ditolak ❌',
          message: `Verifikasi identitas Anda ditolak. Alasan: ${rejectReason}. Silakan ajukan ulang dengan data yang benar.`,
          type: 'alert',
        },
      })
    }

    return NextResponse.json({ kyc })
  } catch (error) {
    console.error('Admin KYC update error:', error)
    return NextResponse.json({ error: 'Failed to update KYC' }, { status: 500 })
  }
}
