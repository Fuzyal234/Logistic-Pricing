import logging
from typing import Any

from app.core.supabase_client import get_supabase_client
from app.schemas.pricing import PricingRequest, PricingResponse

logger = logging.getLogger(__name__)


class PricingService:
    """Service for pricing operations"""

    def __init__(self) -> None:
        self.client = get_supabase_client()
        self._rules_cache = {}

    def set_general_pricing_rules(self) -> dict:
        """Get general pricing rules (where client is NULL)"""
        response = (
            self.client.table("general_pricing_rule")
            .select("*")
            .is_("client", "null")
            .execute()
        )
        self.general_pricing_rules = response.data

    def get_pricing_rules_for_customer(
        self, customer_id: str | None = None, rule_name: str | None = None
    ) -> dict[str, Any] | float:
        """
        Get pricing rules for customer (customer-specific if available, otherwise default).
        If rule_name is provided, returns just that rule's value (float).
        If rule_name is None, returns all rules as a dict.
        """
        cache_key = customer_id or "general"

        # Fetch and cache rules if not already cached
        if cache_key not in self._rules_cache:
            self._rules_cache[cache_key] = self._fetch_rules(customer_id)

        # Return specific rule or all rules
        rules = self._rules_cache[cache_key]
        return rules.get(rule_name, 0.0) if rule_name else rules

    def _fetch_rules(self, customer_id: str | None) -> dict[str, float]:
        """Fetch pricing rules from database with fallback to general rules."""
        # Try customer-specific rules first
        if customer_id:
            response = (
                self.client.table("general_pricing_rule")
                .select("*")
                .eq("client", customer_id)
                .execute()
            )

            if response.data:
                logger.info(
                    f"Using customer-specific pricing rules for customer: {customer_id}"
                )
                return {rule["rule_name"]: rule["value"] for rule in response.data}

        # Fallback to general rules
        log_msg = "Using general pricing rules"
        if customer_id:
            log_msg += f" for customer: {customer_id}"
        logger.info(log_msg)

        return {rule["rule_name"]: rule["value"] for rule in self.general_pricing_rules}

    def populate_inputs(self, request: PricingRequest) -> None:
        """Populate inputs"""

        # Clear cache for new request
        self._rules_cache = {}

        # Log which rules will be used (this will trigger the logging in get_pricing_rules_for_customer)
        self.get_pricing_rules_for_customer(request.customer_id)

        result = []
        for product in request.products_list:
            price_to_give_to_client_to_achieve_gross_profit_margin = (
                product.market_price * (1 - product.gross_profit_margin_by_client)
            )

            # Use customer-specific rules if available, otherwise use default rules
            gross_profit_margin_benchmark = self.get_pricing_rules_for_customer(
                request.customer_id, "Gross Profit Margin Benchmark"
            )

            # Normalize if provided as whole percent (e.g., 35 -> 0.35)
            if gross_profit_margin_benchmark > 1:
                gross_profit_margin_benchmark = gross_profit_margin_benchmark / 100

            # AZ14
            total_variable_costs_landed_costs_type_1 = (
                product.variable_costs_type_1_shipping_cost
            )

            # BA14
            landed_costs_for_calculation_of_other_variable_costs = (
                total_variable_costs_landed_costs_type_1 + product.supplier_cost
            )

            # AS14
            variable_costs_type_5_insurance = (
                product.variable_costs_type_5_insurance_percentage
                * landed_costs_for_calculation_of_other_variable_costs
            )

            # AU14=AS15*AT15
            variable_costs_type_5_insurance_tax = (
                variable_costs_type_5_insurance
                * product.variable_costs_type_5_insurance_tax_percentage
            )
            # P14
            variable_costs_type_1_shipping_cost_tax = (
                product.variable_costs_type_1_shipping_cost
                * product.variable_costs_type_1_shipping_tax_percentage
            )
            # V14
            variable_costs_type_2_handling_cost_tax = (
                product.variable_costs_type_2_handling_cost
                * product.variable_costs_type_2_handling_tax_percentage
            )
            # AB14
            variable_costs_type_2_intercedis_tax = (
                product.variable_costs_type_2_intercedis
                * product.variable_costs_type_2_intercedis_tax_percentage
            )

            # BU14=N14+P14+AS14+AU14
            total_cash_flow_variable_costs = (
                product.variable_costs_type_1_shipping_cost
                + variable_costs_type_1_shipping_cost_tax
                + variable_costs_type_5_insurance
                + variable_costs_type_5_insurance_tax
            )
            # M14
            gross_profit_margin_needed = product.inventory_rotation_days * (
                gross_profit_margin_benchmark / 30.42
            )

            # BQ14=I14*J14
            ieps_paid = product.supplier_cost * product.ieps_cost

            # BR14=BQ14+I14
            product_cost_with_ieps = ieps_paid + product.supplier_cost

            # BS14=BR14*K14
            iva_paid = product_cost_with_ieps * product.iva_cost

            # BT14=BR14+BS14
            product_cost_with_taxes = product_cost_with_ieps + iva_paid

            # BV14=BT14+BU14
            total_cash_flow = product_cost_with_taxes + total_cash_flow_variable_costs

            # BY14=(BV14*(BX14/365))*BW14
            financing_cost = (
                total_cash_flow * (product.annual_cost_of_capital_percentage / 365)
            ) * product.financing_days

            # E14=(((D14*(1-(M14+AF14+AL14)))-(N14+BY14))/(1+AR14))-(Z14+T14)
            product_cost_needed_from_supplier_given_market_price = (
                (
                    (
                        price_to_give_to_client_to_achieve_gross_profit_margin
                        * (
                            1
                            - (
                                gross_profit_margin_needed
                                + product.variable_costs_type_3_commission_percentage
                                + product.variable_costs_type_4_logistics_fee_percentage
                            )
                        )
                    )
                    - (product.variable_costs_type_1_shipping_cost + financing_cost)
                )
                / (1 + product.variable_costs_type_5_insurance_percentage)
            ) - (
                product.variable_costs_type_2_handling_cost
                + product.variable_costs_type_2_intercedis
            )

            # G14=(((F14*(1-(M14+AF14+AL14)))-(N14+BY14))/(1+AR14))-(Z14+T14)
            product_cost_needed_from_supplier_given_client_solicited_price = (
                (
                    product.price_solicited_by_client
                    * (
                        1
                        - (
                            gross_profit_margin_needed
                            + product.variable_costs_type_3_commission_percentage
                            + product.variable_costs_type_4_logistics_fee_percentage
                        )
                    )
                )
                - (product.variable_costs_type_1_shipping_cost + financing_cost)
            ) / (1 + product.variable_costs_type_5_insurance_percentage) - (
                product.variable_costs_type_2_handling_cost
                + product.variable_costs_type_2_intercedis
            )

            # BB14 = AS14 + N14
            total_variable_costs_landed_costs_type_1_5 = (
                variable_costs_type_5_insurance
                + product.variable_costs_type_1_shipping_cost
            )

            # BC14 =BB14+I14
            total_landed_cost_for_margin_calculation = (
                product.supplier_cost + total_variable_costs_landed_costs_type_1_5
            )
            # BE14=AL14+AF14
            total_percentage_variable_costs_on_price = (
                product.variable_costs_type_4_logistics_fee_percentage
                + product.variable_costs_type_3_commission_percentage
            )

            # BD14=T15+Z15
            total_pass_through_fixed_cost_type_2 = (
                product.variable_costs_type_2_handling_cost
                + product.variable_costs_type_2_intercedis
            )

            # BZ14=((I14+BB14+BY14)/(1-M14-BE14))+BD14
            suggested_base_sale_price = (
                (
                    product.supplier_cost
                    + total_variable_costs_landed_costs_type_1_5
                    + financing_cost
                )
                / (
                    1
                    - gross_profit_margin_needed
                    - total_percentage_variable_costs_on_price
                )
            ) + total_pass_through_fixed_cost_type_2

            # AG14=AF14*BZ14
            variable_costs_type_3_commission = (
                suggested_base_sale_price
                * product.variable_costs_type_3_commission_percentage
            )
            # AI14=AH15*AG15
            variable_costs_type_3_tax = (
                variable_costs_type_3_commission
                * product.variable_costs_type_3_commission_tax_percentage
            )

            # AM=AL15*BZ14
            variable_costs_type_4_logistics_fee = (
                suggested_base_sale_price
                * product.variable_costs_type_4_logistics_fee_percentage
            )
            # AO14=AN15*AM15
            variable_costs_type_4_logistics_fee_tax = (
                variable_costs_type_4_logistics_fee
                * product.variable_costs_type_4_logistics_fee_tax_percentage
            )

            # BF14=BZ15*BE14
            total_variable_costs_3_4 = (
                suggested_base_sale_price * total_percentage_variable_costs_on_price
            )

            # CS15=H14
            actual_final_sale_price = product.actual_final_sale_price_without_tax

            # BG=CS15*BE15
            total_variable_costs_3_4_actual_sale_price = (
                actual_final_sale_price * total_percentage_variable_costs_on_price
            )

            # BH=BC15+BD15+BF15
            total_landed_cost_all_variable_costs_suggested_price = (
                total_landed_cost_for_margin_calculation
                + total_pass_through_fixed_cost_type_2
                + total_variable_costs_3_4
            )

            # BI=BC15+BD15+BG15
            total_landed_costs_actual_sales_price = (
                total_landed_cost_for_margin_calculation
                + total_pass_through_fixed_cost_type_2
                + total_variable_costs_3_4_actual_sale_price
            )

            # BJ=CS14-BZ14-BI14
            ucm_actual_sale_price = (
                actual_final_sale_price
                - financing_cost
                - total_landed_costs_actual_sales_price
            )

            # BQ=BJ14*BN14
            contribution_margin = (
                ucm_actual_sale_price * product.units_to_sell_per_month
            )

            # CS=H15 (moved here for early use)
            actual_price_to_client_financial_breakdown_actual_final_sale_price = (
                product.actual_final_sale_price_without_tax
            )

            # CT=CS15*J15 (moved here for early use)
            actual_price_to_client_financial_breakdown_ieps = (
                actual_price_to_client_financial_breakdown_actual_final_sale_price
                * product.ieps_cost
            )

            # BP15=BN14*(H14-BY14)
            total_projected_monthly_sales = product.units_to_sell_per_month * (
                product.actual_final_sale_price_without_tax - financing_cost
            )
            monthly_fixed_cost = self.get_pricing_rules_for_customer(
                request.customer_id, "Monthly Fixed Cost"
            )

            monthly_break_even_units = (
                (product.monthly_fix_cost_percentage * monthly_fixed_cost)
                / ucm_actual_sale_price
                if ucm_actual_sale_price != 0
                else 0
            )

            # BM= (BK14*$D$7)/(BJ14-($D$8*CT14))
            target_net_profit_margin = self.get_pricing_rules_for_customer(
                request.customer_id, "Target net profit margin"
            )

            denominator_target_units = ucm_actual_sale_price - (
                (lambda v: v / 100 if v > 1 else v)(target_net_profit_margin)
                * actual_price_to_client_financial_breakdown_actual_final_sale_price
            )
            monthly_target_units = (
                (product.monthly_fix_cost_percentage * monthly_fixed_cost)
                / denominator_target_units
                if denominator_target_units != 0
                else 0
            )
            # BO=((BK15*$D$7)+(BN15*BH15))/(BN15*(1-$D$8))+BZ15
            if (
                product.units_to_sell_per_month
                * (1 - (lambda v: v / 100 if v > 1 else v)(target_net_profit_margin))
            ) != 0:
                required_price_with_projected_units_plus_financing_minus_price_per_unit = (
                    (
                        (monthly_fixed_cost * product.monthly_fix_cost_percentage)
                        + product.units_to_sell_per_month
                        * total_landed_costs_actual_sales_price
                    )
                    / (
                        product.units_to_sell_per_month
                        * (
                            1
                            - (lambda v: v / 100 if v > 1 else v)(
                                target_net_profit_margin
                            )
                        )
                    )
                ) + financing_cost
            else:
                required_price_with_projected_units_plus_financing_minus_price_per_unit = (
                    0
                )
            # CA=BZ14*J14
            suggested_price_to_client_financial_breakdown_ieps = (
                suggested_base_sale_price * product.ieps_cost
            )

            # CB=(BZ16+CA16)*K16
            suggested_price_to_client_financial_breakdown_iva = (
                suggested_base_sale_price
                + suggested_price_to_client_financial_breakdown_ieps
            ) * product.iva_cost

            # CC=BZ15+CA15+CB15
            suggested_price_to_client_financial_breakdown_total_price_with_taxes = (
                suggested_base_sale_price
                + suggested_price_to_client_financial_breakdown_ieps
                + suggested_price_to_client_financial_breakdown_iva
            )

            # CD=BZ14-BH14
            suggested_price_to_client_financial_breakdown_profit = (
                suggested_base_sale_price
                - total_landed_cost_all_variable_costs_suggested_price
            )

            # CE=CD14/BZ14
            suggested_price_to_client_financial_breakdown_total_gross_profit_margin = (
                suggested_price_to_client_financial_breakdown_profit
                / suggested_base_sale_price
                if suggested_base_sale_price != 0
                else 0
            )

            # CF=((BZ14-BY14)-BH14)/BZ14
            suggested_price_to_client_financial_breakdown_real_gross_profit_margin_without_financing = (
                (
                    (suggested_base_sale_price - financing_cost)
                    - total_landed_cost_all_variable_costs_suggested_price
                )
                / suggested_base_sale_price
                if suggested_base_sale_price != 0
                else 0
            )

            # CG=BQ14
            suggested_price_to_client_financial_breakdown_total_ieps_paid = ieps_paid

            # CH=BS14+V14+P14+AB14+AU14
            suggested_price_to_client_financial_breakdown_total_iva_paid = (
                iva_paid
                + variable_costs_type_2_handling_cost_tax
                + variable_costs_type_1_shipping_cost_tax
                + variable_costs_type_2_intercedis_tax
                + variable_costs_type_5_insurance_tax
            )

            # CI=BZ15-AM15
            suggested_price_to_client_financial_breakdown_base_price_with_discount_applied = (
                suggested_base_sale_price - variable_costs_type_4_logistics_fee
            )

            # CJ=CI15*J15
            suggested_price_to_client_financial_breakdown_ieps_to_pay = (
                suggested_price_to_client_financial_breakdown_base_price_with_discount_applied
                * product.ieps_cost
            )

            # CK=(CI14+CJ14)*K14
            suggested_price_to_client_financial_breakdown_iva_to_pay = (
                suggested_price_to_client_financial_breakdown_base_price_with_discount_applied
                + suggested_price_to_client_financial_breakdown_ieps_to_pay
            ) * product.iva_cost

            # CL=CJ14-CG14
            suggested_price_to_client_financial_breakdown_final_ieps_to_pay = (
                suggested_price_to_client_financial_breakdown_ieps_to_pay
                - suggested_price_to_client_financial_breakdown_total_ieps_paid
            )

            # CM=CK14-CH14
            suggested_price_to_client_financial_breakdown_final_iva_to_pay = (
                suggested_price_to_client_financial_breakdown_iva_to_pay
                - suggested_price_to_client_financial_breakdown_total_iva_paid
            )

            # CN=CI15+CJ15+CK15-CL15-CM15
            suggested_price_to_client_financial_breakdown_total_final_cashflow_received = (
                suggested_price_to_client_financial_breakdown_base_price_with_discount_applied
                + suggested_price_to_client_financial_breakdown_ieps_to_pay
                + suggested_price_to_client_financial_breakdown_iva_to_pay
                - suggested_price_to_client_financial_breakdown_final_ieps_to_pay
                - suggested_price_to_client_financial_breakdown_final_iva_to_pay
            )

            # CO=((CN15/BV15)^(365/BW15))-1
            if total_cash_flow != 0 and product.financing_days != 0:
                suggested_price_to_client_financial_breakdown_total_irr = (
                    (
                        suggested_price_to_client_financial_breakdown_total_final_cashflow_received
                        / total_cash_flow
                    )
                    ** (365 / product.financing_days)
                ) - 1
            else:
                suggested_price_to_client_financial_breakdown_total_irr = 0

            # CP=BY15+BV15
            suggested_price_to_client_financial_breakdown_cashflow_received_only_financing = (
                financing_cost + total_cash_flow
            )

            # CQ=((CP14/BV14)^(365/BW14))-1
            if total_cash_flow != 0 and product.financing_days != 0:
                suggested_price_to_client_financial_breakdown_irr_only_financing = (
                    (
                        suggested_price_to_client_financial_breakdown_cashflow_received_only_financing
                        / total_cash_flow
                    )
                    ** (365 / product.financing_days)
                ) - 1
            else:
                suggested_price_to_client_financial_breakdown_irr_only_financing = 0

            # CU=(CS17+CA17)*K17
            actual_price_to_client_financial_breakdown_iva = (
                actual_price_to_client_financial_breakdown_actual_final_sale_price
                + suggested_price_to_client_financial_breakdown_ieps
            ) * product.iva_cost

            # CV=CS15+CT15+CU15
            actual_price_to_client_financial_breakdown_total_price_with_taxes = (
                actual_price_to_client_financial_breakdown_actual_final_sale_price
                + actual_price_to_client_financial_breakdown_ieps
                + actual_price_to_client_financial_breakdown_iva
            )

            # CW=CS14-BI14
            actual_price_to_client_financial_breakdown_profit = (
                actual_price_to_client_financial_breakdown_actual_final_sale_price
                - total_landed_costs_actual_sales_price
            )

            # CX=CW15/CS15
            if actual_price_to_client_financial_breakdown_actual_final_sale_price != 0:
                actual_price_to_client_financial_breakdown_total_gross_profit_margin = (
                    actual_price_to_client_financial_breakdown_profit
                    / actual_price_to_client_financial_breakdown_actual_final_sale_price
                )
            else:
                actual_price_to_client_financial_breakdown_total_gross_profit_margin = 0

            # CY=((CS15-BY15)-BI15)/CS15
            if actual_price_to_client_financial_breakdown_actual_final_sale_price != 0:
                actual_price_to_client_financial_breakdown_real_gross_profit_margin_without_financing = (
                    (
                        (
                            actual_price_to_client_financial_breakdown_actual_final_sale_price
                            - financing_cost
                        )
                        - total_landed_costs_actual_sales_price
                    )
                    / actual_price_to_client_financial_breakdown_actual_final_sale_price
                )
            else:
                actual_price_to_client_financial_breakdown_real_gross_profit_margin_without_financing = (
                    0
                )

            # CZ=BQ15
            actual_price_to_client_financial_breakdown_total_ieps_payed = ieps_paid

            # DA=BS14+V14+P14+AB14+AU14
            actual_price_to_client_financial_breakdown_total_iva_paid = (
                iva_paid
                + variable_costs_type_2_handling_cost_tax
                + variable_costs_type_1_shipping_cost_tax
                + variable_costs_type_2_intercedis_tax
                + variable_costs_type_5_insurance_tax
            )

            # DB=CS15-(AL15*CS15)
            actual_price_to_client_financial_breakdown_base_price_with_discounts_applied = actual_price_to_client_financial_breakdown_actual_final_sale_price - (
                product.variable_costs_type_4_logistics_fee_percentage
                * actual_final_sale_price
            )

            # DC=DB15*J15
            actual_price_to_client_financial_breakdown_ieps_to_pay = (
                actual_price_to_client_financial_breakdown_base_price_with_discounts_applied
                * product.ieps_cost
            )

            # DD=(DB16+DC16)*K16
            actual_price_to_client_financial_breakdown_iva_to_pay = (
                actual_price_to_client_financial_breakdown_base_price_with_discounts_applied
                + actual_price_to_client_financial_breakdown_ieps_to_pay
            ) * product.iva_cost

            # DE=DC14-CZ14
            actual_price_to_client_financial_breakdown_final_ieps_to_pay = (
                actual_price_to_client_financial_breakdown_ieps_to_pay
                - actual_price_to_client_financial_breakdown_total_ieps_payed
            )

            # DF=DD14-DA14
            actual_price_to_client_financial_breakdown_final_iva_to_pay = (
                actual_price_to_client_financial_breakdown_iva_to_pay
                - actual_price_to_client_financial_breakdown_total_iva_paid
            )

            # DG=DB14+DC14+DD14-DE14-DF14
            actual_price_to_client_financial_breakdown_total_final_cashflow_received = (
                actual_price_to_client_financial_breakdown_base_price_with_discounts_applied
                + actual_price_to_client_financial_breakdown_ieps_to_pay
                + actual_price_to_client_financial_breakdown_iva_to_pay
                - actual_price_to_client_financial_breakdown_final_ieps_to_pay
                - actual_price_to_client_financial_breakdown_final_iva_to_pay
            )

            # DH=((DG15/BV15)^(365/BW15))-1
            if total_cash_flow != 0 and product.financing_days != 0:
                actual_price_to_client_financial_breakdown_total_irr = (
                    (
                        actual_price_to_client_financial_breakdown_total_final_cashflow_received
                        / total_cash_flow
                    )
                    ** (365 / product.financing_days)
                ) - 1
            else:
                actual_price_to_client_financial_breakdown_total_irr = 0

            # DI=BY14+BV14
            actual_price_to_client_financial_breakdown_cashflow_received_only_financing = (
                financing_cost + total_cash_flow
            )

            # DJ=((DI14/BV14)^(365/BW14))-1
            if total_cash_flow != 0 and product.financing_days != 0:
                actual_price_to_client_financial_breakdown_irr_only_financing = (
                    (
                        actual_price_to_client_financial_breakdown_cashflow_received_only_financing
                        / total_cash_flow
                    )
                    ** (365 / product.financing_days)
                ) - 1
            else:
                actual_price_to_client_financial_breakdown_irr_only_financing = 0

            # DM=BZ15
            suggested_price_financials_suggested_sale_price_without_taxes = (
                suggested_base_sale_price
            )

            # DN=CC14
            suggested_price_financials_suggested_sale_price_with_taxes = (
                suggested_price_to_client_financial_breakdown_total_price_with_taxes
            )

            # DO=CD14
            suggested_price_financials_suggested_price_profit = (
                suggested_price_to_client_financial_breakdown_profit
            )

            # DP=CE15
            suggested_price_financials_total_gross_profit_margin_suggested_price = (
                suggested_price_to_client_financial_breakdown_total_gross_profit_margin
            )

            # DQ=CF15
            suggested_price_financials_real_gross_profit_margin_without_financing_suggested_price = suggested_price_to_client_financial_breakdown_real_gross_profit_margin_without_financing

            # DR=CO15
            suggested_price_financials_total_irr = (
                suggested_price_to_client_financial_breakdown_total_irr
            )

            # DS=CQ15
            suggested_price_financials_irr_financing = (
                suggested_price_to_client_financial_breakdown_irr_only_financing
            )

            # DU=CS14
            final_sales_price_financials_actual_final_sale_price = (
                actual_price_to_client_financial_breakdown_actual_final_sale_price
            )

            # DV=CV14
            final_sales_price_financials_actual_final_sale_price_with_taxes = (
                actual_price_to_client_financial_breakdown_total_price_with_taxes
            )

            # DW=CW15
            final_sales_price_financials_profit = (
                actual_price_to_client_financial_breakdown_profit
            )

            # DX=CX14
            final_sales_price_financials_total_gross_profit_margin = (
                actual_price_to_client_financial_breakdown_total_gross_profit_margin
            )

            # DY=CY14
            final_sales_price_financials_real_gross_profit_margin_without_financing = actual_price_to_client_financial_breakdown_real_gross_profit_margin_without_financing

            # DZ=DY15*($D$6/L15)
            days_in_month_benchmark = self.get_pricing_rules_for_customer(
                request.customer_id, "Days in a month benchmark"
            )
            logger.debug(f"Days in a month benchmark: {days_in_month_benchmark}")

            if product.inventory_rotation_days != 0:
                final_sales_price_financials_monthly_gross_profit = (
                    final_sales_price_financials_real_gross_profit_margin_without_financing
                    * (days_in_month_benchmark / product.inventory_rotation_days)
                )
            else:
                final_sales_price_financials_monthly_gross_profit = 0
            # EA=DH14
            final_sales_price_financials_total_irr = (
                actual_price_to_client_financial_breakdown_total_irr
            )

            # EB=DJ14
            final_sales_price_financials_irr_financing = (
                actual_price_to_client_financial_breakdown_irr_only_financing
            )

            # EE=B14
            price_and_supplier_cost_comparisons_market_price = product.market_price

            # EF=C14
            price_and_supplier_cost_comparisons_gross_profit_margin_wanted_by_client = (
                product.gross_profit_margin_by_client
            )

            # EG=D14
            price_and_supplier_cost_comparisons_ideal_price_to_client_given_market_price = (
                price_to_give_to_client_to_achieve_gross_profit_margin
            )

            # EH=E14
            price_and_supplier_cost_comparisons_product_cost_needed_from_supplier_given_market_price = (
                product_cost_needed_from_supplier_given_market_price
            )

            # EI=F15
            price_and_supplier_cost_comparisons_price_solicited_by_client = (
                product.price_solicited_by_client
            )

            # EJ=G14
            price_and_supplier_cost_comparisons_product_cost_needed_from_supplier_given_client_solicited_price = (
                product_cost_needed_from_supplier_given_client_solicited_price
            )

            result.append(
                {
                    "product_sku": product.sku,
                    "price_to_give_to_client_to_achieve_gross_profit_margin": price_to_give_to_client_to_achieve_gross_profit_margin,
                    "product_cost_needed_from_supplier_given_market_price": product_cost_needed_from_supplier_given_market_price,
                    "product_cost_needed_from_supplier_given_client_solicited_price": product_cost_needed_from_supplier_given_client_solicited_price,
                    "gross_profit_margin_needed": gross_profit_margin_needed,
                    "variable_costs_type_1_shipping_cost_tax": variable_costs_type_1_shipping_cost_tax,
                    "variable_costs_type_2_handling_cost_tax": variable_costs_type_2_handling_cost_tax,
                    "variable_costs_type_2_intercedis_tax": variable_costs_type_2_intercedis_tax,
                    "variable_costs_type_3_commission": variable_costs_type_3_commission,
                    "variable_costs_type_3_tax": variable_costs_type_3_tax,
                    "variable_costs_type_4_logistics_fee": variable_costs_type_4_logistics_fee,
                    "variable_costs_type_4_logistics_fee_tax": variable_costs_type_4_logistics_fee_tax,
                    "variable_costs_type_5_insurance": variable_costs_type_5_insurance,
                    "variable_costs_type_5_insurance_tax": variable_costs_type_5_insurance_tax,
                    "total_variable_costs_landed_costs_type_1": total_variable_costs_landed_costs_type_1,
                    "landed_costs_for_calculation_of_other_variable_costs": landed_costs_for_calculation_of_other_variable_costs,
                    "total_variable_costs_landed_costs_type_1_5": total_variable_costs_landed_costs_type_1_5,
                    "total_landed_cost_for_margin_calculation": total_landed_cost_for_margin_calculation,
                    "total_pass_through_fixed_cost_type_2": total_pass_through_fixed_cost_type_2,
                    "total_percentage_variable_costs_on_price": total_percentage_variable_costs_on_price,
                    "total_variable_costs_3_4": total_variable_costs_3_4,
                    "total_variable_costs_3_4_actual_sale_price": total_variable_costs_3_4_actual_sale_price,
                    "total_landed_cost_all_variable_costs_suggested_price": total_landed_cost_all_variable_costs_suggested_price,
                    "total_landed_costs_actual_sales_price": total_landed_costs_actual_sales_price,
                    "ucm_actual_sale_price": ucm_actual_sale_price,
                    "monthly_break_even_units": monthly_break_even_units,
                    "monthly_target_units": monthly_target_units,
                    "required_price_with_projected_units_plus_financing_minus_price_per_unit": required_price_with_projected_units_plus_financing_minus_price_per_unit,
                    "total_projected_monthly_sales": total_projected_monthly_sales,
                    "contribution_margin": contribution_margin,
                    "ieps_paid": ieps_paid,
                    "product_cost_with_ieps": product_cost_with_ieps,
                    "iva_paid": iva_paid,
                    "product_cost_with_taxes": product_cost_with_taxes,
                    "total_cash_flow_variable_costs": total_cash_flow_variable_costs,
                    "total_cash_flow": total_cash_flow,
                    "financing_cost": financing_cost,
                    "suggested_base_sale_price": suggested_base_sale_price,
                    "suggested_price_to_client_financial_breakdown_ieps": suggested_price_to_client_financial_breakdown_ieps,
                    "suggested_price_to_client_financial_breakdown_iva": suggested_price_to_client_financial_breakdown_iva,
                    "suggested_price_to_client_financial_breakdown_total_price_with_taxes": suggested_price_to_client_financial_breakdown_total_price_with_taxes,
                    "suggested_price_to_client_financial_breakdown_profit": suggested_price_to_client_financial_breakdown_profit,
                    "suggested_price_to_client_financial_breakdown_total_gross_profit_margin": suggested_price_to_client_financial_breakdown_total_gross_profit_margin,
                    "suggested_price_to_client_financial_breakdown_real_gross_profit_margin_without_financing": suggested_price_to_client_financial_breakdown_real_gross_profit_margin_without_financing,
                    "suggested_price_to_client_financial_breakdown_total_ieps_paid": suggested_price_to_client_financial_breakdown_total_ieps_paid,
                    "suggested_price_to_client_financial_breakdown_total_iva_paid": suggested_price_to_client_financial_breakdown_total_iva_paid,
                    "suggested_price_to_client_financial_breakdown_base_price_with_discount_applied": suggested_price_to_client_financial_breakdown_base_price_with_discount_applied,
                    "suggested_price_to_client_financial_breakdown_ieps_to_pay": suggested_price_to_client_financial_breakdown_ieps_to_pay,
                    "suggested_price_to_client_financial_breakdown_iva_to_pay": suggested_price_to_client_financial_breakdown_iva_to_pay,
                    "suggested_price_to_client_financial_breakdown_final_ieps_to_pay": suggested_price_to_client_financial_breakdown_final_ieps_to_pay,
                    "suggested_price_to_client_financial_breakdown_final_iva_to_pay": suggested_price_to_client_financial_breakdown_final_iva_to_pay,
                    "suggested_price_to_client_financial_breakdown_total_final_cashflow_received": suggested_price_to_client_financial_breakdown_total_final_cashflow_received,
                    "suggested_price_to_client_financial_breakdown_total_irr": suggested_price_to_client_financial_breakdown_total_irr,
                    "suggested_price_to_client_financial_breakdown_cashflow_received_only_financing": suggested_price_to_client_financial_breakdown_cashflow_received_only_financing,
                    "suggested_price_to_client_financial_breakdown_irr_only_financing": suggested_price_to_client_financial_breakdown_irr_only_financing,
                    "actual_price_to_client_financial_breakdown_actual_final_sale_price": actual_price_to_client_financial_breakdown_actual_final_sale_price,
                    "actual_price_to_client_financial_breakdown_ieps": actual_price_to_client_financial_breakdown_ieps,
                    "actual_price_to_client_financial_breakdown_iva": actual_price_to_client_financial_breakdown_iva,
                    "actual_price_to_client_financial_breakdown_total_price_with_taxes": actual_price_to_client_financial_breakdown_total_price_with_taxes,
                    "actual_price_to_client_financial_breakdown_profit": actual_price_to_client_financial_breakdown_profit,
                    "actual_price_to_client_financial_breakdown_total_gross_profit_margin": actual_price_to_client_financial_breakdown_total_gross_profit_margin,
                    "actual_price_to_client_financial_breakdown_real_gross_profit_margin_without_financing": actual_price_to_client_financial_breakdown_real_gross_profit_margin_without_financing,
                    "actual_price_to_client_financial_breakdown_total_ieps_payed": actual_price_to_client_financial_breakdown_total_ieps_payed,
                    "actual_price_to_client_financial_breakdown_total_iva_paid": actual_price_to_client_financial_breakdown_total_iva_paid,
                    "actual_price_to_client_financial_breakdown_base_price_with_discounts_applied": actual_price_to_client_financial_breakdown_base_price_with_discounts_applied,
                    "actual_price_to_client_financial_breakdown_ieps_to_pay": actual_price_to_client_financial_breakdown_ieps_to_pay,
                    "actual_price_to_client_financial_breakdown_iva_to_pay": actual_price_to_client_financial_breakdown_iva_to_pay,
                    "actual_price_to_client_financial_breakdown_final_ieps_to_pay": actual_price_to_client_financial_breakdown_final_ieps_to_pay,
                    "actual_price_to_client_financial_breakdown_final_iva_to_pay": actual_price_to_client_financial_breakdown_final_iva_to_pay,
                    "actual_price_to_client_financial_breakdown_total_final_cashflow_received": actual_price_to_client_financial_breakdown_total_final_cashflow_received,
                    "actual_price_to_client_financial_breakdown_total_irr": actual_price_to_client_financial_breakdown_total_irr,
                    "actual_price_to_client_financial_breakdown_cashflow_received_only_financing": actual_price_to_client_financial_breakdown_cashflow_received_only_financing,
                    "actual_price_to_client_financial_breakdown_irr_only_financing": actual_price_to_client_financial_breakdown_irr_only_financing,
                    "suggested_price_financials_suggested_sale_price_without_taxes": suggested_price_financials_suggested_sale_price_without_taxes,
                    "suggested_price_financials_suggested_sale_price_with_taxes": suggested_price_financials_suggested_sale_price_with_taxes,
                    "suggested_price_financials_suggested_price_profit": suggested_price_financials_suggested_price_profit,
                    "suggested_price_financials_total_gross_profit_margin_suggested_price": suggested_price_financials_total_gross_profit_margin_suggested_price,
                    "suggested_price_financials_real_gross_profit_margin_without_financing_suggested_price": suggested_price_financials_real_gross_profit_margin_without_financing_suggested_price,
                    "suggested_price_financials_total_irr": suggested_price_financials_total_irr,
                    "suggested_price_financials_irr_financing": suggested_price_financials_irr_financing,
                    "final_sales_price_financials_actual_final_sale_price": final_sales_price_financials_actual_final_sale_price,
                    "final_sales_price_financials_actual_final_sale_price_with_taxes": final_sales_price_financials_actual_final_sale_price_with_taxes,
                    "final_sales_price_financials_profit": final_sales_price_financials_profit,
                    "final_sales_price_financials_total_gross_profit_margin": final_sales_price_financials_total_gross_profit_margin,
                    "final_sales_price_financials_real_gross_profit_margin_without_financing": final_sales_price_financials_real_gross_profit_margin_without_financing,
                    "final_sales_price_financials_monthly_gross_profit": final_sales_price_financials_monthly_gross_profit,
                    "final_sales_price_financials_total_irr": final_sales_price_financials_total_irr,
                    "final_sales_price_financials_irr_financing": final_sales_price_financials_irr_financing,
                    "price_and_supplier_cost_comparisons_market_price": price_and_supplier_cost_comparisons_market_price,
                    "price_and_supplier_cost_comparisons_gross_profit_margin_wanted_by_client": price_and_supplier_cost_comparisons_gross_profit_margin_wanted_by_client,
                    "price_and_supplier_cost_comparisons_ideal_price_to_client_given_market_price": price_and_supplier_cost_comparisons_ideal_price_to_client_given_market_price,
                    "price_and_supplier_cost_comparisons_product_cost_needed_from_supplier_given_market_price": price_and_supplier_cost_comparisons_product_cost_needed_from_supplier_given_market_price,
                    "price_and_supplier_cost_comparisons_price_solicited_by_client": price_and_supplier_cost_comparisons_price_solicited_by_client,
                    "price_and_supplier_cost_comparisons_product_cost_needed_from_supplier_given_client_solicited_price": price_and_supplier_cost_comparisons_product_cost_needed_from_supplier_given_client_solicited_price,
                }
            )

        return result

    def evaluate_pricing(self, request: PricingRequest) -> PricingResponse:
        """Evaluate pricing"""
        result_data = self.populate_inputs(request)
        return PricingResponse(
            message="Pricing evaluated successfully", data=result_data
        )
