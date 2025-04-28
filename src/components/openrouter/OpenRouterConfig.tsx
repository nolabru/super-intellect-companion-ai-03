
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Settings, AlertTriangle, CheckCircle, KeyRound, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useOpenRouterGeneration } from '@/hooks/useOpenRouterGeneration';

interface OpenRouterConfigProps {
  onConfigChange?: (isConfigured: boolean) => void;
}

const OpenRouterConfig: React.FC<OpenRouterConfigProps> = ({ onConfigChange }) => {
  const [apiKey, setApiKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const { 
    configureApiKey, 
    isApiKeyConfigured,
    generateText
  } = useOpenRouterGeneration({ showToasts: true });

  useEffect(() => {
    const configured = isApiKeyConfigured();
    setIsConfigured(configured);
    
    // Only initialize the field if not already configured
    if (!configured) {
      setApiKey('');
    } else {
      setApiKey('••••••••••••••••••••••••••••••••');
    }
    
    setIsLoading(false);
  }, [isApiKeyConfigured]);

  const handleSaveConfig = () => {
    if (!apiKey.trim()) {
      toast.error('Chave de API é obrigatória');
      return;
    }

    const result = configureApiKey(apiKey);
    
    if (result) {
      setIsConfigured(true);
      toast.success('Chave de API do OpenRouter configurada com sucesso');
      
      if (onConfigChange) {
        onConfigChange(true);
      }
    } else {
      toast.error('Falha ao configurar a chave de API do OpenRouter');
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    
    try {
      toast.info('Testando conexão com o OpenRouter...');
      
      // Test the API key by making a simple request
      const result = await generateText([
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "Connection successful" if you can read this.' }
      ], 'gpt-3.5-turbo', { max_tokens: 20 });
      
      if (result.success) {
        toast.success('Conexão com o OpenRouter bem-sucedida');
      } else {
        toast.error('Falha na conexão com o OpenRouter', {
          description: result.error
        });
      }
    } catch (error) {
      console.error('Erro ao testar conexão com o OpenRouter:', error);
      toast.error('Falha na conexão com o OpenRouter');
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>Configuração do OpenRouter</span>
        </CardTitle>
        <CardDescription>
          Configure sua chave de API do OpenRouter para habilitar recursos de geração de texto
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {isConfigured ? (
            <Alert className="bg-green-500/10 border-green-500/50">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle>Chave de API Configurada</AlertTitle>
              <AlertDescription>
                Sua chave de API do OpenRouter está configurada. Você pode substituí-la abaixo, se necessário.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="bg-amber-500/10 border-amber-500/50">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertTitle>Chave de API Necessária</AlertTitle>
              <AlertDescription>
                Para usar os recursos de geração de texto do OpenRouter, você precisa configurar sua chave de API.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="apiKey" className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" /> Chave de API do OpenRouter
            </Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Digite sua chave de API do OpenRouter"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Obtenha sua chave de API no <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer noopener" className="text-primary hover:underline">Painel do OpenRouter</a>
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

export default OpenRouterConfig;
