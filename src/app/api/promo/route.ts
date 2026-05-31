import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Auto-seed if no promos exist
    const promoCount = await db.promo.count()
    if (promoCount === 0) {
      await seedPromos()
    }

    const promos = await db.promo.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ promos })
  } catch (error) {
    console.error('Get promos error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch promos' },
      { status: 500 }
    )
  }
}

async function seedPromos() {
  const promoData = [
    {
      title: 'Bonus Selamat Datang',
      description: 'Dapatkan bonus Rp 25.000 untuk member baru yang mendaftar di TrendEdge. Bonus langsung dikreditkan ke saldo akun Anda setelah registrasi berhasil.',
      type: 'welcome_bonus',
      value: 25000,
      isActive: true,
    },
    {
      title: 'Bonus Deposit 5%',
      description: 'Nikmati bonus 5% untuk setiap deposit minimal Rp 1.000.000. Maksimal bonus Rp 500.000 per deposit. Bonus otomatis dikreditkan ke saldo Anda.',
      type: 'deposit_bonus',
      value: 5,
      isActive: true,
    },
    {
      title: 'Program Referral',
      description: 'Ajak teman bergabung dan dapatkan bonus Rp 50.000 untuk setiap teman yang mendaftar menggunakan kode referral Anda. Teman juga mendapat bonus yang sama!',
      type: 'referral_program',
      value: 50000,
      isActive: true,
    },
    {
      title: 'Kompetisi Trading Bulanan',
      description: 'Ikuti kompetisi trading bulanan dan menangkan hadiah total Rp 10.000.000! 10 trader dengan profit tertinggi akan mendapat hadiah. Periode: 1-30 setiap bulan.',
      type: 'trading_competition',
      value: 10000000,
      isActive: true,
    },
    {
      title: 'Bonus Trading 0.1%',
      description: 'Dapatkan bonus 0.1% dari total volume trading Anda. Bonus bisa di-claim setiap hari melalui halaman Bonus. Semakin banyak trading, semakin besar bonus!',
      type: 'trading_bonus',
      value: 0.1,
      isActive: true,
    },
    {
      title: 'Daily Check-in Bonus',
      description: 'Lakukan check-in setiap hari dan dapatkan bonus Rp 10.000 - Rp 50.000 secara acak. Pertahankan streak untuk bonus yang lebih besar!',
      type: 'daily_checkin',
      value: 10000,
      isActive: true,
    },
  ]

  for (const promo of promoData) {
    await db.promo.create({ data: promo })
  }
}
