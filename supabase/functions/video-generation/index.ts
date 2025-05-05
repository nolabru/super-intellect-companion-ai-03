
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
    // Verify API key configuration
    const API_FRAME_KEY = Deno.env.get("API_FRAME_KEY");
    if (!API_FRAME_KEY) {
      throw new Error("API_FRAME_KEY is not configured");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract parameters from the request
    const { prompt, model, imageUrl, videoType = "text-to-video", duration = 5, resolution = "720p" } = await req.json();
    
    if (!prompt && !imageUrl) {
      return new Response(
        JSON.stringify({ error: "Either prompt or image URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // This service is temporarily disabled during reconfiguration
    console.log("[video-generation] Service is being reconfigured");
    
    // Save a placeholder task in the database
    const { error: insertError } = await supabase
      .from("piapi_tasks")
      .insert({
        task_id: `reconfiguration-${Date.now()}`,
        model: model || "pending-reconfiguration",
        prompt,
        status: "pending",
        media_type: "video",
        params: {
          videoType,
          duration,
          resolution,
          imageUrl
        }
      });

    if (insertError) {
      console.error(`[video-generation] Error inserting task record: ${insertError.message}`);
    }

    // Return a pending response
    return new Response(
      JSON.stringify({
        taskId: `reconfiguration-${Date.now()}`,
        status: "pending",
        message: `Video generation service is currently being reconfigured and will be available soon.`
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error(`[video-generation] Error: ${error.message}`);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to process video generation request", 
        message: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
