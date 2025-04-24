
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DALL_E_API_URL = "https://api.piapi.ai/v1/images/generate";
const TASK_API_URL = "https://api.piapi.ai/api/v1/task";

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

    // Get webhook URL
    const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/piapi-media-webhook`;

    const { prompt, model, params = {} } = await req.json();
    
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Validate parameters
    if (params.width && (params.width < 256 || params.width > 1024)) {
      return new Response(
        JSON.stringify({ error: "Width must be between 256 and 1024 pixels" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (params.height && (params.height < 256 || params.height > 1024)) {
      return new Response(
        JSON.stringify({ error: "Height must be between 256 and 1024 pixels" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Handle DALL-E 3 and SDXL models differently
    if (model === "dall-e-3" || model === "sdxl") {
      console.log(`Processing request for ${model} model with direct API call`);
      
      try {
        const dalleResponse = await fetch(DALL_E_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${PIAPI_API_KEY}`
          },
          body: JSON.stringify({
            model: model === "dall-e-3" ? "dall-e-3" : "stable-diffusion-xl",
            prompt: prompt,
            size: params.size || "1024x1024",
            negative_prompt: params.negativePrompt
          })
        });

        if (!dalleResponse.ok) {
          const errorData = await dalleResponse.json();
          console.error(`Error from PiAPI (${model}):`, errorData);
          throw new Error(errorData.error?.message || `Error from ${model}: ${dalleResponse.statusText}`);
        }

        const dalleData = await dalleResponse.json();
        console.log(`Successful response from ${model}:`, {
          hasData: !!dalleData.data,
          hasUrl: dalleData.data?.url ? 'yes' : 'no'
        });

        if (!dalleData.data?.url) {
          throw new Error(`No image URL received from ${model}`);
        }

        // Store info in Supabase
        const supabaseClient = createClient(
          Deno.env.get("SUPABASE_URL") || "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
        );

        const generatedId = crypto.randomUUID();
        
        const { error: insertError } = await supabaseClient
          .from("piapi_tasks")
          .insert({
            task_id: generatedId,
            model: model,
            prompt,
            status: "completed",
            media_type: "image",
            media_url: dalleData.data.url,
            params: params
          });

        if (insertError) {
          console.error(`Error inserting task record: ${insertError.message}`);
        } else {
          // Insert media ready event
          await supabaseClient
            .from("media_ready_events")
            .insert({
              task_id: generatedId,
              media_type: "image",
              media_url: dalleData.data.url,
              prompt,
              model: model
            });
        }

        return new Response(
          JSON.stringify({
            task_id: generatedId,
            status: "completed",
            media_url: dalleData.data.url,
            message: `Image generated with model ${model}`
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (error) {
        console.error(`Error processing ${model} request:`, error);
        throw error;
      }
    }

    // For other models (Flux, etc.), use the task-based API
    console.log(`Processing request for ${model} model with task API`);
    
    let modelName = "";
    let taskData;

    switch (model) {
      case "flux-dev":
        modelName = "Qubico/flux1-dev";
        break;
      case "flux-schnell":
        modelName = "Qubico/flux1-schnell";
        break;
      default:
        return new Response(
          JSON.stringify({ error: "Unsupported model" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
    }

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
      "config": {
        "webhook_config": {
          "endpoint": webhookUrl
        }
      }
    };

    console.log(`Creating task with model ${modelName}`);
    
    const response = await fetch(TASK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PIAPI_API_KEY}`
      },
      body: JSON.stringify(taskData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error response from PiAPI:", errorData);
      throw new Error(`Error from PiAPI: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log("Task created successfully:", data);

    // Store task info in Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    const { error: insertError } = await supabaseClient
      .from("piapi_tasks")
      .insert({
        task_id: data.task_id,
        model: modelName,
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
        message: `Image generation task created with model ${modelName}`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Check the edge function logs for more information"
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 500 
      }
    );
  }
});
