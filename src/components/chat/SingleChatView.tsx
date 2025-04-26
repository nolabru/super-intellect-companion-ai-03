
import React from 'react';
import ChatInterface from '@/components/ChatInterface';
import { MessageType } from '@/components/ChatMessage';

interface SingleChatViewProps {
  messages: MessageType[];
  model: string;
  availableModels: string[];
  onModelChange: (model: string) => void;
  loading: boolean;
  initialLoadDone: boolean;
}

const SingleChatView: React.FC<SingleChatViewProps> = ({
  messages,
  model,
  availableModels,
  onModelChange,
  loading,
  initialLoadDone
}) => {
  return (
    <div className="flex-1 flex flex-col h-full">
      <ChatInterface 
        messages={messages} 
        model={model}
        title={model}
        onModelChange={onModelChange}
        availableModels={availableModels}
        isCompareMode={false}
        loading={loading && !initialLoadDone}
      />
    </div>
  );
};

export default SingleChatView;
