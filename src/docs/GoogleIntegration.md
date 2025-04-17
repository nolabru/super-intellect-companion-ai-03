
# Google Integration Documentation

## Overview

Our application integrates with Google services to provide enhanced functionality. This integration uses OAuth 2.0 to securely authenticate users and access Google services with proper permission management.

## Integration Architecture

### 1. Google Auth Context

The `GoogleAuthContext` provides a central point for managing Google authentication state and operations:

**Key Responsibilities:**
- Track Google connection status
- Manage Google access and refresh tokens
- Handle token refresh operations
- Verify Google permissions

**Key State:**
- `googleTokens`: The current Google access and refresh tokens
- `isGoogleConnected`: Whether the user has connected their Google account
- `loading`: Loading state during operations

### 2. Types and Interfaces

```typescript
// Core token structure
export interface GoogleTokens {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
}

// Database table representation
export interface UserGoogleToken {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  created_at: string;
  updated_at: string;
}

// Context interface
export type GoogleAuthContextType = {
  googleTokens: GoogleTokens | null;
  isGoogleConnected: boolean;
  loading: boolean;
  refreshGoogleTokens: () => Promise<boolean>;
  checkGooglePermissions: () => Promise<boolean>;
  disconnectGoogle: () => Promise<void>;
};
```

### 3. Token Management

Google tokens are managed using the `useGoogleTokens` hook:

**Key Responsibilities:**
- Fetch tokens from the database
- Update token state
- Track connection status

```typescript
export const useGoogleTokens = () => {
  const [googleTokens, setGoogleTokens] = useState<GoogleTokens | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch Google tokens from Supabase
  const fetchGoogleTokens = async (session: Session | null) => {
    if (!session || !session.user) {
      setGoogleTokens(null);
      setIsGoogleConnected(false);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_google_tokens')
        .select('*')
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error fetching Google tokens:', error);
        setGoogleTokens(null);
        setIsGoogleConnected(false);
      } else if (data && data.length > 0) {
        const tokenData = data[0] as unknown as UserGoogleToken;
        setGoogleTokens({
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresAt: tokenData.expires_at,
        });
        setIsGoogleConnected(true);
      } else {
        setGoogleTokens(null);
        setIsGoogleConnected(false);
      }
    } catch (error) {
      console.error('Error fetching Google tokens:', error);
      setGoogleTokens(null);
      setIsGoogleConnected(false);
    } finally {
      setLoading(false);
    }
  };

  return {
    googleTokens,
    setGoogleTokens,
    isGoogleConnected,
    setIsGoogleConnected,
    loading,
    setLoading,
    fetchGoogleTokens,
  };
};
```

## Integration Workflows

### 1. Google Account Connection Flow

1. **Initiation**: User clicks "Connect with Google" button
2. **Authentication**: User authenticates with Google
3. **Permission Grant**: User grants required permissions
4. **Token Exchange**: Authorization code is exchanged for tokens
5. **Storage**: Tokens are stored in the database
6. **State Update**: Application updates connection state

### 2. Google Token Refresh Flow

1. **Token Expiration Check**: Application detects expired token
2. **Refresh Request**: Application calls `refreshGoogleTokens()`
3. **Edge Function Call**: Request is sent to token refresh edge function
4. **Token Exchange**: Refresh token is used to obtain new access token
5. **Database Update**: New tokens are stored in the database
6. **State Update**: Application updates token state

### 3. Google Permission Verification Flow

1. **Permission Check**: Application calls `checkGooglePermissions()`
2. **Edge Function Call**: Request is sent to permission verification function
3. **Token Validation**: Function checks token validity
4. **Scope Check**: Function verifies required scopes are granted
5. **Status Return**: Permission status is returned to the application
6. **UI Update**: Interface updates based on permission status

### 4. Google Integration Disconnection Flow

1. **Disconnection Request**: User clicks "Disconnect Google" button
2. **Token Revocation**: Application revokes Google access
3. **Database Cleanup**: Tokens are removed from the database
4. **State Update**: Application updates connection state
5. **UI Update**: Interface reflects disconnected state

## Edge Functions

### 1. google-oauth-callback

**Purpose**: Handles the OAuth callback process from Google

**Key Operations**:
- Process the authorization code from Google
- Exchange code for access and refresh tokens
- Store tokens in the database
- Redirect user back to the application

**Error Handling**:
- Invalid or missing code errors
- Token exchange failures
- Database operation failures

### 2. google-token-refresh

**Purpose**: Refreshes expired Google access tokens

**Key Operations**:
- Verify the user's identity
- Use refresh token to obtain new access token
- Update token records in the database
- Return new token information to client

**Error Handling**:
- Invalid refresh tokens
- Google API errors
- Database update failures

### 3. google-verify-permissions

**Purpose**: Verifies that Google tokens have necessary permissions

**Key Operations**:
- Verify token validity with Google
- Check that required scopes are granted
- Return permission status and error details if applicable

**Error Handling**:
- Token validation errors
- Missing required permissions
- Google API errors

## Database Schema

### user_google_tokens Table

