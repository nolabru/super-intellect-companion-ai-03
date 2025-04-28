import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Upload, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { NewsletterPost } from '@/types/newsletter';
import { useAdminCheck } from '@/hooks/useAdminCheck';

interface PostFormProps {
  onSubmit: (postData: Partial<NewsletterPost>) => Promise<void>;
  initialData?: Partial<NewsletterPost>;
  submitLabel?: string;
  title?: string;
}

const PostForm: React.FC<PostFormProps> = ({
  onSubmit,
  initialData,
  submitLabel = "Publicar",
  title = "Nova Publicação"
}) => {
  const { isAdmin, loading: adminCheckLoading } = useAdminCheck();
  const [content, setContent] = useState(initialData?.content || '');
  const [mediaType, setMediaType] = useState<'none' | 'image' | 'video'>(initialData?.media_type as any || 'none');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string>(initialData?.media_url || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMediaTypeChange = (value: string) => {
    setMediaType(value as 'none' | 'image' | 'video');
    if (value === 'none') {
      setMediaFile(null);
      setMediaUrl('');
    }
  };

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (mediaType === 'image' && !file.type.startsWith('image/')) {
      toast.error('Por favor, selecione um arquivo de imagem válido');
      return;
    }

    if (mediaType === 'video' && !file.type.startsWith('video/')) {
      toast.error('Por favor, selecione um arquivo de vídeo válido');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('O arquivo é muito grande. O tamanho máximo é 10MB.');
      return;
    }

    setMediaFile(file);

    // Create a temporary URL for preview
    const objectUrl = URL.createObjectURL(file);
    setMediaUrl(objectUrl);
  };

  const uploadMedia = async (): Promise<string | null> => {
    if (!mediaFile || mediaType === 'none') return null;

    setIsUploading(true);
    try {
      const fileExt = mediaFile.name.split('.').pop();
      const filePath = `newsletter/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('media')
        .upload(filePath, mediaFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      if (!data?.path) {
        throw new Error('Erro ao obter URL do arquivo após upload');
      }

      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading media:', error);
      toast.error('Erro ao fazer upload do arquivo. Verifique sua conexão e tente novamente.');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAdmin) {
      toast.error('Apenas administradores podem criar publicações');
      return;
    }
    
    if (!content.trim()) {
      toast.error('O conteúdo da publicação não pode estar vazio');
      return;
    }
    
    setIsSubmitting(true);
    try {
      let finalMediaUrl = mediaUrl;
      if (mediaFile) {
        finalMediaUrl = await uploadMedia() || '';
        if (!finalMediaUrl && mediaType !== 'none') {
          toast.error('Erro ao fazer upload da mídia. Tente novamente.');
          return;
        }
      }
      
      await onSubmit({
        content,
        media_type: mediaType,
        media_url: finalMediaUrl || null,
      });
      
      // Reset form after successful submission if it's a new post
      if (!initialData) {
        setContent('');
        setMediaType('none');
        setMediaFile(null);
        setMediaUrl('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (adminCheckLoading) {
    return (
      <Card className="border-white/10 bg-inventu-dark/80 backdrop-blur-sm shadow-md">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-inventu-blue" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-white/10 bg-inventu-dark/80 backdrop-blur-sm shadow-md">
      <CardHeader>
        <CardTitle className="text-white">{title}</CardTitle>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content" className="text-white">Conteúdo</Label>
            <Textarea
              id="content"
              placeholder="O que você deseja compartilhar?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] bg-inventu-darker/80 border-white/10 resize-none text-white"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="mediaType" className="text-white">Tipo de mídia</Label>
            <Select value={mediaType} onValueChange={handleMediaTypeChange}>
              <SelectTrigger className="bg-inventu-darker/80 border-white/10 text-white">
                <SelectValue placeholder="Selecione o tipo de mídia" />
              </SelectTrigger>
              <SelectContent className="bg-inventu-dark/90 border-white/10">
                <SelectItem value="none" className="text-white">Apenas texto</SelectItem>
                <SelectItem value="image" className="text-white">Imagem</SelectItem>
                <SelectItem value="video" className="text-white">Vídeo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {mediaType !== 'none' && (
            <div className="space-y-2">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept={mediaType === 'image' ? 'image/*' : 'video/*'}
                onChange={handleFileChange}
              />
              
              {!mediaUrl ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleFileSelect}
                  className="w-full h-20 border-dashed border-white/20 bg-inventu-darker/50 text-white/70"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Selecionar {mediaType === 'image' ? 'imagem' : 'vídeo'}
                </Button>
              ) : (
                <div className="relative rounded-md overflow-hidden">
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full"
                    onClick={handleRemoveMedia}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  
                  {mediaType === 'image' ? (
                    <AspectRatio ratio={4 / 5} className="bg-inventu-darker">
                      <img
                        src={mediaUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </AspectRatio>
                  ) : (
                    <AspectRatio ratio={4 / 5} className="bg-inventu-darker">
                      <video
                        src={mediaUrl}
                        className="w-full h-full object-cover"
                        controls
                        preload="metadata"
                      />
                    </AspectRatio>
                  )}
                </div>
              )}
              
              <p className="text-xs text-white/60">
                {mediaType === 'image' ? 'Imagem recomendada: formato 4:5 (1080x1350px)' : 'Vídeo recomendado: formato 4:5, até 60 segundos, máx. 10MB'}
              </p>
            </div>
          )}
        </CardContent>
        
        <CardFooter>
          <Button
            type="submit"
            className="w-full bg-inventu-blue hover:bg-inventu-blue/80 text-white"
            disabled={isSubmitting || isUploading || (mediaType !== 'none' && !mediaUrl)}
          >
            {(isSubmitting || isUploading) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isUploading ? 'Enviando mídia...' : submitLabel}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default PostForm;
