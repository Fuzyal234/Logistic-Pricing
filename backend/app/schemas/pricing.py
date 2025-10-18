from pydantic import BaseModel


class Product(BaseModel):
    """Product schema"""

    distribution_center_uuid: str

    sku: str
    quantity: int
    market_price: float
    gross_profit_margin_by_client: float
    price_solicited_by_client: float
    actual_final_sale_price_without_tax: float
    supplier_cost: float
    ieps_cost: float
    iva_cost: float
    inventory_rotation_days: int

    # Variable Costs Type 1
    variable_costs_type_1_shipping_cost: float
    variable_costs_type_1_shipping_tax_percentage: float
    variable_costs_type_1_markup_rule: str
    variable_costs_type_1_markup_type: str
    variable_costs_type_1_cashflow: bool

    # Variable Costs Type 2
    variable_costs_type_2_handling_cost: float
    variable_costs_type_2_handling_tax_percentage: float
    variable_costs_type_2_handling_markup_rule: str
    variable_costs_type_2_handling_markup_type: str
    variable_costs_type_2_handling_cashflow: bool
    variable_costs_type_2_intercedis: float
    variable_costs_type_2_intercedis_tax_percentage: float
    variable_costs_type_2_intercedis_markup_rule: str
    variable_costs_type_2_intercedis_markup_type: str
    variable_costs_type_2_intercedis_cashflow: bool

    # Variable Costs Type 3
    variable_costs_type_3_commission_percentage: float
    variable_costs_type_3_commission_tax_percentage: float
    variable_costs_type_3_commission_markup_rule: str
    variable_costs_type_3_commission_markup_type: str

    # Variable Costs Type 4
    variable_costs_type_4_logistics_fee_percentage: float
    variable_costs_type_4_logistics_fee_tax_percentage: float
    variable_costs_type_4_logistics_fee_markup_rule: str
    variable_costs_type_4_logistics_fee_markup_type: str

    # Variable Costs Type 5
    variable_costs_type_5_insurance_percentage: float
    variable_costs_type_5_insurance_tax_percentage: float
    variable_costs_type_5_insurance_markup_rule: str
    variable_costs_type_5_insurance_markup_type: str
    variable_costs_type_5_insurance_cashflow: bool

    units_to_sell_per_month: int
    monthly_fix_cost_percentage: float
    financing_days: int
    annual_cost_of_capital_percentage: float


class PricingRequest(BaseModel):
    """Pricing request schema"""

    products_list: list[Product]
    customer_id: str | None = None


class PricingResponse(BaseModel):
    """Pricing response schema"""

    message: str
    data: list[dict]
