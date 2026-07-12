from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional
from decimal import Decimal
from app.schemas.product import Product

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    price_at_purchase: Decimal
    product: Optional[Product] = None

    class Config:
        from_attributes = True

class PaymentResponse(BaseModel):
    id: int
    amount: Decimal
    payment_method: str
    transaction_id: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    shipping_address: str = Field(..., min_length=5)
    billing_address: str = Field(..., min_length=5)
    payment_method: str = Field("credit_card", description="credit_card, paypal, simulation")

class OrderStatusUpdate(BaseModel):
    status: str = Field(..., description="pending, paid, shipped, delivered, cancelled")

class OrderResponse(BaseModel):
    id: int
    user_id: int
    customer_name: Optional[str] = None
    status: str
    total_amount: Decimal
    shipping_address: str
    billing_address: str
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse] = []
    payments: List[PaymentResponse] = []

    class Config:
        from_attributes = True
        populate_by_name = True
