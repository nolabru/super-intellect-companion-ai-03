// Importações e funções existentes...

/**
 * Processa mensagem do usuário para determinar modo e extrair memória se necessário
 */
export async function processUserMessage(
  userMessage: string,
  userId: string | undefined,
  mode: string,
  modelId: string,
  conversationHistory: any[] | string | undefined
) {
  console.log(`[orchestrator] Processando mensagem do usuário: ${userMessage.substring(0, 50)}...`);
  
  // Detectar comandos de serviço Google
  const isGoogleServiceCommand = detectGoogleServiceCommand(userMessage);
  let googleIntegrationActions = [];
  
  // Verifica se é um comando Google explícito (@drive, @sheet, @calendar)
  if (isGoogleServiceCommand) {
    console.log("[orchestrator] Comando de serviço Google detectado");
    
    // Identificar o tipo específico de serviço Google
    const serviceType = identifyGoogleService(userMessage);
    console.log(`[orchestrator] Tipo de serviço Google identificado: ${serviceType}`);
    
    // Verificar se a mensagem tem detalhes suficientes para executar a ação
    const { hasRequiredInfo, missingInfo, actions } = analyzeGoogleServiceRequest(userMessage, serviceType);
    
    if (hasRequiredInfo) {
      console.log("[orchestrator] Mensagem tem detalhes suficientes, preparando ações");
      googleIntegrationActions = actions;
    } else {
      console.log("[orchestrator] Detalhes insuficientes, criando prompt para obter mais informações");
      
      // Construir prompt para obter mais informações
      const enhancedPrompt = buildFollowUpPrompt(userMessage, serviceType, missingInfo);
      
      return {
        detectedMode: "google-service",
        recommendedModel: modelId,
        enhancedPrompt,
        memoryExtracted: false,
        googleIntegrationActions: []
      };
    }
  }
  
  // Processar extração de memória se necessário
  let memoryExtracted = false;
  let enhancedPrompt = userMessage;
  
  // Verificar se deve extrair memória
  if (userId && shouldExtractMemory(userMessage)) {
    console.log("[orchestrator] Extraindo memória da mensagem");
    // Processamento de memória existente
    // ...
    memoryExtracted = true;
  }
  
  // Enriquecer a mensagem com contexto adicional se necessário
  // Detectar modo com base no conteúdo
  const detectedMode = detectContentTypeFromMessage(userMessage, mode);
  
  // Se não for um comando de serviço Google mas parece uma solicitação de ação Google
  if (!isGoogleServiceCommand && detectImplicitGoogleAction(userMessage)) {
    console.log("[orchestrator] Detectada possível ação Google implícita");
    enhancedPrompt = enhanceWithGoogleActionContext(userMessage);
  }
  
  return {
    detectedMode,
    recommendedModel: getRecommendedModel(detectedMode, modelId),
    enhancedPrompt,
    memoryExtracted,
    googleIntegrationActions
  };
}

/**
 * Detecta comandos de serviço Google como @drive, @sheet, @calendar
 */
function detectGoogleServiceCommand(message: string): boolean {
  const googleServiceCommands = ['@drive', '@sheet', '@calendar'];
  return googleServiceCommands.some(cmd => message.trim().toLowerCase().startsWith(cmd));
}

/**
 * Identifica qual serviço Google está sendo solicitado
 */
function identifyGoogleService(message: string): string {
  if (message.trim().toLowerCase().startsWith('@drive')) return 'drive';
  if (message.trim().toLowerCase().startsWith('@sheet')) return 'sheets';
  if (message.trim().toLowerCase().startsWith('@calendar')) return 'calendar';
  return 'unknown';
}

/**
 * Constrói um prompt de acompanhamento para obter mais informações
 */
function buildFollowUpPrompt(message: string, serviceType: string, missingInfo: string[]): string {
  if (serviceType === 'sheets') {
    return `Para criar uma planilha no Google Sheets, preciso das seguintes informações:
    
1. Qual deve ser o título da planilha?
2. Quantas abas/sheets você deseja na planilha?
3. Você deseja adicionar algum conteúdo inicial? Se sim, descreva o que deve ser incluído.

Por favor, forneça estas informações para que eu possa criar a planilha para você.`;
  }
  
  if (serviceType === 'drive') {
    return `Para criar um documento no Google Drive, preciso das seguintes informações:
    
1. Qual deve ser o título do documento?
2. Que tipo de documento você deseja criar (documento de texto, apresentação, etc.)?
3. Você deseja adicionar algum conteúdo inicial? Se sim, descreva o que deve ser incluído.

Por favor, forneça estas informações para que eu possa criar o documento para você.`;
  }
  
  if (serviceType === 'calendar') {
    return `Para criar um evento no Google Calendar, preciso das seguintes informações:
    
1. Qual deve ser o título/assunto do evento?
2. Qual a data e horário de início do evento?
3. Qual a duração do evento ou horário de término?
4. Há alguma descrição adicional para o evento?
5. Deseja convidar outras pessoas? Se sim, informe os emails.

Por favor, forneça estas informações para que eu possa criar o evento para você.`;
  }
  
  return `Para continuar com sua solicitação relacionada ao Google, preciso de mais detalhes. 
Por favor, descreva com mais detalhes o que você gostaria de fazer.`;
}

