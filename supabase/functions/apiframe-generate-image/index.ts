import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify API key
    const APIFRAME_API_KEY = Deno.env.get("APIFRAME_API_KEY");
    if (!APIFRAME_API_KEY) {
      throw new Error("APIFRAME_API_KEY not configured");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get request parameters
    const { prompt, model = "sdxl", params = {} } = await req.json();
    
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Configure webhook
    const webhookEndpoint = `${Deno.env.get("SUPABASE_URL")}/functions/v1/apiframe-media-webhook`;
    
    // Prepare task data
    const taskData = {
      "prompt": prompt,
      "webhook_url": webhookEndpoint,
      "webhook_secret": Deno.env.get("APIFRAME_WEBHOOK_SECRET") || "apiframe-webhook-secret"
    };

    // Add model-specific parameters based on the selected model
    if (model === "sdxl" || model === "sdxl-turbo") {
      taskData["model"] = model;
      taskData["negative_prompt"] = params.negative_prompt || "";
      taskData["width"] = params.width || 1024;
      taskData["height"] = params.height || 1024;
      taskData["num_inference_steps"] = params.num_inference_steps || 30;
      taskData["guidance_scale"] = params.guidance_scale || 7.5;
    } else if (model === "kandinsky") {
      taskData["model"] = "kandinsky";
      taskData["negative_prompt"] = params.negative_prompt || "";
      taskData["width"] = params.width || 1024;
      taskData["height"] = params.height || 1024;
    } else if (model === "deepfloyd") {
      taskData["model"] = "deepfloyd";
      taskData["negative_prompt"] = params.negative_prompt || "";
    } else if (model === "dalle") {
      taskData["model"] = "dalle";
      taskData["quality"] = params.quality || "standard";
      taskData["size"] = params.size || "1024x1024";
    }

    console.log(`[apiframe-generate-image] Creating task with model ${model}`);

    // Create task in APIframe
    const apiResponse = await fetch("https://api.apiframe.pro/imagine", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": APIFRAME_API_KEY
      },
      body: JSON.stringify(taskData)
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      console.error(`[apiframe-generate-image] Error creating task:`, errorData);
      throw new Error(`APIframe error: ${errorData.error?.message || apiResponse.statusText}`);
    }

    // Process response
    const responseData = await apiResponse.json();
    const taskId = responseData.task_id;
    
    console.log(`[apiframe-generate-image] Task created successfully. ID: ${taskId}`);

    // Save task information in database
    const { error: insertError } = await supabase
      .from("apiframe_tasks")
      .insert({
        task_id: taskId,
        model,
        prompt,
        status: "pending",
        media_type: "image",
        params: params
      });

    if (insertError) {
      console.error(`[apiframe-generate-image] Error inserting task record:`, insertError);
    }

    // Return response with task ID
    return new Response(
      JSON.stringify({
        taskId: taskId,
        status: "pending"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error(`[apiframe-generate-image] Error:`, error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to generate image", 
        message: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
