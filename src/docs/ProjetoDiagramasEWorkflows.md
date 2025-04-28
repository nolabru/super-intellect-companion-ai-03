
# Documentação Completa do Projeto - Diagramas e Workflows

## Índice

1. [Visão Geral](#visão-geral)
2. [Diagramas de Classe](#diagramas-de-classe)
3. [Diagramas de Caso de Uso](#diagramas-de-caso-de-uso)
4. [Workflows de Funcionamento](#workflows-de-funcionamento)
5. [Workflows por Funcionalidade](#workflows-por-funcionalidade)
6. [Requisitos Funcionais](#requisitos-funcionais)

## Visão Geral

Este projeto implementa uma plataforma avançada de conversa com IA que permite aos usuários interagir com diferentes modelos de inteligência artificial. O sistema possibilita a criação de conversas textuais, bem como a geração de conteúdo multimídia como imagens, vídeos e áudios através de requisições de texto (prompts).

A plataforma é construída usando React com TypeScript para o frontend e Supabase para o backend, incluindo autenticação, banco de dados e armazenamento.

## Diagramas de Classe

### 1. Diagrama de Classes Principais

```mermaid
classDiagram
    class ChatInterface {
        +messages: Message[]
        +currentConversationId: string
        +isLoading: boolean
        +sendMessage(content: string): void
        +loadMessages(conversationId: string): void
    }
    
    class MessageInput {
        +message: string
        +mode: ChatMode
        +model: string
        +isImageGenerationModel: boolean
        +isSending: boolean
        +setMessage(text: string): void
        +onSendMessage(): void
        +onAttachment(): void
    }
    
    class ConversationSidebar {
        +conversations: Conversation[]
        +isLoading: boolean
        +createNewConversation(): void
        +selectConversation(id: string): void
        +deleteConversation(id: string): void
        +renameConversation(id: string, title: string): void
    }
    
    class MediaGallery {
        +media: MediaItem[]
        +isLoading: boolean
        +filters: GalleryFilters
        +loadMedia(): void
        +deleteMediaItem(id: string): void
        +applyFilters(filters: GalleryFilters): void
    }
    
    ChatInterface --> MessageInput: contém
    ChatInterface --> ConversationSidebar: interage com
    MessageInput --> ChatMode: usa
    ChatInterface --> MediaGallery: navega para
```

### 2. Diagrama de Classes de Autenticação e Contexto

```mermaid
classDiagram
    class AuthContext {
        +user: User | null
        +session: Session | null
        +isLoading: boolean
        +signIn(email, password): Promise
        +signUp(email, password): Promise
        +signOut(): Promise
    }
    
    class GoogleAuthContext {
        +isGoogleConnected: boolean
        +isLoading: boolean
        +connectGoogle(): Promise
        +disconnectGoogle(): Promise
    }
    
    class UseConversation {
        +conversations: Conversation[]
        +currentConversationId: string
        +messages: Message[]
        +createNewConversation(): Promise
        +loadConversationMessages(id): Promise
        +deleteConversation(id): Promise
        +renameConversation(id, title): Promise
    }
    
    class UseMessageHandler {
        +sendMessage(content, mode, model): Promise
        +handleImageGeneration(prompt): Promise
        +handleVideoGeneration(prompt): Promise
        +handleAudioGeneration(prompt): Promise
    }
    
    AuthContext --> GoogleAuthContext: estende
    UseConversation --> AuthContext: usa
    UseMessageHandler --> UseConversation: usa
```

### 3. Diagrama de Classes de Serviços

```mermaid
classDiagram
    class MessageService {
        +handleSingleModelMessage(params): Promise
        +handleCompareModels(params): Promise
        +processApiResponse(response): Message
    }
    
    class MediaService {
        +handleImageGeneration(prompt, model): Promise
        +handleVideoGeneration(prompt, model): Promise
        +handleAudioGeneration(prompt, model): Promise
        +saveMediaToGallery(media): Promise
    }
    
    class MemoryService {
        +extractMemoryFromMessage(message): Promise
        +getRelevantMemory(context): Promise
        +saveMemoryItem(item): Promise
    }
    
    class ApiService {
        +makeRequest(endpoint, data): Promise
        +handleApiError(error): void
        +getCachedResponse(key): any
    }
    
    MessageService --> ApiService: usa
    MediaService --> ApiService: usa
    MemoryService --> ApiService: usa
    MessageService --> MemoryService: usa
```

## Diagramas de Caso de Uso

### 1. Caso de Uso Principal - Interação com IA

```mermaid
graph TD
    A[Usuário] -->|Envia mensagem| B(Sistema processa mensagem)
    B -->|Formata contexto| C{Tipo de interação}
    C -->|Texto| D[Processa com modelo de texto]
    C -->|Imagem| E[Gera imagem com prompt]
    C -->|Vídeo| F[Gera vídeo com prompt]
    C -->|Áudio| G[Gera áudio com prompt]
    D -->|Retorna resposta| H[Exibe resposta de texto]
    E -->|Retorna URL| I[Exibe imagem gerada]
    F -->|Retorna URL| J[Exibe vídeo gerado]
    G -->|Retorna URL| K[Exibe player de áudio]
    I --> L[Salva na galeria]
    J --> L
    K --> L
```

### 2. Caso de Uso - Gerenciamento de Conversas

```mermaid
graph TD
    A[Usuário] -->|Cria nova conversa| B(Sistema cria conversa)
    A -->|Seleciona conversa| C(Sistema carrega mensagens)
    A -->|Renomeia conversa| D(Sistema atualiza título)
    A -->|Exclui conversa| E(Sistema remove conversa)
    B -->|Atualiza lista| F[Exibe nova conversa]
    C -->|Carrega histórico| G[Exibe mensagens]
    D -->|Atualiza metadados| F
    E -->|Remove da lista| F
```

### 3. Caso de Uso - Integração com Google

```mermaid
graph TD
    A[Usuário] -->|Solicita conectar Google| B(Sistema inicia OAuth)
    B -->|Redireciona| C[Tela consentimento Google]
    C -->|Concede permissão| D(Sistema recebe código)
    D -->|Troca código por tokens| E(Sistema armazena tokens)
    E -->|Atualiza status| F[Interface mostra conectado]
    A -->|Usa comando Google| G{Tipo de comando}
    G -->|Calendar| H[Cria evento]
    G -->|Drive| I[Gerencia arquivos]
    G -->|Email| J[Envia email]
    G -->|Sheet| K[Processa planilhas]
    A -->|Desconecta Google| L[Remove tokens]
```

## Workflows de Funcionamento

### Workflow Geral do Sistema

```mermaid
sequenceDiagram
    participant U as Usuário
    participant I as Interface
    participant C as Controlador
    participant S as Serviços
    participant A as APIs de IA
    participant D as Banco de Dados
    
    U->>I: Faz login
    I->>C: Autentica usuário
    C->>D: Verifica credenciais
    D-->>C: Retorna sessão
    C-->>I: Atualiza estado de autenticação
    
    U->>I: Seleciona conversa
    I->>C: Solicita mensagens
    C->>D: Busca histórico
    D-->>C: Retorna mensagens
    C-->>I: Exibe conversa
    
    U->>I: Envia mensagem/prompt
    I->>C: Processa mensagem
    C->>S: Encaminha para serviço apropriado
    S->>A: Envia para API de IA
    A-->>S: Retorna resposta/mídia
    S->>D: Salva resultado
    S-->>C: Retorna resultado processado
    C-->>I: Atualiza interface
    I-->>U: Mostra resposta/mídia
```

### Workflow de Inicialização da Aplicação

```mermaid
sequenceDiagram
    participant App
    participant AuthContext
    participant ConversationContext
    participant Supabase
    
    App->>AuthContext: Inicia carregamento
    AuthContext->>Supabase: Verifica sessão existente
    Supabase-->>AuthContext: Retorna sessão (ou null)
    AuthContext->>Supabase: Configura listener de autenticação
    AuthContext-->>App: Atualiza estado de autenticação
    
    App->>ConversationContext: Inicializa contexto
    
    Note over App,Supabase: Se usuário autenticado
    ConversationContext->>Supabase: Carrega conversas
    Supabase-->>ConversationContext: Retorna dados
    ConversationContext-->>App: Atualiza estado de conversas
    App->>App: Renderiza interface principal
    
    Note over App,Supabase: Se não autenticado
    App->>App: Redireciona para login
```

## Workflows por Funcionalidade

### 1. Workflow de Envio de Mensagem de Texto

```mermaid
sequenceDiagram
    participant U as Usuário
    participant MI as MessageInput
    participant MH as MessageHandler
    participant MC as MessageContext
    participant API as API Service
    participant DB as Database

    U->>MI: Digita e envia mensagem
    MI->>MH: sendMessage(text)
    MH->>MC: addUserMessage(text)
    MC->>DB: saveMessage(userMessage)
    MH->>API: requestCompletion(text, history)
    API-->>MH: responseText
    MH->>MC: addAssistantMessage(responseText)
    MC->>DB: saveMessage(assistantMessage)
    MC-->>MI: Atualiza interface
    MI-->>U: Exibe resposta
```

### 2. Workflow de Geração de Imagem

```mermaid
sequenceDiagram
    participant U as Usuário
    participant MI as MessageInput
    participant MH as MessageHandler
    participant MS as MediaService
    participant API as Image Generation API
    participant DB as Database
    participant S as Storage

    U->>MI: Envia prompt de imagem
    MI->>MH: sendMessage(prompt, 'image')
    MH->>MS: generateImage(prompt)
    MS->>API: requestImageGeneration(prompt)
    Note over MS,API: Processamento assíncrono
    API-->>MS: taskId
    MS->>DB: saveTask(taskId, 'pending')
    MS->>DB: Consulta status periodicamente
    API-->>API: Gera imagem
    API-->>MS: notifyComplete(imageUrl)
    MS->>S: storeImage(imageUrl)
    S-->>MS: storedImageUrl
    MS->>DB: updateTask(taskId, 'complete', storedImageUrl)
    MS->>DB: saveToGallery(imageData)
    MS-->>MH: imageResult
    MH-->>MI: Atualiza interface
    MI-->>U: Exibe imagem
```

### 3. Workflow de Integração com Google Calendar

```mermaid
sequenceDiagram
    participant U as Usuário
    participant MI as MessageInput
    participant CH as CommandHandler
    participant GS as GoogleService
    participant GT as GoogleTokens
    participant GAPI as Google Calendar API

    U->>MI: Digita "@calendar criar reunião amanhã 14h"
    MI->>CH: processCommand('@calendar', text)
    CH->>GT: checkTokenStatus()
    
    alt Tokens válidos
        GT-->>CH: tokens
        CH->>GS: createCalendarEvent(text, tokens)
        GS->>GAPI: createEvent(eventData, tokens)
        GAPI-->>GS: eventCreated
        GS-->>CH: success
        CH-->>MI: "Evento criado com sucesso"
        MI-->>U: Exibe confirmação
    else Tokens expirados
        GT->>GT: refreshTokens()
        GT-->>CH: newTokens
        CH->>GS: createCalendarEvent(text, newTokens)
        GS->>GAPI: createEvent(eventData, newTokens)
        GAPI-->>GS: eventCreated
        GS-->>CH: success
        CH-->>MI: "Evento criado com sucesso"
        MI-->>U: Exibe confirmação
    else Não conectado
        GT-->>CH: notConnected
        CH-->>MI: "Você precisa conectar sua conta Google"
        MI-->>U: Exibe erro
    end
```

### 4. Workflow de Galeria de Mídia

```mermaid
sequenceDiagram
    participant U as Usuário
    participant G as Gallery
    participant GS as GalleryService
    participant DB as Database
    participant S as Storage

    U->>G: Acessa galeria
    G->>GS: loadMedia()
    GS->>DB: queryMediaItems(userId)
    DB-->>GS: mediaMetadata
    
    loop Para cada item
        GS->>S: getMediaUrl(item.path)
        S-->>GS: signedUrl
    end
    
    GS-->>G: mediaItems
    G-->>U: Exibe galeria
    
    U->>G: Aplica filtro (tipo=imagem)
    G->>GS: filterMedia({type: 'image'})
    GS->>DB: queryMediaItems(userId, {type: 'image'})
    DB-->>GS: filteredMedia
    GS-->>G: filteredItems
    G-->>U: Exibe itens filtrados
    
    U->>G: Exclui item
    G->>GS: deleteMediaItem(itemId)
    GS->>S: deleteFile(path)
    GS->>DB: deleteMediaRecord(itemId)
    GS-->>G: confirmDelete
    G-->>U: Atualiza exibição
```

## Requisitos Funcionais

### 1. Sistema de Autenticação
- **RF1.1**: O sistema deve permitir que usuários criem contas com email e senha
- **RF1.2**: O sistema deve permitir autenticação com credenciais salvas
- **RF1.3**: O sistema deve suportar integração com Google via OAuth
- **RF1.4**: O sistema deve permitir que usuários desconectem suas contas vinculadas
- **RF1.5**: O sistema deve manter a sessão dos usuários entre visitas

### 2. Sistema de Conversação
- **RF2.1**: O sistema deve permitir criação de novas conversas
- **RF2.2**: O sistema deve salvar histórico de mensagens por conversa
- **RF2.3**: O sistema deve permitir renomear conversas
- **RF2.4**: O sistema deve permitir excluir conversas
- **RF2.5**: O sistema deve permitir selecionar entre diferentes modelos de IA
- **RF2.6**: O sistema deve permitir comparação entre respostas de modelos diferentes
- **RF2.7**: O sistema deve preservar o contexto da conversa para respostas contextuais

### 3. Sistema de Geração de Mídia
- **RF3.1**: O sistema deve permitir geração de imagens através de prompts
- **RF3.2**: O sistema deve permitir geração de vídeos através de prompts
- **RF3.3**: O sistema deve permitir geração de áudio através de prompts
- **RF3.4**: O sistema deve exibir feedback visual durante geração de mídia
- **RF3.5**: O sistema deve salvar mídia gerada na galeria do usuário
- **RF3.6**: O sistema deve permitir personalização de parâmetros por tipo de mídia
- **RF3.7**: O sistema deve suportar upload de arquivos para processamento

### 4. Sistema de Galeria
- **RF4.1**: O sistema deve exibir mídia gerada pelo usuário
- **RF4.2**: O sistema deve permitir filtragem por tipo de mídia
- **RF4.3**: O sistema deve permitir ordenação por data
- **RF4.4**: O sistema deve permitir exclusão de itens da galeria
- **RF4.5**: O sistema deve permitir download de mídia
- **RF4.6**: O sistema deve exibir detalhes de cada item (prompt, modelo usado)

### 5. Integração com Google
- **RF5.1**: O sistema deve suportar comandos para criar eventos no Google Calendar
- **RF5.2**: O sistema deve suportar comandos para enviar emails via Gmail
- **RF5.3**: O sistema deve suportar comandos para interagir com Google Docs
- **RF5.4**: O sistema deve suportar comandos para interagir com Google Sheets
- **RF5.5**: O sistema deve suportar comandos para gerenciar arquivos no Google Drive
- **RF5.6**: O sistema deve validar permissões antes de acessar serviços Google

### 6. Sistema de Memória
- **RF6.1**: O sistema deve extrair informações relevantes das conversas
- **RF6.2**: O sistema deve usar informações armazenadas para contextualizar respostas
- **RF6.3**: O sistema deve permitir visualização de itens de memória armazenados
- **RF6.4**: O sistema deve permitir exclusão de itens de memória específicos
- **RF6.5**: O sistema deve associar memória ao usuário correto

### 7. Sistema de Gestão de Tokens
- **RF7.1**: O sistema deve controlar o uso de tokens por usuário
- **RF7.2**: O sistema deve exibir saldo de tokens disponível
- **RF7.3**: O sistema deve renovar tokens conforme plano do usuário
- **RF7.4**: O sistema deve permitir aquisição de tokens adicionais
- **RF7.5**: O sistema deve alertar quando o saldo estiver baixo

### 8. Interface e Experiência do Usuário
- **RF8.1**: A interface deve ser responsiva para diferentes dispositivos
- **RF8.2**: O sistema deve fornecer feedback visual para operações em andamento
- **RF8.3**: O sistema deve suportar múltiplos idiomas
- **RF8.4**: O sistema deve ter modo claro e escuro
- **RF8.5**: O sistema deve oferecer opções de acessibilidade
- **RF8.6**: O sistema deve otimizar interações para dispositivos touch (móveis/tablets)
