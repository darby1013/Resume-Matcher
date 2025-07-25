from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import get_async_session
from app.services.journal_service import JournalService

router = APIRouter()
journal_service = JournalService()

# For now, we'll use a hardcoded user_id. In a real app, this would come from authentication
DEMO_USER_ID = 1


@router.get("/recent")
async def get_recent_insights(
    days: int = Query(7, ge=1, le=365, description="Number of days to look back"),
    limit: int = Query(10, ge=1, le=50, description="Maximum number of insights"),
    db: AsyncSession = Depends(get_async_session)
):
    """Get recent insights for the user"""
    try:
        insights = await journal_service.get_recent_insights(
            db=db,
            user_id=DEMO_USER_ID,
            days=days,
            limit=limit
        )
        return {
            "insights": insights,
            "total": len(insights),
            "days": days
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/mood-trends")
async def get_mood_trends(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    db: AsyncSession = Depends(get_async_session)
):
    """Get mood trends over time"""
    try:
        trends = await journal_service.get_mood_trends(
            db=db,
            user_id=DEMO_USER_ID,
            days=days
        )
        return {
            "mood_trends": trends,
            "period_days": days,
            "total_entries": len(trends)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))