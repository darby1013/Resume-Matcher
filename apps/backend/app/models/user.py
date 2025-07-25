from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    journal_entries: Mapped[list["JournalEntry"]] = relationship("JournalEntry", back_populates="user", cascade="all, delete-orphan")
    insights: Mapped[list["Insight"]] = relationship("Insight", back_populates="user", cascade="all, delete-orphan")
    mood_entries: Mapped[list["MoodEntry"]] = relationship("MoodEntry", back_populates="user", cascade="all, delete-orphan")
    goals: Mapped[list["Goal"]] = relationship("Goal", back_populates="user", cascade="all, delete-orphan")
