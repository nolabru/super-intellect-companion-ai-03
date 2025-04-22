
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
    // Verificar API key
    const PIAPI_API_KEY = Deno.env.get("PIAPI_API_KEY");
    if (!PIAPI_API_KEY) {
      throw new Error("PIAPI_API_KEY não configurada");
    }

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obter parâmetros da requisição
    const { taskId } = await req.json();
    
    if (!taskId) {
      return new Response(
        JSON.stringify({ error: "ID da tarefa é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log(`Verificando status da tarefa ${taskId}`);

    // Verificar se já temos dados no banco
    const { data: taskData, error: fetchError } = await supabase
      .from("piapi_tasks")
      .select("*")
      .eq("task_id", taskId)
      .single();

    if (fetchError) {
      console.error(`Erro ao buscar tarefa: ${fetchError.message}`);
      return new Response(
        JSON.stringify({ error: "Tarefa não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Se já temos a URL da mídia, podemos retornar diretamente
    if (taskData.status === "completed" && taskData.media_url) {
      return new Response(
        JSON.stringify({
          status: "completed",
          mediaUrl: taskData.media_url,
          mediaType: taskData.media_type,
          taskId: taskData.task_id
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Caso contrário, consultar a API para obter o status atualizado
    const apiResponse = await fetch(`https://api.piapi.ai/api/v1/task/${taskId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${PIAPI_API_KEY}`
      }
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      console.error(`Erro ao consultar status na PiAPI: ${JSON.stringify(errorData)}`);
      throw new Error(`Erro da PiAPI: ${errorData.error?.message || apiResponse.statusText}`);
    }

    // Processar resposta
    const responseData = await apiResponse.json();
    const currentStatus = responseData.status;
    const result = responseData.result;
    
    console.log(`Status da tarefa ${taskId}: ${currentStatus}`);

    // Atualizar o registro no banco
    const { error: updateError } = await supabase
      .from("piapi_tasks")
      .update({ 
        status: currentStatus,
        result: result || null,
        updated_at: new Date().toISOString()
      })
      .eq("task_id", taskId);

    if (updateError) {
      console.error(`Erro ao atualizar tarefa: ${updateError.message}`);
    }

    // Se o status é "completed", processar e salvar o arquivo de mídia
    let mediaUrl = null;
    
    if (currentStatus === "completed" && result && result.output && result.output.length > 0) {
      mediaUrl = result.output[0].url;
      
      if (mediaUrl) {
        // Atualizar o registro com a URL da mídia
        const { error: mediaUpdateError } = await supabase
          .from("piapi_tasks")
          .update({ media_url: mediaUrl })
          .eq("task_id", taskId);

        if (mediaUpdateError) {
          console.error(`Erro ao atualizar URL da mídia: ${mediaUpdateError.message}`);
        }
      }
    }

    // Retornar resposta com status
    return new Response(
      JSON.stringify({
        status: currentStatus,
        mediaUrl,
        mediaType: taskData.media_type,
        taskId
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error(`Erro: ${error.message}`);
    
    return new Response(
      JSON.stringify({ 
        error: "Falha ao verificar status da tarefa", 
        message: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
