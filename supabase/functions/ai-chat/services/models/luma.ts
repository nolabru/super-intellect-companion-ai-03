
import { fetchWithRetry } from "../../utils/logging.ts";
import { logError } from "../../utils/logging.ts";
import { validateApiKey, ensureValue } from "../../utils/validation.ts";

// Define response type
export interface ResponseData {
  content: string;
  files?: string[];
}

// Função para testar a chave API da Luma
export async function testApiKey(apiKey: string): Promise<boolean> {
  try {
    console.log("Validando a API key da Luma...");
    
    if (!apiKey || apiKey.trim() === '') {
      console.error("API key vazia");
      return false;
    }
    
    // Verificação de formato para aceitar chaves com luma_ ou luma-
    if (!apiKey.startsWith('luma_') && !apiKey.startsWith('luma-')) {
      console.warn(`A API key não parece estar no formato esperado (esperado: 'luma_...' ou 'luma-...')`);
    }
    
    console.log("Formato da chave de teste:", apiKey.startsWith("luma_") ? "luma_" : apiKey.startsWith("luma-") ? "luma-" : "desconhecido");
    
    // Verificação simplificada com chamada direta à API Luma
    const response = await fetch("https://api.lumalabs.ai/v1/ping", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    });
    
    if (response.ok) {
      console.log("API key validada com sucesso!");
      return true;
    } else {
      console.error(`Falha na validação da API key: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.error("Erro ao configurar teste de API key:", error);
    return false;
  }
}

// Função para gerar imagem com Luma AI usando chamadas HTTP diretas
export async function generateImage(
  prompt: string,
  params: any = {}
): Promise<ResponseData> {
  console.log("Iniciando geração de imagem Luma AI com parâmetros:", JSON.stringify(params, null, 2));
  
  try {
    ensureValue(prompt, "O prompt para geração de imagem não pode estar vazio");
    
    const apiKey = Deno.env.get("LUMA_API_KEY");
    if (!apiKey) {
      throw new Error("LUMA_API_KEY não configurada");
    }
    
    // Parâmetros para a requisição
    const requestBody = {
      prompt: prompt,
      model: params?.model || "luma-1.1",
      aspect_ratio: params?.aspectRatio || "16:9",
      style: params?.style || "photographic"
    };
    
    console.log("Enviando requisição para API Luma (imagem):", JSON.stringify(requestBody, null, 2));
    
    // Criar a geração com a API direta
    const response = await fetch("https://api.lumalabs.ai/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro na API Luma (status):", response.status, response.statusText);
      console.error("Detalhes do erro:", errorText);
      throw new Error(`Erro na API Luma: ${response.status} ${response.statusText}`);
    }
    
    const generation = await response.json();
    console.log("Resposta da geração de imagem:", JSON.stringify(generation, null, 2));
    
    // Verificar se ID foi retornado
    if (!generation.id) {
      throw new Error("ID da geração não retornado pela API");
    }
    
    console.log("ID da geração de imagem criada:", generation.id);
    
    // Verificar status da geração até completar ou falhar
    let imageUrl: string | null = null;
    let completed = false;
    let attempts = 0;
    const maxAttempts = 30;
    
    while (!completed && attempts < maxAttempts) {
      attempts++;
      
      console.log(`Verificando status da imagem (tentativa ${attempts}/${maxAttempts})...`);
      
      // Verificar o status da geração
      const statusResponse = await fetch(`https://api.lumalabs.ai/v1/images/generations/${generation.id}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      });
      
      if (!statusResponse.ok) {
        console.error(`Erro ao verificar status (tentativa ${attempts}):`, statusResponse.status, statusResponse.statusText);
        
        // Se ocorrer erro, aguarde e tente novamente
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
      }
      
      const statusData = await statusResponse.json();
      console.log(`Status da imagem (${attempts}/${maxAttempts}):`, statusData?.status);
      
      if (statusData?.status === "done") {
        completed = true;
        
        // Obter a URL da imagem do objeto de resposta
        if (statusData.images && statusData.images.length > 0) {
          imageUrl = statusData.images[0].url;
          console.log("URL da imagem:", imageUrl);
        } else {
          console.log("Resposta completa:", JSON.stringify(statusData, null, 2));
          throw new Error("URLs das imagens não encontradas na resposta");
        }
      } else if (statusData?.status === "failed") {
        throw new Error(`Geração de imagem falhou: ${statusData.error?.message || "Erro desconhecido"}`);
      } else {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    if (!completed) {
      throw new Error("Tempo limite excedido para geração de imagem");
    }
    
    if (!imageUrl) {
      throw new Error("URL da imagem não disponível após conclusão");
    }
    
    return {
      content: "Imagem gerada com sucesso pelo Luma AI.",
      files: [imageUrl]
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError("IMAGE_GENERATION_ERROR", { error: errorMessage, prompt, params });
    throw error;
  }
}

// Função para gerar vídeo com Luma AI usando chamadas HTTP diretas
export async function generateVideo(
  prompt: string,
  params: any = {},
  imageUrl?: string
): Promise<ResponseData> {
  console.log("Iniciando geração de vídeo Luma AI com parâmetros:", JSON.stringify(params, null, 2));
  
  try {
    ensureValue(prompt, "O prompt para geração de vídeo não pode estar vazio");
    
    const apiKey = Deno.env.get("LUMA_API_KEY");
    if (!apiKey) {
      throw new Error("LUMA_API_KEY não configurada");
    }
    
    // Configurar parâmetros para a solicitação de vídeo
    const requestBody: any = {
      prompt: prompt,
      model: params?.model || "ray-2",
      // Converter duração de string "5s" para número 5
      duration: Number(params?.duration?.replace('s', '') || 5)
    };
    
    // Adicionar imagem para image-to-video se fornecida
    if (imageUrl && params?.videoType === "image-to-video") {
      requestBody.image = imageUrl;
    }
    
    console.log("Enviando requisição para API Luma (vídeo):", JSON.stringify(requestBody, null, 2));
    
    // Criar a geração usando API REST diretamente
    const response = await fetch("https://api.lumalabs.ai/v1/videos", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro na API Luma (status):", response.status, response.statusText);
      console.error("Detalhes do erro:", errorText);
      throw new Error(`Erro na API Luma: ${response.status} ${response.statusText}`);
    }
    
    const generation = await response.json();
    console.log("Resposta da geração de vídeo:", JSON.stringify(generation, null, 2));
    
    // Verificar se ID foi retornado
    if (!generation.id) {
      throw new Error("ID da geração não retornado pela API");
    }
    
    console.log("ID da geração de vídeo criada:", generation.id);
    
    // Verificar status da geração até completar ou falhar
    let videoUrl: string | null = null;
    let completed = false;
    let attempts = 0;
    const maxAttempts = 60; // Vídeos podem levar mais tempo
    
    while (!completed && attempts < maxAttempts) {
      attempts++;
      
      console.log(`Verificando status do vídeo (tentativa ${attempts}/${maxAttempts})...`);
      
      // Verificar o status do vídeo
      const statusResponse = await fetch(`https://api.lumalabs.ai/v1/videos/${generation.id}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      });
      
      if (!statusResponse.ok) {
        console.error(`Erro ao verificar status do vídeo (tentativa ${attempts}):`, statusResponse.status, statusResponse.statusText);
        
        // Se ocorrer erro, aguarde e tente novamente
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
      }
      
      const statusData = await statusResponse.json();
      console.log(`Status do vídeo (${attempts}/${maxAttempts}):`, statusData?.status);
      
      if (statusData?.status === "done") {
        completed = true;
        
        // Obter a URL do vídeo da resposta
        if (statusData.video && statusData.video.url) {
          videoUrl = statusData.video.url;
          console.log("URL do vídeo:", videoUrl);
        } else {
          console.log("Resposta completa:", JSON.stringify(statusData, null, 2));
          throw new Error("URL do vídeo não encontrada na resposta");
        }
      } else if (statusData?.status === "failed") {
        throw new Error(`Geração de vídeo falhou: ${statusData.error?.message || "Erro desconhecido"}`);
      } else {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    if (!completed) {
      throw new Error("Tempo limite excedido para geração de vídeo");
    }
    
    if (!videoUrl) {
      throw new Error("URL do vídeo não disponível após conclusão");
    }
    
    return {
      content: "Vídeo gerado com sucesso pelo Luma AI.",
      files: [videoUrl]
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError("VIDEO_GENERATION_ERROR", { error: errorMessage, prompt, params });
    throw error;
  }
}
