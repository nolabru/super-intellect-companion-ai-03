
export interface GoogleTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// Remove UserGoogleToken or define it if needed
// Since the error suggests we meant to use GoogleTokens, we'll just remove the undefined type

export interface GoogleAuthContextType {
  googleTokens: GoogleTokens | null;
  isGoogleConnected: boolean;
  loading: boolean;
  refreshGoogleTokens: () => Promise<boolean>;
  checkGooglePermissions: () => Promise<boolean>;
  disconnectGoogle: () => Promise<void>;
}

export interface GoogleScope {
  name: string;
  scope: string;
  description: string;
  required: boolean;
}

export const GOOGLE_SCOPES: GoogleScope[] = [
  { 
    name: 'Google Drive', 
    description: 'Criar e gerenciar arquivos',
    scope: 'https://www.googleapis.com/auth/drive',
    required: true
  },
  { 
    name: 'Google Calendar', 
    description: 'Criar e gerenciar eventos',
    scope: 'https://www.googleapis.com/auth/calendar',
    required: true
  },
  { 
    name: 'Google Sheets', 
    description: 'Criar e editar planilhas',
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    required: true
  },
  { 
    name: 'Gmail', 
    description: 'Enviar emails automatizados',
    scope: 'https://www.googleapis.com/auth/gmail.send',
    required: true
  },
  {
    name: 'Google Docs',
    description: 'Criar e editar documentos',
    scope: 'https://www.googleapis.com/auth/documents',
    required: true
  }
];
