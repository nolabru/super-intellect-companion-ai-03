
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get APIframe API key
    const APIFRAME_API_KEY = Deno.env.get("APIFRAME_API_KEY");
    if (!APIFRAME_API_KEY) {
      throw new Error("APIFRAME_API_KEY is not configured");
    }

    // Parse request body
    const { prompt, model, params = {} } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[apiframe-image] Generating image with model ${model}`);
    console.log('Prompt:', prompt);
    console.log('Params:', params);

    // Create task in APIframe
    const response = await fetch(`https://api.apiframe.ai/v1/images/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APIFRAME_API_KEY}`
      },
      body: JSON.stringify({
        model: model || 'stable-diffusion-xl',
        prompt,
        ...params
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[apiframe-image] Error from APIframe:', error);
      throw new Error(error.message || 'Failed to generate image');
    }

    const data = await response.json();
    console.log('[apiframe-image] APIframe response:', data);

    // Create task record
    const { error: insertError } = await supabase
      .from('piapi_tasks')
      .insert({
        task_id: data.task_id,
        model: model || 'stable-diffusion-xl',
        prompt,
        media_type: 'image',
        params,
        status: data.status || 'pending'
      });

    if (insertError) {
      console.error('[apiframe-image] Error creating task record:', insertError);
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('[apiframe-image] Error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
