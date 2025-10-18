import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Package,
  Calculator,
  Target,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { APP_CONFIG } from "@/config/app.config";
import { supabase } from "@/integrations/supabase/client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import GeneralPricingRules from "./GeneralPricingRules";
// Simplified interfaces
interface Product {
  product_id: string;
  product_name: string | null;
}

interface Customer {
  customer_id: string;
  name: string | null;
}

interface PricingRule {
  id: number;
  rule_name: string;
  value: number | null;
  client: string | null;
}

interface SimplifiedPricingRequest {
  product_id: string;
  customer_id: string;
  distribution_center_uuid: string;
  sku: string;
  quantity: number;
  market_price: number;
  gross_profit_margin_by_client: number;
  price_solicited_by_client: number;
  actual_final_sale_price_without_tax: number;
  supplier_cost: number;
  ieps_cost: number;
  iva_cost: number;
  inventory_rotation_days: number;

  // Variable Costs Type 1 .
  variable_costs_type_1_shipping_cost: number;
  variable_costs_type_1_shipping_tax_percentage: number;
  variable_costs_type_1_markup_rule: string;
  variable_costs_type_1_markup_type: string;
  variable_costs_type_1_cashflow: boolean;

  // Variable Costs Type 2
  variable_costs_type_2_handling_cost: number;
  variable_costs_type_2_handling_tax_percentage: number;
  variable_costs_type_2_handling_markup_rule: string;
  variable_costs_type_2_handling_markup_type: string;
  variable_costs_type_2_handling_cashflow: boolean;
  variable_costs_type_2_intercedis: number;
  variable_costs_type_2_intercedis_tax_percentage: number;
  variable_costs_type_2_intercedis_markup_rule: string;
  variable_costs_type_2_intercedis_markup_type: string;
  variable_costs_type_2_intercedis_cashflow: boolean;

  // Variable Costs Type 3
  variable_costs_type_3_commission_percentage: number;
  variable_costs_type_3_commission_tax_percentage: number;
  variable_costs_type_3_commission_markup_rule: string;
  variable_costs_type_3_commission_markup_type: string;

  // Variable Costs Type 4
  variable_costs_type_4_logistics_fee_percentage: number;
  variable_costs_type_4_logistics_fee_tax_percentage: number;
  variable_costs_type_4_logistics_fee_markup_rule: string;
  variable_costs_type_4_logistics_fee_markup_type: string;

  // Variable Costs Type 5
  variable_costs_type_5_insurance_percentage: number;
  variable_costs_type_5_insurance_tax_percentage: number;
  variable_costs_type_5_insurance_markup_rule: string;
  variable_costs_type_5_insurance_markup_type: string;
  variable_costs_type_5_insurance_cashflow: boolean;

  // Other business params
  units_to_sell_per_month: number;
  monthly_fix_cost_percentage: number;
  financing_days: number;
  annual_cost_of_capital_percentage: number;
}

interface SimplifiedPricingResponse {
  success: boolean;
  processing_time_seconds: number;
  data?: Array<{
    product_sku: string;
    price_to_give_to_client_to_achieve_gross_profit_margin: number;
    product_cost_needed_from_supplier_given_market_price: number;
    product_cost_needed_from_supplier_given_client_solicited_price: number;
    gross_profit_margin_needed: number;
    variable_costs_type_1_shipping_cost_tax: number;
    variable_costs_type_2_handling_cost_tax: number;
    variable_costs_type_2_intercedis_tax: number;
    variable_costs_type_3_commission: number;
    variable_costs_type_3_tax: number;
    variable_costs_type_4_logistics_fee: number;
    variable_costs_type_4_logistics_fee_tax: number;
    variable_costs_type_5_insurance: number;
    variable_costs_type_5_insurance_tax: number;
    total_variable_costs_landed_costs_type_1: number;
    landed_costs_for_calculation_of_other_variable_costs: number;
    total_variable_costs_landed_costs_type_1_5: number;
    total_landed_cost_for_margin_calculation: number;
    total_pass_through_fixed_cost_type_2: number;
    total_percentage_variable_costs_on_price: number;
    total_variable_costs_3_4: number;
    total_variable_costs_3_4_actual_sale_price: number;
    total_landed_cost_all_variable_costs_suggested_price: number;
    total_landed_costs_actual_sales_price: number;
    ucm_actual_sale_price: number;
    monthly_break_even_units: number;
    monthly_target_units: number;
    required_price_with_projected_units_plus_financing_minus_price_per_unit: number;
    total_projected_monthly_sales: number;
    contribution_margin: number;
    ieps_paid: number;
    product_cost_with_ieps: number;
    iva_paid: number;
    product_cost_with_taxes: number;
    total_cash_flow_variable_costs: number;
    total_cash_flow: number;
    financing_cost: number;
    suggested_base_sale_price: number;
    suggested_price_to_client_financial_breakdown_ieps: number;
    suggested_price_to_client_financial_breakdown_iva: number;
    suggested_price_to_client_financial_breakdown_total_price_with_taxes: number;
    suggested_price_to_client_financial_breakdown_profit: number;
    suggested_price_to_client_financial_breakdown_total_gross_profit_margin: number;
    suggested_price_to_client_financial_breakdown_real_gross_profit_margin_without_financing: number;
    suggested_price_to_client_financial_breakdown_total_ieps_paid: number;
    suggested_price_to_client_financial_breakdown_total_iva_paid: number;
    suggested_price_to_client_financial_breakdown_base_price_with_discount_applied: number;
    suggested_price_to_client_financial_breakdown_ieps_to_pay: number;
    suggested_price_to_client_financial_breakdown_iva_to_pay: number;
    suggested_price_to_client_financial_breakdown_final_ieps_to_pay: number;
    suggested_price_to_client_financial_breakdown_final_iva_to_pay: number;
    suggested_price_to_client_financial_breakdown_total_final_cashflow_received: number;
    suggested_price_to_client_financial_breakdown_total_irr: number;
    suggested_price_to_client_financial_breakdown_cashflow_received_only_financing: number;
    suggested_price_to_client_financial_breakdown_irr_only_financing: number;
    actual_price_to_client_financial_breakdown_actual_final_sale_price: number;
    actual_price_to_client_financial_breakdown_ieps: number;
    actual_price_to_client_financial_breakdown_iva: number;
    actual_price_to_client_financial_breakdown_total_price_with_taxes: number;
    actual_price_to_client_financial_breakdown_profit: number;
    actual_price_to_client_financial_breakdown_total_gross_profit_margin: number;
    actual_price_to_client_financial_breakdown_real_gross_profit_margin_without_financing: number;
    actual_price_to_client_financial_breakdown_total_ieps_payed: number;
    actual_price_to_client_financial_breakdown_total_iva_paid: number;
    actual_price_to_client_financial_breakdown_base_price_with_discounts_applied: number;
    actual_price_to_client_financial_breakdown_ieps_to_pay: number;
    actual_price_to_client_financial_breakdown_iva_to_pay: number;
    actual_price_to_client_financial_breakdown_final_ieps_to_pay: number;
    actual_price_to_client_financial_breakdown_final_iva_to_pay: number;
    actual_price_to_client_financial_breakdown_total_final_cashflow_received: number;
    actual_price_to_client_financial_breakdown_total_irr: number;
    actual_price_to_client_financial_breakdown_cashflow_received_only_financing: number;
    actual_price_to_client_financial_breakdown_irr_only_financing: number;
    suggested_price_financials_suggested_sale_price_without_taxes: number;
    suggested_price_financials_suggested_sale_price_with_taxes: number;
    suggested_price_financials_suggested_price_profit: number;
    suggested_price_financials_total_gross_profit_margin_suggested_price: number;
    suggested_price_financials_real_gross_profit_margin_without_financing_suggested_price: number;
    suggested_price_financials_total_irr: number;
    suggested_price_financials_irr_financing: number;
    final_sales_price_financials_actual_final_sale_price: number;
    final_sales_price_financials_actual_final_sale_price_with_taxes: number;
    final_sales_price_financials_profit: number;
    final_sales_price_financials_total_gross_profit_margin: number;
    final_sales_price_financials_real_gross_profit_margin_without_financing: number;
    final_sales_price_financials_monthly_gross_profit: number;
    final_sales_price_financials_total_irr: number;
    final_sales_price_financials_irr_financing: number;
    price_and_supplier_cost_comparisons_market_price: number;
    price_and_supplier_cost_comparisons_gross_profit_margin_wanted_by_client: number;
    price_and_supplier_cost_comparisons_ideal_price_to_client_given_market_price: number;
    price_and_supplier_cost_comparisons_product_cost_needed_from_supplier_given_market_price: number;
    price_and_supplier_cost_comparisons_price_solicited_by_client: number;
    price_and_supplier_cost_comparisons_product_cost_needed_from_supplier_given_client_solicited_price: number;
  }>;
  timestamp: string;
}

