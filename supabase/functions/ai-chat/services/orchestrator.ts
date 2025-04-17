
import { generateText as openaiGenerateText } from "./models/openai.ts";
import { logError } from "../utils/logging.ts";
import { validateApiKey } from "../utils/validation.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.8.0";

// Inicializa o cliente Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Define response type for orchestrator
export interface OrchestratorResponse {
  enhancedPrompt: string;
  detectedMode: string;
  recommendedModel: string;
  memoryExtracted: boolean;
  memoryContext?: string;
  googleIntegrationActions?: GoogleIntegrationAction[];
}

// Define tipos para ações de integração com o Google
export interface GoogleIntegrationAction {
  type: 'calendar' | 'drive' | 'sheets' | 'gmail';
  action: string;
  parameters: Record<string, any>;
  description: string;
  needsMoreInfo?: boolean; // Adicionado para indicar se precisamos de mais informações
  missingFields?: string[]; // Campos que estão faltando
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
    
    // Verificar se o usuário tem integração com o Google
    let userHasGoogleIntegration = false;
    let googleIntegrationContext = "";
    
    if (userId) {
      try {
        const { data: googleTokens, error } = await supabase
          .from('user_google_tokens')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        userHasGoogleIntegration = !error && !!googleTokens;
        
        if (userHasGoogleIntegration) {
          googleIntegrationContext = `
            O usuário tem integração com o Google e você pode sugerir ações que utilizem:
            - Google Calendar: Para criar e gerenciar eventos
            - Google Drive: Para criar e gerenciar documentos
            - Google Sheets: Para criar e gerenciar planilhas
            - Gmail: Para enviar e-mails
            
            Se o pedido do usuário puder se beneficiar de qualquer uma dessas integrações, sugira ações específicas no formato JSON dentro da sua resposta.
            
            IMPORTANTE: Quando o usuário solicitar uma ação direta como "crie um evento", "agende uma reunião", ou
            "crie um documento/planilha", você DEVE analisar se tem todas as informações necessárias:
            
            Para eventos no calendário:
            - Título (obrigatório)
            - Data e hora de início (obrigatório - formato ISO)
            - Data e hora de término (obrigatório - formato ISO)
            - Descrição (opcional)
            - Participantes (opcional)
            
            Para documentos:
            - Nome do documento (obrigatório)
            - Conteúdo inicial (opcional)
            
            Para planilhas:
            - Título da planilha (obrigatório)
            - Nomes das abas (opcional)
            
            Se algum dado obrigatório estiver faltando, indique isso no campo "needsMoreInfo: true" e liste 
            os campos faltantes em "missingFields: []". Dessa forma, o sistema saberá que precisa solicitar
            mais informações ao usuário antes de executar a ação.
          `;
        }
      } catch (error) {
        console.error("[Orquestrador] Erro ao verificar integração com Google:", error);
        // Continuar sem o contexto de integração
      }
    }
    
    // Verificar se a mensagem do usuário é uma resposta para uma solicitação anterior
    // do orquestrador para obter mais informações
    let isFollowUpResponse = false;
    let previousActionType: string | null = null;
    
    if (conversationHistory) {
      // Verifica se há uma mensagem do sistema pedindo mais informações
      const infoRequestPattern = /(Precisamos de mais informações para|Para criar um)/i;
      const botMessages = conversationHistory.split('\n').filter(line => 
        line.startsWith('assistant:') && infoRequestPattern.test(line)
      );
      
      if (botMessages.length > 0) {
        const lastBotMessage = botMessages[botMessages.length - 1];
        isFollowUpResponse = true;
        
        // Tenta identificar que tipo de ação estava sendo processada
        if (lastBotMessage.includes('evento') || lastBotMessage.includes('reunião') || 
            lastBotMessage.includes('calendário') || lastBotMessage.includes('agenda')) {
          previousActionType = 'calendar';
        } else if (lastBotMessage.includes('documento') || lastBotMessage.includes('doc')) {
          previousActionType = 'drive';
        } else if (lastBotMessage.includes('planilha') || lastBotMessage.includes('spreadsheet')) {
          previousActionType = 'sheets';
        }
        
        console.log(`[Orquestrador] Detectada resposta de seguimento para ação do tipo: ${previousActionType}`);
      }
    }
    
