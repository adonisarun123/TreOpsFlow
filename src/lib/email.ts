/**
 * Email utility for TreOps notifications
 * 
 * Currently uses a stub that logs emails. To enable actual sending:
 * 1. npm install nodemailer (or resend)
 * 2. Set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS in .env
 * 3. Uncomment the nodemailer transport below
 */

interface EmailPayload {
    to: string | string[]
    subject: string
    html: string
    text?: string
}

export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
    const { to, subject, html, text } = payload
    const recipients = Array.isArray(to) ? to : [to]

    // Skip sending if SMTP is not configured — log to console instead
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
        console.log(`[EMAIL STUB] To: ${recipients.join(', ')} | Subject: ${subject}`)
        console.log(`[EMAIL STUB] Set EMAIL_HOST and EMAIL_USER env vars to enable real email sending`)
        return { success: true }
    }

    // Production: use nodemailer
    try {
        const nodemailer = await import('nodemailer')
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        })

        await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"Knot by Trebound" <noreply@trebound.com>',
            to: recipients.join(', '),
            subject,
            html,
            text,
        })

        return { success: true }
    } catch (error: any) {
        console.error('[EMAIL ERROR]', error?.message)
        return { success: false, error: error?.message }
    }
}

// Template helpers
export function htmlWrap(title: string, body: string): string {
    return `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 24px;">
        <div style="background: #4F46E5; color: white; padding: 16px 24px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0; font-size: 18px;">Knot by Trebound</h2>
            <p style="margin: 4px 0 0; opacity: 0.8; font-size: 13px;">${title}</p>
        </div>
        <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            ${body}
        </div>
        <p style="text-align: center; font-size: 11px; color: #9ca3af; margin-top: 16px;">
            Knot by Trebound • Automated Alert
        </p>
    </div>`
}
