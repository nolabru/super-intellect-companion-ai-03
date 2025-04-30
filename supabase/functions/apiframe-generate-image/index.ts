
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

// Set the global API key that will work for all users
const GLOBAL_APIFRAME_API_KEY = 'b0a5c230-6f6f-4d2b-bb61-4be15184dd63';

// Define the correct APIframe API URL
const APIFRAME_API_URL = 'https://api.apiframe.ai/v1';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { prompt, model, params } = await req.json();
    
    if (!prompt || !model) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Generating image with model ${model} and prompt: ${prompt.substring(0, 50)}...`);

    // Prepare request payload
    const payload = {
      prompt,
      model,
      ...params
    };

    console.log(`[apiframe-generate-image] Sending request to ${APIFRAME_API_URL}/images/generate with API key: ${GLOBAL_APIFRAME_API_KEY.substring(0, 8)}...`);
    
    // Call APIframe API with enhanced error logging
    const response = await fetch(`${APIFRAME_API_URL}/images/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GLOBAL_APIFRAME_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log(`[apiframe-generate-image] Response status: ${response.status} ${response.statusText}`);
    
    // For debugging - log response headers
    const headersLog = {};
    response.headers.forEach((value, key) => { headersLog[key] = value });
    console.log(`[apiframe-generate-image] Response headers:`, headersLog);
    
    // Try to get response body for error analysis
    let responseBody;
    try {
      // Try to get as JSON first
      responseBody = await response.json();
      console.log(`[apiframe-generate-image] Response body:`, responseBody);
    } catch (jsonError) {
      // If not JSON, get as text
      const responseText = await response.text();
      console.log(`[apiframe-generate-image] Response is not JSON. Text content (first 500 chars):`, responseText.substring(0, 500));
      throw new Error(`API returned invalid JSON response. Status: ${response.status}. Text: ${responseText.substring(0, 200)}`);
    }

    if (!response.ok) {
      console.error('[apiframe-generate-image] Error from APIframe:', responseBody);
      
      return new Response(
        JSON.stringify({ 
          error: (responseBody && responseBody.message) ? responseBody.message : `Error generating image: ${response.status} ${response.statusText}`, 
          status: 'failed',
          details: responseBody
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Process successful response
    if (!responseBody.taskId) {
      throw new Error('No taskId in response');
    }
    
    // Store task in database
    const { error: dbError } = await supabase
      .from('apiframe_tasks')
      .insert({
        task_id: responseBody.taskId,
        prompt,
        model,
        media_type: 'image',
        params: params || {},
        status: responseBody.status || 'pending'
      });
      
    if (dbError) {
      console.error('[apiframe-generate-image] Error storing task in database:', dbError);
    }

    return new Response(
      JSON.stringify({
        taskId: responseBody.taskId,
        status: responseBody.status || 'pending',
        mediaUrl: responseBody.mediaUrl
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('[apiframe-generate-image] Error:', error);
    
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
