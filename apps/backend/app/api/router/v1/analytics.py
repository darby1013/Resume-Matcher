from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import datetime, timedelta
from typing import Dict, Any

from app.core import get_async_session
from app.models import JournalEntry, MoodEntry, Goal, Insight
from app.services.journal_service import JournalService

router = APIRouter()
journal_service = JournalService()

# For now, we'll use a hardcoded user_id. In a real app, this would come from authentication
DEMO_USER_ID = 1


@router.get("/dashboard")
async def get_dashboard_stats(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    db: AsyncSession = Depends(get_async_session)
):
    """Get dashboard statistics and analytics"""
    try:
        since_date = datetime.utcnow() - timedelta(days=days)
        
        # Get journal entry stats
        journal_stats = await db.execute(
            select(
                func.count(JournalEntry.id),
                func.sum(JournalEntry.word_count),
                func.avg(JournalEntry.word_count)
            ).where(
                and_(
                    JournalEntry.user_id == DEMO_USER_ID,
                    JournalEntry.created_at >= since_date
                )
            )
        )
        entry_count, total_words, avg_words = journal_stats.first()
        
        # Get mood distribution
        mood_stats = await db.execute(
            select(
                MoodEntry.mood,
                func.count(MoodEntry.id),
                func.avg(MoodEntry.intensity)
            ).where(
                and_(
                    MoodEntry.user_id == DEMO_USER_ID,
                    MoodEntry.created_at >= since_date
                )
            ).group_by(MoodEntry.mood)
        )
        mood_distribution = [
            {
                "mood": mood.value,
                "count": count,
                "avg_intensity": float(avg_intensity or 0)
            }
            for mood, count, avg_intensity in mood_stats
        ]
        
        # Get goal progress
        goal_stats = await db.execute(
            select(
                Goal.status,
                func.count(Goal.id)
            ).where(Goal.user_id == DEMO_USER_ID)
            .group_by(Goal.status)
        )
        goal_distribution = [
            {"status": status.value, "count": count}
            for status, count in goal_stats
        ]
        
        # Get insight distribution
        insight_stats = await db.execute(
            select(
                Insight.insight_type,
                func.count(Insight.id)
            ).where(
                and_(
                    Insight.user_id == DEMO_USER_ID,
                    Insight.created_at >= since_date
                )
            ).group_by(Insight.insight_type)
        )
        insight_distribution = [
            {"type": insight_type.value, "count": count}
            for insight_type, count in insight_stats
        ]
        
        # Get recent activity (entries per day)
        daily_entries = await db.execute(
            select(
                func.date(JournalEntry.created_at),
                func.count(JournalEntry.id),
                func.sum(JournalEntry.word_count)
            ).where(
                and_(
                    JournalEntry.user_id == DEMO_USER_ID,
                    JournalEntry.created_at >= since_date
                )
            ).group_by(func.date(JournalEntry.created_at))
            .order_by(func.date(JournalEntry.created_at))
        )
        
        activity_timeline = [
            {
                "date": date.isoformat(),
                "entries": count,
                "words": words or 0
            }
            for date, count, words in daily_entries
        ]
        
        return {
            "period_days": days,
            "journal_stats": {
                "total_entries": entry_count or 0,
                "total_words": total_words or 0,
                "avg_words_per_entry": float(avg_words or 0)
            },
            "mood_distribution": mood_distribution,
            "goal_distribution": goal_distribution,
            "insight_distribution": insight_distribution,
            "activity_timeline": activity_timeline
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/productivity")
async def get_productivity_insights(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    db: AsyncSession = Depends(get_async_session)
):
    """Get productivity-focused insights"""
    try:
        # Get writing consistency
        since_date = datetime.utcnow() - timedelta(days=days)
        
        daily_word_counts = await db.execute(
            select(
                func.date(JournalEntry.created_at),
                func.sum(JournalEntry.word_count)
            ).where(
                and_(
                    JournalEntry.user_id == DEMO_USER_ID,
                    JournalEntry.created_at >= since_date
                )
            ).group_by(func.date(JournalEntry.created_at))
        )
        
        word_count_by_day = {
            date.isoformat(): words or 0
            for date, words in daily_word_counts
        }
        
        # Calculate streaks
        dates_with_entries = set(word_count_by_day.keys())
        current_streak = 0
        max_streak = 0
        temp_streak = 0
        
        # Simple streak calculation (can be improved)
        for i in range(days):
            check_date = (datetime.utcnow() - timedelta(days=i)).date()
            if check_date.isoformat() in dates_with_entries:
                temp_streak += 1
                if i == 0:  # Current day or most recent
                    current_streak = temp_streak
            else:
                max_streak = max(max_streak, temp_streak)
                temp_streak = 0
        
        max_streak = max(max_streak, temp_streak)
        
        # Get productivity-related insights
        productivity_insights = await db.execute(
            select(Insight).where(
                and_(
                    Insight.user_id == DEMO_USER_ID,
                    Insight.insight_type == 'productivity',
                    Insight.created_at >= since_date
                )
            ).order_by(Insight.created_at.desc()).limit(5)
        )
        
        recent_productivity_insights = [
            {
                "title": insight.title,
                "content": insight.content,
                "confidence_score": insight.confidence_score,
                "created_at": insight.created_at
            }
            for insight in productivity_insights.scalars()
        ]
        
        return {
            "writing_consistency": {
                "current_streak": current_streak,
                "max_streak": max_streak,
                "days_with_entries": len(dates_with_entries),
                "consistency_percentage": (len(dates_with_entries) / days) * 100
            },
            "word_count_trends": word_count_by_day,
            "recent_insights": recent_productivity_insights
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/emotional-health")
async def get_emotional_health_insights(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    db: AsyncSession = Depends(get_async_session)
):
    """Get emotional health and mood analysis"""
    try:
        mood_trends = await journal_service.get_mood_trends(
            db=db,
            user_id=DEMO_USER_ID,
            days=days
        )
        
        # Calculate mood statistics
        if mood_trends:
            intensities = [trend["intensity"] for trend in mood_trends]
            avg_mood_intensity = sum(intensities) / len(intensities)
            
            positive_moods = ["very_happy", "happy", "excited", "grateful", "calm"]
            positive_entries = [
                trend for trend in mood_trends 
                if trend["mood"] in positive_moods
            ]
            positivity_ratio = len(positive_entries) / len(mood_trends) * 100
        else:
            avg_mood_intensity = 0
            positivity_ratio = 0
        
        # Get emotional health insights
        since_date = datetime.utcnow() - timedelta(days=days)
        emotional_insights = await db.execute(
            select(Insight).where(
                and_(
                    Insight.user_id == DEMO_USER_ID,
                    Insight.insight_type.in_(['mood', 'emotional_health']),
                    Insight.created_at >= since_date
                )
            ).order_by(Insight.created_at.desc()).limit(5)
        )
        
        recent_emotional_insights = [
            {
                "title": insight.title,
                "content": insight.content,
                "confidence_score": insight.confidence_score,
                "created_at": insight.created_at
            }
            for insight in emotional_insights.scalars()
        ]
        
        return {
            "mood_summary": {
                "avg_intensity": avg_mood_intensity,
                "positivity_ratio": positivity_ratio,
                "total_mood_entries": len(mood_trends)
            },
            "mood_trends": mood_trends,
            "recent_insights": recent_emotional_insights
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))