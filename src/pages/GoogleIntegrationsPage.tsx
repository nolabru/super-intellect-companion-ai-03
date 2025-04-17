
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleAuth } from '@/contexts/GoogleAuthContext';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, RefreshCw, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const GOOGLE_SCOPES = [
  { 
    name: 'Google Drive', 
    description: 'Criar e gerenciar arquivos',
    scope: 'https://www.googleapis.com/auth/drive',
    icon: '📄'
  },
  { 
    name: 'Google Calendar', 
    description: 'Criar e gerenciar eventos',
    scope: 'https://www.googleapis.com/auth/calendar',
    icon: '📅'
  },
  { 
    name: 'Google Sheets', 
    description: 'Criar e editar planilhas',
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    icon: '📊'
  },
  { 
    name: 'Gmail', 
    description: 'Enviar emails automatizados',
    scope: 'https://www.googleapis.com/auth/gmail.send',
    icon: '📧'
  }
];

interface ServicePermission {
  service: string;
  hasPermission: boolean;
  scope: string;
  error?: string;
}

const GoogleIntegrationsPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { 
    isGoogleConnected, 
    loading: googleLoading, 
    refreshGoogleTokens,
    disconnectGoogle 
  } = useGoogleAuth();
  const [servicePermissions, setServicePermissions] = useState<ServicePermission[]>([]);
  const [checkingPermissions, setCheckingPermissions] = useState(false);
  const navigate = useNavigate();

  // Verificar autenticação
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [authLoading, user, navigate]);

  // Verificar permissões do Google ao carregar a página
  useEffect(() => {
    checkGooglePermissions();
  }, [isGoogleConnected]);

  const checkGooglePermissions = async () => {
    if (!isGoogleConnected) {
      setServicePermissions([]);
      return;
    }

    setCheckingPermissions(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-verify-permissions', {
        body: {}  // O token será obtido do contexto de autenticação na Edge Function
      });

      if (error) {
        throw error;
      }

      if (data?.services) {
        setServicePermissions(data.services);
      }
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      toast.error('Erro ao verificar permissões', { 
        description: 'Não foi possível verificar o status das suas permissões do Google.'
      });
    } finally {
      setCheckingPermissions(false);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: GOOGLE_SCOPES.map(s => s.scope).join(' '),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          },
          redirectTo: `${window.location.origin}/google-integrations`
        }
      });
    } catch (error) {
      console.error('Erro ao conectar com Google:', error);
      toast.error('Erro na conexão', { 
        description: 'Não foi possível iniciar o processo de conexão com o Google.'
      });
    }
  };

  const handleRefreshTokens = async () => {
    try {
      const success = await refreshGoogleTokens();
      if (success) {
        toast.success('Tokens atualizados', { 
          description: 'Os tokens de acesso do Google foram atualizados com sucesso.'
        });
        await checkGooglePermissions();
      } else {
        toast.error('Falha na atualização', { 
          description: 'Não foi possível atualizar os tokens. Tente reconectar sua conta.'
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar tokens:', error);
      toast.error('Erro na atualização', { 
        description: 'Ocorreu um erro ao tentar atualizar os tokens.'
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
              <>
                <Button
                  variant="outline"
                  onClick={handleRefreshTokens}
                  className="border-inventu-gray/30 text-white"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar Tokens
                </Button>
                
                <Button
                  variant="destructive"
                  onClick={disconnectGoogle}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Desconectar Google
                </Button>
              </>
            ) : (
              <Button onClick={handleConnectGoogle} className="bg-inventu-blue hover:bg-inventu-blue/80">
                Conectar com Google
              </Button>
            )}
          </CardFooter>
        </Card>
        
        <h2 className="text-xl font-bold text-white mb-4">Permissões dos Serviços</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {GOOGLE_SCOPES.map((service) => {
            const permissionStatus = servicePermissions.find(
              p => p.scope === service.scope
            );
            
            return (
              <Card key={service.scope} className="bg-inventu-dark border-inventu-gray/30 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{service.icon}</span>
                    {service.name}
                    {checkingPermissions ? (
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    ) : permissionStatus ? (
                      permissionStatus.hasPermission ? (
                        <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 ml-auto" />
                      )
                    ) : isGoogleConnected ? (
                      <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-500 ml-auto" />
                    )}
                  </CardTitle>
                  <CardDescription className="text-inventu-gray">
                    {service.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
        
        <div className="bg-inventu-dark border border-inventu-gray/30 rounded-lg p-4 mb-8">
          <h3 className="text-lg font-semibold text-white mb-2">Sobre as permissões do Google</h3>
          <div className="text-sm text-inventu-gray space-y-2">
            <p>
              O orquestrador do sistema utiliza as integrações com o Google para
              automatizar tarefas com base no contexto da conversa. Por exemplo:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Quando você pede no chat para "agendar uma reunião", o orquestrador pode criar um evento no seu Google Calendar</li>
              <li>Quando solicita "criar uma planilha de despesas", o sistema pode gerar um Google Sheets automaticamente</li>
              <li>Solicitações para "criar um documento" resultam em arquivos no seu Google Drive</li>
            </ul>
            <p className="mt-4">
              Todas as ações são realizadas somente com sua autorização explícita e você pode revogar o acesso a qualquer momento.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleIntegrationsPage;
