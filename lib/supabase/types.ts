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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          assigned_to: string | null
          budget: string | null
          company: string | null
          created_at: string
          email: string | null
          id: string
          industry: string | null
          intake: Json | null
          intent: string | null
          lead_number: number
          location: string | null
          name: string
          notes: string | null
          phone: string | null
          score: number | null
          source: Database["public"]["Enums"]["client_source"]
          status: Database["public"]["Enums"]["client_status"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          budget?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          industry?: string | null
          intake?: Json | null
          intent?: string | null
          lead_number?: number
          location?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          score?: number | null
          source?: Database["public"]["Enums"]["client_source"]
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          budget?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          industry?: string | null
          intake?: Json | null
          intent?: string | null
          lead_number?: number
          location?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          score?: number | null
          source?: Database["public"]["Enums"]["client_source"]
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      interactions: {
        Row: {
          client_id: string
          content: string | null
          created_at: string
          id: string
          logged_by: string | null
          occurred_at: string
          project_id: string | null
          source: string | null
          source_payload: Json | null
          source_ref: string | null
          title: string
          type: Database["public"]["Enums"]["interaction_type"]
        }
        Insert: {
          client_id: string
          content?: string | null
          created_at?: string
          id?: string
          logged_by?: string | null
          occurred_at?: string
          project_id?: string | null
          source?: string | null
          source_payload?: Json | null
          source_ref?: string | null
          title: string
          type: Database["public"]["Enums"]["interaction_type"]
        }
        Update: {
          client_id?: string
          content?: string | null
          created_at?: string
          id?: string
          logged_by?: string | null
          occurred_at?: string
          project_id?: string | null
          source?: string | null
          source_payload?: Json | null
          source_ref?: string | null
          title?: string
          type?: Database["public"]["Enums"]["interaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "interactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_logged_by_fkey"
            columns: ["logged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          project_id: string
          raw: Json | null
          status: string
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          project_id: string
          raw?: Json | null
          status: string
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          project_id?: string
          raw?: Json | null
          status?: string
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      pitch_slides: {
        Row: {
          body: string | null
          created_at: string
          id: string
          image_url: string | null
          published: boolean
          sort_order: number
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          published?: boolean
          sort_order?: number
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          published?: boolean
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          default_commission_rate: number | null
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          default_commission_rate?: number | null
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          default_commission_rate?: number | null
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      projects: {
        Row: {
          client_id: string
          commission_amount: number | null
          commission_rate: number | null
          completed_at: string | null
          created_at: string
          currency: string
          deadline: string | null
          deposit_amount: number | null
          deposit_paid_at: string | null
          deposit_rate: number
          description: string | null
          id: string
          paid_at: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          product_type:
            | Database["public"]["Enums"]["project_product_type"]
            | null
          sold_by: string | null
          stage: Database["public"]["Enums"]["project_stage"]
          start_date: string | null
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          title: string
          updated_at: string
          value: number | null
        }
        Insert: {
          client_id: string
          commission_amount?: number | null
          commission_rate?: number | null
          completed_at?: string | null
          created_at?: string
          currency?: string
          deadline?: string | null
          deposit_amount?: number | null
          deposit_paid_at?: string | null
          deposit_rate?: number
          description?: string | null
          id?: string
          paid_at?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          product_type?:
            | Database["public"]["Enums"]["project_product_type"]
            | null
          sold_by?: string | null
          stage?: Database["public"]["Enums"]["project_stage"]
          start_date?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          title: string
          updated_at?: string
          value?: number | null
        }
        Update: {
          client_id?: string
          commission_amount?: number | null
          commission_rate?: number | null
          completed_at?: string | null
          created_at?: string
          currency?: string
          deadline?: string | null
          deposit_amount?: number | null
          deposit_paid_at?: string | null
          deposit_rate?: number
          description?: string | null
          id?: string
          paid_at?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          product_type?:
            | Database["public"]["Enums"]["project_product_type"]
            | null
          sold_by?: string | null
          stage?: Database["public"]["Enums"]["project_stage"]
          start_date?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          title?: string
          updated_at?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_sold_by_fkey"
            columns: ["sold_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      showcase_projects: {
        Row: {
          category: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          gallery: string[]
          id: string
          meta: Json | null
          published: boolean
          slug: string
          sort_order: number
          tagline: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          gallery?: string[]
          id?: string
          meta?: Json | null
          published?: boolean
          slug: string
          sort_order?: number
          tagline?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          gallery?: string[]
          id?: string
          meta?: Json | null
          published?: boolean
          slug?: string
          sort_order?: number
          tagline?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          canceled_at: string | null
          client_id: string
          created_at: string
          currency: string
          id: string
          monthly_rate: number
          notes: string | null
          plan: string
          product: string
          sold_by: string | null
          started_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
        }
        Insert: {
          canceled_at?: string | null
          client_id: string
          created_at?: string
          currency?: string
          id?: string
          monthly_rate: number
          notes?: string | null
          plan: string
          product: string
          sold_by?: string | null
          started_at: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Update: {
          canceled_at?: string | null
          client_id?: string
          created_at?: string
          currency?: string
          id?: string
          monthly_rate?: number
          notes?: string | null
          plan?: string
          product?: string
          sold_by?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_sold_by_fkey"
            columns: ["sold_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auth_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      calculate_lead_score: { Args: { p_client_id: string }; Returns: number }
    }
    Enums: {
      client_source:
        | "contact_form"
        | "referral"
        | "cold_outreach"
        | "social"
        | "event"
        | "rep_field"
        | "other"
      client_status:
        | "lead"
        | "qualified"
        | "active_client"
        | "archived"
        | "lost"
      interaction_type:
        | "call"
        | "email"
        | "meeting"
        | "note"
        | "follow_up"
        | "visit"
      payment_status: "unpaid" | "link_sent" | "paid" | "refunded" | "failed"
      project_product_type:
        | "business_website"
        | "mobile_app"
        | "web_app"
        | "ai_integration"
      project_stage:
        | "proposal"
        | "negotiation"
        | "active"
        | "completed"
        | "cancelled"
      subscription_status: "active" | "at_risk" | "canceled"
      user_role: "admin" | "editor" | "sales_rep" | "viewer"
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
      client_source: [
        "contact_form",
        "referral",
        "cold_outreach",
        "social",
        "event",
        "rep_field",
        "other",
      ],
      client_status: ["lead", "qualified", "active_client", "archived", "lost"],
      interaction_type: [
        "call",
        "email",
        "meeting",
        "note",
        "follow_up",
        "visit",
      ],
      payment_status: ["unpaid", "link_sent", "paid", "refunded", "failed"],
      project_product_type: [
        "business_website",
        "mobile_app",
        "web_app",
        "ai_integration",
      ],
      project_stage: [
        "proposal",
        "negotiation",
        "active",
        "completed",
        "cancelled",
      ],
      subscription_status: ["active", "at_risk", "canceled"],
      user_role: ["admin", "editor", "sales_rep", "viewer"],
    },
  },
} as const
