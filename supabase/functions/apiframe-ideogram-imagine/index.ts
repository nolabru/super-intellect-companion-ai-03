
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
    const { prompt, model = 'V_2', style_type, negative_prompt, seed, magic_prompt_option, aspect_ratio = 'ASPECT_1_1', resolution } = requestData;

    console.log('Received Ideogram request with parameters:', JSON.stringify({
      promptLength: prompt ? prompt.length : 0,
      model,
      style_type,
      aspect_ratio,
      hasNegativePrompt: negative_prompt ? true : false,
      hasSeed: seed ? true : false,
      magic_prompt_option
    }));

    if (!prompt) {
      console.error('Error: Prompt is required');
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get APIframe API key from environment
    const apiKey = Deno.env.get('API_FRAME_KEY') || Deno.env.get('APIFRAME_API_KEY');
    if (!apiKey) {
      console.error('APIframe API key not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'API key configuration error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Log API key details for debugging (masked for security)
    console.log(`API Key found. Length: ${apiKey.length}, First 4 chars: ${apiKey.substring(0, 4)}...`);
    console.log(`Full key format check: ${apiKey.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/) ? 'Valid UUID format' : 'Not UUID format'}`);
    
    console.log(`Generating Ideogram image with prompt: "${prompt.substring(0, 50)}..." and model: ${model}`);

    // Prepare request to APIframe
    const apiRequestData = {
      prompt,
      model,
      style_type,
      negative_prompt,
      seed: seed ? Number(seed) : undefined,
      magic_prompt_option,
      aspect_ratio: resolution ? undefined : aspect_ratio,
      resolution: resolution || undefined
    };

    // Remove undefined fields to keep request clean
    Object.keys(apiRequestData).forEach(key => 
      apiRequestData[key] === undefined && delete apiRequestData[key]
    );

    console.log('Sending request to APIframe with data:', JSON.stringify(apiRequestData));

    // Make request to APIframe with enhanced logging
    console.log('Making request to https://api.apiframe.pro/ideogram-imagine');
    console.log('Headers:', JSON.stringify({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer [FIRST-4-CHARS]' + apiKey.substring(0, 4) + '...'
    }));

    // Make request to APIframe
    const response = await fetch('https://api.apiframe.pro/ideogram-imagine', {
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

    const data = await response.json();
    console.log('APIframe response body:', JSON.stringify(data));

    if (!response.ok) {
      console.error('APIframe error response:', data);
      return new Response(
        JSON.stringify({ 
          error: data.error || 'Error generating image', 
          details: data,
          status: response.status
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      );
    }

    console.log('Ideogram image generated successfully, task ID:', data.task_id);
    console.log('Response data:', JSON.stringify({
      hasUrls: data.image_urls ? data.image_urls.length : 0,
      taskId: data.task_id,
      status: data.status,
      seed: data.seed
    }));
    
    // Format the response to match what our frontend expects
    const formattedResponse = {
      success: true,
      images: data.image_urls || [],
      taskId: data.task_id,
      status: data.status || 'completed',
      seed: data.seed
    };
    
    return new Response(
      JSON.stringify(formattedResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
