
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.8.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Google API endpoints
const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get request data
    const { 
      title, 
      description, 
      startDateTime, 
      endDateTime, 
      attendees = [], 
      location = '',
      userId 
    } = await req.json();

    // Validate required parameters
    if (!title || !startDateTime || !endDateTime || !userId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameters' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // Get the user's Google tokens
    const { data: tokensData, error: tokensError } = await supabase
      .from('user_google_tokens')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (tokensError || !tokensData) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'User not connected to Google or tokens not found' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      );
    }

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (tokensData.expires_at < now) {
      // Token is expired, refresh it
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: Deno.env.get('GOOGLE_CLIENT_ID') || '',
          client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') || '',
          refresh_token: tokensData.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (!refreshResponse.ok) {
        const refreshError = await refreshResponse.text();
        console.error('Error refreshing token:', refreshError);
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to refresh Google token' 
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
          }
        );
      }

      const refreshData = await refreshResponse.json();
      
      // Update tokens in database
      const { error: updateError } = await supabase
        .from('user_google_tokens')
        .update({
          access_token: refreshData.access_token,
          expires_at: now + refreshData.expires_in,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating tokens:', updateError);
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to update Google tokens' 
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
          }
        );
      }

      // Use the new access token
      tokensData.access_token = refreshData.access_token;
    }

    // Create event payload
    const eventPayload = {
      summary: title,
      description: description || '',
      location: location || '',
      start: {
        dateTime: startDateTime,
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'America/Sao_Paulo',
      },
      attendees: attendees.map((email: string) => ({ email })),
    };

    // Create event in Google Calendar
    const response = await fetch(GOOGLE_CALENDAR_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokensData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Error creating calendar event:', errorData);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to create calendar event: ${errorData}` 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: response.status
        }
      );
    }

    const eventData = await response.json();
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: eventData.id,
          htmlLink: eventData.htmlLink,
          summary: eventData.summary,
          start: eventData.start,
          end: eventData.end,
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
