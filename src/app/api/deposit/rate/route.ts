import { NextResponse } from 'next/server'
import { getIdrToUsdtRate } from '@/lib/binance'

/**
 * Get current USDT/IDR exchange rate for deposit conversion
 */
export async function GET() {
  try {
    const rate = await getIdrToUsdtRate()
    return NextResponse.json({
      rate,
      coin: 'USDT',
      pair: 'USDT/IDR',
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Rate fetch error:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil rate', rate: 16000 },
      { status: 500 }
    )
  }
}
