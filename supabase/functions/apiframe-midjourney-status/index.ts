
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get task ID from the request
    const { taskId } = await req.json();
    
    if (!taskId) {
      return new Response(
        JSON.stringify({ error: "Task ID não fornecido" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current task status from the database
    const { data: taskData, error: fetchError } = await supabase
      .from("apiframe_tasks")
      .select("*")
      .eq("task_id", taskId)
      .single();

    if (fetchError || !taskData) {
      console.error(`Tarefa ${taskId} não encontrada: ${fetchError?.message}`);
      return new Response(
        JSON.stringify({ error: "Tarefa não encontrada" }),
        { 
          status: 404, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Check if we need to update status directly from APIframe API
    const taskAge = Date.now() - new Date(taskData.created_at).getTime();
    const needsUpdate = taskData.status !== "finished" && 
                        taskData.status !== "failed" && 
                        taskAge > 10 * 1000; // Check after 10 seconds

    let updatedTaskData = taskData;
    
    if (needsUpdate) {
      console.log(`Atualizando status da tarefa Midjourney ${taskId} direto da API`);
      
      const APIFRAME_API_KEY = Deno.env.get("APIFRAME_API_KEY") || Deno.env.get("API_FRAME_KEY");
      if (!APIFRAME_API_KEY) {
        throw new Error("APIFRAME_API_KEY não configurada");
      }
      
      // Call API to get updated status
      const apiResponse = await fetch(`https://api.apiframe.pro/gallery?task_id=${taskId}`, {
        method: "GET",
        headers: {
          "Authorization": APIFRAME_API_KEY
        }
      });

      if (apiResponse.ok) {
        const apiData = await apiResponse.json();
        console.log(`Status atualizado da API Midjourney: ${JSON.stringify(apiData)}`);
        
        // Determine if task is complete based on API response
        const isCompleted = Array.isArray(apiData) && apiData.length > 0 && apiData[0]?.image_url;
        
        if (isCompleted) {
          // Get the first image URL from gallery
          const imageUrl = apiData[0].image_url;
          
          // Update database record
          const updateData = {
            status: "finished",
            percentage: 100,
            media_url: imageUrl,
            result_url: imageUrl,
            updated_at: new Date().toISOString()
          };

          const { data: updated, error: updateError } = await supabase
            .from("apiframe_tasks")
            .update(updateData)
            .eq("task_id", taskId)
            .select()
            .single();

          if (!updateError && updated) {
            updatedTaskData = updated;
            
            // Create media_ready_event to notify the frontend
            const { error: insertError } = await supabase
              .from("media_ready_events")
              .insert({
                task_id: taskId,
                media_url: imageUrl,
                media_type: "image",
                status: "completed",
                model: "midjourney",
                prompt: updatedTaskData.prompt
              });
              
            if (insertError) {
              console.error(`Erro ao inserir evento de mídia pronta: ${insertError.message}`);
            } else {
              console.log(`Evento de mídia Midjourney criado com sucesso`);
            }
          }
        } else if (apiData.error) {
          // Handle API error
          const updateData = {
            status: "failed",
            error: apiData.error,
            updated_at: new Date().toISOString()
          };
          
          const { data: updated, error: updateError } = await supabase
            .from("apiframe_tasks")
            .update(updateData)
            .eq("task_id", taskId)
            .select()
            .single();
            
          if (!updateError && updated) {
            updatedTaskData = updated;
          }
        } else {
          // Still processing
          const updateData = {
            percentage: Math.min((taskAge / (60 * 1000)) * 10, 90), // Gradual progress up to 90%
            updated_at: new Date().toISOString()
          };
          
          const { data: updated, error: updateError } = await supabase
            .from("apiframe_tasks")
            .update(updateData)
            .eq("task_id", taskId)
            .select()
            .single();
            
          if (!updateError && updated) {
            updatedTaskData = updated;
          }
        }
      }
    }

    // Map response for the client
    const response = {
      taskId: updatedTaskData.task_id,
      status: updatedTaskData.status === "finished" ? "completed" : 
              updatedTaskData.status === "failed" ? "failed" : "processing",
      progress: updatedTaskData.percentage,
      mediaUrl: updatedTaskData.media_url || updatedTaskData.result_url || null,
      error: updatedTaskData.error || null
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error(`Erro: ${error.message}`);
    
    return new Response(
      JSON.stringify({ 
        error: "Falha ao verificar status da tarefa Midjourney", 
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
