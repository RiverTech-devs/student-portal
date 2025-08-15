// supabase/functions/missed-emails/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL  = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_KEY    = Deno.env.get("RESEND_API_KEY")!;
const MAIL_FROM     = Deno.env.get("MAIL_FROM") || "no-reply@yourdomain.com";

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: MAIL_FROM, to, subject, html }),
  });
  if (!res.ok) throw new Error(`Resend error ${res.status}: ${await res.text()}`);
}

const uniq = <T>(arr: T[]) => [...new Set(arr)];
function escapeHtml(s?: string) {
  return (s || "").replace(/[&<>"']/g, (c) => (
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as any)[c]
  ));
}

Deno.serve(async () => {
  try {
    const nowIso = new Date().toISOString();
    const { data: rows, error: rerr } = await sb
      .from("assignment_gradebook")
      .select("assignment_id, student_id, due_at, title, class_id, is_submitted")
      .lt("due_at", nowIso)
      .eq("is_submitted", false);
    if (rerr) throw rerr;
    if (!rows?.length) return new Response("no missed", { status: 200 });

    const assignmentIds = uniq(rows.map(r => r.assignment_id));
    const studentIds    = uniq(rows.map(r => r.student_id));

    const { data: links, error: lerr } = await sb
      .from("guardian_links")
      .select("parent_id, student_id")
      .in("student_id", studentIds);
    if (lerr) throw lerr;
    if (!links?.length) return new Response("no guardians", { status: 200 });

    const parentIds = uniq(links.map(l => l.parent_id));

    const { data: prefs, error: perr } = await sb
      .from("notification_settings")
      .select("user_id, miss_assignment_email, email_override")
      .in("user_id", parentIds);
    if (perr) throw perr;
    const opted = new Map((prefs || [])
      .filter(p => p.miss_assignment_email)
      .map(p => [p.user_id, p]));

    if (!opted.size) return new Response("no opted-in parents", { status: 200 });

    const { data: parents } = await sb
      .from("profiles")
      .select("id, email, first_name, last_name")
      .in("id", parentIds);
    const { data: students } = await sb
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", studentIds);

    const parentEmail = new Map((parents || []).map(p => [p.id, p.email]));
    const studentName = new Map((students || [])
      .map(s => [s.id, [s.first_name, s.last_name].filter(Boolean).join(" ") || "Student"]));

    const { data: already } = await sb
      .from("missed_assignment_notifications")
      .select("assignment_id, student_id, parent_id")
      .in("assignment_id", assignmentIds)
      .in("student_id", studentIds)
      .in("parent_id", parentIds);

    const sentKey = new Set((already || [])
      .map(x => `${x.assignment_id}:${x.student_id}:${x.parent_id}`));

    const rowsByStudent = new Map<string, typeof rows>();
    rows.forEach(r => {
      const list = rowsByStudent.get(r.student_id) || [];
      list.push(r);
      rowsByStudent.set(r.student_id, list);
    });

    const toSend = new Map<string, Array<{ student_id: string; items: typeof rows }>>();
    for (const link of links || []) {
      if (!opted.has(link.parent_id)) continue;
      const items = (rowsByStudent.get(link.student_id) || [])
        .filter(r => !sentKey.has(`${r.assignment_id}:${link.student_id}:${link.parent_id}`));
      if (!items.length) continue;
      const bucket = toSend.get(link.parent_id) || [];
      bucket.push({ student_id: link.student_id, items });
      toSend.set(link.parent_id, bucket);
    }

    if (!toSend.size) return new Response("nothing new", { status: 200 });

    for (const [parent_id, buckets] of toSend) {
      const pref = prefs?.find(p => p.user_id === parent_id);
      const email = pref?.email_override || parentEmail.get(parent_id);
      if (!email) continue;

      let html = `<div style="font-family:Inter,system-ui,Segoe UI,sans-serif">
        <h2>Missed assignments</h2>
        <p>The following assignments were not submitted by the due date.</p><ul>`;
      for (const b of buckets) {
        const sName = studentName.get(b.student_id) || "Student";
        html += `<li><strong>${sName}</strong><ul>`;
        for (const it of b.items) {
          const due = new Date(it.due_at || "").toLocaleString();
          html += `<li><b>${escapeHtml(it.title || "Assignment")}</b> — due ${due}</li>`;
        }
        html += `</ul></li>`;
      }
      html += `</ul><p>You’re receiving this because you opted in to missed assignment notifications.</p></div>`;

      await sendEmail(email, "Missed assignment alert", html);

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
    return new Response(`error: ${e?.message || e}`, { status: 500 });
  }
});
