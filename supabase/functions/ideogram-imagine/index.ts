
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

// Define the Ideogram API URL
const IDEOGRAM_API_URL = 'https://api.ideogram.ai/api/images/generate';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { prompt, model, style_type, negative_prompt, aspect_ratio, magic_prompt_option } = await req.json();
    
    // Get the API key from environment variables
    const IDEOGRAM_API_KEY = Deno.env.get("IDEOGRAM_API_KEY");
    if (!IDEOGRAM_API_KEY) {
      throw new Error("IDEOGRAM_API_KEY not configured in environment variables");
    }

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`[ideogram-imagine] Generating image with prompt: "${prompt.substring(0, 50)}..."`);

    // Create the request payload for Ideogram API
    const payload = {
      prompt,
      model_version: model || 'V_2', // Default to V_2 if not specified
      style_type: style_type || 'GENERAL',
      negative_prompt: negative_prompt || "",
      aspect_ratio: aspect_ratio || 'ASPECT_1_1',
      magic_prompt_option: magic_prompt_option || 'AUTO'
    };

    // Call the Ideogram API
    const response = await fetch(IDEOGRAM_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${IDEOGRAM_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => response.text());
      console.error('[ideogram-imagine] Error response from API:', errorData);
      
      return new Response(
        JSON.stringify({ 
          error: 'Error from Ideogram API', 
          details: errorData
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Process successful response
    const data = await response.json();
    console.log('[ideogram-imagine] Successful response received');
    
    // Store the generation data in Supabase
    const { error: dbError } = await supabase
      .from('ideogram_generations')
      .insert({
        prompt,
        model: payload.model_version,
        style_type: payload.style_type,
        result: data,
        user_id: req.headers.get('Authorization')?.split(' ')[1] || null
      });
    
    if (dbError) {
      console.error('[ideogram-imagine] Error storing generation in database:', dbError);
      // Continue even if database storage fails
    }

    // Extract the image URLs from the response
    const images = data.images || [];
    const imageUrls = images.map(img => img.url || null).filter(Boolean);

    return new Response(
      JSON.stringify({
        success: true,
        images: imageUrls,
        data: data
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('[ideogram-imagine] Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
