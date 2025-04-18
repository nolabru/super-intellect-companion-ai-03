
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

    const { prompt, model, videoUrl, params = {} } = await req.json();
    
    if ((!prompt && !videoUrl) || (model.includes("video2audio") && !videoUrl)) {
      return new Response(
        JSON.stringify({ error: "Required input missing for selected model" }),
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

    if (model === "mmaudio-video2audio") {
      taskData = {
        "model": "mmaudio/video2audio",
        "task_type": "video2audio",
        "input": {
          "video": videoUrl,
          "prompt": prompt || "Background music"
        },
        "config": webhookConfig
      };
    } else if (model === "mmaudio-txt2audio") {
      taskData = {
        "model": "mmaudio/txt2audio",
        "task_type": "txt2audio",
        "input": {
          "prompt": prompt,
          "length": params.length || "90s"
        },
        "config": webhookConfig
      };
    } else if (model === "diffrhythm-base") {
      taskData = {
        "model": "diffRhythm/txt2audio-base",
        "task_type": "txt2audio-base",
        "input": {
          "prompt": prompt,
          "length": params.length || "2m"
        },
        "config": webhookConfig
      };
    } else if (model === "diffrhythm-full") {
      taskData = {
        "model": "diffRhythm/txt2audio-full",
        "task_type": "txt2audio-full",
        "input": {
          "lyrics": params.lyrics || prompt,
          "style_prompt": params.stylePrompt || "Pop music",
          "length": params.length || "3m"
        },
        "config": webhookConfig
      };
    } else {
      return new Response(
        JSON.stringify({ error: "Unsupported model" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`Creating audio task with model ${taskData.model}`);
    
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
        media_type: "audio",
        params: params
      });

    if (insertError) {
      console.error(`Error inserting task record: ${insertError.message}`);
    }

    return new Response(
      JSON.stringify({
        task_id: data.task_id,
        status: "pending",
        message: `Audio generation task created with model ${taskData.model}`
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
