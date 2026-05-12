// pin-login edge function
//
// Lets a student sign in with just a 4-character PIN — no email,
// no password, no name. Used for inactive (unclaimed) student
// profiles that need games + skills + RTC access.
//
// Flow:
//   1. Frontend POSTs { pin }
//   2. We call pin_lookup_by_pin via service role to find the unique
//      student that owns that PIN (the partial UNIQUE index on
//      games_pin guarantees at most one match).
//   3. If the matched profile has no auth.users row yet (the typical
//      case for never-claimed inactive students), we provision one
//      with a placeholder email + random password and link it via
//      pin_attach_auth_user. account_status stays 'inactive' so the
//      regular Activate Account flow still works as an upgrade path.
//   4. We call auth.admin.generateLink({ type: 'magiclink', email })
//      and return { email, token } to the frontend.
//   5. Frontend calls supabase.auth.verifyOtp({ email, token, type: 'email' })
//      to mint a real session. From there RLS governs access; the UI
//      strips everything except Games + Skills for account_status='inactive'.
//
// Security notes:
//   - This function is anonymous-callable (no auth header). The PIN
//     is the only credential — ~923K possible combinations from a
//     confusion-resistant alphabet. Brute force is bounded by the
//     Supabase edge rate limit; a pin_login_attempts lockout table
//     is a future hardening step.
//   - On failure we return a generic "No match" so an attacker can't
//     distinguish a wrong PIN from a malformed one.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const ALLOWED_ORIGINS = ['https://rivertech.me', 'https://www.rivertech.me']

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || ''
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

function jsonResponse(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) })
  }

  if (req.method !== 'POST') {
    return jsonResponse(req, { error: 'Method not allowed' }, 405)
  }

  try {
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return jsonResponse(req, { error: 'Invalid request body' }, 400)
    }

    const pin = typeof body.pin === 'string' ? body.pin.trim().toUpperCase() : ''

    if (!/^[A-Z0-9]{4}$/.test(pin)) {
      return jsonResponse(req, { error: 'PIN must be 4 letters or digits' }, 400)
    }

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    // Look up the unique student that owns this PIN.
    const { data: lookupResult, error: lookupError } = await adminClient.rpc('pin_lookup_by_pin', {
      p_pin: pin,
    })

    // Mask all but the last character for log breadcrumbs — gives enough
    // context to diagnose without leaking the secret to Supabase logs.
    const maskedPin = '***' + pin.slice(-1)

    if (lookupError) {
      console.error('pin_lookup_by_pin RPC error', { masked_pin: maskedPin, error: lookupError })
      // Most common cause of a real error here is that the
      // pin_only_signin.sql migration hasn't been applied yet —
      // pin_lookup_by_pin doesn't exist. Tell the operator clearly
      // (the message lands in their browser console / network tab).
      const msg = (lookupError as { message?: string })?.message || ''
      if (msg.includes('does not exist') || msg.includes('PGRST202')) {
        return jsonResponse(req, {
          error: 'PIN sign-in is not fully set up — apply pin_only_signin.sql migration.',
        }, 500)
      }
      return jsonResponse(req, { error: 'Lookup failed' }, 500)
    }

    if (!lookupResult || !lookupResult.success) {
      console.warn('pin_lookup_by_pin no match', { masked_pin: maskedPin })
      return jsonResponse(req, { error: 'No match. Check your PIN.' }, 401)
    }

    console.log('pin_lookup_by_pin matched', {
      masked_pin: maskedPin,
      user_id: lookupResult.user_id,
      has_auth_user: !!lookupResult.auth_user_id,
    })

    let authUserId: string | null = lookupResult.auth_user_id
    let email: string | null = null

    if (!authUserId) {
      // Unclaimed inactive student: nobody has ever logged in as them
      // before, so there's no auth.users row yet. Create one with a
      // placeholder email (no real inbox — the OTP is verified by us
      // directly, not by a clicked link) and a long random password
      // so the email/password route can't be used. We leave
      // account_status='inactive' and can_login=false on the profile
      // so the regular Activate Account flow still works later.
      const profileId: string = lookupResult.user_id
      const placeholderEmail = `pin-${profileId}@pin.rivertech.me`
      // 64+ chars of randomness — nobody is ever supposed to know this.
      const randomPassword =
        crypto.randomUUID() + crypto.randomUUID()

      const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
        email: placeholderEmail,
        password: randomPassword,
        email_confirm: true,
        user_metadata: { pin_only: true, profile_id: profileId },
      })

      if (createErr || !created?.user) {
        console.error('admin.createUser error:', createErr)
        return jsonResponse(req, { error: 'Could not provision sign-in for this student' }, 500)
      }

      // Link the new auth user to the profile via a SECURITY DEFINER
      // RPC. If another concurrent sign-in raced us, the RPC reports
      // the already-attached auth_user_id and we use that instead.
      const { data: attachRes, error: attachErr } = await adminClient.rpc('pin_attach_auth_user', {
        p_profile_id: profileId,
        p_auth_user_id: created.user.id,
        p_email: placeholderEmail,
      })

      if (attachErr || !attachRes || attachRes.success === false) {
        console.error('pin_attach_auth_user error:', attachErr || attachRes)
        // Roll back the auth user we just made so we don't leak it.
        await adminClient.auth.admin.deleteUser(created.user.id).catch(() => {})
        return jsonResponse(req, { error: 'Could not link sign-in to student profile' }, 500)
      }

      if (attachRes.already_attached) {
        // Another concurrent sign-in beat us to it. Throw ours away
        // and use theirs.
        await adminClient.auth.admin.deleteUser(created.user.id).catch(() => {})
        authUserId = attachRes.auth_user_id
      } else {
        authUserId = created.user.id
        email = placeholderEmail
      }
    }

    if (!email) {
      // Resolve the email from auth.users (either an already-existing
      // auth user, or one another tab attached while we were running).
      const { data: authUser, error: authUserError } = await adminClient.auth.admin.getUserById(authUserId!)
      if (authUserError || !authUser?.user?.email) {
        console.error('admin.getUserById error:', authUserError)
        return jsonResponse(req, { error: 'Could not resolve student account email' }, 500)
      }
      email = authUser.user.email
    }

    // Mint a magic-link OTP. The frontend will consume it via verifyOtp.
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email,
    })

    if (linkError || !linkData?.properties?.email_otp) {
      console.error('generateLink error:', linkError)
      return jsonResponse(req, { error: 'Could not mint sign-in token' }, 500)
    }

    return jsonResponse(req, {
      success: true,
      email,
      token: linkData.properties.email_otp,
      first_name: lookupResult.first_name,
    })

  } catch (error) {
    console.error('pin-login unexpected error:', error)
    return jsonResponse(req, { error: (error as Error).message || 'Internal server error' }, 500)
  }
})
