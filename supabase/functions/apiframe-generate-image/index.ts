
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.8.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Get the APIframe API key from environment variables
const APIFRAME_API_KEY = Deno.env.get('APIFRAME_API_KEY');
if (!APIFRAME_API_KEY) {
  console.error('[apiframe-generate-image] APIFRAME_API_KEY not configured in environment variables');
}

// Define the APIframe API URLs - Try both potential endpoints
const API_ENDPOINTS = [
  "https://api.apiframe.pro/v1/image/generate",  // Updated endpoint based on common API patterns
  "https://api.apiframe.pro/create"              // Original endpoint as fallback
];

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

    console.log(`[apiframe-generate-image] Generating image with model ${model} and prompt: ${prompt.substring(0, 100)}...`);

    // Prepare standardized request payload
    const apiData = {
      model,
      prompt,
      negative_prompt: params?.negativePrompt || "",
      width: params?.width || 768,
      height: params?.height || 768,
      num_inference_steps: params?.steps || 30,
      guidance_scale: params?.guidanceScale || 7.5
    };

    console.log(`[apiframe-generate-image] Request payload:`, JSON.stringify(apiData).substring(0, 500));
    
    // Try each endpoint until one works
    let response = null;
    let responseData = null;
    let successfulEndpoint = null;
    
    for (const endpoint of API_ENDPOINTS) {
      try {
        console.log(`[apiframe-generate-image] Trying endpoint: ${endpoint}`);
        
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${APIFRAME_API_KEY}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify(apiData)
        });
        
        console.log(`[apiframe-generate-image] Response from ${endpoint}: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          responseData = await response.json();
          successfulEndpoint = endpoint;
          console.log(`[apiframe-generate-image] Successfully used endpoint: ${endpoint}`);
          break;
        } else {
          const errorText = await response.text();
          console.error(`[apiframe-generate-image] Error from ${endpoint}:`, errorText.substring(0, 500));
        }
      } catch (endpointError) {
        console.error(`[apiframe-generate-image] Error with endpoint ${endpoint}:`, endpointError);
      }
    }
    
    // If no endpoints worked
    if (!successfulEndpoint) {
      throw new Error("All API endpoints failed. Check API key and try again later.");
    }

    // Get task ID from response
    const taskId = responseData.task_id || responseData.taskId || responseData.id;
    
    if (!taskId) {
      throw new Error("No task ID returned from APIframe");
    }
    
    console.log(`[apiframe-generate-image] Task ID: ${taskId}`);
    
    // Store task in database
    const { error: dbError } = await supabase
      .from('apiframe_tasks')
      .insert({
        task_id: taskId,
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
        taskId: taskId,
        status: 'pending',
        message: 'Task created successfully',
        endpoint: successfulEndpoint // Include which endpoint worked
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
