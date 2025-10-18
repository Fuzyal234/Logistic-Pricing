import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Zap,
  Calculator,
  Package,
  DollarSign,
  TrendingUp,
  CheckCircle,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { APP_CONFIG } from "@/config/app.config";

interface QuotationFormData {
  // Product & Customer Info
  product_name: string;
  sku: string;
  quantity: number;

  // Core Costs
  supplier_unit_cost: number;
  market_price: number;
  actual_sale_price: number;

  // Taxes
  ieps_cost: number;
  iva_cost: number;

  // Variable Costs Type 1 - Shipping
  shipping_cost: number;
  shipping_tax_percentage: number;
  shipping_markup_rule: string;
  shipping_markup_type: string;
  shipping_cashflow: boolean;

  // Variable Costs Type 2 - Handling & Intercedis
  handling_cost: number;
  handling_tax_percentage: number;
  handling_markup_rule: string;
  handling_markup_type: string;
  handling_cashflow: boolean;
  intercedis: number;
  intercedis_tax_percentage: number;
  intercedis_markup_rule: string;
  intercedis_markup_type: string;
  intercedis_cashflow: boolean;

  // Variable Costs Type 3 - Commission
  commission_percentage: number;
  commission_tax_percentage: number;
  commission_markup_rule: string;
  commission_markup_type: string;

  // Variable Costs Type 4 - Logistics Fee
  logistics_fee_percentage: number;
  logistics_fee_tax_percentage: number;
  logistics_fee_markup_rule: string;
  logistics_fee_markup_type: string;

  // Variable Costs Type 5 - Insurance
  insurance_percentage: number;
  insurance_tax_percentage: number;
  insurance_markup_rule: string;
  insurance_markup_type: string;
  insurance_cashflow: boolean;

  // Business Parameters
  gross_profit_margin: number;
  units_to_sell_per_month: number;
  monthly_fix_cost_percentage: number;
  financing_days: number;
  annual_cost_of_capital_percentage: number;
  inventory_rotation_days: number;
}

type QuotationApiResponse = any;

