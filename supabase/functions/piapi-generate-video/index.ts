
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
    const { prompt, model = "kling-text", imageUrl, params = {} } = await req.json();
    
    if (!prompt && !imageUrl) {
      return new Response(
        JSON.stringify({ error: "É necessário fornecer prompt ou URL de imagem" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Mapear o modelo para o modelo correspondente da PiAPI
    let piapiModel;
    let taskType;
    let inputData = {};
    
    switch (model) {
      case "kling-text":
        piapiModel = "kling/text-to-video";
        taskType = "text-to-video";
        inputData = {
          "prompt": prompt,
          "duration": params.duration || 10,
          "aspect_ratio": params.aspectRatio || "16:9"
        };
        break;
      case "kling-image":
        if (!imageUrl) {
          throw new Error("URL de imagem é obrigatória para este modelo");
        }
        piapiModel = "kling/image-to-video";
        taskType = "image-to-video";
        inputData = {
          "image_url": imageUrl,
          "duration": params.duration || 8
        };
        break;
      case "hunyuan-fast":
        piapiModel = "hunyuan/txt2video-fast";
        taskType = "txt2video-standard";
        inputData = {
          "prompt": prompt,
          "duration": params.duration || 8
        };
        break;
      case "hunyuan-standard":
        piapiModel = "hunyuan/txt2video-standard";
        taskType = "txt2video-standard";
        inputData = {
          "prompt": prompt,
          "duration": params.duration || 8
        };
        break;
      case "hailuo-text":
        piapiModel = "hailuo/t2v-01";
        taskType = "video_generation";
        inputData = {
          "prompt": prompt,
          "duration": params.duration || 6
        };
        break;
      case "hailuo-image":
        if (!imageUrl) {
          throw new Error("URL de imagem é obrigatória para este modelo");
        }
        piapiModel = "hailuo/i2v-01";
        taskType = "video_generation";
        inputData = {
          "prompt": prompt,
          "image_url": imageUrl,
          "duration": params.duration || 6
        };
        break;
      default:
        piapiModel = "kling/text-to-video";
        taskType = "text-to-video";
        inputData = {
          "prompt": prompt,
          "duration": params.duration || 10,
          "aspect_ratio": params.aspectRatio || "16:9"
        };
    }

    console.log(`Gerando vídeo com modelo ${piapiModel}`);

    // Configurar webhook
    const webhookEndpoint = `${Deno.env.get("SUPABASE_URL")}/functions/v1/piapi-media-webhook`;
    
    // Preparar dados da tarefa
    const taskData = {
      "model": piapiModel,
      "task_type": taskType,
      "input": inputData,
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
        media_type: "video",
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
        message: `Tarefa de geração de vídeo criada com sucesso. Aguarde processamento.`
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error(`Erro: ${error.message}`);
    
    return new Response(
      JSON.stringify({ 
        error: "Falha na geração de vídeo", 
        message: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
