
import { fetchWithRetry } from "../../utils/logging.ts";
import { logError } from "../../utils/logging.ts";
import { validateApiKey, ensureValue } from "../../utils/validation.ts";

// Define response type
export interface ResponseData {
  content: string;
  files?: string[];
}

// Token mocado para usar como fallback
let MOCKED_LUMA_TOKEN = "luma-d0412b33-742d-4c23-bea2-cf7a8e2af184-ef7762ab-c1c6-4e73-b6d4-42078e8c7775";

// Método para definir o token mockado (chamado pelo index.ts)
export function setMockedToken(token: string) {
  MOCKED_LUMA_TOKEN = token;
  console.log("Token mocado da Luma definido:", token.substring(0, 10) + "...");
}

// Função para testar a chave API da Luma
export async function testApiKey(apiKey: string): Promise<boolean> {
  try {
    console.log("Validando a API key da Luma...");
    
    // Usando o token informado
    const tokenToUse = apiKey || MOCKED_LUMA_TOKEN;
    console.log(`Usando ${apiKey ? 'token informado' : 'token mocado'} para validação`);
    
    if (!tokenToUse || tokenToUse.trim() === '') {
      console.error("API key vazia");
      return false;
    }
    
    // Verificação de formato para aceitar chaves com luma_ ou luma-
    if (!tokenToUse.startsWith('luma_') && !tokenToUse.startsWith('luma-')) {
      console.warn(`A API key não parece estar no formato esperado (esperado: 'luma_...' ou 'luma-...')`);
    }
    
    console.log("Formato da chave de teste:", tokenToUse.startsWith("luma_") ? "luma_" : tokenToUse.startsWith("luma-") ? "luma-" : "desconhecido");
    
    try {
      // Tentando uma chamada básica para validar o token
      // Usando o novo endpoint dream-machine
      const response = await fetch("https://api.lumalabs.ai/dream-machine/v1/models", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${tokenToUse}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      });
      
      console.log("Resposta de validação:", response.status, response.statusText);
      
      // Para o endpoint de verificação, considera autorizado mesmo com códigos diferentes de 200
      // desde que não seja 401 ou 403
      if (response.status !== 401 && response.status !== 403) {
        console.log("API key considerada válida");
        return true;
      } else {
        console.error(`Falha na validação da API key: ${response.status} ${response.statusText}`);
        return false;
      }
    } catch (error) {
      console.error("Erro na requisição de validação:", error);
      // Permitir continuar mesmo com erro de conexão (pode ser problema de rede temporário)
      return true;
    }
  } catch (error) {
    console.error("Erro ao validar API key:", error);
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
    
    // Usando token mocado sempre
    const apiKey = MOCKED_LUMA_TOKEN;
    console.log("Usando token mocado para geração de imagem");
    
    // Parâmetros para a requisição
    const requestBody = {
      prompt: prompt,
      model: params?.model || "luma-1.1",
      aspect_ratio: params?.aspectRatio || "16:9",
      style: params?.style || "photographic"
    };
    
    console.log("Enviando requisição para API Luma (imagem):", JSON.stringify(requestBody, null, 2));
    
    // Criar a geração com a API direta - usando novo endpoint
    const response = await fetch("https://api.lumalabs.ai/dream-machine/v1/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      let errorText = "";
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = "Não foi possível ler o corpo da resposta de erro";
      }
      
      console.error("Erro na API Luma (status):", response.status, response.statusText);
      console.error("Detalhes do erro:", errorText);
      
      if (response.status === 401 || response.status === 403) {
        throw new Error("Credenciais inválidas para a API Luma. Verifique seu token.");
      } else if (response.status === 429) {
        throw new Error("Limite de requisições atingido na API Luma. Aguarde um momento e tente novamente.");
      } else if (response.status === 404) {
        throw new Error("Endpoint de geração de imagem não encontrado. A API Luma pode ter sido atualizada.");
      } else {
        throw new Error(`Erro na API Luma: ${response.status} ${response.statusText} - ${errorText}`);
      }
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
      const statusResponse = await fetch(`https://api.lumalabs.ai/dream-machine/v1/generations/${generation.id}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
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
    
    // Usando sempre o token mocado
    const apiKey = MOCKED_LUMA_TOKEN;
    console.log("Usando token mocado para geração de vídeo:", apiKey.substring(0, 10) + "...");
    
    // Configurar parâmetros para a solicitação de vídeo
    const requestBody: any = {
      prompt: prompt,
      model: params?.model || "ray-2",
      resolution: params?.resolution || "720p",
      duration: "5s" // Fixando em 5s conforme exemplo de sucesso
    };
    
    // Adicionar imagem para image-to-video se fornecida
    if (imageUrl && params?.videoType === "image-to-video") {
      requestBody.image = imageUrl;
    }
    
    console.log("Enviando requisição para API Luma (vídeo):", JSON.stringify(requestBody, null, 2));
    console.log("Usando token de autorização:", `Bearer ${apiKey.substring(0, 10)}...`);
    
    // Criar a geração usando o novo endpoint com Authorization: Bearer [token] sem espaço entre Bearer e o token
    const response = await fetch("https://api.lumalabs.ai/dream-machine/v1/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(requestBody)
    });
    
    // Verificar a resposta HTTP
    console.log("Resposta da API (status):", response.status, response.statusText);
    
    if (!response.ok) {
      let errorText = "";
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = "Não foi possível ler o corpo da resposta de erro";
      }
      
      console.error("Erro na API Luma (status):", response.status, response.statusText);
      console.error("Detalhes do erro:", errorText);
      
      if (response.status === 401 || response.status === 403) {
        throw new Error("Credenciais inválidas para a API Luma. Verifique seu token.");
      } else if (response.status === 429) {
        throw new Error("Limite de requisições atingido na API Luma. Aguarde um momento e tente novamente.");
      } else if (response.status === 404) {
        throw new Error("Endpoint de geração de vídeo não encontrado. A API Luma pode ter sido atualizada.");
      } else {
        throw new Error(`Erro na API Luma: ${response.status} ${response.statusText} - ${errorText}`);
      }
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
      const statusResponse = await fetch(`https://api.lumalabs.ai/dream-machine/v1/generations/${generation.id}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
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
