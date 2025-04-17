
# Messaging System Documentation

## Overview

The messaging system is the core feature of our application, enabling users to engage in conversations with various AI models. It supports multiple modes of interaction including text, image generation, video generation, and audio generation.

## Key Components

### 1. Conversation Management

The conversation system is built on several interrelated hooks and components that manage the creation, selection, and manipulation of conversations.

#### useConversation Hook

This is the central hook that coordinates all conversation-related operations:

**Responsibilities:**
- Create new conversations
- Load and manage conversation messages
- Handle message sending
- Delete and rename conversations
- Navigate between conversations

**Key Methods:**
- `createNewConversation`: Creates a new conversation in the database
- `deleteConversation`: Removes a conversation
- `renameConversation`: Updates conversation title
- `sendMessage`: Processes and sends messages to AI models
- `loadMessages`: Retrieves messages for a selected conversation

#### useConversationState Hook

Manages the state of all conversations:

**Responsibilities:**
- Load user conversations from the database
- Track the current selected conversation
- Manage loading and error states

**Key Methods:**
- `setCurrentConversationId`: Updates the selected conversation
- `addConversation`: Adds a new conversation to state
- `removeConversation`: Removes a conversation from state
- `updateConversationTitle`: Updates a conversation's title

#### useConversationMessages Hook

Manages the state of messages within a conversation:

**Responsibilities:**
- Maintain the list of messages
- Add and remove messages
- Save messages to the database

**Key Methods:**
- `clearMessages`: Removes all messages from state
- `addUserMessage`: Adds a user message to state
- `addAssistantMessage`: Adds an AI response to state
- `saveUserMessage`: Persists a message to the database

### 2. Message Processing and Handling

The application uses a sophisticated system to process user messages and generate AI responses.

#### useMessageHandler Hook

Orchestrates the sending and processing of messages:

**Responsibilities:**
- Format and prepare messages for AI models
- Route messages to appropriate service based on mode and model
- Handle message streaming and processing
- Manage loading states

**Key Methods:**
- `sendMessage`: Main method for processing message sending
- `detectContentType`: Analyzes message content to suggest appropriate modes

#### useMessageProcessing Hook

Enhances messages with context and memory:

**Responsibilities:**
- Extract important information for memory
- Enhance prompts with relevant context
- Detect content types and suggest mode changes

**Key Methods:**
- `processUserMessageForMemory`: Extracts information for user memory
- `enhanceWithMemoryContext`: Adds memory context to prompts
- `prepareConversationHistory`: Formats history for AI models

### 3. API and Service Integration

The application connects to various AI services through a structured service layer.

#### useApiService Hook

Provides access to API communication services:

**Responsibilities:**
- Send requests to AI models
- Handle response processing
- Manage media storage

**Key Methods:**
- `sendRequest`: Sends formatted requests to AI models
- `storeMedia`: Stores generated media

#### messageService

Implements business logic for message processing:

**Responsibilities:**
- Handle single model message processing
- Manage model comparison workflows
- Process streaming responses

**Key Methods:**
- `handleSingleModelMessage`: Processes messages for a single model
- `handleCompareModels`: Processes messages for model comparison

## Message Workflows

### 1. Text Message Workflow

1. **User Input**: User types a message and selects a text model
2. **Message Preparation**:
   - Message is formatted
   - Conversation history is prepared
   - Memory context is added if relevant
3. **API Request**:
   - Message is sent to the AI model via Edge Function
   - Streaming is enabled for supported models
4. **Response Processing**:
   - Response is received and parsed
   - For streaming responses, content is updated incrementally
5. **State Update**:
   - Response is added to message state
   - Message is saved to database
   - UI is updated to display the response

### 2. Image Generation Workflow

1. **User Input**: User submits a prompt for image generation
2. **Request Processing**:
   - Prompt is formatted for image generation
   - Request is sent to appropriate model (e.g., Luma AI)
3. **Generation**:
   - AI service generates the image
   - Loading state is displayed during generation
4. **Response Handling**:
   - Generated image URL is received
   - Media is stored in gallery
5. **Display**:
   - Image is displayed in the chat
   - Image details are saved to the database

### 3. Video Generation Workflow

