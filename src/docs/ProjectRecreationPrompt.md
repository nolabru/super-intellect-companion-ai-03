
# Project Recreation Prompt

## Overview
Create a multi-modal AI chat application that enables users to interact with various AI models through text conversations, image generation, video generation, and audio generation. The application should provide a seamless user experience with conversation history, media gallery, and integration with external AI services.

## Core Features

1. **Multi-modal AI Interaction**
   - Text-based conversations with AI models
   - Image generation from text prompts
   - Video generation from text prompts
   - Audio generation from text prompts

2. **Conversation Management**
   - Persistent conversation history
   - Ability to create, rename, and delete conversations
   - Context-aware responses that maintain conversation flow

3. **Media Gallery**
   - Collection of all generated media (images, videos, audio)
   - Filtering and organization capabilities
   - Preview functionality for all media types

4. **User Authentication**
   - Secure login/signup functionality
   - User profile management
   - Session persistence

5. **Google Integration**
   - Google Workspace integration
   - Google commands for calendar, docs, sheets, email, and drive

6. **Token System**
   - Usage tracking and metering
   - Token allocation and consumption
   - Monthly resets and usage statistics

## Technical Stack

1. **Frontend**
   - React with TypeScript
   - Tailwind CSS for styling
   - shadcn/ui component library
   - React Query for data fetching
   - React Router for navigation
   - Sonner for toast notifications

2. **Backend**
   - Supabase for authentication, database, and storage
   - Edge Functions for API integrations
   - PostgreSQL database

3. **AI Integrations**
   - OpenAI (GPT models)
   - Anthropic (Claude models)
   - PiAPI for image, video, and audio generation
   - Various specialized AI services for different media types

## Detailed Requirements

### Authentication System

Implement a secure authentication system using Supabase Auth with:
- Email/password login
- Google OAuth integration
- Session management
- Protected routes
- User profile with avatar and settings

### Conversation Interface

Create a chat interface with:
- Persistent sidebar with conversation list
- Chat area with message history
- Input area with mode selection (text, image, video, audio)
- Model selector for choosing AI models
- Support for markdown rendering in responses
- Media embedding within conversations

### PiAPI Integration

Implement comprehensive integration with PiAPI services to:
- Generate images with models like Flux, Midjourney, DALL-E 3, and SDXL
- Create videos with models like Kling, Hunyuan, and Hailuo
- Produce audio with models like DiffRhythm and ElevenLabs
- Handle asynchronous processing with status updates
- Provide error handling and retry mechanisms

### Media Gallery

Develop a media gallery that:
- Displays all generated media in a grid layout
- Allows filtering by media type and date
- Provides preview functionality for all media types
- Enables downloading and sharing of media
- Shows prompt and model information for each item

### Google Integration

Create Google Workspace integration that:
- Connects user's Google account
- Provides commands for Google services
- Implements calendar event creation
- Enables document and spreadsheet access
- Facilitates email drafting and sending
- Supports Drive file management

### Token Management

Implement a token system that:
- Tracks usage across different AI services
- Allocates monthly token quotas
- Shows usage statistics and forecasts
- Implements token pricing based on model and operation
- Prevents usage when tokens are depleted

## Database Schema

Create the following tables in Supabase:

1. **conversations**
   - id (UUID, primary key)
   - user_id (UUID, references auth.users)
   - title (text)
   - created_at (timestamp)
   - updated_at (timestamp)

2. **messages**
   - id (UUID, primary key)
   - conversation_id (UUID, references conversations)
   - sender (text: 'user' or 'assistant')
   - content (text)
   - timestamp (timestamp)
   - model (text, optional)
   - mode (text: 'text', 'image', 'video', 'audio')
   - files (text[], optional)
   - media_url (text, optional)

3. **media_gallery**
   - id (UUID, primary key)
   - user_id (UUID, references auth.users)
   - media_url (text)
   - media_type (text)
   - prompt (text)
   - model_id (text, optional)
   - created_at (timestamp)
   - metadata (jsonb, optional)

4. **piapi_tasks**
   - id (UUID, primary key)
   - task_id (text)
   - model (text)
   - media_type (text)
   - prompt (text, optional)
   - params (jsonb, optional)
   - status (text: 'pending', 'processing', 'completed', 'failed')
   - media_url (text, optional)
   - result (jsonb, optional)
   - created_at (timestamp)
   - updated_at (timestamp)

5. **user_google_tokens**
   - id (UUID, primary key)
   - user_id (UUID, references auth.users)
   - access_token (text)
   - refresh_token (text)
   - expires_at (bigint)
   - created_at (timestamp)
   - updated_at (timestamp)

6. **user_tokens**
   - id (UUID, primary key)
   - user_id (UUID, references auth.users)
   - tokens_remaining (integer)
   - tokens_used (integer)
   - last_reset_date (timestamp)
   - next_reset_date (timestamp)
   - created_at (timestamp)
   - updated_at (timestamp)

7. **user_memory**
   - id (UUID, primary key)
   - user_id (UUID, references auth.users)
   - key_name (text)
   - value (text)
   - title (text, optional)
   - source (text, optional)
   - created_at (timestamp)
   - updated_at (timestamp)

## Edge Functions

Implement the following Supabase Edge Functions:

1. **ai-chat**
   - Handles text-based AI interactions
   - Routes requests to appropriate AI models
   - Processes conversation context

