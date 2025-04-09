
// Define response type
export interface ResponseData {
  content: string;
  files?: string[];
}

// Function to handle mock image generation
export function generateMockImage(
  content: string,
  modelId: string
): ResponseData {
  return {
    content: `Imagem gerada pelo ${modelId} (simulado).`,
    files: ["https://via.placeholder.com/512x512?text=MockImage"]
  };
}

// Function to handle mock video generation
export function generateMockVideo(
  content: string,
  modelId: string
): ResponseData {
  const mockFile = "https://customer-mczvmistqo8sthk6.cloudflarestream.com/50c156acd139aba0c328fd1765e495e6/watch";
  return {
    content: `Vídeo gerado pelo ${modelId} (simulado).`,
    files: [mockFile]
  };
}

// Function to handle mock text generation
export function generateMockText(
  content: string,
  modelId: string,
  mode: string
): ResponseData {
  return {
    content: `Resposta simulada para o modelo ${modelId} no modo ${mode}: ${content}`,
    files: mode === "text" ? undefined : ["https://via.placeholder.com/512x512?text=MockAI"]
  };
}
