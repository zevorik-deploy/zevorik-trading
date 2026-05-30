import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
    const products = [
      // Saham Potential (9 tiers)
      { name: 'Potential I', category: 'potential', modal: 50000, dailyProfit: 17500, totalReturn: 700000, duration: 40, roi: 1400, order: 1 },
      { name: 'Potential II', category: 'potential', modal: 150000, dailyProfit: 55500, totalReturn: 2220000, duration: 40, roi: 1480, order: 2 },
      { name: 'Potential III', category: 'potential', modal: 400000, dailyProfit: 155000, totalReturn: 6200000, duration: 40, roi: 1550, order: 3 },
      { name: 'Potential IV', category: 'potential', modal: 1000000, dailyProfit: 395000, totalReturn: 15800000, duration: 40, roi: 1580, order: 4 },
      { name: 'Potential V', category: 'potential', modal: 2500000, dailyProfit: 1000000, totalReturn: 40000000, duration: 40, roi: 1600, order: 5 },
      { name: 'Potential VI', category: 'potential', modal: 5000000, dailyProfit: 2000000, totalReturn: 80000000, duration: 40, roi: 1600, order: 6 },
      { name: 'Potential VII', category: 'potential', modal: 12500000, dailyProfit: 5000000, totalReturn: 200000000, duration: 40, roi: 1600, order: 7 },
      { name: 'Potential VIII', category: 'potential', modal: 30000000, dailyProfit: 12000000, totalReturn: 480000000, duration: 40, roi: 1600, order: 8 },
      { name: 'Potential Extra', category: 'potential', modal: 50000000, dailyProfit: 2000000, totalReturn: 200000000, duration: 100, roi: 400, order: 9 },
      // Saham Dividen (8 tiers)
      { name: 'Dividen I', category: 'dividen', modal: 30000, dailyProfit: 45000, totalReturn: 45000, duration: 1, roi: 150, order: 10 },
      { name: 'Dividen II', category: 'dividen', modal: 250000, dailyProfit: 150000, totalReturn: 450000, duration: 3, roi: 180, order: 11 },
      { name: 'Dividen III', category: 'dividen', modal: 500000, dailyProfit: 335000, totalReturn: 1005000, duration: 3, roi: 201, order: 12 },
      { name: 'Dividen IV', category: 'dividen', modal: 1000000, dailyProfit: 700000, totalReturn: 2100000, duration: 3, roi: 210, order: 13 },
      { name: 'Dividen V', category: 'dividen', modal: 2000000, dailyProfit: 1400000, totalReturn: 4200000, duration: 3, roi: 210, order: 14 },
      { name: 'Dividen VI', category: 'dividen', modal: 5000000, dailyProfit: 3500000, totalReturn: 10500000, duration: 3, roi: 210, order: 15 },
      { name: 'Dividen VII', category: 'dividen', modal: 10000000, dailyProfit: 7000000, totalReturn: 21000000, duration: 3, roi: 210, order: 16 },
      { name: 'Dividen VIII', category: 'dividen', modal: 30000000, dailyProfit: 21000000, totalReturn: 63000000, duration: 3, roi: 210, order: 17 },
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
