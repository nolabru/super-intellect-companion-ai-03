
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useMediaGeneration } from '@/hooks/useMediaGeneration';

const MidjourneyTestComponent = () => {
  const [prompt, setPrompt] = useState('');
  
  const { 
    generateMedia, 
    isGenerating, 
    mediaUrl, 
    progress,
    status,
    error,
    cancelGeneration
  } = useMediaGeneration({
    showToasts: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      toast.error("Por favor, insira um prompt para gerar uma imagem");
      return;
    }
    
    try {
      await generateMedia(prompt, 'image', 'midjourney', {
        aspectRatio: "1:1",
        quality: 1,
        style: "raw"
      });
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      toast.error(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          <span>Teste Midjourney</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Textarea
              placeholder="Descreva a imagem que você deseja gerar..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-24"
            />
          </div>
          
          {isGenerating && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
              <p className="text-sm text-gray-500 mt-1">Status: {status} ({Math.round(progress)}%)</p>
            </div>
          )}
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              <strong className="font-bold">Erro!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}
          
          {mediaUrl && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Imagem gerada:</p>
              <img 
                src={mediaUrl} 
                alt="Imagem gerada" 
                className="w-full rounded-md border border-gray-200 object-contain"
                style={{ maxHeight: "300px" }}
              />
            </div>
          )}
        </form>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        {isGenerating ? (
          <Button 
            type="button" 
            variant="destructive"
            onClick={cancelGeneration}
          >
            Cancelar
          </Button>
        ) : (
          <Button 
            type="button" 
            variant="outline"
            onClick={() => setPrompt('')}
          >
            Limpar
          </Button>
        )}
        
        <Button 
          type="submit"
          onClick={handleSubmit}
          disabled={!prompt.trim() || isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Gerando...
            </>
          ) : (
            'Gerar Imagem'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MidjourneyTestComponent;
