
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

## 5. Google Workspace Agent Workflow

```mermaid
sequenceDiagram
    participant User
    participant ChatUI as Chat UI
    participant Analyzer as Message Analyzer
    participant Agent as Google Agent (Calendar/Sheets/Docs)
    participant EdgeFunction as Google API Function
    participant GServices as Google Services

    User->>ChatUI: Send message with @calendar/@sheet/@doc command
    ChatUI->>Analyzer: Process message
    Analyzer->>Agent: Detect command and route to appropriate agent
    Agent->>User: Ask for missing information
    User->>Agent: Provide required data
    Agent->>EdgeFunction: Send command to Google API function
    EdgeFunction->>Supabase: Retrieve Google tokens
    EdgeFunction->>GServices: Make API call with tokens
    GServices-->>EdgeFunction: Return operation result
    EdgeFunction-->>Agent: Return formatted response
    Agent-->>User: Confirm operation with link/details
```

## 6. Token Refresh and Permission Verification

```mermaid
sequenceDiagram
    participant GoogleAgent as Google Agent Function
    participant TokenManager as Token Manager
    participant EdgeFunction as Token Refresh Function
    participant Google as Google API
    participant Database as Supabase DB

    Note over GoogleAgent,Database: Before API Call
    GoogleAgent->>TokenManager: Check token validity
    TokenManager->>Database: Get tokens + expiry
    Database-->>TokenManager: Return token data
    
    alt Token expired or expiring soon
        TokenManager->>EdgeFunction: Request token refresh
        EdgeFunction->>Google: Refresh token request
        Google-->>EdgeFunction: New access token + expiry
        EdgeFunction->>Database: Update stored tokens
        Database-->>TokenManager: Return updated tokens
    end
    
    alt Required scopes missing
        TokenManager-->>GoogleAgent: Return MISSING_SCOPE error
        GoogleAgent-->>User: Request reconnection with additional scopes
    else All permissions valid
        TokenManager-->>GoogleAgent: Return valid token
        GoogleAgent->>Google: Make API request
    end
```

## 7. Memory System Workflow

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

## 8. Token Management Workflow

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

## 9. Media Gallery Workflow

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

## 10. Error Handling Workflow

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

## 11. Application Initialization Workflow

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

## 12. Google Calendar Agent Workflow

```mermaid
sequenceDiagram
    participant User
    participant ChatUI as Chat UI
    participant Analyzer as Message Analyzer
    participant CalendarAgent as Calendar Agent
    participant EdgeFunction as Calendar API Function
    participant GCalendar as Google Calendar

    User->>ChatUI: Send "@calendar create meeting tomorrow at 2pm"
    ChatUI->>Analyzer: Process message
    Analyzer->>CalendarAgent: Detect @calendar command
    CalendarAgent->>User: Ask for title, duration, guests
    User->>CalendarAgent: Provide missing information
    CalendarAgent->>EdgeFunction: Send create_event with all parameters
    EdgeFunction->>Supabase: Retrieve Google tokens
    EdgeFunction->>GCalendar: Create calendar event
    GCalendar-->>EdgeFunction: Return event ID and link
    EdgeFunction-->>CalendarAgent: Return success with event details
    CalendarAgent-->>User: Confirm event creation with link
```

## 13. Google Sheets Agent Workflow

```mermaid
sequenceDiagram
    participant User
    participant ChatUI as Chat UI
    participant Analyzer as Message Analyzer
    participant SheetsAgent as Sheets Agent
    participant EdgeFunction as Sheets API Function
    participant GSheets as Google Sheets

    User->>ChatUI: Send "@sheet create expense tracker"
    ChatUI->>Analyzer: Process message
    Analyzer->>SheetsAgent: Detect @sheet command
    SheetsAgent->>User: Ask for column names, data
    User->>SheetsAgent: Provide missing information
    SheetsAgent->>EdgeFunction: Send sheet_create with parameters
    EdgeFunction->>Supabase: Retrieve Google tokens
    EdgeFunction->>GSheets: Create/update spreadsheet
    GSheets-->>EdgeFunction: Return spreadsheet ID and link
    EdgeFunction-->>SheetsAgent: Return success with details
    SheetsAgent-->>User: Confirm sheet creation with link
```

## 14. Google Docs Agent Workflow

```mermaid
sequenceDiagram
    participant User
    participant ChatUI as Chat UI
    participant Analyzer as Message Analyzer
    participant DocsAgent as Docs Agent
    participant EdgeFunction as Docs API Function
    participant GDocs as Google Docs

    User->>ChatUI: Send "@doc create project proposal"
    ChatUI->>Analyzer: Process message
    Analyzer->>DocsAgent: Detect @doc command
    DocsAgent->>User: Ask for document content, sections
    User->>DocsAgent: Provide missing information
    DocsAgent->>EdgeFunction: Send doc_create with parameters
    EdgeFunction->>Supabase: Retrieve Google tokens
    EdgeFunction->>GDocs: Create/update document
    GDocs-->>EdgeFunction: Return document ID and link
    EdgeFunction-->>DocsAgent: Return success with details
    DocsAgent-->>User: Confirm document creation with link
```

This technical workflow documentation provides detailed sequence diagrams for the major processes in the application, making it easier to understand the interaction between different components and services.
