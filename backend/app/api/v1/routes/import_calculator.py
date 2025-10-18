import logging

from fastapi import APIRouter, Depends, HTTPException

from app.core.dependencies import get_import_calculator_service
from app.schemas.import_calculator import (
    ImportCalculatorRequest,
    ImportCalculatorResponse,
)
from app.services.import_calculator_service import ImportCalculatorService

router = APIRouter()

logger = logging.getLogger(__name__)


@router.post("/")
async def evaluate_import_calculator(
    request: ImportCalculatorRequest,
    # current_user: UserResponse = Depends(get_current_user),
    import_calculator_service: ImportCalculatorService = Depends(
        get_import_calculator_service
    ),
) -> ImportCalculatorResponse:
    """Evaluate import calculator endpoint"""
    try:
        result = import_calculator_service.evaluate_import_calculator(request)
        return result
    except Exception as e:
        logger.error(f"Error evaluating import calculator: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e
