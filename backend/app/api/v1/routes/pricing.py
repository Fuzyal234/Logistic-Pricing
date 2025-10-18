import logging

from fastapi import APIRouter, Depends, HTTPException

from app.core.dependencies import get_pricing_service
from app.schemas.pricing import PricingRequest, PricingResponse
from app.services.pricing_service import PricingService

router = APIRouter()

logger = logging.getLogger(__name__)


@router.post("/")
async def evaluate_pricing(
    request: PricingRequest,
    # current_user: UserResponse = Depends(get_current_user),
    pricing_service: PricingService = Depends(get_pricing_service),
) -> PricingResponse:
    """Evaluate pricing endpoint"""
    try:
        pricing_service.set_general_pricing_rules()
        pricing_service.populate_inputs(request)
        result = pricing_service.evaluate_pricing(request)
        return result
    except Exception as e:
        logger.error(f"Error evaluating pricing: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e
