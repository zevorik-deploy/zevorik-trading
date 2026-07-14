import { NextRequest, NextResponse } from 'next/server'

// Contracts API stub - feature coming soon
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Fitur kontrak sedang dalam pengembangan' },
    { status: 501 }
  )
}

export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { error: 'Fitur kontrak sedang dalam pengembangan' },
    { status: 501 }
  )
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ contracts: [], summary: { totalInvested: 0, totalProfit: 0, activeCount: 0 } })
}
