from pydantic import BaseModel


class CalculatorInput(BaseModel):
    """Import calculator input schema"""

    usd_to_mex_rate: float
    price: float
    margin: float
    days_t_0: float
    international_freight: float
    international_freight_days_t_0: float
    international_insurance_percentage: float
    international_insurance_days_t_0: float
    dta_amount_days_t_0: float
    customs_expenses_days_t_0: float = 0.0
    domestic_freight: float
    domestic_freight_days_t_0: float

    domestic_insurance_cost: float
    domestic_insurance_days_t_0: float

    labeling_cost: float
    labeling_cost_days_t_0: float

    uva_cost: float
    uva_days_t_0: float

    boxes_per_logistics: float


class ImportCalculatorRequest(BaseModel):
    """Import calculator request schema"""

    calculator_input_list: list[CalculatorInput]


class ImportCalculatorResponse(BaseModel):
    """Pricing response schema"""

    message: str
    data: list[dict]
