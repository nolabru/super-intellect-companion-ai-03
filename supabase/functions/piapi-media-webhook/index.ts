
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
    console.log("[piapi-media-webhook] Recebida notificação de webhook da PiAPI");
    
    // Parse webhook payload
    let payload;
    try {
      payload = await req.json();
    } catch (parseError) {
      console.error("[piapi-media-webhook] Erro ao analisar corpo da requisição:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid webhook payload - JSON parsing failed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    // Log de alto nível dos dados recebidos
    console.log("[piapi-media-webhook] Payload recebido:", {
      taskId: payload.task_id,
      status: payload.status,
      hasOutput: !!payload.output,
    });

    // Verificar se o payload contém um ID de tarefa válido
    if (!payload.task_id) {
      console.error("[piapi-media-webhook] ID da tarefa ausente no payload do webhook");
      return new Response(
        JSON.stringify({ error: "Missing task_id in webhook payload" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Inicializar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Buscar detalhes da tarefa no banco de dados
    const { data: taskData, error: taskError } = await supabaseClient
      .from("piapi_tasks")
      .select("*")
      .eq("task_id", payload.task_id)
      .single();

    if (taskError) {
      console.error(`[piapi-media-webhook] Erro ao buscar tarefa ${payload.task_id}:`, taskError);
      return new Response(
        JSON.stringify({ error: "Task not found in database" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    console.log(`[piapi-media-webhook] Tarefa encontrada no banco de dados:`, {
      id: taskData.task_id,
      type: taskData.media_type,
      currentStatus: taskData.status
    });

    // Verificar status da tarefa e extrair URL da mídia se disponível
    let status = 'pending';
    let mediaUrl = null;
    let errorMessage = null;

    // Mapear status da API para nosso formato interno
    switch (payload.status) {
      case 'succeeded':
        status = 'completed';
        // Extrair URL da mídia com base no tipo de mídia e formato de resposta
        if (payload.output) {
          if (taskData.media_type === 'image') {
            // Lidar com diferentes formatos de resposta para imagens
            if (Array.isArray(payload.output.images) && payload.output.images.length > 0) {
              mediaUrl = payload.output.images[0];
            } else if (payload.output.image_url) {
              mediaUrl = payload.output.image_url;
            } else if (typeof payload.output === 'string') {
              mediaUrl = payload.output;
            }
          } else if (taskData.media_type === 'video') {
            // Lidar com diferentes formatos de resposta para vídeos
            if (payload.output.video_url) {
              mediaUrl = payload.output.video_url;
            } else if (payload.output.url) {
              mediaUrl = payload.output.url;
            } else if (typeof payload.output === 'string') {
              mediaUrl = payload.output;
            }
          } else if (taskData.media_type === 'audio') {
            // Lidar com diferentes formatos de resposta para áudio
            if (payload.output.audio_url) {
              mediaUrl = payload.output.audio_url;
            } else if (payload.output.url) {
              mediaUrl = payload.output.url;
            } else if (typeof payload.output === 'string') {
              mediaUrl = payload.output;
            }
          }
        }
        break;
      case 'processing':
        status = 'processing';
        break;
      case 'failed':
        status = 'failed';
        errorMessage = payload.error || 'Task failed without specific error message';
        break;
      default:
        status = 'pending';
    }

    console.log(`[piapi-media-webhook] Status da tarefa atualizado: ${status}, URL da mídia: ${mediaUrl || 'não disponível'}`);

    // Atualizar o registro no banco de dados com as informações mais recentes
    const { error: updateError } = await supabaseClient
      .from("piapi_tasks")
      .update({
        status,
        media_url: mediaUrl,
        error: errorMessage,
        updated_at: new Date().toISOString()
      })
      .eq("task_id", payload.task_id);

    if (updateError) {
      console.error(`[piapi-media-webhook] Erro ao atualizar tarefa no banco de dados:`, updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update task in database" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log(`[piapi-media-webhook] Registro da tarefa atualizado com sucesso`);

    // Se a tarefa foi completada com sucesso e temos URL de mídia, criar evento de mídia pronta
    if (status === 'completed' && mediaUrl) {
      console.log(`[piapi-media-webhook] Criando evento de mídia pronta para tarefa ${payload.task_id}`);
      
      const { error: eventError } = await supabaseClient
        .from("media_ready_events")
        .insert({
          task_id: payload.task_id,
          media_type: taskData.media_type,
          media_url: mediaUrl,
          prompt: taskData.prompt,
          model: taskData.model
        });
        
      if (eventError) {
        console.error(`[piapi-media-webhook] Erro ao inserir evento de mídia pronta:`, eventError);
      } else {
        console.log(`[piapi-media-webhook] Evento de mídia pronta criado com sucesso`);
      }

      // Salvar automaticamente na galeria
      const galleryItemId = crypto.randomUUID();
      
      const { error: galleryError } = await supabaseClient
        .from("media_gallery")
        .insert({
          id: galleryItemId,
          media_url: mediaUrl,
          media_type: taskData.media_type,
          prompt: taskData.prompt || "Mídia gerada pela PiAPI",
          user_id: taskData.user_id || "unknown",
          model_id: taskData.model || "unknown", 
          metadata: {
            source: "piapi",
            task_id: payload.task_id,
            params: taskData.params,
            auto_saved: true
          }
        });
        
      if (galleryError) {
        console.error(`[piapi-media-webhook] Erro ao salvar mídia na galeria:`, galleryError);
      } else {
        console.log(`[piapi-media-webhook] Mídia salva automaticamente na galeria: ${galleryItemId}`);
      }
    }

    // Retornar confirmação de processamento bem-sucedido
    return new Response(
      JSON.stringify({
        success: true,
        message: `Webhook processed successfully for task ${payload.task_id}`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    // Tratamento central de erros
    console.error("[piapi-media-webhook] Erro ao processar webhook:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Unknown error",
        details: "Check the edge function logs for more information"
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 500 
      }
    );
  }
});
