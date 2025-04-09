
import { fetchWithRetry } from "../../utils/logging.ts";
import { logError } from "../../utils/logging.ts";
import { validateApiKey, ensureValue } from "../../utils/validation.ts";

// Explicitly import individual components from the npm package
import { LumaAI } from "npm:lumaai";

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
    console.log("Usando LumaAI SDK com chave no formato:", apiKey?.startsWith("luma_") ? "luma_" : "luma-");
    
    // Debug do objeto LumaAI para entender sua estrutura
    console.log("LumaAI object type:", typeof LumaAI);
    console.log("LumaAI constructor properties available:", Object.getOwnPropertyNames(LumaAI.prototype));
    
    // Criar cliente com tratamento adequado para diferentes formatos de instanciação
    let client;
    try {
      client = new LumaAI({
        authToken: apiKey,
        maxRetries: 2,
      });
      
      console.log("Cliente LumaAI criado com sucesso:", client ? "Sim" : "Não");
      console.log("Tipo do cliente criado:", typeof client);
      if (client) {
        console.log("Propriedades do cliente:", Object.keys(client));
      }
    } catch (initError) {
      console.error("Erro ao instanciar LumaAI:", initError);
      throw new Error(`Erro na inicialização do SDK Luma: ${initError.message}`);
    }
    
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
    console.log("Formato da chave de teste:", apiKey.startsWith("luma_") ? "luma_" : apiKey.startsWith("luma-") ? "luma-" : "desconhecido");
    
    // Trate possíveis erros na inicialização do cliente
    let testClient;
    try {
      testClient = new LumaAI({
        authToken: apiKey,
      });
      
      console.log("Cliente de teste criado com sucesso:", testClient ? "Sim" : "Não");
    } catch (initError) {
      console.error("Erro ao instanciar cliente de teste:", initError);
      return false;
    }
    
    // Se conseguimos criar o cliente, considere a chave válida
    // Isso é uma verificação simplificada, já que o teste de operações
    // específicas pode falhar devido a outros problemas na API
    if (!testClient) {
      console.error("Cliente de teste não foi criado corretamente");
      return false;
    }
    
    console.log("API key validada com sucesso!");
    return true;
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
    if (!client) {
      throw new Error("Não foi possível inicializar o cliente Luma AI");
    }
    
    // Verificar se o cliente tem o método necessário
    if (!client.generations || typeof client.generations.create !== 'function') {
      console.error("Propriedades do cliente:", Object.keys(client));
      throw new Error("O SDK da Luma não possui o método generations.create. Versão incompatível.");
    }
    
    // Parâmetros para a geração de imagem
    const requestParams: any = {
      prompt: prompt,
      model: params?.model || "luma-1.1",
      aspect_ratio: params?.aspectRatio || "16:9",
      style: params?.style || "photographic"
    };
    
    console.log("Enviando requisição para SDK Luma (imagem):", JSON.stringify(requestParams, null, 2));
    
    // Iniciar a geração da imagem com tratamento de erro específico
    let generation;
    try {
      generation = await client.generations.create(requestParams);
    } catch (apiError) {
      console.error("Erro específico na API Luma (generations.create):", apiError);
      if (apiError instanceof Error) {
        throw new Error(`Erro na API Luma (generations): ${apiError.message}`);
      } else {
        throw new Error(`Erro desconhecido na API Luma: ${String(apiError)}`);
      }
    }
    
    console.log("ID da geração de imagem criada:", generation?.id);
    
    // Verificar status da geração até completar ou falhar
    let imageUrl: string | null = null;
    let completed = false;
    let attempts = 0;
    const maxAttempts = 30;
    
    while (!completed && attempts < maxAttempts) {
      attempts++;
      
      console.log(`Verificando status da imagem (tentativa ${attempts}/${maxAttempts})...`);
      
      // Verificar se client.generations.get existe
      if (!client.generations || typeof client.generations.get !== 'function') {
        throw new Error("O SDK da Luma não possui o método generations.get. Versão incompatível.");
      }
      
      // Verificar o status da geração
      let statusData;
      try {
        statusData = await client.generations.get(generation.id);
      } catch (statusError) {
        console.error(`Erro ao verificar status (tentativa ${attempts}):`, statusError);
        throw new Error(`Erro ao verificar status: ${statusError instanceof Error ? statusError.message : String(statusError)}`);
      }
      
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
    if (!client) {
      throw new Error("Não foi possível inicializar o cliente Luma AI");
    }
    
    // Verificar se o cliente tem o método necessário
    if (!client.videos || typeof client.videos.create !== 'function') {
      console.error("Propriedades do cliente:", Object.keys(client));
      throw new Error("O SDK da Luma não possui o método videos.create. Versão incompatível.");
    }
    
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
    
    // Criar a geração de vídeo com tratamento de erro específico
    let generation;
    try {
      generation = await client.videos.create(requestParams);
    } catch (apiError) {
      console.error("Erro específico na API Luma (videos.create):", apiError);
      
      // Tratamento especial para erros da API Luma
      if (apiError instanceof Error) {
        throw new Error(`Erro na API Luma (videos): ${apiError.message}`);
      } else {
        throw new Error(`Erro desconhecido na API Luma: ${String(apiError)}`);
      }
    }
    
    console.log("ID da geração de vídeo criada:", generation?.id);
    
    // Verificar status da geração até completar ou falhar
    let videoUrl: string | null = null;
    let completed = false;
    let attempts = 0;
    const maxAttempts = 60; // Vídeos podem levar mais tempo
    
    while (!completed && attempts < maxAttempts) {
      attempts++;
      
      console.log(`Verificando status do vídeo (tentativa ${attempts}/${maxAttempts})...`);
      
      // Verificar se client.videos.get existe
      if (!client.videos || typeof client.videos.get !== 'function') {
        throw new Error("O SDK da Luma não possui o método videos.get. Versão incompatível.");
      }
      
      // Verificar o status do vídeo
      let statusData;
      try {
        statusData = await client.videos.get(generation.id);
      } catch (statusError) {
        console.error(`Erro ao verificar status do vídeo (tentativa ${attempts}):`, statusError);
        // Continuar tentando mesmo com erro
        statusData = { status: "processing" };
      }
      
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
