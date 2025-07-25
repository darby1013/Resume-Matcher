from datetime import datetime, date
from typing import Optional
from sqlalchemy import String, Text, DateTime, Date, Float, Integer, ForeignKey, Enum, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from .base import Base


class GoalStatus(enum.Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    PAUSED = "paused"
    ABANDONED = "abandoned"


class GoalCategory(enum.Enum):
    HEALTH = "health"
    CAREER = "career"
    RELATIONSHIPS = "relationships"
    PERSONAL_DEVELOPMENT = "personal_development"
    FINANCE = "finance"
    EDUCATION = "education"
    HOBBY = "hobby"
    TRAVEL = "travel"
    OTHER = "other"


class Goal(Base):
    __tablename__ = "goals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[GoalCategory] = mapped_column(Enum(GoalCategory), nullable=False)
    status: Mapped[GoalStatus] = mapped_column(Enum(GoalStatus), default=GoalStatus.NOT_STARTED)
    progress_percentage: Mapped[float] = mapped_column(Float, default=0.0)
    target_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False)
    detected_from_journal: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="goals")