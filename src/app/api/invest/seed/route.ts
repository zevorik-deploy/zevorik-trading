import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
    const products = [
      // Saham Potential (9 tiers) — max 7% daily
      { name: 'Potential I', category: 'potential', modal: 50000, dailyProfit: 3500, totalReturn: 190000, duration: 40, roi: 280, order: 1 },
      { name: 'Potential II', category: 'potential', modal: 150000, dailyProfit: 10500, totalReturn: 570000, duration: 40, roi: 280, order: 2 },
      { name: 'Potential III', category: 'potential', modal: 400000, dailyProfit: 28000, totalReturn: 1520000, duration: 40, roi: 280, order: 3 },
      { name: 'Potential IV', category: 'potential', modal: 1000000, dailyProfit: 70000, totalReturn: 3800000, duration: 40, roi: 280, order: 4 },
      { name: 'Potential V', category: 'potential', modal: 2500000, dailyProfit: 175000, totalReturn: 9500000, duration: 40, roi: 280, order: 5 },
      { name: 'Potential VI', category: 'potential', modal: 5000000, dailyProfit: 350000, totalReturn: 19000000, duration: 40, roi: 280, order: 6 },
      { name: 'Potential VII', category: 'potential', modal: 12500000, dailyProfit: 875000, totalReturn: 47500000, duration: 40, roi: 280, order: 7 },
      { name: 'Potential VIII', category: 'potential', modal: 30000000, dailyProfit: 2100000, totalReturn: 114000000, duration: 40, roi: 280, order: 8 },
      { name: 'Potential Extra', category: 'potential', modal: 50000000, dailyProfit: 3500000, totalReturn: 350000000, duration: 100, roi: 600, order: 9 },
      // Saham Dividen (8 tiers) — max 7% daily
      { name: 'Dividen I', category: 'dividen', modal: 30000, dailyProfit: 2100, totalReturn: 32100, duration: 1, roi: 7, order: 10 },
      { name: 'Dividen II', category: 'dividen', modal: 250000, dailyProfit: 17500, totalReturn: 302500, duration: 3, roi: 21, order: 11 },
      { name: 'Dividen III', category: 'dividen', modal: 500000, dailyProfit: 35000, totalReturn: 605000, duration: 3, roi: 21, order: 12 },
      { name: 'Dividen IV', category: 'dividen', modal: 1000000, dailyProfit: 70000, totalReturn: 1210000, duration: 3, roi: 21, order: 13 },
      { name: 'Dividen V', category: 'dividen', modal: 2000000, dailyProfit: 140000, totalReturn: 2420000, duration: 3, roi: 21, order: 14 },
      { name: 'Dividen VI', category: 'dividen', modal: 5000000, dailyProfit: 350000, totalReturn: 6050000, duration: 3, roi: 21, order: 15 },
      { name: 'Dividen VII', category: 'dividen', modal: 10000000, dailyProfit: 700000, totalReturn: 12100000, duration: 3, roi: 21, order: 16 },
      { name: 'Dividen VIII', category: 'dividen', modal: 30000000, dailyProfit: 2100000, totalReturn: 36300000, duration: 3, roi: 21, order: 17 },
    ]

    // Check if products already exist
    const existing = await db.investmentProduct.count()
    if (existing > 0) {
      return NextResponse.json({ message: 'Products already seeded', count: existing })
    }

    const created = await db.investmentProduct.createMany({ data: products })

    return NextResponse.json({ message: 'Products seeded successfully', count: created.count })
  } catch (error) {
    console.error('Seed investment products error:', error)
    return NextResponse.json({ error: 'Failed to seed products' }, { status: 500 })
  }
}
