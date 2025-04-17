
# Technical Workflow Documentation

## 1. User Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant AuthUI as Auth UI Component
    participant AuthContext
    participant Supabase
    participant Database

    User->>AuthUI: Enter credentials
    AuthUI->>Supabase: signInWithPassword()
    Supabase-->>AuthUI: Return session
    AuthUI->>AuthContext: Update session state
    AuthContext-->>User: Redirect to application

    note over AuthContext,Supabase: On subsequent page loads
    AuthContext->>Supabase: getSession()
    Supabase-->>AuthContext: Return existing session
    AuthContext->>Supabase: Set up onAuthStateChange listener
    Supabase-->>AuthContext: Notify of auth changes
```

## 2. Conversation Creation and Message Flow

```mermaid
sequenceDiagram
    participant User
    participant ChatUI as Chat UI
    participant Hooks as Conversation Hooks
    participant Supabase
    participant EdgeFunction as Edge Function
    participant AI as AI Service

    User->>ChatUI: Create new conversation
    ChatUI->>Hooks: handleCreateNewConversation()
    Hooks->>Supabase: Insert new conversation
    Supabase-->>Hooks: Return conversation ID
    Hooks-->>ChatUI: Update UI with new conversation

    User->>ChatUI: Type and send message
    ChatUI->>Hooks: sendMessage()
    Hooks->>Supabase: Save user message
    Hooks->>EdgeFunction: Forward message to AI
    EdgeFunction->>AI: Request completion
    AI-->>EdgeFunction: Return response
    EdgeFunction-->>Hooks: Return processed response
    Hooks->>Supabase: Save AI response
    Hooks-->>ChatUI: Update UI with response
```

## 3. Media Generation Workflow

```mermaid
sequenceDiagram
    participant User
    participant ChatUI as Chat UI
    participant Hooks as Message Hooks
    participant EdgeFunction as Edge Function
    participant AI as AI Service
    participant Storage as Media Storage
    participant Gallery as Media Gallery

    User->>ChatUI: Send media generation prompt
    ChatUI->>Hooks: sendMessage() with media mode
    Hooks->>EdgeFunction: Forward to specialized endpoint
    EdgeFunction->>AI: Generate media
    AI-->>EdgeFunction: Return media data/URL
    EdgeFunction->>Storage: Store media if needed
    Storage-->>EdgeFunction: Return storage URL
    EdgeFunction-->>Hooks: Return media response
    Hooks->>Gallery: Register in media gallery
    Hooks-->>ChatUI: Display media in chat
```

## 4. Google Integration Workflow

```mermaid
sequenceDiagram
    participant User
    participant AppUI as Application UI
    participant GoogleAuthContext
    participant Supabase
    participant EdgeFunction as OAuth Edge Function
    participant Google as Google OAuth

    User->>AppUI: Request Google connection
    AppUI->>Supabase: signInWithOAuth(google)
    Supabase-->>User: Redirect to Google consent
    User->>Google: Grant permissions
    Google-->>EdgeFunction: Redirect with auth code
    EdgeFunction->>Google: Exchange code for tokens
    Google-->>EdgeFunction: Return access & refresh tokens
    EdgeFunction->>Supabase: Store tokens in database
    EdgeFunction-->>User: Redirect to application
    AppUI->>GoogleAuthContext: Check connection status
    GoogleAuthContext->>Supabase: Query token status
    Supabase-->>GoogleAuthContext: Return connection status
    GoogleAuthContext-->>AppUI: Update UI with status
```

## 5. Memory System Workflow

```mermaid
sequenceDiagram
    participant User
    participant ChatUI as Chat UI
    participant MessageHandler
    participant MemoryService
    participant EdgeFunction as Memory Edge Function
    participant Supabase

    User->>ChatUI: Send message
    ChatUI->>MessageHandler: Process message
    MessageHandler->>MemoryService: Extract memory entities
    MemoryService->>EdgeFunction: Process with AI extraction
    EdgeFunction-->>MemoryService: Return memory items
    MemoryService->>Supabase: Store memory items
    
    note over MessageHandler,MemoryService: For future messages
    MessageHandler->>MemoryService: Request relevant context
    MemoryService->>Supabase: Query memory database
    Supabase-->>MemoryService: Return relevant memories
    MemoryService-->>MessageHandler: Enhance prompt with context
```

## 6. Token Management Workflow

```mermaid
sequenceDiagram
    participant User
    participant AppUI as Application UI
    participant MessageHandler
    participant Supabase
    participant EdgeFunction as Token Edge Function

    User->>AppUI: Send message/request
    AppUI->>MessageHandler: Process operation
    MessageHandler->>EdgeFunction: Check token balance
    EdgeFunction->>Supabase: Query token function
    Supabase-->>EdgeFunction: Return token status
    
    alt Has sufficient tokens
        EdgeFunction-->>MessageHandler: Approve operation
        MessageHandler->>EdgeFunction: Process AI request
        EdgeFunction->>Supabase: Update token usage
    else Insufficient tokens
        EdgeFunction-->>MessageHandler: Reject operation
        MessageHandler-->>AppUI: Display token error
    end
