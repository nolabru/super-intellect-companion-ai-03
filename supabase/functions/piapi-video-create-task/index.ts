
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
      console.error("[piapi-video-create-task] PIAPI_API_KEY não configurada");
      throw new Error("PIAPI_API_KEY not configured");
    }

    // Extrair parâmetros da requisição
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error("[piapi-video-create-task] Erro ao analisar corpo da requisição:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid request body - JSON parsing failed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { prompt, model, imageUrl, params = {} } = requestBody;
    
    // Validar requisição com base no modelo
    if (model.includes('image') && !imageUrl) {
      console.error("[piapi-video-create-task] Modelo baseado em imagem requer imageUrl");
      return new Response(
        JSON.stringify({ error: "Image URL is required for image-based video generation models" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    if (!model.includes('image') && (!prompt || prompt.trim().length === 0)) {
      console.error("[piapi-video-create-task] Prompt é obrigatório para modelos baseados em texto");
      return new Response(
        JSON.stringify({ error: "Prompt is required for text-based video generation models" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`[piapi-video-create-task] Processando requisição para ${model}:`, {
      prompt: prompt ? prompt.substring(0, 50) + '...' : 'N/A',
      hasImageUrl: !!imageUrl,
      params: JSON.stringify(params).substring(0, 100)
    });

    // Obter URL do webhook para notificações
    const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/piapi-media-webhook`;
    
    // Mapear modelos para os nomes internos reconhecidos pela API
    let modelName, taskType;
    
    switch (model) {
      case "kling-text":
        modelName = "kling/textOnly";
        taskType = "txt2video";
        break;
      case "kling-image":
        modelName = "kling/imageOnly";
        taskType = "img2video";
        break;
      case "hunyuan-standard":
        modelName = "hunyuan/standard";
        taskType = "txt2video";
        break;
      case "hunyuan-fast":
        modelName = "hunyuan/fast";
        taskType = "txt2video";
        break;
      case "hailuo-text":
        modelName = "hailuo/textOnly";
        taskType = "txt2video";
        break;
      case "hailuo-image":
        modelName = "hailuo/imageOnly";
        taskType = "img2video";
        break;
      default:
        console.error(`[piapi-video-create-task] Modelo não suportado: ${model}`);
        return new Response(
          JSON.stringify({ error: "Unsupported model" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
    }

    // Construir dados da tarefa com base no tipo de modelo
    let taskData: Record<string, any>;
    
    if (taskType === "img2video") {
      // Modelo baseado em imagem para vídeo
      taskData = {
        "model": modelName,
        "task_type": taskType,
        "input": {
          "image": imageUrl,
          "prompt": prompt || "Generate video from this image"
        },
        "config": {
          "webhook_config": {
            "endpoint": webhookUrl
          }
        }
      };
    } else {
      // Modelo baseado em texto para vídeo
      taskData = {
        "model": modelName,
        "task_type": taskType,
        "input": {
          "prompt": prompt
        },
        "config": {
          "webhook_config": {
            "endpoint": webhookUrl
          }
        }
      };
    }

    // Adicionar parâmetros específicos conforme fornecido
    if (params.fps) taskData.input.fps = params.fps;
    if (params.duration) taskData.input.duration = params.duration;
    if (params.resolution) taskData.input.resolution = params.resolution;
    
    console.log(`[piapi-video-create-task] Criando tarefa de vídeo com modelo ${modelName}`);
    console.log(`[piapi-video-create-task] Dados da tarefa: ${JSON.stringify(taskData)}`);
    console.log(`[piapi-video-create-task] URL da API: ${PIAPI_API_BASE_URL}/task`);
    
    // Enviar requisição para a API
    const response = await fetch(`${PIAPI_API_BASE_URL}/task`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PIAPI_API_KEY}`
      },
      body: JSON.stringify(taskData)
    });

    // Verificar respostas de erro
    if (!response.ok) {
      const responseText = await response.text();
      console.error("[piapi-video-create-task] Resposta de erro da PiAPI:", responseText);
      
      let errorMessage;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error?.message || `Error from PiAPI: ${response.statusText}`;
      } catch (e) {
        errorMessage = `Error from PiAPI: ${response.statusText}`;
      }
      
      throw new Error(errorMessage);
    }

    // Analisar resposta bem-sucedida
    const data = await response.json();
    console.log("[piapi-video-create-task] Tarefa de vídeo criada com sucesso:", data);

    // Armazenar informações da tarefa no Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Inserir registro na tabela de tarefas
    const { error: insertError } = await supabaseClient
      .from("piapi_tasks")
      .insert({
        task_id: data.task_id,
        model: modelName,
        prompt,
        status: "pending",
        media_type: "video",
        params: {
          ...params,
          imageUrl: imageUrl || null
        }
      });

    if (insertError) {
      console.error(`[piapi-video-create-task] Erro ao inserir registro da tarefa:`, insertError);
    }

    // Retornar resultado da criação da tarefa
    return new Response(
      JSON.stringify({
        task_id: data.task_id,
        status: "pending",
        message: `Video generation task created with model ${modelName}`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    // Tratamento central de erros
    console.error("[piapi-video-create-task] Erro:", error);
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
