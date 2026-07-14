import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getDepositAddress, convertIdrToUsdt, getIdrToUsdtRate } from '@/lib/binance'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, amount, method, network } = body

    if (!userId || !amount) {
      return NextResponse.json(
        { error: 'userId dan jumlah wajib diisi' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Jumlah harus lebih dari 0' },
        { status: 400 }
      )
    }

    // Minimum deposit Rp 100.000
    if (amount < 100000) {
      return NextResponse.json(
        { error: 'Minimum deposit Rp 100.000' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    // === KYC VERIFICATION REQUIRED ===
    if (user.kycStatus !== 'verified') {
      return NextResponse.json(
        { error: 'Verifikasi KYC diperlukan untuk melakukan deposit. Silakan verifikasi KYC Anda terlebih dahulu.', kycRequired: true },
        { status: 403 }
      )
    }

    // === CRYPTO DEPOSIT (Binance) ===
    if (method === 'crypto') {
      const selectedNetwork = network || 'TRC20'
      const validNetworks = ['TRC20', 'BEP20', 'ERC20']
      if (!validNetworks.includes(selectedNetwork)) {
        return NextResponse.json(
          { error: 'Network tidak valid. Pilih TRC20, BEP20, atau ERC20' },
          { status: 400 }
        )
      }

      // Convert IDR to USDT
      const { usdtAmount, rate } = await convertIdrToUsdt(amount)

      // Get Binance deposit address
      let depositAddress: string
      try {
        const addressInfo = await getDepositAddress('USDT', selectedNetwork)
        depositAddress = addressInfo.address
      } catch (err) {
        console.error('Failed to get Binance deposit address:', err)
        return NextResponse.json(
          { error: 'Gagal mendapatkan alamat deposit. Silakan coba lagi nanti.' },
          { status: 500 }
        )
      }

      // Create pending deposit record
      const deposit = await db.deposit.create({
        data: {
          userId,
          amount,
          method: 'crypto',
          bankName: `USDT ${selectedNetwork}`,
          status: 'pending',
          cryptoAmount: usdtAmount,
          cryptoCoin: 'USDT',
          cryptoNetwork: selectedNetwork,
          cryptoAddress: depositAddress,
          cryptoRate: rate,
          note: `Deposit USDT ${usdtAmount} via ${selectedNetwork} | Rate: Rp ${rate.toLocaleString('id-ID')}/USDT | Alamat: ${depositAddress}`,
        },
      })

      // Create notification
      await db.notification.create({
        data: {
          userId,
          title: 'Deposit Dibuat',
          message: `Deposit sebesar Rp ${amount.toLocaleString('id-ID')} (${usdtAmount} USDT) telah dibuat. Silakan kirim USDT ke alamat yang diberikan.`,
          type: 'deposit',
        },
      })

      return NextResponse.json({
        deposit,
        paymentInfo: {
          address: depositAddress,
          network: selectedNetwork,
          coin: 'USDT',
          usdtAmount,
          rate,
          idrAmount: amount,
          minConfirmation: selectedNetwork === 'TRC20' ? 20 : selectedNetwork === 'BEP20' ? 15 : 12,
        },
      }, { status: 201 })
    }

    // === QRIS DEPOSIT (legacy, auto-approve) ===
    const validMethods = ['bank_transfer', 'e_wallet', 'qris']
    if (method && !validMethods.includes(method)) {
      return NextResponse.json(
        { error: 'Metode tidak valid' },
        { status: 400 }
      )
    }

    const deposit = await db.deposit.create({
      data: {
        userId,
        amount,
        method: method || 'qris',
        bankName: 'QRIS',
        status: 'completed',
      },
    })

    const newTotalDeposit = user.totalDeposit + amount
    await db.user.update({
      where: { id: userId },
      data: {
        balance: { increment: amount },
        totalDeposit: newTotalDeposit,
      },
    })

    await db.notification.create({
      data: {
        userId,
        title: 'Deposit Berhasil',
        message: `Deposit sebesar Rp ${amount.toLocaleString('id-ID')} telah berhasil dikreditkan ke akun Anda.`,
        type: 'deposit',
      },
    })

    return NextResponse.json({ deposit }, { status: 201 })
  } catch (error) {
    console.error('Deposit error:', error)
    return NextResponse.json(
      { error: 'Gagal memproses deposit' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId wajib diisi' },
        { status: 400 }
      )
    }

    const deposits = await db.deposit.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ deposits })
  } catch (error) {
    console.error('Get deposits error:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data deposit' },
      { status: 500 }
    )
  }
}
