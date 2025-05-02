
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
    const { prompt, model = "flux-schnell", params = {} } = await req.json();
    
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Mapear o modelo para o modelo correspondente da PiAPI
    let piapiModel;
    let taskType = "txt2img";
    
    switch (model) {
      case "flux-schnell":
        piapiModel = "Qubico/flux1-schnell";
        break;
      case "flux-dev":
        piapiModel = "Qubico/flux1-dev";
        break;
      case "dalle-3":
        piapiModel = "dall-e-3";
        break;
      case "sdxl":
        piapiModel = "stable-diffusion-xl";
        break;
      default:
        piapiModel = "Qubico/flux1-schnell"; // Padrão
    }

    console.log(`Gerando imagem com modelo ${piapiModel} e prompt: "${prompt.substring(0, 50)}..."`);

    // Configurar webhook
    const webhookEndpoint = `${Deno.env.get("SUPABASE_URL")}/functions/v1/piapi-media-webhook`;
    
    // Preparar dados da tarefa
    const taskData = {
      "model": piapiModel,
      "task_type": taskType,
      "input": {
        "prompt": prompt,
        "negative_prompt": params.negativePrompt || "",
        "guidance_scale": params.guidanceScale || 7.5,
        "width": params.width || 768,
        "height": params.height || 768
      },
      "config": {
        "webhook_config": {
          "endpoint": webhookEndpoint
        }
      }
    };

    // Criar tarefa na PiAPI
    const apiResponse = await fetch("https://api.piapi.ai/api/v1/task", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PIAPI_API_KEY}`
      },
      body: JSON.stringify(taskData)
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      console.error(`Erro ao criar tarefa na PiAPI: ${JSON.stringify(errorData)}`);
      throw new Error(`Erro da PiAPI: ${errorData.error?.message || apiResponse.statusText}`);
    }

    // Processar resposta
    const responseData = await apiResponse.json();
    const taskId = responseData.task_id;
    
    console.log(`Tarefa criada com sucesso. ID: ${taskId}`);

    // Salvar informações da tarefa no banco
    const { error: insertError } = await supabase
      .from("piapi_tasks")
      .insert({
        task_id: taskId,
        model: piapiModel,
        prompt,
        status: "pending",
        media_type: "image",
        params: params
      });

    if (insertError) {
      console.error(`Erro ao inserir registro da tarefa: ${insertError.message}`);
    }

    // Retornar resposta com ID da tarefa
    return new Response(
      JSON.stringify({
        taskId: taskId,
        status: "pending",
        message: `Tarefa de geração de imagem criada com sucesso. Aguarde processamento.`
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error(`Erro: ${error.message}`);
    
    // Implementar retries aqui se necessário
    
    return new Response(
      JSON.stringify({ 
        error: "Falha na geração de imagem", 
        message: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
