import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

const ALLOWED_ORIGINS = ['https://rivertech.me', 'https://www.rivertech.me']

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || ''
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

function esc(str: string | undefined | null): string {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) })
  }

  // Verify caller is authenticated (internal service or authenticated user)
  const authHeader = req.headers.get('Authorization')
  const apiKey = req.headers.get('apikey')
  if (!authHeader && !apiKey) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    })
  }

  let payload
  try {
    const text = await req.text()
    if (!text || text.trim() === '') {
      return new Response(JSON.stringify({ error: 'Empty request body' }), {
        status: 400,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      })
    }
    payload = JSON.parse(text)
  } catch (e) {
    console.error('Failed to parse request body:', e)
    return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
      status: 400,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    })
  }

  let to, subject, html

  if (payload.record) {
    // Called from database webhook
    const record = payload.record
    to = record.recipient_email
    subject = record.subject

    const data = record.data || {}
    switch (record.template) {
      case 'new_message':
        html = `
          <h2>New Message</h2>
          <p>You have a new message from <strong>${esc(data.sender_name || 'someone')}</strong>:</p>
          <blockquote style="background: #f5f5f5; padding: 15px; border-left: 4px solid #6aa9ff;">
            ${esc(data.message_preview || '')}...
          </blockquote>
          <p><a href="https://rivertech.me/portal/">View in Student Portal</a></p>
        `
        break
      case 'assignment_posted':
        html = `
          <h2>New Assignment</h2>
          <p>A new assignment has been posted: <strong>${esc(data.assignment_title || 'Untitled')}</strong></p>
          <p>Due: ${esc(data.due_date || 'See portal for details')}</p>
          <p><a href="https://rivertech.me/portal/">View Assignment</a></p>
        `
        break
      case 'missed_assignment':
        // Build list of missed assignments per student
        const students = data.students || []
        let assignmentList = ''
        for (const student of students) {
          assignmentList += `<li><strong>${esc(student.name || 'Student')}</strong><ul>`
          for (const item of (student.assignments || [])) {
            assignmentList += `<li><b>${esc(item.title || 'Assignment')}</b> — due ${esc(item.due_date || 'N/A')}</li>`
          }
          assignmentList += '</ul></li>'
        }
        html = `
          <div style="font-family: Inter, system-ui, Segoe UI, sans-serif;">
            <h2>Missed Assignments</h2>
            <p>The following assignments were not submitted by the due date:</p>
            <ul>${assignmentList}</ul>
            <p><a href="https://rivertech.me/portal/">View in Student Portal</a></p>
            <p style="color: #666; font-size: 12px;">You're receiving this because you opted in to missed assignment notifications.</p>
          </div>
        `
        break
      case 'grade_report':
        html = `
          <div style="font-family: Inter, system-ui, Segoe UI, sans-serif;">
            <h2>Grade Report</h2>
            <p>A new grade report is available for <strong>${esc(data.student_name || 'your student')}</strong>.</p>
            ${data.summary ? `<p>${esc(data.summary)}</p>` : ''}
            <p><a href="https://rivertech.me/portal/">View Full Report</a></p>
            <p style="color: #666; font-size: 12px;">You're receiving this because you opted in to grade report notifications.</p>
          </div>
        `
        break
      default:
        html = `<p>You have a new notification in Student Portal.</p>
                <p><a href="https://rivertech.me/portal/">View Portal</a></p>`
    }
  } else {
    // Direct call
    to = payload.to

    // Handle typed notifications
    if (payload.type === 'assignment_graded') {
      const data = payload.data || {}
      subject = `📝 ${esc(data.studentName)}'s Assignment Graded: ${esc(data.assignmentTitle)}`
      html = `
        <div style="font-family: Inter, system-ui, Segoe UI, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">📝 Assignment Graded</h2>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
            <p>Dear ${esc(data.parentName || 'Parent')},</p>
            <p>Your child <strong>${esc(data.studentName)}</strong>'s assignment has been graded.</p>

            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <div style="margin-bottom: 10px;">
                <strong>Assignment:</strong> ${esc(data.assignmentTitle)}
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong>Grade:</strong>
                <span style="background: #667eea; color: white; padding: 6px 16px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                  ${esc(data.grade)}
                </span>
              </div>
              <div style="margin-top: 10px; color: #666;">
                Points: ${esc(data.pointsEarned)} / ${esc(data.maxPoints)}
              </div>
            </div>

            <p><a href="https://rivertech.me/portal/" style="display: inline-block; background: #667eea; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">View in Student Portal</a></p>

            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              You're receiving this because you have grade notifications enabled for your child.
            </p>
          </div>
        </div>
      `
    } else if (payload.type === 'assignment_posted') {
      const data = payload.data || {}
      subject = `📝 New Assignment: ${esc(data.assignmentTitle)}`
      html = `
        <div style="font-family: Inter, system-ui, Segoe UI, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">📝 New Assignment Posted</h2>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
            <p>Hi ${esc(data.studentName || 'Student')},</p>
            <p>A new assignment has been posted for you.</p>

            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <div style="margin-bottom: 10px;">
                <strong>Assignment:</strong> ${esc(data.assignmentTitle)}
              </div>
              <div style="margin-bottom: 10px;">
                <strong>Class:</strong> ${esc(data.className)}
              </div>
              <div>
                <strong>Due Date:</strong>
                <span style="background: #667eea; color: white; padding: 4px 12px; border-radius: 12px; font-weight: bold;">
                  ${esc(data.dueDate)}
                </span>
              </div>
            </div>

            <p><a href="https://rivertech.me/portal/" style="display: inline-block; background: #667eea; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">View Assignment</a></p>

            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              You're receiving this because you have new assignment notifications enabled.
            </p>
          </div>
        </div>
      `
    } else if (payload.type === 'child_assignment_posted') {
      const data = payload.data || {}
      subject = `📝 New Assignment for ${esc(data.childNames)}: ${esc(data.assignmentTitle)}`
      html = `
        <div style="font-family: Inter, system-ui, Segoe UI, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">📝 New Assignment Posted</h2>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
            <p>Dear ${esc(data.parentName || 'Parent')},</p>
            <p>A new assignment has been posted for <strong>${esc(data.childNames)}</strong>.</p>

            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <div style="margin-bottom: 10px;">
                <strong>Assignment:</strong> ${esc(data.assignmentTitle)}
              </div>
              <div style="margin-bottom: 10px;">
                <strong>Class:</strong> ${esc(data.className)}
              </div>
              <div>
                <strong>Due Date:</strong>
                <span style="background: #667eea; color: white; padding: 4px 12px; border-radius: 12px; font-weight: bold;">
                  ${esc(data.dueDate)}
                </span>
              </div>
            </div>

            <p><a href="https://rivertech.me/portal/" style="display: inline-block; background: #667eea; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">View in Student Portal</a></p>

            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              You're receiving this because you have new assignment notifications enabled for your child.
            </p>
          </div>
        </div>
      `
    } else if (payload.type === 'late_submission') {
      const data = payload.data || {}
      subject = `⏰ Late Submission: ${esc(data.studentName)} - ${esc(data.assignmentTitle)}`
      html = `
        <div style="font-family: Inter, system-ui, Segoe UI, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f5576c; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">⏰ Late Assignment Submission</h2>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
            <p>Dear ${esc(data.teacherName || 'Teacher')},</p>
            <p>A student has submitted an assignment after the due date.</p>

            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <div style="margin-bottom: 10px;">
                <strong>Student:</strong> ${esc(data.studentName)}
              </div>
              <div style="margin-bottom: 10px;">
                <strong>Assignment:</strong> ${esc(data.assignmentTitle)}
              </div>
              <div style="margin-bottom: 10px;">
                <strong>Class:</strong> ${esc(data.className)}
              </div>
              <div style="margin-bottom: 10px;">
                <strong>Due Date:</strong> <span style="color: #f5576c;">${esc(data.dueDate)}</span>
              </div>
              <div>
                <strong>Submitted:</strong> ${esc(data.submittedAt)}
              </div>
            </div>

            <p><a href="https://rivertech.me/portal/" style="display: inline-block; background: #667eea; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">View Submission</a></p>

            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              You're receiving this because you have late submission notifications enabled.
            </p>
          </div>
        </div>
      `
    } else if (payload.type === 'new_user_registration') {
      const data = payload.data || {}
      subject = `👤 New User Registration: ${esc(data.userName)} (${esc(data.userType)})`
      html = `
        <div style="font-family: Inter, system-ui, Segoe UI, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">👤 New User Registration</h2>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
            <p>Dear ${esc(data.adminName || 'Admin')},</p>
            <p>A new user has registered on the Student Portal.</p>

            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <div style="margin-bottom: 10px;">
                <strong>Name:</strong> ${esc(data.userName)}
              </div>
              <div style="margin-bottom: 10px;">
                <strong>Email:</strong> ${esc(data.userEmail)}
              </div>
              <div>
                <strong>Account Type:</strong>
                <span style="background: #11998e; color: white; padding: 4px 12px; border-radius: 12px; font-weight: bold;">
                  ${esc(data.userType)}
                </span>
              </div>
            </div>

            <p><a href="https://rivertech.me/portal/" style="display: inline-block; background: #11998e; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">View in Admin Dashboard</a></p>

            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              You're receiving this because you have new user registration notifications enabled.
            </p>
          </div>
        </div>
      `
    } else if (payload.type === 'system_alert') {
      const data = payload.data || {}
      const alertColor = data.critical ? '#f5576c' : '#ff9800'
      subject = `${data.critical ? '🚨' : '⚠️'} System Alert: ${esc(data.title)}`
      html = `
        <div style="font-family: Inter, system-ui, Segoe UI, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: ${alertColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">${data.critical ? '🚨 Critical' : '⚠️'} System Alert</h2>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
            <p>Dear ${esc(data.adminName || 'Admin')},</p>
            <p>A system alert requires your attention.</p>

            <div style="background: ${data.critical ? '#fff0f0' : '#fff8e1'}; border: 1px solid ${alertColor}; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <div style="margin-bottom: 10px;">
                <strong>Alert Type:</strong> ${esc(data.alertType || 'System')}
              </div>
              <div style="margin-bottom: 10px;">
                <strong>Title:</strong> ${esc(data.title)}
              </div>
              <div>
                <strong>Details:</strong>
                <p style="margin: 5px 0 0 0;">${esc(data.message)}</p>
              </div>
            </div>

            <p><a href="https://rivertech.me/portal/" style="display: inline-block; background: ${alertColor}; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">View Admin Dashboard</a></p>

            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              You're receiving this because you have system alert notifications enabled.
            </p>
          </div>
        </div>
      `
    } else if (payload.type === 'strike_issued') {
      const data = payload.data || {}
      const strikeColor = data.strikeCount >= 3 ? '#f5576c' : data.strikeCount === 2 ? '#ffcb6b' : '#6aa9ff'
      subject = `⚠️ ${esc(data.studentName)} has received a strike (${esc(data.strikeCount)}/3)`
      html = `
        <div style="font-family: Inter, system-ui, Segoe UI, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: ${strikeColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">⚠️ Disciplinary Strike Issued</h2>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
            <p>Dear ${esc(data.parentName || 'Parent')},</p>
            <p>Your child <strong>${esc(data.studentName)}</strong> has received a disciplinary strike.</p>

            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <strong>Current Strike Count:</strong>
                <span style="background: ${strikeColor}; color: white; padding: 4px 12px; border-radius: 12px; font-weight: bold;">
                  ${esc(data.strikeCount)}/3
                </span>
              </div>
              <div style="margin-top: 15px;">
                <strong>Reason:</strong>
                <p style="margin: 5px 0 0 0; padding: 10px; background: white; border-radius: 4px;">${esc(data.reason)}</p>
              </div>
            </div>

            ${data.strikeCount >= 3 ? `
              <div style="background: #fff0f0; border: 1px solid #f5576c; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <strong style="color: #f5576c;">⚠️ Maximum Strikes Reached</strong>
                <p style="margin: 5px 0 0 0; color: #666;">Your child has reached the maximum of 3 strikes. Please contact the school administration to discuss next steps.</p>
              </div>
            ` : ''}

            <p style="color: #666; font-size: 13px;">
              Strikes automatically decay 3 months after the most recent strike was issued.
            </p>

            <p><a href="https://rivertech.me/portal/" style="display: inline-block; background: #6aa9ff; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">View in Student Portal</a></p>

            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              You're receiving this because you have a child linked in the Student Portal.
            </p>
          </div>
        </div>
      `
    } else if (payload.type === 'strike_issued_staff') {
      const data = payload.data || {}
      const strikeColor = data.strikeCount >= 3 ? '#f5576c' : data.strikeCount === 2 ? '#ffcb6b' : '#6aa9ff'
      subject = `⚠️ Student Strike: ${esc(data.studentName)} (${esc(data.strikeCount)}/3)`
      html = `
        <div style="font-family: Inter, system-ui, Segoe UI, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: ${strikeColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">⚠️ Student Disciplinary Strike</h2>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
            <p>Dear ${esc(data.recipientName || 'Staff Member')},</p>
            <p>A student has received a disciplinary strike.</p>

            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <div style="margin-bottom: 10px;">
                <strong>Student:</strong> ${esc(data.studentName)}
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <strong>Current Strike Count:</strong>
                <span style="background: ${strikeColor}; color: white; padding: 4px 12px; border-radius: 12px; font-weight: bold;">
                  ${esc(data.strikeCount)}/3
                </span>
              </div>
              <div style="margin-top: 15px;">
                <strong>Reason:</strong>
                <p style="margin: 5px 0 0 0; padding: 10px; background: white; border-radius: 4px;">${esc(data.reason)}</p>
              </div>
            </div>

            ${data.strikeCount >= 3 ? `
              <div style="background: #fff0f0; border: 1px solid #f5576c; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <strong style="color: #f5576c;">⚠️ Maximum Strikes Reached</strong>
                <p style="margin: 5px 0 0 0; color: #666;">This student has reached the maximum of 3 strikes. Administrative action may be required.</p>
              </div>
            ` : ''}

            <p><a href="https://rivertech.me/portal/" style="display: inline-block; background: #6aa9ff; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">View in Student Portal</a></p>

            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              You're receiving this because you have disciplinary strike notifications enabled.
            </p>
          </div>
        </div>
      `
    } else if (payload.type === 'broadcast_announcement') {
      const data = payload.data || {}
      subject = `📢 ${esc(data.title)}`
      html = `
        <div style="font-family: Inter, system-ui, Segoe UI, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">📢 School Announcement</h2>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
            <h3 style="margin-top: 0; color: #333;">${esc(data.title)}</h3>

            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; white-space: pre-wrap;">${esc(data.message)}</p>
            </div>

            <p><a href="https://rivertech.me/portal/" style="display: inline-block; background: #667eea; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">View in Student Portal</a></p>

            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              This is an official announcement from the school administration.
            </p>
          </div>
        </div>
      `
    } else if (payload.type === 'enrollment_approved') {
      const data = payload.data || {}
      subject = `✅ Enrollment Approved: ${esc(data.studentName)}`
      html = `
        <div style="font-family: Inter, system-ui, Segoe UI, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">✅ Enrollment Approved</h2>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
            <p>Dear ${esc(data.parentName || 'Parent/Guardian')},</p>
            <p>We are pleased to inform you that <strong>${esc(data.studentName)}</strong>'s enrollment application has been <strong>approved</strong>!</p>

            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <div style="margin-bottom: 10px;">
                <strong>Student:</strong> ${esc(data.studentName)}
              </div>
              <div style="margin-bottom: 10px;">
                <strong>Grade:</strong> ${esc(data.grade)}
              </div>
              <div style="margin-bottom: 10px;">
                <strong>Enrollment Type:</strong> ${data.enrollmentType === 'homeschool' ? 'Homeschool' : 'Full-Time'}
              </div>
              <div style="margin-bottom: 10px;">
                <strong>School Year:</strong> ${esc(data.schoolYear)}
              </div>
              <div>
                <strong>Account Status:</strong>
                <span style="background: ${data.accountStatus === 'active' ? '#38ef7d' : '#ffcb6b'}; color: #333; padding: 4px 12px; border-radius: 12px; font-weight: bold;">
                  ${data.accountStatus === 'active' ? 'Active' : 'Inactive (pending activation)'}
                </span>
              </div>
            </div>

            ${data.hasLogin ? `
              <div style="background: #e8f5e9; border: 1px solid #4caf50; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <strong style="color: #2e7d32;">🔑 Student Login</strong>
                <p style="margin: 5px 0 0 0;">A student account has been created with the email <strong>${esc(data.studentEmail)}</strong>. The student can log in at the Student Portal to access their classes and assignments.</p>
              </div>
            ` : `
              <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #666;">No student login was created. You can view your child's information through your parent portal account.</p>
              </div>
            `}

            <p><a href="https://rivertech.me/portal/" style="display: inline-block; background: #11998e; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">Go to Student Portal</a></p>

            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              If you have any questions, please contact the school office.
            </p>
          </div>
        </div>
      `
    } else if (payload.type === 'enrollment_denied') {
      const data = payload.data || {}
      subject = `Enrollment Application Update: ${esc(data.studentName)}`
      html = `
        <div style="font-family: Inter, system-ui, Segoe UI, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #78909c; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">Enrollment Application Update</h2>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
            <p>Dear ${esc(data.parentName || 'Parent/Guardian')},</p>
            <p>Thank you for your interest in enrolling <strong>${esc(data.studentName)}</strong>. After careful review, we are unable to approve this enrollment application at this time.</p>

            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <div style="margin-bottom: 10px;">
                <strong>Student:</strong> ${esc(data.studentName)}
              </div>
              <div style="margin-bottom: 10px;">
                <strong>Application #:</strong> ${esc(data.applicationNumber)}
              </div>
              <div style="margin-bottom: 10px;">
                <strong>School Year:</strong> ${esc(data.schoolYear)}
              </div>
              ${data.reason ? `
                <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #ddd;">
                  <strong>Reason:</strong>
                  <p style="margin: 5px 0 0 0;">${esc(data.reason)}</p>
                </div>
              ` : ''}
            </div>

            <p style="color: #666;">If you have questions or would like to discuss this decision, please contact the school office.</p>

            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              This is an automated message from the Student Portal.
            </p>
          </div>
        </div>
      `
    } else if (payload.type === 'enrollment_waitlisted') {
      const data = payload.data || {}
      subject = `📋 Enrollment Waitlisted: ${esc(data.studentName)}`
      html = `
        <div style="font-family: Inter, system-ui, Segoe UI, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f0932b; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">📋 Enrollment Waitlisted</h2>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
            <p>Dear ${esc(data.parentName || 'Parent/Guardian')},</p>
            <p>Thank you for applying to enroll <strong>${esc(data.studentName)}</strong>. Your application has been placed on our <strong>waitlist</strong> for the ${esc(data.schoolYear)} school year.</p>

            <div style="background: #fff8e1; border: 1px solid #f0932b; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <div style="margin-bottom: 10px;">
                <strong>Student:</strong> ${esc(data.studentName)}
              </div>
              <div style="margin-bottom: 10px;">
                <strong>Grade:</strong> ${esc(data.grade)}
              </div>
              <div>
                <strong>Application #:</strong> ${esc(data.applicationNumber)}
              </div>
            </div>

            <p style="color: #666;">We will notify you as soon as a spot becomes available. No further action is needed on your part at this time.</p>

            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              If you have questions, please contact the school office.
            </p>
          </div>
        </div>
      `
    } else if (payload.type === 'attendance_alert') {
      const data = payload.data || {}
      const statusText = data.status === 'late' ? 'arrived late' :
                         data.status === 'left_early' ? 'left early' :
                         'arrived late and left early'
      subject = `⚠️ Attendance Alert: ${esc(data.studentName)}`
      html = `
        <div style="font-family: Inter, system-ui, Segoe UI, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f5576c, #ff8a5c); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">⚠️ Attendance Alert</h2>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
            <p>An attendance issue has been recorded:</p>

            <div style="background: #fff3e0; border: 1px solid #ff9800; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <div style="margin-bottom: 10px;">
                <strong>Student:</strong> ${esc(data.studentName)}
              </div>
              <div style="margin-bottom: 10px;">
                <strong>Status:</strong> ${statusText}
              </div>
              <div style="margin-bottom: 10px;">
                <strong>Date:</strong> ${esc(data.date)}
              </div>
              <div>
                <strong>Type:</strong> ${data.attendanceType === 'class' ? 'Class' : 'Daily'} Attendance
              </div>
            </div>

            <div style="text-align: center; margin: 25px 0;">
              <a href="https://rivertech.me/portal/" style="background: linear-gradient(135deg, #f5576c, #ff8a5c); color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
                View in Portal
              </a>
            </div>

            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              This is an automated attendance alert from the Student Portal. You can manage your notification preferences in your profile settings.
            </p>
          </div>
        </div>
      `
    } else {
      subject = payload.subject
      html = payload.html
    }
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'Student Portal <notifications@rivertech.me>',
      to,
      subject,
      html,
    }),
  })

  const data = await res.json()

  if (!res.ok) {
    console.error('Resend API error:', res.status, data)
    return new Response(JSON.stringify({ error: 'Failed to send email', details: data }), {
      status: res.status,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify(data), {
    headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
  })
})
