
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.8.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Get the APIframe API key from environment variables - updated to use new key name
const APIFRAME_API_KEY = Deno.env.get('API_FRAME');
if (!APIFRAME_API_KEY) {
  console.error('[apiframe-generate-image] API_FRAME not configured in environment variables');
}

// Define the APIframe API URLs - Using the updated correct endpoints
const API_ENDPOINTS = [
  "https://api.apiframe.io/v1/images/generate",
  "https://api.apiframe.com/v1/images/generate", 
  "https://api.apiframe.io/image/generations",
  "https://api.apiframe.com/image/generations"
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { prompt, model, params } = await req.json();
    
    if (!prompt || !model) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`[apiframe-generate-image] Generating image with model ${model} and prompt: ${prompt.substring(0, 100)}...`);

    // Prepare standardized request payload - use consistent key naming based on common API standards
    const apiData = {
      model,
      prompt,
      negative_prompt: params?.negativePrompt || "",
      width: params?.width || 768,
      height: params?.height || 768,
      num_inference_steps: params?.steps || 30,
      guidance_scale: params?.guidanceScale || 7.5,
      seed: params?.seed || Math.floor(Math.random() * 2147483647)
    };

    console.log(`[apiframe-generate-image] Request payload:`, JSON.stringify(apiData).substring(0, 500));
    
    // Try each endpoint until one works
    let response = null;
    let responseData = null;
    let successfulEndpoint = null;
    let errorMessages = [];
    
    for (const endpoint of API_ENDPOINTS) {
      try {
        console.log(`[apiframe-generate-image] Trying endpoint: ${endpoint}`);
        
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${APIFRAME_API_KEY}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify(apiData)
        });
        
        console.log(`[apiframe-generate-image] Response from ${endpoint}: ${response.status} ${response.statusText}`);
        
        // Log response headers for debugging
        const headersLog = {};
        response.headers.forEach((value, key) => { headersLog[key] = value });
        console.log(`[apiframe-generate-image] Response headers:`, JSON.stringify(headersLog));
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            responseData = await response.json();
            successfulEndpoint = endpoint;
            console.log(`[apiframe-generate-image] Successfully used endpoint: ${endpoint}`);
            console.log(`[apiframe-generate-image] Response data:`, JSON.stringify(responseData).substring(0, 500));
            break;
          } else {
            const textResponse = await response.text();
            console.error(`[apiframe-generate-image] Received non-JSON response from ${endpoint}:`, textResponse.substring(0, 500));
            errorMessages.push(`Endpoint ${endpoint} returned non-JSON response`);
          }
        } else {
          const errorText = await response.text();
          console.error(`[apiframe-generate-image] Error from ${endpoint}:`, errorText.substring(0, 500));
          errorMessages.push(`Endpoint ${endpoint} error: ${response.status} ${response.statusText}`);
          
          try {
            // Try to parse error as JSON for more details
            const errorJson = JSON.parse(errorText);
            console.error(`[apiframe-generate-image] Parsed error from ${endpoint}:`, JSON.stringify(errorJson).substring(0, 500));
            errorMessages.push(`Message: ${errorJson.error || errorJson.message || 'Unknown error'}`);
          } catch (parseErr) {
            // If not JSON, use text as is
            errorMessages.push(`Raw error: ${errorText.substring(0, 200)}`);
          }
        }
      } catch (endpointError) {
        console.error(`[apiframe-generate-image] Error with endpoint ${endpoint}:`, endpointError);
        errorMessages.push(`Network error with ${endpoint}: ${endpointError.message}`);
      }
    }
    
    // If no endpoints worked
    if (!successfulEndpoint) {
      console.error(`[apiframe-generate-image] All API endpoints failed. Errors:`, errorMessages.join('; '));
      
      // Check for common issues
      if (errorMessages.some(msg => msg.includes('401') || msg.includes('Authentication'))) {
        throw new Error("Authentication failed. Please verify your API key is valid and has sufficient permissions.");
      } else if (errorMessages.some(msg => msg.includes('429') || msg.includes('Too Many'))) {
        throw new Error("Rate limit exceeded. Please try again later.");
      } else {
        throw new Error(`All API endpoints failed. Please verify API documentation for correct endpoints. Errors: ${errorMessages.join('; ')}`);
      }
    }

    // Get task ID from response using different possible field names
    const taskId = responseData.task_id || responseData.taskId || responseData.id;
    
    if (!taskId) {
      console.error(`[apiframe-generate-image] No task ID in response:`, JSON.stringify(responseData).substring(0, 500));
      throw new Error("No task ID returned from APIframe");
    }
    
    console.log(`[apiframe-generate-image] Task ID: ${taskId}`);
    
    // Store task in database
    const { error: dbError } = await supabase
      .from('apiframe_tasks')
      .insert({
        task_id: taskId,
        prompt,
        model,
        media_type: 'image',
        params: params || {},
        status: 'pending'
      });
      
    if (dbError) {
      console.error('[apiframe-generate-image] Error storing task in database:', dbError);
    }

    return new Response(
      JSON.stringify({
        taskId: taskId,
        status: 'pending',
        message: 'Task created successfully',
        endpoint: successfulEndpoint
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('[apiframe-generate-image] Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        stack: error.stack,
        hint: "Verifique se a API key está correta e se tem permissões suficientes para o modelo escolhido."
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
