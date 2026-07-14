import { NextResponse } from 'next/server'

/**
 * Get current deposit info (USDT based)
 */
export async function GET() {
  try {
    return NextResponse.json({
      coin: 'USDT',
      minDeposit: 100,
      networks: [
        { key: 'TRC20', name: 'TRC20', fee: '~1 USDT', speed: '~3 min', recommended: true },
        { key: 'BEP20', name: 'BEP20', fee: '~0.5 USDT', speed: '~5 min', recommended: false },
        { key: 'ERC20', name: 'ERC20', fee: '~5 USDT', speed: '~15 min', recommended: false },
      ],
    })
  } catch (error) {
    console.error('Rate fetch error:', error)
    return NextResponse.json({ error: 'Gagal mengambil info deposit' }, { status: 500 })
  }
}
