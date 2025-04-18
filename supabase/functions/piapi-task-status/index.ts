
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
    const PIAPI_API_KEY = Deno.env.get("PIAPI_API_KEY") || "";
    const MJ_API_KEY = Deno.env.get("MJ_API_KEY") || "";
    
    if (!PIAPI_API_KEY) {
      throw new Error("PIAPI_API_KEY not configured");
    }

    // Extract task_id from URL or body
    let taskId = "";
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    
    if (pathParts.length > 0) {
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart && lastPart !== "piapi-task-status") {
        taskId = lastPart;
      }
    }
    
    if (!taskId) {
      const body = await req.json();
      taskId = body.task_id;
    }
    
    if (!taskId) {
      return new Response(
        JSON.stringify({ error: "task_id is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // First check if we have the task in our database
    const { data: taskData, error: fetchError } = await supabaseClient
      .from("piapi_tasks")
      .select("*")
      .eq("task_id", taskId)
      .single();

    if (fetchError) {
      console.log(`Task ${taskId} not found in database, querying API directly`);
      
      // Try to fetch from PiAPI
      let apiResponse;
      try {
        const response = await fetch(`https://api.piapi.ai/api/v1/task/${taskId}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${PIAPI_API_KEY}`
          }
        });
        
        if (!response.ok) {
          // Try Midjourney API
          if (MJ_API_KEY) {
            const mjResponse = await fetch(`https://api.midjapi.com/v1/task/${taskId}`, {
              method: "GET",
              headers: {
                "Authorization": `Bearer ${MJ_API_KEY}`
              }
            });
            
            if (mjResponse.ok) {
              apiResponse = await mjResponse.json();
            } else {
              throw new Error(`Task not found in any API`);
            }
          } else {
            throw new Error(`Task not found in PiAPI and MJ_API_KEY not configured`);
          }
        } else {
          apiResponse = await response.json();
        }
        
        return new Response(
          JSON.stringify(apiResponse),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (apiError) {
        return new Response(
          JSON.stringify({ error: apiError.message }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
        );
      }
    }

    // Return data from our database
    return new Response(
      JSON.stringify({
        task_id: taskData.task_id,
        status: taskData.status,
        model: taskData.model,
        prompt: taskData.prompt,
        media_type: taskData.media_type,
        media_url: taskData.media_url,
        created_at: taskData.created_at,
        updated_at: taskData.updated_at,
        result: taskData.result
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
