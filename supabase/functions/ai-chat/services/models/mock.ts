
// Define response type
export interface ResponseData {
  content: string;
  files?: string[];
}

// Função para gerar imagem simulada
export function generateImage(
  content: string,
  modelId: string
): ResponseData {
  throw new Error("Mock service is disabled. Please use the real OpenAI API.");
}

// Função para gerar vídeo simulado
export function generateVideo(
  content: string,
  modelId: string
): ResponseData {
  throw new Error("Mock service is disabled. Please use the real OpenAI API.");
}

// Função para gerar texto simulado
export function generateText(
  content: string,
  modelId: string,
  mode: string
): ResponseData {
  throw new Error("Mock service is disabled. Please use the real OpenAI API.");
}
