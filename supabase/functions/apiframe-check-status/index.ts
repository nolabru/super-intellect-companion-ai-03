
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.8.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Get the APIframe API key from environment variables
const APIFRAME_API_KEY = Deno.env.get('APIFRAME_API_KEY');
if (!APIFRAME_API_KEY) {
  console.error('[apiframe-check-status] APIFRAME_API_KEY not configured in environment variables');
}

// Define the correct APIframe API URL
const APIFRAME_API_URL = "https://api.apiframe.ai/api/v1/task";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { taskId } = await req.json();
    
    if (!taskId) {
      return new Response(
        JSON.stringify({ error: 'Missing taskId parameter' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`[apiframe-check-status] Checking status for task: ${taskId}`);

    // First check database cache
    const { data: taskData, error: dbError } = await supabase
      .from("apiframe_tasks")
      .select("*")
      .eq("task_id", taskId)
      .single();

    if (dbError) {
      console.error(`[apiframe-check-status] Error fetching task from database:`, dbError);
    } else if (taskData) {
      console.log(`[apiframe-check-status] Found task record:`, {
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
    console.log(`[apiframe-check-status] Checking status with APIframe API`);
    
    // Updated API endpoint format to use the task ID
    const apiResponse = await fetch(`${APIFRAME_API_URL}/${taskId}`, {
      method: "GET",
      headers: {
        'Authorization': `Bearer ${APIFRAME_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    console.log(`[apiframe-check-status] Response status: ${apiResponse.status} ${apiResponse.statusText}`);
    
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error(`[apiframe-check-status] APIframe API error (${apiResponse.status}):`, errorText);
      
      // If we get a 404, it might mean the task doesn't exist or is expired
      if (apiResponse.status === 404) {
        return new Response(
          JSON.stringify({ 
            error: "Task not found or expired",
            status: "failed",
            details: `Task ID ${taskId} could not be found on the APIframe server`
          }),
          { 
            status: 404, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
      
      throw new Error(`APIframe API error: ${apiResponse.status} - ${errorText.substring(0, 100)}`);
    }

    const apiData = await apiResponse.json();
    console.log(`[apiframe-check-status] APIframe response:`, JSON.stringify(apiData).substring(0, 200) + "...");
    
    // Map APIframe status to our format
    let status = apiData.status || 'pending';
    let mediaUrl = null;
    let errorMessage = null;

    if (status === "succeeded" || status === "completed") {
      status = "completed";
      // Check for different types of media URLs
      if (apiData.image_urls && apiData.image_urls.length > 0) {
        mediaUrl = apiData.image_urls[0];
      } else if (apiData.image_url) {
        mediaUrl = apiData.image_url;
      } else if (apiData.video_url) {
        mediaUrl = apiData.video_url;
      } else if (apiData.audio_url) {
        mediaUrl = apiData.audio_url;
      } else if (apiData.output?.url) {
        mediaUrl = apiData.output.url;
      } else if (apiData.mediaUrl) {
        mediaUrl = apiData.mediaUrl;
      }
    } else if (status === "failed") {
      errorMessage = apiData.error?.message || "Task failed";
    }

    // Update database if task exists
    if (taskData) {
      const { error: updateError } = await supabase
        .from("apiframe_tasks")
        .update({
          status,
          media_url: mediaUrl,
          error: errorMessage,
          updated_at: new Date().toISOString()
        })
        .eq("task_id", taskId);

      if (updateError) {
        console.error(`[apiframe-check-status] Error updating task:`, updateError);
      }
    }

    // Create a media_ready_events record for realtime notifications if completed
    if (status === "completed" && mediaUrl && taskData) {
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
        console.error(`[apiframe-check-status] Error inserting media ready event:`, insertError);
      } else {
        console.log(`[apiframe-check-status] Media ready event created for task ${taskId}`);
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
    console.error("[apiframe-check-status] Error:", error);
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
