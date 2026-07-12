from pydantic import BaseModel, Field
from datetime import datetime

class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1)
    description: str | None = None

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
