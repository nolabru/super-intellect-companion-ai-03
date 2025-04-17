
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleAuth } from '@/contexts/GoogleAuthContext';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GOOGLE_SCOPES } from '@/contexts/google-auth/types';

const GoogleIntegrationsPage: React.FC = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isGoogleConnected, loading: googleLoading } = useGoogleAuth();
  const navigate = useNavigate();

  // Check authentication
  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [authLoading, user, navigate]);

  const handleConnectGoogle = async () => {
    try {
      // Set redirect URL to come back to this page
      const redirectTo = `${window.location.origin}/google-integrations`;
      
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: GOOGLE_SCOPES.map(s => s.scope).join(' '),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          },
          redirectTo
        }
      });
    } catch (error) {
      console.error('Erro ao conectar com Google:', error);
      toast.error('Erro na conexão', { 
        description: 'Não foi possível iniciar o processo de conexão com o Google.'
      });
    }
  };

  const handleDisconnectGoogle = async () => {
    try {
      // Since we're using Supabase native auth, we'll sign out and redirect to auth
      await signOut();
      toast.success('Conta Google desconectada', { 
        description: 'Sua conta Google foi desconectada com sucesso.'
      });
      navigate('/auth');
    } catch (error) {
      console.error('Erro ao desconectar Google:', error);
      toast.error('Erro ao desconectar', { 
        description: 'Não foi possível desconectar sua conta Google.'
      });
    }
  };

  if (authLoading || googleLoading) {
    return (
      <div className="min-h-screen bg-inventu-darker">
        <AppHeader />
        <div className="container p-4 mx-auto flex justify-center items-center h-[calc(100vh-64px)]">
          <Loader2 className="h-12 w-12 animate-spin text-inventu-blue" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-inventu-darker">
      <AppHeader />
      
      <div className="container p-4 mx-auto mt-8">
        <h1 className="text-3xl font-bold text-white mb-6">Integrações Google</h1>
        
        <Card className="bg-inventu-dark border-inventu-gray/30 text-white mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Status da Conexão
              {isGoogleConnected ? (
                <Badge variant="outline" className="bg-green-500/20 text-green-400 ml-2">
                  Conectado
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-500/20 text-red-400 ml-2">
                  Desconectado
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-inventu-gray">
              Status da sua conexão com os serviços do Google
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {isGoogleConnected ? (
              <div className="text-sm text-inventu-gray space-y-1">
                <p>
                  Sua conta Google está conectada e o orquestrador pode usar os serviços autorizados.
                </p>
                <p>
                  O orquestrador utiliza estas permissões para realizar tarefas automatizadas 
                  como criar documentos, eventos e planilhas quando solicitado no chat.
                </p>
              </div>
            ) : (
              <div className="text-sm text-inventu-gray space-y-1">
                <p>
                  Para permitir que o orquestrador realize ações no Google em seu nome,
                  conecte sua conta Google clicando no botão abaixo.
                </p>
                <p>
                  Você pode desconectar a qualquer momento nesta mesma página.
                </p>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-wrap gap-2">
            {isGoogleConnected ? (
              <Button
                variant="destructive"
                onClick={handleDisconnectGoogle}
                className="bg-red-600 hover:bg-red-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Desconectar Google
              </Button>
            ) : (
              <Button onClick={handleConnectGoogle} className="bg-inventu-blue hover:bg-inventu-blue/80">
                Conectar com Google
              </Button>
            )}
          </CardFooter>
        </Card>
        
        <h2 className="text-xl font-bold text-white mb-4">Permissões dos Serviços</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {GOOGLE_SCOPES.map((service) => (
            <Card key={service.scope} className="bg-inventu-dark border-inventu-gray/30 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {service.name}
                  {isGoogleConnected ? (
                    <Badge variant="outline" className="bg-green-500/20 text-green-400 ml-auto">
                      Autorizado
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-500/20 text-gray-400 ml-auto">
                      Não autorizado
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-inventu-gray">
                  {service.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
        
        <div className="bg-inventu-dark border border-inventu-gray/30 rounded-lg p-4 mb-8">
          <h3 className="text-lg font-semibold text-white mb-2">Usando comandos @</h3>
          <div className="text-sm text-inventu-gray space-y-2">
            <p>
              Você pode utilizar comandos no chat para acessar rapidamente os serviços do Google:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><code className="bg-inventu-darker px-1 rounded">@calendar</code> - Criar eventos no Google Calendar</li>
              <li><code className="bg-inventu-darker px-1 rounded">@sheet</code> - Acessar e editar planilhas do Google Sheets</li>
              <li><code className="bg-inventu-darker px-1 rounded">@doc</code> - Criar documentos no Google Docs</li>
              <li><code className="bg-inventu-darker px-1 rounded">@drive</code> - Gerenciar arquivos no Google Drive</li>
              <li><code className="bg-inventu-darker px-1 rounded">@email</code> - Enviar emails através do Gmail</li>
            </ul>
            <p className="mt-4">
              Digite <code className="bg-inventu-darker px-1 rounded">@</code> no chat para ver todas as opções disponíveis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleIntegrationsPage;
