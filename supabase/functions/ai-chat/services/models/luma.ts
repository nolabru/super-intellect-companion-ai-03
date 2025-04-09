
import { fetchWithRetry } from "../../utils/logging.ts";
import { logError } from "../../utils/logging.ts";
import { validateApiKey } from "../../utils/validation.ts";

// Define response type
export interface ResponseData {
  content: string;
  files?: string[];
}

// Função para gerar imagem com Luma AI
export async function generateImage(
  prompt: string,
  params: any = {}
): Promise<ResponseData> {
  console.log("Iniciando geração de imagem Luma AI com parâmetros:", JSON.stringify(params, null, 2));
  
  const apiKey = Deno.env.get("LUMA_API_KEY");
  validateApiKey("LUMA_API_KEY", apiKey);
  console.log(`Usando LUMA_API_KEY: ${apiKey ? apiKey.substring(0, 7) + "..." : "Não encontrada"}`);
  
  try {
    // Configurar o payload da requisição com base na documentação oficial da Luma
    const payload = {
      prompt: prompt,
      modelId: params?.model || "luma-1.1",
      width: 1024,
      height: 1024,
      numImages: 1
    };
    
    console.log("Enviando requisição para API Luma (imagem):", JSON.stringify(payload, null, 2));
    
    // Endpoint verificado da API Luma para geração de imagem
    const generationResponse = await fetchWithRetry(
      "https://api.lumalabs.ai/images",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      },
      3,
      2000
    );
    
    if (!generationResponse.ok) {
      const errorText = await generationResponse.text();
      console.error(`Erro na resposta da API Luma (${generationResponse.status}):`, errorText);
      throw new Error(`Erro na API Luma: ${generationResponse.status} - ${errorText}`);
    }
    
    const generationData = await generationResponse.json();
    console.log("Resposta da API Luma (imagem):", JSON.stringify(generationData, null, 2));
    
    // Extrair o ID da geração da resposta
    const generationId = generationData.id;
    if (!generationId) {
      throw new Error("ID de geração não encontrado na resposta da API");
    }
    
    console.log("ID de geração de imagem:", generationId);
    
    // Verificar status da geração até completar ou falhar
    let imageUrl: string | null = null;
    let completed = false;
    let attempts = 0;
    const maxAttempts = 30;
    
    while (!completed && attempts < maxAttempts) {
      attempts++;
      
      console.log(`Verificando status da imagem (tentativa ${attempts}/${maxAttempts})...`);
      
      // Endpoint verificado para verificar status da imagem
      const statusResponse = await fetchWithRetry(
        `https://api.lumalabs.ai/images/${generationId}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
          },
        },
        3,
        1000
      );
      
      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error(`Erro ao verificar status da imagem (${statusResponse.status}):`, errorText);
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
      }
      
      const statusData = await statusResponse.json();
      console.log(`Status da imagem (${attempts}/${maxAttempts}):`, statusData.status);
      
      if (statusData.status === "done") {
        completed = true;
        
        // Obter a URL da imagem do objeto de resposta
        if (statusData.images && statusData.images.length > 0) {
          imageUrl = statusData.images[0].url;
          console.log("URL da imagem:", imageUrl);
        } else {
          console.log("Resposta completa:", JSON.stringify(statusData, null, 2));
          throw new Error("URLs das imagens não encontradas na resposta");
        }
      } else if (statusData.status === "failed") {
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

// Função para gerar vídeo com Luma AI
export async function generateVideo(
  prompt: string,
  params: any = {},
  imageUrl?: string
): Promise<ResponseData> {
  console.log("Iniciando geração de vídeo Luma AI com parâmetros:", JSON.stringify(params, null, 2));
  
  const apiKey = Deno.env.get("LUMA_API_KEY");
  validateApiKey("LUMA_API_KEY", apiKey);
  console.log(`Usando LUMA_API_KEY: ${apiKey ? apiKey.substring(0, 7) + "..." : "Não encontrada"}`);
  
  try {
    // Configurar o payload da requisição com base na documentação oficial da Luma
    const payload: any = {
      prompt: prompt,
      modelId: params?.model || "ray-2",
      duration: Number(params?.duration?.replace('s', '')) || 4
    };
    
    // Adicionar imagem para image-to-video se fornecida
    if (imageUrl && params?.videoType === "image-to-video") {
      payload.image = imageUrl;
    }
    
    console.log("Enviando requisição para API Luma (vídeo):", JSON.stringify(payload, null, 2));
    
    // Endpoint verificado para criação de vídeo
    const generationResponse = await fetchWithRetry(
      "https://api.lumalabs.ai/videos",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      },
      3,
      2000
    );
    
    if (!generationResponse.ok) {
      const errorText = await generationResponse.text();
      console.error(`Erro na resposta da API Luma (${generationResponse.status}):`, errorText);
      throw new Error(`Erro na API Luma: ${generationResponse.status} - ${errorText}`);
    }
    
    const generationData = await generationResponse.json();
    console.log("Resposta da API Luma (vídeo):", JSON.stringify(generationData, null, 2));
    
    // Extrair o ID da geração da resposta
    const generationId = generationData.id;
    if (!generationId) {
      throw new Error("ID de geração não encontrado na resposta da API");
    }
    
    console.log("ID de geração de vídeo:", generationId);
    
    // Verificar status da geração até completar ou falhar
    let videoUrl: string | null = null;
    let completed = false;
    let attempts = 0;
    const maxAttempts = 60; // Vídeos podem levar mais tempo
    
    while (!completed && attempts < maxAttempts) {
      attempts++;
      
      console.log(`Verificando status do vídeo (tentativa ${attempts}/${maxAttempts})...`);
      
      // Endpoint verificado para verificar status do vídeo
      const statusResponse = await fetchWithRetry(
        `https://api.lumalabs.ai/videos/${generationId}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
          },
        },
        3,
        1000
      );
      
      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error(`Erro ao verificar status do vídeo (${statusResponse.status}):`, errorText);
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
      }
      
      const statusData = await statusResponse.json();
      console.log(`Status do vídeo (${attempts}/${maxAttempts}):`, statusData.status);
      
      if (statusData.status === "done") {
        completed = true;
        
        // Obter a URL do vídeo do objeto de resposta - estrutura correta para a API
        if (statusData.video && statusData.video.url) {
          videoUrl = statusData.video.url;
          console.log("URL do vídeo:", videoUrl);
        } else {
          console.log("Resposta completa:", JSON.stringify(statusData, null, 2));
          throw new Error("URL do vídeo não encontrada na resposta");
        }
      } else if (statusData.status === "failed") {
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

// Testar a chave API da Luma
export async function testApiKey(apiKey: string): Promise<boolean> {
  try {
    console.log("Validando a API key da Luma...");
    
    // Endpoint para testar a API key
    const testResponse = await fetch("https://api.lumalabs.ai/profile", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });
    
    if (!testResponse.ok) {
      console.error(`Erro ao validar API key: ${testResponse.status}`);
      return false;
    }
    
    console.log("API key validada com sucesso!");
    return true;
  } catch (error) {
    console.error("Erro ao testar API key:", error);
    return false;
  }
}
