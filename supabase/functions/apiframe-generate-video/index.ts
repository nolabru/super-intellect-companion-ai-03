
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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
    const { prompt, model = "kling-text", params = {}, referenceUrl } = await req.json();
    
    if (!prompt && !referenceUrl) {
      return new Response(
        JSON.stringify({ error: "Either prompt or reference image is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Map the model to the corresponding APIframe model
    let apiframeModel;
    let taskType = "txt2vid";
    
    switch (model) {
      case "kling-text":
        apiframeModel = "kling/text-to-video";
        taskType = "txt2vid";
        break;
      case "kling-image":
        apiframeModel = "kling/image-to-video";
        taskType = "img2vid";
        break;
      case "hunyuan-fast":
        apiframeModel = "tencent/hunyuan-video-fast";
        taskType = "txt2vid";
        break;
      case "hunyuan-standard":
        apiframeModel = "tencent/hunyuan-video";
        taskType = "txt2vid";
        break;
      case "hailuo-text":
        apiframeModel = "hailuo/text-to-video";
        taskType = "txt2vid";
        break;
      case "hailuo-image":
        apiframeModel = "hailuo/image-to-video";
        taskType = "img2vid";
        break;
      default:
        apiframeModel = "kling/text-to-video"; // Default
    }

    console.log(`Generating video with model ${apiframeModel} and prompt: "${prompt?.substring(0, 50)}..."`);

    // Set up webhook
    const webhookEndpoint = `${Deno.env.get("SUPABASE_URL")}/functions/v1/apiframe-media-webhook`;
    
    // Prepare task data
    const taskData: any = {
      "model": apiframeModel,
      "task_type": taskType,
      "input": {
        "prompt": prompt || "",
        "negative_prompt": params.negativePrompt || ""
      },
      "config": {
        "webhook_config": {
          "endpoint": webhookEndpoint
        }
      }
    };

    // Add specific parameters based on the task type
    if (params.duration) {
      taskData.input.duration = parseInt(params.duration) || 10;
    }

    if (params.aspectRatio) {
      taskData.input.aspect_ratio = params.aspectRatio || "16:9";
    }

    // Add reference image for image-to-video models
    if (taskType === "img2vid" && referenceUrl) {
      taskData.input.image_url = referenceUrl;
    }

    // Create task in APIframe
    const apiResponse = await fetch("https://api.apiframe.ai/v1/task", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${APIFRAME_API_KEY}`
      },
      body: JSON.stringify(taskData)
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      console.error(`Error creating task in APIframe: ${JSON.stringify(errorData)}`);
      throw new Error(`APIframe error: ${errorData.error?.message || apiResponse.statusText}`);
    }

    // Process response
    const responseData = await apiResponse.json();
    const taskId = responseData.task_id;
    
    console.log(`Task created successfully. ID: ${taskId}`);

    // Save task information in database
    const { error: insertError } = await supabase
      .from("apiframe_tasks")
      .insert({
        task_id: taskId,
        model: apiframeModel,
        prompt,
        status: "pending",
        media_type: "video",
        params: params
      });

    if (insertError) {
      console.error(`Error inserting task record: ${insertError.message}`);
    }

    // Return response with task ID
    return new Response(
      JSON.stringify({
        taskId: taskId,
        status: "pending",
        message: `Video generation task created successfully. Awaiting processing.`
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error(`Error: ${error.message}`);
    
    // Implement retries here if needed
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to generate video", 
        message: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
