
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
    // Initialize Supabase client for database operations
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

    // Check if the task ID is from our reconfiguration placeholder
    if (taskId.startsWith('reconfiguration-')) {
      return new Response(
        JSON.stringify({
          taskId,
          status: "pending",
          message: "Video generation service is currently being reconfigured."
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Return a placeholder response during reconfiguration
    return new Response(
      JSON.stringify({
        taskId,
        status: "pending",
        message: "Video status checking is temporarily unavailable during service reconfiguration."
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error(`[video-task-status] Error:`, error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Unknown error",
        details: "Check the logs for more information"
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 500 
      }
    );
  }
});
