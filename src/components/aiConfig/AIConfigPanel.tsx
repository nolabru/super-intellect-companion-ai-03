
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, AlertTriangle, Check } from 'lucide-react';
import { aiService, AIModelInfo } from '@/services/aiService';
import { openRouterService } from '@/services/openRouterService';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const AIConfigPanel: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [models, setModels] = useState<AIModelInfo[]>([]);
  const [openRouterApiKey, setOpenRouterApiKey] = useState<string>('');
  const [savingOpenRouter, setSavingOpenRouter] = useState<boolean>(false);

  useEffect(() => {
    const loadModels = async () => {
      try {
        setLoading(true);
        const availableModels = await aiService.getAvailableModels();
        setModels(availableModels);
      } catch (err) {
        console.error('Error loading models:', err);
        toast.error('Failed to load AI models');
      } finally {
        setLoading(false);
      }
    };

    loadModels();
  }, []);

  const handleSaveOpenRouterApiKey = async () => {
    if (!openRouterApiKey.trim()) {
      toast.error('Please enter a valid API key');
      return;
    }

    setSavingOpenRouter(true);
    try {
      const success = openRouterService.setApiKey(openRouterApiKey);
      if (success) {
        toast.success('OpenRouter API key saved successfully');
        // Reload models to update the list
        const availableModels = await aiService.getAvailableModels();
        setModels(availableModels);
      } else {
        toast.error('Failed to save OpenRouter API key');
      }
    } catch (err) {
      console.error('Error saving OpenRouter API key:', err);
      toast.error('Error saving API key');
    } finally {
      setSavingOpenRouter(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>AI Configuration</CardTitle>
        <CardDescription>Configure AI models and providers</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="providers">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="providers">Providers</TabsTrigger>
            <TabsTrigger value="models">Available Models</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
          </TabsList>
          
          <TabsContent value="providers">
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">OpenRouter API</h3>
                <p className="text-sm text-gray-500">Access to Claude, GPT-4, Llama, and more models</p>
                <div className="flex gap-2">
                  <Input 
                    placeholder="OpenRouter API Key" 
                    value={openRouterApiKey} 
                    onChange={(e) => setOpenRouterApiKey(e.target.value)}
                    type="password"
                  />
                  <Button 
                    onClick={handleSaveOpenRouterApiKey} 
                    disabled={savingOpenRouter}
                  >
                    {savingOpenRouter ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                    Save
                  </Button>
                </div>
                <div className="flex items-center text-sm mt-1">
                  {openRouterService.isApiKeyConfigured() ? (
                    <><Check className="h-4 w-4 text-green-400 mr-1" /> API key configured</>
                  ) : (
                    <><AlertTriangle className="h-4 w-4 text-yellow-400 mr-1" /> API key not configured</>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="models">
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : models.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <AlertTriangle className="h-8 w-8 text-yellow-500 mb-2" />
                  <p className="text-gray-400">No models available. Please configure your API keys first.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {models.map((model) => (
                    <Card key={model.id} className="overflow-hidden">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm truncate">{model.name}</CardTitle>
                        <CardDescription className="text-xs">{model.provider}</CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 text-xs">
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Type:</span>
                            <span className="font-medium">{model.type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Roles:</span>
                            <span className="font-medium">{model.roles.join(', ')}</span>
                          </div>
                          {model.maxContext && (
                            <div className="flex justify-between">
                              <span>Context:</span>
                              <span className="font-medium">{model.maxContext} tokens</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="usage">
            <div className="space-y-4">
              <p className="text-sm">Coming soon: Token usage statistics and tracking.</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AIConfigPanel;
