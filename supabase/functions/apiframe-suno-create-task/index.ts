
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const API_FRAME_KEY = Deno.env.get("APIFRAME_API_KEY");
const API_ENDPOINT = "https://api.apiframe.pro/suno-imagine";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar se a chave API está configurada
    if (!API_FRAME_KEY) {
      console.error("[apiframe-suno] API Frame key não configurada");
      throw new Error("API Frame key não configurada");
    }

    // Obter dados da requisição
    const requestData = await req.json();
    const {
      prompt,
      lyrics,
      model = "chirp-v4",
      make_instrumental = false,
      title,
      tags,
      webhook_url,
      webhook_secret,
    } = requestData;

    // Verificar se tem prompt ou lyrics
    if (!prompt && !lyrics) {
      throw new Error("É necessário fornecer um prompt ou letras para gerar a música");
    }

    console.log(`[apiframe-suno] Iniciando geração de música com modelo ${model}`);
    
    // Montar o payload para o APIFRAME
    const payload = {
      prompt,
      lyrics,
      model,
      make_instrumental,
      title,
      tags,
      webhook_url,
      webhook_secret
    };

    // Filtrar campos vazios ou undefined
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined || payload[key] === null || payload[key] === '') {
        delete payload[key];
      }
    });

    console.log("[apiframe-suno] Enviando requisição para API Frame");
    
    // Fazer a requisição para o APIFRAME
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": API_FRAME_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[apiframe-suno] Erro na API (${response.status}): ${errorText}`);
      throw new Error(`Erro na API do SUNO: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`[apiframe-suno] Resposta recebida: ${JSON.stringify(data).substring(0, 100)}...`);

    return new Response(JSON.stringify({
      success: true,
      taskId: data.task_id,
      status: data.status,
      songs: data.songs || []
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error(`[apiframe-suno] Erro: ${error.message}`);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});
