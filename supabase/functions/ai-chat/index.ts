
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Configuração de CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// API Keys dos provedores
const API_KEYS = {
  openai: "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",
  anthropic: "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",
  google: "AIzaSyDkLxRKHXGDvuoVYjVw4Yp6dtcYXCv_ZNk",
  kligin: "f42311adb24f4699a2ab1fe37f6cab31",
  ideogram: "yBYG6LzvTePXFhOVttXVaGlMyIQ0jntxkVeU92rWnMPoMoreJ38-HN_M6OE3wEX5NQdqa-5wg3VtFq7u7QymDA",
  minimax: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJHcm91cE5hbWUiOiJJemFpYXMgUGVydHJlbGx5IiwiVXNlck5hbWUiOiJJemFpYXMgUGVydHJlbGx5IiwiQWNjb3VudCI6IiIsIlN1YmplY3RJRCI6IjE4Nzk1MjUwMzE3MDExMjM2MjUiLCJQaG9uZSI6IiIsIkdyb3VwSUQiOiIxODc5NTI1MDMxNjk2OTI5MzIxIiwiUGFnZU5hbWUiOiIiLCJNYWlsIjoicGVydHJlbGx5QHNhdWRlYmx1ZS5jb20iLCJDcmVhdGVUaW1lIjoiMjAyNS0wNC0wNSAwODozMzoxNCIsIlRva2VuVHlwZSI6MSwiaXNzIjoibWluaW1heCJ9.x1nBetn2kwR1FJ1BQSuqJA-qa1FjeNbtwLIe3L8T8JptrhsBkj6G2gtwke2iGT58VLQ5hbwAoookds53G_MX6w1UQL9ESwrORbryWUrhznIdSjgNQE6SlxZgyGYn42c1WHsh75Xys23nkwL1EKcM2ja2XbhQTU-2wAvuwB0iDvcNrgdFKeBv-tW21MtCUvgSh6Gx6bQ972MrENu_YxZVHmqwVrNWIxm4zPeBClLXHnIPAzEwnJSvbAKcen9e9R9K1AlxjIioN_a-nbBHOWbIPnI3pTPE4rzEw5pz_MVuRWtB9GxxdInErCVRofP-YGzLR16zkOkL2JYEKLITBNZsjw",
  elevenlabs: "sk_2d89d7152d9db6a072828eaca081c4722dc403c5dc2511e6",
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
    
    try {
      console.log(`Enviando para OpenAI audio transcription`);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEYS.openai}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro OpenAI (audio): ${response.status} - ${errorText}`);
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log("Resposta OpenAI audio recebida:", data);
      
      return {
        content: data.text || "Erro ao processar resposta",
        model: model,
        provider: "openai"
      };
    } catch (error) {
      console.error("Erro na transcrição de áudio:", error);
      throw error;
    }
  }
  
  if (mode !== 'audio') {
    console.log(`Enviando para OpenAI (${mode}):`, JSON.stringify(requestBody).substring(0, 200) + "...");
    
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_KEYS.openai}`
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro OpenAI: ${response.status} - ${errorText}`);
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log("Resposta OpenAI recebida:", JSON.stringify(data).substring(0, 200) + "...");
      
      return {
        content: data.choices?.[0]?.message?.content || "Erro ao processar resposta",
        model: model,
        provider: "openai"
      };
    } catch (error) {
      console.error("Erro na chamada à API OpenAI:", error);
      throw error;
    }
  }
}

// Chamada para o Anthropic (Claude)
async function callAnthropic(prompt: string, model: string, mode: string, files?: string[]) {
  console.log(`Chamando Anthropic com modelo ${model}, modo ${mode}`);
  
  let messages: any[] = [{ role: "user", content: [{ type: "text", text: prompt }] }];
  
  // Adicionar anexos se houver
  if (files && files.length > 0 && (mode === 'image' || mode === 'video')) {
    for (const file of files) {
      try {
        const response = await fetch(file);
        const fileBuffer = await response.arrayBuffer();
        
        const base64Data = btoa(
          Array.from(new Uint8Array(fileBuffer))
            .map(byte => String.fromCharCode(byte))
            .join("")
        );
        
        messages[0].content.push({
          type: mode === 'image' ? "image" : "video",
          source: {
            type: "base64",
            media_type: mode === 'image' ? "image/jpeg" : "video/mp4",
            data: base64Data
          }
        });
      } catch (error) {
        console.error(`Erro ao processar arquivo para Anthropic:`, error);
        throw error;
      }
    }
  }
  
  console.log(`Enviando para Anthropic:`, JSON.stringify({ model, messages }).substring(0, 200) + "...");
  
  try {
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
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro Anthropic: ${response.status} - ${errorText}`);
      throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log("Resposta Anthropic recebida:", JSON.stringify(data).substring(0, 200) + "...");
    
    return {
      content: data.content?.[0]?.text || "Erro ao processar resposta",
      model: model,
      provider: "anthropic"
    };
  } catch (error) {
    console.error("Erro na chamada à API Anthropic:", error);
    throw error;
  }
}

