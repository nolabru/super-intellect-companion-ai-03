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
    const { prompt, model = "elevenlabs-v2", params = {} } = await req.json();
    
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Configure webhook
    const webhookEndpoint = `${Deno.env.get("SUPABASE_URL")}/functions/v1/apiframe-media-webhook`;
    
    // Prepare task data
    const taskData: any = {
      "text": prompt,
      "webhook_url": webhookEndpoint,
      "webhook_secret": Deno.env.get("APIFRAME_WEBHOOK_SECRET") || "apiframe-webhook-secret"
    };

    // Add model-specific parameters based on the selected model
    if (model === "elevenlabs-v2") {
      // ElevenLabs model
      taskData["model"] = "elevenlabs";
      taskData["voice_id"] = params.voice_id || "EXAVITQu4vr4xnSDxMaL"; // Default to Sarah voice
      
      // Add optional parameters
      if (params.stability !== undefined) taskData["stability"] = params.stability;
      if (params.similarity_boost !== undefined) taskData["similarity_boost"] = params.similarity_boost;
      if (params.style !== undefined) taskData["style"] = params.style;
      if (params.speaking_rate !== undefined) taskData["speaking_rate"] = params.speaking_rate;
    } 
    else if (model === "openai-tts-1") {
      // OpenAI TTS model
      taskData["model"] = "openai-tts";
      taskData["voice"] = params.voice || "alloy"; // Default to alloy voice
      
      // Add optional parameters
      if (params.speed !== undefined) taskData["speed"] = params.speed;
    }
    else if (model === "coqui-xtts") {
      // Coqui XTTS model
      taskData["model"] = "coqui-xtts";
      
      // Add optional parameters
      if (params.speaker_id !== undefined) taskData["speaker_id"] = params.speaker_id;
      if (params.language !== undefined) taskData["language"] = params.language;
    }

    console.log(`[apiframe-generate-audio] Creating audio task with model ${model}`);

    // Create task in APIframe
    const apiResponse = await fetch("https://api.apiframe.pro/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": APIFRAME_API_KEY
      },
      body: JSON.stringify(taskData)
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      console.error(`[apiframe-generate-audio] Error creating task:`, errorData);
      throw new Error(`APIframe error: ${errorData.error?.message || apiResponse.statusText}`);
    }

    // Process response
    const responseData = await apiResponse.json();
    const taskId = responseData.task_id;
    
    console.log(`[apiframe-generate-audio] Task created successfully. ID: ${taskId}`);

    // Save task information in database
    const { error: insertError } = await supabase
      .from("apiframe_tasks")
      .insert({
        task_id: taskId,
        model,
        prompt,
        status: "pending",
        media_type: "audio",
        params: params
      });

    if (insertError) {
      console.error(`[apiframe-generate-audio] Error inserting task record:`, insertError);
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
    console.error(`[apiframe-generate-audio] Error:`, error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to generate audio", 
        message: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
