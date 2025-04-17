
export interface GoogleTokens {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
}

export interface UserGoogleToken {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  permissions_verified: boolean;
  last_verified_at: string;
  created_at: string;
  updated_at: string;
}

export type GoogleAuthContextType = {
  googleTokens: GoogleTokens | null;
  isGoogleConnected: boolean;
  permissionsVerified: boolean;
  loading: boolean;
  refreshGoogleTokens: () => Promise<boolean>;
  checkGooglePermissions: () => Promise<boolean>;
  disconnectGoogle: () => Promise<void>;
};
