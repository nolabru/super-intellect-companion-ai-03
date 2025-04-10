
# Documentação do Projeto: Aplicativo de Chat com IA

## Visão Geral

Este aplicativo é uma plataforma avançada de conversa com IA que permite aos usuários interagir com diferentes modelos de inteligência artificial. O sistema possibilita a criação de conversas textuais, bem como a geração de conteúdo multimídia como imagens, vídeos e áudios através de requisições de texto (prompts).

## Objetivos do Projeto

- Fornecer uma interface amigável para interação com modelos de IA
- Permitir a criação e gerenciamento de múltiplas conversas
- Oferecer suporte a diferentes modos de interação (texto, imagem, vídeo, áudio)
- Armazenar e exibir histórico de conversas e mídia gerada
- Implementar autenticação de usuários para salvar dados personalizados

## Arquitetura do Projeto

### Estrutura Tecnológica

- **Frontend:** React com TypeScript
- **Estilização:** Tailwind CSS com componentes Shadcn/ui
- **Gerenciamento de Estado:** React Context API e hooks personalizados
- **Roteamento:** React Router
- **Backend:** Supabase (PostgreSQL, autenticação, armazenamento)
- **Integrações de IA:** OpenAI, Anthropic, Luma AI, Eleven Labs

### Organização do Código

```
src/
├── components/      # Componentes React reutilizáveis
│   ├── ui/          # Componentes de UI básicos (shadcn/ui)
│   ├── conversation/# Componentes relacionados às conversas
│   ├── chat/        # Componentes relacionados à interface de chat
│   └── gallery/     # Componentes relacionados à galeria de mídia
├── contexts/        # Contextos React para estado global
├── hooks/           # Hooks personalizados
├── services/        # Serviços para comunicação com APIs
├── types/           # Definições de tipos TypeScript
├── utils/           # Funções utilitárias
├── pages/           # Componentes de página
├── integrations/    # Integrações com serviços externos
└── lib/             # Bibliotecas e utilidades diversas
```

## Fluxo de Trabalho (Workflow)

### Fluxo de Autenticação
1. Usuário acessa a aplicação
2. Se não estiver autenticado, é redirecionado para a página de login
3. Após autenticação bem-sucedida, o usuário é redirecionado para a página principal
4. O contexto de autenticação (AuthContext) mantém estado de login em toda a aplicação

### Fluxo de Conversação
1. Usuário seleciona ou cria uma nova conversa no sidebar
2. O sistema carrega mensagens da conversa selecionada do banco de dados
3. Usuário envia mensagem através do input de chat
4. A mensagem é processada pelo serviço de mensagens correspondente ao modo selecionado
5. A resposta da IA é exibida no chat e salva no banco de dados
6. Mídia gerada é armazenada na galeria do usuário

### Fluxo da Galeria de Mídia
1. Usuário acessa a página de galeria
2. O sistema carrega mídias associadas ao usuário do banco de dados
3. Usuário pode filtrar por tipo de mídia e data
4. Usuário pode visualizar, baixar ou excluir mídias

## Documentação Técnica por Arquivo

### Componentes Principais

#### `src/components/ConversationSidebar.tsx`

Responsável pela barra lateral que exibe o histórico de conversas e permite criar novas conversas.

**Funções Principais:**
- `handleNewConversation`: Cria uma nova conversa, limpa mensagens existentes e atualiza o estado.
- `handleSelectConversation`: Seleciona uma conversa existente, carrega suas mensagens ou força recarga.

#### `src/components/conversation/SidebarHeader.tsx`

Cabeçalho da barra lateral com botão para criar nova conversa e navegação entre modos.

**Funções Principais:**
- `handleNewConversation`: Verifica se usuário está logado antes de criar nova conversa.

#### `src/components/conversation/SidebarNavigation.tsx`

Fornece botões de navegação entre as seções principais da aplicação (Chat e Galeria).

#### `src/components/conversation/ConversationList.tsx`

Exibe a lista de conversas do usuário com opções para selecionar, renomear ou excluir.

#### `src/components/conversation/ConversationItem.tsx`

Componente de item individual da lista de conversas com funcionalidades de interação.

#### `src/components/ChatInterface.tsx`

Interface principal de chat que exibe mensagens e permite envio de novas mensagens.

**Funções Principais:**
- Filtro e exibição de mensagens
- Manipulação de estados de carregamento
- Integração com componentes de entrada de mensagem

#### `src/components/ChatMessage.tsx`

Exibe uma mensagem individual do chat com suporte a diferentes tipos de conteúdo.

**Funções Principais:**
- Renderização de conteúdo textual
- Exibição de mídia (imagens, vídeos, áudios)
- Tratamento de estados de carregamento e erro

#### `src/components/ChatInput.tsx`

Campo de entrada para novas mensagens com suporte a diferentes modos.

**Funções Principais:**
- Captura de input do usuário
- Envio de mensagens para processamento
- Controle de upload de arquivos

#### `src/pages/MediaGallery.tsx`

Página da galeria de mídia que exibe e gerencia conteúdo multimídia gerado.

**Funções Principais:**
- Carregamento e exibição de mídias
- Filtragem por tipo e data
- Exclusão de itens

### Hooks Personalizados

#### `src/hooks/useConversation.ts`

