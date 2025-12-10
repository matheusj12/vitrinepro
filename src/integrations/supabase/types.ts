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
      admin_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          meta: Json | null
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          meta?: Json | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          meta?: Json | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          ip_address: string | null
          meta: Json | null
          product_id: string | null
          tenant_id: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          meta?: Json | null
          product_id?: string | null
          tenant_id: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          meta?: Json | null
          product_id?: string | null
          tenant_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      banners: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          image_url: string | null
          link: string | null
          order_position: number | null
          subtitle: string | null
          tenant_id: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          link?: string | null
          order_position?: number | null
          subtitle?: string | null
          tenant_id: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          link?: string | null
          order_position?: number | null
          subtitle?: string | null
          tenant_id?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "banners_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          slug: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      email_notifications_sent: {
        Row: {
          days_before_expiry: number
          expiry_date: string
          id: string
          notification_type: string
          sent_at: string
          tenant_id: string
          user_email: string
        }
        Insert: {
          days_before_expiry: number
          expiry_date: string
          id?: string
          notification_type: string
          sent_at?: string
          tenant_id: string
          user_email: string
        }
        Update: {
          days_before_expiry?: number
          expiry_date?: string
          id?: string
          notification_type?: string
          sent_at?: string
          tenant_id?: string
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_notifications_sent_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          tenant_id: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          tenant_id: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          tenant_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          active: boolean
          created_at: string | null
          description: string | null
          features: Json
          id: string
          max_products: number
          name: string
          price_cents: number
          slug: string
          trial_days: number
          updated_at: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string | null
          description?: string | null
          features?: Json
          id?: string
          max_products?: number
          name: string
          price_cents?: number
          slug: string
          trial_days?: number
          updated_at?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string | null
          description?: string | null
          features?: Json
          id?: string
          max_products?: number
          name?: string
          price_cents?: number
          slug?: string
          trial_days?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      product_images: {
        Row: {
          created_at: string | null
          id: string
          position: number | null
          product_id: string
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          position?: number | null
          product_id: string
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          position?: number | null
          product_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variations: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          price_adjustment: number | null
          product_id: string
          sku_suffix: string | null
          stock_quantity: number | null
          updated_at: string | null
          variation_type: string
          variation_value: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          price_adjustment?: number | null
          product_id: string
          sku_suffix?: string | null
          stock_quantity?: number | null
          updated_at?: string | null
          variation_type: string
          variation_value: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          price_adjustment?: number | null
          product_id?: string
          sku_suffix?: string | null
          stock_quantity?: number | null
          updated_at?: string | null
          variation_type?: string
          variation_value?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean | null
          category_id: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          featured: boolean | null
          id: string
          image_url: string | null
          min_quantity: number | null
          name: string
          price: number | null
          sku: string | null
          slug: string
          stock_control_enabled: boolean | null
          stock_quantity: number | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          category_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          min_quantity?: number | null
          name: string
          price?: number | null
          sku?: string | null
          slug: string
          stock_control_enabled?: boolean | null
          stock_quantity?: number | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          category_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          min_quantity?: number | null
          name?: string
          price?: number | null
          sku?: string | null
          slug?: string
          stock_control_enabled?: boolean | null
          stock_quantity?: number | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          created_at: string | null
          id: string
          price: number | null
          product_id: string | null
          product_name: string
          quantity: number
          quote_id: string
          sku: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          price?: number | null
          product_id?: string | null
          product_name: string
          quantity: number
          quote_id: string
          sku?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          price?: number | null
          product_id?: string | null
          product_name?: string
          quantity?: number
          quote_id?: string
          sku?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          created_at: string | null
          customer_email: string | null
          customer_name: string
          customer_whatsapp: string
          deleted_at: string | null
          id: string
          message_text: string | null
          observations: string | null
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_email?: string | null
          customer_name: string
          customer_whatsapp: string
          deleted_at?: string | null
          id?: string
          message_text?: string | null
          observations?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_whatsapp?: string
          deleted_at?: string | null
          id?: string
          message_text?: string | null
          observations?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          branding: Json | null
          contact: Json | null
          created_at: string | null
          id: string
          storefront: Json | null
          tenant_id: string
          theme_id: string | null
          updated_at: string | null
        }
        Insert: {
          branding?: Json | null
          contact?: Json | null
          created_at?: string | null
          id?: string
          storefront?: Json | null
          tenant_id: string
          theme_id?: string | null
          updated_at?: string | null
        }
        Update: {
          branding?: Json | null
          contact?: Json | null
          created_at?: string | null
          id?: string
          storefront?: Json | null
          tenant_id?: string
          theme_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_settings_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string | null
          id: string
          payment_confirmed: boolean | null
          payment_date: string | null
          plan_id: string
          started_at: string | null
          status: string
          tenant_id: string
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          payment_confirmed?: boolean | null
          payment_date?: string | null
          plan_id: string
          started_at?: string | null
          status?: string
          tenant_id: string
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          payment_confirmed?: boolean | null
          payment_date?: string | null
          plan_id?: string
          started_at?: string | null
          status?: string
          tenant_id?: string
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_memberships: {
        Row: {
          created_at: string | null
          id: string
          role: number
          tenant_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: number
          tenant_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: number
          tenant_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_memberships_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          active: boolean | null
          company_name: string
          created_at: string | null
          custom_domain: string | null
          custom_domain_verified: boolean | null
          email: string | null
          id: string
          previous_theme_id: string | null
          primary_color: string | null
          selected_theme_id: string | null
          slug: string
          store_name: string | null
          subscription_status: string | null
          theme_preview_id: string | null
          trial_ends_at: string | null
          updated_at: string | null
          user_id: string | null
          whatsapp_number: string | null
        }
        Insert: {
          active?: boolean | null
          company_name: string
          created_at?: string | null
          custom_domain?: string | null
          custom_domain_verified?: boolean | null
          email?: string | null
          id?: string
          previous_theme_id?: string | null
          primary_color?: string | null
          selected_theme_id?: string | null
          slug?: string
          store_name?: string | null
          subscription_status?: string | null
          theme_preview_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          active?: boolean | null
          company_name?: string
          created_at?: string | null
          custom_domain?: string | null
          custom_domain_verified?: boolean | null
          email?: string | null
          id?: string
          previous_theme_id?: string | null
          primary_color?: string | null
          selected_theme_id?: string | null
          slug?: string
          store_name?: string | null
          subscription_status?: string | null
          theme_preview_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id?: string | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenants_previous_theme_id_fkey"
            columns: ["previous_theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenants_selected_theme_id_fkey"
            columns: ["selected_theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenants_theme_preview_id_fkey"
            columns: ["theme_preview_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id"]
          },
        ]
      }
      themes: {
        Row: {
          active: boolean
          colors: Json | null
          config: Json
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_premium: boolean | null
          name: string
          slug: string
          tenant_id: string | null
          thumbnail_url: string | null
          type: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          active?: boolean
          colors?: Json | null
          config?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_premium?: boolean | null
          name?: string
          slug: string
          tenant_id?: string | null
          thumbnail_url?: string | null
          type: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          active?: boolean
          colors?: Json | null
          config?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_premium?: boolean | null
          name?: string
          slug?: string
          tenant_id?: string | null
          thumbnail_url?: string | null
          type?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "themes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          id: string
          social: Json
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          social?: Json
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          social?: Json
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_theme: {
        Args: {
          p_is_preview?: boolean
          p_tenant_id: string
          p_theme_id: string
          p_user_id: string
        }
        Returns: Json
      }
      can_use_theme: {
        Args: { p_tenant_id: string; p_theme_id: string }
        Returns: boolean
      }
      extend_tenant_trial: { Args: { p_tenant_id: string }; Returns: undefined }
      revert_theme: {
        Args: { p_tenant_id: string; p_user_id: string }
        Returns: Json
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
    Enums: {},
  },
} as const