```sql
CREATE TABLE public.user_google_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Apply Row Level Security
ALTER TABLE public.user_google_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view only their own tokens
CREATE POLICY "Users can view their own tokens" 
  ON public.user_google_tokens 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy for users to insert their own tokens
CREATE POLICY "Users can insert their own tokens" 
  ON public.user_google_tokens 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own tokens
CREATE POLICY "Users can update their own tokens" 
  ON public.user_google_tokens 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy for users to delete their own tokens
CREATE POLICY "Users can delete their own tokens" 
  ON public.user_google_tokens 
  FOR DELETE 
  USING (auth.uid() = user_id);
```

## Security Considerations

### 1. Token Storage

- Tokens are stored in the database with Row Level Security
- Each user can only access their own tokens
- Sensitive token data is never exposed to the client directly

### 2. OAuth Security

- Authorization Code flow is used for secure token exchange
- PKCE (Proof Key for Code Exchange) can be added for enhanced security
- Refresh tokens are handled securely in edge functions

### 3. Permissions Management

- Only requested scopes are granted
- Minimal permission scope is requested based on requirements
- Users can revoke access at any time

## UI Components

### GoogleIntegrationsPage

**Purpose**: Allows users to connect and manage Google integration

**Key Features**:
- Connection status display
- Connect/disconnect buttons
- Permission status information
- Error messaging and troubleshooting

### UserMenu Integration

**Purpose**: Displays Google connection status in user menu

**Key Features**:
- Connection indicator
- Quick access to Google integration settings

## Error Handling

### 1. Connection Failures

- Clear error messages for connection issues
- Troubleshooting information for common problems
- Automatic retry mechanisms where appropriate

### 2. Permission Issues

- Explanations for missing permissions
- Guidance on how to grant required permissions
- Re-authentication flows for permission updates

### 3. Token Expiration

- Automatic handling of token expiration
- Graceful degradation when refresh fails
- User notification for critical errors

## Implementation Challenges and Solutions

### 1. Token Refresh Reliability

**Challenge**: Ensuring reliable token refresh without disrupting user experience

**Solution**:
- Background refresh before token expiration
- Graceful error handling with retry mechanisms
- Clear user feedback when manual intervention is needed

### 2. Scope Management

**Challenge**: Balancing functionality with minimal permission requests

**Solution**:
- Requesting only essential scopes
- Progressive permission requests based on feature usage
- Clear explanations of why each permission is needed

### 3. Error Recovery

**Challenge**: Handling various error states gracefully

**Solution**:
- Comprehensive error categorization
- User-friendly error messages
- Guided recovery flows for common issues

## Future Enhancements

### 1. Additional Google Services

- Google Drive integration for file sharing
- Google Calendar integration for scheduling
- Google Meet integration for video conferencing

### 2. Enhanced Permission Management

- Granular scope selection for users
- Scope-based feature enablement
- Usage analytics for connected services

### 3. Multi-Account Support

- Support for connecting multiple Google accounts
- Account switching functionality
- Account-specific settings and preferences

## Code Examples

### Connecting to Google

```typescript
// In GoogleAuthContext.tsx
const connectGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'email profile',
        redirectTo: `${window.location.origin}/google-callback`
      }
    });
    
    if (error) {
      console.error('Error connecting to Google:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (err) {
    console.error('Exception during Google connection:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error' 
    };
  }
};
```

### Refreshing Google Tokens

```typescript
// In GoogleAuthContext.tsx
const refreshGoogleTokens = async (): Promise<boolean> => {
  if (!session || !session.user) {
    console.error('Cannot refresh Google tokens: No active session');
    return false;
  }
  
  try {
    setLoading(true);
    
    const { data, error } = await supabase.functions.invoke('google-token-refresh', {
      body: { userId: session.user.id }
    });
    
    if (error) {
      console.error('Error refreshing Google tokens:', error);
      return false;
    }
    
    if (data && data.success) {
      // Update token state with fresh tokens
      setGoogleTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: data.expiresAt
      });
      return true;
    } else {
      console.error('Failed to refresh Google tokens:', data?.error || 'Unknown error');
      return false;
    }
  } catch (err) {
    console.error('Exception refreshing Google tokens:', err);
    return false;
  } finally {
    setLoading(false);
  }
};
```

### Checking Google Permissions

```typescript
// In GoogleAuthContext.tsx
const checkGooglePermissions = async (): Promise<boolean> => {
  if (!session || !session.user) {
    console.error('Cannot check Google permissions: No active session');
    return false;
  }
  
  if (!googleTokens || !googleTokens.accessToken) {
    console.error('Cannot check Google permissions: No Google tokens available');
    return false;
  }
  
  try {
    setLoading(true);
    
    const { data, error } = await supabase.functions.invoke('google-verify-permissions', {
      body: { 
        userId: session.user.id,
        accessToken: googleTokens.accessToken
      }
    });
    
    if (error) {
      console.error('Error checking Google permissions:', error);
      return false;
    }
    
    return data?.hasPermissions || false;
  } catch (err) {
    console.error('Exception checking Google permissions:', err);
    return false;
  } finally {
    setLoading(false);
  }
};
```
