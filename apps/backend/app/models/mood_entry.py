from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, Float, Integer, ForeignKey, Enum, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from .base import Base


class MoodType(enum.Enum):
    VERY_HAPPY = "very_happy"
    HAPPY = "happy"
    NEUTRAL = "neutral"
    SAD = "sad"
    VERY_SAD = "very_sad"
    ANXIOUS = "anxious"
    STRESSED = "stressed"
    EXCITED = "excited"
    CALM = "calm"
    ANGRY = "angry"
    GRATEFUL = "grateful"
    FRUSTRATED = "frustrated"


class MoodEntry(Base):
    __tablename__ = "mood_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    journal_entry_id: Mapped[int] = mapped_column(Integer, ForeignKey("journal_entries.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    mood: Mapped[MoodType] = mapped_column(Enum(MoodType), nullable=False)
    intensity: Mapped[float] = mapped_column(Float, nullable=False)  # 1-10 scale
    energy_level: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # 1-10 scale
    stress_level: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # 1-10 scale
    notes: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    detected_automatically: Mapped[bool] = mapped_column(Boolean, default=True)  # Whether detected by AI
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    journal_entry: Mapped["JournalEntry"] = relationship("JournalEntry", back_populates="mood_entries")
    user: Mapped["User"] = relationship("User", back_populates="mood_entries")