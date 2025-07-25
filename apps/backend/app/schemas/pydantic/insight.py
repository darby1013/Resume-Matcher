from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.insight import InsightType


class InsightResponse(BaseModel):
    id: int
    journal_entry_id: int
    user_id: int
    insight_type: InsightType
    title: str
    content: str
    confidence_score: Optional[float]
    sentiment_score: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True


class InsightList(BaseModel):
    insights: List[InsightResponse]
    total: int