Hook central para gerenciamento de conversas.

**Funções Principais:**
- `loadConversationMessages`: Carrega mensagens de uma conversa específica.
- `forceReloadMessages`: Força recarregamento das mensagens da conversa atual.
- `handleCreateNewConversation`: Cria nova conversa com feedback visual imediato.
- `handleDeleteConversation`: Remove conversa e limpa estado relacionado.
- `handleRenameConversation`: Renomeia conversa existente.

#### `src/hooks/useConversationState.ts`

Gerencia o estado das conversas (lista, seleção, carregamento).

**Funções Principais:**
- Carregamento inicial de conversas do usuário
- Atualização de estado (seleção, adição, remoção, renomeação)

#### `src/hooks/useConversationMessages.ts`

Gerencia o estado e operações relacionadas às mensagens.

**Funções Principais:**
- `clearMessages`: Limpa todas as mensagens do estado.
- `addUserMessage`: Adiciona mensagem do usuário ao estado.
- `addAssistantMessage`: Adiciona resposta da IA ao estado.
- `saveUserMessage`: Salva mensagem no banco de dados.

#### `src/hooks/useMessageHandler.ts`

Gerencia o envio e processamento de mensagens.

**Funções Principais:**
- `sendMessage`: Envia mensagem para processamento com base no modo e modelo selecionados.

#### `src/hooks/useMediaGallery.ts`

Gerencia operações relacionadas à galeria de mídia.

**Funções Principais:**
- Carregamento, filtragem e exclusão de itens de mídia

### Serviços

#### `src/services/messageService.ts`

Serviço para processamento de mensagens e comunicação com APIs de IA.

**Funções Principais:**
- `handleSingleModelMessage`: Processa mensagem para um único modelo.
- `handleCompareModels`: Processa mensagem para comparação entre dois modelos.

### Utilidades

#### `src/utils/conversationUtils.ts`

Funções utilitárias para operações com conversas e mensagens.

**Funções Principais:**
- `loadUserConversations`: Carrega conversas do usuário do banco de dados.
- `saveMessageToDatabase`: Salva mensagem no banco de dados.

### Fluxos de Dados

#### Fluxo de Criação de Nova Conversa
1. Usuário clica em "Nova Conversa" no `SidebarHeader`
2. `handleNewConversation` em `ConversationSidebar` é chamada
3. `clearMessages` é executada para limpar o estado de mensagens
4. `setCurrentConversationId(null)` é chamada para sinalizar nova conversa
5. `createNewConversation` cria nova conversa no banco de dados
6. Nova conversa é adicionada ao estado através de `addConversation`
7. `setCurrentConversationId` define a nova conversa como atual

#### Fluxo de Seleção de Conversa Existente
1. Usuário clica em conversa na lista em `ConversationList`
2. `handleSelectConversation` em `ConversationSidebar` é chamada
3. Se for a mesma conversa, `forceReloadMessages` é executada
4. Se for diferente, `clearMessages` limpa mensagens atuais
5. `setCurrentConversationId` define nova conversa como atual
6. Efeito em `useConversation` detecta mudança e carrega mensagens

#### Fluxo de Envio de Mensagem
1. Usuário digita e envia mensagem em `ChatInput`
2. Mensagem é passada para `sendMessage` em `useMessageHandler`
3. `addUserMessage` adiciona mensagem ao estado
4. `saveUserMessage` salva mensagem no banco de dados
5. Serviço de mensagem processa conteúdo com API de IA apropriada
6. `addAssistantMessage` adiciona resposta ao estado
7. Resposta é salva no banco de dados

## Desafios e Soluções Técnicas

### Gerenciamento de Estado
- **Desafio**: Coordenar múltiplos estados entre conversas, mensagens e interfaces.
- **Solução**: Arquitetura baseada em hooks com separação clara de responsabilidades.

### Feedback Visual Imediato
- **Desafio**: Fornecer feedback instantâneo durante operações assíncronas.
- **Solução**: Atualização imediata do estado UI antes da conclusão de operações de banco de dados.

### Carregamento Eficiente
- **Desafio**: Evitar carregamentos redundantes e múltiplas chamadas de API.
- **Solução**: Sistema de flags de carregamento e rastreamento de estado de carregamento.

### Suporte a Múltiplos Formatos de Mídia
- **Desafio**: Lidar com diferentes tipos de mídia (imagem, vídeo, áudio) de forma unificada.
- **Solução**: Componentes adaptáveis com detecção de tipo e tratamento específico.

## Melhorias Futuras Possíveis

1. Implementação de cache local para melhor desempenho offline
2. Paginação de mensagens para conversas muito longas
3. Sistema de tags para organização de conversas
4. Implementação de temas personalizáveis
5. Suporte a múltiplos idiomas
6. Expansão para mais formatos de mídia e modelos de IA
7. Análise de sentimento e resumo automático de conversas
8. Exportação/importação de dados de conversa

## Conclusão

Este projeto implementa uma aplicação robusta de chat com IA que combina diversas tecnologias modernas para oferecer uma experiência rica ao usuário. A arquitetura modular e o uso extensivo de hooks personalizados permitem um gerenciamento de estado eficiente e uma separação clara de responsabilidades, facilitando a manutenção e expansão futura do código.
