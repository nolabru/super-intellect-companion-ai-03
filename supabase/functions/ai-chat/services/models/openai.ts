
import { logError } from "../../utils/logging.ts";
import { validateApiKey } from "../../utils/validation.ts";
import { OpenAI } from "https://esm.sh/openai@4.29.0";

// Define response type
export interface ResponseData {
  content: string;
  files?: string[];
}

// Função para verificar se a chave API do OpenAI está configurada
export function verifyApiKey(): string {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY não está configurada. Por favor, adicione sua chave API do OpenAI nas configurações.");
  }
  return apiKey;
}

// Função para gerar resposta de texto com OpenAI
export async function generateText(
  prompt: string,
  modelId: string = "gpt-4o"
): Promise<ResponseData> {
  try {
    // Validar API key da OpenAI
    const apiKey = verifyApiKey();
    
    console.log(`Iniciando solicitação de texto ao modelo ${modelId} da OpenAI`);
    
    // Instanciar cliente OpenAI com a API key
    const openai = new OpenAI({
      apiKey: apiKey,
    });
    
    // Criar a solicitação de chat
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
    
    // Extrair o conteúdo da resposta
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

// Função para processar imagem com GPT-4 Vision
export async function processImage(
  prompt: string,
  imageUrl: string,
  modelId: string = "gpt-4o"
): Promise<ResponseData> {
  try {
    // Validar API key da OpenAI
    const apiKey = verifyApiKey();
    
    console.log(`Iniciando análise de imagem com ${modelId}, URL da imagem: ${imageUrl}`);
    
    // Instanciar cliente OpenAI com a API key
    const openai = new OpenAI({
      apiKey: apiKey,
    });
    
    // Criar a solicitação de chat com a imagem como conteúdo
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
    
    // Extrair o conteúdo da resposta
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
