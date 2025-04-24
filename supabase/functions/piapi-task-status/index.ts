
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PIAPI_API_BASE_URL = "https://api.piapi.ai/api/v1";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PIAPI_API_KEY = Deno.env.get("PIAPI_API_KEY") || "";
    if (!PIAPI_API_KEY) {
      console.error("[piapi-task-status] PIAPI_API_KEY não configurada");
      throw new Error("PIAPI_API_KEY not configured");
    }

    // Extrair ID da tarefa do corpo da requisição
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error("[piapi-task-status] Erro ao analisar corpo da requisição:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid request body - JSON parsing failed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { taskId } = requestBody;
    
    if (!taskId) {
      console.error("[piapi-task-status] taskId é obrigatório");
      return new Response(
        JSON.stringify({ error: "Task ID is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`[piapi-task-status] Verificando status da tarefa: ${taskId}`);

    // Primeiro, verificar no banco de dados se a tarefa já está concluída
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    const { data: taskData, error: taskError } = await supabaseClient
      .from("piapi_tasks")
      .select("*")
      .eq("task_id", taskId)
      .single();

    if (taskError) {
      console.error(`[piapi-task-status] Erro ao buscar tarefa no banco de dados:`, taskError);
    } else if (taskData) {
      console.log(`[piapi-task-status] Encontrado registro de tarefa no banco de dados:`, {
        id: taskData.task_id,
        status: taskData.status,
        hasUrl: !!taskData.media_url
      });
      
      // Se a tarefa já estiver concluída ou falhou, retornar diretamente
      if (taskData.status === 'completed' || taskData.status === 'failed') {
        console.log(`[piapi-task-status] Retornando status da tarefa a partir do banco de dados`);
        return new Response(
          JSON.stringify({
            taskId: taskData.task_id,
            status: taskData.status,
            mediaUrl: taskData.media_url,
            error: taskData.error
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Se a tarefa não estiver concluída, verificar o status na API
    console.log(`[piapi-task-status] Consultando status na API: ${PIAPI_API_BASE_URL}/task/${taskId}`);
    
    const response = await fetch(`${PIAPI_API_BASE_URL}/task/${taskId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${PIAPI_API_KEY}`
      }
    });

    // Log do status da resposta para depuração
    console.log(`[piapi-task-status] Status da resposta da API: ${response.status}`);
    
    // Ler o corpo da resposta como texto para análise
    const responseText = await response.text();
    console.log(`[piapi-task-status] Resposta bruta da API: ${responseText.substring(0, 200)}...`);

    // Verificar se a resposta foi bem-sucedida
    if (!response.ok) {
      console.error(`[piapi-task-status] Erro na resposta da API:`, responseText);
      
      let errorMessage;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error?.message || `Error from PiAPI: ${response.statusText}`;
      } catch (e) {
        errorMessage = `Error from PiAPI: ${response.statusText}`;
      }
      
      throw new Error(errorMessage);
    }

    // Analisar a resposta JSON
    let taskResult;
    try {
      taskResult = JSON.parse(responseText);
    } catch (e) {
      console.error(`[piapi-task-status] Falha ao analisar resposta JSON:`, e);
      throw new Error(`Failed to parse API response from PiAPI`);
    }

    console.log(`[piapi-task-status] Resposta analisada com sucesso:`, {
      status: taskResult.status,
      hasOutput: !!taskResult.output,
      outputPreview: taskResult.output ? JSON.stringify(taskResult.output).substring(0, 100) : 'none'
    });
    
    // Mapear estado da tarefa e extrair URL da mídia se disponível
    let status = 'pending';
    let mediaUrl = null;
    let errorMessage = null;

    // Mapear status da API para nosso formato interno
    switch (taskResult.status) {
      case 'succeeded':
        status = 'completed';
        // Extrair URL da mídia dependendo do formato da resposta
        if (taskResult.output && taskResult.output.images && taskResult.output.images.length > 0) {
          mediaUrl = taskResult.output.images[0];
        } else if (taskResult.output && taskResult.output.image_url) {
          mediaUrl = taskResult.output.image_url;
        } else if (taskResult.output && typeof taskResult.output === 'string') {
          // Alguns modelos retornam a URL diretamente como string
          mediaUrl = taskResult.output;
        }
        break;
      case 'processing':
        status = 'processing';
        break;
      case 'failed':
        status = 'failed';
        errorMessage = taskResult.error || 'Task failed without specific error message';
        break;
      default:
        status = 'pending';
    }

    console.log(`[piapi-task-status] Status mapeado: ${status}, URL da mídia: ${mediaUrl || 'não disponível'}`);
    
    // Atualizar o registro no banco de dados com as informações mais recentes
    if (status === 'completed' || status === 'failed') {
      console.log(`[piapi-task-status] Atualizando registro da tarefa no banco de dados`);
      
      const { error: updateError } = await supabaseClient
        .from("piapi_tasks")
        .update({
          status,
          media_url: mediaUrl,
          error: errorMessage,
          updated_at: new Date().toISOString()
        })
        .eq("task_id", taskId);

      if (updateError) {
        console.error(`[piapi-task-status] Erro ao atualizar tarefa no banco de dados:`, updateError);
      }
      
      // Se a tarefa foi completada com sucesso e temos URL de mídia, criar evento de mídia pronta
      if (status === 'completed' && mediaUrl) {
        // Buscar informações adicionais sobre a tarefa para incluir no evento
        let mediaType = 'image'; // Valor padrão
        let prompt = '';
        let model = '';
        
        // Obter dados adicionais da tarefa se disponíveis
        if (taskData) {
          mediaType = taskData.media_type || 'image';
          prompt = taskData.prompt || '';
          model = taskData.model || '';
        }
        
        console.log(`[piapi-task-status] Criando evento de mídia pronta para tarefa ${taskId}`);
        
        const { error: eventError } = await supabaseClient
          .from("media_ready_events")
          .insert({
            task_id: taskId,
            media_type: mediaType,
            media_url: mediaUrl,
            prompt,
            model
          });
          
        if (eventError) {
          console.error(`[piapi-task-status] Erro ao inserir evento de mídia pronta:`, eventError);
        } else {
          console.log(`[piapi-task-status] Evento de mídia pronta criado com sucesso`);
        }
      }
    }

    // Retornar informações do status da tarefa
    return new Response(
      JSON.stringify({
        taskId,
        status,
        mediaUrl,
        error: errorMessage
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    // Tratamento central de erros
    console.error("[piapi-task-status] Erro:", error);
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
