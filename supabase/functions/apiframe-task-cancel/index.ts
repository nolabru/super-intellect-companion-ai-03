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
      console.error("[apiframe-task-cancel] APIFRAME_API_KEY not configured");
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

    console.log(`[apiframe-task-cancel] Cancelling task: ${taskId}`);

    // Check if task exists in database
    const { data: taskData, error: dbError } = await supabaseClient
      .from("apiframe_tasks")
      .select("*")
      .eq("task_id", taskId)
      .single();

    if (dbError) {
      console.error(`[apiframe-task-cancel] Error fetching task from database:`, dbError);
    }

    // Cancel task with APIframe API
    const apiResponse = await fetch(`https://api.apiframe.pro/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": APIFRAME_API_KEY
      },
      body: JSON.stringify({ task_id: taskId })
    });

    let success = false;
    let message = "";

    if (apiResponse.ok) {
      const apiData = await apiResponse.json();
      success = apiData.success || true;
      message = "Task cancelled successfully";
      
      // Update task status in database if task exists
      if (taskData) {
        const { error: updateError } = await supabaseClient
          .from("apiframe_tasks")
          .update({
            status: "failed",
            error: "Task cancelled by user",
            updated_at: new Date().toISOString()
          })
          .eq("task_id", taskId);

        if (updateError) {
          console.error(`[apiframe-task-cancel] Error updating task:`, updateError);
        }
      }
    } else {
      const errorText = await apiResponse.text();
      console.error(`[apiframe-task-cancel] APIframe API error:`, errorText);
      
      // Check if error is because task is already completed
      if (apiResponse.status === 404 || errorText.includes("not found")) {
        message = "Task not found or already completed";
        success = true; // Consider this a success since the task is no longer running
      } else {
        message = `APIframe API error: ${apiResponse.statusText}`;
        success = false;
      }
    }

    return new Response(
      JSON.stringify({
        success,
        message
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[apiframe-task-cancel] Error:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
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
