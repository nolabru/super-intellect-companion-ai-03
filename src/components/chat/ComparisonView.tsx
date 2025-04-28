
import React from 'react';
import { cn } from '@/lib/utils';
import ChatInterface from '@/components/ChatInterface';
import ChatInput from '@/components/ChatInput';
import { MessageType } from '@/components/ChatMessage';
import { ChatMode } from '@/components/ModeSelector';

interface ComparisonViewProps {
  messages: MessageType[];
  leftModel: string;
  rightModel: string;
  activeMode: ChatMode;
  isLinked: boolean;
  availableModels: string[];
  isMobile: boolean;
  loading: boolean;
  initialLoadDone: boolean;
  handleLeftModelChange: (model: string) => void;
  handleRightModelChange: (model: string) => void;
  handleSendMessage: (content: string, files?: string[], params?: any, targetModel?: string) => void;
}

const ComparisonView: React.FC<ComparisonViewProps> = ({
  messages,
  leftModel,
  rightModel,
  activeMode,
  isLinked,
  availableModels,
  isMobile,
  loading,
  initialLoadDone,
  handleLeftModelChange,
  handleRightModelChange,
  handleSendMessage,
}) => {
  if (isMobile) {
    return (
      <div className="flex-1 flex flex-col h-full">
        <ChatInterface 
          messages={messages} 
          model={`${leftModel} & ${rightModel}`}
          title={`${leftModel} & ${rightModel}`}
          onModelChange={() => {}} // Desabilitamos a troca de modelo aqui
          availableModels={[]}
          isCompareMode={true}
          loading={loading && !initialLoadDone}
          hideModelSelector={true} // Adicionamos esta propriedade para esconder o seletor
        />
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 border-r border-inventu-gray/30 flex flex-col">
        <ChatInterface 
          messages={messages} 
          model={leftModel}
          title={leftModel}
          onModelChange={handleLeftModelChange}
          availableModels={availableModels}
          isCompareMode={!isLinked}
          loading={loading && !initialLoadDone}
        />
        {!isLinked && (
          <div className="p-2 sm:p-4 border-t border-inventu-gray/30">
            <ChatInput 
              onSendMessage={(content, files, params) => 
                handleSendMessage(content, files, params, leftModel)
              }
              model={leftModel}
              mode={activeMode}
            />
          </div>
        )}
      </div>
      
      <div className="flex-1 flex flex-col">
        <ChatInterface 
          messages={messages} 
          model={rightModel}
          title={rightModel}
          onModelChange={handleRightModelChange}
          availableModels={availableModels}
          isCompareMode={!isLinked}
          loading={loading && !initialLoadDone}
        />
        {!isLinked && (
          <div className="p-2 sm:p-4 border-t border-inventu-gray/30">
            <ChatInput 
              onSendMessage={(content, files, params) => 
                handleSendMessage(content, files, params, rightModel)
              }
              model={rightModel}
              mode={activeMode}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default ComparisonView;