1. **User Input**: User submits a prompt for video generation
2. **Request Processing**:
   - Prompt is formatted for video model
   - Request is sent to video generation service (e.g., Luma AI)
3. **Generation**:
   - Video generation process begins
   - Loading animation is displayed
   - For Luma AI, this involves polling for completion
4. **Response Handling**:
   - Video URL is received and processed
   - Video is registered in gallery
5. **Display**:
   - Video player is embedded in chat
   - Video details are saved to the database

### 4. Audio Generation Workflow

1. **User Input**: User submits a prompt for audio generation
2. **Request Processing**:
   - Prompt is sent to audio generation model (e.g., ElevenLabs)
3. **Generation**:
   - Audio is generated by the service
   - Loading state is displayed
4. **Response Handling**:
   - Audio URL or data is received
   - Audio is registered in gallery
5. **Display**:
   - Audio player is embedded in chat
   - Audio details are saved to the database

### 5. Model Comparison Workflow

1. **User Input**: User enables model comparison and submits a message
2. **Parallel Processing**:
   - Message is sent to two different models simultaneously
   - Loading states are displayed for both models
3. **Response Collection**:
   - Responses from both models are collected
   - Responses are formatted for display
4. **Display**:
   - Both responses are shown in a comparative layout
   - Each response is saved to the database

## Memory Integration

### 1. Memory Extraction

1. **Message Analysis**: User messages are analyzed for important information
2. **Entity Extraction**: Key entities and facts are identified
3. **Storage**: Extracted information is stored in the user_memory table

### 2. Memory Enhancement

1. **Context Building**: Relevant memory items are retrieved based on current conversation
2. **Prompt Enhancement**: User prompts are enhanced with memory context
3. **Model Processing**: Enhanced prompts lead to more contextually relevant responses

## Error Handling

### 1. Network Failures

1. **Detection**: Network errors are caught during API calls
2. **User Feedback**: Error messages are displayed to the user
3. **Recovery**: System attempts to recover or provides retry options

### 2. Model Failures

1. **Error Response**: Model errors are captured and formatted
2. **Fallback Behavior**: System may switch to alternative models when available
3. **Error Display**: Clear error messages are shown in the chat interface

### 3. Media Loading Failures

1. **Detection**: Media loading errors are caught by event handlers
2. **Retry Mechanism**: Options to retry loading media are provided
3. **Alternative View**: Options to open media in new tabs are offered

## Database Schema

### Conversations Table

```sql
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

### Messages Table

```sql
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL,
  sender TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  model TEXT,
  mode TEXT NOT NULL,
  files TEXT[],
  media_url TEXT
);
```

### Media Gallery Table

```sql
CREATE TABLE public.media_gallery (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL,
  prompt TEXT NOT NULL,
  model_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);