/**
 * Analisa solicitação de serviço Google para verificar se tem detalhes suficientes
 */
function analyzeGoogleServiceRequest(message: string, serviceType: string) {
  // Remover o comando inicial (@sheet, @drive, etc)
  const contentAfterCommand = message.substring(message.indexOf('@') + serviceType.length + 1).trim();
  
  if (serviceType === 'sheets') {
    // Verificar se há informações sobre título ou conteúdo
    const hasTitle = contentAfterCommand.includes('planilha') || contentAfterCommand.includes('spreadsheet');
    const hasContent = contentAfterCommand.includes('com') || contentAfterCommand.includes('contendo');
    
    // Verificações específicas para extrair dados sobre planilha
    // Para o exemplo "@sheet crie uma planilha com 3 nomes aleatórios"
    const titleMatch = contentAfterCommand.match(/planilha\s+(?:de|sobre|com|para)\s+(.+?)(?:\s+com|\s+e|\s+que|\.|$)/i);
    const title = titleMatch ? titleMatch[1].trim() : "Planilha sem título";
    
    // Verifica se há menção a nomes, dados ou conteúdo específico
    const contentMatch = contentAfterCommand.match(/com\s+(.+?)(?:\.|$)/i);
    const content = contentMatch ? contentMatch[1].trim() : "";
    
    // Decidir se temos informações suficientes
    const hasRequiredInfo = contentAfterCommand.length > 10 && (hasTitle || hasContent);
    
    const missingInfo = [];
    if (!hasTitle) missingInfo.push("título da planilha");
    if (!hasContent) missingInfo.push("conteúdo/dados para incluir");
    
    // Se temos informações suficientes, preparar ação
    const actions = hasRequiredInfo ? [{
      type: 'createSpreadsheet',
      parameters: {
        title: title || "Nova Planilha",
        content: content,
        sheets: [{ title: 'Sheet1' }]
      }
    }] : [];
    
    return { hasRequiredInfo, missingInfo, actions };
  }
  
  // Análise similar para outros serviços (drive, calendar)
  // ...
  
  // Se não temos um analisador específico, retornar que precisamos de mais informações
  return {
    hasRequiredInfo: false,
    missingInfo: ["detalhes específicos sobre o que criar"],
    actions: []
  };
}

/**
 * Detecta se uma mensagem regular contém uma solicitação implícita de ação Google
 */
