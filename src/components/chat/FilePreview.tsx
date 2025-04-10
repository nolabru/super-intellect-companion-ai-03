
import React from 'react';
import { AudioLines, X } from 'lucide-react';
import { ChatMode } from '@/components/ModeSelector';

interface FilePreviewProps {
  fileUrls: string[];
  mode: ChatMode;
  onRemoveFile: (index: number) => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({ 
  fileUrls, 
  mode, 
  onRemoveFile 
}) => {
  if (fileUrls.length === 0) return null;

  console.log(`FilePreview rendering with mode=${mode}, fileUrls=${fileUrls.length}`);

  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {fileUrls.map((url, index) => (
        <div 
          key={index} 
          className="relative rounded-md overflow-hidden h-20 w-20 border border-inventu-gray/30"
        >
          {mode === 'image' && (
            <img src={url} alt="Preview" className="h-full w-full object-cover" />
          )}
          {mode === 'video' && (
            <video src={url} className="h-full w-full object-cover" controls={false} />
          )}
          {mode === 'audio' && (
            <div className="flex items-center justify-center h-full w-full bg-inventu-darker">
              <AudioLines className="h-10 w-10 text-inventu-gray" />
            </div>
          )}
          <button 
            onClick={() => onRemoveFile(index)}
            className="absolute top-0 right-0 bg-black/50 p-1 rounded-bl-md"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default FilePreview;
