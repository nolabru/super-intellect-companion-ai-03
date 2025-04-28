import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { toast } from '@/components/ui/use-toast';
import { ChatMode } from './ModeSelector';
import { LumaParams, defaultLumaParams } from './LumaParamsButton';
import LumaParamsButton from './LumaParamsButton';
import { canModelGenerateImages } from './ModelSelector';
import FilePreview from './chat/FilePreview';
import ImageGenerationTip from './chat/ImageGenerationTip';
import MessageInput from './chat/MessageInput';
import { useGenerationParams } from '@/hooks/useGenerationParams';

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

  const { params: generationParams, updateParams } = useGenerationParams({
    mode,
    model
  });

  const isImageGenerationModel = mode === 'image' && model && canModelGenerateImages(model);
  
  // Clear files when mode changes
  useEffect(() => {
    setFiles([]);
    setFilePreviewUrls([]);
  }, [mode]);

  // Optimized sendMessage function with useCallback
  const handleSendMessage = useCallback(async () => {
    if (message.trim() || (files.length > 0 && mode !== 'text')) {
      try {
        setIsSending(true);
        const fileUrls = await uploadFiles();
        
        // Include Luma parameters if using a Luma model
        const params = model.includes('luma') ? lumaParams : generationParams;
        
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
  }, [message, files, mode, model, lumaParams, generationParams, onSendMessage]);

  const handleAttachment = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
      isValidFile = file.type.startsWith('image/') || 
                    file.type === 'application/pdf' ||
                    file.type === 'application/msword' ||
                    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                    file.type === 'text/plain';
    }
    
    if (!isValidFile) {
      toast({
        title: "Tipo de arquivo inválido",
        description: mode === 'text' ? 
          'Por favor, selecione uma imagem, PDF ou documento.' :
          `Por favor, selecione um arquivo ${mode} válido.`,
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
  }, [mode]);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    
    // Release URL
    if (filePreviewUrls[index]) {
      URL.revokeObjectURL(filePreviewUrls[index]);
    }
    
    setFilePreviewUrls(prev => prev.filter((_, i) => i !== index));
  }, [filePreviewUrls]);

  // Function to upload files (simulation)
  const uploadFiles = async (): Promise<string[]> => {
    return filePreviewUrls;
  };

  const handleLumaParamsChange = useCallback((params: LumaParams) => {
    setLumaParams(params);
  }, []);

  const fileInput = useRef<HTMLInputElement>(null);

  return (
    <div className="relative w-full space-y-3">
      {model && model.includes('luma') && (mode === 'image' || mode === 'video') && (
        <div className="flex justify-end">
          <LumaParamsButton 
            mode={mode} 
            model={model} 
            params={lumaParams} 
            onParamsChange={handleLumaParamsChange} 
          />
        </div>
      )}
      
      <ImageGenerationTip show={isImageGenerationModel && files.length === 0} />
      
      <FilePreview 
        fileUrls={filePreviewUrls} 
        mode={mode} 
        onRemoveFile={removeFile} 
      />
      
      <div className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 transition-all duration-200 focus-within:border-white/20 focus-within:ring-1 focus-within:ring-white/20">
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
      </div>
      
      {isSending && (
        <div className="text-xs text-center mt-1 text-white/60 animate-pulse">
          Enviando mensagem...
        </div>
      )}

      <input
        ref={fileInput}
        type="file"
        className="hidden"
        accept={mode === 'text' ? 
          '.pdf,.doc,.docx,.txt,image/*' : 
          mode === 'image' ? 'image/*' : 
          mode === 'video' ? 'video/*' : 
          mode === 'audio' ? 'audio/*' : 
          ''
        }
        onChange={handleFileChange}
      />
    </div>
  );
};

export default memo(ChatInput);
