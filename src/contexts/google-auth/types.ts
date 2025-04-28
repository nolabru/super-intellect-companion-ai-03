
export enum GoogleConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}

export interface GoogleTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface GoogleAuthContextType {
  googleTokens: GoogleTokens | null;
  isGoogleConnected: boolean;
  loading: boolean;
  connectionState: GoogleConnectionState;
  refreshGoogleTokens: () => Promise<boolean>;
  checkGooglePermissions: () => Promise<boolean>;
  disconnectGoogle: () => Promise<void>;
  refreshTokensState: () => Promise<void>;
}

// Array of Google API scopes required by the application
export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'openid'
];
