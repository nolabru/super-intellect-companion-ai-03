
// Define response type
export interface ResponseData {
  content: string;
  files?: string[];
}

// All mock functions now throw errors to prevent accidental use
export function generateImage(
  content: string,
  modelId: string
): ResponseData {
  throw new Error("Mock service is disabled. Please use the real OpenAI API.");
}

export function generateVideo(
  content: string,
  modelId: string
): ResponseData {
  throw new Error("Mock service is disabled. Please use the real OpenAI API.");
}

export function generateText(
  content: string,
  modelId: string,
  mode: string
): ResponseData {
  throw new Error("Mock service is disabled. Please use the real OpenAI API.");
}
