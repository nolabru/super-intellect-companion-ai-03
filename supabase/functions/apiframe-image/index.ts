import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get APIframe API key - Updated to use API_FRAME_KEY
    const APIFRAME_API_KEY = Deno.env.get("API_FRAME_KEY");
    if (!APIFRAME_API_KEY) {
      throw new Error("API_FRAME_KEY is not configured");
    }

    // Parse request body
    const requestBody = await req.json().catch(err => {
      console.error("[apiframe-image] Error parsing request body:", err);
      return null;
    });
    
    if (!requestBody) {
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { prompt, model, params = {} } = requestBody;

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[apiframe-image] Generating image with model ${model}`);
    console.log('Prompt:', prompt);
    console.log('Params:', params);

    // Try multiple API endpoints to increase chance of success
    const apiEndpoints = [
      "https://api.apiframe.ai/v1/images/generate",
      "https://api.apiframe.com/v1/images/generate",
      "https://api.apiframe.io/v1/images/generate"
    ];

    let response = null;
    let errorMessages = [];

    // Try each endpoint until one works
    for (const apiUrl of apiEndpoints) {
      try {
        // Create proper API request payload
        const apiData = {
          model: model || 'stable-diffusion-xl',
          prompt,
          negative_prompt: params.negativePrompt || "",
          width: params.width || 768,
          height: params.height || 768,
          num_inference_steps: params.steps || 30,
          guidance_scale: params.guidanceScale || 7.5
        };

        console.log(`[apiframe-image] Trying endpoint: ${apiUrl}`);
        console.log(`[apiframe-image] Request payload:`, JSON.stringify(apiData));
        
        // Send request to APIframe
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${APIFRAME_API_KEY}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify(apiData)
        });

        console.log(`[apiframe-image] Response status from ${apiUrl}: ${response.status} ${response.statusText}`);
        
        // If successful, break the loop
        if (response.ok) {
          break;
        } else {
          const errorText = await response.text();
          errorMessages.push(`Error from ${apiUrl}: ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`);
        }
      } catch (err) {
        console.error(`[apiframe-image] Network error with endpoint ${apiUrl}:`, err);
        errorMessages.push(`Network error with ${apiUrl}: ${err.message}`);
      }
    }

    // If all endpoints failed
    if (!response || !response.ok) {
      console.error('[apiframe-image] All endpoints failed. Errors:', errorMessages.join('; '));
      return new Response(
        JSON.stringify({ 
          error: "Failed to connect to APIframe service", 
          details: errorMessages.join('; ')
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle successful response
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text();
      console.error('[apiframe-image] Received non-JSON response:', textResponse.substring(0, 500));
      return new Response(
        JSON.stringify({ error: "Invalid response format from APIframe" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('[apiframe-image] APIframe response:', JSON.stringify(data).substring(0, 500));

    // Different APIs may return the task ID in different formats
    const taskId = data.task_id || data.taskId || data.id;
    if (!taskId) {
      throw new Error("No task ID returned from APIframe");
    }

    // Create task record
    const { error: insertError } = await supabase
      .from('apiframe_tasks')
      .insert({
        task_id: taskId,
        model: model || 'stable-diffusion-xl',
        prompt,
        media_type: 'image',
        params,
        status: 'pending'
      });

    if (insertError) {
      console.error('[apiframe-image] Error creating task record:', insertError);
    }

    return new Response(
      JSON.stringify({
        taskId: taskId,
        status: 'pending',
        message: 'Task created successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('[apiframe-image] Error:', err);
    return new Response(
      JSON.stringify({ 
        error: err instanceof Error ? err.message : "Unknown error",
        details: err instanceof Error ? err.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
