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
          address: string | null
          assigned_to: string | null
          budget: string | null
          company: string | null
          created_at: string
          email: string | null
          id: string
          industry: string | null
          intake: Json | null
          intent: string | null
          kind: string
          lead_number: number
          location: string | null
          name: string
          notes: string | null
          phone: string | null
          score: number | null
          social_url: string | null
          source: Database["public"]["Enums"]["client_source"]
          status: Database["public"]["Enums"]["client_status"]
          stripe_customer_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          assigned_to?: string | null
          budget?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          industry?: string | null
          intake?: Json | null
          intent?: string | null
          kind?: string
          lead_number?: number
          location?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          score?: number | null
          social_url?: string | null
          source?: Database["public"]["Enums"]["client_source"]
          status?: Database["public"]["Enums"]["client_status"]
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          assigned_to?: string | null
          budget?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          industry?: string | null
          intake?: Json | null
          intent?: string | null
          kind?: string
          lead_number?: number
          location?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          score?: number | null
          social_url?: string | null
          source?: Database["public"]["Enums"]["client_source"]
          status?: Database["public"]["Enums"]["client_status"]
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "admin_analytics_team_performance"
            referencedColumns: ["rep_id"]
          },
          {
            foreignKeyName: "clients_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "admin_rep_activity"
            referencedColumns: ["rep_id"]
          },
          {
            foreignKeyName: "clients_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_templates: {
        Row: {
          body: Json
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["document_kind"]
          name: string
          updated_at: string
          variables: Json
          version: number
        }
        Insert: {
          body?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          kind: Database["public"]["Enums"]["document_kind"]
          name: string
          updated_at?: string
          variables?: Json
          version?: number
        }
        Update: {
          body?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["document_kind"]
          name?: string
          updated_at?: string
          variables?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_analytics_team_performance"
            referencedColumns: ["rep_id"]
          },
          {
            foreignKeyName: "document_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_rep_activity"
            referencedColumns: ["rep_id"]
          },
          {
            foreignKeyName: "document_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          data: Json
          id: string
          kind: Database["public"]["Enums"]["document_kind"]
          pdf_path: string | null
          project_id: string | null
          sent_at: string | null
          signed_at: string | null
          status: Database["public"]["Enums"]["document_status"]
          subscription_id: string | null
          template_id: string | null
          template_version: number | null
          title: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          data?: Json
          id?: string
          kind: Database["public"]["Enums"]["document_kind"]
          pdf_path?: string | null
          project_id?: string | null
          sent_at?: string | null
          signed_at?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          subscription_id?: string | null
          template_id?: string | null
          template_version?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          data?: Json
          id?: string
          kind?: Database["public"]["Enums"]["document_kind"]
          pdf_path?: string | null
          project_id?: string | null
          sent_at?: string | null
          signed_at?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          subscription_id?: string | null
          template_id?: string | null
          template_version?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_analytics_team_performance"
            referencedColumns: ["rep_id"]
          },
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_rep_activity"
            referencedColumns: ["rep_id"]
          },
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "document_templates"
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
            foreignKeyName: "interactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_logged_by_fkey"
            columns: ["logged_by"]
            isOneToOne: false
            referencedRelation: "admin_analytics_team_performance"
            referencedColumns: ["rep_id"]
          },
          {
            foreignKeyName: "interactions_logged_by_fkey"
            columns: ["logged_by"]
            isOneToOne: false
            referencedRelation: "admin_rep_activity"
            referencedColumns: ["rep_id"]
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
      outreach_templates: {
        Row: {
          body: string
          business_type: string
          created_at: string
          created_by: string | null
          id: string
          is_archived: boolean
          label: string
          reference_label: string | null
          reference_url: string | null
          sort_order: number
          subject: string
          updated_at: string
        }
        Insert: {
          body: string
          business_type: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_archived?: boolean
          label: string
          reference_label?: string | null
          reference_url?: string | null
          sort_order?: number
          subject: string
          updated_at?: string
        }
        Update: {
          body?: string
          business_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_archived?: boolean
          label?: string
          reference_label?: string | null
          reference_url?: string | null
          sort_order?: number
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "outreach_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_analytics_team_performance"
            referencedColumns: ["rep_id"]
          },
          {
            foreignKeyName: "outreach_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_rep_activity"
            referencedColumns: ["rep_id"]
          },
          {
            foreignKeyName: "outreach_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      processed_stripe_events: {
        Row: {
          event_type: string
          id: string
          processed_at: string
        }
        Insert: {
          event_type: string
          id: string
          processed_at?: string
        }
        Update: {
          event_type?: string
          id?: string
          processed_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          employment_status: Database["public"]["Enums"]["employment_status"]
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          title: Database["public"]["Enums"]["profile_title"] | null
          working_hours: Json
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          employment_status?: Database["public"]["Enums"]["employment_status"]
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          title?: Database["public"]["Enums"]["profile_title"] | null
          working_hours?: Json
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          employment_status?: Database["public"]["Enums"]["employment_status"]
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          title?: Database["public"]["Enums"]["profile_title"] | null
          working_hours?: Json
        }
        Relationships: []
      }
      project_commission_ledger: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          paid_at: string | null
          project_id: string
          rep_id: string
          status: Database["public"]["Enums"]["commission_ledger_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          project_id: string
          rep_id: string
          status?: Database["public"]["Enums"]["commission_ledger_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          project_id?: string
          rep_id?: string
          status?: Database["public"]["Enums"]["commission_ledger_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_commission_ledger_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_commission_ledger_rep_id_fkey"
            columns: ["rep_id"]
            isOneToOne: false
            referencedRelation: "admin_analytics_team_performance"
            referencedColumns: ["rep_id"]
          },
          {
            foreignKeyName: "project_commission_ledger_rep_id_fkey"
            columns: ["rep_id"]
            isOneToOne: false
            referencedRelation: "admin_rep_activity"
            referencedColumns: ["rep_id"]
          },
          {
            foreignKeyName: "project_commission_ledger_rep_id_fkey"
            columns: ["rep_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          project_id: string
          sort_order: number
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          project_id: string
          sort_order?: number
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          project_id?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "admin_analytics_team_performance"
            referencedColumns: ["rep_id"]
          },
          {
            foreignKeyName: "project_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "admin_rep_activity"
            referencedColumns: ["rep_id"]
          },
          {
            foreignKeyName: "project_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_analytics_team_performance"
            referencedColumns: ["rep_id"]
          },
          {
            foreignKeyName: "project_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_rep_activity"
            referencedColumns: ["rep_id"]
          },
          {
            foreignKeyName: "project_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client_id: string
          completed_at: string | null
          created_at: string
          currency: string
          deadline: string | null
          deposit_amount: number | null
          deposit_paid_at: string | null
          deposit_rate: number
          description: string | null
          financing_enabled: boolean
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
          completed_at?: string | null
          created_at?: string
          currency?: string
          deadline?: string | null
          deposit_amount?: number | null
          deposit_paid_at?: string | null
          deposit_rate?: number
          description?: string | null
          financing_enabled?: boolean
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
          completed_at?: string | null
          created_at?: string
          currency?: string
          deadline?: string | null
          deposit_amount?: number | null
          deposit_paid_at?: string | null
          deposit_rate?: number
          description?: string | null
          financing_enabled?: boolean
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
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_sold_by_fkey"
            columns: ["sold_by"]
            isOneToOne: false
            referencedRelation: "admin_analytics_team_performance"
            referencedColumns: ["rep_id"]
          },
          {
            foreignKeyName: "projects_sold_by_fkey"
            columns: ["sold_by"]
            isOneToOne: false
            referencedRelation: "admin_rep_activity"
            referencedColumns: ["rep_id"]
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
      rep_integrations: {
        Row: {
          access_token: string
          connected_at: string
          google_email: string | null
          id: string
          last_sync_error: string | null
          last_synced_at: string | null
          provider: string
          refresh_token: string
          rep_id: string
          scopes: string[]
          sync_state: Json
          token_expires_at: string
          updated_at: string
        }
        Insert: {
          access_token: string
          connected_at?: string
          google_email?: string | null
          id?: string
          last_sync_error?: string | null
          last_synced_at?: string | null
          provider: string
          refresh_token: string
          rep_id: string
          scopes?: string[]
          sync_state?: Json
          token_expires_at: string
          updated_at?: string
        }
        Update: {
          access_token?: string
          connected_at?: string
          google_email?: string | null
          id?: string
          last_sync_error?: string | null
          last_synced_at?: string | null
          provider?: string
          refresh_token?: string
          rep_id?: string
          scopes?: string[]
          sync_state?: Json
          token_expires_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rep_integrations_rep_id_fkey"
            columns: ["rep_id"]
            isOneToOne: false
            referencedRelation: "admin_analytics_team_performance"
            referencedColumns: ["rep_id"]
          },
          {
            foreignKeyName: "rep_integrations_rep_id_fkey"
            columns: ["rep_id"]
            isOneToOne: false
            referencedRelation: "admin_rep_activity"
            referencedColumns: ["rep_id"]
          },
          {
            foreignKeyName: "rep_integrations_rep_id_fkey"
            columns: ["rep_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          body_md_en: string
          body_md_es: string | null
          cover_image_url: string | null
          created_at: string
          excerpt_en: string | null
          excerpt_es: string | null
          id: string
          meta: Json
          published_at: string | null
          slug: string
          status: string
          tags: string[]
          title_en: string
          title_es: string | null
          updated_at: string
        }
        Insert: {
          body_md_en?: string
          body_md_es?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt_en?: string | null
          excerpt_es?: string | null
          id?: string
          meta?: Json
          published_at?: string | null
          slug: string
          status?: string
          tags?: string[]
          title_en: string
          title_es?: string | null
          updated_at?: string
        }
        Update: {
          body_md_en?: string
          body_md_es?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt_en?: string | null
          excerpt_es?: string | null
          id?: string
          meta?: Json
          published_at?: string | null
          slug?: string
          status?: string
          tags?: string[]
          title_en?: string
          title_es?: string | null
          updated_at?: string
        }
        Relationships: []
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
      subscription_commission_ledger: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          paid_at: string | null
          period_month: string | null
          rep_id: string
          status: Database["public"]["Enums"]["commission_ledger_status"]
          subscription_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          period_month?: string | null
          rep_id: string
          status?: Database["public"]["Enums"]["commission_ledger_status"]
          subscription_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          period_month?: string | null
          rep_id?: string
          status?: Database["public"]["Enums"]["commission_ledger_status"]
          subscription_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_commission_ledger_rep_id_fkey"
            columns: ["rep_id"]
            isOneToOne: false
            referencedRelation: "admin_analytics_team_performance"
            referencedColumns: ["rep_id"]
          },
          {
            foreignKeyName: "subscription_commission_ledger_rep_id_fkey"
            columns: ["rep_id"]
            isOneToOne: false
            referencedRelation: "admin_rep_activity"
            referencedColumns: ["rep_id"]
          },
          {
            foreignKeyName: "subscription_commission_ledger_rep_id_fkey"
            columns: ["rep_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_commission_ledger_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_invoices: {
        Row: {
          amount_paid: number
          billing_reason: string | null
          created_at: string
          currency: string
          id: string
          paid_at: string | null
          period_end: string | null
          period_start: string | null
          raw: Json | null
          status: string
          stripe_invoice_id: string
          stripe_payment_intent_id: string | null
          subscription_id: string
        }
        Insert: {
          amount_paid: number
          billing_reason?: string | null
          created_at?: string
          currency?: string
          id?: string
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          raw?: Json | null
          status: string
          stripe_invoice_id: string
          stripe_payment_intent_id?: string | null
          subscription_id: string
        }
        Update: {
          amount_paid?: number
          billing_reason?: string | null
          created_at?: string
          currency?: string
          id?: string
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          raw?: Json | null
          status?: string
          stripe_invoice_id?: string
          stripe_payment_intent_id?: string | null
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          canceled_at: string | null
          client_id: string
          created_at: string
          currency: string
          first_payment_at: string | null
          id: string
          monthly_rate: number
          monthly_residual_amount: number | null
          notes: string | null
          plan: string
          product: string
          project_id: string | null
          sold_by: string | null
          started_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_status: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          canceled_at?: string | null
          client_id: string
          created_at?: string
          currency?: string
          first_payment_at?: string | null
          id?: string
          monthly_rate: number
          monthly_residual_amount?: number | null
          notes?: string | null
          plan: string
          product: string
          project_id?: string | null
          sold_by?: string | null
          started_at: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_status?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          canceled_at?: string | null
          client_id?: string
          created_at?: string
          currency?: string
          first_payment_at?: string | null
          id?: string
          monthly_rate?: number
          monthly_residual_amount?: number | null
          notes?: string | null
          plan?: string
          product?: string
          project_id?: string | null
          sold_by?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_status?: string | null
          stripe_subscription_id?: string | null
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
            foreignKeyName: "subscriptions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_sold_by_fkey"
            columns: ["sold_by"]
            isOneToOne: false
            referencedRelation: "admin_analytics_team_performance"
            referencedColumns: ["rep_id"]
          },
          {
            foreignKeyName: "subscriptions_sold_by_fkey"
            columns: ["sold_by"]
            isOneToOne: false
            referencedRelation: "admin_rep_activity"
            referencedColumns: ["rep_id"]
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
      admin_analytics_kpis: {
        Row: {
          active_mrr: number | null
          active_plan_count: number | null
          deals_won_count: number | null
          open_deal_count: number | null
          open_deal_value: number | null
          paid_count_30d: number | null
          revenue_30d: number | null
        }
        Relationships: []
      }
      admin_analytics_pipeline_stats: {
        Row: {
          project_count: number | null
          stage: string | null
          value_total: number | null
        }
        Relationships: []
      }
      admin_analytics_team_performance: {
        Row: {
          active_mrr: number | null
          commission_earned: number | null
          full_name: string | null
          open_count: number | null
          open_value: number | null
          rep_id: string | null
          role: string | null
          won_count: number | null
        }
        Relationships: []
      }
      admin_rep_activity: {
        Row: {
          active_mrr: number | null
          active_subs_count: number | null
          employment_status: string | null
          full_name: string | null
          interactions_30d: number | null
          interactions_60d: number | null
          joined_at: string | null
          last_interaction_at: string | null
          new_leads_30d: number | null
          new_leads_60d: number | null
          new_mrr_90d: number | null
          new_subs_90d: number | null
          rep_id: string | null
          role: string | null
        }
        Relationships: []
      }
      clients_enriched: {
        Row: {
          address: string | null
          assigned_to: string | null
          budget: string | null
          company: string | null
          created_at: string | null
          email: string | null
          has_at_risk_subscription: boolean | null
          has_interactions: boolean | null
          id: string | null
          industry: string | null
          intake: Json | null
          intent: string | null
          kind: string | null
          lead_number: number | null
          lifetime: number | null
          location: string | null
          mrr: number | null
          name: string | null
          notes: string | null
          phone: string | null
          score: number | null
          social_url: string | null
          source: Database["public"]["Enums"]["client_source"] | null
          status: Database["public"]["Enums"]["client_status"] | null
          stripe_customer_id: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "admin_analytics_team_performance"
            referencedColumns: ["rep_id"]
          },
          {
            foreignKeyName: "clients_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "admin_rep_activity"
            referencedColumns: ["rep_id"]
          },
          {
            foreignKeyName: "clients_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      auth_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      calculate_lead_score: { Args: { p_client_id: string }; Returns: number }
      new_leads_count: { Args: never; Returns: number }
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
      commission_ledger_status: "pending" | "paid" | "voided"
      document_kind: "proposal" | "contract" | "sow" | "nda" | "invoice_terms"
      document_status: "draft" | "sent" | "viewed" | "signed" | "void"
      employment_status: "active" | "terminated"
      interaction_type:
        | "call"
        | "email"
        | "meeting"
        | "note"
        | "follow_up"
        | "visit"
      payment_status: "unpaid" | "link_sent" | "paid" | "refunded" | "failed"
      profile_title:
        | "Founder"
        | "Co-Founder"
        | "CEO"
        | "President"
        | "Partner"
        | "Sales Lead"
        | "Account Executive"
        | "Business Development"
        | "Marketing Lead"
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
      subscription_status: "pending" | "active" | "at_risk" | "canceled"
      task_status: "todo" | "doing" | "review" | "done"
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
      commission_ledger_status: ["pending", "paid", "voided"],
      document_kind: ["proposal", "contract", "sow", "nda", "invoice_terms"],
      document_status: ["draft", "sent", "viewed", "signed", "void"],
      employment_status: ["active", "terminated"],
      interaction_type: [
        "call",
        "email",
        "meeting",
        "note",
        "follow_up",
        "visit",
      ],
      payment_status: ["unpaid", "link_sent", "paid", "refunded", "failed"],
      profile_title: [
        "Founder",
        "Co-Founder",
        "CEO",
        "President",
        "Partner",
        "Sales Lead",
        "Account Executive",
        "Business Development",
        "Marketing Lead",
      ],
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
      subscription_status: ["pending", "active", "at_risk", "canceled"],
      task_status: ["todo", "doing", "review", "done"],
      user_role: ["admin", "editor", "sales_rep", "viewer"],
    },
  },
} as const
