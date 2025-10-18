from fastapi import APIRouter

from app.api.v1.routes import auth, import_calculator, pricing, product_sourcing

api_router = APIRouter()
api_router.include_router(pricing.router, prefix="/pricing", tags=["Pricing"])
api_router.include_router(
    import_calculator.router, prefix="/import-calculator", tags=["Import Calculator"]
)
api_router.include_router(
    product_sourcing.router, prefix="/product-sourcing", tags=["Product Sourcing"]
)
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
