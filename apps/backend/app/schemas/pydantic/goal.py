from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.goal import GoalStatus, GoalCategory


class GoalCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: GoalCategory
    target_date: Optional[date] = None
    is_recurring: bool = False


class GoalUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[GoalCategory] = None
    status: Optional[GoalStatus] = None
    progress_percentage: Optional[float] = Field(None, ge=0, le=100)
    target_date: Optional[date] = None
    is_recurring: Optional[bool] = None


class GoalResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: Optional[str]
    category: GoalCategory
    status: GoalStatus
    progress_percentage: float
    target_date: Optional[date]
    is_recurring: bool
    detected_from_journal: bool
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class GoalList(BaseModel):
    goals: List[GoalResponse]
    total: int