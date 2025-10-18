import logging

from fastapi import APIRouter, Depends, HTTPException

from app.core.dependencies import get_product_sourcing_service
from app.schemas.product_sourcing import (
    ProductSourcingRequest,
    ProductSourcingResponse,
)
from app.services.product_sourcing_service import ProductSourcingService

router = APIRouter()

logger = logging.getLogger(__name__)


@router.post("/")
async def evaluate_product_sourcing(
    request: ProductSourcingRequest,
    product_sourcing_service: ProductSourcingService = Depends(
        get_product_sourcing_service
    ),
) -> ProductSourcingResponse:
    """Evaluate product sourcing endpoint"""
    try:

        # Restrict quantity for computational cost
        for sku_object in request.sku_object_list:
            if sku_object.quantity > 50:
                raise HTTPException(
                    status_code=400,
                    detail="Make sure products quantity are less than or equal to 50",
                )

        distribution_center_uuid = request.distribution_center_uuid
        updated_products = product_sourcing_service.update_products_with_suppliers(
            request
        )

        allocations_per_product = product_sourcing_service.process_supplier_allocations(
            updated_products
        )

        routes_with_quotes_mapper = (
            product_sourcing_service.update_supplier_allocations_with_route_quotes(
                allocations_per_product,
                distribution_center_uuid,
            )
        )
        allocations_per_product_with_routes_allocations = (
            product_sourcing_service.process_route_allocations(
                allocations_per_product,
                distribution_center_uuid,
                routes_with_quotes_mapper,
            )
        )
        results = product_sourcing_service.aggregating_and_sorting_allocations(
            allocations_per_product_with_routes_allocations
        )

        return {
            "result": results,
            "message": "Product sourcing evaluated successfully",
        }
    except Exception as e:
        logger.error(f"Error evaluating product sourcing: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e
