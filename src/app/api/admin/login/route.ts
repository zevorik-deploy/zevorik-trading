import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, password } = body

    if (!phone || !password) {
      return NextResponse.json({ error: 'Phone and password are required' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { phone } })

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 })
    }

    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 })
    }

    const token = await generateToken({ userId: user.id, phone: user.phone })

    return NextResponse.json({
      admin: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
      token,
    })
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json({ error: 'Failed to login' }, { status: 500 })
  }
}
