// Email template utilities and HTML templates for workflow notifications

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Base email template wrapper
function baseTemplate(content: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #0b1221 0%, #1a2332 100%); color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px 20px; }
        .button { display: inline-block; padding: 12px 30px; background: #F26522; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .button:hover { background: #d55419; }
        .info-box { background: #f8f9fa; border-left: 4px solid #F26522; padding: 15px; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .detail-row { margin: 10px 0; }
        .label { font-weight: bold; color: #0b1221; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏔️ Trebound Operations</h1>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>This is an automated notification from Trebound Operations Workflow System</p>
            <p>© ${new Date().getFullYear()} Trebound. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `
}

// 1. Program Created Email
export function programCreatedEmail(data: {
    id: string  // UUID for URL
    programName: string
    programId: string  // Human-readable ID for display
    salesOwnerName: string
    clientName: string
    location: string
    budget: number
}): { subject: string; html: string } {
    const content = `
        <h2>✅ New Program Created</h2>
        <p>Hi ${data.salesOwnerName},</p>
        <p>A new program has been successfully created and is now in your queue.</p>
        
        <div class="info-box">
            <div class="detail-row"><span class="label">Program:</span> ${data.programName}</div>
            <div class="detail-row"><span class="label">Program ID:</span> ${data.programId}</div>
            <div class="detail-row"><span class="label">Client:</span> ${data.clientName}</div>
            <div class="detail-row"><span class="label">Location:</span> ${data.location}</div>
            <div class="detail-row"><span class="label">Budget:</span> ₹${data.budget.toLocaleString()}</div>
            <div class="detail-row"><span class="label">Status:</span> <strong>Stage 1 - Pending Finance Approval</strong></div>
        </div>

        <p>The program is awaiting <strong>Finance approval</strong> before it can proceed to the Ops team.</p>
        
        <a href="${APP_URL}/dashboard/programs/${data.id}" class="button">View Program Details</a>
        
        <p>Thank you,<br>TreOps System</p>
    `

    return {
        subject: `New Program: ${data.programName} (${data.programId})`,
        html: baseTemplate(content),
    }
}

// 2. Finance Approval Requested Email
export function financeApprovalRequestedEmail(data: {
    id: string
    programName: string
    programId: string
    salesOwnerName: string
    budget: number
}): { subject: string; html: string } {
    const content = `
        <h2>💰 Budget Approval Required</h2>
        <p>Hi Finance Team,</p>
        <p>A new program requires your budget approval to proceed.</p>
        
        <div class="info-box">
            <div class="detail-row"><span class="label">Program:</span> ${data.programName}</div>
            <div class="detail-row"><span class="label">Program ID:</span> ${data.programId}</div>
            <div class="detail-row"><span class="label">Sales Owner:</span> ${data.salesOwnerName}</div>
            <div class="detail-row"><span class="label">Budget:</span> ₹${data.budget.toLocaleString()}</div>
            <div class="detail-row"><span class="label">Action Required:</span> <strong>Approve Budget</strong></div>
        </div>

        <p>Please review and approve the budget to allow this program to proceed to the Ops team.</p>
        
        <a href="${APP_URL}/dashboard/programs/${data.id}" class="button">Review & Approve</a>
        
        <p>Thank you,<br>TreOps System</p>
    `

    return {
        subject: `Budget Approval Required: ${data.programName} (₹${data.budget.toLocaleString()})`,
        html: baseTemplate(content),
    }
}

// 3. Budget Approved Email
export function budgetApprovedEmail(data: {
    id: string
    programName: string
    programId: string
    salesOwnerName: string
}): { subject: string; html: string } {
    const content = `
        <h2>✅ Budget Approved</h2>
        <p>Hi ${data.salesOwnerName},</p>
        <p>Great news! The budget for your program has been approved by Finance.</p>
        
        <div class="info-box">
            <div class="detail-row"><span class="label">Program:</span> ${data.programName}</div>
            <div class="detail-row"><span class="label">Program ID:</span> ${data.programId}</div>
            <div class="detail-row"><span class="label">Status:</span> <strong>Awaiting Ops Handover</strong></div>
        </div>

        <p>The program is now awaiting <strong>Ops handover acceptance</strong> to move to Stage 2.</p>
        
        <a href="${APP_URL}/dashboard/programs/${data.id}" class="button">View Program</a>
        
        <p>Thank you,<br>TreOps System</p>
    `

    return {
        subject: `Budget Approved: ${data.programName}`,
        html: baseTemplate(content),
    }
}

// 3b. Ops Handover Ready Email
export function opsHandoverReadyEmail(data: {
    id: string
    programName: string
    programId: string
    salesOwnerName: string
    clientName: string
    budget: number
}): { subject: string; html: string } {
    const content = `
        <h2>📋 Handover Ready - Action Required</h2>
        <p>Hi Ops Team,</p>
        <p>A program has received Finance approval and is ready for handover acceptance.</p>
        
        <div class="info-box">
            <div class="detail-row"><span class="label">Program:</span> ${data.programName}</div>
            <div class="detail-row"><span class="label">Program ID:</span> ${data.programId}</div>
            <div class="detail-row"><span class="label">Client:</span> ${data.clientName}</div>
            <div class="detail-row"><span class="label">Sales Owner:</span> ${data.salesOwnerName}</div>
            <div class="detail-row"><span class="label">Budget:</span> ₹${data.budget.toLocaleString()}</div>
            <div class="detail-row"><span class="label">Status:</span> <strong>✅ Budget Approved - Awaiting Handover</strong></div>
        </div>

        <p><strong>Action Required:</strong> Please review the program details and click "Accept Handover (Ops)" to proceed to Stage 2.</p>
        
        <a href="${APP_URL}/dashboard/programs/${data.id}" class="button">Review & Accept Handover</a>
        
        <p>Thank you,<br>TreOps System</p>
    `

    return {
        subject: `Handover Ready: ${data.programName} - Action Required`,
        html: baseTemplate(content),
    }
}

// 4. Handover to Ops Email
export function handoverToOpsEmail(data: {
    id: string
    programName: string
    programId: string
    opsSPOCName: string
    clientName: string
    location: string
}): { subject: string; html: string } {
    const content = `
        <h2>📝 New Program Handover</h2>
        <p>Hi ${data.opsSPOCName},</p>
        <p>A new program has been handed over to you. You are now the Ops SPOC for this program.</p>
        
        <div class="info-box">
            <div class="detail-row"><span class="label">Program:</span> ${data.programName}</div>
            <div class="detail-row"><span class="label">Program ID:</span> ${data.programId}</div>
            <div class="detail-row"><span class="label">Client:</span> ${data.clientName}</div>
            <div class="detail-row"><span class="label">Location:</span> ${data.location}</div>
            <div class="detail-row"><span class="label">Current Stage:</span> <strong>Stage 2 - Feasibility & Preps</strong></div>
        </div>

        <p>Please begin working on the program logistics and preparations.</p>
        
        <a href="${APP_URL}/dashboard/programs/${data.id}" class="button">Start Working</a>
        
        <p>Thank you,<br>TreOps System</p>
    `

    return {
        subject: `New Program Assigned: ${data.programName}`,
        html: baseTemplate(content),
    }
}

// 5. Stage Completed Email
export function stageCompletedEmail(data: {
    id: string
    programName: string
    programId: string
    opsOwnerName: string
    completedStage: number
    nextStage: number
}): { subject: string; html: string } {
    const stageNames: Record<number, string> = {
        2: 'Feasibility & Preps',
        3: 'On-Site Delivery',
        4: 'Post-Program Closure',
    }

    const content = `
        <h2>🎯 Stage ${data.completedStage} Completed</h2>
        <p>Hi ${data.opsOwnerName},</p>
        <p>Stage ${data.completedStage} (${stageNames[data.completedStage]}) has been successfully completed.</p>
        
        <div class="info-box">
            <div class="detail-row"><span class="label">Program:</span> ${data.programName}</div>
            <div class="detail-row"><span class="label">Program ID:</span> ${data.programId}</div>
            <div class="detail-row"><span class="label">Completed:</span> <strong>Stage ${data.completedStage} - ${stageNames[data.completedStage]}</strong></div>
            <div class="detail-row"><span class="label">Next:</span> <strong>Stage ${data.nextStage} - ${stageNames[data.nextStage] || 'Archived'}</strong></div>
        </div>

        <p>The program has automatically progressed to the next stage. Please continue with the required tasks.</p>
        
        <a href="${APP_URL}/dashboard/programs/${data.id}" class="button">View Program</a>
        
        <p>Thank you,<br>TreOps System</p>
    `

    return {
        subject: `Stage ${data.completedStage} Completed: ${data.programName}`,
        html: baseTemplate(content),
    }
}

// 6. Program Closed Email
export function programClosedEmail(data: {
    id: string
    programName: string
    programId: string
    clientName: string
    zfdRating: number
}): { subject: string; html: string } {
    const content = `
        <h2>🏁 Program Closed & Archived</h2>
        <p>Hi Team,</p>
        <p>The following program has been successfully completed and archived.</p>
        
        <div class="info-box">
            <div class="detail-row"><span class="label">Program:</span> ${data.programName}</div>
            <div class="detail-row"><span class="label">Program ID:</span> ${data.programId}</div>
            <div class="detail-row"><span class="label">Client:</span> ${data.clientName}</div>
            <div class="detail-row"><span class="label">ZFD Rating:</span> <strong>${data.zfdRating}/5</strong> ${data.zfdRating >= 4 ? '⭐' : ''}</div>
            <div class="detail-row"><span class="label">Status:</span> <strong>Stage 5 - Archived & Locked</strong></div>
        </div>

        <p>All post-program tasks have been completed. The program is now locked and archived.</p>
        
        <a href="${APP_URL}/dashboard/programs/${data.id}" class="button">View Final Report</a>
        
        <p>Thank you for your contribution to this program's success!<br>TreOps System</p>
    `

    return {
        subject: `Program Closed: ${data.programName} (ZFD: ${data.zfdRating}/5)`,
        html: baseTemplate(content),
    }
}

// 7. Finance Rejection Email
export function financeRejectedEmail(data: {
    id: string
    programName: string
    programId: string
    salesOwnerName: string
    rejectionReason: string
}): { subject: string; html: string } {
    const content = `
        <h2>❌ Program Rejected by Finance</h2>
        <p>Hi ${data.salesOwnerName},</p>
        <p>Unfortunately, your program has been rejected by the Finance team.</p>
        
        <div class="info-box">
            <div class="detail-row"><span class="label">Program:</span> ${data.programName}</div>
            <div class="detail-row"><span class="label">Program ID:</span> ${data.programId}</div>
            <div class="detail-row"><span class="label">Status:</span> <strong style="color: #dc2626;">Rejected by Finance</strong></div>
        </div>

        <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
            <p style="font-weight: bold; margin: 0 0 10px 0;">Rejection Reason:</p>
            <p style="margin: 0;">${data.rejectionReason}</p>
        </div>

        <p><strong>Next Steps:</strong></p>
        <ul>
            <li>Review your budget and pricing strategy</li>
            <li>Make necessary adjustments to the program</li>
            <li>Resubmit for Finance approval</li>
        </ul>
        
        <a href="${APP_URL}/dashboard/programs/${data.id}" class="button">Review & Edit Program</a>
        
        <p>Thank you,<br>TreOps System</p>
    `

    return {
        subject: `Program Rejected by Finance: ${data.programName}`,
        html: baseTemplate(content),
    }
}

// 8. Ops Rejection Email
export function opsRejectedEmail(data: {
    id: string
    programName: string
    programId: string
    salesOwnerName: string
    rejectionReason: string
}): { subject: string; html: string } {
    const content = `
        <h2>❌ Handover Rejected by Ops</h2>
        <p>Hi ${data.salesOwnerName},</p>
        <p>The Ops team has rejected the handover for your program.</p>
        
        <div class="info-box">
            <div class="detail-row"><span class="label">Program:</span> ${data.programName}</div>
            <div class="detail-row"><span class="label">Program ID:</span> ${data.programId}</div>
            <div class="detail-row"><span class="label">Status:</span> <strong style="color: #dc2626;">Rejected by Ops</strong></div>
        </div>

        <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
            <p style="font-weight: bold; margin: 0 0 10px 0;">Rejection Reason:</p>
            <p style="margin: 0;">${data.rejectionReason}</p>
        </div>

        <p><strong>Next Steps:</strong></p>
        <ul>
            <li>Discuss new dates/scope with your client</li>
            <li>Address the concerns raised by Ops</li>
            <li>Update the program details</li>
            <li>Resubmit for Ops handover</li>
        </ul>
        
        <a href="${APP_URL}/dashboard/programs/${data.id}" class="button">Review & Edit Program</a>
        
        <p>Thank you,<br>TreOps System</p>
    `

    return {
        subject: `Handover Rejected by Ops: ${data.programName}`,
        html: baseTemplate(content),
    }
}

// 9. Program Resubmitted Email
export function programResubmittedEmail(data: {
    id: string
    programName: string
    programId: string
    salesOwnerName: string
    resubmissionCount: number
}): { subject: string; html: string } {
    const content = `
        <h2>🔄 Program Resubmitted for Review</h2>
        <p>Hi Team,</p>
        <p>A previously rejected program has been updated and resubmitted for your review.</p>
        
        <div class="info-box">
            <div class="detail-row"><span class="label">Program:</span> ${data.programName}</div>
            <div class="detail-row"><span class="label">Program ID:</span> ${data.programId}</div>
            <div class="detail-row"><span class="label">Sales Owner:</span> ${data.salesOwnerName}</div>
            <div class="detail-row"><span class="label">Resubmission #:</span> <strong>${data.resubmissionCount}</strong></div>
            <div class="detail-row"><span class="label">Action Required:</span> <strong>Review & Approve/Reject</strong></div>
        </div>

        <p>The Sales team has made changes based on your previous feedback. Please review the updated program.</p>
        
        <a href="${APP_URL}/dashboard/programs/${data.id}" class="button">Review Program</a>
        
        <p>Thank you,<br>TreOps System</p>
    `

    return {
        subject: `Program Resubmitted (${data.resubmissionCount}x): ${data.programName}`,
        html: baseTemplate(content),
    }
}

// Program Reopened Email
export function programReopenedEmail(data: {
    id: string
    programName: string
    programId: string
    reopenedBy: string
    justification: string
    clientName: string
    programDates?: string
}): { subject: string; html: string } {
    const content = `
        <h2>🔓 Program Reopened</h2>
        <p>Hi Team,</p>
        <p>A closed program has been <strong>reopened</strong> by an administrator and returned to Stage 4 for further action.</p>
        
        <div class="info-box">
            <div class="detail-row"><span class="label">Program:</span> ${data.programName}</div>
            <div class="detail-row"><span class="label">Program ID:</span> ${data.programId}</div>
            <div class="detail-row"><span class="label">Client:</span> ${data.clientName}</div>
            ${data.programDates ? `<div class="detail-row"><span class="label">Dates:</span> ${data.programDates}</div>` : ''}
            <div class="detail-row"><span class="label">Reopened By:</span> ${data.reopenedBy}</div>
            <div class="detail-row"><span class="label">New Status:</span> <strong>Stage 4 - Feedback & Closure</strong></div>
        </div>

        <div class="info-box" style="border-left-color: #0b1221;">
            <div class="detail-row"><span class="label">Justification:</span></div>
            <p style="margin: 10px 0; font-style: italic;">"${data.justification}"</p>
        </div>

        <p><strong>Next Steps:</strong></p>
        <ul>
            <li>Review the reopening justification</li>
            <li>Complete pending Stage 4 tasks if any</li>
            <li>Update program details as needed</li>
            <li>Proceed to closure when ready</li>
        </ul>
        
        <a href="${APP_URL}/dashboard/programs/${data.id}" class="button">View Program Details</a>
        
        <p>Thank you,<br>TreOps System</p>
    `

    return {
        subject: `🔓 Program Reopened: ${data.programName} (${data.programId})`,
        html: baseTemplate(content),
    }
}
