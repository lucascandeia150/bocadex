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
      admin_audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_label: string | null
          actor_type: string
          created_at: string
          description: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_label?: string | null
          actor_type?: string
          created_at?: string
          description?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_label?: string | null
          actor_type?: string
          created_at?: string
          description?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
        }
        Relationships: []
      }
      affiliate_links: {
        Row: {
          created_at: string
          id: string
          keyword: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          keyword: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          keyword?: string
          url?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string
          description: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      app_versions: {
        Row: {
          active: boolean
          changelog: string
          created_at: string
          force_update: boolean
          id: string
          is_current: boolean
          title: string
          version: string
        }
        Insert: {
          active?: boolean
          changelog?: string
          created_at?: string
          force_update?: boolean
          id?: string
          is_current?: boolean
          title?: string
          version: string
        }
        Update: {
          active?: boolean
          changelog?: string
          created_at?: string
          force_update?: boolean
          id?: string
          is_current?: boolean
          title?: string
          version?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          display_order: number
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          name?: string
        }
        Relationships: []
      }
      chats: {
        Row: {
          created_at: string
          customer_id: string
          customer_unread: number
          id: string
          last_message_at: string | null
          last_message_preview: string | null
          order_id: string
          partner_id: string
          partner_unread: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          customer_unread?: number
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          order_id: string
          partner_id: string
          partner_unread?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          customer_unread?: number
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          order_id?: string
          partner_id?: string
          partner_unread?: number
          updated_at?: string
        }
        Relationships: []
      }
      coupon_usage: {
        Row: {
          coupon_id: string
          created_at: string
          discount_amount: number
          id: string
          order_id: string | null
          payment_id: string | null
          user_id: string | null
        }
        Insert: {
          coupon_id: string
          created_at?: string
          discount_amount?: number
          id?: string
          order_id?: string | null
          payment_id?: string | null
          user_id?: string | null
        }
        Update: {
          coupon_id?: string
          created_at?: string
          discount_amount?: number
          id?: string
          order_id?: string | null
          payment_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          created_by: string | null
          description: string
          expires_at: string | null
          id: string
          max_discount: number | null
          min_order: number
          partner_id: string | null
          per_user_limit: number
          type: string
          updated_at: string
          usage_limit: number | null
          used_count: number
          value: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          created_by?: string | null
          description?: string
          expires_at?: string | null
          id?: string
          max_discount?: number | null
          min_order?: number
          partner_id?: string | null
          per_user_limit?: number
          type?: string
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          value?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string
          expires_at?: string | null
          id?: string
          max_discount?: number | null
          min_order?: number
          partner_id?: string | null
          per_user_limit?: number
          type?: string
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          value?: number
        }
        Relationships: []
      }
      courier_applications: {
        Row: {
          availability: string
          average_fee: number | null
          city_neighborhood: string
          created_at: string
          email: string | null
          full_name: string
          has_experience: boolean
          id: string
          notes: string | null
          phone: string
          service_area: string
          status: string
          transport_type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          availability: string
          average_fee?: number | null
          city_neighborhood: string
          created_at?: string
          email?: string | null
          full_name: string
          has_experience?: boolean
          id?: string
          notes?: string | null
          phone: string
          service_area: string
          status?: string
          transport_type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          availability?: string
          average_fee?: number | null
          city_neighborhood?: string
          created_at?: string
          email?: string | null
          full_name?: string
          has_experience?: boolean
          id?: string
          notes?: string | null
          phone?: string
          service_area?: string
          status?: string
          transport_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      couriers: {
        Row: {
          access_pin: string | null
          application_id: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          is_online: boolean
          last_seen_at: string | null
          name: string
          phone: string
          updated_at: string
          user_id: string | null
          vehicle: string
        }
        Insert: {
          access_pin?: string | null
          application_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          is_online?: boolean
          last_seen_at?: string | null
          name: string
          phone: string
          updated_at?: string
          user_id?: string | null
          vehicle?: string
        }
        Update: {
          access_pin?: string | null
          application_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          is_online?: boolean
          last_seen_at?: string | null
          name?: string
          phone?: string
          updated_at?: string
          user_id?: string | null
          vehicle?: string
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          app_fee: number
          courier_id: string | null
          courier_lat: number | null
          courier_lng: number | null
          courier_location_updated_at: string | null
          courier_payout: number
          created_at: string
          delivery_address: string
          delivery_code: string | null
          delivery_lat: number | null
          delivery_lng: number | null
          fee: number
          fulfillment_type: string
          id: string
          is_demo: boolean
          notes: string | null
          order_description: string
          order_value: number
          partner_id: string | null
          partner_name: string
          payment_id: string | null
          prep_status: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          app_fee?: number
          courier_id?: string | null
          courier_lat?: number | null
          courier_lng?: number | null
          courier_location_updated_at?: string | null
          courier_payout?: number
          created_at?: string
          delivery_address: string
          delivery_code?: string | null
          delivery_lat?: number | null
          delivery_lng?: number | null
          fee?: number
          fulfillment_type?: string
          id?: string
          is_demo?: boolean
          notes?: string | null
          order_description: string
          order_value?: number
          partner_id?: string | null
          partner_name: string
          payment_id?: string | null
          prep_status?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          app_fee?: number
          courier_id?: string | null
          courier_lat?: number | null
          courier_lng?: number | null
          courier_location_updated_at?: string | null
          courier_payout?: number
          created_at?: string
          delivery_address?: string
          delivery_code?: string | null
          delivery_lat?: number | null
          delivery_lng?: number | null
          fee?: number
          fulfillment_type?: string
          id?: string
          is_demo?: boolean
          notes?: string | null
          order_description?: string
          order_value?: number
          partner_id?: string | null
          partner_name?: string
          payment_id?: string | null
          prep_status?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_courier_id_fkey"
            columns: ["courier_id"]
            isOneToOne: false
            referencedRelation: "couriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_settings: {
        Row: {
          app_fee_percent: number
          default_courier_payout: number
          default_fee: number
          id: string
          updated_at: string
        }
        Insert: {
          app_fee_percent?: number
          default_courier_payout?: number
          default_fee?: number
          id?: string
          updated_at?: string
        }
        Update: {
          app_fee_percent?: number
          default_courier_payout?: number
          default_fee?: number
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      delivery_zones: {
        Row: {
          courier_payout: number
          created_at: string
          display_order: number
          fee: number
          id: string
          is_active: boolean
          keywords: string[]
          name: string
          updated_at: string
        }
        Insert: {
          courier_payout?: number
          created_at?: string
          display_order?: number
          fee?: number
          id?: string
          is_active?: boolean
          keywords?: string[]
          name: string
          updated_at?: string
        }
        Update: {
          courier_payout?: number
          created_at?: string
          display_order?: number
          fee?: number
          id?: string
          is_active?: boolean
          keywords?: string[]
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      device_tokens: {
        Row: {
          created_at: string
          id: string
          last_seen_at: string
          platform: string
          token: string
          topic_tags: string[]
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_seen_at?: string
          platform?: string
          token: string
          topic_tags?: string[]
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          last_seen_at?: string
          platform?: string
          token?: string
          topic_tags?: string[]
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      feedbacks: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          options: string | null
          rating: number
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          options?: string | null
          rating: number
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          options?: string | null
          rating?: number
        }
        Relationships: []
      }
      home_tiles: {
        Row: {
          created_at: string
          display_order: number
          emoji: string
          fg: string
          gradient: string
          icon: string
          id: string
          is_active: boolean
          label: string
          route: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          emoji?: string
          fg?: string
          gradient?: string
          icon?: string
          id?: string
          is_active?: boolean
          label: string
          route: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          emoji?: string
          fg?: string
          gradient?: string
          icon?: string
          id?: string
          is_active?: boolean
          label?: string
          route?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          id: string
          read: boolean
          sender_id: string | null
          sender_type: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          id?: string
          read?: boolean
          sender_id?: string | null
          sender_type: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          read?: boolean
          sender_id?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_applications: {
        Row: {
          access_pin: string | null
          address: string
          business_name: string
          business_type: string
          commission_percent: number | null
          created_at: string
          created_by: string | null
          custom_courier_payout: number | null
          custom_delivery_fee: number | null
          description: string
          id: string
          images: string[] | null
          is_active: boolean
          is_demo: boolean
          is_featured: boolean
          is_open: boolean
          last_payment_at: string | null
          logo_url: string | null
          owner_name: string | null
          payment_status: string
          plan: string
          promotions: string | null
          slug: string | null
          status: string
          store_status: string
          subscription_active_until: string | null
          user_id: string | null
          uses_app_courier: boolean
          visibility: string
          whatsapp: string
        }
        Insert: {
          access_pin?: string | null
          address: string
          business_name: string
          business_type: string
          commission_percent?: number | null
          created_at?: string
          created_by?: string | null
          custom_courier_payout?: number | null
          custom_delivery_fee?: number | null
          description: string
          id?: string
          images?: string[] | null
          is_active?: boolean
          is_demo?: boolean
          is_featured?: boolean
          is_open?: boolean
          last_payment_at?: string | null
          logo_url?: string | null
          owner_name?: string | null
          payment_status?: string
          plan?: string
          promotions?: string | null
          slug?: string | null
          status?: string
          store_status?: string
          subscription_active_until?: string | null
          user_id?: string | null
          uses_app_courier?: boolean
          visibility?: string
          whatsapp: string
        }
        Update: {
          access_pin?: string | null
          address?: string
          business_name?: string
          business_type?: string
          commission_percent?: number | null
          created_at?: string
          created_by?: string | null
          custom_courier_payout?: number | null
          custom_delivery_fee?: number | null
          description?: string
          id?: string
          images?: string[] | null
          is_active?: boolean
          is_demo?: boolean
          is_featured?: boolean
          is_open?: boolean
          last_payment_at?: string | null
          logo_url?: string | null
          owner_name?: string | null
          payment_status?: string
          plan?: string
          promotions?: string | null
          slug?: string | null
          status?: string
          store_status?: string
          subscription_active_until?: string | null
          user_id?: string | null
          uses_app_courier?: boolean
          visibility?: string
          whatsapp?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          customer_name: string
          customer_phone: string
          delivery_address: string
          external_reference: string
          fulfillment_type: string
          id: string
          metadata: Json
          mp_payment_id: string | null
          mp_preference_id: string | null
          order_description: string
          partner_id: string | null
          payment_type: string
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          customer_name: string
          customer_phone: string
          delivery_address: string
          external_reference: string
          fulfillment_type?: string
          id?: string
          metadata?: Json
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          order_description: string
          partner_id?: string | null
          payment_type?: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_name?: string
          customer_phone?: string
          delivery_address?: string
          external_reference?: string
          fulfillment_type?: string
          id?: string
          metadata?: Json
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          order_description?: string
          partner_id?: string | null
          payment_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          description: string
          id: string
          image_url: string | null
          is_active: boolean
          is_demo: boolean
          name: string
          partner_id: string | null
          price_max: number | null
          price_min: number | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_demo?: boolean
          name: string
          partner_id?: string | null
          price_max?: number | null
          price_min?: number | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_demo?: boolean
          name?: string
          partner_id?: string | null
          price_max?: number | null
          price_min?: number | null
          updated_at?: string
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
            foreignKeyName: "products_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          name?: string
          phone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      push_logs: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          data: Json
          failed_count: number
          id: string
          sent_count: number
          target: string
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          data?: Json
          failed_count?: number
          id?: string
          sent_count?: number
          target?: string
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          data?: Json
          failed_count?: number
          id?: string
          sent_count?: number
          target?: string
          title?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          comment: string | null
          courier_id: string
          created_at: string
          delivery_id: string
          id: string
          partner_id: string
          stars: number
        }
        Insert: {
          comment?: string | null
          courier_id: string
          created_at?: string
          delivery_id: string
          id?: string
          partner_id: string
          stars: number
        }
        Update: {
          comment?: string | null
          courier_id?: string
          created_at?: string
          delivery_id?: string
          id?: string
          partner_id?: string
          stars?: number
        }
        Relationships: []
      }
      recipes: {
        Row: {
          created_at: string
          description: string
          id: string
          ingredients: string[]
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          ingredients?: string[]
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          ingredients?: string[]
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_addresses: {
        Row: {
          address: string
          created_at: string
          id: string
          is_default: boolean
          label: string
          reference: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          reference?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          reference?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_favorite_partners: {
        Row: {
          created_at: string
          id: string
          partner_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          partner_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          partner_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          body: string
          click_url: string | null
          created_at: string
          data: Json
          id: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body: string
          click_url?: string | null
          created_at?: string
          data?: Json
          id?: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          click_url?: string | null
          created_at?: string
          data?: Json
          id?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
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
      videos: {
        Row: {
          created_at: string
          description: string
          id: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          youtube_url: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          youtube_url: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          youtube_url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_partner_subscription: {
        Args: { _partner_id: string; _payment_id: string }
        Returns: {
          access_pin: string | null
          address: string
          business_name: string
          business_type: string
          commission_percent: number | null
          created_at: string
          created_by: string | null
          custom_courier_payout: number | null
          custom_delivery_fee: number | null
          description: string
          id: string
          images: string[] | null
          is_active: boolean
          is_demo: boolean
          is_featured: boolean
          is_open: boolean
          last_payment_at: string | null
          logo_url: string | null
          owner_name: string | null
          payment_status: string
          plan: string
          promotions: string | null
          slug: string | null
          status: string
          store_status: string
          subscription_active_until: string | null
          user_id: string | null
          uses_app_courier: boolean
          visibility: string
          whatsapp: string
        }
        SetofOptions: {
          from: "*"
          to: "partner_applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_approve_courier: {
        Args: { _application_id: string }
        Returns: {
          access_pin: string | null
          application_id: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          is_online: boolean
          last_seen_at: string | null
          name: string
          phone: string
          updated_at: string
          user_id: string | null
          vehicle: string
        }
        SetofOptions: {
          from: "*"
          to: "couriers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_assign_courier: {
        Args: { _courier_id: string; _delivery_id: string }
        Returns: {
          app_fee: number
          courier_id: string | null
          courier_lat: number | null
          courier_lng: number | null
          courier_location_updated_at: string | null
          courier_payout: number
          created_at: string
          delivery_address: string
          delivery_code: string | null
          delivery_lat: number | null
          delivery_lng: number | null
          fee: number
          fulfillment_type: string
          id: string
          is_demo: boolean
          notes: string | null
          order_description: string
          order_value: number
          partner_id: string | null
          partner_name: string
          payment_id: string | null
          prep_status: string
          status: string
          updated_at: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "deliveries"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_create_partner: {
        Args: {
          _address: string
          _business_name: string
          _business_type: string
          _description?: string
          _is_featured?: boolean
          _logo_url?: string
          _owner_name: string
          _plan?: string
          _promotions?: string
          _uses_app_courier?: boolean
          _whatsapp: string
        }
        Returns: {
          access_pin: string | null
          address: string
          business_name: string
          business_type: string
          commission_percent: number | null
          created_at: string
          created_by: string | null
          custom_courier_payout: number | null
          custom_delivery_fee: number | null
          description: string
          id: string
          images: string[] | null
          is_active: boolean
          is_demo: boolean
          is_featured: boolean
          is_open: boolean
          last_payment_at: string | null
          logo_url: string | null
          owner_name: string | null
          payment_status: string
          plan: string
          promotions: string | null
          slug: string | null
          status: string
          store_status: string
          subscription_active_until: string | null
          user_id: string | null
          uses_app_courier: boolean
          visibility: string
          whatsapp: string
        }
        SetofOptions: {
          from: "*"
          to: "partner_applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_delete_zone: { Args: { _id: string }; Returns: undefined }
      admin_list_active_couriers: {
        Args: never
        Returns: {
          id: string
          is_online: boolean
          last_seen_at: string
          name: string
          phone: string
          vehicle: string
        }[]
      }
      admin_reject_courier: {
        Args: { _application_id: string }
        Returns: {
          availability: string
          average_fee: number | null
          city_neighborhood: string
          created_at: string
          email: string | null
          full_name: string
          has_experience: boolean
          id: string
          notes: string | null
          phone: string
          service_area: string
          status: string
          transport_type: string
          updated_at: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "courier_applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_reset_courier_pin: {
        Args: { _courier_id: string }
        Returns: {
          access_pin: string | null
          application_id: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          is_online: boolean
          last_seen_at: string | null
          name: string
          phone: string
          updated_at: string
          user_id: string | null
          vehicle: string
        }
        SetofOptions: {
          from: "*"
          to: "couriers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_reset_partner_pin: {
        Args: { _partner_id: string }
        Returns: {
          access_pin: string | null
          address: string
          business_name: string
          business_type: string
          commission_percent: number | null
          created_at: string
          created_by: string | null
          custom_courier_payout: number | null
          custom_delivery_fee: number | null
          description: string
          id: string
          images: string[] | null
          is_active: boolean
          is_demo: boolean
          is_featured: boolean
          is_open: boolean
          last_payment_at: string | null
          logo_url: string | null
          owner_name: string | null
          payment_status: string
          plan: string
          promotions: string | null
          slug: string | null
          status: string
          store_status: string
          subscription_active_until: string | null
          user_id: string | null
          uses_app_courier: boolean
          visibility: string
          whatsapp: string
        }
        SetofOptions: {
          from: "*"
          to: "partner_applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_set_partner_commission: {
        Args: { _partner_id: string; _percent: number }
        Returns: {
          access_pin: string | null
          address: string
          business_name: string
          business_type: string
          commission_percent: number | null
          created_at: string
          created_by: string | null
          custom_courier_payout: number | null
          custom_delivery_fee: number | null
          description: string
          id: string
          images: string[] | null
          is_active: boolean
          is_demo: boolean
          is_featured: boolean
          is_open: boolean
          last_payment_at: string | null
          logo_url: string | null
          owner_name: string | null
          payment_status: string
          plan: string
          promotions: string | null
          slug: string | null
          status: string
          store_status: string
          subscription_active_until: string | null
          user_id: string | null
          uses_app_courier: boolean
          visibility: string
          whatsapp: string
        }
        SetofOptions: {
          from: "*"
          to: "partner_applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_set_partner_delivery_fee: {
        Args: { _courier_payout: number; _fee: number; _partner_id: string }
        Returns: {
          access_pin: string | null
          address: string
          business_name: string
          business_type: string
          commission_percent: number | null
          created_at: string
          created_by: string | null
          custom_courier_payout: number | null
          custom_delivery_fee: number | null
          description: string
          id: string
          images: string[] | null
          is_active: boolean
          is_demo: boolean
          is_featured: boolean
          is_open: boolean
          last_payment_at: string | null
          logo_url: string | null
          owner_name: string | null
          payment_status: string
          plan: string
          promotions: string | null
          slug: string | null
          status: string
          store_status: string
          subscription_active_until: string | null
          user_id: string | null
          uses_app_courier: boolean
          visibility: string
          whatsapp: string
        }
        SetofOptions: {
          from: "*"
          to: "partner_applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_set_store_status: {
        Args: { _partner_id: string; _status: string }
        Returns: {
          access_pin: string | null
          address: string
          business_name: string
          business_type: string
          commission_percent: number | null
          created_at: string
          created_by: string | null
          custom_courier_payout: number | null
          custom_delivery_fee: number | null
          description: string
          id: string
          images: string[] | null
          is_active: boolean
          is_demo: boolean
          is_featured: boolean
          is_open: boolean
          last_payment_at: string | null
          logo_url: string | null
          owner_name: string | null
          payment_status: string
          plan: string
          promotions: string | null
          slug: string | null
          status: string
          store_status: string
          subscription_active_until: string | null
          user_id: string | null
          uses_app_courier: boolean
          visibility: string
          whatsapp: string
        }
        SetofOptions: {
          from: "*"
          to: "partner_applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_toggle_courier_active: {
        Args: { _active: boolean; _courier_id: string }
        Returns: {
          access_pin: string | null
          application_id: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          is_online: boolean
          last_seen_at: string | null
          name: string
          phone: string
          updated_at: string
          user_id: string | null
          vehicle: string
        }
        SetofOptions: {
          from: "*"
          to: "couriers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_toggle_uses_app_courier: {
        Args: { _partner_id: string; _value: boolean }
        Returns: {
          access_pin: string | null
          address: string
          business_name: string
          business_type: string
          commission_percent: number | null
          created_at: string
          created_by: string | null
          custom_courier_payout: number | null
          custom_delivery_fee: number | null
          description: string
          id: string
          images: string[] | null
          is_active: boolean
          is_demo: boolean
          is_featured: boolean
          is_open: boolean
          last_payment_at: string | null
          logo_url: string | null
          owner_name: string | null
          payment_status: string
          plan: string
          promotions: string | null
          slug: string | null
          status: string
          store_status: string
          subscription_active_until: string | null
          user_id: string | null
          uses_app_courier: boolean
          visibility: string
          whatsapp: string
        }
        SetofOptions: {
          from: "*"
          to: "partner_applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_upsert_zone: {
        Args: {
          _courier_payout: number
          _display_order: number
          _fee: number
          _id: string
          _is_active: boolean
          _keywords: string[]
          _name: string
        }
        Returns: {
          courier_payout: number
          created_at: string
          display_order: number
          fee: number
          id: string
          is_active: boolean
          keywords: string[]
          name: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "delivery_zones"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      courier_heartbeat: {
        Args: { _pin: string }
        Returns: {
          access_pin: string | null
          application_id: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          is_online: boolean
          last_seen_at: string | null
          name: string
          phone: string
          updated_at: string
          user_id: string | null
          vehicle: string
        }
        SetofOptions: {
          from: "*"
          to: "couriers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      courier_list_deliveries: {
        Args: { _pin: string }
        Returns: {
          courier_id: string
          created_at: string
          customer_name: string
          customer_phone: string
          delivery_address: string
          delivery_code: string
          fee: number
          id: string
          notes: string
          order_description: string
          partner_id: string
          partner_name: string
          partner_whatsapp: string
          status: string
        }[]
      }
      courier_list_online: {
        Args: never
        Returns: {
          id: string
          user_id: string
        }[]
      }
      courier_login: {
        Args: { _pin: string }
        Returns: {
          id: string
          is_active: boolean
          name: string
          phone: string
          vehicle: string
        }[]
      }
      courier_login_self: {
        Args: never
        Returns: {
          access_pin: string
          id: string
          is_active: boolean
          name: string
          phone: string
          status: string
          vehicle: string
        }[]
      }
      courier_rating_stats: {
        Args: { _courier_id: string }
        Returns: {
          avg_stars: number
          total_ratings: number
        }[]
      }
      courier_set_online: {
        Args: { _online: boolean; _pin: string }
        Returns: {
          access_pin: string | null
          application_id: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          is_online: boolean
          last_seen_at: string | null
          name: string
          phone: string
          updated_at: string
          user_id: string | null
          vehicle: string
        }
        SetofOptions: {
          from: "*"
          to: "couriers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      courier_submit_application: {
        Args: {
          _availability: string
          _average_fee: number
          _city_neighborhood: string
          _full_name: string
          _has_experience: boolean
          _notes: string
          _phone: string
          _service_area: string
          _transport_type: string
        }
        Returns: {
          availability: string
          average_fee: number | null
          city_neighborhood: string
          created_at: string
          email: string | null
          full_name: string
          has_experience: boolean
          id: string
          notes: string | null
          phone: string
          service_area: string
          status: string
          transport_type: string
          updated_at: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "courier_applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      courier_update_delivery: {
        Args: {
          _action: string
          _code?: string
          _delivery_id: string
          _pin: string
        }
        Returns: {
          app_fee: number
          courier_id: string | null
          courier_lat: number | null
          courier_lng: number | null
          courier_location_updated_at: string | null
          courier_payout: number
          created_at: string
          delivery_address: string
          delivery_code: string | null
          delivery_lat: number | null
          delivery_lng: number | null
          fee: number
          fulfillment_type: string
          id: string
          is_demo: boolean
          notes: string | null
          order_description: string
          order_value: number
          partner_id: string | null
          partner_name: string
          payment_id: string | null
          prep_status: string
          status: string
          updated_at: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "deliveries"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_partner_id: { Args: never; Returns: string }
      customer_cancel_delivery: {
        Args: { _delivery_id: string }
        Returns: {
          app_fee: number
          courier_id: string | null
          courier_lat: number | null
          courier_lng: number | null
          courier_location_updated_at: string | null
          courier_payout: number
          created_at: string
          delivery_address: string
          delivery_code: string | null
          delivery_lat: number | null
          delivery_lng: number | null
          fee: number
          fulfillment_type: string
          id: string
          is_demo: boolean
          notes: string | null
          order_description: string
          order_value: number
          partner_id: string | null
          partner_name: string
          payment_id: string | null
          prep_status: string
          status: string
          updated_at: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "deliveries"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      customer_create_delivery: {
        Args: {
          _customer_name: string
          _customer_phone: string
          _delivery_address: string
          _order_description: string
          _order_value?: number
          _partner_id: string
        }
        Returns: {
          app_fee: number
          courier_id: string | null
          courier_lat: number | null
          courier_lng: number | null
          courier_location_updated_at: string | null
          courier_payout: number
          created_at: string
          delivery_address: string
          delivery_code: string | null
          delivery_lat: number | null
          delivery_lng: number | null
          fee: number
          fulfillment_type: string
          id: string
          is_demo: boolean
          notes: string | null
          order_description: string
          order_value: number
          partner_id: string | null
          partner_name: string
          payment_id: string | null
          prep_status: string
          status: string
          updated_at: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "deliveries"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      customer_get_or_create_chat: {
        Args: { _order_id: string }
        Returns: {
          created_at: string
          customer_id: string
          customer_unread: number
          id: string
          last_message_at: string | null
          last_message_preview: string | null
          order_id: string
          partner_id: string
          partner_unread: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "chats"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      customer_list_messages: {
        Args: { _chat_id: string }
        Returns: {
          chat_id: string
          content: string
          created_at: string
          id: string
          read: boolean
          sender_id: string | null
          sender_type: string
        }[]
        SetofOptions: {
          from: "*"
          to: "messages"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      customer_list_orders: {
        Args: never
        Returns: {
          app_fee: number
          courier_id: string | null
          courier_lat: number | null
          courier_lng: number | null
          courier_location_updated_at: string | null
          courier_payout: number
          created_at: string
          delivery_address: string
          delivery_code: string | null
          delivery_lat: number | null
          delivery_lng: number | null
          fee: number
          fulfillment_type: string
          id: string
          is_demo: boolean
          notes: string | null
          order_description: string
          order_value: number
          partner_id: string | null
          partner_name: string
          payment_id: string | null
          prep_status: string
          status: string
          updated_at: string
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "deliveries"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      customer_mark_chat_read: {
        Args: { _chat_id: string }
        Returns: undefined
      }
      customer_send_message: {
        Args: { _chat_id: string; _content: string }
        Returns: {
          chat_id: string
          content: string
          created_at: string
          id: string
          read: boolean
          sender_id: string | null
          sender_type: string
        }
        SetofOptions: {
          from: "*"
          to: "messages"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      generate_access_pin: { Args: never; Returns: string }
      generate_delivery_code: { Args: never; Returns: string }
      generate_unique_partner_slug: {
        Args: { _base: string; _exclude_id?: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          _action: string
          _actor_id: string
          _actor_label: string
          _actor_type: string
          _description: string
          _entity_id: string
          _entity_type: string
          _metadata?: Json
        }
        Returns: string
      }
      mark_offline_inactive_couriers: { Args: never; Returns: number }
      partner_advance_delivery_status: {
        Args: { _delivery_id: string; _next_status: string; _pin: string }
        Returns: {
          app_fee: number
          courier_id: string | null
          courier_lat: number | null
          courier_lng: number | null
          courier_location_updated_at: string | null
          courier_payout: number
          created_at: string
          delivery_address: string
          delivery_code: string | null
          delivery_lat: number | null
          delivery_lng: number | null
          fee: number
          fulfillment_type: string
          id: string
          is_demo: boolean
          notes: string | null
          order_description: string
          order_value: number
          partner_id: string | null
          partner_name: string
          payment_id: string | null
          prep_status: string
          status: string
          updated_at: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "deliveries"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      partner_advance_prep: {
        Args: { _delivery_id: string; _next: string; _pin: string }
        Returns: {
          app_fee: number
          courier_id: string | null
          courier_lat: number | null
          courier_lng: number | null
          courier_location_updated_at: string | null
          courier_payout: number
          created_at: string
          delivery_address: string
          delivery_code: string | null
          delivery_lat: number | null
          delivery_lng: number | null
          fee: number
          fulfillment_type: string
          id: string
          is_demo: boolean
          notes: string | null
          order_description: string
          order_value: number
          partner_id: string | null
          partner_name: string
          payment_id: string | null
          prep_status: string
          status: string
          updated_at: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "deliveries"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      partner_create_delivery:
        | {
            Args: {
              _delivery_address: string
              _fee: number
              _notes: string
              _order_description: string
              _pin: string
            }
            Returns: {
              app_fee: number
              courier_id: string | null
              courier_lat: number | null
              courier_lng: number | null
              courier_location_updated_at: string | null
              courier_payout: number
              created_at: string
              delivery_address: string
              delivery_code: string | null
              delivery_lat: number | null
              delivery_lng: number | null
              fee: number
              fulfillment_type: string
              id: string
              is_demo: boolean
              notes: string | null
              order_description: string
              order_value: number
              partner_id: string | null
              partner_name: string
              payment_id: string | null
              prep_status: string
              status: string
              updated_at: string
              user_id: string | null
            }
            SetofOptions: {
              from: "*"
              to: "deliveries"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: {
              _delivery_address: string
              _fee: number
              _notes: string
              _order_description: string
              _order_value?: number
              _pin: string
            }
            Returns: {
              app_fee: number
              courier_id: string | null
              courier_lat: number | null
              courier_lng: number | null
              courier_location_updated_at: string | null
              courier_payout: number
              created_at: string
              delivery_address: string
              delivery_code: string | null
              delivery_lat: number | null
              delivery_lng: number | null
              fee: number
              fulfillment_type: string
              id: string
              is_demo: boolean
              notes: string | null
              order_description: string
              order_value: number
              partner_id: string | null
              partner_name: string
              payment_id: string | null
              prep_status: string
              status: string
              updated_at: string
              user_id: string | null
            }
            SetofOptions: {
              from: "*"
              to: "deliveries"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      partner_create_product: {
        Args: {
          _category_id: string
          _description: string
          _image_url: string
          _name: string
          _pin: string
          _price_max: number
          _price_min: number
        }
        Returns: {
          category_id: string | null
          created_at: string
          description: string
          id: string
          image_url: string | null
          is_active: boolean
          is_demo: boolean
          name: string
          partner_id: string | null
          price_max: number | null
          price_min: number | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "products"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      partner_delete_product: {
        Args: { _pin: string; _product_id: string }
        Returns: undefined
      }
      partner_link_user: {
        Args: { _pin: string; _user_id: string }
        Returns: {
          access_pin: string | null
          address: string
          business_name: string
          business_type: string
          commission_percent: number | null
          created_at: string
          created_by: string | null
          custom_courier_payout: number | null
          custom_delivery_fee: number | null
          description: string
          id: string
          images: string[] | null
          is_active: boolean
          is_demo: boolean
          is_featured: boolean
          is_open: boolean
          last_payment_at: string | null
          logo_url: string | null
          owner_name: string | null
          payment_status: string
          plan: string
          promotions: string | null
          slug: string | null
          status: string
          store_status: string
          subscription_active_until: string | null
          user_id: string | null
          uses_app_courier: boolean
          visibility: string
          whatsapp: string
        }
        SetofOptions: {
          from: "*"
          to: "partner_applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      partner_list_chats: {
        Args: { _pin: string }
        Returns: {
          customer_id: string
          customer_name: string
          id: string
          last_message_at: string
          last_message_preview: string
          order_description: string
          order_id: string
          order_status: string
          partner_unread: number
        }[]
      }
      partner_list_deliveries: {
        Args: { _pin: string }
        Returns: {
          app_fee: number
          courier_id: string | null
          courier_lat: number | null
          courier_lng: number | null
          courier_location_updated_at: string | null
          courier_payout: number
          created_at: string
          delivery_address: string
          delivery_code: string | null
          delivery_lat: number | null
          delivery_lng: number | null
          fee: number
          fulfillment_type: string
          id: string
          is_demo: boolean
          notes: string | null
          order_description: string
          order_value: number
          partner_id: string | null
          partner_name: string
          payment_id: string | null
          prep_status: string
          status: string
          updated_at: string
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "deliveries"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      partner_list_messages: {
        Args: { _chat_id: string; _pin: string }
        Returns: {
          chat_id: string
          content: string
          created_at: string
          id: string
          read: boolean
          sender_id: string | null
          sender_type: string
        }[]
        SetofOptions: {
          from: "*"
          to: "messages"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      partner_list_products: {
        Args: { _pin: string }
        Returns: {
          category_id: string | null
          created_at: string
          description: string
          id: string
          image_url: string | null
          is_active: boolean
          is_demo: boolean
          name: string
          partner_id: string | null
          price_max: number | null
          price_min: number | null
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "products"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      partner_login: {
        Args: { _pin: string }
        Returns: {
          address: string
          business_name: string
          description: string
          id: string
          is_demo: boolean
          is_open: boolean
          logo_url: string
          store_status: string
          uses_app_courier: boolean
          whatsapp: string
        }[]
      }
      partner_mark_chat_read: {
        Args: { _chat_id: string; _pin: string }
        Returns: undefined
      }
      partner_rate_courier: {
        Args: {
          _comment?: string
          _delivery_id: string
          _pin: string
          _stars: number
        }
        Returns: {
          comment: string | null
          courier_id: string
          created_at: string
          delivery_id: string
          id: string
          partner_id: string
          stars: number
        }
        SetofOptions: {
          from: "*"
          to: "ratings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      partner_send_message: {
        Args: { _chat_id: string; _content: string; _pin: string }
        Returns: {
          chat_id: string
          content: string
          created_at: string
          id: string
          read: boolean
          sender_id: string | null
          sender_type: string
        }
        SetofOptions: {
          from: "*"
          to: "messages"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      partner_set_delivery_fee: {
        Args: { _courier_payout: number; _fee: number; _pin: string }
        Returns: {
          access_pin: string | null
          address: string
          business_name: string
          business_type: string
          commission_percent: number | null
          created_at: string
          created_by: string | null
          custom_courier_payout: number | null
          custom_delivery_fee: number | null
          description: string
          id: string
          images: string[] | null
          is_active: boolean
          is_demo: boolean
          is_featured: boolean
          is_open: boolean
          last_payment_at: string | null
          logo_url: string | null
          owner_name: string | null
          payment_status: string
          plan: string
          promotions: string | null
          slug: string | null
          status: string
          store_status: string
          subscription_active_until: string | null
          user_id: string | null
          uses_app_courier: boolean
          visibility: string
          whatsapp: string
        }
        SetofOptions: {
          from: "*"
          to: "partner_applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      partner_set_pause: {
        Args: { _paused: boolean; _pin: string }
        Returns: {
          access_pin: string | null
          address: string
          business_name: string
          business_type: string
          commission_percent: number | null
          created_at: string
          created_by: string | null
          custom_courier_payout: number | null
          custom_delivery_fee: number | null
          description: string
          id: string
          images: string[] | null
          is_active: boolean
          is_demo: boolean
          is_featured: boolean
          is_open: boolean
          last_payment_at: string | null
          logo_url: string | null
          owner_name: string | null
          payment_status: string
          plan: string
          promotions: string | null
          slug: string | null
          status: string
          store_status: string
          subscription_active_until: string | null
          user_id: string | null
          uses_app_courier: boolean
          visibility: string
          whatsapp: string
        }
        SetofOptions: {
          from: "*"
          to: "partner_applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      partner_toggle_open: {
        Args: { _pin: string }
        Returns: {
          access_pin: string | null
          address: string
          business_name: string
          business_type: string
          commission_percent: number | null
          created_at: string
          created_by: string | null
          custom_courier_payout: number | null
          custom_delivery_fee: number | null
          description: string
          id: string
          images: string[] | null
          is_active: boolean
          is_demo: boolean
          is_featured: boolean
          is_open: boolean
          last_payment_at: string | null
          logo_url: string | null
          owner_name: string | null
          payment_status: string
          plan: string
          promotions: string | null
          slug: string | null
          status: string
          store_status: string
          subscription_active_until: string | null
          user_id: string | null
          uses_app_courier: boolean
          visibility: string
          whatsapp: string
        }
        SetofOptions: {
          from: "*"
          to: "partner_applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      partner_toggle_product: {
        Args: { _pin: string; _product_id: string }
        Returns: {
          category_id: string | null
          created_at: string
          description: string
          id: string
          image_url: string | null
          is_active: boolean
          is_demo: boolean
          name: string
          partner_id: string | null
          price_max: number | null
          price_min: number | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "products"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      partner_update_product: {
        Args: {
          _category_id: string
          _description: string
          _image_url: string
          _is_active: boolean
          _name: string
          _pin: string
          _price_max: number
          _price_min: number
          _product_id: string
        }
        Returns: {
          category_id: string | null
          created_at: string
          description: string
          id: string
          image_url: string | null
          is_active: boolean
          is_demo: boolean
          name: string
          partner_id: string | null
          price_max: number | null
          price_min: number | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "products"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      partner_update_store: {
        Args: {
          _address: string
          _business_name: string
          _description: string
          _is_open: boolean
          _logo_url: string
          _pin: string
          _whatsapp: string
        }
        Returns: {
          access_pin: string | null
          address: string
          business_name: string
          business_type: string
          commission_percent: number | null
          created_at: string
          created_by: string | null
          custom_courier_payout: number | null
          custom_delivery_fee: number | null
          description: string
          id: string
          images: string[] | null
          is_active: boolean
          is_demo: boolean
          is_featured: boolean
          is_open: boolean
          last_payment_at: string | null
          logo_url: string | null
          owner_name: string | null
          payment_status: string
          plan: string
          promotions: string | null
          slug: string | null
          status: string
          store_status: string
          subscription_active_until: string | null
          user_id: string | null
          uses_app_courier: boolean
          visibility: string
          whatsapp: string
        }
        SetofOptions: {
          from: "*"
          to: "partner_applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      redeem_coupon: {
        Args: {
          _code: string
          _order_id: string
          _order_value: number
          _partner_id: string
          _payment_id: string
        }
        Returns: string
      }
      register_device_token: {
        Args: { _platform?: string; _token: string; _user_agent?: string }
        Returns: {
          created_at: string
          id: string
          last_seen_at: string
          platform: string
          token: string
          topic_tags: string[]
          user_agent: string | null
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "device_tokens"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reset_demo_store: { Args: never; Returns: Json }
      resolve_delivery_fee: {
        Args: { _address: string; _partner_id: string }
        Returns: {
          courier_payout: number
          fee: number
          source: string
          zone_name: string
        }[]
      }
      resolve_partner: {
        Args: { _key: string }
        Returns: {
          business_name: string
          id: string
          slug: string
        }[]
      }
      slugify: { Args: { _input: string }; Returns: string }
      submit_partner_application: {
        Args: {
          _address: string
          _business_name: string
          _business_type: string
          _description: string
          _logo_url: string
          _owner_name: string
          _uses_app_courier: boolean
          _whatsapp: string
        }
        Returns: {
          access_pin: string | null
          address: string
          business_name: string
          business_type: string
          commission_percent: number | null
          created_at: string
          created_by: string | null
          custom_courier_payout: number | null
          custom_delivery_fee: number | null
          description: string
          id: string
          images: string[] | null
          is_active: boolean
          is_demo: boolean
          is_featured: boolean
          is_open: boolean
          last_payment_at: string | null
          logo_url: string | null
          owner_name: string | null
          payment_status: string
          plan: string
          promotions: string | null
          slug: string | null
          status: string
          store_status: string
          subscription_active_until: string | null
          user_id: string | null
          uses_app_courier: boolean
          visibility: string
          whatsapp: string
        }
        SetofOptions: {
          from: "*"
          to: "partner_applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      validate_coupon: {
        Args: { _code: string; _order_value: number; _partner_id?: string }
        Returns: {
          code: string
          description: string
          discount: number
          final_value: number
          id: string
          message: string
          ok: boolean
          type: string
          value: number
        }[]
      }
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
