
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.8.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Get API key from environment
const APIFRAME_API_KEY = Deno.env.get('API_FRAME');
if (!APIFRAME_API_KEY) {
  console.error('[apiframe-check-status] API_FRAME not configured');
}

// Define the APIframe API URLs - Updated to use the correct domains
const STATUS_API_ENDPOINTS = [
  "https://api.apiframe.io/v1/tasks/",
  "https://api.apiframe.com/v1/tasks/",
  "https://api.apiframe.io/v1/task/",
  "https://api.apiframe.com/v1/task/"
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { taskId } = await req.json();

    if (!taskId) {
      return new Response(
        JSON.stringify({ error: 'Missing task ID' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!APIFRAME_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'API_FRAME not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`[apiframe-check-status] Checking task status for ID: ${taskId}`);
    
    // Try each endpoint until one works
    let response = null;
    let responseData = null;
    let successfulEndpoint = null;
    let errorMessages = [];
    
    for (const baseEndpoint of STATUS_API_ENDPOINTS) {
      try {
        const endpoint = `${baseEndpoint}${taskId}`;
        console.log(`[apiframe-check-status] Trying endpoint: ${endpoint}`);
        
        response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${APIFRAME_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`[apiframe-check-status] Response from ${endpoint}: ${response.status}`);
        
        if (response.ok) {
          responseData = await response.json();
          successfulEndpoint = endpoint;
          console.log(`[apiframe-check-status] Successfully used endpoint: ${endpoint}`);
          break;
        } else {
          const errorText = await response.text();
          console.error(`[apiframe-check-status] Error from ${endpoint}:`, errorText);
          errorMessages.push(`${endpoint} error: ${response.status}`);
        }
      } catch (endpointError) {
        console.error(`[apiframe-check-status] Error with endpoint:`, endpointError);
        errorMessages.push(`Network error: ${endpointError.message}`);
      }
    }
    
    // If no endpoints worked
    if (!successfulEndpoint) {
      console.error('[apiframe-check-status] All status endpoints failed:', errorMessages.join('; '));
      
      return new Response(
        JSON.stringify({ error: 'Failed to check task status' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse and normalize the response data
    const status = responseData.status || 'pending';
    const mediaUrl = responseData.media_url || responseData.mediaUrl || responseData.url;
    const error = responseData.error || null;
    
    console.log(`[apiframe-check-status] Task ${taskId} status: ${status}, mediaUrl: ${mediaUrl || 'none'}`);
    
    // Update task in database
    if (status === 'completed' || mediaUrl || status === 'failed' || error) {
      const { error: dbError } = await supabase
        .from('apiframe_tasks')
        .update({
          status: status === 'completed' ? 'completed' : (error ? 'failed' : status),
          media_url: mediaUrl,
          error: error,
          updated_at: new Date().toISOString()
        })
        .eq('task_id', taskId);
      
      if (dbError) {
        console.error('[apiframe-check-status] Error updating task in database:', dbError);
      }
    }

    return new Response(
      JSON.stringify({
        status,
        mediaUrl,
        error,
        updatedAt: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('[apiframe-check-status] Error:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
