import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function POST() {
  try {
    const existingAdmin = await db.user.findUnique({
      where: { phone: '080000000000' },
    })

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Admin user already exists', user: { id: existingAdmin.id, name: existingAdmin.name, phone: existingAdmin.phone, role: existingAdmin.role } },
        { status: 409 }
      )
    }

    const hashedPassword = await hashPassword('admin123')
    const referralCode = 'ADMIN-' + Date.now()

    const admin = await db.user.create({
      data: {
        phone: '080000000000',
        name: 'Admin ZEVORIX',
        password: hashedPassword,
        role: 'admin',
        referralCode,
        kycStatus: 'verified',
        vipLevel: 'Diamond',
      },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        kycStatus: true,
        vipLevel: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ message: 'Admin user created successfully', user: admin }, { status: 201 })
  } catch (error) {
    console.error('Seed admin error:', error)
    return NextResponse.json({ error: 'Failed to create admin user' }, { status: 500 })
  }
}
