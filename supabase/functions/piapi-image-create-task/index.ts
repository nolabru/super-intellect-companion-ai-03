
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PIAPI_API_BASE_URL = "https://api.piapi.ai/api/v1";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PIAPI_API_KEY = Deno.env.get("PIAPI_API_KEY") || "";
    if (!PIAPI_API_KEY) {
      console.error("[piapi-image-create-task] PIAPI_API_KEY not configured");
      throw new Error("PIAPI_API_KEY not configured");
    }

    const { prompt, model, params = {} } = await req.json();
    
    if (!prompt) {
      console.error("[piapi-image-create-task] Prompt is required");
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`[piapi-image-create-task] Processing request for ${model} with prompt: ${prompt.substring(0, 50)}...`);

    // Validate image parameters
    if (params.width && (params.width < 256 || params.width > 1024)) {
      console.error("[piapi-image-create-task] Invalid width parameter");
      return new Response(
        JSON.stringify({ error: "Width must be between 256 and 1024 pixels" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (params.height && (params.height < 256 || params.height > 1024)) {
      console.error("[piapi-image-create-task] Invalid height parameter");
      return new Response(
        JSON.stringify({ error: "Height must be between 256 and 1024 pixels" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Handle DALL-E 3 and SDXL models with direct API call
    if (model === "dall-e-3" || model === "sdxl") {
      console.log(`[piapi-image-create-task] Processing direct API request for ${model}`);
      
      try {
        const requestBody = {
          model: model === "dall-e-3" ? "dall-e-3" : "stable-diffusion-xl",
          prompt: prompt,
          size: params.size || "1024x1024",
          n: 1,
        };

        // Add optional parameters if provided
        if (params.negativePrompt) requestBody.negative_prompt = params.negativePrompt;
        if (params.style) requestBody.style = params.style || "vivid";
        if (params.quality) requestBody.quality = params.quality || "standard";

        console.log(`[piapi-image-create-task] Request body: ${JSON.stringify(requestBody)}`);

        const dalleResponse = await fetch(`${PIAPI_API_BASE_URL}/images/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${PIAPI_API_KEY}`
          },
          body: JSON.stringify(requestBody)
        });

        console.log(`[piapi-image-create-task] API Response Status: ${dalleResponse.status}`);

        const responseText = await dalleResponse.text();
        console.log(`[piapi-image-create-task] Raw API Response: ${responseText.substring(0, 200)}...`);

        if (!dalleResponse.ok) {
          let errorMessage;
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.error?.message || `Error from ${model}: ${dalleResponse.statusText}`;
            console.error(`[piapi-image-create-task] Parsed API Error:`, errorMessage);
          } catch (e) {
            errorMessage = `Error from ${model}: ${dalleResponse.statusText}`;
            console.error(`[piapi-image-create-task] Failed to parse error response:`, e);
          }
          throw new Error(errorMessage);
        }

        let dalleData;
        try {
          dalleData = JSON.parse(responseText);
        } catch (e) {
          console.error(`[piapi-image-create-task] Failed to parse JSON response:`, e);
          throw new Error(`Failed to parse API response from ${model}`);
        }

        console.log(`[piapi-image-create-task] Successfully parsed response:`, {
          hasData: !!dalleData.data,
          hasUrl: dalleData.data?.url ? 'yes' : 'no'
        });

        if (!dalleData.data?.url) {
          console.error(`[piapi-image-create-task] No URL in response:`, dalleData);
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
          console.error(`[piapi-image-create-task] Error inserting task record:`, insertError);
        } else {
          // Insert media ready event
          const { error: eventError } = await supabaseClient
            .from("media_ready_events")
            .insert({
              task_id: generatedId,
              media_type: "image",
              media_url: dalleData.data.url,
              prompt,
              model: model
            });
            
          if (eventError) {
            console.error(`[piapi-image-create-task] Error inserting media ready event:`, eventError);
          }
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
        console.error(`[piapi-image-create-task] Error processing ${model} request:`, error);
        throw error;
      }
    }

    // For Flux models, use the task-based API
    console.log(`[piapi-image-create-task] Processing request for ${model} model with task API`);
    
    let modelName = "";

    switch (model) {
      case "flux-dev":
        modelName = "Qubico/flux1-dev";
        break;
      case "flux-schnell":
        modelName = "Qubico/flux1-schnell";
        break;
      default:
        console.error(`[piapi-image-create-task] Unsupported model: ${model}`);
        return new Response(
          JSON.stringify({ error: "Unsupported model" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
    }

    // Get webhook URL for task notifications
    const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/piapi-media-webhook`;

    const taskData = {
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

    console.log(`[piapi-image-create-task] Creating task with model ${modelName}`);
    console.log(`[piapi-image-create-task] Task data: ${JSON.stringify(taskData)}`);
    
    const response = await fetch(`${PIAPI_API_BASE_URL}/task`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PIAPI_API_KEY}`
      },
      body: JSON.stringify(taskData)
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.error("[piapi-image-create-task] Error response from PiAPI:", responseText);
      let errorMessage;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error?.message || `Error from PiAPI: ${response.statusText}`;
      } catch (e) {
        errorMessage = `Error from PiAPI: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("[piapi-image-create-task] Task created successfully:", data);

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
      console.error(`[piapi-image-create-task] Error inserting task record:`, insertError);
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
    console.error("[piapi-image-create-task] Error:", error);
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
