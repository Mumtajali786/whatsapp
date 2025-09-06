import React, { useState, useRef, useEffect } from 'react';
import { 
  Phone, 
  Video, 
  MoreVertical, 
  Smile, 
  Paperclip, 
  Mic, 
  Send,
  Check,
  CheckCheck
} from 'lucide-react';
import { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Message = Database['public']['Tables']['messages']['Row'] & {
  sender: Profile;
  message_status: Database['public']['Tables']['message_status']['Row'][];
};

type Conversation = Database['public']['Tables']['conversations']['Row'] & {
  participants: (Database['public']['Tables']['conversation_participants']['Row'] & {
    profile: Profile;
  })[];
};

interface ChatWindowProps {
  conversation: Conversation | null;
  currentUser: Profile;
  messages: Message[];
  onSendMessage: (content: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  currentUser,
  messages,
  onSendMessage,
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const otherParticipant = conversation?.participants.find(p => p.user_id !== currentUser.id);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMessageStatus = (message: Message) => {
    if (message.sender_id === currentUser.id) {
      const statuses = message.message_status || [];
      if (statuses.some(s => s.status === 'read')) {
        return <CheckCheck size={16} className="text-[#25D366]" />;
      } else if (statuses.some(s => s.status === 'delivered')) {
        return <CheckCheck size={16} className="text-gray-400" />;
      } else {
        return <Check size={16} className="text-gray-400" />;
      }
    }
    return null;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (!conversation || !otherParticipant) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#E8F5E8]">
        <div className="text-center">
          <div className="w-48 h-48 mx-auto mb-8 opacity-20">
            <img
              src="https://images.pexels.com/photos/2764678/pexels-photo-2764678.jpeg?auto=compress&cs=tinysrgb&w=500"
              alt="WhatsApp Web"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <h2 className="text-2xl font-light text-gray-600 mb-2">WhatsApp Web</h2>
          <p className="text-gray-500 max-w-md">
            Send and receive messages without keeping your phone online.
            Use WhatsApp on up to 4 linked devices and 1 phone at the same time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#E8F5E8]">
      {/* Chat Header */}
      <div className="bg-[#128C7E] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img
              src={otherParticipant.profile.avatar_url || `https://images.pexels.com/photos/${Math.floor(Math.random() * 1000000)}/pexels-photo-${Math.floor(Math.random() * 1000000)}.jpeg?auto=compress&cs=tinysrgb&w=100`}
              alt={otherParticipant.profile.full_name}
              className="w-10 h-10 rounded-full object-cover"
            />
            {otherParticipant.profile.is_online && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#25D366] border-2 border-white rounded-full"></div>
            )}
          </div>
          <div>
            <h2 className="text-white font-medium">{otherParticipant.profile.full_name}</h2>
            <p className="text-white/70 text-sm">
              {otherParticipant.profile.is_online ? 'online' : 'last seen recently'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="text-white hover:bg-white/10 p-2 rounded-full transition-colors">
            <Video size={20} />
          </button>
          <button className="text-white hover:bg-white/10 p-2 rounded-full transition-colors">
            <Phone size={20} />
          </button>
          <button className="text-white hover:bg-white/10 p-2 rounded-full transition-colors">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => {
          const isOwnMessage = message.sender_id === currentUser.id;
          const showAvatar = !isOwnMessage && (index === 0 || messages[index - 1].sender_id !== message.sender_id);
          
          return (
            <div
              key={message.id}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                {showAvatar && !isOwnMessage && (
                  <img
                    src={message.sender.avatar_url || `https://images.pexels.com/photos/${Math.floor(Math.random() * 1000000)}/pexels-photo-${Math.floor(Math.random() * 1000000)}.jpeg?auto=compress&cs=tinysrgb&w=100`}
                    alt={message.sender.full_name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
                <div
                  className={`rounded-lg px-4 py-2 shadow-sm ${
                    isOwnMessage
                      ? 'bg-[#25D366] text-white rounded-br-none'
                      : 'bg-white text-gray-800 rounded-bl-none'
                  } ${!showAvatar && !isOwnMessage ? 'ml-10' : ''}`}
                >
                  <p className="text-sm">{message.content}</p>
                  <div className={`flex items-center justify-end space-x-1 mt-1 ${
                    isOwnMessage ? 'text-white/70' : 'text-gray-500'
                  }`}>
                    <span className="text-xs">{formatTime(message.created_at)}</span>
                    {getMessageStatus(message)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-end space-x-2 max-w-xs lg:max-w-md">
              <img
                src={otherParticipant.profile.avatar_url || `https://images.pexels.com/photos/${Math.floor(Math.random() * 1000000)}/pexels-photo-${Math.floor(Math.random() * 1000000)}.jpeg?auto=compress&cs=tinysrgb&w=100`}
                alt={otherParticipant.profile.full_name}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="bg-white rounded-lg rounded-bl-none px-4 py-3 shadow-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-[#F0F2F5] px-4 py-3 flex items-center space-x-3">
        <button className="text-gray-600 hover:text-gray-800 transition-colors">
          <Smile size={24} />
        </button>
        <button className="text-gray-600 hover:text-gray-800 transition-colors">
          <Paperclip size={24} />
        </button>
        <div className="flex-1 relative">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message"
            className="w-full px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:border-[#25D366] transition-colors"
          />
        </div>
        {newMessage.trim() ? (
          <button
            onClick={handleSendMessage}
            className="text-[#25D366] hover:text-[#128C7E] transition-colors"
          >
            <Send size={24} />
          </button>
        ) : (
          <button className="text-gray-600 hover:text-gray-800 transition-colors">
            <Mic size={24} />
          </button>
        )}
      </div>
    </div>
  );
};