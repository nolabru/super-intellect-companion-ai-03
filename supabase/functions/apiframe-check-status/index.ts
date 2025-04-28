
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

    if (!taskId || !apiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Checking status for task ${taskId}`);

    // Call APIframe API
    const response = await fetch(`${APIFRAME_API_URL}/tasks/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error from APIframe:', errorData);
      
      return new Response(
        JSON.stringify({ 
          error: errorData.message || 'Error checking task status', 
          status: 'failed' 
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Process successful response
    const data = await response.json();
    
    // Update task in database
    const { error: dbError } = await supabase
      .from('apiframe_tasks')
      .update({
        status: data.status || 'pending',
        media_url: data.mediaUrl,
        error: data.error,
        updated_at: new Date().toISOString()
      })
      .eq('task_id', taskId);
      
    if (dbError) {
      console.error('Error updating task in database:', dbError);
    }

    return new Response(
      JSON.stringify({
        status: data.status || 'pending',
        mediaUrl: data.mediaUrl,
        error: data.error
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in apiframe-check-status function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