// Chamada para o Google (Gemini)
async function callGoogle(prompt: string, model: string, mode: string, files?: string[]) {
  console.log(`Chamando Google com modelo ${model}, modo ${mode}`);
  
  let endpoint = "";
  let requestBody: any = {};
  
  if (mode === 'text') {
    if (model === 'llama-3') {
      // Assumindo que isso é um modelo Gemini
      endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
    } else {
      endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
    }
    
    requestBody = {
      contents: [{ parts: [{ text: prompt }] }]
    };
  } else if (mode === 'image') {
    endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent";
    
    const parts: any[] = [{ text: prompt }];
    
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const response = await fetch(file);
          const imageBuffer = await response.arrayBuffer();
          
          const base64Data = btoa(
            Array.from(new Uint8Array(imageBuffer))
              .map(byte => String.fromCharCode(byte))
              .join("")
          );
          
          parts.push({
            inline_data: {
              mime_type: "image/jpeg",
              data: base64Data
            }
          });
        } catch (error) {
          console.error(`Erro ao processar imagem para Google:`, error);
          throw error;
        }
      }
    }
    
    requestBody = {
      contents: [{ parts: parts }]
    };
  }
  
  console.log(`Enviando para Google:`, JSON.stringify(requestBody).substring(0, 200) + "...");
  
  try {
    const response = await fetch(`${endpoint}?key=${API_KEYS.google}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro Google: ${response.status} - ${errorText}`);
      throw new Error(`Google API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log("Resposta Google recebida:", JSON.stringify(data).substring(0, 200) + "...");
    
    return {
      content: data.candidates?.[0]?.content?.parts?.[0]?.text || "Erro ao processar resposta",
      model: model,
      provider: "google"
    };
  } catch (error) {
    console.error("Erro na chamada à API Google:", error);
    throw error;
  }
}

// Chamada para o Kligin AI (imagem e vídeo)
async function callKligin(prompt: string, model: string, mode: string) {
  console.log(`Chamando Kligin com modelo ${model}, modo ${mode}`);
  
  let endpoint = mode === 'image' 
    ? "https://api.kligin.ai/v1/image/generations" 
    : "https://api.kligin.ai/v1/video/generations";
  
  const requestBody = {
    prompt: prompt,
    n: 1,
    size: mode === 'image' ? "1024x1024" : "720x1280", // tamanho padrão
    response_format: "url"
  };
  
  console.log(`Enviando para Kligin:`, JSON.stringify(requestBody));
  
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEYS.kligin}`
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro Kligin: ${response.status} - ${errorText}`);
      throw new Error(`Kligin API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log("Resposta Kligin recebida:", JSON.stringify(data).substring(0, 200) + "...");
    
    // Para geração de imagens/vídeos, retornamos o URL do arquivo gerado
    const mediaUrl = data.data?.[0]?.url || "";
    
    if (!mediaUrl) {
      throw new Error("Kligin não retornou uma URL de mídia válida");
    }
    
    return {
      content: `[${mode === 'image' ? 'Imagem' : 'Vídeo'} gerado]: ${prompt}`,
      mediaUrl: mediaUrl,
      model: model,
      provider: "kligin"
    };
  } catch (error) {
    console.error("Erro na chamada à API Kligin:", error);
    throw error;
  }
}

// Chamada para o Ideogram (imagens)
async function callIdeogram(prompt: string, model: string) {
  console.log(`Chamando Ideogram com modelo ${model}`);
  
  const requestBody = {
    prompt: prompt,
    style: "photographic",
    aspect_ratio: "1:1"
  };
  
  console.log(`Enviando para Ideogram:`, JSON.stringify(requestBody));
  
  try {
    const response = await fetch("https://api.ideogram.ai/api/v1/images", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEYS.ideogram}`
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro Ideogram: ${response.status} - ${errorText}`);
      throw new Error(`Ideogram API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log("Resposta Ideogram recebida:", JSON.stringify(data).substring(0, 200) + "...");
    
    // Ideogram retorna informações da imagem gerada
    const imageUrl = data.images?.[0]?.url || "";
    
    if (!imageUrl) {
      throw new Error("Ideogram não retornou uma URL de imagem válida");
    }
    
    return {
      content: `[Imagem gerada]: ${prompt}`,
      mediaUrl: imageUrl,
      model: model,
      provider: "ideogram"
    };
  } catch (error) {
    console.error("Erro na chamada à API Ideogram:", error);
    throw error;
  }
}

// Chamada para o Minimax (vídeo)
async function callMinimax(prompt: string, model: string) {
  console.log(`Chamando Minimax com modelo ${model}`);
  
  const requestBody = {
    prompt: prompt,
    duration: 10, // duração em segundos
    resolution: "720p"
  };
  
  console.log(`Enviando para Minimax:`, JSON.stringify(requestBody));
  
  try {
    const response = await fetch("https://api.minimax.ai/v1/video/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEYS.minimax}`
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro Minimax: ${response.status} - ${errorText}`);
      throw new Error(`Minimax API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log("Resposta Minimax recebida:", JSON.stringify(data).substring(0, 200) + "...");
    
    // Minimax retorna informações do vídeo gerado
    const videoUrl = data.result?.video_url || "";
    
    if (!videoUrl) {
      throw new Error("Minimax não retornou uma URL de vídeo válida");
    }
    
    return {
      content: `[Vídeo gerado]: ${prompt}`,
      mediaUrl: videoUrl,
      model: model,
      provider: "minimax"
    };
  } catch (error) {
    console.error("Erro na chamada à API Minimax:", error);
    throw error;
  }
}

