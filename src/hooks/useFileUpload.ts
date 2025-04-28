
import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { ChatMode } from '@/components/ModeSelector';

interface UseFileUploadProps {
  mode: ChatMode;
  maxFileSizeMB?: number;
}

export function useFileUpload({ mode, maxFileSizeMB = 10 }: UseFileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviewUrls, setFilePreviewUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Convert MB to bytes
  const maxSizeBytes = maxFileSizeMB * 1024 * 1024;

  const handleClear = useCallback(() => {
    // Revoke any object URLs to prevent memory leaks
    filePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    
    setFiles([]);
    setFilePreviewUrls([]);
    
    // Reset file input if it exists
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [filePreviewUrls]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    // Get the first file (we only handle one file at a time)
    const file = selectedFiles[0];
    
    // Check file size
    if (file.size > maxSizeBytes) {
      toast.error(`Arquivo muito grande`, {
        description: `O tamanho máximo permitido é ${maxFileSizeMB}MB.`
      });
      return;
    }
    
    // Validate file type based on mode
    let isValidFile = false;
    
    if (mode === 'image' && file.type.startsWith('image/')) {
      isValidFile = true;
    } else if (mode === 'video' && file.type.startsWith('video/')) {
      isValidFile = true;
    } else if (mode === 'audio' && file.type.startsWith('audio/')) {
      isValidFile = true;
    } else if (mode === 'text') {
      toast({
        title: "Alerta",
        description: "Envio de arquivos não disponível no modo texto."
      });
      return;
    }
    
    if (!isValidFile) {
      toast.error(`Tipo de arquivo inválido`, {
        description: `Por favor, selecione um arquivo ${mode} válido.`
      });
      return;
    }
    
    // Clear any existing files first
    handleClear();
    
    // Create object URL for preview
    const fileUrl = URL.createObjectURL(file);
    
    // Update state
    setFiles([file]);
    setFilePreviewUrls([fileUrl]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [mode, maxSizeBytes, maxFileSizeMB, handleClear]);

  const removeFile = useCallback((index: number) => {
    // First revoke the object URL to prevent memory leaks
    if (filePreviewUrls[index]) {
      URL.revokeObjectURL(filePreviewUrls[index]);
    }
    
    // Then remove the file from state
    setFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviewUrls(prev => prev.filter((_, i) => i !== index));
  }, [filePreviewUrls]);

  const triggerFileInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  // Actually upload files to a server
  const uploadFiles = useCallback(async (): Promise<string[]> => {
    if (files.length === 0) return [];
    
    try {
      setIsUploading(true);
      
      // In a real implementation, you would upload the files to a server here
      // For now, we'll just return the local preview URLs
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return [...filePreviewUrls];
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Falha ao enviar arquivo', {
        description: 'Ocorreu um erro ao enviar o arquivo.'
      });
      return [];
    } finally {
      setIsUploading(false);
    }
  }, [files, filePreviewUrls]);

  return {
    files,
    filePreviewUrls,
    isUploading,
    fileInputRef,
    handleFileChange,
    removeFile,
    handleClear,
    triggerFileInput,
    uploadFiles
  };
}
