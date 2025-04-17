
# Authentication Flow Documentation

## Overview

The authentication system in our application is built on Supabase Auth, providing a secure, token-based authentication flow with support for email/password authentication and Google OAuth integration.

## Authentication Components

### 1. AuthContext

The `AuthContext` provides application-wide access to authentication state and functions.

**Key Responsibilities:**
- Maintain current session state
- Provide user information
- Handle sign-out functionality
- Set up authentication state change listeners

**Implementation Details:**
```typescript
// AuthContext maintains both session and user state
const [session, setSession] = useState<Session | null>(null);
const [user, setUser] = useState<User | null>(null);
const [loading, setLoading] = useState(true);

// Critical initialization order to prevent deadlocks
useEffect(() => {
  // Set up auth state listener FIRST
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }
  );

  // THEN check for existing session
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
    setUser(session?.user ?? null);
    setLoading(false);
  });

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

### 2. GoogleAuthContext

Extends the base authentication with Google-specific functionality:

**Key Responsibilities:**
- Manage Google OAuth tokens
- Check Google service permissions
- Refresh Google tokens when needed
- Provide connection status

**Implementation Details:**
```typescript
// Manage Google tokens separately from the main auth flow
const [googleTokens, setGoogleTokens] = useState<GoogleTokens | null>(null);
const [isGoogleConnected, setIsGoogleConnected] = useState<boolean>(false);
const [loading, setLoading] = useState<boolean>(true);

// Synchronize with user authentication state
useEffect(() => {
  if (session) {
    fetchGoogleTokens(session);
  } else {
    setGoogleTokens(null);
    setIsGoogleConnected(false);
  }
}, [session]);
```

## Authentication Flows

### 1. Email/Password Registration Flow

1. User enters email and password on the Auth page
2. Client validates input
3. `supabase.auth.signUp()` is called
4. Supabase creates a new user and sends confirmation email (if enabled)
5. On success, user is redirected to the main application
6. Auth state is updated throughout the application via `onAuthStateChange`

### 2. Email/Password Login Flow

1. User enters email and password on the Auth page
2. Client validates input
3. `supabase.auth.signInWithPassword()` is called
4. Supabase validates credentials and returns session
5. Session is stored and user is redirected to the main application
6. Auth state is updated throughout the application via `onAuthStateChange`

### 3. Google OAuth Flow

1. User clicks "Sign in with Google" button
2. `supabase.auth.signInWithOAuth()` is called with Google provider
3. User is redirected to Google consent screen
4. After consent, Google redirects back to our application
5. Supabase Edge Function handles the OAuth callback
6. Google tokens are stored in the database
7. User is redirected to the main application
8. Both Auth context and Google Auth context are updated

### 4. Session Refresh Flow

1. `AuthContext` initializes with `autoRefreshToken: true`
2. When token approaches expiration, Supabase refreshes automatically
3. `onAuthStateChange` captures the refreshed session
4. Auth state is updated throughout the application

### 5. Sign Out Flow

1. User initiates sign out from the UI
2. `signOut()` function from `AuthContext` is called
3. `supabase.auth.signOut()` is executed
4. All local session data is cleared
5. `onAuthStateChange` detects the change and updates state
6. User is redirected to the Auth page

## Google Integration Flow

### 1. Google Connection Flow

1. User initiates Google connection from the Google Integrations page
2. User is redirected to Google consent screen
3. After consent, Google redirects back with authorization code
4. Edge Function exchanges code for tokens
5. Tokens are stored in the database
6. `isGoogleConnected` state is updated

### 2. Google Token Refresh Flow

1. Application detects expired Google token
2. `refreshGoogleTokens()` is called
3. Edge Function exchanges refresh token for new access token
4. New tokens are stored in the database
5. Updated token state is provided to the application

### 3. Google Permission Verification Flow

1. Application needs to verify Google permissions
2. `checkGooglePermissions()` is called
3. Edge Function checks token validity and permissions
4. Result is returned to application
5. UI is updated based on permission status

## Security Considerations

1. **Token Storage**: Tokens are stored securely in protected database tables
2. **Row-Level Security**: Database access is controlled through RLS policies
3. **HTTPS Only**: All authentication flows require HTTPS
4. **Token Expiration**: Sessions and tokens have appropriate expiration times
5. **Refresh Flow**: Tokens are refreshed securely without user intervention

## Error Handling

1. **Authentication Errors**: Displayed to the user with clear messages
2. **Network Failures**: Retry mechanisms for intermittent connectivity issues
3. **Token Expiration**: Automatic handling of expired tokens
4. **Edge Cases**: Custom handling for various error scenarios

## Database Schema

### User Google Tokens Table

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
```

## Edge Functions

### google-oauth-callback

Handles the OAuth callback process from Google:
- Exchanges authorization code for tokens
- Stores tokens in the database
- Redirects user back to the application

### google-token-refresh

Refreshes expired Google tokens:
- Uses refresh token to obtain new access token
- Updates token records in the database
- Returns new tokens to the client

### google-verify-permissions

Verifies that Google tokens have necessary permissions:
- Checks token validity
- Verifies scopes and permissions
- Returns permission status to client

## Best Practices Implemented

1. **Separation of Concerns**: Authentication logic is isolated in dedicated contexts
2. **Proper Initialization Order**: Auth listeners are set up before session checks
3. **Comprehensive Error Handling**: All authentication operations include error handling
4. **Security-First Approach**: Secure token storage and transmission
5. **User Experience**: Smooth login flow with appropriate feedback

## Common Issues and Solutions

1. **Session Persistence Issues**: Fixed by proper initialization order in AuthContext
2. **Token Refresh Failures**: Addressed with robust error handling and retry logic
3. **Google OAuth Errors**: Comprehensive error reporting in callbacks
4. **Race Conditions**: Prevented by careful state management

## Testing Authentication

1. **Manual Testing**: Sign up, sign in, and sign out flows
2. **Edge Cases**: Session expiration, token refresh, network failures
3. **Google Integration**: Connection, permission checking, and disconnection
