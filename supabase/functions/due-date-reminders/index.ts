// supabase/functions/due-date-reminders/index.ts
// Scheduled function that sends 24-hour reminders for upcoming assignments
// Run daily via cron job

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

const uniq = <T>(arr: T[]) => [...new Set(arr)];

Deno.serve(async () => {
  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find assignments due in the next 24 hours that haven't been submitted
    const { data: rows, error: rerr } = await sb
      .from("assignment_gradebook")
      .select("assignment_id, student_id, due_at, title, class_id, is_submitted")
      .gte("due_at", now.toISOString())
      .lte("due_at", tomorrow.toISOString())
      .eq("is_submitted", false);

    if (rerr) throw rerr;
    if (!rows?.length) return new Response("no upcoming assignments", { status: 200 });

    const assignmentIds = uniq(rows.map(r => r.assignment_id));
    const studentIds = uniq(rows.map(r => r.student_id));

    // Check which reminders were already sent (dedup)
    const { data: already } = await sb
      .from("due_date_reminder_notifications")
      .select("assignment_id, student_id")
      .in("assignment_id", assignmentIds)
      .in("student_id", studentIds);

    const sentKey = new Set((already || [])
      .map(x => `${x.assignment_id}:${x.student_id}`));

    // Filter out already-sent reminders
    const toNotify = rows.filter(r =>
      !sentKey.has(`${r.assignment_id}:${r.student_id}`)
    );

    if (!toNotify.length) return new Response("all reminders already sent", { status: 200 });

    // Get student notification preferences from user_profiles
    const { data: profiles } = await sb
      .from("user_profiles")
      .select("id, email_notifications")
      .in("id", studentIds);

    const prefsMap = new Map((profiles || []).map(p => [p.id, p.email_notifications || {}]));

    // Get class names for better notification messages
    const classIds = uniq(rows.map(r => r.class_id));
    const { data: classes } = await sb
      .from("classes")
      .select("id, name")
      .in("id", classIds);

    const classNameMap = new Map((classes || []).map(c => [c.id, c.name]));

    let notificationsSent = 0;

    // Send notifications
    for (const row of toNotify) {
      const studentPrefs = prefsMap.get(row.student_id) || {};
      // Default to true if no preference set
      if (studentPrefs.assignment_due_reminder === false) continue;

      const className = classNameMap.get(row.class_id) || "Class";
      const dueDate = new Date(row.due_at);
      const formattedDue = dueDate.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });

      // Create in-app notification
      const { error: notifErr } = await sb
        .from("notifications")
        .insert({
          user_id: row.student_id,
          type: "assignment_due_soon",
          title: "Assignment Due Soon",
          message: `"${row.title}" in ${className} is due ${formattedDue}`,
          metadata: {
            assignmentId: row.assignment_id,
            assignmentTitle: row.title,
            className: className,
            dueAt: row.due_at
          }
        });

      if (notifErr) {
        console.error(`Failed to create notification for student ${row.student_id}:`, notifErr);
        continue;
      }

      // Record that we sent this reminder
      await sb.from("due_date_reminder_notifications").insert({
        assignment_id: row.assignment_id,
        student_id: row.student_id
      });

      notificationsSent++;
    }

    return new Response(`sent ${notificationsSent} reminders`, { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response(`error: ${(e as Error)?.message || e}`, { status: 500 });
  }
});