function detectImplicitGoogleAction(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  
  // Padrões para detectar ações implícitas do Google
  const drivePatterns = [
    /cri[ae]r?\s+(um|uma)\s+documento/i,
    /cri[ae]r?\s+(um|uma)\s+apresenta[çc][ãa]o/i,
    /cri[ae]r?\s+(um|uma)\s+arquivo/i,
    /salv[ae]r?\s+(no|na)\s+drive/i
  ];
  
  const sheetPatterns = [
    /cri[ae]r?\s+(um|uma)\s+planilha/i,
    /cri[ae]r?\s+(um|uma)\s+spreadsheet/i,
    /organiz[ae]r?\s+dados\s+em\s+planilha/i
  ];
  
  const calendarPatterns = [
    /cri[ae]r?\s+(um|uma)\s+evento/i,
    /agendar?\s+(um|uma)\s+reuni[ãa]o/i,
    /marcar?\s+(um|uma)\s+compromisso/i,
    /adicionar?\s+ao\s+calend[áa]rio/i
  ];
  
  // Verificar todos os padrões
  for (const pattern of [...drivePatterns, ...sheetPatterns, ...calendarPatterns]) {
    if (pattern.test(lowerMessage)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Enriquece a mensagem com contexto para ações Google
 */
function enhanceWithGoogleActionContext(message: string): string {
  return `${message}\n\nSe você precisar criar arquivos no Google Drive, planilhas no Google Sheets ou eventos no Calendar, posso ajudar com isso. Apenas me informe claramente o que deseja criar e forneça os detalhes necessários.`;
}

/**
 * Processa e executa ações de integração com Google
 */
export async function processGoogleIntegrationActions(
  userId: string,
  actions: any[]
): Promise<{
  success: boolean;
  needsMoreInfo: boolean;
  followupPrompt?: string;
  results: any[];
}> {
  console.log(`[orchestrator] Processando ${actions.length} ações de integração Google`);
  
  if (!userId) {
    console.error("[orchestrator] ID de usuário não fornecido para ações Google");
    return {
      success: false,
      needsMoreInfo: true,
      followupPrompt: "Você precisa estar conectado com sua conta Google para usar este recurso. Acesse as Integrações do Google nas configurações.",
      results: []
    };
  }
  
  try {
    const results = [];
    let needsMoreInfo = false;
    let followupPrompt = '';
    
    for (const action of actions) {
      console.log(`[orchestrator] Processando ação ${action.type}`);
      
      // Fazer chamada para a função edge do Google
      const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/google-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
        },
        body: JSON.stringify({
          userId,
          action: action.type === 'createSpreadsheet' ? 'createSpreadsheet' : 
                 action.type === 'createDocument' ? 'createDocument' : 
                 action.type === 'createCalendarEvent' ? 'createCalendarEvent' : 
                 'unknown',
          params: action.parameters
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[orchestrator] Erro ao executar ação Google: ${errorText}`);
        
        // Verifique se o erro é sobre permissões ou configuração
        if (errorText.includes('not configured') || errorText.includes('tokens not found')) {
          needsMoreInfo = true;
          followupPrompt = "Parece que você ainda não conectou sua conta Google ou não concedeu as permissões necessárias. Acesse as Integrações do Google nas configurações para conectar sua conta.";
          break;
        }
        
        results.push({
          actionType: action.type === 'createSpreadsheet' ? 'sheets' : 
                      action.type === 'createDocument' ? 'drive' : 
                      action.type === 'createCalendarEvent' ? 'calendar' : 
                      'unknown',
          success: false,
          error: errorText,
          description: `Falha ao ${action.type === 'createSpreadsheet' ? 'criar planilha' : 
                                    action.type === 'createDocument' ? 'criar documento' : 
                                    action.type === 'createCalendarEvent' ? 'criar evento' : 
                                    'executar ação'}`
        });
        continue;
      }
      
      const data = await response.json();
      console.log(`[orchestrator] Resultado da ação Google:`, data);
      
      if (data.success) {
        let description = '';
        
        if (action.type === 'createSpreadsheet') {
          description = `Planilha "${action.parameters.title}" criada com sucesso`;
        } else if (action.type === 'createDocument') {
          description = `Documento "${action.parameters.name}" criado com sucesso`;
        } else if (action.type === 'createCalendarEvent') {
          description = `Evento "${action.parameters.summary}" criado com sucesso`;
        }
        
        results.push({
          actionType: action.type === 'createSpreadsheet' ? 'sheets' : 
                      action.type === 'createDocument' ? 'drive' : 
                      action.type === 'createCalendarEvent' ? 'calendar' : 
                      'unknown',
          success: true,
          result: data,
          description
        });
      } else {
        results.push({
          actionType: action.type === 'createSpreadsheet' ? 'sheets' : 
                      action.type === 'createDocument' ? 'drive' : 
                      action.type === 'createCalendarEvent' ? 'calendar' : 
                      'unknown',
          success: false,
          error: data.error,
          description: `Falha ao ${action.type === 'createSpreadsheet' ? 'criar planilha' : 
                                    action.type === 'createDocument' ? 'criar documento' : 
                                    action.type === 'createCalendarEvent' ? 'criar evento' : 
                                    'executar ação'}`
        });
      }
    }
    
    return {
      success: results.some(r => r.success),
      needsMoreInfo,
      followupPrompt,
      results
    };
    
  } catch (error) {
    console.error("[orchestrator] Erro ao processar ações Google:", error);
    return {
      success: false,
      needsMoreInfo: false,
      results: [{
        actionType: 'unknown',
        success: false,
        error: error.message,
        description: 'Erro ao processar ações do Google'
      }]
    };
  }
}

// Funções auxiliares para detecção de conteúdo e recomendação de modelo
function detectContentTypeFromMessage(message: string, currentMode: string): string {
  // Se for um comando de serviço Google, usar o modo google-service
  if (detectGoogleServiceCommand(message)) {
    return "google-service";
  }
  
  // Outras detecções de modo (texto, imagem, etc.)
  // ...
  
  // Se não detectar outro modo, manter o modo atual
  return currentMode;
}

function getRecommendedModel(detectedMode: string, currentModel: string): string {
  // Para o modo de serviço Google, podemos manter o modelo atual
  if (detectedMode === "google-service") {
    return currentModel;
  }
  
  // Lógica para recomendar modelos com base no modo
  // ...
  
  // Se não houver recomendação específica, manter o modelo atual
  return currentModel;
}

/**
 * Determina se uma mensagem deve ser processada para extração de memória
 */
function shouldExtractMemory(message: string): boolean {
  // Comandos de serviço Google geralmente não precisam extrair memória
  if (detectGoogleServiceCommand(message)) {
    return false;
  }
  
  // Outras verificações para determinar se deve extrair memória
  // ...
  
  return false; // Por padrão, não extrair memória
}

export async function extractAndSaveMemory(userId: string, message: string, orchestratorResponse: any) {
  // Implementação existente...
}

// ... outras funções exportadas
