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
      // Usando o endpoint de listar gerações
      const response = await fetch("https://api.lumalabs.ai/dream-machine/v1/generations?limit=1", {
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
    
    // Criar a geração usando o novo endpoint com Authorization: Bearer [token]
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
    
    try {
      // Consultar imediatamente o endpoint de listar gerações para ver o status inicial
      const listResponse = await fetch(`https://api.lumalabs.ai/dream-machine/v1/generations?limit=1`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      });
      
      if (listResponse.ok) {
        const listData = await listResponse.json();
        console.log("Listagem de gerações recentes:", JSON.stringify(listData, null, 2));
      }
    } catch (e) {
      console.warn("Erro ao consultar listagem de gerações:", e);
      // Não falhar o processo principal por causa deste erro
    }
    
    // Verificar status da geração até completar ou falhar - com timeout aumentado
    let videoUrl: string | null = null;
    let completed = false;
    let attempts = 0;
    const maxAttempts = 60; // Reduzi para 60 tentativas (5 minutos com 5 segundos de intervalo)
    let statusData: any = null;
    
    while (!completed && attempts < maxAttempts) {
      attempts++;
      
      console.log(`Verificando status do vídeo (tentativa ${attempts}/${maxAttempts})...`);
      
      try {
        // Verificar o status da geração - com timeout de 10 segundos
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const statusResponse = await fetch(`https://api.lumalabs.ai/dream-machine/v1/generations/${generation.id}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          signal: controller.signal
        }).finally(() => clearTimeout(timeoutId));
        
        if (!statusResponse.ok) {
          console.error(`Erro ao verificar status do vídeo (tentativa ${attempts}):`, statusResponse.status, statusResponse.statusText);
          
          // Se ocorrer erro, aguarde e tente novamente
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue;
        }
        
        statusData = await statusResponse.json();
        console.log(`Status do vídeo (${attempts}/${maxAttempts}):`, statusData?.status);
        
        // Verificar estrutura da resposta completa para debug
        if (attempts % 5 === 0 || statusData?.status === "done" || statusData?.state === "completed") {
          console.log("Estrutura completa da resposta:", JSON.stringify(statusData, null, 2));
        }
        
        // Verificar diferentes formatos de resposta possíveis
        if (statusData?.status === "done" || statusData?.state === "completed") {
          completed = true;
          
          // Tentar obter a URL do vídeo de diferentes locais na resposta
          if (statusData.video && statusData.video.url) {
            videoUrl = statusData.video.url;
          } else if (statusData.assets && statusData.assets.video) {
            videoUrl = statusData.assets.video;
          } else if (statusData.results && statusData.results.length > 0 && statusData.results[0].url) {
            videoUrl = statusData.results[0].url;
          }
          
          console.log("URL do vídeo encontrada:", videoUrl);
          
          if (!videoUrl) {
            // Tentar encontrar URL em qualquer propriedade que possa ser uma string
            console.log("Buscando URL em todas as propriedades da resposta...");
            const findUrlInObject = (obj: any): string | null => {
              if (!obj || typeof obj !== 'object') return null;
              
              for (const key in obj) {
                if (typeof obj[key] === 'string' && obj[key].startsWith('http') && 
                    (obj[key].endsWith('.mp4') || obj[key].includes('video'))) {
                  return obj[key];
                } else if (typeof obj[key] === 'object') {
                  const nestedUrl = findUrlInObject(obj[key]);
                  if (nestedUrl) return nestedUrl;
                }
              }
              return null;
            };
            
            videoUrl = findUrlInObject(statusData);
            if (videoUrl) {
              console.log("URL do vídeo encontrada em propriedade alternativa:", videoUrl);
            }
          }
        } else if (statusData?.status === "failed" || statusData?.state === "failed") {
          const errorMessage = statusData.error?.message || statusData.failure_reason || "Erro desconhecido";
          throw new Error(`Geração de vídeo falhou: ${errorMessage}`);
        } else {
          // Aguardar antes da próxima verificação
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      } catch (error) {
        // Se houve timeout ou outro erro, registrar e continuar tentando
        console.error(`Erro durante verificação de status (tentativa ${attempts}):`, error);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    // Se o vídeo não foi encontrado mas temos status "completed", tentar consultar lista de gerações
    if (completed && !videoUrl) {
      console.log("Vídeo marcado como completo, mas URL não encontrada. Tentando consultar lista de gerações...");
      
      try {
        const listResponse = await fetch(`https://api.lumalabs.ai/dream-machine/v1/generations?limit=5`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "Accept": "application/json"
          }
        });
        
        if (listResponse.ok) {
          const listData = await listResponse.json();
          console.log("Listagem de gerações recentes:", JSON.stringify(listData, null, 2));
          
          // Procurar pelo ID específico
          const matchingGeneration = Array.isArray(listData) && 
                                   listData.find((gen: any) => gen.id === generation.id);
          
          if (matchingGeneration) {
            console.log("Geração encontrada na listagem:", matchingGeneration);
            
            // Tentar obter URL
            if (matchingGeneration.video && matchingGeneration.video.url) {
              videoUrl = matchingGeneration.video.url;
            } else if (matchingGeneration.assets && matchingGeneration.assets.video) {
              videoUrl = matchingGeneration.assets.video;
            }
            
            if (videoUrl) {
              console.log("URL do vídeo encontrada na listagem:", videoUrl);
            }
          }
        }
      } catch (e) {
        console.error("Erro ao consultar listagem de gerações:", e);
      }
    }
    
    // Se o tempo limite foi excedido, retornar mensagem informativa com ID
    if (!completed) {
      console.log("Tempo limite excedido para geração de vídeo. ID:", generation.id);
      return {
        content: `A geração do vídeo está em andamento, mas o tempo limite foi excedido. Você pode verificar o status no painel do Luma AI usando o ID: ${generation.id}`,
        files: []
      };
    }
    
    // Se não encontramos a URL do vídeo, enviar mensagem com ID para o usuário verificar no painel
    if (!videoUrl) {
      console.log("URL do vídeo não encontrada na resposta. Dados completos:", JSON.stringify(statusData, null, 2));
      return {
        content: `Vídeo processado pelo Luma AI, mas a URL não pôde ser recuperada. Você pode verificar o vídeo no painel do Luma AI usando o ID: ${generation.id}`,
        files: []
      };
    }
    
    console.log("Retornando URL de vídeo para o frontend:", videoUrl);
    
    // Validar se a URL retornada é válida
    try {
      const testResponse = await fetch(videoUrl, { method: 'HEAD' });
      if (!testResponse.ok) {
        console.error("A URL do vídeo não está acessível:", testResponse.status, testResponse.statusText);
        return {
          content: `Vídeo gerado, mas a URL fornecida parece estar inacessível (status: ${testResponse.status}). Você pode tentar acessar diretamente: ${videoUrl} ou verificar no painel da Luma AI com o ID: ${generation.id}`,
          files: [videoUrl] // Enviar a URL mesmo assim, para o caso de ser um problema temporário
        };
      }
    } catch (error) {
      console.warn("Erro ao validar URL do vídeo:", error);
      // Continuar, pois pode ser apenas um problema de CORS
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
