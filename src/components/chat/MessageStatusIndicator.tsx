
import React from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';

interface MessageStatusIndicatorProps {
  isLoading: boolean;
  isError: boolean;
  isVideo: boolean;
  videoLoadingTimedOut?: boolean;
  model?: string;
}

const MessageStatusIndicator: React.FC<MessageStatusIndicatorProps> = ({
  isLoading,
  isError,
  isVideo,
  videoLoadingTimedOut,
  model
}) => {
  if (!isLoading && !isError) return null;
  
  if (isError) {
    return (
      <div className="flex items-center gap-2 text-red-400 text-sm mt-2">
        <AlertTriangle className="h-4 w-4" />
        <span>Error processing message</span>
      </div>
    );
  }

  if (isLoading && !isVideo) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm mt-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Processing with {model}...</span>
      </div>
    );
  }

  return null;
};

export default MessageStatusIndicator;
