
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

    // Obter parâmetros da requisição
    const { taskId } = await req.json();
    
    if (!taskId) {
      return new Response(
        JSON.stringify({ error: "ID da tarefa é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log(`Cancelando tarefa ${taskId}`);

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se a tarefa existe
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

    // Cancelar tarefa na API
    const apiResponse = await fetch(`https://api.piapi.ai/api/v1/task/${taskId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${PIAPI_API_KEY}`
      }
    });

    // Mesmo que falhe na API, atualizar o status no banco
    const { error: updateError } = await supabase
      .from("piapi_tasks")
      .update({ 
        status: "canceled",
        updated_at: new Date().toISOString()
      })
      .eq("task_id", taskId);

    if (updateError) {
      console.error(`Erro ao atualizar status da tarefa: ${updateError.message}`);
    }

    // Se a API retornou sucesso
    if (apiResponse.ok) {
      const cancelData = await apiResponse.json();
      console.log(`Tarefa ${taskId} cancelada com sucesso`);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: `Tarefa ${taskId} cancelada com sucesso`,
          data: cancelData
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    } else {
      // Se falhou na API mas conseguimos atualizar no banco
      const errorData = await apiResponse.json();
      console.error(`Erro ao cancelar tarefa na API: ${JSON.stringify(errorData)}`);
      
      return new Response(
        JSON.stringify({
          success: false,
          message: `Tarefa marcada como cancelada no banco de dados, mas falhou na API: ${errorData.error?.message || apiResponse.statusText}`
        }),
        { status: 207, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  } catch (error) {
    console.error(`Erro: ${error.message}`);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: "Falha ao cancelar tarefa", 
        message: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
