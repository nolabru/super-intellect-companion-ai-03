
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
const SITE_URL = 'https://super-intellect-companion-ai.lovable.app';

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
  const [processingOAuth, setProcessingOAuth] = useState(false);
  const navigate = useNavigate();

  // Check if user is already authenticated
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          console.log("[Auth] Already logged in, redirecting to home");
          navigate('/');
        }
      } catch (error) {
        console.error("[Auth] Error checking session:", error);
      }
    };
    
    checkSession();
  }, [navigate]);

  // Process auth redirects
  useEffect(() => {
    const handleAuthRedirect = async () => {
      // Check if we're already processing an OAuth response to prevent loops
      if (processingOAuth) {
        return;
      }
      
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
      
      // Only process if there are actual auth params
      if (!(params.has('error') || params.has('error_description') || 
            hashParams.has('access_token') || params.has('provider'))) {
        return;
      }
      
      setProcessingOAuth(true);
      
      if (params.has('error') || params.has('error_description')) {
        const errorMessage = params.get('error_description') || params.get('error') || 'Authentication error';
        console.error('[Auth] Auth error from params:', errorMessage);
        toast.error('Authentication error', { description: errorMessage });
        
        // Clean URL and reset processing state
        window.history.replaceState({}, document.title, window.location.pathname);
        setProcessingOAuth(false);
        setLoading(false);
        return;
      }

      // Check access_token in hash params (for OAuth providers)
      if (hashParams.has('access_token')) {
        try {
          setLoading(true);
          console.log("[Auth] Access token detected in hash, waiting for session establishment...");
          
          // Try multiple times to get the session with increasing delays
          let retryCount = 0;
          const maxRetries = 3;
          let sessionData = null;
          
          while (retryCount < maxRetries) {
            // Wait before trying (increasing delay with each retry)
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
            
            console.log(`[Auth] Attempt ${retryCount + 1} to get session`);
            const { data, error } = await supabase.auth.getSession();
            
            if (error) {
              console.error(`[Auth] Session error on attempt ${retryCount + 1}:`, error);
            } else if (data.session) {
              console.log(`[Auth] Session established on attempt ${retryCount + 1}`);
              sessionData = data;
              break;
            } else {
              console.log(`[Auth] No session on attempt ${retryCount + 1}, trying refresh`);
              // Try to refresh the session
              const { data: refreshData } = await supabase.auth.refreshSession();
              if (refreshData.session) {
                console.log(`[Auth] Session recovered after refresh on attempt ${retryCount + 1}`);
                sessionData = refreshData;
                break;
              }
            }
            
            retryCount++;
          }
          
          if (sessionData?.session) {
            toast.success('Login successful', { 
              description: 'Redirecting to home page...'
            });
            
            // Clear URL and navigate to home
            window.history.replaceState({}, document.title, window.location.pathname);
            navigate('/');
          } else {
            console.error('[Auth] Failed to establish session after multiple attempts');
            toast.error('Login failed', {
              description: 'Could not establish session. Please try again later.'
            });
          }
        } catch (error: any) {
          console.error('[Auth] Error processing OAuth login:', error);
          toast.error('Login error', { 
            description: error.message || 'Please try again.'
          });
        } finally {
          setLoading(false);
          setProcessingOAuth(false);
          
          // Always clean URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    };

    handleAuthRedirect();
  }, [navigate, processingOAuth]);

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
          "Registration completed!",
          { description: "Check your email to confirm your account." }
        );
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        if (data.session) {
          navigate('/');
        } else {
          throw new Error("Login successful but no session was created");
        }
      }
    } catch (error: any) {
      toast.error(
        "Error", 
        { description: error.message }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
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
      toast.error(
        "Error signing in with Google", 
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
