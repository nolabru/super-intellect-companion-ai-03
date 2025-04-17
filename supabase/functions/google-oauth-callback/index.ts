
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
  // Log the full request for debugging
  console.log("Request received:", {
    url: req.url,
    method: req.method,
  });

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Processing OAuth callback request');
    
    // Verify Google credentials are configured
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      console.error('Google credentials not configured');
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
    console.log('Full callback URL:', url.toString());
    
    const code = url.searchParams.get('code')
    const error = url.searchParams.get('error')
    const state = url.searchParams.get('state')
    
    console.log('Code present:', !!code);
    console.log('Error present:', !!error);
    console.log('State present:', !!state);

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
      console.log('Decoded user ID:', userId);
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
    
    console.log('Using redirect URI:', redirectUri);
    
    const params = new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })

    console.log('Exchanging code for tokens...');
    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    })

    const tokenResponseText = await tokenResponse.text();
    console.log('Token response status:', tokenResponse.status);
    console.log('Token response headers:', Object.fromEntries(tokenResponse.headers.entries()));
    
    if (!tokenResponse.ok) {
      console.error('Error obtaining tokens:', tokenResponseText);
      return Response.redirect(`${SITE_URL}/google-integrations?error=token_exchange_failed&reason=${encodeURIComponent(tokenResponseText.substring(0, 100))}`)
    }

    // Parse the token response
    let tokenData;
    try {
      tokenData = JSON.parse(tokenResponseText);
      console.log('Token response received, access_token present:', !!tokenData.access_token);
      console.log('Token response received, refresh_token present:', !!tokenData.refresh_token);
    } catch (e) {
      console.error('Error parsing token response:', e);
      return Response.redirect(`${SITE_URL}/google-integrations?error=invalid_token_response`)
    }
    
    // Save tokens in database
    const now = Math.floor(Date.now() / 1000)
    const expiresAt = now + tokenData.expires_in

    console.log('Saving tokens to database for user:', userId);
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
      return Response.redirect(`${SITE_URL}/google-integrations?error=db_save_failed&reason=${encodeURIComponent(JSON.stringify(upsertError))}`)
    }

    console.log('Tokens saved successfully, redirecting back to application');
    // Redirect back to application
    return Response.redirect(`${SITE_URL}/google-integrations?success=true`)
  } catch (error) {
    console.error('Error processing OAuth callback:', error)
    
    // Return to application with error
    return Response.redirect(`${SITE_URL}/google-integrations?error=server_error&reason=${encodeURIComponent(error.message || 'Unknown error')}`)
  }
})
