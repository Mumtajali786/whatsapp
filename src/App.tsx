import React, { useState, useEffect } from 'react';
import { Auth } from './components/Auth';
import { ContactList } from './components/ContactList';
import { ChatWindow } from './components/ChatWindow';
import { useAuth } from './hooks/useAuth';
import { useConversations } from './hooks/useConversations';
import { useMessages } from './hooks/useMessages';
import { useProfiles } from './hooks/useProfiles';

function App() {
  const { user, loading: authLoading } = useAuth();
  const { profiles, updateOnlineStatus } = useProfiles();
  const { conversations, createConversation } = useConversations(user?.id || null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const { messages, sendMessage } = useMessages(selectedConversationId, user?.id || null);

  const currentUser = profiles.find(profile => profile.id === user?.id);
  const selectedConversation = conversations.find(conv => conv.id === selectedConversationId);

  // Update online status when user logs in/out
  useEffect(() => {
    if (user?.id) {
      updateOnlineStatus(user.id, true);
      
      // Set offline when user leaves
      const handleBeforeUnload = () => {
        updateOnlineStatus(user.id, false);
      };
      
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        updateOnlineStatus(user.id, false);
      };
    }
  }, [user?.id, updateOnlineStatus]);

  const handleSendMessage = async (content: string) => {
    if (!selectedConversationId || !user?.id) return;
    
    await sendMessage(content, selectedConversationId, user.id);
  };

  const handleCreateConversation = async (participantId: string) => {
    if (!user?.id) return;
    
    const { data: conversation } = await createConversation(participantId, user.id);
    if (conversation) {
      setSelectedConversationId(conversation.id);
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#25D366] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !currentUser) {
    return <Auth />;
  }

  return (
    <div className="h-screen bg-gray-100 flex">
      <div className="flex w-full">
        <ContactList
          conversations={conversations}
          profiles={profiles}
          currentUser={currentUser}
          selectedConversationId={selectedConversationId}
          onSelectConversation={setSelectedConversationId}
          onCreateConversation={handleCreateConversation}
        />
        <ChatWindow
          conversation={selectedConversation || null}
          currentUser={currentUser}
          messages={messages}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
}

export default App;