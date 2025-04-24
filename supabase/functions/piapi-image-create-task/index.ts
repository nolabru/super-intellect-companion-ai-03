
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

    // Get webhook URL
    const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/piapi-media-webhook`;

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
    let modelName = "";

    // Common webhook configuration
    const webhookConfig = {
      "webhook_config": {
        "endpoint": webhookUrl
      }
    };

    switch (model) {
      case "flux-dev":
        modelName = "Qubico/flux1-dev";
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
        break;
      case "flux-schnell":
        modelName = "Qubico/flux1-schnell";
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
        break;
      case "midjourney":
        modelName = "midjourney";
        apiUrl = "https://api.piapi.ai/api/v1/midjourney/imagine";
        taskData = {
          "prompt": prompt,
          "webhook_url": webhookUrl
        };
        break;
      case "dalle-3":
        modelName = "dall-e-3";
        apiUrl = "https://api.piapi.ai/v1/images/generate";
        
        // Retornar diretamente pois não é baseado no sistema de tarefas
        const dalleResponse = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${PIAPI_API_KEY}`
          },
          body: JSON.stringify({
            model: modelName,
            prompt: prompt,
            size: params.size || "1024x1024"
          })
        });

        if (!dalleResponse.ok) {
          const errorData = await dalleResponse.json();
          throw new Error(`Error from PiAPI: ${errorData.error?.message || dalleResponse.statusText}`);
        }

        const dalleData = await dalleResponse.json();
        const imageUrl = dalleData.data?.url;
        
        if (!imageUrl) {
          throw new Error("No image URL received from PiAPI");
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
            model: modelName,
            prompt,
            status: "completed",
            media_type: "image",
            media_url: imageUrl,
            params: params
          });

        if (insertError) {
          console.error(`Error inserting task record: ${insertError.message}`);
        } else {
          // Inserir evento de mídia pronta
          await supabaseClient
            .from("media_ready_events")
            .insert({
              task_id: generatedId,
              media_type: "image",
              media_url: imageUrl,
              prompt,
              model: modelName
            });
        }

        return new Response(
          JSON.stringify({
            task_id: generatedId,
            status: "completed",
            media_url: imageUrl,
            message: `Image generated with model ${modelName}`
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
        
      case "sdxl":
        modelName = "stable-diffusion-xl";
        apiUrl = "https://api.piapi.ai/v1/images/generate";
        
        // Similar ao DALL-E, retornar diretamente
        const sdxlResponse = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${PIAPI_API_KEY}`
          },
          body: JSON.stringify({
            model: modelName,
            prompt: prompt,
            size: params.size || "1024x1024",
            negative_prompt: params.negativePrompt || ""
          })
        });

        if (!sdxlResponse.ok) {
          const errorData = await sdxlResponse.json();
          throw new Error(`Error from PiAPI: ${errorData.error?.message || sdxlResponse.statusText}`);
        }

        const sdxlData = await sdxlResponse.json();
        const sdxlImageUrl = sdxlData.data?.url;
        
        if (!sdxlImageUrl) {
          throw new Error("No image URL received from PiAPI");
        }

        // Store info in Supabase
        const supabaseClientSdxl = createClient(
          Deno.env.get("SUPABASE_URL") || "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
        );

        const generatedIdSdxl = crypto.randomUUID();
        
        const { error: insertErrorSdxl } = await supabaseClientSdxl
          .from("piapi_tasks")
          .insert({
            task_id: generatedIdSdxl,
            model: modelName,
            prompt,
            status: "completed",
            media_type: "image",
            media_url: sdxlImageUrl,
            params: params
          });

        if (insertErrorSdxl) {
          console.error(`Error inserting task record: ${insertErrorSdxl.message}`);
        } else {
          // Inserir evento de mídia pronta
          await supabaseClientSdxl
            .from("media_ready_events")
            .insert({
              task_id: generatedIdSdxl,
              media_type: "image",
              media_url: sdxlImageUrl,
              prompt,
              model: modelName
            });
        }

        return new Response(
          JSON.stringify({
            task_id: generatedIdSdxl,
            status: "completed",
            media_url: sdxlImageUrl,
            message: `Image generated with model ${modelName}`
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
        
      default:
        return new Response(
          JSON.stringify({ error: "Unsupported model" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
    }

    console.log(`Creating image task with model ${modelName}`);
    
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
    console.error(`Error: ${error.message}`);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
