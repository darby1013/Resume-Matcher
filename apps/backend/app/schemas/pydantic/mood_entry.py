from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.mood_entry import MoodType


class MoodEntryCreate(BaseModel):
    mood: MoodType
    intensity: float = Field(..., ge=1, le=10)
    energy_level: Optional[float] = Field(None, ge=1, le=10)
    stress_level: Optional[float] = Field(None, ge=1, le=10)
    notes: Optional[str] = None
    detected_automatically: bool = False


class MoodEntryResponse(BaseModel):
    id: int
    journal_entry_id: int
    user_id: int
    mood: MoodType
    intensity: float
    energy_level: Optional[float]
    stress_level: Optional[float]
    notes: Optional[str]
    detected_automatically: bool
    created_at: datetime

    class Config:
        from_attributes = True


class MoodEntryList(BaseModel):
    mood_entries: List[MoodEntryResponse]
    total: int