
// Service for Google Gemini AI models
import { validateApiKey } from "../../utils/validation.ts";
import { GoogleGenAI, type GenerateContentResult } from "npm:@google/genai@latest";

// Validate API key for Google Gemini
export function verifyApiKey() {
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
  validateApiKey("GEMINI_API_KEY", geminiApiKey);
  return geminiApiKey;
}

// Initialize Google Genai instance
const initializeGemini = () => {
  const apiKey = verifyApiKey();
  return new GoogleGenAI({ apiKey });
};

// Generate text using Gemini models
export async function generateText(content: string, modelId: string): Promise<{content: string}> {
  try {
    console.log(`Gerando texto com Gemini ${modelId}...`);
    
    // Map model ID to Gemini model name
    const modelName = getGeminiModelName(modelId);
    
    // Initialize the Google Genai client
    const genAI = initializeGemini();
    
    // Get the model
    const model = genAI.models.getGenerativeModel({ model: modelName });
    
    console.log(`Enviando prompt para o modelo ${modelName}`);
    
    // Generate content
    const result = await model.generateContent(content);
    const response = result.response;
    const text = response.text();
    
    console.log(`Resposta gerada com sucesso: ${text.substring(0, 100)}...`);
    
    return { content: text };
  } catch (error) {
    console.error(`Erro ao gerar texto com Gemini: ${error.message}`);
    throw new Error(`Erro com o serviço Gemini: ${error.message}`);
  }
}

// Process image with Gemini Vision
export async function processImage(content: string, imageUrl: string, modelId: string): Promise<{content: string}> {
  try {
    console.log(`Processando imagem com Gemini Vision...`);
    
    // Map model ID to Gemini model name that supports vision
    const modelName = getGeminiVisionModel(modelId);
    
    // Initialize the Google Genai client
    const genAI = initializeGemini();
    
    // Get the model
    const model = genAI.models.getGenerativeModel({ model: modelName });
    
    // Fetch the image data
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Falha ao buscar a imagem: ${imageResponse.status}`);
    }
    
    const imageData = await imageResponse.blob();
    
    // Create content parts with both text and image
    const imagePart = {
      inlineData: {
        data: await blobToBase64(imageData),
        mimeType: imageResponse.headers.get("content-type") || "image/jpeg"
      }
    };
    
    console.log(`Enviando prompt e imagem para o modelo ${modelName}`);
    
    // Generate content with image
    const result = await model.generateContent([content, imagePart]);
    const response = result.response;
    const text = response.text();
    
    console.log(`Resposta de análise de imagem gerada com sucesso: ${text.substring(0, 100)}...`);
    
    return { content: text };
  } catch (error) {
    console.error(`Erro ao processar imagem com Gemini Vision: ${error.message}`);
    throw new Error(`Erro com o serviço Gemini Vision: ${error.message}`);
  }
}

// Helper function to convert Blob to base64
async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Map model IDs to actual Gemini model names
function getGeminiModelName(modelId: string): string {
  switch (modelId) {
    case 'gemini-pro':
      return 'gemini-1.5-pro';
    case 'gemini-flash':
      return 'gemini-1.5-flash';
    default:
      return 'gemini-1.5-pro'; // Default to 1.5 Pro
  }
}

// Get vision-enabled model name
function getGeminiVisionModel(modelId: string): string {
  // Currently all 1.5 models support vision capabilities
  return 'gemini-1.5-pro';
}
