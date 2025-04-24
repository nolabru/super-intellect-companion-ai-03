
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
      console.error("[piapi-task-cancel] PIAPI_API_KEY não configurada");
      throw new Error("PIAPI_API_KEY not configured");
    }

    // Extrair ID da tarefa do corpo da requisição
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error("[piapi-task-cancel] Erro ao analisar corpo da requisição:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid request body - JSON parsing failed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { taskId } = requestBody;
    
    if (!taskId) {
      console.error("[piapi-task-cancel] taskId é obrigatório");
      return new Response(
        JSON.stringify({ error: "Task ID is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`[piapi-task-cancel] Tentando cancelar tarefa: ${taskId}`);

    // Primeiro, verificar no banco de dados se a tarefa está em um estado cancelável
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
      console.error(`[piapi-task-cancel] Erro ao buscar tarefa no banco de dados:`, taskError);
      return new Response(
        JSON.stringify({ error: "Task not found in database" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    console.log(`[piapi-task-cancel] Status atual da tarefa: ${taskData.status}`);
    
    // Verificar se a tarefa já está em um estado final (completed/failed)
    if (taskData.status === 'completed' || taskData.status === 'failed') {
      console.log(`[piapi-task-cancel] A tarefa já está em estado final: ${taskData.status}`);
      return new Response(
        JSON.stringify({
          success: false,
          message: `Task is already in ${taskData.status} state and cannot be cancelled`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Tentar cancelar a tarefa na API
    console.log(`[piapi-task-cancel] Enviando requisição de cancelamento para: ${PIAPI_API_BASE_URL}/task/${taskId}/cancel`);
    
    const response = await fetch(`${PIAPI_API_BASE_URL}/task/${taskId}/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PIAPI_API_KEY}`
      }
    });

    // Log do status da resposta para depuração
    console.log(`[piapi-task-cancel] Status da resposta da API: ${response.status}`);
    
    // Ler o corpo da resposta como texto para análise
    const responseText = await response.text();
    console.log(`[piapi-task-cancel] Resposta da API: ${responseText}`);

    let success = false;
    let responseData;
    
    try {
      // Tenta analisar a resposta como JSON
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.log("[piapi-task-cancel] Resposta não é JSON válido");
    }
    
    // Analisar resposta
    if (response.ok) {
      console.log(`[piapi-task-cancel] Tarefa cancelada com sucesso na API`);
      success = true;
    } else {
      // Se o erro for que a tarefa já foi concluída, considerar como um sucesso parcial
      if (responseText.includes("already completed") || responseText.includes("already failed")) {
        console.log(`[piapi-task-cancel] A tarefa já foi concluída ou falhou na API`);
        success = true;
      } else {
        console.error(`[piapi-task-cancel] Erro ao cancelar tarefa na API:`, responseText);
      }
    }

    // Se obteve sucesso ou a tarefa já está em um estado final, atualizar no banco de dados
    if (success) {
      console.log(`[piapi-task-cancel] Atualizando status da tarefa no banco de dados para 'failed'`);
      
      const { error: updateError } = await supabaseClient
        .from("piapi_tasks")
        .update({
          status: 'failed',
          error: 'Task cancelled by user',
          updated_at: new Date().toISOString()
        })
        .eq("task_id", taskId);

      if (updateError) {
        console.error(`[piapi-task-cancel] Erro ao atualizar status da tarefa no banco de dados:`, updateError);
      }
    }

    // Retornar resultado
    return new Response(
      JSON.stringify({
        success,
        message: success ? "Task cancelled successfully" : "Failed to cancel task"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    // Tratamento central de erros
    console.error("[piapi-task-cancel] Erro:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
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
