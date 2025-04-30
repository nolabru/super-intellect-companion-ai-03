
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.8.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
        JSON.stringify({ 
          error: 'Missing required parameters', 
          status: 'failed' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Checking status for task ${taskId}`);

    // Call APIframe API to check task status
    const response = await fetch(`${APIFRAME_API_URL}/tasks/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${APIFRAME_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      // Check if it's because the task doesn't exist (for connection testing)
      const isConnTest = taskId.startsWith('test-connection-') || taskId.startsWith('verify-');
      
      if (isConnTest && response.status === 404) {
        // For test connections, a 404 is actually okay, means the API key works
        return new Response(
          JSON.stringify({ 
            status: 'not_found', 
            message: 'Connection test successful, API key is valid' 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      let errorText;
      try {
        const errorData = await response.json();
        errorText = JSON.stringify(errorData);
      } catch (e) {
        errorText = await response.text();
      }
      
      console.error(`Error from APIframe: ${errorText}`);
      
      // If it's an authentication error and we're testing the connection
      if (isConnTest && (response.status === 401 || response.status === 403)) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid or unauthorized API key', 
            status: 'unauthorized'
          }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: `Error from APIframe: ${errorText}`, 
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
    
    // Update task in database if needed
    if (data && data.status) {
      const { error: dbError } = await supabase
        .from('apiframe_tasks')
        .update({
          status: data.status,
          media_url: data.mediaUrl || data.media_url,
          error: data.error,
          updated_at: new Date().toISOString()
        })
        .eq('task_id', taskId);
        
      if (dbError) {
        console.error('Error updating task in database:', dbError);
      }
      
      // If status is completed, add to media_ready_events for real-time updates
      if (data.status === 'completed' && (data.mediaUrl || data.media_url)) {
        await supabase
          .from('media_ready_events')
          .insert({
            task_id: taskId,
            media_url: data.mediaUrl || data.media_url,
            media_type: 'apiframe'
          });
      }
    }

    return new Response(
      JSON.stringify({
        taskId,
        status: data.status || 'pending',
        mediaUrl: data.mediaUrl || data.media_url,
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
