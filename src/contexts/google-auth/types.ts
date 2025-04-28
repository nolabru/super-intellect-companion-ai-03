
// Tipos relacionados à autenticação Google
export type GoogleScope =
  | 'https://www.googleapis.com/auth/userinfo.email'
  | 'https://www.googleapis.com/auth/userinfo.profile';

// Lista de escopos disponíveis
export const GOOGLE_SCOPES: GoogleScope[] = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

// Estrutura dos tokens Google
export interface GoogleTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// Estado de conexão Google
export enum GoogleConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}

// Interface do contexto de autenticação Google
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
