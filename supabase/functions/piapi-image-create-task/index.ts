
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

    const { prompt, model, params = {} } = await req.json();
    
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
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

    if (model === "piapi-midjourney") {
      // Midjourney specific configuration
      taskData = {
        "model": "midjourney",
        "task_type": "imagine",
        "input": {
          "prompt": prompt,
          "aspect_ratio": params.aspectRatio || "1:1",
          "process_mode": params.processMode || "fast",
          "skip_prompt_check": params.skipPromptCheck || false
        },
        "config": {
          ...webhookConfig,
          "service_mode": params.serviceMode || "public"
        }
      };
    } else if (model.includes("flux")) {
      // Flux models (image generation)
      const modelName = model === "piapi-flux-schnell" ? "Qubico/flux1-schnell" : "Qubico/flux1-dev";
      
      taskData = {
        "model": modelName,
        "task_type": "txt2img",
        "input": {
          "prompt": prompt,
          "negative_prompt": params.negativePrompt || "",
          "guidance_scale": params.guidanceScale || 7.5,
          "width": params.width || 768,
          "height": params.height || 768
        },
        "config": webhookConfig
      };
    } else {
      return new Response(
        JSON.stringify({ error: "Unsupported model" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`Creating image task with model ${taskData.model}`);
    
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
        media_type: "image",
        params: params
      });

    if (insertError) {
      console.error(`Error inserting task record: ${insertError.message}`);
    }

    return new Response(
      JSON.stringify({
        task_id: data.task_id,
        status: "pending",
        message: `Image generation task created with model ${taskData.model}`
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
