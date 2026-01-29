import nodemailer from 'nodemailer'

// Create SMTP transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
})

// Verify SMTP connection
export async function testEmailConnection() {
    try {
        await transporter.verify()
        console.log('✅ SMTP Server is ready to send emails')
        return true
    } catch (error) {
        console.error('❌ SMTP Connection Error:', error)
        return false
    }
}

// Send email function
export async function sendEmail({
    to,
    subject,
    html,
    cc,
}: {
    to: string | string[]
    subject: string
    html: string
    cc?: string | string[]
}) {
    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to,
            cc,
            subject,
            html,
        })

        console.log('✅ Email sent:', info.messageId, 'to:', to)
        return { success: true, messageId: info.messageId }
    } catch (error) {
        console.error('❌ Email sending failed:', error)
        // Don't throw - email failures shouldn't block workflow
        return { success: false, error: error }
    }
}
