
import { generateText as openaiGenerateText } from "./models/openai.ts";
import { logError } from "../utils/logging.ts";
import { validateApiKey } from "../utils/validation.ts";

// Define response type for orchestrator
export interface OrchestratorResponse {
  enhancedPrompt: string;
  detectedMode: string;
  recommendedModel: string;
  memoryExtracted: boolean;
  memoryContext?: string;
}

// Verifica se a chave API do orquestrador está configurada
export function verifyApiKey(): string {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY não está configurada para o orquestrador.");
  }
  return apiKey;
}

// Função principal do orquestrador
export async function processUserMessage(
  userMessage: string,
  userId?: string,
  currentMode: string = "text",
  currentModel: string = "gpt-4o",
  conversationHistory?: string
): Promise<OrchestratorResponse> {
  try {
    // Validar chave de API
    const apiKey = verifyApiKey();
    validateApiKey("OPENAI_API_KEY", apiKey);
    
    console.log(`[Orquestrador] Processando mensagem do usuário: "${userMessage.substring(0, 50)}..."`);
    
    // Construir um prompt para o orquestrador
    const orchestratorPrompt = buildOrchestratorPrompt(
      userMessage,
      currentMode,
      currentModel,
      conversationHistory
    );
    
    // Usar um modelo pequeno e rápido para o orquestrador
    const orchestratorModel = "gpt-4o-mini";
    
    console.log(`[Orquestrador] Chamando modelo ${orchestratorModel} para processamento`);
    
    // Chamar o modelo de orquestração
    const response = await openaiGenerateText(orchestratorPrompt, orchestratorModel);
    
    // Processar a resposta do orquestrador
    return parseOrchestratorResponse(response.content);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Orquestrador] Erro ao processar mensagem:", error);
    logError("ORCHESTRATOR_ERROR", { error: errorMessage });
    
    // Em caso de falha, retorna valores padrão
    return {
      enhancedPrompt: userMessage,
      detectedMode: currentMode,
      recommendedModel: currentModel,
      memoryExtracted: false
    };
  }
}

// Construir o prompt para o orquestrador
function buildOrchestratorPrompt(
  userMessage: string,
  currentMode: string,
  currentModel: string,
  conversationHistory?: string
): string {
  return `Você é um orquestrador de IA que deve analisar a mensagem do usuário e fornecer instruções para melhorar a resposta do modelo principal.

MENSAGEM DO USUÁRIO:
"${userMessage}"

MODO ATUAL: ${currentMode}
MODELO ATUAL: ${currentModel}
${conversationHistory ? `HISTÓRICO DA CONVERSA:\n${conversationHistory}` : ''}

Sua tarefa é:
1. Analisar a intenção do usuário
2. Decidir o modo mais adequado (text, image, video, audio)
3. Recomendar o modelo mais adequado para essa tarefa
4. Extrair informações que devem ser armazenadas para memória futura
5. Melhorar o prompt original do usuário para obter a melhor resposta possível

Responda no seguinte formato JSON:
{
  "enhancedPrompt": "Versão melhorada do prompt do usuário",
  "detectedMode": "O modo que melhor atende a solicitação (text, image, video, audio)",
  "recommendedModel": "Modelo recomendado para essa tarefa",
  "memoryExtracted": true/false,
  "memoryItems": [
    {"key": "chave para informação extraída", "value": "valor da informação"},
    ...
  ]
}`;
}

// Analisar a resposta do orquestrador
function parseOrchestratorResponse(responseContent: string): OrchestratorResponse {
  try {
    // Extrair o JSON da resposta
    const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn("[Orquestrador] Não foi possível extrair JSON da resposta");
      return {
        enhancedPrompt: responseContent,
        detectedMode: "text",
        recommendedModel: "gpt-4o",
        memoryExtracted: false
      };
    }
    
    const responseJson = JSON.parse(jsonMatch[0]);
    
    // Verificar se todos os campos necessários estão presentes
    if (!responseJson.enhancedPrompt) {
      console.warn("[Orquestrador] Campo 'enhancedPrompt' não encontrado na resposta");
      responseJson.enhancedPrompt = responseContent;
    }
    
    if (!responseJson.detectedMode) {
      console.warn("[Orquestrador] Campo 'detectedMode' não encontrado na resposta");
      responseJson.detectedMode = "text";
    }
    
    if (!responseJson.recommendedModel) {
      console.warn("[Orquestrador] Campo 'recommendedModel' não encontrado na resposta");
      responseJson.recommendedModel = "gpt-4o";
    }
    
    return {
      enhancedPrompt: responseJson.enhancedPrompt,
      detectedMode: responseJson.detectedMode,
      recommendedModel: responseJson.recommendedModel,
      memoryExtracted: responseJson.memoryExtracted || false,
      memoryItems: responseJson.memoryItems || []
    };
  } catch (error) {
    console.error("[Orquestrador] Erro ao analisar resposta:", error);
    return {
      enhancedPrompt: responseContent,
      detectedMode: "text",
      recommendedModel: "gpt-4o",
      memoryExtracted: false
    };
  }
}

// Função para extrair e salvar itens de memória
export async function extractAndSaveMemory(
  userId: string,
  userMessage: string,
  orchestratorResponse: OrchestratorResponse
): Promise<boolean> {
  if (!orchestratorResponse.memoryExtracted || !orchestratorResponse.memoryItems || orchestratorResponse.memoryItems.length === 0) {
    console.log("[Orquestrador] Nenhum item de memória para extrair");
    return false;
  }
  
  try {
    console.log(`[Orquestrador] Extraindo ${orchestratorResponse.memoryItems.length} itens de memória para usuário ${userId}`);
    
    // Aqui seria a lógica para salvar os itens na base de dados
    // Implementação em uma atualização futura ou encaminhamento para outro endpoint
    
    return true;
  } catch (error) {
    console.error("[Orquestrador] Erro ao salvar itens de memória:", error);
    return false;
  }
}

// Função para recuperar contexto de memória do usuário
export async function getUserMemoryContext(userId: string): Promise<string> {
  try {
    console.log(`[Orquestrador] Recuperando contexto de memória para usuário ${userId}`);
    
    // Aqui seria a lógica para recuperar a memória do usuário
    // Implementação em uma atualização futura ou consulta à base de dados
    
    return "";
  } catch (error) {
    console.error("[Orquestrador] Erro ao recuperar contexto de memória:", error);
    return "";
  }
}

// Função para enriquecer o prompt com contexto de memória
export function enrichPromptWithMemory(prompt: string, memoryContext: string): string {
  if (!memoryContext) {
    return prompt;
  }
  
  return `${memoryContext}\n\n${prompt}`;
}
