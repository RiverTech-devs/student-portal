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
  const h = location.hash || '#/';
  const parts = h.split('/');
  if (h.startsWith('#/class/')) return '#/class';
  if (h.startsWith('#/analytics/')) return '#/analytics';
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
  const { data } = await sb.auth.getUser();
  const user = data?.user;
  if (!user) return null;
  const { data: prof } = await sb.from('profiles').select('*').eq('id', user.id).single();
  return prof || null;
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

/* Class Detail */
async function ClassDetail(app) {
  const prof = await currentProfile();
  if (!prof) { app.innerHTML = `<div class="card">Please sign in.</div>`; return; }
  const classId = location.hash.split('/')[2];
  if (!classId) { app.innerHTML = `<div class="card">Invalid class ID.</div>`; return; }

  // Load class
  const { data: cls, error } = await sb.from('classes').select('*').eq('id', classId).single();
  if (error || !cls) { app.innerHTML = `<div class="card">Class not found.</div>`; return; }

  const wrap = h('div');
  wrap.append(h('div', { class: 'card' }, [ h('h2', {}, cls.name) ]));

  // Roster management (Teacher only)
  if (prof.role === 'teacher' && cls.teacher_id === prof.id) {
    const { data: roster } = await sb.from('class_students').select('student_id, profiles!inner(id, first_name, last_name)').eq('class_id', cls.id);
    const students = (roster || []).map(r => r.profiles);
    const allStudents = await listStudents();

    const rosterCard = h('div', { class: 'card' }, [
      h('h3', {}, 'Roster'),
      h('div', {}, students.length ? students.map(s => h('div', {}, `${s.first_name} ${s.last_name}`)) : h('small', { class: 'muted' }, 'No students yet.')),
      h('details', {}, [
        h('summary', {}, 'Add students'),
        h('div', { class: 'row' }, [
          (() => {
            const sel = h('select', { id: 'selStudent' }, [ h('option', { value: '' }, '-- choose student --') ]);
            allStudents.forEach(s => sel.append(h('option', { value: s.id }, `${s.first_name} ${s.last_name}`)));
            return sel;
          })(),
          h('button', { class: 'btn', onclick: async () => {
            const student_id = document.getElementById('selStudent').value;
            if (!student_id) return;
            const { error } = await sb.from('class_students').insert({ class_id: cls.id, student_id });
            if (error) return alert(error.message);
            renderRoute();
          }}, 'Add')
        ])
      ])
    ]);
    wrap.append(rosterCard);
  }

  // Assignments section (Teacher can create)
  const asgCard = h('div', { class: 'card' }, [ h('h3', {}, 'Assignments') ]);

  if (prof.role === 'teacher' && cls.teacher_id === prof.id) {
    const create = h('details', {}, [
      h('summary', {}, 'Create assignment'),
      h('div', { class: 'row' }, [
        h('input', { id: 'aTitle', placeholder: 'Title' }),
        h('input', { id: 'aDue', type: 'datetime-local', placeholder: 'Due (optional)' }),
        h('input', { id: 'aStart', type: 'datetime-local', placeholder: 'Start (optional)' }),
      ]),
      h('div', { class: 'col' }, [
        h('textarea', { id: 'aDesc', placeholder: 'Description (optional)' }),
        h('textarea', { id: 'aSyllabus', placeholder: 'Syllabus JSON (optional)' }),
      ]),
      h('div', { class: 'row' }, [
        h('label', {}, [h('input', { type: 'checkbox', id: 'aAll', checked: true }), ' Assign to all students']),
        h('button', { class: 'btn', onclick: async () => {
          try {
            const title = document.getElementById('aTitle').value.trim();
            if (!title) return alert('Title required');
            const description = document.getElementById('aDesc').value.trim() || null;
            const due_at = document.getElementById('aDue').value || null;
            const start_at = document.getElementById('aStart').value || null;
            const assign_all = document.getElementById('aAll').checked;
            let syllabus = document.getElementById('aSyllabus').value.trim();
            syllabus = syllabus ? JSON.parse(syllabus) : null;
            const { data, error } = await sb.from('assignments').insert({ class_id: cls.id, title, description, syllabus, due_at, start_at, assign_all, created_by: prof.id }).select('id').single();
            if (error) throw error;

            if (!assign_all) {
              // Prompt for custom students (comma-separated emails)
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
          } catch (e) {
            alert('Error: ' + e.message);
          }
        }}, 'Create')
      ])
    ]);
    asgCard.append(create);
  }

  // List assignments
  const { data: assignments } = await sb.from('assignments').select('*').eq('class_id', cls.id).order('created_at', { ascending: false });
  if (!assignments || !assignments.length) {
    asgCard.append(h('small', { class: 'muted' }, 'No assignments.'));
  } else {
    const table = h('table', {}, [
      h('thead', {}, h('tr', {}, [ 'Title', 'Due', 'Start', 'Actions' ].map(c => h('th', {}, c)))),
      h('tbody', {}, assignments.map(a => h('tr', {}, [
        h('td', {}, a.title),
        h('td', {}, fmtDate(a.due_at)),
        h('td', {}, fmtDate(a.start_at || a.created_at)),
        h('td', {}, [
          prof.role === 'teacher' ? h('button', { class: 'btn secondary', onclick: () => uploadClassFile(a.id) }, 'Upload file') : null,
          h('a', { class: 'btn', style: 'margin-left:8px', href: `#/analytics/${cls.id}` }, 'Analytics')
        ])
      ])))
    ]);
    asgCard.append(table);
  }
  wrap.append(asgCard);

  // Threads (Class scope) + subthreads
  const threadsCard = h('div', { class: 'card' }, [ h('h3', {}, 'Class Threads') ]);
  if (prof.role === 'teacher' && cls.teacher_id === prof.id) {
    threadsCard.append(h('div', { class: 'row' }, [
      h('input', { id: 'thrTitle', placeholder: 'Thread title (optional)' }),
      h('button', { class: 'btn', onclick: async () => {
        const title = document.getElementById('thrTitle').value.trim() || null;
        const { error } = await sb.from('threads').insert({ scope: 'class', class_id: cls.id, title, created_by: prof.id });
        if (error) return alert(error.message);
        renderRoute();
      }}, 'New Thread')
    ]));
  }

  const { data: threads } = await sb.from('threads').select('*').eq('class_id', cls.id).eq('scope','class').order('created_at', { ascending: false });
  if (!threads || !threads.length) {
    threadsCard.append(h('small', { class: 'muted' }, 'No threads yet.'));
  } else {
    for (const t of threads) {
      const threadEl = h('div', { class: 'thread' }, [
        h('strong', {}, t.title || '(no title)'),
        h('div', { id: `msgs-${t.id}` }, h('small', { class: 'muted' }, 'Loading...')),
        h('div', { class: 'row' }, [
          h('input', { id: `msg-${t.id}`, placeholder: 'Write a message...' }),
          h('button', { class: 'btn', onclick: async () => {
            const content = document.getElementById(`msg-${t.id}`).value.trim();
            if (!content) return;
            const { error } = await sb.from('messages').insert({ thread_id: t.id, content, user_id: prof.id });
            if (error) return alert(error.message);
            loadMessages(t.id);
          }}, 'Send')
        ])
      ]);
      threadsCard.append(threadEl);
      loadMessages(t.id);
    }
  }
  wrap.append(threadsCard);

  app.innerHTML = '';
  app.append(wrap);

  async function loadMessages(threadId) {
    const box = document.getElementById(`msgs-${threadId}`);
    const { data: msgs } = await sb.from('messages').select('*').eq('thread_id', threadId).order('created_at', { ascending: true });
    if (!msgs || !msgs.length) { box.innerHTML = '<small class="muted">No messages yet.</small>'; return; }
    box.innerHTML = '';
    const byParent = new Map();
    msgs.forEach(m => {
      const key = m.parent_id || 'root';
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key).push(m);
    });

    function renderThread(parentId, depth=0) {
      const arr = byParent.get(parentId || 'root') || [];
      for (const m of arr) {
        const msgEl = h('div', { style: `margin-left:${depth*16}px` }, [
          h('p', {}, m.content),
          h('small', { class: 'muted' }, fmtDate(m.created_at)),
          h('div', { class: 'row' }, [
            h('input', { id: `reply-${m.id}`, placeholder: 'Reply...' }),
            h('button', { class: 'btn secondary', onclick: async () => {
              const content = document.getElementById(`reply-${m.id}`).value.trim();
              if (!content) return;
              const { error } = await sb.from('messages').insert({ thread_id: threadId, content, user_id: (await currentProfile()).id, parent_id: m.id });
              if (error) return alert(error.message);
              loadMessages(threadId);
            }}, 'Reply')
          ])
        ]);
        box.append(msgEl);
        renderThread(m.id, depth+1);
      }
    }
    renderThread(null, 0);
  }

  async function uploadClassFile(assignmentId) {
    // Teachers upload to 'class-files'
    const file = await pickFile();
    if (!file) return;
    const path = `${assignmentId}/${Date.now()}-${file.name}`;
    const { data, error } = await sb.storage.from('class-files').upload(path, file);
    if (error) return alert(error.message);
    await sb.from('assignment_files').insert({ assignment_id: assignmentId, file_path: data.path, uploaded_by: (await currentProfile()).id });
    alert('File uploaded.');
  }
}

