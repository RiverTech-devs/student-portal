# Troubleshooting Guide

Known issues, their root causes, and how they were fixed. Consult this before debugging similar symptoms.

Last updated: 2026-06-10

---

## Tab-Return Freeze Bug (RESOLVED)

**Status:** Fixed as of commit `4b877e6` (June 2026)

### Symptoms
- Entire page freezes when user switches away from the portal tab and then returns
- Buttons don't respond to clicks
- Database queries never execute
- Network requests appear to hang with no response
- Console shows no errors, but all operations time out
- Requires full page reload to recover
- Affects all browsers (Chrome, Arc, etc.) — not browser-specific
- Happens within seconds of returning to the tab after hiding it

### Root Cause
**Auth state change deadlock in supabase-js**

When the user returns to the tab:
1. Supabase-js automatically re-emits a `SIGNED_IN` auth event while holding its internal auth lock
2. Our `onAuthStateChange` callback tries to `await loadUserProfile()`
3. `loadUserProfile()` calls `getUser()` and queries the `user_profiles` table
4. These Supabase calls queue behind the same auth lock that's currently being held
5. **Circular wait:** 
   - Lock can't release until the callback returns
   - Callback can't return until the database queries complete
   - Queries can't run until the lock releases
6. Result: Complete freeze — every query on the page times out, no network traffic for 8+ seconds

### Why It Was Hard to Diagnose
- Page load worked fine (initial session doesn't trigger the callback)
- Only froze after seconds of tab being hidden
- Affected all browsers (library behavior, not browser issue)
- Creating a fresh Supabase client didn't help (the lock is per-origin, not per-client)
- Bypassing the navigator lock didn't help (different lock layer)
- No error messages in console or network panel

### The Fix (commit `4b877e6`)
Made the `onAuthStateChange` callback **synchronous** and deferred the profile load:

```javascript
// BEFORE (deadlocks):
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN') {
    await loadUserProfile(); // Waits for auth lock while callback holds it
  }
});

// AFTER (fixed):
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    // Callback returns immediately, releasing the lock
    setTimeout(() => loadUserProfile(), 0);
  }
});
```

The `setTimeout(0)` defers the profile load until after the callback returns and the auth lock is released, then runs the database queries safely.

### Related Commits
- `4b877e6` - **Main fix:** Auth state change deadlock resolution
- `55126d5` - Attempted fix: bypassed navigator lock (didn't solve it)
- `8ac8b02` - Attempted fix: no-op on short returns + auto-recovery reload
- `fd8f46f` - Debug: network probe to pinpoint freeze location
- `72ee01e` - Fix: stop full page reload on quick tab switches

### Diagnostic Method Used
Chrome DevTools Protocol (CDP) debugging was used to catch the deadlock live:
- Monitored network requests in real-time
- Confirmed 8+ seconds of complete silence (no requests sent)
- Identified that the freeze was happening inside supabase-js, not the network stack
- Traced the deadlock to the auth lock being held during the callback

### If It Happens Again
1. Check if `onAuthStateChange` callback is synchronous (must not use `async/await`)
2. Verify profile loading is deferred with `setTimeout` or similar
3. Look for any other operations in auth callbacks that might await Supabase calls
4. Use CDP debugging to monitor network traffic during tab return
5. Check `shared/config.js` for any changes to the auth callback pattern

### Prevention
- **Never `await` Supabase operations inside `onAuthStateChange` callbacks**
- Always defer async work with `setTimeout(0)` or similar
- The callback must return immediately to release the internal auth lock
- Document per supabase-js best practices: callbacks should be synchronous

---

## [Add future issues here]

### Template for New Entries
**Status:** [RESOLVED / IN PROGRESS / MONITORING]

#### Symptoms
- List observable behaviors
- When it occurs
- What triggers it

#### Root Cause
Detailed explanation of what's actually broken

#### The Fix
What was changed and why it works

#### Related Commits
List of relevant git commits

#### If It Happens Again
Steps to diagnose and resolve