export default function QuickQuotation() {
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<QuotationApiResponse | null>(null);
  const [showResults, setShowResults] = useState(false);

  const [formData, setFormData] = useState<QuotationFormData>({
    // Product & Customer Info
    product_name: "",
    sku: "",
    quantity: 1,

    // Core Costs
    supplier_unit_cost: 0,
    market_price: 0,
    actual_sale_price: 0,

    // Taxes
    ieps_cost: 0,
    iva_cost: 16,

    // Variable Costs Type 1
    shipping_cost: 0,
    shipping_tax_percentage: 16,
    shipping_markup_rule: "Add",
    shipping_markup_type: "Percentage",
    shipping_cashflow: false,

    // Variable Costs Type 2
    handling_cost: 0,
    handling_tax_percentage: 16,
    handling_markup_rule: "Add",
    handling_markup_type: "Percentage",
    handling_cashflow: false,
    intercedis: 0,
    intercedis_tax_percentage: 16,
    intercedis_markup_rule: "Add",
    intercedis_markup_type: "Percentage",
    intercedis_cashflow: false,

    // Variable Costs Type 3
    commission_percentage: 0,
    commission_tax_percentage: 16,
    commission_markup_rule: "Add",
    commission_markup_type: "Percentage",

    // Variable Costs Type 4
    logistics_fee_percentage: 0,
    logistics_fee_tax_percentage: 16,
    logistics_fee_markup_rule: "Add",
    logistics_fee_markup_type: "Percentage",

    // Variable Costs Type 5
    insurance_percentage: 0,
    insurance_tax_percentage: 16,
    insurance_markup_rule: "Add",
    insurance_markup_type: "Percentage",
    insurance_cashflow: false,

    // Business Parameters
    gross_profit_margin: 25,
    units_to_sell_per_month: 100,
    monthly_fix_cost_percentage: 5,
    financing_days: 30,
    annual_cost_of_capital_percentage: 12,
    inventory_rotation_days: 30,
  });

  // Load default general pricing rules (no customer-specific rules)
  useEffect(() => {
    const loadDefaultPricingRules = async () => {
      try {
        const { data, error } = await supabase.from("general_pricing_rule").select("*").is("client", null);

        if (error) throw error;

        if (!data) return;

        const ruleMap: Record<string, keyof QuotationFormData> = {
          ieps_cost: "ieps_cost",
          iva_cost: "iva_cost",
          inventory_rotation_days: "inventory_rotation_days",
          shipping_cost: "shipping_cost",
          shipping_tax_percentage: "shipping_tax_percentage",
          handling_cost: "handling_cost",
          handling_tax_percentage: "handling_tax_percentage",
          intercedis: "intercedis",
          intercedis_tax_percentage: "intercedis_tax_percentage",
          commission_percentage: "commission_percentage",
          commission_tax_percentage: "commission_tax_percentage",
          logistics_fee_percentage: "logistics_fee_percentage",
          logistics_fee_tax_percentage: "logistics_fee_tax_percentage",
          insurance_percentage: "insurance_percentage",
          insurance_tax_percentage: "insurance_tax_percentage",
          units_to_sell_per_month: "units_to_sell_per_month",
          monthly_fix_cost_percentage: "monthly_fix_cost_percentage",
          financing_days: "financing_days",
          annual_cost_of_capital_percentage: "annual_cost_of_capital_percentage",
          gross_profit_margin: "gross_profit_margin",
        };

        const updated = { ...formData };
        for (const rule of data) {
          const field = ruleMap[rule.rule_name as string];
          if (field && rule.value !== null && rule.value !== undefined) {
            // @ts-ignore dynamic assignment
            updated[field] = rule.value;
          }
        }
        setFormData(updated);
        toast.success("Loaded default pricing rules");
      } catch (err) {
        console.error("Failed to load default pricing rules", err);
        toast.error("Failed to load default pricing rules");
      }
    };

    loadDefaultPricingRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (field: keyof QuotationFormData, value: string | number | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value === "" ? 0 : value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.product_name) {
      toast.error("Please enter a product name");
      return false;
    }

    if (!formData.supplier_unit_cost || formData.supplier_unit_cost <= 0) {
      toast.error("Supplier cost must be greater than 0");
      return false;
    }

    return true;
  };

  const calculateQuote = (data: QuotationFormData): any => {
    // Base costs
    const baseCost = data.supplier_unit_cost;
    const iepsCost = baseCost * (data.ieps_cost / 100);
    const productCostWithIeps = baseCost + iepsCost;
    const ivaCost = productCostWithIeps * (data.iva_cost / 100);
    const productCostWithTaxes = productCostWithIeps + ivaCost;

    // Variable Costs Type 1 - Shipping
    const shippingWithTax = data.shipping_cost * (1 + data.shipping_tax_percentage / 100);

    // Variable Costs Type 2 - Handling & Intercedis
    const handlingWithTax = data.handling_cost * (1 + data.handling_tax_percentage / 100);
    const intercedisWithTax = data.intercedis * (1 + data.intercedis_tax_percentage / 100);

    // Total Type 1 & 2 Variable Costs (Landed Costs)
    const totalLandedCosts = productCostWithTaxes + shippingWithTax + handlingWithTax + intercedisWithTax;

    // Variable Costs Type 3 - Commission (on price)
    const commissionAmount = totalLandedCosts * (data.commission_percentage / 100);
    const commissionTax = commissionAmount * (data.commission_tax_percentage / 100);
    const totalCommission = commissionAmount + commissionTax;

    // Variable Costs Type 4 - Logistics Fee (on price)
    const logisticsFeeAmount = totalLandedCosts * (data.logistics_fee_percentage / 100);
    const logisticsFeeTax = logisticsFeeAmount * (data.logistics_fee_tax_percentage / 100);
    const totalLogisticsFee = logisticsFeeAmount + logisticsFeeTax;

    // Variable Costs Type 5 - Insurance (on price)
    const insuranceAmount = totalLandedCosts * (data.insurance_percentage / 100);
    const insuranceTax = insuranceAmount * (data.insurance_tax_percentage / 100);
    const totalInsurance = insuranceAmount + insuranceTax;

    // Total Variable Costs
    const totalVariableCosts =
      shippingWithTax + handlingWithTax + intercedisWithTax + totalCommission + totalLogisticsFee + totalInsurance;

    // Total Landed Cost
    const totalLandedCost = totalLandedCosts + totalCommission + totalLogisticsFee + totalInsurance;

    // Financing Cost
    const cashflowCosts =
      (data.shipping_cashflow ? shippingWithTax : 0) +
      (data.handling_cashflow ? handlingWithTax : 0) +
      (data.intercedis_cashflow ? intercedisWithTax : 0) +
      (data.insurance_cashflow ? totalInsurance : 0);
    const totalCashflow = productCostWithTaxes + cashflowCosts;
    const financingCost = totalCashflow * (data.financing_days / 365) * (data.annual_cost_of_capital_percentage / 100);

    // Suggested Price Calculation
    const targetMargin = data.gross_profit_margin / 100;
    const suggestedPrice = (totalLandedCost + financingCost) / (1 - targetMargin);

    // Margin Calculations
    const totalCost = totalLandedCost + financingCost;
    const grossMargin = ((suggestedPrice - totalCost) / suggestedPrice) * 100;
    const netMargin = grossMargin - data.monthly_fix_cost_percentage;

    // Business Metrics
    const monthlyFixedCosts = suggestedPrice * data.units_to_sell_per_month * (data.monthly_fix_cost_percentage / 100);
    const ucm = suggestedPrice - totalCost;
    const monthlyBreakEvenUnits = monthlyFixedCosts / ucm;
    const monthlyGrossProfit = (suggestedPrice - totalCost) * data.units_to_sell_per_month;

    return {
      suggested_price: suggestedPrice,
      total_cost: totalCost,
      gross_margin: grossMargin,
      net_margin: netMargin,
      total_variable_costs: totalVariableCosts,
      total_landed_cost: totalLandedCost,
      financing_cost: financingCost,
      monthly_break_even_units: monthlyBreakEvenUnits,
      monthly_gross_profit: monthlyGrossProfit,
      pass_fail: grossMargin >= data.gross_profit_margin ? "pass" : "fail",
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setCalculating(true);
    try {
      const payloadProduct: any = {
        product_id: "",
        customer_id: "",
        distribution_center_uuid: "",
        sku: formData.sku,
        quantity: formData.quantity,
        market_price: formData.market_price,
        gross_profit_margin_by_client: formData.gross_profit_margin,
        price_solicited_by_client: 0,
        actual_final_sale_price_without_tax: formData.actual_sale_price,
        supplier_cost: formData.supplier_unit_cost,
        ieps_cost: formData.ieps_cost,
        iva_cost: formData.iva_cost,
        inventory_rotation_days: formData.inventory_rotation_days,

        variable_costs_type_1_shipping_cost: formData.shipping_cost,
        variable_costs_type_1_shipping_tax_percentage: formData.shipping_tax_percentage,
        variable_costs_type_1_markup_rule: formData.shipping_markup_rule?.toLowerCase?.() || "none",
        variable_costs_type_1_markup_type: formData.shipping_markup_type?.toLowerCase?.() || "fixed",
        variable_costs_type_1_cashflow: !!formData.shipping_cashflow,

        variable_costs_type_2_handling_cost: formData.handling_cost,
        variable_costs_type_2_handling_tax_percentage: formData.handling_tax_percentage,
        variable_costs_type_2_handling_markup_rule: formData.handling_markup_rule?.toLowerCase?.() || "none",
        variable_costs_type_2_handling_markup_type: formData.handling_markup_type?.toLowerCase?.() || "fixed",
        variable_costs_type_2_handling_cashflow: !!formData.handling_cashflow,
        variable_costs_type_2_intercedis: formData.intercedis,
        variable_costs_type_2_intercedis_tax_percentage: formData.intercedis_tax_percentage,
        variable_costs_type_2_intercedis_markup_rule: formData.intercedis_markup_rule?.toLowerCase?.() || "none",
        variable_costs_type_2_intercedis_markup_type: formData.intercedis_markup_type?.toLowerCase?.() || "fixed",
        variable_costs_type_2_intercedis_cashflow: !!formData.intercedis_cashflow,

        variable_costs_type_3_commission_percentage: formData.commission_percentage,
        variable_costs_type_3_commission_tax_percentage: formData.commission_tax_percentage,
        variable_costs_type_3_commission_markup_rule: formData.commission_markup_rule?.toLowerCase?.() || "none",
        variable_costs_type_3_commission_markup_type: formData.commission_markup_type?.toLowerCase?.() || "percent",

        variable_costs_type_4_logistics_fee_percentage: formData.logistics_fee_percentage,
        variable_costs_type_4_logistics_fee_tax_percentage: formData.logistics_fee_tax_percentage,
        variable_costs_type_4_logistics_fee_markup_rule: formData.logistics_fee_markup_rule?.toLowerCase?.() || "none",
        variable_costs_type_4_logistics_fee_markup_type:
          formData.logistics_fee_markup_type?.toLowerCase?.() || "percent",

        variable_costs_type_5_insurance_percentage: formData.insurance_percentage,
        variable_costs_type_5_insurance_tax_percentage: formData.insurance_tax_percentage,
        variable_costs_type_5_insurance_markup_rule: formData.insurance_markup_rule?.toLowerCase?.() || "none",
        variable_costs_type_5_insurance_markup_type: formData.insurance_markup_type?.toLowerCase?.() || "percent",
        variable_costs_type_5_insurance_cashflow: !!formData.insurance_cashflow,

        units_to_sell_per_month: formData.units_to_sell_per_month,
        monthly_fix_cost_percentage: formData.monthly_fix_cost_percentage,
        financing_days: formData.financing_days,
        annual_cost_of_capital_percentage: formData.annual_cost_of_capital_percentage,
      };

      const apiPayload = { products_list: [payloadProduct], customer_id: "" };

      const response = await fetch(`${APP_CONFIG.API.BASE_URL}${APP_CONFIG.API.ENDPOINTS.COMPREHENSIVE_PRICING}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiPayload),
      });

      if (!response.ok) {
        const text = await response.text();
        let detail = text;
        try {
          detail = JSON.parse(text)?.detail || text;
        } catch {}
        throw new Error(detail || "Failed to calculate pricing");
      }

      const data = await response.json();
      setResult(data);
      setShowResults(true);
      toast.success("Pricing calculated successfully");
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Unexpected error";
      toast.error(message);
    } finally {
      setCalculating(false);
    }
  };

  const handleBackToInput = () => {
    setShowResults(false);
    setResult(null);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

  const formatPercentage = (percent: number) => `${percent.toFixed(2)}%`;

  // Map API response (if present) to convenient values similar to SimplifiedPricing
  const apiItem = (result as any)?.data?.[0] || null;
  const suggestedPriceFromApi = apiItem?.suggested_price_financials_suggested_sale_price_without_taxes ?? 0;
  const totalCostFromApi = apiItem?.total_landed_cost_all_variable_costs_suggested_price ?? 0;
  const grossMarginFromApi = (apiItem?.suggested_price_financials_total_gross_profit_margin_suggested_price ?? 0) * 100;

  // Helpers for comprehensive output sections
  const getNumber = (value: unknown): number => (typeof value === "number" && !Number.isNaN(value) ? value : 0);
  const pct = (v: unknown) => formatPercentage(getNumber(v) * 100);
  const money = (v: unknown) => formatCurrency(getNumber(v));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {!showResults ? (
          // Input Form View
          <div className="grid grid-cols-1 gap-8">
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-blue-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Zap className="h-6 w-6" />
                      Quick Quotation
                    </CardTitle>
                    <CardDescription>Enter product details and costs to generate accurate pricing</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Product Information */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="product_name" className="text-sm font-medium">
                        Product Name *
                      </Label>
                      <Input
                        id="product_name"
                        type="text"
                        value={formData.product_name}
                        onChange={(e) => handleInputChange("product_name", e.target.value)}
                        placeholder="Enter product name"
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sku" className="text-sm font-medium">
                        SKU
                      </Label>
                      <Input
                        id="sku"
                        type="text"
                        value={formData.sku}
                        onChange={(e) => handleInputChange("sku", e.target.value)}
                        placeholder="Enter SKU"
                        className="h-11"
                      />
                    </div>

                    {/* No customer-specific input in Quick Quotation */}
                  </div>

                  <Separator />

                  {/* Core Information */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        value={formData.supplier_unit_cost || ""}
                        onChange={(e) => handleInputChange("supplier_unit_cost", parseFloat(e.target.value))}
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="actual_sale_price" className="text-sm font-medium">
                        Actual Sale Price
                      </Label>
                      <Input
                        id="actual_sale_price"
                        type="number"
                        step="0.01"
                        value={formData.actual_sale_price || ""}
                        onChange={(e) => handleInputChange("actual_sale_price", parseFloat(e.target.value))}
                        placeholder="0.00"
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ieps_cost" className="text-sm font-medium">
                        IEPS (%)
                      </Label>
                      <Input
                        id="ieps_cost"
                        type="number"
                        step="0.01"
                        value={formData.ieps_cost || ""}
                        onChange={(e) => handleInputChange("ieps_cost", parseFloat(e.target.value))}
                        placeholder="0"
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="iva_cost" className="text-sm font-medium">
                        IVA (%)
                      </Label>
                      <Input
                        id="iva_cost"
                        type="number"
                        step="0.01"
                        value={formData.iva_cost || ""}
                        onChange={(e) => handleInputChange("iva_cost", parseFloat(e.target.value))}
                        placeholder="16"
                        className="h-11"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Variable Costs - Organized in Accordions */}
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="type1">
                      <AccordionTrigger>Variable Costs Type 1 - Shipping</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Shipping Cost</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={formData.shipping_cost || ""}
                              onChange={(e) => handleInputChange("shipping_cost", parseFloat(e.target.value))}
                              placeholder="0.00"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Shipping Tax %</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={formData.shipping_tax_percentage || ""}
                              onChange={(e) => handleInputChange("shipping_tax_percentage", parseFloat(e.target.value))}
                              placeholder="16"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Markup Rule</Label>
                            <Select
                              value={formData.shipping_markup_rule}
                              onValueChange={(value) => handleInputChange("shipping_markup_rule", value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Add">Add</SelectItem>
                                <SelectItem value="Multiply">Multiply</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Markup Type</Label>
                            <Select
                              value={formData.shipping_markup_type}
                              onValueChange={(value) => handleInputChange("shipping_markup_type", value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Percentage">Percentage</SelectItem>
                                <SelectItem value="Fixed">Fixed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2 flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formData.shipping_cashflow}
                              onChange={(e) => handleInputChange("shipping_cashflow", e.target.checked)}
                              className="h-4 w-4"
                            />
                            <Label>Include in Cashflow</Label>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="type2">
                      <AccordionTrigger>Variable Costs Type 2 - Handling & Intercedis</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-6">
                          {/* Handling */}
                          <div>
                            <h4 className="font-medium mb-3">Handling</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Handling Cost</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={formData.handling_cost || ""}
                                  onChange={(e) => handleInputChange("handling_cost", parseFloat(e.target.value))}
                                  placeholder="0.00"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Handling Tax %</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={formData.handling_tax_percentage || ""}
                                  onChange={(e) =>
                                    handleInputChange("handling_tax_percentage", parseFloat(e.target.value))
                                  }
                                  placeholder="16"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Markup Rule</Label>
                                <Select
                                  value={formData.handling_markup_rule}
                                  onValueChange={(value) => handleInputChange("handling_markup_rule", value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Add">Add</SelectItem>
                                    <SelectItem value="Multiply">Multiply</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label>Markup Type</Label>
                                <Select
                                  value={formData.handling_markup_type}
                                  onValueChange={(value) => handleInputChange("handling_markup_type", value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Percentage">Percentage</SelectItem>
                                    <SelectItem value="Fixed">Fixed</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2 flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={formData.handling_cashflow}
                                  onChange={(e) => handleInputChange("handling_cashflow", e.target.checked)}
                                  className="h-4 w-4"
                                />
                                <Label>Include in Cashflow</Label>
                              </div>
                            </div>
                          </div>

                          <Separator />

                          {/* Intercedis */}
                          <div>
                            <h4 className="font-medium mb-3">Intercedis</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Intercedis Cost</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={formData.intercedis || ""}
                                  onChange={(e) => handleInputChange("intercedis", parseFloat(e.target.value))}
                                  placeholder="0.00"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Intercedis Tax %</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={formData.intercedis_tax_percentage || ""}
                                  onChange={(e) =>
                                    handleInputChange("intercedis_tax_percentage", parseFloat(e.target.value))
                                  }
                                  placeholder="16"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Markup Rule</Label>
                                <Select
                                  value={formData.intercedis_markup_rule}
                                  onValueChange={(value) => handleInputChange("intercedis_markup_rule", value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Add">Add</SelectItem>
                                    <SelectItem value="Multiply">Multiply</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label>Markup Type</Label>
                                <Select
                                  value={formData.intercedis_markup_type}
                                  onValueChange={(value) => handleInputChange("intercedis_markup_type", value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Percentage">Percentage</SelectItem>
                                    <SelectItem value="Fixed">Fixed</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2 flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={formData.intercedis_cashflow}
                                  onChange={(e) => handleInputChange("intercedis_cashflow", e.target.checked)}
                                  className="h-4 w-4"
                                />
                                <Label>Include in Cashflow</Label>
                              </div>
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
                              step="0.01"
                              value={formData.commission_percentage || ""}
                              onChange={(e) => handleInputChange("commission_percentage", parseFloat(e.target.value))}
                              placeholder="0"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Commission Tax %</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={formData.commission_tax_percentage || ""}
                              onChange={(e) =>
                                handleInputChange("commission_tax_percentage", parseFloat(e.target.value))
                              }
                              placeholder="16"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Markup Rule</Label>
                            <Select
                              value={formData.commission_markup_rule}
                              onValueChange={(value) => handleInputChange("commission_markup_rule", value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Add">Add</SelectItem>
                                <SelectItem value="Multiply">Multiply</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Markup Type</Label>
                            <Select
                              value={formData.commission_markup_type}
                              onValueChange={(value) => handleInputChange("commission_markup_type", value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Percentage">Percentage</SelectItem>
                                <SelectItem value="Fixed">Fixed</SelectItem>
                              </SelectContent>
                            </Select>
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
                              step="0.01"
                              value={formData.logistics_fee_percentage || ""}
                              onChange={(e) =>
                                handleInputChange("logistics_fee_percentage", parseFloat(e.target.value))
                              }
                              placeholder="0"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Logistics Fee Tax %</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={formData.logistics_fee_tax_percentage || ""}
                              onChange={(e) =>
                                handleInputChange("logistics_fee_tax_percentage", parseFloat(e.target.value))
                              }
                              placeholder="16"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Markup Rule</Label>
                            <Select
                              value={formData.logistics_fee_markup_rule}
                              onValueChange={(value) => handleInputChange("logistics_fee_markup_rule", value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Add">Add</SelectItem>
                                <SelectItem value="Multiply">Multiply</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Markup Type</Label>
                            <Select
                              value={formData.logistics_fee_markup_type}
                              onValueChange={(value) => handleInputChange("logistics_fee_markup_type", value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Percentage">Percentage</SelectItem>
                                <SelectItem value="Fixed">Fixed</SelectItem>
                              </SelectContent>
                            </Select>
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
                              step="0.01"
                              value={formData.insurance_percentage || ""}
                              onChange={(e) => handleInputChange("insurance_percentage", parseFloat(e.target.value))}
                              placeholder="0"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Insurance Tax %</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={formData.insurance_tax_percentage || ""}
                              onChange={(e) =>
                                handleInputChange("insurance_tax_percentage", parseFloat(e.target.value))
                              }
                              placeholder="16"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Markup Rule</Label>
                            <Select
                              value={formData.insurance_markup_rule}
                              onValueChange={(value) => handleInputChange("insurance_markup_rule", value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Add">Add</SelectItem>
                                <SelectItem value="Multiply">Multiply</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Markup Type</Label>
                            <Select
                              value={formData.insurance_markup_type}
                              onValueChange={(value) => handleInputChange("insurance_markup_type", value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Percentage">Percentage</SelectItem>
                                <SelectItem value="Fixed">Fixed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2 flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formData.insurance_cashflow}
                              onChange={(e) => handleInputChange("insurance_cashflow", e.target.checked)}
                              className="h-4 w-4"
                            />
                            <Label>Include in Cashflow</Label>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  <Separator />

                  {/* Business Parameters */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Business Parameters</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Gross Profit Margin (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.gross_profit_margin || ""}
                          onChange={(e) => handleInputChange("gross_profit_margin", parseFloat(e.target.value))}
                          placeholder="25"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Units to Sell Per Month</Label>
                        <Input
                          type="number"
                          value={formData.units_to_sell_per_month || ""}
                          onChange={(e) => handleInputChange("units_to_sell_per_month", parseInt(e.target.value))}
                          placeholder="100"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Monthly Fixed Cost (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.monthly_fix_cost_percentage || ""}
                          onChange={(e) => handleInputChange("monthly_fix_cost_percentage", parseFloat(e.target.value))}
                          placeholder="5"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Financing Days</Label>
                        <Input
                          type="number"
                          value={formData.financing_days || ""}
                          onChange={(e) => handleInputChange("financing_days", parseInt(e.target.value))}
                          placeholder="30"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Annual Cost of Capital (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.annual_cost_of_capital_percentage || ""}
                          onChange={(e) =>
                            handleInputChange("annual_cost_of_capital_percentage", parseFloat(e.target.value))
                          }
                          placeholder="12"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Inventory Rotation Days</Label>
                        <Input
                          type="number"
                          value={formData.inventory_rotation_days || ""}
                          onChange={(e) => handleInputChange("inventory_rotation_days", parseInt(e.target.value))}
                          placeholder="30"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button type="submit" className="w-full h-12 text-lg font-medium" disabled={calculating}>
                    {calculating ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      <>
                        <Calculator className="mr-2 h-5 w-5" />
                        Calculate Quotation
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Results View
          <div className="space-y-6">
            <Button variant="outline" onClick={handleBackToInput} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Input
            </Button>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700">Suggested Price</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-blue-900">{formatCurrency(suggestedPriceFromApi)}</div>
                    <DollarSign className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-700">Gross Margin</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-green-900">{formatPercentage(grossMarginFromApi)}</div>
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-purple-700">Total Cost</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-purple-900">{formatCurrency(totalCostFromApi)}</div>
                    <Package className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`border-2 ${
                  grossMarginFromApi >= (formData.gross_profit_margin || 0)
                    ? "bg-gradient-to-br from-green-50 to-green-100 border-green-300"
                    : "bg-gradient-to-br from-red-50 to-red-100 border-red-300"
                }`}
              >
                <CardHeader className="pb-2">
                  <CardTitle
                    className={`text-sm font-medium ${
                      grossMarginFromApi >= (formData.gross_profit_margin || 0) ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={grossMarginFromApi >= (formData.gross_profit_margin || 0) ? "default" : "destructive"}
                      className="text-lg px-4 py-1"
                    >
                      {grossMarginFromApi >= (formData.gross_profit_margin || 0) ? "PASS" : "FAIL"}
                    </Badge>
                    {grossMarginFromApi >= (formData.gross_profit_margin || 0) ? (
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    ) : (
                      <XCircle className="h-8 w-8 text-red-600" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Results */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Detailed Calculation Results</CardTitle>
                <CardDescription>Comprehensive pricing calculations and financial analysis</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <Accordion type="single" collapsible className="w-full">
                  {/* Core Pricing Metrics */}
                  <AccordionItem value="core-pricing">
                    <AccordionTrigger>Core Pricing Metrics</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Suggested Price</Label>
                          <p className="text-lg font-semibold">{formatCurrency(suggestedPriceFromApi)}</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Total Cost</Label>
                          <p className="text-lg font-semibold">{formatCurrency(totalCostFromApi)}</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Gross Margin</Label>
                          <p className="text-lg font-semibold">{formatPercentage(grossMarginFromApi)}</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Net Margin</Label>
                          <p className="text-lg font-semibold">
                            {formatPercentage(
                              (apiItem?.suggested_price_to_client_financial_breakdown_total_gross_profit_margin ?? 0) *
                                100,
                            )}
                          </p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Cost Breakdown */}
                  <AccordionItem value="cost-breakdown">
                    <AccordionTrigger>Cost Breakdown</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Total Variable Costs</Label>
                          <p className="text-lg font-semibold">
                            {formatCurrency(apiItem?.total_variable_costs_3_4 ?? 0)}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Total Landed Cost</Label>
                          <p className="text-lg font-semibold">
                            {formatCurrency(apiItem?.total_landed_cost_all_variable_costs_suggested_price ?? 0)}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Financing Cost</Label>
                          <p className="text-lg font-semibold">{formatCurrency(apiItem?.financing_cost ?? 0)}</p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Business Metrics */}
                  <AccordionItem value="business-metrics">
                    <AccordionTrigger>Business Metrics</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Monthly Break-Even Units</Label>
                          <p className="text-lg font-semibold">{(apiItem?.monthly_break_even_units || 0).toFixed(2)}</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Monthly Gross Profit</Label>
                          <p className="text-lg font-semibold">{formatCurrency(apiItem?.monthly_gross_profit || 0)}</p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Suggested Price Financials */}
                  <AccordionItem value="suggested-financials">
                    <AccordionTrigger>Suggested Price Financials</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Suggested Price (without taxes)</Label>
                          <p className="text-lg font-semibold">
                            {money(apiItem?.suggested_price_financials_suggested_sale_price_without_taxes)}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Suggested Price (with taxes)</Label>
                          <p className="text-lg font-semibold">
                            {money(apiItem?.suggested_price_financials_suggested_sale_price_with_taxes)}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Profit</Label>
                          <p className="text-lg font-semibold">
                            {money(apiItem?.suggested_price_financials_suggested_price_profit)}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Gross Profit Margin (total)</Label>
                          <p className="text-lg font-semibold">
                            {pct(apiItem?.suggested_price_financials_total_gross_profit_margin_suggested_price)}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Real GPM (without financing)</Label>
                          <p className="text-lg font-semibold">
                            {pct(
                              apiItem?.suggested_price_financials_real_gross_profit_margin_without_financing_suggested_price,
                            )}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">IRR (total)</Label>
                          <p className="text-lg font-semibold">{pct(apiItem?.suggested_price_financials_total_irr)}</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">IRR (financing)</Label>
                          <p className="text-lg font-semibold">
                            {pct(apiItem?.suggested_price_financials_irr_financing)}
                          </p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Actual Price Financials */}
                  <AccordionItem value="actual-financials">
                    <AccordionTrigger>Actual Price Financials</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Actual Final Sale Price</Label>
                          <p className="text-lg font-semibold">
                            {money(apiItem?.final_sales_price_financials_actual_final_sale_price)}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">
                            Actual Final Sale Price (with taxes)
                          </Label>
                          <p className="text-lg font-semibold">
                            {money(apiItem?.final_sales_price_financials_actual_final_sale_price_with_taxes)}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Profit</Label>
                          <p className="text-lg font-semibold">{money(apiItem?.final_sales_price_financials_profit)}</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Gross Profit Margin (total)</Label>
                          <p className="text-lg font-semibold">
                            {pct(apiItem?.final_sales_price_financials_total_gross_profit_margin)}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Real GPM (without financing)</Label>
                          <p className="text-lg font-semibold">
                            {pct(apiItem?.final_sales_price_financials_real_gross_profit_margin_without_financing)}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Monthly Gross Profit</Label>
                          <p className="text-lg font-semibold">
                            {money(apiItem?.final_sales_price_financials_monthly_gross_profit)}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">IRR (total)</Label>
                          <p className="text-lg font-semibold">
                            {pct(apiItem?.final_sales_price_financials_total_irr)}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">IRR (financing)</Label>
                          <p className="text-lg font-semibold">
                            {pct(apiItem?.final_sales_price_financials_irr_financing)}
                          </p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Price and Supplier Cost Comparisons */}
                  <AccordionItem value="comparisons">
                    <AccordionTrigger>Price & Supplier Cost Comparisons</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Market Price</Label>
                          <p className="text-lg font-semibold">
                            {money(apiItem?.price_and_supplier_cost_comparisons_market_price)}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">GPM Wanted by Client</Label>
                          <p className="text-lg font-semibold">
                            {pct(apiItem?.price_and_supplier_cost_comparisons_gross_profit_margin_wanted_by_client)}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Ideal Price Given Market Price</Label>
                          <p className="text-lg font-semibold">
                            {money(
                              apiItem?.price_and_supplier_cost_comparisons_ideal_price_to_client_given_market_price,
                            )}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">
                            Supplier Cost Needed (market price)
                          </Label>
                          <p className="text-lg font-semibold">
                            {money(
                              apiItem?.price_and_supplier_cost_comparisons_product_cost_needed_from_supplier_given_market_price,
                            )}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Price Solicited by Client</Label>
                          <p className="text-lg font-semibold">
                            {money(apiItem?.price_and_supplier_cost_comparisons_price_solicited_by_client)}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">
                            Supplier Cost Needed (client price)
                          </Label>
                          <p className="text-lg font-semibold">
                            {money(
                              apiItem?.price_and_supplier_cost_comparisons_product_cost_needed_from_supplier_given_client_solicited_price,
                            )}
                          </p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Taxes & Breakdowns */}
                  <AccordionItem value="taxes-breakdown">
                    <AccordionTrigger>Taxes & Breakdowns</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">IEPS Paid</Label>
                          <p className="text-lg font-semibold">{money(apiItem?.ieps_paid)}</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">IVA Paid</Label>
                          <p className="text-lg font-semibold">{money(apiItem?.iva_paid)}</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Product Cost with IEPS</Label>
                          <p className="text-lg font-semibold">{money(apiItem?.product_cost_with_ieps)}</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Product Cost with Taxes</Label>
                          <p className="text-lg font-semibold">{money(apiItem?.product_cost_with_taxes)}</p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Cashflow & Financing */}
                  <AccordionItem value="cashflow-financing">
                    <AccordionTrigger>Cashflow & Financing</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Total Cashflow Variable Costs</Label>
                          <p className="text-lg font-semibold">{money(apiItem?.total_cash_flow_variable_costs)}</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Total Cashflow</Label>
                          <p className="text-lg font-semibold">{money(apiItem?.total_cash_flow)}</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Financing Cost</Label>
                          <p className="text-lg font-semibold">{money(apiItem?.financing_cost)}</p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
