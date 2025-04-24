
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// Constants and configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PIAPI_API_BASE_URL = "https://api.piapi.ai/api/v1";

// Helper functions for responses
const createErrorResponse = (message: string, status: number = 400) => {
  return new Response(
    JSON.stringify({ success: false, error: message }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status }
  );
};

const createSuccessResponse = (data: any) => {
  return new Response(
    JSON.stringify({ success: true, ...data }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
};

// Database operations
const getTaskFromDatabase = async (supabaseClient: any, taskId: string) => {
  const { data, error } = await supabaseClient
    .from("piapi_tasks")
    .select("*")
    .eq("task_id", taskId)
    .single();
  
  if (error) {
    console.error(`[piapi-task-cancel] Error fetching task ${taskId}:`, error);
    throw new Error("Task not found in database");
  }
  
  return data;
};

const updateTaskInDatabase = async (supabaseClient: any, taskId: string, status: string, errorMessage?: string) => {
  const { error } = await supabaseClient
    .from("piapi_tasks")
    .update({
      status,
      error: errorMessage,
      updated_at: new Date().toISOString()
    })
    .eq("task_id", taskId);
  
  if (error) {
    console.error(`[piapi-task-cancel] Error updating task ${taskId}:`, error);
    throw new Error("Failed to update task in database");
  }
};

// API operations
const cancelTaskInPiAPI = async (taskId: string, apiKey: string) => {
  console.log(`[piapi-task-cancel] Sending cancellation request to: ${PIAPI_API_BASE_URL}/task/${taskId}/cancel`);
  
  const response = await fetch(`${PIAPI_API_BASE_URL}/task/${taskId}/cancel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    }
  });

  console.log(`[piapi-task-cancel] API response status: ${response.status}`);
  
  const responseText = await response.text();
  console.log(`[piapi-task-cancel] API response: ${responseText}`);
  
  // Check for task completion or failure in response
  const isAlreadyCompleted = responseText.includes("already completed") || responseText.includes("already failed");
  
  return { 
    success: response.ok || isAlreadyCompleted, 
    responseText
  };
};

// Main handler function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate environment
    const PIAPI_API_KEY = Deno.env.get("PIAPI_API_KEY") || "";
    if (!PIAPI_API_KEY) {
      console.error("[piapi-task-cancel] PIAPI_API_KEY not configured");
      return createErrorResponse("API key not configured", 500);
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error("[piapi-task-cancel] Error parsing request body:", parseError);
      return createErrorResponse("Invalid request body - JSON parsing failed");
    }

    // Validate request parameters
    const { taskId } = requestBody;
    if (!taskId) {
      console.error("[piapi-task-cancel] taskId is required");
      return createErrorResponse("Task ID is required");
    }

    console.log(`[piapi-task-cancel] Attempting to cancel task: ${taskId}`);

    // Get task from database
    let taskData;
    try {
      taskData = await getTaskFromDatabase(supabaseClient, taskId);
    } catch (error) {
      return createErrorResponse(error.message, 404);
    }

    console.log(`[piapi-task-cancel] Current task status: ${taskData.status}`);
    
    // Check if task is in final state
    if (taskData.status === 'completed' || taskData.status === 'failed') {
      console.log(`[piapi-task-cancel] Task is already in final state: ${taskData.status}`);
      return createSuccessResponse({
        message: `Task is already in ${taskData.status} state and cannot be cancelled`
      });
    }

    // Cancel task in PiAPI
    let apiResult;
    try {
      apiResult = await cancelTaskInPiAPI(taskId, PIAPI_API_KEY);
    } catch (error) {
      console.error(`[piapi-task-cancel] Error calling PiAPI:`, error);
      return createErrorResponse(`Error calling PiAPI: ${error.message}`, 500);
    }

    // Update database if cancellation was successful
    if (apiResult.success) {
      try {
        await updateTaskInDatabase(
          supabaseClient, 
          taskId, 
          'failed', 
          'Task cancelled by user'
        );
      } catch (error) {
        return createErrorResponse(error.message, 500);
      }
      
      return createSuccessResponse({ message: "Task cancelled successfully" });
    } else {
      return createErrorResponse(
        `Failed to cancel task: ${apiResult.responseText}`, 
        500
      );
    }
  } catch (error) {
    // Global error handler
    console.error("[piapi-task-cancel] Unhandled error:", error);
    return createErrorResponse(
      error.message || "Unknown error", 
      500
    );
  }
});
