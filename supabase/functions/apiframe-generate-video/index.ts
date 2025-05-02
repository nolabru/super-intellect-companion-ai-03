
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
    const APIFRAME_API_KEY = Deno.env.get("API_FRAME_KEY");
    if (!APIFRAME_API_KEY) {
      throw new Error("API_FRAME_KEY not configured in environment variables");
    }
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );
    
    const { prompt, model, referenceUrl, duration, user_id, quality } = await req.json();
    
    if (!prompt) {
      throw new Error("Prompt is required");
    }
    
    // Determine which API endpoint and parameters to use based on the model
    let apiUrl = "https://api.apiframe.ai/v1/videos/generate";
    let requestData: any = {
      model: model || "gen-2", // Default to Runway Gen-2
      prompt: prompt
    };
    
    // Add optional parameters if provided
    if (referenceUrl) {
      requestData.init_image = referenceUrl;
    }
    
    if (duration) {
      requestData.duration = duration;
    }
    
    if (quality) {
      requestData.quality = quality;
    }
    
    // Adjust model param based on model ID
    switch (model) {
      case 'gen-2':
      case 'runway-gen-2':
        requestData.model = 'runway-gen-2';
        break;
      case 'pika':
        requestData.model = 'pika';
        break;
      default:
        requestData.model = 'runway-gen-2';
    }
    
    console.log(`[apiframe-generate-video] Generating video with model: ${requestData.model}`);
    console.log(`[apiframe-generate-video] Prompt: ${prompt}`);
    
    // Store task in database before calling API
    const { data: taskData, error: taskError } = await supabase
      .from('apiframe_tasks')
      .insert([{
        prompt,
        model: requestData.model,
        media_type: 'video',
        status: 'pending',
        user_id,
        params: {
          referenceUrl,
          duration,
          quality
        }
      }])
      .select('*')
      .single();
    
    if (taskError) {
      console.error('[apiframe-generate-video] Error creating task record:', taskError);
      throw taskError;
    }
    
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
      console.error(`[apiframe-generate-video] API request failed (${response.status}):`, errorText);
      
      // Update task status to failed
      await supabase
        .from('apiframe_tasks')
        .update({
          status: 'failed',
          error: `API request failed with status ${response.status}: ${errorText}`
        })
        .eq('id', taskData.id);
        
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data.data || !data.data.url) {
      throw new Error("No video URL received from APIframe API");
    }
    
    // Update task with URL and status
    await supabase
      .from('apiframe_tasks')
      .update({
        media_url: data.data.url,
        status: 'completed'
      })
      .eq('id', taskData.id);
    
    return new Response(
      JSON.stringify({
        success: true,
        url: data.data.url,
        model: requestData.model,
        taskId: taskData.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[apiframe-generate-video]', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : String(err)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
