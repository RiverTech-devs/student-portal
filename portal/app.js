// web/app.js
// Minimal SPA: Dashboard, Classes, Class Detail, Messaging, Analytics
// Requires: <script src="https://esm.sh/@supabase/supabase-js@2"></script> in hosting page OR use an import map.
// Here we assume supabase is globally available (loaded in index.html via script tag on your site).
// In this generated scaffold, we import supabase via the global created in supabaseClient.js.

import { sb } from './supabaseClient.js';

// Simple hash router
const routes = {
  '': Dashboard,
  '#/': Dashboard,
  '#/classes': Classes,
  '#/class': ClassDetail,      // expects #/class/:id
  '#/messaging': Messaging,
  '#/analytics': Analytics,    // expects #/analytics/:classId
  '#/profile': Profile
};

const nav = document.getElementById('nav');
nav.innerHTML = `
  <a href="#/" data-route>Home</a>
  <a href="#/classes" data-route>Classes</a>
  <a href="#/messaging" data-route>Messaging</a>
  <a href="#/profile" data-route>Profile</a>
`;

window.addEventListener('hashchange', renderRoute);
window.addEventListener('load', renderRoute);

function routeKey() {
  const raw = location.hash || '#/';
  const h = raw.split('?')[0];                 // ← strip query string
  if (h.startsWith('#/class/')) return '#/class';
  if (h.startsWith('#/analytics/')) return '#/analytics';
  const parts = h.split('/');
  return parts.length <= 2 ? h : `#/${parts[1]}`;
}

async function renderRoute() {
  document.querySelectorAll('#nav a').forEach(a => a.classList.remove('active'));
  const key = routeKey();
  const link = Array.from(document.querySelectorAll('#nav a')).find(a => a.getAttribute('href').startsWith(key));
  if (link) link.classList.add('active');
  const page = routes[key] || Dashboard;
  const app = document.getElementById('app');
  app.innerHTML = `<div class="card"><small class="muted">Loading...</small></div>`;
  await page(app);
}

