from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, DateTime, Boolean, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base


class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_voice_transcribed: Mapped[bool] = mapped_column(Boolean, default=False)
    word_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="journal_entries")
    insights: Mapped[list["Insight"]] = relationship("Insight", back_populates="journal_entry", cascade="all, delete-orphan")
    mood_entries: Mapped[list["MoodEntry"]] = relationship("MoodEntry", back_populates="journal_entry", cascade="all, delete-orphan")