    // Construir um prompt para o orquestrador
    const orchestratorPrompt = buildOrchestratorPrompt(
      userMessage,
      currentMode,
      currentModel,
      conversationHistory,
      googleIntegrationContext,
      isFollowUpResponse,
      previousActionType
    );
    
    // Usar um modelo pequeno e rápido para o orquestrador
    const orchestratorModel = "gpt-4o-mini";
    
    console.log(`[Orquestrador] Chamando modelo ${orchestratorModel} para processamento`);
    
    // Chamar o modelo de orquestração
    const response = await openaiGenerateText(orchestratorPrompt, orchestratorModel);
    
    // Processar a resposta do orquestrador
    return parseOrchestratorResponse(response.content, userHasGoogleIntegration);
    
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
  conversationHistory?: string,
  googleIntegrationContext?: string,
  isFollowUpResponse?: boolean,
  previousActionType?: string | null
): string {
  let prompt = `Você é um orquestrador de IA que deve analisar a mensagem do usuário e fornecer instruções para melhorar a resposta do modelo principal.

MENSAGEM DO USUÁRIO:
"${userMessage}"

MODO ATUAL: ${currentMode}
MODELO ATUAL: ${currentModel}
${conversationHistory ? `HISTÓRICO DA CONVERSA:\n${conversationHistory}` : ''}
${googleIntegrationContext || ''}

Sua tarefa é:
1. Analisar a intenção do usuário
2. Decidir o modo mais adequado (text, image, video, audio)
3. Recomendar o modelo mais adequado para essa tarefa
4. Extrair informações que devem ser armazenadas para memória futura
5. Melhorar o prompt original do usuário para obter a melhor resposta possível`;

  if (googleIntegrationContext) {
    prompt += `\n6. Detectar se o pedido do usuário pode ser atendido usando integrações com o Google (Calendar, Drive, Sheets, Gmail) e sugerir ações específicas`;
    
    if (isFollowUpResponse && previousActionType) {
      prompt += `\n\nIMPORTANTE: A mensagem do usuário parece ser uma resposta a uma solicitação anterior de informações adicionais para uma ação do tipo "${previousActionType}". 
      Combine estas novas informações com o contexto da conversa para completar os parâmetros necessários para a ação.`;
    }
  }

  prompt += `\n\nResponda no seguinte formato JSON:
{
  "enhancedPrompt": "Versão melhorada do prompt do usuário",
  "detectedMode": "O modo que melhor atende a solicitação (text, image, video, audio)",
  "recommendedModel": "Modelo recomendado para essa tarefa",
  "memoryExtracted": true/false,
  "memoryItems": [
    {"key": "chave para informação extraída", "value": "valor da informação"},
    ...
  ]`;

  if (googleIntegrationContext) {
    prompt += `,
  "googleIntegrationActions": [
    {
      "type": "calendar|drive|sheets|gmail",
      "action": "nome da ação (ex: createEvent, createDocument)",
      "parameters": {
        // parâmetros específicos para a ação
      },
      "description": "Descrição em linguagem natural do que será feito",
      "needsMoreInfo": true/false,
      "missingFields": ["campo1", "campo2"]
    }
  ]`;
  }

  prompt += `\n}`;
  
  return prompt;
}

