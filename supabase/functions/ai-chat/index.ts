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
  luma: "luma-41fbafc0-37a8-4fc6-b09e-2e797e3dc615-652913c7-8609-4115-91d6-1d4d52dcb9d7",
};

// Chamada para o OpenAI (GPT-4o, GPT-4o Vision, Whisper)
async function callOpenAI(prompt: string, model: string, mode: string, files?: string[]) {
  console.log(`Chamando OpenAI com modelo ${model}, modo ${mode}`);
  
  let endpoint = "https://api.openai.com/v1/";
  let requestBody: any = {};
  
  if (mode === 'text') {
    endpoint += "chat/completions";
    requestBody = {
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000
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
      model: "gpt-4o",
      messages: [{ role: "user", content: content }],
      temperature: 0.7,
      max_tokens: 1000
    };
  } else if (mode === 'audio') {
    endpoint += "audio/transcriptions";
    
    // Para transcrição de áudio, usando Whisper
    const formData = new FormData();
    formData.append("model", "whisper-1");
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
  
  let messages: any[] = [];
  
  // Preparar mensagens de acordo com o formato esperado pelo Anthropic
  if (mode === 'text') {
    messages = [{
      role: "user",
      content: [{ type: "text", text: prompt }]
    }];
  } else if ((mode === 'image' || mode === 'video') && files && files.length > 0) {
    const content: any[] = [{ type: "text", text: prompt }];
    
    // Adicionar imagens/vídeos
    for (const file of files) {
      try {
        const response = await fetch(file);
        const fileBuffer = await response.arrayBuffer();
        
        const base64Data = btoa(
          Array.from(new Uint8Array(fileBuffer))
            .map(byte => String.fromCharCode(byte))
            .join("")
        );
        
        content.push({
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
    
    messages = [{
      role: "user",
      content: content
    }];
  } else {
    messages = [{
      role: "user",
      content: [{ type: "text", text: prompt }]
    }];
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
        model: model === 'claude-3-opus' ? 'claude-3-opus-20240229' : 'claude-3-sonnet-20240229',
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
    endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
    
    requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024
      }
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
      contents: [{ parts: parts }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024
      }
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
    
    const textContent = data.candidates?.[0]?.content?.parts
      ?.filter((part: any) => part.text)
      ?.map((part: any) => part.text)
      ?.join("\n") || "Erro ao processar resposta";
    
    return {
      content: textContent,
      model: model,
      provider: "google"
    };
  } catch (error) {
    console.error("Erro na chamada à API Google:", error);
    throw error;
  }
}

// Chamada para o OpenAI DALL-E 3 (imagem)
async function callOpenAIImage(prompt: string) {
  console.log(`Chamando OpenAI DALL-E para geração de imagem com prompt: ${prompt}`);
  
  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEYS.openai}`
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        response_format: "url"
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro OpenAI DALL-E: ${response.status} - ${errorText}`);
      throw new Error(`OpenAI DALL-E error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log("Resposta OpenAI DALL-E recebida:", JSON.stringify(data).substring(0, 200) + "...");
    
    const imageUrl = data.data?.[0]?.url;
    
    if (!imageUrl) {
      throw new Error("OpenAI DALL-E não retornou uma URL de imagem válida");
    }
    
    return {
      content: `[Imagem gerada]: ${prompt}`,
      mediaUrl: imageUrl,
      model: "openai-image",
      provider: "openai"
    };
  } catch (error) {
    console.error("Erro na chamada à API OpenAI DALL-E:", error);
    throw error;
  }
}

// Chamada para o Kligin AI (imagem e vídeo)
async function callKligin(prompt: string, model: string, mode: string) {
  console.log(`[Kligin] Iniciando chamada para ${model}, modo ${mode}, prompt: "${prompt}"`);
  
  if (mode === 'image') {
    try {
      console.log("[Kligin] Modo imagem: redirecionando para OpenAI DALL-E");
      return await callOpenAIImage(prompt);
    } catch (error) {
      console.error("[Kligin] Fallback para OpenAI DALL-E falhou:", error);
      throw error;
    }
  }

  if (mode === 'video') {
    console.log(`[Kligin] Iniciando processo de geração de vídeo para o prompt: "${prompt}"`);
    
    try {
      console.log("[Kligin] Etapa 1: Criando tarefa de geração de vídeo");
      
      const createTaskPayload = {
        prompt: prompt,
        aspect_ratio: "16:9",
        duration: 6
      };
      
      console.log(`[Kligin] Enviando payload para criação de tarefa:`, JSON.stringify(createTaskPayload));
      
      // Define o novo endpoint correto para a API Kligin
      const KLIGIN_API_URL = "https://api.klign.ai/v1/video/generate";
      
      let createTaskResponse;
      let retryCount = 0;
      const maxRetries = 5;  // Aumentei o número de tentativas
      
      while (retryCount < maxRetries) {
        try {
          console.log(`[Kligin] Tentativa ${retryCount + 1} de ${maxRetries} para criar tarefa usando URL: ${KLIGIN_API_URL}`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos de timeout
          
          createTaskResponse = await fetch(KLIGIN_API_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${API_KEYS.kligin}`
            },
            body: JSON.stringify(createTaskPayload),
            signal: controller.signal
          }).finally(() => clearTimeout(timeoutId));
          
          break;
        } catch (error: any) {
          retryCount++;
          
          if (error.name === 'AbortError') {
            console.error(`[Kligin] Timeout excedido na tentativa ${retryCount}`);
          } else {
            console.error(`[Kligin] Erro de rede na tentativa ${retryCount}:`, error);
          }
          
          if (retryCount >= maxRetries) {
            console.error("[Kligin] Número máximo de tentativas excedido");
            console.log("[Kligin] Ativando fallback para Minimax...");
            return await callMinimax(prompt, "minimax-video");
          }
          
          const delay = Math.pow(2, retryCount) * 1000;
          console.log(`[Kligin] Aguardando ${delay}ms antes de tentar novamente...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      if (!createTaskResponse) {
        console.error("[Kligin] Não foi possível estabelecer conexão com a API Kligin");
        console.log("[Kligin] Ativando fallback para Minimax...");
        return await callMinimax(prompt, "minimax-video");
      }
      
      const createTaskResponseStatus = createTaskResponse.status;
      console.log(`[Kligin] Status da resposta de criação de tarefa: ${createTaskResponseStatus}`);
      
      let responseText = "";
      try {
        responseText = await createTaskResponse.text();
        console.log(`[Kligin] Resposta bruta: ${responseText}`);
      } catch (error) {
        console.error("[Kligin] Não foi possível ler o corpo da resposta:", error);
      }
      
      if (!createTaskResponse.ok) {
        console.error(`[Kligin] Erro ao criar tarefa de vídeo: ${createTaskResponseStatus} - ${responseText}`);
        
        if (createTaskResponseStatus === 401) {
          throw new Error("Erro de autenticação com a API Kligin. Verifique se o token de API é válido.");
        }
        
        if (createTaskResponseStatus === 429) {
          throw new Error("Limite de requisições excedido na API Kligin. Tente novamente mais tarde.");
        }
        
        console.log("[Kligin] Erro na API Kligin. Ativando fallback para Minimax...");
        return await callMinimax(prompt, "minimax-video");
      }
      
      let taskData;
      try {
        taskData = JSON.parse(responseText);
        console.log("[Kligin] Resposta da criação de tarefa:", JSON.stringify(taskData));
      } catch (parseError) {
        console.error("[Kligin] Erro ao fazer parse da resposta JSON:", parseError);
        console.log("[Kligin] Ativando fallback para Minimax...");
        return await callMinimax(prompt, "minimax-video");
      }
      
      if (!taskData.id) {
        console.error("[Kligin] ID não encontrado na resposta:", taskData);
        console.log("[Kligin] Ativando fallback para Minimax...");
        return await callMinimax(prompt, "minimax-video");
      }
      
      const taskId = taskData.id;
      console.log(`[Kligin] Task ID obtido: ${taskId}`);
      
      console.log(`[Kligin] Etapa 2: Verificando status da tarefa ${taskId}`);
      
      // Novo endpoint para verificação de status
      const STATUS_API_URL = `https://api.klign.ai/v1/video/status/${taskId}`;
      
      let videoUrl = null;
      let attempts = 0;
      const maxAttempts = 45;  // Aumentei o número de tentativas de verificação
      const pollingInterval = 4000;  // Intervalo de 4 segundos
      
      while (attempts < maxAttempts) {
        attempts++;
        console.log(`[Kligin] Tentativa ${attempts} de ${maxAttempts} para verificar status da tarefa ${taskId}`);
        
        await new Promise(resolve => setTimeout(resolve, pollingInterval));
        
        console.log(`[Kligin] Verificando status da tarefa ${taskId} usando URL: ${STATUS_API_URL}`);
        
        let statusResponse;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de timeout
          
          statusResponse = await fetch(STATUS_API_URL, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${API_KEYS.kligin}`
            },
            signal: controller.signal
          }).finally(() => clearTimeout(timeoutId));
        } catch (networkError: any) {
          console.error(`[Kligin] Erro de rede ao verificar status:`, networkError);
          
          if (networkError.name === 'AbortError') {
            console.log("[Kligin] Timeout excedido ao verificar status");
          }
          
          if (attempts >= maxAttempts) {
            console.error("[Kligin] Número máximo de tentativas excedido para verificação de status");
            console.log("[Kligin] Ativando fallback para Minimax...");
            return await callMinimax(prompt, "minimax-video");
          }
          
          continue;
        }
        
        const statusResponseStatus = statusResponse.status;
        console.log(`[Kligin] Status da resposta de verificação: ${statusResponseStatus}`);
        
        let statusResponseText = "";
        try {
          statusResponseText = await statusResponse.text();
          console.log(`[Kligin] Resposta bruta do status: ${statusResponseText}`);
        } catch (error) {
          console.error("[Kligin] Não foi possível ler o corpo da resposta de status:", error);
        }
        
        if (!statusResponse.ok) {
          console.error(`[Kligin] Erro ao verificar status da tarefa: ${statusResponseStatus} - ${statusResponseText}`);
          
          if (attempts >= maxAttempts) {
            console.error(`[Kligin] Erro ao verificar status da tarefa após ${maxAttempts} tentativas.`);
            console.log("[Kligin] Ativando fallback para Minimax...");
            return await callMinimax(prompt, "minimax-video");
          }
          
          continue;
        }
        
        let statusData;
        try {
          statusData = JSON.parse(statusResponseText);
          console.log(`[Kligin] Status da tarefa ${taskId}:`, JSON.stringify(statusData));
        } catch (parseError) {
          console.error("[Kligin] Erro ao fazer parse da resposta JSON do status:", parseError);
          
          if (attempts >= maxAttempts) {
            console.error(`[Kligin] Erro ao processar resposta de status após ${maxAttempts} tentativas.`);
            console.log("[Kligin] Ativando fallback para Minimax...");
            return await callMinimax(prompt, "minimax-video");
          }
          
          continue;
        }
        
        if (!statusData.status) {
          console.error("[Kligin] Campo 'status' não encontrado na resposta:", statusData);
          continue;
        }
        
        console.log(`[Kligin] Status atual: ${statusData.status}`);
        
        if (statusData.status === "completed" && statusData.video_url) {
          videoUrl = statusData.video_url;
          console.log(`[Kligin] Vídeo gerado com sucesso: ${videoUrl}`);
          break;
        }
        
        if (statusData.status === "failed") {
          console.error(`[Kligin] Falha na geração do vídeo:`, statusData.message || "motivo desconhecido");
          console.log("[Kligin] Ativando fallback para Minimax...");
          return await callMinimax(prompt, "minimax-video");
        }
        
        if (statusData.status === "processing" || statusData.status === "pending") {
          console.log(`[Kligin] Vídeo ainda em processamento (${statusData.status}), aguardando...`);
          continue;
        }
        
        console.log(`[Kligin] Status desconhecido: ${statusData.status}, continuando a verificar...`);
      }
      
      if (!videoUrl) {
        console.error("[Kligin] Não foi possível obter a URL do vídeo após múltiplas tentativas");
        console.log("[Kligin] Ativando fallback para Minimax...");
        return await callMinimax(prompt, "minimax-video");
      }
      
      console.log("[Kligin] Etapa 3: Retornando resultado do vídeo gerado");
      return {
        content: `Vídeo gerado com base no prompt: "${prompt}"`,
        mediaUrl: videoUrl,
        model: model,
        provider: "kligin"
      };
      
    } catch (error) {
      console.error("[Kligin] Erro na chamada à API para geração de vídeo:", error);
      
      console.log("[Kligin] Tentando fallback para Minimax Video...");
      try {
        return await callMinimax(prompt, "minimax-video");
      } catch (fallbackError) {
        console.error("[Kligin] Fallback para Minimax falhou:", fallbackError);
        throw error;
      }
    }
  }
  
  throw new Error(`Modo não suportado pelo Kligin: ${mode}`);
}

// Chamada para o Minimax (vídeo)
async function callMinimax(prompt: string, model: string) {
  console.log(`[Minimax] Iniciando chamada para ${model}, prompt: "${prompt}"`);
  
  try {
    console.log(`[Minimax] Iniciando processo de geração de vídeo para o prompt: "${prompt}"`);
    
    const createTaskPayload = {
      prompt: prompt,
      aspect_ratio: "16:9",
      duration: 6
    };
    
    console.log(`[Minimax] Enviando payload para criação de tarefa:`, JSON.stringify(createTaskPayload));
    
    // Endpoint correto do Minimax
    const MINIMAX_API_URL = "https://api.minimax.ai/v1/video/generate";
    
    let retryCount = 0;
    const maxRetries = 5;
    
    let createTaskResponse;
    while (retryCount < maxRetries) {
      try {
        console.log(`[Minimax] Tentativa ${retryCount + 1} de ${maxRetries} para criar tarefa usando URL: ${MINIMAX_API_URL}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos de timeout
        
        createTaskResponse = await fetch(MINIMAX_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${API_KEYS.minimax}`
          },
          body: JSON.stringify(createTaskPayload),
          signal: controller.signal
        }).finally(() => clearTimeout(timeoutId));
        
        break;
      } catch (error: any) {
        retryCount++;
        
        if (error.name === 'AbortError') {
          console.error(`[Minimax] Timeout excedido na tentativa ${retryCount}`);
        } else {
          console.error(`[Minimax] Erro de rede na tentativa ${retryCount}:`, error);
        }
        
        if (retryCount >= maxRetries) {
          console.error("[Minimax] Número máximo de tentativas excedido");
          throw new Error("Não foi possível se conectar ao serviço de geração de vídeo Minimax.");
        }
        
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`[Minimax] Aguardando ${delay}ms antes de tentar novamente...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    if (!createTaskResponse) {
      throw new Error("Não foi possível estabelecer conexão com a API Minimax.");
    }
    
    const createTaskResponseStatus = createTaskResponse.status;
    console.log(`[Minimax] Status da resposta de criação de tarefa: ${createTaskResponseStatus}`);
    
    let responseText = "";
    try {
      responseText = await createTaskResponse.text();
      console.log(`[Minimax] Resposta bruta: ${responseText}`);
    } catch (error) {
      console.error("[Minimax] Não foi possível ler o corpo da resposta:", error);
    }
    
    if (!createTaskResponse.ok) {
      console.error(`[Minimax] Erro ao criar tarefa de vídeo: ${createTaskResponseStatus} - ${responseText}`);
      throw new Error(`Minimax API error (criação de tarefa): ${createTaskResponseStatus} - ${responseText}`);
    }
    
    let taskData;
    try {
      taskData = JSON.parse(responseText);
      console.log("[Minimax] Resposta da criação de tarefa:", JSON.stringify(taskData));
    } catch (parseError) {
      console.error("[Minimax] Erro ao fazer parse da resposta JSON:", parseError);
      throw new Error(`Erro ao processar resposta da API Minimax: ${parseError.message}`);
    }
    
    if (!taskData.task_id) {
      console.error("[Minimax] task_id não encontrado na resposta:", taskData);
      throw new Error("Minimax não retornou um task_id válido");
    }
    
    const taskId = taskData.task_id;
    console.log(`[Minimax] Task ID obtido: ${taskId}`);
    
    // Endpoint correto para verificação de status
    const STATUS_API_URL = `https://api.minimax.ai/v1/video/status/${taskId}`;
    
    let videoUrl = null;
    let attempts = 0;
    const maxAttempts = 40;
    const pollingInterval = 4500;
    
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`[Minimax] Tentativa ${attempts} de ${maxAttempts} para verificar status da tarefa ${taskId}`);
      
      await new Promise(resolve => setTimeout(resolve, pollingInterval));
      
      console.log(`[Minimax] Verificando status da tarefa ${taskId} usando URL: ${STATUS_API_URL}`);
      
      let statusResponse;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de timeout
        
        statusResponse = await fetch(STATUS_API_URL, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${API_KEYS.minimax}`
          },
          signal: controller.signal
        }).finally(() => clearTimeout(timeoutId));
      } catch (networkError: any) {
        console.error(`[Minimax] Erro de rede ao verificar status:`, networkError);
        
        if (networkError.name === 'AbortError') {
          console.log("[Minimax] Timeout excedido ao verificar status");
        }
        
        if (attempts >= maxAttempts) {
          throw new Error(`Erro ao verificar status da tarefa após ${maxAttempts} tentativas.`);
        }
        
        continue;
      }
      
      const statusResponseStatus = statusResponse.status;
      console.log(`[Minimax] Status da resposta de verificação: ${statusResponseStatus}`);
      
      let statusResponseText = "";
      try {
        statusResponseText = await statusResponse.text();
        console.log(`[Minimax] Resposta bruta do status: ${statusResponseText}`);
      } catch (error) {
        console.error("[Minimax] Não foi possível ler o corpo da resposta de status:", error);
      }
      
      if (!statusResponse.ok) {
        console.error(`[Minimax] Erro ao verificar status da tarefa: ${statusResponseStatus} - ${statusResponseText}`);
        
        if (attempts >= maxAttempts) {
          throw new Error(`Erro ao verificar status da tarefa após ${maxAttempts} tentativas.`);
        }
        
        continue;
      }
      
      let statusData;
      try {
        statusData = JSON.parse(statusResponseText);
        console.log(`[Minimax] Status da tarefa ${taskId}:`, JSON.stringify(statusData));
      } catch (parseError) {
        console.error("[Minimax] Erro ao fazer parse da resposta JSON do status:", parseError);
        
        if (attempts >= maxAttempts) {
          throw new Error(`Erro ao processar resposta de status após ${maxAttempts} tentativas: ${parseError.message}`);
        }
        
        continue;
      }
      
      if (!statusData.status) {
        console.error("[Minimax] Campo 'status' não encontrado na resposta:", statusData);
        continue;
      }
      
      console.log(`[Minimax] Status atual: ${statusData.status}`);
      
      if (statusData.status === "completed" && statusData.video_url) {
        videoUrl = statusData.video_url;
        console.log(`[Minimax] Vídeo gerado com sucesso: ${videoUrl}`);
        break;
      }
      
      if (statusData.status === "failed") {
        console.error(`[Minimax] Falha na geração do vídeo:`, statusData.message || "motivo desconhecido");
        throw new Error(`Falha na geração do vídeo: ${statusData.message || "motivo desconhecido"}`);
      }
      
      if (statusData.status === "processing" || statusData.status === "pending") {
        console.log(`[Minimax] Vídeo ainda em processamento (${statusData.status}), aguardando...`);
        continue;
      }
      
      console.log(`[Minimax] Status desconhecido: ${statusData.status}, continuando a verificar...`);
    }
    
    if (!videoUrl) {
      console.error("[Minimax] Não foi possível obter a URL do vídeo após múltiplas tentativas");
      throw new Error("Tempo esgotado aguardando a geração do vídeo. Por favor, tente novamente.");
    }
    
    console.log("[Minimax] Etapa 3: Retornando resultado do vídeo gerado");
    return {
      content: `Vídeo gerado com base no prompt: "${prompt}"`,
      mediaUrl: videoUrl,
      model: model,
      provider: "minimax"
    };
  } catch (error) {
    console.error("[Minimax] Erro na chamada à API para geração de vídeo:", error);
    
    // Fallback final - retornar um erro mais amigável
    return {
      content: `Não foi possível gerar o vídeo neste momento. Por favor, tente com um prompt diferente ou tente novamente mais tarde.`,
      model: model,
      provider: "minimax"
    };
  }
}

// Chamada para o Ideogram (imagens)
async function callIdeogram(prompt: string, model: string) {
  console.log(`Chamando Ideogram com modelo ${model}`);
  
  try {
    return await callOpenAIImage(prompt);
  } catch (error) {
    console.error("Fallback para OpenAI DALL-E falhou:", error);
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
    
    const audioBlob = await response.blob();
    
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

// Chamada para o Luma AI (imagem e vídeo)
async function callLuma(prompt: string, model: string, mode: string) {
  console.log(`[Luma] Iniciando chamada para ${model}, modo ${mode}, prompt: "${prompt}"`);
  
  if (mode === 'image') {
    try {
      console.log(`[Luma] Iniciando processo de geração de imagem para o prompt: "${prompt}"`);
      
      const createTaskPayload = {
        prompt: prompt,
        style: "3d",  // Opções: photographic, animation, anime, cinematic, 3d
        negative_prompt: "",
        width: 1024,
        height: 1024,
      };
      
      console.log(`[Luma] Enviando payload para criação de imagem:`, JSON.stringify(createTaskPayload));
      
      const LUMA_API_URL = "https://api.lumalabs.ai/image";
      
      let createTaskResponse;
      let retryCount = 0;
      const maxRetries = 5;
      
      while (retryCount < maxRetries) {
        try {
          console.log(`[Luma] Tentativa ${retryCount + 1} de ${maxRetries} para criar tarefa usando URL: ${LUMA_API_URL}`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos de timeout
          
          createTaskResponse = await fetch(LUMA_API_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${API_KEYS.luma}`
            },
            body: JSON.stringify(createTaskPayload),
            signal: controller.signal
          }).finally(() => clearTimeout(timeoutId));
          
          break;
        } catch (error: any) {
          retryCount++;
          
          if (error.name === 'AbortError') {
            console.error(`[Luma] Timeout excedido na tentativa ${retryCount}`);
          } else {
            console.error(`[Luma] Erro de rede na tentativa ${retryCount}:`, error);
          }
          
          if (retryCount >= maxRetries) {
            console.error("[Luma] Número máximo de tentativas excedido");
            throw new Error("[Luma] Não foi possível se conectar à API Luma para geração de imagem.");
          }
          
          const delay = Math.pow(2, retryCount) * 1000;
          console.log(`[Luma] Aguardando ${delay}ms antes de tentar novamente...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      if (!createTaskResponse) {
        throw new Error("Não foi possível estabelecer conexão com a API Luma.");
      }
      
      const createTaskResponseStatus = createTaskResponse.status;
      console.log(`[Luma] Status da resposta de criação de imagem: ${createTaskResponseStatus}`);
      
      let responseText = "";
      try {
        responseText = await createTaskResponse.text();
        console.log(`[Luma] Resposta bruta: ${responseText}`);
      } catch (error) {
        console.error("[Luma] Não foi possível ler o corpo da resposta:", error);
      }
      
      if (!createTaskResponse.ok) {
        console.error(`[Luma] Erro ao criar tarefa de imagem: ${createTaskResponseStatus} - ${responseText}`);
        throw new Error(`Luma API error (criação de imagem): ${createTaskResponseStatus} - ${responseText}`);
      }
      
      let imageData;
      try {
        imageData = JSON.parse(responseText);
        console.log("[Luma] Resposta da criação de imagem:", JSON.stringify(imageData));
      } catch (parseError) {
        console.error("[Luma] Erro ao fazer parse da resposta JSON:", parseError);
        throw new Error(`Erro ao processar resposta da API Luma: ${parseError.message}`);
      }
      
      if (!imageData.id) {
        console.error("[Luma] ID não encontrado na resposta:", imageData);
        throw new Error("Luma não retornou um ID válido para a imagem");
      }
      
      const imageId = imageData.id;
      console.log(`[Luma] Image ID obtido: ${imageId}`);
      
      // Endpoint para verificação de status
      const STATUS_API_URL = `https://api.lumalabs.ai/image/${imageId}`;
      
      let imageUrl = null;
      let attempts = 0;
      const maxAttempts = 40;
      const pollingInterval = 4000;
      
      while (attempts < maxAttempts) {
        attempts++;
        console.log(`[Luma] Tentativa ${attempts} de ${maxAttempts} para verificar status da imagem ${imageId}`);
        
        await new Promise(resolve => setTimeout(resolve, pollingInterval));
        
        console.log(`[Luma] Verificando status da imagem ${imageId} usando URL: ${STATUS_API_URL}`);
        
        let statusResponse;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de timeout
          
          statusResponse = await fetch(STATUS_API_URL, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${API_KEYS.luma}`
            },
            signal: controller.signal
          }).finally(() => clearTimeout(timeoutId));
        } catch (networkError: any) {
          console.error(`[Luma] Erro de rede ao verificar status:`, networkError);
          
          if (networkError.name === 'AbortError') {
            console.log("[Luma] Timeout excedido ao verificar status");
          }
          
          if (attempts >= maxAttempts) {
            throw new Error(`Erro ao verificar status da tarefa após ${maxAttempts} tentativas.`);
          }
          
          continue;
        }
        
        const statusResponseStatus = statusResponse.status;
        console.log(`[Luma] Status da resposta de verificação: ${statusResponseStatus}`);
        
        let statusResponseText = "";
        try {
          statusResponseText = await statusResponse.text();
          console.log(`[Luma] Resposta bruta do status: ${statusResponseText}`);
        } catch (error) {
          console.error("[Luma] Não foi possível ler o corpo da resposta de status:", error);
        }
        
        if (!statusResponse.ok) {
          console.error(`[Luma] Erro ao verificar status da imagem: ${statusResponseStatus} - ${statusResponseText}`);
          
          if (attempts >= maxAttempts) {
            throw new Error(`Erro ao verificar status da imagem após ${maxAttempts} tentativas.`);
          }
          
          continue;
        }
        
        let statusData;
        try {
          statusData = JSON.parse(statusResponseText);
          console.log(`[Luma] Status da imagem ${imageId}:`, JSON.stringify(statusData));
        } catch (parseError) {
          console.error("[Luma] Erro ao fazer parse da resposta JSON do status:", parseError);
          
          if (attempts >= maxAttempts) {
            throw new Error(`Erro ao processar resposta de status após ${maxAttempts} tentativas: ${parseError.message}`);
          }
          
          continue;
        }
        
        if (!statusData.status) {
          console.error("[Luma] Campo 'status' não encontrado na resposta:", statusData);
          continue;
        }
        
        console.log(`[Luma] Status atual: ${statusData.status}`);
        
        if (statusData.status === "done" && statusData.output) {
          imageUrl = statusData.output;
          console.log(`[Luma] Imagem gerada com sucesso: ${imageUrl}`);
          break;
        }
        
        if (statusData.status === "failed") {
          console.error(`[Luma] Falha na geração da imagem:`, statusData.error || "motivo desconhecido");
          throw new Error(`Falha na geração da imagem: ${statusData.error || "motivo desconhecido"}`);
        }
        
        if (statusData.status === "processing" || statusData.status === "pending" || statusData.status === "queued") {
          console.log(`[Luma] Imagem ainda em processamento (${statusData.status}), aguardando...`);
          continue;
        }
        
        console.log(`[Luma] Status desconhecido: ${statusData.status}, continuando a verificar...`);
      }
      
      if (!imageUrl) {
        console.error("[Luma] Não foi possível obter a URL da imagem após múltiplas tentativas");
        throw new Error("Tempo esgotado aguardando a geração da imagem. Por favor, tente novamente.");
      }
      
      console.log("[Luma] Retornando resultado da imagem gerada");
      return {
        content: `Imagem gerada com base no prompt: "${prompt}"`,
        mediaUrl: imageUrl,
        model: model,
        provider: "luma"
      };
    } catch (error) {
      console.error("[Luma] Erro na chamada à API para geração de imagem:", error);
      throw error;
    }
  } else if (mode === 'video') {
    try {
      console.log(`[Luma] Iniciando processo de geração de vídeo para o prompt: "${prompt}"`);
      
      const createTaskPayload = {
        prompt: prompt,
        seed: Math.floor(Math.random() * 10000), // seed aleatório
        guidance_scale: 5,
        negative_prompt: "",
        num_frames: 72,  // Para um vídeo de ~3 segundos a 24fps
        motion_bucket_id: 60, // Quantidade de movimento (0-127)
        aspect_ratio: "16:9",
      };
      
      console.log(`[Luma] Enviando payload para criação de vídeo:`, JSON.stringify(createTaskPayload));
      
      const LUMA_API_URL = "https://api.lumalabs.ai/videos/init";
      
      let createTaskResponse;
      let retryCount = 0;
      const maxRetries = 5;
      
      while (retryCount < maxRetries) {
        try {
          console.log(`[Luma] Tentativa ${retryCount + 1} de ${maxRetries} para criar tarefa usando URL: ${LUMA_API_URL}`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos de timeout
          
          createTaskResponse = await fetch(LUMA_API_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${API_KEYS.luma}`
            },
            body: JSON.stringify(createTaskPayload),
            signal: controller.signal
          }).finally(() => clearTimeout(timeoutId));
          
          break;
        } catch (error: any) {
          retryCount++;
          
          if (error.name === 'AbortError') {
            console.error(`[Luma] Timeout excedido na tentativa ${retryCount}`);
          } else {
            console.error(`[Luma] Erro de rede na tentativa ${retryCount}:`, error);
          }
          
          if (retryCount >= maxRetries) {
            console.error("[Luma] Número máximo de tentativas excedido");
            console.log("[Luma] Ativando fallback para outro provedor de vídeo...");
            return await callKligin(prompt, "kligin-video", mode);
          }
          
          const delay = Math.pow(2, retryCount) * 1000;
          console.log(`[Luma] Aguardando ${delay}ms antes de tentar novamente...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      if (!createTaskResponse) {
        console.error("[Luma] Não foi possível estabelecer conexão com a API Luma");
        console.log("[Luma] Ativando fallback para outro provedor de vídeo...");
        return await callKligin(prompt, "kligin-video", mode);
      }
      
      const createTaskResponseStatus = createTaskResponse.status;
      console.log(`[Luma] Status da resposta de criação de tarefa: ${createTaskResponseStatus}`);
      
      let responseText = "";
      try {
        responseText = await createTaskResponse.text();
        console.log(`[Luma] Resposta bruta: ${responseText}`);
      } catch (error) {
        console.error("[Luma] Não foi possível ler o corpo da resposta:", error);
      }
      
      if (!createTaskResponse.ok) {
        console.error(`[Luma] Erro ao criar tarefa de vídeo: ${createTaskResponseStatus} - ${responseText}`);
        
        if (createTaskResponseStatus === 401) {
          throw new Error("Erro de autenticação com a API Luma. Verifique se o token de API é válido.");
        }
        
        if (createTaskResponseStatus === 429) {
          throw new Error("Limite de requisições excedido na API Luma. Tente novamente mais tarde.");
        }
        
        console.log("[Luma] Erro na API Luma. Ativando fallback para outro provedor...");
        return await callKligin(prompt, "kligin-video", mode);
      }
      
      let taskData;
      try {
        taskData = JSON.parse(responseText);
        console.log("[Luma] Resposta da criação de tarefa:", JSON.stringify(taskData));
      } catch (parseError) {
        console.error("[Luma] Erro ao fazer parse da resposta JSON:", parseError);
        console.log("[Luma] Ativando fallback para outro provedor...");
        return await callKligin(prompt, "kligin-video", mode);
      }
      
      if (!taskData.id) {
        console.error("[Luma] ID não encontrado na resposta:", taskData);
        console.log("[Luma] Ativando fallback para outro provedor...");
        return await callKligin(prompt, "kligin-video", mode);
      }
      
      const taskId = taskData.id;
      console.log(`[Luma] Video task ID obtido: ${taskId}`);
      
      console.log(`[Luma] Etapa 2: Verificando status da tarefa ${taskId}`);
      
      // Endpoint para verificação de status
      const STATUS_API_URL = `https://api.lumalabs.ai/videos/status/${taskId}`;
      
      let videoUrl = null;
      let attempts = 0;
      const maxAttempts = 60;  // Aumentei o número de tentativas para vídeos que podem levar mais tempo
      const pollingInterval = 5000;  // Intervalo de 5 segundos
      
      while (attempts < maxAttempts) {
        attempts++;
        console.log(`[Luma] Tentativa ${attempts} de ${maxAttempts} para verificar status da tarefa ${taskId}`);
        
        await new Promise(resolve => setTimeout(resolve, pollingInterval));
        
        console.log(`[Luma] Verificando status da tarefa ${taskId} usando URL: ${STATUS_API_URL}`);
        
        let statusResponse;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de timeout
          
          statusResponse = await fetch(STATUS_API_URL, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${API_KEYS.luma}`
            },
            signal: controller.signal
          }).finally(() => clearTimeout(timeoutId));
        } catch (networkError: any) {
          console.error(`[Luma] Erro de rede ao verificar status:`, networkError);
          
          if (networkError.name === 'AbortError') {
            console.log("[Luma] Timeout excedido ao verificar status");
          }
          
          if (attempts >= maxAttempts) {
            console.error("[Luma] Número máximo de tentativas excedido para verificação de status");
            console.log("[Luma] Ativando fallback para outro provedor...");
            return await callKligin(prompt, "kligin-video", mode);
          }
          
          continue;
        }
        
        const statusResponseStatus = statusResponse.status;
        console.log(`[Luma] Status da resposta de verificação: ${statusResponseStatus}`);
        
        let statusResponseText = "";
        try {
          statusResponseText = await statusResponse.text();
          console.log(`[Luma] Resposta bruta do status: ${statusResponseText}`);
        } catch (error) {
          console.error("[Luma] Não foi possível ler o corpo da resposta de status:", error);
        }
        
        if (!statusResponse.ok) {
          console.error(`[Luma] Erro ao verificar status da tarefa: ${statusResponseStatus} - ${statusResponseText}`);
          
          if (attempts >= maxAttempts) {
            console.error(`[Luma] Erro ao verificar status da tarefa após ${maxAttempts} tentativas.`);
            console.log("[Luma] Ativando fallback para outro provedor...");
            return await callKligin(prompt, "kligin-video", mode);
          }
          
          continue;
        }
        
        let statusData;
        try {
          statusData = JSON.parse(statusResponseText);
          console.log(`[Luma] Status da tarefa ${taskId}:`, JSON.stringify(statusData));
        } catch (parseError) {
          console.error("[Luma] Erro ao fazer parse da resposta JSON do status:", parseError);
          
          if (attempts >= maxAttempts) {
            console.error(`[Luma] Erro ao processar resposta de status após ${maxAttempts} tentativas.`);
            console.log("[Luma] Ativando fallback para outro provedor...");
            return await callKligin(prompt, "kligin-video", mode);
          }
          
          continue;
        }
        
        if (!statusData.status) {
          console.error("[Luma] Campo 'status' não encontrado na resposta:", statusData);
          continue;
        }
        
        console.log(`[Luma] Status atual: ${statusData.status}`);
        
        if (statusData.status === "done" && statusData.video_url) {
          videoUrl = statusData.video_url;
          console.log(`[Luma] Vídeo gerado com sucesso: ${videoUrl}`);
          break;
        }
        
        if (statusData.status === "failed") {
          console.error(`[Luma] Falha na geração do vídeo:`, statusData.error || "motivo desconhecido");
          console.log("[Luma] Ativando fallback para outro provedor...");
          return await callKligin(prompt, "kligin-video", mode);
        }
        
        if (statusData.status === "processing" || statusData.status === "pending" || statusData.status === "queued") {
          console.log(`[Luma] Vídeo ainda em processamento (${statusData.status}), aguardando...`);
          continue;
        }
        
        console.log(`[Luma] Status desconhecido: ${statusData.status}, continuando a verificar...`);
      }
      
      if (!videoUrl) {
        console.error("[Luma] Não foi possível obter a URL do vídeo após múltiplas tentativas");
        console.log("[Luma] Ativando fallback para outro provedor...");
        return await callKligin(prompt, "kligin-video", mode);
      }
      
      console.log("[Luma] Etapa 3: Retornando resultado do vídeo gerado");
      return {
        content: `Vídeo gerado com base no prompt: "${prompt}"`,
        mediaUrl: videoUrl,
        model: model,
        provider: "luma"
      };
      
    } catch (error) {
      console.error("[Luma] Erro na chamada à API para geração de vídeo:", error);
      
      console.log("[Luma] Tentando fallback para outro provedor...");
      try {
        return await callKligin(prompt, "kligin-video", mode);
      } catch (fallbackError) {
        console.error("[Luma] Fallback para outro provedor falhou:", fallbackError);
        throw error;
      }
    }
  }
  
  throw new Error(`Modo não suportado pelo Luma: ${mode}`);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    console.log("Recebida requisição CORS preflight");
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
      } else if (model.includes('luma')) {
        response = await callLuma(prompt, model, mode);
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
          content: `Ocorreu um erro ao processar sua solicitação com o modelo ${model}: ${error.message}. Por favor, tente novamente com um prompt diferente ou use outro modelo.`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (conversationId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://vygluorjwehcdigzxbaa.supabase.co';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        
        if (!supabaseUrl || !supabaseKey) {
          console.error("Usando apenas o URL básico do Supabase sem chave de serviço");
        }
        
        const supabase = createClient(supabaseUrl, supabaseKey);

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
      }
    }

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
