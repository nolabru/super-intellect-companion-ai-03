
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

// Define the APIframe API URL - Updated to use the correct domain
const APIFRAME_API_URL = 'https://api.apiframe.io/v1';
const APIFRAME_ALT_API_URL = 'https://api.apiframe.com/v1';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { prompt, model, params, apiKey, referenceImageUrl } = await req.json();
    
    // Get API key from request or environment variable - standardized to API_FRAME
    const APIFRAME_API_KEY = Deno.env.get('API_FRAME');

    if (!prompt || !model || !APIFRAME_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Generating video with model ${model} and prompt: ${prompt.substring(0, 50)}...`);

    // Prepare request payload
    const payload = {
      prompt,
      model: model,
      ...params
    };

    // Add reference image if provided
    if (referenceImageUrl) {
      payload.image_url = referenceImageUrl;
    }

    // Try primary endpoint first
    let response;
    let apiUrl = APIFRAME_API_URL;
    
    try {
      response = await fetch(`${APIFRAME_API_URL}/videos/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${APIFRAME_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      // If failed with 404, try alternate endpoint
      if (response.status === 404) {
        console.log('Primary API endpoint failed with 404, trying alternate endpoint');
        apiUrl = APIFRAME_ALT_API_URL;
        response = await fetch(`${APIFRAME_ALT_API_URL}/videos/generate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${APIFRAME_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      }
    } catch (error) {
      console.error('Error with primary endpoint, trying alternate:', error);
      // Try alternate URL
      apiUrl = APIFRAME_ALT_API_URL;
      response = await fetch(`${APIFRAME_ALT_API_URL}/videos/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${APIFRAME_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    }

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error from APIframe:', errorData);
      
      return new Response(
        JSON.stringify({ 
          error: errorData.message || 'Error generating video', 
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
        media_type: 'video',
        params: { ...params, referenceImageUrl },
        status: data.status || 'pending'
      });
      
    if (dbError) {
      console.error('Error storing task in database:', dbError);
    }

    return new Response(
      JSON.stringify({
        taskId: data.taskId,
        status: data.status || 'pending',
        mediaUrl: data.mediaUrl,
        apiUrl: apiUrl // Include which API URL was successfully used
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in apiframe-generate-video function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
