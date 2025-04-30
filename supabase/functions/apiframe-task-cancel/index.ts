
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

// Define the APIframe API URL
const APIFRAME_API_URL = 'https://api.apiframe.ai/v1';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { taskId, apiKey } = await req.json();
    
    // Get API key from request or environment variable
    const APIFRAME_API_KEY = apiKey || Deno.env.get('APIFRAME_API_KEY');

    if (!taskId || !APIFRAME_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters', success: false }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Cancelling task ${taskId}`);

    // Call APIframe API to cancel task
    const response = await fetch(`${APIFRAME_API_URL}/tasks/${taskId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${APIFRAME_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    // Update task status in database regardless of API response
    const { error: dbError } = await supabase
      .from('apiframe_tasks')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('task_id', taskId);
      
    if (dbError) {
      console.error('Error updating task in database:', dbError);
    }

    // Handle API response
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error from APIframe: ${errorText}`);
      
      // Check if task was already completed
      if (response.status === 404 || errorText.includes('not found') || errorText.includes('already completed')) {
        return new Response(
          JSON.stringify({ 
            message: 'Task already completed or not found', 
            success: true 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: `Error cancelling task: ${errorText}`, 
          success: false 
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Process successful response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Task cancelled successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in apiframe-task-cancel function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error', success: false }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
