export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      media_gallery: {
        Row: {
          created_at: string
          id: string
          media_type: string
          media_url: string
          metadata: Json | null
          model_id: string | null
          prompt: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          media_type: string
          media_url: string
          metadata?: Json | null
          model_id?: string | null
          prompt: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          media_type?: string
          media_url?: string
          metadata?: Json | null
          model_id?: string | null
          prompt?: string
          user_id?: string
        }
        Relationships: []
      }
      media_ready_events: {
        Row: {
          created_at: string | null
          id: string
          media_type: string
          media_url: string
          model: string | null
          prompt: string | null
          task_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          media_type: string
          media_url: string
          model?: string | null
          prompt?: string | null
          task_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          media_type?: string
          media_url?: string
          model?: string | null
          prompt?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_ready_events_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "piapi_tasks"
            referencedColumns: ["task_id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          files: string[] | null
          id: string
          media_url: string | null
          mode: string
          model: string | null
          sender: string
          timestamp: string
        }
        Insert: {
          content: string
          conversation_id: string
          files?: string[] | null
          id?: string
          media_url?: string | null
          mode: string
          model?: string | null
          sender: string
          timestamp?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          files?: string[] | null
          id?: string
          media_url?: string | null
          mode?: string
          model?: string | null
          sender?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      piapi_tasks: {
        Row: {
          created_at: string | null
          id: string
          media_type: string
          media_url: string | null
          model: string
          params: Json | null
          prompt: string | null
          result: Json | null
          status: string
          task_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          media_type: string
          media_url?: string | null
          model: string
          params?: Json | null
          prompt?: string | null
          result?: Json | null
          status?: string
          task_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          media_type?: string
          media_url?: string | null
          model?: string
          params?: Json | null
          prompt?: string | null
          result?: Json | null
          status?: string
          task_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      token_consumption_rates: {
        Row: {
          created_at: string
          id: string
          mode: string
          model_id: string
          tokens_per_request: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          mode: string
          model_id: string
          tokens_per_request: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          mode?: string
          model_id?: string
          tokens_per_request?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_google_tokens: {
        Row: {
          access_token: string
          created_at: string
          expires_at: number
          id: string
          refresh_token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: number
          id?: string
          refresh_token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: number
          id?: string
          refresh_token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_memory: {
        Row: {
          created_at: string
          id: string
          key_name: string
          source: string | null
          title: string | null
          updated_at: string
          user_id: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          key_name: string
          source?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          key_name?: string
          source?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
          value?: string
        }
        Relationships: []
      }
      user_tokens: {
        Row: {
          created_at: string
          id: string
          last_reset_date: string
          next_reset_date: string
          tokens_remaining: number
          tokens_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_reset_date?: string
          next_reset_date?: string
          tokens_remaining?: number
          tokens_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_reset_date?: string
          next_reset_date?: string
          tokens_remaining?: number
          tokens_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_and_update_token_balance: {
        Args: { p_user_id: string; p_model_id: string; p_mode: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
