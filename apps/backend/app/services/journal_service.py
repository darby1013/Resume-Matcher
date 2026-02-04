import logging
from datetime import datetime, timedelta
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, and_
from sqlalchemy.orm import selectinload

from app.models import JournalEntry, User, Insight, MoodEntry, Goal
from app.models.insight import InsightType
from app.models.mood_entry import MoodType
from app.models.goal import GoalCategory, GoalStatus
from app.schemas.pydantic import (
    JournalEntryCreate,
    JournalEntryUpdate,
    JournalEntryResponse,
    JournalEntryList
)
from .ai_analysis_service import AIAnalysisService

logger = logging.getLogger(__name__)


class JournalService:
    def __init__(self):
        self.ai_service = AIAnalysisService()

    async def create_journal_entry(
        self, 
        db: AsyncSession, 
        user_id: int, 
        journal_data: JournalEntryCreate
    ) -> Tuple[JournalEntryResponse, Dict[str, Any]]:
        """Create a new journal entry and analyze it"""
        try:
            # Calculate word count
            word_count = len(journal_data.content.split())
            
            # Create journal entry
            db_entry = JournalEntry(
                user_id=user_id,
                title=journal_data.title,
                content=journal_data.content,
                is_voice_transcribed=journal_data.is_voice_transcribed,
                word_count=word_count
            )
            
            db.add(db_entry)
            await db.flush()  # Get the ID
            await db.refresh(db_entry)
            
            # Analyze the entry with AI
            analysis = await self.ai_service.analyze_journal_entry(journal_data.content)
            
            # Save mood analysis if available
            mood_analysis = analysis.get('mood_analysis', {})
            if mood_analysis.get('mood'):
                mood_entry = MoodEntry(
                    journal_entry_id=db_entry.id,
                    user_id=user_id,
                    mood=MoodType(mood_analysis['mood']),
                    intensity=mood_analysis.get('intensity', 5.0),
                    energy_level=mood_analysis.get('energy_level'),
                    stress_level=mood_analysis.get('stress_level'),
                    detected_automatically=mood_analysis.get('detected_automatically', True)
                )
                db.add(mood_entry)
            
            # Save insights
            insights = analysis.get('insights', [])
            for insight_data in insights:
                insight = Insight(
                    journal_entry_id=db_entry.id,
                    user_id=user_id,
                    insight_type=InsightType(insight_data['type']),
                    title=insight_data['title'],
                    content=insight_data['content'],
                    confidence_score=insight_data.get('confidence'),
                    sentiment_score=analysis.get('sentiment_score')
                )
                db.add(insight)
            
            # Save detected goals
            goals = analysis.get('goals', [])
            for goal_data in goals:
                # Check if similar goal already exists
                existing_goal = await db.execute(
                    select(Goal).where(
                        and_(
                            Goal.user_id == user_id,
                            func.lower(Goal.title).contains(goal_data['title'].lower())
                        )
                    )
                )
                if not existing_goal.scalar_one_or_none():
                    goal = Goal(
                        user_id=user_id,
                        title=goal_data['title'],
                        description=goal_data.get('description'),
                        category=GoalCategory(goal_data['category']),
                        detected_from_journal=True
                    )
                    db.add(goal)
            
            await db.commit()
            await db.refresh(db_entry)
            
            return JournalEntryResponse.model_validate(db_entry), analysis
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Error creating journal entry: {str(e)}")
            raise

    async def get_journal_entries(
        self,
        db: AsyncSession,
        user_id: int,
        page: int = 1,
        per_page: int = 20,
        search: Optional[str] = None
    ) -> JournalEntryList:
        """Get paginated journal entries for a user"""
        try:
            offset = (page - 1) * per_page
            
            query = select(JournalEntry).where(JournalEntry.user_id == user_id)
            
            if search:
                search_term = f"%{search}%"
                query = query.where(
                    JournalEntry.content.ilike(search_term) |
                    JournalEntry.title.ilike(search_term)
                )
            
            # Get total count
            count_query = select(func.count(JournalEntry.id)).where(JournalEntry.user_id == user_id)
            if search:
                search_term = f"%{search}%"
                count_query = count_query.where(
                    JournalEntry.content.ilike(search_term) |
                    JournalEntry.title.ilike(search_term)
                )
            
            total_result = await db.execute(count_query)
            total = total_result.scalar()
            
            # Get entries
            query = query.order_by(desc(JournalEntry.created_at)).offset(offset).limit(per_page)
            result = await db.execute(query)
            entries = result.scalars().all()
            
            return JournalEntryList(
                entries=[JournalEntryResponse.model_validate(entry) for entry in entries],
                total=total,
                page=page,
                per_page=per_page
            )
            
        except Exception as e:
            logger.error(f"Error getting journal entries: {str(e)}")
            raise

    async def get_journal_entry(
        self,
        db: AsyncSession,
        user_id: int,
        entry_id: int
    ) -> Optional[JournalEntryResponse]:
        """Get a specific journal entry"""
        try:
            result = await db.execute(
                select(JournalEntry).where(
                    and_(
                        JournalEntry.id == entry_id,
                        JournalEntry.user_id == user_id
                    )
                )
            )
            entry = result.scalar_one_or_none()
            
            if entry:
                return JournalEntryResponse.model_validate(entry)
            return None
            
        except Exception as e:
            logger.error(f"Error getting journal entry: {str(e)}")
            raise

    async def update_journal_entry(
        self,
        db: AsyncSession,
        user_id: int,
        entry_id: int,
        update_data: JournalEntryUpdate
    ) -> Optional[JournalEntryResponse]:
        """Update a journal entry"""
        try:
            result = await db.execute(
                select(JournalEntry).where(
                    and_(
                        JournalEntry.id == entry_id,
                        JournalEntry.user_id == user_id
                    )
                )
            )
            entry = result.scalar_one_or_none()
            
            if not entry:
                return None
            
            # Update fields
            if update_data.title is not None:
                entry.title = update_data.title
            if update_data.content is not None:
                entry.content = update_data.content
                entry.word_count = len(update_data.content.split())
                
            entry.updated_at = datetime.utcnow()
            
            await db.commit()
            await db.refresh(entry)
            
            return JournalEntryResponse.model_validate(entry)
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Error updating journal entry: {str(e)}")
            raise

    async def delete_journal_entry(
        self,
        db: AsyncSession,
        user_id: int,
        entry_id: int
    ) -> bool:
        """Delete a journal entry"""
        try:
            result = await db.execute(
                select(JournalEntry).where(
                    and_(
                        JournalEntry.id == entry_id,
                        JournalEntry.user_id == user_id
                    )
                )
            )
            entry = result.scalar_one_or_none()
            
            if not entry:
                return False
            
            await db.delete(entry)
            await db.commit()
            return True
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Error deleting journal entry: {str(e)}")
            raise

    async def get_recent_insights(
        self,
        db: AsyncSession,
        user_id: int,
        days: int = 7,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get recent insights for a user"""
        try:
            since_date = datetime.utcnow() - timedelta(days=days)
            
            result = await db.execute(
                select(Insight)
                .where(
                    and_(
                        Insight.user_id == user_id,
                        Insight.created_at >= since_date
                    )
                )
                .order_by(desc(Insight.created_at))
                .limit(limit)
            )
            
            insights = result.scalars().all()
            return [
                {
                    "id": insight.id,
                    "type": insight.insight_type.value,
                    "title": insight.title,
                    "content": insight.content,
                    "confidence_score": insight.confidence_score,
                    "created_at": insight.created_at
                }
                for insight in insights
            ]
            
        except Exception as e:
            logger.error(f"Error getting recent insights: {str(e)}")
            raise

    async def get_mood_trends(
        self,
        db: AsyncSession,
        user_id: int,
        days: int = 30
    ) -> List[Dict[str, Any]]:
        """Get mood trends for a user"""
        try:
            since_date = datetime.utcnow() - timedelta(days=days)
            
            result = await db.execute(
                select(MoodEntry)
                .where(
                    and_(
                        MoodEntry.user_id == user_id,
                        MoodEntry.created_at >= since_date
                    )
                )
                .order_by(MoodEntry.created_at)
            )
            
            mood_entries = result.scalars().all()
            return [
                {
                    "date": mood_entry.created_at.date().isoformat(),
                    "mood": mood_entry.mood.value,
                    "intensity": mood_entry.intensity,
                    "energy_level": mood_entry.energy_level,
                    "stress_level": mood_entry.stress_level
                }
                for mood_entry in mood_entries
            ]
            
        except Exception as e:
            logger.error(f"Error getting mood trends: {str(e)}")
            raise

    async def generate_weekly_summary(
        self,
        db: AsyncSession,
        user_id: int
    ) -> Dict[str, Any]:
        """Generate a weekly summary for the user"""
        try:
            # Get entries from the past week
            since_date = datetime.utcnow() - timedelta(days=7)
            
            result = await db.execute(
                select(JournalEntry)
                .where(
                    and_(
                        JournalEntry.user_id == user_id,
                        JournalEntry.created_at >= since_date
                    )
                )
                .order_by(JournalEntry.created_at)
            )
            
            entries = result.scalars().all()
            
            if not entries:
                return {
                    "total_entries": 0,
                    "total_words": 0,
                    "insights": [],
                    "mood_summary": {},
                    "goals_progress": []
                }
            
            # Calculate basic stats
            total_entries = len(entries)
            total_words = sum(entry.word_count for entry in entries)
            
            # Get AI insights for the week
            entry_contents = [entry.content for entry in entries]
            weekly_insights = await self.ai_service.generate_weekly_insights(entry_contents)
            
            # Get mood summary
            mood_trends = await self.get_mood_trends(db, user_id, days=7)
            
            return {
                "total_entries": total_entries,
                "total_words": total_words,
                "insights": weekly_insights,
                "mood_trends": mood_trends,
                "period": "past_week"
            }
            
        except Exception as e:
            logger.error(f"Error generating weekly summary: {str(e)}")
            raise