/* Utilities */
function h(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'class') el.className = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v);
  }
  for (const c of (Array.isArray(children) ? children : [children])) {
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

function fmtDate(dt) { if (!dt) return '-'; const d = new Date(dt); return d.toLocaleString(); }

async function currentProfile() {
  // Get the signed-in user
  const { data } = await sb.auth.getUser();
  const user = data?.user;
  if (!user) return null;

  // 1) Try the portal's profiles table first
  let profRes = await sb
    .from('profiles')
    .select('id, email, role, first_name, last_name')
    .eq('id', user.id)
    .maybeSingle();

  if (profRes?.data) return profRes.data;

  // 2) Fall back to your OG table (user_profiles → user_type)
  const upRes = await sb
    .from('user_profiles')
    .select('id, email, user_type, first_name, last_name')
    .eq('id', user.id)
    .maybeSingle();

  if (!upRes?.data) {
    // Still nothing: keep the UI message, but log the reason for you
    console.warn('No profile found in profiles or user_profiles for', user.id, upRes?.error);
    return null;
  }

  // 3) Map and upsert into profiles so portal works going forward
  const mapped = {
    id: upRes.data.id,
    email: upRes.data.email,
    role: upRes.data.user_type,                 // teacher | student | parent
    first_name: upRes.data.first_name || '',
    last_name:  upRes.data.last_name  || ''
  };

  // RLS policy in policies.sql allows users to upsert their own profile
  const upsert = await sb.from('profiles').upsert(mapped);
  if (upsert.error) {
    console.warn('profiles upsert failed (RLS?)', upsert.error);
    // Even if upsert fails, return the mapped profile so the UI can continue
    return mapped;
  }

  return mapped;
}


async function listStudents() {
  const { data, error } = await sb.from('profiles').select('id, first_name, last_name, email').eq('role', 'student').order('last_name');
  if (error) throw error;
  return data || [];
}

async function listMyClasses(role, userId) {
  if (role === 'teacher') {
    const { data } = await sb.from('classes').select('*').eq('teacher_id', userId).order('created_at', { ascending: false });
    return data || [];
  } else if (role === 'student') {
    const { data } = await sb.from('class_students').select('classes(*)').eq('student_id', userId);
    return (data || []).map(r => r.classes);
  } else {
    // Parent: classes of their children (read-only)
    const { data: kids } = await sb.from('student_parents').select('student_id').eq('parent_id', userId);
    const studentIds = (kids || []).map(k => k.student_id);
    if (!studentIds.length) return [];
    const { data } = await sb.from('class_students').select('classes(*)').in('student_id', studentIds);
    return (data || []).map(r => r.classes);
  }
}

/* Dashboard */
async function Dashboard(app) {
  const prof = await currentProfile();
  app.innerHTML = '';
  app.append(h('div', { class: 'card' }, [
    h('h2', {}, `Welcome${prof ? `, ${prof.first_name}` : ''}`),
    h('p', {}, 'Use the navigation to manage classes, assignments, messaging, and analytics.'),
  ]));
}

/* Profile: Parent prefs */
async function Profile(app) {
  const prof = await currentProfile();
  if (!prof) {
    app.innerHTML = `<div class="card">Please sign in.</div>`;
    return;
  }
  const { data: prefs } = await sb.from('notification_prefs').select('*').eq('user_id', prof.id).maybeSingle();
  const p = prefs || { user_id: prof.id, email_reports: false, email_missed_assignments: false };

  const card = h('div', { class: 'card' }, [
    h('h2', {}, 'Profile & Notifications'),
    h('p', {}, `Role: ${prof.role}`),
    h('div', { class: 'row' }, [
      h('label', {}, [
        h('input', { type: 'checkbox', id: 'chkReports', checked: p.email_reports ? true : false }),
        ' Email me grade reports'
      ]),
      h('label', {}, [
        h('input', { type: 'checkbox', id: 'chkMissed', checked: p.email_missed_assignments ? true : false }),
        ' Email me when assignments are missed'
      ]),
      h('button', { class: 'btn', onclick: async () => {
        const email_reports = document.getElementById('chkReports').checked;
        const email_missed_assignments = document.getElementById('chkMissed').checked;
        const upsert = { user_id: prof.id, email_reports, email_missed_assignments };
        const { error } = await sb.from('notification_prefs').upsert(upsert);
        if (error) return alert(error.message);
        alert('Preferences saved.');
      }}, 'Save')
    ])
  ]);
  app.innerHTML = '';
  app.append(card);
}

/* Classes */
async function Classes(app) {
  const prof = await currentProfile();
  if (!prof) { app.innerHTML = `<div class="card">Please sign in.</div>`; return; }

  const container = h('div', { class: 'card' });
  container.append(h('h2', {}, 'Classes'));

  // Teacher tools
  if (prof.role === 'teacher') {
    const createCard = h('div', { class: 'card' }, [
      h('h3', {}, 'Create Class'),
      h('div', { class: 'row' }, [
        h('input', { id: 'clsName', placeholder: 'Class name' }),
        h('button', { class: 'btn', onclick: async () => {
          const name = document.getElementById('clsName').value.trim();
          if (!name) return;
          const { error } = await sb.from('classes').insert({ name, teacher_id: prof.id });
          if (error) return alert(error.message);
          renderRoute();
        }}, 'Create')
      ])
    ]);
    container.append(createCard);
  }

  // List classes
  const classes = await listMyClasses(prof.role, prof.id);
  if (!classes.length) {
    container.append(h('p', {}, 'No classes yet.'));
  } else {
    const list = h('div');
    for (const c of classes) {
      const row = h('div', { class: 'card' }, [
        h('div', { class: 'row' }, [
          h('div', { class: 'col' }, [
            h('strong', {}, c.name),
            h('small', { class: 'muted' }, `Created ${fmtDate(c.created_at)}`)
          ]),
          h('div', { style: 'margin-left:auto' }, [
            h('a', { class: 'btn secondary', href: `#/class/${c.id}` }, 'Open'),
            prof.role === 'teacher' ? h('a', { class: 'btn', href: `#/analytics/${c.id}`, style: 'margin-left:8px' }, 'Analytics') : null
          ])
        ])
      ]);
      list.append(row);
    }
    container.append(list);
  }

  app.innerHTML = '';
  app.append(container);
}

/* Class Detail (robust) */
async function ClassDetail(app) {
  try {
    const prof = await currentProfile();
    if (!prof) { app.innerHTML = `<div class="card">Please sign in.</div>`; return; }

    const classId = (location.hash.split('?')[0]).split('/')[2]; // strip ?query
    if (!classId) { app.innerHTML = `<div class="card">Invalid class ID.</div>`; return; }

    // Load class row
    const { data: cls, error: clsErr } = await sb.from('classes').select('*').eq('id', classId).single();
    if (clsErr || !cls) { app.innerHTML = `<div class="card">Class not found.</div>`; return; }

    // Mount shell first
    const wrap = h('div');
    wrap.append(h('div', { class: 'card' }, [ h('h2', {}, cls.name) ]));
    app.innerHTML = '';
    app.append(wrap);

    /* ---------- Roster (teacher only) ---------- */
    if (prof.role === 'teacher' && cls.teacher_id === prof.id) {
      const rosterCard = h('div', { class: 'card' }, [ h('h3', {}, 'Roster'), h('small', { class: 'muted' }, 'Loading roster…') ]);
      wrap.append(rosterCard);

      try {
        const { data: links } = await sb.from('class_students').select('student_id').eq('class_id', cls.id);
        const ids = (links || []).map(r => r.student_id);
        let students = [];
        if (ids.length) {
          const { data: names } = await sb.from('profiles').select('id, first_name, last_name').in('id', ids);
          students = names || [];
        }
        const allStudents = await listStudents();

        rosterCard.innerHTML = '';
        rosterCard.append(
          h('h3', {}, 'Roster'),
          students.length
            ? h('div', {}, students.map(s => h('div', {}, `${s.first_name} ${s.last_name}`)))
            : h('small', { class: 'muted' }, 'No students yet.'),
          h('details', {}, [
            h('summary', {}, 'Add students'),
            h('div', { class: 'row' }, [
              (() => {
                const sel = h('select', { id: 'selStudent' }, [ h('option', { value: '' }, '-- choose student --') ]);
                (allStudents || []).forEach(s => sel.append(h('option', { value: s.id }, `${s.first_name} ${s.last_name}`)));
                return sel;
              })(),
              h('button', {
                class: 'btn',
                onclick: async () => {
                  const student_id = document.getElementById('selStudent').value;
                  if (!student_id) return;
                  const { error } = await sb.from('class_students').insert({ class_id: cls.id, student_id });
                  if (error) return alert(error.message);
                  renderRoute();
                }
              }, 'Add')
            ])
          ])
        );
      } catch (e) {
        rosterCard.innerHTML = '';
        rosterCard.append(h('h3', {}, 'Roster'), h('small', { class: 'muted' }, `Error: ${e.message || e}`));
      }
    }

    /* ---------- Assignments ---------- */
    const asgCard = h('div', { class: 'card' }, [ h('h3', {}, 'Assignments') ]);
    wrap.append(asgCard);

    // Creator (teacher only) — Start/Finish labels
    if (prof.role === 'teacher' && cls.teacher_id === prof.id) {
      const create = h('details', {}, [
        h('summary', {}, 'Create assignment'),
        h('div', { class: 'row' }, [
          h('input', { id: 'aTitle', placeholder: 'Title' }),
          h('div', { class: 'col' }, [
            h('label', { for: 'aStart' }, 'Start (optional)'),
            h('input', { id: 'aStart', type: 'datetime-local', placeholder: 'Start (optional)' })
          ]),
          h('div', { class: 'col' }, [
            h('label', { for: 'aDue' }, 'Finish (optional)'),
            h('input', { id: 'aDue', type: 'datetime-local', placeholder: 'Finish (optional)' })
          ]),
        ]),
        h('div', { class: 'col' }, [
          h('textarea', { id: 'aDesc', placeholder: 'Description (optional)' }),
          h('textarea', { id: 'aSyllabus', placeholder: 'Syllabus JSON (optional)' }),
        ]),
        h('div', { class: 'row' }, [
          h('label', {}, [h('input', { type: 'checkbox', id: 'aAll', checked: true }), ' Assign to all students']),
          h('button', {
            class: 'btn',
            onclick: async () => {
              try {
                const title = document.getElementById('aTitle').value.trim();
                if (!title) return alert('Title required');

                const description = document.getElementById('aDesc').value.trim() || null;
                const startRaw = document.getElementById('aStart').value || null;
                const dueRaw   = document.getElementById('aDue').value || null;
                const start_at = startRaw ? new Date(startRaw).toISOString() : null;
                const due_at   = dueRaw   ? new Date(dueRaw).toISOString()   : null;
                if (start_at && due_at && new Date(start_at) > new Date(due_at)) {
                  return alert('Start must be before Finish.');
                }
                const assign_all = document.getElementById('aAll').checked;

                let syllabus = null;
                const txt = document.getElementById('aSyllabus').value.trim();
                if (txt) {
                  try { syllabus = JSON.parse(txt); }
                  catch { return alert('Syllabus must be valid JSON (or leave it blank).'); }
                }

                const { data, error } = await sb.from('assignments').insert({
                  class_id: cls.id, title, description, syllabus, due_at, start_at, assign_all, created_by: prof.id
                }).select('id').single();
                if (error) throw error;

                if (!assign_all) {
                  const emails = prompt('Enter student emails (comma separated) to assign:') || '';
                  const arr = emails.split(',').map(e => e.trim()).filter(Boolean);
                  if (arr.length) {
                    const { data: stu } = await sb.from('profiles').select('id, email').in('email', arr).eq('role', 'student');
                    const rows = (stu || []).map(s => ({ assignment_id: data.id, student_id: s.id }));
                    if (rows.length) await sb.from('assignment_assignees').insert(rows);
                  }
                }
                alert('Assignment created.');
                renderRoute();
              } catch (e) { alert('Error: ' + (e?.message || e)); }
            }
          }, 'Create')
        ])
      ]);
      asgCard.append(create);
    }

    // List assignments
    try {
      const { data: assignments, error: aerr } = await sb
        .from('assignments')
        .select('*')
        .eq('class_id', cls.id)
        .order('created_at', { ascending: false });
      if (aerr) throw aerr;

      if (!assignments?.length) {
        asgCard.append(h('small', { class: 'muted' }, 'No assignments.'));
      } else {
        const table = h('table', {}, [
          h('thead', {}, h('tr', {}, [ 'Title', 'Finish', 'Start', 'Actions' ].map(c => h('th', {}, c)))),
          h('tbody', {}, assignments.map(a => {
            const actionsTd = h('td', {});
            if (prof.role === 'teacher' && cls.teacher_id === prof.id) {
              actionsTd.append(h('button', { class: 'btn secondary', onclick: () => uploadClassFile(a.id) }, 'Upload file'));
            }
            return h('tr', {}, [
              h('td', {}, a.title),
              h('td', {}, fmtDate(a.due_at)),
              h('td', {}, fmtDate(a.start_at || a.created_at)),
              actionsTd
            ]);
          }))
        ]);
        asgCard.append(table);
      }
    } catch (e) {
      asgCard.append(h('small', { class: 'muted' }, `Error loading assignments: ${e.message || e}`));
    }

    /* ---------- Threads (Class scope) — collapsible, flat lines with Reply/Delete ---------- */
    const threadsCard = h('div', { class: 'card' }, [ h('h3', {}, 'Class Threads') ]);
    wrap.append(threadsCard);
    
    // Reply target per thread (so the bottom input can reply to a specific message)
    const replyTarget = new Map(); // threadId -> { id, label }
    
    if (prof.role === 'teacher' && cls.teacher_id === prof.id) {
      threadsCard.append(
        h('div', { class: 'row' }, [
          h('input', { id: 'thrTitle', placeholder: 'Thread title (optional)' }),
          h('button', {
            class: 'btn',
            onclick: async () => {
              const title = document.getElementById('thrTitle').value.trim() || null;
              const { error } = await sb.from('threads').insert({
                scope: 'class', class_id: cls.id, title, created_by: prof.id
              });
              if (error) return alert(error.message);
              renderRoute();
            }
          }, 'New Thread')
        ])
      );
    }
    
    try {
      const { data: threads, error: terr } = await sb
        .from('threads')
        .select('*')
        .eq('class_id', cls.id)
        .eq('scope', 'class')
        .order('created_at', { ascending: false });
    
      if (terr) throw terr;
    
      if (!threads?.length) {
        threadsCard.append(h('small', { class: 'muted' }, 'No threads yet.'));
      } else {
        for (const t of threads) {
          const boxId   = `msgs-${t.id}`;
          const inputId = `input-${t.id}`;
          const indId   = `replyind-${t.id}`;
    
          const summary = h('summary', {}, t.title || '(no title)');
          const convo = h('details', { open: true }, [
            summary,
            h('div', { id: boxId }, h('small', { class: 'muted' }, 'Loading…')),
            // Reply indicator + composer at the bottom (like your mock)
            h('div', { class: 'row', style: 'margin-top:8px' }, [
              h('small', { id: indId, class: 'muted', style: 'flex:1' }, ''), // "Replying to Name: … [cancel]"
            ]),
            h('div', { class: 'row' }, [
              h('input', { id: inputId, placeholder: 'Write a message…', style: 'flex:1' }),
              h('button', {
                class: 'btn',
                onclick: async () => {
                  const el = document.getElementById(inputId);
                  const text = el?.value.trim(); if (!text) return;
    
                  const parent = replyTarget.get(t.id)?.id || null;
                  const { error } = await sb.from('messages').insert({
                    thread_id: t.id, content: text, user_id: prof.id, parent_id: parent
                  });
                  if (error) return alert(error.message);
                  if (el) el.value = '';
                  replyTarget.delete(t.id);
                  updateReplyIndicator(indId, null);
                  await loadFlatThread(t.id, boxId, summary);
                }
              }, 'Send')
            ])
          ]);
    
          threadsCard.append(h('div', { class: 'thread' }, [ convo ]));
          setTimeout(() => loadFlatThread(t.id, boxId, summary), 0);
        }
      }
    } catch (e) {
      threadsCard.append(h('small', { class: 'muted' }, `Error loading threads: ${e.message || e}`));
    }
    
    /* helper: render a thread with flat lines + names, Reply/Delete */
    async function loadFlatThread(threadId, boxId, summaryEl) {
      const box = document.getElementById(boxId); if (!box) return;
    
      const { data: msgs, error } = await sb
        .from('messages')
        .select('id, content, user_id, parent_id, created_at')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });
    
      if (!box || !box.isConnected) return;
      if (error) { box.innerHTML = `<small class="muted">Error: ${error.message}</small>`; return; }
    
      // Names (First Last or email) + role
      const ids = [...new Set((msgs || []).map(m => m.user_id))];
      const userMap = await fetchUserInfoMap(ids);
    
      if (!msgs?.length) {
        box.innerHTML = '<small class="muted">No messages yet.</small>';
        summaryEl.textContent = updateSummary(summaryEl.textContent, 0);
        return;
      }
    
      // Group by parent for indentation
      box.innerHTML = '';
      const byParent = new Map();
      msgs.forEach(m => {
        const k = m.parent_id || 'root';
        if (!byParent.has(k)) byParent.set(k, []);
        byParent.get(k).push(m);
      });
    
      const renderBranch = (parentId, depth = 0) => {
        const arr = byParent.get(parentId || 'root') || [];
        for (const m of arr) {
          const info = userMap.get(m.user_id) || { name: 'Unknown', role: '' };
          const label = info.role ? `${info.role}:` : `${info.name}:`;
          const line = h('div', { style: `margin-left:${depth * 16}px; display:flex; gap:8px; align-items:center;` }, [
            h('span', { style: 'font-weight:600' }, label),
            h('span', {}, m.content),
            h('button', {
              class: 'btn link',
              onclick: () => {
                replyTarget.set(threadId, { id: m.id, label: `${info.name}: ${short(m.content)}` });
                updateReplyIndicator(`replyind-${threadId}`, replyTarget.get(threadId));
                const inp = document.getElementById(`input-${threadId}`); if (inp) inp.focus();
              }
            }, 'Reply'),
            ...(m.user_id === prof.id ? [
              h('button', {
                class: 'btn link danger',
                onclick: async () => {
                  if (!confirm('Delete this message?')) return;
                  const { error } = await sb.from('messages').delete().eq('id', m.id);
                  if (error) return alert(error.message);
                  // If we were replying to this, clear target
                  if (replyTarget.get(threadId)?.id === m.id) {
                    replyTarget.delete(threadId);
                    updateReplyIndicator(`replyind-${threadId}`, null);
                  }
                  await loadFlatThread(threadId, boxId, summaryEl);
                }
              }, 'Delete')
            ] : [])
          ]);
    
          box.append(line);
          renderBranch(m.id, depth + 1);
        }
      };
      renderBranch(null, 0);
      summaryEl.textContent = updateSummary(summaryEl.textContent, msgs.length);
    }
    
    // tiny helpers for reply indicator + name maps
    function updateReplyIndicator(indId, target) {
      const el = document.getElementById(indId);
      if (!el) return;
      if (!target) { el.textContent = ''; return; }
      el.innerHTML = `Replying to <b>${escapeHtml(target.label)}</b> &nbsp;`;
      const cancel = h('button', { class: 'btn link', onclick: () => { el.textContent = ''; } }, '[cancel]');
      el.append(cancel);
    }
    // Message renderer (safe + collapsible)
    async function loadMessages(threadId, boxId, summaryEl) {
      const box = document.getElementById(boxId);
      if (!box) return;

      const { data: msgs, error } = await sb
        .from('messages')
        .select('id, content, user_id, parent_id, created_at')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (!box || !box.isConnected) return;

      if (error) { box.innerHTML = `<small class="muted">Error: ${error.message}</small>`; return; }
      if (!msgs?.length) { box.innerHTML = '<small class="muted">No messages yet.</small>'; summaryEl.textContent = updateSummary(summaryEl.textContent, 0); return; }

      const ids = [...new Set(msgs.map(m => m.user_id))];
      const nameMap = await fetchNameMap(ids);

      box.innerHTML = '';
      const byParent = new Map();
      msgs.forEach(m => {
        const k = m.parent_id || 'root';
        if (!byParent.has(k)) byParent.set(k, []);
        byParent.get(k).push(m);
      });

      function renderBranch(parentId, depth = 0) {
        const arr = byParent.get(parentId || 'root') || [];
        for (const m of arr) {
          const who = nameMap.get(m.user_id) || 'Unknown';
          const header = `${who} • ${fmtDate(m.created_at)}`;

          const content = h('div', {}, [
            h('p', {}, m.content),
            h('div', { class: 'row' }, [
              h('input', { id: `reply-${m.id}`, placeholder: 'Reply…' }),
              h('button', {
                class: 'btn secondary',
                onclick: async () => {
                  const inp = document.getElementById(`reply-${m.id}`);
                  const text = inp?.value.trim();
                  if (!text) return;
                  const { error } = await sb.from('messages').insert({
                    thread_id: threadId, content: text, user_id: prof.id, parent_id: m.id
                  });
                  if (error) return alert(error.message);
                  if (inp) inp.value = '';
                  await loadMessages(threadId, boxId, summaryEl);
                }
              }, 'Reply')
            ])
          ]);

          const node = depth === 0
            ? h('details', { open: true, style: `margin-left:${depth * 16}px` }, [ h('summary', {}, header), content ])
            : h('details', { style: `margin-left:${depth * 16}px` }, [ h('summary', {}, header), content ]);

          box.append(node);
          renderBranch(m.id, depth + 1);
        }
      }
      renderBranch(null, 0);
      summaryEl.textContent = updateSummary(summaryEl.textContent, msgs.length);
    }

    // File upload helper (teacher uploads to class-files)
    async function uploadClassFile(assignmentId) {
      const file = await pickFile();
      if (!file) return;
      const path = `${assignmentId}/${Date.now()}-${file.name}`;
      const { data, error } = await sb.storage.from('class-files').upload(path, file);
      if (error) return alert(error.message);
      await sb.from('assignment_files').insert({ assignment_id: assignmentId, file_path: data.path, uploaded_by: prof.id });
      alert('File uploaded.');
    }
  } catch (e) {
    console.error('ClassDetail failed:', e);
    app.innerHTML = `<div class="card">Error loading class: ${e.message || e}</div>`;
  }
}

