
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

    console.log(`Cancelando tarefa ${taskId}`);

    // Cancelar tarefa na PiAPI
    const apiResponse = await fetch(`https://api.piapi.ai/api/v1/task/${taskId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${PIAPI_API_KEY}`
      }
    });

    // Atualizar status no banco de dados, mesmo que a API retorne erro
    // pois podemos ter casos onde a tarefa já foi concluída ou não existe mais na PiAPI
    const { error: updateError } = await supabase
      .from("piapi_tasks")
      .update({ 
        status: "cancelled",
        updated_at: new Date().toISOString()
      })
      .eq("task_id", taskId);

    if (updateError) {
      console.error(`Erro ao atualizar status da tarefa: ${updateError.message}`);
      // Continuamos mesmo com erro no banco
    }

    // Verificar resposta da API
    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      console.error(`Aviso: API respondeu com erro ao cancelar tarefa: ${JSON.stringify(errorData)}`);
      // Retornamos sucesso mesmo assim, pois atualizamos o status localmente
    } else {
      const responseData = await apiResponse.json();
      console.log(`Resposta da API ao cancelar tarefa: ${JSON.stringify(responseData)}`);
    }
    
    // Retornar resposta de sucesso
    return new Response(
      JSON.stringify({
        success: true,
        message: `Tarefa ${taskId} cancelada com sucesso.`
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error(`Erro: ${error.message}`);
    
    return new Response(
      JSON.stringify({ 
        error: "Falha ao cancelar tarefa", 
        message: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
