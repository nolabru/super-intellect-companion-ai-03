
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// API Frame endpoint for cancellation
const APIFRAME_BASE_URL = "https://api.apiframe.pro";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the API Frame API key
    const API_FRAME_KEY = Deno.env.get("API_FRAME_KEY") || Deno.env.get("APIFRAME_API_KEY");
    
    if (!API_FRAME_KEY) {
      console.error("[apiframe-task-cancel] API_FRAME_KEY not configured");
      throw new Error("API_FRAME_KEY not configured");
    }

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error("[apiframe-task-cancel] Error parsing request body:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { taskId } = requestBody;
    
    if (!taskId) {
      console.error("[apiframe-task-cancel] Task ID is required");
      return new Response(
        JSON.stringify({ error: "Task ID is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    console.log(`[apiframe-task-cancel] Canceling task: ${taskId}`);

    // Initialize Supabase client for database operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Update the task status in the database first
    const { error: updateError } = await supabaseClient
      .from("apiframe_tasks")
      .update({
        status: "canceled",
        updated_at: new Date().toISOString()
      })
      .eq("task_id", taskId);
      
    if (updateError) {
      console.error(`[apiframe-task-cancel] Error updating task status:`, updateError);
      // Continue anyway to try canceling with the API
    }

    // Make the API request to cancel the task 
    // Note: As of now, API Frame may not have a dedicated cancel endpoint.
    // This is a placeholder for when they implement one
    try {
      const cancelEndpoint = `${APIFRAME_BASE_URL}/task/${taskId}/cancel`;
      const response = await fetch(cancelEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_FRAME_KEY}`
        }
      });

      // Regardless of response, we'll consider the task canceled on our side
      console.log(`[apiframe-task-cancel] Cancel API response status: ${response.status}`);
      
      // Return success response
      return new Response(
        JSON.stringify({
          success: true,
          message: "Task marked as canceled"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (apiError) {
      console.error("[apiframe-task-cancel] Error calling cancel API:", apiError);
      
      // Return success anyway since we've updated our database
      return new Response(
        JSON.stringify({
          success: true,
          message: "Task marked as canceled in database, but API call failed",
          apiError: apiError.message
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("[apiframe-task-cancel] Unexpected error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "An unknown error occurred"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
