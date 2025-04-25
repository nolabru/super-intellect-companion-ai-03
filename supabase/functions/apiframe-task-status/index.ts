
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
      return new Response(
        JSON.stringify({ error: "API key not configured" }), 
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Parse request body
    const { taskId } = await req.json();

    if (!taskId) {
      return new Response(
        JSON.stringify({ error: "Task ID is required" }), 
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[apiframe-task-status] Checking status for task: ${taskId}`);

    // First check if we have the task in our database
    const { data: taskData, error: dbError } = await supabaseClient
      .from("apiframe_tasks")
      .select("*")
      .eq("task_id", taskId)
      .single();

    if (dbError) {
      console.error(`[apiframe-task-status] Error fetching task ${taskId} from database:`, dbError);
    }

    // If task exists and is already completed, return data from database
    if (taskData && (taskData.status === "completed" || taskData.status === "failed") && taskData.media_url) {
      console.log(`[apiframe-task-status] Task ${taskId} already ${taskData.status}, returning cached result`);
      
      return new Response(
        JSON.stringify({
          taskId,
          status: taskData.status,
          mediaUrl: taskData.media_url,
          error: taskData.error
        }), 
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If not completed, check with APIframe API
    console.log(`[apiframe-task-status] Checking APIframe API for task ${taskId}`);
    
    const apiResponse = await fetch(`https://api.apiframe.ai/v1/task/${taskId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${APIFRAME_API_KEY}`
      }
    });

    if (!apiResponse.ok) {
      // Log full response for debugging
      const errorText = await apiResponse.text();
      console.error(`[apiframe-task-status] Error from APIframe API: ${errorText}`);
      
      const errorMessage = `API Error: ${apiResponse.status} ${apiResponse.statusText}`;
      
      // Update task in database if exists
      if (taskData) {
        await supabaseClient
          .from("apiframe_tasks")
          .update({
            status: "failed",
            error: errorMessage,
            updated_at: new Date().toISOString()
          })
          .eq("task_id", taskId);
      }
      
      return new Response(
        JSON.stringify({
          taskId,
          status: "failed",
          error: errorMessage
        }), 
        { status: apiResponse.status === 404 ? 404 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Process API response
    const apiData = await apiResponse.json();
    
    console.log(`[apiframe-task-status] APIframe API status for ${taskId}: ${apiData.status}`);
    
    // Map APIframe status to our status format
    let mappedStatus = apiData.status;
    let mediaUrl = null;
    let errorMessage = null;
    
    switch (apiData.status) {
      case "succeeded":
        mappedStatus = "completed";
        mediaUrl = apiData.output?.output_url || apiData.output?.url || null;
        break;
      case "processing":
        mappedStatus = "processing";
        break;
      case "failed":
        mappedStatus = "failed";
        errorMessage = apiData.error?.message || "Task failed";
        break;
      case "pending":
      default:
        mappedStatus = "pending";
        break;
    }
    
    // Update task in database if exists
    if (taskData) {
      await supabaseClient
        .from("apiframe_tasks")
        .update({
          status: mappedStatus,
          media_url: mediaUrl,
          error: errorMessage,
          updated_at: new Date().toISOString()
        })
        .eq("task_id", taskId);
    }
    
    return new Response(
      JSON.stringify({
        taskId,
        status: mappedStatus,
        mediaUrl,
        error: errorMessage
      }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(`[apiframe-task-status] Unexpected error:`, error);
    
    return new Response(
      JSON.stringify({ 
        error: "An unexpected error occurred", 
        details: error instanceof Error ? error.message : String(error) 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
