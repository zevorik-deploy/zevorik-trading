import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const setting = await db.adminSetting.findUnique({ where: { key: 'qris_image' } })
    const url = setting?.value || null
    return NextResponse.json({ url })
  } catch (error) {
    console.error('QRIS fetch error:', error)
    return NextResponse.json({ url: null })
  }
}
