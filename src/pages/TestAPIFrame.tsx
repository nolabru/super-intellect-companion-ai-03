
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const TestAPIFrame: React.FC = () => {
  const [prompt, setPrompt] = useState('A cute cat wearing a hat');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const testApiFrame = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setImageUrl(null);
    
    try {
      console.log('Testing APIframe with prompt:', prompt);
      
      const { data, error } = await supabase.functions.invoke('apiframe-ideogram-imagine', {
        body: { 
          prompt,
          model: 'V_2',
          style_type: 'GENERAL',
          aspect_ratio: 'ASPECT_1_1',
          magic_prompt_option: 'AUTO'
        }
      });
      
      if (error) {
        console.error('Error calling edge function:', error);
        setError(`Error: ${error.message || 'Unknown error'}`);
        toast.error('Error calling edge function', {
          description: error.message
        });
        return;
      }
      
      console.log('Edge function response:', data);
      setResult(data);
      
      if (data.success && data.images && data.images.length > 0) {
        setImageUrl(data.images[0]);
        toast.success('Imagem gerada com sucesso!');
      } else {
        setError('No images returned. Check console for details.');
        toast.error('No images returned', {
          description: 'Check console for more details'
        });
      }
    } catch (err) {
      console.error('Error testing APIframe:', err);
      setError(`Erro: ${err instanceof Error ? err.message : 'Unknown error'}`);
      toast.error('Error testing APIframe');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">APIFrame Test Page</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Test APIFrame Integration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt</Label>
            <Input
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter a prompt to generate an image"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={testApiFrame} 
            disabled={isLoading || !prompt.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : 'Generate Test Image'}
          </Button>
        </CardFooter>
      </Card>
      
      {isLoading && (
        <div className="flex justify-center my-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4">
          <h3 className="text-red-800 font-medium">Error</h3>
          <p className="text-red-600">{error}</p>
        </div>
      )}
      
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Response</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-64">
              <pre className="text-sm">{JSON.stringify(result, null, 2)}</pre>
            </div>
          </CardContent>
        </Card>
      )}
      
      {imageUrl && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Generated Image</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <img 
                src={imageUrl} 
                alt="Generated" 
                className="max-w-full rounded-md shadow-md" 
                style={{ maxHeight: '500px' }}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TestAPIFrame;
