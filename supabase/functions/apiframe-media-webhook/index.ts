
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  try {
    console.log("[apiframe-media-webhook] Received webhook call");
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parse webhook payload
    const data = await req.json();
    console.log("[apiframe-media-webhook] Webhook payload:", JSON.stringify(data));
    
    if (!data || !data.task_id) {
      console.error("[apiframe-media-webhook] Invalid webhook payload: missing task_id");
      return new Response(JSON.stringify({ error: "Invalid webhook payload" }), { status: 400 });
    }
    
    const taskId = data.task_id;
    const status = data.status;
    
    // Check if this is a task completion notification
    if (status === "succeeded" || status === "failed") {
      console.log(`[apiframe-media-webhook] Task ${taskId} ${status}`);
      
      // Get task info from database
      const { data: taskData, error: getError } = await supabase
        .from("apiframe_tasks")
        .select("*")
        .eq("task_id", taskId)
        .single();
      
      if (getError) {
        console.error(`[apiframe-media-webhook] Error fetching task ${taskId}:`, getError);
        return new Response(JSON.stringify({ error: "Task not found" }), { status: 404 });
      }
      
      // Map status and extract media URL
      const mappedStatus = status === "succeeded" ? "completed" : "failed";
      const mediaUrl = status === "succeeded" 
        ? (data.output?.url || data.output?.image_url || null) 
        : null;
      const errorMessage = status === "failed" 
        ? (data.error?.message || "Task failed") 
        : null;
      
      // Update task in database
      const { error: updateError } = await supabase
        .from("apiframe_tasks")
        .update({
          status: mappedStatus,
          media_url: mediaUrl,
          error: errorMessage,
          updated_at: new Date().toISOString()
        })
        .eq("task_id", taskId);
      
      if (updateError) {
        console.error(`[apiframe-media-webhook] Error updating task ${taskId}:`, updateError);
      }
      
      // Create a media_ready_events record for realtime notifications
      if (status === "succeeded" && mediaUrl) {
        const { error: insertError } = await supabase
          .from("media_ready_events")
          .insert({
            task_id: taskId,
            media_url: mediaUrl,
            media_type: taskData.media_type,
            model: taskData.model,
            prompt: taskData.prompt
          });
        
        if (insertError) {
          console.error(`[apiframe-media-webhook] Error inserting media ready event:`, insertError);
        } else {
          console.log(`[apiframe-media-webhook] Media ready event created for task ${taskId}`);
        }
      }
    }
    
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("[apiframe-media-webhook] Error processing webhook:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: error instanceof Error ? error.message : String(error) }), 
      { status: 500 }
    );
  }
});
