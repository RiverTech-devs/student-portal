#!/usr/bin/env node
// Invite-link -> password-setup hand-off, driven end to end in a real browser.
//
// This flow broke twice and neither break was visible from the code alone, so it
// gets an end-to-end check rather than a static one. Needs a local server and a
// headless Chrome on 9333:
//   python -m http.server 8899
//   chrome --headless=new --remote-debugging-port=9333 --user-data-dir=/tmp/cdp-flow about:blank
//   node debug-tools/invite-flow-probe.js 8899
//
// Drives the REAL pages headless over CDP to answer two questions:
//   1. Does root index.html open the teacher password-setup modal when the
//      invite hand-off arrives WITH a fragment?
//   2. Does it open when the fragment is gone (the case that actually happens,
//      since supabase-js clears it) and only the persisted session remains?
//
// /auth/v1/* is stubbed so a fake session behaves like a real one. Everything
// else — index.html, shared/config.js, supabase.min.js — is the shipped code.
//
// Usage: node debug-tools/_flowprobe.js <port>
const PORT = process.argv[2] || '8899';
const BASE = `http://127.0.0.1:${PORT}`;
const CDP = 'http://127.0.0.1:9333';
const PROJECT_REF = 'joxvhzxkrcigknsdrusr';

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64')
  .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const now = Math.floor(Date.now() / 1000);
const JWT = b64({ alg: 'HS256', typ: 'JWT' }) + '.' +
  b64({ sub: '00000000-0000-0000-0000-000000000001', exp: now + 3600,
        email: 'newteacher@example.com', role: 'authenticated', aud: 'authenticated' }) + '.sig';

const USER = {
  id: '00000000-0000-0000-0000-000000000001',
  aud: 'authenticated', role: 'authenticated', email: 'newteacher@example.com',
  user_metadata: { first_name: 'Dana', last_name: 'Teacher', needs_password_setup: true },
  app_metadata: {}, created_at: new Date(0).toISOString(),
};
const SESSION = {
  access_token: JWT, refresh_token: 'refresh-abc', expires_in: 3600,
  expires_at: now + 3600, token_type: 'bearer', user: USER,
};
const PROFILE = {
  id: '00000000-0000-0000-0000-000000000002',
  auth_user_id: USER.id, email: USER.email, first_name: 'Dana', last_name: 'Teacher',
  user_type: 'teacher', account_status: 'active', rtc_balance: 0,
};

// Injected before ANY page script runs.
const bootstrap = (session, profile, user, ref) => `
(() => {
  const SESSION = ${JSON.stringify(session)};
  const PROFILE = ${JSON.stringify(profile)};
  const USER = ${JSON.stringify(user)};
  try {
    localStorage.setItem('sb-${ref}-auth-token', JSON.stringify(SESSION));
  } catch (e) {}
  window.__probe = [];
  const realFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    const J = (o, s) => new Response(JSON.stringify(o), { status: s || 200, headers: { 'Content-Type': 'application/json' } });
    if (/\\/auth\\/v1\\/user/.test(url))  { window.__probe.push('auth:user');  return J(USER); }
    if (/\\/auth\\/v1\\/token/.test(url)) { window.__probe.push('auth:token'); return J(SESSION); }
    if (/\\/rest\\/v1\\/user_profiles/.test(url)) {
      window.__probe.push('rest:user_profiles ' + ((init && init.method) || 'GET'));
      if (init && init.method && init.method !== 'GET') return J([PROFILE]);
      return J([PROFILE]);
    }
    if (/supabase\\.co/.test(url)) { window.__probe.push('rest:other ' + url.split('/rest/v1/')[1]); return J([]); }
    return realFetch(input, init);
  };
})();
`;

async function withPage(url, inject, dwellMs, evalExpr) {
  const targets = await (await fetch(`${CDP}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(targets.webSocketDebuggerUrl);
  let id = 0;
  const send = (method, params) => new Promise((res, rej) => {
    const myId = ++id;
    const onMsg = (e) => {
      const m = JSON.parse(e.data);
      if (m.id === myId) { ws.removeEventListener('message', onMsg); m.error ? rej(new Error(m.error.message)) : res(m.result); }
    };
    ws.addEventListener('message', onMsg);
    ws.send(JSON.stringify({ id: myId, method, params }));
  });
  await new Promise(r => ws.addEventListener('open', r));
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', { source: inject });
  await send('Page.navigate', { url });
  await new Promise(r => setTimeout(r, dwellMs));
  const out = await send('Runtime.evaluate', { expression: evalExpr, returnByValue: true, awaitPromise: false });
  ws.close();
  await fetch(`${CDP}/json/close/${targets.id}`).catch(() => {});
  return out.result.value;
}

const REPORT = `(() => {
  const modal = document.getElementById('modal-teacher-password-setup')
             || document.querySelector('[id^="modal-"]');
  const setupField = document.getElementById('setup-password');
  const loginVisible = !!document.getElementById('login-form') &&
                       !document.getElementById('login-form').classList.contains('hidden');
  return {
    hash: location.hash.length > 0,
    modalId: modal ? modal.id : null,
    setupFieldPresent: !!setupField,
    loginFormVisible: loginVisible,
    calls: (window.__probe || []).slice(0, 8),
  };
})()`;

(async () => {
  const inject = bootstrap(SESSION, PROFILE, USER, PROJECT_REF);

  console.log('CASE 1 — hand-off WITH fragment (what confirm.html now sends)');
  const withHash = await withPage(
    `${BASE}/index.html?setup_password=true#access_token=${JWT}&refresh_token=refresh-abc&type=signup`,
    inject, 6000, REPORT);
  console.log('   ', JSON.stringify(withHash));
  console.log('    -> setup modal opened:', withHash.setupFieldPresent ? 'YES' : 'NO');

  console.log('');
  console.log('CASE 2 — hand-off with NO fragment (session only)');
  const noHash = await withPage(
    `${BASE}/index.html?setup_password=true`, inject, 6000, REPORT);
  console.log('   ', JSON.stringify(noHash));
  console.log('    -> setup modal opened:', noHash.setupFieldPresent ? 'YES' : 'NO');

  console.log('');
  console.log(withHash.setupFieldPresent && noHash.setupFieldPresent
    ? 'VERDICT: both hand-offs reach the password-setup modal.'
    : 'VERDICT: at least one hand-off still misses the modal.');
})();
