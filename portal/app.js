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
    /* ---------- Threads (Class scope) + collapsible messages ---------- */
  const threadsCard = h('div', { class: 'card' }, [ h('h3', {}, 'Class Threads') ]);
  wrap.append(threadsCard);
  
  // New thread (teacher only)
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
        const threadBoxId = `msgs-${t.id}`;
  
        // Collapsible thread container
        const sum = h('summary', {}, t.title || '(no title)');
        const details = h('details', { open: true }, [
          sum,
          h('div', { id: threadBoxId }, h('small', { class: 'muted' }, 'Loading...')),
          h('div', { class: 'row' }, [
            h('input', { id: `msg-${t.id}`, placeholder: 'Write a message...' }),
            h('button', {
              class: 'btn',
              onclick: async () => {
                const input = document.getElementById(`msg-${t.id}`);
                const content = input?.value.trim();
                if (!content) return;
                const { error } = await sb.from('messages').insert({
                  thread_id: t.id, content, user_id: prof.id
                });
                if (error) return alert(error.message);
                input.value = '';
                await loadThread(t.id, threadBoxId, sum);
              }
            }, 'Send')
          ])
        ]);
  
        threadsCard.append(h('div', { class: 'thread' }, [ details ]));
        setTimeout(() => loadThread(t.id, threadBoxId, sum), 0);
      }
    }
  } catch (e) {
    threadsCard.append(h('small', { class: 'muted' }, `Error loading threads: ${e.message || e}`));
  }
  
  /* Helpers for threads */
  async function loadThread(threadId, boxId, summaryEl) {
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
  
    // Build name map (id -> "First Last" or email)
    const ids = [...new Set(msgs.map(m => m.user_id))];
    const nameMap = await fetchNameMap(ids);
  
    // Group by parent (threaded)
    box.innerHTML = '';
    const byParent = new Map();
    msgs.forEach(m => {
      const k = m.parent_id || 'root';
      if (!byParent.has(k)) byParent.set(k, []);
      byParent.get(k).push(m);
    });
  
    // Render root messages; each root is collapsible, replies nested
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
                const content = inp?.value.trim();
                if (!content) return;
                const { error } = await sb.from('messages').insert({
                  thread_id: threadId, content, user_id: prof.id, parent_id: m.id
                });
                if (error) return alert(error.message);
                if (inp) inp.value = '';
                await loadThread(threadId, boxId, summaryEl);
              }
            }, 'Reply')
          ])
        ]);
  
        // Collapsible for each message (root open by default)
        const msgNode = depth === 0
          ? h('details', { open: true, style: `margin-left:${depth * 16}px` }, [ h('summary', {}, header), content ])
          : h('details', { style: `margin-left:${depth * 16}px` }, [ h('summary', {}, header), content ]);
  
        box.append(msgNode);
        renderBranch(m.id, depth + 1);
      }
    }
    renderBranch(null, 0);
    summaryEl.textContent = updateSummary(summaryEl.textContent, msgs.length);
  }
  
  async function fetchNameMap(ids) {
    if (!ids?.length) return new Map();
    const { data } = await sb
      .from('profiles')
      .select('id, first_name, last_name, email')
      .in('id', ids);
    const map = new Map();
    (data || []).forEach(p => {
      const name = [p.first_name, p.last_name].filter(Boolean).join(' ') || p.email || 'Unknown';
      map.set(p.id, name);
    });
    return map;
  }
  
  function updateSummary(base, count) {
    // e.g., "Algebra Thread" -> "Algebra Thread (3)"
    const b = base.replace(/\s\(\d+\)$/, '');
    return `${b} (${count})`;
  }
}

