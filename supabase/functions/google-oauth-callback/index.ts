
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.8.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Google OAuth credentials
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Define the correct production URL
const SITE_URL = 'https://super-intellect-companion-ai.lovable.app';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify Google credentials are configured
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Google credentials not configured on server'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
    }

    // Get authorization code and request information
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const error = url.searchParams.get('error')
    const state = url.searchParams.get('state')

    // Check for OAuth flow errors
    if (error) {
      console.error('Error during OAuth flow:', error)
      return Response.redirect(`${SITE_URL}/google-integrations?error=${error}`)
    }

    // Return error if no code is provided
    if (!code) {
      console.error('Authorization code missing')
      return Response.redirect(`${SITE_URL}/google-integrations?error=no_code`)
    }

    // Decode state to get user ID
    if (!state) {
      console.error('State missing')
      return Response.redirect(`${SITE_URL}/google-integrations?error=no_state`)
    }

    let userId
    try {
      const decodedState = JSON.parse(atob(state))
      userId = decodedState.userId
    } catch (e) {
      console.error('Error decoding state:', e)
      return Response.redirect(`${SITE_URL}/google-integrations?error=invalid_state`)
    }

    if (!userId) {
      console.error('User ID missing in state')
      return Response.redirect(`${SITE_URL}/google-integrations?error=no_user_id`)
    }

    // Exchange code for tokens
    const tokenEndpoint = 'https://oauth2.googleapis.com/token'
    const redirectUri = `${SITE_URL}/api/google-oauth-callback`
    
    const params = new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })

    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Error obtaining tokens:', errorData)
      return Response.redirect(`${SITE_URL}/google-integrations?error=token_exchange_failed`)
    }

    const tokenData = await tokenResponse.json()
    
    // Save tokens in database
    const now = Math.floor(Date.now() / 1000)
    const expiresAt = now + tokenData.expires_in

    const { error: upsertError } = await supabase
      .from('user_google_tokens')
      .upsert({
        user_id: userId,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt,
        updated_at: new Date().toISOString()
      })

    if (upsertError) {
      console.error('Error saving tokens:', upsertError)
      return Response.redirect(`${SITE_URL}/google-integrations?error=db_save_failed`)
    }

    // Redirect back to application
    return Response.redirect(`${SITE_URL}/google-integrations?success=true`)
  } catch (error) {
    console.error('Error processing OAuth callback:', error)
    
    // Return to application with error
    return Response.redirect(`${SITE_URL}/google-integrations?error=server_error`)
  }
})