/* Messaging: DMs between teacher and student/parent  — collapsible, with names */
    /* Messaging: DM inbox + flat conversation with names, Reply/Delete */
async function Messaging(app) {
  const prof = await currentProfile();
  if (!prof) { app.innerHTML = `<div class="card">Please sign in.</div>`; return; }
  app.innerHTML = '';

  const page = h('div', { class: 'col' });
  app.append(page);

  /* ---- A) DM Inbox (list all DM threads for me) ---- */
  const inbox = h('div', { class: 'card' }, [ h('h2', {}, 'Conversations') ]);
  page.append(inbox);

  // threads I'm in
  const { data: links } = await sb
    .from('thread_participants')
    .select('thread_id')
    .eq('user_id', prof.id);
  const tIds = [...new Set((links || []).map(x => x.thread_id))];

  if (!tIds.length) {
    inbox.append(h('small', { class: 'muted' }, 'No conversations yet.'));
  } else {
    // fetch the threads + latest messages + participants (2-step)
    const { data: th } = await sb.from('threads').select('id, created_at').in('id', tIds).eq('scope', 'dm');

    const { data: parts } = await sb
      .from('thread_participants')
      .select('thread_id, user_id')
      .in('thread_id', tIds);

    const { data: msgs } = await sb
      .from('messages')
      .select('id, thread_id, content, user_id, created_at')
      .in('thread_id', tIds)
      .order('created_at', { ascending: false });

    const latestByThread = new Map();
    const secondByThread = new Map();
    (msgs || []).forEach(m => {
      if (!latestByThread.has(m.thread_id)) latestByThread.set(m.thread_id, m);
      else if (!secondByThread.has(m.thread_id)) secondByThread.set(m.thread_id, m);
    });

    // name map for all participant ids
    const allUserIds = [...new Set((parts || []).map(p => p.user_id).concat((msgs || []).map(m => m.user_id)))];
    const userMap = await fetchUserInfoMap(allUserIds);

    (th || []).forEach(t => {
      const p = (parts || []).filter(x => x.thread_id === t.id);
      const others = p.map(x => x.user_id).filter(id => id !== prof.id);
      const otherName = userMap.get(others[0])?.name || 'Unknown';

      const top = latestByThread.get(t.id);
      const prev = secondByThread.get(t.id);

      // Row: "Other: preview...   [Open]"
      const row = h('div', { class: 'row', style: 'align-items:center; gap:12px; margin:6px 0;' }, [
        h('div', { style: 'flex:1;' }, [
          h('div', { style: 'font-weight:600' }, `${otherName}: ${short(top?.content || '')}`),
          prev ? h('div', { class: 'muted', style: 'margin-left:12px' }, `${userMap.get(prev.user_id)?.role || userMap.get(prev.user_id)?.name || 'User'}: ${short(prev.content)}`) : null
        ]),
        h('button', { class: 'btn', onclick: () => { location.hash = `#/messaging?thread=${t.id}`; setTimeout(renderRoute, 0); } }, 'Open')
      ]);
      inbox.append(row);
    });
  }

  /* ---- B) Start a new conversation ---- */
  const picker = h('div', { class: 'card' }, [ h('h3', {}, 'Start a new DM') ]);
  page.append(picker);

  if (prof.role === 'teacher') {
    const { data: people } = await sb
      .from('profiles')
      .select('id, first_name, last_name, role')
      .in('role', ['student','parent'])
      .order('last_name');
    const sel = h('select', { id: 'selDM' }, [ h('option', { value: '' }, '-- choose recipient --') ]);
    (people || []).filter(p => p.id !== prof.id).forEach(p => sel.append(h('option', { value: p.id }, `${p.first_name} ${p.last_name} (${p.role})`)));
    picker.append(h('div', { class: 'row' }, [
      sel,
      h('button', { class: 'btn', onclick: async () => {
        const id = sel.value; if (!id) return;
        const { data, error } = await sb.rpc('get_or_create_dm_thread', { other_user: id });
        if (error) return alert(error.message);
        location.hash = `#/messaging?thread=${data}`; setTimeout(renderRoute, 0);
      }}, 'Open DM')
    ]));
  } else {
    const { data: teachers } = await sb.from('profiles').select('id, first_name, last_name').eq('role','teacher').order('last_name');
    const sel = h('select', { id: 'selDM' }, [ h('option', { value: '' }, '-- choose teacher --') ]);
    (teachers || []).filter(p => p.id !== prof.id).forEach(p => sel.append(h('option', { value: p.id }, `${p.first_name} ${p.last_name}`)));
    picker.append(h('div', { class: 'row' }, [
      sel,
      h('button', { class: 'btn', onclick: async () => {
        const id = sel.value; if (!id) return;
        const { data, error } = await sb.rpc('get_or_create_dm_thread', { other_user: id });
        if (error) return alert(error.message);
        location.hash = `#/messaging?thread=${data}`; setTimeout(renderRoute, 0);
      }}, 'Open DM')
    ]));
  }

  /* ---- C) If a DM is selected, show it (flat lines) ---- */
  const qs = new URLSearchParams((location.hash.split('?')[1] || ''));
  const threadId = qs.get('thread');
  if (!threadId) return;

  const convoCard = h('div', { class: 'card' }, [ h('h3', {}, 'Conversation') ]);
  page.append(convoCard);

  const boxId   = `dm-${threadId}`;
  const inputId = `dmInput-${threadId}`;
  const indId   = `dm-replyind-${threadId}`;
  const summary = h('summary', {}, 'Conversation');

  const replyTarget = { id: null, label: null }; // DM-scoped

  const details = h('details', { open: true }, [
    summary,
    h('div', { id: boxId }, h('small', { class: 'muted' }, 'Loading…')),
    h('div', { class: 'row', style: 'margin-top:8px' }, [
      h('small', { id: indId, class: 'muted', style: 'flex:1' }, '')
    ]),
    h('div', { class: 'row' }, [
      h('input', { id: inputId, placeholder: 'Write a message…', style: 'flex:1' }),
      h('button', { class: 'btn', onclick: sendDm }, 'Send')
    ])
  ]);
  convoCard.append(details);
  setTimeout(loadDm, 0);

  async function loadDm() {
    const box = document.getElementById(boxId); if (!box) return;
    const { data: msgs, error } = await sb
      .from('messages')
      .select('id, content, user_id, parent_id, created_at')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });
    if (!box || !box.isConnected) return;

    if (error) { box.innerHTML = `<small class="muted">Error: ${error.message}</small>`; return; }
    if (!msgs?.length) { box.innerHTML = '<small class="muted">No messages yet.</small>'; summary.textContent = updateSummary('Conversation', 0); return; }

    const ids = [...new Set(msgs.map(m => m.user_id))];
    const map = await fetchUserInfoMap(ids);

    box.innerHTML = '';
    const byParent = new Map();
    msgs.forEach(m => {
      const k = m.parent_id || 'root';
      if (!byParent.has(k)) byParent.set(k, []);
      byParent.get(k).push(m);
    });

    const renderBranch = (parentId, depth = 0) => {
      const arr = byParent.get(parentId || 'root') || [];
      for (const m of arr) {
        const info = map.get(m.user_id) || { name:'Unknown', role:'' };
        const label = info.role ? `${info.role}:` : `${info.name}:`;
        const row = h('div', { style: `margin-left:${depth * 16}px; display:flex; gap:8px; align-items:center;` }, [
          h('span', { style: 'font-weight:600' }, label),
          h('span', {}, m.content),
          h('button', { class: 'btn link', onclick: () => {
            replyTarget.id = m.id; replyTarget.label = `${info.name}: ${short(m.content)}`;
            updateReplyIndicator(indId, replyTarget);
            const inp = document.getElementById(inputId); if (inp) inp.focus();
          }}, 'Reply'),
          ...(m.user_id === prof.id ? [
            h('button', { class: 'btn link danger', onclick: async () => {
              if (!confirm('Delete this message?')) return;
              const { error } = await sb.from('messages').delete().eq('id', m.id);
              if (error) return alert(error.message);
              if (replyTarget.id === m.id) { replyTarget.id = null; updateReplyIndicator(indId, null); }
              await loadDm();
            } }, 'Delete')
          ] : [])
        ]);
        box.append(row);
        renderBranch(m.id, depth + 1);
      }
    };
    renderBranch(null, 0);
    summary.textContent = updateSummary('Conversation', msgs.length);
  }

  async function sendDm() {
    const inp = document.getElementById(inputId);
    const text = inp?.value.trim(); if (!text) return;
    const { error } = await sb.from('messages').insert({
      thread_id: threadId, content: text, user_id: prof.id, parent_id: replyTarget.id || null
    });
    if (error) return alert(error.message);
    if (inp) inp.value = '';
    replyTarget.id = null; updateReplyIndicator(indId, null);
    await loadDm();
  }
}

