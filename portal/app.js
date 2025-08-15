// --- Supabase client (ESM) ---
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// Optional: expose for quick console testing
window.sb = sb;

//import { sb } from './supabaseClient.js';

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
  const h = raw.split('?')[0]; // strip query string
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

// Ensure header controls exist + are wired
(function ensureHeader() {
  const nav = document.getElementById('nav');
  if (!nav) return; // header not in DOM yet

  // Spacer
  if (!nav.querySelector('.nav-spacer')) {
    const spacer = document.createElement('span');
    spacer.className = 'nav-spacer';
    nav.appendChild(spacer);
  }

  // User badge
  let badge = document.getElementById('userBadge');
  if (!badge) {
    badge = document.createElement('span');
    badge.id = 'userBadge';
    badge.className = 'user-badge';
    nav.appendChild(badge);
  }

  // Dashboard button
  let mainBtn = document.getElementById('btnMain');
  if (!mainBtn) {
    mainBtn = document.createElement('button');
    mainBtn.id = 'btnMain';
    mainBtn.className = 'btn link small';
    mainBtn.textContent = 'Dashboard';
    nav.appendChild(mainBtn);
  }
  mainBtn.onclick = () => { window.location.href = '../'; };

  // Logout button (cyber-danger style)
  let outBtn = document.getElementById('btnLogout');
  if (!outBtn) {
    outBtn = document.createElement('button');
    outBtn.id = 'btnLogout';
    outBtn.className = 'btn link danger small';
    outBtn.textContent = 'Logout';
    nav.appendChild(outBtn);
  }
  outBtn.onclick = async () => {
    try { await sb.auth.signOut(); } finally { location.hash = '#/'; setTimeout(renderRoute, 0); }
  };
})();


// Hook up Main App + Logout controls once the DOM is ready
(function wireNav() {
  const mainBtn = document.getElementById('btnMain');
  const outBtn  = document.getElementById('btnLogout');
  if (!mainBtn || !outBtn) return;

  // Go back to OG app (one level above /portal/)
  mainBtn.addEventListener('click', () => { window.location.href = '../'; });

  // Sign out then return to portal Home (or change to '../' if you prefer)
  outBtn.addEventListener('click', async () => {
    try { await sb.auth.signOut(); } catch {}
    location.hash = '#/';
    setTimeout(renderRoute, 0);
  });
})();

// --- User badge in header ---
async function renderUserBadge() {
  const el = document.getElementById('userBadge');
  if (!el) return;

  try {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
      el.textContent = 'Guest';
      el.title = '';
      return;
    }

    // Try profiles first
    let prof = (await sb
      .from('profiles')
      .select('first_name,last_name,role,email')
      .eq('id', user.id)
      .maybeSingle()
    ).data;

    // Fallback to user_profiles (your OG table)
    if (!prof) {
      const up = (await sb
        .from('user_profiles')
        .select('first_name,last_name,user_type,email')
        .eq('id', user.id)
        .maybeSingle()
      ).data;
      if (up) prof = { first_name: up.first_name, last_name: up.last_name, role: up.user_type, email: up.email };
    }

    const name = [prof?.first_name, prof?.last_name].filter(Boolean).join(' ') || user.email || 'User';
    const role = (prof?.role || '').toUpperCase();

    el.innerHTML = ''; // clear
    const nameSpan = document.createElement('span');
    nameSpan.textContent = name;
    el.appendChild(nameSpan);

    if (role) {
      const r = document.createElement('span');
      r.className = 'role';
      r.textContent = role;
      el.appendChild(r);
    }

    el.title = user.email || '';
  } catch (e) {
    // keep it quiet; just show guest
    const el = document.getElementById('userBadge');
    if (el) { el.textContent = 'Guest'; el.title = ''; }
  }
}

// Run once now, and on auth changes
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderUserBadge);
} else {
  renderUserBadge();
}
sb.auth.onAuthStateChange?.(() => { renderUserBadge(); });


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

