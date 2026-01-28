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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      investments_manual: {
        Row: {
          amount: number
          channel: string | null
          created_at: string | null
          date: string
          id: number
          order_id: string | null
          sub_id1: string | null
          sub_id2: string | null
          sub_id3: string | null
          sub_id4: string | null
          sub_id5: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          channel?: string | null
          created_at?: string | null
          date: string
          id?: never
          order_id?: string | null
          sub_id1?: string | null
          sub_id2?: string | null
          sub_id3?: string | null
          sub_id4?: string | null
          sub_id5?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          amount?: number
          channel?: string | null
          created_at?: string | null
          date?: string
          id?: never
          order_id?: string | null
          sub_id1?: string | null
          sub_id2?: string | null
          sub_id3?: string | null
          sub_id4?: string | null
          sub_id5?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      link_analytics: {
        Row: {
          channel: string | null
          country: string | null
          created_at: string
          device: string | null
          id: string
          link_id: string
          referrer: string | null
          region: string | null
        }
        Insert: {
          channel?: string | null
          country?: string | null
          created_at?: string
          device?: string | null
          id?: string
          link_id: string
          referrer?: string | null
          region?: string | null
        }
        Update: {
          channel?: string | null
          country?: string | null
          created_at?: string
          device?: string | null
          id?: string
          link_id?: string
          referrer?: string | null
          region?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "link_analytics_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "links"
            referencedColumns: ["id"]
          },
        ]
      }
      links: {
        Row: {
          active: boolean
          clicks_count: number
          created_at: string
          id: string
          name: string
          original_url: string
          pixel_id: string | null
          slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          clicks_count?: number
          created_at?: string
          id?: string
          name: string
          original_url: string
          pixel_id?: string | null
          slug: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          clicks_count?: number
          created_at?: string
          id?: string
          name?: string
          original_url?: string
          pixel_id?: string | null
          slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      plan_features: {
        Row: {
          created_at: string
          id: string
          is_included: boolean
          label: string
          order_index: number
          plan_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_included?: boolean
          label: string
          order_index?: number
          plan_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_included?: boolean
          label?: string
          order_index?: number
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_features_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          button_text: string
          created_at: string
          id: string
          is_highlighted: boolean | null
          name: string
          order_index: number
          price: number
          subtitle: string | null
        }
        Insert: {
          button_text: string
          created_at?: string
          id?: string
          is_highlighted?: boolean | null
          name: string
          order_index?: number
          price: number
          subtitle?: string | null
        }
        Update: {
          button_text?: string
          created_at?: string
          id?: string
          is_highlighted?: boolean | null
          name?: string
          order_index?: number
          price?: number
          subtitle?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          instagram: string | null
          last_sync_data: string | null
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          instagram?: string | null
          last_sync_data?: string | null
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          instagram?: string | null
          last_sync_data?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      shopee_clicks: {
        Row: {
          click_pv: number | null
          click_time: string
          created_at: string | null
          credential_id: number
          id: number
          referrer: string | null
          region: string | null
          sub_id1: string | null
          sub_id2: string | null
          sub_id3: string | null
          sub_id4: string | null
          sub_id5: string | null
          user_id: string
        }
        Insert: {
          click_pv?: number | null
          click_time: string
          created_at?: string | null
          credential_id: number
          id?: number
          referrer?: string | null
          region?: string | null
          sub_id1?: string | null
          sub_id2?: string | null
          sub_id3?: string | null
          sub_id4?: string | null
          sub_id5?: string | null
          user_id: string
        }
        Update: {
          click_pv?: number | null
          click_time?: string
          created_at?: string | null
          credential_id?: number
          id?: number
          referrer?: string | null
          region?: string | null
          sub_id1?: string | null
          sub_id2?: string | null
          sub_id3?: string | null
          sub_id4?: string | null
          sub_id5?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopee_clicks_credential_id_fkey"
            columns: ["credential_id"]
            isOneToOne: false
            referencedRelation: "shopee_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopee_clicks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopee_clicks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shopee_credentials: {
        Row: {
          account_name: string | null
          app_id: string
          app_secret: string
          created_at: string | null
          id: number
          is_active: boolean | null
          last_sync_at: string | null
          user_id: string
        }
        Insert: {
          account_name?: string | null
          app_id: string
          app_secret: string
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          last_sync_at?: string | null
          user_id: string
        }
        Update: {
          account_name?: string | null
          app_id?: string
          app_secret?: string
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          last_sync_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopee_credentials_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopee_credentials_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shopee_settlements: {
        Row: {
          conversion_id: number
          created_at: string | null
          credential_id: number | null
          fraud_status: string | null
          item_id: number
          net_commission: number | null
          order_id: string
          payout_amount: number | null
          purchase_time: string | null
          settlement_status: string | null
          user_id: string | null
          validation_date: string | null
          validation_id: number
        }
        Insert: {
          conversion_id: number
          created_at?: string | null
          credential_id?: number | null
          fraud_status?: string | null
          item_id: number
          net_commission?: number | null
          order_id: string
          payout_amount?: number | null
          purchase_time?: string | null
          settlement_status?: string | null
          user_id?: string | null
          validation_date?: string | null
          validation_id: number
        }
        Update: {
          conversion_id?: number
          created_at?: string | null
          credential_id?: number | null
          fraud_status?: string | null
          item_id?: number
          net_commission?: number | null
          order_id?: string
          payout_amount?: number | null
          purchase_time?: string | null
          settlement_status?: string | null
          user_id?: string | null
          validation_date?: string | null
          validation_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "shopee_settlements_credential_id_fkey"
            columns: ["credential_id"]
            isOneToOne: false
            referencedRelation: "shopee_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopee_settlements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopee_settlements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shopee_sync_control: {
        Row: {
          check_date: string
          is_finished: boolean | null
          last_order_count: number | null
          stable_streak: number | null
          updated_at: string | null
        }
        Insert: {
          check_date: string
          is_finished?: boolean | null
          last_order_count?: number | null
          stable_streak?: number | null
          updated_at?: string | null
        }
        Update: {
          check_date?: string
          is_finished?: boolean | null
          last_order_count?: number | null
          stable_streak?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      shopee_vendas: {
        Row: {
          actual_amount: number | null
          attribution_type: string | null
          brand_commission: number | null
          buyer_type: string | null
          campaign_partner_name: string | null
          campaign_type: string | null
          category_l1: string | null
          category_l2: string | null
          category_l3: string | null
          channel: string | null
          channel_type: string | null
          checkout_id: string | null
          click_id: string | null
          click_time: string | null
          complete_time: string | null
          conversion_id: number | null
          conversion_status: string | null
          credential_id: number | null
          device: string | null
          direct_source: string | null
          display_item_status: string | null
          estimated_total_commission: number | null
          estimated_validation_month: string | null
          first_external_source: string | null
          fraud_status: string | null
          gross_commission: number | null
          id: number
          indirect_source: string | null
          internal_source: string | null
          is_shopee_capped: boolean | null
          item_commission: number | null
          item_id: number
          item_image: string | null
          item_model_id: string | null
          item_name: string | null
          item_notes: string | null
          item_price: number | null
          item_seller_commission_rate: number | null
          item_shopee_commission_rate: number | null
          item_total_commission: number | null
          last_external_source: string | null
          mcn_fee: number | null
          mcn_fee_rate: number | null
          mcn_name: string | null
          media_name: string | null
          net_commission: number | null
          order_date: string | null
          order_id: string
          order_status: string | null
          product_type: string | null
          promotion_id: string | null
          purchase_time: string | null
          qty: number | null
          rate: number | null
          referrer: Json | null
          refund_amount: number | null
          seller_commission: number | null
          shop_id: string | null
          shop_name: string | null
          shop_type: string | null
          shopee_commission: number | null
          status: string | null
          sub_id1: string | null
          sub_id2: string | null
          sub_id3: string | null
          sub_id4: string | null
          sub_id5: string | null
          total_commission: number | null
          user_id: string
          utm_content: string | null
        }
        Insert: {
          actual_amount?: number | null
          attribution_type?: string | null
          brand_commission?: number | null
          buyer_type?: string | null
          campaign_partner_name?: string | null
          campaign_type?: string | null
          category_l1?: string | null
          category_l2?: string | null
          category_l3?: string | null
          channel?: string | null
          channel_type?: string | null
          checkout_id?: string | null
          click_id?: string | null
          click_time?: string | null
          complete_time?: string | null
          conversion_id?: number | null
          conversion_status?: string | null
          credential_id?: number | null
          device?: string | null
          direct_source?: string | null
          display_item_status?: string | null
          estimated_total_commission?: number | null
          estimated_validation_month?: string | null
          first_external_source?: string | null
          fraud_status?: string | null
          gross_commission?: number | null
          id?: number
          indirect_source?: string | null
          internal_source?: string | null
          is_shopee_capped?: boolean | null
          item_commission?: number | null
          item_id: number
          item_image?: string | null
          item_model_id?: string | null
          item_name?: string | null
          item_notes?: string | null
          item_price?: number | null
          item_seller_commission_rate?: number | null
          item_shopee_commission_rate?: number | null
          item_total_commission?: number | null
          last_external_source?: string | null
          mcn_fee?: number | null
          mcn_fee_rate?: number | null
          mcn_name?: string | null
          media_name?: string | null
          net_commission?: number | null
          order_date?: string | null
          order_id: string
          order_status?: string | null
          product_type?: string | null
          promotion_id?: string | null
          purchase_time?: string | null
          qty?: number | null
          rate?: number | null
          referrer?: Json | null
          refund_amount?: number | null
          seller_commission?: number | null
          shop_id?: string | null
          shop_name?: string | null
          shop_type?: string | null
          shopee_commission?: number | null
          status?: string | null
          sub_id1?: string | null
          sub_id2?: string | null
          sub_id3?: string | null
          sub_id4?: string | null
          sub_id5?: string | null
          total_commission?: number | null
          user_id: string
          utm_content?: string | null
        }
        Update: {
          actual_amount?: number | null
          attribution_type?: string | null
          brand_commission?: number | null
          buyer_type?: string | null
          campaign_partner_name?: string | null
          campaign_type?: string | null
          category_l1?: string | null
          category_l2?: string | null
          category_l3?: string | null
          channel?: string | null
          channel_type?: string | null
          checkout_id?: string | null
          click_id?: string | null
          click_time?: string | null
          complete_time?: string | null
          conversion_id?: number | null
          conversion_status?: string | null
          credential_id?: number | null
          device?: string | null
          direct_source?: string | null
          display_item_status?: string | null
          estimated_total_commission?: number | null
          estimated_validation_month?: string | null
          first_external_source?: string | null
          fraud_status?: string | null
          gross_commission?: number | null
          id?: number
          indirect_source?: string | null
          internal_source?: string | null
          is_shopee_capped?: boolean | null
          item_commission?: number | null
          item_id?: number
          item_image?: string | null
          item_model_id?: string | null
          item_name?: string | null
          item_notes?: string | null
          item_price?: number | null
          item_seller_commission_rate?: number | null
          item_shopee_commission_rate?: number | null
          item_total_commission?: number | null
          last_external_source?: string | null
          mcn_fee?: number | null
          mcn_fee_rate?: number | null
          mcn_name?: string | null
          media_name?: string | null
          net_commission?: number | null
          order_date?: string | null
          order_id?: string
          order_status?: string | null
          product_type?: string | null
          promotion_id?: string | null
          purchase_time?: string | null
          qty?: number | null
          rate?: number | null
          referrer?: Json | null
          refund_amount?: number | null
          seller_commission?: number | null
          shop_id?: string | null
          shop_name?: string | null
          shop_type?: string | null
          shopee_commission?: number | null
          status?: string | null
          sub_id1?: string | null
          sub_id2?: string | null
          sub_id3?: string | null
          sub_id4?: string | null
          sub_id5?: string | null
          total_commission?: number | null
          user_id?: string
          utm_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopee_vendas_credential_id_fkey"
            columns: ["credential_id"]
            isOneToOne: false
            referencedRelation: "shopee_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopee_vendas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopee_vendas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      upload_history: {
        Row: {
          file_name: string
          file_size_bytes: number | null
          file_type: string
          id: number
          period_end: string | null
          period_start: string | null
          records_count: number
          uploaded_at: string
          user_id: string
        }
        Insert: {
          file_name: string
          file_size_bytes?: number | null
          file_type: string
          id?: never
          period_end?: string | null
          period_start?: string | null
          records_count?: number
          uploaded_at?: string
          user_id?: string
        }
        Update: {
          file_name?: string
          file_size_bytes?: number | null
          file_type?: string
          id?: never
          period_end?: string | null
          period_start?: string | null
          records_count?: number
          uploaded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: number
          is_active: boolean
          plan_type: string
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: never
          is_active?: boolean
          plan_type?: string
          started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: never
          is_active?: boolean
          plan_type?: string
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      admin_kpis: {
        Row: {
          active_subs: number | null
          mrr: number | null
          projected_revenue: number | null
          total_users: number | null
        }
        Relationships: []
      }
      admin_plan_distribution: {
        Row: {
          plan_name: string | null
          user_count: number | null
        }
        Relationships: []
      }
      admin_users_view: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          is_admin: boolean | null
          plan_type: string | null
          subscription_active: boolean | null
          subscription_expires: string | null
          subscription_started: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_admin_stats: { Args: never; Returns: Json }
      get_dashboard_kpis: {
        Args: {
          p_channels?: string[]
          p_end_date: string
          p_start_date: string
          p_status?: string[]
          p_sub_id1?: string[]
          p_sub_id2?: string[]
          p_sub_id3?: string[]
          p_sub_id4?: string[]
          p_sub_id5?: string[]
        }
        Returns: {
          avg_ticket: number
          net_commission: number
          total_gmv: number
          total_orders: number
        }[]
      }
      get_day_analysis_aggregations: {
        Args: {
          p_channels?: string[]
          p_end_date: string
          p_start_date: string
          p_status?: string[]
          p_sub_id1?: string[]
          p_sub_id2?: string[]
          p_sub_id3?: string[]
          p_sub_id4?: string[]
          p_sub_id5?: string[]
        }
        Returns: Json
      }
      get_relatorio_comissoes: {
        Args: { data_fim: string; data_inicio: string }
        Returns: Json
      }
      get_relatorio_diario_network: {
        Args: { data_fim_texto: string; data_inicio_texto: string }
        Returns: {
          comissao_bruta: number
          comissao_liquida: number
          data_pedido: string
          qtd_vendas: number
        }[]
      }
      get_relatorio_financeiro_br:
        | {
            Args: { data_fim: string; data_inicio: string }
            Returns: {
              contagem_id_pedido: number
              soma_comissao_liquida: number
              soma_valor_compra: number
            }[]
          }
        | {
            Args: { data_fim: string; data_inicio: string }
            Returns: {
              comissao_bruta: number
              comissao_liquida: number
              data_pedido: string
              qtd_vendas: number
            }[]
          }
      get_relatorio_financeiro_br_simple: {
        Args: { data_fim: string; data_inicio: string }
        Returns: {
          comissao_bruta: number
          comissao_liquida: number
          data_pedido: string
          qtd_vendas: number
        }[]
      }
      get_unified_table_aggregations: {
        Args: {
          p_channels?: string[]
          p_end_date: string
          p_include_sub2?: boolean
          p_include_sub3?: boolean
          p_include_sub4?: boolean
          p_include_sub5?: boolean
          p_start_date: string
          p_status?: string[]
          p_sub_id1?: string[]
          p_sub_id2?: string[]
          p_sub_id3?: string[]
          p_sub_id4?: string[]
          p_sub_id5?: string[]
        }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_link_clicks: { Args: { link_slug: string }; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    },
  },
} as const
