
import { Session } from '@supabase/supabase-js';

export interface GoogleTokens {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
}

// Define a new interface for the user_google_tokens table
export interface UserGoogleToken {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  created_at: string;
  updated_at: string;
}

export type GoogleAuthContextType = {
  googleTokens: GoogleTokens | null;
  isGoogleConnected: boolean;
  loading: boolean;
  refreshGoogleTokens: () => Promise<boolean>;
  checkGooglePermissions: () => Promise<boolean>;
  disconnectGoogle: () => Promise<void>;
};
