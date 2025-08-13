// web/supabaseClient.js
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

// Global supabase client
export const sb = window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Render auth box
const authBox = document.getElementById('authBox');
function renderAuthBox(user) {
  if (!authBox) return;
  if (!user) {
    authBox.innerHTML = `
      <div class="row">
        <button class="btn secondary" id="btnSignIn">Sign In</button>
        <button class="btn" id="btnSignUp">Sign Up</button>
      </div>
    `;
    authBox.querySelector('#btnSignIn').onclick = async () => {
      const email = prompt('Email?');
      const password = prompt('Password?');
      if (!email || !password) return;
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) return alert(error.message);
      location.reload();
    };
    authBox.querySelector('#btnSignUp').onclick = async () => {
      const email = prompt('Email?');
      const password = prompt('Password?');
      const role = prompt('Role? teacher/student/parent');
      const first = prompt('First name?');
      const last = prompt('Last name?');
      if (!email || !password || !role || !first || !last) return;
      const { data, error } = await sb.auth.signUp({ email, password });
      if (error) return alert(error.message);
      if (data.user) {
        await sb.from('profiles').insert({ id: data.user.id, email, role, first_name: first, last_name: last });
        alert('Account created. Please sign in.');
      }
    };
  } else {
    authBox.innerHTML = `
      <div class="row">
        <span>Signed in as <span class="kbd">${user.email}</span></span>
        <button class="btn danger" id="btnSignOut">Sign Out</button>
      </div>
    `;
    authBox.querySelector('#btnSignOut').onclick = async () => {
      await sb.auth.signOut();
      location.reload();
    };
  }
}

// Load current user
sb.auth.getUser().then(({ data }) => renderAuthBox(data?.user || null));
sb.auth.onAuthStateChange((_event, session) => renderAuthBox(session?.user || null));
