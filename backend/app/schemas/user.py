from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional
from app.schemas.role import Role

class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=1)

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, min_length=1)
    password: Optional[str] = Field(None, min_length=6)

class UserResponse(UserBase):
    id: int
    role_id: int
    is_active: bool
    profile_image: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    role: Optional[Role] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[str] = None