/* Messaging: DMs between teacher and student/parent */
async function Messaging(app) {
  const prof = await currentProfile();
  if (!prof) { app.innerHTML = `<div class="card">Please sign in.</div>`; return; }

  const container = h('div', { class: 'card' }, [ h('h2', {}, 'Direct Messages') ]);

  if (prof.role === 'teacher') {
    container.append(h('p', {}, 'Start a DM with a student or parent.'));
    const { data: people } = await sb.from('profiles').select('id, first_name, last_name, role').in('role', ['student','parent']).order('last_name');
    const sel = h('select', { id: 'selDM' }, [ h('option', { value: '' }, '-- choose recipient --') ]);
    (people || []).forEach(p => sel.append(h('option', { value: p.id }, `${p.first_name} ${p.last_name} (${p.role})`)));
    container.append(h('div', { class: 'row' }, [
      sel,
      h('button', { class: 'btn', onclick: async () => {
        const userId = sel.value;
        if (!userId) return;
        // Create or find DM thread with both users
        let threadId = await ensureDmThread([prof.id, userId]);
        location.hash = `#/messaging?thread=${threadId}`;
      }}, 'Open DM')
    ]));
  } else {
    // Students/Parents can only DM teachers
    const { data: teachers } = await sb.from('profiles').select('id, first_name, last_name, role').eq('role', 'teacher').order('last_name');
    const sel = h('select', { id: 'selDM' }, [ h('option', { value: '' }, '-- choose teacher --') ]);
    (teachers || []).forEach(p => sel.append(h('option', { value: p.id }, `${p.first_name} ${p.last_name}`)));
    container.append(h('div', { class: 'row' }, [
      sel,
      h('button', { class: 'btn', onclick: async () => {
        const userId = sel.value;
        if (!userId) return;
        const threadId = await ensureDmThread([prof.id, userId]);
        location.hash = `#/messaging?thread=${threadId}`;
      }}, 'Open DM')
    ]));
  }

  // If thread specified, render it
  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  const threadId = params.get('thread');
  if (threadId) {
    const box = h('div', { class: 'card' }, [ h('h3', {}, 'Conversation') ]);
    const msgs = h('div', { id: 'dmBox' }, h('small', { class: 'muted' }, 'Loading...'));
    const row = h('div', { class: 'row' }, [
      h('input', { id: 'dmText', placeholder: 'Type a message...' }),
      h('button', { class: 'btn', onclick: async () => {
        const content = document.getElementById('dmText').value.trim();
        if (!content) return;
        const { error } = await sb.from('messages').insert({ thread_id: threadId, content, user_id: prof.id });
        if (error) return alert(error.message);
        await loadDm();
        document.getElementById('dmText').value = '';
      }}, 'Send')
    ]);
    box.append(msgs, row);
    container.append(box);

    await loadDm();

    async function loadDm() {
      const { data: t } = await sb.from('threads').select('*').eq('id', threadId).single();
      if (!t || t.scope !== 'dm') { msgs.innerHTML = '<small class="muted">Thread not found.</small>'; return; }
      const { data: m } = await sb.from('messages').select('*').eq('thread_id', threadId).order('created_at', { ascending: true });
      msgs.innerHTML = '';
      (m || []).forEach(msg => {
        msgs.append(h('div', { class: 'thread' }, [
          h('p', {}, msg.content),
          h('small', { class: 'muted' }, fmtDate(msg.created_at))
        ]));
      });
    }
  }

  app.innerHTML = '';
  app.append(container);
}

async function ensureDmThread(userIds) {
  // Find existing DM thread with same participant set (size 2 only in this scaffold)
  const { data: threads } = await sb.from('threads').select('id').eq('scope', 'dm');
  if (threads && threads.length) {
    for (const t of threads) {
      const { data: parts } = await sb.from('thread_participants').select('user_id').eq('thread_id', t.id);
      const ids = (parts || []).map(p => p.user_id).sort();
      const want = [...userIds].sort();
      if (ids.length === want.length && ids.every((v, i) => v === want[i])) return t.id;
    }
  }
  // Create
  const { data: created, error } = await sb.from('threads').insert({ scope: 'dm', created_by: (await currentProfile()).id }).select('id').single();
  if (error) throw error;
  const rows = userIds.map(uid => ({ thread_id: created.id, user_id: uid }));
  await sb.from('thread_participants').insert(rows);
  return created.id;
}

/* Analytics: per-class */
async function Analytics(app) {
  const prof = await currentProfile();
  if (!prof) { app.innerHTML = `<div class="card">Please sign in.</div>`; return; }
  const classId = location.hash.split('/')[2];
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
async function pickFile() {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = () => resolve(input.files[0] || null);
    input.click();
  });
}
