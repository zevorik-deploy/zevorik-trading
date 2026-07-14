import nodemailer from 'nodemailer'

// SMTP configuration from environment variables
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com'
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587')
const SMTP_USER = process.env.SMTP_USER || ''
const SMTP_PASS = process.env.SMTP_PASS || ''
const EMAIL_FROM = process.env.EMAIL_FROM || 'ZEVORIK <noreply@zevorik.com>'

// Create transporter on demand for resilience
function createTransporter() {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    connectionTimeout: 15000, // 15 seconds
    greetingTimeout: 10000,  // 10 seconds
    socketTimeout: 15000,    // 15 seconds
  })
}

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<boolean> {
  try {
    if (!SMTP_USER || !SMTP_PASS) {
      console.warn('SMTP credentials not configured. Email not sent.')
      console.warn('Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env')
      return false
    }

    const transporter = createTransporter()

    // Verify connection before sending
    try {
      await transporter.verify()
    } catch (verifyError) {
      console.error('SMTP connection verification failed:', verifyError)
      return false
    }

    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    })

    console.log('Email sent successfully:', info.messageId, 'to:', to)
    return true
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}

export function generateOTPCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function otpEmailTemplate(code: string, type: string): string {
  const typeLabels: Record<string, string> = {
    register: 'Verifikasi Email - Pendaftaran Akun',
    withdrawal: 'Verifikasi Email - Penarikan Dana',
    forgot_password: 'Verifikasi Email - Reset Password',
  }

  const title = typeLabels[type] || 'Verifikasi Email'

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="margin:0;padding:0;background:#0f172a;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;min-height:100vh;">
        <tr>
          <td align="center" style="padding:40px 20px;">
            <table width="480" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;overflow:hidden;">
              <tr>
                <td align="center" style="padding:32px 32px 16px;">
                  <h1 style="margin:0;color:#3b82f6;font-size:24px;font-weight:800;letter-spacing:2px;">ZEVORIK</h1>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding:0 32px 8px;">
                  <h2 style="margin:0;color:#e2e8f0;font-size:18px;font-weight:600;">${title}</h2>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding:8px 32px 24px;">
                  <p style="margin:0;color:#94a3b8;font-size:14px;line-height:1.6;">Masukkan kode verifikasi berikut untuk melanjutkan:</p>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding:0 32px 24px;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      ${code.split('').map((d: string) => `
                        <td style="background:#0f172a;color:#3b82f6;font-size:32px;font-weight:800;padding:12px 16px;margin:4px;border-radius:8px;text-align:center;min-width:44px;">${d}</td>
                      `).join('')}
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding:0 32px 32px;">
                  <p style="margin:0;color:#64748b;font-size:12px;line-height:1.6;">Kode ini berlaku selama 5 menit. Jangan bagikan kode ini kepada siapapun.</p>
                  <p style="margin:8px 0 0;color:#475569;font-size:11px;">Jika Anda tidak meminta kode ini, abaikan email ini.</p>
                </td>
              </tr>
              <tr>
                <td style="background:#0f172a;padding:16px 32px;text-align:center;">
                  <p style="margin:0;color:#475569;font-size:10px;">&copy; 2024 ZEVORIK. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}
