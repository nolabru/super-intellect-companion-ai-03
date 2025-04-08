
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Configuração de CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// API Keys dos provedores
const API_KEYS = {
  openai: Deno.env.get("OPENAI_API_KEY") || "",
  anthropic: Deno.env.get("ANTHROPIC_API_KEY") || "",
  google: Deno.env.get("GOOGLE_API_KEY") || "",
  kligin: Deno.env.get("KLIGIN_API_KEY") || "",
  ideogram: Deno.env.get("IDEOGRAM_API_KEY") || "",
  minimax: Deno.env.get("MINIMAX_API_KEY") || "",
  elevenlabs: Deno.env.get("ELEVENLABS_API_KEY") || "",
};

// Chamada para o OpenAI (GPT-4o, GPT-4o Vision, Whisper)
async function callOpenAI(prompt: string, model: string, mode: string, files?: string[]) {
  console.log(`Chamando OpenAI com modelo ${model}, modo ${mode}`);
  
  let endpoint = "https://api.openai.com/v1/";
  let requestBody: any = {};
  
  if (mode === 'text') {
    endpoint += "chat/completions";
    requestBody = {
      model: model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    };
  } else if (mode === 'image' || mode === 'video') {
    endpoint += "chat/completions";
    
    // Construir o conteúdo com anexos
    const content: any[] = [{ type: "text", text: prompt }];
    
    if (files && files.length > 0) {
      for (const file of files) {
        content.push({
          type: mode === 'image' ? "image_url" : "video_url",
          [mode === 'image' ? "image_url" : "video_url"]: { url: file }
        });
      }
    }
    
    requestBody = {
      model: model,
      messages: [{ role: "user", content: content }],
      temperature: 0.7,
    };
  } else if (mode === 'audio') {
    endpoint += "audio/transcriptions";
    
    // Para transcrição de áudio, usando Whisper
    const formData = new FormData();
    formData.append("model", model);
    formData.append("file", await fetch(files![0]).then(r => r.blob()), "audio.mp3");
    
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEYS.openai}`
      },
      body: formData
    });
    
    const data = await response.json();
    return {
      content: data.text,
      model: model,
      provider: "openai"
    };
  }
  
  if (mode !== 'audio') {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEYS.openai}`
      },
      body: JSON.stringify(requestBody)
    });
    
    const data = await response.json();
    return {
      content: data.choices?.[0]?.message?.content || "Erro ao processar resposta",
      model: model,
      provider: "openai"
    };
  }
}

// Chamada para o Anthropic (Claude)
async function callAnthropic(prompt: string, model: string, mode: string, files?: string[]) {
  console.log(`Chamando Anthropic com modelo ${model}, modo ${mode}`);
  
  let messages: any[] = [{ role: "user", content: [{ type: "text", text: prompt }] }];
  
  // Adicionar anexos se houver
  if (files && files.length > 0 && (mode === 'image' || mode === 'video')) {
    for (const file of files) {
      messages[0].content.push({
        type: mode === 'image' ? "image" : "video",
        source: {
          type: "base64",
          media_type: mode === 'image' ? "image/jpeg" : "video/mp4",
          data: await fetch(file)
            .then(response => response.arrayBuffer())
            .then(buffer => btoa(
              Array.from(new Uint8Array(buffer))
                .map(byte => String.fromCharCode(byte))
                .join("")
            ))
        }
      });
    }
  }
  
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEYS.anthropic,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      max_tokens: 1024
    })
  });
  
  const data = await response.json();
  return {
    content: data.content?.[0]?.text || "Erro ao processar resposta",
    model: model,
    provider: "anthropic"
  };
}

// Chamada para o Google (Gemini)
async function callGoogle(prompt: string, model: string, mode: string, files?: string[]) {
  console.log(`Chamando Google com modelo ${model}, modo ${mode}`);
  
  let endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro";
  let requestBody: any = {};
  
  if (mode === 'text') {
    endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
    requestBody = {
      contents: [{ parts: [{ text: prompt }] }]
    };
  } else if (mode === 'image') {
    endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent";
    
    const parts: any[] = [{ text: prompt }];
    
    if (files && files.length > 0) {
      for (const file of files) {
        const imageData = await fetch(file)
          .then(response => response.arrayBuffer())
          .then(buffer => btoa(
            Array.from(new Uint8Array(buffer))
              .map(byte => String.fromCharCode(byte))
              .join("")
          ));
        
        parts.push({
          inline_data: {
            mime_type: "image/jpeg",
            data: imageData
          }
        });
      }
    }
    
    requestBody = {
      contents: [{ parts: parts }]
    };
  }
  
  const response = await fetch(`${endpoint}?key=${API_KEYS.google}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
  });
  
  const data = await response.json();
  return {
    content: data.candidates?.[0]?.content?.parts?.[0]?.text || "Erro ao processar resposta",
    model: model,
    provider: "google"
  };
}

// Chamada para o Kligin AI (imagem e vídeo)
async function callKligin(prompt: string, model: string, mode: string) {
  console.log(`Chamando Kligin com modelo ${model}, modo ${mode}`);
  
  let endpoint = mode === 'image' 
    ? "https://api.kligin.ai/v1/image/generations" 
    : "https://api.kligin.ai/v1/video/generations";
  
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEYS.kligin}`
    },
    body: JSON.stringify({
      prompt: prompt,
      n: 1,
      size: mode === 'image' ? "1024x1024" : "720x1280", // tamanho padrão
      response_format: "url"
    })
  });
  
  const data = await response.json();
  
  // Para geração de imagens/vídeos, retornamos o URL do arquivo gerado
  const mediaUrl = data.data?.[0]?.url || "";
  
  return {
    content: `[${mode === 'image' ? 'Imagem' : 'Vídeo'} gerado]: ${mediaUrl}`,
    mediaUrl: mediaUrl,
    model: model,
    provider: "kligin"
  };
}

