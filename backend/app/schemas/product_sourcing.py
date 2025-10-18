from pydantic import BaseModel


class SkuObject(BaseModel):
    """Sku object schema"""

    sku_uuid: str
    quantity: int


class ProductSourcingRequest(BaseModel):
    """Product sourcing request schema"""

    sku_object_list: list[SkuObject]
    distribution_center_uuid: str
    hub_location_uuid: str | None = None


class ProductSourcingResponse(BaseModel):
    """Product sourcing response schema"""

    message: str
    result: list[dict]
