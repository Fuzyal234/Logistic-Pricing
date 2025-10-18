export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4";
  };
  public: {
    Tables: {
      address: {
        Row: {
          address_id: string;
          city: string | null;
          country: string | null;
          state: string | null;
          street: string | null;
          zip: string | null;
        };
        Insert: {
          address_id?: string;
          city?: string | null;
          country?: string | null;
          state?: string | null;
          street?: string | null;
          zip?: string | null;
        };
        Update: {
          address_id?: string;
          city?: string | null;
          country?: string | null;
          state?: string | null;
          street?: string | null;
          zip?: string | null;
        };
        Relationships: [];
      };
      customer_distribution_centers: {
        Row: {
          address_id: string | null;
          customer_id: string | null;
          distribution_center_id: string;
          distribution_center_name: string | null;
          latitude: number | null;
          logistics_zone: string | null;
          longitude: number | null;
        };
        Insert: {
          address_id?: string | null;
          customer_id?: string | null;
          distribution_center_id?: string;
          distribution_center_name?: string | null;
          latitude?: number | null;
          logistics_zone?: string | null;
          longitude?: number | null;
        };
        Update: {
          address_id?: string | null;
          customer_id?: string | null;
          distribution_center_id?: string;
          distribution_center_name?: string | null;
          latitude?: number | null;
          logistics_zone?: string | null;
          longitude?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "customer_distribution_centers_address_id_fkey";
            columns: ["address_id"];
            isOneToOne: false;
            referencedRelation: "address";
            referencedColumns: ["address_id"];
          },
          {
            foreignKeyName: "customer_distribution_centers_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["customer_id"];
          },
        ];
      };
      customers: {
        Row: {
          address_id: string | null;
          bank_ids_account_number: string | null;
          bank_ids_bank: string | null;
          company_name: string | null;
          customer_id: string;
          email: string | null;
          is_company: boolean | null;
          mobile: string | null;
          name: string | null;
          phone: string | null;
          vat: string | null;
          user_id: string | null;
        };
        Insert: {
          address_id?: string | null;
          bank_ids_account_number?: string | null;
          bank_ids_bank?: string | null;
          company_name?: string | null;
          customer_id?: string;
          email?: string | null;
          is_company?: boolean | null;
          mobile?: string | null;
          name?: string | null;
          phone?: string | null;
          vat?: string | null;
          user_id?: string | null;
        };
        Update: {
          address_id?: string | null;
          bank_ids_account_number?: string | null;
          bank_ids_bank?: string | null;
          company_name?: string | null;
          customer_id?: string;
          email?: string | null;
          is_company?: boolean | null;
          mobile?: string | null;
          name?: string | null;
          phone?: string | null;
          vat?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "customers_address_id_fkey";
            columns: ["address_id"];
            isOneToOne: false;
            referencedRelation: "address";
            referencedColumns: ["address_id"];
          },
        ];
      };
      general_pricing_rule: {
        Row: {
          id: number;
          rule_name: string;
          value: number | null;
          client: string | null;
        };
        Insert: {
          id?: number;
          rule_name: string;
          value?: number | null;
          client?: string | null;
        };
        Update: {
          id?: number;
          rule_name?: string;
          value?: number | null;
          client?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "general_pricing_rule_client_fkey";
            columns: ["client"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["customer_id"];
          },
        ];
      };
      logistics_cost_suppliers: {
        Row: {
          contact: string | null;
          email: string | null;
          logistics_supplier_id: string;
          name: string | null;
          notes: string | null;
          phone: string | null;
          rfc: string | null;
          supplier_type: string | null;
        };
        Insert: {
          contact?: string | null;
          email?: string | null;
          logistics_supplier_id?: string;
          name?: string | null;
          notes?: string | null;
          phone?: string | null;
          rfc?: string | null;
          supplier_type?: string | null;
        };
        Update: {
          contact?: string | null;
          email?: string | null;
          logistics_supplier_id?: string;
          name?: string | null;
          notes?: string | null;
          phone?: string | null;
          rfc?: string | null;
          supplier_type?: string | null;
        };
        Relationships: [];
      };
      pallets: {
        Row: {
          length_cm: number | null;
          max_height_cm: number | null;
          max_volume_cm3: number | null;
          max_weight_kg: number | null;
          pallet_id: string;
          pallet_name: string | null;
          volumetric_efficiency: number | null;
          width_cm: number | null;
        };
        Insert: {
          length_cm?: number | null;
          max_height_cm?: number | null;
          max_volume_cm3?: number | null;
          max_weight_kg?: number | null;
          pallet_id?: string;
          pallet_name?: string | null;
          volumetric_efficiency?: number | null;
          width_cm?: number | null;
        };
        Update: {
          length_cm?: number | null;
          max_height_cm?: number | null;
          max_volume_cm3?: number | null;
          max_weight_kg?: number | null;
          pallet_id?: string;
          pallet_name?: string | null;
          volumetric_efficiency?: number | null;
          width_cm?: number | null;
        };
        Relationships: [];
      };
      products: {
        Row: {
          active: string | null;
          barcode: string | null;
          brand_id: string | null;
          category_id: string | null;
          cost_group: string | null;
          height_cm: number | null;
          ieps_percent: number | null;
          inner_unit_type_id: string | null;
          length_cm: number | null;
          msrp: number | null;
          number_of_layers_per_pallet: number | null;
          packaging_type_id: string | null;
          pieces_per_pallet: number | null;
          product_id: string;
          product_image: string | null;
          product_name: string | null;
          relationship_level_id: string | null;
          sellable_id: string | null;
          size: number | null;
          sku: string | null;
          sku_principal: string | null;
          special_tax_percent: number | null;
          tags: string | null;
          units: number | null;
          units_of_measurement_id: string | null;
          units_per_layer: number | null;
          variation_theme_id: string | null;
          variation_theme_name: string | null;
          variation_theme_value_id: string | null;
          vat_percent: number | null;
          volume_cm3: number | null;
          weight_kg: number | null;
          width_cm: number | null;
        };
        Insert: {
          active?: string | null;
          barcode?: string | null;
          brand_id?: string | null;
          category_id?: string | null;
          cost_group?: string | null;
          height_cm?: number | null;
          ieps_percent?: number | null;
          inner_unit_type_id?: string | null;
          length_cm?: number | null;
          msrp?: number | null;
          number_of_layers_per_pallet?: number | null;
          packaging_type_id?: string | null;
          pieces_per_pallet?: number | null;
          product_id?: string;
          product_image?: string | null;
          product_name?: string | null;
          relationship_level_id?: string | null;
          sellable_id?: string | null;
          size?: number | null;
          sku?: string | null;
          sku_principal?: string | null;
          special_tax_percent?: number | null;
          tags?: string | null;
          units?: number | null;
          units_of_measurement_id?: string | null;
          units_per_layer?: number | null;
          variation_theme_id?: string | null;
          variation_theme_name?: string | null;
          variation_theme_value_id?: string | null;
          vat_percent?: number | null;
          volume_cm3?: number | null;
          weight_kg?: number | null;
          width_cm?: number | null;
        };
        Update: {
          active?: string | null;
          barcode?: string | null;
          brand_id?: string | null;
          category_id?: string | null;
          cost_group?: string | null;
          height_cm?: number | null;
          ieps_percent?: number | null;
          inner_unit_type_id?: string | null;
          length_cm?: number | null;
          msrp?: number | null;
          number_of_layers_per_pallet?: number | null;
          packaging_type_id?: string | null;
          pieces_per_pallet?: number | null;
          product_id?: string;
          product_image?: string | null;
          product_name?: string | null;
          relationship_level_id?: string | null;
          sellable_id?: string | null;
          size?: number | null;
          sku?: string | null;
          sku_principal?: string | null;
          special_tax_percent?: number | null;
          tags?: string | null;
          units?: number | null;
          units_of_measurement_id?: string | null;
          units_per_layer?: number | null;
          variation_theme_id?: string | null;
          variation_theme_name?: string | null;
          variation_theme_value_id?: string | null;
          vat_percent?: number | null;
          volume_cm3?: number | null;
          weight_kg?: number | null;
          width_cm?: number | null;
        };
        Relationships: [];
      };
      route_unit_quotes: {
        Row: {
          cost: number | null;
          cost_per_pallet: number | null;
          destination: string | null;
          distance_km: number | null;
          estimated_time_hrs: number | null;
          logistics_supplier_id: string;
          max_pallets: number | null;
          origin: string | null;
          route_by_region_id: string | null;
          route_id: string;
          unit_id: string;
        };
        Insert: {
          cost?: number | null;
          cost_per_pallet?: number | null;
          destination?: string | null;
          distance_km?: number | null;
          estimated_time_hrs?: number | null;
          logistics_supplier_id: string;
          max_pallets?: number | null;
          origin?: string | null;
          route_by_region_id?: string | null;
          route_id: string;
          unit_id: string;
        };
        Update: {
          cost?: number | null;
          cost_per_pallet?: number | null;
          destination?: string | null;
          distance_km?: number | null;
          estimated_time_hrs?: number | null;
          logistics_supplier_id?: string;
          max_pallets?: number | null;
          origin?: string | null;
          route_by_region_id?: string | null;
          route_id?: string;
          unit_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "route_unit_quotes_logistics_supplier_id_fkey";
            columns: ["logistics_supplier_id"];
            isOneToOne: false;
            referencedRelation: "logistics_cost_suppliers";
            referencedColumns: ["logistics_supplier_id"];
          },
          {
            foreignKeyName: "route_unit_quotes_route_by_region_id_fkey";
            columns: ["route_by_region_id"];
            isOneToOne: false;
            referencedRelation: "routes_by_regions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "route_unit_quotes_route_id_fkey";
            columns: ["route_id"];
            isOneToOne: false;
            referencedRelation: "routes";
            referencedColumns: ["route_id"];
          },
          {
            foreignKeyName: "route_unit_quotes_unit_id_fkey";
            columns: ["unit_id"];
            isOneToOne: false;
            referencedRelation: "units";
            referencedColumns: ["unit_id"];
          },
        ];
      };
      routes_by_region: {
        Row: {
          id: string;
          region_name: string;
          description: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          region_name: string;
          description?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          region_name?: string;
          description?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      routes: {
        Row: {
          distance_km: number | null;
          distribution_center_id: string | null;
          estimated_time_hrs: number | null;
          route_by_region_id: string | null;
          route_code: string | null;
          route_id: string;
          warehouse_id: string | null;
        };
        Insert: {
          distance_km?: number | null;
          distribution_center_id?: string | null;
          estimated_time_hrs?: number | null;
          route_by_region_id?: string | null;
          route_code?: string | null;
          route_id?: string;
          warehouse_id?: string | null;
        };
        Update: {
          distance_km?: number | null;
          distribution_center_id?: string | null;
          estimated_time_hrs?: number | null;
          route_by_region_id?: string | null;
          route_code?: string | null;
          route_id?: string;
          warehouse_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "routes_distribution_center_id_fkey";
            columns: ["distribution_center_id"];
            isOneToOne: false;
            referencedRelation: "customer_distribution_centers";
            referencedColumns: ["distribution_center_id"];
          },
          {
            foreignKeyName: "routes_warehouse_id_fkey";
            columns: ["warehouse_id"];
            isOneToOne: false;
            referencedRelation: "supplier_warehouses";
            referencedColumns: ["warehouse_id"];
          },
          {
            foreignKeyName: "routes_route_by_region_id_fkey";
            columns: ["route_by_region_id"];
            isOneToOne: false;
            referencedRelation: "routes_by_region";
            referencedColumns: ["id"];
          },
        ];
      };
      supplier_products: {
        Row: {
          credit_days: number | null;
          currency_id: string | null;
          customer_notes: string | null;
          incoterm_id: string | null;
          product_id: string;
          required_price: number | null;
          required_quantity: number | null;
          supplier_id: string;
          volume_discount_percent: number | null;
        };
        Insert: {
          credit_days?: number | null;
          currency_id?: string | null;
          customer_notes?: string | null;
          incoterm_id?: string | null;
          product_id: string;
          required_price?: number | null;
          required_quantity?: number | null;
          supplier_id: string;
          volume_discount_percent?: number | null;
        };
        Update: {
          credit_days?: number | null;
          currency_id?: string | null;
          customer_notes?: string | null;
          incoterm_id?: string | null;
          product_id?: string;
          required_price?: number | null;
          required_quantity?: number | null;
          supplier_id?: string;
          volume_discount_percent?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "supplier_products_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["product_id"];
          },
          {
            foreignKeyName: "supplier_products_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["supplier_id"];
          },
        ];
      };
      supplier_products_warehouse: {
        Row: {
          available_inventory: number | null;
          credit_days: number | null;
          currency_id: string | null;
          incoterm_id: string | null;
          lead_time_days: number | null;
          location_origin_id: string | null;
          moq_minimum_order_quantity: number | null;
          payment_methods: string | null;
          price: number | null;
          product_id: string;
          supplier_id: string;
          supplier_notes: string | null;
          volume_discount_percent: number | null;
          warehouse_id: string | null;
        };
        Insert: {
          available_inventory?: number | null;
          credit_days?: number | null;
          currency_id?: string | null;
          incoterm_id?: string | null;
          lead_time_days?: number | null;
          location_origin_id?: string | null;
          moq_minimum_order_quantity?: number | null;
          payment_methods?: string | null;
          price?: number | null;
          product_id: string;
          supplier_id: string;
          supplier_notes?: string | null;
          volume_discount_percent?: number | null;
          warehouse_id?: string | null;
        };
        Update: {
          available_inventory?: number | null;
          credit_days?: number | null;
          currency_id?: string | null;
          incoterm_id?: string | null;
          lead_time_days?: number | null;
          location_origin_id?: string | null;
          moq_minimum_order_quantity?: number | null;
          payment_methods?: string | null;
          price?: number | null;
          product_id?: string;
          supplier_id?: string;
          supplier_notes?: string | null;
          volume_discount_percent?: number | null;
          warehouse_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "supplier_products_warehouse_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["product_id"];
          },
          {
            foreignKeyName: "supplier_products_warehouse_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["supplier_id"];
          },
          {
            foreignKeyName: "supplier_products_warehouse_warehouse_id_fkey";
            columns: ["warehouse_id"];
            isOneToOne: false;
            referencedRelation: "supplier_warehouses";
            referencedColumns: ["warehouse_id"];
          },
        ];
      };
      supplier_warehouses: {
        Row: {
          address: string | null;
          city: string | null;
          country: string | null;
          latitude: number | null;
          logistics_zone: string | null;
          longitude: number | null;
          postal_code: string | null;
          state: string | null;
          supplier_id: string | null;
          supplier_name: string | null;
          warehouse_id: string;
          warehouse_name: string | null;
        };
        Insert: {
          address?: string | null;
          city?: string | null;
          country?: string | null;
          latitude?: number | null;
          logistics_zone?: string | null;
          longitude?: number | null;
          postal_code?: string | null;
          state?: string | null;
          supplier_id?: string | null;
          supplier_name?: string | null;
          warehouse_id: string;
          warehouse_name?: string | null;
        };
        Update: {
          address?: string | null;
          city?: string | null;
          country?: string | null;
          latitude?: number | null;
          logistics_zone?: string | null;
          longitude?: number | null;
          postal_code?: string | null;
          state?: string | null;
          supplier_id?: string | null;
          supplier_name?: string | null;
          warehouse_id?: string;
          warehouse_name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "supplier_warehouses_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["supplier_id"];
          },
        ];
      };
      suppliers: {
        Row: {
          address_id: string | null;
          bank_ids_account_number: string | null;
          bank_ids_bank: string | null;
          company_name: string | null;
          email: string | null;
          is_company: number | null;
          mobile: string | null;
          name: string | null;
          phone: string | null;
          supplier_id: string;
          vat: string | null;
        };
        Insert: {
          address_id?: string | null;
          bank_ids_account_number?: string | null;
          bank_ids_bank?: string | null;
          company_name?: string | null;
          email?: string | null;
          is_company?: number | null;
          mobile?: string | null;
          name?: string | null;
          phone?: string | null;
          supplier_id?: string;
          vat?: string | null;
        };
        Update: {
          address_id?: string | null;
          bank_ids_account_number?: string | null;
          bank_ids_bank?: string | null;
          company_name?: string | null;
          email?: string | null;
          is_company?: number | null;
          mobile?: string | null;
          name?: string | null;
          phone?: string | null;
          supplier_id?: string;
          vat?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "suppliers_address_id_fkey";
            columns: ["address_id"];
            isOneToOne: false;
            referencedRelation: "address";
            referencedColumns: ["address_id"];
          },
        ];
      };
      units: {
        Row: {
          max_volume_m3: number | null;
          max_weight_kg: number | null;
          max_pallets: number | null;
          unit: string | null;
          unit_id: string;
        };
        Insert: {
          max_volume_m3?: number | null;
          max_weight_kg?: number | null;
          max_pallets?: number | null;
          unit?: string | null;
          unit_id?: string;
        };
        Update: {
          max_volume_m3?: number | null;
          max_weight_kg?: number | null;
          max_pallets?: number | null;
          unit?: string | null;
          unit_id?: string;
        };
        Relationships: [];
      };
      enum_values: {
        Row: {
          id: string;
          enum_type: string;
          value: string;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          enum_type: string;
          value: string;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          enum_type?: string;
          value?: string;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      location_origins: {
        Row: {
          id: string;
          value: string;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          value: string;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          value?: string;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      relationship_levels: {
        Row: {
          id: string;
          value: string;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          value: string;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          value?: string;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      variation_themes: {
        Row: {
          id: string;
          value: string;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          value: string;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          value?: string;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      brands: {
        Row: {
          id: string;
          value: string;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          value: string;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          value?: string;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          value: string;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          value: string;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          value?: string;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      variation_theme_values: {
        Row: {
          id: string;
          value: string;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          value: string;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          value?: string;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      units_of_measurements: {
        Row: {
          id: string;
          value: string;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          value: string;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          value?: string;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      packaging_types: {
        Row: {
          id: string;
          value: string;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          value: string;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          value?: string;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      inner_unit_types: {
        Row: {
          id: string;
          value: string;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          value: string;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          value?: string;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sellable_options: {
        Row: {
          id: string;
          value: string;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          value: string;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          value?: string;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      currencies: {
        Row: {
          id: string;
          value: string;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          value: string;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          value?: string;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      incoterms: {
        Row: {
          id: string;
          value: string;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          value: string;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          value?: string;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      brand:
        | "NEW MIX"
        | "Maruchan"
        | "Barrilito"
        | "Bud Light"
        | "Corona"
        | "Michelob"
        | "Modelo"
        | "Stella"
        | "Victoria"
        | "Estrella"
        | "Vicky"
        | "ZYN"
        | "Bacardi"
        | "Nuun"
        | "Marlboro"
        | "Diageo"
        | "Nestle"
        | "Centenario"
        | "Costenia"
        | "Herdez";
      category: "Alcoholic Beverages" | "Tobacco" | "Groceries" | "Paper" | "Energy Drinks";
      currency: "MXN" | "USD";
      incoterm:
        | "EXW–Ex Works"
        | "FCA – Free Carrier"
        | "FAS – Free Alongside Ship"
        | "FOB – Free On Board"
        | "CFR – Cost and Freight"
        | "CIF – Cost, Insurance and Freight"
        | "CPT – Carriage Paid To"
        | "CIP – Carriage and Insurance Paid To"
        | "DAP – Delivered at Place"
        | "DPU – Delivered at Place Unloaded"
        | "DDP – Delivered Duty Paid";
      inner_unit_type_enum: "Latas" | "Botellas" | "Cajas" | "Tubos" | "Piezas";
      packaging_type: "Box" | "Unit";
      relationship_level: "Primary" | "Secondary";
      sellable: "Yes" | "No";
      units_of_measurement: "ml" | "cm" | "kg" | "L" | "dm" | "g" | "pills";
      variation_theme: "Flavor" | "Size" | "Packaging quantity";
      variation_theme_value: "Vampiro" | "Paloma" | "Original";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Enum Management Types
export interface EnumValue {
  id: string;
  value: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EnumTable {
  table_name: string;
  display_name: string;
  description: string;
}

export interface EnumManagementView {
  table_name: string;
  value: string;
  display_order: number;
  is_active: boolean;
}
