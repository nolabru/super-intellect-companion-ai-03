
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
  googleCommand?: GoogleCommand;
}

// Define tipos para ações de integração com o Google
export interface GoogleIntegrationAction {
  type: 'calendar' | 'drive' | 'sheets' | 'gmail' | 'docs';
  action: string;
  parameters: Record<string, any>;
  description: string;
}

// Define Google command types
export interface GoogleCommand {
  type: 'calendar' | 'sheet' | 'doc' | 'drive' | 'email';
  action: string;
  query: string;
  systemPrompt: string;
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
            - Google Docs: Para criar documentos
            - Gmail: Para enviar e-mails
            
            Se o pedido do usuário puder se beneficiar de qualquer uma dessas integrações, sugira ações específicas no formato JSON dentro da sua resposta.
            Você deve detectar quando o usuário usa comandos como @calendar, @sheet, @doc, @drive ou @email e direcionar para o agente especializado.
          `;
        }
      } catch (error) {
        console.error("[Orquestrador] Erro ao verificar integração com Google:", error);
        // Continuar sem o contexto de integração
      }
    }
    
    // Verificar se a mensagem contém comandos Google
    const googleCommandMatch = userMessage.match(/@(calendar|sheet|doc|drive|email)\s+(.*)/i);
    let googleCommand = null;
    
    if (googleCommandMatch && userHasGoogleIntegration) {
      const commandType = googleCommandMatch[1].toLowerCase();
      const commandQuery = googleCommandMatch[2].trim();
      
      console.log(`[Orquestrador] Detectado comando Google: ${commandType} com consulta: "${commandQuery}"`);
      
      // Definir prompts de sistema para cada agente especializado
      const systemPrompts = {
        calendar: `Você é um assistente especializado em gerenciar eventos do Google Calendar.
Comunique-se sempre em português do Brasil de forma formal mas amigável.
Ajude o usuário a criar eventos no calendário coletando todas as informações necessárias:
- Título do evento (obrigatório)
- Descrição (opcional)
- Data e hora de início (obrigatório)
- Data e hora de término (obrigatório)
- Local (opcional)
- Participantes/convidados (opcional)

Se alguma informação obrigatória estiver faltando, pergunte ao usuário de forma natural.
Formate as datas conforme o padrão ISO 8601 (YYYY-MM-DDTHH:MM:SS).
Quando tiver todas as informações, envie os dados para criação do evento.
Se o usuário não tiver concedido as permissões necessárias, informe gentilmente que ele precisa reconectar sua conta Google com as permissões de Calendário.`,
        
        sheet: `Você é um assistente especializado em gerenciar planilhas do Google Sheets.
Comunique-se sempre em português do Brasil de forma formal mas amigável.
Ajude o usuário a criar, ler ou atualizar planilhas coletando as informações necessárias.

Para CRIAR uma planilha:
- Título da planilha (obrigatório)
- Dados para incluir (obrigatório)
- Formato dos dados (opcional)

Para LER uma planilha:
- ID da planilha (obrigatório)
- Intervalo de células (ex: "A1:D10") (obrigatório)

Para ATUALIZAR uma planilha:
- ID da planilha (obrigatório)
- Intervalo de células a atualizar (obrigatório)
- Novos dados (obrigatório)

Se alguma informação obrigatória estiver faltando, pergunte ao usuário de forma natural.
Se o usuário não tiver concedido as permissões necessárias, informe gentilmente que ele precisa reconectar sua conta Google com as permissões de Sheets.`,
        
        doc: `Você é um assistente especializado em gerenciar documentos do Google Docs.
Comunique-se sempre em português do Brasil de forma formal mas amigável.
Ajude o usuário a criar ou atualizar documentos coletando as informações necessárias.

Para CRIAR um documento:
- Título do documento (obrigatório)
- Conteúdo (obrigatório)
- Formatação (opcional)

Para ATUALIZAR um documento:
- ID do documento (obrigatório)
- Novo conteúdo (obrigatório)
- Tipo de atualização (substituir ou adicionar) (opcional, padrão: substituir)

Se alguma informação obrigatória estiver faltando, pergunte ao usuário de forma natural.
Se o usuário não tiver concedido as permissões necessárias, informe gentilmente que ele precisa reconectar sua conta Google com as permissões de Docs.`,
        
        drive: `Você é um assistente especializado em gerenciar arquivos do Google Drive.
Comunique-se sempre em português do Brasil de forma formal mas amigável.
Ajude o usuário a fazer upload de arquivos ou criar pastas coletando as informações necessárias.

Para UPLOAD de arquivo:
- Nome do arquivo (obrigatório)
- Conteúdo do arquivo (obrigatório)
- Tipo MIME (opcional, padrão com base na extensão)
- ID da pasta de destino (opcional)

Para CRIAR pasta:
- Nome da pasta (obrigatório)
- ID da pasta pai (opcional)

Se alguma informação obrigatória estiver faltando, pergunte ao usuário de forma natural.
Se o usuário não tiver concedido as permissões necessárias, informe gentilmente que ele precisa reconectar sua conta Google com as permissões de Drive.`,
        
        email: `Você é um assistente especializado em enviar e-mails via Gmail.
Comunique-se sempre em português do Brasil de forma formal mas amigável.
Ajude o usuário a compor e enviar e-mails coletando todas as informações necessárias:
- Destinatário(s) (obrigatório)
- Assunto (obrigatório)
- Corpo do e-mail (obrigatório)
- CC (opcional)
- BCC (opcional)
- Anexos (opcional)

Se alguma informação obrigatória estiver faltando, pergunte ao usuário de forma natural.
Ao redigir e-mails, mantenha um tom profissional e adequado ao contexto descrito pelo usuário.
Se o usuário não tiver concedido as permissões necessárias, informe gentilmente que ele precisa reconectar sua conta Google com as permissões de Gmail.`
      };
      
      // Create the Google command object
      googleCommand = {
        type: commandType as 'calendar' | 'sheet' | 'doc' | 'drive' | 'email',
        action: 'process', // Default action
        query: commandQuery,
        systemPrompt: systemPrompts[commandType as keyof typeof systemPrompts]
      };
      
      // Override default mode and model for Google commands
      currentMode = "text";
      currentModel = "gpt-4o";
    }
    
    // Construir um prompt para o orquestrador
    const orchestratorPrompt = buildOrchestratorPrompt(
      userMessage,
      currentMode,
      currentModel,
      conversationHistory,
      googleIntegrationContext,
      !!googleCommand
    );
    
    // Usar um modelo pequeno e rápido para o orquestrador
    const orchestratorModel = "gpt-4o-mini";
    
    console.log(`[Orquestrador] Chamando modelo ${orchestratorModel} para processamento`);
    
    // Chamar o modelo de orquestração
    const response = await openaiGenerateText(orchestratorPrompt, orchestratorModel);
    
    // Processar a resposta do orquestrador
    const parsedResponse = parseOrchestratorResponse(response.content, userHasGoogleIntegration);
    
    // Se temos um comando Google, adicionar à resposta
    if (googleCommand) {
      parsedResponse.googleCommand = googleCommand;
    }
    
    return parsedResponse;
    
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
  hasGoogleCommand?: boolean
): string {
  return `Você é um orquestrador de IA que deve analisar a mensagem do usuário e fornecer instruções para melhorar a resposta do modelo principal.

MENSAGEM DO USUÁRIO:
"${userMessage}"

MODO ATUAL: ${currentMode}
MODELO ATUAL: ${currentModel}
${conversationHistory ? `HISTÓRICO DA CONVERSA:\n${conversationHistory}` : ''}
${googleIntegrationContext || ''}
${hasGoogleCommand ? 'IMPORTANTE: A mensagem do usuário contém um comando Google que será tratado por um agente especializado.' : ''}

Sua tarefa é:
1. Analisar a intenção do usuário
2. Decidir o modo mais adequado (text, image, video, audio)
3. Recomendar o modelo mais adequado para essa tarefa
4. Extrair informações que devem ser armazenadas para memória futura
5. Melhorar o prompt original do usuário para obter a melhor resposta possível
${googleIntegrationContext && !hasGoogleCommand ? `6. Detectar se o pedido do usuário pode ser atendido usando integrações com o Google (Calendar, Drive, Sheets, Docs, Gmail) e sugerir ações específicas` : ''}

Responda no seguinte formato JSON:
{
  "enhancedPrompt": "Versão melhorada do prompt do usuário",
  "detectedMode": "O modo que melhor atende a solicitação (text, image, video, audio)",
  "recommendedModel": "Modelo recomendado para essa tarefa",
  "memoryExtracted": true/false,
  "memoryItems": [
    {"key": "chave para informação extraída", "value": "valor da informação"},
    ...
  ]${googleIntegrationContext && !hasGoogleCommand ? `,
  "googleIntegrationActions": [
    {
      "type": "calendar|drive|sheets|gmail|docs",
      "action": "nome da ação (ex: createEvent, createDocument)",
      "parameters": {
        // parâmetros específicos para a ação
      },
      "description": "Descrição em linguagem natural do que será feito"
    }
  ]` : ''}
}`;
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
): Promise<{success: boolean, results: any[]}> {
  if (!userId || !actions || actions.length === 0) {
    return { success: false, results: [] };
  }
  
  try {
    console.log(`[Orquestrador] Processando ${actions.length} ações de integração com Google para usuário ${userId}`);
    
    // Obter tokens do Google do usuário
    const { data: googleTokens, error } = await supabase
      .from('user_google_tokens')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error || !googleTokens) {
      console.error("[Orquestrador] Usuário não tem tokens do Google:", error);
      return { success: false, results: [] };
    }
    
    // Verificar se o token está expirado
    const now = Math.floor(Date.now() / 1000);
    if (googleTokens.expires_at < now) {
      console.log("[Orquestrador] Token do Google expirado, tentando renovar");
      
      // Renovar token (implementação futura)
      // Por enquanto, retornar erro
      return { success: false, results: [] };
    }
    
    // Processar cada ação
    const results = await Promise.all(actions.map(async (action) => {
      try {
        // Aqui seria a implementação para chamar as APIs do Google
        // Isso seria feito em uma função específica para cada tipo de ação
        
        // Exemplo de mock para desenvolvimento:
        return {
          actionType: action.type,
          actionName: action.action,
          success: true,
          result: {
            mockResult: "Ação processada com sucesso (mock)",
            description: action.description
          }
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
