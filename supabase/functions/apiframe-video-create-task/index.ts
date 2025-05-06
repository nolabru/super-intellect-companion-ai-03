
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// API Frame endpoints
const APIFRAME_BASE_URL = "https://api.apiframe.pro";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const API_FRAME_KEY = Deno.env.get("API_FRAME_KEY") || Deno.env.get("APIFRAME_API_KEY");
    
    if (!API_FRAME_KEY) {
      console.error("[apiframe-video-create-task] API_FRAME_KEY not configured");
      throw new Error("API_FRAME_KEY not configured");
    }

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error("[apiframe-video-create-task] Error parsing request body:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { prompt, model, imageUrl, params = {} } = requestBody;
    
    if (!prompt && !imageUrl) {
      console.error("[apiframe-video-create-task] Either prompt or imageUrl is required");
      return new Response(
        JSON.stringify({ error: "Either prompt or imageUrl is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    console.log(`[apiframe-video-create-task] Generating video using model ${model}`);
    console.log(`[apiframe-video-create-task] Prompt: ${prompt?.substring(0, 50)}${prompt?.length > 50 ? '...' : ''}`);
    console.log(`[apiframe-video-create-task] Has image URL: ${!!imageUrl}`);

    // Initialize Supabase client for database operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get webhook URL for status updates
    const webhookUrl = `${supabaseUrl}/functions/v1/apiframe-media-webhook`;
    console.log(`[apiframe-video-create-task] Using webhook URL: ${webhookUrl}`);

    // Configure API request based on the model type
    let endpoint: string;
    let payload: Record<string, any>;
    
    // Determine which API Frame endpoint to use based on the model
    if (model === 'kling-text') {
      endpoint = `${APIFRAME_BASE_URL}/kling/text`;
      payload = {
        prompt: prompt,
        webhook_url: webhookUrl
      };
    } else if (model === 'kling-image') {
      endpoint = `${APIFRAME_BASE_URL}/kling/image`;
      payload = {
        image_url: imageUrl,
        prompt: prompt || "Generate video from this image",
        webhook_url: webhookUrl
      };
    } else {
      console.error(`[apiframe-video-create-task] Unsupported model: ${model}`);
      return new Response(
        JSON.stringify({ error: "Unsupported video model" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    // Add optional parameters if provided
    if (params.duration) payload.duration = params.duration;
    if (params.resolution) payload.resolution = params.resolution;
    
    console.log(`[apiframe-video-create-task] Making API request to ${endpoint}`);
    console.log(`[apiframe-video-create-task] Payload:`, JSON.stringify(payload));
    
    // Make the API request
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_FRAME_KEY}`
      },
      body: JSON.stringify(payload)
    });

    // Check for errors
    if (!response.ok) {
      let errorText = await response.text();
      console.error(`[apiframe-video-create-task] API error (${response.status}):`, errorText);
      
      // Try to parse error as JSON if possible
      let errorMessage;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.error || response.statusText;
      } catch (_) {
        errorMessage = `Error: ${response.statusText}`;
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: response.status }
      );
    }

    // Parse successful response
    const apiData = await response.json();
    console.log("[apiframe-video-create-task] API response:", JSON.stringify(apiData).substring(0, 200));
    
    // Extract task ID from response
    const taskId = apiData.task_id || apiData.id;
    if (!taskId) {
      console.error("[apiframe-video-create-task] No task ID in response");
      return new Response(
        JSON.stringify({ error: "No task ID in API response" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Store task information in database
    const { error: insertError } = await supabaseClient
      .from("apiframe_tasks")
      .insert({
        task_id: taskId,
        model: model,
        prompt: prompt,
        media_type: "video",
        status: "processing",
        params: {
          imageUrl: imageUrl || null,
          ...params
        }
      });

    if (insertError) {
      console.error(`[apiframe-video-create-task] Error inserting task record:`, insertError);
    } else {
      console.log("[apiframe-video-create-task] Successfully recorded task in database");
    }

    // Return successful response
    return new Response(
      JSON.stringify({
        success: true,
        taskId,
        message: `Video generation started with model ${model}`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[apiframe-video-create-task] Unexpected error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "An unknown error occurred"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
