
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { ChatMode } from '@/components/ModeSelector';

export function useMediaHandling() {
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviewUrls, setFilePreviewUrls] = useState<string[]>([]);
  const [isMediaUploading, setIsMediaUploading] = useState(false);

  // Adicionar arquivo com validação de tipo
  const handleFileChange = useCallback((file: File, mode: ChatMode): boolean => {
    try {
      // Validar tipo de arquivo baseado no modo
      let isValidType = false;
      
      switch (mode) {
        case 'image':
          isValidType = file.type.startsWith('image/');
          if (!isValidType) {
            toast.error('Por favor, selecione apenas arquivos de imagem');
          }
          break;
        case 'video':
          isValidType = file.type.startsWith('video/');
          if (!isValidType) {
            toast.error('Por favor, selecione apenas arquivos de vídeo');
          }
          break;
        case 'audio':
          isValidType = file.type.startsWith('audio/');
          if (!isValidType) {
            toast.error('Por favor, selecione apenas arquivos de áudio');
          }
          break;
        default:
          isValidType = true;
      }
      
      if (!isValidType) {
        return false;
      }
      
      // Criar URL para preview
      const fileUrl = URL.createObjectURL(file);
      
      // Adicionar arquivo ao estado
      setFiles(prevFiles => [...prevFiles, file]);
      setFilePreviewUrls(prevUrls => [...prevUrls, fileUrl]);
      
      return true;
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast.error('Erro ao processar arquivo');
      return false;
    }
  }, []);

  // Remover arquivo
  const removeFile = useCallback((index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    
    // Revogar URL do objeto para liberar memória
    URL.revokeObjectURL(filePreviewUrls[index]);
    setFilePreviewUrls(prevUrls => prevUrls.filter((_, i) => i !== index));
  }, [filePreviewUrls]);

  // Limpar todos os arquivos
  const clearFiles = useCallback(() => {
    // Revogar todas as URLs de objetos
    filePreviewUrls.forEach(url => {
      URL.revokeObjectURL(url);
    });
    
    setFiles([]);
    setFilePreviewUrls([]);
  }, [filePreviewUrls]);

  // Fazer upload de arquivos
  const uploadFiles = useCallback(async (): Promise<string[]> => {
    if (files.length === 0) {
      return [];
    }
    
    try {
      setIsMediaUploading(true);
      
      // Simular upload - em uma implementação real, você faria upload para o servidor
      const uploadedUrls = await Promise.all(
        files.map(async (file) => {
          // Simular atraso de rede
          await new Promise(resolve => setTimeout(resolve, 500));
          return URL.createObjectURL(file);
        })
      );
      
      return uploadedUrls;
    } catch (error) {
      console.error('Erro ao fazer upload de arquivos:', error);
      toast.error('Erro ao fazer upload de arquivos');
      return [];
    } finally {
      setIsMediaUploading(false);
    }
  }, [files]);

  return {
    files,
    filePreviewUrls,
    isMediaUploading,
    handleFileChange,
    removeFile,
    clearFiles,
    uploadFiles
  };
}
