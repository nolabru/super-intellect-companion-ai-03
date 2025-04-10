
import React from 'react';
import { ConversationType } from '@/types/conversation';
import ConversationItem from './ConversationItem';

interface ConversationListProps {
  conversations: ConversationType[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  isUserLoggedIn: boolean;
}

const ConversationList: React.FC<ConversationListProps> = ({ 
  conversations, 
  currentConversationId, 
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  isUserLoggedIn
}) => {
  if (!isUserLoggedIn) {
    return (
      <div className="p-4 text-center text-inventu-gray">
        <p>Faça login para ver suas conversas</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center text-inventu-gray">
        <p>Nenhuma conversa encontrada</p>
        <p className="text-sm">Crie uma nova conversa para começar</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 p-2" id="conversation-list">
      {conversations.map((conv) => (
        <ConversationItem
          key={conv.id}
          conversation={conv}
          isActive={currentConversationId === conv.id}
          onSelect={() => onSelectConversation(conv.id)}
          onDelete={() => onDeleteConversation(conv.id)}
          onRename={(newTitle) => onRenameConversation(conv.id, newTitle)}
        />
      ))}
    </div>
  );
};

export default ConversationList;
