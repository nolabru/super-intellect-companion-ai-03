
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
    const { task_id, status, result } = await req.json();
    
    if (!task_id) {
      return new Response(
        JSON.stringify({ error: "task_id is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`Received webhook for task ${task_id} with status ${status}`);
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Get task info from Supabase
    const { data: taskData, error: fetchError } = await supabaseClient
      .from("piapi_tasks")
      .select("*")
      .eq("task_id", task_id)
      .single();

    if (fetchError) {
      console.error(`Error fetching task: ${fetchError.message}`);
      return new Response(
        JSON.stringify({ error: "Task not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Update task status
    const { error: updateError } = await supabaseClient
      .from("piapi_tasks")
      .update({ 
        status: status,
        result: result || null,
        updated_at: new Date().toISOString()
      })
      .eq("task_id", task_id);

    if (updateError) {
      console.error(`Error updating task: ${updateError.message}`);
    }

    // If status is completed, process and save the media file
    if (status === "completed" && result && result.output) {
      // Handle Midjourney result (grid of 4 images)
      if (taskData.model === "midjourney") {
        let mediaUrl = null;
        
        // For Midjourney, we need to get the grid image URL
        if (result.output.image_url) {
          mediaUrl = result.output.image_url;
        } else if (result.output.image_urls && result.output.image_urls.length > 0) {
          mediaUrl = result.output.image_urls[0];
        } else if (result.output.grid_url) {
          mediaUrl = result.output.grid_url;
        }
        
        if (mediaUrl) {
          console.log(`Midjourney image grid URL: ${mediaUrl}`);
          const mediaType = taskData.media_type;
          
          try {
            // Download the media file
            console.log(`Downloading Midjourney image from ${mediaUrl}`);
            const mediaResponse = await fetch(mediaUrl);
            
            if (!mediaResponse.ok) {
              throw new Error(`Failed to download media: ${mediaResponse.statusText}`);
            }
            
            const mediaBlob = await mediaResponse.blob();
            
            // Save to appropriate bucket
            const fileName = `${task_id}.png`;
            const storagePath = `images/${fileName}`;
            
            console.log(`Saving Midjourney image to ${storagePath}`);
            
            // Upload to Supabase Storage
            const { data: storageData, error: storageError } = await supabaseClient
              .storage
              .from("media")
              .upload(storagePath, mediaBlob, {
                contentType: "image/png",
                upsert: true
              });
              
            if (storageError) {
              throw new Error(`Failed to upload to storage: ${storageError.message}`);
            }
            
            // Get public URL
            const { data: publicUrlData } = supabaseClient
              .storage
              .from("media")
              .getPublicUrl(storagePath);
              
            const publicUrl = publicUrlData.publicUrl;
            
            // Update task with stored media URL
            await supabaseClient
              .from("piapi_tasks")
              .update({ 
                media_url: publicUrl
              })
              .eq("task_id", task_id);
            
            // Broadcast completion via Realtime
            await supabaseClient
              .from("media_ready_events")
              .insert({
                task_id,
                media_type: mediaType,
                media_url: publicUrl,
                prompt: taskData.prompt,
                model: "midjourney"
              });
              
            console.log(`Midjourney image successfully processed and saved: ${publicUrl}`);
          } catch (processError) {
            console.error(`Error processing Midjourney image: ${processError.message}`);
          }
        }
      } 
      // Handle regular model outputs (single image, video, audio)
      else if (result.output.length > 0) {
        const mediaUrl = result.output[0].url;
        const mediaType = taskData.media_type;
        
        if (mediaUrl) {
          try {
            // Download the media file
            console.log(`Downloading media from ${mediaUrl}`);
            const mediaResponse = await fetch(mediaUrl);
            
            if (!mediaResponse.ok) {
              throw new Error(`Failed to download media: ${mediaResponse.statusText}`);
            }
            
            const mediaBlob = await mediaResponse.blob();
            
            // Determine file extension
            let fileExtension = ".bin";
            const contentType = mediaResponse.headers.get("content-type");
            
            if (contentType) {
              if (contentType.includes("image")) {
                fileExtension = contentType.includes("png") ? ".png" : ".jpg";
              } else if (contentType.includes("video")) {
                fileExtension = ".mp4";
              } else if (contentType.includes("audio")) {
                fileExtension = ".mp3";
              }
            } else {
              // Fallback based on media type
              if (mediaType === "image") fileExtension = ".png";
              else if (mediaType === "video") fileExtension = ".mp4";
              else if (mediaType === "audio") fileExtension = ".mp3";
            }
            
            // Save to appropriate bucket
            let storagePath = "";
            const fileName = `${task_id}${fileExtension}`;
            
            if (mediaType === "image") {
              storagePath = `images/${fileName}`;
            } else if (mediaType === "video") {
              storagePath = `videos/${fileName}`;
            } else if (mediaType === "audio") {
              storagePath = `audios/${fileName}`;
            }
            
            console.log(`Saving media to ${storagePath}`);
            
            // Upload to Supabase Storage
            const { data: storageData, error: storageError } = await supabaseClient
              .storage
              .from("media")
              .upload(storagePath, mediaBlob, {
                contentType,
                upsert: true
              });
              
            if (storageError) {
              throw new Error(`Failed to upload to storage: ${storageError.message}`);
            }
            
            // Get public URL
            const { data: publicUrlData } = supabaseClient
              .storage
              .from("media")
              .getPublicUrl(storagePath);
              
            const publicUrl = publicUrlData.publicUrl;
            
            // Update task with stored media URL
            await supabaseClient
              .from("piapi_tasks")
              .update({ 
                media_url: publicUrl
              })
              .eq("task_id", task_id);
            
            // Broadcast completion via Realtime
            await supabaseClient
              .from("media_ready_events")
              .insert({
                task_id,
                media_type: mediaType,
                media_url: publicUrl,
                prompt: taskData.prompt,
                model: taskData.model
              });
              
            console.log(`Media successfully processed and saved: ${publicUrl}`);
          } catch (processError) {
            console.error(`Error processing media: ${processError.message}`);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Webhook processed for task ${task_id}`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(`Error processing webhook: ${error.message}`);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
