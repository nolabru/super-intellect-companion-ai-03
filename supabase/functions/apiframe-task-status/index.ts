
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define API endpoints to try - for better compatibility
const API_ENDPOINTS = [
  "https://api.apiframe.ai/v1/tasks/status",
  "https://api.apiframe.pro/v1/tasks/status",
  "https://api.apiframe.pro/fetch"
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // FIXED: Use the same environment variable names as the other functions
    const APIFRAME_API_KEY = Deno.env.get("API_FRAME_KEY") || Deno.env.get("APIFRAME_API_KEY");
    if (!APIFRAME_API_KEY) {
      console.error("[apiframe-task-status] API_FRAME_KEY or APIFRAME_API_KEY not configured");
      throw new Error("APIFRAME API key not configured");
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Extract taskId from request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error("[apiframe-task-status] Error parsing request body:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid request body - JSON parsing failed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    const { taskId } = requestBody;

    if (!taskId) {
      console.error("[apiframe-task-status] Task ID is required");
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
      .maybeSingle();  // Using maybeSingle instead of single for better error handling

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

    // Try each endpoint until one works
    let apiResponse = null;
    let apiData = null;
    let successfulEndpoint = null;
    let errorMessages = [];
    
    for (const endpoint of API_ENDPOINTS) {
      try {
        console.log(`[apiframe-task-status] Trying endpoint: ${endpoint}`);
        
        // Use consistent payload format, but adapt based on endpoint
        const requestPayload = endpoint.includes('/fetch') 
          ? { task_id: taskId }
          : { taskId: taskId };
        
        apiResponse = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${APIFRAME_API_KEY}`,
            "Accept": "application/json"
          },
          body: JSON.stringify(requestPayload)
        });
        
        console.log(`[apiframe-task-status] Response from ${endpoint}: ${apiResponse.status} ${apiResponse.statusText}`);
        
        if (apiResponse.ok) {
          const contentType = apiResponse.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            apiData = await apiResponse.json();
            successfulEndpoint = endpoint;
            console.log(`[apiframe-task-status] Successfully used endpoint: ${endpoint}`);
            console.log(`[apiframe-task-status] Response data:`, JSON.stringify(apiData).substring(0, 200));
            break;
          } else {
            const textResponse = await apiResponse.text();
            console.error(`[apiframe-task-status] Received non-JSON response from ${endpoint}:`, textResponse.substring(0, 500));
            errorMessages.push(`Endpoint ${endpoint} returned non-JSON response`);
          }
        } else {
          const errorText = await apiResponse.text();
          console.error(`[apiframe-task-status] Error from ${endpoint}:`, errorText.substring(0, 500));
          errorMessages.push(`Endpoint ${endpoint} error: ${apiResponse.status} ${apiResponse.statusText}`);
        }
      } catch (endpointError) {
        console.error(`[apiframe-task-status] Error with endpoint ${endpoint}:`, endpointError);
        errorMessages.push(`Network error with ${endpoint}: ${endpointError.message}`);
      }
    }
    
    // If no endpoints worked
    if (!successfulEndpoint) {
      console.error(`[apiframe-task-status] All API endpoints failed. Errors:`, errorMessages.join('; '));
      throw new Error(`Failed to check task status: ${errorMessages.join('; ')}`);
    }

    console.log(`[apiframe-task-status] APIframe response:`, JSON.stringify(apiData).substring(0, 200) + "...");
    
    // Map APIframe status to our format - handle multiple possible response formats
    let status = apiData.status;
    let mediaUrl = null;
    let errorMessage = null;
    let percentage = apiData.percentage || 0;

    // Handle various response formats to extract image URLs
    if (apiData.task_id || apiData.taskId || apiData.id) {
      // Check for image_urls array
      if (apiData.image_urls && apiData.image_urls.length > 0) {
        status = "completed";
        mediaUrl = apiData.image_urls[0];
      } 
      // Check for singular image_url
      else if (apiData.image_url) {
        status = "completed";
        mediaUrl = apiData.image_url;
      }
      // Check for video_url
      else if (apiData.video_url) {
        status = "completed";
        mediaUrl = apiData.video_url;
      }
      // Check for audio_url
      else if (apiData.audio_url) {
        status = "completed";
        mediaUrl = apiData.audio_url;
      }
      // Check for assets structure (used by some providers)
      else if (apiData.assets) {
        if (apiData.assets.image) {
          status = "completed";
          mediaUrl = apiData.assets.image;
        } else if (apiData.assets.video) {
          status = "completed";
          mediaUrl = apiData.assets.video;
        } else if (apiData.assets.audio) {
          status = "completed";
          mediaUrl = apiData.assets.audio;
        }
      }
      
      // Handle status text mapping
      if (apiData.status === "succeeded" || apiData.status === "success" || apiData.status === "complete") {
        status = "completed";
      } else if (apiData.status === "failed" || apiData.status === "failure" || apiData.status === "error") {
        status = "failed";
        errorMessage = apiData.error?.message || apiData.message || apiData.error || "Task failed";
      } else if (apiData.status === "processing" || apiData.status === "in_progress") {
        status = "processing";
        // Try to get percentage from different fields
        percentage = apiData.percentage || apiData.progress || apiData.completion || 0;
      } else if (apiData.status === "pending" || apiData.status === "queued" || apiData.status === "waiting") {
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
      } else {
        // Insert a new record if it doesn't exist
        const { error: insertError } = await supabaseClient
          .from("apiframe_tasks")
          .insert({
            task_id: taskId,
            status,
            media_url: mediaUrl,
            error: errorMessage,
            model: 'midjourney',
            media_type: 'image'
          });
          
        if (insertError) {
          console.error(`[apiframe-task-status] Error inserting new task:`, insertError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        taskId,
        status,
        mediaUrl,
        error: errorMessage,
        percentage,
        endpoint: successfulEndpoint
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
