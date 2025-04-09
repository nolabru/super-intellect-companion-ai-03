
import { fetchWithRetry } from "../../utils/logging.ts";
import { logError } from "../../utils/logging.ts";
import { validateApiKey, ensureValue } from "../../utils/validation.ts";
import LumaAI from "npm:lumaai";

// Define response type
export interface ResponseData {
  content: string;
  files?: string[];
}

// Função para criar e gerenciar o cliente Luma
function createLumaClient() {
  try {
    const apiKey = Deno.env.get("LUMA_API_KEY");
    console.log("Attempting to get LUMA_API_KEY from environment...");
    
    validateApiKey("LUMA_API_KEY", apiKey);
    
    // Cria cliente com a API key do ambiente
    console.log("Inicializando cliente LumaAI SDK...");
    const client = new LumaAI({
      authToken: apiKey,
      maxRetries: 2,
    });
    
    return client;
  } catch (error) {
    console.error("Erro ao criar cliente Luma:", error);
    throw error;
  }
}

// Função para testar a chave API da Luma
export async function testApiKey(apiKey: string): Promise<boolean> {
  try {
    console.log("Validando a API key da Luma...");
    
    if (!apiKey || apiKey.trim() === '') {
      console.error("API key vazia");
      return false;
    }
    
    // Criar um cliente de teste com a API key fornecida
    console.log("Criando cliente de teste Luma com a chave fornecida...");
    const testClient = new LumaAI({
      authToken: apiKey,
    });
    
    // Tente fazer uma requisição simples para validar a API key
    try {
      console.log("Tentando listar gerações para validar API key...");
      await testClient.generations.list();
      console.log("API key validada com sucesso!");
      return true;
    } catch (error) {
      console.error("Erro ao validar API key:", error);
      if (error instanceof LumaAI.APIError) {
        // 401 ou 403 indicam problemas com a API key
        if (error.status === 401 || error.status === 403) {
          console.error("API key inválida ou sem permissões");
          return false;
        }
      }
      
      // Se não for um erro de autenticação, considere válido (pode ser outro tipo de erro)
      // em um ambiente de produção real, precisaríamos lidar com isso de forma diferente
      console.warn("Erro não relacionado à autenticação, considerando chave válida");
      return true;
    }
  } catch (error) {
    console.error("Erro ao configurar teste de API key:", error);
    return false;
  }
}

// Função para gerar imagem com Luma AI
export async function generateImage(
  prompt: string,
  params: any = {}
): Promise<ResponseData> {
  console.log("Iniciando geração de imagem Luma AI com parâmetros:", JSON.stringify(params, null, 2));
  
  try {
    ensureValue(prompt, "O prompt para geração de imagem não pode estar vazio");
    
    const client = createLumaClient();
    
    // Parâmetros para a geração de imagem
    const requestParams: any = {
      prompt: prompt,
      model: params?.model || "luma-1.1",
      aspect_ratio: params?.aspectRatio || "16:9",
      style: params?.style || "photographic"
    };
    
    console.log("Enviando requisição para SDK Luma (imagem):", JSON.stringify(requestParams, null, 2));
    
    // Iniciar a geração da imagem
    const generation = await client.generations.create(requestParams)
      .catch((err) => {
        if (err instanceof LumaAI.APIError) {
          console.error(`Erro na API Luma: ${err.status} - ${err.name}`, err.message);
          throw new Error(`Erro na API Luma: ${err.status} - ${err.message}`);
        } else {
          throw err;
        }
      });
    
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
      const statusData = await client.generations.get(generation.id)
        .catch((err) => {
          console.error(`Erro ao verificar status (tentativa ${attempts}):`, err);
          throw new Error(`Erro ao verificar status: ${err.message}`);
        });
      
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
  
  try {
    ensureValue(prompt, "O prompt para geração de vídeo não pode estar vazio");
    
    const client = createLumaClient();
    
    // Configurar parâmetros para a solicitação de vídeo
    const requestParams: any = {
      prompt: prompt,
      model: params?.model || "ray-2",
      // Converter duração de string "5s" para número 5
      duration: Number(params?.duration?.replace('s', '') || 5)
    };
    
    // Adicionar imagem para image-to-video se fornecida
    if (imageUrl && params?.videoType === "image-to-video") {
      requestParams.image = imageUrl;
    }
    
    console.log("Enviando requisição para SDK Luma (vídeo):", JSON.stringify(requestParams, null, 2));
    
    // Criar a geração de vídeo
    const generation = await client.videos.create(requestParams)
      .catch((err) => {
        if (err instanceof LumaAI.APIError) {
          console.error(`Erro na API Luma: ${err.status} - ${err.name}`, err.message);
          throw new Error(`Erro na API Luma: ${err.status} - ${err.message}`);
        } else {
          throw err;
        }
      });
    
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
      const statusData = await client.videos.get(generation.id)
        .catch((err) => {
          console.error(`Erro ao verificar status do vídeo (tentativa ${attempts}):`, err);
          // Continuar tentando mesmo com erro
          return { status: "processing" };
        });
      
      console.log(`Status do vídeo (${attempts}/${maxAttempts}):`, statusData.status);
      
      if (statusData.status === "done") {
        completed = true;
        
        // Obter a URL do vídeo da resposta
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
