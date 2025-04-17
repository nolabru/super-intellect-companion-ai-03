
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGoogleAuth } from '@/contexts/GoogleAuthContext';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, LogOut, RefreshCw, AlertCircle } from 'lucide-react';
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

const GoogleIntegrationsPage: React.FC = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { 
    isGoogleConnected, 
    loading: googleLoading, 
    checkGooglePermissions, 
    refreshGoogleTokens,
    disconnectGoogle,
    googleTokens 
  } = useGoogleAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [permissionsChecking, setPermissionsChecking] = useState(false);
  const [hasPermissions, setHasPermissions] = useState<boolean | null>(null);
  const [serviceStatus, setServiceStatus] = useState<Record<string, boolean>>({});

  // Check authentication
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=google-integrations');
    }
  }, [authLoading, user, navigate]);

  // Verificar parâmetros de URL para detecção de conclusão de autenticação do Google
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.has('success') && params.get('success') === 'true') {
      console.log('Detectada conclusão bem-sucedida da autenticação do Google');
      
      // Verificar permissões após um pequeno atraso para garantir que os tokens foram salvos
      setTimeout(() => {
        verifyGooglePermissions();
      }, 1500);
      
      // Limpar parâmetros da URL
      navigate('/google-integrations', { replace: true });
    }
  }, [location, navigate]);

  // Verificar permissões automaticamente na carga da página se estiver conectado
  useEffect(() => {
    if (isGoogleConnected && !googleLoading) {
      console.log('Google conectado, verificando permissões automaticamente');
      verifyGooglePermissions();
    }
  }, [isGoogleConnected, googleLoading]);

  // Função para verificar permissões do Google
  const verifyGooglePermissions = async () => {
    if (!isGoogleConnected) {
      setHasPermissions(false);
      return;
    }
    
    console.log('Verificando permissões do Google...');
    setPermissionsChecking(true);
    
    try {
      const result = await checkGooglePermissions();
      console.log('Resultado da verificação de permissões:', result);
      setHasPermissions(result);
      
      // Se não tiver permissões mas estiver conectado, tente atualizar os tokens
      if (!result && isGoogleConnected) {
        console.log('Permissões não verificadas mas conectado, tentando atualizar tokens...');
        const refreshed = await refreshGoogleTokens();
        if (refreshed) {
          console.log('Tokens atualizados, verificando permissões novamente...');
          const newResult = await checkGooglePermissions();
          setHasPermissions(newResult);
        }
      }
      
      // Verificar status detalhado dos serviços se for bem-sucedido
      if (result) {
        // Idealmente, isto viria da resposta da função de borda, mas estamos simulando por enquanto
        setServiceStatus({
          'Google Drive': true,
          'Google Calendar': true,
          'Google Sheets': true,
          'Gmail': true
        });
      }
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      setHasPermissions(false);
    } finally {
      setPermissionsChecking(false);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      // Set redirect URL to come back to this page
      const redirectTo = `${window.location.origin}/google-integrations?success=true`;
      
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
      await disconnectGoogle();
      setHasPermissions(false);
      setServiceStatus({});
    } catch (error) {
      console.error('Erro ao desconectar Google:', error);
      toast.error('Erro ao desconectar', { 
        description: 'Não foi possível desconectar sua conta Google.'
      });
    }
  };

  const handleRefreshPermissions = async () => {
    await verifyGooglePermissions();
  };

  // Exibir informações de diagnóstico para ajudar a depurar
  const renderDebugInfo = () => {
    if (!isGoogleConnected) return null;
    
    return (
      <Card className="bg-inventu-dark border-inventu-gray/30 text-white mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Informações de Diagnóstico
            <Badge variant="outline" className="bg-gray-500/20 text-gray-400 ml-auto">
              Debug
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs font-mono">
          <p>Status da conexão: {isGoogleConnected ? 'Conectado' : 'Desconectado'}</p>
          <p>Status das permissões: {hasPermissions === null ? 'Não verificado' : hasPermissions ? 'Autorizado' : 'Não autorizado'}</p>
          <p>Token de acesso presente: {googleTokens?.accessToken ? 'Sim' : 'Não'}</p>
          <p>Token de atualização presente: {googleTokens?.refreshToken ? 'Sim' : 'Não'}</p>
          <p>Expiração do token: {googleTokens?.expiresAt ? new Date(googleTokens.expiresAt * 1000).toLocaleString() : 'Desconhecido'}</p>
        </CardContent>
      </Card>
    );
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
              {isGoogleConnected && hasPermissions === false && (
                <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 ml-2">
                  Permissões não verificadas
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
                {hasPermissions ? (
                  <p>
                    Sua conta Google está conectada e autorizada. O orquestrador pode usar os serviços Google.
                  </p>
                ) : (
                  <div className="flex items-start gap-2 text-yellow-400">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Sua conta Google está conectada, mas há um problema com as permissões.</p>
                      <p className="text-inventu-gray mt-1">
                        Isto pode acontecer quando as permissões não foram corretamente concedidas ou expiraram.
                        Tente desconectar e conectar novamente sua conta Google.
                      </p>
                    </div>
                  </div>
                )}
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
                  variant="destructive"
                  onClick={handleDisconnectGoogle}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Desconectar Google
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleRefreshPermissions}
                  disabled={permissionsChecking}
                >
                  {permissionsChecking ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Verificar permissões
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
          {GOOGLE_SCOPES.map((service) => (
            <Card key={service.scope} className="bg-inventu-dark border-inventu-gray/30 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">{service.icon}</span>
                  {service.name}
                  {isGoogleConnected && hasPermissions ? (
                    <Badge variant="outline" className="bg-green-500/20 text-green-400 ml-auto">
                      Autorizado
                    </Badge>
                  ) : isGoogleConnected ? (
                    <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 ml-auto">
                      Verificando
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
        
        {/* Informações de diagnóstico */}
        {renderDebugInfo()}
        
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