async function ensureDmThread(userIds) {
  // Expect exactly 2 users: me + other
  const me = (await currentProfile())?.id;
  if (!me || !Array.isArray(userIds) || userIds.length !== 2) {
    throw new Error('Invalid participants.');
  }
  const other = userIds.find(id => id !== me);
  if (!other) throw new Error('Missing recipient.');

  // Ask Postgres to find or create the DM safely
  const { data, error } = await sb.rpc('get_or_create_dm_thread', { other_user: other });
  if (error) throw error;
  return data; // thread id
}

/* Analytics: per-class */
async function Analytics(app) {
  const prof = await currentProfile();
  if (!prof) { app.innerHTML = `<div class="card">Please sign in.</div>`; return; }
  const classId = (location.hash.split('?')[0]).split('/')[2];
  if (!classId) { app.innerHTML = `<div class="card">Missing class ID.</div>`; return; }

  // Verify access
  const { data: cls } = await sb.from('classes').select('*').eq('id', classId).single();
  if (!cls) { app.innerHTML = `<div class="card">Class not found.</div>`; return; }

  const wrap = h('div', { class: 'card' }, [ h('h2', {}, 'Analytics') ]);

  // Average per student
  const { data: grades } = await sb.from('class_grades').select('*').eq('class_id', classId);
  if (!grades || !grades.length) {
    wrap.append(h('small', { class: 'muted' }, 'No grades yet.'));
  } else {
    const { data: names } = await sb.from('profile_names').select('*').in('id', grades.map(g => g.student_id));
    const nameMap = new Map((names || []).map(n => [n.id, n.full_name]));
    const table = h('table', {}, [
      h('thead', {}, h('tr', {}, [ 'Student', 'Avg Grade', '# Graded', '# Submitted' ].map(c => h('th', {}, c)))),
      h('tbody', {}, grades.map(g => h('tr', {}, [
        h('td', {}, nameMap.get(g.student_id) || g.student_id),
        h('td', {}, g.avg_grade?.toFixed?.(2) ?? '-'),
        h('td', {}, String(g.graded_count || 0)),
        h('td', {}, String(g.total_submissions || 0)),
      ])))
    ]);
    wrap.append(table);
  }

  app.innerHTML = '';
  app.append(wrap);
}

