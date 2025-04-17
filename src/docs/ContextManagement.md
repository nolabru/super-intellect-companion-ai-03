
# Gerenciamento de Contexto da Conversa

Este documento descreve como o contexto da conversa é gerenciado e enviado para os modelos de IA no sistema.

## Fluxo de Gerenciamento de Contexto

1. **Captura de Mensagens**
   - Todas as mensagens da conversa são armazenadas no estado `messages` em `useConversationMessages.ts`
   - O estado é filtrado para incluir apenas mensagens relevantes (não loading, não error)
   - Apenas mensagens de tipo 'user' e 'assistant' são incluídas no contexto

2. **Preparação do Contexto**
   - A função `prepareFullContext` em `contextUtils.ts` é responsável pela formatação completa
   - Utiliza subfunções `filterMessagesForContext` e `formatMessagesForContext`
   - Combina o histórico da conversa com a memória do usuário (quando disponível)
   - Pega as últimas 30 mensagens da conversa para criar o contexto
   - Remove conteúdos grandes como base64 e URLs longos para economizar tokens

3. **Fluxo de Contextualização**
   - `useMessageHandler` obtém o contexto de memória via `messageProcessing.getMemoryContext()`
   - Combina o contexto de memória com histórico da conversa via `prepareFullContext`
   - O contexto completo é passado para os handlers `handleSingleModelMessage` ou `handleCompareModels`
   - Os handlers passam o contexto para a função `sendApiRequest` que envia para a API

4. **Uso em Diferentes Modos**
   - Modo de modelo único: contexto passado via `handleSingleModelMessage`
   - Modo de comparação: contexto passado via `handleCompareModels`
   - Ambos garantem que o histórico completo relevante seja transmitido

## Logs de Depuração

O sistema inclui logs detalhados em diversos pontos para facilitar a depuração:

- `contextUtils.ts`: Logs detalhados sobre filtragem e formatação
- `useMessageProcessing.ts`: Logs sobre obtenção de contexto de memória
- `messageService.ts`: Logs sobre preparação de histórico
- `singleModelHandler.ts`: Logs sobre envio de contexto para API
- `ai-chat/index.ts`: Logs no lado do servidor sobre contexto recebido

Exemplo de logs no console para acompanhar o fluxo:
```
[useMessageHandler] Contexto de memória obtido: 150 caracteres
[useMessageHandler] Preparou contexto completo com 1245 caracteres
[messageService] Enviando mensagem para gpt-4o com contexto de 1245 caracteres
[singleModelHandler] Enviando contexto: 1245 caracteres
[singleModelHandler] Primeiros 150 caracteres: Histórico de conversa...
[AI-Chat] Contexto recebido: 1245 caracteres
```

## Diagnóstico de Problemas

Se o contexto não estiver sendo mantido entre mensagens, verifique:

1. **Filtragem de mensagens**:
   - As mensagens estão sendo filtradas corretamente em `filterMessagesForContext`?
   - Apenas mensagens de tipo 'user' e 'assistant' são incluídas?
   - Mensagens com flag 'loading' ou 'error' são corretamente excluídas?

2. **Preparação do contexto**:
   - O contexto está sendo gerado em `prepareFullContext`?
   - Verifique logs para entender tamanho e conteúdo do contexto

3. **Envio para API**:
   - O contexto está sendo passado corretamente para `sendApiRequest`?
   - O endpoint da API está recebendo e processando o contexto?

4. **Modelo LLM**:
   - O modelo utilizado tem contexto suficiente para as mensagens enviadas?
   - O modelo está sendo instruído explicitamente a considerar o contexto?

## Fluxo Completo

```
[Usuário envia mensagem]
  ↓
[useMessageHandler processa a mensagem]
  ↓
[messageProcessing.getMemoryContext() obtém contexto de memória]
  ↓
[prepareFullContext() combina memória + histórico de conversa]
  ↓
[messageService.handleSingleModelMessage() envia ao modelo]
  ↓
[singleModelHandler inclui contexto na chamada à API]
  ↓
[AI-Chat recebe contexto e envia para o LLM]
  ↓
[O modelo de IA recebe o contexto completo e gera resposta]
  ↓
[A resposta é exibida e adicionada ao histórico de mensagens]
```

