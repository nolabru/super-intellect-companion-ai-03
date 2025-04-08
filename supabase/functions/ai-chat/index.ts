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
      
      let createTaskResponse;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          console.log(`[Kligin] Tentativa ${retryCount + 1} de ${maxRetries} para criar tarefa`);
          createTaskResponse = await fetch("https://api.klign.ai/video/generate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${API_KEYS.kligin}`
            },
            body: JSON.stringify(createTaskPayload)
          });
          
          break;
        } catch (error) {
          retryCount++;
          console.error(`[Kligin] Erro de rede na tentativa ${retryCount}:`, error);
          
          if (retryCount >= maxRetries) {
            console.error("[Kligin] Número máximo de tentativas excedido");
            throw new Error(`Erro de conexão com a API Kligin: ${error.message}. Verifique sua conexão ou tente novamente mais tarde.`);
          }
          
          const delay = Math.pow(2, retryCount) * 1000;
          console.log(`[Kligin] Aguardando ${delay}ms antes de tentar novamente...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      if (!createTaskResponse) {
        throw new Error("Não foi possível estabelecer conexão com a API Kligin após várias tentativas.");
      }
      
      const createTaskResponseStatus = createTaskResponse.status;
      console.log(`[Kligin] Status da resposta de criação de tarefa: ${createTaskResponseStatus}`);
      
      if (!createTaskResponse.ok) {
        const errorText = await createTaskResponse.text();
        console.error(`[Kligin] Erro ao criar tarefa de vídeo: ${createTaskResponseStatus} - ${errorText}`);
        
        if (createTaskResponseStatus === 401) {
          throw new Error("Erro de autenticação com a API Kligin. Verifique se o token de API é válido.");
        }
        
        if (createTaskResponseStatus === 429) {
          throw new Error("Limite de requisições excedido na API Kligin. Tente novamente mais tarde.");
        }
        
        throw new Error(`Erro na API Kligin (${createTaskResponseStatus}): ${errorText}`);
      }
      
      let taskData;
      try {
        taskData = await createTaskResponse.json();
        console.log("[Kligin] Resposta da criação de tarefa:", JSON.stringify(taskData));
      } catch (parseError) {
        console.error("[Kligin] Erro ao fazer parse da resposta JSON:", parseError);
        throw new Error(`Erro ao processar resposta da API Kligin: ${parseError.message}`);
      }
      
      if (!taskData.id) {
        console.error("[Kligin] ID não encontrado na resposta:", taskData);
        throw new Error("API Kligin não retornou um ID válido");
      }
      
      const taskId = taskData.id;
      console.log(`[Kligin] Task ID obtido: ${taskId}`);
      
      console.log(`[Kligin] Etapa 2: Verificando status da tarefa ${taskId}`);
      let videoUrl = null;
      let attempts = 0;
      const maxAttempts = 30;
      const pollingInterval = 5000;
      
      while (attempts < maxAttempts) {
        attempts++;
        console.log(`[Kligin] Tentativa ${attempts} de ${maxAttempts} para verificar status da tarefa ${taskId}`);
        
        await new Promise(resolve => setTimeout(resolve, pollingInterval));
        
        console.log(`[Kligin] Verificando status da tarefa ${taskId}`);
        
        let statusResponse;
        try {
          statusResponse = await fetch(`https://api.klign.ai/video/status/${taskId}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${API_KEYS.kligin}`
            }
          });
        } catch (networkError) {
          console.error(`[Kligin] Erro de rede ao verificar status:`, networkError);
          continue;
        }
        
        const statusResponseStatus = statusResponse.status;
        console.log(`[Kligin] Status da resposta de verificação: ${statusResponseStatus}`);
        
        if (!statusResponse.ok) {
          const errorText = await statusResponse.text();
          console.error(`[Kligin] Erro ao verificar status da tarefa: ${statusResponseStatus} - ${errorText}`);
          
          if (attempts >= maxAttempts) {
            throw new Error(`Erro ao verificar status da tarefa após ${maxAttempts} tentativas: ${errorText}`);
          }
          
          continue;
        }
        
        let statusData;
        try {
          statusData = await statusResponse.json();
          console.log(`[Kligin] Status da tarefa ${taskId}:`, JSON.stringify(statusData));
        } catch (parseError) {
          console.error("[Kligin] Erro ao fazer parse da resposta JSON do status:", parseError);
          
          if (attempts >= maxAttempts) {
            throw new Error(`Erro ao processar resposta de status após ${maxAttempts} tentativas: ${parseError.message}`);
          }
          
          continue;
        }
        
        if (!statusData.status) {
          console.error("[Kligin] Campo 'status' não encontrado na resposta:", statusData);
          continue;
        }
        
        if (statusData.status === "completed" && statusData.video_url) {
          videoUrl = statusData.video_url;
          console.log(`[Kligin] Vídeo gerado com sucesso: ${videoUrl}`);
          break;
        }
        
        if (statusData.status === "failed") {
          console.error(`[Kligin] Falha na geração do vídeo:`, statusData.message || "motivo desconhecido");
          throw new Error(`Falha na geração do vídeo: ${statusData.message || "motivo desconhecido"}`);
        }
        
        if (statusData.status === "processing" || statusData.status === "pending") {
          console.log(`[Kligin] Vídeo ainda em processamento (${statusData.status}), aguardando...`);
          continue;
        }
        
        console.log(`[Kligin] Status desconhecido: ${statusData.status}, continuando a verificar...`);
      }
      
      if (!videoUrl) {
        console.error("[Kligin] Não foi possível obter a URL do vídeo após múltiplas tentativas");
        throw new Error("Tempo esgotado aguardando a geração do vídeo. Por favor, tente novamente.");
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
    
    const createTaskResponse = await fetch("https://api.minimax.io/v1/video/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEYS.minimax}`
      },
      body: JSON.stringify(createTaskPayload)
    });
    
    const createTaskResponseStatus = createTaskResponse.status;
    console.log(`[Minimax] Status da resposta de criação de tarefa: ${createTaskResponseStatus}`);
    
    if (!createTaskResponse.ok) {
      const errorText = await createTaskResponse.text();
      console.error(`[Minimax] Erro ao criar tarefa de vídeo: ${createTaskResponseStatus} - ${errorText}`);
      throw new Error(`Minimax API error (criação de tarefa): ${createTaskResponseStatus} - ${errorText}`);
    }
    
    let taskData;
    try {
      taskData = await createTaskResponse.json();
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
    
    let videoUrl = null;
    let attempts = 0;
    const maxAttempts = 20;
    const pollingInterval = 5000;
    
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`[Minimax] Tentativa ${attempts} de ${maxAttempts} para verificar status da tarefa ${taskId}`);
      
      await new Promise(resolve => setTimeout(resolve, pollingInterval));
      
      console.log(`[Minimax] Verificando status da tarefa ${taskId}`);
      const statusResponse = await fetch(`https://api.minimax.io/v1/video/status/${taskId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_KEYS.minimax}`
        }
      });
      
      const statusResponseStatus = statusResponse.status;
      console.log(`[Minimax] Status da resposta de verificação: ${statusResponseStatus}`);
      
      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error(`[Minimax] Erro ao verificar status da tarefa: ${statusResponseStatus} - ${errorText}`);
        
        if (attempts >= maxAttempts) {
          throw new Error(`Erro ao verificar status da tarefa após ${maxAttempts} tentativas: ${errorText}`);
        }
        
        continue;
      }
      
      let statusData;
      try {
        statusData = await statusResponse.json();
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
    throw error;
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
