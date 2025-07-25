from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, DateTime, Float, Integer, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from .base import Base


class InsightType(enum.Enum):
    MOOD = "mood"
    PRODUCTIVITY = "productivity"
    RELATIONSHIPS = "relationships"
    GOALS = "goals"
    EMOTIONAL_HEALTH = "emotional_health"
    PATTERNS = "patterns"
    RECOMMENDATIONS = "recommendations"


class Insight(Base):
    __tablename__ = "insights"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    journal_entry_id: Mapped[int] = mapped_column(Integer, ForeignKey("journal_entries.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    insight_type: Mapped[InsightType] = mapped_column(Enum(InsightType), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    confidence_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    sentiment_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    journal_entry: Mapped["JournalEntry"] = relationship("JournalEntry", back_populates="insights")
    user: Mapped["User"] = relationship("User", back_populates="insights")