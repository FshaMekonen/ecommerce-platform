from pydantic import BaseModel, Field, condecimal
from datetime import datetime
from typing import List, Optional
from decimal import Decimal
from app.schemas.category import Category

class ProductImageBase(BaseModel):
    image_url: str
    is_primary: bool = False

class ProductImageCreate(ProductImageBase):
    pass

class ProductImage(ProductImageBase):
    id: int
    product_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class InventoryBase(BaseModel):
    stock_quantity: int = Field(..., ge=0)
    reorder_level: int = Field(10, ge=0)

class InventoryUpdate(BaseModel):
    stock_quantity: Optional[int] = Field(None, ge=0)
    reorder_level: Optional[int] = Field(None, ge=0)

class Inventory(InventoryBase):
    id: int
    product_id: int
    updated_at: datetime

    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    price: Decimal = Field(..., gt=0)
    category_id: int
    is_available: bool = True

class ProductCreate(ProductBase):
    stock_quantity: int = Field(0, ge=0)
    reorder_level: int = Field(10, ge=0)

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    description: Optional[str] = None
    price: Optional[Decimal] = Field(None, gt=0)
    category_id: Optional[int] = None
    is_available: Optional[bool] = None
    stock_quantity: Optional[int] = Field(None, ge=0)
    reorder_level: Optional[int] = Field(None, ge=0)

class Product(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime
    category: Category
    images: List[ProductImage] = []
    inventory: Optional[Inventory] = None
    rating_avg: Optional[float] = None
    rating_count: Optional[int] = 0

    class Config:
        from_attributes = True
