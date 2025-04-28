
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
  disconnectGoogle: () => Promise<void>;
}

export const GOOGLE_SCOPES = [
  'openid',
  'profile',
  'email',
];
