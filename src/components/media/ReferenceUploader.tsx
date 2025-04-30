
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X, Upload, Image as ImageIcon } from 'lucide-react';

interface ReferenceUploaderProps {
  label?: string;
  onReferenceUpdate?: (url: string | null) => void;
  disabled?: boolean;
}

const ReferenceUploader: React.FC<ReferenceUploaderProps> = ({ 
  label = "Reference Image", 
  onReferenceUpdate,
  disabled = false
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file (image only)
    if (!file.type.startsWith('image/')) {
      console.error('Selected file is not an image');
      return;
    }

    // Create a local preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    if (onReferenceUpdate) {
      onReferenceUpdate(url);
    }
  };

  const handleRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
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
      <Label>{label}</Label>
      
      {previewUrl ? (
        <div className="relative border rounded-md overflow-hidden">
          <img 
            src={previewUrl} 
            alt="Reference" 
            className="w-full h-auto max-h-32 object-contain" 
          />
          <Button 
            type="button"
            size="icon"
            variant="destructive"
            className="absolute top-1 right-1 h-6 w-6"
            onClick={handleRemove}
            disabled={disabled}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-4 border border-dashed rounded-md bg-muted/30">
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
            disabled={disabled}
          />
          <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-2">
            Upload a reference image
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1"
            disabled={disabled}
          >
            <Upload className="h-3 w-3" />
            Browse
          </Button>
        </div>
      )}
    </div>
  );
};

export default ReferenceUploader;
