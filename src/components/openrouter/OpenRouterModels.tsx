
import React, { useState, useEffect } from 'react';
import { useOpenRouterGeneration } from '@/hooks/useOpenRouterGeneration';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type OpenRouterModelType = {
  id: string;
  name: string;
  context_length: number;
  providers?: string[];
};

type ModelCategory = {
  provider: string;
  models: OpenRouterModelType[];
};

const OpenRouterModels: React.FC<{
  onSelectModel?: (modelId: string) => void;
}> = ({ onSelectModel }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [models, setModels] = useState<OpenRouterModelType[]>([]);
  const [categories, setCategories] = useState<ModelCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('openai');
  
  const { fetchAvailableModels, isApiKeyConfigured } = useOpenRouterGeneration({
    showToasts: true
  });

  useEffect(() => {
    const loadModels = async () => {
      try {
        setLoading(true);
        
        if (!isApiKeyConfigured()) {
          setError('API key not configured');
          setLoading(false);
          return;
        }
        
        const availableModels = await fetchAvailableModels();
        
        if (!availableModels || availableModels.length === 0) {
          setError('No models available');
          setLoading(false);
          return;
        }
        
        setModels(availableModels);
        
        // Group models by provider
        const providerMap: Record<string, OpenRouterModelType[]> = {};
        
        availableModels.forEach(model => {
          const provider = model.id.split('/')[0];
          
          if (!providerMap[provider]) {
            providerMap[provider] = [];
          }
          
          providerMap[provider].push(model);
        });
        
        const modelCategories = Object.entries(providerMap).map(([provider, providerModels]) => ({
          provider,
          models: providerModels
        }));
        
        setCategories(modelCategories);
        
        // Set default active category if exists
        if (modelCategories.length > 0 && !modelCategories.find(c => c.provider === activeCategory)) {
          setActiveCategory(modelCategories[0].provider);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading OpenRouter models:', err);
        setError(err instanceof Error ? err.message : 'Failed to load models');
        setLoading(false);
      }
    };

    loadModels();
  }, [fetchAvailableModels, isApiKeyConfigured]);

  const handleSelectModel = (modelId: string) => {
    if (onSelectModel) {
      onSelectModel(modelId);
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 text-center">
          <AlertTriangle className="h-8 w-8 mx-auto text-amber-500 mb-2" />
          <p className="text-muted-foreground">{error}</p>
          {error === 'API key not configured' && (
            <Button 
              className="mt-4" 
              variant="outline" 
              onClick={() => window.location.href = '/dashboard/ai-config'}
            >
              Configure API Key
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>OpenRouter Models</CardTitle>
        <CardDescription>Select a model provider and model to use</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={activeCategory} value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="grid grid-cols-3 mb-4">
            {categories.slice(0, 3).map((category) => (
              <TabsTrigger key={category.provider} value={category.provider}>
                {category.provider.charAt(0).toUpperCase() + category.provider.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {categories.length > 3 && (
            <div className="my-4">
              <Select 
                value={categories.length > 3 && !categories.slice(0, 3).find(c => c.provider === activeCategory) ? activeCategory : undefined}
                onValueChange={setActiveCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="More providers..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.slice(3).map((category) => (
                    <SelectItem key={category.provider} value={category.provider}>
                      {category.provider.charAt(0).toUpperCase() + category.provider.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {categories.map((category) => (
            <TabsContent key={category.provider} value={category.provider} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {category.models.map((model) => (
                  <Card key={model.id} className="overflow-hidden cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSelectModel(model.id)}>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm">{model.name}</CardTitle>
                      <CardDescription className="text-xs truncate">{model.id}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 text-xs">
                      <div className="flex justify-between">
                        <span>Context:</span>
                        <span className="font-medium">{model.context_length.toLocaleString()} tokens</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default OpenRouterModels;