/* Messaging: DMs between teacher and student/parent  — collapsible, with names */
    async function Messaging(app) {
      const prof = await currentProfile();
      if (!prof) { app.innerHTML = `<div class="card">Please sign in.</div>`; return; }
    
      const container = h('div', { class: 'card' }, [ h('h2', {}, 'Direct Messages') ]);
      app.innerHTML = ''; app.append(container);
    
      // Recipient picker
      if (prof.role === 'teacher') {
        container.append(h('p', {}, 'Start a DM with a student or parent.'));
        const { data: people } = await sb
          .from('profiles')
          .select('id, first_name, last_name, role')
          .in('role', ['student','parent'])
          .order('last_name');
    
        const sel = h('select', { id: 'selDM' }, [
          h('option', { value: '' }, '-- choose recipient --')
        ]);
        (people || [])
          .filter(p => p.id !== prof.id)
          .forEach(p => sel.append(h('option', { value: p.id }, `${p.first_name} ${p.last_name} (${p.role})`)));
    
        container.append(h('div', { class: 'row' }, [
          sel,
          h('button', {
            class: 'btn',
            onclick: async () => {
              const userId = sel.value; if (!userId) return;
              const { data: threadId, error } = await sb.rpc('get_or_create_dm_thread', { other_user: userId });
              if (error) return alert(error.message);
              location.hash = `#/messaging?thread=${threadId}`;
              setTimeout(renderRoute, 0);
            }
          }, 'Open DM')
        ]));
    
      } else {
        container.append(h('p', {}, 'Start a DM with a teacher.'));
        const { data: teachers } = await sb
          .from('profiles')
          .select('id, first_name, last_name, role')
          .eq('role', 'teacher')
          .order('last_name');
    
        const sel = h('select', { id: 'selDM' }, [
          h('option', { value: '' }, '-- choose teacher --')
        ]);
        (teachers || [])
          .filter(p => p.id !== prof.id)
          .forEach(p => sel.append(h('option', { value: p.id }, `${p.first_name} ${p.last_name}`)));
    
        container.append(h('div', { class: 'row' }, [
          sel,
          h('button', {
            class: 'btn',
            onclick: async () => {
              const userId = sel.value; if (!userId) return;
              const { data: threadId, error } = await sb.rpc('get_or_create_dm_thread', { other_user: userId });
              if (error) return alert(error.message);
              location.hash = `#/messaging?thread=${threadId}`;
              setTimeout(renderRoute, 0);
            }
          }, 'Open DM')
        ]));
      }
    
      // If a thread is selected via hash, render it (collapsible)
      const qs = new URLSearchParams((location.hash.split('?')[1] || ''));
      const threadId = qs.get('thread');
      if (!threadId) return;
    
      const convoId = `dm-${threadId}`;
      const header = h('summary', {}, 'Conversation');
      const convo = h('details', { open: true }, [
        header,
        h('div', { id: convoId }, h('small', { class: 'muted' }, 'Loading…')),
        h('div', { class: 'row' }, [
          h('input', { id: 'dmInput', placeholder: 'Write a message…' }),
          h('button', {
            class: 'btn',
            onclick: async () => {
              const inp = document.getElementById('dmInput');
              const content = inp?.value.trim(); if (!content) return;
              const { error } = await sb.from('messages').insert({
                thread_id: threadId, content, user_id: prof.id
              });
              if (error) return alert(error.message);
              inp.value = '';
              await loadDm(threadId, convoId, header);
            }
          }, 'Send')
        ])
      ]);
      container.append(convo);
      setTimeout(() => loadDm(threadId, convoId, header), 0);
    
      async function loadDm(threadId, boxId, summaryEl) {
        const box = document.getElementById(boxId);
        if (!box) return;
    
        const { data: msgs, error } = await sb
          .from('messages')
          .select('id, content, user_id, parent_id, created_at')
          .eq('thread_id', threadId)
          .order('created_at', { ascending: true });
    
        if (!box || !box.isConnected) return;
    
        if (error) { box.innerHTML = `<small class="muted">Error: ${error.message}</small>`; return; }
        if (!msgs?.length) { box.innerHTML = '<small class="muted">No messages yet.</small>'; summaryEl.textContent = updateSummary('Conversation', 0); return; }
    
        const ids = [...new Set(msgs.map(m => m.user_id))];
        const nameMap = await fetchNameMap(ids);
    
        // DM: also collapsible per root message
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
                h('input', { id: `dm-reply-${m.id}`, placeholder: 'Reply…' }),
                h('button', {
                  class: 'btn secondary',
                  onclick: async () => {
                    const inp = document.getElementById(`dm-reply-${m.id}`);
                    const text = inp?.value.trim(); if (!text) return;
                    const { error } = await sb.from('messages').insert({
                      thread_id: threadId, content: text, user_id: prof.id, parent_id: m.id
                    });
                    if (error) return alert(error.message);
                    if (inp) inp.value = '';
                    await loadDm(threadId, boxId, summaryEl);
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
        summaryEl.textContent = updateSummary('Conversation', msgs.length);
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
async function pickFile() {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = () => resolve(input.files[0] || null);
    input.click();
  });
}