/* Helpers */
async function fetchUserInfoMap(ids) {
  if (!ids?.length) return new Map();
  const { data } = await sb.from('profiles').select('id, first_name, last_name, email, role').in('id', ids);
  const map = new Map();
  (data || []).forEach(p => {
    const name = [p.first_name, p.last_name].filter(Boolean).join(' ') || p.email || 'User';
    const role = p.role ? (p.role[0].toUpperCase() + p.role.slice(1)) : '';
    map.set(p.id, { name, role });
  });
  return map;
}

function updateSummary(base, count) {
  const b = String(base).replace(/\s\(\d+\)$/, '');
  return `${b} (${count})`;
}

function short(s, n = 60) {
  s = s || '';
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

// tiny HTML escape for reply indicators
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

async function fetchNameMap(ids) {
  if (!ids?.length) return new Map();
  const { data } = await sb.from('profiles').select('id, first_name, last_name, email').in('id', ids);
  const map = new Map();
  (data || []).forEach(p => {
    const name = [p.first_name, p.last_name].filter(Boolean).join(' ') || p.email || 'Unknown';
    map.set(p.id, name);
  });
  return map;
}

function updateSummary(base, count) {
  const b = String(base).replace(/\s\(\d+\)$/, '');
  return `${b} (${count})`;
}

async function pickFile() {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = () => resolve(input.files[0] || null);
    input.click();
  });
}
