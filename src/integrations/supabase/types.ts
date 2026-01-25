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
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          last_sync_data: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          last_sync_data?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          last_sync_data?: string | null
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
      get_relatorio_comissoes: {
        Args: { data_fim: string; data_inicio: string }
        Returns: Json
      }
      get_relatorio_financeiro_br: {
        Args: { data_fim: string; data_inicio: string }
        Returns: {
          comissao_bruta: number
          comissao_liquida: number
          data_pedido: string
          qtd_vendas: number
        }[]
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
