
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
    console.log("Recebida requisição para verificar status da tarefa");
    
    // Obter ID da tarefa da requisição
    const { taskId } = await req.json();
    
    if (!taskId) {
      console.error("ID da tarefa não fornecido");
      return new Response(
        JSON.stringify({ error: "ID da tarefa não fornecido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log(`Verificando status da tarefa: ${taskId}`);

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar status atual da tarefa
    const { data: taskData, error: fetchError } = await supabase
      .from("apiframe_tasks")
      .select("*")
      .eq("task_id", taskId)
      .single();

    if (fetchError || !taskData) {
      console.error(`Tarefa ${taskId} não encontrada: ${fetchError?.message}`);
      return new Response(
        JSON.stringify({ error: "Tarefa não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log(`Tarefa encontrada: ${JSON.stringify(taskData)}`);

    // Verificar se é necessário atualizar status diretamente na API Apiframe 
    // para tarefas que não completaram e têm mais de 2 minutos
    const taskAge = Date.now() - new Date(taskData.created_at).getTime();
    const needsUpdate = taskData.status !== "finished" && 
                        taskData.status !== "failed" && 
                        taskAge > 2 * 60 * 1000;

    let updatedTaskData = taskData;
    
    if (needsUpdate) {
      console.log(`Atualizando status da tarefa ${taskId} direto da API`);
      
      const APIFRAME_API_KEY = Deno.env.get("APIFRAME_API_KEY");
      if (!APIFRAME_API_KEY) {
        throw new Error("APIFRAME_API_KEY não configurada");
      }
      
      // Fazer chamada para API para obter o status atualizado
      const apiResponse = await fetch(`https://api.apiframe.pro/kling-status?task_id=${taskId}`, {
        method: "GET",
        headers: {
          "Authorization": APIFRAME_API_KEY
        }
      });

      if (apiResponse.ok) {
        const apiData = await apiResponse.json();
        console.log(`Status atualizado da API: ${JSON.stringify(apiData)}`);
        
        // Atualizar o registro no banco de dados
        const updateData: any = {
          status: apiData.status || taskData.status,
          percentage: apiData.percentage || taskData.percentage,
          updated_at: new Date().toISOString()
        };
        
        if (apiData.video_url) {
          updateData.media_url = apiData.video_url;
          console.log(`URL do vídeo da API: ${apiData.video_url}`);
        }

        const { data: updated, error: updateError } = await supabase
          .from("apiframe_tasks")
          .update(updateData)
          .eq("task_id", taskId)
          .select()
          .single();

        if (!updateError && updated) {
          updatedTaskData = updated;
          
          // Se o vídeo estiver pronto, salvar no media_ready_events
          if (apiData.status === "finished" && apiData.video_url) {
            console.log(`Vídeo pronto! Inserindo evento de mídia via status check`);
            
            await supabase
              .from("media_ready_events")
              .insert({
                task_id: taskId,
                media_url: apiData.video_url,
                media_type: "video",
                status: "completed",
                prompt: taskData.prompt,
                model: taskData.model
              });
          }
        } else if (updateError) {
          console.error(`Erro ao atualizar tarefa: ${updateError.message}`);
        }
      } else {
        console.error(`Erro ao verificar status via API: ${apiResponse.status}`);
        try {
          const errorText = await apiResponse.text();
          console.error(`Resposta de erro da API: ${errorText}`);
        } catch (e) {
          console.error("Não foi possível ler resposta de erro");
        }
      }
    }

    // Mapear resposta para o formato esperado pelo cliente
    const response = {
      taskId: updatedTaskData.task_id,
      status: updatedTaskData.status === "finished" ? "completed" : 
              updatedTaskData.status === "failed" ? "failed" : "processing",
      progress: updatedTaskData.percentage,
      mediaUrl: updatedTaskData.media_url || null,
      error: updatedTaskData.error || null
    };

    console.log(`Enviando resposta de status: ${JSON.stringify(response)}`);

    return new Response(
      JSON.stringify(response),
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
