
import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, X, AudioLines } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { ChatMode } from './ModeSelector';

interface ChatInputProps {
  onSendMessage: (message: string, files?: string[]) => void;
  model?: string;
  mode?: ChatMode;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, model, mode = 'text' }) => {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviewUrls, setFilePreviewUrls] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // Limpar arquivos quando o modo muda
  useEffect(() => {
    setFiles([]);
    setFilePreviewUrls([]);
  }, [mode]);

  const handleSendMessage = async () => {
    if (message.trim()) {
      try {
        const fileUrls = await uploadFiles();
        onSendMessage(message, fileUrls.length > 0 ? fileUrls : undefined);
        setMessage('');
        setFiles([]);
        setFilePreviewUrls([]);
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        toast({
          title: "Erro",
          description: "Não foi possível enviar a mensagem",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Alerta",
        description: "Por favor, insira uma mensagem.",
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
    
    // Verificar se o modo corresponde ao tipo de arquivo
    const file = selectedFiles[0];
    let isValidFile = false;
    
    if (mode === 'image' && file.type.startsWith('image/')) {
      isValidFile = true;
    } else if (mode === 'video' && file.type.startsWith('video/')) {
      isValidFile = true;
    } else if (mode === 'audio' && file.type.startsWith('audio/')) {
      isValidFile = true;
    } else if (mode === 'text') {
      // No modo texto, não permitimos envio de arquivos
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
    
    // Limitar a um único arquivo
    setFiles([file]);
    
    // Gerar preview do arquivo
    const fileUrl = URL.createObjectURL(file);
    setFilePreviewUrls([fileUrl]);
    
    // Limpar o input de arquivo
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    
    // Liberar URL de preview
    if (filePreviewUrls[index]) {
      URL.revokeObjectURL(filePreviewUrls[index]);
    }
    
    setFilePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Função para fazer upload dos arquivos (simulação)
  const uploadFiles = async (): Promise<string[]> => {
    // Em uma implementação real, você enviaria os arquivos para um servidor ou serviço de armazenamento
    // e retornaria as URLs dos arquivos enviados.
    // Por enquanto, vamos apenas simular isso retornando as URLs locais dos arquivos
    
    return filePreviewUrls;
  };

  return (
    <div className="relative mt-3">
      {/* Previews dos arquivos */}
      {filePreviewUrls.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {filePreviewUrls.map((url, index) => (
            <div 
              key={index} 
              className="relative rounded-md overflow-hidden h-20 w-20 border border-inventu-gray/30"
            >
              {mode === 'image' && (
                <img src={url} alt="Preview" className="h-full w-full object-cover" />
              )}
              {mode === 'video' && (
                <video src={url} className="h-full w-full object-cover" />
              )}
              {mode === 'audio' && (
                <div className="flex items-center justify-center h-full w-full bg-inventu-darker">
                  <AudioLines className="h-10 w-10 text-inventu-gray" />
                </div>
              )}
              <button 
                onClick={() => removeFile(index)}
                className="absolute top-0 right-0 bg-black/50 p-1 rounded-bl-md"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Input de mensagem */}
      <div className="relative rounded-lg border border-inventu-gray/30 bg-inventu-card">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder={model ? `Pergunte ao ${model}...` : "Digite sua mensagem..."}
          className="w-full pl-4 pr-20 py-2 rounded-lg bg-transparent text-white resize-none overflow-hidden focus:outline-none"
          rows={1}
        />
        <div className="absolute top-1/2 right-3 -translate-y-1/2 flex gap-2">
          {/* Input oculto para arquivos */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
            accept={
              mode === 'image' ? 'image/*' : 
              mode === 'video' ? 'video/*' : 
              mode === 'audio' ? 'audio/*' : 
              ''
            }
          />
          
          {/* Mostrar o botão de anexo apenas nos modos que permitem */}
          {mode !== 'text' && (
            <Button 
              onClick={handleAttachment}
              variant="ghost" 
              size="icon"
              className="text-inventu-gray hover:text-white hover:bg-inventu-gray/20"
              title={`Anexar ${mode}`}
            >
              <Paperclip className="h-5 w-5" />
            </Button>
          )}
          
          <Button 
            onClick={handleSendMessage}
            variant="ghost" 
            size="icon"
            className="text-inventu-gray hover:text-white hover:bg-inventu-gray/20"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
