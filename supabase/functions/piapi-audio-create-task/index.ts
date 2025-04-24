
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
    let modelName = "";

    // Common webhook configuration
    const webhookConfig = {
      "webhook_config": {
        "endpoint": webhookUrl
      }
    };

    switch (model) {
      case "mmaudio-video2audio":
        modelName = "mmaudio/video2audio";
        taskData = {
          "model": modelName,
          "task_type": "video2audio",
          "input": {
            "video": videoUrl,
            "prompt": prompt || "Background music"
          },
          "config": webhookConfig
        };
        break;
      case "mmaudio-txt2audio":
        modelName = "mmaudio/txt2audio";
        taskData = {
          "model": modelName,
          "task_type": "txt2audio",
          "input": {
            "prompt": prompt,
            "length": params.length || "90s"
          },
          "config": webhookConfig
        };
        break;
      case "diffrhythm-base":
        modelName = "diffRhythm/txt2audio-base";
        taskData = {
          "model": modelName,
          "task_type": "txt2audio-base",
          "input": {
            "prompt": prompt,
            "length": params.length || "2m"
          },
          "config": webhookConfig
        };
        break;
      case "diffrhythm-full":
        modelName = "diffRhythm/txt2audio-full";
        taskData = {
          "model": modelName,
          "task_type": "txt2audio-full",
          "input": {
            "lyrics": params.lyrics || prompt,
            "style_prompt": params.stylePrompt || "Pop music",
            "length": params.length || "3m"
          },
          "config": webhookConfig
        };
        break;
      case "elevenlabs":
        modelName = "elevenlabs";
        
        // Método direto para Elevenlabs (não baseado em tasks)
        apiUrl = "https://api.piapi.ai/v1/audio/generate";
        
        const elevenLabsResponse = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${PIAPI_API_KEY}`
          },
          body: JSON.stringify({
            model: modelName,
            text: prompt,
            voice: params.voice || "eleven_monolingual_v1",
            stability: params.stability || 0.5,
            similarity_boost: params.similarityBoost || 0.75
          })
        });
        
        if (!elevenLabsResponse.ok) {
          const errorData = await elevenLabsResponse.json();
          throw new Error(`Error from PiAPI: ${errorData.error?.message || elevenLabsResponse.statusText}`);
        }
        
        const elevenLabsData = await elevenLabsResponse.json();
        const audioUrl = elevenLabsData.data?.url;
        
        if (!audioUrl) {
          throw new Error("No audio URL received from PiAPI");
        }
        
        // Armazenar na base de dados
        const supabaseClientDirect = createClient(
          Deno.env.get("SUPABASE_URL") || "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
        );
        
        const generatedId = crypto.randomUUID();
        
        const { error: insertErrorDirect } = await supabaseClientDirect
          .from("piapi_tasks")
          .insert({
            task_id: generatedId,
            model: modelName,
            prompt,
            status: "completed",
            media_type: "audio",
            media_url: audioUrl,
            params: params
          });
          
        if (insertErrorDirect) {
          console.error(`Error inserting task record: ${insertErrorDirect.message}`);
        } else {
          // Inserir evento de mídia pronta
          await supabaseClientDirect
            .from("media_ready_events")
            .insert({
              task_id: generatedId,
              media_type: "audio",
              media_url: audioUrl,
              prompt,
              model: modelName
            });
        }
        
        return new Response(
          JSON.stringify({
            task_id: generatedId,
            status: "completed",
            media_url: audioUrl,
            message: `Audio generated with model ${modelName}`
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
        
      default:
        return new Response(
          JSON.stringify({ error: "Unsupported model" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
    }

    console.log(`Creating audio task with model ${modelName}`);
    
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
        message: `Audio generation task created with model ${modelName}`
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
