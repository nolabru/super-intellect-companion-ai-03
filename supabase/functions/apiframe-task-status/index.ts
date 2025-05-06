
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
    // Check both environment variable names for better compatibility
    const API_FRAME_KEY = Deno.env.get("API_FRAME_KEY") || Deno.env.get("APIFRAME_API_KEY");
    if (!API_FRAME_KEY) {
      console.error("[apiframe-task-status] API_FRAME_KEY not configured");
      throw new Error("API_FRAME_KEY not configured");
    }

    // Extract task ID from request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error("[apiframe-task-status] Error parsing request body:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { taskId, forceCheck = false } = requestBody;
    
    if (!taskId) {
      console.error("[apiframe-task-status] Task ID is required");
      return new Response(
        JSON.stringify({ error: "Task ID is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`[apiframe-task-status] Checking status of task: ${taskId}, forceCheck: ${forceCheck}`);
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // First, check if we already have the completed task in the database
    // Skip this check if forceCheck is true
    if (!forceCheck) {
      const { data: dbTask, error: dbError } = await supabaseClient
        .from("apiframe_tasks")
        .select("*")
        .eq("task_id", taskId)
        .single();
        
      if (!dbError && dbTask && dbTask.status === "completed" && dbTask.media_url) {
        console.log(`[apiframe-task-status] Task ${taskId} already completed in database with URL: ${dbTask.media_url}`);
        return new Response(
          JSON.stringify({
            taskId,
            status: "completed",
            mediaUrl: dbTask.media_url,
            percentage: 100
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Try first with the /fetch endpoint which is more reliable
    let apiResponse;
    let responseData;
    let isSuccess = false;

    console.log(`[apiframe-task-status] Trying endpoint: https://api.apiframe.pro/fetch`);
    try {
      apiResponse = await fetch("https://api.apiframe.pro/fetch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_FRAME_KEY}`
        },
        body: JSON.stringify({ task_id: taskId })
      });

      console.log(`[apiframe-task-status] Response from https://api.apiframe.pro/fetch: ${apiResponse.status} ${apiResponse.statusText}`);
      
      if (apiResponse.ok) {
        responseData = await apiResponse.json();
        isSuccess = true;
        console.log(`[apiframe-task-status] Successfully used endpoint: https://api.apiframe.pro/fetch`);
      } else {
        const errorText = await apiResponse.text();
        console.error(`[apiframe-task-status] Error from https://api.apiframe.pro/fetch: ${errorText}`);
      }
    } catch (fetchError) {
      console.error(`[apiframe-task-status] Error with fetch endpoint:`, fetchError);
    }

    // Fall back to the status endpoint if fetch failed
    if (!isSuccess) {
      try {
        console.log(`[apiframe-task-status] Trying fallback endpoint: https://api.apiframe.pro/status`);
        apiResponse = await fetch("https://api.apiframe.pro/status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${API_FRAME_KEY}`
          },
          body: JSON.stringify({ task_id: taskId })
        });
        
        console.log(`[apiframe-task-status] Response from status endpoint: ${apiResponse.status} ${apiResponse.statusText}`);
        
        if (apiResponse.ok) {
          responseData = await apiResponse.json();
          isSuccess = true;
          console.log(`[apiframe-task-status] Successfully used fallback endpoint`);
        } else {
          const errorText = await apiResponse.text();
          console.error(`[apiframe-task-status] Error from status endpoint: ${errorText}`);
        }
      } catch (statusError) {
        console.error(`[apiframe-task-status] Error with status endpoint:`, statusError);
      }
    }

    // If both endpoints failed, try a direct API Frame call to the official endpoint
    if (!isSuccess) {
      try {
        console.log(`[apiframe-task-status] Trying direct endpoint with task ID: ${taskId}`);
        apiResponse = await fetch(`https://api.apiframe.pro/task/${taskId}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${API_FRAME_KEY}`
          }
        });
        
        console.log(`[apiframe-task-status] Response from direct endpoint: ${apiResponse.status} ${apiResponse.statusText}`);
        
        if (apiResponse.ok) {
          responseData = await apiResponse.json();
          isSuccess = true;
          console.log(`[apiframe-task-status] Successfully used direct endpoint`);
        } else {
          const errorText = await apiResponse.text();
          console.error(`[apiframe-task-status] Error from direct endpoint: ${errorText}`);
        }
      } catch (directError) {
        console.error(`[apiframe-task-status] Error with direct endpoint:`, directError);
      }
    }

    // If all API calls failed, return error
    if (!isSuccess || !responseData) {
      console.error(`[apiframe-task-status] All endpoints failed for task: ${taskId}`);
      return new Response(
        JSON.stringify({ 
          error: "Unable to retrieve task status from API Frame",
          status: "unknown" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Parse response data
    console.log(`[apiframe-task-status] Response data:`, responseData);
    const status = responseData.status?.toLowerCase() || "processing";
    const mediaUrl = responseData.video_url || responseData.output?.media_url || null;
    const percentage = responseData.percentage || 0;
    
    console.log(`[apiframe-task-status] APIframe response: ${JSON.stringify(responseData).substring(0, 100)}...`);

    // Update task in database if status has changed
    if (status === "finished" || status === "completed" || status === "succeeded" || status === "success") {
      if (mediaUrl) {
        // Update the task record with completed status and media URL
        const { error: updateError } = await supabaseClient
          .from("apiframe_tasks")
          .update({
            status: "completed",
            media_url: mediaUrl,
            updated_at: new Date().toISOString(),
            percentage: 100
          })
          .eq("task_id", taskId);

        if (updateError) {
          console.error(`[apiframe-task-status] Error updating task in database:`, updateError);
        } else {
          console.log(`[apiframe-task-status] Successfully updated task to completed`);
          
          // Insert into media_ready_events table
          try {
            const { data: taskData } = await supabaseClient
              .from("apiframe_tasks")
              .select("prompt, model")
              .eq("task_id", taskId)
              .single();
              
            const { error: eventError } = await supabaseClient
              .from("media_ready_events")
              .insert({
                task_id: taskId,
                media_url: mediaUrl,
                media_type: "video",
                model: taskData?.model || "apiframe-video",
                prompt: taskData?.prompt || ""
              });
              
            if (eventError) {
              console.error(`[apiframe-task-status] Error inserting media ready event:`, eventError);
            } else {
              console.log(`[apiframe-task-status] Successfully created media ready event`);
            }
          } catch (eventCreateError) {
            console.error(`[apiframe-task-status] Error creating media ready event:`, eventCreateError);
          }
        }
      }

      return new Response(
        JSON.stringify({
          taskId,
          status: "completed",
          mediaUrl,
          percentage: 100
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } 
    else if (status === "processing" || status === "pending") {
      // Update the task status in database
      const { error: updateError } = await supabaseClient
        .from("apiframe_tasks")
        .update({
          status: "processing",
          updated_at: new Date().toISOString(),
          percentage
        })
        .eq("task_id", taskId);

      if (updateError) {
        console.error(`[apiframe-task-status] Error updating task status:`, updateError);
      } else {
        console.log(`[apiframe-task-status] Successfully updated task status to processing`);
      }

      return new Response(
        JSON.stringify({
          taskId,
          status: "processing",
          percentage
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    else if (status === "failed" || status === "error") {
      const errorMessage = responseData.error || "Task failed without specific error message";
      
      // Update the task status in database
      const { error: updateError } = await supabaseClient
        .from("apiframe_tasks")
        .update({
          status: "failed",
          error: errorMessage,
          updated_at: new Date().toISOString()
        })
        .eq("task_id", taskId);

      if (updateError) {
        console.error(`[apiframe-task-status] Error updating failed task:`, updateError);
      } else {
        console.log(`[apiframe-task-status] Updated task as failed`);
      }

      return new Response(
        JSON.stringify({
          taskId,
          status: "failed",
          error: errorMessage
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    else {
      return new Response(
        JSON.stringify({
          taskId,
          status: "unknown",
          originalStatus: status
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error(`[apiframe-task-status] Unexpected error:`, error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "An unknown error occurred"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
