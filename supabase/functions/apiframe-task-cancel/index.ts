
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// Constants and configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const APIFRAME_API_BASE_URL = "https://api.apiframe.ai/v1";

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
    .from("apiframe_tasks")
    .select("*")
    .eq("task_id", taskId)
    .single();
  
  if (error) {
    console.error(`[apiframe-task-cancel] Error fetching task ${taskId}:`, error);
    throw new Error("Task not found in database");
  }
  
  return data;
};

const updateTaskInDatabase = async (supabaseClient: any, taskId: string, status: string, errorMessage?: string) => {
  const { error } = await supabaseClient
    .from("apiframe_tasks")
    .update({
      status,
      error: errorMessage,
      updated_at: new Date().toISOString()
    })
    .eq("task_id", taskId);
  
  if (error) {
    console.error(`[apiframe-task-cancel] Error updating task ${taskId}:`, error);
    throw new Error("Failed to update task in database");
  }
};

// API operations
const cancelTaskInAPIframe = async (taskId: string, apiKey: string) => {
  console.log(`[apiframe-task-cancel] Sending cancellation request to: ${APIFRAME_API_BASE_URL}/task/${taskId}/cancel`);
  
  const response = await fetch(`${APIFRAME_API_BASE_URL}/task/${taskId}/cancel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    }
  });

  console.log(`[apiframe-task-cancel] API response status: ${response.status}`);
  
  const responseText = await response.text();
  console.log(`[apiframe-task-cancel] API response: ${responseText}`);
  
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
    const APIFRAME_API_KEY = Deno.env.get("APIFRAME_API_KEY") || "";
    if (!APIFRAME_API_KEY) {
      console.error("[apiframe-task-cancel] APIFRAME_API_KEY not configured");
      return createErrorResponse("API key not configured", 500);
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Parse request body
    const { taskId } = await req.json();
    
    if (!taskId) {
      return createErrorResponse("Task ID is required");
    }

    console.log(`[apiframe-task-cancel] Processing cancellation request for task: ${taskId}`);

    // Get task information from database
    let task;
    try {
      task = await getTaskFromDatabase(supabaseClient, taskId);
    } catch (error) {
      return createErrorResponse(`Could not find task: ${error.message}`, 404);
    }

    // Check if task is already completed or failed
    if (task.status === "completed" || task.status === "failed") {
      const message = `Task ${taskId} is already ${task.status}`;
      console.log(`[apiframe-task-cancel] ${message}`);
      return createSuccessResponse({ message });
    }

    // Attempt to cancel the task in APIframe
    const cancelResult = await cancelTaskInAPIframe(taskId, APIFRAME_API_KEY);
    
    // Update task status in the database
    await updateTaskInDatabase(
      supabaseClient, 
      taskId, 
      "failed", 
      cancelResult.success ? "Cancelled by user" : "Failed to cancel task"
    );

    return createSuccessResponse({
      taskId,
      message: cancelResult.success ? "Task cancelled successfully" : "Task cancellation request sent"
    });
  } catch (error) {
    console.error("[apiframe-task-cancel] Error:", error);
    return createErrorResponse(
      `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
      500
    );
  }
});
