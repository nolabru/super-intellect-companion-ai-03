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
    // Verify API key configuration
    const API_FRAME_KEY = Deno.env.get("API_FRAME_KEY");
    if (!API_FRAME_KEY) {
      throw new Error("API_FRAME_KEY is not configured");
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Extract task ID from the request
    const { taskId } = await req.json();
    
    if (!taskId) {
      return new Response(
        JSON.stringify({ error: "Task ID is required" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 400 
        }
      );
    }
    
    console.log(`[video-task-status] Checking status for task: ${taskId}`);

    // Look up the task in the database first to get any cached results
    const { data: taskData, error: taskError } = await supabase
      .from("piapi_tasks")
      .select("task_id, status, media_url, updated_at")
      .eq("task_id", taskId)
      .single();
    
    if (taskError) {
      console.error(`[video-task-status] Error fetching task from database: ${taskError.message}`);
    }
    
    // If task is already completed and has a media URL, return the cached result
    if (taskData && taskData.status === 'completed' && taskData.media_url) {
      console.log(`[video-task-status] Returning cached completed task result for ${taskId}`);
      return new Response(
        JSON.stringify({
          taskId: taskData.task_id,
          status: taskData.status,
          mediaUrl: taskData.media_url
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Otherwise, check the status from API Frame
    console.log(`[video-task-status] Checking task status from API Frame for ${taskId}`);
    
    const apiResponse = await fetch("https://api.apiframe.pro/fetch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": API_FRAME_KEY
      },
      body: JSON.stringify({
        task_id: taskId
      })
    });
    
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error(`[video-task-status] API Frame error (${apiResponse.status}): ${errorText}`);
      
      throw new Error(`Failed to check task status: ${apiResponse.statusText}`);
    }
    
    const apiData = await apiResponse.json();
    console.log(`[video-task-status] API Frame response: ${JSON.stringify(apiData).substring(0, 200)}...`);
    
    // Process the response and map it to our format
    const status = apiData.status || 'pending';
    const mapped_status = 
      status === 'finished' ? 'completed' :
      status === 'processing' ? 'processing' :
      status === 'failed' ? 'failed' :
      'pending';
    
    const progress = apiData.percentage ? parseInt(apiData.percentage, 10) : 0;
    const mediaUrl = apiData.video_url || null;
    
    // If status is 'completed', update the database with the media URL
    if (mapped_status === 'completed' && mediaUrl) {
      const { error: updateError } = await supabase
        .from("piapi_tasks")
        .update({
          status: mapped_status,
          media_url: mediaUrl,
          updated_at: new Date().toISOString()
        })
        .eq("task_id", taskId);
      
      if (updateError) {
        console.error(`[video-task-status] Error updating task in database: ${updateError.message}`);
      } else {
        console.log(`[video-task-status] Updated task ${taskId} with completed status and media URL`);
        
        // Also insert a media_ready_event for real-time notifications
        const { error: insertError } = await supabase
          .from("media_ready_events")
          .insert({
            task_id: taskId,
            media_type: "video",
            media_url: mediaUrl,
            model: "kling-video"
          });
        
        if (insertError) {
          console.error(`[video-task-status] Error inserting media ready event: ${insertError.message}`);
        }
      }
    } else if (mapped_status !== 'pending') {
      // Update the status in database if it's not 'pending' (to show progress)
      const { error: updateError } = await supabase
        .from("piapi_tasks")
        .update({
          status: mapped_status,
          updated_at: new Date().toISOString()
        })
        .eq("task_id", taskId);
      
      if (updateError) {
        console.error(`[video-task-status] Error updating task status in database: ${updateError.message}`);
      }
    }
    
    return new Response(
      JSON.stringify({
        taskId: taskId,
        status: mapped_status,
        progress: progress,
        mediaUrl: mediaUrl,
        message: `Video generation status: ${mapped_status} (${progress}%)`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(`[video-task-status] Error:`, error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Unknown error",
        details: "Check the logs for more information"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
