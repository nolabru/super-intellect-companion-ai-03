
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

interface TokenResponse {
  access_token: string
  expires_in: number
  refresh_token?: string
  token_type: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Check if Google credentials are configured
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

    // Get refresh token from request
    const { userId, refreshToken } = await req.json()

    if (!userId || !refreshToken) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'UserId and RefreshToken are required' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Authenticate user by ID
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId)
    
    if (userError || !userData.user) {
      console.error('Error verifying user:', userError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'User not found or not authorized'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403
        }
      )
    }

    // Request new access token from Google
    const tokenEndpoint = 'https://oauth2.googleapis.com/token'
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Error in Google response:', errorData)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to refresh token: ' + errorData
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: response.status
        }
      )
    }

    const tokenData: TokenResponse = await response.json()
    
    // Calculate expiration date
    const now = Math.floor(Date.now() / 1000)
    const expiresAt = now + tokenData.expires_in
    
    // Update tokens in database
    const { error: updateError } = await supabase
      .from('user_google_tokens')
      .upsert({
        user_id: userId,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || refreshToken, // keep old refresh token if no new one
        expires_at: expiresAt,
        updated_at: new Date().toISOString()
      })

    if (updateError) {
      console.error('Error updating tokens:', updateError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Error updating tokens in database' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
    }

    // Return refreshed tokens
    return new Response(
      JSON.stringify({
        success: true,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token, // may be undefined
        expiresAt: expiresAt
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error processing request:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
