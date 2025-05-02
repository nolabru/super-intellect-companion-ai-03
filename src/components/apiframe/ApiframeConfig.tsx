
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, LoaderCircle } from 'lucide-react';
import { apiframeService } from '@/services/apiframeService';

interface ApiframeConfigProps {
  onConfigChange?: (isConfigured: boolean) => void;
}

const ApiframeConfig: React.FC<ApiframeConfigProps> = ({ onConfigChange }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'untested' | 'success' | 'failed'>('untested');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [workingEndpoint, setWorkingEndpoint] = useState<string | null>(null);

  const testConnection = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      
      const result = await apiframeService.testConnection();
      
      if (result.success) {
        setConnectionStatus('success');
        setWorkingEndpoint(result.endpoint);
        if (onConfigChange) {
          onConfigChange(true);
        }
      } else {
        setConnectionStatus('failed');
        setErrorMessage(result.error || 'Failed to connect to APIframe');
        if (onConfigChange) {
          onConfigChange(false);
        }
      }
    } catch (err) {
      console.error('[ApiframeConfig] Error testing connection:', err);
      setConnectionStatus('failed');
      setErrorMessage(err instanceof Error ? err.message : 'Unknown error');
      if (onConfigChange) {
        onConfigChange(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Test connection on component mount
  useEffect(() => {
    testConnection();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>APIframe Configuration</span>
        </CardTitle>
        <CardDescription>
          APIframe API key is globally configured for all users
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {connectionStatus === 'success' ? (
          <Alert className="bg-green-500/10 border-green-500/50">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle>Conexão com APIframe estabelecida!</AlertTitle>
            <AlertDescription>
              A chave de API do APIframe está funcionando corretamente.
              {workingEndpoint && <div className="mt-2 text-xs opacity-70">Endpoint: {workingEndpoint}</div>}
            </AlertDescription>
          </Alert>
        ) : connectionStatus === 'failed' ? (
          <Alert className="bg-red-500/10 border-red-500/50">
            <XCircle className="h-4 w-4 text-red-500" />
            <AlertTitle>Erro na conexão com APIframe</AlertTitle>
            <AlertDescription>
              {errorMessage || 'Não foi possível conectar à API do APIframe. Verifique a chave de API.'}
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="bg-blue-500/10 border-blue-500/50">
            <LoaderCircle className="h-4 w-4 text-blue-500 animate-spin" />
            <AlertTitle>Testando conexão com APIframe</AlertTitle>
            <AlertDescription>
              Verificando se a chave de API do APIframe está funcionando...
            </AlertDescription>
          </Alert>
        )}
        
        <Button 
          onClick={testConnection} 
          disabled={isLoading} 
          variant="outline" 
          className="mt-4 w-full"
        >
          {isLoading ? (
            <>
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> 
              Testando...
            </>
          ) : (
            'Testar Conexão Novamente'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ApiframeConfig;
