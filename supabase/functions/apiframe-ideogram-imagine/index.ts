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
    const { prompt, model = 'V_2', style_type, negative_prompt, seed, magic_prompt_option, aspect_ratio = 'ASPECT_1_1', resolution } = await req.json();

    if (!prompt) {
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

    console.log(`Generating Ideogram image with prompt: "${prompt.substring(0, 50)}..." and model: ${model}`);

    // Prepare request to APIframe
    const requestData = {
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
    Object.keys(requestData).forEach(key => 
      requestData[key] === undefined && delete requestData[key]
    );

    // Make request to APIframe
    const response = await fetch('https://api.apiframe.pro/ideogram-imagine', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey
      },
      body: JSON.stringify(requestData)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('APIframe error:', data);
      return new Response(
        JSON.stringify({ error: data.error || 'Error generating image', details: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      );
    }

    console.log('Ideogram image generated successfully, task ID:', data.task_id);
    return new Response(
      JSON.stringify(data),
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
