
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash, Edit2 } from 'lucide-react';
import { ConversationType } from '@/hooks/useConversation';

interface ConversationListProps {
  conversations: ConversationType[];
  currentConversationId: string | null;
  setCurrentConversationId: (id: string) => void;
  createNewConversation: () => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, newTitle: string) => Promise<void>;
  loading: boolean;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  currentConversationId,
  setCurrentConversationId,
  createNewConversation,
  deleteConversation,
  renameConversation,
  loading
}) => {
  return (
    <aside className="w-64 bg-inventu-darker border-r border-gray-800 overflow-y-auto hidden md:block">
      <div className="p-4">
        <Button 
          className="w-full" 
          onClick={createNewConversation}
          disabled={loading}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Conversa
        </Button>
        
        <div className="mt-4 space-y-1">
          {conversations.map((conversation) => (
            <div 
              key={conversation.id} 
              className={`p-2 rounded-lg cursor-pointer flex justify-between items-center ${
                currentConversationId === conversation.id ? 'bg-inventu-gray' : 'hover:bg-inventu-gray/50'
              }`}
              onClick={() => setCurrentConversationId(conversation.id)}
            >
              <span className="truncate">{conversation.title}</span>
              <div className="flex space-x-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newTitle = prompt('Novo nome da conversa:', conversation.title);
                    if (newTitle && newTitle !== conversation.title) {
                      renameConversation(conversation.id, newTitle);
                    }
                  }}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Tem certeza que deseja excluir esta conversa?')) {
                      deleteConversation(conversation.id);
                    }
                  }}
                >
                  <Trash className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default ConversationList;
