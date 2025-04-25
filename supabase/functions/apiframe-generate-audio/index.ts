
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
    const { prompt, model = "mmaudio-txt2audio", params = {}, referenceUrl } = await req.json();
    
    if (!prompt && !referenceUrl) {
      return new Response(
        JSON.stringify({ error: "Either prompt or reference media is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Map the model to the corresponding APIframe model
    let apiframeModel;
    let taskType = "txt2audio";
    
    switch (model) {
      case "mmaudio-txt2audio":
        apiframeModel = "meta/mmaudio-txt2audio";
        taskType = "txt2audio";
        break;
      case "mmaudio-video2audio":
        apiframeModel = "meta/mmaudio-video2audio";
        taskType = "video2audio";
        break;
      case "diffrhythm-base":
        apiframeModel = "diffrhythm/base";
        taskType = "txt2audio";
        break;
      case "diffrhythm-full":
        apiframeModel = "diffrhythm/full";
        taskType = "txt2audio";
        break;
      case "elevenlabs":
        apiframeModel = "elevenlabs/tts";
        taskType = "txt2audio";
        break;
      default:
        apiframeModel = "meta/mmaudio-txt2audio"; // Default
    }

    console.log(`Generating audio with model ${apiframeModel} and prompt: "${prompt?.substring(0, 50)}..."`);

    // Set up webhook
    const webhookEndpoint = `${Deno.env.get("SUPABASE_URL")}/functions/v1/apiframe-media-webhook`;
    
    // Prepare task data
    const taskData: any = {
      "model": apiframeModel,
      "task_type": taskType,
      "input": {
        "prompt": prompt || ""
      },
      "config": {
        "webhook_config": {
          "endpoint": webhookEndpoint
        }
      }
    };

    // Add specific parameters based on the task type
    if (params.length) {
      taskData.input.duration = params.length;
    }

    // Add reference video for video-to-audio models
    if (taskType === "video2audio" && referenceUrl) {
      taskData.input.video_url = referenceUrl;
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
        media_type: "audio",
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
        message: `Audio generation task created successfully. Awaiting processing.`
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error(`Error: ${error.message}`);
    
    // Implement retries here if needed
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to generate audio", 
        message: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
