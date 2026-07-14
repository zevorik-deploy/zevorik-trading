import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email: rawEmail, phone, password, pin, otpVerified } = body

    // Normalize email to lowercase immediately
    const email = (rawEmail || '').trim().toLowerCase()

    // Validate all required fields
    if (!name || !email || !phone || !password || !pin) {
      return NextResponse.json(
        { error: 'Nama, email, nomor HP, kata sandi, dan PIN wajib diisi' },
        { status: 400 }
      )
    }

    // Validate name length
    if (name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Nama minimal 2 karakter' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Format email tidak valid' },
        { status: 400 }
      )
    }

    // Validate phone format (Indonesian phone numbers)
    const cleanPhone = phone.replace(/[\s\-\+\(\)]/g, '')
    if (!/^(\+?62|0)?8\d{8,12}$/.test(cleanPhone)) {
      return NextResponse.json(
        { error: 'Nomor WhatsApp tidak valid. Gunakan format: 81234567890' },
        { status: 400 }
      )
    }

    // Normalize phone number (remove leading 0 or +62, add 0 prefix)
    let normalizedPhone = cleanPhone
    if (normalizedPhone.startsWith('+62')) {
      normalizedPhone = '0' + normalizedPhone.slice(3)
    } else if (normalizedPhone.startsWith('62')) {
      normalizedPhone = '0' + normalizedPhone.slice(2)
    } else if (!normalizedPhone.startsWith('0')) {
      normalizedPhone = '0' + normalizedPhone
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Kata sandi minimal 6 karakter' },
        { status: 400 }
      )
    }

    // Validate PIN is 6 digits
    if (!/^\d{6}$/.test(pin)) {
      return NextResponse.json(
        { error: 'PIN harus tepat 6 digit angka' },
        { status: 400 }
      )
    }

    // Validate OTP was verified on frontend
    if (!otpVerified) {
      return NextResponse.json(
        { error: 'Email belum diverifikasi. Silakan verifikasi OTP terlebih dahulu.' },
        { status: 400 }
      )
    }

    // Double check that OTP was actually verified in our database
    const verifiedOTP = await db.oTP.findFirst({
      where: {
        email,
        type: 'register',
        verified: true,
        expiresAt: { gt: new Date(Date.now() - 15 * 60 * 1000) }, // within 15 minutes
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!verifiedOTP) {
      return NextResponse.json(
        { error: 'Verifikasi OTP tidak valid atau sudah kadaluarsa. Silakan mulai dari awal.' },
        { status: 400 }
      )
    }

    // Check email uniqueness
    const existingEmail = await db.user.findUnique({ where: { email } })
    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar. Silakan login.' },
        { status: 409 }
      )
    }

    // Check phone uniqueness (with normalized phone)
    const existingPhone = await db.user.findUnique({ where: { phone: normalizedPhone } })
    if (existingPhone) {
      return NextResponse.json(
        { error: 'Nomor WhatsApp sudah terdaftar. Silakan gunakan nomor lain.' },
        { status: 409 }
      )
    }

    // Hash password and pin
    const hashedPassword = await hashPassword(password)
    const hashedPin = await hashPassword(pin)

    // Create user with emailVerified = true since OTP was verified
    const user = await db.user.create({
      data: {
        name: name.trim(),
        phone: normalizedPhone,
        email: email,
        password: hashedPassword,
        pin: hashedPin,
        balance: 0,
        role: 'investor',
        kycStatus: 'pending',
        emailVerified: true,
      },
    })

    // Welcome notification
    await db.notification.create({
      data: {
        userId: user.id,
        title: 'Selamat Datang! 🎉',
        message: `Selamat datang di ZEVORIK, ${user.name}! Mulai investasi Anda dengan deposit. Lengkapi KYC untuk akses penuh!`,
        type: 'system',
      },
    })

    // Delete used OTP records
    await db.oTP.deleteMany({
      where: { email, type: 'register' },
    })

    const token = await generateToken({ userId: user.id, phone: user.phone })

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        balance: user.balance,
        role: user.role,
        kycStatus: user.kycStatus,
        emailVerified: user.emailVerified,
        totalDeposit: user.totalDeposit,
        totalTrading: user.totalTrading,
        bankName: user.bankName,
        bankAccount: user.bankAccount,
        bankHolder: user.bankHolder,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
      token,
    }, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    // Provide more specific error for known issues
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'Email atau nomor WhatsApp sudah terdaftar.' },
          { status: 409 }
        )
      }
    }
    return NextResponse.json(
      { error: 'Gagal mendaftar. Silakan coba lagi.' },
      { status: 500 }
    )
  }
}
