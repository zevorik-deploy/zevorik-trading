import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'all'

    // Try to get users with portfolios, but use a lighter query
    let portfolioData: Array<{
      userId: string;
      userName: string;
      userAvatar: string | null;
      userVipLevel: string;
      totalProfit: number;
      profitPercent: number;
    }> = []

    try {
      // Get portfolios with stock data
      const portfolios = await db.portfolio.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              vipLevel: true,
            },
          },
          stock: {
            select: {
              id: true,
              price: true,
            },
          },
        },
      })

      // Group by user and calculate profit
      const userStats: Record<string, {
        userId: string;
        userName: string;
        userAvatar: string | null;
        userVipLevel: string;
        totalInvested: number;
        totalCurrentValue: number;
      }> = {}

      for (const p of portfolios) {
        if (!userStats[p.userId]) {
          userStats[p.userId] = {
            userId: p.userId,
            userName: p.user.name,
            userAvatar: p.user.avatar,
            userVipLevel: p.user.vipLevel,
            totalInvested: 0,
            totalCurrentValue: 0,
          }
        }
        const invested = p.shares * p.avgPrice
        const current = p.shares * p.stock.price
        userStats[p.userId].totalInvested += invested
        userStats[p.userId].totalCurrentValue += current
      }

      portfolioData = Object.values(userStats)
        .map(u => ({
          userId: u.userId,
          userName: u.userName,
          userAvatar: u.userAvatar,
          userVipLevel: u.userVipLevel,
          totalProfit: u.totalCurrentValue - u.totalInvested,
          profitPercent: u.totalInvested > 0
            ? Math.round(((u.totalCurrentValue - u.totalInvested) / u.totalInvested) * 100 * 100) / 100
            : 0,
        }))
        .sort((a, b) => b.totalProfit - a.totalProfit)
        .slice(0, 20)
    } catch {
      // If portfolio query fails, just use demo data
    }

    // Always include demo leaderboard entries
    const demoEntries = [
      { name: 'Rizky Pratama', totalProfit: 45200000, profitPercent: 23.5, vipLevel: 'Gold', avatar: null },
      { name: 'Siti Rahayu', totalProfit: 38700000, profitPercent: 19.2, vipLevel: 'Platinum', avatar: null },
      { name: 'Budi Santoso', totalProfit: 32100000, profitPercent: 16.8, vipLevel: 'Gold', avatar: null },
      { name: 'Dewi Lestari', totalProfit: 28500000, profitPercent: 15.3, vipLevel: 'Silver', avatar: null },
      { name: 'Andi Wijaya', totalProfit: 24300000, profitPercent: 12.7, vipLevel: 'Gold', avatar: null },
      { name: 'Maya Putri', totalProfit: 21800000, profitPercent: 11.4, vipLevel: 'Silver', avatar: null },
      { name: 'Rudi Hartono', totalProfit: 19200000, profitPercent: 10.1, vipLevel: 'Platinum', avatar: null },
      { name: 'Lina Susanti', totalProfit: 16500000, profitPercent: 8.7, vipLevel: 'Gold', avatar: null },
      { name: 'Hendra Gunawan', totalProfit: 14800000, profitPercent: 7.8, vipLevel: 'Silver', avatar: null },
      { name: 'Fitriani', totalProfit: 12300000, profitPercent: 6.5, vipLevel: 'Bronze', avatar: null },
      { name: 'Agus Setiawan', totalProfit: 10800000, profitPercent: 5.7, vipLevel: 'Silver', avatar: null },
      { name: 'Nurul Hidayah', totalProfit: 9500000, profitPercent: 5.0, vipLevel: 'Gold', avatar: null },
      { name: 'Doni Prasetyo', totalProfit: 8200000, profitPercent: 4.3, vipLevel: 'Bronze', avatar: null },
      { name: 'Rina Wulandari', totalProfit: 7100000, profitPercent: 3.7, vipLevel: 'Silver', avatar: null },
      { name: 'Joko Susilo', totalProfit: 6500000, profitPercent: 3.4, vipLevel: 'Bronze', avatar: null },
      { name: 'Ani Sulistyo', totalProfit: 5800000, profitPercent: 3.1, vipLevel: 'Bronze', avatar: null },
      { name: 'Bambang Suryadi', totalProfit: 4200000, profitPercent: 2.2, vipLevel: 'Bronze', avatar: null },
      { name: 'Yuni Astuti', totalProfit: 3500000, profitPercent: 1.8, vipLevel: 'Bronze', avatar: null },
      { name: 'Tono Sugiarto', totalProfit: 2800000, profitPercent: 1.5, vipLevel: 'Bronze', avatar: null },
      { name: 'Wati Rahmawati', totalProfit: 1500000, profitPercent: 0.8, vipLevel: 'Bronze', avatar: null },
    ]

    // Merge real user data with demo entries
    const leaderboard = demoEntries.map((entry, index) => ({
      rank: index + 1,
      userId: `demo_${index + 1}`,
      name: entry.name,
      avatar: entry.avatar,
      vipLevel: entry.vipLevel,
      totalProfit: entry.totalProfit,
      profitPercent: entry.profitPercent,
    }))

    // Insert real users with profit into leaderboard
    for (const user of portfolioData) {
      if (user.totalProfit > 0) {
        const insertIndex = leaderboard.findIndex(d => d.totalProfit < user.totalProfit)
        const entry = {
          rank: insertIndex !== -1 ? insertIndex + 1 : leaderboard.length + 1,
          userId: user.userId,
          name: user.userName,
          avatar: user.userAvatar,
          vipLevel: user.userVipLevel,
          totalProfit: user.totalProfit,
          profitPercent: user.profitPercent,
        }
        if (insertIndex !== -1) {
          leaderboard.splice(insertIndex, 0, entry)
          if (leaderboard.length > 20) leaderboard.pop()
        }
      }
    }

    // Recalculate ranks
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1
    })

    return NextResponse.json({
      leaderboard,
      period,
    })
  } catch (error) {
    console.error('Get leaderboard error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}
