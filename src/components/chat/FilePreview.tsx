
import React from 'react';
import { X, FileText, FilePdf, FileImage } from 'lucide-react';
import { ChatMode } from '@/components/ModeSelector';
import { cn } from '@/lib/utils';

interface FilePreviewProps {
  fileUrls: string[];
  mode: ChatMode;
  onRemoveFile: (index: number) => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({ fileUrls, mode, onRemoveFile }) => {
  if (!fileUrls || fileUrls.length === 0) return null;

  const getIconForFile = (url: string) => {
    if (url.includes('.pdf')) {
      return <FilePdf className="h-8 w-8" />;
    } else if (url.includes('.doc') || url.includes('.docx') || url.includes('.txt')) {
      return <FileText className="h-8 w-8" />;
    }
    return <FileImage className="h-8 w-8" />;
  };

  const getPreviewContent = (url: string, index: number) => {
    // For text mode, show appropriate icon based on file type
    if (mode === 'text') {
      return (
        <div className="relative flex items-center justify-center bg-inventu-dark/50 rounded-lg p-4">
          {getIconForFile(url)}
          <button
            onClick={() => onRemoveFile(index)}
            className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      );
    }

    // For images, show the preview
    if (mode === 'image' || url.startsWith('data:image/')) {
      return (
        <div className="relative w-24 h-24">
          <img
            src={url}
            alt="Preview"
            className="w-full h-full object-cover rounded-lg"
          />
          <button
            onClick={() => onRemoveFile(index)}
            className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      );
    }

    // For other files (video, audio)
    return (
      <div className="relative w-24 h-24 bg-inventu-dark/50 rounded-lg flex items-center justify-center">
        <FileText className="h-8 w-8" />
        <button
          onClick={() => onRemoveFile(index)}
          className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  };

  return (
    <div className={cn(
      "flex flex-wrap gap-2 px-4 py-2",
      "bg-inventu-dark/20 rounded-lg"
    )}>
      {fileUrls.map((url, index) => (
        <div key={index} className="relative">
          {getPreviewContent(url, index)}
        </div>
      ))}
    </div>
  );
};

export default FilePreview;
