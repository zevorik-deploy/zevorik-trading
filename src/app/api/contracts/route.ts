import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/contracts?userId=xxx - Get user's stock contracts
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId wajib diisi' }, { status: 400 })
    }

    const contracts = await db.stockContract.findMany({
      where: { userId },
      include: { stock: true },
      orderBy: { createdAt: 'desc' },
    })

    const activeContracts = contracts.filter(c => c.status === 'active')
    const completedContracts = contracts.filter(c => c.status === 'completed')

    const totalInvested = activeContracts.reduce((sum, c) => sum + c.amount, 0)
    const totalProfitClaimed = contracts.reduce((sum, c) => sum + c.totalClaimed, 0)
    const totalExpectedProfit = activeContracts.reduce((sum, c) => sum + c.totalProfit, 0)

    return NextResponse.json({
      contracts,
      activeContracts,
      completedContracts,
      summary: {
        totalInvested,
        totalProfitClaimed,
        totalExpectedProfit,
        activeCount: activeContracts.length,
        completedCount: completedContracts.length,
      },
    })
  } catch (error) {
    console.error('Get contracts error:', error)
    return NextResponse.json({ error: 'Gagal mengambil data kontrak' }, { status: 500 })
  }
}

// POST /api/contracts - Create a new stock contract
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, stockId, amount, duration, dailyProfitRate, dailyProfitAmount, totalProfit, totalReturn } = body

    if (!userId || !stockId || !amount || !duration) {
      return NextResponse.json({ error: 'userId, stockId, amount, dan duration wajib diisi' }, { status: 400 })
    }

    if (duration < 30) {
      return NextResponse.json({ error: 'Durasi kontrak minimal 30 hari' }, { status: 400 })
    }

    if (amount < 100000) {
      return NextResponse.json({ error: 'Minimal investasi Rp 100.000' }, { status: 400 })
    }

    // Get stock
    const stock = await db.stock.findUnique({ where: { id: stockId } })
    if (!stock) {
      return NextResponse.json({ error: 'Saham tidak ditemukan' }, { status: 404 })
    }

    // Get user
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    // Check balance
    if (user.balance < amount) {
      return NextResponse.json({ error: 'Saldo tidak mencukupi' }, { status: 400 })
    }

    // Create contract and deduct balance in a transaction
    const contract = await db.$transaction(async (tx) => {
      // Deduct user balance
      await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: amount } },
      })

      // Create contract
      const c = await tx.stockContract.create({
        data: {
          userId,
          stockId,
          stockCode: stock.code,
          stockName: stock.name,
          amount,
          dailyProfitRate: dailyProfitRate || 5.0,
          dailyProfitAmount: dailyProfitAmount || Math.round(amount * 0.05),
          totalProfit: totalProfit || Math.round(amount * 0.05 * duration),
          totalReturn: totalReturn || amount + Math.round(amount * 0.05 * duration),
          duration,
          status: 'active',
        },
      })

      // Create notification
      await tx.notification.create({
        data: {
          userId,
          title: 'Kontrak Saham Berhasil',
          message: `Anda berhasil membeli kontrak ${stock.code} (${stock.name}) senilai Rp ${amount.toLocaleString('id-ID')} selama ${duration} hari. Profit harian: Rp ${dailyProfitAmount?.toLocaleString('id-ID') || Math.round(amount * 0.05).toLocaleString('id-ID')}`,
          type: 'trade',
        },
      })

      return c
    })

    return NextResponse.json({ contract, newBalance: user.balance - amount })
  } catch (error) {
    console.error('Create contract error:', error)
    return NextResponse.json({ error: 'Gagal membuat kontrak' }, { status: 500 })
  }
}

// PUT /api/contracts - Claim daily profit or update contract
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { contractId, action } = body

    if (!contractId || !action) {
      return NextResponse.json({ error: 'contractId dan action wajib diisi' }, { status: 400 })
    }

    const contract = await db.stockContract.findUnique({ where: { id: contractId } })
    if (!contract) {
      return NextResponse.json({ error: 'Kontrak tidak ditemukan' }, { status: 404 })
    }

    if (action === 'claim') {
      if (contract.status !== 'active') {
        return NextResponse.json({ error: 'Kontrak tidak aktif' }, { status: 400 })
      }

      // Check if already claimed today (based on 00:00 WIB)
      const now = new Date()
      const jakartaOffset = 7 * 60 * 60 * 1000
      const jakartaNow = new Date(now.getTime() + jakartaOffset)
      const todayJakartaStr = `${jakartaNow.getFullYear()}-${jakartaNow.getMonth()}-${jakartaNow.getDate()}`

      if (contract.lastClaimAt) {
        const lastClaimJakarta = new Date(contract.lastClaimAt.getTime() + jakartaOffset)
        const lastClaimStr = `${lastClaimJakarta.getFullYear()}-${lastClaimJakarta.getMonth()}-${lastClaimJakarta.getDate()}`
        if (lastClaimStr === todayJakartaStr) {
          return NextResponse.json({ error: 'Sudah klaim profit hari ini. Kembali jam 00:00 WIB' }, { status: 400 })
        }
      }

      // Increment days elapsed
      const newDaysElapsed = contract.daysElapsed + 1
      const newTotalClaimed = contract.totalClaimed + contract.dailyProfitAmount
      const isCompleted = newDaysElapsed >= contract.duration

      const result = await db.$transaction(async (tx) => {
        // Add profit to user balance
        await tx.user.update({
          where: { id: contract.userId },
          data: { balance: { increment: contract.dailyProfitAmount } },
        })

        // Update contract
        const updated = await tx.stockContract.update({
          where: { id: contractId },
          data: {
            daysElapsed: newDaysElapsed,
            totalClaimed: newTotalClaimed,
            lastClaimAt: now,
            status: isCompleted ? 'completed' : 'active',
          },
        })

        // Create notification
        await tx.notification.create({
          data: {
            userId: contract.userId,
            title: isCompleted ? 'Kontrak Selesai!' : 'Profit Harian Diterima',
            message: isCompleted
              ? `Kontrak ${contract.stockCode} telah selesai! Total profit: Rp ${newTotalClaimed.toLocaleString('id-ID')}`
              : `Profit harian Rp ${contract.dailyProfitAmount.toLocaleString('id-ID')} dari kontrak ${contract.stockCode} telah ditambahkan ke saldo. Hari ${newDaysElapsed}/${contract.duration}`,
            type: 'trade',
          },
        })

        return updated
      })

      return NextResponse.json({ contract: result, claimedAmount: contract.dailyProfitAmount, isCompleted })
    }

    return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 })
  } catch (error) {
    console.error('Update contract error:', error)
    return NextResponse.json({ error: 'Gagal update kontrak' }, { status: 500 })
  }
}
