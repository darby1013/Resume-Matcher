from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    name: str


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True