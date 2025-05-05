
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const requestData = await req.json();
    const { 
      prompt, 
      negative_prompt, 
      quality = "standard", 
      aspect_ratio = "1:1",
      style = "raw"
    } = requestData;

    console.log('Received Midjourney request with parameters:', JSON.stringify({
      promptLength: prompt ? prompt.length : 0,
      hasNegativePrompt: negative_prompt ? true : false,
      quality,
      aspect_ratio,
      style
    }));

    if (!prompt) {
      console.error('Error: Prompt is required');
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get APIframe API key from environment - check both possible name formats
    const apiKey = Deno.env.get('API_FRAME_KEY') || Deno.env.get('APIFRAME_API_KEY');
    if (!apiKey) {
      console.error('APIframe API key not found in environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'API key configuration error', 
          details: 'API_FRAME_KEY or APIFRAME_API_KEY not set in environment variables'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log(`Generating Midjourney image with prompt: "${prompt.substring(0, 50)}..."`);

    // Prepare request to APIframe
    const apiRequestData = {
      prompt,
      negative_prompt: negative_prompt || undefined,
      quality,
      aspect_ratio,
      style
    };

    // Remove undefined fields to keep request clean
    Object.keys(apiRequestData).forEach(key => 
      apiRequestData[key] === undefined && delete apiRequestData[key]
    );

    console.log('Sending request to APIframe with data:', JSON.stringify(apiRequestData));

    // Making the request to the endpoint
    const response = await fetch('https://api.apiframe.pro/imagine', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey
      },
      body: JSON.stringify(apiRequestData)
    });

    // Log response status and headers for debugging
    console.log(`APIframe response status: ${response.status}`);
    console.log('APIframe response headers:');
    for (const [key, value] of response.headers.entries()) {
      console.log(`${key}: ${value}`);
    }

    // Verify the content type before trying to parse as JSON
    const contentType = response.headers.get('content-type');
    console.log(`Response content type: ${contentType}`);
    
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Received non-JSON response from APIframe API');
      const responseText = await response.text();
      console.error(`First 500 chars of response: ${responseText.substring(0, 500)}`);
      
      return new Response(
        JSON.stringify({ 
          error: 'Invalid response format from APIframe', 
          details: 'Expected JSON but received a different format',
          status: response.status,
          contentType
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
      );
    }

    const data = await response.json();
    console.log('APIframe response body:', JSON.stringify(data));

    if (!response.ok) {
      console.error('APIframe error response:', data);
      return new Response(
        JSON.stringify({ 
          error: data.error || 'Error generating image',
          message: 'Failed to generate image with Midjourney',
          details: data,
          status: response.status
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      );
    }

    // Validation of response
    if (!data.task_id) {
      console.error('Invalid response from APIframe: Missing task_id');
      return new Response(
        JSON.stringify({ 
          error: 'Invalid response from API service', 
          details: 'Missing task ID in response',
          rawResponse: data
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Midjourney image task created successfully, task ID:', data.task_id);
    
    // Insert task record into database for tracking
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      
      if (supabaseUrl && supabaseKey) {
        // Import the createClient dynamically
        const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.7.1");
        const supabaseClient = createClient(supabaseUrl, supabaseKey);
        
        const { error } = await supabaseClient
          .from("apiframe_tasks")
          .insert({
            task_id: data.task_id,
            status: 'processing',
            model: 'midjourney',
            media_type: 'image',
            prompt: prompt
          });
          
        if (error) {
          console.error('Error inserting task into database:', error);
        } else {
          console.log('Successfully inserted task record into database');
        }
      }
    } catch (dbError) {
      console.error('Error during database operation:', dbError);
    }
    
    console.log('Response data:', JSON.stringify({
      taskId: data.task_id,
      status: data.status || 'processing'
    }));
    
    // IMPORTANT FIX: For immediate response compatibility, always include an empty images array
    // even though the real image URLs will come later from the task status check
    // This prevents the "No image was generated" error in the frontend
    const formattedResponse = {
      success: true,
      taskId: data.task_id,
      status: data.status || 'processing',
      images: data.image_urls || []
    };
    
    return new Response(
      JSON.stringify(formattedResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred', 
        details: error.message,
        stack: error.stack
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
