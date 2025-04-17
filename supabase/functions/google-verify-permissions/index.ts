
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.8.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Google OAuth credentials
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')

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

    // Get user ID from request
    const { userId } = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'UserId is required' 
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

    // Get user's Google tokens
    const { data: tokensData, error: tokensError } = await supabase
      .from('user_google_tokens')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (tokensError || !tokensData) {
      console.error('Error retrieving Google tokens:', tokensError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'User has no Google tokens'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      )
    }

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000)
    if (tokensData.expires_at <= now) {
      console.log('Token is expired, needs refresh')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Token expired',
          needsRefresh: true
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        }
      )
    }

    // Test token by making a simple request to Google API
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokensData.access_token}`
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error verifying Google token:', errorText)
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid Google token',
          details: errorText
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        }
      )
    }

    // Token is valid
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Google permissions verified'
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