// Chamada para o ElevenLabs (áudio)
async function callElevenLabs(prompt: string, model: string) {
  console.log(`Chamando ElevenLabs com modelo ${model}`);
  
  const voice_id = "pFZP5JQG7iQjIQuC4Bku"; // Lily voice (default)
  
  const requestBody = {
    text: prompt,
    model_id: "eleven_multilingual_v2",
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75
    }
  };
  
  console.log(`Enviando para ElevenLabs:`, JSON.stringify(requestBody));
  
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": API_KEYS.elevenlabs
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro ElevenLabs: ${response.status} - ${errorText}`);
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }
    
    // ElevenLabs retorna o áudio como blob
    const audioBlob = await response.blob();
    
    // Precisamos converter para base64 para enviar pelo json
    const audioBase64 = await new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(audioBlob);
    });
    
    console.log("Áudio ElevenLabs gerado com sucesso");
    
    return {
      content: `[Áudio gerado]: ${prompt.substring(0, 50)}...`,
      audioData: audioBase64,
      model: model,
      provider: "elevenlabs"
    };
  } catch (error) {
    console.error("Erro na chamada à API ElevenLabs:", error);
    throw error;
  }
}

serve(async (req) => {
  // Tratar requisições OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    console.log("Recebida requisição CORS preflight");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Obter parâmetros da requisição
    const reqData = await req.json();
    const { prompt, model, mode, conversationId, files } = reqData;
    
    console.log(`Recebida requisição para modelo: ${model}, modo: ${mode}`);
    console.log(`Prompt: ${prompt ? prompt.substring(0, 50) + "..." : "vazio"}`);
    console.log(`ConversationId: ${conversationId || "não fornecido"}`);
    console.log(`Files: ${files && files.length > 0 ? "sim, " + files.length + " arquivo(s)" : "não"}`);
    
    if (!prompt || !model || !mode) {
      console.error("Parâmetros obrigatórios ausentes");
      return new Response(
        JSON.stringify({ 
          error: 'Parâmetros obrigatórios ausentes',
          content: 'Ocorreu um erro: parâmetros obrigatórios ausentes (prompt, model, mode).'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Determinar qual API chamar com base no modelo e mode
    let response;
    try {
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
        throw new Error(`Modelo não suportado: ${model}`);
      }
      
      console.log(`Resposta obtida do modelo ${model}:`, response ? 'sucesso' : 'falha');
    } catch (error: any) {
      console.error(`Erro ao chamar API para modelo ${model}:`, error);
      
      return new Response(
        JSON.stringify({ 
          error: `Erro ao processar com o modelo ${model}`, 
          details: error.message,
          content: `Ocorreu um erro ao processar sua solicitação com o modelo ${model}: ${error.message}. Por favor, tente novamente.`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Se um conversationId foi fornecido, salvar a mensagem no Supabase
    if (conversationId) {
      try {
        // Criar cliente Supabase
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://vygluorjwehcdigzxbaa.supabase.co';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        
        if (!supabaseUrl || !supabaseKey) {
          console.error("Usando apenas o URL básico do Supabase sem chave de serviço");
        }
        
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Salvar a mensagem do usuário e a resposta do modelo
        console.log("Salvando mensagens no banco de dados...");
        
        // Primeiro, salvar a mensagem do usuário
        const userMsgResult = await supabase.from('messages').insert({
          conversation_id: conversationId,
          content: prompt,
          sender: 'user',
          model: 'user',
          mode: mode,
          media_url: files && files.length > 0 ? files[0] : null
        });
        
        if (userMsgResult.error) {
          console.error("Erro ao salvar mensagem do usuário:", userMsgResult.error);
          throw userMsgResult.error;
        }
        
        // Depois, salvar a resposta do modelo
        const aiMsgResult = await supabase.from('messages').insert({
          conversation_id: conversationId,
          content: response.content,
          sender: 'ai',
          model: model,
          mode: mode,
          media_url: response.mediaUrl || null,
          audio_data: response.audioData || null
        });
        
        if (aiMsgResult.error) {
          console.error("Erro ao salvar resposta do modelo:", aiMsgResult.error);
          throw aiMsgResult.error;
        }
        
        console.log('Mensagens salvas no banco de dados com sucesso');
      } catch (error: any) {
        console.error('Erro ao salvar mensagens:', error);
        // Não interromper o fluxo em caso de erro ao salvar no banco
        // Apenas continuar e retornar a resposta da API
      }
    }

    // Retornar a resposta
    console.log("Retornando resposta para o cliente");
    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Erro no servidor:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor', 
        details: error.message,
        content: 'Ocorreu um erro interno ao processar sua solicitação. Por favor, tente novamente.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
