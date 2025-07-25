from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class JournalEntryCreate(BaseModel):
    title: Optional[str] = None
    content: str = Field(..., min_length=1)
    is_voice_transcribed: bool = False


class JournalEntryUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None


class JournalEntryResponse(BaseModel):
    id: int
    user_id: int
    title: Optional[str]
    content: str
    is_voice_transcribed: bool
    word_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class JournalEntryList(BaseModel):
    entries: List[JournalEntryResponse]
    total: int
    page: int
    per_page: int