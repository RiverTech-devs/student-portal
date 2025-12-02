import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  const payload = await req.json()

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
          <p><a href="https://rivertech.me/student-portal/portal/">View in Student Portal</a></p>
        `
        break
      case 'assignment_posted':
        html = `
          <h2>New Assignment</h2>
          <p>A new assignment has been posted: <strong>${data.assignment_title || 'Untitled'}</strong></p>
          <p>Due: ${data.due_date || 'See portal for details'}</p>
          <p><a href="https://rivertech.me/student-portal/portal/">View Assignment</a></p>
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
            <p><a href="https://rivertech.me/student-portal/portal/">View in Student Portal</a></p>
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
            <p><a href="https://rivertech.me/student-portal/portal/">View Full Report</a></p>
            <p style="color: #666; font-size: 12px;">You're receiving this because you opted in to grade report notifications.</p>
          </div>
        `
        break
      default:
        html = `<p>You have a new notification in Student Portal.</p>
                <p><a href="https://rivertech.me/student-portal/portal/">View Portal</a></p>`
    }
  } else {
    // Direct call
    to = payload.to
    subject = payload.subject
    html = payload.html
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
    headers: { 'Content-Type': 'application/json' },
  })
})
