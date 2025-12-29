import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let payload
  try {
    const text = await req.text()
    if (!text || text.trim() === '') {
      return new Response(JSON.stringify({ error: 'Empty request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    payload = JSON.parse(text)
  } catch (e) {
    console.error('Failed to parse request body:', e)
    return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
          <p>You have a new message from <strong>${data.sender_name || 'someone'}</strong>:</p>
          <blockquote style="background: #f5f5f5; padding: 15px; border-left: 4px solid #6aa9ff;">
            ${data.message_preview || ''}...
          </blockquote>
          <p><a href="https://rivertech.me/portal/">View in Student Portal</a></p>
        `
        break
      case 'assignment_posted':
        html = `
          <h2>New Assignment</h2>
          <p>A new assignment has been posted: <strong>${data.assignment_title || 'Untitled'}</strong></p>
          <p>Due: ${data.due_date || 'See portal for details'}</p>
          <p><a href="https://rivertech.me/portal/">View Assignment</a></p>
        `
        break
      case 'missed_assignment':
        // Build list of missed assignments per student
        const students = data.students || []
        let assignmentList = ''
        for (const student of students) {
          assignmentList += `<li><strong>${student.name || 'Student'}</strong><ul>`
          for (const item of (student.assignments || [])) {
            assignmentList += `<li><b>${item.title || 'Assignment'}</b> — due ${item.due_date || 'N/A'}</li>`
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
            <p>A new grade report is available for <strong>${data.student_name || 'your student'}</strong>.</p>
            ${data.summary ? `<p>${data.summary}</p>` : ''}
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
      subject = `📝 ${data.studentName}'s Assignment Graded: ${data.assignmentTitle}`
      html = `
        <div style="font-family: Inter, system-ui, Segoe UI, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">📝 Assignment Graded</h2>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
            <p>Dear ${data.parentName || 'Parent'},</p>
            <p>Your child <strong>${data.studentName}</strong>'s assignment has been graded.</p>

            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <div style="margin-bottom: 10px;">
                <strong>Assignment:</strong> ${data.assignmentTitle}
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong>Grade:</strong>
                <span style="background: #667eea; color: white; padding: 6px 16px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                  ${data.grade}
                </span>
              </div>
              <div style="margin-top: 10px; color: #666;">
                Points: ${data.pointsEarned} / ${data.maxPoints}
              </div>
            </div>

            <p><a href="https://rivertech.me/portal/" style="display: inline-block; background: #667eea; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">View in Student Portal</a></p>

            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              You're receiving this because you have grade notifications enabled for your child.
            </p>
          </div>
        </div>
      `
    } else if (payload.type === 'child_assignment_posted') {
      const data = payload.data || {}
      subject = `📝 New Assignment for ${data.childNames}: ${data.assignmentTitle}`
      html = `
        <div style="font-family: Inter, system-ui, Segoe UI, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">📝 New Assignment Posted</h2>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
            <p>Dear ${data.parentName || 'Parent'},</p>
            <p>A new assignment has been posted for <strong>${data.childNames}</strong>.</p>

            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <div style="margin-bottom: 10px;">
                <strong>Assignment:</strong> ${data.assignmentTitle}
              </div>
              <div style="margin-bottom: 10px;">
                <strong>Class:</strong> ${data.className}
              </div>
              <div>
                <strong>Due Date:</strong>
                <span style="background: #667eea; color: white; padding: 4px 12px; border-radius: 12px; font-weight: bold;">
                  ${data.dueDate}
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
      subject = `⏰ Late Submission: ${data.studentName} - ${data.assignmentTitle}`
      html = `
        <div style="font-family: Inter, system-ui, Segoe UI, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f5576c; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">⏰ Late Assignment Submission</h2>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
            <p>Dear ${data.teacherName || 'Teacher'},</p>
            <p>A student has submitted an assignment after the due date.</p>

            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <div style="margin-bottom: 10px;">
                <strong>Student:</strong> ${data.studentName}
              </div>
              <div style="margin-bottom: 10px;">
                <strong>Assignment:</strong> ${data.assignmentTitle}
              </div>
              <div style="margin-bottom: 10px;">
                <strong>Class:</strong> ${data.className}
              </div>
              <div style="margin-bottom: 10px;">
                <strong>Due Date:</strong> <span style="color: #f5576c;">${data.dueDate}</span>
              </div>
              <div>
                <strong>Submitted:</strong> ${data.submittedAt}
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
      subject = `👤 New User Registration: ${data.userName} (${data.userType})`
      html = `
        <div style="font-family: Inter, system-ui, Segoe UI, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">👤 New User Registration</h2>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
            <p>Dear ${data.adminName || 'Admin'},</p>
            <p>A new user has registered on the Student Portal.</p>

            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <div style="margin-bottom: 10px;">
                <strong>Name:</strong> ${data.userName}
              </div>
              <div style="margin-bottom: 10px;">
                <strong>Email:</strong> ${data.userEmail}
              </div>
              <div>
                <strong>Account Type:</strong>
                <span style="background: #11998e; color: white; padding: 4px 12px; border-radius: 12px; font-weight: bold;">
                  ${data.userType}
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
      subject = `${data.critical ? '🚨' : '⚠️'} System Alert: ${data.title}`
      html = `
        <div style="font-family: Inter, system-ui, Segoe UI, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: ${alertColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">${data.critical ? '🚨 Critical' : '⚠️'} System Alert</h2>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
            <p>Dear ${data.adminName || 'Admin'},</p>
            <p>A system alert requires your attention.</p>

            <div style="background: ${data.critical ? '#fff0f0' : '#fff8e1'}; border: 1px solid ${alertColor}; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <div style="margin-bottom: 10px;">
                <strong>Alert Type:</strong> ${data.alertType || 'System'}
              </div>
              <div style="margin-bottom: 10px;">
                <strong>Title:</strong> ${data.title}
              </div>
              <div>
                <strong>Details:</strong>
                <p style="margin: 5px 0 0 0;">${data.message}</p>
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
      subject = `⚠️ ${data.studentName} has received a strike (${data.strikeCount}/3)`
      html = `
        <div style="font-family: Inter, system-ui, Segoe UI, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: ${strikeColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">⚠️ Disciplinary Strike Issued</h2>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
            <p>Dear ${data.parentName || 'Parent'},</p>
            <p>Your child <strong>${data.studentName}</strong> has received a disciplinary strike.</p>

            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <strong>Current Strike Count:</strong>
                <span style="background: ${strikeColor}; color: white; padding: 4px 12px; border-radius: 12px; font-weight: bold;">
                  ${data.strikeCount}/3
                </span>
              </div>
              <div style="margin-top: 15px;">
                <strong>Reason:</strong>
                <p style="margin: 5px 0 0 0; padding: 10px; background: white; border-radius: 4px;">${data.reason}</p>
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
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
