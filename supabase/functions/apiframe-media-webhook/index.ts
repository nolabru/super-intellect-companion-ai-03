
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

  // Initialize Supabase client
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
  );

  try {
    console.log("[apiframe-media-webhook] Received webhook call");
    
    // Parse the request body
    let payload;
    try {
      payload = await req.json();
    } catch (parseError) {
      console.error("[apiframe-media-webhook] Error parsing webhook payload:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON payload" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log("[apiframe-media-webhook] Received webhook payload:", JSON.stringify(payload).substring(0, 500));

    // Extract relevant information from the webhook payload
    const taskId = payload.task_id || payload.taskId || payload.id;
    if (!taskId) {
      console.error("[apiframe-media-webhook] No task ID in webhook payload");
      return new Response(
        JSON.stringify({ error: "No task ID in webhook payload" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Determine the status and media URL
    let status = "processing";
    let mediaUrl = null;
    let error = null;

    // Handle different response formats
    if (payload.status) {
      // Standard format
      if (["completed", "succeeded", "success", "done", "finished"].includes(payload.status.toLowerCase())) {
        status = "completed";
        console.log(`[apiframe-media-webhook] Task ${taskId} is completed`);
      } else if (["failed", "failure", "error"].includes(payload.status.toLowerCase())) {
        status = "failed";
        error = payload.error || payload.message || "Task failed";
        console.log(`[apiframe-media-webhook] Task ${taskId} has failed with error: ${error}`);
      }

      // Extract media URL from various possible locations
      if (payload.video_url) {
        mediaUrl = payload.video_url;
      } else if (payload.image_urls && payload.image_urls.length > 0) {
        mediaUrl = payload.image_urls[0];
      } else if (payload.image_url) {
        mediaUrl = payload.image_url;
      } else if (payload.assets) {
        // Handle assets structure
        if (payload.assets.video) {
          mediaUrl = payload.assets.video;
        } else if (payload.assets.image) {
          mediaUrl = payload.assets.image;
        }
      }
      
      if (mediaUrl) {
        console.log(`[apiframe-media-webhook] Media URL found: ${mediaUrl.substring(0, 100)}...`);
      } else {
        console.log(`[apiframe-media-webhook] No media URL found in payload`);
      }
    }

    console.log(`[apiframe-media-webhook] Processing task ${taskId} with status: ${status}`);

    // Update the task in the database
    const { error: updateError } = await supabaseClient
      .from("apiframe_tasks")
      .update({
        status,
        media_url: mediaUrl,
        error,
        updated_at: new Date().toISOString()
      })
      .eq("task_id", taskId);

    if (updateError) {
      console.error(`[apiframe-media-webhook] Error updating task in database:`, updateError);
      return new Response(
        JSON.stringify({ error: "Database update error", details: updateError }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Insert into media_ready_events table for additional processing
    if (status === "completed" && mediaUrl) {
      const { error: insertError } = await supabaseClient
        .from("media_ready_events")
        .insert({
          task_id: taskId,
          media_url: mediaUrl,
          media_type: "video",
          model: payload.model || "apiframe-video"
        });

      if (insertError) {
        console.error(`[apiframe-media-webhook] Error inserting media_ready_event:`, insertError);
      } else {
        console.log(`[apiframe-media-webhook] Successfully created media_ready_event for task ${taskId}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Webhook processed for task ${taskId}` 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[apiframe-media-webhook] Webhook processing error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        details: "Check edge function logs for more information" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
