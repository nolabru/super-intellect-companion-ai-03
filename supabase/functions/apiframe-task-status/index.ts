
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
    
    // Updated to use the correct endpoint and POST method
    const apiResponse = await fetch(`https://api.apiframe.pro/fetch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": APIFRAME_API_KEY
      },
      body: JSON.stringify({ task_id: taskId })
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error(`[apiframe-task-status] APIframe API error:`, errorText);
      throw new Error(`APIframe API error: ${apiResponse.statusText}`);
    }

    const apiData = await apiResponse.json();
    console.log(`[apiframe-task-status] APIframe response:`, JSON.stringify(apiData).substring(0, 200) + "...");
    
    // Map APIframe status to our format
    let status = apiData.status;
    let mediaUrl = null;
    let errorMessage = null;

    if (apiData.task_id) {
      // If we have image_urls, the task is completed
      if (apiData.image_urls && apiData.image_urls.length > 0) {
        status = "completed";
        mediaUrl = apiData.image_urls[0];
      } else if (apiData.status === "succeeded") {
        status = "completed";
        // Check for different types of media URLs
        if (apiData.image_url) {
          mediaUrl = apiData.image_url;
        } else if (apiData.video_url) {
          mediaUrl = apiData.video_url;
        } else if (apiData.audio_url) {
          mediaUrl = apiData.audio_url;
        }
      } else if (apiData.status === "failed") {
        status = "failed";
        errorMessage = apiData.error?.message || "Task failed";
      } else if (apiData.status === "processing") {
        status = "processing";
      } else {
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
    }

    return new Response(
      JSON.stringify({
        taskId,
        status,
        mediaUrl,
        error: errorMessage,
        percentage: apiData.percentage || 0
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