// Analisar a resposta do orquestrador
function parseOrchestratorResponse(
  responseContent: string, 
  userHasGoogleIntegration: boolean
): OrchestratorResponse {
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
    
    // Verificar se há ações de integração com o Google
    let googleIntegrationActions: GoogleIntegrationAction[] | undefined;
    
    if (userHasGoogleIntegration && responseJson.googleIntegrationActions) {
      googleIntegrationActions = responseJson.googleIntegrationActions;
      console.log("[Orquestrador] Ações de integração com Google detectadas:", 
        JSON.stringify(googleIntegrationActions));
    }
    
    return {
      enhancedPrompt: responseJson.enhancedPrompt,
      detectedMode: responseJson.detectedMode,
      recommendedModel: responseJson.recommendedModel,
      memoryExtracted: responseJson.memoryExtracted || false,
      memoryItems: responseJson.memoryItems || [],
      googleIntegrationActions
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

// Função para processar ações de integração com o Google
export async function processGoogleIntegrationActions(
  userId: string, 
  actions: GoogleIntegrationAction[]
): Promise<{success: boolean, results: any[], needsMoreInfo?: boolean, followupPrompt?: string}> {
  if (!userId || !actions || actions.length === 0) {
    return { success: false, results: [] };
  }
  
  try {
    console.log(`[Orquestrador] Processando ${actions.length} ações de integração com Google para usuário ${userId}`);
    
    // Verificar se alguma ação precisa de mais informações
    const actionNeedingMoreInfo = actions.find(a => a.needsMoreInfo === true);
    
    if (actionNeedingMoreInfo) {
      console.log(`[Orquestrador] Ação '${actionNeedingMoreInfo.action}' precisa de mais informações`);
      
      let followupPrompt = `Precisamos de mais informações para executar esta ação. `;
      
      if (actionNeedingMoreInfo.type === 'calendar') {
        followupPrompt += `Para criar um evento no calendário, precisamos dos seguintes detalhes:\n`;
        
        if (actionNeedingMoreInfo.missingFields?.includes('summary')) {
          followupPrompt += `- Qual será o título do evento?\n`;
        }
        if (actionNeedingMoreInfo.missingFields?.includes('startDateTime')) {
          followupPrompt += `- Qual a data e hora de início? (ex: 25/04/2025 às 14:30)\n`;
        }
        if (actionNeedingMoreInfo.missingFields?.includes('endDateTime')) {
          followupPrompt += `- Qual a data e hora de término? (ex: 25/04/2025 às 15:30)\n`;
        }
        if (actionNeedingMoreInfo.missingFields?.includes('description')) {
          followupPrompt += `- Gostaria de adicionar alguma descrição?\n`;
        }
        if (actionNeedingMoreInfo.missingFields?.includes('attendees')) {
          followupPrompt += `- Há alguém que deve participar do evento? (forneça os emails separados por vírgula)\n`;
        }
      } 
      else if (actionNeedingMoreInfo.type === 'drive') {
        followupPrompt += `Para criar um documento no Google Drive, precisamos dos seguintes detalhes:\n`;
        
        if (actionNeedingMoreInfo.missingFields?.includes('name')) {
          followupPrompt += `- Qual será o nome do documento?\n`;
        }
        if (actionNeedingMoreInfo.missingFields?.includes('content')) {
          followupPrompt += `- Gostaria de adicionar algum conteúdo inicial?\n`;
        }
      }
      else if (actionNeedingMoreInfo.type === 'sheets') {
        followupPrompt += `Para criar uma planilha no Google Sheets, precisamos dos seguintes detalhes:\n`;
        
        if (actionNeedingMoreInfo.missingFields?.includes('title')) {
          followupPrompt += `- Qual será o título da planilha?\n`;
        }
        if (actionNeedingMoreInfo.missingFields?.includes('sheets')) {
          followupPrompt += `- Quais nomes você gostaria de dar para as abas? (se não especificar, usaremos "Página1")\n`;
        }
      }
      
      followupPrompt += `\nPor favor, forneça as informações faltantes para que eu possa criar isso para você.`;
      
      return {
        success: false,
        results: [],
        needsMoreInfo: true,
        followupPrompt
      };
    }
    
    // Mapear cada ação para uma chamada à função google-actions
    const results = await Promise.all(actions.map(async (action) => {
      try {
        let actionName = "";
        let actionParams = {};
        
        // Mapear tipo e ação para o formato esperado pela função google-actions
        switch (action.type) {
          case 'calendar':
            if (action.action === 'createEvent') {
              actionName = 'createCalendarEvent';
              actionParams = action.parameters;
              
              // Se as datas estiverem em formato humanizado, converter para ISO
              if (typeof actionParams.startDateTime === 'string' && 
                  !actionParams.startDateTime.match(/^\d{4}-\d{2}-\d{2}T/)) {
                  
                // Tentar converter data em formato brasileiro/português para ISO
                try {
                  const startDate = parseHumanDate(actionParams.startDateTime);
                  if (startDate) {
                    actionParams.startDateTime = startDate.toISOString();
                  }
                } catch (e) {
                  console.warn(`Não foi possível converter data de início: ${actionParams.startDateTime}`);
                }
              }
              
              if (typeof actionParams.endDateTime === 'string' && 
                  !actionParams.endDateTime.match(/^\d{4}-\d{2}-\d{2}T/)) {
                  
                try {
                  const endDate = parseHumanDate(actionParams.endDateTime);
                  if (endDate) {
                    actionParams.endDateTime = endDate.toISOString();
                  }
                } catch (e) {
                  console.warn(`Não foi possível converter data de término: ${actionParams.endDateTime}`);
                  
                  // Se só temos hora de início, definir término para 1 hora depois
                  if (actionParams.startDateTime && actionParams.startDateTime.match(/^\d{4}-\d{2}-\d{2}T/)) {
                    const start = new Date(actionParams.startDateTime);
                    const end = new Date(start);
                    end.setHours(end.getHours() + 1);
                    actionParams.endDateTime = end.toISOString();
                  }
                }
              }
            } else if (action.action === 'listEvents') {
              actionName = 'listCalendarEvents';
              actionParams = action.parameters;
            }
            break;
            
          case 'drive':
            if (action.action === 'createDocument') {
              actionName = 'createDocument';
              actionParams = action.parameters;
            }
            break;
            
          case 'sheets':
            if (action.action === 'createSpreadsheet') {
              actionName = 'createSpreadsheet';
              actionParams = action.parameters;
            }
            break;
            
          default:
            console.warn(`[Orquestrador] Tipo de ação não suportado: ${action.type}/${action.action}`);
            return {
              actionType: action.type,
              actionName: action.action,
              success: false,
              error: 'Tipo de ação não suportado'
            };
        }
        
        if (!actionName) {
          return {
            actionType: action.type,
            actionName: action.action,
            success: false,
            error: 'Ação não implementada'
          };
        }
        
        // Chamar a função google-actions
        const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/google-actions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
          },
          body: JSON.stringify({
            userId,
            action: actionName,
            params: actionParams
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[Orquestrador] Erro ao executar ação ${action.type}/${action.action}:`, errorText);
          return {
            actionType: action.type,
            actionName: action.action,
            success: false,
            error: errorText
          };
        }
        
        const result = await response.json();
        
        return {
          actionType: action.type,
          actionName: action.action,
          success: true,
          result,
          description: action.description
        };
      } catch (actionError) {
        console.error(`[Orquestrador] Erro ao processar ação ${action.type}/${action.action}:`, actionError);
        return {
          actionType: action.type,
          actionName: action.action,
          success: false,
          error: actionError.message
        };
      }
    }));
    
    return { 
      success: results.some(r => r.success), 
      results 
    };
  } catch (error) {
    console.error("[Orquestrador] Erro ao processar ações do Google:", error);
    return { success: false, results: [] };
  }
}

// Função auxiliar para converter datas em formato humanizado para Date
function parseHumanDate(dateStr: string): Date | null {
  // Tenta vários formatos comuns em português/brasileiro
  
  // Formato: dd/mm/yyyy às hh:mm
  const brFormat = /(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[\sàs]+(\d{1,2}):(\d{1,2}))?/i;
  const brMatch = dateStr.match(brFormat);
  
  if (brMatch) {
    const [_, day, month, year, hours = "0", minutes = "0"] = brMatch;
    return new Date(
      parseInt(year), 
      parseInt(month) - 1, 
      parseInt(day),
      parseInt(hours),
      parseInt(minutes)
    );
  }
  
  // Formato em texto: "hoje/amanhã às 15h"
  const relativeFormat = /(hoje|amanhã|amanha)(?:[\sàs]+(\d{1,2})(?::(\d{1,2}))?h?)?/i;
  const relativeMatch = dateStr.match(relativeFormat);
  
  if (relativeMatch) {
    const now = new Date();
    const [_, day, hours = "0", minutes = "0"] = relativeMatch;
    
    const result = new Date(now);
    
    if (day.toLowerCase() === "amanhã" || day.toLowerCase() === "amanha") {
      result.setDate(result.getDate() + 1);
    }
    
    result.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return result;
  }
  
  // Hora específica hoje (ex: "13:30", "às 14h")
  const timeOnlyFormat = /(?:às\s+)?(\d{1,2})(?::(\d{1,2}))?(?:h|hrs)?/i;
  const timeOnlyMatch = dateStr.match(timeOnlyFormat);
  
  if (timeOnlyMatch) {
    const now = new Date();
    const [_, hours, minutes = "0"] = timeOnlyMatch;
    
    const result = new Date(now);
    result.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return result;
  }
  
  return null;
}
