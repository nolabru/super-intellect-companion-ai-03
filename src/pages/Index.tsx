
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button"
import ModeSelector from '@/components/ModeSelector';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import { useConversation } from '@/hooks/useConversation';
import ConversationList from '@/components/ConversationList';
import AppHeader from '@/components/AppHeader';
import { Cog } from 'lucide-react';
import SettingsSidebar from '@/components/SettingsSidebar';

const Index: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const {
    messages,
    sendMessage,
    loading,
    error,
    conversations,
    currentConversationId,
    setCurrentConversationId,
    createNewConversation,
    deleteConversation,
    renameConversation
  } = useConversation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen">
      <AppHeader />

      <div className="flex flex-grow">
        {/* Conversation List */}
        <ConversationList
          conversations={conversations}
          currentConversationId={currentConversationId}
          setCurrentConversationId={setCurrentConversationId}
          createNewConversation={createNewConversation}
          deleteConversation={deleteConversation}
          renameConversation={renameConversation}
          loading={loading}
        />

        {/* Main Chat Area */}
        <div className="flex flex-col flex-grow bg-inventu-card">
          <div className="flex justify-end p-4">
            <Button variant="ghost" size="icon" onClick={handleToggleSidebar}>
              <Cog className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-grow overflow-y-auto p-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {loading && <ChatMessage message={{ id: 'loading', content: 'Loading...', sender: 'assistant', timestamp: new Date().toISOString(), loading: true }} />}
            {error && <p className="text-red-500">Error: {error}</p>}
          </div>

          {/* Chat Input - Adapt to match the props expected by ChatInput */}
          <div className="p-4 border-t border-gray-800">
            <ChatInput onSendMessage={sendMessage} isLoading={loading} />
          </div>
        </div>

        {/* Settings Sidebar */}
        <SettingsSidebar sidebarOpen={sidebarOpen} onToggleSidebar={handleToggleSidebar} />
      </div>
    </div>
  );
};

export default Index;
