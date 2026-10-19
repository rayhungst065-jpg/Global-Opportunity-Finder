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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      assistant_access_state: {
        Row: {
          blocked_message: string
          created_at: string
          status: number
          user_id: string
        }
        Insert: {
          blocked_message: string
          created_at?: string
          status: number
          user_id: string
        }
        Update: {
          blocked_message?: string
          created_at?: string
          status?: number
          user_id?: string
        }
        Relationships: []
      }
      assistant_conversations: {
        Row: {
          archived: boolean
          created_at: string
          id: string
          summary: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          id?: string
          summary?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          id?: string
          summary?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      assistant_messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          message_id: string
          parts: Json
          role: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          message_id: string
          parts?: Json
          role: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          message_id?: string
          parts?: Json
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistant_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "assistant_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      collab_group_members: {
        Row: {
          created_at: string
          group_id: string
          role: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collab_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "collab_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collab_group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      collab_groups: {
        Row: {
          created_at: string
          created_by: string
          description: string
          goal: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string
          goal?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          goal?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "collab_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      college_preferences: {
        Row: {
          budget_range: string | null
          campus_size: string | null
          financial_aid_interest: boolean
          institution_types: string[]
          intended_major: string | null
          preferred_regions: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_range?: string | null
          campus_size?: string | null
          financial_aid_interest?: boolean
          institution_types?: string[]
          intended_major?: string | null
          preferred_regions?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_range?: string | null
          campus_size?: string | null
          financial_aid_interest?: boolean
          institution_types?: string[]
          intended_major?: string | null
          preferred_regions?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "college_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      college_research: {
        Row: {
          completed_at: string | null
          created_at: string
          criteria: Json
          criteria_key: string
          error_message: string | null
          id: string
          results: Json
          sources: Json
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          criteria?: Json
          criteria_key: string
          error_message?: string | null
          id?: string
          results?: Json
          sources?: Json
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          criteria?: Json
          criteria_key?: string
          error_message?: string | null
          id?: string
          results?: Json
          sources?: Json
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "college_research_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      college_source_notes: {
        Row: {
          id: string
          original_values: Json
          source_file: string
          source_row: number
          source_sheet: string
        }
        Insert: {
          id?: string
          original_values: Json
          source_file: string
          source_row: number
          source_sheet: string
        }
        Update: {
          id?: string
          original_values?: Json
          source_file?: string
          source_row?: number
          source_sheet?: string
        }
        Relationships: []
      }
      colleges: {
        Row: {
          acceptance_rate: string | null
          campus_size: string | null
          country: string | null
          enrollment: string | null
          gpa_requirement: string | null
          id: string
          institution_type: string | null
          official_website: string | null
          original_values: Json
          qs_rank: string | null
          region: string | null
          source_file: string
          source_row: number
          tuition: string | null
          university: string
        }
        Insert: {
          acceptance_rate?: string | null
          campus_size?: string | null
          country?: string | null
          enrollment?: string | null
          gpa_requirement?: string | null
          id?: string
          institution_type?: string | null
          official_website?: string | null
          original_values?: Json
          qs_rank?: string | null
          region?: string | null
          source_file: string
          source_row: number
          tuition?: string | null
          university: string
        }
        Update: {
          acceptance_rate?: string | null
          campus_size?: string | null
          country?: string | null
          enrollment?: string | null
          gpa_requirement?: string | null
          id?: string
          institution_type?: string | null
          official_website?: string | null
          original_values?: Json
          qs_rank?: string | null
          region?: string | null
          source_file?: string
          source_row?: number
          tuition?: string | null
          university?: string
        }
        Relationships: []
      }
      communities: {
        Row: {
          activities: string | null
          category: string
          created_at: string
          created_by: string
          description: string
          format: string
          goals: string | null
          id: string
          meeting_frequency: string | null
          name: string
          purpose: string | null
          rules: string | null
        }
        Insert: {
          activities?: string | null
          category: string
          created_at?: string
          created_by: string
          description: string
          format?: string
          goals?: string | null
          id?: string
          meeting_frequency?: string | null
          name: string
          purpose?: string | null
          rules?: string | null
        }
        Update: {
          activities?: string | null
          category?: string
          created_at?: string
          created_by?: string
          description?: string
          format?: string
          goals?: string | null
          id?: string
          meeting_frequency?: string | null
          name?: string
          purpose?: string | null
          rules?: string | null
        }
        Relationships: []
      }
      community_memberships: {
        Row: {
          community_id: string
          created_at: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          community_id: string
          created_at?: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          community_id?: string
          created_at?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_memberships_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          author_id: string
          body: string
          collaboration_goal: string | null
          created_at: string
          desired_skills: string[]
          id: string
          status: string
          title: string
          topics: string[]
        }
        Insert: {
          author_id: string
          body: string
          collaboration_goal?: string | null
          created_at?: string
          desired_skills?: string[]
          id?: string
          status?: string
          title: string
          topics?: string[]
        }
        Update: {
          author_id?: string
          body?: string
          collaboration_goal?: string | null
          created_at?: string
          desired_skills?: string[]
          id?: string
          status?: string
          title?: string
          topics?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_proposals: {
        Row: {
          activities: string | null
          category: string
          created_at: string
          creator_id: string
          description: string
          format: string
          id: string
          long_term_goals: string | null
          meeting_frequency: string | null
          name: string
          participants: string | null
          problem: string | null
          purpose: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          rules: string | null
          short_term_goals: string | null
          status: string
          topic: string
          updated_at: string
        }
        Insert: {
          activities?: string | null
          category: string
          created_at?: string
          creator_id: string
          description: string
          format?: string
          id?: string
          long_term_goals?: string | null
          meeting_frequency?: string | null
          name: string
          participants?: string | null
          problem?: string | null
          purpose: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rules?: string | null
          short_term_goals?: string | null
          status?: string
          topic: string
          updated_at?: string
        }
        Update: {
          activities?: string | null
          category?: string
          created_at?: string
          creator_id?: string
          description?: string
          format?: string
          id?: string
          long_term_goals?: string | null
          meeting_frequency?: string | null
          name?: string
          participants?: string | null
          problem?: string | null
          purpose?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rules?: string | null
          short_term_goals?: string | null
          status?: string
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      connections: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          responded_at: string | null
          status: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          responded_at?: string | null
          status?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          responded_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "connections_addressee_id_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          application_status: Database["public"]["Enums"]["application_status"]
          category: Database["public"]["Enums"]["opportunity_category"]
          created_at: string
          deadline: string | null
          deadline_estimate: string | null
          description: string
          eligibility: string
          id: string
          is_demo: boolean
          last_verified_at: string | null
          location: string
          official_url: string | null
          organizer: string
          title: string
          updated_at: string
        }
        Insert: {
          application_status?: Database["public"]["Enums"]["application_status"]
          category: Database["public"]["Enums"]["opportunity_category"]
          created_at?: string
          deadline?: string | null
          deadline_estimate?: string | null
          description?: string
          eligibility?: string
          id?: string
          is_demo?: boolean
          last_verified_at?: string | null
          location?: string
          official_url?: string | null
          organizer: string
          title: string
          updated_at?: string
        }
        Update: {
          application_status?: Database["public"]["Enums"]["application_status"]
          category?: Database["public"]["Enums"]["opportunity_category"]
          created_at?: string
          deadline?: string | null
          deadline_estimate?: string | null
          description?: string
          eligibility?: string
          id?: string
          is_demo?: boolean
          last_verified_at?: string | null
          location?: string
          official_url?: string | null
          organizer?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_path: string | null
          bio: string | null
          country_region: string | null
          created_at: string
          discoverable: boolean
          display_name: string | null
          education_level: string | null
          first_name: string | null
          format_preference: string
          goals: string[]
          grade: string | null
          id: string
          intended_major: string | null
          interests: string[]
          languages: string[]
          onboarded: boolean
          preferences: Json
          preferred_categories: Database["public"]["Enums"]["opportunity_category"][]
          preferred_regions: string[]
          skills: string[]
          updated_at: string
          visibility: Json
        }
        Insert: {
          avatar_path?: string | null
          bio?: string | null
          country_region?: string | null
          created_at?: string
          discoverable?: boolean
          display_name?: string | null
          education_level?: string | null
          first_name?: string | null
          format_preference?: string
          goals?: string[]
          grade?: string | null
          id: string
          intended_major?: string | null
          interests?: string[]
          languages?: string[]
          onboarded?: boolean
          preferences?: Json
          preferred_categories?: Database["public"]["Enums"]["opportunity_category"][]
          preferred_regions?: string[]
          skills?: string[]
          updated_at?: string
          visibility?: Json
        }
        Update: {
          avatar_path?: string | null
          bio?: string | null
          country_region?: string | null
          created_at?: string
          discoverable?: boolean
          display_name?: string | null
          education_level?: string | null
          first_name?: string | null
          format_preference?: string
          goals?: string[]
          grade?: string | null
          id?: string
          intended_major?: string | null
          interests?: string[]
          languages?: string[]
          onboarded?: boolean
          preferences?: Json
          preferred_categories?: Database["public"]["Enums"]["opportunity_category"][]
          preferred_regions?: string[]
          skills?: string[]
          updated_at?: string
          visibility?: Json
        }
        Relationships: []
      }
      saved_chat_recommendations: {
        Row: {
          assistant_message_id: string
          created_at: string
          id: string
          recommendation: Json
          tool_call_id: string
          user_id: string
        }
        Insert: {
          assistant_message_id: string
          created_at?: string
          id?: string
          recommendation: Json
          tool_call_id: string
          user_id: string
        }
        Update: {
          assistant_message_id?: string
          created_at?: string
          id?: string
          recommendation?: Json
          tool_call_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_chat_recommendations_assistant_message_id_fkey"
            columns: ["assistant_message_id"]
            isOneToOne: false
            referencedRelation: "assistant_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_opportunities: {
        Row: {
          created_at: string
          id: string
          opportunity_id: string
          status: Database["public"]["Enums"]["saved_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          opportunity_id: string
          status?: Database["public"]["Enums"]["saved_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          opportunity_id?: string
          status?: Database["public"]["Enums"]["saved_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_opportunities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
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
      is_group_creator: { Args: { _group_id: string }; Returns: boolean }
      is_group_member: { Args: { _group_id: string }; Returns: boolean }
      reserve_college_research: {
        Args: { p_criteria: Json; p_key: string }
        Returns: Json
      }
      search_colleges: {
        Args: {
          p_country?: string
          p_page?: number
          p_query?: string
          p_region?: string
          p_sort?: string
          p_type?: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user"
      application_status: "open" | "rolling" | "upcoming" | "closed"
      opportunity_category: "volunteer" | "competitions" | "research" | "awards"
      saved_status: "interested" | "applying" | "submitted"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
      application_status: ["open", "rolling", "upcoming", "closed"],
      opportunity_category: ["volunteer", "competitions", "research", "awards"],
      saved_status: ["interested", "applying", "submitted"],
    },
  },
} as const
