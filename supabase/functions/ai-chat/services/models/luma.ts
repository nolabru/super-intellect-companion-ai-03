
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
  
  console.log(`Chave API Luma: ${apiKey ? "Configurada corretamente" : "Não encontrada"}`);
  
  // Configure request payload exatamente como na documentação
  const payload = {
    prompt: prompt,
    model: params?.model || "ray-1",
  };
  
  if (params?.style) {
    payload.style = params.style;
  }
  
  if (params?.aspectRatio) {
    payload.aspect_ratio = params.aspectRatio;
  }
  
  console.log("Enviando requisição para API Luma (imagem):", JSON.stringify(payload, null, 2));
  
  try {
    // Create generation usando o endpoint correto da documentação
    const generationResponse = await fetchWithRetry(
      "https://api.lumalabs.ai/image",
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
    
    const generationId = generationData.id;
    
    if (!generationId) {
      throw new Error("ID de geração não encontrado na resposta da API");
    }
    
    console.log("ID de geração de imagem:", generationId);
    
    // Poll for completion
    let imageUrl: string | null = null;
    let completed = false;
    let attempts = 0;
    const maxAttempts = 30;
    
    while (!completed && attempts < maxAttempts) {
      attempts++;
      
      console.log(`Verificando status da imagem (tentativa ${attempts}/${maxAttempts})...`);
      
      const statusResponse = await fetchWithRetry(
        `https://api.lumalabs.ai/image/${generationId}`,
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
      console.log(`Status da imagem (${attempts}/${maxAttempts}):`, statusData.state);
      
      if (statusData.state === "complete") {
        completed = true;
        
        if (statusData.output_url) {
          imageUrl = statusData.output_url;
        } else if (statusData.output) {
          imageUrl = statusData.output;
        } else {
          console.log("Resposta completa:", JSON.stringify(statusData, null, 2));
          throw new Error("URL da imagem não encontrada na resposta");
        }
        
        console.log("URL da imagem:", imageUrl);
      } else if (statusData.state === "failed") {
        throw new Error(`Geração de imagem falhou: ${statusData.error || "Erro desconhecido"}`);
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
  
  console.log(`Chave API Luma: ${apiKey ? "Configurada corretamente" : "Não encontrada"}`);
  
  const isImageToVideo = params?.videoType === "image-to-video" && imageUrl;
  
  // Configure request payload exatamente como na documentação
  const payload: any = {
    prompt: prompt,
    model: params?.model || "ray-1",
  };
  
  // Adicionar parâmetros conforme documentação
  if (params?.resolution) {
    payload.resolution = params.resolution;
  }
  
  if (params?.duration) {
    payload.duration = params.duration;
  }
  
  // Adicionar imagem para image-to-video
  if (isImageToVideo && imageUrl) {
    payload.init_image_url = imageUrl;
  }
  
  console.log("Enviando requisição para API Luma (vídeo):", JSON.stringify(payload, null, 2));
  
  try {
    // Usar o endpoint correto da documentação
    const generationResponse = await fetchWithRetry(
      "https://api.lumalabs.ai/video",
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
    
    const generationId = generationData.id;
    
    if (!generationId) {
      throw new Error("ID de geração não encontrado na resposta da API");
    }
    
    console.log("ID de geração de vídeo:", generationId);
    
    // Poll for completion
    let videoUrl: string | null = null;
    let completed = false;
    let attempts = 0;
    const maxAttempts = 60; // Vídeos podem levar mais tempo
    
    while (!completed && attempts < maxAttempts) {
      attempts++;
      
      console.log(`Verificando status do vídeo (tentativa ${attempts}/${maxAttempts})...`);
      
      const statusResponse = await fetchWithRetry(
        `https://api.lumalabs.ai/video/${generationId}`,
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
      console.log(`Status do vídeo (${attempts}/${maxAttempts}):`, statusData.state);
      
      if (statusData.state === "complete") {
        completed = true;
        
        if (statusData.output_url) {
          videoUrl = statusData.output_url;
        } else if (statusData.output) {
          videoUrl = statusData.output;
        } else {
          console.log("Resposta completa:", JSON.stringify(statusData, null, 2));
          throw new Error("URL do vídeo não encontrada na resposta");
        }
        
        console.log("URL do vídeo:", videoUrl);
      } else if (statusData.state === "failed") {
        throw new Error(`Geração de vídeo falhou: ${statusData.error || "Erro desconhecido"}`);
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
    
    const testResponse = await fetch("https://api.lumalabs.ai/user", {
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
