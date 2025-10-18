import logging

from app.core.supabase_client import get_supabase_client
from app.schemas.import_calculator import (
    ImportCalculatorRequest,
    ImportCalculatorResponse,
)

logger = logging.getLogger(__name__)


class ImportCalculatorService:
    """Service for import calculator operations"""

    def __init__(self) -> None:
        self.client = get_supabase_client()

        self._daily_rate_by_currency = {
            "MXN": 0.0004,
            "USD": 0.0003,
        }

    def _get_calculator_value(self, name: str) -> float:
        """Get a value from the import_calculator_values table by name"""
        try:
            response = (
                self.client.table("import_calculator_values")
                .select("value")
                .eq("name", name)
                .execute()
            )

            if response.data and len(response.data) > 0:
                return float(response.data[0]["value"])
            else:
                logger.warning(
                    f"No value found for {name} in import_calculator_values table"
                )
                return 0.0
        except Exception as e:
            logger.error(f"Error fetching value for {name}: {e}")
            return 0.0

    def populate_inputs(self, request: ImportCalculatorRequest) -> None:
        """Populate inputs"""

        result = []
        for calculator_input in request.calculator_input_list:

            # B21 =B19/(1-B20)
            price_with_margin = calculator_input.price / (1 - calculator_input.margin)

            # Get daily rates for USD and MXN
            daily_rate_usd = self._daily_rate_by_currency.get("USD", 0)
            daily_rate_mxn = self._daily_rate_by_currency.get("MXN", 0)

            # B23 =VLOOKUP(C21,$H$1:$J$3,3)*B19*B22 -----> the currency is USD
            financing_cost = (
                daily_rate_usd * calculator_input.price * calculator_input.days_t_0
            )

            # B24 =IF(C24="Si",IF(C23="MXN",B19*$S$3,IF(C23="USD",B19*$S$2,0)),0)
            iva = 0.16 * calculator_input.price

            # B25 = B22
            days_t_0_iva = calculator_input.days_t_0

            # B26 ==VLOOKUP(C21,$H$1:$J$3,3)*B24*B25 ----- the currency is USD
            financing_cost_iva = daily_rate_usd * iva * days_t_0_iva

            # B29 = VLOOKUP(C27,$H$1:$J$3,3)*B27*B28, -----> the currency is USD
            international_freight_financing_cost = (
                daily_rate_usd
                * calculator_input.international_freight
                * calculator_input.international_freight_days_t_0
            )

            # B30 = =IF(C30="Si",IF(C29="MXN",B27*$S$3,IF(C29="USD",B27*$S$2,0)),0)
            international_freight_iva = 0.16 * calculator_input.international_freight

            # B31 = B28
            international_freight_days_t_0_iva = (
                calculator_input.international_freight_days_t_0
            )

            # B32 =  VLOOKUP(C27,$H$1:$J$3,3)*B30*B31 -----> the currency is USD
            international_freight_financing_cost_iva = (
                daily_rate_usd
                * international_freight_iva
                * international_freight_days_t_0_iva
            )

            # B34 = (B19+B27)*B33
            international_insurance_cost = (
                calculator_input.price + calculator_input.international_freight
            ) * calculator_input.international_insurance_percentage

            # B36 = VLOOKUP(C27,$H$1:$J$3,3)*B34*B35 -----> the currency is MXN
            international_insurance_financing_cost = (
                daily_rate_mxn
                * international_insurance_cost
                * calculator_input.international_insurance_days_t_0
            )

            # B37 =IF(C37="Si",IF(C36="MXN",B34*$S$3,IF(C36="USD",B34*$S$2,0)),0)
            international_insurance_iva = 0.16 * international_insurance_cost

            # B38 = B35
            international_insurance_days_t_0_iva = (
                calculator_input.international_insurance_days_t_0
            )

            # B39 =VLOOKUP(C34,$H$1:$J$3,3)*B37*B38 -----> the currency is MXN
            international_insurance_financing_cost_iva = (
                daily_rate_mxn
                * international_insurance_iva
                * international_insurance_days_t_0_iva
            )

            # B40 =$M$2/B11
            # Fetch DTA value from database table
            dta_value = self._get_calculator_value("DTA")
            dta_amount = dta_value / calculator_input.boxes_per_logistics

            # B42 =VLOOKUP(C40,$H$1:$J$3,3)*B40*B41 -----> the currency is MXN
            dta_amount_financing_cost = (
                daily_rate_mxn * dta_amount * calculator_input.dta_amount_days_t_0
            )

            # B43 =IF(C43="Si",IF(C42="MXN",B40*$S$3,IF(C42="USD",B40*$S$2,0)),0)
            dta_amount_iva = dta_amount

            # B44 = B41
            dta_amount_days_t_0_iva = calculator_input.dta_amount_days_t_0

            # B45 ==VLOOKUP(C40,$H$1:$J$3,3)*B43*B44 -----> the currency is MXN
            dta_amount_financing_cost_iva = (
                daily_rate_mxn * dta_amount_iva * dta_amount_days_t_0_iva
            )

            # B46 = $N$2/B11
            customs_expenses = (
                self._get_calculator_value("Customs Expenses (MXN)")
                / calculator_input.boxes_per_logistics
            )

            # B48 =VLOOKUP(C46,$H$1:$J$3,3)*B46*B47
            customs_expenses_financing_cost = (
                daily_rate_mxn
                * customs_expenses
                * calculator_input.customs_expenses_days_t_0
            )

            # B49 =IF(C49="Si",IF(C48="MXN",B46*$S$3,IF(C48="USD",B46*$S$2,0)),0)
            customs_expenses_iva = (
                0  # TODO: Implement conditional logic based on currency
            )

            # B50 = B47
            customs_expenses_days_t_0_iva = calculator_input.customs_expenses_days_t_0

            # B51 =VLOOKUP(C46,$H$1:$J$3,3)*B49*B50 -----> the currency is MXN
            customs_expenses_financing_cost_iva = (
                daily_rate_mxn * customs_expenses_iva * customs_expenses_days_t_0_iva
            )

            # B54 =VLOOKUP(C52,$H$1:$J$3,3)*B52*B53 -----> the currency is MXN
            domestic_freight_financing_cost = (
                daily_rate_mxn
                * calculator_input.domestic_freight
                * calculator_input.domestic_freight_days_t_0
            )

            # B55 = IF(C55="Si",IF(C54="MXN",B52*$S$3,IF(C54="USD",B52*$S$2,0)),0)
            domestic_freight_iva = (
                0  # TODO: Implement conditional logic based on currency
            )

            # B56 = B53
            domestic_freight_days_t_0_iva = calculator_input.domestic_freight_days_t_0

            # B57 =VLOOKUP(C52,$H$1:$J$3,3)*B55*B56 -----> the currency is MXN
            domestic_freight_financing_cost_iva = (
                daily_rate_mxn * domestic_freight_iva * domestic_freight_days_t_0_iva
            )

            # B58 = 0
            domestic_insurance_percentage = 0

            # B61 =VLOOKUP(C59,$H$1:$J$3,3)*B59*B60 here the currency is USD
            domestic_insurance_financing_cost = (
                daily_rate_usd
                * calculator_input.domestic_insurance_cost
                * calculator_input.domestic_insurance_days_t_0
            )

            # B62 =IF(C62="Si",IF(C61="MXN",B59*$S$3,IF(C61="USD",B59*$S$2,0)),0)
            domestic_insurance_iva = (
                0  # TODO: Implement conditional logic based on currency
            )

            # B63 = B60
            domestic_insurance_days_t_0_iva = (
                calculator_input.domestic_insurance_days_t_0
            )

            # B64 =VLOOKUP(C59,$H$1:$J$3,3)*B62*B63 -----> the currency is MXN
            domestic_insurance_financing_cost_iva = (
                daily_rate_mxn
                * domestic_insurance_iva
                * domestic_insurance_days_t_0_iva
            )

            # B67 = =VLOOKUP(C65,$H$1:$J$3,3)*B65*B66 the currency is MXN
            labeling_cost_financing_cost = (
                daily_rate_mxn
                * calculator_input.labeling_cost
                * calculator_input.labeling_cost_days_t_0
            )

            # B68 ==IF(C68="Si",IF(C67="MXN",B65*$S$3,IF(C67="USD",B65*$S$2,0)),0)
            labeling_cost_iva = 0  # TODO: Implement conditional logic based on currency

            # B69 = B66
            labeling_cost_days_t_0_iva = calculator_input.labeling_cost_days_t_0

            # B70 =VLOOKUP(C65,$H$1:$J$3,3)*B68*B69 the currency is MXN
            labeling_cost_financing_cost_iva = (
                daily_rate_mxn * labeling_cost_iva * labeling_cost_days_t_0_iva
            )

            # B73 = =VLOOKUP(C71,$H$1:$J$3,3)*B71*B72  the currency is MXN
            uva_cost_financing_cost = (
                daily_rate_mxn
                * calculator_input.uva_cost
                * calculator_input.uva_days_t_0
            )

            # B74 = IF(C74="Si",IF(C73="MXN",B71*$S$3,IF(C73="USD",B71*$S$2,0)),0)
            uva_cost_iva = 0  # TODO: Implement conditional logic based on currency

            # B75 = B72
            uva_cost_days_t_0_iva = calculator_input.uva_days_t_0

            # B76 =VLOOKUP(C71,$H$1:$J$3,3)*B74*B75 the currency is MXN
            uva_cost_financing_cost_iva = (
                daily_rate_mxn * uva_cost_iva * uva_cost_days_t_0_iva
            )

            result.append(
                {
                    "price_with_margin": price_with_margin,
                    "financing_cost": financing_cost,
                    "iva": iva,
                    "days_t_0_iva": days_t_0_iva,
                    "financing_cost_iva": financing_cost_iva,
                    "international_freight_financing_cost": international_freight_financing_cost,
                    "international_freight_iva": international_freight_iva,
                    "international_freight_days_t_0_iva": international_freight_days_t_0_iva,
                    "international_freight_financing_cost_iva": international_freight_financing_cost_iva,
                    "international_insurance_cost": international_insurance_cost,
                    "international_insurance_iva": international_insurance_iva,
                    "international_insurance_financing_cost_iva": international_insurance_financing_cost_iva,
                    "international_insurance_financing_cost": international_insurance_financing_cost,
                    "international_insurance_days_t_0_iva": international_insurance_days_t_0_iva,
                    "dta_amount": dta_amount,
                    "dta_amount_financing_cost": dta_amount_financing_cost,
                    "dta_amount_iva": dta_amount_iva,
                    "dta_amount_days_t_0_iva": dta_amount_days_t_0_iva,
                    "dta_amount_financing_cost_iva": dta_amount_financing_cost_iva,
                    "customs_expenses": customs_expenses,
                    "customs_expenses_financing_cost": customs_expenses_financing_cost,
                    "customs_expenses_iva": customs_expenses_iva,
                    "customs_expenses_days_t_0_iva": customs_expenses_days_t_0_iva,
                    "customs_expenses_financing_cost_iva": customs_expenses_financing_cost_iva,
                    "domestic_freight_financing_cost": domestic_freight_financing_cost,
                    "domestic_freight_iva": domestic_freight_iva,
                    "domestic_freight_days_t_0_iva": domestic_freight_days_t_0_iva,
                    "domestic_freight_financing_cost_iva": domestic_freight_financing_cost_iva,
                    "domestic_insurance_percentage": domestic_insurance_percentage,
                    "domestic_insurance_financing_cost": domestic_insurance_financing_cost,
                    "domestic_insurance_iva": domestic_insurance_iva,
                    "domestic_insurance_days_t_0_iva": domestic_insurance_days_t_0_iva,
                    "domestic_insurance_financing_cost_iva": domestic_insurance_financing_cost_iva,
                    "labeling_cost_financing_cost": labeling_cost_financing_cost,
                    "labeling_cost_iva": labeling_cost_iva,
                    "labeling_cost_days_t_0_iva": labeling_cost_days_t_0_iva,
                    "labeling_cost_financing_cost_iva": labeling_cost_financing_cost_iva,
                    "uva_cost_financing_cost": uva_cost_financing_cost,
                    "uva_cost_iva": uva_cost_iva,
                    "uva_cost_days_t_0_iva": uva_cost_days_t_0_iva,
                    "uva_cost_financing_cost_iva": uva_cost_financing_cost_iva,
                }
            )

        # Calculate aggregations after loop (these are summary calculations across all items)
        # Get the USD to MXN rate from the first calculator input (assuming same rate for all)
        usd_to_mex_rate = (
            request.calculator_input_list[0].usd_to_mex_rate
            if request.calculator_input_list
            else 1.0
        )

        # B78 = =SUMPRODUCT(((C19:C74="MXN")+((C19:C74="Si")*(OFFSET(C19:C74,-1,0)="MXN")))*(A19:A74<>"Costo Financiamiento")*(A19:A74<>"Precio con Margen")*B19:B74)
        # Assuming all prices are in USD, convert to MXN
        investment_in_mxn = sum(
            calculator_input.price * usd_to_mex_rate
            for calculator_input in request.calculator_input_list
        )

        # B79 = =SUMPRODUCT(((C19:C74="USD")+((C19:C74="Si")*(OFFSET(C19:C74,-1,0)="USD")))*(A19:A74<>"Costo Financiamiento")*(A19:A74<>"Precio con Margen")*B19:B74)
        # Assuming all prices are in USD
        investment_in_usd = sum(
            calculator_input.price for calculator_input in request.calculator_input_list
        )

        # B80  =B78+(B79*C2)-----> need to look for the value of C2
        total_investment_in_mxn = investment_in_mxn + (
            investment_in_usd * usd_to_mex_rate
        )

        # B81 = =B79+(1+B78/C2)
        total_investment_in_usd = investment_in_usd + (
            1 + investment_in_mxn / usd_to_mex_rate
        )

        # B82 = =SUMIF(C21:C76,"MXN",B21:B76)
        # Assuming all prices are in USD, convert to MXN
        cost_mxn = sum(
            calculator_input.price * usd_to_mex_rate
            for calculator_input in request.calculator_input_list
        )

        # B83 = =SUMIF(C21:C76,"USD",B21:B76)
        # Assuming all prices are in USD
        cost_usd = sum(
            calculator_input.price for calculator_input in request.calculator_input_list
        )

        # B84 = =B82+(B83*C2)
        landed_cost_mxn = cost_mxn + (cost_usd * usd_to_mex_rate)

        # B85 = =B83+(1+B82/C2)
        landed_cost_usd = cost_usd + (1 + cost_mxn / usd_to_mex_rate)

        # B86 = SUMPRODUCT(((C19:C74="MXN")+((C19:C74="Si")*(OFFSET(C19:C74,-1,0)="MXN")))*(A19:A74<>"Precio")*B19:B74)
        # Assuming all prices are in USD, convert to MXN
        cash_inflow_to_be_received_in_mxn = sum(
            calculator_input.price * usd_to_mex_rate
            for calculator_input in request.calculator_input_list
        )

        # B87 ==SUMPRODUCT(((C19:C74="USD")+((C19:C74="Si")*(OFFSET(C19:C74,-1,0)="USD")))*(A19:A74<>"Precio")*B19:B74)
        # Assuming all prices are in USD
        cash_inflow_to_be_received_in_usd = sum(
            calculator_input.price for calculator_input in request.calculator_input_list
        )

        # Add summary data to the response
        summary = {
            "investment_in_mxn": investment_in_mxn,
            "investment_in_usd": investment_in_usd,
            "total_investment_in_mxn": total_investment_in_mxn,
            "total_investment_in_usd": total_investment_in_usd,
            "cost_mxn": cost_mxn,
            "cost_usd": cost_usd,
            "landed_cost_mxn": landed_cost_mxn,
            "landed_cost_usd": landed_cost_usd,
            "cash_inflow_to_be_received_in_mxn": cash_inflow_to_be_received_in_mxn,
            "cash_inflow_to_be_received_in_usd": cash_inflow_to_be_received_in_usd,
        }

        return {"items": result, "summary": summary}

    def evaluate_import_calculator(
        self, request: ImportCalculatorRequest
    ) -> ImportCalculatorResponse:
        """Evaluate pricing"""
        result_data = self.populate_inputs(request)
        return ImportCalculatorResponse(
            message="Import calculator evaluated successfully", data=[result_data]
        )
