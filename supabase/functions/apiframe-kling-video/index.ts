
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
    const APIFRAME_API_KEY = Deno.env.get("APIFRAME_API_KEY");
    if (!APIFRAME_API_KEY) {
      throw new Error("APIFRAME_API_KEY não configurada");
    }

    // Obter parâmetros da requisição
    const { prompt, imageUrl, endImageUrl, generationType = "text2video", params = {} } = await req.json();
    
    // Validar parâmetros obrigatórios
    if (!prompt && generationType === "text2video") {
      return new Response(
        JSON.stringify({ error: "É necessário fornecer prompt para text2video" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    
    if (generationType === "image2video" && !imageUrl) {
      return new Response(
        JSON.stringify({ error: "É necessário fornecer image_url para image2video" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Configurar webhook
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const webhookEndpoint = `${supabaseUrl}/functions/v1/apiframe-webhook`;
    
    // Convert numeric duration to string format required by the API (e.g., "5s")
    const durationValue = params.duration || 5;
    const durationString = `${durationValue}s`;
    
    console.log(`Parsed duration: ${durationValue} seconds, converted to API format: ${durationString}`);
    
    // Preparar payload para a API
    const payload = {
      prompt,
      generation_type: generationType,
      model: params.model || "kling-v1-5",
      duration: durationString, // Use string format for API: "5s", "10s"
      aspect_ratio: params.aspectRatio || "16:9",
      cfg_scale: params.cfgScale !== undefined ? params.cfgScale : 0.7,
      webhook_url: webhookEndpoint,
      webhook_secret: "kling-webhook-secret"
    };
    
    // Adicionar parâmetros opcionais se fornecidos
    if (imageUrl) {
      payload.image_url = imageUrl;
    }
    
    if (endImageUrl) {
      payload.end_image_url = endImageUrl;
    }
    
    if (params.negativePrompt) {
      payload.negative_prompt = params.negativePrompt;
    }

    // Log complete payload for debugging
    console.log("Enviando requisição para Kling AI:", JSON.stringify(payload, null, 2));
    console.log("Payload enviado para Kling AI:", JSON.stringify(payload, null, 2));

    // Enviar requisição para a API
    const apiResponse = await fetch("https://api.apiframe.pro/kling-imagine", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": APIFRAME_API_KEY
      },
      body: JSON.stringify(payload)
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error(`Erro da API Kling: ${apiResponse.status} - ${errorText}`);
      throw new Error(`Erro da API Kling: ${apiResponse.statusText}`);
    }

    // Processar resposta
    const responseData = await apiResponse.json();
    console.log("Resposta da API Kling:", responseData);
    
    // Inicializar cliente Supabase para armazenamento da tarefa
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Salvar informações da tarefa no banco
    const taskId = responseData.task_id;
    if (taskId) {
      try {
        const { error: insertError } = await supabase
          .from("apiframe_tasks")
          .insert({
            task_id: taskId,
            media_type: "video",
            status: "processing",
            prompt,
            params: {
              ...params,
              generationType,
              imageUrl: imageUrl || null,
              durationString // Save both representations for debugging
            },
            model: params.model || "kling-v1-5"
          });

        if (insertError) {
          console.error(`Erro ao inserir registro da tarefa: ${insertError.message}`);
        } else {
          console.log(`Tarefa ${taskId} registrada no banco de dados com sucesso`);
        }
      } catch (dbError) {
        console.error(`Erro no banco de dados: ${dbError.message}`);
        // Continue even if DB insert fails - the API task is already created
      }
    }

    // Retornar resposta
    return new Response(
      JSON.stringify({
        success: true,
        taskId: responseData.task_id,
        status: responseData.status || "processing",
        percentage: responseData.percentage || 0
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