// Chamada para o Ideogram (imagens)
async function callIdeogram(prompt: string, model: string) {
  console.log(`Chamando Ideogram com modelo ${model}`);
  
  const response = await fetch("https://api.ideogram.ai/api/v1/images", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEYS.ideogram}`
    },
    body: JSON.stringify({
      prompt: prompt,
      style: "photographic",
      aspect_ratio: "1:1"
    })
  });
  
  const data = await response.json();
  
  // Ideogram retorna informações da imagem gerada
  const imageUrl = data.images?.[0]?.url || "";
  
  return {
    content: `[Imagem gerada]: ${imageUrl}`,
    mediaUrl: imageUrl,
    model: model,
    provider: "ideogram"
  };
}

// Chamada para o Minimax (vídeo)
async function callMinimax(prompt: string, model: string) {
  console.log(`Chamando Minimax com modelo ${model}`);
  
  const response = await fetch("https://api.minimax.ai/v1/video/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEYS.minimax}`
    },
    body: JSON.stringify({
      prompt: prompt,
      duration: 10, // duração em segundos
      resolution: "720p"
    })
  });
  
  const data = await response.json();
  
  // Minimax retorna informações do vídeo gerado
  const videoUrl = data.result?.video_url || "";
  
  return {
    content: `[Vídeo gerado]: ${videoUrl}`,
    mediaUrl: videoUrl,
    model: model,
    provider: "minimax"
  };
}

// Chamada para o ElevenLabs (áudio)
async function callElevenLabs(text: string, model: string) {
  console.log(`Chamando ElevenLabs com modelo ${model}`);
  
  const voice_id = "pFZP5JQG7iQjIQuC4Bku"; // Lily voice (default)
  
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": API_KEYS.elevenlabs
    },
    body: JSON.stringify({
      text: text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75
      }
    })
  });
  
  // ElevenLabs retorna o áudio como blob
  const audioBlob = await response.blob();
  
  // Precisamos converter para base64 para enviar pelo json
  const audioBase64 = await new Promise(resolve => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(audioBlob);
  });
  
  return {
    content: `[Áudio gerado]`,
    audioData: audioBase64,
    model: model,
    provider: "elevenlabs"
  };
}

serve(async (req) => {
  // Tratar requisições OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Obter parâmetros da requisição
    const { prompt, model, mode, conversationId, files } = await req.json();
    
    if (!prompt || !model || !mode) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros obrigatórios ausentes' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Determinar qual API chamar com base no modelo e mode
    let response;
    if (model.startsWith('gpt-') || model === 'whisper-large-v3' || model === 'deepgram-nova-2') {
      response = await callOpenAI(prompt, model, mode, files);
    } else if (model.includes('claude')) {
      response = await callAnthropic(prompt, model, mode, files);
    } else if (model.includes('gemini') || model === 'llama-3') {
      response = await callGoogle(prompt, model, mode, files);
    } else if (model.includes('kligin')) {
      response = await callKligin(prompt, model, mode);
    } else if (model === 'ideogram') {
      response = await callIdeogram(prompt, model);
    } else if (model === 'minimax-video') {
      response = await callMinimax(prompt, model);
    } else if (model === 'eleven-labs') {
      response = await callElevenLabs(prompt, model);
    } else {
      return new Response(
        JSON.stringify({ error: 'Modelo não suportado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Se um conversationId foi fornecido, salvar a mensagem no Supabase
    if (conversationId) {
      // Criar cliente Supabase
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Salvar a mensagem do usuário e a resposta do modelo
      try {
        // Primeiro, salvar a mensagem do usuário
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          content: prompt,
          sender: 'user',
          model: 'user',
          mode: mode,
          media_url: files && files.length > 0 ? files[0] : null
        });

        // Depois, salvar a resposta do modelo
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          content: response.content,
          sender: 'ai',
          model: model,
          mode: mode,
          media_url: response.mediaUrl || null,
          audio_data: response.audioData || null
        });
      } catch (error) {
        console.error('Erro ao salvar mensagens:', error);
      }
    }

    // Retornar a resposta
    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro no servidor:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
