
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
    const PIAPI_API_KEY = Deno.env.get("PIAPI_API_KEY") || "";
    if (!PIAPI_API_KEY) {
      throw new Error("PIAPI_API_KEY not configured");
    }

    const { prompt, model, imageUrl, params = {} } = await req.json();
    
    if (!prompt && !imageUrl) {
      return new Response(
        JSON.stringify({ error: "Either prompt or imageUrl is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Construct the task data based on the model
    let taskData;
    let apiUrl = "https://api.piapi.ai/api/v1/task";

    // Common webhook configuration
    const webhookConfig = {
      "webhook_config": {
        "endpoint": `${Deno.env.get("SUPABASE_URL")}/functions/v1/piapi-media-webhook`
      }
    };

    if (model.includes("kling")) {
      if (model === "kling-text") {
        taskData = {
          "model": "kling/text-to-video",
          "task_type": "text-to-video",
          "input": {
            "prompt": prompt,
            "duration": params.duration || 10,
            "aspect_ratio": params.aspectRatio || "16:9"
          },
          "config": webhookConfig
        };
      } else if (model === "kling-image") {
        if (!imageUrl) {
          throw new Error("Image URL is required for image-to-video generation");
        }
        
        taskData = {
          "model": "kling/image-to-video",
          "task_type": "image-to-video",
          "input": {
            "image_url": imageUrl,
            "duration": params.duration || 8
          },
          "config": webhookConfig
        };
      }
    } else if (model.includes("hunyuan")) {
      const modelName = model === "hunyuan-fast" 
        ? "hunyuan/txt2video-fast" 
        : "hunyuan/txt2video-standard";
        
      taskData = {
        "model": modelName,
        "task_type": "txt2video-standard",
        "input": {
          "prompt": prompt,
          "duration": params.duration || 8
        },
        "config": webhookConfig
      };
    } else if (model.includes("hailuo")) {
      if (model === "hailuo-text") {
        taskData = {
          "model": "hailuo/t2v-01",
          "task_type": "video_generation",
          "input": {
            "prompt": prompt,
            "duration": params.duration || 6
          },
          "config": webhookConfig
        };
      } else if (model === "hailuo-image") {
        if (!imageUrl) {
          throw new Error("Image URL is required for image-to-video generation");
        }
        
        taskData = {
          "model": "hailuo/i2v-01",
          "task_type": "video_generation",
          "input": {
            "prompt": prompt,
            "image_url": imageUrl,
            "duration": params.duration || 6
          },
          "config": webhookConfig
        };
      }
    } else {
      return new Response(
        JSON.stringify({ error: "Unsupported model" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`Creating video task with model ${taskData.model}`);
    
    // Send request to PiAPI
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PIAPI_API_KEY}`
      },
      body: JSON.stringify(taskData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Error creating task: ${JSON.stringify(errorData)}`);
      throw new Error(`Error from PiAPI: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log(`Task created successfully: ${data.task_id}`);

    // Store task info in Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    const { error: insertError } = await supabaseClient
      .from("piapi_tasks")
      .insert({
        task_id: data.task_id,
        model: taskData.model,
        prompt,
        status: "pending",
        media_type: "video",
        params: params
      });

    if (insertError) {
      console.error(`Error inserting task record: ${insertError.message}`);
    }

    return new Response(
      JSON.stringify({
        task_id: data.task_id,
        status: "pending",
        message: `Video generation task created with model ${taskData.model}`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
