
import React, { useState, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';

interface ReferenceUploaderProps {
  label?: string;
  accept?: string;
  disabled?: boolean;
  onReferenceUpdate?: (url: string | null) => void;
}

const ReferenceUploader: React.FC<ReferenceUploaderProps> = ({
  label = 'Reference Image',
  accept = 'image/*',
  disabled = false,
  onReferenceUpdate
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      
      if (onReferenceUpdate) {
        onReferenceUpdate(url);
      }
    }
  };

  const handleClearFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    
    setFile(null);
    setPreviewUrl(null);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    if (onReferenceUpdate) {
      onReferenceUpdate(null);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="referenceFile">{label}</Label>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <Input
          ref={fileInputRef}
          id="referenceFile"
          type="file"
          accept={accept}
          onChange={handleFileChange}
          disabled={disabled}
          className="cursor-pointer"
        />
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          <Upload className="h-4 w-4" />
        </Button>
      </div>
      
      {previewUrl && (
        <div className="relative border rounded-md overflow-hidden mt-2">
          <img 
            src={previewUrl} 
            alt="Reference" 
            className="w-full h-48 object-contain" 
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/80"
            onClick={handleClearFile}
            disabled={disabled}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ReferenceUploader;
