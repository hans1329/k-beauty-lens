export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      brand_mentions: {
        Row: {
          brand_name: string
          context: string | null
          created_at: string
          id: string
          mention_count: number | null
          product_name: string | null
          sentiment: string | null
          video_id: string
        }
        Insert: {
          brand_name: string
          context?: string | null
          created_at?: string
          id?: string
          mention_count?: number | null
          product_name?: string | null
          sentiment?: string | null
          video_id: string
        }
        Update: {
          brand_name?: string
          context?: string | null
          created_at?: string
          id?: string
          mention_count?: number | null
          product_name?: string | null
          sentiment?: string | null
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_mentions_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_name: string | null
          comment_id: string
          created_at: string
          id: string
          like_count: number | null
          published_at: string
          reply_count: number | null
          text_content: string
          updated_at: string
          video_id: string
        }
        Insert: {
          author_name?: string | null
          comment_id: string
          created_at?: string
          id?: string
          like_count?: number | null
          published_at: string
          reply_count?: number | null
          text_content: string
          updated_at?: string
          video_id: string
        }
        Update: {
          author_name?: string | null
          comment_id?: string
          created_at?: string
          id?: string
          like_count?: number | null
          published_at?: string
          reply_count?: number | null
          text_content?: string
          updated_at?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      creators: {
        Row: {
          channel_id: string
          channel_name: string
          country: string | null
          created_at: string
          custom_url: string | null
          description: string | null
          id: string
          last_synced_at: string | null
          published_at: string | null
          subscriber_count: number | null
          thumbnail_url: string | null
          total_views: number | null
          updated_at: string
          video_count: number | null
        }
        Insert: {
          channel_id: string
          channel_name: string
          country?: string | null
          created_at?: string
          custom_url?: string | null
          description?: string | null
          id?: string
          last_synced_at?: string | null
          published_at?: string | null
          subscriber_count?: number | null
          thumbnail_url?: string | null
          total_views?: number | null
          updated_at?: string
          video_count?: number | null
        }
        Update: {
          channel_id?: string
          channel_name?: string
          country?: string | null
          created_at?: string
          custom_url?: string | null
          description?: string | null
          id?: string
          last_synced_at?: string | null
          published_at?: string | null
          subscriber_count?: number | null
          thumbnail_url?: string | null
          total_views?: number | null
          updated_at?: string
          video_count?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
      thumbnail_analysis: {
        Row: {
          analyzed_at: string | null
          brightness: number | null
          color_temp: number | null
          contrast: number | null
          created_at: string
          dominant_colors: Json | null
          id: string
          style_tags: Json | null
          thumbnail_url: string
          video_id: string
        }
        Insert: {
          analyzed_at?: string | null
          brightness?: number | null
          color_temp?: number | null
          contrast?: number | null
          created_at?: string
          dominant_colors?: Json | null
          id?: string
          style_tags?: Json | null
          thumbnail_url: string
          video_id: string
        }
        Update: {
          analyzed_at?: string | null
          brightness?: number | null
          color_temp?: number | null
          contrast?: number | null
          created_at?: string
          dominant_colors?: Json | null
          id?: string
          style_tags?: Json | null
          thumbnail_url?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "thumbnail_analysis_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: true
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_searches: {
        Row: {
          channel_id: string
          channel_name: string
          channel_thumbnail: string | null
          created_at: string
          id: string
          searched_at: string
          user_id: string
        }
        Insert: {
          channel_id: string
          channel_name: string
          channel_thumbnail?: string | null
          created_at?: string
          id?: string
          searched_at?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          channel_name?: string
          channel_thumbnail?: string | null
          created_at?: string
          id?: string
          searched_at?: string
          user_id?: string
        }
        Relationships: []
      }
      video_keywords: {
        Row: {
          confidence: number | null
          created_at: string
          id: string
          keyword: string
          keyword_type: string
          video_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          id?: string
          keyword: string
          keyword_type: string
          video_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          id?: string
          keyword?: string
          keyword_type?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_keywords_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          caption_available: boolean | null
          category_id: string | null
          comment_count: number | null
          created_at: string
          creator_id: string
          description: string | null
          duration: string | null
          id: string
          last_synced_at: string | null
          like_count: number | null
          published_at: string
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_id: string
          view_count: number | null
        }
        Insert: {
          caption_available?: boolean | null
          category_id?: string | null
          comment_count?: number | null
          created_at?: string
          creator_id: string
          description?: string | null
          duration?: string | null
          id?: string
          last_synced_at?: string | null
          like_count?: number | null
          published_at: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_id: string
          view_count?: number | null
        }
        Update: {
          caption_available?: boolean | null
          category_id?: string | null
          comment_count?: number | null
          created_at?: string
          creator_id?: string
          description?: string | null
          duration?: string | null
          id?: string
          last_synced_at?: string | null
          like_count?: number | null
          published_at?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "videos_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      user_type: "general_user" | "creator" | "brand"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      user_type: ["general_user", "creator", "brand"],
    },
  },
} as const