// Helper function to format markup rule and type values for display
const formatMarkupValue = (value: string): string => {
  const formatMap: { [key: string]: string } = {
    landed_cost: "Landed Cost",
    fixed_variable: "Fixed Variable",
    passthrough: "Passthrough",
    vc_pct: "VC_pct",
    vc_disc: "VC_disc",
    vc_pct_cost: "VC_pct_cost",
  };
  return formatMap[value] || value;
};

const SimplifiedPricing = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingRules, setLoadingRules] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<SimplifiedPricingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [formData, setFormData] = useState<SimplifiedPricingRequest>({
    product_id: "",
    customer_id: "",
    distribution_center_uuid: "",
    sku: "",
    quantity: 1,
    market_price: 0,
    gross_profit_margin_by_client: 0,
    price_solicited_by_client: 0,
    actual_final_sale_price_without_tax: 0,
    supplier_cost: 0,
    ieps_cost: 0,
    iva_cost: 0,
    inventory_rotation_days: 0,

    variable_costs_type_1_shipping_cost: 0,
    variable_costs_type_1_shipping_tax_percentage: 0,
    variable_costs_type_1_markup_rule: "landed_cost",
    variable_costs_type_1_markup_type: "fixed_variable",
    variable_costs_type_1_cashflow: true,

    variable_costs_type_2_handling_cost: 0,
    variable_costs_type_2_handling_tax_percentage: 0,
    variable_costs_type_2_handling_markup_rule: "passthrough",
    variable_costs_type_2_handling_markup_type: "fixed_variable",
    variable_costs_type_2_handling_cashflow: true,
    variable_costs_type_2_intercedis: 0,
    variable_costs_type_2_intercedis_tax_percentage: 0,
    variable_costs_type_2_intercedis_markup_rule: "passthrough",
    variable_costs_type_2_intercedis_markup_type: "fixed_variable",
    variable_costs_type_2_intercedis_cashflow: true,

    variable_costs_type_3_commission_percentage: 0,
    variable_costs_type_3_commission_tax_percentage: 0,
    variable_costs_type_3_commission_markup_rule: "passthrough",
    variable_costs_type_3_commission_markup_type: "vc_pct",

    variable_costs_type_4_logistics_fee_percentage: 0,
    variable_costs_type_4_logistics_fee_tax_percentage: 0,
    variable_costs_type_4_logistics_fee_markup_rule: "passthrough",
    variable_costs_type_4_logistics_fee_markup_type: "vc_disc",

    variable_costs_type_5_insurance_percentage: 0,
    variable_costs_type_5_insurance_tax_percentage: 0,
    variable_costs_type_5_insurance_markup_rule: "landed_cost",
    variable_costs_type_5_insurance_markup_type: "vc_pct_cost",
    variable_costs_type_5_insurance_cashflow: true,

    units_to_sell_per_month: 0,
    monthly_fix_cost_percentage: 0,
    financing_days: 0,
    annual_cost_of_capital_percentage: 0,
  });

  useEffect(() => {
    loadProducts();
    loadCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomerId && selectedCustomerId !== "__none__") {
      loadPricingRules(selectedCustomerId);
    } else if (selectedCustomerId === "__none__") {
      setPricingRules([]);
      // Reset form to default values
      setFormData({
        product_id: formData.product_id,
        customer_id: formData.customer_id,
        distribution_center_uuid: formData.distribution_center_uuid,
        sku: formData.sku,
        quantity: formData.quantity || 1,
        market_price: 0,
        gross_profit_margin_by_client: 0,
        price_solicited_by_client: 0,
        actual_final_sale_price_without_tax: 0,
        supplier_cost: formData.supplier_cost,
        ieps_cost: 0,
        iva_cost: 0,
        inventory_rotation_days: 0,
        variable_costs_type_1_shipping_cost: 0,
        variable_costs_type_1_shipping_tax_percentage: 0,
        variable_costs_type_1_markup_rule: "landed_cost",
        variable_costs_type_1_markup_type: "fixed_variable",
        variable_costs_type_1_cashflow: true,
        variable_costs_type_2_handling_cost: 0,
        variable_costs_type_2_handling_tax_percentage: 0,
        variable_costs_type_2_handling_markup_rule: "passthrough",
        variable_costs_type_2_handling_markup_type: "fixed_variable",
        variable_costs_type_2_handling_cashflow: true,
        variable_costs_type_2_intercedis: 0,
        variable_costs_type_2_intercedis_tax_percentage: 0,
        variable_costs_type_2_intercedis_markup_rule: "passthrough",
        variable_costs_type_2_intercedis_markup_type: "fixed_variable",
        variable_costs_type_2_intercedis_cashflow: true,
        variable_costs_type_3_commission_percentage: 0,
        variable_costs_type_3_commission_tax_percentage: 0,
        variable_costs_type_3_commission_markup_rule: "passthrough",
        variable_costs_type_3_commission_markup_type: "vc_pct",
        variable_costs_type_4_logistics_fee_percentage: 0,
        variable_costs_type_4_logistics_fee_tax_percentage: 0,
        variable_costs_type_4_logistics_fee_markup_rule: "passthrough",
        variable_costs_type_4_logistics_fee_markup_type: "vc_disc",
        variable_costs_type_5_insurance_percentage: 0,
        variable_costs_type_5_insurance_tax_percentage: 0,
        variable_costs_type_5_insurance_markup_rule: "landed_cost",
        variable_costs_type_5_insurance_markup_type: "vc_pct_cost",
        variable_costs_type_5_insurance_cashflow: true,
        units_to_sell_per_month: 0,
        monthly_fix_cost_percentage: 0,
        financing_days: 0,
        annual_cost_of_capital_percentage: 0,
      });
      toast.info("Pricing rules cleared. Using default values.");
    }
  }, [selectedCustomerId]);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("product_id, product_name")
        .order("product_name")
        .limit(50);

      if (error) {
        throw error;
      }

      setProducts(data || []);
    } catch (error) {
      console.error("Error loading products:", error);
      toast.error("Failed to load products from database.");
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase.from("customers").select("customer_id, name").order("name").limit(100);

      if (error) {
        throw error;
      }

      setCustomers(data || []);
    } catch (error) {
      console.error("Error loading customers:", error);
      toast.error("Failed to load customers from database.");
    } finally {
      setLoadingCustomers(false);
    }
  };

  const loadPricingRules = async (customerId: string) => {
    setLoadingRules(true);
    try {
      // Load both client-specific rules and default rules (where client is null)
      const { data, error } = await supabase
        .from("general_pricing_rule")
        .select("*")
        .or(`client.eq.${customerId},client.is.null`);

      if (error) {
        throw error;
      }

      setPricingRules(data || []);
      applyPricingRules(data || [], customerId);
      toast.success("Pricing rules loaded successfully");
    } catch (error) {
      console.error("Error loading pricing rules:", error);
      toast.error("Failed to load pricing rules.");
    } finally {
      setLoadingRules(false);
    }
  };

  // Helper function to get rule value with client-specific priority
  const getRuleValue = (rules: PricingRule[], ruleName: string, customerId: string): number | null => {
    // First, try to find client-specific rule
    const clientRule = rules.find((rule) => rule.rule_name === ruleName && rule.client === customerId);
    if (clientRule && clientRule.value !== null) {
      return clientRule.value;
    }

    // Fall back to default rule (where client is null)
    const defaultRule = rules.find((rule) => rule.rule_name === ruleName && rule.client === null);
    if (defaultRule && defaultRule.value !== null) {
      return defaultRule.value;
    }

    return null;
  };

  const applyPricingRules = (rules: PricingRule[], customerId: string) => {
    // Define mapping between rule names and form fields
    const ruleMapping: Record<string, keyof SimplifiedPricingRequest> = {
      ieps_cost: "ieps_cost",
      iva_cost: "iva_cost",
      inventory_rotation_days: "inventory_rotation_days",
      shipping_cost: "variable_costs_type_1_shipping_cost",
      shipping_tax_percentage: "variable_costs_type_1_shipping_tax_percentage",
      handling_cost: "variable_costs_type_2_handling_cost",
      handling_tax_percentage: "variable_costs_type_2_handling_tax_percentage",
      intercedis: "variable_costs_type_2_intercedis",
      intercedis_tax_percentage: "variable_costs_type_2_intercedis_tax_percentage",
      commission_percentage: "variable_costs_type_3_commission_percentage",
      commission_tax_percentage: "variable_costs_type_3_commission_tax_percentage",
      logistics_fee_percentage: "variable_costs_type_4_logistics_fee_percentage",
      logistics_fee_tax_percentage: "variable_costs_type_4_logistics_fee_tax_percentage",
      insurance_percentage: "variable_costs_type_5_insurance_percentage",
      insurance_tax_percentage: "variable_costs_type_5_insurance_tax_percentage",
      units_to_sell_per_month: "units_to_sell_per_month",
      monthly_fix_cost_percentage: "monthly_fix_cost_percentage",
      financing_days: "financing_days",
      annual_cost_of_capital_percentage: "annual_cost_of_capital_percentage",
      gross_profit_margin: "gross_profit_margin_by_client",
    };

    const updatedFormData = { ...formData };

    // Apply rules to form data
    Object.entries(ruleMapping).forEach(([ruleName, fieldName]) => {
      const value = getRuleValue(rules, ruleName, customerId);
      if (value !== null) {
        // @ts-ignore - we know the field exists
        updatedFormData[fieldName] = value;
      }
    });

    setFormData(updatedFormData);
  };

  const handleInputChange = (field: keyof SimplifiedPricingRequest, value: string | number | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value === "" ? 0 : value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.product_id) {
      toast.error("Please select a product");
      return false;
    }

    if (!formData.customer_id) {
      toast.error("Please select a customer");
      return false;
    }

    if (!formData.supplier_cost || formData.supplier_cost <= 0) {
      toast.error("Supplier cost must be greater than 0");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setCalculating(true);
    setError(null);
    setResult(null);

    try {
      // Transform the form data to match API expectations
      const apiPayload = {
        products_list: [formData],
        customer_id: formData.customer_id,
      };

      const response = await fetch(`${APP_CONFIG.API.BASE_URL}${APP_CONFIG.API.ENDPOINTS.COMPREHENSIVE_PRICING}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiPayload),
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      if (response.ok) {
        const data = await response.json();
        console.log("Response data:", data);
        setResult(data);
        setShowResults(true);
        toast.success(`Pricing calculated in ${data.processing_time_seconds?.toFixed(2) || "0.00"}s`);
      } else {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { detail: errorText || "Unknown error" };
        }
        throw new Error(errorData.detail || "Pricing calculation failed");
      }
    } catch (error) {
      console.error("Request error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setCalculating(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

  const formatPercentage = (percent: number) => `${(percent * 100).toFixed(1)}%`;

  const getMarginColor = (margin: number) => {
    if (margin >= 0.2) return "text-green-600 bg-green-50";
    if (margin >= 0.1) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getProfitabilityIcon = (isProfitable: boolean) => {
    return isProfitable ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <XCircle className="h-5 w-5 text-red-600" />
    );
  };

  const handleBackToInput = () => {
    setShowResults(false);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {!showResults ? (
          // Input Form View
          <div className="grid grid-cols-1 gap-8">
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-blue-50">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Calculator className="h-6 w-6" />
                  Pricing Inputs
                </CardTitle>
                <CardDescription>Enter your product and cost information</CardDescription>
              </CardHeader>

              <CardContent className="p-6">
                {/* Client Rules Section */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Client Rules</h3>
                    <p className="text-sm text-gray-600">
                      Select a customer to load their pricing rules or manage rules
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/general-pricing-rules")}
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Manage Rules
                  </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Product Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="product" className="text-sm font-medium">
                      Product *
                    </Label>
                    {loadingProducts ? (
                      <div className="flex items-center space-x-2 p-3 border rounded-md">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Loading products...</span>
                      </div>
                    ) : (
                      <Select
                        value={formData.product_id}
                        onValueChange={(value) => handleInputChange("product_id", value)}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select a product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.product_id} value={product.product_id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{product.product_name ?? "Unnamed Product"}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Customer Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="customer" className="text-sm font-medium">
                      Customer *
                    </Label>
                    {loadingCustomers ? (
                      <div className="flex items-center space-x-2 p-3 border rounded-md">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Loading customers...</span>
                      </div>
                    ) : (
                      <Select
                        value={formData.customer_id || ""}
                        onValueChange={(value) => handleInputChange("customer_id", value)}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.customer_id} value={customer.customer_id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{customer.name ?? "Unnamed Customer"}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Core Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity" className="text-sm font-medium">
                        Quantity
                      </Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="0"
                        value={formData.quantity || ""}
                        onChange={(e) => handleInputChange("quantity", parseInt(e.target.value))}
                        placeholder="0"
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="supplier_cost" className="text-sm font-medium">
                        Supplier Cost *
                      </Label>
                      <Input
                        id="supplier_cost"
                        type="number"
                        step="0.01"
                        value={formData.supplier_cost || ""}
                        onChange={(e) => handleInputChange("supplier_cost", parseFloat(e.target.value))}
                        placeholder="0.00"
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="market_price" className="text-sm font-medium">
                        Market Price
                      </Label>
                      <Input
                        id="market_price"
                        type="number"
                        step="0.01"
                        value={formData.market_price || ""}
                        onChange={(e) => handleInputChange("market_price", parseFloat(e.target.value))}
                        placeholder="0.00"
                        className="h-11"
                      />
                    </div>
                  </div>

                  {/* Pricing Targets */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gross_profit_margin_by_client" className="text-sm font-medium">
                        Gross Profit Target Margin %
                      </Label>
                      <Input
                        id="gross_profit_margin_by_client"
                        type="number"
                        step="0.1"
                        value={formData.gross_profit_margin_by_client || ""}
                        onChange={(e) => handleInputChange("gross_profit_margin_by_client", parseFloat(e.target.value))}
                        placeholder="0.0"
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price_solicited_by_client" className="text-sm font-medium">
                        Price Solicited by Client
                      </Label>
                      <Input
                        id="price_solicited_by_client"
                        type="number"
                        step="0.01"
                        value={formData.price_solicited_by_client || ""}
                        onChange={(e) => handleInputChange("price_solicited_by_client", parseFloat(e.target.value))}
                        placeholder="0.00"
                        className="h-11"
                      />
                    </div>
                  </div>

                  {/* Actual Final Sale Price */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="actual_final_sale_price_without_tax" className="text-sm font-medium">
                        Actual Final Sale Price (without tax)
                      </Label>
                      <Input
                        id="actual_final_sale_price_without_tax"
                        type="number"
                        step="0.01"
                        value={formData.actual_final_sale_price_without_tax || ""}
                        onChange={(e) =>
                          handleInputChange("actual_final_sale_price_without_tax", parseFloat(e.target.value))
                        }
                        placeholder="0.00"
                        className="h-11"
                      />
                    </div>
                  </div>

                  {/* Tax Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ieps_cost" className="text-sm font-medium">
                        IEPS %
                      </Label>
                      <Input
                        id="ieps_cost"
                        type="number"
                        step="0.1"
                        value={formData.ieps_cost || ""}
                        onChange={(e) => handleInputChange("ieps_cost", parseFloat(e.target.value))}
                        placeholder="0.0"
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="iva_cost" className="text-sm font-medium">
                        IVA %
                      </Label>
                      <Input
                        id="iva_cost"
                        type="number"
                        step="0.1"
                        value={formData.iva_cost || ""}
                        onChange={(e) => handleInputChange("iva_cost", parseFloat(e.target.value))}
                        placeholder="0.0"
                        className="h-11"
                      />
                    </div>
                  </div>

                  {/* Business Parameters */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="inventory_rotation_days" className="text-sm font-medium">
                        Inventory Days
                      </Label>
                      <Input
                        id="inventory_rotation_days"
                        type="number"
                        min="1"
                        value={formData.inventory_rotation_days || ""}
                        onChange={(e) => handleInputChange("inventory_rotation_days", parseFloat(e.target.value))}
                        placeholder="0"
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="financing_days" className="text-sm font-medium">
                        Financing Days
                      </Label>
                      <Input
                        id="financing_days"
                        type="number"
                        min="0"
                        value={formData.financing_days || ""}
                        onChange={(e) => handleInputChange("financing_days", parseFloat(e.target.value))}
                        placeholder="30"
                        className="h-11"
                      />
                    </div>
                  </div>

                  {/* Sales Parameters */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="units_to_sell_per_month" className="text-sm font-medium">
                        Units to Sell Per Month
                      </Label>
                      <Input
                        id="units_to_sell_per_month"
                        type="number"
                        min="0"
                        value={formData.units_to_sell_per_month || ""}
                        onChange={(e) => handleInputChange("units_to_sell_per_month", parseFloat(e.target.value))}
                        placeholder="0"
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="monthly_fix_cost_percentage" className="text-sm font-medium">
                        Monthly Fixed Cost %
                      </Label>
                      <Input
                        id="monthly_fix_cost_percentage"
                        type="number"
                        step="0.1"
                        value={formData.monthly_fix_cost_percentage || ""}
                        onChange={(e) => handleInputChange("monthly_fix_cost_percentage", parseFloat(e.target.value))}
                        placeholder="0.0"
                        className="h-11"
                      />
                    </div>
                  </div>

                  {/* Financial Parameters */}
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="annual_cost_of_capital_percentage" className="text-sm font-medium">
                        Annual Cost of Capital %
                      </Label>
                      <Input
                        id="annual_cost_of_capital_percentage"
                        type="number"
                        step="0.1"
                        value={formData.annual_cost_of_capital_percentage || ""}
                        onChange={(e) =>
                          handleInputChange("annual_cost_of_capital_percentage", parseFloat(e.target.value))
                        }
                        placeholder="0.0"
                        className="h-11"
                      />
                    </div>
                  </div>

                  {/* Variable Costs - Organized in Accordions */}
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="type1">
                      <AccordionTrigger>Variable Costs Type 1 - Shipping</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="t1_ship_cost">Shipping Cost</Label>
                            <Input
                              id="t1_ship_cost"
                              type="number"
                              step="0.01"
                              value={formData.variable_costs_type_1_shipping_cost || ""}
                              onChange={(e) =>
                                handleInputChange("variable_costs_type_1_shipping_cost", parseFloat(e.target.value))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="t1_ship_tax">Shipping Tax %</Label>
                            <Input
                              id="t1_ship_tax"
                              type="number"
                              step="0.1"
                              value={formData.variable_costs_type_1_shipping_tax_percentage || ""}
                              onChange={(e) =>
                                handleInputChange(
                                  "variable_costs_type_1_shipping_tax_percentage",
                                  parseFloat(e.target.value),
                                )
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Markup Rule</Label>
                            <Input
                              type="text"
                              value={formatMarkupValue(formData.variable_costs_type_1_markup_rule)}
                              readOnly
                              className="cursor-default"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Markup Type</Label>
                            <Input
                              type="text"
                              value={formatMarkupValue(formData.variable_costs_type_1_markup_type)}
                              readOnly
                              className="cursor-default"
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label>Affects Cashflow?</Label>
                            <div className="flex gap-3">
                              <Button
                                type="button"
                                variant={formData.variable_costs_type_1_cashflow ? "default" : "secondary"}
                                onClick={() => handleInputChange("variable_costs_type_1_cashflow", true)}
                              >
                                Yes
                              </Button>
                              <Button
                                type="button"
                                variant={!formData.variable_costs_type_1_cashflow ? "default" : "secondary"}
                                onClick={() => handleInputChange("variable_costs_type_1_cashflow", false)}
                              >
                                No
                              </Button>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="type2">
                      <AccordionTrigger>Variable Costs Type 2 - Handling & Intercedis</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Handling Cost</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={formData.variable_costs_type_2_handling_cost || ""}
                              onChange={(e) =>
                                handleInputChange("variable_costs_type_2_handling_cost", parseFloat(e.target.value))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Handling Tax %</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={formData.variable_costs_type_2_handling_tax_percentage || ""}
                              onChange={(e) =>
                                handleInputChange(
                                  "variable_costs_type_2_handling_tax_percentage",
                                  parseFloat(e.target.value),
                                )
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Handling Markup Rule</Label>
                            <Input
                              type="text"
                              value={formatMarkupValue(formData.variable_costs_type_2_handling_markup_rule)}
                              readOnly
                              className="cursor-default"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Handling Markup Type</Label>
                            <Input
                              type="text"
                              value={formatMarkupValue(formData.variable_costs_type_2_handling_markup_type)}
                              readOnly
                              className="cursor-default"
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label>Handling affects Cashflow?</Label>
                            <div className="flex gap-3">
                              <Button
                                type="button"
                                variant={formData.variable_costs_type_2_handling_cashflow ? "default" : "secondary"}
                                onClick={() => handleInputChange("variable_costs_type_2_handling_cashflow", true)}
                              >
                                Yes
                              </Button>
                              <Button
                                type="button"
                                variant={!formData.variable_costs_type_2_handling_cashflow ? "default" : "secondary"}
                                onClick={() => handleInputChange("variable_costs_type_2_handling_cashflow", false)}
                              >
                                No
                              </Button>
                            </div>
                          </div>
                          <Separator className="md:col-span-2" />
                          <div className="space-y-2">
                            <Label>Intercedis</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={formData.variable_costs_type_2_intercedis || ""}
                              onChange={(e) =>
                                handleInputChange("variable_costs_type_2_intercedis", parseFloat(e.target.value))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Intercedis Tax %</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={formData.variable_costs_type_2_intercedis_tax_percentage || ""}
                              onChange={(e) =>
                                handleInputChange(
                                  "variable_costs_type_2_intercedis_tax_percentage",
                                  parseFloat(e.target.value),
                                )
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Intercedis Markup Rule</Label>
                            <Input
                              type="text"
                              value={formatMarkupValue(formData.variable_costs_type_2_intercedis_markup_rule)}
                              readOnly
                              className="cursor-default"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Intercedis Markup Type</Label>
                            <Input
                              type="text"
                              value={formatMarkupValue(formData.variable_costs_type_2_intercedis_markup_type)}
                              readOnly
                              className="cursor-default"
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label>Intercedis affects Cashflow?</Label>
                            <div className="flex gap-3">
                              <Button
                                type="button"
                                variant={formData.variable_costs_type_2_intercedis_cashflow ? "default" : "secondary"}
                                onClick={() => handleInputChange("variable_costs_type_2_intercedis_cashflow", true)}
                              >
                                Yes
                              </Button>
                              <Button
                                type="button"
                                variant={!formData.variable_costs_type_2_intercedis_cashflow ? "default" : "secondary"}
                                onClick={() => handleInputChange("variable_costs_type_2_intercedis_cashflow", false)}
                              >
                                No
                              </Button>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="type3">
                      <AccordionTrigger>Variable Costs Type 3 - Commission</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Commission %</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={formData.variable_costs_type_3_commission_percentage || ""}
                              onChange={(e) =>
                                handleInputChange(
                                  "variable_costs_type_3_commission_percentage",
                                  parseFloat(e.target.value),
                                )
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Commission Tax %</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={formData.variable_costs_type_3_commission_tax_percentage || ""}
                              onChange={(e) =>
                                handleInputChange(
                                  "variable_costs_type_3_commission_tax_percentage",
                                  parseFloat(e.target.value),
                                )
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Commission Markup Rule</Label>
                            <Input
                              type="text"
                              value={formatMarkupValue(formData.variable_costs_type_3_commission_markup_rule)}
                              readOnly
                              className="cursor-default"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Commission Markup Type</Label>
                            <Input
                              type="text"
                              value={formatMarkupValue(formData.variable_costs_type_3_commission_markup_type)}
                              readOnly
                              className="cursor-default"
                            />
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="type4">
                      <AccordionTrigger>Variable Costs Type 4 - Logistics Fee</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Logistics Fee %</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={formData.variable_costs_type_4_logistics_fee_percentage || ""}
                              onChange={(e) =>
                                handleInputChange(
                                  "variable_costs_type_4_logistics_fee_percentage",
                                  parseFloat(e.target.value),
                                )
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Logistics Fee Tax %</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={formData.variable_costs_type_4_logistics_fee_tax_percentage || ""}
                              onChange={(e) =>
                                handleInputChange(
                                  "variable_costs_type_4_logistics_fee_tax_percentage",
                                  parseFloat(e.target.value),
                                )
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Logistics Markup Rule</Label>
                            <Input
                              type="text"
                              value={formatMarkupValue(formData.variable_costs_type_4_logistics_fee_markup_rule)}
                              readOnly
                              className="cursor-default"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Logistics Markup Type</Label>
                            <Input
                              type="text"
                              value={formatMarkupValue(formData.variable_costs_type_4_logistics_fee_markup_type)}
                              readOnly
                              className="cursor-default"
                            />
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="type5">
                      <AccordionTrigger>Variable Costs Type 5 - Insurance</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Insurance %</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={formData.variable_costs_type_5_insurance_percentage || ""}
                              onChange={(e) =>
                                handleInputChange(
                                  "variable_costs_type_5_insurance_percentage",
                                  parseFloat(e.target.value),
                                )
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Insurance Tax %</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={formData.variable_costs_type_5_insurance_tax_percentage || ""}
                              onChange={(e) =>
                                handleInputChange(
                                  "variable_costs_type_5_insurance_tax_percentage",
                                  parseFloat(e.target.value),
                                )
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Insurance Markup Rule</Label>
                            <Input
                              type="text"
                              value={formatMarkupValue(formData.variable_costs_type_5_insurance_markup_rule)}
                              readOnly
                              className="cursor-default"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Insurance Markup Type</Label>
                            <Input
                              type="text"
                              value={formatMarkupValue(formData.variable_costs_type_5_insurance_markup_type)}
                              readOnly
                              className="cursor-default"
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label>Insurance affects Cashflow?</Label>
                            <div className="flex gap-3">
                              <Button
                                type="button"
                                variant={formData.variable_costs_type_5_insurance_cashflow ? "default" : "secondary"}
                                onClick={() => handleInputChange("variable_costs_type_5_insurance_cashflow", true)}
                              >
                                Yes
                              </Button>
                              <Button
                                type="button"
                                variant={!formData.variable_costs_type_5_insurance_cashflow ? "default" : "secondary"}
                                onClick={() => handleInputChange("variable_costs_type_5_insurance_cashflow", false)}
                              >
                                No
                              </Button>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  {/* Submit Button */}
                  <Button type="submit" className="w-full h-12 text-lg font-medium" disabled={calculating}>
                    {calculating ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      <>
                        <Target className="mr-2 h-5 w-5" />
                        Calculate Pricing
                      </>
                    )}
                  </Button>

                  {error && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-600">{error}</AlertDescription>
                    </Alert>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Results View
          <div className="space-y-6">
            {/* Back to Input Button */}
            <div className="flex justify-start mb-4">
              <Button onClick={handleBackToInput} variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Input
              </Button>
            </div>

            {result && result.data && result.data.length > 0 && (
              <>
                {/* Key Metrics */}
                <Card className="shadow-lg border-0">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                      Pricing Results
                    </CardTitle>
                    <CardDescription>
                      Calculated in {result.processing_time_seconds?.toFixed(2) || "0.00"}s
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {/* Profitability Status (derived from margins if available) */}
                    {result.data[0] && (
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {getProfitabilityIcon(
                            (result.data[0].final_sales_price_financials_total_gross_profit_margin ?? 0) > 0,
                          )}
                          <div>
                            <p className="font-medium">Profitability Status</p>
                            <p className="text-sm text-muted-foreground">
                              {(result.data[0].final_sales_price_financials_total_gross_profit_margin ?? 0) > 0
                                ? "Profitable"
                                : "Not Profitable"}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            (result.data[0].final_sales_price_financials_total_gross_profit_margin ?? 0) > 0
                              ? "default"
                              : "destructive"
                          }
                          className="text-sm"
                        >
                          {(result.data[0].final_sales_price_financials_total_gross_profit_margin ?? 0) > 0
                            ? "GOOD"
                            : "REVIEW"}
                        </Badge>
                      </div>
                    )}

                    {/* Key Prices */}
                    {result.data[0] && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-blue-900">Suggested Price</span>
                          </div>
                          <p className="text-2xl font-bold text-blue-600">
                            {formatCurrency(
                              result.data[0].suggested_price_financials_suggested_sale_price_without_taxes,
                            )}
                          </p>
                        </div>

                        <div className="p-4 bg-purple-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Package className="h-4 w-4 text-purple-600" />
                            <span className="font-medium text-purple-900">
                              {" "}
                              Final Sale Price Financials Actual Final Sales Price
                            </span>
                          </div>
                          <p className="text-2xl font-bold text-purple-600">
                            {formatCurrency(result.data[0].final_sales_price_financials_actual_final_sale_price)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Margin Analysis */}
                    {result.data[0] && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium">Final Sales Price Gross Profit Margin</span>
                          <Badge
                            className={getMarginColor(
                              result.data[0].final_sales_price_financials_total_gross_profit_margin,
                            )}
                          >
                            {formatPercentage(result.data[0].final_sales_price_financials_total_gross_profit_margin)}
                          </Badge>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              result.data[0].final_sales_price_financials_total_gross_profit_margin >= 0.2
                                ? "bg-green-500"
                                : result.data[0].final_sales_price_financials_total_gross_profit_margin >= 0.1
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                            style={{
                              width: `${Math.min(result.data[0].final_sales_price_financials_total_gross_profit_margin * 500, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Business Metrics */}
                    {result.data[0] && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <p className="text-sm text-orange-600 font-medium">Monthly Break-even Units</p>
                          <p className="text-lg font-bold text-orange-700">
                            {Math.round(result.data[0].monthly_break_even_units).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-indigo-50 rounded-lg">
                          <p className="text-sm text-indigo-600 font-medium">Monthly Target Units</p>
                          <p className="text-lg font-bold text-indigo-700">
                            {Math.round(result.data[0].monthly_target_units).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Financial Performance */}
                    {result.data[0] && (
                      <div className="space-y-3">
                        <Separator />
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Monthly Gross Profit</span>
                          <span className="text-lg font-bold text-green-600">
                            {formatCurrency(result.data[0].final_sales_price_financials_monthly_gross_profit)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Total IRR</span>
                          <span className="text-lg font-bold text-blue-600">
                            {formatPercentage(result.data[0].final_sales_price_financials_total_irr)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Contribution Margin</span>
                          <span className="text-lg font-bold text-purple-600">
                            {formatCurrency(result.data[0].contribution_margin)}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Detailed Financial Breakdown */}
                {result.data[0] && (
                  <Card className="shadow-lg border-0">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Calculator className="h-6 w-6 text-purple-600" />
                        Detailed Financial Breakdown
                      </CardTitle>
                      <CardDescription>Comprehensive pricing calculations and financial analysis</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <Accordion type="single" collapsible className="w-full">
                        {/* 1. Core Pricing Calculations */}
                        <AccordionItem value="core-pricing">
                          <AccordionTrigger>Core Pricing Calculations</AccordionTrigger>
                          <AccordionContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">
                                  Price to Client for Target Margin
                                </Label>
                                <p className="text-lg font-semibold text-green-600">
                                  {formatCurrency(
                                    result.data[0].price_to_give_to_client_to_achieve_gross_profit_margin,
                                  )}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">
                                  Product Cost Needed (Market Price)
                                </Label>
                                <p className="text-lg font-semibold text-orange-600">
                                  {formatCurrency(result.data[0].product_cost_needed_from_supplier_given_market_price)}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">
                                  Product Cost Needed (Client Price)
                                </Label>
                                <p className="text-lg font-semibold text-purple-600">
                                  {formatCurrency(
                                    result.data[0].product_cost_needed_from_supplier_given_client_solicited_price,
                                  )}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Gross Profit Margin Needed</Label>
                                <p className="text-lg font-semibold text-blue-600">
                                  {formatPercentage(result.data[0].gross_profit_margin_needed)}
                                </p>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>

                        {/* 2. Variable Costs */}
                        <AccordionItem value="variable-costs">
                          <AccordionTrigger>Variable Costs</AccordionTrigger>
                          <AccordionContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Shipping Cost + Tax</Label>
                                <p className="text-lg font-semibold text-blue-600">
                                  {formatCurrency(result.data[0].variable_costs_type_1_shipping_cost_tax)}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Handling Cost + Tax</Label>
                                <p className="text-lg font-semibold text-green-600">
                                  {formatCurrency(result.data[0].variable_costs_type_2_handling_cost_tax)}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Intercedis + Tax</Label>
                                <p className="text-lg font-semibold text-purple-600">
                                  {formatCurrency(result.data[0].variable_costs_type_2_intercedis_tax)}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Commission</Label>
                                <p className="text-lg font-semibold text-orange-600">
                                  {formatCurrency(result.data[0].variable_costs_type_3_commission)}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Commission Tax</Label>
                                <p className="text-lg font-semibold text-red-600">
                                  {formatCurrency(result.data[0].variable_costs_type_3_tax)}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Logistics Fee</Label>
                                <p className="text-lg font-semibold text-indigo-600">
                                  {formatCurrency(result.data[0].variable_costs_type_4_logistics_fee)}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Logistics Fee Tax</Label>
                                <p className="text-lg font-semibold text-pink-600">
                                  {formatCurrency(result.data[0].variable_costs_type_4_logistics_fee_tax)}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Insurance</Label>
                                <p className="text-lg font-semibold text-teal-600">
                                  {formatCurrency(result.data[0].variable_costs_type_5_insurance)}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Insurance Tax</Label>
                                <p className="text-lg font-semibold text-cyan-600">
                                  {formatCurrency(result.data[0].variable_costs_type_5_insurance_tax)}
                                </p>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>

                        {/* 3. Total Variable Costs & Landed Costs */}
                        <AccordionItem value="total-variable-costs">
                          <AccordionTrigger>Total Variable Costs & Landed Costs</AccordionTrigger>
                          <AccordionContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">
                                  Total Variable Costs Landed Costs (Type 1)
                                </Label>
                                <p className="text-lg font-semibold text-blue-600">
                                  {formatCurrency(result.data[0].total_variable_costs_landed_costs_type_1)}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">
                                  Landed Costs for Calculation of Other Variable Costs
                                </Label>
                                <p className="text-lg font-semibold text-green-600">
                                  {formatCurrency(result.data[0].landed_costs_for_calculation_of_other_variable_costs)}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">
                                  Total Variable Costs Landed Costs (Type 1.5)
                                </Label>
                                <p className="text-lg font-semibold text-purple-600">
                                  {formatCurrency(result.data[0].total_variable_costs_landed_costs_type_1_5)}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">
                                  Total Landed Cost for Margin Calculation
                                </Label>
                                <p className="text-lg font-semibold text-orange-600">
                                  {formatCurrency(result.data[0].total_landed_cost_for_margin_calculation)}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">
                                  Total Pass Through Fixed Cost (Type 2)
                                </Label>
                                <p className="text-lg font-semibold text-red-600">
                                  {formatCurrency(result.data[0].total_pass_through_fixed_cost_type_2)}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">
                                  Total Percentage Variable Costs on Price
                                </Label>
                                <p className="text-lg font-semibold text-indigo-600">
                                  {formatPercentage(result.data[0].total_percentage_variable_costs_on_price)}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Total Variable Costs 3 & 4</Label>
                                <p className="text-lg font-semibold text-pink-600">
                                  {formatCurrency(result.data[0].total_variable_costs_3_4)}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">
                                  Total Variable Costs 3 & 4 (Actual Sale Price)
                                </Label>
                                <p className="text-lg font-semibold text-teal-600">
                                  {formatCurrency(result.data[0].total_variable_costs_3_4_actual_sale_price)}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">
                                  Total Landed Cost All Variable Costs (Suggested Price)
                                </Label>
                                <p className="text-lg font-semibold text-cyan-600">
                                  {formatCurrency(result.data[0].total_landed_cost_all_variable_costs_suggested_price)}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">
                                  Total Landed Costs (Actual Sales Price)
                                </Label>
                                <p className="text-lg font-semibold text-yellow-600">
                                  {formatCurrency(result.data[0].total_landed_costs_actual_sales_price)}
                                </p>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>

                        {/* 4. Business Metrics */}
                        <AccordionItem value="business-metrics">
                          <AccordionTrigger>Business Metrics</AccordionTrigger>
                          <AccordionContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">UCM Actual Sale Price</Label>
                                <p className="text-lg font-semibold text-blue-600">
                                  {formatCurrency(result.data[0].ucm_actual_sale_price)}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Monthly Break-even Units</Label>
                                <p className="text-lg font-semibold text-green-600">
                                  {Math.round(result.data[0].monthly_break_even_units).toLocaleString()}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Monthly Target Units</Label>
                                <p className="text-lg font-semibold text-purple-600">
                                  {Math.round(result.data[0].monthly_target_units).toLocaleString()}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">
                                  Required Price with Projected Units + Financing
                                </Label>
                                <p className="text-lg font-semibold text-orange-600">
                                  {formatCurrency(
                                    result.data[0]
                                      .required_price_with_projected_units_plus_financing_minus_price_per_unit,
                                  )}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">
                                  Total Projected Monthly Sales
                                </Label>
                                <p className="text-lg font-semibold text-red-600">
                                  {formatCurrency(result.data[0].total_projected_monthly_sales)}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Contribution Margin</Label>
                                <p className="text-lg font-semibold text-indigo-600">
                                  {formatCurrency(result.data[0].contribution_margin)}
                                </p>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>

                        {/* 5. Tax & Cash Flow */}
                        <AccordionItem value="tax-cashflow">
                          <AccordionTrigger>Tax & Cash Flow</AccordionTrigger>
                          <AccordionContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">IEPS Paid</Label>
                                <p className="text-lg font-semibold text-orange-600">
                                  {formatCurrency(result.data[0].ieps_paid)}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Product Cost with IEPS</Label>
                                <p className="text-lg font-semibold text-blue-600">
                                  {formatCurrency(result.data[0].product_cost_with_ieps)}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">IVA Paid</Label>
                                <p className="text-lg font-semibold text-green-600">
                                  {formatCurrency(result.data[0].iva_paid)}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Product Cost with All Taxes</Label>
                                <p className="text-lg font-semibold text-purple-600">
                                  {formatCurrency(result.data[0].product_cost_with_taxes)}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">
                                  Total Cash Flow Variable Costs
                                </Label>
                                <p className="text-lg font-semibold text-red-600">
                                  {formatCurrency(result.data[0].total_cash_flow_variable_costs)}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Total Cash Flow</Label>
                                <p className="text-lg font-semibold text-indigo-600">
                                  {formatCurrency(result.data[0].total_cash_flow)}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Financing Cost</Label>
                                <p className="text-lg font-semibold text-pink-600">
                                  {formatCurrency(result.data[0].financing_cost)}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Suggested Base Sale Price</Label>
                                <p className="text-lg font-semibold text-teal-600">
                                  {formatCurrency(result.data[0].suggested_base_sale_price)}
                                </p>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>

                        {/* 6. Suggested Price to Client Financial Breakdown */}
                        <AccordionItem value="suggested-price-breakdown">
                          <AccordionTrigger>Suggested Price to Client Financial Breakdown</AccordionTrigger>
                          <AccordionContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">IEPS</Label>
                                <p className="text-lg font-semibold text-orange-600">
                                  {formatCurrency(result.data[0].suggested_price_to_client_financial_breakdown_ieps)}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">IVA</Label>
                                <p className="text-lg font-semibold text-blue-600">
                                  {formatCurrency(result.data[0].suggested_price_to_client_financial_breakdown_iva)}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Total Price with Taxes</Label>
                                <p className="text-lg font-semibold text-green-600">
                                  {formatCurrency(
                                    result.data[0].suggested_price_to_client_financial_breakdown_total_price_with_taxes,
                                  )}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Profit</Label>
                                <p className="text-lg font-semibold text-purple-600">
                                  {formatCurrency(result.data[0].suggested_price_to_client_financial_breakdown_profit)}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Total Gross Profit Margin</Label>
                                <p className="text-lg font-semibold text-indigo-600">
                                  {formatPercentage(
                                    result.data[0]
                                      .suggested_price_to_client_financial_breakdown_total_gross_profit_margin,
                                  )}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">
                                  Real Gross Profit Margin (No Financing)
                                </Label>
                                <p className="text-lg font-semibold text-teal-600">
                                  {formatPercentage(
                                    result.data[0]
                                      .suggested_price_to_client_financial_breakdown_real_gross_profit_margin_without_financing,
                                  )}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Total IEPS Paid</Label>
                                <p className="text-lg font-semibold text-red-600">
                                  {formatCurrency(
                                    result.data[0].suggested_price_to_client_financial_breakdown_total_ieps_paid,
                                  )}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Total IVA Paid</Label>
                                <p className="text-lg font-semibold text-pink-600">
                                  {formatCurrency(
                                    result.data[0].suggested_price_to_client_financial_breakdown_total_iva_paid,
                                  )}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">
                                  Base Price with Discount Applied
                                </Label>
                                <p className="text-lg font-semibold text-cyan-600">
                                  {formatCurrency(
                                    result.data[0]
                                      .suggested_price_to_client_financial_breakdown_base_price_with_discount_applied,
                                  )}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">IEPS to Pay</Label>
                                <p className="text-lg font-semibold text-yellow-600">
                                  {formatCurrency(
                                    result.data[0].suggested_price_to_client_financial_breakdown_ieps_to_pay,
                                  )}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">IVA to Pay</Label>
                                <p className="text-lg font-semibold text-gray-600">
                                  {formatCurrency(
                                    result.data[0].suggested_price_to_client_financial_breakdown_iva_to_pay,
                                  )}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Final IEPS to Pay</Label>
                                <p className="text-lg font-semibold text-slate-600">
                                  {formatCurrency(
                                    result.data[0].suggested_price_to_client_financial_breakdown_final_ieps_to_pay,
                                  )}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Final IVA to Pay</Label>
                                <p className="text-lg font-semibold text-zinc-600">
                                  {formatCurrency(
                                    result.data[0].suggested_price_to_client_financial_breakdown_final_iva_to_pay,
                                  )}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">
                                  Total Final Cashflow Received
                                </Label>
                                <p className="text-lg font-semibold text-neutral-600">
                                  {formatCurrency(
                                    result.data[0]
                                      .suggested_price_to_client_financial_breakdown_total_final_cashflow_received,
                                  )}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Total IRR</Label>
                                <p className="text-lg font-semibold text-stone-600">
                                  {formatPercentage(
                                    result.data[0].suggested_price_to_client_financial_breakdown_total_irr,
                                  )}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">
                                  Cashflow Received Only Financing
                                </Label>
                                <p className="text-lg font-semibold text-emerald-600">
                                  {formatCurrency(
                                    result.data[0]
                                      .suggested_price_to_client_financial_breakdown_cashflow_received_only_financing,
                                  )}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">IRR Only Financing</Label>
                                <p className="text-lg font-semibold text-lime-600">
                                  {formatPercentage(
                                    result.data[0].suggested_price_to_client_financial_breakdown_irr_only_financing,
                                  )}
                                </p>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>

                        {/* 7. Actual Price to Client Financial Breakdown */}
                        <AccordionItem value="actual-price-breakdown">
                          <AccordionTrigger>Actual Price to Client Financial Breakdown</AccordionTrigger>
                          <AccordionContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Actual Final Sale Price</Label>
                                <p className="text-lg font-semibold text-orange-600">
                                  {formatCurrency(
                                    result.data[0].actual_price_to_client_financial_breakdown_actual_final_sale_price,
                                  )}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">IEPS</Label>
                                <p className="text-lg font-semibold text-blue-600">
                                  {formatCurrency(result.data[0].actual_price_to_client_financial_breakdown_ieps)}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">IVA</Label>
                                <p className="text-lg font-semibold text-green-600">
                                  {formatCurrency(result.data[0].actual_price_to_client_financial_breakdown_iva)}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Total Price with Taxes</Label>
                                <p className="text-lg font-semibold text-purple-600">
                                  {formatCurrency(
                                    result.data[0].actual_price_to_client_financial_breakdown_total_price_with_taxes,
                                  )}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Profit</Label>
                                <p className="text-lg font-semibold text-indigo-600">
                                  {formatCurrency(result.data[0].actual_price_to_client_financial_breakdown_profit)}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Total Gross Profit Margin</Label>
                                <p className="text-lg font-semibold text-teal-600">
                                  {formatPercentage(
                                    result.data[0].actual_price_to_client_financial_breakdown_total_gross_profit_margin,
                                  )}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">
                                  Real Gross Profit Margin (No Financing)
                                </Label>
                                <p className="text-lg font-semibold text-red-600">
                                  {formatPercentage(
                                    result.data[0]
                                      .actual_price_to_client_financial_breakdown_real_gross_profit_margin_without_financing,
                                  )}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Total IEPS Payed</Label>
                                <p className="text-lg font-semibold text-pink-600">
                                  {formatCurrency(
                                    result.data[0].actual_price_to_client_financial_breakdown_total_ieps_payed,
                                  )}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Total IVA Paid</Label>
                                <p className="text-lg font-semibold text-cyan-600">
                                  {formatCurrency(
                                    result.data[0].actual_price_to_client_financial_breakdown_total_iva_paid,
                                  )}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">
                                  Base Price with Discounts Applied
                                </Label>
                                <p className="text-lg font-semibold text-yellow-600">
                                  {formatCurrency(
                                    result.data[0]
                                      .actual_price_to_client_financial_breakdown_base_price_with_discounts_applied,
                                  )}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">IEPS to Pay</Label>
                                <p className="text-lg font-semibold text-gray-600">
                                  {formatCurrency(
                                    result.data[0].actual_price_to_client_financial_breakdown_ieps_to_pay,
                                  )}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">IVA to Pay</Label>
                                <p className="text-lg font-semibold text-slate-600">
                                  {formatCurrency(result.data[0].actual_price_to_client_financial_breakdown_iva_to_pay)}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Final IEPS to Pay</Label>
                                <p className="text-lg font-semibold text-zinc-600">
                                  {formatCurrency(
                                    result.data[0].actual_price_to_client_financial_breakdown_final_ieps_to_pay,
                                  )}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Final IVA to Pay</Label>
                                <p className="text-lg font-semibold text-neutral-600">
                                  {formatCurrency(
                                    result.data[0].actual_price_to_client_financial_breakdown_final_iva_to_pay,
                                  )}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">
                                  Total Final Cashflow Received
                                </Label>
                                <p className="text-lg font-semibold text-stone-600">
                                  {formatCurrency(
                                    result.data[0]
                                      .actual_price_to_client_financial_breakdown_total_final_cashflow_received,
                                  )}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Total IRR</Label>
                                <p className="text-lg font-semibold text-emerald-600">
                                  {formatPercentage(
                                    result.data[0].actual_price_to_client_financial_breakdown_total_irr,
                                  )}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">
                                  Cashflow Received Only Financing
                                </Label>
                                <p className="text-lg font-semibold text-lime-600">
                                  {formatCurrency(
                                    result.data[0]
                                      .actual_price_to_client_financial_breakdown_cashflow_received_only_financing,
                                  )}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">IRR Only Financing</Label>
                                <p className="text-lg font-semibold text-amber-600">
                                  {formatPercentage(
                                    result.data[0].actual_price_to_client_financial_breakdown_irr_only_financing,
                                  )}
                                </p>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>

                        {/* 8. Suggested Price Financials */}
                        <AccordionItem value="suggested-price-financials">
                          <AccordionTrigger>Suggested Price Financials</AccordionTrigger>
                          <AccordionContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Sale Price Without Taxes</Label>
                                <p className="text-lg font-semibold text-orange-600">
                                  {formatCurrency(
                                    result.data[0].suggested_price_financials_suggested_sale_price_without_taxes,
                                  )}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Sale Price With Taxes</Label>
                                <p className="text-lg font-semibold text-blue-600">
                                  {formatCurrency(
                                    result.data[0].suggested_price_financials_suggested_sale_price_with_taxes,
                                  )}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Suggested Price Profit</Label>
                                <p className="text-lg font-semibold text-green-600">
                                  {formatCurrency(result.data[0].suggested_price_financials_suggested_price_profit)}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">
                                  Total Gross Profit Margin (Suggested Price)
                                </Label>
                                <p className="text-lg font-semibold text-purple-600">
                                  {formatPercentage(
                                    result.data[0].suggested_price_financials_total_gross_profit_margin_suggested_price,
                                  )}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">
                                  Real Gross Profit Margin (No Financing - Suggested Price)
                                </Label>
                                <p className="text-lg font-semibold text-indigo-600">
                                  {formatPercentage(
                                    result.data[0]
                                      .suggested_price_financials_real_gross_profit_margin_without_financing_suggested_price,
                                  )}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Total IRR</Label>
                                <p className="text-lg font-semibold text-teal-600">
                                  {formatPercentage(result.data[0].suggested_price_financials_total_irr)}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">IRR Financing</Label>
                                <p className="text-lg font-semibold text-red-600">
                                  {formatPercentage(result.data[0].suggested_price_financials_irr_financing)}
                                </p>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>

                        {/* 9. Final Sales Price Financials */}
                        <AccordionItem value="final-sales-financials">
                          <AccordionTrigger>Final Sales Price Financials</AccordionTrigger>
                          <AccordionContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Actual Final Sale Price</Label>
                                <p className="text-lg font-semibold text-orange-600">
                                  {formatCurrency(result.data[0].final_sales_price_financials_actual_final_sale_price)}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Sale Price With Taxes</Label>
                                <p className="text-lg font-semibold text-blue-600">
                                  {formatCurrency(
                                    result.data[0].final_sales_price_financials_actual_final_sale_price_with_taxes,
                                  )}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Profit</Label>
                                <p className="text-lg font-semibold text-green-600">
                                  {formatCurrency(result.data[0].final_sales_price_financials_profit)}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Total Gross Profit Margin</Label>
                                <p className="text-lg font-semibold text-purple-600">
                                  {formatPercentage(
                                    result.data[0].final_sales_price_financials_total_gross_profit_margin,
                                  )}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">
                                  Real Gross Profit Margin (No Financing)
                                </Label>
                                <p className="text-lg font-semibold text-indigo-600">
                                  {formatPercentage(
                                    result.data[0]
                                      .final_sales_price_financials_real_gross_profit_margin_without_financing,
                                  )}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Monthly Gross Profit</Label>
                                <p className="text-lg font-semibold text-teal-600">
                                  {formatCurrency(result.data[0].final_sales_price_financials_monthly_gross_profit)}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Total IRR</Label>
                                <p className="text-lg font-semibold text-red-600">
                                  {formatPercentage(result.data[0].final_sales_price_financials_total_irr)}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">IRR Financing</Label>
                                <p className="text-lg font-semibold text-pink-600">
                                  {formatPercentage(result.data[0].final_sales_price_financials_irr_financing)}
                                </p>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>

                        {/* 10. Price & Supplier Cost Comparisons */}
                        <AccordionItem value="price-comparisons">
                          <AccordionTrigger>Price & Supplier Cost Comparisons</AccordionTrigger>
                          <AccordionContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Market Price</Label>
                                <p className="text-lg font-semibold text-blue-600">
                                  {formatCurrency(result.data[0].price_and_supplier_cost_comparisons_market_price)}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Client Target Margin</Label>
                                <p className="text-lg font-semibold text-green-600">
                                  {formatPercentage(
                                    result.data[0]
                                      .price_and_supplier_cost_comparisons_gross_profit_margin_wanted_by_client,
                                  )}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Ideal Price (Market)</Label>
                                <p className="text-lg font-semibold text-purple-600">
                                  {formatCurrency(
                                    result.data[0]
                                      .price_and_supplier_cost_comparisons_ideal_price_to_client_given_market_price,
                                  )}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Client Solicited Price</Label>
                                <p className="text-lg font-semibold text-orange-600">
                                  {formatCurrency(
                                    result.data[0].price_and_supplier_cost_comparisons_price_solicited_by_client,
                                  )}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">
                                  Supplier Cost (Market Price)
                                </Label>
                                <p className="text-lg font-semibold text-indigo-600">
                                  {formatCurrency(
                                    result.data[0]
                                      .price_and_supplier_cost_comparisons_product_cost_needed_from_supplier_given_market_price,
                                  )}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">
                                  Supplier Cost (Client Price)
                                </Label>
                                <p className="text-lg font-semibold text-teal-600">
                                  {formatCurrency(
                                    result.data[0]
                                      .price_and_supplier_cost_comparisons_product_cost_needed_from_supplier_given_client_solicited_price,
                                  )}
                                </p>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimplifiedPricing;
