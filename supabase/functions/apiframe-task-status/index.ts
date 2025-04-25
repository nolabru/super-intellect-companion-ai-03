
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
    // Verify API key
    const APIFRAME_API_KEY = Deno.env.get("APIFRAME_API_KEY");
    if (!APIFRAME_API_KEY) {
      console.error("[apiframe-task-status] APIFRAME_API_KEY not configured");
      throw new Error("APIFRAME_API_KEY not configured");
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Extract taskId from request body
    const { taskId } = await req.json();

    if (!taskId) {
      return new Response(
        JSON.stringify({ error: "Task ID is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`[apiframe-task-status] Checking status for task: ${taskId}`);

    // First check database cache
    const { data: taskData, error: dbError } = await supabaseClient
      .from("apiframe_tasks")
      .select("*")
      .eq("task_id", taskId)
      .single();

    if (dbError) {
      console.error(`[apiframe-task-status] Error fetching task from database:`, dbError);
    } else if (taskData) {
      console.log(`[apiframe-task-status] Found task record:`, {
        id: taskData.task_id,
        status: taskData.status,
        hasUrl: !!taskData.media_url
      });
      
      // Return cached result if task is in final state
      if (taskData.status === 'completed' || taskData.status === 'failed') {
        return new Response(
          JSON.stringify({
            taskId: taskData.task_id,
            status: taskData.status,
            mediaUrl: taskData.media_url,
            error: taskData.error
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Check status with APIframe API
    console.log(`[apiframe-task-status] Checking status with APIframe API`);
    
    const apiResponse = await fetch(`https://api.apiframe.ai/v1/tasks/${taskId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${APIFRAME_API_KEY}`
      }
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error(`[apiframe-task-status] APIframe API error:`, errorText);
      throw new Error(`APIframe API error: ${apiResponse.statusText}`);
    }

    const apiData = await apiResponse.json();
    
    // Map APIframe status to our format
    let status = apiData.status;
    let mediaUrl = null;
    let errorMessage = null;

    switch (apiData.status) {
      case "succeeded":
        status = "completed";
        mediaUrl = apiData.output?.url || apiData.output?.image_url || null;
        break;
      case "failed":
        status = "failed";
        errorMessage = apiData.error?.message || "Task failed";
        break;
      case "processing":
        status = "processing";
        break;
      default:
        status = "pending";
    }

    // Update database if task exists
    if (taskData) {
      const { error: updateError } = await supabaseClient
        .from("apiframe_tasks")
        .update({
          status,
          media_url: mediaUrl,
          error: errorMessage,
          updated_at: new Date().toISOString()
        })
        .eq("task_id", taskId);

      if (updateError) {
        console.error(`[apiframe-task-status] Error updating task:`, updateError);
      }
    }

    return new Response(
      JSON.stringify({
        taskId,
        status,
        mediaUrl,
        error: errorMessage
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[apiframe-task-status] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Unknown error",
        details: "Check the edge function logs for more information"
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 500 
      }
    );
  }
});