/* Classes: teacher list + student/parent list (no "null" labels) */
async function Classes(app) {
  const prof = await currentProfile();
  if (!prof) { app.innerHTML = `<div class="card">Please sign in.</div>`; return; }

  app.innerHTML = '';
  const wrap = h('div', { class: 'col' });
  app.append(h('div', { class: 'card' }, [ h('h2', {}, 'Classes') ]));
  app.append(wrap);

  // Helper: make safe text (never "null"/"undefined")
  const txt = (v) => (v === null || v === undefined) ? '' : String(v);

  if (prof.role === 'teacher') {
    // Teacher: list classes I teach
    const card = h('div', { class: 'card' }, []);
    wrap.append(card);

    const { data: classes, error } = await sb
      .from('classes')
      .select('*')
      .eq('teacher_id', prof.id)
      .order('created_at', { ascending: false });

    if (error) {
      card.append(h('small', { class: 'muted' }, `Error: ${error.message}`));
      return;
    }
    if (!classes?.length) {
      card.append(h('small', { class: 'muted' }, 'No classes yet.'));
      return;
    }

    classes.forEach(c => {
      const row = h('div', { class: 'row', style: 'align-items:center; gap:12px; margin:6px 0;' }, [
        h('div', { style: 'flex:1;' }, [
          h('div', { style: 'font-weight:600' }, txt(c.name)),
          c.section ? h('div', { class: 'muted' }, txt(c.section)) : null
        ]),
        h('button', { class: 'btn', onclick: () => { location.hash = `#/class/${c.id}`; setTimeout(renderRoute,0); } }, 'Open')
      ]);
      card.append(row);
    });

  } else {
    // Student/Parent: list classes I'm enrolled in (no "null" tag to the right of Open)
    const card = h('div', { class: 'card' }, []);
    wrap.append(card);

    // 1) Find my class IDs
    const { data: links, error: lerr } = await sb
      .from('class_students')
      .select('class_id')
      .eq('student_id', prof.id);
    if (lerr) {
      card.append(h('small', { class: 'muted' }, `Error: ${lerr.message}`));
      return;
    }
    const ids = [...new Set((links || []).map(r => r.class_id))];
    if (!ids.length) {
      card.append(h('small', { class: 'muted' }, 'No classes yet.'));
      return;
    }

    // 2) Load classes
    const { data: classes, error: cerr } = await sb
      .from('classes')
      .select('*')
      .in('id', ids)
      .order('created_at', { ascending: false });
    if (cerr) {
      card.append(h('small', { class: 'muted' }, `Error: ${cerr.message}`));
      return;
    }

    // 3) Map teacher names (optional label)
    const teacherIds = [...new Set(classes.map(c => c.teacher_id).filter(Boolean))];
    let teacherMap = new Map();
    if (teacherIds.length) {
      const infoMap = await fetchUserInfoMap(teacherIds); // returns id -> {name, role}
      teacherMap = infoMap;
    }

    classes.forEach(c => {
      const teacherName = teacherMap.get(c.teacher_id)?.name || ''; // <-- never "null"
      const row = h('div', { class: 'row', style: 'align-items:center; gap:12px; margin:6px 0;' }, [
        h('div', { style: 'flex:1;' }, [
          h('div', { style: 'font-weight:600' }, txt(c.name)),
          teacherName ? h('div', { class: 'muted' }, teacherName) : null
        ]),
        // Right side: ONLY the Open button — no trailing label that could show "null"
        h('button', { class: 'btn', onclick: () => { location.hash = `#/class/${c.id}`; setTimeout(renderRoute,0); } }, 'Open')
      ]);
      card.append(row);
    });
  }
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

  /* Teacher: creator with Start/Finish + Points + roster checkboxes */
  if (prof.role === 'teacher' && cls.teacher_id === prof.id) {
    // fetch roster for THIS class
    let roster = [];
    try {
      const { data: links } = await sb
        .from('class_students')
        .select('student_id')
        .eq('class_id', cls.id);
  
      const ids = [...new Set((links || []).map(r => r.student_id))];
      if (ids.length) {
        const { data: people } = await sb
          .from('profiles')
          .select('id, first_name, last_name, email')
          .in('id', ids)
          .order('last_name');
        roster = people || [];
      }
    } catch {}
  
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
        h('div', { class: 'col' }, [
          h('label', { for: 'aPoints' }, 'Points (optional)'),
          h('input', { id: 'aPoints', type: 'number', step: '0.01', placeholder: 'Points possible' })
        ])
      ]),
      h('div', { class: 'col' }, [
        h('textarea', { id: 'aDesc', placeholder: 'Description (optional)' }),
        h('textarea', { id: 'aSyllabus', placeholder: 'Syllabus JSON (optional)' })
      ]),
  
      // Assign controls
      (() => {
        const wrap = h('div', { class: 'col' });
        const allChk = h('input', { type: 'checkbox', id: 'aAll', checked: true });
        const allLbl = h('label', {}, [ allChk, ' Assign to all students' ]);
        wrap.append(allLbl);
  
        // checkbox list (hidden when Assign to all is checked)
        const listWrap = h('div', { id: 'aSelectWrap', style: 'display:none; margin-top:8px' });
        if (roster.length) {
          listWrap.append(h('div', { class: 'muted' }, 'Select students:'));
          const grid = h('div', { class: 'col' });
          roster.forEach(s => {
            grid.append(
              h('label', { class: 'checkline' }, [
                h('input', { type: 'checkbox', value: s.id, class: 'aStu' }),
                ` ${s.first_name} ${s.last_name} (${s.email})`
              ])
            );
          });
          listWrap.append(grid);
        } else {
          listWrap.append(h('small', { class: 'muted' }, 'No students in this class yet.'));
        }
        allChk.onchange = (e) => { listWrap.style.display = e.target.checked ? 'none' : ''; };
        wrap.append(listWrap);
        return wrap;
      })(),
  
      h('div', { class: 'row' }, [
        h('button', {
          class: 'btn',
          onclick: async () => {
            try {
              const title = document.getElementById('aTitle').value.trim();
              if (!title) return alert('Title required');
  
              const description = document.getElementById('aDesc').value.trim() || null;
              const startRaw = document.getElementById('aStart').value || null;
              const dueRaw   = document.getElementById('aDue').value || null;
              const pointsRaw = document.getElementById('aPoints').value || null;
  
              const start_at = startRaw ? new Date(startRaw).toISOString() : null;
              const due_at   = dueRaw   ? new Date(dueRaw).toISOString()   : null;
              if (start_at && due_at && new Date(start_at) > new Date(due_at)) {
                return alert('Start must be before Finish.');
              }
  
              const points_possible = pointsRaw === '' ? null : Number(pointsRaw);
              const assign_all = document.getElementById('aAll').checked;
  
              let syllabus = null;
              const txt = document.getElementById('aSyllabus').value.trim();
              if (txt) { try { syllabus = JSON.parse(txt); } catch { return alert('Syllabus must be valid JSON.'); } }
  
              // If custom selection, collect student IDs
              let selectedIds = [];
              if (!assign_all) {
                selectedIds = Array.from(document.querySelectorAll('.aStu:checked')).map(el => el.value);
                if (!selectedIds.length) return alert('Select at least one student or choose "Assign to all".');
              }
  
              const { data, error } = await sb.from('assignments').insert({
                class_id: cls.id, title, description, syllabus, due_at, start_at,
                assign_all, points_possible, created_by: prof.id
              }).select('id').single();
              if (error) throw error;
  
              if (!assign_all && selectedIds.length) {
                const rows = selectedIds.map(id => ({ assignment_id: data.id, student_id: id }));
                const { error: aerr } = await sb.from('assignment_assignees').insert(rows);
                if (aerr) throw aerr;
              }
  
              alert('Assignment created.');
              renderRoute();
            } catch (e) {
              alert('Error: ' + (e?.message || e));
            }
          }
        }, 'Create')
      ])
    ]);
  
    asgCard.append(create);
  }