2. **piapi-image-create-task**
   - Creates image generation tasks
   - Supports multiple models
   - Validates parameters

3. **piapi-video-create-task**
   - Creates video generation tasks
   - Handles different video models
   - Manages asynchronous processing

4. **piapi-audio-create-task**
   - Creates audio generation tasks
   - Supports text-to-speech and music generation
   - Configures audio parameters

5. **piapi-media-webhook**
   - Receives notifications from PiAPI
   - Processes completed media
   - Updates database records

6. **piapi-task-status**
   - Checks status of ongoing tasks
   - Retrieves progress information
   - Handles error states

7. **google-oauth-callback**
   - Handles Google OAuth flow
   - Exchanges authorization codes for tokens
   - Stores tokens securely

8. **google-token-refresh**
   - Refreshes expired Google tokens
   - Updates stored tokens
   - Handles refresh errors

9. **memory-extractor**
   - Processes messages for memory entities
   - Extracts key information
   - Enhances future responses with context

## User Interface Design

The application should have a clean, modern interface with:

1. **Main Layout**
   - Sidebar with conversation list and navigation
   - Main content area for chat or gallery
   - Header with user menu and tools
   - Dark theme with accent colors

2. **Chat Interface**
   - Message bubbles with clear user/AI distinction
   - Media previews embedded in messages
   - Status indicators for ongoing processes
   - Mode selector with icons for different media types
   - Model selector with performance indicators

3. **Media Gallery**
   - Grid layout with responsive sizing
   - Filter controls for media types and dates
   - Preview modal for detailed viewing
   - Metadata display with prompt and model information
   - Download and sharing options

4. **Settings and Profile**
   - User profile management
   - Google connection status and controls
   - Token usage statistics and purchase options
   - Application preferences

## Technical Workflows

### User Authentication Flow
1. User enters credentials
2. Supabase validates and returns session
3. Session is stored and user is redirected
4. Auth state updates throughout the application

### Conversation Flow
1. User creates or selects conversation
2. Messages are loaded from database
3. User sends message
4. Message is processed by appropriate AI service
5. Response is displayed and stored
6. Conversation history is updated

### Media Generation Flow
1. User selects media type and enters prompt
2. Request is sent to appropriate edge function
3. Edge function creates task in PiAPI
4. Task status is monitored
5. When complete, media is displayed and stored
6. Media gallery is updated

### Google Integration Flow
1. User connects Google account
2. Authorization code is exchanged for tokens
3. Tokens are stored securely
4. User can issue Google commands in chat
5. Commands are processed by specialized handlers

## Development Process

1. **Setup Project**
   - Initialize React with Vite and TypeScript
   - Configure Tailwind CSS and shadcn/ui
   - Set up Supabase client

2. **Implement Authentication**
   - Create auth pages and forms
   - Configure Supabase auth
   - Implement protected routes

3. **Build Core Conversation UI**
   - Create conversation components
   - Implement message display and input
   - Add conversation management

4. **Integrate AI Services**
   - Connect to OpenAI/Anthropic
   - Implement conversation context handling
   - Add model selection

5. **Implement PiAPI Integration**
   - Create edge functions for media generation
   - Build UI components for different media types
   - Implement status monitoring and display

6. **Develop Media Gallery**
   - Create gallery components and layout
   - Implement media filtering and preview
   - Connect to storage and database

7. **Add Google Integration**
   - Implement OAuth flow
   - Create specialized command handlers
   - Build UI for Google connection status

8. **Implement Token System**
   - Create token tracking database
   - Build UI for token display
   - Implement usage limitations

## UI Screens

1. **Login/Signup Screen**
2. **Main Chat Interface**
3. **Conversation Settings**
4. **Media Gallery**
5. **User Profile**
6. **Token Management**
7. **Settings Page**

## Testing Requirements

1. **Authentication Testing**
   - Verify login/signup flows
   - Test session persistence
   - Check protected routes

2. **Conversation Testing**
   - Test message sending/receiving
   - Verify conversation persistence
   - Check context handling

3. **Media Generation Testing**
   - Test image generation with different models
   - Verify video generation workflow
   - Check audio generation quality
   - Test error handling and retries

4. **Google Integration Testing**
   - Verify OAuth flow
   - Test token refresh
   - Check command processing

5. **Performance Testing**
   - Test with large conversation histories
   - Check media gallery with many items
   - Verify responsive design

## Deployment Considerations

1. **Environment Configuration**
   - Set up environment variables
   - Configure production settings

2. **Security Measures**
   - Implement proper API key handling
   - Ensure secure token storage
   - Configure Row Level Security in Supabase

3. **Performance Optimization**
   - Implement lazy loading for media
   - Optimize database queries
   - Configure caching where appropriate

## Additional Instructions

1. **Error Handling**
   - Implement comprehensive error handling
   - Provide user-friendly error messages
   - Log errors for debugging

2. **Accessibility**
   - Ensure keyboard navigation
   - Implement proper ARIA attributes
   - Test with screen readers

3. **Internationalization**
   - Structure the app for potential localization
   - Use translation-friendly text patterns
   - Consider right-to-left language support

4. **Documentation**
   - Create user documentation
   - Document API integrations
   - Provide setup instructions

This comprehensive prompt covers all aspects needed to recreate the multi-modal AI chat application with PiAPI integration. By following these detailed specifications, you should be able to build a fully functional system matching the original project's capabilities.
