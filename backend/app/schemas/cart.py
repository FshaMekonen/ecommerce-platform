from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional
from app.schemas.product import Product

class CartItemBase(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)

class CartItemCreate(CartItemBase):
    pass

class CartItemUpdate(BaseModel):
    quantity: int = Field(..., gt=0)

class CartItemResponse(BaseModel):
    id: int
    cart_id: int
    product_id: int
    quantity: int
    created_at: datetime
    product: Product

    class Config:
        from_attributes = True

class ShoppingCartResponse(BaseModel):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    items: List[CartItemResponse] = []
    total_price: float = 0.0

    class Config:
        from_attributes = True