```

## 7. Media Gallery Workflow

```mermaid
sequenceDiagram
    participant User
    participant GalleryUI as Gallery UI
    participant GalleryHook as Media Gallery Hook
    participant Supabase

    User->>GalleryUI: Open gallery page
    GalleryUI->>GalleryHook: Load media items
    GalleryHook->>Supabase: Query media_gallery table
    Supabase-->>GalleryHook: Return media items
    GalleryHook-->>GalleryUI: Update UI with media
    
    User->>GalleryUI: Apply filters
    GalleryUI->>GalleryHook: Filter media items
    GalleryHook->>Supabase: Query with filters
    Supabase-->>GalleryHook: Return filtered items
    GalleryHook-->>GalleryUI: Update UI with filtered media
    
    User->>GalleryUI: Delete media item
    GalleryUI->>GalleryHook: Delete item request
    GalleryHook->>Supabase: Delete from database
    Supabase-->>GalleryHook: Confirm deletion
    GalleryHook-->>GalleryUI: Update UI to remove item
```

## 8. Error Handling Workflow

```mermaid
sequenceDiagram
    participant User
    participant AppUI as Application UI
    participant Hooks as App Hooks
    participant ErrorHandler
    participant Monitoring

    User->>AppUI: Perform action
    
    alt Action succeeds
        AppUI->>Hooks: Process action
        Hooks-->>AppUI: Return success result
        AppUI-->>User: Display success UI
    else Action fails
        AppUI->>Hooks: Process action
        Hooks->>ErrorHandler: Handle error
        ErrorHandler->>Monitoring: Log error details
        ErrorHandler-->>Hooks: Return formatted error
        Hooks-->>AppUI: Return error result
        AppUI-->>User: Display error message
    end
```

## 9. Application Initialization Workflow

```mermaid
sequenceDiagram
    participant Browser
    participant App
    participant AuthContext
    participant GoogleAuthContext
    participant ConversationHook
    participant Supabase

    Browser->>App: Load application
    App->>AuthContext: Initialize auth
    AuthContext->>Supabase: Set up auth listeners
    AuthContext->>Supabase: Check for existing session
    Supabase-->>AuthContext: Return session data
    
    alt User is authenticated
        AuthContext->>GoogleAuthContext: Initialize Google auth
        GoogleAuthContext->>Supabase: Fetch Google tokens
        Supabase-->>GoogleAuthContext: Return token status
        AuthContext->>ConversationHook: Load user conversations
        ConversationHook->>Supabase: Query conversations
        Supabase-->>ConversationHook: Return conversation data
        App-->>Browser: Render authenticated UI
    else User is not authenticated
        App-->>Browser: Redirect to auth page
    end
```

## 10. Session Refresh Workflow

```mermaid
sequenceDiagram
    participant Browser
    participant AuthContext
    participant Supabase
    participant BackendAuth as Supabase Auth Backend

    note over AuthContext,Supabase: Session approaches expiration
    Supabase->>BackendAuth: Detect expiring session
    BackendAuth-->>Supabase: Refresh token automatically
    Supabase->>AuthContext: Trigger onAuthStateChange
    AuthContext->>AuthContext: Update session state
    
    alt Refresh succeeds
        AuthContext-->>Browser: Continue normal operation
    else Refresh fails
        AuthContext->>AuthContext: Clear session state
        AuthContext-->>Browser: Redirect to login
    end
```

## 11. API Request Workflow

```mermaid
sequenceDiagram
    participant AppComponent as App Component
    participant ApiService as API Service
    participant Supabase
    participant EdgeFunction as Edge Function
    participant ExternalAPI as External API Service

    AppComponent->>ApiService: Request operation
    ApiService->>Supabase: Invoke edge function
    Supabase->>EdgeFunction: Execute function
    
    EdgeFunction->>ExternalAPI: Make API request
    ExternalAPI-->>EdgeFunction: Return response
    
    EdgeFunction-->>Supabase: Return processed result
    Supabase-->>ApiService: Return function result
    ApiService-->>AppComponent: Return formatted response
```

## 12. Multi-Modal AI Routing Workflow

```mermaid
sequenceDiagram
    participant User
    participant ChatUI as Chat UI
    participant MessageHandler
    participant Analyzer as Content Analyzer
    participant Router as Mode Router
    participant AIServices as AI Services

    User->>ChatUI: Send message
    ChatUI->>MessageHandler: Process message
    MessageHandler->>Analyzer: Analyze content
    
    alt Text content detected
        Analyzer-->>Router: Route to text model
        Router->>AIServices: Send to text API
    else Image generation detected
        Analyzer-->>Router: Route to image model
        Router->>AIServices: Send to image API
    else Video generation detected
        Analyzer-->>Router: Route to video model
        Router->>AIServices: Send to video API
    else Audio generation detected
        Analyzer-->>Router: Route to audio model
        Router->>AIServices: Send to audio API
    end
    
    AIServices-->>MessageHandler: Return processed response
    MessageHandler-->>ChatUI: Update UI with response
```

This technical workflow documentation provides detailed sequence diagrams for the major processes in the application, making it easier to understand the interaction between different components and services.