/* List assignments */
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
      h('thead', {}, h('tr', {}, [
        'Title', 'Finish', 'Start', (prof.role === 'teacher' && cls.teacher_id === prof.id) ? 'Actions' : 'Status'
      ].map(c => h('th', {}, c)))),
      h('tbody', {}, await Promise.all(assignments.map(async (a) => {
        const cells = [
          h('td', {}, a.title),
          h('td', {}, fmtDate(a.due_at)),
          h('td', {}, fmtDate(a.start_at || a.created_at))
        ];

        if (prof.role === 'teacher' && cls.teacher_id === prof.id) {
          // Teacher actions (upload supplemental files, later: view submissions)
          const act = h('td', {});
          act.append(h('button', { class: 'btn link small', onclick: () => uploadClassFile(a.id) }, 'Upload file'));
          // View submissions (open simple list dialog)
          act.append(h('button', { class: 'btn small', style: 'margin-left:8px', onclick: () =>  openSubmissionsModal(a.id, a.title) }, 'View submissions'));
          cells.push(act);
        } else if (prof.role === 'student') {
        // Student status + submit/resubmit + grade view
          const statusTd = h('td', {}, h('small', { class: 'muted' }, 'Loading…'));
        
          (async () => {
            const [{ data: sub }, { data: grade }] = await Promise.all([
              sb.from('assignment_submissions')
                .select('*').eq('assignment_id', a.id).eq('student_id', prof.id).maybeSingle(),
              sb.from('assignment_grades')
                .select('points, comment, published')
                .eq('assignment_id', a.id).eq('student_id', prof.id).maybeSingle()
            ]);
        
            statusTd.innerHTML = '';
        
            if (grade?.published) {
              const top = h('div', {});
              top.append(
                h('div', {}, `Score: ${grade.points ?? 0}${a.points_possible ? ` / ${a.points_possible}` : ''}`)
              );
              if (grade.comment) {
                top.append(h('div', { class: 'muted' }, `Feedback: ${grade.comment}`));
              }
              statusTd.append(top);
            }
        
            if (sub) {
              const row = h('div', {});
              row.append(h('div', {}, `Submitted ${fmtDate(sub.submitted_at)}`));
              if (sub.file_path) {
                row.append(await downloadLink('class-files', sub.file_path, 'View file'));
              }
              statusTd.append(row);
        
              const actions = h('div', { class: 'row', style: 'margin-top:6px' });
              actions.append(
                h('button', { class: 'btn small', onclick: () => submitAssignmentFile(a.id, prof.id) }, 'Resubmit file'),
                h('button', { class: 'btn link small', onclick: () => submitAssignmentText(a.id, prof.id) }, 'Add/Update text')
              );
              statusTd.append(actions);
            } else {
              const actions = h('div', { class: 'row' });
              actions.append(
                h('button', { class: 'btn small', onclick: () => submitAssignmentFile(a.id, prof.id) }, 'Submit file'),
                h('button', { class: 'btn link small', onclick: () => submitAssignmentText(a.id, prof.id) }, 'Submit text')
              );
              statusTd.append(actions);
            }
          })();
        
          cells.push(statusTd);
        } else {
          // Parent (read-only)
          cells.push(h('td', {}, h('small', { class: 'muted' }, '—')));
        }

        return h('tr', {}, cells);
      })))
    ]);
    asgCard.append(table);
  }

  /* ---------- Gradebook (teacher only) ---------- */
