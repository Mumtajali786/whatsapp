import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type Conversation = Database['public']['Tables']['conversations']['Row'] & {
  participants: (Database['public']['Tables']['conversation_participants']['Row'] & {
    profile: Database['public']['Tables']['profiles']['Row'];
  })[];
  last_message?: Database['public']['Tables']['messages']['Row'] & {
    sender: Database['public']['Tables']['profiles']['Row'];
  };
};

export const useConversations = (userId: string | null) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setConversations([]);
      return;
    }

    const fetchConversations = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participants:conversation_participants(
            *,
            profile:profiles(*)
          )
        `)
        .eq('participants.user_id', userId)
        .eq('participants.left_at', null);

      if (error) {
        console.error('Error fetching conversations:', error);
      } else {
        // Fetch last message for each conversation
        const conversationsWithLastMessage = await Promise.all(
          (data || []).map(async (conversation) => {
            const { data: lastMessage } = await supabase
              .from('messages')
              .select(`
                *,
                sender:profiles(*)
              `)
              .eq('conversation_id', conversation.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            return {
              ...conversation,
              last_message: lastMessage,
            };
          })
        );

        setConversations(conversationsWithLastMessage);
      }
      setLoading(false);
    };

    fetchConversations();

    // Subscribe to conversation changes
    const channel = supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          fetchConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const createConversation = async (participantId: string, currentUserId: string) => {
    // Check if conversation already exists
    const { data: existingConversation } = await supabase
      .from('conversation_participants')
      .select(`
        conversation_id,
        conversations(*)
      `)
      .eq('user_id', currentUserId)
      .eq('left_at', null);

    if (existingConversation) {
      for (const participant of existingConversation) {
        const { data: otherParticipant } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', participant.conversation_id)
          .eq('user_id', participantId)
          .eq('left_at', null)
          .single();

        if (otherParticipant) {
          return { data: participant.conversations, error: null };
        }
      }
    }

    // Create new conversation
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .insert({
        created_by: currentUserId,
        is_group: false,
      })
      .select()
      .single();

    if (conversationError) {
      return { data: null, error: conversationError };
    }

    // Add participants
    const { error: participantsError } = await supabase
      .from('conversation_participants')
      .insert([
        {
          conversation_id: conversation.id,
          user_id: currentUserId,
        },
        {
          conversation_id: conversation.id,
          user_id: participantId,
        },
      ]);

    if (participantsError) {
      return { data: null, error: participantsError };
    }

    return { data: conversation, error: null };
  };

  return {
    conversations,
    loading,
    createConversation,
  };
};