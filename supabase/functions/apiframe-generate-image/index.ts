
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

// Get the APIframe API key from environment variables
const APIFRAME_API_KEY = Deno.env.get('APIFRAME_API_KEY');
if (!APIFRAME_API_KEY) {
  console.error('[apiframe-generate-image] APIFRAME_API_KEY not configured in environment variables');
}

// Define the correct APIframe API URL - Updated to use the correct endpoint
const APIFRAME_API_URL = "https://api.apiframe.pro/create";

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

    console.log(`[apiframe-generate-image] Generating image with model ${model} and prompt: ${prompt.substring(0, 50)}...`);

    // Prepare standardized request payload
    const apiData = {
      model,
      prompt,
      negative_prompt: params?.negativePrompt || "",
      width: params?.width || 768,
      height: params?.height || 768
    };

    console.log(`[apiframe-generate-image] Sending request to ${APIFRAME_API_URL} with API key: ${APIFRAME_API_KEY?.substring(0, 8)}...`);
    console.log(`[apiframe-generate-image] Request payload:`, JSON.stringify(apiData).substring(0, 200) + "...");
    
    // Call APIframe API with enhanced error logging
    const response = await fetch(APIFRAME_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': APIFRAME_API_KEY,
        'Accept': 'application/json'
      },
      body: JSON.stringify(apiData)
    });

    console.log(`[apiframe-generate-image] Response status: ${response.status} ${response.statusText}`);
    
    // For debugging - log response headers
    const headersLog = {};
    response.headers.forEach((value, key) => { headersLog[key] = value });
    console.log(`[apiframe-generate-image] Response headers:`, headersLog);
    
    // Check if response is valid before attempting to parse JSON
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[apiframe-generate-image] Error response from APIframe:', response.status, response.statusText);
      console.error('[apiframe-generate-image] Error response body:', errorText.substring(0, 500));
      
      let errorMessage = `API error: ${response.status} ${response.statusText}`;
      try {
        // Try to parse as JSON to get more specific error
        const errorJson = JSON.parse(errorText);
        if (errorJson.error) {
          errorMessage = errorJson.error.message || errorMessage;
        }
      } catch {
        // If not parsable as JSON, use the status text
      }
      
      throw new Error(errorMessage);
    }

    // Handle successful response
    const data = await response.json();
    console.log('[apiframe-generate-image] APIframe response:', JSON.stringify(data).substring(0, 200) + "...");

    if (!data.task_id) {
      throw new Error("No task ID returned from APIframe");
    }
    
    // Store task in database
    const { error: dbError } = await supabase
      .from('apiframe_tasks')
      .insert({
        task_id: data.task_id,
        prompt,
        model,
        media_type: 'image',
        params: params || {},
        status: 'pending'
      });
      
    if (dbError) {
      console.error('[apiframe-generate-image] Error storing task in database:', dbError);
    }

    return new Response(
      JSON.stringify({
        taskId: data.task_id,
        status: 'pending',
        message: 'Task created successfully'
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
