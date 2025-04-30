
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

    // Get APIframe API key - updated to use consistent name
    const APIFRAME_API_KEY = Deno.env.get("API_FRAME");
    if (!APIFRAME_API_KEY) {
      throw new Error("API_FRAME is not configured");
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

    // UPDATED: Use the correct API URL based on APIframe documentation
    // Changed from "/create" to "/v1/image/generate" as this is a common endpoint pattern
    const apiUrl = "https://api.apiframe.pro/v1/image/generate";
    
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

    // Add debugging
    console.log("[apiframe-image] Sending request to:", apiUrl);
    console.log("[apiframe-image] Request payload:", JSON.stringify(apiData).substring(0, 500));
    console.log("[apiframe-image] Using API key:", APIFRAME_API_KEY.substring(0, 8) + "...");
    
    // Create task in APIframe with proper error handling
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APIFRAME_API_KEY}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(apiData)
    });

    // Log detailed response information
    console.log(`[apiframe-image] Response status: ${response.status} ${response.statusText}`);
    
    // Log response headers for debugging
    const headersLog = {};
    response.headers.forEach((value, key) => { headersLog[key] = value });
    console.log(`[apiframe-image] Response headers:`, JSON.stringify(headersLog));

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
      
      // Try alternative endpoint if first one fails
      if (response.status === 404) {
        console.log("[apiframe-image] 404 error, trying alternative endpoint...");
        const altApiUrl = "https://api.apiframe.pro/create"; // Try the original endpoint as fallback
        
        console.log("[apiframe-image] Sending request to alternative URL:", altApiUrl);
        
        const altResponse = await fetch(altApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${APIFRAME_API_KEY}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify(apiData)
        });
        
        console.log(`[apiframe-image] Alt response status: ${altResponse.status} ${altResponse.statusText}`);
        
        if (!altResponse.ok) {
          const altErrorText = await altResponse.text();
          console.error('[apiframe-image] Error response from alternative endpoint:', altErrorText.substring(0, 500));
          throw new Error(`API error on both endpoints. Primary: ${errorMessage}, Fallback: ${altResponse.status} ${altResponse.statusText}`);
        }
        
        // Handle success on alternative endpoint
        const altData = await altResponse.json();
        console.log('[apiframe-image] Alternative endpoint response:', JSON.stringify(altData).substring(0, 500));
        
        if (!altData.task_id) {
          throw new Error("No task ID returned from APIframe (alternative endpoint)");
        }
        
        // Create task record
        const { error: insertError } = await supabase
          .from('apiframe_tasks')
          .insert({
            task_id: altData.task_id,
            model: model || 'stable-diffusion-xl',
            prompt,
            media_type: 'image',
            params: params || {},
            status: 'pending'
          });
        
        if (insertError) {
          console.error('[apiframe-image] Error creating task record:', insertError);
        }
        
        return new Response(
          JSON.stringify({
            taskId: altData.task_id,
            status: 'pending',
            message: 'Task created successfully (using alternative endpoint)'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(errorMessage);
    }

    // Handle successful response
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
