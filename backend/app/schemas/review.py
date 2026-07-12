from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class ReviewerInfo(BaseModel):
    id: int
    full_name: str
    profile_image: Optional[str] = None

    class Config:
        from_attributes = True

class ReviewBase(BaseModel):
    product_id: int
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class ReviewCreate(ReviewBase):
    pass

class ReviewResponse(ReviewBase):
    id: int
    user_id: int
    created_at: datetime
    user: Optional[ReviewerInfo] = None

    class Config:
        from_attributes = True
