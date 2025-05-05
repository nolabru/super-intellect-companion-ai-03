
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
    const { prompt, modelId, params } = await req.json();
    
    // Get the API Frame API key from the authorization header
    const apiKey = req.headers.get('Authorization')?.replace('Bearer ', '') || '';
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'API key is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    
    if (!prompt) {
      return new Response(
        JSON.stringify({ success: false, error: 'Prompt is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    console.log(`Generating image with ${modelId}. Prompt: ${prompt}`);
    
    // Determine which API endpoint to use based on modelId
    let apiUrl: string;
    let apiParams: Record<string, any>;
    
    if (modelId === 'ideogram-v2') {
      apiUrl = 'https://api.apiframe.pro/v1/ideogram/imagine';
      apiParams = {
        magic_prompt_option: params.magic_prompt_option || 'AUTO',
        model: 'V_2',
        prompt,
        style_type: params.style_type || 'GENERAL',
        aspect_ratio: params.aspect_ratio || 'ASPECT_1_1',
        negative_prompt: params.negative_prompt || ''
      };
    } else if (modelId === 'midjourney') {
      apiUrl = 'https://api.apiframe.pro/v1/midjourney/imagine';
      
      // Get corresponding aspect ratio in Midjourney format
      let mjAspectRatio = '1:1';
      if (params.aspect_ratio) {
        if (params.aspect_ratio === 'ASPECT_16_9') mjAspectRatio = '16:9';
        else if (params.aspect_ratio === 'ASPECT_9_16') mjAspectRatio = '9:16';
        else if (params.aspect_ratio === 'ASPECT_4_3') mjAspectRatio = '4:3';
        else if (params.aspect_ratio === 'ASPECT_3_4') mjAspectRatio = '3:4';
      }
      
      apiParams = {
        prompt,
        aspect_ratio: params.aspect_ratio ? mjAspectRatio : '1:1',
        quality: params.quality || 'standard',
        style: params.style || 'raw',
        negative_prompt: params.negative_prompt || ''
      };
    } else {
      throw new Error(`Unsupported model: ${modelId}`);
    }
    
    console.log(`Using API: ${apiUrl}`);
    console.log(`With params: ${JSON.stringify(apiParams)}`);
    
    // Make request to API Frame API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(apiParams)
    });
    
    const result = await response.json();
    console.log(`API response: ${JSON.stringify(result)}`);
    
    if (!response.ok) {
      throw new Error(result.error || `API error: ${response.status}`);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        images: result.images || [],
        taskId: result.taskId || result.id || 'task-id'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
