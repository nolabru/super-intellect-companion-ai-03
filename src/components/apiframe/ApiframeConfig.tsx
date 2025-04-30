
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
      toast.error('API key is required');
      return;
    }

    const result = apiframeService.setApiKey(apiKey);
    
    if (result) {
      setIsConfigured(true);
      toast.success('APIframe API key configured successfully');
      
      if (onConfigChange) {
        onConfigChange(true);
      }
    } else {
      toast.error('Failed to configure APIframe API key');
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    
    try {
      // Test connection by checking the status of a non-existent task
      // This will validate if the API key is correct
      toast.info('Testing connection to APIframe...');
      
      // Use a dummy task ID to test the connection
      const dummyTaskId = 'test-connection-' + Date.now();
      
      try {
        await apiframeService.checkTaskStatus(dummyTaskId);
        // If we get here without an error, the API key is valid
        toast.success('Successfully connected to APIframe');
      } catch (error) {
        // Check if the error is due to invalid API key or just a 404 for the task
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        if (errorMessage.includes("unauthorized") || 
            errorMessage.includes("invalid key") || 
            errorMessage.includes("forbidden")) {
          toast.error('Invalid API key');
        } else {
          // If we get a 404 or other error, it means the API key is valid
          // but the task doesn't exist (which is expected)
          toast.success('Successfully connected to APIframe');
        }
      }
    } catch (error) {
      console.error('Error testing connection to APIframe:', error);
      toast.error('Failed to connect to APIframe');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>APIframe Configuration</span>
        </CardTitle>
        <CardDescription>
          Configure your APIframe API key to enable media generation features
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {isConfigured ? (
            <Alert className="bg-green-500/10 border-green-500/50">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle>API Key Configured</AlertTitle>
              <AlertDescription>
                Your APIframe API key is configured. You can replace it below if needed.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="bg-amber-500/10 border-amber-500/50">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertTitle>API Key Required</AlertTitle>
              <AlertDescription>
                To use APIframe media generation features, you need to configure your API key.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="apiKey" className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" /> APIframe API Key
            </Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your APIframe API key"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Get your API key from the <a href="https://apiframe.ai/dashboard/api-keys" target="_blank" rel="noreferrer noopener" className="text-primary hover:underline">APIframe Dashboard</a>
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
              Testing...
            </>
          ) : 'Test Connection'}
        </Button>
        <Button onClick={handleSaveConfig}>
          {isConfigured ? 'Update API Key' : 'Save API Key'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ApiframeConfig;
