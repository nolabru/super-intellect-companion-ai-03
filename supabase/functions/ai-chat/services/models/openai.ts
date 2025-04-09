
import { logError } from "../../utils/logging.ts";
import { validateApiKey } from "../../utils/validation.ts";
import { OpenAI } from "https://esm.sh/openai@4.29.0";

// Define response type
export interface ResponseData {
  content: string;
  files?: string[];
}

// Function to verify if OpenAI API key is configured
export function verifyApiKey(): string {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY não está configurada. Por favor, adicione sua chave API do OpenAI nas configurações.");
  }
  return apiKey;
}

// Function to generate text response with OpenAI
export async function generateText(
  prompt: string,
  modelId: string = "gpt-4o"
): Promise<ResponseData> {
  try {
    // Validate OpenAI API key
    const apiKey = verifyApiKey();
    validateApiKey("OPENAI_API_KEY", apiKey);
    
    console.log(`Iniciando solicitação de texto ao modelo ${modelId} da OpenAI`);
    
    // Instantiate OpenAI client with API key
    const openai = new OpenAI({
      apiKey: apiKey,
    });
    
    // Create chat completion request
    const response = await openai.chat.completions.create({
      model: modelId,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });
    
    // Extract response content
    const content = response.choices[0]?.message?.content || "Não foi possível gerar uma resposta.";
    console.log(`Resposta OpenAI recebida (${content.length} caracteres)`);
    
    return {
      content: content
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError("OPENAI_TEXT_ERROR", { error: errorMessage, model: modelId });
    throw new Error(`Erro ao gerar texto com OpenAI: ${errorMessage}`);
  }
}

// Function to process image with GPT-4 Vision
export async function processImage(
  prompt: string,
  imageUrl: string,
  modelId: string = "gpt-4o"
): Promise<ResponseData> {
  try {
    // Validate OpenAI API key
    const apiKey = verifyApiKey();
    validateApiKey("OPENAI_API_KEY", apiKey);
    
    console.log(`Iniciando análise de imagem com ${modelId}, URL da imagem: ${imageUrl}`);
    
    // Instantiate OpenAI client with API key
    const openai = new OpenAI({
      apiKey: apiKey,
    });
    
    // Create chat completion request with image content
    const response = await openai.chat.completions.create({
      model: modelId,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageUrl } }
          ],
        },
      ],
      max_tokens: 1000,
    });
    
    // Extract response content
    const content = response.choices[0]?.message?.content || "Não foi possível analisar a imagem.";
    console.log(`Análise de imagem concluída (${content.length} caracteres)`);
    
    return {
      content: content
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError("OPENAI_VISION_ERROR", { error: errorMessage, model: modelId, imageUrl });
    throw new Error(`Erro ao analisar imagem com OpenAI: ${errorMessage}`);
  }
}

// Function to download an image and return as base64
async function downloadImage(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Falha ao baixar imagem: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const contentType = response.headers.get("content-type") || "image/png";
    
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error("Erro ao baixar imagem:", error);
    throw error;
  }
}

// Function to generate image with DALL-E
export async function generateImage(
  prompt: string,
  modelId: string = "dall-e-3",
  size: string = "1024x1024"
): Promise<ResponseData> {
  try {
    // Validate OpenAI API key
    const apiKey = verifyApiKey();
    validateApiKey("OPENAI_API_KEY", apiKey);
    
    console.log(`Iniciando geração de imagem com DALL-E. Prompt: "${prompt.substring(0, 50)}..."`);
    
    // Instantiate OpenAI client with API key
    const openai = new OpenAI({
      apiKey: apiKey,
    });
    
    // Call image generation API
    const response = await openai.images.generate({
      model: modelId === "gpt-4o" ? "dall-e-3" : modelId,
      prompt: prompt,
      n: 1,
      size: size as "1024x1024" | "1792x1024" | "1024x1792",
      quality: "standard",
      response_format: "url",
    });
    
    // Extract image URL
    const imageUrl = response.data[0]?.url;
    if (!imageUrl) {
      throw new Error("Não foi possível obter a URL da imagem gerada.");
    }
    
    console.log(`Imagem gerada com sucesso. URL: ${imageUrl}`);
    
    // Download imagem em base64 para evitar problemas com expiração do link
    try {
      const base64Image = await downloadImage(imageUrl);
      console.log("Imagem convertida para base64 com sucesso");
      
      return {
        content: `Imagem gerada com sucesso.\n\n[Imagem gerada]: ${imageUrl}`,
        files: [base64Image]
      };
    } catch (dlError) {
      console.error("Erro ao baixar imagem como base64:", dlError);
      // Fallback para o URL original se falhar o download
      return {
        content: `Imagem gerada com sucesso.\n\n[Imagem gerada]: ${imageUrl}`,
        files: [imageUrl]
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError("OPENAI_IMAGE_GENERATION_ERROR", { error: errorMessage, model: modelId });
    throw new Error(`Erro ao gerar imagem com DALL-E: ${errorMessage}`);
  }
}
