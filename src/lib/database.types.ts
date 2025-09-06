export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          full_name: string;
          avatar_url: string;
          status: string;
          is_online: boolean;
          last_seen: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          full_name: string;
          avatar_url?: string;
          status?: string;
          is_online?: boolean;
          last_seen?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          full_name?: string;
          avatar_url?: string;
          status?: string;
          is_online?: boolean;
          last_seen?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          name: string | null;
          is_group: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name?: string | null;
          is_group?: boolean;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          is_group?: boolean;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      conversation_participants: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          joined_at: string;
          left_at: string | null;
          role: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          joined_at?: string;
          left_at?: string | null;
          role?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          user_id?: string;
          joined_at?: string;
          left_at?: string | null;
          role?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          message_type: string;
          reply_to: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          message_type?: string;
          reply_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          content?: string;
          message_type?: string;
          reply_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      message_status: {
        Row: {
          id: string;
          message_id: string;
          user_id: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          user_id: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          message_id?: string;
          user_id?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}