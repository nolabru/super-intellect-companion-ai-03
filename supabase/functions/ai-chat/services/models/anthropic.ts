
import { logError } from "../../utils/logging.ts";
import { validateApiKey } from "../../utils/validation.ts";
import { Anthropic } from "https://esm.sh/@anthropic-ai/sdk@0.19.0";

// Define response type
export interface ResponseData {
  content: string;
  files?: string[];
}

// Function to verify if Anthropic API key is configured
export function verifyApiKey(): string {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY não está configurada. Por favor, adicione sua chave API da Anthropic nas configurações.");
  }
  return apiKey;
}

// Function to generate text response with Anthropic
export async function generateText(
  prompt: string,
  modelId: string = "claude-3-opus"
): Promise<ResponseData> {
  try {
    // Validate Anthropic API key
    const apiKey = verifyApiKey();
    validateApiKey("ANTHROPIC_API_KEY", apiKey);
    
    console.log(`Iniciando solicitação de texto ao modelo ${modelId} da Anthropic`);
    
    // Instantiate Anthropic client with API key
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });
    
    // Create message for Claude model
    const response = await anthropic.messages.create({
      model: modelId,
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });
    
    // Extract response content
    const content = response.content.length > 0 && response.content[0].type === "text"
      ? response.content[0].text
      : "Não foi possível gerar uma resposta.";
    
    console.log(`Resposta Anthropic recebida (${content.length} caracteres)`);
    
    return {
      content: content
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError("ANTHROPIC_TEXT_ERROR", { error: errorMessage, model: modelId });
    throw new Error(`Erro ao gerar texto com Anthropic: ${errorMessage}`);
  }
}

// Function to process image with Claude Vision
export async function processImage(
  prompt: string,
  imageUrl: string,
  modelId: string = "claude-3-opus"
): Promise<ResponseData> {
  try {
    // Validate Anthropic API key
    const apiKey = verifyApiKey();
    validateApiKey("ANTHROPIC_API_KEY", apiKey);
    
    console.log(`Iniciando análise de imagem com ${modelId}, URL da imagem: ${imageUrl}`);
    
    // Instantiate Anthropic client with API key
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });
    
    // Fetch image data
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Erro ao carregar imagem: ${imageResponse.statusText}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    
    // Create message with image content for Claude Vision
    const response = await anthropic.messages.create({
      model: modelId,
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: contentType,
                data: base64Image
              }
            }
          ]
        }
      ],
      temperature: 0.7,
    });
    
    // Extract response content
    const content = response.content.length > 0 && response.content[0].type === "text"
      ? response.content[0].text
      : "Não foi possível analisar a imagem.";
    
    console.log(`Análise de imagem concluída (${content.length} caracteres)`);
    
    return {
      content: content
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError("ANTHROPIC_VISION_ERROR", { error: errorMessage, model: modelId, imageUrl });
    throw new Error(`Erro ao analisar imagem com Anthropic: ${errorMessage}`);
  }
}
