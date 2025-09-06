import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type Message = Database['public']['Tables']['messages']['Row'] & {
  sender: Database['public']['Tables']['profiles']['Row'];
  message_status: Database['public']['Tables']['message_status']['Row'][];
};

export const useMessages = (conversationId: string | null, userId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!conversationId || !userId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(*),
          message_status(*)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
      } else {
        setMessages(data || []);
      }
      setLoading(false);
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Fetch the complete message with sender info
          const { data } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles(*),
              message_status(*)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setMessages((prev) => [...prev, data]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'message_status',
        },
        () => {
          // Refetch messages when status updates
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, userId]);

  const sendMessage = async (content: string, conversationId: string, senderId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        message_type: 'text',
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return { error };
    }

    // Create message status for all participants
    const { data: participants } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .neq('user_id', senderId);

    if (participants) {
      const statusInserts = participants.map((participant) => ({
        message_id: data.id,
        user_id: participant.user_id,
        status: 'delivered',
      }));

      await supabase.from('message_status').insert(statusInserts);
    }

    return { data, error: null };
  };

  const markAsRead = async (messageId: string, userId: string) => {
    const { error } = await supabase
      .from('message_status')
      .upsert({
        message_id: messageId,
        user_id: userId,
        status: 'read',
      });

    if (error) {
      console.error('Error marking message as read:', error);
    }
  };

  return {
    messages,
    loading,
    sendMessage,
    markAsRead,
  };
};