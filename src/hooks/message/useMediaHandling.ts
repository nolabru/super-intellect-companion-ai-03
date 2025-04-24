
import { useState } from 'react';
import { toast } from 'sonner';
import { ChatMode } from '@/components/ModeSelector';
import { piapiService } from '@/services/piapiService';
import { useMediaGeneration } from '@/hooks/useMediaGeneration';

export function useMediaHandling() {
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviewUrls, setFilePreviewUrls] = useState<string[]>([]);
  const [isMediaUploading, setIsMediaUploading] = useState(false);
  
  const mediaGeneration = useMediaGeneration({
    showToasts: false // Não queremos toasts duplicados
  });

  const validateFile = (file: File, mode: ChatMode): boolean => {
    if (mode === 'image' && file.type.startsWith('image/')) {
      return true;
    } else if (mode === 'video' && file.type.startsWith('video/')) {
      return true;
    } else if (mode === 'audio' && file.type.startsWith('audio/')) {
      return true;
    }
    return false;
  };

  const handleFileChange = (file: File, mode: ChatMode): boolean => {
    if (!file) return false;

    if (mode === 'text') {
      toast.error("Envio de arquivos não disponível no modo texto.");
      return false;
    }

    if (!validateFile(file, mode)) {
      toast.error(`Por favor, selecione um arquivo ${mode} válido.`);
      return false;
    }

    setFiles([file]);
    const fileUrl = URL.createObjectURL(file);
    setFilePreviewUrls([fileUrl]);
    return true;
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    
    if (filePreviewUrls[index]) {
      URL.revokeObjectURL(filePreviewUrls[index]);
    }
    
    setFilePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const clearFiles = () => {
    filePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    setFiles([]);
    setFilePreviewUrls([]);
  };

  const uploadFiles = async (): Promise<string[]> => {
    if (files.length === 0) return [];
    
    setIsMediaUploading(true);
    try {
      return filePreviewUrls;
    } catch (error) {
      console.error('Erro ao fazer upload dos arquivos:', error);
      toast.error('Erro ao fazer upload dos arquivos');
      return [];
    } finally {
      setIsMediaUploading(false);
    }
  };

  return {
    files,
    filePreviewUrls,
    isMediaUploading,
    handleFileChange,
    removeFile,
    clearFiles,
    uploadFiles,
    mediaGeneration // Expor funcionalidades de geração de mídia
  };
}
