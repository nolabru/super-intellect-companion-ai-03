
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

    // Extract task_id from body
    const { task_id } = await req.json();
    
    if (!task_id) {
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
      .eq("task_id", task_id)
      .single();

    let apiResponse;
    let isApiError = false;
    
    // Try to cancel in PiAPI
    try {
      const response = await fetch(`https://api.piapi.ai/api/v1/task/${task_id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${PIAPI_API_KEY}`
        }
      });
      
      if (!response.ok) {
        // If task not found in PiAPI or can't be canceled, try Midjourney API
        if (MJ_API_KEY) {
          const mjResponse = await fetch(`https://api.midjapi.com/v1/task/${task_id}`, {
            method: "DELETE",
            headers: {
              "Authorization": `Bearer ${MJ_API_KEY}`
            }
          });
          
          if (mjResponse.ok) {
            apiResponse = await mjResponse.json();
          } else {
            isApiError = true;
            console.error(`Could not cancel task in any API: ${task_id}`);
          }
        } else {
          isApiError = true;
          console.error(`Could not cancel task in PiAPI and MJ_API_KEY not configured: ${task_id}`);
        }
      } else {
        apiResponse = await response.json();
      }
    } catch (apiError) {
      isApiError = true;
      console.error(`Error cancelling task via API: ${apiError.message}`);
    }
    
    // Even if API error, update our database status
    if (!fetchError) {
      await supabaseClient
        .from("piapi_tasks")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString()
        })
        .eq("task_id", task_id);
    }
    
    if (isApiError) {
      return new Response(
        JSON.stringify({
          task_id,
          status: "cancelled_locally",
          message: "Task could not be cancelled via API but was marked as cancelled in database"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({
        task_id,
        status: "cancelled",
        message: "Task cancelled successfully"
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
