
import React, { useState, useEffect } from 'react';
import { PlusCircle, MessageCircle, History, ChevronLeft, Trash2, Edit2, Check, X, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConversation } from '@/hooks/useConversation';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Link, useLocation } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ConversationType } from '@/types/conversation';

interface ConversationSidebarProps {
  onToggleSidebar?: () => void;
  isOpen?: boolean;
}

interface ConversationItemProps {
  conversation: ConversationType;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (newTitle: string) => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({ 
  conversation, 
  isActive, 
  onSelect, 
  onDelete,
  onRename
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(conversation.title);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Update the new title when the conversation title changes
  useEffect(() => {
    setNewTitle(conversation.title);
  }, [conversation.title]);

  const handleRename = () => {
    if (newTitle.trim() === '') {
      toast({
        title: "Erro",
        description: "O título não pode estar vazio",
        variant: "destructive",
      });
      return;
    }
    
    onRename(newTitle);
    setIsEditing(false);
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

  if (isEditing) {
    return (
      <div className={`flex items-center p-2 rounded-md ${isActive ? 'bg-inventu-gray/20 text-white' : 'text-inventu-gray'}`}>
        <div className="flex-1 flex items-center gap-2">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="h-8 bg-inventu-card border-inventu-gray/50"
            autoFocus
          />
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 text-green-500 hover:text-white hover:bg-green-500/20"
            onClick={handleRename}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button 
            size="icon" 
            variant="ghost"
            className="h-8 w-8 text-red-500 hover:text-white hover:bg-red-500/20"
            onClick={() => {
              setIsEditing(false);
              setNewTitle(conversation.title);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${
          isActive
            ? 'bg-inventu-gray/20 text-white'
            : 'hover:bg-inventu-gray/10 text-inventu-gray'
        }`}
        data-conversation-id={conversation.id}
      >
        <div className="flex-1 min-w-0" onClick={onSelect}>
          <div className="flex items-center">
            <MessageCircle className="mr-2 h-4 w-4 flex-shrink-0" />
            <p className="truncate">{conversation.title}</p>
          </div>
          <p className="text-xs text-inventu-gray/70 truncate">
            {formatDate(conversation.updated_at)}
          </p>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-inventu-gray/70 hover:text-white hover:bg-inventu-gray/20"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-inventu-card border-inventu-gray/30">
            <DropdownMenuItem 
              className="text-white hover:bg-inventu-gray/20 cursor-pointer"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="mr-2 h-4 w-4" />
              Renomear
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-red-500 hover:bg-red-500/10 cursor-pointer"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-inventu-card border-inventu-gray/30 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conversa</AlertDialogTitle>
            <AlertDialogDescription className="text-inventu-gray">
              Tem certeza que deseja excluir a conversa "{conversation.title}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-inventu-gray/20 text-white hover:bg-inventu-gray/40 border-inventu-gray/40">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
              onClick={onDelete}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const ConversationSidebar: React.FC<ConversationSidebarProps> = ({ 
  onToggleSidebar,
  isOpen = true
}) => {
  const { 
    conversations, 
    currentConversationId, 
    setCurrentConversationId, 
    createNewConversation,
    deleteConversation,
    renameConversation,
  } = useConversation();
  const { user } = useAuth();
  const location = useLocation();

  const handleNewConversation = async () => {
    console.log('[ConversationSidebar] Creating new conversation from sidebar button');
    await createNewConversation();
  };

  const handleSelectConversation = (conversationId: string) => {
    console.log(`[ConversationSidebar] Selecting conversation from sidebar: ${conversationId}`);
    if (currentConversationId === conversationId) {
      console.log(`[ConversationSidebar] Conversation ${conversationId} is already selected`);
      return;
    }
    setCurrentConversationId(conversationId);
  };

  useEffect(() => {
    console.log(`[ConversationSidebar] Current conversation ID: ${currentConversationId}`);
    console.log(`[ConversationSidebar] Available conversations: ${conversations.map(c => c.id).join(', ')}`);
  }, [currentConversationId, conversations]);

  if (!isOpen && onToggleSidebar) {
    return (
      <div className="absolute left-0 top-24 z-10">
        <Button
          onClick={onToggleSidebar}
          size="icon"
          variant="secondary"
          className="rounded-r-md rounded-l-none border-l-0"
          title="Abrir menu"
        >
          <ChevronLeft className="h-5 w-5 rotate-180" />
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-inventu-dark border-r border-inventu-gray/30">
      <div className="p-4 border-b border-inventu-gray/30">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleNewConversation}
              className="flex-1 bg-inventu-blue hover:bg-inventu-blue/80 text-white"
              disabled={!user}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Conversa
            </Button>
            
            {onToggleSidebar && (
              <Button
                onClick={onToggleSidebar}
                size="icon"
                variant="ghost"
                className="text-inventu-gray hover:text-white hover:bg-inventu-gray/20"
                title="Minimizar menu"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Link to="/" className="flex-1">
              <Button 
                variant={location.pathname === '/' ? "default" : "outline"}
                className={`w-full ${location.pathname === '/' 
                  ? 'bg-inventu-blue text-white' 
                  : 'border-inventu-gray/30 text-white hover:bg-inventu-gray/20'}`}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Chat
              </Button>
            </Link>
            
            <Link to="/gallery" className="flex-1">
              <Button 
                variant={location.pathname === '/gallery' ? "default" : "outline"}
                className={`w-full ${location.pathname === '/gallery' 
                  ? 'bg-inventu-blue text-white' 
                  : 'border-inventu-gray/30 text-white hover:bg-inventu-gray/20'}`}
              >
                <Image className="mr-2 h-4 w-4" />
                Galeria
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      <div className="flex items-center p-4 text-inventu-gray border-b border-inventu-gray/30">
        <History className="mr-2 h-4 w-4" />
        <h2 className="font-medium">Histórico de Conversas</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {user ? (
          conversations.length > 0 ? (
            <div className="space-y-1 p-2" id="conversation-list">
              {conversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isActive={currentConversationId === conv.id}
                  onSelect={() => handleSelectConversation(conv.id)}
                  onDelete={() => deleteConversation(conv.id)}
                  onRename={(newTitle) => renameConversation(conv.id, newTitle)}
                />
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
