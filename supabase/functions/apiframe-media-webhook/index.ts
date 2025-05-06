
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.20.0'

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
  
  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    console.log(`[apiframe-media-webhook] Received webhook call`);
    
    // Get the payload
    const payload = await req.json();
    console.log(`[apiframe-media-webhook] Received webhook payload: ${JSON.stringify(payload)}`);
    
    // Extract task information
    const { task_id, status, task_type } = payload;

    if (!task_id) {
      console.error(`[apiframe-media-webhook] No task ID in payload`);
      throw new Error('No task ID provided in webhook payload');
    }

    console.log(`[apiframe-media-webhook] Processing task ${task_id} with status: ${status}`);
    
    let mediaUrl = null;
    
    // Extract media URL if available
    if (status === 'finished' || status === 'completed') {
      // Para resultados da API SUNO (música)
      if (task_type === 'suno' && payload.songs && payload.songs.length > 0) {
        // Preferir o video_url se disponível, senão usar audio_url
        mediaUrl = payload.songs[0].video_url || payload.songs[0].audio_url;
        console.log(`[apiframe-media-webhook] SUNO music ready, URL: ${mediaUrl?.substring(0, 50) || 'none'}...`);
      }
      // Para resultados padrão
      else {
        mediaUrl = payload.media_url || (payload.images && payload.images[0]);
        console.log(`[apiframe-media-webhook] Media ready, URL: ${mediaUrl?.substring(0, 50) || 'none'}...`);
      }
    } else {
      console.log(`[apiframe-media-webhook] No media URL found in payload`);
    }
    
    // Check if task exists in database
    const { data: existingTask, error: queryError } = await supabase
      .from('apiframe_tasks')
      .select('*')
      .eq('task_id', task_id)
      .single();
    
    if (queryError && queryError.code !== 'PGRST116') {
      console.error(`[apiframe-media-webhook] Error checking existing task: ${queryError.message}`);
    }
    
    if (existingTask) {
      console.log(`[apiframe-media-webhook] Updating existing task ${task_id} with status: ${status}`);
      
      // Update existing task
      const { error: updateError } = await supabase
        .from('apiframe_tasks')
        .update({
          status,
          media_url: mediaUrl,
          percentage: payload.percentage || (status === 'finished' ? 100 : 0),
          metadata: payload, // Store full webhook payload in metadata
          updated_at: new Date().toISOString()
        })
        .eq('task_id', task_id);
      
      if (updateError) {
        console.error(`[apiframe-media-webhook] Error updating task: ${updateError.message}`);
        throw updateError;
      }
    } else {
      console.log(`[apiframe-media-webhook] Creating new task record for ${task_id}`);
      
      // Create new task record
      const { error: insertError } = await supabase
        .from('apiframe_tasks')
        .insert({
          task_id,
          status,
          media_url: mediaUrl,
          percentage: payload.percentage || (status === 'finished' ? 100 : 0),
          task_type: task_type || 'unknown',
          metadata: payload
        });
      
      if (insertError) {
        console.error(`[apiframe-media-webhook] Error inserting task: ${insertError.message}`);
        throw insertError;
      }
    }
    
    // If task is finished, insert into media_ready_events for realtime subscriptions
    if ((status === 'finished' || status === 'completed') && mediaUrl) {
      console.log(`[apiframe-media-webhook] Inserting media_ready_event for task ${task_id}`);
      
      let mediaType = 'unknown';
      if (task_type === 'ideogram') mediaType = 'image';
      else if (task_type === 'kling-video' || task_type === 'kling-text') mediaType = 'video';
      else if (task_type === 'suno') mediaType = 'audio';
      
      // Inserir os dados específicos da música para API SUNO
      let mediaData = {};
      if (task_type === 'suno' && payload.songs && payload.songs.length > 0) {
        mediaData = {
          lyrics: payload.songs[0].lyrics,
          title: payload.title || payload.songs[0].title
        };
      }
      
      const { error: eventError } = await supabase
        .from('media_ready_events')
        .insert({
          task_id,
          media_url: mediaUrl,
          media_type: mediaType,
          media_data: mediaData,
        });
      
      if (eventError) {
        console.error(`[apiframe-media-webhook] Error inserting media ready event: ${eventError.message}`);
        // Don't throw error here, as we've already updated the task record
      }
    }
    
    return new Response(JSON.stringify({ success: true }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error(`[apiframe-media-webhook] Error: ${error.message}`);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
