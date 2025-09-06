import React, { useState } from 'react';
import { Search, MoreVertical, MessageCircle, Plus } from 'lucide-react';
import { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Conversation = Database['public']['Tables']['conversations']['Row'] & {
  participants: (Database['public']['Tables']['conversation_participants']['Row'] & {
    profile: Profile;
  })[];
  last_message?: Database['public']['Tables']['messages']['Row'] & {
    sender: Profile;
  };
};

interface ContactListProps {
  conversations: Conversation[];
  profiles: Profile[];
  currentUser: Profile;
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onCreateConversation: (participantId: string) => void;
}

export const ContactList: React.FC<ContactListProps> = ({
  conversations,
  profiles,
  currentUser,
  selectedConversationId,
  onSelectConversation,
  onCreateConversation,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);

  const filteredConversations = conversations.filter(conversation => {
    const otherParticipant = conversation.participants.find(p => p.user_id !== currentUser.id);
    return otherParticipant?.profile.full_name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const availableProfiles = profiles.filter(profile => 
    profile.id !== currentUser.id &&
    profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !conversations.some(conv => 
      conv.participants.some(p => p.user_id === profile.id)
    )
  );

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="w-full md:w-96 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="bg-[#128C7E] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img
            src={currentUser.avatar_url || `https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=100`}
            alt={currentUser.full_name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <h1 className="text-white font-medium">{currentUser.full_name}</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setShowNewChat(!showNewChat)}
            className="text-white hover:bg-white/10 p-2 rounded-full transition-colors"
          >
            <Plus size={20} />
          </button>
          <button className="text-white hover:bg-white/10 p-2 rounded-full transition-colors">
            <MessageCircle size={20} />
          </button>
          <button className="text-white hover:bg-white/10 p-2 rounded-full transition-colors">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-[#128C7E] px-4 pb-2">
        <div className="flex space-x-8">
          <button className="text-white border-b-2 border-white pb-2 px-1 font-medium">
            Chats
          </button>
          <button className="text-white/70 hover:text-white pb-2 px-1 font-medium transition-colors">
            Status
          </button>
          <button className="text-white/70 hover:text-white pb-2 px-1 font-medium transition-colors">
            Calls
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-3 bg-gray-50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder={showNewChat ? "Search people" : "Search conversations"}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25D366] transition-shadow"
          />
        </div>
      </div>

      {/* Conversation/Contact List */}
      <div className="flex-1 overflow-y-auto">
        {showNewChat ? (
          // Show available profiles for new chat
          availableProfiles.map((profile) => (
            <div
              key={profile.id}
              onClick={() => {
                onCreateConversation(profile.id);
                setShowNewChat(false);
                setSearchTerm('');
              }}
              className="p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img
                    src={profile.avatar_url || `https://images.pexels.com/photos/${Math.floor(Math.random() * 1000000)}/pexels-photo-${Math.floor(Math.random() * 1000000)}.jpeg?auto=compress&cs=tinysrgb&w=100`}
                    alt={profile.full_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {profile.is_online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#25D366] border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{profile.full_name}</h3>
                  <p className="text-sm text-gray-600 truncate">@{profile.username}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          // Show existing conversations
          filteredConversations.map((conversation) => {
            const otherParticipant = conversation.participants.find(p => p.user_id !== currentUser.id);
            if (!otherParticipant) return null;

            return (
              <div
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedConversationId === conversation.id ? 'bg-[#E8F5E8]' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={otherParticipant.profile.avatar_url || `https://images.pexels.com/photos/${Math.floor(Math.random() * 1000000)}/pexels-photo-${Math.floor(Math.random() * 1000000)}.jpeg?auto=compress&cs=tinysrgb&w=100`}
                      alt={otherParticipant.profile.full_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {otherParticipant.profile.is_online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#25D366] border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 truncate">{otherParticipant.profile.full_name}</h3>
                      {conversation.last_message && (
                        <span className="text-xs text-gray-500">
                          {formatTime(conversation.last_message.created_at)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.last_message ? (
                          conversation.last_message.sender_id === currentUser.id ? 
                            `You: ${conversation.last_message.content}` : 
                            conversation.last_message.content
                        ) : (
                          'No messages yet'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {showNewChat && availableProfiles.length === 0 && (
          <div
            className="p-8 text-center text-gray-500"
          >
            <p>No new contacts found</p>
          </div>
        )}

        {!showNewChat && filteredConversations.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <p>No conversations yet</p>
            <button
              onClick={() => setShowNewChat(true)}
              className="mt-2 text-[#25D366] hover:text-[#128C7E] font-medium"
            >
              Start a new chat
            </button>
          </div>
        )}
      </div>
    </div>
  );
};