import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!

const ALLOWED_ORIGINS = ['https://rivertech.me', 'https://www.rivertech.me']

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || ''
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-upload-url, x-content-range',
  }
}

// Refresh Google access token using stored refresh token
async function refreshAccessToken(refreshToken: string): Promise<string> {
  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!resp.ok) {
    const err = await resp.text()
    throw new Error(`Token refresh failed: ${err}`)
  }

  const data = await resp.json()
  return data.access_token
}

// Find or create a folder in Google Drive
async function findOrCreateFolder(
  accessToken: string,
  name: string,
  parentId: string
): Promise<string> {
  // Validate parentId format (alphanumeric, hyphens, underscores only)
  if (!/^[a-zA-Z0-9_-]+$/.test(parentId)) {
    throw new Error('Invalid parent folder ID')
  }
  // Sanitize name: escape backslashes then single quotes for Drive API query
  const safeName = name.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
  const query = `name='${safeName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
  const searchResp = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (searchResp.ok) {
    const searchData = await searchResp.json()
    if (searchData.files?.length > 0) {
      return searchData.files[0].id
    }
  }

  // Create folder
  const createResp = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    }),
  })

  if (!createResp.ok) {
    throw new Error(`Failed to create folder: ${await createResp.text()}`)
  }

  const folder = await createResp.json()
  return folder.id
}

serve(async (req) => {
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

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      })
    }

    // === CHUNK PROXY MODE ===
    // PUT requests proxy a chunk to Google Drive's resumable upload URL
    if (req.method === 'PUT') {
      const uploadUrl = req.headers.get('X-Upload-Url')
      const contentRange = req.headers.get('X-Content-Range')

      if (!uploadUrl) {
        return new Response(JSON.stringify({ error: 'Missing X-Upload-Url header' }), {
          status: 400,
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        })
      }

      // Validate the upload URL points to Google Drive
      if (!uploadUrl.startsWith('https://www.googleapis.com/upload/drive/')) {
        return new Response(JSON.stringify({ error: 'Invalid upload URL' }), {
          status: 400,
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        })
      }

      // Forward the chunk to Google Drive
      const chunkBody = await req.arrayBuffer()
      const putHeaders: Record<string, string> = {
        'Content-Length': String(chunkBody.byteLength),
      }
      if (contentRange) {
        putHeaders['Content-Range'] = contentRange
      }

      const putResp = await fetch(uploadUrl, {
        method: 'PUT',
        headers: putHeaders,
        body: chunkBody,
      })

      // Forward Google's response back to the client
      const respBody = await putResp.text()
      return new Response(respBody, {
        status: putResp.status,
        headers: {
          ...getCorsHeaders(req),
          'Content-Type': putResp.headers.get('Content-Type') || 'application/json',
        },
      })
    }

    // === INIT MODE (POST) ===
    // Parse request body
    const { teacherId, fileName, fileMimeType, fileSize, className, assignmentTitle, studentName } = await req.json()

    if (!teacherId || !fileName) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      })
    }

    // Validate inputs
    if (fileName.includes('/') || fileName.includes('\\') || fileName.length > 255) {
      return new Response(JSON.stringify({ error: 'Invalid file name' }), {
        status: 400,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      })
    }
    if (fileSize && (fileSize < 0 || fileSize > 10 * 1024 * 1024 * 1024)) {
      return new Response(JSON.stringify({ error: 'File size out of range' }), {
        status: 400,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      })
    }

    // Verify the caller is the teacher, an admin, or a student in one of the teacher's classes
    const { data: callerProfile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    const callerType = callerProfile?.user_type
    if (callerType === 'teacher' && user.id !== teacherId) {
      return new Response(JSON.stringify({ error: 'Teachers can only upload to their own Drive' }), {
        status: 403,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      })
    }

    // Students must be enrolled in a class taught by this teacher
    if (callerType === 'student') {
      const { data: enrollment } = await supabase
        .from('class_enrollments')
        .select('id, classes!inner(teacher_id, secondary_teacher_id)')
        .eq('student_id', user.id)
        .or(`teacher_id.eq.${teacherId},secondary_teacher_id.eq.${teacherId}`, { foreignTable: 'classes' })
        .limit(1)

      if (!enrollment || enrollment.length === 0) {
        return new Response(JSON.stringify({ error: 'You are not enrolled in any class with this teacher' }), {
          status: 403,
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        })
      }
    }

    // Get teacher's Drive config
    const { data: driveConfig, error: configError } = await supabase
      .from('teacher_drive_config')
      .select('refresh_token, root_folder_id')
      .eq('teacher_id', teacherId)
      .single()

    if (configError || !driveConfig?.refresh_token) {
      return new Response(JSON.stringify({ error: 'Teacher has not connected Google Drive' }), {
        status: 400,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      })
    }

    // Get fresh access token
    const accessToken = await refreshAccessToken(driveConfig.refresh_token)

    // Build folder path: Root > ClassName > AssignmentTitle
    let parentFolderId = driveConfig.root_folder_id

    if (className) {
      parentFolderId = await findOrCreateFolder(accessToken, className, parentFolderId)
    }
    if (assignmentTitle) {
      parentFolderId = await findOrCreateFolder(accessToken, assignmentTitle, parentFolderId)
    }

    // Build file name with student name prefix
    const uploadFileName = studentName ? `${studentName}_${fileName}` : fileName

    // Initiate resumable upload session with Google Drive API
    const metadata = {
      name: uploadFileName,
      parents: [parentFolderId],
    }

    const initResp = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Type': fileMimeType || 'application/octet-stream',
          ...(fileSize ? { 'X-Upload-Content-Length': String(fileSize) } : {}),
        },
        body: JSON.stringify(metadata),
      }
    )

    if (!initResp.ok) {
      const errText = await initResp.text()
      throw new Error(`Failed to initiate upload: ${errText}`)
    }

    // The resumable upload URI is in the Location header
    const uploadUrl = initResp.headers.get('Location')

    if (!uploadUrl) {
      throw new Error('No upload URL returned from Google Drive')
    }

    return new Response(JSON.stringify({
      success: true,
      uploadUrl,
      folderId: parentFolderId,
    }), {
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('get-drive-upload-url error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error',
    }), {
      status: 500,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    })
  }
})
