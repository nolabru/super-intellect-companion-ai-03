
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

// Set the global API key that will work for all users
const GLOBAL_APIFRAME_API_KEY = 'b0a5c230-6f6f-4d2b-bb61-4be15184dd63';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { prompt, model, params } = await req.json();
    
    // Use the global API key instead of requesting it from the user or environment
    const APIFRAME_API_KEY = GLOBAL_APIFRAME_API_KEY;

    if (!prompt || !model) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Generating image with model ${model} and prompt: ${prompt.substring(0, 50)}...`);

    // Prepare request payload
    const payload = {
      prompt,
      model: model,
      ...params
    };

    // Call APIframe API
    const response = await fetch(`${APIFRAME_API_URL}/images/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${APIFRAME_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error from APIframe:', errorData);
      
      return new Response(
        JSON.stringify({ 
          error: errorData.message || 'Error generating image', 
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
    
    // Store task in database
    const { error: dbError } = await supabase
      .from('apiframe_tasks')
      .insert({
        task_id: data.taskId,
        prompt,
        model,
        media_type: 'image',
        params: params || {},
        status: data.status || 'pending'
      });
      
    if (dbError) {
      console.error('Error storing task in database:', dbError);
    }

    return new Response(
      JSON.stringify({
        taskId: data.taskId,
        status: data.status || 'pending',
        mediaUrl: data.mediaUrl
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in apiframe-generate-image function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
