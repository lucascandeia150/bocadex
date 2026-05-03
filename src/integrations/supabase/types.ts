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
          changelog: string
          created_at: string
          id: string
          is_current: boolean
          version: string
        }
        Insert: {
          changelog?: string
          created_at?: string
          id?: string
          is_current?: boolean
          version: string
        }
        Update: {
          changelog?: string
          created_at?: string
          id?: string
          is_current?: boolean
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
          courier_payout: number
          created_at: string
          delivery_address: string
          delivery_code: string | null
          fee: number
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
          courier_payout?: number
          created_at?: string
          delivery_address: string
          delivery_code?: string | null
          fee?: number
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
          courier_payout?: number
          created_at?: string
          delivery_address?: string
          delivery_code?: string | null
          fee?: number
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
      partner_applications: {
        Row: {
          access_pin: string | null
          address: string
          business_name: string
          business_type: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          images: string[] | null
          is_active: boolean
          is_demo: boolean
          is_featured: boolean
          is_open: boolean
          logo_url: string | null
          owner_name: string | null
          promotions: string | null
          status: string
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
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          images?: string[] | null
          is_active?: boolean
          is_demo?: boolean
          is_featured?: boolean
          is_open?: boolean
          logo_url?: string | null
          owner_name?: string | null
          promotions?: string | null
          status?: string
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
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          images?: string[] | null
          is_active?: boolean
          is_demo?: boolean
          is_featured?: boolean
          is_open?: boolean
          logo_url?: string | null
          owner_name?: string | null
          promotions?: string | null
          status?: string
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
          id: string
          metadata: Json
          mp_payment_id: string | null
          mp_preference_id: string | null
          order_description: string
          partner_id: string | null
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
          id?: string
          metadata?: Json
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          order_description: string
          partner_id?: string | null
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
          id?: string
          metadata?: Json
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          order_description?: string
          partner_id?: string | null
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
      admin_approve_courier: {
        Args: { _application_id: string }
        Returns: {
          access_pin: string | null
          application_id: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
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
      courier_list_deliveries: {
        Args: { _pin: string }
        Returns: {
          courier_id: string
          created_at: string
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
          courier_payout: number
          created_at: string
          delivery_address: string
          delivery_code: string | null
          fee: number
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
          courier_payout: number
          created_at: string
          delivery_address: string
          delivery_code: string | null
          fee: number
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
      customer_list_orders: {
        Args: never
        Returns: {
          app_fee: number
          courier_id: string | null
          courier_payout: number
          created_at: string
          delivery_address: string
          delivery_code: string | null
          fee: number
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
      generate_access_pin: { Args: never; Returns: string }
      generate_delivery_code: { Args: never; Returns: string }
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
      partner_advance_delivery_status: {
        Args: { _delivery_id: string; _next_status: string; _pin: string }
        Returns: {
          app_fee: number
          courier_id: string | null
          courier_payout: number
          created_at: string
          delivery_address: string
          delivery_code: string | null
          fee: number
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
          courier_payout: number
          created_at: string
          delivery_address: string
          delivery_code: string | null
          fee: number
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
              courier_payout: number
              created_at: string
              delivery_address: string
              delivery_code: string | null
              fee: number
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
              courier_payout: number
              created_at: string
              delivery_address: string
              delivery_code: string | null
              fee: number
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
          created_at: string
          created_by: string | null
          description: string
          id: string
          images: string[] | null
          is_active: boolean
          is_demo: boolean
          is_featured: boolean
          is_open: boolean
          logo_url: string | null
          owner_name: string | null
          promotions: string | null
          status: string
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
      partner_list_deliveries: {
        Args: { _pin: string }
        Returns: {
          app_fee: number
          courier_id: string | null
          courier_payout: number
          created_at: string
          delivery_address: string
          delivery_code: string | null
          fee: number
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
          uses_app_courier: boolean
          whatsapp: string
        }[]
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
      partner_toggle_open: {
        Args: { _pin: string }
        Returns: {
          access_pin: string | null
          address: string
          business_name: string
          business_type: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          images: string[] | null
          is_active: boolean
          is_demo: boolean
          is_featured: boolean
          is_open: boolean
          logo_url: string | null
          owner_name: string | null
          promotions: string | null
          status: string
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
          created_at: string
          created_by: string | null
          description: string
          id: string
          images: string[] | null
          is_active: boolean
          is_demo: boolean
          is_featured: boolean
          is_open: boolean
          logo_url: string | null
          owner_name: string | null
          promotions: string | null
          status: string
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
      reset_demo_store: { Args: never; Returns: Json }
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
