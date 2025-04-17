
# Gerenciamento de Contexto da Conversa

Este documento descreve como o contexto da conversa é gerenciado e enviado para os modelos de IA no sistema.

## Fluxo de Gerenciamento de Contexto

1. **Captura de Mensagens**
   - Todas as mensagens da conversa são armazenadas no estado `messages` em `useConversationMessages.ts`
   - Este estado é passado para os componentes e serviços que precisam do contexto

2. **Preparação do Contexto**
   - A função `prepareConversationHistory` em `messageService.ts` é responsável por formatar o histórico
   - Ela pega as últimas 30 mensagens da conversa para criar o contexto
   - Formata as mensagens com indicadores de "Usuário" e "Assistente (modelo: xxx)"
   - Remove conteúdos grandes como base64 e URLs longos para economizar tokens
   - Adiciona metadados sobre arquivos anexados

3. **Transmissão para API**
   - O contexto formatado é enviado para o modelo de IA via `apiService.sendRequest`
   - Inclui instruções explícitas para o modelo manter o contexto da conversa

4. **Uso em Diferentes Modos**
   - Modo de modelo único: contexto passado via `handleSingleModelMessage`
   - Modo de comparação: contexto passado via `handleCompareModels`
   - Ambos garantem que o histórico completo relevante seja transmitido

## Pontos de Integração

- `useMessageHandler.ts`: Principal coordenador que obtém o contexto e passa para os serviços
- `messageService.ts`: Prepara e formata o contexto a partir das mensagens
- `singleModelHandler.ts` e `compareModelsHandler.ts`: Passam o contexto para a API

## Limites e Considerações

- Limite de 30 mensagens recentes para evitar exceder os limites de tokens dos modelos
- Limpeza de conteúdo grande (imagens, URLs) para otimizar o uso de tokens
- Inclusão de informações sobre o modelo usado em cada resposta para melhor continuidade

## Depuração

Para ajudar na depuração do contexto, o sistema registra:
- Número de mensagens usadas para criar o contexto
- Tamanho do contexto em caracteres
- Primeiros 150 caracteres do contexto para inspeção rápida

## Fluxo Completo

```
[Usuário envia mensagem]
  ↓
[useMessageHandler processa a mensagem]
  ↓
[messageService prepara o contexto da conversa]
  ↓
[O contexto é enviado junto com a nova mensagem para a API]
  ↓
[O modelo de IA recebe o contexto completo e gera resposta]
  ↓
[A resposta é exibida e adicionada ao histórico de mensagens]
```
