
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

// Define the APIframe API URLs - Updated to use the correct domains
const APIFRAME_API_URLS = [
  'https://api.apiframe.io/v1',
  'https://api.apiframe.com/v1'
];

// Set the global API key that will work for all users - standardized name
const GLOBAL_APIFRAME_API_KEY = Deno.env.get('API_FRAME');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { prompt, model, params } = await req.json();
    
    // Use the global API key instead of requesting it from the user or environment
    const APIFRAME_API_KEY = GLOBAL_APIFRAME_API_KEY;

    if (!APIFRAME_API_KEY) {
      console.error('[apiframe-generate-audio] API_FRAME not configured');
      return new Response(
        JSON.stringify({ 
          error: 'API_FRAME not configured', 
          details: 'Please configure the API_FRAME secret in Supabase'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!prompt || !model) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters', 
          details: {
            prompt: !prompt ? 'Missing' : 'Provided',
            model: !model ? 'Missing' : 'Provided'
          }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`[apiframe-generate-audio] Generating audio with model ${model} and prompt: ${prompt.substring(0, 50)}...`);

    // Prepare request payload
    const payload = {
      prompt,
      model: model,
      ...params
    };

    // Try each API URL until one works
    let response = null;
    let errorData = null;
    let successfulUrl = null;
    
    for (const apiUrl of APIFRAME_API_URLS) {
      try {
        console.log(`[apiframe-generate-audio] Trying API URL: ${apiUrl}/audio/generate`);
        
        response = await fetch(`${apiUrl}/audio/generate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${APIFRAME_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        
        // If this succeeds, break the loop
        if (response.ok) {
          successfulUrl = apiUrl;
          console.log(`[apiframe-generate-audio] Successfully used API URL: ${apiUrl}`);
          break;
        }
        
        // Otherwise, log the error and continue trying
        errorData = await response.json();
        console.error(`[apiframe-generate-audio] Error from ${apiUrl}:`, errorData);
      } catch (error) {
        console.error(`[apiframe-generate-audio] Error with ${apiUrl}:`, error);
      }
    }

    // If no API URL worked
    if (!successfulUrl) {
      return new Response(
        JSON.stringify({ 
          error: 'All API endpoints failed', 
          status: 'failed',
          details: errorData || 'Unknown error'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Process successful response
    const responseData = await response.json();
    console.log('[apiframe-generate-audio] Response:', JSON.stringify(responseData));
    
    // Store task in database
    const { error: dbError } = await supabase
      .from('apiframe_tasks')
      .insert({
        task_id: responseData.taskId,
        prompt,
        model,
        media_type: 'audio',
        params: params || {},
        status: responseData.status || 'pending'
      });
      
    if (dbError) {
      console.error('[apiframe-generate-audio] Error storing task in database:', dbError);
    }

    return new Response(
      JSON.stringify({
        taskId: responseData.taskId,
        status: responseData.status || 'pending',
        mediaUrl: responseData.mediaUrl,
        apiUrl: successfulUrl // Include which API URL was successfully used
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('[apiframe-generate-audio] Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        stack: error.stack
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
