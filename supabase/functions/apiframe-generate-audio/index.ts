
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
    const { prompt, model, params, apiKey } = await req.json();
    
    // Get API key from request or environment variable
    const APIFRAME_API_KEY = apiKey || Deno.env.get('APIFRAME_API_KEY');

    if (!prompt || !model || !APIFRAME_API_KEY) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters', 
          details: {
            prompt: !prompt ? 'Missing' : 'Provided',
            model: !model ? 'Missing' : 'Provided',
            apiKey: !APIFRAME_API_KEY ? 'Missing' : 'Provided'
          }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Generating audio with model ${model} and prompt: ${prompt.substring(0, 50)}...`);

    // Prepare request payload
    const payload = {
      prompt,
      model: model,
      ...params
    };

    // Call APIframe API
    const response = await fetch(`${APIFRAME_API_URL}/audio/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${APIFRAME_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('Error from APIframe:', responseData);
      
      return new Response(
        JSON.stringify({ 
          error: responseData.message || 'Error generating audio', 
          status: 'failed',
          details: responseData
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Process successful response
    console.log('APIframe response:', JSON.stringify(responseData));
    
    // Store task in database
    const { error: dbError } = await supabase
      .from('apiframe_tasks')
      .insert({
        task_id: responseData.taskId,
        prompt,
        model,
        media_type: 'audio',
        params: params || {},
        status: responseData.status || 'pending'
      });
      
    if (dbError) {
      console.error('Error storing task in database:', dbError);
    }

    return new Response(
      JSON.stringify({
        taskId: responseData.taskId,
        status: responseData.status || 'pending',
        mediaUrl: responseData.mediaUrl
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in apiframe-generate-audio function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        stack: error.stack
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
