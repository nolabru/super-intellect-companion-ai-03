
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
    const { prompt, model = "mmaudio-txt2audio", videoUrl, params = {} } = await req.json();
    
    if ((!prompt && !videoUrl) || (model === "mmaudio-video2audio" && !videoUrl)) {
      return new Response(
        JSON.stringify({ error: "Entrada necessária está faltando para o modelo selecionado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Mapear o modelo para o modelo correspondente da PiAPI
    let piapiModel;
    let taskType;
    let inputData = {};
    
    switch (model) {
      case "mmaudio-video2audio":
        piapiModel = "mmaudio/video2audio";
        taskType = "video2audio";
        inputData = {
          "video": videoUrl,
          "prompt": prompt || "Background music"
        };
        break;
      case "mmaudio-txt2audio":
        piapiModel = "mmaudio/txt2audio";
        taskType = "txt2audio";
        inputData = {
          "prompt": prompt,
          "length": params.length || "90s"
        };
        break;
      case "diffrhythm-base":
        piapiModel = "diffRhythm/txt2audio-base";
        taskType = "txt2audio-base";
        inputData = {
          "prompt": prompt,
          "length": params.length || "2m"
        };
        break;
      case "diffrhythm-full":
        piapiModel = "diffRhythm/txt2audio-full";
        taskType = "txt2audio-full";
        inputData = {
          "lyrics": params.lyrics || prompt,
          "style_prompt": params.stylePrompt || "Pop music",
          "length": params.length || "3m"
        };
        break;
      case "elevenlabs":
        piapiModel = "elevenlabs";
        taskType = "tts";
        inputData = {
          "text": prompt,
          "voice": params.voice || "eleven_monolingual_v1",
          "stability": params.stability || 0.5,
          "similarity_boost": params.similarityBoost || 0.75
        };
        break;
      default:
        piapiModel = "mmaudio/txt2audio";
        taskType = "txt2audio";
        inputData = {
          "prompt": prompt,
          "length": params.length || "90s"
        };
    }

    console.log(`Gerando áudio com modelo ${piapiModel}`);

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
        media_type: "audio",
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
        message: `Tarefa de geração de áudio criada com sucesso. Aguarde processamento.`
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error(`Erro: ${error.message}`);
    
    return new Response(
      JSON.stringify({ 
        error: "Falha na geração de áudio", 
        message: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
