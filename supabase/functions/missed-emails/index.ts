// supabase/functions/missed-emails/index.ts
// Scheduled function that checks for missed assignments and sends notifications
// via the send-notification-email edge function

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

const uniq = <T>(arr: T[]) => [...new Set(arr)];

Deno.serve(async () => {
  try {
    const nowIso = new Date().toISOString();

    // Find all overdue, unsubmitted assignments
    const { data: rows, error: rerr } = await sb
      .from("assignment_gradebook")
      .select("assignment_id, student_id, due_at, title, class_id, is_submitted")
      .lt("due_at", nowIso)
      .eq("is_submitted", false);
    if (rerr) throw rerr;
    if (!rows?.length) return new Response("no missed", { status: 200 });

    const assignmentIds = uniq(rows.map(r => r.assignment_id));
    const studentIds = uniq(rows.map(r => r.student_id));

    // Get parent-child links
    const { data: links, error: lerr } = await sb
      .from("parent_child_links")
      .select("parent_id, child_id")
      .in("child_id", studentIds);
    if (lerr) throw lerr;
    if (!links?.length) return new Response("no guardians", { status: 200 });

    const parentIds = uniq(links.map(l => l.parent_id));

    // Check notification preferences
    const { data: prefs, error: perr } = await sb
      .from("notification_prefs")
      .select("user_id, child_late_assignment")
      .in("user_id", parentIds);
    if (perr) throw perr;

    // Build set of parents who explicitly opted OUT
    const optedOut = new Set((prefs || [])
      .filter(p => p.child_late_assignment === false)
      .map(p => p.user_id));

    // Get parent emails and student names
    const { data: parents } = await sb
      .from("user_profiles")
      .select("id, email, first_name, last_name")
      .in("id", parentIds);
    const { data: students } = await sb
      .from("user_profiles")
      .select("id, first_name, last_name")
      .in("id", studentIds);

    const parentEmail = new Map((parents || []).map(p => [p.id, p.email]));
    const studentName = new Map((students || [])
      .map(s => [s.id, [s.first_name, s.last_name].filter(Boolean).join(" ") || "Student"]));

    // Check which notifications were already sent (dedup)
    const { data: already } = await sb
      .from("missed_assignment_notifications")
      .select("assignment_id, student_id, parent_id")
      .in("assignment_id", assignmentIds)
      .in("student_id", studentIds)
      .in("parent_id", parentIds);

    const sentKey = new Set((already || [])
      .map(x => `${x.assignment_id}:${x.student_id}:${x.parent_id}`));

    // Group missed assignments by student
    const rowsByStudent = new Map<string, typeof rows>();
    rows.forEach(r => {
      const list = rowsByStudent.get(r.student_id) || [];
      list.push(r);
      rowsByStudent.set(r.student_id, list);
    });

    // Build per-parent notification payloads
    const toSend = new Map<string, Array<{ student_id: string; items: typeof rows }>>();
    for (const link of links || []) {
      if (optedOut.has(link.parent_id)) continue;
      const items = (rowsByStudent.get(link.child_id) || [])
        .filter(r => !sentKey.has(`${r.assignment_id}:${link.child_id}:${link.parent_id}`));
      if (!items.length) continue;
      const bucket = toSend.get(link.parent_id) || [];
      bucket.push({ student_id: link.child_id, items });
      toSend.set(link.parent_id, bucket);
    }

    if (!toSend.size) return new Response("nothing new", { status: 200 });

    // Send notifications via send-notification-email function
    for (const [parent_id, buckets] of toSend) {
      const email = parentEmail.get(parent_id);

      // Build template data for missed_assignment
      const studentsData = buckets.map(b => ({
        name: studentName.get(b.student_id) || "Student",
        assignments: b.items.map(it => ({
          title: it.title || "Assignment",
          due_date: new Date(it.due_at || "").toLocaleString()
        }))
      }));

      // Build in-app notification message
      const totalMissed = buckets.reduce((sum, b) => sum + b.items.length, 0);
      const childNames = buckets.map(b => studentName.get(b.student_id) || "Student").join(", ");
      const notifMessage = totalMissed === 1
        ? `${childNames} has 1 missed assignment`
        : `${childNames} ${buckets.length > 1 ? 'have' : 'has'} ${totalMissed} missed assignments`;

      // Create in-app notification for parent
      const { error: notifErr } = await sb
        .from("notifications")
        .insert({
          user_id: parent_id,
          type: "child_late_assignment",
          title: "Missed Assignment Alert",
          message: notifMessage,
          metadata: {
            students: studentsData,
            totalMissed
          }
        });

      if (notifErr) {
        console.error(`Failed to create in-app notification for ${parent_id}:`, notifErr);
      }

      // Send email notification
      if (email) {
        const { error: invokeErr } = await sb.functions.invoke("send-notification-email", {
          body: {
            record: {
              recipient_email: email,
              subject: "Missed Assignment Alert",
              template: "missed_assignment",
              data: { students: studentsData }
            }
          }
        });

        if (invokeErr) {
          console.error(`Failed to send email to ${email}:`, invokeErr);
        }
      }

      // Record sent notifications to prevent duplicates
      for (const b of buckets) {
        for (const it of b.items) {
          await sb.from("missed_assignment_notifications").insert({
            assignment_id: it.assignment_id,
            student_id: b.student_id,
            parent_id
          });
        }
      }
    }

    return new Response("ok", { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response(`error: ${(e as Error)?.message || e}`, { status: 500 });
  }
});