if (prof.role === 'teacher' && cls.teacher_id === prof.id) {
  const gbCard = h('div', { class: 'card' }, [ h('h3', {}, 'Gradebook') ]);
  wrap.append(gbCard);

  try {
    // Pull the full gradebook view for this class (created in SQL)
    const { data: gb, error } = await sb
      .from('assignment_gradebook')
      .select('*')
      .eq('class_id', cls.id);
    if (error) throw error;

    if (!gb?.length) {
      gbCard.append(h('small', { class: 'muted' }, 'No data yet — create an assignment and/or add students.'));
    } else {
      // Columns: distinct assignments (keep creation order stable via due_at, then title)
      const seenA = new Set();
      const cols = [];
      gb.sort((x,y) => (new Date(x.due_at||0)) - (new Date(y.due_at||0)) || String(x.title).localeCompare(String(y.title)));
      for (const r of gb) {
        if (!seenA.has(r.assignment_id)) {
          seenA.add(r.assignment_id);
          cols.push({ id: r.assignment_id, title: r.title, pts: r.points_possible ?? null, due_at: r.due_at });
        }
      }

      // Rows: distinct students (name map)
      const studentIds = [...new Set(gb.map(r => r.student_id))];
      const nameMap = await fetchUserInfoMap(studentIds); // id -> { name, role }
      const students = studentIds
        .map(id => ({ id, name: nameMap.get(id)?.name || 'Student' }))
        .sort((a,b) => a.name.localeCompare(b.name));

      // Index for quick cell lookup
      const key = (aid, sid) => `${aid}|${sid}`;
      const cell = new Map();
      gb.forEach(r => cell.set(key(r.assignment_id, r.student_id), r));

      // Toolbar
      const tools = h('div', { class: 'row', style: 'margin-bottom:8px; align-items:center; gap:8px;' }, [
        h('button', {
          class: 'btn small',
          onclick: async () => {
            await exportGradebookCSV(cols, students, cell);
          }
        }, 'Export CSV')
      ]);
      gbCard.append(tools);

      // Table
      const thead = h('thead', {}, h('tr', {}, [
        h('th', {}, 'Student'),
        ...cols.map(c => h('th', {}, `${c.title}${c.pts ? ` (${c.pts})` : ''}`))
      ]));
      const tbody = h('tbody', {}, students.map(st => {
        const tds = [ h('td', {}, st.name) ];
        for (const c of cols) {
          const r = cell.get(key(c.id, st.id));
          let content;
          if (!r) {
            content = h('small', { class: 'muted' }, '—'); // not assigned
          } else if (r.is_graded) {
            content = h('div', {}, [
              h('div', {}, `${r.points ?? 0}${c.pts ? ` / ${c.pts}` : ''}`),
              h('small', { class: 'muted' }, 'Graded')
            ]);
          } else if (r.is_submitted) {
            const label = 'Submitted' + (r.is_late ? ' (Late)' : '');
            content = h('div', {}, h('small', {}, label));
          } else {
            content = h('small', { class: 'muted' }, 'Missing');
          }

          const td = h('td', {}, [
            content,
            h('div', {}, h('button', {
              class: 'btn link small',
              onclick: () => openGradeDrawer(c, st, r) // pass assignment col, student, and row (may be undefined)
            }, 'Grade'))
          ]);
          tds.push(td);
        }
        return h('tr', {}, tds);
      }));

      const table = h('table', {}, [ thead, tbody ]);
      gbCard.append(table);
    }
  } catch (e) {
    gbCard.append(h('small', { class: 'muted' }, `Error: ${e.message || e}`));
  }

    // ---- Grade drawer (modal) ----
    function openGradeDrawer(assignCol, student, row) {
      let modal = document.getElementById('gradeDrawer');
      if (!modal) {
        modal = h('div', { id: 'gradeDrawer', class: 'modal-overlay' }, [
          h('div', { class: 'modal', style: 'max-width:560px' }, [
            h('div', { class: 'modal-head' }, [
              h('h3', { id: 'gradeTitle' }, 'Grade'),
              h('span', { class: 'spacer' }),
              h('button', { class: 'btn link danger small', onclick: closeGradeDrawer }, 'Close')
            ]),
            h('div', { id: 'gradeBody', class: 'modal-body' }, 'Loading…')
          ])
        ]);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeGradeDrawer(); });
        window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeGradeDrawer(); });
        document.body.appendChild(modal);
      }
      document.getElementById('gradeTitle').textContent = `Grade — ${assignCol.title} • ${student.name}`;
      document.getElementById('gradeBody').innerHTML = 'Loading…';
      modal.style.display = 'flex';
      renderGradeDrawer(assignCol, student);
    }
  
    function closeGradeDrawer() {
      const m = document.getElementById('gradeDrawer');
      if (m) m.style.display = 'none';
    }
  
    async function renderGradeDrawer(assignCol, student) {
      const body = document.getElementById('gradeBody');
      if (!body) return;
  
      // Pull latest submission + grade
      const [{ data: sub }, { data: g }, { data: aRow }] = await Promise.all([
        sb.from('assignment_submissions').select('submitted_at, file_path, text_response')
          .eq('assignment_id', assignCol.id).eq('student_id', student.id).maybeSingle(),
        sb.from('assignment_grades').select('points, comment, published')
          .eq('assignment_id', assignCol.id).eq('student_id', student.id).maybeSingle(),
        sb.from('assignments').select('points_possible, due_at').eq('id', assignCol.id).single()
      ]);
  
      const ptsMax = aRow?.points_possible ?? null;
  
      const nodes = [];
      nodes.push(h('div', { class: 'muted' }, `Student: ${student.name}`));
      nodes.push(h('div', { class: 'muted' }, `Assignment: ${assignCol.title}${ptsMax ? ` (${ptsMax})` : ''}`));
      nodes.push(h('div', { class: 'muted' }, `Due: ${fmtDate(aRow?.due_at)}`));
  
      if (sub?.submitted_at || sub?.file_path || sub?.text_response) {
        nodes.push(h('h4', {}, 'Submission'));
        nodes.push(h('div', {}, sub?.submitted_at ? `Submitted ${fmtDate(sub.submitted_at)}` : '—'));
        if (sub?.file_path) nodes.push(await downloadLink('class-files', sub.file_path, 'Open file'));
        if (sub?.text_response) nodes.push(h('pre', { class: 'subs-pre' }, sub.text_response));
      } else {
        nodes.push(h('h4', {}, 'Submission'));
        nodes.push(h('div', { class: 'muted' }, 'No submission'));
      }
  
      nodes.push(h('h4', {}, 'Grade'));
      const ptsInput = h('input', { type: 'number', id: 'gradePoints', placeholder: 'points', value: (g?.points ?? '') });
      if (ptsMax != null) { ptsInput.min = 0; ptsInput.max = ptsMax; step='0.01'; }
      const cmtInput = h('textarea', { id: 'gradeComment', placeholder: 'Comment (optional)' }, g?.comment || '');
      const pubChk   = h('label', {}, [
        h('input', { type: 'checkbox', id: 'gradePublished', checked: !!g?.published }),
        ' Published'
      ]);
      const saveBtn  = h('button', {
        class: 'btn',
        onclick: async () => {
          const points = ptsInput.value === '' ? null : Number(ptsInput.value);
          const comment = (cmtInput.value || '').trim() || null;
          const published = !!document.getElementById('gradePublished').checked;
          const { error } = await sb.rpc('upsert_grade', {
            p_assignment: assignCol.id,
            p_student: student.id,
            p_points: points,
            p_comment: comment,
            p_published: published
          });
          if (error) return alert(error.message);
          alert('Saved.');
          closeGradeDrawer();
          renderRoute(); // refresh grid
        }
      }, 'Save');
  
      nodes.push(h('div', { class: 'col', style: 'gap:6px' }, [ ptsInput, cmtInput, pubChk, saveBtn ]));
  
      body.innerHTML = ''; body.append(...nodes);
    }
  
    // CSV export helper (teacher)
    async function exportGradebookCSV(cols, students, cell) {
      const ids = students.map(s => s.id);
      const nameMap = new Map(students.map(s => [s.id, s.name]));
      const header = ['Student', ...cols.map(c => c.title)];
      const rows = [header];
  
      for (const st of students) {
        const line = [nameMap.get(st.id)];
        for (const c of cols) {
          const r = cell.get(`${c.id}|${st.id}`);
          if (!r) { line.push(''); continue; }
          if (r.is_graded) line.push(String(r.points ?? 0));
          else if (r.is_submitted) line.push('Submitted');
          else line.push('Missing');
        }
        rows.push(line);
      }
  
      const csv = rows.map(r =>
        r.map(x => /[",\n]/.test(x) ? `"${String(x).replace(/"/g,'""')}"` : String(x)).join(',')
      ).join('\n');
  
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'gradebook.csv'; a.click();
      URL.revokeObjectURL(url);
    }
  }
} catch (e) {
  asgCard.append(h('small', { class: 'muted' }, `Error loading assignments: ${e.message || e}`));
}

/* Teacher helper: upload supplemental file for an assignment */
async function uploadClassFile(assignmentId) {
  const file = await pickFile(); 
  if (!file) return;
  const path = `${assignmentId}/supp-${Date.now()}-${file.name}`;
  const { data, error } = await sb.storage.from('class-files').upload(path, file);
  if (error) return alert(error.message);
  await sb.from('assignment_files').insert({ assignment_id: assignmentId, file_path: data.path, uploaded_by: prof.id });
  alert('File uploaded.');
}

/* ===== Submissions Modal (teacher) ===== */
function openSubmissionsModal(assignmentId, title = 'Submissions') {
  let modal = document.getElementById('subsModal');
  if (!modal) {
    modal = h('div', { id: 'subsModal', class: 'modal-overlay', tabindex: '-1' }, [
      h('div', { class: 'modal' }, [
        h('div', { class: 'modal-head' }, [
          h('h3', { id: 'subsTitle' }, ''),
          h('span', { class: 'spacer' }),
          h('button', { class: 'btn link small', onclick: () => renderSubmissionsModal(assignmentId, title) }, 'Refresh'),
          h('button', { class: 'btn link danger small', onclick: closeSubmissionsModal }, 'Close')
        ]),
        h('div', { id: 'subsBody', class: 'modal-body' }, 'Loading…')
      ])
    ]);
    document.body.appendChild(modal);

    // close on overlay click or ESC
    modal.addEventListener('click', (e) => { if (e.target === modal) closeSubmissionsModal(); });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSubmissionsModal(); });
  }

  document.getElementById('subsTitle').textContent = `Submissions — ${title || ''}`;
  document.getElementById('subsBody').innerHTML = 'Loading…';
  modal.style.display = 'flex';
  renderSubmissionsModal(assignmentId, title);
}

function closeSubmissionsModal() {
  const m = document.getElementById('subsModal');
  if (m) m.style.display = 'none';
}

async function renderSubmissionsModal(assignmentId) {
  const body = document.getElementById('subsBody');
  if (!body) return;

  const { data: subs, error } = await sb
    .from('assignment_submissions')
    .select('id, student_id, submitted_at, text_response, file_path')
    .eq('assignment_id', assignmentId)
    .order('submitted_at', { ascending: false });

  if (error) { body.innerHTML = `<small class="muted">Error: ${error.message}</small>`; return; }
  if (!subs?.length) { body.innerHTML = '<small class="muted">No submissions yet.</small>'; return; }

  const ids = [...new Set(subs.map(s => s.student_id))];
  const nameMap = await fetchUserInfoMap(ids);
  const { data: aRow } = await sb.from('assignments').select('title, points_possible, due_at').eq('id', assignmentId).single();

  const list   = h('div', { class: 'subs-list' });
  const detail = h('div', { class: 'subs-detail' }, [ h('div', { class: 'muted' }, 'Select a submission') ]);
  const split  = h('div', { class: 'subs-split' }, [ list, detail ]);
  body.innerHTML = ''; body.append(split);

  for (const s of subs) {
    const nm = nameMap.get(s.student_id)?.name || 'Student';
    const row = h('div', { class: 'subs-row' }, [
      h('div', { class: 'subs-primary' }, [
        h('div', { class: 'subs-name' }, nm),
        h('div', { class: 'subs-time muted' }, fmtDate(s.submitted_at))
      ]),
      h('div', { class: 'subs-actions' }, [
        h('button', {
          class: 'btn small',
          onclick: async () => {
            const nodes = [];
            nodes.push(h('h4', {}, nm));
            nodes.push(h('div', { class: 'muted' }, `Submitted ${fmtDate(s.submitted_at)}`));

            if (s.text_response) {
              nodes.push(h('h5', {}, 'Text response'));
              nodes.push(h('pre', { class: 'subs-pre' }, s.text_response));
            }
            if (s.file_path) {
              nodes.push(h('h5', {}, 'File'));
              nodes.push(await downloadLink('class-files', s.file_path, 'Open file'));
            }

            // Current grade (if any)
            const { data: g } = await sb.from('assignment_grades')
              .select('points, comment, published')
              .eq('assignment_id', assignmentId)
              .eq('student_id', s.student_id)
              .maybeSingle();

            nodes.push(h('h5', {}, `Grade ${aRow.points_possible ? `(max ${aRow.points_possible})` : ''}`));
            const pts = h('input', { type: 'number', id: 'gPts', value: (g?.points ?? ''), placeholder: 'points' });
            if (aRow.points_possible != null) { pts.min = 0; pts.max = aRow.points_possible; step='0.01'; }
            const cmt = h('textarea', { id: 'gCmt', placeholder: 'Comment (optional)' }, g?.comment || '');
            const pub = h('label', {}, [
              h('input', { type: 'checkbox', id: 'gPub', checked: !!g?.published }),
              ' Published'
            ]);
            const save = h('button', {
              class: 'btn',
              onclick: async () => {
                const points = pts.value === '' ? null : Number(pts.value);
                const comment = (cmt.value || '').trim() || null;
                const published = !!document.getElementById('gPub').checked;
                const { error } = await sb.rpc('upsert_grade', {
                  p_assignment: assignmentId,
                  p_student: s.student_id,
                  p_points: points,
                  p_comment: comment,
                  p_published: published
                });
                if (error) return alert(error.message);
                alert('Saved.');
              }
            }, 'Save grade');

            nodes.push(h('div', { class: 'col', style: 'gap:6px; margin-top:8px' }, [ pts, cmt, pub, save ]));

            detail.innerHTML = ''; detail.append(...nodes);
          }
        }, 'Open')
      ])
    ]);
    list.append(row);
  }
}

/* Student helpers: Submit file / Submit text */
async function submitAssignmentFile(assignmentId, studentId) {
  try {
    const file = await pickFile(); if (!file) return;
    const path = `submissions/${assignmentId}/${studentId}/${Date.now()}-${file.name}`;
    const up = await sb.storage.from('class-files').upload(path, file);
    if (up.error) throw up.error;

    const row = {
      assignment_id: assignmentId,
      student_id: studentId,
      file_path: up.data.path,
      submitted_at: new Date().toISOString()
    };
    const { error } = await sb
      .from('assignment_submissions')
      .upsert(row, { onConflict: 'assignment_id,student_id' });
    if (error) throw error;

    alert('Submitted.');
    renderRoute();
  } catch (e) {
    alert('Upload failed: ' + (e?.message || e));
  }
}

async function submitAssignmentText(assignmentId, studentId) {
  const text = prompt('Enter your response text:') || '';
  if (!text.trim()) return;

  const row = {
    assignment_id: assignmentId,
    student_id: studentId,
    text_response: text.trim(),
    submitted_at: new Date().toISOString()
  };
  const { error } = await sb
    .from('assignment_submissions')
    .upsert(row, { onConflict: 'assignment_id,student_id' });
  if (error) return alert(error.message);

  alert('Submitted.');
  renderRoute();
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
    
      // Names only (no role labels)
      const ids = [...new Set((msgs || []).map(m => m.user_id))];
      const userMap = await fetchUserInfoMap(ids); // returns { name, role } but we’ll use .name only
    
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
          const info = userMap.get(m.user_id) || { name: 'Unknown' };
          const line = h(
            'div',
            { style: `margin-left:${depth * 16}px; display:flex; gap:8px; align-items:center;` },
            [
              h('span', { style: 'font-weight:600' }, `${info.name}:`),
              h('span', {}, m.content),
              h('button', {
                class: 'btn link small',
                onclick: () => {
                  replyTarget.set(threadId, { id: m.id, label: `${info.name}: ${short(m.content)}` });
                  updateReplyIndicator(`replyind-${threadId}`, replyTarget.get(threadId), () => { replyTarget.delete(threadId); });
                  const inp = document.getElementById(`input-${threadId}`); if (inp) inp.focus();
                }
              }, 'Reply'),
              ...(m.user_id === prof.id ? [
                h('button', {
                  class: 'btn link danger small',
                  onclick: async () => {
                    if (!confirm('Delete this message?')) return;
                    const { error } = await sb.from('messages').delete().eq('id', m.id);
                    if (error) return alert(error.message);
                    if (replyTarget.get(threadId)?.id === m.id) {
                      replyTarget.delete(threadId);
                      updateReplyIndicator(`replyind-${threadId}`, null);
                    }
                    await loadFlatThread(threadId, boxId, summaryEl);
                  }
                }, 'Delete')
              ] : [])
            ]
          );
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
        const info = map.get(m.user_id) || { name:'Unknown' };
        const row = h(
          'div',
          { style: `margin-left:${depth * 16}px; display:flex; gap:8px; align-items:center;` },
          [
            h('span', { style: 'font-weight:600' }, `${info.name}:`),
            h('span', {}, m.content),
            h('button', {
              class: 'btn link small',
              onclick: () => {
                replyTarget.id = m.id; replyTarget.label = `${info.name}: ${short(m.content)}`;
                updateReplyIndicator(indId, replyTarget, () => { replyTarget.id = null; replyTarget.label = null; });
                const inp = document.getElementById(inputId); if (inp) inp.focus();
              }
            }, 'Reply'),
            ...(m.user_id === prof.id ? [
              h('button', {
                class: 'btn link danger small',
                onclick: async () => {
                  if (!confirm('Delete this message?')) return;
                  const { error } = await sb.from('messages').delete().eq('id', m.id);
                  if (error) return alert(error.message);
                  if (replyTarget.id === m.id) { replyTarget.id = null; updateReplyIndicator(indId, null); }
                  await loadDm();
                }
              }, 'Delete')
            ] : [])
          ]
        );
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
// Shows "Replying to … [cancel]" in the indicator row.
function updateReplyIndicator(indId, target, onCancel) {
  const el = document.getElementById(indId);
  if (!el) return;

  if (!target || !target.id) {
    el.textContent = '';
    return;
  }
  el.innerHTML = `Replying to <b>${escapeHtml(target.label)}</b> `;
  const cancelBtn = h('button', {
    class: 'btn link small',   // cyber style
    onclick: () => {
      el.textContent = '';
      if (typeof onCancel === 'function') onCancel();
    }
  }, '[Cancel]');
  el.append(cancelBtn);
}

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

// Create a signed <a> link for a private storage file (60s default)
async function downloadLink(bucket, path, label = 'Download', expiresIn = 60) {
  const a = document.createElement('a');
  a.textContent = label;
  a.className = 'btn link small';
  try {
    const { data, error } = await sb.storage.from(bucket).createSignedUrl(path, expiresIn);
    if (error) throw error;
    a.href = data.signedUrl;
    a.target = '_blank';
  } catch {
    a.href = '#';
    a.onclick = (e) => { e.preventDefault(); alert('Cannot open file (no permission).'); };
  }
  return a;
}

async function pickFile() {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = () => resolve(input.files[0] || null);
    input.click();
  });
}
