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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) })
  }

  try {
    // Verify caller is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      })
    }

    // Create a client with the caller's token to identify them
    const callerClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user: callerAuth }, error: authError } = await callerClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !callerAuth) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      })
    }

    // Parse request body to check for admin-initiated deletion
    let targetUserId = callerAuth.id
    let isAdminDeletion = false

    const text = await req.text()
    if (text && text.trim() !== '') {
      try {
        const body = JSON.parse(text)
        if (body.user_id && body.user_id !== callerAuth.id) {
          // Validate UUID format to prevent injection
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
          if (!uuidRegex.test(body.user_id)) {
            return new Response(JSON.stringify({ error: 'Invalid user_id format' }), {
              status: 400,
              headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
            })
          }
          isAdminDeletion = true
          targetUserId = body.user_id
        }
      } catch {
        // No body or invalid JSON — self-delete
      }
    }

    // Service role client for privileged operations
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    // If admin-initiated, verify caller is an admin
    if (isAdminDeletion) {
      const { data: callerProfile, error: profileError } = await adminClient
        .from('user_profiles')
        .select('user_type')
        .eq('id', callerAuth.id)
        .single()

      if (profileError || !callerProfile || callerProfile.user_type !== 'admin') {
        return new Response(JSON.stringify({ error: 'Only admins can delete other users' }), {
          status: 403,
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        })
      }
    }

    // Look up the target user's auth ID from user_profiles
    const { data: targetProfile, error: targetError } = await adminClient
      .from('user_profiles')
      .select('id, auth_user_id')
      .eq('id', targetUserId)
      .single()

    if (targetError || !targetProfile) {
      console.error('Profile lookup error:', targetError)
      return new Response(JSON.stringify({ error: 'Target user not found' }), {
        status: 404,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      })
    }

    // Call the SQL function to delete all user data from related tables
    const { error: rpcError } = await adminClient.rpc('hard_delete_user_account', {
      p_user_id: targetUserId,
    })

    if (rpcError) {
      console.error('RPC error:', rpcError)
      return new Response(JSON.stringify({ error: 'Failed to delete user data: ' + rpcError.message }), {
        status: 500,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      })
    }

    // Delete the auth.users record via Admin API
    const authUserId = targetProfile.auth_user_id || targetUserId
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(authUserId)

    if (deleteAuthError) {
      console.error('Auth delete error:', deleteAuthError)
      // User data is already deleted — log but don't fail
      return new Response(JSON.stringify({
        success: true,
        warning: 'User data deleted but auth record removal failed: ' + deleteAuthError.message,
      }), {
        status: 200,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    })
  }
})
