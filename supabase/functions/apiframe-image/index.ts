
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

    // Get APIframe API key
    const APIFRAME_API_KEY = Deno.env.get("APIFRAME_API_KEY");
    if (!APIFRAME_API_KEY) {
      throw new Error("APIFRAME_API_KEY is not configured");
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

    // FIXED: Use the correct base API URL
    const apiUrl = "https://api.apiframe.ai/api/v1/task";
    
    // Create proper task data structure
    const taskData = {
      model: model || 'stable-diffusion-xl',
      task_type: "txt2img",
      input: {
        prompt,
        negative_prompt: params.negativePrompt || "",
        width: params.width || 768,
        height: params.height || 768,
        num_inference_steps: params.steps || 30,
        guidance_scale: params.guidanceScale || 7.5
      },
      config: {
        webhook_config: {
          endpoint: `${Deno.env.get("SUPABASE_URL")}/functions/v1/apiframe-media-webhook`
        }
      }
    };

    // Add debugging
    console.log("[apiframe-image] Sending request to:", apiUrl);
    console.log("[apiframe-image] Request payload:", JSON.stringify(taskData).substring(0, 200) + "...");
    
    // Create task in APIframe with proper error handling
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APIFRAME_API_KEY}`
      },
      body: JSON.stringify(taskData)
    });

    // Check if response is valid before attempting to parse JSON
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[apiframe-image] Error response from APIframe:', response.status, response.statusText);
      console.error('[apiframe-image] Error response body:', errorText.substring(0, 500));
      
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
    console.log('[apiframe-image] APIframe response:', JSON.stringify(data).substring(0, 200) + "...");

    if (!data.task_id) {
      throw new Error("No task ID returned from APIframe");
    }

    // Create task record
    const { error: insertError } = await supabase
      .from('apiframe_tasks')
      .insert({
        task_id: data.task_id,
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
        taskId: data.task_id,
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
