import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Settings, AlertTriangle, CheckCircle, KeyRound, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiframeService } from '@/services/apiframeService';

interface ApiframeConfigProps {
  onConfigChange?: (isConfigured: boolean) => void;
}

const ApiframeConfig: React.FC<ApiframeConfigProps> = ({ onConfigChange }) => {
  const [apiKey, setApiKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    const configured = apiframeService.isApiKeyConfigured();
    setIsConfigured(configured);
    
    // Only initialize the field if not already configured
    if (!configured) {
      setApiKey('');
    } else {
      setApiKey('••••••••••••••••••••••••••••••••');
    }
  }, []);

  const handleSaveConfig = () => {
    if (!apiKey.trim()) {
      toast.error('Chave de API é obrigatória');
      return;
    }

    const result = apiframeService.setApiKey(apiKey);
    
    if (result) {
      setIsConfigured(true);
      toast.success('Chave de API do APIframe configurada com sucesso');
      
      if (onConfigChange) {
        onConfigChange(true);
      }
    } else {
      toast.error('Falha ao configurar a chave de API do APIframe');
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    
    try {
      // Test connection by checking the status of a non-existent task
      // This will validate if the API key is correct
      toast.info('Testando conexão com o APIframe...');
      
      // Use a dummy task ID to test the connection
      const dummyTaskId = 'test-connection-' + Date.now();
      
      try {
        await apiframeService.checkTaskStatus(dummyTaskId);
        // If we get here without an error, the API key is valid
        toast.success('Conexão com o APIframe bem-sucedida');
      } catch (error) {
        // Check if the error is due to invalid API key or just a 404 for the task
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        if (errorMessage.includes('unauthorized') || 
            errorMessage.includes('invalid key') || 
            errorMessage.includes('forbidden')) {
          toast.error('Chave de API inválida');
        } else {
          // If we get a 404 or other error, it means the API key is valid
          // but the task doesn't exist (which is expected)
          toast.success('Conexão com o APIframe bem-sucedida');
        }
      }
    } catch (error) {
      console.error('Erro ao testar conexão com o APIframe:', error);
      toast.error('Falha na conexão com o APIframe');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>Configuração do APIframe</span>
        </CardTitle>
        <CardDescription>
          Configure sua chave de API do APIframe para habilitar recursos de geração de mídia
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {isConfigured ? (
            <Alert className="bg-green-500/10 border-green-500/50">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle>Chave de API Configurada</AlertTitle>
              <AlertDescription>
                Sua chave de API do APIframe está configurada. Você pode substituí-la abaixo, se necessário.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="bg-amber-500/10 border-amber-500/50">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertTitle>Chave de API Necessária</AlertTitle>
              <AlertDescription>
                Para usar os recursos de geração de mídia do APIframe, você precisa configurar sua chave de API.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="apiKey" className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" /> Chave de API do APIframe
            </Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Digite sua chave de API do APIframe"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Obtenha sua chave de API no <a href="https://apiframe.ai/dashboard/api-keys" target="_blank" rel="noreferrer noopener" className="text-primary hover:underline">Painel do APIframe</a>
            </p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={testConnection} 
          disabled={!isConfigured || isTesting}
        >
          {isTesting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testando...
            </>
          ) : 'Testar Conexão'}
        </Button>
        <Button onClick={handleSaveConfig}>
          {isConfigured ? 'Atualizar Chave de API' : 'Salvar Chave de API'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ApiframeConfig;
