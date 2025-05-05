
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Valid parameter values based on API documentation
const VALID_DURATIONS = [5, 10];
const VALID_MODELS = ["kling-v1", "kling-v1-5", "kling-v1-6"];
const VALID_MODES = ["std", "pro"];
const VALID_ASPECT_RATIOS = ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"];
const VALID_GENERATION_TYPES = ["text2video", "image2video"];

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify API key configuration
    const API_FRAME_KEY = Deno.env.get("API_FRAME_KEY");
    if (!API_FRAME_KEY) {
      throw new Error("API_FRAME_KEY is not configured");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Extract parameters from the request
    const { 
      prompt, 
      model, 
      imageUrl, 
      videoType = "text-to-video", 
      duration = 5,
      resolution = "720p",
      aspectRatio = "16:9",
      klingModel = "kling-v1-5",
      klingMode = "std"
    } = await req.json();
    
    // Validate required parameters
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required for video generation" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    
    // Map internal video type to Kling API format
    const generation_type = videoType === 'text-to-video' ? 'text2video' : 'image2video';
    
    // Validate duration (API only accepts 5 or 10)
    const validatedDuration = VALID_DURATIONS.includes(duration) ? duration : 5;
    if (duration !== validatedDuration) {
      console.log(`[video-generation] Invalid duration (${duration}), using ${validatedDuration} instead`);
    }
    
    // Validate model
    const validatedModel = VALID_MODELS.includes(klingModel) ? klingModel : "kling-v1-5";
    if (klingModel !== validatedModel) {
      console.log(`[video-generation] Invalid model (${klingModel}), using ${validatedModel} instead`);
    }
    
    // Validate mode
    let validatedMode = VALID_MODES.includes(klingMode) ? klingMode : "std";
    // Pro mode only works with kling-v1-5
    if (validatedMode === "pro" && validatedModel !== "kling-v1-5") {
      console.log(`[video-generation] Pro mode only works with kling-v1-5, using std mode instead`);
      validatedMode = "std";
    }
    
    // Validate aspect ratio
    const validatedAspectRatio = VALID_ASPECT_RATIOS.includes(aspectRatio) ? aspectRatio : "16:9";
    if (aspectRatio !== validatedAspectRatio) {
      console.log(`[video-generation] Invalid aspect ratio (${aspectRatio}), using ${validatedAspectRatio} instead`);
    }
    
    console.log(`[video-generation] Creating video task for model: ${model}`);
    console.log(`[video-generation] Parameters:`, { 
      prompt, 
      videoType, 
      generation_type,
      validatedDuration, 
      validatedAspectRatio, 
      validatedModel, 
      validatedMode 
    });

    // Build the payload for the API Frame Kling API
    const payload = {
      "prompt": prompt,
      "generation_type": generation_type,
      "model": validatedModel,
      "duration": validatedDuration,
      "mode": validatedMode
    };
    
    // Add aspect ratio for text2video 
    if (generation_type === 'text2video' && validatedAspectRatio) {
      payload["aspect_ratio"] = validatedAspectRatio;
    }
    
    // Add image_url for img2video
    if (generation_type === 'image2video' && imageUrl) {
      payload["image_url"] = imageUrl;
    }
    
    // Define the webhook URL for task updates
    const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/piapi-media-webhook`;
    if (webhookUrl) {
      payload["webhook_url"] = webhookUrl;
      payload["webhook_secret"] = "apiframe-callback";
    }
    
    console.log(`[video-generation] Sending request to API Frame:`, payload);
    
    // Send the request to API Frame
    const apiResponse = await fetch("https://api.apiframe.pro/kling-imagine", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": API_FRAME_KEY
      },
      body: JSON.stringify(payload)
    });
    
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      let errorMessage = `API Frame error (${apiResponse.status})`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        errorMessage = errorText || errorMessage;
      }
      
      console.error(`[video-generation] Error from API Frame:`, errorMessage);
      throw new Error(errorMessage);
    }
    
    const apiData = await apiResponse.json();
    const taskId = apiData.task_id;
    
    if (!taskId) {
      throw new Error("No task ID returned from API Frame");
    }
    
    console.log(`[video-generation] Task created successfully with ID: ${taskId}`);
    
    // Save the task in the database
    const { error: insertError } = await supabase
      .from("piapi_tasks")
      .insert({
        task_id: taskId,
        model: `${validatedModel}-${generation_type}`,
        prompt,
        status: "pending",
        media_type: "video",
        params: {
          videoType: generation_type,
          duration: validatedDuration,
          aspectRatio: validatedAspectRatio,
          model: validatedModel,
          mode: validatedMode,
          imageUrl
        }
      });

    if (insertError) {
      console.error(`[video-generation] Error inserting task record: ${insertError.message}`);
    }

    // Return success response
    return new Response(
      JSON.stringify({
        taskId: taskId,
        status: "pending",
        message: `Video generation task created successfully with model ${validatedModel}`
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error(`[video-generation] Error: ${error.message}`);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to process video generation request", 
        message: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
