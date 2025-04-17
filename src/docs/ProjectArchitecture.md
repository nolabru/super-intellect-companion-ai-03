
# Project Architecture Documentation

## 1. Overview

This application is a multi-modal AI chat platform that allows users to interact with various AI models through text, image generation, video generation, and audio generation. The application provides a seamless user experience with a conversational interface, media gallery, and integration with external AI services.

## 2. Technology Stack

### Frontend
- **React**: Core UI library for building the component-based interface
- **TypeScript**: Static type checking for improved code quality and developer experience
- **Tailwind CSS**: Utility-first CSS framework for styling
- **shadcn/ui**: Component library for consistent and accessible UI elements
- **React Router**: Navigation and routing between different pages
- **Tanstack React Query**: Data fetching and state management
- **Sonner**: Toast notifications

### Backend
- **Supabase**: Backend-as-a-Service platform providing:
  - **Authentication**: User authentication system
  - **Database**: PostgreSQL database for data storage
  - **Edge Functions**: Serverless functions for API integrations
  - **Storage**: File storage for media assets

### AI Integrations
- **OpenAI**: GPT models for text generation (GPT-4, etc.)
- **Anthropic**: Claude models for text generation
- **Luma AI**: Video and image generation
- **Eleven Labs**: Audio generation
- **Google**: Integration with Google services via OAuth

## 3. Core Architecture

The application follows a modern React architecture with a clear separation of concerns:

### Application Layers
1. **UI Layer**: React components that render the user interface
2. **State Management Layer**: Context providers and hooks that manage application state
3. **Service Layer**: Services that handle business logic and external API communications
4. **Data Access Layer**: Supabase client for database operations, authentication, and storage

### Key Architectural Patterns
- **Component Composition**: Building complex UIs from smaller, reusable components
- **Context API**: For global state management
- **Custom Hooks**: Encapsulating and reusing stateful logic
- **Service Pattern**: Isolating API communication and business logic
- **Repository Pattern**: For data access abstraction

## 4. Authentication System

### Authentication Flow
1. **User Registration**: Users can register with email/password
2. **User Login**: Users can log in with email/password
3. **Session Management**: Sessions are persisted using Supabase's session management
4. **OAuth Integration**: Google authentication is supported
5. **Token Refresh**: Automatic token refreshing to maintain sessions

### Related Components
- `AuthContext.tsx`: Manages authentication state
- `Auth.tsx`: Authentication page with login/signup forms
- `GoogleAuthContext.tsx`: Handles Google OAuth integration
- `UserMenu.tsx`: User profile and logout options

## 5. Conversation System

### Conversation Workflow
1. **Creation**: Users can create new conversations
2. **Loading**: Existing conversations are loaded from the database
3. **Message Exchange**: Users send messages and receive AI responses
4. **Conversation Management**: Users can rename, select, or delete conversations

### Key Components
- `useConversation.ts`: Central hook managing conversation state and operations
- `useConversationState.ts`: Manages conversations list and current selection
- `useConversationMessages.ts`: Manages message state within a conversation
- `useMessageHandler.ts`: Handles message sending and processing
- `ConversationSidebar.tsx`: Displays conversation history and controls
- `ChatInterface.tsx`: Main chat interface showing messages
- `ChatInput.tsx`: Input component for sending messages

## 6. AI Interaction Modes

### Text Mode
1. **User Input**: User types a text message
2. **Processing**: Message is sent to text-based AI models
3. **Response**: AI generates text response displayed in the chat

### Image Mode
1. **User Input**: User provides a text prompt for image generation
2. **Processing**: Prompt is sent to image generation models
3. **Response**: Generated image is displayed in the chat and saved to gallery

### Video Mode
1. **User Input**: User provides a text prompt for video generation
2. **Processing**: Prompt is sent to video generation models
3. **Response**: Generated video is displayed in the chat and saved to gallery

### Audio Mode
1. **User Input**: User provides a text prompt for audio generation
2. **Processing**: Prompt is sent to audio generation models
3. **Response**: Generated audio is displayed in the chat and saved to gallery

### Related Components
- `ModeSelector.tsx`: UI for selecting interaction mode
- `ModelSelector.tsx`: UI for selecting AI model
- `MediaContainer.tsx`: Displays generated media in chat

## 7. Memory System

### Memory Workflow
1. **Extraction**: Key information is extracted from user messages
2. **Storage**: Information is stored in the user's memory database
3. **Context Enhancement**: Future messages are enhanced with relevant memory context
4. **Retrieval**: Memory items can be viewed and managed by users

### Components
- `useMessageProcessing.ts`: Processes messages for memory extraction
- `memoryService.ts`: Service for memory operations
- `UserMemory.tsx`: Page for viewing and managing memory items

## 8. Media Gallery

### Gallery Workflow
1. **Generation**: Media is generated through AI interactions
2. **Storage**: Media URLs and metadata are saved to the database
3. **Retrieval**: Users can browse and filter their media gallery
4. **Management**: Users can view details and delete media items

### Components
- `MediaGallery.tsx`: Page displaying user's generated media
- `GalleryList.tsx`: List of media items with filtering
- `GalleryMediaCard.tsx`: Individual media item display

## 9. Token System

### Token Workflow
1. **Allocation**: Users receive a monthly allocation of tokens
2. **Consumption**: Tokens are consumed based on AI operations
3. **Tracking**: Token usage is tracked and displayed to users
4. **Replenishment**: Tokens are automatically reset on a monthly schedule

