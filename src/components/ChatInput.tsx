
import React, { useState, useEffect, useRef } from 'react';
import { toast } from '@/components/ui/use-toast';
import { ChatMode } from './ModeSelector';
import LumaParamsButton, { LumaParams, defaultLumaParams } from './LumaParamsButton';
import { canModelGenerateImages } from './ModelSelector';
import FilePreview from './chat/FilePreview';
import ImageGenerationTip from './chat/ImageGenerationTip';
import MessageInput from './chat/MessageInput';

interface ChatInputProps {
  onSendMessage: (message: string, files?: string[], params?: any) => void;
  model?: string;
  mode?: ChatMode;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  model = '', 
  mode = 'text' 
}) => {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviewUrls, setFilePreviewUrls] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [lumaParams, setLumaParams] = useState<LumaParams>(defaultLumaParams);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isImageGenerationModel = mode === 'image' && model && canModelGenerateImages(model);
  
  // Clear files when mode changes
  useEffect(() => {
    setFiles([]);
    setFilePreviewUrls([]);
  }, [mode]);

  const handleSendMessage = async () => {
    if (message.trim() || (files.length > 0 && mode !== 'text')) {
      try {
        setIsSending(true);
        const fileUrls = await uploadFiles();
        
        // Include Luma parameters if using a Luma model
        const params = model.includes('luma') ? lumaParams : undefined;
        
        onSendMessage(
          message.trim() || `[${mode} anexado]`, 
          fileUrls.length > 0 ? fileUrls : undefined,
          params
        );
        
        setMessage('');
        setFiles([]);
        setFilePreviewUrls([]);
      } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        toast({
          title: "Erro",
          description: "Não foi possível enviar a mensagem",
          variant: "destructive",
        });
      } finally {
        setIsSending(false);
      }
    } else {
      toast({
        title: "Alerta",
        description: "Por favor, insira uma mensagem ou anexe um arquivo compatível com o modo selecionado.",
      });
    }
  };

  const handleAttachment = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    // Check if the mode corresponds to the file type
    const file = selectedFiles[0];
    let isValidFile = false;
    
    if (mode === 'image' && file.type.startsWith('image/')) {
      isValidFile = true;
    } else if (mode === 'video' && file.type.startsWith('video/')) {
      isValidFile = true;
    } else if (mode === 'audio' && file.type.startsWith('audio/')) {
      isValidFile = true;
    } else if (mode === 'text') {
      // No file uploads in text mode
      toast({
        title: "Alerta",
        description: "Envio de arquivos não disponível no modo texto.",
      });
      return;
    }
    
    if (!isValidFile) {
      toast({
        title: "Tipo de arquivo inválido",
        description: `Por favor, selecione um arquivo ${mode} válido.`,
        variant: "destructive",
      });
      return;
    }
    
    // Limit to a single file
    setFiles([file]);
    
    // Generate file preview
    const fileUrl = URL.createObjectURL(file);
    setFilePreviewUrls([fileUrl]);
    
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    
    // Release URL
    if (filePreviewUrls[index]) {
      URL.revokeObjectURL(filePreviewUrls[index]);
    }
    
    setFilePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Function to upload files (simulation)
  const uploadFiles = async (): Promise<string[]> => {
    // In a real implementation, you would send the files to a server or storage service
    // and return the URLs of the uploaded files.
    // For now, we'll just simulate this by returning the local file URLs
    
    return filePreviewUrls;
  };

  const handleLumaParamsChange = (params: LumaParams) => {
    setLumaParams(params);
  };

  return (
    <div className="relative w-full">
      {/* Luma AI Parameters Button */}
      {model && model.includes('luma') && (mode === 'image' || mode === 'video') && (
        <div className="flex justify-end mb-2">
          <LumaParamsButton 
            mode={mode} 
            model={model} 
            params={lumaParams} 
            onParamsChange={handleLumaParamsChange} 
          />
        </div>
      )}
      
      {/* Image generation tip */}
      <ImageGenerationTip show={isImageGenerationModel && files.length === 0} />
      
      {/* File previews */}
      <FilePreview 
        fileUrls={filePreviewUrls} 
        mode={mode} 
        onRemoveFile={removeFile} 
      />
      
      {/* Message input */}
      <MessageInput
        message={message}
        setMessage={setMessage}
        onSendMessage={handleSendMessage}
        onAttachment={handleAttachment}
        isImageGenerationModel={isImageGenerationModel}
        isSending={isSending}
        mode={mode}
        model={model}
      />
      
      {/* Sending indicator */}
      {isSending && (
        <div className="text-xs text-center mt-1 text-inventu-gray animate-pulse">
          Enviando mensagem...
        </div>
      )}
    </div>
  );
};

export default ChatInput;
