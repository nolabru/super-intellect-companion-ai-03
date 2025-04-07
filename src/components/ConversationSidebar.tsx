
import React from 'react';
import { PlusCircle, MessageCircle, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConversation } from '@/hooks/useConversation';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ConversationSidebar: React.FC = () => {
  const { 
    conversations, 
    currentConversationId, 
    setCurrentConversationId, 
    createNewConversation 
  } = useConversation();
  const { user } = useAuth();

  const handleNewConversation = async () => {
    await createNewConversation();
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true,
        locale: ptBR
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="h-full flex flex-col bg-inventu-dark border-r border-inventu-gray/30">
      <div className="p-4 border-b border-inventu-gray/30">
        <Button 
          onClick={handleNewConversation}
          className="w-full bg-inventu-blue hover:bg-inventu-blue/80 text-white"
          disabled={!user}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Conversa
        </Button>
      </div>

      <div className="flex items-center p-4 text-inventu-gray border-b border-inventu-gray/30">
        <History className="mr-2 h-4 w-4" />
        <h2 className="font-medium">Histórico de Conversas</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {user ? (
          conversations.length > 0 ? (
            <div className="space-y-1 p-2">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${
                    currentConversationId === conv.id
                      ? 'bg-inventu-gray/20 text-white'
                      : 'hover:bg-inventu-gray/10 text-inventu-gray'
                  }`}
                  onClick={() => setCurrentConversationId(conv.id)}
                >
                  <MessageCircle className="mr-2 h-4 w-4 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{conv.title}</p>
                    <p className="text-xs text-inventu-gray/70 truncate">
                      {formatDate(conv.updated_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-inventu-gray">
              <p>Nenhuma conversa encontrada</p>
              <p className="text-sm">Crie uma nova conversa para começar</p>
            </div>
          )
        ) : (
          <div className="p-4 text-center text-inventu-gray">
            <p>Faça login para ver suas conversas</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationSidebar;
