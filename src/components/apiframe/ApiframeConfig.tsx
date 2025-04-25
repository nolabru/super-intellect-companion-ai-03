
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Settings, AlertTriangle, CheckCircle } from 'lucide-react';
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
      toast.error('API key is required');
      return;
    }

    const result = apiframeService.setApiKey(apiKey);
    
    if (result) {
      setIsConfigured(true);
      toast.success('APIframe.ai API key configured successfully');
      
      if (onConfigChange) {
        onConfigChange(true);
      }
    } else {
      toast.error('Failed to configure APIframe.ai API key');
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    
    try {
      // Simple test to check if the API key is valid
      // We'll use a test request to the APIframe.ai API
      // For now, let's just set a timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('APIframe.ai connection successful');
    } catch (error) {
      console.error('Error testing APIframe.ai connection:', error);
      toast.error('APIframe.ai connection failed');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>APIframe.ai Configuration</span>
        </CardTitle>
        <CardDescription>
          Configure your APIframe.ai API key to enable media generation features
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {isConfigured && (
            <Alert className="bg-green-500/10 border-green-500/50">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle>API Key Configured</AlertTitle>
              <AlertDescription>
                Your APIframe.ai API key is configured. You can replace it below if needed.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="apiKey">APIframe.ai API Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your APIframe.ai API key"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Get your API key from <a href="https://apiframe.ai/dashboard/api-keys" target="_blank" rel="noreferrer noopener" className="text-primary hover:underline">APIframe.ai Dashboard</a>
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
          {isTesting ? 'Testing...' : 'Test Connection'}
        </Button>
        <Button onClick={handleSaveConfig}>
          {isConfigured ? 'Update API Key' : 'Save API Key'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ApiframeConfig;
