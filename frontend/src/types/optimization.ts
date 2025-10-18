export interface OptimizationResultsProps {
    results?: any;
  }
  
  export interface Algorithm2Result {
    product_id?: string;
    product_name?: string;
    product_cost: number;
    suggested_selling_price: number;
    target_margin_percent: number;
    gross_margin_percent: number;
    roi_percent: number;
    market_position: string;
    pricing_method: string;
    sourcing_data_used: boolean;
    supplier_count: number;
    quantity?: number;
    meets_targets?: boolean;
    excel_calculations: {
      [key: string]: {
        [key: string]: string | string[];
      };
    };
    cost_breakdown?: {
      supplier_cost?: number;
      shipping_cost?: number;
      insurance_cost?: number;
      ieps_amount?: number;
      iva_amount?: number;
      financing_cost?: number;
      total_landed_cost?: number;
    };
  }
  
  export interface Client {
    customer_id: string;
    name?: string | null;
    company_name?: string | null;
    email?: string | null;
    phone?: string | null;
    mobile?: string | null;
    address_id?: string | null;
    is_company?: boolean | null;
    vat?: string | null;
    bank_ids_bank?: string | null;
    bank_ids_account_number?: string | null;
  }
  
  export interface Product {
    product_id: string;
    product_name?: string | null;
    msrp?: number | null;
    ieps_percent?: number | null;
    active?: string | null;
    barcode?: string | null;
    brand_id?: string | null;
    category_id?: string | null;
    cost_group?: string | null;
    height_cm?: number | null;
    inner_unit_type_id?: string | null;
    length_cm?: number | null;
    number_of_layers_per_pallet?: number | null;
    packaging_type_id?: string | null;
    pieces_per_pallet?: number | null;
    product_image?: string | null;
    relationship_level_id?: string | null;
    sellable_id?: string | null;
    size?: number | null;
    sku?: string | null;
    unit_type_id?: string | null;
    vat_percent?: number | null;
    weight_kg?: number | null;
    width_cm?: number | null;
  }
  
  export interface OrderLine {
    product_id: string;
    quantity: number;
    // Backend will populate these internally, not shown in frontend
    unit_cost?: number;
    market_price_with_taxes?: number;
    financing_days?: number;
    financing_cost?: number;
    delivery_date?: string;
    ieps_percent?: number;
    vat_percent?: number;
  }
  
  export interface QuickQuoteLine {
    product_name: string;
    quantity: number;
    supplier_unit_cost: number;
    shipping_cost?: number;
    insurance_cost?: number;
    ieps_percent?: number;
    vat_percent?: number;
    financing_days?: number;
    cost_of_capital?: number;
    client_credit_days?: number;
    target_margin_percent?: number;
    market_price?: number;
    destination?: string;
    calculated_price?: number;
  }
  