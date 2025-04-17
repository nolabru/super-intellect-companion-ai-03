
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import AppHeader from '@/components/AppHeader';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

type AuthMode = 'login' | 'signup';

// Use the correct production URL
const SITE_URL = window.location.origin;

// Google scopes needed for the application
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/gmail.send'
];

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<AuthMode>('login');
  const navigate = useNavigate();

  // Check if user is already authenticated
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate('/');
      }
    };
    
    checkSession();
  }, [navigate]);

  // Process auth redirects
  useEffect(() => {
    const handleAuthRedirect = async () => {
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
      
      if (params.has('error') || params.has('error_description')) {
        const errorMessage = params.get('error_description') || 'Erro de autenticação';
        toast.error('Erro de autenticação', { description: errorMessage });
        return;
      }

      if (hashParams.has('access_token') || params.has('provider')) {
        // Successfully authenticated via Google
        try {
          console.log('Processing successful auth redirect');
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            toast.success('Login bem-sucedido', { 
              description: 'Você será redirecionado...'
            });
            navigate('/');
          }
        } catch (error) {
          toast.error('Erro ao processar login', { 
            description: 'Por favor, tente novamente.'
          });
        }
      }
    };

    handleAuthRedirect();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;
        
        toast.success(
          "Cadastro concluído!",
          { description: "Verifique seu email para confirmar sua conta." }
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        navigate('/');
      }
    } catch (error: any) {
      toast.error(
        "Erro", 
        { description: error.message }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      console.log('Starting Google sign in process');
      // For OAuth signIn, we specify the full callback URL
      const redirectTo = `${SITE_URL}/auth`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: GOOGLE_SCOPES.join(' '),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          },
          redirectTo
        }
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error during Google sign in:', error);
      toast.error(
        "Erro ao entrar com Google", 
        { description: error.message }
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-inventu-darker flex flex-col">
      <AppHeader />
      
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="bg-inventu-dark p-8 rounded-xl shadow-lg w-full max-w-md">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            {mode === 'login' ? 'Entrar na conta' : 'Criar nova conta'}
          </h2>
          
          <Button 
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-gray-800 mb-4"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                  <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                  <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                  <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
                  <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
                </g>
              </svg>
            )}
            {loading ? 'Processando...' : 'Continuar com Google'}
          </Button>
          
          <div className="relative my-6">
            <Separator className="bg-inventu-gray/30" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-inventu-dark px-2 text-xs text-inventu-gray">
              OU
            </span>
          </div>
          
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-inventu-card border-inventu-gray/30"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Senha
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-inventu-card border-inventu-gray/30"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-inventu-blue hover:bg-inventu-blue/80"
              disabled={loading}
            >
              {loading 
                ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                : null}
              {loading 
                ? 'Processando...' 
                : mode === 'login' ? 'Entrar' : 'Cadastrar'}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-inventu-blue hover:underline text-sm"
            >
              {mode === 'login'
                ? 'Não tem uma conta? Cadastre-se'
                : 'Já tem uma conta? Faça login'}
            </button>
          </div>
          
          <div className="mt-6 text-xs text-center text-inventu-gray/70">
            Ao continuar com o Google, você concede acesso para que nosso assistente possa:
            <ul className="mt-2 list-disc list-inside text-left">
              <li>Criar e ler arquivos no Google Drive</li>
              <li>Criar e gerenciar eventos no Google Calendar</li>
              <li>Criar e editar planilhas no Google Sheets</li>
              <li>Enviar emails através do seu Gmail (quando necessário)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