```

## Performance Considerations

### 1. Message Loading Optimization

- Messages are loaded only for the active conversation
- Loading flags prevent multiple simultaneous loads
- Incremental loading could be implemented for long conversations

### 2. Media Handling

- Media loading states provide visual feedback
- Lazy loading prevents unnecessary bandwidth usage
- Error states include retry mechanisms

### 3. State Management

- Functional updates ensure correct state transitions
- Clear separation between local and database states
- Careful management of loading and error states

## Security Considerations

### 1. Message Storage

- Messages are associated with specific users through RLS policies
- Sensitive information is not extracted without permission
- Media URLs are secured through proper access control

### 2. API Communication

- API keys are stored securely in Supabase secrets
- All API requests are routed through secure Edge Functions
- Rate limiting is implemented where appropriate

## Future Enhancements

### 1. Enhanced Media Processing

- Additional media formats and models
- Media editing capabilities
- AI-based media enhancement

### 2. Advanced Memory System

- Improved entity extraction
- Semantic search for memory retrieval
- User control over memory retention

### 3. Real-time Features

- Collaborative conversations
- Live updates during media generation
- Progress indicators for long-running processes

## Code Examples

### Message Sending

```typescript
const sendMessage = async (
  content: string,
  mode: ChatMode = 'text',
  modelId: string,
  comparing = false,
  leftModel?: string | null,
  rightModel?: string | null,
  files?: string[],
  params?: LumaParams
) => {
  if (!currentConversationId) {
    setError('Nenhuma conversa selecionada. Por favor, inicie uma nova conversa.');
    return false;
  }
  
  if (isSending) {
    return false;
  }
  
  try {
    setIsSending(true);
    
    // Process message for memory
    if (user && user.id) {
      messageProcessing.processUserMessageForMemory(content);
    }
    
    // Prepare conversation history
    const conversationHistory = messageProcessing.prepareConversationHistory(
      messages.map(msg => ({ sender: msg.sender, content: msg.content }))
    );
    
    // Create user message
    const userMessageId = uuidv4();
    let targetModel: string | undefined;
    
    // Determine target model
    if (comparing) {
      if (!leftModel && rightModel) {
        targetModel = rightModel;
      } else if (leftModel && !rightModel) {
        targetModel = leftModel;
      }
    } else {
      targetModel = modelId;
    }
    
    // Create and add user message
    const userMessage: MessageType = {
      id: userMessageId,
      content,
      sender: 'user',
      timestamp: new Date().toISOString(),
      mode,
      files,
      model: targetModel
    };
    
    setMessages(prev => [...prev, userMessage]);
    await saveUserMessage(userMessage, currentConversationId);
    
    // Update title for new conversations
    if (messages.length === 0 || (messages.length === 1 && messages[0].sender === 'user')) {
      updateTitle(currentConversationId, content);
    }
    
    // Enhance with memory context
    const enhancedContent = await messageProcessing.enhanceWithMemoryContext(content, messages.length);
    
    // Process the message based on mode and model
    let result;
    
    if (comparing && leftModel && rightModel) {
      result = await messageService.handleCompareModels(
        enhancedContent, mode, leftModel, rightModel, currentConversationId,
        files, params, conversationHistory, user?.id
      );
    } else {
      result = await messageService.handleSingleModelMessage(
        enhancedContent, mode, targetModel || modelId, currentConversationId,
        messages, conversations, files, params, conversationHistory, user?.id
      );
    }
    
    return { 
      success: true, 
      modeSwitch: result?.modeSwitch ? result.modeSwitch.newMode : null 
    };
  } catch (err) {
    console.error('[useMessageHandler] Erro ao enviar mensagem:', err);
    return { success: false, modeSwitch: null };
  } finally {
    setIsSending(false);
  }
};
```

### Message Display

```jsx
// ChatMessage component structure
<div className={cn(
  "flex flex-col mb-4 animate-fade-in",
  isUser ? "items-end" : "items-start"
)}>
  <div className={cn(
    "chat-bubble group",
    isUser ? "user-bubble" : "ai-bubble",
    "break-words p-4 rounded-2xl max-w-[85%]",
    isUser ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white" : "bg-gradient-to-br from-gray-800/90 to-gray-900/90 text-white",
    isLoading && !isVideo && "animate-pulse",
    isError && "bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30"
  )}>
    {/* Message header with model info */}
    <div className="text-xs opacity-70 mb-1">
      {isUser ? "Você" : message.model}
      {/* Mode indicator */}
      {!isUser && message.mode && message.mode !== 'text' && (
        <span className="ml-1 opacity-70">• <ModeIcon mode={message.mode} className="inline" /></span>
      )}
    </div>
    
    {/* Message content with appropriate formatting */}
    <ChatMessageContent 
      content={displayContent}
      isLoading={isLoading && !isVideo}
      isError={isError}
      isStreaming={isStreaming}
    />
    
    {/* Loading animation for videos */}
    <VideoLoading 
      isLoading={isLoading} 
      isVideo={isVideo} 
      model={message.model || ''}
      onTimeout={handleVideoLoadingTimeout}
    />
    
    {/* Media container for images, videos, audio */}
    {mediaUrl && !isLoading && (message.mode === 'image' || message.mode === 'video' || message.mode === 'audio') && (
      <MediaContainer 
        mediaUrl={mediaUrl}
        mode={message.mode}
        onMediaLoaded={handleMediaLoaded}
        onMediaError={handleMediaError}
        mediaError={mediaError}
        isMediaLoading={isMediaLoading}
        retryMediaLoad={retryMediaLoad}
        openMediaInNewTab={openMediaInNewTab}
        audioData={message.audioData}
        prompt={message.content}
        modelId={message.model}
      />
    )}
  </div>
</div>
```
