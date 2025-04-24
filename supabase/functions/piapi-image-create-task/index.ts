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
    console.log("[piapi-image-create-task] Handling OPTIONS request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PIAPI_API_KEY = Deno.env.get("PIAPI_API_KEY") || "";
    if (!PIAPI_API_KEY) {
      console.error("[piapi-image-create-task] PIAPI_API_KEY não configurada");
      throw new Error("PIAPI_API_KEY not configured");
    }

    // Log request details
    console.log(`[piapi-image-create-task] Received ${req.method} request`);
    console.log(`Headers:`, Object.fromEntries(req.headers.entries()));

    // Extract and validate request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log("[piapi-image-create-task] Request body:", JSON.stringify(requestBody));
    } catch (parseError) {
      console.error("[piapi-image-create-task] Error parsing request body:", parseError);
      return new Response(
        JSON.stringify({ 
          error: "Invalid request body - JSON parsing failed",
          details: parseError.message 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 400 
        }
      );
    }

    const { prompt, model = "flux-schnell", params = {} } = requestBody;
    
    // Validate required fields
    if (!prompt || typeof prompt !== 'string') {
      console.error("[piapi-image-create-task] Missing or invalid prompt:", prompt);
      return new Response(
        JSON.stringify({ 
          error: "Prompt is required and must be a string",
          received: { prompt }
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 400 
        }
      );
    }

    // Configurar webhook para notificações
    const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/piapi-media-webhook`;
    console.log(`[piapi-image-create-task] Using webhook URL: ${webhookUrl}`);

    // Tratar modelos DALL-E 3 e SDXL com chamada de API direta
    if (model === "dall-e-3" || model === "sdxl") {
      console.log(`[piapi-image-create-task] Processando requisição direta para ${model}`);
      
      try {
        // Construir corpo da requisição específico para cada modelo
        const requestBody: Record<string, any> = {
          model: model === "dall-e-3" ? "dall-e-3" : "stable-diffusion-xl",
          prompt: prompt,
          size: params.size || "1024x1024",
          n: 1,
        };

        // Adicionar parâmetros opcionais se fornecidos
        if (params.negativePrompt) requestBody.negative_prompt = params.negativePrompt;
        if (params.style) requestBody.style = params.style || "vivid";
        if (params.quality) requestBody.quality = params.quality || "standard";

        console.log(`[piapi-image-create-task] Corpo da requisição: ${JSON.stringify(requestBody)}`);
        console.log(`[piapi-image-create-task] URL da API: ${PIAPI_API_BASE_URL}/images/generate`);
        console.log(`[piapi-image-create-task] Tipo de modelo: ${model}`);

        const dalleResponse = await fetch(`${PIAPI_API_BASE_URL}/images/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${PIAPI_API_KEY}`
          },
          body: JSON.stringify(requestBody)
        });

        console.log(`[piapi-image-create-task] Status da resposta da API: ${dalleResponse.status}`);

        // Ler o corpo da resposta como texto para log e análise
        const responseText = await dalleResponse.text();
        console.log(`[piapi-image-create-task] Resposta bruta da API: ${responseText.substring(0, 200)}...`);

        // Verificar se a resposta foi bem-sucedida
        if (!dalleResponse.ok) {
          let errorMessage;
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.error?.message || `Error from ${model}: ${dalleResponse.statusText}`;
            console.error(`[piapi-image-create-task] Erro analisado da API:`, errorMessage);
          } catch (e) {
            errorMessage = `Error from ${model}: ${dalleResponse.statusText}`;
            console.error(`[piapi-image-create-task] Falha ao analisar resposta de erro:`, e);
          }
          throw new Error(errorMessage);
        }

        // Analisar a resposta JSON
        let dalleData;
        try {
          dalleData = JSON.parse(responseText);
        } catch (e) {
          console.error(`[piapi-image-create-task] Falha ao analisar resposta JSON:`, e);
          throw new Error(`Failed to parse API response from ${model}`);
        }

        // Validar a presença da URL na resposta
        console.log(`[piapi-image-create-task] Resposta analisada com sucesso:`, {
          hasData: !!dalleData.data,
          hasUrl: dalleData.data?.url ? 'yes' : 'no',
          dataPreview: JSON.stringify(dalleData).substring(0, 100)
        });

        if (!dalleData.data?.url) {
          console.error(`[piapi-image-create-task] Sem URL na resposta:`, dalleData);
          throw new Error(`No image URL received from ${model}`);
        }

        // Armazenar informações no Supabase
        const supabaseClient = createClient(
          Deno.env.get("SUPABASE_URL") || "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
        );

        // Gerar ID único para a tarefa
        const generatedId = crypto.randomUUID();
        
        // Inserir registro na tabela de tarefas
        const { error: insertError } = await supabaseClient
          .from("piapi_tasks")
          .insert({
            task_id: generatedId,
            model: model,
            prompt,
            status: "completed",
            media_type: "image",
            media_url: dalleData.data.url,
            params: params
          });

        if (insertError) {
          console.error(`[piapi-image-create-task] Erro ao inserir registro da tarefa:`, insertError);
        } else {
          // Inserir evento de mídia pronta para notificação
          const { error: eventError } = await supabaseClient
            .from("media_ready_events")
            .insert({
              task_id: generatedId,
              media_type: "image",
              media_url: dalleData.data.url,
              prompt,
              model: model
            });
            
          if (eventError) {
            console.error(`[piapi-image-create-task] Erro ao inserir evento de mídia pronta:`, eventError);
          }
        }

        // Retornar resposta de sucesso
        return new Response(
          JSON.stringify({
            task_id: generatedId,
            status: "completed",
            media_url: dalleData.data.url,
            message: `Image generated with model ${model}`
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (error) {
        console.error(`[piapi-image-create-task] Erro ao processar requisição ${model}:`, error);
        throw error;
      }
    }

    // Para modelos Flux, usar a API baseada em tarefas
    console.log(`[piapi-image-create-task] Processando requisição para modelo ${model} com API baseada em tarefas`);
    
    // Traduzir nomes de modelos para os nomes internos reconhecidos pela API
    let modelName = "";

    switch (model) {
      case "flux-dev":
        modelName = "Qubico/flux1-dev";
        break;
      case "flux-schnell":
        modelName = "Qubico/flux1-schnell";
        break;
      case "midjourney":
        modelName = "midjourney/v6";
        break;
      default:
        console.error(`[piapi-image-create-task] Modelo não suportado: ${model}`);
        return new Response(
          JSON.stringify({ error: "Unsupported model" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
    }

    // Construir dados da tarefa para a API
    const taskData = {
      "model": modelName,
      "task_type": "txt2img",
      "input": {
        "prompt": prompt,
        "negative_prompt": params.negativePrompt || "",
        "guidance_scale": params.guidanceScale || 7.5,
        "width": params.width || 768,
        "height": params.height || 768
      },
      "config": {
        "webhook_config": {
          "endpoint": webhookUrl
        }
      }
    };

    console.log(`[piapi-image-create-task] Criando tarefa com modelo ${modelName}`);
    console.log(`[piapi-image-create-task] Dados da tarefa: ${JSON.stringify(taskData)}`);
    console.log(`[piapi-image-create-task] URL da API: ${PIAPI_API_BASE_URL}/task`);
    
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
      console.error("[piapi-image-create-task] Resposta de erro da PiAPI:", responseText);
      
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
    console.log("[piapi-image-create-task] Tarefa criada com sucesso:", data);

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
        media_type: "image",
        params: params
      });

    if (insertError) {
      console.error(`[piapi-image-create-task] Erro ao inserir registro da tarefa:`, insertError);
    }

    // Retornar resultado da criação da tarefa
    return new Response(
      JSON.stringify({
        task_id: data.task_id,
        status: "pending",
        message: `Image generation task created with model ${modelName}`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    // Tratamento central de erros
    console.error("[piapi-image-create-task] Erro:", error);
    console.error("Stack trace:", error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Internal server error",
        details: "Check the edge function logs for more information",
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: error.status || 500 
      }
    );
  }
});
