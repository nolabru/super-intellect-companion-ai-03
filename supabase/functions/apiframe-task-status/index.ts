
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const API_FRAME_KEY = Deno.env.get("APIFRAME_API_KEY") || Deno.env.get("API_FRAME_KEY");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the task ID from the request
    const { taskId, forceCheck = false } = await req.json();
    
    if (!taskId) {
      throw new Error("Task ID not provided");
    }
    
    console.log(`[apiframe-task-status] Checking status of task: ${taskId}, forceCheck: ${forceCheck}`);

    // Verify API key is configured
    if (!API_FRAME_KEY) {
      throw new Error("APIFrame API key not configured");
    }
    
    // Try both possible API endpoints
    const endpoints = [
      "https://api.apiframe.pro/fetch",
      "https://api.apiframe.pro/status"
    ];
    
    let response = null;
    let data = null;
    let error = null;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`[apiframe-task-status] Trying endpoint: ${endpoint}`);
        
        response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": API_FRAME_KEY
          },
          body: JSON.stringify({ task_id: taskId })
        });
        
        console.log(`[apiframe-task-status] Response from ${endpoint}: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          data = await response.json();
          console.log(`[apiframe-task-status] Successfully used endpoint: ${endpoint}`);
          console.log(`[apiframe-task-status] Response data:`, data);
          break;
        }
      } catch (e) {
        console.error(`[apiframe-task-status] Error with endpoint ${endpoint}:`, e);
        error = e;
      }
    }
    
    if (!data && error) {
      throw error;
    }
    
    if (!data) {
      throw new Error("No data returned from API");
    }
    
    // Handle API response
    console.log(`[apiframe-task-status] APIframe response: ${JSON.stringify(data).substring(0, 100)}...`);
    
    // Normalize task status data
    const result = {
      taskId: data.task_id,
      status: data.status || "unknown",
      percentage: data.percentage || 0,
      error: data.error,
      mediaUrl: null,
      songs: data.songs || []
    };
    
    // Handle status-specific logic
    switch (data.status) {
      case "finished":
        // For SUNO music generation tasks, return songs data directly
        if (data.task_type === "suno" && data.songs && data.songs.length > 0) {
          console.log(`[apiframe-task-status] Successfully completed SUNO task with ${data.songs.length} songs`);
          result.status = "finished";
        }
        // For standard media tasks (ideogram, video, etc.), extract the media URL
        else if (data.media_url) {
          result.mediaUrl = data.media_url;
          console.log(`[apiframe-task-status] Task finished with media URL: ${data.media_url.substring(0, 50)}...`);
        }
        // For tasks with images array
        else if (data.images && data.images.length > 0) {
          result.mediaUrl = data.images[0];
          console.log(`[apiframe-task-status] Task finished with image URL: ${data.images[0].substring(0, 50)}...`);
        } else {
          console.log("[apiframe-task-status] Task marked as finished but no media URL found");
        }
        break;
        
      case "processing":
        console.log(`[apiframe-task-status] Successfully updated task status to processing`);
        break;
        
      case "failed":
        console.error(`[apiframe-task-status] Task failed: ${data.error || "Unknown error"}`);
        break;
        
      default:
        console.log(`[apiframe-task-status] Unknown task status: ${data.status}`);
    }
    
    // Return the normalized result
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
    
  } catch (error) {
    console.error(`[apiframe-task-status] Error: ${error.message}`);
    
    return new Response(JSON.stringify({ 
      error: `Error checking task status: ${error.message}` 
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
