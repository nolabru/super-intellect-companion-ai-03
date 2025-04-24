
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
      console.error("[piapi-midjourney-create-task] PIAPI_API_KEY não configurada");
      throw new Error("PIAPI_API_KEY not configured");
    }

    // Obter parâmetros da solicitação
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error("[piapi-midjourney-create-task] Erro ao analisar corpo da requisição:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid request body - JSON parsing failed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { prompt, params = {} } = requestBody;
    
    if (!prompt) {
      console.error("[piapi-midjourney-create-task] Prompt é obrigatório");
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`[piapi-midjourney-create-task] Criando tarefa Midjourney com prompt: ${prompt.substring(0, 50)}...`);
    
    // Configurar webhook para notificações
    const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/piapi-media-webhook`;
    
    // Endpoint para criar uma tarefa Midjourney
    const endpointUrl = `${PIAPI_API_BASE_URL}/task`;

    // Configurar dados da solicitação para a API Midjourney
    const taskData = {
      model: "midjourney/v6",
      task_type: "imagine",
      input: {
        prompt: prompt,
        aspect_ratio: params.aspectRatio || "1:1",
        quality: params.quality || 1,
        style: params.style || "raw",
        repeat: params.repeat || false,
        fast: params.fast || false
      },
      config: {
        webhook_config: {
          endpoint: webhookUrl
        }
      }
    };

    console.log(`[piapi-midjourney-create-task] Enviando requisição para: ${endpointUrl}`);
    console.log(`[piapi-midjourney-create-task] Corpo da requisição:`, JSON.stringify(taskData));

    // Enviar solicitação para criar a tarefa
    const response = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PIAPI_API_KEY}`
      },
      body: JSON.stringify(taskData)
    });

    // Log da resposta
    const responseStatus = response.status;
    const responseText = await response.text();
    console.log(`[piapi-midjourney-create-task] Status da resposta: ${responseStatus}`);
    console.log(`[piapi-midjourney-create-task] Corpo da resposta:`, responseText);

    // Verificar se a resposta foi bem-sucedida
    if (!response.ok) {
      console.error(`[piapi-midjourney-create-task] Erro na resposta da API:`, responseText);
      return new Response(
        JSON.stringify({ 
          error: `Error from PiAPI: ${responseStatus}`,
          details: responseText
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: responseStatus 
        }
      );
    }

    // Analisar a resposta
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (error) {
      console.error(`[piapi-midjourney-create-task] Erro ao analisar resposta JSON:`, error);
      throw new Error("Failed to parse API response");
    }

    const taskId = responseData.task_id;
    if (!taskId) {
      console.error("[piapi-midjourney-create-task] Resposta sem task_id:", responseData);
      throw new Error("No task_id in API response");
    }

    console.log(`[piapi-midjourney-create-task] Tarefa criada com ID: ${taskId}`);

    // Salvar informações da tarefa no banco de dados
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    const { error: insertError } = await supabaseClient
      .from("piapi_tasks")
      .insert({
        task_id: taskId,
        model: "midjourney/v6",
        prompt,
        status: "pending",
        media_type: "image",
        params: params
      });

    if (insertError) {
      console.error(`[piapi-midjourney-create-task] Erro ao inserir registro da tarefa:`, insertError);
    }

    // Retornar ID da tarefa e status
    return new Response(
      JSON.stringify({
        taskId: taskId,
        status: "pending",
        message: "Midjourney image generation task created"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    // Tratamento central de erros
    console.error("[piapi-midjourney-create-task] Erro:", error);
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
