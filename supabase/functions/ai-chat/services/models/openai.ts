
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

// Function to generate text response with OpenAI using streaming
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
    
    // Create chat completion request with streaming
    const response = await openai.chat.completions.create({
      model: modelId,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      stream: true,
    });
    
    console.log(`Iniciando streaming de resposta do modelo ${modelId}`);
    
    // Process the stream response
    let fullContent = "";
    
    // Process each chunk from the stream
    for await (const chunk of response) {
      // Extract the content from the chunk
      const content = chunk.choices[0]?.delta?.content || "";
      fullContent += content;
    }
    
    console.log(`Resposta OpenAI completa recebida (${fullContent.length} caracteres)`);
    
    if (!fullContent) {
      return {
        content: "Não foi possível gerar uma resposta."
      };
    }
    
    return {
      content: fullContent
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
    
    console.log(`Iniciando geração de imagem com ${modelId}. Prompt: "${prompt.substring(0, 50)}..."`);
    
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
      response_format: "b64_json", // Get base64 encoded image data
    });
    
    // Extract image data
    if (!response.data || response.data.length === 0) {
      throw new Error("Não foi possível obter dados da imagem gerada.");
    }
    
    // Get the base64 encoded image
    const imageData = response.data[0];
    if (!imageData.b64_json) {
      throw new Error("Dados base64 da imagem não encontrados na resposta.");
    }
    
    // Format as data URL
    const contentType = "image/png"; // DALL-E returns PNG images
    const base64Image = `data:${contentType};base64,${imageData.b64_json}`;
    
    console.log("Imagem gerada com sucesso e codificada em base64");
    
    return {
      content: `Imagem gerada com sucesso.`,
      files: [base64Image]
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError("OPENAI_IMAGE_GENERATION_ERROR", { error: errorMessage, model: modelId });
    throw new Error(`Erro ao gerar imagem com DALL-E: ${errorMessage}`);
  }
}