### Components
- `TokenDisplay.tsx`: Displays token balance and usage
- `TokenUsageChart.tsx`: Visualizes token usage over time
- `TokensPlans.tsx`: Page for viewing and managing token plans

## 10. Data Model

### Core Entities
1. **Users** (auth.users): Authentication users
2. **Profiles**: Extended user information
3. **Conversations**: Chat conversation containers
4. **Messages**: Individual chat messages
5. **Media Gallery**: Stored generated media
6. **User Memory**: Stored memory items
7. **User Tokens**: Token balance and usage tracking
8. **User Google Tokens**: Google OAuth tokens

### Key Relationships
- Users have many Conversations
- Conversations contain many Messages
- Users have one Profile
- Users have many Media Gallery items
- Users have many Memory items
- Users have one Token record
- Users may have Google Tokens

## 11. API Integration Architecture

### Integration Pattern
1. **Client Request**: Frontend sends request to Supabase Edge Function
2. **Edge Function Processing**: Edge function processes request and calls external API
3. **External API Communication**: External API generates response
4. **Response Handling**: Edge function processes response and returns to client
5. **Client Update**: Frontend updates UI based on response

### Key Edge Functions
- `ai-chat`: Main function for AI model integration
- `google-oauth-callback`: Handles Google OAuth callbacks
- `google-token-refresh`: Refreshes Google OAuth tokens
- `media-storage`: Handles media storage operations
- `memory-extractor`: Extracts memory from messages

## 12. Error Handling Strategy

### Error Handling Layers
1. **UI Layer**: Toast notifications for user-facing errors
2. **Service Layer**: Structured error handling and logging
3. **API Layer**: HTTP status codes and error messages
4. **Global Error Boundaries**: For catching unhandled React errors

### Key Error Handling Patterns
- **Try-Catch Blocks**: For asynchronous operations
- **Error States**: Components display appropriate UI for error states
- **Loading States**: Visual feedback during asynchronous operations
- **Fallback Content**: Alternative content when primary content fails to load

## 13. Performance Optimization

### Key Optimizations
1. **Lazy Loading**: Components and routes loaded only when needed
2. **Memoization**: React.memo, useMemo, and useCallback for preventing unnecessary renders
3. **Virtualization**: For efficiently rendering large lists
4. **Query Caching**: With React Query for reducing API calls
5. **Debouncing**: For input-heavy operations like search

## 14. Security Considerations

### Security Measures
1. **Authentication**: Secure user authentication through Supabase
2. **Row-Level Security**: Database access control at the row level
3. **API Key Protection**: Sensitive API keys stored in Supabase secrets
4. **Input Validation**: Client and server-side validation
5. **CORS Configuration**: Proper CORS settings for API endpoints

## 15. Deployment and Environment Setup

### Deployment Architecture
1. **Frontend**: Static site deployment
2. **Backend**: Supabase project with database and edge functions
3. **Media Storage**: Supabase storage for user-generated content
4. **Monitoring**: Error logging and performance monitoring

### Environment Configurations
- Development, Staging, and Production environments
- Environment-specific API endpoints and configurations

## 16. Future Enhancement Opportunities

1. **Real-time Collaboration**: Allow multiple users to interact in the same conversation
2. **Mobile Application**: Native mobile app versions
3. **Advanced Analytics**: User behavior and AI performance analytics
4. **Expanded AI Models**: Integration with more specialized AI models
5. **Accessibility Improvements**: Enhanced support for assistive technologies
6. **Internationalization**: Support for multiple languages
7. **Custom Domain Support**: Allow users to host on their own domains

## 17. System Requirements

### Minimum Browser Requirements
- **Chrome**: Version 80+
- **Firefox**: Version 78+
- **Safari**: Version 14+
- **Edge**: Version 80+

### Mobile Support
- **iOS**: Safari on iOS 14+
- **Android**: Chrome on Android 8+

### Performance Requirements
- **Response Time**: AI responses within 5 seconds
- **UI Responsiveness**: Interface updates within 100ms
- **Concurrent Users**: Support for thousands of concurrent users

### Reliability Requirements
- **Uptime**: 99.9% availability
- **Data Persistence**: No data loss during normal operations
- **Error Recovery**: Graceful handling of API failures

## 18. Development Workflow

### Development Process
1. **Feature Request/Bug Report**: Identification of new features or bugs
2. **Design and Planning**: UI/UX design and technical planning
3. **Implementation**: Code development and testing
4. **Review**: Code review and quality assurance
5. **Deployment**: Release to production environment
6. **Monitoring**: Post-deployment monitoring and feedback collection

### Code Organization
- **Component-Based Structure**: UI components organized by feature
- **Feature-Based Organization**: Related files grouped by feature
- **Shared Utilities**: Common utilities and helpers in shared directories
- **Type Definitions**: Shared TypeScript interfaces and types

## 19. Conclusion

This architecture documentation provides a comprehensive overview of the AI chat application's structure, technologies, and workflows. The application is built with modern web technologies and follows best practices for React development, ensuring a scalable, maintainable, and performant user experience.

The multi-modal approach to AI interaction combined with the robust conversation management system provides users with a flexible and powerful platform for engaging with various AI capabilities, while the authentication and token systems ensure secure and controlled access to these resources.
