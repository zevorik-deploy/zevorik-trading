import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Tier commission percentages
const TIER_COMMISSIONS: Record<number, number> = {
  1: 0.35, // 35% for direct referrals
  2: 0.05, // 5% for level 2
  3: 0.03, // 3% for level 3
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        referralCode: true,
        referredBy: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // --- Tier 1: Direct referrals ---
    const tier1Referrals = await db.referral.findMany({
      where: { referrerId: userId },
      include: {
        referred: {
          select: {
            id: true,
            name: true,
            phone: true,
            createdAt: true,
            totalDeposit: true,
            balance: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // --- Build tier data recursively ---
    // For each tier1 referral, find their referrals (tier2), and so on (tier3)

    // Tier 1 data
    const tier1MemberIds = tier1Referrals.map(r => r.referred.id)
    const tier1TotalDeposit = tier1Referrals.reduce((sum, r) => sum + (r.referred.totalDeposit || 0), 0)

    // Tier 2: referrals of tier1 members
    const tier2Referrals = await db.referral.findMany({
      where: { referrerId: { in: tier1MemberIds } },
      include: {
        referrer: { select: { id: true, name: true } },
        referred: {
          select: {
            id: true,
            name: true,
            phone: true,
            createdAt: true,
            totalDeposit: true,
            balance: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const tier2MemberIds = tier2Referrals.map(r => r.referred.id)
    const tier2TotalDeposit = tier2Referrals.reduce((sum, r) => sum + (r.referred.totalDeposit || 0), 0)

    // Tier 3: referrals of tier2 members
    const tier3Referrals = await db.referral.findMany({
      where: { referrerId: { in: tier2MemberIds } },
      include: {
        referrer: { select: { id: true, name: true } },
        referred: {
          select: {
            id: true,
            name: true,
            phone: true,
            createdAt: true,
            totalDeposit: true,
            balance: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const tier3TotalDeposit = tier3Referrals.reduce((sum, r) => sum + (r.referred.totalDeposit || 0), 0)

    // --- Calculate commissions from ReferralCommission table ---
    const commissions = await db.referralCommission.findMany({
      where: { referrerId: userId },
      include: {
        referred: {
          select: { id: true, name: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const totalCommission = commissions.reduce((sum, c) => sum + c.amount, 0)
    const pendingCommission = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0)
    const claimedCommission = commissions.filter(c => c.status === 'claimed').reduce((sum, c) => sum + c.amount, 0)

    // --- Per-tier commission ---
    const tier1Commission = commissions.filter(c => c.level === 1).reduce((sum, c) => sum + c.amount, 0)
    const tier2Commission = commissions.filter(c => c.level === 2).reduce((sum, c) => sum + c.amount, 0)
    const tier3Commission = commissions.filter(c => c.level === 3).reduce((sum, c) => sum + c.amount, 0)

    // --- Active/inactive counts per tier ---
    // A member is "active" if they've made a deposit
    const tier1Active = tier1Referrals.filter(r => (r.referred.totalDeposit || 0) > 0).length
    const tier1Inactive = tier1Referrals.length - tier1Active

    const tier2Active = tier2Referrals.filter(r => (r.referred.totalDeposit || 0) > 0).length
    const tier2Inactive = tier2Referrals.length - tier2Active

    const tier3Active = tier3Referrals.filter(r => (r.referred.totalDeposit || 0) > 0).length
    const tier3Inactive = tier3Referrals.length - tier3Active

    // --- Total members and total deposit ---
    const totalMembers = tier1MemberIds.length + tier2MemberIds.length + tier3Referrals.length
    const totalDeposit = tier1TotalDeposit + tier2TotalDeposit + tier3TotalDeposit

    // --- Also get the old-format data for backwards compat ---
    const totalBonus = tier1Referrals.reduce((sum, r) => sum + r.bonusAmount, 0)

    // --- Build history list (all commissions) ---
    const history = commissions.map(c => ({
      id: c.id,
      name: c.referred.name,
      date: c.createdAt,
      level: c.level,
      deposit: c.sourceAmount,
      commission: c.amount,
      status: c.status,
    }))

    // --- Build referred users list for backwards compat ---
    const referredUsers = tier1Referrals.map((r) => ({
      id: r.referred.id,
      name: r.referred.name,
      phone: r.referred.phone.slice(0, 6) + '****',
      bonusAmount: r.bonusAmount,
      status: r.status,
      joinedAt: r.referred.createdAt,
    }))

    return NextResponse.json({
      referralCode: user.referralCode,
      // New tier-based data
      totalMembers,
      totalDeposit,
      totalCommission,
      pendingCommission,
      claimedCommission,
      tiers: [
        {
          level: 1,
          commissionPercent: 35,
          members: tier1MemberIds.length,
          activeMembers: tier1Active,
          inactiveMembers: tier1Inactive,
          deposit: tier1TotalDeposit,
          commission: tier1Commission,
        },
        {
          level: 2,
          commissionPercent: 5,
          members: tier2MemberIds.length,
          activeMembers: tier2Active,
          inactiveMembers: tier2Inactive,
          deposit: tier2TotalDeposit,
          commission: tier2Commission,
        },
        {
          level: 3,
          commissionPercent: 3,
          members: tier3Referrals.length,
          activeMembers: tier3Active,
          inactiveMembers: tier3Inactive,
          deposit: tier3TotalDeposit,
          commission: tier3Commission,
        },
      ],
      history,
      // Backwards compat
      totalReferred: tier1MemberIds.length,
      totalBonus,
      referredUsers,
    })
  } catch (error) {
    console.error('Get referral info error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch referral info' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, code } = body

    if (!userId || !code) {
      return NextResponse.json(
        { error: 'userId and code are required' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.referredBy) {
      return NextResponse.json(
        { error: 'You have already used a referral code' },
        { status: 400 }
      )
    }

    const referrer = await db.user.findUnique({
      where: { referralCode: code },
    })

    if (!referrer) {
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 404 }
      )
    }

    if (referrer.id === userId) {
      return NextResponse.json(
        { error: 'You cannot use your own referral code' },
        { status: 400 }
      )
    }

    const bonusAmount = 50000

    // Update referred user
    await db.user.update({
      where: { id: userId },
      data: {
        referredBy: referrer.id,
        balance: user.balance + bonusAmount,
      },
    })

    // Update referrer
    await db.user.update({
      where: { id: referrer.id },
      data: { balance: { increment: bonusAmount } },
    })

    // Create referral record
    await db.referral.create({
      data: {
        referrerId: referrer.id,
        referredId: userId,
        bonusAmount,
        status: 'completed',
      },
    })

    // Create tier 1 commission for the referrer
    await db.referralCommission.create({
      data: {
        referrerId: referrer.id,
        referredId: userId,
        level: 1,
        amount: Math.floor(bonusAmount * TIER_COMMISSIONS[1]),
        sourceAmount: bonusAmount,
        status: 'pending',
      },
    })

    // Create tier 2 commission for the referrer's referrer (if exists)
    if (referrer.referredBy) {
      const tier2Referrer = await db.user.findUnique({
        where: { id: referrer.referredBy },
      })
      if (tier2Referrer) {
        await db.referralCommission.create({
          data: {
            referrerId: tier2Referrer.id,
            referredId: userId,
            level: 2,
            amount: Math.floor(bonusAmount * TIER_COMMISSIONS[2]),
            sourceAmount: bonusAmount,
            status: 'pending',
          },
        })
      }

      // Create tier 3 commission for the tier2 referrer's referrer (if exists)
      if (tier2Referrer?.referredBy) {
        const tier3Referrer = await db.user.findUnique({
          where: { id: tier2Referrer.referredBy },
        })
        if (tier3Referrer) {
          await db.referralCommission.create({
            data: {
              referrerId: tier3Referrer.id,
              referredId: userId,
              level: 3,
              amount: Math.floor(bonusAmount * TIER_COMMISSIONS[3]),
              sourceAmount: bonusAmount,
              status: 'pending',
            },
          })
        }
      }
    }

    // Create bonus records
    await db.bonus.create({
      data: {
        userId: referrer.id,
        type: 'referral_bonus',
        amount: bonusAmount,
        description: `Bonus referral karena mengajak ${user.name} bergabung`,
        status: 'completed',
      },
    })
    await db.bonus.create({
      data: {
        userId,
        type: 'referral_bonus',
        amount: bonusAmount,
        description: 'Bonus referral dari kode referral',
        status: 'completed',
      },
    })

    // Create notifications
    await db.notification.create({
      data: {
        userId: referrer.id,
        title: 'Bonus Referral!',
        message: `Anda mendapat bonus referral Rp ${bonusAmount.toLocaleString('id-ID')} karena mengajak teman bergabung.`,
        type: 'alert',
      },
    })
    await db.notification.create({
      data: {
        userId,
        title: 'Bonus Referral!',
        message: `Anda mendapat bonus referral Rp ${bonusAmount.toLocaleString('id-ID')} dari kode referral.`,
        type: 'alert',
      },
    })

    return NextResponse.json({
      message: 'Referral code applied successfully',
      bonusAmount,
    })
  } catch (error) {
    console.error('Apply referral error:', error)
    return NextResponse.json(
      { error: 'Failed to apply referral code' },
      { status: 500 }
    )
  }
}
