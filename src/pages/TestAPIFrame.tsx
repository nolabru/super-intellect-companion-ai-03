
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTaskState } from '@/hooks/media/useTaskState';

const TestAPIFrame: React.FC = () => {
  const [prompt, setPrompt] = useState('A cute cat wearing a hat');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [model, setModel] = useState<'ideogram' | 'midjourney'>('ideogram');
  const [aspectRatio, setAspectRatio] = useState(model === 'ideogram' ? 'ASPECT_1_1' : '1:1');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [quality, setQuality] = useState('standard');
  const [style, setStyle] = useState('raw');
  const { tasks, currentTask, currentTaskId, registerTask, updateTask } = useTaskState();
  
  // Effect to poll for status updates when we have a taskId
  useEffect(() => {
    if (!currentTaskId || !currentTask || currentTask.status === 'completed' || currentTask.status === 'failed') {
      return;
    }
    
    const intervalId = setInterval(async () => {
      await checkTaskStatus(currentTaskId);
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, [currentTaskId, currentTask]);
  
  const testApiFrame = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setImageUrl(null);
    
    try {
      console.log(`Testing APIframe with model: ${model} and prompt: ${prompt}`);
      
      let data, error;
      
      if (model === 'ideogram') {
        ({ data, error } = await supabase.functions.invoke('apiframe-ideogram-imagine', {
          body: { 
            prompt,
            model: 'V_2',
            style_type: 'GENERAL',
            aspect_ratio: aspectRatio,
            magic_prompt_option: 'AUTO'
          }
        }));
      } else if (model === 'midjourney') {
        ({ data, error } = await supabase.functions.invoke('apiframe-midjourney-imagine', {
          body: { 
            prompt,
            negative_prompt: negativePrompt || undefined,
            quality,
            aspect_ratio: aspectRatio,
            style
          }
        }));
      }
      
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
      
      if (data.success) {
        if (data.images && data.images.length > 0) {
          setImageUrl(data.images[0]);
          toast.success('Imagem gerada com sucesso!');
        } else if (data.taskId) {
          toast.success('Tarefa de geração iniciada!', {
            description: `ID da tarefa: ${data.taskId}. O processamento pode demorar alguns minutos.`
          });
          
          // Register the task for monitoring
          registerTask(data.taskId, {
            taskId: data.taskId,
            status: data.status || 'processing',
            progress: 0,
            mediaType: 'image',
            model: model
          });
          
          // Check status immediately
          await checkTaskStatus(data.taskId);
        } else {
          setError('No images returned and no task ID. Check console for details.');
          toast.error('Resposta incompleta', {
            description: 'Check console for more details'
          });
        }
      } else {
        setError(data.error || 'Request failed. Check console for details.');
        toast.error(data.error || 'Request failed', {
          description: data.details || 'Check console for more details'
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
  
  const checkTaskStatus = async (taskId: string) => {
    if (!taskId) return;
    
    setIsCheckingStatus(true);
    try {
      console.log(`Checking status for task ${taskId}`);
      
      // Call the task status endpoint
      const { data, error } = await supabase.functions.invoke('apiframe-task-status', {
        body: { taskId }
      });
      
      if (error) {
        console.error('Error checking task status:', error);
        toast.error('Error checking task status', {
          description: error.message
        });
        return;
      }
      
      console.log('Task status response:', data);
      
      // Update the task state
      if (data) {
        updateTask(taskId, {
          status: data.status,
          mediaUrl: data.mediaUrl,
          error: data.error
        });
        
        if (data.mediaUrl) {
          setImageUrl(data.mediaUrl);
        }
        
        if (data.status === 'completed') {
          toast.success('Image generation completed!');
        } else if (data.status === 'failed') {
          setError(data.error || 'Task failed without specific error');
          toast.error('Image generation failed', {
            description: data.error || 'Unknown error'
          });
        }
      }
    } catch (err) {
      console.error('Error checking task status:', err);
    } finally {
      setIsCheckingStatus(false);
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
            <Label htmlFor="model">Model</Label>
            <Select value={model} onValueChange={(value: 'ideogram' | 'midjourney') => {
              setModel(value);
              // Reset aspect ratio based on model
              setAspectRatio(value === 'ideogram' ? 'ASPECT_1_1' : '1:1');
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ideogram">Ideogram</SelectItem>
                <SelectItem value="midjourney">Midjourney</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt</Label>
            <Input
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter a prompt to generate an image"
            />
          </div>
          
          {model === 'midjourney' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="negativePrompt">Negative Prompt</Label>
                <Textarea
                  id="negativePrompt"
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="Things to avoid in the image"
                  className="resize-none h-20"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quality">Quality</Label>
                  <Select value={quality} onValueChange={setQuality}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select quality" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="hd">HD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="aspectRatio">Aspect Ratio</Label>
                  <Select value={aspectRatio} onValueChange={setAspectRatio}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select aspect ratio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1:1">Square (1:1)</SelectItem>
                      <SelectItem value="4:3">Landscape (4:3)</SelectItem>
                      <SelectItem value="3:4">Portrait (3:4)</SelectItem>
                      <SelectItem value="16:9">Widescreen (16:9)</SelectItem>
                      <SelectItem value="9:16">Vertical (9:16)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="style">Style</Label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="raw">Raw</SelectItem>
                      <SelectItem value="cute">Cute</SelectItem>
                      <SelectItem value="anime">Anime</SelectItem>
                      <SelectItem value="photography">Photography</SelectItem>
                      <SelectItem value="digital-art">Digital Art</SelectItem>
                      <SelectItem value="comic-book">Comic Book</SelectItem>
                      <SelectItem value="fantasy-art">Fantasy Art</SelectItem>
                      <SelectItem value="line-art">Line Art</SelectItem>
                      <SelectItem value="analog-film">Analog Film</SelectItem>
                      <SelectItem value="neon-punk">Neon Punk</SelectItem>
                      <SelectItem value="isometric">Isometric</SelectItem>
                      <SelectItem value="low-poly">Low Poly</SelectItem>
                      <SelectItem value="origami">Origami</SelectItem>
                      <SelectItem value="modeling-compound">Modeling Compound</SelectItem>
                      <SelectItem value="cinematic">Cinematic</SelectItem>
                      <SelectItem value="pixel-art">Pixel Art</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
          
          {model === 'ideogram' && (
            <div className="space-y-2">
              <Label htmlFor="aspectRatio">Aspect Ratio</Label>
              <Select value={aspectRatio} onValueChange={setAspectRatio}>
                <SelectTrigger>
                  <SelectValue placeholder="Select aspect ratio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ASPECT_1_1">Square (1:1)</SelectItem>
                  <SelectItem value="ASPECT_4_3">Landscape (4:3)</SelectItem>
                  <SelectItem value="ASPECT_3_4">Portrait (3:4)</SelectItem>
                  <SelectItem value="ASPECT_16_9">Widescreen (16:9)</SelectItem>
                  <SelectItem value="ASPECT_9_16">Vertical (9:16)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
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
          
          {currentTaskId && (
            <Button 
              variant="outline" 
              onClick={() => checkTaskStatus(currentTaskId)}
              disabled={isCheckingStatus || !currentTaskId}
            >
              {isCheckingStatus ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Check Status
                </>
              )}
            </Button>
          )}
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
      
      {currentTask && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Task Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div><strong>Task ID:</strong> {currentTask.taskId}</div>
              <div><strong>Status:</strong> {currentTask.status}</div>
              {currentTask.error && (
                <div className="text-red-600"><strong>Error:</strong> {currentTask.error}</div>
              )}
            </div>
          </CardContent>
        </Card>
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
