
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const APIFRAME_API_KEY = Deno.env.get("API_FRAME_KEY");
    if (!APIFRAME_API_KEY) {
      throw new Error("API_FRAME_KEY not configured in environment variables");
    }
    
    const { prompt, model, width, height } = await req.json();
    
    if (!prompt) {
      throw new Error("Prompt is required");
    }
    
    // Determine which API endpoint and parameters to use based on the model
    let apiUrl = "https://api.apiframe.ai/v1/images/generate";
    let requestData = {
      model: model || "dall-e-3", // Default to DALL-E 3
      prompt: prompt,
      size: "1024x1024" // Default size
    };
    
    // Adjust parameters based on the model
    if (model === 'sdxl' || model === 'stable-diffusion-xl') {
      requestData.model = 'stable-diffusion-xl';
    }
    
    if (width && height) {
      requestData.size = `${width}x${height}`;
    }
    
    console.log(`[apiframe-generate-image] Generating image with model: ${requestData.model}`);
    console.log(`[apiframe-generate-image] Prompt: ${prompt}`);
    
    // Call the APIframe API
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${APIFRAME_API_KEY}`
      },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[apiframe-generate-image] API request failed (${response.status}):`, errorText);
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data.data || !data.data.url) {
      throw new Error("No image URL received from APIframe API");
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        url: data.data.url,
        model: requestData.model
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[apiframe-generate-image]', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : String(err)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
