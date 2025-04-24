
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
    const headers = Object.fromEntries(req.headers.entries());
    console.log(`[piapi-image-create-task] Headers:`, JSON.stringify(headers));

    // Extrair e validar corpo da requisição
    let requestBody;
    try {
      const requestText = await req.text();
      console.log(`[piapi-image-create-task] Raw request body: ${requestText}`);
      
      if (!requestText || requestText.trim().length === 0) {
        console.error("[piapi-image-create-task] Empty request body");
        return new Response(
          JSON.stringify({ 
            error: "Empty request body",
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" }, 
            status: 400 
          }
        );
      }
      
      // Tenta analisar como JSON
      requestBody = JSON.parse(requestText);
      console.log("[piapi-image-create-task] Parsed request body:", JSON.stringify(requestBody));
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

    // Verificar e extrair parâmetros necessários
    const prompt = requestBody.prompt;
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      console.error("[piapi-image-create-task] Missing or invalid prompt:", prompt);
      return new Response(
        JSON.stringify({ 
          error: "Prompt is required and must be a non-empty string",
          received: requestBody 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 400 
        }
      );
    }

    const model = requestBody.model || "flux-schnell";
    const params = requestBody.params || {};
    
    console.log("[piapi-image-create-task] Extracted parameters:", {
      prompt,
      model,
      paramsKeys: Object.keys(params)
    });

    // Configurar webhook para notificações
    const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/piapi-media-webhook`;
    console.log(`[piapi-image-create-task] Using webhook URL: ${webhookUrl}`);

    // Tratar modelos DALL-E 3 e SDXL com chamada de API direta
    if (model === "dall-e-3" || model === "sdxl") {
      console.log(`[piapi-image-create-task] Processando requisição direta para ${model}`);
      
      try {
        // Construir corpo da requisição específico para cada modelo
        const apiRequestBody: Record<string, any> = {
          model: model === "dall-e-3" ? "dall-e-3" : "stable-diffusion-xl",
          prompt: prompt,
          size: params.size || "1024x1024",
          n: 1,
        };

        // Adicionar parâmetros opcionais se fornecidos
        if (params.negativePrompt) apiRequestBody.negative_prompt = params.negativePrompt;
        if (params.style) apiRequestBody.style = params.style || "vivid";
        if (params.quality) apiRequestBody.quality = params.quality || "standard";

        console.log(`[piapi-image-create-task] Corpo da requisição para API: ${JSON.stringify(apiRequestBody)}`);
        console.log(`[piapi-image-create-task] URL da API: ${PIAPI_API_BASE_URL}/images/generate`);
        
        const dalleResponse = await fetch(`${PIAPI_API_BASE_URL}/images/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${PIAPI_API_KEY}`
          },
          body: JSON.stringify(apiRequestBody)
        });

        console.log(`[piapi-image-create-task] Status da resposta da API: ${dalleResponse.status}`);
        
        // Ler o corpo da resposta como texto para log e análise
        const responseText = await dalleResponse.text();
        console.log(`[piapi-image-create-task] Resposta da API: ${responseText.substring(0, 500)}...`);

        if (!dalleResponse.ok) {
          let errorMessage;
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.error?.message || `Error from API: ${dalleResponse.statusText}`;
          } catch (e) {
            errorMessage = `Error from API: ${dalleResponse.statusText}`;
          }
          
          console.error(`[piapi-image-create-task] API error: ${errorMessage}`);
          
          return new Response(
            JSON.stringify({ 
              error: errorMessage,
              status: "failed",
              model: model
            }),
            { 
              headers: { ...corsHeaders, "Content-Type": "application/json" }, 
              status: dalleResponse.status 
            }
          );
        }

        // Analisar a resposta JSON
        let dalleData;
        try {
          dalleData = JSON.parse(responseText);
          console.log(`[piapi-image-create-task] Resposta JSON parsed:`, 
            JSON.stringify(dalleData).substring(0, 200));
        } catch (e) {
          console.error(`[piapi-image-create-task] JSON parse error:`, e);
          throw new Error(`Failed to parse API response from ${model}`);
        }

        if (!dalleData.data?.url) {
          console.error(`[piapi-image-create-task] No URL in response:`, 
            JSON.stringify(dalleData).substring(0, 200));
          throw new Error(`No image URL received from ${model}`);
        }

        // Gerar ID único para a tarefa
        const generatedId = crypto.randomUUID();
        console.log(`[piapi-image-create-task] Generated task ID: ${generatedId}`);
        
        // Armazenar resposta no Supabase
        const supabaseClient = createClient(
          Deno.env.get("SUPABASE_URL") || "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
        );
        
        try {
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
            console.error(`[piapi-image-create-task] Database insert error:`, insertError);
          } else {
            console.log(`[piapi-image-create-task] Task record inserted successfully`);
            
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
              console.error(`[piapi-image-create-task] Event insert error:`, eventError);
            } else {
              console.log(`[piapi-image-create-task] Media ready event inserted successfully`);
            }
          }
        } catch (dbError) {
          console.error(`[piapi-image-create-task] Database operation error:`, dbError);
        }

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
        console.error(`[piapi-image-create-task] Error processing request:`, error);
        return new Response(
          JSON.stringify({ 
            error: error.message || "Unknown error",
            status: "failed" 
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" }, 
            status: 500 
          }
        );
      }
    }

    // Para modelos Flux e Midjourney, usar o endpoint de tarefas
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
          JSON.stringify({ 
            error: "Unsupported model", 
            model: model,
            supportedModels: ["flux-dev", "flux-schnell", "midjourney", "dall-e-3", "sdxl"] 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
    }

    console.log(`[piapi-image-create-task] Processando requisição para modelo ${modelName}`);
    
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

    console.log(`[piapi-image-create-task] Dados da tarefa: ${JSON.stringify(taskData)}`);
    
    // Enviar requisição para a API
    try {
      const response = await fetch(`${PIAPI_API_BASE_URL}/task`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${PIAPI_API_KEY}`
        },
        body: JSON.stringify(taskData)
      });

      // Ler o corpo da resposta como texto para log e análise
      const responseText = await response.text();
      console.log(`[piapi-image-create-task] Raw API response: ${responseText.substring(0, 500)}...`);

      // Verificar respostas de erro
      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error?.message || `Error from PiAPI: ${response.statusText}`;
        } catch (e) {
          errorMessage = `Error from PiAPI: ${response.statusText}`;
        }
        
        console.error(`[piapi-image-create-task] API error: ${errorMessage}`);
        
        return new Response(
          JSON.stringify({ 
            error: errorMessage,
            status: "failed" 
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" }, 
            status: response.status 
          }
        );
      }

      // Analisar resposta bem-sucedida
      let data;
      try {
        data = JSON.parse(responseText);
        console.log("[piapi-image-create-task] Parsed API response:", JSON.stringify(data));
      } catch (parseError) {
        console.error("[piapi-image-create-task] Error parsing API response:", parseError);
        throw new Error("Failed to parse API response");
      }

      if (!data.task_id) {
        console.error("[piapi-image-create-task] No task_id in response:", JSON.stringify(data));
        throw new Error("No task_id received from API");
      }

      // Armazenar informações da tarefa no Supabase
      try {
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
          console.error(`[piapi-image-create-task] Database insert error:`, insertError);
        } else {
          console.log(`[piapi-image-create-task] Task record inserted successfully`);
        }
      } catch (dbError) {
        console.error(`[piapi-image-create-task] Database operation error:`, dbError);
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
    } catch (apiError) {
      console.error(`[piapi-image-create-task] API request error:`, apiError);
      return new Response(
        JSON.stringify({ 
          error: apiError.message || "API request failed",
          status: "failed" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 500 
        }
      );
    }
  } catch (error) {
    // Tratamento central de erros
    console.error("[piapi-image-create-task] Erro geral:", error);
    console.error("[piapi-image-create-task] Stack trace:", error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Internal server error",
        details: "Check the edge function logs for more information",
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 500 
      }
    );
  }
});
